import { BadgeCheck, Check, Lightbulb, ShieldAlert } from "lucide-react";
import type { Evidence, StageStatus } from "@/lib/framework/contract";

const LABEL: Record<StageStatus, string> = { done: "Done", active: "In progress", pending: "Up next" };

/** Done needs no badge: the content itself is the proof. Only the two waiting states get one. */
export function StatusPill({ status, pendingLabel }: { status: StageStatus; pendingLabel?: string }) {
  if (status === "done") return null;
  const cls = status === "active" ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30" : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />}
      {status === "pending" && pendingLabel ? pendingLabel : LABEL[status]}
    </span>
  );
}

export function StepNum({ n }: { n: number }) {
  return <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold tabular-nums text-muted-foreground">{n}</span>;
}

/** The one small status circle used by the output tabs and the step stepper: green check when done, primary when active, outlined when pending. */
export function StatusDot({ status, label }: { status: StageStatus; label?: string | number }) {
  const cls = status === "done" ? "bg-emerald-500 text-white" : status === "active" ? "bg-primary text-primary-foreground" : "border border-border text-muted-foreground";
  return (
    <span className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full text-[10px] font-semibold tabular-nums ${cls}`} aria-hidden>
      {status === "done" ? <Check className="h-2.5 w-2.5" strokeWidth={3} /> : label ?? (status === "active" ? <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" /> : null)}
    </span>
  );
}

const EVIDENCE: Record<Evidence, { label: string; cls: string; Icon: typeof Check }> = {
  verified: { label: "Verified by you", cls: "bg-emerald-500/15 text-emerald-400", Icon: BadgeCheck },
  illustrative: { label: "Illustrative example", cls: "bg-sky-500/10 text-sky-300", Icon: Lightbulb },
  needs_proof: { label: "Needs proof", cls: "bg-amber-500/15 text-amber-400", Icon: ShieldAlert },
};
/** Proof status of a story or case study. No answer yet reads as Needs proof. */
export function EvidenceBadge({ evidence }: { evidence?: Evidence }) {
  const { label, cls, Icon } = EVIDENCE[evidence ?? "needs_proof"];
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${cls}`}><Icon className="h-3 w-3" /> {label}</span>;
}
