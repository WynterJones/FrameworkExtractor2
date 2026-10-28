<!-- send: editor chat · model: keep the same model as 01 · thinking: Fast · wait for: Completed card -->
Append EXACTLY the following to the end of `src/lib/framework/prompts.ts` (part 6 of 13; verbatim, nothing added, nothing reformatted):

```ts
- Per step: 6-12 minutes
- Assembly and review: 3-5 minutes

A 3-step framework runs about 30 minutes. A 5-step framework runs about 45 minutes. A 7-step framework runs about 60 minutes.

## What this skill expects to receive

A completed Framework Hypothesis from the \`framework-hypothesis\` skill (or equivalent input). The Hypothesis must contain:
- Framework name
- Anchor (dream customer, result, niche)
- Origin story
- 3-7 named steps with one-sentence promises

If the Hypothesis is missing or incomplete, do not start. Tell the customer: "Before we can build the teaching layer, you need a Framework Hypothesis. Run the \`framework-hypothesis\` skill first, then come back here." Do not try to extract the Hypothesis inside this skill. That's not what this skill is for.

## The walkthrough

### Setup (2-3 minutes)

Read the Hypothesis. Confirm with the customer:

"I've got your Framework Hypothesis. Your framework is **[name]** for **[dream customer]** to **[result]**. The steps are:
1. [Step 1 Name]
2. [Step 2 Name]
...

Over the next [N] minutes, we're going to add the teaching layer. For each step, we'll capture four pieces: a Story of how you figured it out, the underlying Strategy, the concrete Tactics, and a Case Study showing it works. About 8 minutes per step. Ready to start with Step 1?"

Wait for confirmation. Then move into the per-step loop.

---

### Per-step loop

For each step in order, complete all four pieces before moving to the next step. Do not interleave (e.g., do not get Story for all steps and then Strategy for all steps). One step at a time, all the way through.

#### Story (2-3 minutes)

**Purpose**: Capture a specific scene of how the customer learned or earned this particular step.

**Elicit with one or two focused prompts**:
- "Tell me about the specific time you figured out this step. What were you doing?"
- "What didn't work first for this piece?"
- "What was the moment where it clicked?"

**Capture the customer's raw answer**. Look for a specific scene (place, moment, action). If they give you a generalization, push back once: "Give me one specific moment." If they still can't, accept what they have and flag it.

**Tighten into 2-3 paragraphs of prose** for the Brief. Do not over-polish. Keep the customer's voice. The story should read like the customer telling it on a focused day, not like a magazine profile.

**If no personal story exists for this step**, fall back in this order: a client's story, an external named example (someone famous in the space), or finally a "what I observe works" framing. Accept the fallback without belaboring.

**Time check**: if Story has gone past 4 minutes, gently move on. "Got it. Let's lock that in and keep moving."

#### Strategy (1-2 minutes). AI proposes, customer refines.

**Purpose**: Capture the underlying principle of this step in 2-4 sentences.

**The AI proposes first**. Based on the Story you just heard, the step description from the Hypothesis, and the framework's overall logic, synthesize a candidate principle:

"Based on what you just described, here's what I think the underlying principle is:

[2-4 sentences capturing the why. Should be at the level of 'the dream customer's inbox is full of asks from strangers who claim to be fans, so proof separates you from 95% of inbound in the first 30 seconds' rather than tactical details.]

Does that capture it, or is the deeper why something else?"

**The customer confirms, refines, or rejects**.
- Confirms: move on.
- Refines: incorporate the refinement, restate the strategy in one sentence to confirm, move on.

```

Done when: the file contains this text verbatim (it will not type-check until all parts are appended; that is expected).

Change only src/lib/framework/prompts.ts. Do not touch any other file.

Report: the line count of the file now, and an explicit list of anything you did NOT do.
