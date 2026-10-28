/**
 * SCREEN: /framework/:id — the two-pane workspace (fixed to the viewport, each
 * pane scrolls internally; a draggable divider resizes the split; the right
 * pane sits on the lighter card surface).
 *
 * Header: editable title (pencil focuses it) · layout switch · autosave chip
 * (Saving… / Saved / Save failed · Retry) · "Download ▾" dropdown (Markdown
 * .md, PowerPoint .pptx). Everything autosaves (1 s debounce, flush on
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
 * RIGHT — underline tabs "Framework" / "Teaching plan" (status dot each), a
 * ghost button that hides the chat, the output (centred, max 750px), and a
 * footer "20 credits" + ghost "Regenerate" (confirm dialog, then re-derive the
 * framework + teaching plan from the transcript). Framework tab: five stage
 * sections (Anchor, Origin Story, Hypothesis, Naming The Steps, Naming The
 * Framework) with status badges, every captured field inline-editable.
 * Teaching plan tab: "Step N" stepper, the step name as heading, a trash icon
 * (remove step), "Generate all four" (auto-fill via the chat), then Story /
 * Strategy / Tactics / Case Study sections with badges and inline editing.
 *
 * The full spec is prd.md at the repo root.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, Check, ChevronDown, Columns2, Download, FileText, Loader2, MessageSquare, PanelRight, Pencil, Presentation, RefreshCw, Zap } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ResizableHandle, ResizablePanel } from "@/components/ui/resizable";
// The shadcn ResizablePanelGroup wrapper does not forward refs; the primitive does.
import { PanelGroup, type ImperativePanelGroupHandle } from "react-resizable-panels";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FrameworkChat, type FrameworkChatHandle } from "@/components/framework/FrameworkChat";
import { FrameworkTab } from "@/components/framework/FrameworkTab";
import { TeachingPlanTab } from "@/components/framework/TeachingPlanTab";
import { buildFrameworkBriefMarkdown, slugify } from "@/lib/framework/brief";
import { getProject, updateProject } from "@/lib/framework/storage";
import { applyFeStatePatches, FE_REGENERATE_CREDITS, isInterviewStarted, normalizeTeaching, phase1Complete, reconcileTeachingSteps, type FeStatePatch } from "@/lib/framework/protocol";
import { fakeAI } from "@/lib/mock/ai";
import { replayInterview } from "@/lib/mock/interview";
import { buildRegenerateSystemPrompt, buildVoiceAndAudienceBlock } from "@/lib/framework/prompts";
import { AVATARS, CHARACTERS, VOICES } from "@/lib/mock/data";
import { DEFAULT_FRAMEWORK_TITLE, FRAMEWORK_STAGE_KEYS, type FrameworkData, type FrameworkProject, type FrameworkProjectState, type FrameworkSetup, type TeachingComponentKey, type TeachingStep } from "@/lib/framework/contract";

type Tab = "framework" | "teaching";
type View = "chat" | "split" | "output";
type SaveState = "idle" | "saving" | "saved" | "error";

function tabDot(state: FrameworkProjectState, tab: Tab) {
  const done = tab === "framework" ? phase1Complete(state.framework) : state.teaching.steps.length > 0 && state.teaching.steps.every((s) => (["story", "strategy", "tactics", "case_study"] as const).every((k) => s.components[k] === "done"));
  const active = tab === "framework" ? FRAMEWORK_STAGE_KEYS.some((k) => state.framework.stages[k] === "active") : state.teaching.steps.length > 0;
  return done ? "bg-emerald-500" : active ? "bg-primary" : "bg-muted-foreground/40";
}

export default function Workspace() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  // The dashboard composer hands over `start` (setup already picked) and, for a template, the first answer.
  const handoff = (useLocation().state ?? {}) as { start?: boolean; firstAnswer?: string };
  const [project, setProject] = useState<FrameworkProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("framework");
  const tabTouched = useRef(false);
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
        if (!tabTouched.current) setTab(p.state.phase === 2 ? "teaching" : "framework");
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

  // Adopt the Creative Director's framework name as the title once, if the user never typed one.
  useEffect(() => {
    const name = project?.state.framework.framework_name?.trim();
    if (!project || !name || !phase1Complete(project.state.framework) || project.title.trim() !== DEFAULT_FRAMEWORK_TITLE) return;
    patchProject((p) => ({ ...p, title: name }));
  }, [project, patchProject]);

  const handleStatePatch = useCallback((patches: FeStatePatch[]) => {
    patchState((s) => applyFeStatePatches(s, patches));
    if (patches.some((p) => p.phase === 2)) { tabTouched.current = true; setTab("teaching"); }
  }, [patchState]);

  // Open the output pane the first time something lands in the framework.
  const anchorDone = project?.state.framework.stages.anchor === "done";
  useEffect(() => {
    if (anchorDone && view === "chat" && !viewTouched.current) setView("split");
  }, [anchorDone, view]);

  // Drive the layout from `view`; the CSS transition on flex-grow animates it.
  useEffect(() => {
    if (loading) return;
    setAnimating(true);
    const t = window.setTimeout(() => setAnimating(false), 500);
    // One frame later: the panel group applies its default sizes on mount and
    // would overwrite a layout set in the same commit.
    const raf = requestAnimationFrame(() => panelGroup.current?.setLayout(view === "chat" ? [100, 0] : view === "output" ? [0, 100] : lastSplit.current));
    return () => { window.clearTimeout(t); cancelAnimationFrame(raf); };
  }, [view, loading]);

  const handleFrameworkChange = (patch: Partial<FrameworkData>) => patchState((s) => ({
    ...s,
    framework: { ...s.framework, ...patch },
    teaching: patch.named_steps
      ? normalizeTeaching({ ...s.teaching, steps: reconcileTeachingSteps(s.teaching.steps.map((st, i) => ({ ...st, name: patch.named_steps?.[i]?.to || st.name })), s.teaching.steps.length ? patch.named_steps : null) })
      : s.teaching,
  }));
  const handleComponentChange = (i: number, k: TeachingComponentKey, v: string) => patchState((s) => ({ ...s, teaching: normalizeTeaching({ ...s.teaching, steps: s.teaching.steps.map((st, j) => (j === i ? ({ ...st, [k]: v } as TeachingStep) : st)) }) }));
  const handleRemoveStep = (i: number) => patchState((s) => {
    const steps = s.teaching.steps.filter((_, j) => j !== i);
    return { ...s, framework: { ...s.framework, raw_steps: s.framework.raw_steps?.filter((_, j) => j !== i), named_steps: s.framework.named_steps?.filter((_, j) => j !== i) }, teaching: steps.length ? normalizeTeaching({ ...s.teaching, steps }) : { ...s.teaching, current_step: 1, steps: [] } };
  });
  const handleAutoFill = (i: number) => {
    const name = project?.state.teaching.steps[i]?.name || `Step ${i + 1}`;
    setAutoFillStep(i);
    chatRef.current?.send(`For the framework step "${name}", draft all four teaching components yourself — Story, Strategy, Tactics, and Case Study. Write each one straight into the teaching plan on the right. Use your best judgement from everything we have covered; I will review and tweak after.`);
  };
  const handleStreamingChange = useCallback((s: boolean) => { setChatStreaming(s); if (!s) setAutoFillStep(null); }, []);

  /** The voice / audience block for the prompts, resolved from the picked ids. */
  const voiceBlock = project ? buildVoiceAndAudienceBlock({
    character: (() => { const c = CHARACTERS.find((x) => x.id === project.setup.character_id); const v = VOICES.find((x) => x.id === project.setup.voice_id); return c ? { name: c.name, tagline: c.tagline, style_sheet: v?.style_sheet } : null; })(),
    avatar: AVATARS.find((x) => x.id === project.setup.customer_avatar_id) ?? null,
  }) : "";

  const handleRegenerate = async () => {
    if (!project) return;
    setRegenerating(true);
    const userTurns = project.state.chat_messages.filter((m) => m.role === "user").map((m) => m.content);
    const rebuilt = await fakeAI(() => replayInterview(userTurns), { prompt: buildRegenerateSystemPrompt({ phase: project.state.phase, framework: project.state.framework, teaching: project.state.teaching, voiceBlock }), delayMs: 1800 });
    patchState((s) => ({ ...s, phase: rebuilt.phase, framework: rebuilt.framework, teaching: rebuilt.teaching }));
    setRegenerating(false);
    toast("Framework and teaching plan re-derived from the conversation");
  };

  const download = () => {
    if (!project) return;
    const blob = new Blob([buildFrameworkBriefMarkdown(project)], { type: "text/markdown;charset=utf-8" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${slugify(project.title)}.md` });
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
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
  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-1">
            <input ref={titleRef} value={project.title} onChange={(e) => patchProject((p) => ({ ...p, title: e.target.value }))} aria-label="Rename framework" placeholder="Name your framework" size={Math.max(8, Math.min(project.title.length + 1, 46))} className="w-auto min-w-[8ch] max-w-[46ch] rounded-md bg-transparent px-2 py-1 text-[15px] font-bold outline-none transition-colors [field-sizing:content] hover:bg-foreground/5 focus:bg-foreground/[0.07]" />
            <button type="button" className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground" onClick={() => { titleRef.current?.focus(); titleRef.current?.select(); }} aria-label="Rename framework"><Pencil className="h-3.5 w-3.5" /></button>
          </div>
          <div className="flex items-center gap-3">
            <div role="group" aria-label="Layout" className="inline-flex rounded-lg border border-border bg-card p-0.5">
              {([["chat", MessageSquare, "Chat only"], ["split", Columns2, "Chat and output"], ["output", PanelRight, "Output only"]] as const).map(([v, Icon, label]) => (
                <button key={v} type="button" aria-pressed={view === v} title={label} aria-label={label} onClick={() => { viewTouched.current = true; setView(v); }} className={`grid h-7 w-8 place-items-center rounded-md transition-colors ${view === v ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  <Icon className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
            <span role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 text-xs ${saveState === "error" ? "text-destructive" : "text-muted-foreground"}`}>
              {saveState === "saving" ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</> : saveState === "error" ? <><AlertTriangle className="h-3 w-3" /> Save failed · <button type="button" className="underline" onClick={() => void flushSave()}>Retry</button></> : saveState === "saved" ? <><Check className="h-3 w-3" /> Saved</> : null}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8"><Download className="h-3.5 w-3.5" /> Download <ChevronDown className="h-3.5 w-3.5 opacity-60" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={download}><FileText className="h-4 w-4" /> Markdown (.md)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast("Stubbed: PowerPoint export (pptxgenjs builds the same deck client-side)")}><Presentation className="h-4 w-4" /> PowerPoint (.pptx)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <PanelGroup ref={panelGroup} direction="horizontal" className="flex h-full w-full min-h-0 flex-1" onLayout={(sizes) => { if (sizes[0] >= 30 && sizes[1] >= 30) lastSplit.current = sizes; }}>
        <ResizablePanel defaultSize={100} minSize={30} collapsible collapsedSize={0} className={animating ? "panel-animate" : undefined}>
        <section aria-label="Creative Director chat" className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
          <div className="flex min-h-0 flex-1 flex-col">
            <FrameworkChat ref={chatRef} state={state} setup={project.setup} onSetupChange={patchSetup} voiceBlock={voiceBlock} firstAnswer={handoff.firstAnswer} started={started} onStart={async () => { await flushSave(); setStarted(true); patchProject((p) => (p.source === "empty" ? { ...p, source: "ai-interview" } : p)); }}
              onMessagesChange={(next) => patchState((s) => ({ ...s, chat_messages: next }))} onStatePatch={handleStatePatch} onStreamingChange={handleStreamingChange} />
          </div>
        </section>
        </ResizablePanel>
        <ResizableHandle withHandle className={`w-px bg-border after:w-2 hover:bg-primary/60 data-[resize-handle-active]:bg-primary ${view === "split" ? "" : "hidden"}`} />
        <ResizablePanel defaultSize={0} minSize={30} collapsible collapsedSize={0} className={animating ? "panel-animate" : undefined}>
        <section aria-label="Framework output" className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-card">
          <header className="flex shrink-0 justify-center border-b border-border px-6 py-3">
            <div role="tablist" className="inline-flex gap-1 rounded-xl border border-border bg-background/60 p-1">
              {(["framework", "teaching"] as const).map((t) => (
                <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => { tabTouched.current = true; setTab(t); }} className={`inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm transition-colors active:scale-[0.98] ${tab === t ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
                  <span className={`h-2 w-2 rounded-full ${tabDot(state, t)}`} aria-hidden />{t === "framework" ? "Framework" : "Teaching plan"}
                </button>
              ))}
            </div>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            <div className="mx-auto w-full max-w-[750px]">
              {tab === "framework" ? <FrameworkTab framework={state.framework} onChange={handleFrameworkChange} /> : (
                <TeachingPlanTab teaching={state.teaching} onAutoFill={handleAutoFill} chatStreaming={chatStreaming} autoFillStep={autoFillStep} onComponentChange={handleComponentChange} onRemoveStep={handleRemoveStep} />
              )}
            </div>
          </div>
          <footer className="flex shrink-0 items-center gap-3 border-t border-border px-5 py-2.5 ">
            <span className="text-[11px] text-muted-foreground tabular-nums">{FE_REGENERATE_CREDITS} credits</span>
            <Button variant="ghost" size="sm" className="h-8 text-muted-foreground" onClick={() => setRegenOpen(true)} disabled={regenerating}>{regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate</Button>
          </footer>
        </section>        </ResizablePanel>
      </PanelGroup>

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
