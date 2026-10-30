/**
 * Export formats for the Framework Brief. All pure except the two download
 * helpers. Markdown comes from brief.ts; this file adds the printable HTML
 * (PDF preview + print-to-PDF) and the slide list (deck preview + .pptx).
 */
import { SCALE_VARIANT_ROWS, buildFrameworkBriefMarkdown, caseStudyLabel, clean, frameworkName, slugify, stepNames } from "./brief.ts";
import { evidenceOf, type FrameworkProject } from "./contract.ts";

export type ExportScope = "framework" | "teaching" | "complete";
export const SCOPES: { id: ExportScope; label: string; blurb: string }[] = [
  { id: "framework", label: "Framework only", blurb: "Name, who it is for, the origin story and the steps." },
  { id: "teaching", label: "Teaching guide", blurb: "Everything above plus Story, Strategy, Tactics and Case Study for each step." },
  { id: "complete", label: "Complete kit", blurb: "The teaching guide plus the 60-second to multi-day versions." },
];

/** The project trimmed to an export scope. Builders below stay scope-agnostic. */
export function scoped(p: FrameworkProject, scope: ExportScope): FrameworkProject {
  if (scope === "complete") return p;
  const teaching = scope === "framework"
    ? { ...p.state.teaching, steps: p.state.teaching.steps.map((s) => ({ ...s, story: null, strategy: null, tactics: null, case_study: null })), scale_variants: null }
    : { ...p.state.teaching, scale_variants: null };
  return { ...p, state: { ...p.state, teaching } };
}

// ponytail: projects are not versioned yet, so every file is v1. Bump when versions land.
export const exportFileName = (p: FrameworkProject, scope: ExportScope, ext: string) => `${slugify(frameworkName(p))}-${scope}-v1.${ext}`;

export interface Slide {
  kicker?: string;
  title: string;
  body?: string;
  bullets?: string[];
}

/** The 16:9 deck: title, who/what, origin, agenda, one slide per step × component, one per scale variant. */
export function buildSlides(p: FrameworkProject): Slide[] {
  const { framework, teaching } = p.state;
  const name = frameworkName(p);
  const out: Slide[] = [{ title: name, body: clean(framework.framework_tagline) || undefined, kicker: "Framework Brief" }];
  const a = framework.anchor;
  if (a && (clean(a.dream_customer) || clean(a.niche) || clean(a.single_result))) {
    out.push({ kicker: "Who this is for", title: clean(a.dream_customer) || clean(a.niche) || "Dream customer", body: clean(a.single_result) ? `Delivers: ${clean(a.single_result)}` : undefined });
  }
  if (clean(framework.origin_story)) out.push({ kicker: "Where this came from", title: "The origin story", body: clean(framework.origin_story) });
  const names = stepNames(p);
  if (names.length) out.push({ kicker: "The framework", title: `${names.length} steps`, bullets: names });
  (teaching.steps ?? []).forEach((s, i) => {
    const n = clean(s.name) || names[i] || `Step ${i + 1}`;
    ([["Story", s.story], ["Strategy", s.strategy], ["Tactics", s.tactics], ["Case Study", s.case_study]] as const).forEach(([label, v]) => {
      if (clean(v)) out.push({ kicker: `Step ${i + 1} · ${label === "Case Study" ? caseStudyLabel(s) : label}`, title: n, body: clean(v) });
    });
  });
  const v = teaching.scale_variants;
  if (v) SCALE_VARIANT_ROWS.forEach((r) => { if (clean(v[r.key])) out.push({ kicker: "Scale variant", title: r.label, body: clean(v[r.key]) }); });
  return out;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);
const paras = (s: string) => s.split(/\n{2,}/).map((b) => `<p>${esc(b).replace(/\n/g, "<br>")}</p>`).join("");

