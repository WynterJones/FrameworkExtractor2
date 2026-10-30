/**
 * The scripted Creative Director. Stands in for the Claude call behind
 * POST /api/ai/framework-chat. It is a PURE function of (state, user text):
 * same inputs, same reply — which is what lets Regenerate replay a transcript.
 *
 * Output is the raw assistant text the real endpoint would stream: markdown
 * prose, then (when something was locked) ONE trailing <fe-state> block.
 * The real system prompt it imitates lives in src/lib/framework/prompts.ts.
 */
import {
  applyFeStatePatches,
  extractFeStatePatches,
  normalizeTeaching,
  type FeStatePatch,
} from "../framework/protocol.ts";
import {
  blankTeachingStep,
  initialFrameworkState,
  TEACHING_COMPONENT_KEYS,
  type FrameworkAnchor,
  type FrameworkProjectState,
  type ScaleVariants,
  type TeachingComponentKey,
  type TeachingStep,
} from "../framework/contract.ts";

const block = (patch: FeStatePatch) => `\n\n<fe-state>\n${JSON.stringify(patch)}\n</fe-state>`;

const splitLines = (t: string) =>
  t.split(/\n+|;|\s\|\s/).map((s) => s.replace(/^\s*(?:\d+[.)]|[-•*])\s*/, "").trim()).filter(Boolean);

const sentences = (t: string) => t.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean);

const titleCase = (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase());

const approves = (t: string) => /^(y(es|ep|eah)?|ok(ay)?|sure|go|good|great|perfect|love it|that works|that captures it|move on|lock it( in)?|agreed|done|👍)[.! ]*$/i.test(t.trim()) || /^\s*[1-5]\s*$/.test(t);

const delegates = (t: string) => /\b(you (do|write|draft|decide) it|come up with|fill it in|draft it|you write|your call|auto-?fill)\b/i.test(t);

const AUTO_FILL_RE = /^For the framework step "(.+?)", draft all four/i;
export const autoFillMessage = (name: string) => `For the framework step "${name}", draft all four teaching components yourself — Story, Strategy, Tactics, and Case Study. Write each one straight into the teaching plan on the right. Use your best judgement from everything we have covered; I will review and tweak after.`;

export type RewriteMode = "regenerate" | "shorter" | "more tactical" | "more like my voice";
const REWRITE_RE = /^Rewrite the (Story|Strategy|Tactics|Case Study) for "(.+?)"(?:: (regenerate|shorter|more tactical|more like my voice))?/i;
/** A scoped rewrite request from the teaching editor: one component of one step. */
export const rewriteMessage = (label: string, step: string, mode: RewriteMode) => `Rewrite the ${label} for "${step}": ${mode}.`;

function parseAnchor(t: string): FrameworkAnchor {
  // The new-framework prompt: "I help [who] achieve [result] by [how]".
  const m = t.trim().match(/^I help (.+?) (?:achieve|get|to|reach|go from) (.+?)(?:,? by (.+?))?\.?$/i);
  if (m) return { niche: m[3] ? `${m[3]} for ${m[1]}` : m[1], dream_customer: m[1], single_result: m[2] };
  let parts = splitLines(t);
  if (parts.length < 3) parts = sentences(t);
  const [niche = t.trim(), dream = parts[0] ?? t.trim(), result = parts[1] ?? dream] = parts;
  return { niche, dream_customer: dream, single_result: result };
}

function parseSteps(t: string): string[] {
  let parts = splitLines(t);
  if (parts.length < 2) parts = t.split(/,?\s+(?:and )?then\s+|,\s+/i).map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) parts = sentences(t);
  return parts.slice(0, 7);
}

/** Deterministic Verb + Noun proposal for a raw step description. */
export function proposeStepName(raw: string): string {
  const STOP = /^(and|or|by|from|on|onto|into|at|with|for|of|a|an|the|to|so|that|until|per)$/i;
  const words = raw.replace(/^(they|you|we|i|then|first|next|finally|the customer|the client)\s+/i, "").replace(/[.,;:!?]+$/, "").split(/\s+/).filter(Boolean);
  const cut = words.findIndex((w, i) => i > 0 && STOP.test(w));
  let pick = (cut === -1 ? words : words.slice(0, cut)).slice(0, 4);
  if (pick.length < 2) pick = words.filter((w) => !STOP.test(w)).slice(0, 3);
  return titleCase(pick.join(" ")) || "Name This Step";
}

