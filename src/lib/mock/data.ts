/**
 * Fixtures. `overskill.entities.framework_project.seed(rows)` runs once at
 * module load (no-op when the collection already has rows). The three
 * setup rosters (Attractive Characters, Voices, Customer Avatars) are
 * read-only lists the host platform supplies in production.
 */
import { overskill } from "@/lib/auth";
import { initialFrameworkState, type ChatMessage, type FrameworkProject, type FrameworkProjectState } from "@/lib/framework/contract";

export interface AttractiveCharacter { id: string; name: string; description: string }
export interface Voice { id: string; character_id: string; name: string; description: string }
export interface CustomerAvatar { id: string; name: string; description: string }

export const CHARACTERS: AttractiveCharacter[] = [
  { id: "ac_1", name: "Jordan Lee", description: "Founder voice, direct, first-person" },
  { id: "ac_2", name: "The Reluctant Hero", description: "Figured it out the hard way, shares the scars" },
  { id: "ac_3", name: "The Leader", description: "Already there, pulling people up" },
];
export const VOICES: Voice[] = [
  { id: "v_1", character_id: "ac_1", name: "Straight talk", description: "Short sentences, no hedging" },
  { id: "v_2", character_id: "ac_1", name: "Campfire", description: "Warm, story-led" },
  { id: "v_3", character_id: "ac_2", name: "Confessional", description: "Candid about the failures" },
  { id: "v_4", character_id: "ac_3", name: "Keynote", description: "Confident, declarative" },
];
export const AVATARS: CustomerAvatar[] = [
  { id: "av_1", name: "Agency owner at $30k/mo", description: "Stuck at 5 clients, doing all the delivery" },
  { id: "av_2", name: "First-time course creator", description: "Has the expertise, no product yet" },
  { id: "av_3", name: "Solo chiropractor", description: "Full book, no systems, wants a second location" },
];

type Row = Omit<FrameworkProject, "id" | "created_at" | "updated_at">;

const msg = (role: ChatMessage["role"], content: string, i: number, extra?: Partial<ChatMessage>): ChatMessage => ({
  id: `seed_${i}`,
  role,
  content,
  created_at: new Date(Date.now() - (40 - i) * 60_000).toISOString(),
  ...extra,
});

