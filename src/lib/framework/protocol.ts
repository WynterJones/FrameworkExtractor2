/**
 * Framework Extractor — chat ⇄ structured-output protocol.
 *
 * The Creative Director both converses in markdown AND emits, at the very
 * end of a reply, at most one block:
 *
 *   <fe-state>
 *   { "phase": 2, "framework": { ... }, "teaching": { ... } }
 *   </fe-state>
 *
 * The JSON is a PATCH: only the keys that changed this turn. Arrays
 * (`raw_steps`, `named_steps`, `teaching.steps`) replace wholesale;
 * `teaching.step_updates` merges per step; `stages` / `components` /
 * `scale_variants` merge per key. Statuses are always re-derived from the
 * captured text (`normalizeFramework` / `normalizeTeaching`) so the two
 * panes can never disagree.
 *
 * On OverSkill this file is shared verbatim by the `/api/ai/framework-chat`
 * endpoint (producer) and the workspace (consumer).
 */

import {
  blankTeachingStep,
  FRAMEWORK_STAGE_KEYS,
  TEACHING_COMPONENT_KEYS,
  type FrameworkData,
  type FrameworkProjectState,
  type FrameworkStageKey,
  type NamedStep,
  type ProjectPhase,
  type ScaleVariants,
  type StageStatus,
  type TeachingComponentKey,
  type TeachingData,
  type TeachingStep,
} from "./contract.ts";

export const FE_CREDITS_PER_TURN = 3;
export const FE_CHAT_TURN_LIMIT = 300;
export const FE_LIMIT_WARN_REMAINING = 8;
export const FE_REGENERATE_CREDITS = 20;

export function countUserTurns(messages: { role: string }[] | null | undefined): number {
  return Array.isArray(messages) ? messages.filter((m) => m?.role === "user").length : 0;
}

export function isInterviewStarted(messages: unknown[] | null | undefined): boolean {
  return Array.isArray(messages) && messages.length > 0;
}

export const FE_STATE_OPEN = "<fe-state>";
export const FE_STATE_CLOSE = "</fe-state>";

export interface TeachingStepUpdate {
  step?: number;
  name?: string;
  story?: string;
  strategy?: string;
  tactics?: string;
  case_study?: string;
}

export type FeTeachingPatch = Partial<TeachingData> & { step_updates?: TeachingStepUpdate[] };

export interface FeStatePatch {
  phase?: ProjectPhase;
  framework?: Partial<FrameworkData>;
  teaching?: FeTeachingPatch;
}

const FE_STATE_BLOCK_RE = /<fe-state>\s*([\s\S]*?)<\/fe-state>/gi;

function parseObject(candidate: string): FeStatePatch | null {
  try {
    const parsed = JSON.parse(candidate) as unknown;
    if (parsed && typeof parsed === "object") return parsed as FeStatePatch;
  } catch {
    /* next candidate */
  }
  return null;
}

/** Tolerate code fences and stray prose around the JSON object. */
function parseFeStateBody(body: string): FeStatePatch | null {
  const trimmed = body.trim();
  if (!trimmed) return null;
  const candidates = [trimmed];
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced?.[1]?.trim()) candidates.push(fenced[1].trim());
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first !== -1 && last > first) candidates.push(trimmed.slice(first, last + 1));
  for (const c of candidates) {
    const p = parseObject(c);
    if (p) return p;
  }
  return null;
}

export function extractFeStatePatches(raw: string): FeStatePatch[] {
  if (!raw) return [];
  const out: FeStatePatch[] = [];
  FE_STATE_BLOCK_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = FE_STATE_BLOCK_RE.exec(raw)) !== null) {
    const patch = parseFeStateBody(m[1]);
    if (patch) out.push(patch);
  }
  return out;
}

/** Human-visible text: complete blocks removed, a dangling open tag (or a
 *  trailing prefix of it, mid-stream) dropped. */
