// Mock of overskill.entities.<name> (overskill-sdk EntityClient), backed by localStorage.
// Same method names and row shape as the real thing so a prototype's data code
// survives the move to OverSkill with only the import changing.
// ponytail: whole-collection read/write per call; fine under a few thousand rows.

export interface EntityRow {
  id: string;
  created_at: string;
  updated_at: string;
  overskill_user_id: string;
  [key: string]: unknown;
}

type Filters = Record<string, unknown>;
interface ListOpts { sort?: string; limit?: number; offset?: number; search?: string }

const PREFIX = "proto:entities:";
const uid = () => crypto.randomUUID();
const now = () => new Date().toISOString();

function read(name: string): EntityRow[] {
  try { return JSON.parse(localStorage.getItem(PREFIX + name) || "[]"); } catch { return []; }
}
function write(name: string, rows: EntityRow[]) {
  localStorage.setItem(PREFIX + name, JSON.stringify(rows));
  window.dispatchEvent(new CustomEvent("proto:entities", { detail: name }));
}
function sortRows(rows: EntityRow[], sort = "-created_at") {
  const desc = sort.startsWith("-");
  const key = desc ? sort.slice(1) : sort;
  return [...rows].sort((a, b) => {
    const x = String(a[key] ?? ""), y = String(b[key] ?? "");
    return (x < y ? -1 : x > y ? 1 : 0) * (desc ? -1 : 1);
  });
}
const latency = () => new Promise((r) => setTimeout(r, 120 + Math.random() * 200));

export class EntityClient<T extends Record<string, unknown> = Record<string, unknown>> {
  constructor(private name: string) {}

  async list(opts: ListOpts | string = {}): Promise<(T & EntityRow)[]> {
    await latency();
    const o = typeof opts === "string" ? { sort: opts } : opts;
    let rows = sortRows(read(this.name), o.sort);
    if (o.search) {
      const q = o.search.toLowerCase();
      rows = rows.filter((r) => JSON.stringify(r).toLowerCase().includes(q));
    }
    const off = o.offset ?? 0;
    return rows.slice(off, off + (o.limit ?? 100)) as (T & EntityRow)[];
  }
  async get(id: string): Promise<(T & EntityRow) | null> {
    await latency();
    return (read(this.name).find((r) => r.id === id) as T & EntityRow) ?? null;
  }
  async filter(fields: Filters, sort?: string): Promise<(T & EntityRow)[]> {
    const rows = await this.list({ sort, limit: 1000 });
    return rows.filter((r) => Object.entries(fields).every(([k, v]) => r[k] === v));
  }
  async count(fields: Filters = {}): Promise<number> {
    return (await this.filter(fields)).length;
  }
  async create(data: T): Promise<T & EntityRow> {
    await latency();
    const row = { ...data, id: uid(), created_at: now(), updated_at: now(), overskill_user_id: "proto-user" } as T & EntityRow;
    write(this.name, [...read(this.name), row]);
    return row;
  }
  async update(id: string, data: Partial<T>): Promise<T & EntityRow> {
    await latency();
    const rows = read(this.name);
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) throw new Error(`${this.name} ${id} not found`);
    rows[i] = { ...rows[i], ...data, updated_at: now() };
    write(this.name, rows);
    return rows[i] as T & EntityRow;
  }
  async delete(id: string): Promise<{ success: boolean }> {
    await latency();
    write(this.name, read(this.name).filter((r) => r.id !== id));
    return { success: true };
  }
  async bulkCreate(items: T[]): Promise<(T & EntityRow)[]> {
    const out: (T & EntityRow)[] = [];
    for (const it of items) out.push(await this.create(it));
    return out;
  }
  /** Prototype-only: load fixture rows once (no-op if the collection already has rows). */
  seed(rows: T[]): void {
    if (read(this.name).length) return;
    const t = Date.now();
    write(this.name, rows.map((r, i) => ({
      ...r, id: uid(),
      created_at: new Date(t - (rows.length - i) * 3600_000).toISOString(),
      updated_at: new Date(t - (rows.length - i) * 3600_000).toISOString(),
      overskill_user_id: "proto-user",
    })) as EntityRow[]);
  }
  /** Prototype-only: wipe the collection so seeds re-run on reload. */
  reset(): void { localStorage.removeItem(PREFIX + this.name); }
}

const cache = new Map<string, EntityClient<any>>();
/** overskill.entities.story → EntityClient("story"), like the SDK's Proxy. */
export const entities = new Proxy({} as Record<string, EntityClient<any>>, {
  get(_t, name: string) {
    if (!cache.has(name)) cache.set(name, new EntityClient(name));
    return cache.get(name)!;
  },
});

/** Subscribe to any write for live lists. Returns unsubscribe. */
export function onEntityChange(cb: (name: string) => void) {
  const h = (e: Event) => cb((e as CustomEvent).detail);
  window.addEventListener("proto:entities", h);
  return () => window.removeEventListener("proto:entities", h);
}