export function proposeFrameworkNames(anchor: FrameworkAnchor | null | undefined, stepCount: number): string[] {
  const key = titleCase((anchor?.niche ?? "Growth").split(/\s+/).find((w) => w.length > 3) ?? "Growth");
  return [`The ${key} Stack`, `The ${stepCount}-Step ${key} Method`, `${key} Momentum`, `The ${key} Operator's Path`, `The Compounding ${key} System`];
}

export function proposeStrategy(step: TeachingStep, anchor: FrameworkAnchor | null | undefined): string {
  const who = (anchor?.dream_customer ?? "").split(/(?<=[a-z])[,.]\s/i)[0]?.trim().replace(/^the /i, "the ") || "your dream customer";
  return `${step.name} works because ${who} is drowning in options, not short on them. Doing this step first removes the decisions that quietly stall everything downstream. Skip it and every later step costs twice as much effort for half the result.`;
}

function draftStory(step: TeachingStep, anchor: FrameworkAnchor | null | undefined): string {
  return `I learned ${step.name} the hard way. Early on, working in ${anchor?.niche ?? "this space"}, I kept skipping straight to the exciting part and watching the result fall over three weeks later.\n\nThe turning point was one client call where I finally forced myself to do this step first. It felt slow. By the next session the problem we had been fighting for a month was simply gone. That is when it became a rule, not a preference.`;
}
function draftTactics(step: TeachingStep): string {
  return `1. Block 45 minutes and do ${step.name} before anything else that week.\n2. Write the output down in one page, in plain language a newcomer could follow.\n3. Share that page with one person who will push back, and revise once.\n4. Set a 7-day check-in to confirm the step actually stuck.\n\nPitfall: treating this as a one-time task. It is a habit, and the second pass is where the value shows up.`;
}
// Never a factual claim: the draft is labelled until the user swaps in a real client and confirms it.
function draftCaseStudy(step: TeachingStep, anchor: FrameworkAnchor | null | undefined): string {
  return `Illustrative example (replace with a real client before you publish): a client in ${anchor?.niche ?? "the same niche"} arrived stuck for six months. We ran ${step.name} in a single session, and within three weeks the metric they cared about moved for the first time that year. The only thing that changed was doing this step on purpose instead of hoping it happened on its own.`;
}

const COMPONENT_LABEL: Record<TeachingComponentKey, string> = { story: "Story", strategy: "Strategy", tactics: "Tactics", case_study: "Case Study" };

const STORY_Q = (name: string) => `Tell me about the specific time you figured out **${name}**. What were you doing, what did not work first, and what was the moment it clicked?`;

function scaleVariants(state: FrameworkProjectState): ScaleVariants {
  const name = state.framework.framework_name ?? "The framework";
  const steps = state.teaching.steps;
  const names = steps.map((s, i) => `${i + 1}. ${s.name}`).join("\n");
  const origin = (state.framework.origin_story ?? "").split(/(?<=[.!?])\s+/).slice(0, 2).join(" ");
  const sixty = `${name}:\n${names}`;
  const ten = `${origin}\n\n${steps.map((s, i) => `${i + 1}. ${s.name}: ${(s.strategy ?? "").split(/(?<=[.!?])\s+/)[0] ?? ""}`).join("\n")}`;
  return {
    sixty_second: sixty,
    ten_minute: ten,
    sixty_minute: `${ten}\n\n${steps.map((s) => `**${s.name}** — ${s.strategy ?? ""}`).join("\n\n")}`,
    half_day: `${ten}\n\n${steps.map((s) => `**${s.name}**\nStrategy: ${s.strategy ?? ""}\nTactics:\n${s.tactics ?? ""}`).join("\n\n")}`,
    multi_day: `${ten}\n\n${steps.map((s) => `**${s.name}**\nStory: ${s.story ?? ""}\nStrategy: ${s.strategy ?? ""}\nTactics:\n${s.tactics ?? ""}\nCase study: ${s.case_study ?? ""}`).join("\n\n")}`,
  };
}

/** The scale variants if `update` completes the last open component, else nothing. Lets the turn that finishes the plan assemble them too. */
function variantsIfComplete(state: FrameworkProjectState, update: Partial<TeachingStep> & { step: number }): { scale_variants: ScaleVariants } | Record<string, never> {
  const steps = state.teaching.steps.map((s, i) => (i === update.step - 1 ? { ...s, ...update } : s));
  const done = steps.length > 0 && steps.every((s) => TEACHING_COMPONENT_KEYS.every((k) => (s[k] ?? "").trim()));
  return done && !state.teaching.scale_variants?.sixty_second ? { scale_variants: scaleVariants({ ...state, teaching: { ...state.teaching, steps } }) } : {};
}