export function stripFeState(raw: string): string {
  if (!raw) return "";
  let text = raw.replace(FE_STATE_BLOCK_RE, "");
  const openIdx = text.indexOf(FE_STATE_OPEN);
  if (openIdx !== -1) {
    text = text.slice(0, openIdx);
  } else {
    for (let i = FE_STATE_OPEN.length - 1; i > 0; i -= 1) {
      const prefix = FE_STATE_OPEN.slice(0, i);
      if (text.endsWith(prefix)) {
        text = text.slice(0, -prefix.length);
        break;
      }
    }
  }
  return text.replace(/\s+$/, "");
}

export function patchesHaveTeachingText(patches: FeStatePatch[]): boolean {
  return patches.some((p) => {
    const rows = [...(p.teaching?.steps ?? []), ...(p.teaching?.step_updates ?? [])] as Record<string, unknown>[];
    return rows.some((row) =>
      TEACHING_COMPONENT_KEYS.some((k) => typeof row[k] === "string" && (row[k] as string).trim().length > 0),
    );
  });
}

export type FeGenerationFailure = "truncated" | "empty_plan";

export function detectGenerationFailure(raw: string, visibleFinal: string, patches: FeStatePatch[]): FeGenerationFailure | null {
  if (raw.includes(FE_STATE_OPEN) && !raw.includes(FE_STATE_CLOSE) && patches.length === 0) return "truncated";
  if (/^\s*\*{0,2}generated\b/i.test(visibleFinal) && !patchesHaveTeachingText(patches)) return "empty_plan";
  return null;
}

function mergeFramework(current: FrameworkData, incoming: Partial<FrameworkData> | undefined): FrameworkData {
  if (!incoming || typeof incoming !== "object") return current;
  const next: FrameworkData = { ...current };
  if ("anchor" in incoming) next.anchor = incoming.anchor ?? null;
  if ("origin_story" in incoming) next.origin_story = incoming.origin_story ?? null;
  if (Array.isArray(incoming.raw_steps)) next.raw_steps = incoming.raw_steps;
  if (Array.isArray(incoming.named_steps)) next.named_steps = incoming.named_steps;
  if ("framework_name" in incoming) next.framework_name = incoming.framework_name ?? null;
  if ("framework_tagline" in incoming) next.framework_tagline = incoming.framework_tagline ?? null;
  if (incoming.stages) next.stages = { ...current.stages, ...incoming.stages };
  return next;
}

/** One teaching entry per named step; only ever extends, never truncates. */
export function reconcileTeachingSteps(steps: TeachingStep[] | null | undefined, namedSteps: NamedStep[] | null | undefined): TeachingStep[] {
  const existing = Array.isArray(steps) ? steps : [];
  const named = Array.isArray(namedSteps) ? namedSteps : [];
  if (named.length <= existing.length) return existing;
  const next = [...existing];
  for (let i = existing.length; i < named.length; i += 1) {
    next.push(blankTeachingStep((named[i]?.to ?? "").trim() || `Step ${i + 1}`));
  }
  return next;
}

function applyStepUpdates(steps: TeachingStep[], updates: TeachingStepUpdate[]): TeachingStep[] {
  if (steps.length === 0) return steps;
  const norm = (v: string | null | undefined) => (v ?? "").trim().toLowerCase();
  const next = steps.map((s) => ({ ...s }));
  for (const u of updates) {
    if (!u || typeof u !== "object") continue;
    let idx = typeof u.step === "number" && u.step >= 1 && u.step <= next.length ? u.step - 1 : -1;
    if (typeof u.name === "string" && u.name.trim()) {
      const want = norm(u.name);
      if (idx === -1 || norm(next[idx].name) !== want) {
        const byName = next.findIndex((s) => norm(s.name) === want);
        if (byName !== -1) idx = byName;
      }
    }
    if (idx < 0) continue;
    const target = { ...next[idx] };
    for (const k of TEACHING_COMPONENT_KEYS) {
      const val = u[k];
      if (typeof val === "string" && val.trim()) target[k] = val;
    }
    next[idx] = target;
  }
  return next;
}

