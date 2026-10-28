import { useEffect, useRef, useState } from "react";
import { Check, GraduationCap, Pencil, Sparkles, Trash2 } from "lucide-react";
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

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-20 text-center">
        <GraduationCap className="h-6 w-6 text-muted-foreground" />
        <h4 className="text-[15px] font-semibold">Teaching plan not started</h4>
        <p className="max-w-[36ch] text-sm text-muted-foreground">Finish the framework on Phase 1 and the teaching plan opens up here.</p>
      </div>
    );
  }

  const i = Math.min(selected, steps.length - 1);
  const step = steps[i];
  const fullyDone = TEACHING_COMPONENT_KEYS.every((k) => text(step, k));
  const autoFilling = autoFillStep === i;
  const pick = (n: number) => { userPicked.current = true; setSelected(n); setEditingBlank(null); };

  return (
    <>
      <ol className="mb-6 inline-flex flex-wrap gap-1 rounded-xl border border-border bg-card p-1">
        {steps.map((s, n) => {
          const done = TEACHING_COMPONENT_KEYS.every((k) => s.components[k] === "done");
          const active = n === i;
          return (
            <li key={n} className="flex-none">
              <button type="button" onClick={() => pick(n)} aria-current={active ? "step" : undefined} title={s.name} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors active:scale-[0.98] ${active ? "bg-muted" : "hover:bg-muted/50"}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold tabular-nums ${done ? "bg-emerald-500 text-white" : active ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground"}`}>{done ? <Check className="h-3 w-3" strokeWidth={3} /> : n + 1}</span>
                <span className={`whitespace-nowrap text-sm ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Step {n + 1}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground tabular-nums">Step {i + 1} of {steps.length}</p>
          <h3 className="font-display text-xl font-semibold tracking-tight">{step.name || `Step ${i + 1}`}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-destructive" onClick={() => onRemoveStep(i)} title={`Remove ${step.name}`}><Trash2 className="h-3.5 w-3.5" /> Remove</Button>
          <Button variant="outline" size="sm" className="h-8" disabled={chatStreaming || fullyDone} onClick={() => onAutoFill(i)} title={fullyDone ? "Every component for this step is done" : "Have the Creative Director draft Story, Strategy, Tactics and Case Study for this step"}>
            <Sparkles className="h-3.5 w-3.5" /> {fullyDone ? "Step complete" : "Generate all four"}
          </Button>
        </div>
      </div>

      <div className="divide-y divide-border">
        {TEACHING_COMPONENT_KEYS.map((k) => {
          const meta = META[k];
          const status = step.components[k];
          const t = text(step, k);
          const blankKey = `${i}:${k}`;
          return (
            <section key={k} className={`py-5 ${status === "pending" && !t ? "opacity-60" : ""}`}>
              <header className="mb-2 flex items-center gap-3">
                <StepNum n={meta.num} />
                <h4 className="flex-1 text-[15px] font-semibold">{meta.title}</h4>
                <StatusPill status={status} pendingLabel="Not completed" />
              </header>
              {t || editingBlank === blankKey ? (
                <EditableText value={step[k] ?? ""} ariaLabel={`${meta.title} for ${step.name}`} placeholder={meta.sub} autoFocus={!t} onChange={(v) => onComponentChange(i, k, v)} />
              ) : autoFilling ? (
                <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:150ms]" /><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground [animation-delay:300ms]" />
                  Generating…
                </p>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{status === "active" ? "Filling in from the conversation, or use Generate above." : meta.sub}</p>
                  <button type="button" onClick={() => setEditingBlank(blankKey)} className="inline-flex shrink-0 items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground">
                    <Pencil className="h-3 w-3" /> Write it myself
                  </button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
export default TeachingPlanTab;
