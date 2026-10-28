/**
 * SCREEN: / — Project list.
 *
 * Header: brand mark "Framework Extractor" (compass icon) left, avatar "J"
 * right, no nav. Footer: brand + tagline, three link columns (Product:
 * Frameworks, How it works, Examples · Support: Help centre, Contact · Legal:
 * Privacy, Terms; stubs toast) and a copyright line. Hero card (centred text, no image): h1
 * "Framework Extractor", the pitch paragraph, a pill "N frameworks". Controls row:
 * primary "New Framework" button (plus icon, "Creating…" while busy) and a search
 * input ("Search frameworks…"). Then one row per framework_project: title,
 * "N steps mapped · Oct 28, 2026" (or "No steps yet"), a trash icon that swaps
 * the row for an inline confirm pane ("Delete this framework?" Cancel / Delete),
 * and a primary "Open →" button.
 *
 * Actions: New Framework → create a framework_project (title "Untitled
 * Framework", source "empty", setup copied from the most recent project when
 * complete, initial state) → navigate to /framework/:id. Delete → archived:
 * true (never a hard delete). Search filters by title on the client.
 *
 * States: loading ("Loading your frameworks…"), error (card + "Try again"),
 * empty ("Pull your first framework out of your head" + New Project),
 * no match ("No frameworks match “q”").
 */
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Boxes, Compass, Loader2, Plus, Search, Trash2 } from "lucide-react";
import AppBrand from "@/components/AppBrand";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { onEntityChange } from "@/lib/mock/entities";
import { createProject, deleteProject, listProjects } from "@/lib/framework/storage";
import type { FrameworkProject } from "@/lib/framework/contract";
import "@/lib/mock/data";

const stepCount = (p: FrameworkProject) => p.state?.framework?.named_steps?.length || p.state?.framework?.raw_steps?.length || 0;
const fmt = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

