/**
 * Entities. One interface per OverSkill entity; the column list is the
 * contract the platform's database must match. Nested JSON shapes live in
 * src/lib/framework/contract.ts and are NOT entities.
 */
import type { FrameworkProjectState, FrameworkSetup, FrameworkSource } from "@/lib/framework/contract";

/** framework_project — one row per framework a user is extracting. user_scoped. */
export interface FrameworkProject {
  id: string;
  title: string;
  source: FrameworkSource;
  setup: FrameworkSetup;
  state: FrameworkProjectState;
  archived: boolean;
  created_at: string;
  updated_at: string;
}
