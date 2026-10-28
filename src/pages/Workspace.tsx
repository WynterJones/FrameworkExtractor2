import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Download, FileText, Library, Loader2, PanelLeftClose, PanelLeftOpen, Pencil, Presentation, RefreshCw, Save, Sparkles, Zap } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { FrameworkChat, type FrameworkChatHandle } from "@/components/framework/FrameworkChat";
import { FrameworkTab } from "@/components/framework/FrameworkTab";
import { TeachingPlanTab } from "@/components/framework/TeachingPlanTab";
import { SetupBar } from "@/components/framework/SetupBar";
import { buildFrameworkBriefMarkdown, slugify } from "@/lib/framework/brief";
import { getProject, updateProject } from "@/lib/framework/storage";
import { applyFeStatePatches, FE_REGENERATE_CREDITS, isInterviewStarted, normalizeTeaching, phase1Complete, reconcileTeachingSteps, type FeStatePatch } from "@/lib/framework/protocol";
import { fakeAI } from "@/lib/mock/ai";
import { replayInterview } from "@/lib/mock/interview";
import { REGENERATE_SHELL } from "@/lib/framework/prompts";
import { DEFAULT_FRAMEWORK_TITLE, FRAMEWORK_STAGE_KEYS, type FrameworkData, type FrameworkProject, type FrameworkProjectState, type FrameworkSetup, type TeachingComponentKey, type TeachingStep } from "@/lib/framework/types";

type Tab = "framework" | "teaching";
type SaveState = "idle" | "saving" | "saved" | "error";

function tabDot(state: FrameworkProjectState, tab: Tab) {
  const done = tab === "framework" ? phase1Complete(state.framework) : state.teaching.steps.length > 0 && state.teaching.steps.every((s) => (["story", "strategy", "tactics", "case_study"] as const).every((k) => s.components[k] === "done"));
  const active = tab === "framework" ? FRAMEWORK_STAGE_KEYS.some((k) => state.framework.stages[k] === "active") : state.teaching.steps.length > 0;
  return done ? "bg-emerald-600" : active ? "bg-primary ring-2 ring-primary/35 animate-pulse" : "border border-border bg-muted";
}

