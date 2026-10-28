import { Check } from "lucide-react";
import type { StageStatus } from "@/lib/framework/types";

const LABEL: Record<StageStatus, string> = { done: "Done", active: "In progress", pending: "Up next" };

export function StatusPill({ status, pendingLabel }: { status: StageStatus; pendingLabel?: string }) {
  const cls =
    status === "done" ? "bg-emerald-500/15 text-emerald-400 ring-1 ring-inset ring-emerald-500/30"
    : status === "active" ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/30"
    : "bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}>
      {status === "done" && <Check className="h-3 w-3" strokeWidth={3} aria-hidden />}
      {status === "active" && <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />}
      {status === "pending" && pendingLabel ? pendingLabel : LABEL[status]}
    </span>
  );
}

export function StepNum({ n }: { n: number }) {
  return <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-xs font-semibold tabular-nums text-muted-foreground">{n}</span>;
}
