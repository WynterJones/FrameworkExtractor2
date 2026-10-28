<!-- send: editor chat · model: keep the same model as 01 · thinking: Fast · wait for: Completed card -->
Append EXACTLY the following to the end of `src/lib/framework/prompts.ts` (part 9 of 13; verbatim, nothing added, nothing reformatted):

```ts
[Repeat Story / Strategy / Tactics / Case Study for each step in the framework.]

---

[Repeat for all steps.]

---

## Scale variants

### The 60-second version
[Framework name plus step names. The post or reel.]

### The 10-minute version
[Compressed origin story plus one line per step. The podcast intro or short live.]

### The 60-minute version
[Above plus the Strategy for each step. The standard webinar shape.]

### The half-day version
[Above plus the Tactics for each step. The workshop.]

### The multi-day version
[Above plus the full Stories and Case Studies. The course or event.]

---

## Provisional flags

[List any place during the session where the AI flagged something as thin or missing. Examples:
- Step 3 has no personal Story; used a client example as fallback.
- Step 5 has no Case Study; consider refining after first teaching cycle.
- Step 2 Tactics may benefit from a deepening pass once the framework has been taught once.

Empty if nothing was flagged.]

## Next steps

This Framework Brief is the complete teaching asset. From here, the customer can:
- Use the 60-second version on social and in conversation
- Use the 10-minute version in podcast appearances and discovery calls
- Build a webinar from the 60-minute version
- Run a workshop from the half-day version
- Produce a course or event from the multi-day version
- Write a book using each step as a chapter

The Brief becomes the single source of truth that every downstream asset draws from.
\`\`\`
`;

export const FE_STATE_PROTOCOL = `# <fe-state> PROTOCOL INSTRUCTIONS

You converse naturally in markdown AND you emit structured state. At the END of any reply where you locked new structured data, emit exactly ONE block, and make it the VERY LAST thing in the message:

<fe-state>
{ ...JSON patch... }
</fe-state>

Hard rules for the block:
- It is the LAST thing in the message. Nothing comes after the closing tag.
- It is valid JSON. No trailing commas, no comments.
- ESCAPE THE USER'S PUNCTUATION. Every string value here carries the user's own words verbatim, and users quote things. A double quote inside a value must be written \" and a line break must be written \n. One bare " inside a value stops the whole block from being JSON, so nothing at all is saved even though the block looks perfect. When the user's text uses "..." around a phrase, either escape both quotes or use 「...」.
- NEVER wrap it in markdown code fences. Emit the raw tags.
- Emit it ONLY when you locked something new this turn. A pure clarifying question with nothing locked emits no block.
- "Locked" means: the text appears INSIDE a block in THIS reply. Saying "let me lock that in" / "I'll add that" / "captured" in an earlier turn saved nothing. If you proposed a Story / Strategy / Tactics / Case Study as prose and the user then approves it, your very next reply MUST carry that exact text inside the block. That approval turn is the ONLY chance to save it.
- CURRENT STATE above is the only record of what is saved. If a component has no text there, it is NOT saved, no matter what you said earlier in the conversation. Re-emit it.
- Everything BEFORE the block is the natural conversational reply the user reads. The user never sees the block.

The JSON patch — include ONLY the keys that changed this turn:

- "phase": 1 | 2 — set to 2 ONLY when Phase 1 is fully complete (the framework is named and all 5 stages are done) and you are transitioning the user into Phase 2.

- "framework": an object that may contain:
  - "anchor": { "niche": string, "dream_customer": string, "single_result": string }
  - "origin_story": string
  - "raw_steps": string[] — 3 to 7 ordered raw step descriptions. Emit the FULL array whenever it changes.

```

Done when: the file contains this text verbatim (it will not type-check until all parts are appended; that is expected).

Change only src/lib/framework/prompts.ts. Do not touch any other file.

Report: the line count of the file now, and an explicit list of anything you did NOT do.
