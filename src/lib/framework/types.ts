/**
 * Framework Extractor — shared TypeScript contract.
 *
 * Mirrors the production One2Many `fe_projects` row: `setup` and `state` are
 * JSON columns. Every layer imports from here — storage, the fake Creative
 * Director, the list page, the workspace page and its components.
 *
 * Two phases, one continuous chat:
 *   • Phase 1 — `framework-hypothesis` — 5 stages (Anchor, Origin Story,
 *     Hypothesis, Naming The Steps, Naming The Framework).
 *   • Phase 2 — `teach-framework` — Story / Strategy / Tactics / Case Study
 *     for every named step, then scale variants.
 *
 * The chat AI emits `<fe-state>` JSON patches; the client merges them into
 * `state` so the right-hand pane fills in live. See `protocol.ts`.
 */

export type FrameworkSource =
  | "ai-interview"
  | "voice-note"
  | "brain-dump"
  | "recorded-session"
  | "empty";

export type StageStatus = "pending" | "active" | "done";
export type ProjectPhase = 1 | 2;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  /** The in-thread Phase 1 → Phase 2 divider card. */
  phase_divider?: boolean;
}

/** Who the framework is extracted for, in whose voice. Picked in the setup bar. */
export interface FrameworkSetup {
  character_id?: string | null;
  voice_id?: string | null;
  customer_avatar_id?: string | null;
}

export interface FrameworkAnchor {
  niche: string;
  dream_customer: string;
  single_result: string;
}

export interface NamedStep {
  from: string;
  to: string;
}

export type FrameworkStageKey =
  | "anchor"
  | "origin"
  | "hypothesis"
  | "naming_steps"
  | "naming_framework";

export const FRAMEWORK_STAGE_KEYS: readonly FrameworkStageKey[] = [
  "anchor",
  "origin",
  "hypothesis",
  "naming_steps",
  "naming_framework",
] as const;

export interface FrameworkData {
  anchor?: FrameworkAnchor | null;
  origin_story?: string | null;
  raw_steps?: string[];
  named_steps?: NamedStep[];
  framework_name?: string | null;
  framework_tagline?: string | null;
  stages: Record<FrameworkStageKey, StageStatus>;
}

export type TeachingComponentKey = "story" | "strategy" | "tactics" | "case_study";

export const TEACHING_COMPONENT_KEYS: readonly TeachingComponentKey[] = [
  "story",
  "strategy",
  "tactics",
  "case_study",
] as const;

export interface TeachingStep {
  name: string;
  story?: string | null;
  strategy?: string | null;
  tactics?: string | null;
  case_study?: string | null;
  components: Record<TeachingComponentKey, StageStatus>;
}

export interface ScaleVariants {
  sixty_second?: string | null;
  ten_minute?: string | null;
  sixty_minute?: string | null;
  half_day?: string | null;
  multi_day?: string | null;
}

export interface TeachingData {
  current_step: number;
  steps: TeachingStep[];
  scale_variants?: ScaleVariants | null;
}

export interface FrameworkProjectState {
  phase: ProjectPhase;
  chat_messages: ChatMessage[];
  framework: FrameworkData;
  teaching: TeachingData;
}

/** The `framework_project` entity row (plus the platform-managed id/timestamps). */
export interface FrameworkProject {
  id: string;
  title: string;
  source: FrameworkSource;
  setup: FrameworkSetup;
  state: FrameworkProjectState;
  created_at: string;
  updated_at: string;
}

export const DEFAULT_FRAMEWORK_TITLE = "Untitled Framework";

export function initialFrameworkState(): FrameworkProjectState {
  return {
    phase: 1,
    chat_messages: [],
    framework: {
      anchor: null,
      origin_story: null,
      raw_steps: [],
      named_steps: [],
      framework_name: null,
      framework_tagline: null,
      stages: {
        anchor: "active",
        origin: "pending",
        hypothesis: "pending",
        naming_steps: "pending",
        naming_framework: "pending",
      },
    },
    teaching: { current_step: 1, steps: [], scale_variants: null },
  };
}

export function blankTeachingStep(name: string): TeachingStep {
  return {
    name,
    story: null,
    strategy: null,
    tactics: null,
    case_study: null,
    components: { story: "pending", strategy: "pending", tactics: "pending", case_study: "pending" },
  };
}
