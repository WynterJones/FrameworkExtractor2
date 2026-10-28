<!-- send: editor chat · model: keep the same model as 01 · thinking: Fast · wait for: Completed card -->
Append EXACTLY the following to the end of `src/lib/framework/prompts.ts` (part 10 of 13; verbatim, nothing added, nothing reformatted):

```ts
  - "named_steps": [{ "from": string, "to": string }] — each raw step renamed to a Verb + Noun. Emit the FULL array whenever it changes.
  - "framework_name": string
  - "framework_tagline": string — optional one-liner, e.g. "5-step structure".
  - "stages": { "anchor": status, "origin": status, "hypothesis": status, "naming_steps": status, "naming_framework": status } — each status is "pending" | "active" | "done". ALWAYS emit the FULL stages object reflecting current status whenever you touch the framework.

- "teaching": an object that may contain:
  - "current_step": number — 1-indexed pointer to the step being worked.
  - "steps": [{ "name": string, "story"?: string, "strategy"?: string, "tactics"?: string, "case_study"?: string, "components": { "story": status, "strategy": status, "tactics": status, "case_study": status } }] — the FULL ordered list, one entry per framework step. Emit this ONLY to SEED the plan at the Phase 1 -> Phase 2 transition (one entry per named step, every component "pending"). Do NOT re-send the whole array on later turns — use "step_updates" instead. Each "components" status is "pending" | "active" | "done".
  - "step_updates": [{ "step": number, "name": string, "story"?: string, "strategy"?: string, "tactics"?: string, "case_study"?: string }] — the PREFERRED way to write teaching content after the plan is seeded. Include ONLY the step(s) you actually drafted or changed THIS turn, each identified by BOTH its 1-based "step" number AND its "name" (send both so the app writes to the correct step). Send only the component text fields you wrote this turn; omit the others. The app merges these into the existing plan and never drops steps you do not mention, so a single short block is enough — never re-list completed steps. Do NOT send "components" statuses here; the app derives them from the text.

Advancing status as the user answers:
- When you ask the question for a stage or component, that stage/component is "active".
- When the user has answered and you have locked it, that stage/component is "done".
- The next stage/component you move to becomes "active".

The Phase 1 -> Phase 2 transition:
- When all 5 Phase-1 stages (anchor, origin, hypothesis, naming_steps, naming_framework) are "done", announce the transition to the user in the conversational reply (the chat renders a divider).
- In that same turn's <fe-state> block: set "phase": 2, AND seed "teaching.steps" with one entry per named step (in framework order), every component "pending", except step 1's "story" component which is "active". Also set "teaching.current_step": 1.
- Use each named step's "to" name as the teaching step "name".

Worked example of a transition turn's block (SEED — the full steps array):
<fe-state>
{ "phase": 2, "framework": { "framework_name": "The Asymmetric Ask", "stages": { "anchor": "done", "origin": "done", "hypothesis": "done", "naming_steps": "done", "naming_framework": "done" } }, "teaching": { "current_step": 1, "steps": [ { "name": "Lead With Proof", "components": { "story": "active", "strategy": "pending", "tactics": "pending", "case_study": "pending" } }, { "name": "Offer the Unequal Trade", "components": { "story": "pending", "strategy": "pending", "tactics": "pending", "case_study": "pending" } } ] } }
</fe-state>

Worked example of drafting later (a per-step delta — NOT the whole array). After auto-filling step 2 you emit only step 2:
<fe-state>
{ "teaching": { "current_step": 2, "step_updates": [ { "step": 2, "name": "Offer the Unequal Trade", "story": "...the story text...", "strategy": "...the strategy text...", "tactics": "...the tactics text...", "case_study": "...the case study text..." } ] } }
</fe-state>
`;

export const FE_REPAIR_INSTRUCTION = `SYSTEM CORRECTION (the user did not send this).


```

Done when: the file contains this text verbatim (it will not type-check until all parts are appended; that is expected).

Change only src/lib/framework/prompts.ts. Do not touch any other file.

Report: the line count of the file now, and an explicit list of anything you did NOT do.
