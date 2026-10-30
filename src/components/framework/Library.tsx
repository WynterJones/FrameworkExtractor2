/** Framework list pieces: the live project list, display helpers, the per-framework menu (sidebar), the resume card (Home). */
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { Archive, ArchiveRestore, ArrowRight, Copy, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { onEntityChange } from "@/lib/mock/entities";
import { deleteProject, duplicateProject, listProjects, updateProject } from "@/lib/framework/storage";
import { progress, STAGES, stageIndex } from "@/lib/framework/status";
import { clean } from "@/lib/framework/brief";
import { DEFAULT_FRAMEWORK_TITLE, provisionalTitle, type FrameworkProject } from "@/lib/framework/contract";

export function useProjects() {
  const [projects, setProjects] = useState<FrameworkProject[] | null>(null);
  useEffect(() => {
    const load = () => void listProjects().then(setProjects);
    load();
    return onEntityChange((n) => { if (n === "framework_project") load(); });
  }, []);
  return projects;
}

/** The title is the name (the workspace adopts the framework name into it once); legacy "Untitled Framework" reads as a dated provisional name. */
export const displayTitle = (p: FrameworkProject) => (p.title.trim() === DEFAULT_FRAMEWORK_TITLE ? provisionalTitle(new Date(p.created_at)) : p.title.trim() || provisionalTitle(new Date(p.created_at)));
export const promise = (p: FrameworkProject) => clean(p.state.framework.framework_tagline) || clean(p.state.framework.anchor?.single_result) || "Just started. The interview will shape the promise.";
const updated = (p: FrameworkProject) => `Updated ${formatDistanceToNow(new Date(p.updated_at), { addSuffix: true })}`;

function Progress({ value }: { value: number }) {
  return <div className="h-1 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${value}%` }} /></div>;
}

/** Rename / Duplicate / Archive / Delete for one framework. Deleting or archiving the open one returns Home. */
export function FrameworkMenu({ p, className = "", children }: { p: FrameworkProject; className?: string; children?: React.ReactNode }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const leaveIfOpen = () => { if (pathname === `/framework/${p.id}`) navigate("/"); };
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(p.title);
  const [deleting, setDeleting] = useState(false);
  const stop = (e: React.SyntheticEvent) => { e.preventDefault(); e.stopPropagation(); };
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger onClick={stop} aria-label={`Actions for ${displayTitle(p)}`} className={`grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground ${className}`}><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          {children}
          <DropdownMenuItem onSelect={() => { setName(displayTitle(p)); setRenaming(true); }}><Pencil className="h-3.5 w-3.5" /> Rename</DropdownMenuItem>
          <DropdownMenuItem onSelect={async () => { const c = await duplicateProject(p); toast.success("Duplicated", { action: { label: "Open", onClick: () => navigate(`/framework/${c.id}`) } }); }}><Copy className="h-3.5 w-3.5" /> Duplicate</DropdownMenuItem>
          <DropdownMenuItem onSelect={async () => { await updateProject(p.id, { archived: !p.archived }); if (!p.archived) leaveIfOpen(); toast(p.archived ? "Restored" : "Archived"); }}>{p.archived ? <><ArchiveRestore className="h-3.5 w-3.5" /> Restore</> : <><Archive className="h-3.5 w-3.5" /> Archive</>}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setDeleting(true)}><Trash2 className="h-3.5 w-3.5" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={renaming} onOpenChange={setRenaming}>
        <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
          <DialogHeader><DialogTitle>Rename framework</DialogTitle></DialogHeader>
          <form onSubmit={async (e) => { e.preventDefault(); if (!name.trim()) return; await updateProject(p.id, { title: name.trim() }); setRenaming(false); }}>
            <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus aria-label="Framework name" />
            <DialogFooter className="mt-4"><Button type="button" variant="ghost" onClick={() => setRenaming(false)}>Cancel</Button><Button type="submit" disabled={!name.trim()}>Save</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <AlertDialog open={deleting} onOpenChange={setDeleting}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this framework?</AlertDialogTitle>
            <AlertDialogDescription>"{displayTitle(p)}" and everything extracted into it will be removed. This can't be undone. Archive it instead to keep it out of the way.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => { leaveIfOpen(); void deleteProject(p.id); }}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** The one prominent "pick up where you left off" card. */
export function ContinueCard({ p }: { p: FrameworkProject }) {
  const stage = stageIndex(p.state);
  const pct = progress(p.state);
  return (
    <section aria-label="Continue working" className="relative overflow-hidden rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.09] via-card to-card p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">Continue working</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 max-w-xl">
          <h2 className="font-display text-xl font-semibold tracking-tight">{displayTitle(p)}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{promise(p)}</p>
        </div>
        <Button asChild className="h-10"><Link to={`/framework/${p.id}`}>Continue <ArrowRight className="h-4 w-4" /></Link></Button>
      </div>
      <div className="mt-5 grid gap-2">
        <ol className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
          {STAGES.map((s, i) => <li key={s} className={i < stage ? "text-emerald-400" : i === stage ? "font-semibold text-foreground" : "text-muted-foreground"}>{i + 1} {s}</li>)}
        </ol>
        <Progress value={pct} />
        <p className="text-xs text-muted-foreground">Stage {stage + 1} of 5 · {pct}% done · {updated(p)}</p>
      </div>
    </section>
  );
}
