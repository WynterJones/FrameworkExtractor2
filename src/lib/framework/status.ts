/** Derived, never stored: library status, the five interview stages, and real progress. Pure. */
import { evidenceOf, FRAMEWORK_STAGE_KEYS, PROOF_KEYS, TEACHING_COMPONENT_KEYS, type FrameworkProjectState, type ProofKey, type TeachingStep } from "./contract.ts";

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

/** The summary line for the milestone card shown when stage `idx` completes. */
export function milestoneSummary(st: FrameworkProjectState, idx: number): string {
  const f = st.framework;
  const names = (f.named_steps?.length ? f.named_steps.map((s) => s.to) : f.raw_steps ?? []).filter(Boolean);
  if (idx === 0) return [f.anchor?.dream_customer && `For: ${f.anchor.dream_customer}`, f.anchor?.single_result && `Result: ${f.anchor.single_result}`, (f.origin_story ?? "").trim() && "Origin story captured"].filter(Boolean).join(" · ");
  if (idx === 1) return `${names.length} steps: ${names.join(" · ")}`;
  if (idx === 2) return `${(f.framework_name ?? "").trim()} · ${names.length} steps`;
  return `${st.teaching.steps.length} steps × 4 teaching components written`;
}

/** Story and case study components the user has not confirmed as real. */
export function unverified(st: FrameworkProjectState): { step: string; key: ProofKey }[] {
  return st.teaching.steps.flatMap((s) => PROOF_KEYS.filter((k) => (s[k] ?? "").trim() && evidenceOf(s, k) !== "verified").map((key) => ({ step: s.name, key })));
}

/** Names, numbers, dates, money: the things that must not be published unless they really happened. */
const CLAIM_RE = /\d|\$|%|\b(?:January|February|March|April|May|June|July|August|September|October|November|December)\b|\b[A-Z][a-z]+,? (?:an?|the|who|from|in)\b/;

/** The latest written story / case study that makes a specific claim and has no evidence answer yet: what the chat's evidence check asks about. */
export function pendingEvidence(st: FrameworkProjectState): { step: number; key: ProofKey; text: string } | null {
  for (let i = st.teaching.steps.length - 1; i >= 0; i -= 1) {
    const s = st.teaching.steps[i];
    for (const key of [...PROOF_KEYS].reverse()) {
      const text = (s[key] ?? "").trim();
      if (text && !evidenceOf(s, key) && CLAIM_RE.test(text)) return { step: i, key, text };
    }
  }
  return null;
}
