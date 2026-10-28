import { Check } from "lucide-react";
import type { StageStatus } from "@/lib/framework/contract";

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
