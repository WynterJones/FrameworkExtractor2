import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { AVATARS, CHARACTERS, VOICES } from "@/lib/mock/data";
import { EditableText } from "./EditableText";
import { StatusPill, StepNum } from "./StatusPill";
import { frameworkStageHasData } from "@/lib/framework/protocol";
import { FRAMEWORK_STAGE_KEYS, type FrameworkAnchor, type FrameworkData, type FrameworkSetup, type FrameworkStageKey } from "@/lib/framework/contract";

const STAGE_META: Record<FrameworkStageKey, { num: number; title: string; sub: string }> = {
  anchor: { num: 1, title: "Anchor", sub: "Confirm niche, dream customer, and the single result." },
  origin: { num: 2, title: "Origin Story", sub: "The specific scene where the framework was earned." },
  hypothesis: { num: 3, title: "The Steps", sub: "3–7 ordered steps, from a newcomer's first move to the result." },
  naming_steps: { num: 4, title: "Naming The Steps", sub: "Each raw step gets a name that earns its own teaching slot." },
  naming_framework: { num: 5, title: "Naming The Framework", sub: "The whole thing gets a name you can teach, sell, and stamp on the deck." },
};

export type StepOp = { move: number; dir: -1 | 1 } | { add: true };
interface StepEdit { onStepOp: (op: StepOp) => void; onRemoveStep: (i: number) => void }

/** Move up / down / remove for one step; shown on hover or focus. Steps stay between 3 and 7. */
function StepControls({ i, count, onStepOp, onRemoveStep }: StepEdit & { i: number; count: number }) {
  const btn = "grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-30";
  return (
    <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/step:opacity-100">
      <button type="button" className={btn} disabled={i === 0} onClick={() => onStepOp({ move: i, dir: -1 })} aria-label={`Move step ${i + 1} up`}><ArrowUp className="h-3.5 w-3.5" /></button>
      <button type="button" className={btn} disabled={i === count - 1} onClick={() => onStepOp({ move: i, dir: 1 })} aria-label={`Move step ${i + 1} down`}><ArrowDown className="h-3.5 w-3.5" /></button>
      <button type="button" className={`${btn} hover:text-destructive`} disabled={count <= 3} onClick={() => onRemoveStep(i)} aria-label={`Remove step ${i + 1}`} title={count <= 3 ? "A framework needs at least 3 steps" : undefined}><Trash2 className="h-3.5 w-3.5" /></button>
    </span>
  );
}
const AddStep = ({ count, onStepOp }: { count: number; onStepOp: (op: StepOp) => void }) => count < 7 ? (
  <button type="button" onClick={() => onStepOp({ add: true })} className="mt-2 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground"><Plus className="h-3.5 w-3.5" /> Add step</button>
) : null;

function StageBody({ stageKey, framework, onChange, onStepOp, onRemoveStep }: { stageKey: FrameworkStageKey; framework: FrameworkData; onChange: (p: Partial<FrameworkData>) => void } & StepEdit) {
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
        <EditableText value={framework.origin_story ?? ""} ariaLabel="Origin story" placeholder="The origin story" onChange={(v) => onChange({ origin_story: v })} />
      );
    case "hypothesis": {
      const steps = framework.raw_steps ?? [];
      const editable = !(framework.named_steps ?? []).length;
      return (
        <>
        <ol className="space-y-1">
          {steps.map((s, i) => (
            <li key={i} className="group/step flex items-start gap-3">
              <span className="w-5 shrink-0 pt-[7px] text-right text-xs leading-none tabular-nums text-muted-foreground">{i + 1}.</span>
              <EditableText value={s} ariaLabel={`Step ${i + 1}`} placeholder={`Step ${i + 1}`} onChange={(v) => onChange({ raw_steps: steps.map((x, j) => (j === i ? v : x)) })} />
              {editable && <StepControls i={i} count={steps.length} onStepOp={onStepOp} onRemoveStep={onRemoveStep} />}
            </li>
          ))}
        </ol>
        {editable && <AddStep count={steps.length} onStepOp={onStepOp} />}
        </>
      );
    }
    case "naming_steps": {
      const named = framework.named_steps ?? [];
      return (
        <>
        <ol className="space-y-2">
          {named.map((s, i) => (
            <li key={i} className="group/step flex items-start gap-3 rounded-lg bg-muted/40 px-3 py-2.5">
              <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border border-border bg-background text-xs font-semibold tabular-nums text-muted-foreground">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <EditableText value={s.to} ariaLabel={`Name for step ${i + 1}`} placeholder="Step name" className="-ml-2 text-[15px] font-semibold" onChange={(v) => onChange({ named_steps: named.map((x, j) => (j === i ? { ...x, to: v } : x)) })} />
                <span className="block text-xs leading-relaxed text-muted-foreground">{s.from}</span>
              </span>
              <StepControls i={i} count={named.length} onStepOp={onStepOp} onRemoveStep={onRemoveStep} />
            </li>
          ))}
        </ol>
        <AddStep count={named.length} onStepOp={onStepOp} />
        </>
      );
    }
    case "naming_framework":
      return (
        <div className="rounded-2xl border border-border bg-gradient-to-br from-muted/70 to-background p-6">
          <EditableText value={framework.framework_name ?? ""} ariaLabel="Framework name" placeholder="Framework name" className="-ml-2 font-display text-3xl font-bold leading-tight tracking-tight" onChange={(v) => onChange({ framework_name: v })} />
          <EditableText value={framework.framework_tagline ?? ""} ariaLabel="Framework tagline" placeholder="Add a one-line tagline (optional)" className="-ml-2 text-sm text-muted-foreground" onChange={(v) => onChange({ framework_tagline: v })} />
        </div>
      );
  }
}

