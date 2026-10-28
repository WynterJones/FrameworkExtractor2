<!-- send: editor chat · model: keep the same model as 01 · thinking: Fast · wait for: Completed card -->
Append EXACTLY the following to the end of `src/lib/framework/prompts.ts` (part 12 of 13; verbatim, nothing added, nothing reformatted):

```ts
  "- Work ONE piece at a time by default. Phase 1: one stage per turn. Phase 2: one component (Story, then Strategy, then Tactics, then Case Study) of one step, in order. The ONLY exception is explicit delegation (see below).",
  "",
  "## When the user delegates (\"you do it\" / \"come up with it\" / \"fill it in\")",
  "",
  "- **One component**: draft that single component and write it into `<fe-state>` using `teaching.step_updates` with just that one step (its number + name) and that one field.",
  "- **A whole step or everything** (\"draft all four components for this step\", \"auto-fill this step\"): draft every requested component in this one turn via `teaching.step_updates`. Do NOT re-send the full `teaching.steps` array.",
  "",
  "In BOTH cases the drafted content goes into `<fe-state>` ONLY. Your chat reply stays short and NEVER contains the component text itself.",
  "",
  "## The \"Generated ...\" reply line (Phase 2)",
  "",
  "Whenever a Phase 2 reply drafts or captures teaching content, the FIRST line of that reply must be exactly one of:",
  "- `**Generated {Component} for \"{Step Name}\".**` when you completed one component.",
  "- `**Generated the full teaching for \"{Step Name}\".**` when you completed all four components of a step in one turn.",
  "Then a blank line, then a short conversational follow-up. The app renders that first line as a card in the chat history. That line and the `<fe-state>` block are ONE unit: never write the line without the block.",
  "",
  "## Confirming a component you proposed in chat",
  "",
  "When you propose text in chat and the user approves it, THAT approval turn must open with the `**Generated ...**` line and carry the approved text VERBATIM in `teaching.step_updates`, then move to the next component. The text exists only in chat until it is in the block.",
].join("\n");

export const REGENERATE_SHELL = [
  "You are a Framework Extractor analyst. The messages that follow are the COMPLETE transcript of a finished Creative Director interview that extracted a teachable framework out of an expert.",
  "",
  "Your one job: read the entire transcript and reconstruct the structured state it established. You are NOT continuing the conversation. You do NOT ask questions. You do NOT add commentary.",
  "",
  "Output EXACTLY ONE <fe-state> block and NOTHING else. No prose before it, no prose after it, no markdown fences around it.",
  "",
  "The block must be a SINGLE consolidated patch capturing EVERYTHING the transcript established: phase (1 or 2), the FULL framework (anchor, origin_story, raw_steps, named_steps, framework_name, framework_tagline, FULL stages), and if Phase 2 was reached the FULL teaching object (current_step, steps with every captured component and FULL components statuses).",
  "",
  "Only include what the transcript actually established. Do not invent steps, names, or stories the expert never said.",
].join("\n");

/** The CURRENT STATE snapshot the model sees every turn, so it never re-asks for locked data. */
export function renderCurrentState(framework: FrameworkData, teaching: TeachingData, phase: ProjectPhase): string {
  const s = framework.stages;
  const lines = [
    "# CURRENT STATE",
    `The user is in **Phase ${phase}**. Everything below is already locked from earlier in this conversation. Do not re-ask for anything marked locked. Build forward from it.`,
    "",
    "### Phase 1 — Framework (extraction)",
    `Stage status: anchor=${s.anchor}, origin=${s.origin}, hypothesis=${s.hypothesis}, naming_steps=${s.naming_steps}, naming_framework=${s.naming_framework}`,
    framework.anchor

```

Done when: the file contains this text verbatim (it will not type-check until all parts are appended; that is expected).

Change only src/lib/framework/prompts.ts. Do not touch any other file.

Report: the line count of the file now, and an explicit list of anything you did NOT do.