export default function Index() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<FrameworkProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setProjects(await listProjects()); } catch (e) { setError((e as Error).message || "Something went wrong."); } finally { setLoading(false); }
  };
  useEffect(() => { void load(); return onEntityChange((n) => { if (n === "framework_project") void listProjects().then(setProjects); }); }, []);

  const create = async () => {
    setCreating(true);
    try { const p = await createProject(); navigate(`/framework/${p.id}`); } catch (e) { setError((e as Error).message); setCreating(false); }
  };
  const remove = async (id: string) => {
    setDeletingId(id);
    try { await deleteProject(id); setProjects((prev) => prev.filter((p) => p.id !== id)); setPendingDelete(null); } finally { setDeletingId(null); }
  };
  const filtered = useMemo(() => { const q = search.trim().toLowerCase(); return q ? projects.filter((p) => p.title.toLowerCase().includes(q)) : projects; }, [projects, search]);

  const Empty = ({ title, body, cta }: { title: string; body: string; cta?: React.ReactNode }) => (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-foreground/[0.02] px-6 py-14 text-center">
      <span className="mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Boxes className="h-7 w-7" /></span>
      <h3 className="text-base font-bold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{body}</p>
      {cta && <div className="mt-4">{cta}</div>}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <AppBrand name="Framework Extractor" icon={<Compass className="h-5 w-5" />} />
          <span className="grid h-8 w-8 place-items-center rounded-full bg-muted text-xs font-bold" aria-label="Jordan Lee">J</span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-12 pt-6 sm:px-6 sm:pt-8">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-b from-card to-background px-6 py-10 text-center sm:py-14">
          <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/15 blur-3xl" aria-hidden />
          <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-4">
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">Framework Extractor</h1>
            <p className="text-sm leading-relaxed text-muted-foreground sm:text-[15px]">You're already the expert — you just haven't packaged it yet. The Extractor interviews you on how you actually think, work and win, then turns the pattern into a step-by-step framework you can teach, sell or scale.</p>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background/60 px-3 py-1.5 text-xs font-medium text-muted-foreground"><span className="font-semibold text-foreground tabular-nums">{projects.length}</span>{projects.length === 1 ? "framework" : "frameworks"}</span>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <Button onClick={() => void create()} disabled={creating} className="active:scale-[0.96] transition-transform duration-150">{creating ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating…</> : <><Plus className="h-3.5 w-3.5" /> New Framework</>}</Button>
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search frameworks…" aria-label="Search frameworks" className="pl-9" />
          </label>
        </div>

        <div className="mt-5">
          {loading ? (
            <p role="status" aria-live="polite" className="my-6 inline-flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your frameworks…</p>
          ) : error ? (
            <div role="alert"><Empty title="Something went wrong" body={error} cta={<Button variant="outline" onClick={() => void load()}>Try again</Button>} /></div>
          ) : projects.length === 0 ? (
            <Empty title="Pull your first framework out of your head" body="Start a project and the Extractor will interview you, then map your thinking into a framework you can teach and sell." cta={<Button onClick={() => void create()} disabled={creating}>{creating ? "Creating…" : "New Framework"}</Button>} />
          ) : filtered.length === 0 ? (
            <Empty title={`No frameworks match “${search.trim()}”`} body="Try a different search." />
          ) : (
            <ul className="space-y-2.5" aria-label="Framework projects">
              {filtered.map((p) => {
                const steps = stepCount(p);
                const confirming = pendingDelete === p.id;
                return (
                  <li key={p.id} className={`flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3.5 transition-colors ${confirming ? "border-destructive/40" : "border-border hover:border-primary/40"}`}>
                    {confirming ? (
                      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div><h4 className="text-sm font-bold">Delete this framework?</h4><p className="text-xs text-muted-foreground">“{p.title}” and everything extracted into it will be permanently removed. This can't be undone.</p></div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => setPendingDelete(null)} disabled={deletingId === p.id}>Cancel</Button>
                          <Button variant="destructive" size="sm" onClick={() => void remove(p.id)} disabled={deletingId === p.id}>{deletingId === p.id ? "Deleting…" : "Delete"}</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <Link to={`/framework/${p.id}`} className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold">{p.title}</h3>
                          <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground"><span className="tabular-nums">{steps > 0 ? `${steps} ${steps === 1 ? "step" : "steps"} mapped` : "No steps yet"}</span><span aria-hidden>·</span><span>{fmt(p.updated_at)}</span></p>
                        </Link>
                        <div className="flex items-center gap-2">
                          <button type="button" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive" aria-label={`Delete framework — ${p.title}`} onClick={() => setPendingDelete(p.id)}><Trash2 className="h-3.5 w-3.5" /></button>
                          <Button asChild size="sm" className="active:scale-[0.96] transition-transform duration-150"><Link to={`/framework/${p.id}`}>Open <ArrowRight className="h-3.5 w-3.5" /></Link></Button>
                        </div>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <AppBrand name="Framework Extractor" icon={<Compass className="h-5 w-5" />} />
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">Pull the framework out of your head. Name it. Teach it. A Creative Director interview that turns what you already do into something you can sell.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Product</h4>
              <ul className="space-y-1.5">
                <li><Link to="/" className="text-foreground/80 hover:text-foreground">Frameworks</Link></li>
                <li><button type="button" className="text-foreground/80 hover:text-foreground" onClick={() => toast("Stubbed: how it works")}>How it works</button></li>
                <li><button type="button" className="text-foreground/80 hover:text-foreground" onClick={() => toast("Stubbed: examples")}>Examples</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Support</h4>
              <ul className="space-y-1.5">
                <li><button type="button" className="text-foreground/80 hover:text-foreground" onClick={() => toast("Stubbed: help centre")}>Help centre</button></li>
                <li><button type="button" className="text-foreground/80 hover:text-foreground" onClick={() => toast("Stubbed: contact")}>Contact</button></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</h4>
              <ul className="space-y-1.5">
                <li><button type="button" className="text-foreground/80 hover:text-foreground" onClick={() => toast("Stubbed: privacy")}>Privacy</button></li>
                <li><button type="button" className="text-foreground/80 hover:text-foreground" onClick={() => toast("Stubbed: terms")}>Terms</button></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-border">
          <p className="mx-auto max-w-5xl px-4 py-4 text-xs text-muted-foreground sm:px-6">© 2026 Framework Extractor. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