/** The connected Attractive Character, Voice and Customer Avatar the framework is written as and for. */
function SetupStrip({ setup }: { setup: FrameworkSetup }) {
  const c = CHARACTERS.find((x) => x.id === setup.character_id);
  const v = VOICES.find((x) => x.id === setup.voice_id);
  const a = AVATARS.find((x) => x.id === setup.customer_avatar_id);
  const cells: { art: string; label: string; name?: string; sub?: string }[] = [
    { art: "character", label: "Attractive Character", name: c?.name, sub: c?.tagline },
    { art: "voice", label: "Voice", name: v?.name, sub: c ? `${c.name}'s voice` : undefined },
    { art: "avatar", label: "Customer Avatar", name: a?.name, sub: a?.tagline },
  ];
  return (
    <div className="mb-6 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 sm:grid-cols-3">
      {cells.map(({ art, label, name, sub }) => (
        <div key={label} className="flex items-center gap-3 bg-background/40 px-4 py-3">
          <img src={`/art/icon-${art}.webp`} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="truncate text-sm font-semibold">{name ?? <span className="font-normal text-muted-foreground">Not set</span>}</p>
            {sub && <p className="truncate text-xs text-muted-foreground">{sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FrameworkTab({ framework, setup, onChange, onStepOp, onRemoveStep }: { framework: FrameworkData; setup: FrameworkSetup; onChange: (p: Partial<FrameworkData>) => void } & StepEdit) {
  const empty = FRAMEWORK_STAGE_KEYS.every((k) => !frameworkStageHasData(k, framework));
  if (empty) {
    return (
      <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
        <img src="/art/empty-framework.webp" alt="" className="mb-3 w-full max-w-sm rounded-2xl border border-border/60" />
        <h4 className="text-[15px] font-semibold">Nothing extracted yet</h4>
        <p className="max-w-[36ch] text-sm text-muted-foreground">Answer the questions on the left and your framework fills in here, one stage at a time.</p>
      </div>
    );
  }
  return (
    <>
    <SetupStrip setup={setup} />
    <ol className="divide-y divide-border">
      {FRAMEWORK_STAGE_KEYS.map((key) => {
        const meta = STAGE_META[key];
        const status = framework.stages[key];
        const has = frameworkStageHasData(key, framework);
        return (
          <li key={key} className={`py-6 first:pt-2 ${status === "pending" ? "opacity-50" : status === "active" ? "my-2 -mx-4 rounded-xl bg-primary/[0.06] px-4 ring-1 ring-primary/20 sm:-mx-5 sm:px-5 first:pt-6" : ""}`}>
            <header className="mb-3 flex items-center gap-3">
              <StepNum n={meta.num} />
              <h4 className="flex-1 font-display text-[15px] font-semibold">{meta.title}</h4>
              <StatusPill status={status} />
            </header>
            {has ? <StageBody stageKey={key} framework={framework} onChange={onChange} onStepOp={onStepOp} onRemoveStep={onRemoveStep} /> : (
              <p className="text-sm text-muted-foreground">{status === "active" ? "Filling in from the conversation…" : meta.sub}</p>
            )}
          </li>
        );
      })}
    </ol>
    </>
  );
}
export default FrameworkTab;