function phase1Turn(state: FrameworkProjectState, text: string | null): string {
  const f = state.framework;
  if (!f.anchor) {
    if (text === null) {
      return `Let's pull this framework out of your head. You already have it, you just have not named it yet.\n\nFirst, the **anchor**. Give me three lines: the niche this lives in (three levels deep, not "marketing"), the one dream customer you can picture, and the single result they get. One result, one sentence.`;
    }
    const anchor = parseAnchor(text);
    return `Good, that is specific enough to aim at. Locked.\n\nNow the **origin story**. What were you doing when you first realized this worked? Give me one specific scene: the room, the failure before it, the moment it changed.` +
      block({ framework: { anchor, stages: { anchor: "done", origin: "active", hypothesis: "pending", naming_steps: "pending", naming_framework: "pending" } } });
  }
  if (!(f.origin_story ?? "").trim()) {
    if (text === null) return `Pick up where we left off: what is the specific scene where this framework was earned?`;
    return `That is a real scene, and it has a before and after. Locked.\n\nNow the **steps**. A brand new person shows up wanting that result and knows nothing. What is the first thing you tell them to do? And then what? Keep going until they have it. List them in order.` +
      block({ framework: { origin_story: text.trim(), stages: { anchor: "done", origin: "done", hypothesis: "active", naming_steps: "pending", naming_framework: "pending" } } });
  }
  if ((f.raw_steps ?? []).length === 0 || ((f.raw_steps ?? []).length < 3 && (f.named_steps ?? []).length === 0 && text && parseSteps(text).length)) {
    if (text === null) return `Walk me through the steps, in order, from a newcomer's first move to the finished result.`;
    const steps = [...(f.raw_steps ?? []), ...parseSteps(text)].slice(0, 7);
    if (steps.length < 3) {
      return `I have ${steps.length} so far. That is too high an altitude. What happens between step 1 and the result that you are skipping over? Add the steps you glossed.` +
        block({ framework: { raw_steps: steps, stages: { ...f.stages, hypothesis: "active" } } });
    }
    const menu = steps.map((s, i) => `${i + 1}. ${s} → **${proposeStepName(s)}**`).join("\n");
    return `That is a real framework: ${steps.length} distinct steps, sequenced. Locked.\n\nNow each step gets a Verb + Noun name that earns its own teaching slot. Here is my proposal for each:\n\n${menu}\n\nSay yes to take these, or type your own names, one per line.` +
      block({ framework: { raw_steps: steps, stages: { ...f.stages, hypothesis: "done", naming_steps: "active" } } });
  }
  if ((f.named_steps ?? []).length === 0) {
    const raw = f.raw_steps ?? [];
    if (text === null) return `Shall we go with those step names, or do you want to rework them?`;
    const typed = splitLines(text);
    const names = !approves(text) && typed.length >= raw.length ? typed.slice(0, raw.length) : raw.map(proposeStepName);
    const named = raw.map((from, i) => ({ from, to: names[i] }));
    const candidates = proposeFrameworkNames(f.anchor, raw.length);
    const menu = candidates.map((c, i) => `${i + 1}. **${c}**${i === 0 ? " (result-implying)" : i === 1 ? " (mechanism-implying)" : i === 3 ? " (customer-implying)" : ""}`).join("\n");
    return `Those names are sayable and distinct. Locked.\n\nLast stage of Phase 1: the **framework name**. Based on everything we have built, here are five candidates:\n\n${menu}\n\nWhich lands? Pick a number, combine two, or type your own.` +
      block({ framework: { named_steps: named, stages: { ...f.stages, naming_steps: "done", naming_framework: "active" } } });
  }
  // naming_framework
  if (text === null) return `Which of the name candidates lands for you?`;
  const candidates = proposeFrameworkNames(f.anchor, (f.named_steps ?? []).length);
  const pick = text.trim().match(/^\s*([1-5])\b/);
  const name = pick ? candidates[Number(pick[1]) - 1] : approves(text) ? candidates[0] : text.trim().replace(/^["']|["']$/g, "");
  const steps: TeachingStep[] = (f.named_steps ?? []).map((s, i) => ({ ...blankTeachingStep(s.to), components: { story: i === 0 ? "active" : "pending", strategy: "pending", tactics: "pending", case_study: "pending" } }));
  const first = steps[0]?.name ?? "Step 1";
  return `**${name}**. That is the framework. Phase 1 is complete: anchor, origin, ${steps.length} named steps, and a name you can stamp on the deck.\n\nNow we add the teaching layer. For each step we capture a Story, the Strategy, the Tactics, and a Case Study. About 8 minutes per step.\n\nStep 1, **${first}**. ${STORY_Q(first)}` +
    block({ phase: 2, framework: { framework_name: name, framework_tagline: `A ${steps.length}-step framework`, stages: { anchor: "done", origin: "done", hypothesis: "done", naming_steps: "done", naming_framework: "done" } }, teaching: { current_step: 1, steps } });
}

function phase2Turn(state: FrameworkProjectState, text: string | null): string {
  const t = normalizeTeaching(state.teaching);
  const anchor = state.framework.anchor;
  const steps = t.steps;
  if (steps.length === 0) return `Before we build the teaching layer you need the named steps from Phase 1. Head back up and finish those first.`;

  const auto = text?.match(AUTO_FILL_RE);
  if (auto) {
    const idx = steps.findIndex((s) => s.name.toLowerCase() === auto[1].toLowerCase());
    const step = steps[idx === -1 ? t.current_step - 1 : idx];
    const num = steps.indexOf(step) + 1;
    const update = { step: num, name: step.name, story: step.story || draftStory(step, anchor), strategy: step.strategy || proposeStrategy(step, anchor), tactics: step.tactics || draftTactics(step), case_study: step.case_study || draftCaseStudy(step, anchor) };
    const extra = variantsIfComplete(state, update);
    const tail = "scale_variants" in extra ? "That completes every step. The brief is ready in Export." : "Review it on the right, then say when you are ready for the next step.";
    return `**Generated the full teaching for "${step.name}".**\n\n${tail}` +
      block({ teaching: { current_step: num, step_updates: [update], ...extra } });
  }

  const rw = text?.match(REWRITE_RE);
  if (rw) {
    const key = (Object.keys(COMPONENT_LABEL) as TeachingComponentKey[]).find((k) => COMPONENT_LABEL[k].toLowerCase() === rw[1].toLowerCase())!;
    const i = Math.max(0, steps.findIndex((s) => s.name.toLowerCase() === rw[2].toLowerCase()));
    const step = steps[i];
    const mode = (rw[3]?.toLowerCase() ?? "regenerate") as RewriteMode;
    const fresh = key === "story" ? draftStory(step, anchor) : key === "strategy" ? proposeStrategy(step, anchor) : key === "tactics" ? draftTactics(step) : draftCaseStudy(step, anchor);
    const cur = (step[key] ?? "").trim() || fresh;
    const value = mode === "shorter" ? sentences(cur).slice(0, 2).join(" ")
      : mode === "more tactical" ? `${cur}\n\nDo this first:\n${draftTactics(step).split("\n").slice(0, 2).join("\n")}`
      : mode === "more like my voice" ? cur.replace(/\byou\b/g, "I").replace(/\bYou\b/g, "I")
      : fresh;
    return `**Rewrote ${COMPONENT_LABEL[key]} for "${step.name}" (${mode}).**` + block({ teaching: { step_updates: [{ step: i + 1, name: step.name, [key]: value }] } });
  }

  const idx = steps.findIndex((s) => TEACHING_COMPONENT_KEYS.some((k) => !(s[k] ?? "").trim()));
  if (idx === -1) {
    if (!t.scale_variants?.sixty_second) {
      return `Every step has all four pieces. I assembled the scale variants (60-second through multi-day) from the material we captured; they are in the brief. Anything missing or wrong? Otherwise download the brief and go teach it.` +
        block({ teaching: { scale_variants: scaleVariants(state) } });
    }
    return `The brief is complete. Download it as Markdown or PowerPoint, or keep editing any field on the right. If you want to deepen a step, say which one.`;
  }
  const step = steps[idx];
  const num = idx + 1;
  const key = TEACHING_COMPONENT_KEYS.find((k) => !(step[k] ?? "").trim())!;
  const next = (k: TeachingComponentKey, s: TeachingStep, n: number) => {
    if (k === "story") return `Now the **Tactics** for ${s.name}. Walk me through the actual execution: what is the very first thing they do, then what, what tools, and what goes wrong most often?`;
    if (k === "strategy") return `Now the **Tactics** for ${s.name}. Walk me through the actual execution: what is the very first thing they do, then what, what tools, and what goes wrong most often?`;
    if (k === "tactics") return `Last piece for ${s.name}: a **Case Study**. Who has done this step successfully, you, a client, or someone external? What did it look like before and after?`;
    const after = steps[n];
    return after ? `Got Step ${n} locked in. Moving to Step ${n + 1}, **${after.name}**. ${STORY_Q(after.name)}` : `Got Step ${n} locked in. That was the last step, so I assembled the five scale variants (60-second through multi-day) from everything we captured; they are in the brief.`;
  };

  if (text === null) {
    if (key === "strategy") return `Based on your story, here is what I think the underlying principle is:\n\n${proposeStrategy(step, anchor)}\n\nDoes that capture it, or is the deeper why something else?`;
    return key === "story" ? STORY_Q(step.name) : next(key === "tactics" ? "strategy" : "tactics", step, num);
  }

  let value: string;
  if (delegates(text)) {
    value = key === "story" ? draftStory(step, anchor) : key === "strategy" ? proposeStrategy(step, anchor) : key === "tactics" ? draftTactics(step) : draftCaseStudy(step, anchor);
  } else if (key === "strategy") {
    if (approves(text)) value = proposeStrategy(step, anchor);
    else if (text.trim().length < 25) return `Am I missing the layer underneath, or going too abstract? Tell me in a sentence and I will propose again, or just state the principle in your own words.`;
    else value = text.trim();
  } else {
    if (text.trim().length < 15) return `Give me one specific moment, not a generalization. A place, a decision, an action.`;
    value = text.trim();
  }

  const lead = `**Generated ${COMPONENT_LABEL[key]} for "${step.name}".**`;
  const follow = key === "story"
    ? `Based on that, here is what I think the underlying **Strategy** is:\n\n${proposeStrategy(step, anchor)}\n\nDoes that capture it, or is the deeper why something else?`
    : next(key, step, num);
  const nextStep = key === "case_study" && steps[num] ? num + 1 : num;
  const update = { step: num, name: step.name, [key]: value };
  return `${lead}\n\n${follow}` + block({ teaching: { current_step: nextStep, step_updates: [update], ...variantsIfComplete(state, update) } });
}

export interface QuickReplies { title?: string; choice?: boolean; options: { label: string; send: string }[] }

/** Tap-to-answer suggestions for the current point in the interview. The composer always stays open for a free answer. */
export function quickReplies(state: FrameworkProjectState): QuickReplies | null {
  const f = state.framework;
  if (state.phase === 1) {
    if (f.stages.naming_steps === "active") return { options: [{ label: "Use these names", send: "yes" }] };
    if (f.stages.naming_framework === "active") {
      return { title: "Framework name proposals", choice: true, options: proposeFrameworkNames(f.anchor, (f.named_steps ?? []).length).map((n, i) => ({ label: n, send: String(i + 1) })) };
    }
    return null;
  }
  const t = normalizeTeaching(state.teaching);
  const step = t.steps.find((s) => TEACHING_COMPONENT_KEYS.some((k) => !(s[k] ?? "").trim()));
  if (!step) return null;
  const key = TEACHING_COMPONENT_KEYS.find((k) => !(step[k] ?? "").trim())!;
  const draft = { label: `Draft the ${COMPONENT_LABEL[key].toLowerCase()} for me`, send: "you write it" };
  const all = { label: `Generate all four for ${step.name}`, send: autoFillMessage(step.name) };
  return { options: key === "strategy" ? [{ label: "Yes, that captures it", send: "yes" }, draft, all] : [draft, all] };
}

/** One Creative Director turn. `text === null` is the free kickoff greeting. */
export function creativeDirectorTurn(state: FrameworkProjectState, text: string | null): string {
  return state.phase === 2 ? phase2Turn(state, text) : phase1Turn(state, text);
}

/** Regenerate: replay every user turn through the same deterministic director. */
export function replayInterview(userTurns: string[]): FrameworkProjectState {
  let state = initialFrameworkState();
  state = applyFeStatePatches(state, extractFeStatePatches(creativeDirectorTurn(state, null)));
  for (const t of userTurns) {
    state = applyFeStatePatches(state, extractFeStatePatches(creativeDirectorTurn(state, t)));
  }
  return state;
}
