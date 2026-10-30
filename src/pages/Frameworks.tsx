/** SCREEN: /frameworks — the full library: search, status filter, sort, archived kept apart. */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { displayTitle, FrameworkCard, promise, useProjects } from "@/components/framework/Library";
import { libraryStatus, progress } from "@/lib/framework/status";
import { PageHeader } from "./Index";

const FILTERS = ["All", "Discovering", "Needs review", "Teaching in progress", "Ready", "Archived"] as const;
type Sort = "updated" | "name" | "progress";

export default function Frameworks() {
  const all = useProjects();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [sort, setSort] = useState<Sort>("updated");
  const list = (all ?? [])
    .filter((p) => (filter === "Archived" ? p.archived : !p.archived && (filter === "All" || libraryStatus(p.state) === filter)))
    .filter((p) => `${displayTitle(p)} ${promise(p)}`.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => sort === "name" ? displayTitle(a).localeCompare(displayTitle(b)) : sort === "progress" ? progress(b.state) - progress(a.state) : b.updated_at.localeCompare(a.updated_at));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 sm:px-8 sm:py-10">
        <PageHeader title="My Frameworks"><Button asChild className="h-10"><Link to="?new=1"><Plus className="h-4 w-4" /> New framework</Link></Button></PageHeader>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search frameworks" aria-label="Search frameworks" className="h-9 pl-9" />
          </div>
          <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
            <SelectTrigger className="h-9 w-40" aria-label="Sort"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="updated">Last updated</SelectItem><SelectItem value="name">Name</SelectItem><SelectItem value="progress">Progress</SelectItem></SelectContent>
          </Select>
        </div>
        <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs transition-colors ${filter === f ? "border-primary/50 bg-primary/15 font-medium text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
        </div>
        {all === null ? null : list.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{list.map((p) => <FrameworkCard key={p.id} p={p} />)}</div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border px-6 py-14 text-center text-sm text-muted-foreground">{all.length ? "Nothing matches. Try another filter or search." : "No frameworks yet."}</p>
        )}
      </div>
    </div>
  );
}
