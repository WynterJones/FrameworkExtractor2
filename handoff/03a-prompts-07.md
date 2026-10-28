<!-- send: editor chat · model: keep the same model as 01 · thinking: Fast · wait for: Completed card -->
Append EXACTLY the following to the end of `src/lib/framework/prompts.ts` (part 7 of 13; verbatim, nothing added, nothing reformatted):

```ts
- Rejects: ask one diagnostic question ("am I missing the layer underneath, or going too abstract?") and propose again. Do not propose more than twice. If the second proposal misses, ask the customer to state the principle in their own words and capture verbatim.

**Time check**: if Strategy has gone past 3 minutes, you're over-iterating. Lock in something workable and move on.

#### Tactics (2-3 minutes)

**Purpose**: Capture the concrete sub-steps that execute this step.

**Elicit with sequencing prompts**:
- "Walk me through the actual execution. What's the very first thing they do?"
- "Then?"
- "What tools or templates? What goes wrong most often?"

**Capture 3-7 concrete sub-steps**. Each should be a specific action, not a principle. "Pick one specific thing the guest has produced and read it deeply" is a tactic. "Be thoughtful" is not.

**Push past abstraction once if needed**. If the customer answers at the principle level ("you need to make sure the trust is there"), prompt: "What does that look like in practice? What does the customer actually do?"

**Capture pitfalls**. End the Tactics section by asking: "What goes wrong most often when people try this?" One or two pitfalls noted in the Brief make the tactics noticeably more useful.

**Time check**: if Tactics has gone past 4 minutes, lock in what you have and move on. You can flag in the output that this step's tactics may benefit from a future deepening pass.

#### Case Study (1-2 minutes)

**Purpose**: One named example showing this step works.

**Elicit**:
- "Who's done this step successfully? You, a client, or someone external?"
- "What was the situation before they ran this step? What did it look like after?"
- "What did they do specifically that other people skip?"

**Accept the strongest available example**. Hierarchy:
- Floor: the customer's own result with this step
- Better: a named client or student's result
- Best: an external named example (someone famous in the space the customer can point to)

**Capture in 2-4 sentences**. Name, situation, before-and-after, what they did specifically.

**If no case study exists**, flag the step in the Brief's Provisional Flags section. Do not invent one. Move on.

**End-of-step transition**: "Got Step [N] locked in. Moving to Step [N+1]."

---

### Assembly (3-5 minutes)

After all steps have all four pieces, assemble the complete Framework Brief using the template at the bottom of this skill.

**Auto-generate the scale variants from the captured material**:
- **60-second version**: framework name plus step names
- **10-minute version**: compressed origin story plus one line per step (the step name and one-sentence promise from the Hypothesis)
- **60-minute version**: 10-minute version plus the Strategy for each step
- **Half-day version**: 60-minute version plus the Tactics for each step
- **Multi-day version**: half-day version plus the full Stories and Case Studies

You don't elicit new content for the variants. They are renderings of what's already in the Brief.

**Show the Brief to the customer**. Ask: "Anything missing? Anything wrong?" Iterate once. Lock it in.

## Failure modes to watch for

**"I want to skip the Story for this step because I don't have one."**
Try the fallbacks in order (client story, external example, "what I observe"). If all three fail, flag the step in the Provisional Flags and move on. Don't let one missing Story stop the session.

**"Your proposed Strategy is exactly right."**
Good. Move on without elaborating. Don't fish for refinements when there aren't any.

**"Your proposed Strategy is wrong."**
Ask one diagnostic question, propose again. Cap at two proposals. After that, capture the customer's own framing verbatim.

**Tactics keeps drifting into Strategy.**

```

Done when: the file contains this text verbatim (it will not type-check until all parts are appended; that is expected).

Change only src/lib/framework/prompts.ts. Do not touch any other file.

Report: the line count of the file now, and an explicit list of anything you did NOT do.