export default function Workspace() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [project, setProject] = useState<FrameworkProject | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("framework");
  const tabTouched = useRef(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [libraryState, setLibraryState] = useState<SaveState>("idle");
  const [outputExpanded, setOutputExpanded] = useState(false);
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
      if (p) { setProject(p); setStarted(isInterviewStarted(p.state.chat_messages)); if (!tabTouched.current) setTab(p.state.phase === 2 ? "teaching" : "framework"); }
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

  const handleRegenerate = async () => {
    if (!project) return;
    setRegenerating(true);
    const userTurns = project.state.chat_messages.filter((m) => m.role === "user").map((m) => m.content);
    const rebuilt = await fakeAI(() => replayInterview(userTurns), { prompt: REGENERATE_SHELL, delayMs: 1800 });
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
  const saveToLibrary = async () => {
    setLibraryState("saving"); await flushSave();
    await fakeAI(null, { prompt: "", delayMs: 900 });
    setLibraryState("saved"); toast("Stubbed: added to your workspace Library");
  };

  if (loading) return <p role="status" className="m-7 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading project…</p>;
  if (!project) return (
    <div role="alert" className="m-7 flex flex-col items-center rounded-xl border border-dashed border-border px-6 py-14 text-center">
      <h3 className="text-base font-bold">We couldn't open this framework</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">This framework doesn't exist in this workspace. Head back and pick one from the list.</p>
      <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Back to frameworks</Button>
    </div>
  );

  const { state } = project;
  const iconBtn = "h-7 px-3 text-xs";
  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border bg-card px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" size="sm" className={iconBtn}><Link to="/"><ArrowLeft className="h-3.5 w-3.5" /> Back</Link></Button>
          <div className="ml-1 flex min-w-0 flex-1 items-center gap-1 border-l border-border pl-3">
            <input ref={titleRef} value={project.title} onChange={(e) => patchProject((p) => ({ ...p, title: e.target.value }))} aria-label="Rename framework" placeholder="Name your framework" className="min-w-[8ch] max-w-[46ch] flex-1 rounded-md bg-transparent px-2 py-1 text-[15px] font-bold outline-none transition-colors hover:bg-foreground/5 focus:bg-foreground/[0.07]" />
            <button type="button" className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-foreground/5 hover:text-foreground" onClick={() => { titleRef.current?.focus(); titleRef.current?.select(); }} aria-label="Rename framework"><Pencil className="h-3.5 w-3.5" /></button>
          </div>
          <div className="flex items-center gap-2">
            <span role="status" aria-live="polite" className={`inline-flex items-center gap-1.5 text-xs font-medium ${saveState === "error" ? "text-destructive" : "text-muted-foreground"}`}>
              {saveState === "saving" ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</> : saveState === "error" ? <><AlertTriangle className="h-3 w-3" /> Save failed</> : saveState === "saved" ? <><Check className="h-3 w-3" /> Saved</> : null}
            </span>
            <Button variant="outline" size="sm" className={iconBtn} onClick={() => { if (timer.current) window.clearTimeout(timer.current); void flushSave(); }} disabled={saveState === "saving"}><Save className="h-3.5 w-3.5" /> {saveState === "error" ? "Retry" : "Save"}</Button>
            <Button variant="outline" size="sm" className={iconBtn} onClick={download} title="Download the brief as Markdown (.md)"><Download className="h-3.5 w-3.5" /> Markdown</Button>
            <Button variant="outline" size="sm" className={iconBtn} onClick={() => toast("Stubbed: PowerPoint export (pptxgenjs builds the same deck client-side)")} title="Download the brief as a PowerPoint deck (.pptx)"><Presentation className="h-3.5 w-3.5" /> PowerPoint</Button>
            <Button size="sm" className={`${iconBtn} active:scale-[0.96] transition-transform duration-150`} onClick={() => void saveToLibrary()} disabled={libraryState === "saving"}>
              {libraryState === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : libraryState === "saved" ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Library className="h-3.5 w-3.5" />}
              {libraryState === "saving" ? "Saving…" : libraryState === "saved" ? "In Library" : "Add to Library"}
            </Button>
          </div>
        </div>
        {libraryState === "saved" && (
          <div role="status" className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-600/30 bg-emerald-600/10 px-3 py-2 text-xs text-emerald-800 dark:text-emerald-200">
            <Check className="h-3.5 w-3.5" /> Added to your Library — find it under Documents, or ask your Chief of Staff to pull it up. Saving again updates that same file.
          </div>
        )}
      </header>

      <div className={`grid min-h-0 flex-1 items-stretch ${outputExpanded ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
        <section aria-label="Creative Director chat" className={`flex min-h-0 max-h-[72vh] flex-col border-b border-border lg:max-h-none lg:border-b-0 lg:border-r ${outputExpanded ? "hidden" : ""}`}>
          <header className="flex shrink-0 items-center gap-2.5 border-b border-border bg-background/40 px-4 py-3">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-red-500/15 text-red-500"><Sparkles className="h-4 w-4" /></span>
            <div><h2 className="text-sm font-bold">Creative Director</h2><p className="text-xs text-muted-foreground">{state.phase === 2 ? "Phase 2 · Designing the teaching plan" : "Phase 1 · Extracting your framework"}</p></div>
          </header>
          <SetupBar setup={project.setup} onChange={patchSetup} />
          <div className="flex min-h-0 flex-1 flex-col">
            <FrameworkChat ref={chatRef} state={state} started={started} onStart={async () => { await flushSave(); setStarted(true); patchProject((p) => (p.source === "empty" ? { ...p, source: "ai-interview" } : p)); }}
              onMessagesChange={(next) => patchState((s) => ({ ...s, chat_messages: next }))} onStatePatch={handleStatePatch} onStreamingChange={handleStreamingChange} />
          </div>
        </section>

        <section aria-label="Framework output" className="flex min-h-0 flex-col">
          <header className="grid shrink-0 grid-cols-[1fr_auto] items-center gap-2.5 border-b border-border bg-background/40 px-4 py-3">
            <div className="col-span-2 flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-500/15 text-emerald-500"><FileText className="h-4 w-4" /></span>
              <div><h2 className="text-sm font-bold">Output</h2><p className="text-xs text-muted-foreground">Flip between the framework and the teaching plan.</p></div>
            </div>
            <div role="tablist" className="inline-flex gap-1 rounded-xl border border-border bg-foreground/[0.04] p-1">
              {(["framework", "teaching"] as const).map((t) => (
                <button key={t} role="tab" type="button" aria-selected={tab === t} onClick={() => { tabTouched.current = true; setTab(t); }} className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${tab === t ? "border-border bg-card text-foreground shadow-sm" : "border-transparent text-muted-foreground hover:bg-foreground/5 hover:text-foreground"}`}>
                  <span className={`h-3.5 w-3.5 rounded-full ${tabDot(state, t)}`} aria-hidden />{t === "framework" ? "Framework" : "Teaching Plan"}
                </button>
              ))}
            </div>
            <Button variant="outline" size="icon" className="h-8 w-8 justify-self-end" aria-pressed={outputExpanded} onClick={() => setOutputExpanded((v) => !v)} title={outputExpanded ? "Show the chat" : "Hide the chat and widen the output"}>
              {outputExpanded ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            </Button>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
            <div className={outputExpanded ? "mx-auto w-full max-w-[900px]" : ""}>
              {tab === "framework" ? <FrameworkTab framework={state.framework} onChange={handleFrameworkChange} /> : (
                <TeachingPlanTab teaching={state.teaching} onAutoFill={handleAutoFill} chatStreaming={chatStreaming} autoFillStep={autoFillStep} onComponentChange={handleComponentChange} onRemoveStep={handleRemoveStep} />
              )}
            </div>
          </div>
          <footer className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-background/40 px-3.5 py-3">
            <Button variant="outline" size="sm" className="h-8" onClick={() => setRegenOpen(true)} disabled={regenerating}>{regenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Regenerate</Button>
            <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">{FE_REGENERATE_CREDITS} credits</span>
          </footer>
        </section>
      </div>

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
