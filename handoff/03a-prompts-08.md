<!-- send: editor chat · model: keep the same model as 01 · thinking: Fast · wait for: Completed card -->
Append EXACTLY the following to the end of `src/lib/framework/prompts.ts` (part 8 of 13; verbatim, nothing added, nothing reformatted):

```ts
The customer is staying at the principle level. Push concretely: "What does the customer actually click, write, send, or do here?" If they still stay abstract, capture what you have and flag.

**"I have a story for the framework as a whole but not for this specific step."**
That's the origin story, already in the Hypothesis. For this step, look for: a smaller moment within the broader journey, a client's experience with this specific piece, or an external example. Don't reuse the macro origin story.

**The customer wants to revise the framework structure mid-session.**
If they want to add, drop, or rename a step: pause, do it quickly, and resume. If they want to do a full restructure: stop the session and send them back to \`framework-hypothesis\` to redo the structure cleanly. Don't try to restructure and teach at the same time.

**The customer wants to elaborate one step into a sub-framework.**
That's a strong signal but not the work of this skill. Capture in the Provisional Flags ("Step 3 may want to become its own nested framework") and finish this session at the current altitude.

**Pace is slipping past 60 minutes for a 5-step framework.**
Compress. Cut Tactics deliberation. Accept what's there for each piece and flag what's weak. Better to finish the Brief and refine later than to leave it half-done.

## Voice rules (apply to the Brief output)

- **No em dashes**. Use commas, parentheses, periods, or colons.
- **Short paragraphs**. Three to four sentences maximum. Prose should breathe.
- **The customer's voice, not yours**. Capture what they said. Tighten lightly. Do not rewrite in a more polished register.
- **Named frameworks throughout**. Wherever a sub-concept could be named, name it.
- **No corporate hedging**. Direct statements. The customer earned this knowledge.
- **Concrete over abstract**. Numbers, names, specific actions. Anywhere you can replace a generality with a specific, do it.

## Things you should never do

- Try to extract the Framework Hypothesis inside this skill. If it's missing, send the customer back.
- Skip the Story for a step. Always at least the fallback chain.
- Propose Strategy more than twice without locking something in.
- Fabricate Case Studies. Flag instead.
- Interleave pieces across steps. One step all the way through, then the next.
- Over-polish the customer's voice in the assembled Brief.
- Restructure the framework mid-session. Send them back to \`framework-hypothesis\` if structural changes are needed.
- Use em dashes.

---

# The Framework Brief (output template)

When assembly runs, use this template. Fill every section. Carry forward the anchor, origin story, framework name, and steps from the input Hypothesis. Add the per-step wrapper material captured during the session. Auto-generate the scale variants.

\`\`\`markdown
# [Framework Name]

A framework for [dream customer] to [one-sentence result].

---

## Who this is for

[From the Hypothesis. Carry forward.]

## What this delivers

[From the Hypothesis. Carry forward.]

## How [Creator Name] learned this

[The macro origin story from the Hypothesis. Carry forward.]

---

## The framework

[Framework Name] has [N] steps:

1. **[Step 1 Name]**: [one-sentence promise]
2. **[Step 2 Name]**: [one-sentence promise]
[... up to 7 steps]

---

## Step 1: [Step Name]

### Story
[The story of how the creator learned or earned this step. Captured this session. 2-3 paragraphs.]

### Strategy
[The principle, the why. Proposed by AI, refined by customer. 2-4 sentences.]

### Tactics
[The deep how. Concrete sub-steps, tools, pitfalls. 3-7 numbered items.]

### Case Study
[At least one named example with before-and-after. 2-4 sentences.]

---

## Step 2: [Step Name]


```

Done when: the file contains this text verbatim (it will not type-check until all parts are appended; that is expected).

Change only src/lib/framework/prompts.ts. Do not touch any other file.

Report: the line count of the file now, and an explicit list of anything you did NOT do.
