import { useEffect, useRef, useState } from "react";
import { GraduationCap, Pencil, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EditableText } from "./EditableText";
import { StatusPill, StepNum } from "./StatusPill";
import { TEACHING_COMPONENT_KEYS, type TeachingComponentKey, type TeachingData, type TeachingStep } from "@/lib/framework/types";

const META: Record<TeachingComponentKey, { num: number; title: string; sub: string }> = {
  story: { num: 1, title: "Story", sub: "How you earned this lesson — open the teaching with this scene." },
  strategy: { num: 2, title: "Strategy", sub: "The underlying principle — the why behind the step." },
  tactics: { num: 3, title: "Tactics", sub: "The concrete how — sub-steps, tools, and pitfalls." },
  case_study: { num: 4, title: "Case Study", sub: "A named example proving the step works." },
};

const text = (s: TeachingStep, k: TeachingComponentKey) => (s[k] ?? "").trim();

export interface TeachingPlanTabProps {
  teaching: TeachingData;
  onAutoFill: (i: number) => void;
  chatStreaming: boolean;
  autoFillStep: number | null;
  onComponentChange: (i: number, k: TeachingComponentKey, v: string) => void;
  onRemoveStep: (i: number) => void;
}

export function TeachingPlanTab({ teaching, onAutoFill, chatStreaming, autoFillStep, onComponentChange, onRemoveStep }: TeachingPlanTabProps) {
  const steps = teaching.steps ?? [];
  const pointer = Math.min(Math.max(teaching.current_step - 1, 0), Math.max(steps.length - 1, 0));
  const [selected, setSelected] = useState(pointer);
  const [editingBlank, setEditingBlank] = useState<string | null>(null);
  const userPicked = useRef(false);
  useEffect(() => { if (!userPicked.current) setSelected(pointer); }, [pointer]);
  useEffect(() => { if (selected >= steps.length && steps.length) setSelected(steps.length - 1); }, [selected, steps.length]);

  const Head = ({ title, sub }: { title: React.ReactNode; sub: string }) => (
    <div className="mb-3.5"><h3 className="text-[17px] font-bold tracking-tight">{title}</h3><p className="mt-1 text-[12.5px] text-muted-foreground">{sub}</p></div>
  );

  if (steps.length === 0) {
    return (
      <>
        <Head title="Designing the teaching plan" sub="Four components per framework step. Walk through them one at a time with the Creative Director." />
        <div className="flex flex-col items-center gap-2 px-6 py-12 text-center text-muted-foreground">
          <span className="grid h-12 w-12 place-items-center rounded-xl border border-border bg-foreground/5"><GraduationCap className="h-5 w-5" /></span>
          <h4 className="text-sm font-bold text-foreground">Teaching plan not started</h4>
          <p className="max-w-[34ch] text-[12.5px]">Finish the framework on Phase 1 and the teaching plan opens up here.</p>
        </div>
      </>
    );
  }

  const i = Math.min(selected, steps.length - 1);
  const step = steps[i];
  const fullyDone = TEACHING_COMPONENT_KEYS.every((k) => text(step, k));
  const autoFilling = autoFillStep === i;
  const pick = (n: number) => { userPicked.current = true; setSelected(n); setEditingBlank(null); };

  return (
    <>
      <div className="mb-3.5 flex flex-wrap gap-1.5">
        {steps.map((s, n) => {
          const done = TEACHING_COMPONENT_KEYS.every((k) => s.components[k] === "done");
          const active = n === i;
          return (
            <button key={n} type="button" onClick={() => pick(n)} className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors active:scale-[0.96] ${active ? "border-primary bg-primary/5 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
              <span className={`h-[7px] w-[7px] rounded-full ${done ? "bg-emerald-500" : active ? "bg-primary" : "bg-muted-foreground/40"}`} aria-hidden />
              {s.name || `Step ${n + 1}`}
            </button>
          );
        })}
      </div>

      <div className="mb-3.5 flex flex-wrap items-start justify-between gap-3">
        <Head title={<>Teaching <em className="not-italic text-primary">{step.name || `Step ${i + 1}`}</em> · Step {i + 1} of {steps.length}</>} sub="Four components per framework step. Walk through them one at a time, or let the Creative Director draft them." />
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onRemoveStep(i)} title={`Remove ${step.name}`}>
            <Trash2 className="h-3.5 w-3.5" /> Remove
          </Button>
          <Button variant="outline" size="sm" className="h-8 border-primary/35 bg-primary/5 text-primary hover:bg-primary/10 hover:text-primary" disabled={chatStreaming || fullyDone} onClick={() => onAutoFill(i)} title={fullyDone ? "Every component for this step is done" : "Have the Creative Director draft Story, Strategy, Tactics and Case Study for this step"}>
            <Sparkles className="h-3.5 w-3.5" /> {fullyDone ? "Step complete" : "Generate"}
          </Button>
        </div>
      </div>

      <div className="space-y-2.5">
        {TEACHING_COMPONENT_KEYS.map((k) => {
          const meta = META[k];
          const status = step.components[k];
          const t = text(step, k);
          const blankKey = `${i}:${k}`;
          return (
            <article key={k} className={`rounded-xl border bg-card p-3.5 ${status === "active" ? "border-primary/40 bg-primary/[0.04]" : status === "pending" ? "border-dashed border-border bg-foreground/[0.02]" : "border-emerald-500/30"}`}>
              <header className="mb-2 flex flex-wrap items-center gap-2.5">
                <StepNum n={meta.num} />
                <h4 className="min-w-0 flex-1 text-sm font-bold">{meta.title}</h4>
                <StatusPill status={status} pendingLabel="Not completed" />
              </header>
              {t || editingBlank === blankKey ? (
                <EditableText value={step[k] ?? ""} ariaLabel={`${meta.title} for ${step.name}`} placeholder={meta.sub} autoFocus={!t} onChange={(v) => onComponentChange(i, k, v)} />
              ) : autoFilling ? (
                <p className="inline-flex items-center gap-1.5 text-[13px] italic text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  Generating…
                </p>
              ) : (
                <div className="flex items-center justify-between gap-2.5">
                  <p className="text-[12.5px] italic text-muted-foreground">{status === "active" ? "Filling in from the conversation on the left — or use Generate above." : meta.sub}</p>
                  <button type="button" onClick={() => setEditingBlank(blankKey)} className="inline-flex shrink-0 items-center gap-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-foreground">
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </>
  );
}
export default TeachingPlanTab;
