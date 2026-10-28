/** CRUD for the `framework_project` entity. On OverSkill only the import of `overskill` changes. */
import { overskill } from "@/lib/auth";
import { DEFAULT_FRAMEWORK_TITLE, initialFrameworkState, type FrameworkProject, type FrameworkSetup } from "./types";

const table = () => overskill.entities.framework_project;

export const listProjects = () => table().list("-updated_at") as Promise<FrameworkProject[]>;
export const getProject = (id: string) => table().get(id) as Promise<FrameworkProject | null>;

/** New projects carry the previous project's setup forward so the user does not re-pick every time. */
export async function createProject(): Promise<FrameworkProject> {
  const [prior] = await listProjects();
  const s = prior?.setup;
  const carried: FrameworkSetup = s?.character_id && s.voice_id && s.customer_avatar_id ? s : {};
  return table().create({ title: DEFAULT_FRAMEWORK_TITLE, source: "empty", setup: carried, state: initialFrameworkState() }) as Promise<FrameworkProject>;
}

export const updateProject = (id: string, patch: Partial<Pick<FrameworkProject, "title" | "source" | "setup" | "state">>) =>
  table().update(id, patch) as Promise<FrameworkProject>;

// ponytail: hard delete, matching the prototype. The PRD asks OverSkill for an `archived` flag instead.
export const deleteProject = (id: string) => table().delete(id);