const momentumState: FrameworkProjectState = {
  phase: 2,
  chat_messages: [
    msg("assistant", "Let's pull this framework out of your head. You already have it, you just have not named it yet.\n\nFirst, the **anchor**. Give me three lines: the niche, the one dream customer you can picture, and the single result they get.", 1),
    msg("user", "Done-for-you marketing agencies doing $20k to $50k a month\nThe founder who still runs every client call and has not taken a real week off in two years\nAfter this, the founder runs the agency from a 4-day week with delivery handled by the team", 2),
    msg("assistant", "Good, that is specific enough to aim at. Locked.\n\nNow the **origin story**. What were you doing when you first realized this worked?", 3),
    msg("user", "March 2022, I was on a client call from a hospital waiting room because my daughter had broken her arm. The client was asking me to redo a landing page myself. I said yes. That night I wrote down every task I had touched that week and 80% of it was work someone on my team could do if I had ever written down how.", 4),
    msg("assistant", "That is a real scene, and it has a before and after. Locked.\n\nNow the **steps**. A brand new founder shows up wanting that result. What is the first thing you tell them to do? And then what?", 5),
    msg("user", "1. Audit every hour for two weeks and tag what only you can do\n2. Cut the clients and services that need you personally\n3. Write the one-page playbook for each remaining service\n4. Hand each playbook to one owner on the team and stop attending those calls\n5. Add a weekly scorecard and only step in when a number is red", 6),
    msg("assistant", "That is a real framework: 5 distinct steps, sequenced. Locked. Here is my proposal for each name:\n\n1. **Audit the Calendar**\n2. **Cut the Dependence**\n3. **Anchor the Playbook**\n4. **Hand Off the Owner Seat**\n5. **Scale by Scorecard**", 7),
    msg("user", "yes", 8),
    msg("assistant", "Those names are sayable and distinct. Locked.\n\nLast stage of Phase 1: the **framework name**. Five candidates:\n\n1. **The 4-Day Agency**\n2. **The Momentum Method**\n3. **Founder Off the Floor**\n4. **The Owner's Exit Ramp**\n5. **Delegate by Design**", 9),
    msg("user", "2", 10),
    msg("system", "Framework locked", 11, { phase_divider: true }),
    msg("assistant", "**The Momentum Method**. That is the framework. Phase 1 is complete.\n\nNow we add the teaching layer. Step 1, **Audit the Calendar**. Tell me about the specific time you figured out this step.", 12),
    msg("user", "The hospital waiting room night. I printed my calendar for the previous two weeks and went through it with a highlighter. Yellow for things only I could do. There was almost no yellow.", 13),
    msg("assistant", "**Generated Story for \"Audit the Calendar\".**\n\nBased on that, here is what I think the underlying **Strategy** is: founders defend their calendar by feel, and feel always says everything is essential. Two weeks of tagged hours replaces feel with evidence. Does that capture it?", 14),
    msg("user", "yes", 15),
    msg("assistant", "**Generated Strategy for \"Audit the Calendar\".**\n\nNow the **Tactics**. Walk me through the actual execution.", 16),
    msg("user", "you write it", 17),
    msg("assistant", "**Generated Tactics for \"Audit the Calendar\".**\n\nLast piece: a **Case Study**. Who has done this step successfully?", 18),
    msg("user", "Priya, an agency owner in Toronto. 14 hours of client calls a week before, 3 after. She did the audit in a Google Sheet and found two clients accounted for half the calls.", 19),
    msg("assistant", "**Generated Case Study for \"Audit the Calendar\".**\n\nGot Step 1 locked in. Moving to Step 2, **Cut the Dependence**. Tell me about the time you figured out this step.", 20),
  ],
  framework: {
    anchor: {
      niche: "Done-for-you marketing agencies doing $20k to $50k a month",
      dream_customer: "The founder who still runs every client call and has not taken a real week off in two years",
      single_result: "After this, the founder runs the agency from a 4-day week with delivery handled by the team",
    },
    origin_story:
      "March 2022, I was on a client call from a hospital waiting room because my daughter had broken her arm. The client was asking me to redo a landing page myself. I said yes. That night I wrote down every task I had touched that week and 80% of it was work someone on my team could do if I had ever written down how.",
    raw_steps: [
      "Audit every hour for two weeks and tag what only you can do",
      "Cut the clients and services that need you personally",
      "Write the one-page playbook for each remaining service",
      "Hand each playbook to one owner on the team and stop attending those calls",
      "Add a weekly scorecard and only step in when a number is red",
    ],
    named_steps: [
      { from: "Audit every hour for two weeks and tag what only you can do", to: "Audit the Calendar" },
      { from: "Cut the clients and services that need you personally", to: "Cut the Dependence" },
      { from: "Write the one-page playbook for each remaining service", to: "Anchor the Playbook" },
      { from: "Hand each playbook to one owner on the team and stop attending those calls", to: "Hand Off the Owner Seat" },
      { from: "Add a weekly scorecard and only step in when a number is red", to: "Scale by Scorecard" },
    ],
    framework_name: "The Momentum Method",
    framework_tagline: "A 5-step framework for agency founders who want their week back",
    stages: { anchor: "done", origin: "done", hypothesis: "done", naming_steps: "done", naming_framework: "done" },
  },
  teaching: {
    current_step: 2,
    scale_variants: null,
    steps: [
      {
        name: "Audit the Calendar",
        story:
          "The hospital waiting room night. I printed my calendar for the previous two weeks and went through it with a highlighter. Yellow for things only I could do. There was almost no yellow.\n\nThat was the first time I saw the agency as a list of tasks instead of a feeling of being needed. The feeling was the problem.",
        strategy:
          "Founders defend their calendar by feel, and feel always says everything is essential. Two weeks of tagged hours replaces feel with evidence. Once the evidence exists, the next four steps stop being brave decisions and become obvious ones.",
        tactics:
          "1. Export the last two weeks of calendar and task history into one sheet.\n2. Tag every hour: Only Me, Could Train, Should Not Exist.\n3. Total the three columns. Only Me is usually under 20%.\n4. Circle the three biggest Could Train items; those become the first playbooks.\n\nPitfall: tagging from memory. Use the actual calendar, or you will flatter yourself.",
        case_study:
          "Priya, an agency owner in Toronto. 14 hours of client calls a week before, 3 after. She did the audit in a Google Sheet and found two clients accounted for half the calls. Both were on legacy pricing. She repriced one and released the other.",
        components: { story: "done", strategy: "done", tactics: "done", case_study: "done" },
      },
      { name: "Cut the Dependence", story: null, strategy: null, tactics: null, case_study: null, components: { story: "active", strategy: "pending", tactics: "pending", case_study: "pending" } },
      { name: "Anchor the Playbook", story: null, strategy: null, tactics: null, case_study: null, components: { story: "pending", strategy: "pending", tactics: "pending", case_study: "pending" } },
      { name: "Hand Off the Owner Seat", story: null, strategy: null, tactics: null, case_study: null, components: { story: "pending", strategy: "pending", tactics: "pending", case_study: "pending" } },
      { name: "Scale by Scorecard", story: null, strategy: null, tactics: null, case_study: null, components: { story: "pending", strategy: "pending", tactics: "pending", case_study: "pending" } },
    ],
  },
};

const chiroState: FrameworkProjectState = {
  ...initialFrameworkState(),
  chat_messages: [
    msg("assistant", "Let's pull this framework out of your head.\n\nFirst, the **anchor**. Give me three lines: the niche, the dream customer, and the single result.", 1),
    msg("user", "Patient reactivation for single-location chiropractors\nThe owner with 1,200 inactive patient files and a front desk that only answers the phone\nThey book 40 reactivated visits in the first 30 days without ad spend", 2),
    msg("assistant", "Good, that is specific enough to aim at. Locked.\n\nNow the **origin story**. What were you doing when you first realized this worked? One specific scene.", 3),
  ],
  framework: {
    ...initialFrameworkState().framework,
    anchor: {
      niche: "Patient reactivation for single-location chiropractors",
      dream_customer: "The owner with 1,200 inactive patient files and a front desk that only answers the phone",
      single_result: "They book 40 reactivated visits in the first 30 days without ad spend",
    },
    stages: { anchor: "done", origin: "active", hypothesis: "pending", naming_steps: "pending", naming_framework: "pending" },
  },
};

const SEED: Row[] = [
  { title: "The Momentum Method", source: "ai-interview", setup: { character_id: "ac_1", voice_id: "v_1", customer_avatar_id: "av_1" }, state: momentumState, archived: false },
  { title: "Untitled Framework", source: "ai-interview", setup: { character_id: "ac_2", voice_id: "v_3", customer_avatar_id: "av_3" }, state: chiroState, archived: false },
];

overskill.entities.framework_project.seed(SEED);
