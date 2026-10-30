/** Serialise a project to the downloadable Framework Brief (markdown). Pure; mirrors production. */
import type { FrameworkProject, ScaleVariants, TeachingStep } from "./contract.ts";

export const clean = (v: string | null | undefined) => (v ?? "").trim();

export function frameworkName(p: FrameworkProject): string {
  return clean(p.state.framework.framework_name) || p.title || "Untitled framework";
}

export function stepNames(p: FrameworkProject): string[] {
  const f = p.state.framework;
  const named = (f.named_steps ?? []).map((s) => clean(s.to)).filter(Boolean);
  return named.length ? named : (f.raw_steps ?? []).map(clean).filter(Boolean);
}

export const SCALE_VARIANT_ROWS: { key: keyof ScaleVariants; label: string }[] = [
  { key: "sixty_second", label: "The 60-second version" },
  { key: "ten_minute", label: "The 10-minute version" },
  { key: "sixty_minute", label: "The 60-minute version" },
  { key: "half_day", label: "The half-day version" },
  { key: "multi_day", label: "The multi-day version" },
];

/** An unconfirmed case study is never exported as fact. */
export const caseStudyLabel = (step: TeachingStep) => (step.verified?.includes("case_study") ? "Case Study" : "Case Study (illustrative example, not yet confirmed)");

function stepMd(step: TeachingStep, i: number): string {
  const sec = (label: string, v: string | null | undefined) => `### ${label}\n\n${clean(v) || "_Not captured yet._"}\n`;
  return [`## Step ${i + 1}: ${clean(step.name) || `Step ${i + 1}`}`, "", sec("Story", step.story), sec("Strategy", step.strategy), sec("Tactics", step.tactics), sec(caseStudyLabel(step), step.case_study)].join("\n");
}

export function buildFrameworkBriefMarkdown(p: FrameworkProject): string {
  const { framework, teaching } = p.state;
  const out: string[] = [`# ${frameworkName(p)}`, ""];
  if (clean(framework.framework_tagline)) out.push(clean(framework.framework_tagline), "");
  out.push("---", "");
  const a = framework.anchor;
  if (a) {
    if (clean(a.dream_customer) || clean(a.niche)) {
      out.push("## Who this is for", "", clean(a.dream_customer) || clean(a.niche));
      if (clean(a.dream_customer) && clean(a.niche)) out.push("", `**Niche:** ${clean(a.niche)}`);
      out.push("");
    }
    if (clean(a.single_result)) out.push("## What this delivers", "", clean(a.single_result), "");
  }
  if (clean(framework.origin_story)) out.push("## Where this came from", "", clean(framework.origin_story), "");
  const names = stepNames(p);
  if (names.length) {
    out.push("---", "", "## The framework", "", `${frameworkName(p)} has ${names.length} step${names.length === 1 ? "" : "s"}:`, "");
    names.forEach((n, i) => out.push(`${i + 1}. **${n}**`));
    out.push("");
  }
  const steps = teaching.steps ?? [];
  if (steps.some((s) => clean(s.story) || clean(s.strategy) || clean(s.tactics) || clean(s.case_study))) {
    out.push("---", "");
    steps.forEach((s, i) => out.push(stepMd(s, i)));
  }
  const v = teaching.scale_variants;
  if (v) {
    const present = SCALE_VARIANT_ROWS.filter((r) => clean(v[r.key]));
    if (present.length) {
      out.push("---", "", "## Scale variants", "");
      present.forEach((r) => out.push(`### ${r.label}`, "", clean(v[r.key]), ""));
    }
  }
  return out.join("\n").replace(/\n{3,}/g, "\n\n").trim() + "\n";
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "framework";
}
