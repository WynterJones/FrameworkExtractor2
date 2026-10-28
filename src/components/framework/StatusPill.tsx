import { Check } from "lucide-react";
import type { StageStatus } from "@/lib/framework/types";

const LABEL: Record<StageStatus, string> = { done: "Done", active: "In progress", pending: "Up next" };

export function StatusPill({ status, pendingLabel }: { status: StageStatus; pendingLabel?: string }) {
  const cls =
    status === "done" ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
    : status === "active" ? "bg-primary/15 text-primary"
    : "border border-border bg-muted text-muted-foreground";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls}`}>
      {status === "done" && <Check className="h-2.5 w-2.5" strokeWidth={3} aria-hidden />}
      {status === "pending" && pendingLabel ? pendingLabel : LABEL[status]}
    </span>
  );
}

export function StepNum({ n }: { n: number }) {
  return <span className="inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground tabular-nums">{n}</span>;
}
