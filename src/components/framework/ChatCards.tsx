/**
 * Structured cards in the Creative Director thread. Each is derived from the
 * saved project state (or a persisted milestone message), so reloading the
 * page shows the same card, and answering it sends an ordinary chat turn.
 */
import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Check, Lightbulb, Plus, RefreshCw, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STAGES } from "@/lib/framework/status";
import { proposeFrameworkNames, proposePromise, proposeStepName } from "@/lib/mock/interview";
import type { Evidence, FrameworkData, ProofKey } from "@/lib/framework/contract";

const shell = "rounded-2xl border border-border bg-card p-4 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)] sm:p-5";
const eyebrow = "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground";

/** Naming The Framework: one candidate at a time with its promise and steps. Accept / Refine / Try another. */
export function ProposalCard({ framework, onSend, onRefine, disabled }: { framework: FrameworkData; onSend: (t: string) => void; onRefine: (name: string) => void; disabled: boolean }) {
  const steps = (framework.named_steps ?? []).map((s) => s.to);
  const names = proposeFrameworkNames(framework.anchor, steps.length);
  const [i, setI] = useState(0);
  return (
    <div className={`${shell} border-primary/30`}>
      <div className="flex items-center justify-between gap-2">
        <p className={eyebrow}><Sparkles className="mr-1 inline h-3 w-3 text-primary" />Framework proposal</p>
        <span className="text-xs tabular-nums text-muted-foreground">{i + 1} of {names.length}</span>
      </div>
      <h3 className="mt-2 font-display text-2xl font-bold tracking-tight">{names[i]}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{proposePromise(framework.anchor, steps.length)}.</p>
      <ol className="mt-3 flex flex-wrap gap-1.5">
        {steps.map((s, n) => <li key={n} className="rounded-full bg-muted/60 px-2.5 py-1 text-xs"><span className="text-muted-foreground">{n + 1}</span> {s}</li>)}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" className="h-8" disabled={disabled} onClick={() => onSend(String(i + 1))}><Check className="h-3.5 w-3.5" /> Accept</Button>
        <Button size="sm" variant="outline" className="h-8" disabled={disabled} onClick={() => onRefine(names[i])}>Refine</Button>
        <Button size="sm" variant="ghost" className="h-8" disabled={disabled} onClick={() => setI((n) => (n + 1) % names.length)}><RefreshCw className="h-3.5 w-3.5" /> Try another</Button>
      </div>
    </div>
  );
}

/** Naming The Steps: each raw step with an editable proposed name. Use these / Add a step. */
export function StepNamesCard({ rawSteps, onSend, onAddStep, disabled }: { rawSteps: string[]; onSend: (t: string) => void; onAddStep: () => void; disabled: boolean }) {
  const proposed = rawSteps.map(proposeStepName);
  const [names, setNames] = useState(proposed);
  // A step added or removed elsewhere: keep the user's edits by position, propose for the rest.
  useEffect(() => { setNames((cur) => proposed.map((p, n) => cur[n] ?? p)); }, [rawSteps.join("\n")]); // eslint-disable-line react-hooks/exhaustive-deps
  const edited = names.some((n, k) => n.trim() !== proposed[k]);
  return (
    <div className={shell}>
      <p className={eyebrow}>Proposed step names</p>
      <ol className="mt-3 space-y-2">
        {rawSteps.map((raw, n) => (
          <li key={n} className="flex items-start gap-3">
            <span className="mt-2 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border text-xs tabular-nums text-muted-foreground">{n + 1}</span>
            <div className="min-w-0 flex-1">
              <input value={names[n] ?? ""} onChange={(e) => setNames((cur) => cur.map((x, k) => (k === n ? e.target.value : x)))} aria-label={`Name for step ${n + 1}`} className="w-full rounded-lg border border-transparent bg-transparent px-2 py-1.5 text-[15px] font-semibold outline-none transition-colors hover:bg-foreground/5 focus:border-border focus:bg-foreground/[0.07]" />
              <p className="px-2 text-xs text-muted-foreground">{raw}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" className="h-8" disabled={disabled || names.some((n) => !n.trim())} onClick={() => onSend(edited ? names.map((n) => n.trim()).join("\n") : "yes")}><Check className="h-3.5 w-3.5" /> Use these names</Button>
        {rawSteps.length < 7 && <Button size="sm" variant="ghost" className="h-8" disabled={disabled} onClick={onAddStep}><Plus className="h-3.5 w-3.5" /> Add a step</Button>}
        <span className="self-center text-xs text-muted-foreground">Click a name to rewrite it.</span>
      </div>
    </div>
  );
}

/** A stage just completed: what is now locked, and where to review it. */
export function MilestoneCard({ stage, summary, onReview }: { stage: number; summary: string; onReview: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-emerald-500/25 bg-emerald-500/[0.06] px-4 py-3">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{STAGES[stage]} complete{STAGES[stage + 1] ? <span className="font-normal text-muted-foreground"> · next: {STAGES[stage + 1]}</span> : null}</p>
        <p className="truncate text-xs text-muted-foreground" title={summary}>{summary}</p>
      </div>
      <Button size="sm" variant="ghost" className="h-8 shrink-0" onClick={onReview}>{stage >= 3 ? "Open Export" : "Review framework"} <ArrowRight className="h-3.5 w-3.5" /></Button>
    </div>
  );
}

const PROOF_LABEL: Record<ProofKey, string> = { story: "story", case_study: "case study" };

/** Before anything specific gets published: did this really happen? */
export function EvidenceCard({ stepName, keyName, text, onAnswer }: { stepName: string; keyName: ProofKey; text: string; onAnswer: (e: Evidence) => void }) {
  const opts: [Evidence, string, typeof Check][] = [["verified", "Verified by you", BadgeCheck], ["illustrative", "Illustrative example", Lightbulb], ["needs_proof", "Needs proof", ShieldAlert]];
  return (
    <div className={`${shell} border-amber-500/30`}>
      <p className={eyebrow}><ShieldAlert className="mr-1 inline h-3 w-3 text-amber-400" />Evidence check · {stepName}</p>
      <p className="mt-2 text-sm">This {PROOF_LABEL[keyName]} names specific people, numbers or dates. Did it really happen?</p>
      <blockquote className="mt-2 line-clamp-3 rounded-lg bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{text}</blockquote>
      <div className="mt-3 flex flex-wrap gap-2">
        {opts.map(([e, label, Icon]) => <Button key={e} size="sm" variant={e === "verified" ? "default" : "outline"} className="h-8" onClick={() => onAnswer(e)}><Icon className="h-3.5 w-3.5" /> {label}</Button>)}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Anything not verified exports labelled as an illustrative example.</p>
    </div>
  );
}
