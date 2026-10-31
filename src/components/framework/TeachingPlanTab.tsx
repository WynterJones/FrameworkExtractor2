import { useEffect, useRef, useState } from "react";
import { BadgeCheck, ChevronDown, Lightbulb, Pencil, Sparkles, Trash2, Wand2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { RewriteMode } from "@/lib/mock/interview";
import { Button } from "@/components/ui/button";
import { EditableText } from "./EditableText";
import { EvidenceBadge, StatusDot, StatusPill } from "./StatusPill";
import { evidenceOf, isProofKey, TEACHING_COMPONENT_KEYS, type Evidence, type ProofKey, type TeachingComponentKey, type TeachingData, type TeachingStep } from "@/lib/framework/contract";

const META: Record<TeachingComponentKey, { num: number; art: string; title: string; sub: string }> = {
  story: { num: 1, art: "story-part", title: "Story", sub: "How you earned this lesson — open the teaching with this scene." },
  strategy: { num: 2, art: "strategy", title: "Strategy", sub: "The underlying principle — the why behind the step." },
  tactics: { num: 3, art: "tactics", title: "Tactics", sub: "The concrete how — sub-steps, tools, and pitfalls." },
  case_study: { num: 4, art: "case", title: "Case Study", sub: "A named example proving the step works." },
};

const text = (s: TeachingStep, k: TeachingComponentKey) => (s[k] ?? "").trim();
const REWRITES: [RewriteMode, string][] = [["regenerate", "Regenerate"], ["shorter", "Shorter"], ["more tactical", "More tactical"], ["more like my voice", "More like my voice"]];

export interface TeachingPlanTabProps {
  teaching: TeachingData;
  onAutoFill: (i: number) => void;
  chatStreaming: boolean;
  autoFillStep: number | null;
  onComponentChange: (i: number, k: TeachingComponentKey, v: string) => void;
  onRemoveStep: (i: number) => void;
  /** Story / case study proof answer; null clears it. */
  onEvidence: (i: number, k: ProofKey, e: Evidence | null) => void;
  /** Scoped rewrite of one component through the chat. */
  onRewrite: (i: number, label: string, mode: RewriteMode) => void;
}

export function TeachingPlanTab({ teaching, onAutoFill, chatStreaming, autoFillStep, onComponentChange, onRemoveStep, onEvidence, onRewrite }: TeachingPlanTabProps) {
  const steps = teaching.steps ?? [];
  const pointer = Math.min(Math.max(teaching.current_step - 1, 0), Math.max(steps.length - 1, 0));
  const [selected, setSelected] = useState(pointer);
  const [editingBlank, setEditingBlank] = useState<string | null>(null);
  const userPicked = useRef(false);
  useEffect(() => { if (!userPicked.current) setSelected(pointer); }, [pointer]);
  useEffect(() => { if (selected >= steps.length && steps.length) setSelected(steps.length - 1); }, [selected, steps.length]);

  if (steps.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <img src="/art/empty-teaching.webp" alt="" className="mb-3 w-full max-w-sm rounded-2xl border border-border/60" />
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
      <ol className="mx-auto mb-6 flex w-fit max-w-full flex-wrap justify-center gap-1 rounded-xl border border-border/60 bg-background/40 p-1">
        {steps.map((s, n) => {
          const done = TEACHING_COMPONENT_KEYS.every((k) => s.components[k] === "done");
          const active = n === i;
          return (
            <li key={n} className="flex-none">
              <button type="button" onClick={() => pick(n)} aria-current={active ? "step" : undefined} title={s.name} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 transition-colors active:scale-[0.98] ${active ? "bg-muted" : "hover:bg-muted/50"}`}>
                <StatusDot status={done ? "done" : active ? "active" : "pending"} label={n + 1} />
                <span className={`whitespace-nowrap text-sm ${active ? "font-semibold text-foreground" : "text-muted-foreground"}`}>Step {n + 1}</span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="mb-1 flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Step {i + 1} of {steps.length}</p>
          <h3 className="font-display text-xl font-semibold tracking-tight"><span className="text-muted-foreground">Teaching</span> {step.name || `Step ${i + 1}`}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => onRemoveStep(i)} aria-label={`Remove ${step.name}`} title={`Remove ${step.name}`}><Trash2 className="h-3.5 w-3.5" /></Button>
          {!fullyDone && (
            <Button variant="outline" size="sm" className="h-8" disabled={chatStreaming} onClick={() => onAutoFill(i)} title="Have the Creative Director draft Story, Strategy, Tactics and Case Study for this step">
              <Sparkles className="h-3.5 w-3.5" /> Generate all four
            </Button>
          )}
        </div>
      </div>
      <p className="mb-5 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">Four components per framework step. Walk through them one at a time, or let the Creative Director draft them.</p>

      <div className="divide-y divide-border">
        {TEACHING_COMPONENT_KEYS.map((k) => {
          const meta = META[k];
          const status = step.components[k];
          const t = text(step, k);
          const blankKey = `${i}:${k}`;
          return (
            <section key={k} className={`py-5 ${status === "pending" && !t ? "opacity-60" : status === "active" ? "my-2 -mx-4 rounded-xl bg-primary/[0.06] px-4 ring-1 ring-primary/20 sm:-mx-5 sm:px-5" : ""}`}>
              <header className="mb-2 flex items-center gap-3">
                <img src={`/art/icon-${meta.art}.webp`} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
                <h4 className="flex-1 font-display text-[15px] font-semibold"><span className="mr-1.5 text-muted-foreground tabular-nums">{meta.num}</span>{meta.title}</h4>
                {t && isProofKey(k) ? <EvidenceBadge evidence={evidenceOf(step, k)} /> : <StatusPill status={status} pendingLabel="Not completed" />}
              </header>
              {t || editingBlank === blankKey ? (
                <>
                <EditableText value={step[k] ?? ""} ariaLabel={`${meta.title} for ${step.name}`} placeholder={meta.sub} autoFocus={!t} onChange={(v) => onComponentChange(i, k, v)} />
                {t && (
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger disabled={chatStreaming} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"><Wand2 className="h-3 w-3" /> Rewrite <ChevronDown className="h-3 w-3" /></DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {REWRITES.map(([mode, label]) => <DropdownMenuItem key={mode} onSelect={() => onRewrite(i, meta.title, mode)}>{label}</DropdownMenuItem>)}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {isProofKey(k) && (() => {
                      const ev = evidenceOf(step, k);
                      const btn = "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground";
                      return (
                        <>
                          {ev !== "verified" && <button type="button" onClick={() => onEvidence(i, k, "verified")} className={btn}><BadgeCheck className="h-3 w-3" /> This really happened</button>}
                          {ev !== "illustrative" && <button type="button" onClick={() => onEvidence(i, k, "illustrative")} className={btn}><Lightbulb className="h-3 w-3" /> It's illustrative</button>}
                          {ev === "verified" && <button type="button" onClick={() => onEvidence(i, k, null)} className={btn}>Unmark</button>}
                          {k === "case_study" && ev !== "verified" && <span className="text-xs text-muted-foreground">Exports label it an illustrative example until you confirm it.</span>}
                        </>
                      );
                    })()}
                  </div>
                )}
                </>
              ) : autoFilling ? (
                <p className="text-sm"><span className="text-shimmer">Generating…</span></p>
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
