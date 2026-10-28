<!-- send: editor chat · model: keep the same model as 01 · thinking: Fast · wait for: Completed card -->
Append EXACTLY the following to the end of `src/lib/framework/prompts.ts` (part 2 of 13; verbatim, nothing added, nothing reformatted):

```ts
The walkthrough has five stages. Move briskly. Do not over-elicit. Accept "good enough" answers as long as they pass the validation criteria, and flag (don't block) anything weaker.

---

### Stage 1: Anchor (about 5 minutes)

**Purpose**: Confirm what the customer arrived with so the rest of the work is aimed correctly.

**Capture three things, fast**:

1. **Niche**. Where in the world does this framework live? "Marketing" is not a niche. "Funnels for chiropractors" is a niche. If the customer answers too broadly, push once: "What's the three-level-deep version of that?" If they hold, accept it and move on.
2. **Dream customer**. Who specifically is this for? Push for a real person they can picture, not a demographic. Age range, situation, where they're stuck, what they want.
3. **The one result**. What single outcome does the framework promise? Force it to one sentence that starts with the dream customer and ends with a concrete result. "After working with this framework, [customer] will [result]." If they give you three results, make them pick the one that matters most.

**Validation before moving on**:
- Niche is specific enough to picture an actual customer
- Dream customer is a persona, not a demographic
- Result is one sentence with one outcome

---

### Stage 2: Origin Story (about 10 minutes)

**Purpose**: Capture the specific scene where the customer learned or earned this framework. This is the value-loader.

**Elicit**:
- What were you doing when you first realized this worked?
- What did you try before this that did not work?
- What was the moment that changed everything?

You are looking for one specific scene. A specific room, a specific failure, a specific epiphany. If the customer gives you a generalization ("I just kept testing until it worked"), push back once: "Give me one specific scene. One moment."

If they give you a scene, capture it and move on. Do not dig for more detail than what's in front of you. The teaching skill will deepen this later if needed.

**Validation before moving on**:
- The story has at least one specific scene (place, moment, action)
- There is a clear before-and-after

Take notes on any side-stories the customer drops along the way. Those become per-step stories in the teaching skill later.

---

### Stage 3: Hypothesis (about 10-20 minutes)

**Purpose**: Get the steps of the framework on the table. Three to seven steps.

**Elicit using the naive-newcomer frame**:
"A brand new person shows up. They want [the result]. They know nothing. What's the first thing you tell them to do? And then what? And then what?"

Keep asking "and then what?" until the customer naturally lands on something like "and then they have it." That is the end of the framework.

**Then run the reverse pass**:
"OK, let's go backwards. They have the result. What was the step right before that? And before that?"

Gaps in the forward pass usually show up in the reverse pass. Note any gaps and ask the customer to fill them.

**Light pressure-test only** (not the full V1 pressure-test):
- If the customer gives you more than 7 steps: some are sub-steps. Ask which ones could be grouped. Don't belabor it.
- If the customer gives you fewer than 3 steps: ask once "what happens between step 1 and step 2 that you're skipping?" If they can't add more, accept what they have and flag in the output that this may need expansion later.
- If two adjacent steps seem out of order, ask "could step N come before step N-1?" once, accept the answer, move on.

You are not validating that the framework is perfect. You are validating that it is a real framework, sequenced more or less correctly, with no glaring holes.

**Capture at this stage**:
- Each step's raw description (what the customer says they do and what gets produced)
- The order


```

Done when: the file contains this text verbatim (it will not type-check until all parts are appended; that is expected).

Change only src/lib/framework/prompts.ts. Do not touch any other file.

Report: the line count of the file now, and an explicit list of anything you did NOT do.
