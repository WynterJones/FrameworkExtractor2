import { Compass } from "lucide-react";
import { EditableText } from "./EditableText";
import { StatusPill, StepNum } from "./StatusPill";
import { frameworkStageHasData } from "@/lib/framework/protocol";
import { FRAMEWORK_STAGE_KEYS, type FrameworkAnchor, type FrameworkData, type FrameworkStageKey } from "@/lib/framework/contract";

const STAGE_META: Record<FrameworkStageKey, { num: number; title: string; sub: string }> = {
  anchor: { num: 1, title: "Anchor", sub: "Confirm niche, dream customer, and the single result." },
  origin: { num: 2, title: "Origin Story", sub: "The specific scene where the framework was earned." },
  hypothesis: { num: 3, title: "Hypothesis", sub: "3–7 ordered steps extracted via naive-newcomer + reverse-pass questions." },
  naming_steps: { num: 4, title: "Naming The Steps", sub: "Each raw step gets a name that earns its own teaching slot." },
  naming_framework: { num: 5, title: "Naming The Framework", sub: "The whole thing gets a name you can teach, sell, and stamp on the deck." },
};

function StageBody({ stageKey, framework, onChange }: { stageKey: FrameworkStageKey; framework: FrameworkData; onChange: (p: Partial<FrameworkData>) => void }) {
  switch (stageKey) {
    case "anchor": {
      const a = framework.anchor!;
      const set = (patch: Partial<FrameworkAnchor>) => onChange({ anchor: { ...a, ...patch } });
      return (
        <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[150px_1fr]">
          {([["Niche", "niche"], ["Dream customer", "dream_customer"], ["Single result", "single_result"]] as const).map(([label, k]) => (
            <div key={k} className="contents">
              <dt className="pt-1.5 text-xs font-medium text-muted-foreground">{label}</dt>
              <dd><EditableText value={a[k]} ariaLabel={label} placeholder={label} onChange={(v) => set({ [k]: v })} /></dd>
            </div>
          ))}
        </dl>
      );
    }
    case "origin":
      return (
        <blockquote className="border-l-2 border-primary pl-4">
          <EditableText value={framework.origin_story ?? ""} ariaLabel="Origin story" placeholder="The origin story" onChange={(v) => onChange({ origin_story: v })} />
        </blockquote>
      );
    case "hypothesis": {
      const steps = framework.raw_steps ?? [];
      return (
        <ol className="space-y-1">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="w-5 shrink-0 pt-[7px] text-right text-xs leading-none tabular-nums text-muted-foreground">{i + 1}.</span>
              <EditableText value={s} ariaLabel={`Step ${i + 1}`} placeholder={`Step ${i + 1}`} onChange={(v) => onChange({ raw_steps: steps.map((x, j) => (j === i ? v : x)) })} />
            </li>
          ))}
        </ol>
      );
    }
    case "naming_steps": {
      const named = framework.named_steps ?? [];
      return (
        <ol className="space-y-2">
          {named.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
              <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-semibold tabular-nums text-primary">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <EditableText value={s.to} ariaLabel={`Name for step ${i + 1}`} placeholder="Step name" className="-ml-2 text-[15px] font-semibold" onChange={(v) => onChange({ named_steps: named.map((x, j) => (j === i ? { ...x, to: v } : x)) })} />
                <span className="block text-xs leading-relaxed text-muted-foreground">{s.from}</span>
              </span>
            </li>
          ))}
        </ol>
      );
    }
    case "naming_framework":
      return (
        <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6">
          <EditableText value={framework.framework_name ?? ""} ariaLabel="Framework name" placeholder="Framework name" className="-ml-2 font-display text-3xl font-bold leading-tight tracking-tight" onChange={(v) => onChange({ framework_name: v })} />
          <EditableText value={framework.framework_tagline ?? ""} ariaLabel="Framework tagline" placeholder="Add a one-line tagline (optional)" className="-ml-2 text-sm text-muted-foreground" onChange={(v) => onChange({ framework_tagline: v })} />
        </div>
      );
  }
}

export function FrameworkTab({ framework, onChange }: { framework: FrameworkData; onChange: (p: Partial<FrameworkData>) => void }) {
  const empty = FRAMEWORK_STAGE_KEYS.every((k) => !frameworkStageHasData(k, framework));
  if (empty) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-20 text-center">
        <Compass className="h-6 w-6 text-muted-foreground" />
        <h4 className="text-[15px] font-semibold">Nothing extracted yet</h4>
        <p className="max-w-[36ch] text-sm text-muted-foreground">Answer the questions on the left and your framework fills in here, one stage at a time.</p>
      </div>
    );
  }
  return (
    <ol className="divide-y divide-border">
      {FRAMEWORK_STAGE_KEYS.map((key) => {
        const meta = STAGE_META[key];
        const status = framework.stages[key];
        const has = frameworkStageHasData(key, framework);
        return (
          <li key={key} className={`py-6 first:pt-2 ${status === "pending" ? "opacity-50" : ""}`}>
            <header className="mb-3 flex items-center gap-3">
              <StepNum n={meta.num} />
              <h4 className="flex-1 text-[15px] font-semibold">{meta.title}</h4>
              <StatusPill status={status} />
            </header>
            {has ? <StageBody stageKey={key} framework={framework} onChange={onChange} /> : (
              <p className="text-sm text-muted-foreground">{status === "active" ? "Filling in from the conversation…" : meta.sub}</p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
export default FrameworkTab;