function mergeTeaching(current: TeachingData, incoming: FeTeachingPatch | undefined, namedSteps: NamedStep[] | null | undefined): TeachingData {
  if (!incoming || typeof incoming !== "object") return current;
  const next: TeachingData = { ...current };
  if (typeof incoming.current_step === "number" && incoming.current_step > 0) next.current_step = incoming.current_step;
  if (Array.isArray(incoming.steps)) next.steps = incoming.steps;
  if (Array.isArray(incoming.step_updates) && incoming.step_updates.length > 0) {
    next.steps = applyStepUpdates(reconcileTeachingSteps(next.steps, namedSteps), incoming.step_updates);
  }
  if (incoming.scale_variants && typeof incoming.scale_variants === "object") {
    next.scale_variants = { ...(current.scale_variants ?? {}), ...(incoming.scale_variants as ScaleVariants) };
  }
  return next;
}

function componentText(step: TeachingStep, key: TeachingComponentKey): string {
  const v = step[key];
  return typeof v === "string" ? v.trim() : "";
}

/** Any component with text is done; the first empty one on the working step is active; the rest pending. */
export function normalizeTeaching(teaching: TeachingData): TeachingData {
  const steps = teaching.steps ?? [];
  if (steps.length === 0) return teaching;
  let current = steps.findIndex((s) => TEACHING_COMPONENT_KEYS.some((k) => !componentText(s, k)));
  if (current === -1) current = steps.length - 1;
  const normalized = steps.map((step, idx) => {
    let activeAssigned = false;
    const components = { ...step.components } as Record<TeachingComponentKey, StageStatus>;
    for (const k of TEACHING_COMPONENT_KEYS) {
      if (componentText(step, k)) components[k] = "done";
      else if (idx === current && !activeAssigned) {
        components[k] = "active";
        activeAssigned = true;
      } else components[k] = "pending";
    }
    return { ...step, components };
  });
  return { ...teaching, current_step: current + 1, steps: normalized };
}

export function frameworkStageHasData(key: FrameworkStageKey, f: FrameworkData): boolean {
  switch (key) {
    case "anchor": return Boolean(f.anchor);
    case "origin": return Boolean((f.origin_story ?? "").trim());
    case "hypothesis": return (f.raw_steps ?? []).length > 0;
    case "naming_steps": return (f.named_steps ?? []).length > 0;
    case "naming_framework": return Boolean((f.framework_name ?? "").trim());
  }
}

/** Any stage with data is done; the first without is active; the rest pending. */
export function normalizeFramework(framework: FrameworkData): FrameworkData {
  let activeAssigned = false;
  const stages = { ...framework.stages } as Record<FrameworkStageKey, StageStatus>;
  for (const key of FRAMEWORK_STAGE_KEYS) {
    if (frameworkStageHasData(key, framework)) stages[key] = "done";
    else if (!activeAssigned) {
      stages[key] = "active";
      activeAssigned = true;
    } else stages[key] = "pending";
  }
  return { ...framework, stages };
}

export function applyFeStatePatch(state: FrameworkProjectState, patch: FeStatePatch): FrameworkProjectState {
  if (!patch || typeof patch !== "object") return state;
  const next: FrameworkProjectState = { ...state };
  if (patch.phase === 1 || patch.phase === 2) next.phase = patch.phase;
  if (patch.framework) next.framework = mergeFramework(state.framework, patch.framework);
  if (patch.teaching) next.teaching = mergeTeaching(state.teaching, patch.teaching, next.framework.named_steps);
  next.framework = normalizeFramework(next.framework);
  next.teaching = normalizeTeaching(next.teaching);
  return next;
}

export function applyFeStatePatches(state: FrameworkProjectState, patches: FeStatePatch[]): FrameworkProjectState {
  return patches.reduce(applyFeStatePatch, state);
}

export function phase1Complete(f: FrameworkData): boolean {
  return FRAMEWORK_STAGE_KEYS.every((k) => f.stages[k] === "done");
}
