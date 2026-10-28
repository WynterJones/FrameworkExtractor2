<!-- send: editor chat · model: keep the same model as 01 · thinking: Fast · wait for: Completed card -->
Append EXACTLY the following to the end of `src/lib/framework/prompts.ts` (part 5 of 13; verbatim, nothing added, nothing reformatted):

```ts
This is a **Framework Hypothesis**. It contains the structural bones of the framework: who it's for, what it delivers, where it came from, and the named steps in order.

It is enough to:
- Pitch the framework in 60 seconds (the name plus the step names)
- Walk through the framework in 10 minutes (origin story plus step-by-step with one-line promises)
- Validate the framework with real prospects before investing further

It is not yet:
- A complete teaching asset
- Ready to become a course, book, or multi-day event

## Next step

To turn this Hypothesis into a complete Framework Brief, run the **teach-framework** skill. That session takes 30-60 minutes and walks you through capturing the Story, Strategy, Tactics, and Case Study for each step. The result is a complete teaching asset that scales from a 60-second post to a multi-day event from the same source material.

## Provisional flags

[List anything the AI flagged as weak during the walkthrough: a niche that could be tighter, a step count at the edge of the range, a name the customer accepted but wasn't sure of. Empty if nothing was flagged.]
\`\`\`
`;

export const TEACH_FRAMEWORK_SKILL = `# Teach the Framework

## The premise (read this first, it changes everything)

The customer arrives with their Framework Hypothesis already extracted. They have a name, ordered steps, an origin story, and an anchor. What they do not yet have is the material needed to teach the framework to others.

That material has four pieces per step: a **Story** (how they learned or earned that specific step), a **Strategy** (the underlying principle, the why), **Tactics** (the concrete how-to), and a **Case Study** (proof it works).

Without these four pieces, the framework can be described but not taught. A description gets nods. A teachable framework changes how people act. The difference between "here's what I do" and "here's how to do it yourself" is exactly these four pieces, repeated for every step.

Your job in this skill is to extract those four pieces for every step in the framework, fast. Not perfect. Fast and complete enough to be teachable.

## Your role: creative director (proactive mode)

You are not interviewing. You are not transcribing. You are co-creating with the customer, with the same posture you used in the naming stages of \`framework-hypothesis\`: you propose, the customer refines.

For Story, Tactics, and Case Study, the customer drives because those come from their lived experience and you can't fabricate them. You ask sharp prompts, capture the raw answer, and tighten it into clean prose without over-polishing.

For Strategy, you drive. You synthesize what the customer just told you (the Story plus the step description plus the framework's overall logic) and propose the underlying principle in 2-4 sentences. The customer confirms or pushes back. This is the biggest time-saver in the whole session.

Move briskly. The goal is all four pieces sketched for every step, not two pieces written deeply for half the steps.

## What this skill produces

The deliverable is a complete **Framework Brief**: a single markdown document that scales from a 60-second post to a multi-day event from the same source material. It contains:

1. The anchor, origin story, framework name, and steps (carried forward from the Hypothesis)
2. **For each step**: Story, Strategy, Tactics, Case Study
3. **Scale variants**: 60-second, 10-minute, 60-minute, half-day, and multi-day versions, auto-generated from the assembled material

When the Brief is complete, the customer has, in one document, the source material for a book chapter, a webinar, a podcast episode, a course module, a keynote, and a mastermind training.

## Total time

30-60 minutes total depending on step count. Roughly:
- Setup: 2-3 minutes

```

Done when: the file contains this text verbatim (it will not type-check until all parts are appended; that is expected).

Change only src/lib/framework/prompts.ts. Do not touch any other file.

Report: the line count of the file now, and an explicit list of anything you did NOT do.
