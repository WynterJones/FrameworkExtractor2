<!-- send: editor chat · model: keep the same model as 01 · thinking: Fast · wait for: Completed card -->
Append EXACTLY the following to the end of `src/lib/framework/prompts.ts` (part 13 of 13; verbatim, nothing added, nothing reformatted):

```ts
      ? `**Anchor (locked):**\n- Niche: ${framework.anchor.niche}\n- Dream customer: ${framework.anchor.dream_customer}\n- Single result: ${framework.anchor.single_result}`
      : "Anchor: not yet captured.",
    framework.origin_story ? `**Origin story (locked):**\n${framework.origin_story}` : "Origin story: not yet captured.",
    (framework.raw_steps ?? []).length
      ? `**Raw steps (locked):**\n${(framework.raw_steps ?? []).map((x, i) => `${i + 1}. ${x}`).join("\n")}`
      : "Raw steps: not yet captured.",
    (framework.named_steps ?? []).length
      ? `**Named steps (locked):**\n${(framework.named_steps ?? []).map((x, i) => `${i + 1}. ${x.to}  (was: ${x.from})`).join("\n")}`
      : "Named steps: not yet captured.",
    framework.framework_name ? `**Framework name (locked):** ${framework.framework_name}` : "Framework name: not yet captured.",
    "",
    "### Phase 2 — Teaching plan",
  ];
  if (teaching.steps.length === 0) lines.push("No teaching steps seeded yet.");
  else {
    lines.push(`Currently working step ${teaching.current_step} of ${teaching.steps.length}.`);
    teaching.steps.forEach((st, i) => {
      const c = st.components;
      lines.push(`**Step ${i + 1}: ${st.name}** — story=${c.story}, strategy=${c.strategy}, tactics=${c.tactics}, case_study=${c.case_study}`);
      if (st.story) lines.push(`- Story: ${st.story}`);
      if (st.strategy) lines.push(`- Strategy: ${st.strategy}`);
      if (st.tactics) lines.push(`- Tactics: ${st.tactics}`);
      if (st.case_study) lines.push(`- Case study: ${st.case_study}`);
    });
  }
  return lines.join("\n");
}

export function buildChatSystemPrompt(args: { phase: ProjectPhase; framework: FrameworkData; teaching: TeachingData; voiceBlock?: string }): string {
  const skill = args.phase === 2 ? TEACH_FRAMEWORK_SKILL : FRAMEWORK_HYPOTHESIS_SKILL;
  return [
    CHAT_SHELL,
    "",
    "════════════════════════════════════════",
    `# ACTIVE SKILL — Phase ${args.phase}`,
    "════════════════════════════════════════",
    "",
    skill,
    ...(args.voiceBlock ? ["", "════════════════════════════════════════", args.voiceBlock] : []),
    "",
    "════════════════════════════════════════",
    renderCurrentState(args.framework, args.teaching, args.phase),
    "",
    "════════════════════════════════════════",
    FE_STATE_PROTOCOL,
  ].join("\n");
}

```

Done when: the file contains this text verbatim and the file type-checks.

Change only src/lib/framework/prompts.ts. Do not touch any other file.

Report: the line count of the file now, and an explicit list of anything you did NOT do.
