// Smallest check that fails if the protocol or the scripted director breaks.
// Run: npm test  (node's built-in runner; TypeScript is stripped natively)
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyFeStatePatches, extractFeStatePatches, stripFeState } from "./protocol.ts";
import { initialFrameworkState } from "./contract.ts";
import { creativeDirectorTurn, replayInterview } from "../mock/interview.ts";
import { buildFrameworkBriefMarkdown } from "./brief.ts";

test("fe-state blocks parse, strip, and merge", () => {
  const raw = 'Locked.\n\n<fe-state>\n{"framework":{"anchor":{"niche":"a","dream_customer":"b","single_result":"c"}}}\n</fe-state>';
  assert.equal(stripFeState(raw), "Locked.");
  assert.equal(stripFeState("Hello <fe-st"), "Hello");
  const next = applyFeStatePatches(initialFrameworkState(), extractFeStatePatches(raw));
  assert.equal(next.framework.stages.anchor, "done");
  assert.equal(next.framework.stages.origin, "active");
});

test("scripted interview walks Phase 1 into Phase 2 and replays deterministically", () => {
  const turns = [
    "Funnels for chiropractors; Owner with 1,200 inactive files; 40 reactivated visits in 30 days",
    "One Tuesday the schedule had four holes and I texted 20 people by hand. Nine booked.",
    "Export the inactive list; Write three text templates; Send 20 texts a day; Track replies on a whiteboard",
    "yes",
    "2",
    "The first export was a mess so I pulled it from billing instead and tagged by last visit.",
    "yes",
  ];
  const state = replayInterview(turns);
  assert.equal(state.phase, 2);
  assert.equal(state.framework.named_steps?.length, 4);
  assert.ok(state.framework.framework_name);
  assert.equal(state.teaching.steps[0].components.story, "done");
  assert.equal(state.teaching.steps[0].components.strategy, "done");
  assert.equal(state.teaching.steps[0].components.tactics, "active");
  // Same transcript, same state — what makes Regenerate honest.
  assert.deepEqual(replayInterview(turns), state);
  // Auto-fill drafts all four components of the named step in one turn.
  const reply = creativeDirectorTurn(state, 'For the framework step "Send 20 Texts", draft all four teaching components yourself');
  const after = applyFeStatePatches(state, extractFeStatePatches(reply));
  assert.ok(reply.startsWith('**Generated the full teaching for "Send 20 Texts".**'));
  assert.equal(after.teaching.steps[2].components.case_study, "done");
});

test("the markdown export derives from the project", () => {
  const state = replayInterview(["Agencies", "The founder", "A 4 day week", "March 2022, a waiting room", "Audit every hour, cut the clients, write the playbook", "yes", "yes", "Momentum", "1"]);
  const p = { id: "x", title: "Momentum", source: "ai-interview" as const, setup: {}, state, archived: false, created_at: "", updated_at: "" };
  const md = buildFrameworkBriefMarkdown(p);
  assert.ok(md.startsWith("# ") && /^1\. /m.test(md), "title and numbered steps");
});

test("the turn that completes the last teaching component also assembles the scale variants", () => {
  let state = replayInterview(["Agencies", "The founder", "A 4 day week", "March 2022, a waiting room", "Audit every hour, cut the clients, write the playbook", "yes", "yes", "Momentum", "1"]);
  assert.equal(state.phase, 2);
  for (const s of state.teaching.steps) {
    const reply = creativeDirectorTurn(state, `For the framework step "${s.name}", draft all four teaching components yourself — Story, Strategy, Tactics, and Case Study. Write each one straight into the teaching plan on the right. Use your best judgement from everything we have covered; I will review and tweak after.`);
    state = applyFeStatePatches(state, extractFeStatePatches(reply));
  }
  assert.ok(state.teaching.scale_variants?.multi_day, "variants written in the same turn as the last step");
});

test("statuses, the I-help anchor, scoped rewrites and proof labels", async () => {
  const { libraryStatus, stageIndex, unverified } = await import("./status.ts");
  const { buildFrameworkBriefMarkdown } = await import("./brief.ts");
  const { rewriteMessage } = await import("../mock/interview.ts");
  let s = applyFeStatePatches(initialFrameworkState(), extractFeStatePatches(creativeDirectorTurn(initialFrameworkState(), "I help agency owners achieve a 4-day week by systemizing delivery")));
  assert.equal(s.framework.anchor?.dream_customer, "agency owners");
  assert.equal(s.framework.anchor?.single_result, "a 4-day week");
  assert.equal(libraryStatus(s), "Discovering");
  const done = replayInterview(["a; b; c", "One Tuesday I texted 20 people by hand and nine booked.", "Export; Write; Send; Track", "yes", "2", 'For the framework step "Export", draft all four']);
  assert.equal(libraryStatus(done), "Teaching in progress");
  assert.equal(stageIndex(done), 3);
  const step = { ...done.teaching.steps[0], evidence: { case_study: "verified" as const } };
  s = { ...done, teaching: { ...done.teaching, steps: [step, ...done.teaching.steps.slice(1)] } };
  const md = buildFrameworkBriefMarkdown({ id: "x", title: "T", source: "empty", setup: {}, state: s, archived: false, created_at: "", updated_at: "" });
  assert.ok(md.includes("### Case Study\n"));
  // A rewrite is new text: verification on that component is dropped.
  s = applyFeStatePatches(s, extractFeStatePatches(creativeDirectorTurn(s, rewriteMessage("Case Study", step.name, "shorter"))));
  assert.equal(s.teaching.steps[0].evidence?.case_study, undefined);
  assert.ok(unverified(s).some((u) => u.key === "case_study"));
});

test("evidence check, milestone summary and working labels", async () => {
  const { pendingEvidence, milestoneSummary } = await import("./status.ts");
  const { workingLabel, autoFillMessage } = await import("../mock/interview.ts");
  const turns = ["a; b; c", "One Tuesday I texted 20 people by hand and nine booked.", "Export; Write; Send; Track", "yes", "2", "In March 2023 Dana, a clinic owner, booked 40 visits."];
  const s = replayInterview(turns);
  assert.deepEqual(pendingEvidence(s)?.key, "story");
  const answered = { ...s, teaching: { ...s.teaching, steps: s.teaching.steps.map((st, i) => (i === 0 ? { ...st, evidence: { story: "illustrative" as const } } : st)) } };
  assert.equal(pendingEvidence(answered), null);
  assert.match(milestoneSummary(s, 1), /^4 steps: /);
  assert.equal(workingLabel(s, autoFillMessage("Send")), "Drafting all four for Send…");
  assert.match(workingLabel(s, "anything"), /^Writing strategy for /);
});
