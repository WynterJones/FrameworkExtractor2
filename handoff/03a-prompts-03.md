<!-- send: editor chat · model: keep the same model as 01 · thinking: Fast · wait for: Completed card -->
Append EXACTLY the following to the end of `src/lib/framework/prompts.ts` (part 3 of 13; verbatim, nothing added, nothing reformatted):

```ts
You will use these descriptions in Stage 4 to propose names.

**Validation before moving on**:
- Between 3 and 7 steps exist
- Each step is a distinct action, not a restatement of an adjacent one

---

### Stage 4: Step Naming (about 5 minutes). AI proposes, customer refines

**Purpose**: Each step gets a Verb + Noun name. The AI does the proposing work.

For each step, do this:

1. **Summarize the step back**. Read what the customer described in one sentence: "Step 2, as I'm hearing it: the customer takes the offer they built and tests it on three to five warm leads before launching to cold traffic."

2. **Extract the action and the object**. Identify the verb (what the customer does) and the noun (what gets produced, found, changed, or built).

3. **Propose 2-3 candidate names**. Each one must be Verb + Noun, 3-5 words, and follow these rules:
   - Strong verb (Build, Test, Find, Map, Lead, Anchor, Stack, Convert, Compound)
   - Concrete noun (the thing being acted on or produced)
   - Implies the outcome of the step
   - Distinct from other steps in this framework

4. **Frame them as a menu**:
"Here are three name candidates for Step 2:
- **Test the Offer** (action-focused)
- **Validate With Warm Leads** (audience-focused)
- **Run the Five-Lead Check** (mechanism-focused)

Pick one, mix them, or tell me what's off and I'll go again."

5. **Iterate fast**. If the customer rejects all three, ask one question to clarify what's missing ("is it that 'offer' is the wrong word, or that 'test' doesn't capture what you mean?") and propose again.

Avoid: generic names ("Introduction," "Foundation," "Understanding"), names without verbs, names longer than 5 words.

**Validation before moving on**:
- Every step has a Verb + Noun name
- Each name is 3-5 words
- Each name is distinct from the others

---

### Stage 5: Framework Naming (about 5 minutes). AI proposes, customer refines

**Purpose**: Give the whole framework a proprietary name.

Same pattern as Stage 4. The AI proposes, the customer picks or refines.

**Generate candidates from three angles**:

1. **Result-implying**: a name that hints at the outcome. Examples of this pattern: "The 7-Figure Stack," "Sold-Out Launch," "Full-Practice Method."
2. **Mechanism-implying**: a name that hints at how the framework works. Examples of this pattern: "The Asymmetric Ask," "Hook Story Offer," "Reverse Funnel Method."
3. **Customer-implying**: a name that hints at who it's for. Examples of this pattern: "The Founder's Edge," "The Solo Practitioner Path," "The First-Time Author Code."

**Propose 3-5 candidates spanning at least two of the three angles**. Frame as a menu:

"Based on what we've built, here are five name candidates:
1. **[Name 1]** (result-implying)
2. **[Name 2]** (mechanism-implying)
3. **[Name 3]** (result-implying, more aspirational)
4. **[Name 4]** (customer-implying)
5. **[Name 5]** (mechanism-implying, shorter)

Which lands? Pick one, combine two, or tell me what direction to push."

**Naming rules to enforce**:
- 2-5 words
- Distinctive (avoid phrases that 50 other people in the niche use)
- Sayable (the customer should be able to say it three times in a row without flinching)
- Not borrowed (if it's already in heavy use by someone else, push for differentiation)

**Iterate**: If the customer doesn't love any candidate, ask one question ("are we too clinical, too aspirational, too long?") and generate a second round.

**Validation before moving on**:
- The name is 2-5 words
- The customer is comfortable saying it
- It is not a phrase already owned heavily by someone else in their space

---

### Stage 6: Generate the Hypothesis Document

Assemble everything from Stages 1-5 into the output document using the template at the bottom of this skill.


```

Done when: the file contains this text verbatim (it will not type-check until all parts are appended; that is expected).

Change only src/lib/framework/prompts.ts. Do not touch any other file.

Report: the line count of the file now, and an explicit list of anything you did NOT do.