/** A self-contained printable page (white paper, serif body) for the PDF preview and print-to-PDF. */
export function buildBriefHtml(p: FrameworkProject): string {
  const { framework, teaching } = p.state;
  const name = frameworkName(p);
  const a = framework.anchor;
  const names = stepNames(p);
  const h: string[] = [`<h1>${esc(name)}</h1>`];
  if (clean(framework.framework_tagline)) h.push(`<p class="tag">${esc(clean(framework.framework_tagline))}</p>`);
  if (a) {
    if (clean(a.dream_customer) || clean(a.niche)) h.push(`<h2>Who this is for</h2>${paras(clean(a.dream_customer) || clean(a.niche))}${clean(a.dream_customer) && clean(a.niche) ? `<p><b>Niche:</b> ${esc(clean(a.niche))}</p>` : ""}`);
    if (clean(a.single_result)) h.push(`<h2>What this delivers</h2>${paras(clean(a.single_result))}`);
  }
  if (clean(framework.origin_story)) h.push(`<h2>Where this came from</h2>${paras(clean(framework.origin_story))}`);
  if (names.length) h.push(`<h2>The framework</h2><p>${esc(name)} has ${names.length} step${names.length === 1 ? "" : "s"}:</p><ol>${names.map((n) => `<li><b>${esc(n)}</b></li>`).join("")}</ol>`);
  (teaching.steps ?? []).forEach((s, i) => {
    const parts = ([["Story", s.story], ["Strategy", s.strategy], ["Tactics", s.tactics], [caseStudyLabel(s), s.case_study]] as const).filter(([, v]) => clean(v));
    if (!parts.length) return;
    h.push(`<h2 class="step">Step ${i + 1}: ${esc(clean(s.name) || names[i] || "")}</h2>${parts.map(([l, v]) => `<h3>${l}</h3>${paras(clean(v))}`).join("")}`);
  });
  const v = teaching.scale_variants;
  if (v) {
    const present = SCALE_VARIANT_ROWS.filter((r) => clean(v[r.key]));
    if (present.length) h.push(`<h2 class="step">Scale variants</h2>${present.map((r) => `<h3>${r.label}</h3>${paras(clean(v[r.key]))}`).join("")}`);
  }
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(name)}</title><style>
    @page { margin: 22mm 20mm; }
    html { background: #e9e9e9; }
    body { margin: 0; padding: 48px 56px; max-width: 720px; margin-inline: auto; background: #fff; color: #1a1a1a; font: 15px/1.6 Georgia, "Times New Roman", serif; }
    @media print { html { background: #fff; } body { padding: 0; max-width: none; } }
    h1 { font: 700 34px/1.15 "Sora", system-ui, sans-serif; margin: 0 0 8px; letter-spacing: -0.01em; }
    .tag { font-size: 17px; color: #555; margin: 0 0 28px; }
    h2 { font: 700 20px/1.3 "Sora", system-ui, sans-serif; margin: 34px 0 10px; }
    h2.step { border-top: 1px solid #ddd; padding-top: 26px; break-before: auto; }
    h3 { font: 600 13px/1.4 system-ui, sans-serif; text-transform: uppercase; letter-spacing: .08em; color: #666; margin: 20px 0 4px; }
    p { margin: 0 0 12px; } ol { padding-left: 22px; } li { margin: 4px 0; }
  </style></head><body>${h.join("")}</body></html>`;
}

function saveBlob(blob: Blob, filename: string) {
  const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: filename });
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
}

export function downloadMarkdown(p: FrameworkProject, filename: string) {
  saveBlob(new Blob([buildFrameworkBriefMarkdown(p)], { type: "text/markdown;charset=utf-8" }), filename);
}

/** Builds the deck with pptxgenjs (lazy-loaded) and saves `{slug}.pptx`. */
export async function downloadPptx(p: FrameworkProject, filename: string) {
  const { default: PptxGenJS } = await import("pptxgenjs");
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  const DARK = "141414", BLUE = "0EA5E9", GREY = "A3A3A3";
  const slides = buildSlides(p);
  slides.forEach((s, i) => {
    const slide = pptx.addSlide();
    slide.background = { color: i === 0 ? DARK : "FFFFFF" };
    const fg = i === 0 ? "FFFFFF" : DARK;
    if (s.kicker) slide.addText(s.kicker.toUpperCase(), { x: 0.6, y: 0.4, w: 8.8, h: 0.4, fontSize: 11, bold: true, color: BLUE, charSpacing: 2, fontFace: "Arial" });
    slide.addText(s.title, { x: 0.6, y: i === 0 ? 1.6 : 0.85, w: 8.8, h: 1.1, fontSize: i === 0 ? 36 : 26, bold: true, color: fg, fontFace: "Arial", valign: "top" });
    if (s.body) slide.addText(s.body, { x: 0.6, y: i === 0 ? 2.9 : 2.0, w: 8.8, h: 2.9, fontSize: i === 0 ? 16 : 14, color: i === 0 ? GREY : "333333", fontFace: "Arial", valign: "top", fit: "shrink" });
    if (s.bullets) slide.addText(s.bullets.map((b, n) => ({ text: `${n + 1}.  ${b}`, options: { breakLine: true } })), { x: 0.6, y: 2.0, w: 8.8, h: 3.0, fontSize: 18, color: "333333", fontFace: "Arial", valign: "top", paraSpaceAfter: 8 });
    slide.addText(`${frameworkName(p)}  ·  ${i + 1}/${slides.length}`, { x: 0.6, y: 5.1, w: 8.8, h: 0.3, fontSize: 9, color: GREY, fontFace: "Arial" });
  });
  await pptx.writeFile({ fileName: filename });
}

export type AssetKind = "social" | "email" | "webinar" | "workshop" | "course";
export const ASSETS: { id: AssetKind; title: string; length: string; tool: string; creates: string }[] = [
  { id: "social", title: "Social posts", length: "60 seconds", tool: "Social", creates: "Ten short posts and reel hooks. Each one names the framework and teaches one step." },
  { id: "email", title: "Email sequence", length: "10 minutes", tool: "Emails", creates: "A short sequence: the origin story first, then one step per email, ending on your offer." },
  { id: "webinar", title: "Webinar / presentation", length: "60 minutes", tool: "Presentations", creates: "A slide outline with talk track: story, the strategy of every step, then the offer." },
  { id: "workshop", title: "Workshop", length: "Half a day", tool: "Presentations", creates: "A run of show with exercises. Strategy and tactics per step; the room does step 1 live." },
  { id: "course", title: "Course / program", length: "Multiple days", tool: "Training", creates: "One module per step, with lessons for story, strategy and tactics and the case study as homework." },
];

/** The hand-off brief a downstream tool would receive: framework id, steps, teaching, voice and audience, and proof status. */
export function buildAssetBrief(p: FrameworkProject, kind: AssetKind, ctx: { character?: string; voice?: string; avatar?: string }): string {
  const a = ASSETS.find((x) => x.id === kind)!;
  const f = p.state.framework;
  const steps = p.state.teaching.steps;
  const names = stepNames(p);
  const deep = kind === "workshop" || kind === "course";
  const unconfirmed = steps.filter((s) => clean(s.case_study) && evidenceOf(s, "case_study") !== "verified").map((s) => s.name);
  return [
    `Create: ${a.title} (${a.length})`,
    `What it should be: ${a.creates}`,
    "",
    `Framework: ${frameworkName(p)} (id ${p.id}, v1)`,
    clean(f.framework_tagline) && `Promise: ${clean(f.framework_tagline)}`,
    clean(f.anchor?.dream_customer) && `For: ${clean(f.anchor?.dream_customer)}`,
    clean(f.anchor?.single_result) && `Result: ${clean(f.anchor?.single_result)}`,
    ctx.character && `Attractive Character: ${ctx.character}${ctx.voice ? `, voice "${ctx.voice}"` : ""}`,
    ctx.avatar && `Customer Avatar: ${ctx.avatar}`,
    "",
    clean(f.origin_story) && `Origin story: ${clean(f.origin_story)}`,
    "",
    "Steps:",
    ...names.map((n, i) => {
      const s = steps[i];
      const lines = [`${i + 1}. ${n}`];
      if (clean(s?.strategy)) lines.push(`   Why: ${clean(s?.strategy)}`);
      if (deep && clean(s?.tactics)) lines.push(`   How: ${clean(s?.tactics).replace(/\n/g, " ")}`);
      return lines.join("\n");
    }),
    "",
    unconfirmed.length ? `Do not present as real results: the case studies for ${unconfirmed.join(", ")} are illustrative and unconfirmed.` : "All case studies are confirmed by the author.",
  ].filter((l): l is string => typeof l === "string").join("\n").replace(/\n{3,}/g, "\n\n").trim();
}
