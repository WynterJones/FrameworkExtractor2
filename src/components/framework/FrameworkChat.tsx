import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { ArrowDown, Brain, Check, Pencil, RefreshCw, Send, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "./Markdown";
import { fakeStream } from "@/lib/mock/ai";
import { creativeDirectorTurn, quickReplies, workingLabel } from "@/lib/mock/interview";
import { milestoneSummary, pendingEvidence, stageIndex } from "@/lib/framework/status";
import { EvidenceCard, MilestoneCard, ProposalCard, StepNamesCard } from "./ChatCards";
import { useBrain } from "@/lib/brain";
import { AVATARS } from "@/lib/mock/data";
import { buildChatSystemPrompt } from "@/lib/framework/prompts";
import {
  applyFeStatePatches, detectGenerationFailure, extractFeStatePatches, stripFeState,
  FE_CHAT_TURN_LIMIT, type FeStatePatch,
} from "@/lib/framework/protocol";
import type { ChatMessage, Evidence, FrameworkProjectState, FrameworkSetup, ProofKey } from "@/lib/framework/contract";
import { SetupFields, setupComplete } from "./SetupBar";

/**
 * The Creative Director chat. One continuous thread across both phases.
 * Each turn streams the assistant's raw text; `<fe-state>` is stripped from
 * what the user sees and parsed into patches for the right pane once the
 * stream completes. On OverSkill the `fakeStream(creativeDirectorTurn(...))`
 * call becomes `POST /api/ai/framework-chat` (NDJSON deltas).
 */
export interface FrameworkChatProps {
  state: FrameworkProjectState;
  onMessagesChange: (next: ChatMessage[]) => void;
  onStatePatch: (patches: FeStatePatch[]) => void;
  onStreamingChange?: (streaming: boolean) => void;
  /** False for a brand-new project: the pane renders, the greeting waits for Start. */
  started: boolean;
  onStart?: () => void | Promise<void>;
  /** The voice and audience; all three must be picked before Start is enabled. */
  setup: FrameworkSetup;
  onSetupChange: (p: Partial<FrameworkSetup>) => void;
  /** The prompt's voice / audience block for the picked character and avatar. */
  voiceBlock?: string;
  /** A template's Anchor answer: sent automatically right after the kickoff greeting. */
  firstAnswer?: string;
  /** Evidence check card answer for one story / case study. */
  onEvidence: (step: number, key: ProofKey, e: Evidence) => void;
  /** Step names card: add a raw step. */
  onAddStep: () => void;
  /** Edit answer on a user message: the parent rewinds to just before it. */
  onEditMessage: (id: string) => void;
  /** Milestone card: open an output tab. */
  onReview: (tab: "framework" | "use") => void;
}
export interface FrameworkChatHandle { send: (text: string) => void; prefill: (text: string) => void }

interface Runtime extends ChatMessage { streaming?: boolean }
const newId = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const persisted = (rt: Runtime[]): ChatMessage[] => rt.filter((m) => !m.streaming).map(({ streaming: _s, ...m }) => m);

function splitGenLine(content: string) {
  const [first = "", ...rest] = content.split("\n");
  const head = first.replace(/\*\*/g, "").trim();
  return /^(generated|rewrote)\s+.+/i.test(head) ? { gen: head.replace(/[.\s]+$/, ""), rest: rest.join("\n").trim() } : { gen: null, rest: content };
}

function GenCard({ generating, label, onStop }: { generating: boolean; label: string; onStop?: () => void }) {
  return (
    generating ? (
      <p className="flex items-center gap-3 text-[15px]" role="status">
        <span className="text-shimmer">{label}</span>
        {onStop && <button type="button" onClick={onStop} className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground">Stop</button>}
      </p>
    ) : (
      <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/30 px-3 py-1 text-xs text-muted-foreground">
        <Check className="h-3 w-3 text-emerald-500/80" strokeWidth={2.5} />
        <span>{label}</span>
        <span className="text-muted-foreground/60">· added to the plan</span>
      </div>
    )
  );
}

export const FrameworkChat = forwardRef<FrameworkChatHandle, FrameworkChatProps>(function FrameworkChat(
  { state, onMessagesChange, onStatePatch, onStreamingChange, started, onStart, setup, onSetupChange, voiceBlock, firstAnswer, onEvidence, onAddStep, onEditMessage, onReview }, ref,
) {
  const messages = state.chat_messages;
  const [runtime, setRuntime] = useState<Runtime[]>(messages);
  const sig = useRef(messages.map((m) => m.id).join("|"));
  useEffect(() => {
    const s = messages.map((m) => m.id).join("|");
    if (s !== sig.current) { sig.current = s; setRuntime(messages); }
  }, [messages]);

  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTurn, setLastTurn] = useState<{ text: string; kickoff: boolean } | null>(null);
  const runtimeRef = useRef(runtime); useEffect(() => { runtimeRef.current = runtime; }, [runtime]);
  /** Commit a thread change outside React's render phase (never call the parent from a setState updater). */
  const commit = useCallback((mutate: (prev: Runtime[]) => Runtime[]) => {
    const next = mutate(runtimeRef.current); runtimeRef.current = next; setRuntime(next); onMessagesChange(persisted(next));
  }, [onMessagesChange]);
  const stateRef = useRef(state); useEffect(() => { stateRef.current = state; }, [state]);
  const startedRef = useRef(started); useEffect(() => { startedRef.current = started; }, [started]);
  const abortRef = useRef<{ aborted: boolean } | null>(null);
  const greeted = useRef(messages.length > 0);
  const pendingFirstAnswer = useRef(firstAnswer);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const atBottom = useRef(true);
  const [away, setAway] = useState(false);
  const brain = useBrain();
  const [brainDismissed, setBrainDismissed] = useState(false);
  const [working, setWorking] = useState("Thinking…");

  useEffect(() => { onStreamingChange?.(streaming); }, [streaming, onStreamingChange]);
  // State too: the naming / evidence cards appear on the patch that lands after the stream ends.
  useEffect(() => { const el = scrollRef.current; if (el && atBottom.current) el.scrollTop = el.scrollHeight; }, [runtime, streaming, state]);
  const wasStreaming = useRef(false);
  useEffect(() => { if (wasStreaming.current && !streaming) requestAnimationFrame(() => inputRef.current?.focus()); wasStreaming.current = streaming; }, [streaming]);

  const turnsUsed = messages.filter((m) => m.role === "user").length;
  const atLimit = turnsUsed >= FE_CHAT_TURN_LIMIT;

  const runTurn = useCallback(async (text: string, kickoff: boolean, isRetry = false) => {
    if (streaming || (!kickoff && !text.trim())) return;
    if (!startedRef.current) {
      greeted.current = true; setStarting(true);
      try { await onStart?.(); } finally { setStarting(false); }
    }
    setError(null); setLastTurn({ text, kickoff });
    const base = runtimeRef.current;
    const tail = base[base.length - 1];
    const reuseTail = isRetry && !kickoff && tail?.role === "user" && tail.content === text.trim();
    const userMsg: Runtime | null = kickoff || reuseTail ? null : { id: newId("u"), role: "user", content: text.trim(), created_at: new Date().toISOString() };
    const assistant: Runtime = { id: newId("a"), role: "assistant", content: "", created_at: new Date().toISOString(), streaming: true };
    runtimeRef.current = userMsg ? [...base, userMsg, assistant] : [...base, assistant]; setRuntime(runtimeRef.current);
    atBottom.current = true; setStreaming(true);
    const ctrl = { aborted: false }; abortRef.current = ctrl;
    let raw = "";
    try {
      const startState = stateRef.current;
      setWorking(workingLabel(startState, kickoff ? null : text.trim()));
      const reply = creativeDirectorTurn(startState, kickoff ? null : text.trim());
      await fakeStream(reply, (soFar) => {
        if (ctrl.aborted) throw new Error("AbortError");
        raw = soFar;
        const visible = stripFeState(soFar);
        setRuntime((prev) => prev.map((m) => (m.id === assistant.id ? { ...m, content: visible } : m)));
      }, { prompt: buildChatSystemPrompt({ phase: stateRef.current.phase, framework: stateRef.current.framework, teaching: stateRef.current.teaching, voiceBlock }), delayMs: 400, charsPerTick: 6, tickMs: 14 });
      const patches = extractFeStatePatches(raw);
      const visibleFinal = stripFeState(raw);
      const failure = detectGenerationFailure(raw, visibleFinal, patches);
      if (failure) {
        if (patches.length) onStatePatch(patches);
        commit((prev) => prev.filter((m) => m.id !== assistant.id));
        setError(failure === "truncated" ? "That answer was too long to finish in one pass, so it did not all save. Draft one step (or one component) at a time — the steps you already completed are kept." : 'I could not write that into the plan. Everything already saved on the right is safe — tap Try again, or ask me to "write that step into the plan now".');
        return;
      }
      commit((prev) => {
        let next = prev.map((m) => (m.id === assistant.id ? { ...m, content: visibleFinal, streaming: false } : m));
        // A stage completed on this turn (other than the Phase 2 switch, which has its divider): drop a milestone card before the reply.
        const after = patches.length ? applyFeStatePatches(startState, patches) : startState;
        const done = stageIndex(after) - 1;
        if (done >= stageIndex(startState) && !patches.some((p) => p.phase === 2)) {
          const idx = next.findIndex((m) => m.id === assistant.id);
          const card: Runtime = { id: newId("m"), role: "system", content: milestoneSummary(after, done), created_at: new Date().toISOString(), milestone: done };
          next = [...next.slice(0, idx), card, ...next.slice(idx)];
        }
        if (patches.some((p) => p.phase === 2) && !next.some((m) => m.phase_divider)) {
          const idx = next.findIndex((m) => m.id === assistant.id);
          const divider: Runtime = { id: newId("d"), role: "system", content: "Framework locked", created_at: new Date().toISOString(), phase_divider: true };
          next = [...next.slice(0, idx), divider, ...next.slice(idx)];
        }
        return next;
      });
      if (patches.length) onStatePatch(patches);
    } catch (e) {
      const partial = stripFeState(raw);
      if ((e as Error).message === "AbortError") {
        commit((prev) => prev.map((m) => (m.id === assistant.id ? { ...m, content: partial, streaming: false } : m)).filter((m) => m.id !== assistant.id || partial.trim()));
        return;
      }
      commit((prev) => prev.filter((m) => m.id !== assistant.id));
      setError((e as Error).message || "Something went wrong. Tap Try again.");
    } finally {
      setStreaming(false); abortRef.current = null;
      // A template hands over its Anchor answer: send it as soon as the greeting lands.
      if (kickoff && pendingFirstAnswer.current) { const t = pendingFirstAnswer.current; pendingFirstAnswer.current = undefined; window.setTimeout(() => sendRef.current?.(t), 80); }
    }
  }, [commit, onStart, onStatePatch, streaming, voiceBlock]);
  const sendRef = useRef<(t: string) => void>();
  useEffect(() => { sendRef.current = (t) => void runTurn(t, false); }, [runTurn]);

  // Kickoff: greet once, only after the user starts a brand-new project.
  useEffect(() => {
    if (greeted.current || !started || messages.length > 0) { if (messages.length) greeted.current = true; return; }
    greeted.current = true; void runTurn("", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  useImperativeHandle(ref, () => ({ send: (t) => { if (t.trim()) void runTurn(t, false); }, prefill: (t) => prefill(t) }));

  const submit = (e: React.FormEvent) => { e.preventDefault(); const t = input.trim(); if (!t || streaming || starting || atLimit) return; setInput(""); void runTurn(t, false); };
  const retry = () => { if (streaming) return; setError(null); const t = lastTurn ?? { text: "", kickoff: true }; void runTurn(t.text, t.kickoff, true); };
  const visible = useMemo(() => runtime.filter((m) => m.role !== "system" || m.phase_divider || m.milestone !== undefined), [runtime]);
  const idle = started && !streaming && !error && !atLimit;
  const f = state.framework;
  const evidence = idle && state.phase === 2 ? pendingEvidence(state) : null;
  const stop = () => { if (abortRef.current) abortRef.current.aborted = true; };
  const qr = idle ? quickReplies(state) : null;
  const avatar = AVATARS.find((a) => a.id === setup.customer_avatar_id);
  // One relevant Brain finding at the moment it helps (the anchor question), never a profile dump.
  const brainCard = brain && avatar && !brainDismissed && started && !streaming && state.phase === 1 && !state.framework.anchor && turnsUsed === 0 && visible.length > 0;
  const prefill = (t: string) => { setInput(t); requestAnimationFrame(() => { const el = inputRef.current; if (!el) return; el.focus(); el.setSelectionRange(t.length, t.length); el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 220)}px`; }); };
  const jump = () => { const el = scrollRef.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); };

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="relative min-h-0 flex-1">
      <div ref={scrollRef} role="log" aria-live="polite" className="h-full overflow-y-auto" onScroll={(e) => { const el = e.currentTarget; atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; setAway(!atBottom.current); }}>
        <div className="mx-auto flex w-full max-w-[750px] flex-col gap-7 px-4 py-6 sm:gap-9 sm:px-5 sm:py-8">
          {visible.length === 0 && !streaming && (started ? (
            <p className="text-[15px]"><span className="text-shimmer">Getting your Creative Director ready…</span></p>
          ) : (
            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <h2 className="font-display text-xl font-semibold tracking-tight">First, set the voice and audience</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">The Creative Director pulls your framework out in the voice of one Attractive Character, for one Customer Avatar. Pick all three to begin; the interview will sound like you.</p>
              <div className="mt-5"><SetupFields setup={setup} onChange={onSetupChange} /></div>
              <Button size="lg" className="mt-5 w-full active:scale-[0.98] transition-transform duration-150" disabled={starting || !setupComplete(setup)} onClick={() => { if (!streaming && !starting && !atLimit) void runTurn("", true); }}>{starting ? "Starting…" : "Start building your framework"}</Button>
              {!setupComplete(setup) && <p className="mt-2 text-center text-xs text-muted-foreground">Select all three to continue.</p>}
            </div>
          ))}
          {visible.map((m) => {
            if (m.phase_divider) return (
              <div key={m.id} className="flex items-center gap-3 py-2 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border/60" /><Check className="h-3 w-3 text-emerald-500/80" strokeWidth={2.5} /><span><span className="font-medium text-foreground/80">Framework locked</span> · Phase 2, the teaching plan</span><span className="h-px flex-1 bg-border/60" />
              </div>
            );
            if (m.milestone !== undefined) return <MilestoneCard key={m.id} stage={m.milestone} summary={m.content} onReview={() => onReview(m.milestone! >= 3 ? "use" : "framework")} />;
            if (m.role === "user") return (
              <div key={m.id} className="group flex items-start justify-end gap-2">
                {!streaming && <button type="button" onClick={() => onEditMessage(m.id)} aria-label="Edit this answer" title="Edit this answer" className="mt-2 grid h-7 w-7 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"><Pencil className="h-3.5 w-3.5" /></button>}
                <div className="max-w-[85%] space-y-2 rounded-3xl rounded-br-lg bg-gradient-to-br from-muted to-muted/60 px-4 py-3 text-[15px] leading-relaxed shadow-[inset_0_1px_0_hsl(0_0%_100%/0.05)]">{m.content.split("\n\n").map((p, i) => <p key={i} className="whitespace-pre-wrap">{p}</p>)}</div>
              </div>
            );
            const { gen, rest } = splitGenLine(m.content);
            if (m.streaming && (!m.content.trim() || gen)) return <GenCard key={m.id} generating label={working} onStop={stop} />;
            return (
              <div key={m.id} className="space-y-4">
                {gen && <GenCard generating={false} label={gen} />}
                {rest && <div className="text-[15px] leading-7 [&_p]:text-[15px] [&_p]:leading-7 [&_ul]:text-[15px] [&_ol]:text-[15px]"><Markdown text={rest} /></div>}
              </div>
            );
          })}
          {brainCard && (
            <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary"><Brain className="h-3.5 w-3.5" /> From your Brain <span className="font-normal normal-case tracking-normal text-muted-foreground">· Customer Avatar</span></p>
              <p className="mt-2 text-[15px]"><span className="font-semibold">{avatar.name}</span>, {avatar.tagline.charAt(0).toLowerCase() + avatar.tagline.slice(1)}.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" className="h-8" onClick={() => { prefill(`I help ${avatar.name.charAt(0).toLowerCase() + avatar.name.slice(1)} achieve `); setBrainDismissed(true); }}>Use this</Button>
                <Button size="sm" variant="ghost" className="h-8" onClick={() => setBrainDismissed(true)}>Not relevant</Button>
              </div>
            </div>
          )}
          {idle && state.phase === 1 && f.stages.naming_steps === "active" && (
            <StepNamesCard rawSteps={f.raw_steps ?? []} onSend={(t) => void runTurn(t, false)} onAddStep={onAddStep} disabled={!idle} />
          )}
          {idle && state.phase === 1 && f.stages.naming_framework === "active" && (
            <ProposalCard framework={f} onSend={(t) => void runTurn(t, false)} onRefine={(n) => prefill(n)} disabled={!idle} />
          )}
          {evidence && (
            <EvidenceCard stepName={state.teaching.steps[evidence.step]?.name ?? ""} keyName={evidence.key} text={evidence.text} onAnswer={(e) => onEvidence(evidence.step, evidence.key, e)} />
          )}
          {error && (
            <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
              <p>{error}</p>
              <Button variant="outline" size="sm" className="mt-2 h-7" onClick={retry} disabled={streaming}><RefreshCw className="h-3 w-3" /> Try again</Button>
            </div>
          )}
        </div>
      </div>

      {away && (
        <button type="button" onClick={jump} className="absolute bottom-3 left-1/2 inline-flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium shadow-lg hover:bg-muted"><ArrowDown className="h-3.5 w-3.5" /> Jump to latest</button>
      )}
      </div>

      <div className="shrink-0 px-3 pb-3 pt-2 sm:px-5 sm:pb-4">
        <div className="mx-auto w-full max-w-[750px]">
          {qr && !evidence && (
            <div className="mb-2 flex flex-wrap gap-1.5" aria-label="Suggested answers">
              {qr.options.map((o) => <button key={o.label} type="button" onClick={() => void runTurn(o.send, false)} className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">{o.label}</button>)}
            </div>
          )}
          {atLimit ? (
            <div role="status" className="rounded-2xl border border-border bg-destructive/5 px-4 py-3">
              <strong className="block text-sm font-semibold">Message limit reached</strong>
              <p className="mt-0.5 text-sm text-muted-foreground">You've used all {FE_CHAT_TURN_LIMIT} messages for this framework. Your framework and teaching plan are saved — start a new project to keep going.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex items-end gap-2 rounded-3xl border border-border bg-card px-4 py-2.5 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.05),0_12px_32px_-16px_hsl(0_0%_0%/0.8)] transition-[border-color,box-shadow] focus-within:border-primary/40 focus-within:shadow-[inset_0_1px_0_hsl(0_0%_100%/0.05),0_0_0_3px_hsl(var(--primary)/0.12)]">
              <textarea ref={inputRef} value={input} rows={1} disabled={streaming || starting || (!started && !setupComplete(setup))} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }}
                placeholder={started ? "Type your answer…" : setupComplete(setup) ? "Answer here to begin, or tap Start above…" : "Pick the voice and audience above to begin"} aria-label="Type a message"
                className="max-h-[220px] min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-7 placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
                onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 220)}px`; }} />
              {streaming ? (
                <Button type="button" size="icon" className="h-8 w-8 shrink-0 rounded-full active:scale-[0.96]" onClick={() => { if (abortRef.current) abortRef.current.aborted = true; }} aria-label="Stop generating"><Square className="h-3 w-3 fill-current" strokeWidth={0} /></Button>
              ) : (
                <Button type="submit" size="icon" className="h-8 w-8 shrink-0 rounded-full active:scale-[0.96]" disabled={!input.trim()} aria-label="Send message"><Send className="h-3.5 w-3.5" /></Button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
});
export default FrameworkChat;
