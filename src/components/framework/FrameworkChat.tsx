import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Check, RefreshCw, Send, Sparkles, Square, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "./Markdown";
import { fakeStream } from "@/lib/mock/ai";
import { creativeDirectorTurn } from "@/lib/mock/interview";
import { buildChatSystemPrompt } from "@/lib/framework/prompts";
import {
  detectGenerationFailure, extractFeStatePatches, stripFeState,
  FE_CHAT_TURN_LIMIT, FE_CREDITS_PER_TURN, FE_LIMIT_WARN_REMAINING, type FeStatePatch,
} from "@/lib/framework/protocol";
import type { ChatMessage, FrameworkProjectState } from "@/lib/framework/types";

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
}
export interface FrameworkChatHandle { send: (text: string) => void }

interface Runtime extends ChatMessage { streaming?: boolean }
const newId = (p: string) => `${p}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
const persisted = (rt: Runtime[]): ChatMessage[] => rt.filter((m) => !m.streaming).map(({ streaming: _s, ...m }) => m);

function splitGenLine(content: string) {
  const [first = "", ...rest] = content.split("\n");
  const head = first.replace(/\*\*/g, "").trim();
  return /^generated\s+.+/i.test(head) ? { gen: head.replace(/[.\s]+$/, ""), rest: rest.join("\n").trim() } : { gen: null, rest: content };
}

function GenCard({ generating, label }: { generating: boolean; label: string }) {
  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-border px-3.5 py-1.5 text-sm">
      {generating ? <Sparkles className="h-3.5 w-3.5 animate-pulse text-primary" /> : <Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} />}
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">{generating ? "working…" : "added to the plan"}</span>
    </div>
  );
}

export const FrameworkChat = forwardRef<FrameworkChatHandle, FrameworkChatProps>(function FrameworkChat(
  { state, onMessagesChange, onStatePatch, onStreamingChange, started, onStart }, ref,
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const atBottom = useRef(true);

  useEffect(() => { onStreamingChange?.(streaming); }, [streaming, onStreamingChange]);
  useEffect(() => { const el = scrollRef.current; if (el && atBottom.current) el.scrollTop = el.scrollHeight; }, [runtime, streaming]);
  const wasStreaming = useRef(false);
  useEffect(() => { if (wasStreaming.current && !streaming) requestAnimationFrame(() => inputRef.current?.focus()); wasStreaming.current = streaming; }, [streaming]);

  const turnsUsed = messages.filter((m) => m.role === "user").length;
  const atLimit = turnsUsed >= FE_CHAT_TURN_LIMIT;
  const remaining = FE_CHAT_TURN_LIMIT - turnsUsed;

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
      const reply = creativeDirectorTurn(stateRef.current, kickoff ? null : text.trim());
      await fakeStream(reply, (soFar) => {
        if (ctrl.aborted) throw new Error("AbortError");
        raw = soFar;
        const visible = stripFeState(soFar);
        setRuntime((prev) => prev.map((m) => (m.id === assistant.id ? { ...m, content: visible } : m)));
      }, { prompt: buildChatSystemPrompt({ phase: stateRef.current.phase, framework: stateRef.current.framework, teaching: stateRef.current.teaching }), delayMs: 400, charsPerTick: 6, tickMs: 14 });
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
    } finally { setStreaming(false); abortRef.current = null; }
  }, [commit, onStart, onStatePatch, streaming]);

  // Kickoff: greet once, only after the user starts a brand-new project.
  useEffect(() => {
    if (greeted.current || !started || messages.length > 0) { if (messages.length) greeted.current = true; return; }
    greeted.current = true; void runTurn("", true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  useImperativeHandle(ref, () => ({ send: (t) => { if (t.trim()) void runTurn(t, false); } }), [runTurn]);

  const submit = (e: React.FormEvent) => { e.preventDefault(); const t = input.trim(); if (!t || streaming || starting || atLimit) return; setInput(""); void runTurn(t, false); };
  const retry = () => { if (streaming) return; setError(null); const t = lastTurn ?? { text: "", kickoff: true }; void runTurn(t.text, t.kickoff, true); };
  const visible = useMemo(() => runtime.filter((m) => m.role !== "system" || m.phase_divider), [runtime]);
  const meterCls = atLimit ? "text-red-600 dark:text-red-300" : remaining <= FE_LIMIT_WARN_REMAINING ? "text-amber-600 dark:text-amber-300" : "text-foreground";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div ref={scrollRef} role="log" aria-live="polite" className="min-h-0 flex-1 overflow-y-auto" onScroll={(e) => { const el = e.currentTarget; atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80; }}>
        <div className="mx-auto flex w-full max-w-[750px] flex-col gap-6 px-5 py-6">
          {visible.length === 0 && !streaming && (started ? (
            <p className="text-[15px] text-muted-foreground">Getting your Creative Director ready…</p>
          ) : (
            <div className="rounded-2xl border border-border p-5">
              <strong className="text-[15px] font-semibold">Set the voice and audience, then start</strong>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">The Creative Director pulls your framework out in the voice of one Attractive Character, for one Customer Avatar. Pick all three above so the interview sounds like you.</p>
              <Button className="mt-4 active:scale-[0.96] transition-transform duration-150" disabled={starting} onClick={() => { if (!streaming && !starting && !atLimit) void runTurn("", true); }}>{starting ? "Starting…" : "Start building your framework"}</Button>
            </div>
          ))}
          {visible.map((m) => {
            if (m.phase_divider) return (
              <div key={m.id} className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /><Check className="h-3.5 w-3.5 text-emerald-500" strokeWidth={3} /><span><strong className="font-semibold text-foreground">Framework locked</strong> · Phase 2, the teaching plan</span><span className="h-px flex-1 bg-border" />
              </div>
            );
            if (m.role === "user") return (
              <div key={m.id} className="flex justify-end">
                <div className="max-w-[85%] space-y-2 rounded-3xl bg-muted px-4 py-2.5 text-[15px] leading-relaxed">{m.content.split("\n\n").map((p, i) => <p key={i} className="whitespace-pre-wrap">{p}</p>)}</div>
              </div>
            );
            const { gen, rest } = splitGenLine(m.content);
            if (m.streaming && (!m.content.trim() || gen)) return <GenCard key={m.id} generating label="Generating…" />;
            return (
              <div key={m.id} className="space-y-3">
                {gen && <GenCard generating={false} label={gen} />}
                {rest && <div className="text-[15px] leading-7 [&_p]:text-[15px] [&_p]:leading-7 [&_ul]:text-[15px] [&_ol]:text-[15px]"><Markdown text={rest} /></div>}
              </div>
            );
          })}
          {error && (
            <div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm">
              <p>{error}</p>
              <Button variant="outline" size="sm" className="mt-2 h-7" onClick={retry} disabled={streaming}><RefreshCw className="h-3 w-3" /> Try again</Button>
            </div>
          )}
        </div>
      </div>

      <div className="shrink-0 px-5 pb-4 pt-2">
        <div className="mx-auto w-full max-w-[750px]">
          {atLimit ? (
            <div role="status" className="rounded-2xl border border-border bg-destructive/5 px-4 py-3">
              <strong className="block text-sm font-semibold">Message limit reached</strong>
              <p className="mt-0.5 text-sm text-muted-foreground">You've used all {FE_CHAT_TURN_LIMIT} messages for this framework. Your framework and teaching plan are saved — start a new project to keep going.</p>
            </div>
          ) : (
            <form onSubmit={submit} className="flex items-end gap-2 rounded-3xl border border-border bg-card px-4 py-2.5 shadow-sm focus-within:border-foreground/30">
              <textarea ref={inputRef} value={input} rows={1} disabled={streaming || starting} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(e); } }}
                placeholder={started ? "Type your answer…" : "Answer here to begin, or tap Start above…"} aria-label="Type a message"
                className="max-h-[220px] min-h-[28px] flex-1 resize-none bg-transparent py-1 text-[15px] leading-7 placeholder:text-muted-foreground focus:outline-none disabled:opacity-60"
                onInput={(e) => { const el = e.currentTarget; el.style.height = "auto"; el.style.height = `${Math.min(el.scrollHeight, 220)}px`; }} />
              {streaming ? (
                <Button type="button" size="icon" className="h-8 w-8 shrink-0 rounded-full active:scale-[0.96]" onClick={() => { if (abortRef.current) abortRef.current.aborted = true; }} aria-label="Stop generating"><Square className="h-3 w-3 fill-current" strokeWidth={0} /></Button>
              ) : (
                <Button type="submit" size="icon" className="h-8 w-8 shrink-0 rounded-full active:scale-[0.96]" disabled={!input.trim()} aria-label="Send message"><Send className="h-3.5 w-3.5" /></Button>
              )}
            </form>
          )}
          <div className="mt-2 flex items-center justify-between px-2 text-[11px] text-muted-foreground">
            <span className={`tabular-nums ${meterCls}`}>{turnsUsed} / {FE_CHAT_TURN_LIMIT} messages</span>
            <span className="inline-flex items-center gap-1"><Zap className="h-2.5 w-2.5 text-amber-500" /> {FE_CREDITS_PER_TURN} credits per reply</span>
          </div>
        </div>
      </div>
    </div>
  );
});
export default FrameworkChat;
