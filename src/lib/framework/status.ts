/** Derived, never stored: library status, the five interview stages, and real progress. Pure. */
import { FRAMEWORK_STAGE_KEYS, TEACHING_COMPONENT_KEYS, type FrameworkProjectState, type TeachingStep } from "./contract.ts";

export type LibraryStatus = "Discovering" | "Needs review" | "Teaching in progress" | "Ready";
export const STAGES = ["Discover", "Structure", "Refine", "Teach", "Activate"] as const;

const stepDone = (s: TeachingStep) => TEACHING_COMPONENT_KEYS.every((k) => (s[k] ?? "").trim());
export const teachingDone = (st: FrameworkProjectState) => st.teaching.steps.length > 0 && st.teaching.steps.every(stepDone);

export function libraryStatus(st: FrameworkProjectState): LibraryStatus {
  if (teachingDone(st)) return "Ready";
  if (st.phase === 2) return "Teaching in progress";
  // Names proposed and waiting on the user.
  if (st.framework.stages.naming_steps === "active" || st.framework.stages.naming_framework === "active") return "Needs review";
  return "Discovering";
}

/** 0-based index into STAGES. Discover = anchor + origin, Structure = steps + their names, Refine = framework name. */
export function stageIndex(st: FrameworkProjectState): number {
  if (teachingDone(st)) return 4;
  if (st.phase === 2) return 3;
  const s = st.framework.stages;
  if (s.naming_framework === "active") return 2;
  if (s.hypothesis === "active" || s.naming_steps === "active") return 1;
  return 0;
}

/** Share of persisted work done: Phase 1 stages are the first half, teaching components the second. */
export function progress(st: FrameworkProjectState): number {
  const p1 = FRAMEWORK_STAGE_KEYS.filter((k) => st.framework.stages[k] === "done").length / FRAMEWORK_STAGE_KEYS.length;
  const steps = st.teaching.steps;
  const p2 = steps.length ? steps.reduce((n, s) => n + TEACHING_COMPONENT_KEYS.filter((k) => (s[k] ?? "").trim()).length, 0) / (steps.length * 4) : 0;
  return Math.round((p1 * 0.5 + p2 * 0.5) * 100);
}

/** Story and case study components the user has not confirmed as real. */
export function unverified(st: FrameworkProjectState): { step: string; key: "story" | "case_study" }[] {
  return st.teaching.steps.flatMap((s) => (["story", "case_study"] as const).filter((k) => (s[k] ?? "").trim() && !s.verified?.includes(k)).map((key) => ({ step: s.name, key })));
}
