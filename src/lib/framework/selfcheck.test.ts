// Smallest check that fails if the protocol or the scripted director breaks.
// Run: npm test  (node's built-in runner; TypeScript is stripped natively)
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyFeStatePatches, extractFeStatePatches, stripFeState } from "./protocol.ts";
import { initialFrameworkState } from "./contract.ts";
import { creativeDirectorTurn, replayInterview } from "../mock/interview.ts";

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
