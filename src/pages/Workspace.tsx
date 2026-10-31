/**
 * SCREEN: /framework/:id — the two-pane workspace (fixed to the viewport, each
 * pane scrolls internally; a draggable divider resizes the split; the right
 * pane sits on the lighter card surface). Under 768px one pane shows at a
 * time and the header switch is a two-way Chat / Output toggle.
 *
 * Header: editable title (pencil focuses it) · layout switch · autosave chip
 * (Saving… / Saved / Save failed · Retry). The output pane header has the
 * centred Framework / Teaching plan / Export tabs; Export renders
 * ExportPanel inline (Markdown only, with a preview). Everything autosaves (1 s debounce, flush on
 * unmount); there is no Save button and no Library button.
 *
 * LEFT — the Creative Director chat, one centred column max-width 750px,
 * ChatGPT style: the thread (assistant = plain markdown text, no avatar,
 * no bubble; user = right-aligned muted bubble), a rounded pill composer
 * (auto-growing textarea, round Send button that becomes Stop while
 * streaming), and a quiet meter line "N / 300 messages" + "3 credits per
 * reply". A brand-new project shows a setup card instead of the thread: three
 * selects (Attractive Character, Voice, Customer Avatar) and "Start building
 * your framework", enabled only once all three are picked; there is no setup
 * bar after that. Each reply streams; the
 * trailing <fe-state> JSON patch is stripped from the visible text and merged
 * into project state (src/lib/framework/protocol.ts) so the right pane fills
 * in live. "Generated {Component} for "{Step}"." first lines render as a pill
 * with a green check; a phase: 2 patch inserts a "Framework locked" divider
 * and switches the right pane to the Teaching plan.
 *
 * RIGHT — tabs Framework / Teaching plan / Export and the output
 * (centred, max 750px). "Regenerate everything…" lives in the header "…" menu
 * (with Rename, Duplicate, Archive, Delete): confirm, then re-derive the
 * framework + teaching plan from the transcript. Framework tab: five stage
 * sections (Anchor, Origin Story, Hypothesis, Naming The Steps, Naming The
 * Framework) with status badges, every captured field inline-editable.
 * Teaching plan tab: "Step N" stepper, the step name as heading, a trash icon
 * (remove step), "Generate all four" (auto-fill via the chat), then Story /
 * Strategy / Tactics / Case Study sections with badges and inline editing.
 *
 * The full spec is prd.md at the repo root.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, Check, ChevronRight, Columns2, Download, Loader2, MessageSquare, PanelRight, Pencil, RefreshCw, Zap } from "lucide-react";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
// The shadcn ResizablePanelGroup wrapper does not forward refs; the primitive does.
import { PanelGroup, type ImperativePanelGroupHandle } from "react-resizable-panels";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FrameworkChat, type FrameworkChatHandle } from "@/components/framework/FrameworkChat";
import { FrameworkTab } from "@/components/framework/FrameworkTab";
import { TeachingPlanTab } from "@/components/framework/TeachingPlanTab";
import { StatusDot } from "@/components/framework/StatusPill";
import { getProject, updateProject } from "@/lib/framework/storage";
import { applyFeStatePatches, FE_REGENERATE_CREDITS, isInterviewStarted, normalizeTeaching, phase1Complete, reconcileTeachingSteps, type FeStatePatch } from "@/lib/framework/protocol";
import { fakeAI } from "@/lib/mock/ai";
import { autoFillMessage, replayInterview, rewriteMessage, type RewriteMode } from "@/lib/mock/interview";
import { buildRegenerateSystemPrompt, buildVoiceAndAudienceBlock } from "@/lib/framework/prompts";
import { AVATARS, CHARACTERS, VOICES } from "@/lib/mock/data";
import { ExportPanel } from "@/components/framework/ExportPanel";
import { BrainStatus } from "@/components/BrainStatus";
import { FrameworkMenu } from "@/components/framework/Library";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { onEntityChange } from "@/lib/mock/entities";
import { STAGES, stageIndex } from "@/lib/framework/status";
import { blankTeachingStep, FRAMEWORK_STAGE_KEYS, isProofKey, isProvisionalTitle, type Evidence, type ProofKey, type FrameworkData, type FrameworkProject, type FrameworkProjectState, type FrameworkSetup, type TeachingComponentKey, type TeachingStep } from "@/lib/framework/contract";

type Tab = "framework" | "teaching" | "export";
const TAB_LABEL: Record<Tab, string> = { framework: "Framework", teaching: "Teaching plan", export: "Export" };
type View = "chat" | "split" | "output";
type SaveState = "idle" | "saving" | "saved" | "error";

function tabStatus(state: FrameworkProjectState, tab: Tab): "done" | "active" | "pending" {
  const teachingDone = state.teaching.steps.length > 0 && state.teaching.steps.every((s) => (["story", "strategy", "tactics", "case_study"] as const).every((k) => s.components[k] === "done"));
  if (tab === "export") return teachingDone ? "done" : "pending";
  const done = tab === "framework" ? phase1Complete(state.framework) : teachingDone;
  const active = tab === "framework" ? FRAMEWORK_STAGE_KEYS.some((k) => state.framework.stages[k] === "active") : state.teaching.steps.length > 0;
  return done ? "done" : active ? "active" : "pending";
}

export default function Workspace() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const isMobile = useIsMobile();
  // The dashboard composer hands over `start` (setup already picked) and, for a template, the first answer.
  const handoff = (useLocation().state ?? {}) as { start?: boolean; firstAnswer?: string };
  const [project, setProject] = useState<FrameworkProject | null>(null);
  const [loading, setLoading] = useState(true);
  // The output tab lives in the URL (?tab=) so it is copyable and back/forward works.
  const [search, setSearch] = useSearchParams();
  const urlTab = search.get("tab") as Tab | null;
  const setTab = useCallback((t: Tab, replace = false) => setSearch((s) => { s.set("tab", t); return s; }, { replace }), [setSearch]);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  // chat-only until the first framework stage locks, then the output pane animates open.
  const [view, setView] = useState<View>("chat");
  const viewTouched = useRef(false);
  const panelGroup = useRef<ImperativePanelGroupHandle>(null);
  const lastSplit = useRef<number[]>([50, 50]);
  const [animating, setAnimating] = useState(false);
  const [started, setStarted] = useState(false);
  const [chatStreaming, setChatStreaming] = useState(false);
  const [autoFillStep, setAutoFillStep] = useState<number | null>(null);
  const [regenOpen, setRegenOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const chatRef = useRef<FrameworkChatHandle>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // ─── Load ───
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await getProject(id);
      if (cancelled) return;
      if (p) {
        setProject(p); setStarted(isInterviewStarted(p.state.chat_messages) || !!handoff.start);
        if (p.state.framework.stages.anchor === "done") setView("split");
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  // ─── Autosave (1s debounce, flush on unmount) ───
  const dirty = useRef<Partial<Pick<FrameworkProject, "title" | "setup" | "state" | "source">>>({});
  const timer = useRef<number | null>(null);
  const flushSave = useCallback(async () => {
    if (!Object.keys(dirty.current).length) return;
    const patch = dirty.current; dirty.current = {};
    setSaveState("saving");
    try { await updateProject(id, patch); setSaveState("saved"); } catch { dirty.current = { ...patch, ...dirty.current }; setSaveState("error"); }
  }, [id]);
  const schedule = useCallback(() => { if (timer.current) window.clearTimeout(timer.current); timer.current = window.setTimeout(() => void flushSave(), 1000); }, [flushSave]);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); void flushSave(); }, [flushSave]);

  const patchProject = useCallback((patcher: (p: FrameworkProject) => FrameworkProject) => {
    setProject((p) => {
      if (!p) return p;
      const next = patcher(p);
      for (const k of ["title", "setup", "state", "source"] as const) if (next[k] !== p[k]) (dirty.current as Record<string, unknown>)[k] = next[k];
      return next;
    });
    schedule();
  }, [schedule]);
  const patchState = useCallback((f: (s: FrameworkProjectState) => FrameworkProjectState) => patchProject((p) => ({ ...p, state: f(p.state) })), [patchProject]);
  const patchSetup = (patch: Partial<FrameworkSetup>) => patchProject((p) => ({ ...p, setup: { ...p.setup, ...patch } }));

  // A rename or archive from the sidebar menu: take the new title unless the user is mid-edit here.
  useEffect(() => onEntityChange((n) => {
    if (n !== "framework_project" || "title" in dirty.current) return;
    void getProject(id).then((fresh) => { if (fresh) setProject((cur) => (cur && cur.title !== fresh.title ? { ...cur, title: fresh.title } : cur)); });
  }), [id]);

  // Adopt the Creative Director's framework name as the title once, if the user never typed one.
  useEffect(() => {
    const name = project?.state.framework.framework_name?.trim();
    if (!project || !name || !phase1Complete(project.state.framework) || !isProvisionalTitle(project.title)) return;
    patchProject((p) => ({ ...p, title: name }));
  }, [project, patchProject]);

  const handleStatePatch = useCallback((patches: FeStatePatch[]) => {
    patchState((s) => applyFeStatePatches(s, patches));
    if (patches.some((p) => p.phase === 2)) setTab("teaching", true);
  }, [patchState, setTab]);

  // Open the output pane the first time something lands in the framework.
  const anchorDone = project?.state.framework.stages.anchor === "done";
  useEffect(() => {
    if (anchorDone && view === "chat" && !viewTouched.current) setView("split");
  }, [anchorDone, view]);

  // A phone shows one pane at a time: "split" reads as chat there.
  const effectiveView: View = isMobile && view === "split" ? "chat" : view;

  // Drive the layout from `view`; the CSS transition on flex-grow animates it.
  useEffect(() => {
    if (loading) return;
    setAnimating(true);
    const t = window.setTimeout(() => setAnimating(false), 500);
    // One frame later: the panel group applies its default sizes on mount and
    // would overwrite a layout set in the same commit.
    const raf = requestAnimationFrame(() => panelGroup.current?.setLayout(effectiveView === "chat" ? [100, 0] : effectiveView === "output" ? [0, 100] : lastSplit.current));
    return () => { window.clearTimeout(t); cancelAnimationFrame(raf); };
  }, [effectiveView, loading]);

  const handleFrameworkChange = (patch: Partial<FrameworkData>) => patchState((s) => ({
    ...s,
    framework: { ...s.framework, ...patch },
    teaching: patch.named_steps
      ? normalizeTeaching({ ...s.teaching, steps: reconcileTeachingSteps(s.teaching.steps.map((st, i) => ({ ...st, name: patch.named_steps?.[i]?.to || st.name })), s.teaching.steps.length ? patch.named_steps : null) })
      : s.teaching,
  }));
  const patchStep = (i: number, f: (st: TeachingStep) => TeachingStep) => patchState((s) => ({ ...s, teaching: normalizeTeaching({ ...s.teaching, steps: s.teaching.steps.map((st, j) => (j === i ? f(st) : st)) }) }));
  // An edit is new, unconfirmed text: it drops that component's verification.
  const handleComponentChange = (i: number, k: TeachingComponentKey, v: string) => patchStep(i, (st) => ({ ...st, [k]: v, evidence: st.evidence && isProofKey(k) ? { ...st.evidence, [k]: undefined } : st.evidence }));
  const handleEvidence = (i: number, k: ProofKey, e: Evidence | null) => patchStep(i, (st) => ({ ...st, evidence: { ...st.evidence, [k]: e ?? undefined } }));
  const handleRewrite = (i: number, label: string, mode: RewriteMode) => { setAutoFillStep(i); chatRef.current?.send(rewriteMessage(label, project?.state.teaching.steps[i]?.name || `Step ${i + 1}`, mode)); };
  /** Reorder or add framework steps, keeping raw steps, names and teaching aligned. */
  const handleStepOp = (op: { move: number; dir: -1 | 1 } | { add: true }) => patchState((s) => {
    const f = s.framework;
    if ("add" in op) {
      const n = (f.named_steps?.length || f.raw_steps?.length || 0) + 1;
      const name = `New step ${n}`;
      return { ...s, framework: { ...f, raw_steps: [...(f.raw_steps ?? []), name], named_steps: f.named_steps?.length ? [...f.named_steps, { from: name, to: name }] : f.named_steps }, teaching: s.teaching.steps.length ? normalizeTeaching({ ...s.teaching, steps: [...s.teaching.steps, blankTeachingStep(name)] }) : s.teaching };
    }
    const swap = <T,>(a: T[] | undefined) => { if (!a || !a[op.move + op.dir]) return a; const b = [...a]; [b[op.move], b[op.move + op.dir]] = [b[op.move + op.dir], b[op.move]]; return b; };
    return { ...s, framework: { ...f, raw_steps: swap(f.raw_steps), named_steps: swap(f.named_steps) }, teaching: s.teaching.steps.length ? normalizeTeaching({ ...s.teaching, steps: swap(s.teaching.steps)! }) : s.teaching };
  });
  const handleRemoveStep = (i: number) => patchState((s) => {
    const steps = s.teaching.steps.filter((_, j) => j !== i);
    return { ...s, framework: { ...s.framework, raw_steps: s.framework.raw_steps?.filter((_, j) => j !== i), named_steps: s.framework.named_steps?.filter((_, j) => j !== i) }, teaching: steps.length ? normalizeTeaching({ ...s.teaching, steps }) : { ...s.teaching, current_step: 1, steps: [] } };
  });
  const handleAutoFill = (i: number) => {
    const name = project?.state.teaching.steps[i]?.name || `Step ${i + 1}`;
    setAutoFillStep(i);
    chatRef.current?.send(autoFillMessage(name));
  };
  const handleStreamingChange = useCallback((s: boolean) => { setChatStreaming(s); if (!s) setAutoFillStep(null); }, []);

  /** The voice / audience block for the prompts, resolved from the picked ids. */
  const voiceBlock = project ? buildVoiceAndAudienceBlock({
    character: (() => { const c = CHARACTERS.find((x) => x.id === project.setup.character_id); const v = VOICES.find((x) => x.id === project.setup.voice_id); return c ? { name: c.name, tagline: c.tagline, style_sheet: v?.style_sheet } : null; })(),
    avatar: AVATARS.find((x) => x.id === project.setup.customer_avatar_id) ?? null,
  }) : "";

  /** Edit answer: drop that message and everything after it, rebuild the plan from the answers before it, and put the text back in the composer. */
  const handleEditAnswer = () => {
    const msgs = project?.state.chat_messages ?? [];
    const i = msgs.findIndex((m) => m.id === editId);
    setEditId(null);
    if (i < 0) return;
    const kept = msgs.slice(0, i);
    const rebuilt = replayInterview(kept.filter((m) => m.role === "user").map((m) => m.content));
    patchState((s) => ({ ...s, phase: rebuilt.phase, framework: rebuilt.framework, teaching: rebuilt.teaching, chat_messages: kept }));
    if (rebuilt.phase === 1) setTab("framework", true);
    chatRef.current?.prefill(msgs[i].content);
  };
  const openTab = (t: Tab) => { setTab(t); if (view === "chat") { viewTouched.current = true; setView("split"); } };

  const handleRegenerate = async () => {
    if (!project) return;
    setRegenerating(true);
    const userTurns = project.state.chat_messages.filter((m) => m.role === "user").map((m) => m.content);
    const rebuilt = await fakeAI(() => replayInterview(userTurns), { prompt: buildRegenerateSystemPrompt({ phase: project.state.phase, framework: project.state.framework, teaching: project.state.teaching, voiceBlock }), delayMs: 1800 });
    patchState((s) => ({ ...s, phase: rebuilt.phase, framework: rebuilt.framework, teaching: rebuilt.teaching }));
    setRegenerating(false);
    toast("Framework and teaching plan re-derived from the conversation");
  };

  if (loading) return <div role="status" className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-background text-muted-foreground"><Loader2 className="h-9 w-9 animate-spin text-primary" /><span className="text-base">Loading project…</span></div>;
  if (!project) return (
    <div role="alert" className="m-7 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <h3 className="text-base font-bold">We couldn't open this framework</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">This framework doesn't exist in this workspace. Head back and pick one from the list.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Back to the dashboard</Button>
    </div>
  );

  const { state } = project;
  const tab: Tab = urlTab && urlTab in TAB_LABEL ? urlTab : state.phase === 2 ? "teaching" : "framework";
  const stage = stageIndex(state);
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="shrink-0 bg-background px-3 py-2 sm:px-4 sm:py-2.5">
        <div className="flex items-center gap-2 sm:gap-3">
          <nav aria-label="Breadcrumb" className="flex min-w-0 flex-1 items-center gap-1">
            <Link to="/" className="hidden shrink-0 rounded-md px-1.5 py-1 text-sm text-muted-foreground hover:text-foreground sm:inline">Home</Link>
            <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/60 sm:block" aria-hidden />
            <input ref={titleRef} value={project.title} onChange={(e) => patchProject((p) => ({ ...p, title: e.target.value }))} aria-label="Rename framework" placeholder="Name your framework" size={Math.max(8, Math.min(project.title.length + 1, 40))} className="w-auto min-w-[6ch] max-w-[40ch] truncate rounded-md bg-transparent px-2 py-1 text-[15px] font-bold outline-none transition-colors [field-sizing:content] hover:bg-foreground/5 focus:bg-foreground/[0.07]" />
            <button type="button" className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground" onClick={() => { titleRef.current?.focus(); titleRef.current?.select(); }} aria-label="Rename framework"><Pencil className="h-3.5 w-3.5" /></button>
          </nav>
          {/* Interview stage, derived from the saved state. Guidance, not a lock: every tab stays open. */}
          <ol aria-label={`Stage ${stage + 1} of 5: ${STAGES[stage]}`} className="hidden items-center gap-1 lg:flex">
            {STAGES.map((st, i) => (
              <li key={st} className="flex items-center gap-1" aria-current={i === stage ? "step" : undefined}>
                {i > 0 && <span className={`h-px w-4 ${i <= stage ? "bg-emerald-500/50" : "bg-border"}`} aria-hidden />}
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs ${i === stage ? "bg-primary/15 font-semibold text-foreground ring-1 ring-primary/30" : i < stage ? "text-emerald-400" : "text-muted-foreground"}`}>
                  <StatusDot status={i < stage ? "done" : i === stage ? "active" : "pending"} label={i + 1} />{st}
                </span>
              </li>
            ))}
          </ol>
          <span className="text-xs text-muted-foreground lg:hidden">Stage {stage + 1} of 5 · {STAGES[stage]}</span>
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
            <span role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 text-xs ${saveState === "error" ? "text-destructive" : "text-muted-foreground"}`}>
              {saveState === "saving" ? <><Loader2 className="h-3 w-3 animate-spin" /> <span className="hidden sm:inline">Saving…</span></> : saveState === "error" ? <><AlertTriangle className="h-3 w-3" /> <span className="hidden sm:inline">Save failed ·</span> <button type="button" className="underline" onClick={() => void flushSave()}>Retry</button></> : saveState === "saved" ? <><Check className="h-3 w-3" /> <span className="hidden sm:inline">Saved</span></> : null}
            </span>
            <BrainStatus className="hidden sm:inline-flex" />
            {regenerating && <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" /> Regenerating…</span>}
            <div role="group" aria-label="Layout" className="inline-flex rounded-lg border border-border bg-muted/40 p-0.5">
              {([["chat", MessageSquare, "Chat only"], ["split", Columns2, "Chat and output"], ["output", PanelRight, "Output only"]] as const).filter(([v]) => !(isMobile && v === "split")).map(([v, Icon, label]) => (
                <button key={v} type="button" aria-pressed={effectiveView === v} title={label} aria-label={label} onClick={() => { viewTouched.current = true; setView(v); }} className={`grid h-7 w-8 place-items-center rounded-md transition-colors ${effectiveView === v ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
            <FrameworkMenu p={project} className="h-8 w-8">
              <DropdownMenuItem disabled={regenerating || chatStreaming} onSelect={() => setRegenOpen(true)}><RefreshCw className="h-3.5 w-3.5" /> Regenerate everything…</DropdownMenuItem>
              <DropdownMenuSeparator />
            </FrameworkMenu>
          </div>
        </div>
      </header>

      <PanelGroup ref={panelGroup} direction="horizontal" className="flex h-full w-full min-h-0 flex-1" onLayout={(sizes) => { if (sizes[0] >= 30 && sizes[1] >= 30) lastSplit.current = sizes; }}>
        <ResizablePanel defaultSize={100} minSize={30} collapsible collapsedSize={0} className={animating ? "panel-animate" : undefined}>
        <section aria-label="Creative Director chat" className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-background">
          <div className="flex min-h-0 flex-1 flex-col">
            <FrameworkChat ref={chatRef} state={state} setup={project.setup} onSetupChange={patchSetup} voiceBlock={voiceBlock} firstAnswer={handoff.firstAnswer} started={started} onStart={async () => { await flushSave(); setStarted(true); patchProject((p) => (p.source === "empty" ? { ...p, source: "ai-interview" } : p)); }}
              onMessagesChange={(next) => patchState((s) => ({ ...s, chat_messages: next }))} onStatePatch={handleStatePatch} onStreamingChange={handleStreamingChange}
              onEvidence={(i, k, e) => handleEvidence(i, k, e)} onAddStep={() => handleStepOp({ add: true })} onEditMessage={setEditId} onReview={openTab} />
          </div>
        </section>
        </ResizablePanel>
        <ResizableHandle withHandle className={`relative w-2 bg-transparent after:inset-y-8 after:w-0.5 after:rounded-full after:bg-transparent after:transition-colors hover:after:bg-primary/50 data-[resize-handle-active]:after:bg-primary [&>div]:border-border/80 [&>div]:bg-card ${effectiveView === "split" ? "" : "hidden"}`} />
        <ResizablePanel defaultSize={0} minSize={30} collapsible collapsedSize={0} className={`${animating ? "panel-animate" : ""} ${effectiveView === "output" ? "md:pl-4" : ""}`}>
        <section aria-label="Framework output" className="relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden border-t border-white/[0.09] bg-surface shadow-[inset_1px_1px_0_hsl(0_0%_100%/0.05),-28px_0_56px_-24px_hsl(0_0%_0%/0.9),0_-8px_32px_-20px_hsl(0_0%_0%/0.7)] md:rounded-tl-2xl md:border-l">
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.035] to-transparent" />
          <header className="flex shrink-0 justify-center border-b border-border/60 px-4 py-2.5 sm:px-6 sm:py-3">
            <div role="tablist" className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl border border-border/60 bg-background/40 p-1">
              {(["framework", "teaching", "export"] as const).map((t) => (
                <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => setTab(t)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm transition-colors active:scale-[0.98] ${tab === t ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
                  {t === "export" ? <Download className="h-3.5 w-3.5 text-muted-foreground" /> : <StatusDot status={tabStatus(state, t)} />}{TAB_LABEL[t]}
                </button>
              ))}
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
            <div className="mx-auto w-full max-w-[750px]">
              {tab === "framework" ? <FrameworkTab framework={state.framework} setup={project.setup} onChange={handleFrameworkChange} onStepOp={handleStepOp} onRemoveStep={handleRemoveStep} /> : tab === "teaching" ? (
                <TeachingPlanTab teaching={state.teaching} onAutoFill={handleAutoFill} chatStreaming={chatStreaming} autoFillStep={autoFillStep} onComponentChange={handleComponentChange} onRemoveStep={handleRemoveStep} onEvidence={handleEvidence} onRewrite={handleRewrite} />
              ) : <ExportPanel project={project} />}
            </div>
          </div>
        </section>        </ResizablePanel>
      </PanelGroup>

      <AlertDialog open={!!editId} onOpenChange={(o) => { if (!o) setEditId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit this answer?</AlertDialogTitle>
            <AlertDialogDescription>The conversation goes back to just before this answer and your text returns to the message box. The framework is rebuilt from your answers up to that point, so anything after it, including edits typed on the right, is replaced.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditAnswer}><Pencil className="h-3.5 w-3.5" /> Edit answer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={regenOpen} onOpenChange={setRegenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate the framework?</AlertDialogTitle>
            <AlertDialogDescription>This re-reads the whole conversation and rebuilds the framework and teaching plan from scratch. Any edits you have typed into the fields on the right will be overwritten. Your conversation is kept.</AlertDialogDescription>
          </AlertDialogHeader>
          <p className="inline-flex items-center gap-1.5 text-xs font-bold"><Zap className="h-3.5 w-3.5 text-amber-500" /> Costs {FE_REGENERATE_CREDITS} credits</p>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleRegenerate()}><RefreshCw className="h-3.5 w-3.5" /> Regenerate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
