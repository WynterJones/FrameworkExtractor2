import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Compass, LayoutDashboard, Menu, PanelLeftClose, PanelLeftOpen, Plus, Trash2, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { onEntityChange } from "@/lib/mock/entities";
import { deleteProject, listProjects } from "@/lib/framework/storage";
import type { FrameworkProject } from "@/lib/framework/contract";
import "@/lib/mock/data";

/**
 * App shell: a collapsible left sidebar (brand, Dashboard, the list of
 * frameworks with delete) beside the routed page. Collapsed state is a
 * per-browser preference. Under 768px the sidebar is an off-canvas drawer
 * opened from a top bar (menu button + brand) and closed on navigation.
 */
export default function Shell() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedPref, setCollapsed] = useState(() => { try { return localStorage.getItem("fe:sidebar") === "collapsed"; } catch { return false; } });
  // On a phone the sidebar is a full-width drawer, never the 56px rail.
  const collapsed = isMobile ? false : collapsedPref;
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  const [projects, setProjects] = useState<FrameworkProject[]>([]);
  const [pendingDelete, setPendingDelete] = useState<FrameworkProject | null>(null);

  useEffect(() => {
    const load = () => void listProjects().then(setProjects);
    load();
    return onEntityChange((n) => { if (n === "framework_project") load(); });
  }, []);
  useEffect(() => { try { localStorage.setItem("fe:sidebar", collapsedPref ? "collapsed" : "open"); } catch { /* ignore */ } }, [collapsedPref]);

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await deleteProject(pendingDelete.id);
    if (pathname === `/framework/${pendingDelete.id}`) navigate("/");
    setPendingDelete(null);
  };

  const item = `group relative flex h-9 items-center rounded-lg text-sm transition-colors ${collapsed ? "w-9 justify-center" : "gap-2.5 px-2.5"}`;
  const active = "bg-muted/70 font-medium text-foreground";
  const idle = "text-muted-foreground hover:bg-muted/40 hover:text-foreground";
  /** In the collapsed rail every item is an icon, so its title shows as a tooltip to the right. */
  const Tip = ({ label, children }: { label: string; children: React.ReactElement }) =>
    collapsed ? (
      <Tooltip delayDuration={150}>
        <TooltipTrigger asChild>{children}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
    ) : children;
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background md:flex-row">
      {/* Phone top bar: menu + brand. The sidebar slides in over the page. */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-2 md:hidden">
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Menu className="h-5 w-5" /></button>
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-card text-foreground"><Compass className="h-3.5 w-3.5" /></span>
          <span className="text-sm font-semibold">Framework Extractor</span>
        </Link>
      </header>
      {isMobile && mobileOpen && <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />}

      <aside className={`${isMobile ? `fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}` : `relative shrink-0 transition-[width] duration-300 ${collapsed ? "w-14" : "w-64"}`} flex flex-col border-r border-white/[0.07] bg-card shadow-[inset_-1px_0_0_hsl(0_0%_0%/0.5)]`}>
        <div className={`flex h-14 shrink-0 items-center border-b border-black/40 bg-gradient-to-b from-black/35 to-transparent shadow-[inset_0_-1px_0_hsl(0_0%_100%/0.04)] ${collapsed ? "justify-center" : "justify-between px-3"}`}>
          {!collapsed && (
            <Link to="/" className="flex items-center gap-2">
              <span data-app-icon className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-background text-foreground"><Compass className="h-4 w-4" /></span>
              <span className="text-sm font-semibold">Framework Extractor</span>
            </Link>
          )}
          {isMobile ? (
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close menu" className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
          ) : (
            <Tip label="Expand sidebar">
              <button type="button" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground">
                {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
              </button>
            </Tip>
          )}
        </div>

        <nav className={`flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2 ${collapsed ? "items-center" : ""}`}>
          <Tip label="Dashboard">
            <NavLink to="/" end className={({ isActive }) => `${item} ${isActive ? active : idle}`}>
              <LayoutDashboard className="h-4 w-4 shrink-0" />{!collapsed && "Dashboard"}
            </NavLink>
          </Tip>

          <div className={`mt-3 flex items-center ${collapsed ? "h-9 w-9 justify-center" : "justify-between px-2.5"}`}>
            {!collapsed && <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Frameworks</span>}
            <Tip label="New framework">
              <Link to="/" aria-label="New framework" className={`grid place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground ${collapsed ? "h-9 w-9 rounded-lg" : "h-6 w-6"}`}><Plus className="h-4 w-4" /></Link>
            </Tip>
          </div>
          {projects.length === 0 && !collapsed && <p className="px-2.5 py-2 text-xs text-muted-foreground">No frameworks yet.</p>}
          {projects.map((p) => (
            <Tip key={p.id} label={p.title}>
            <NavLink to={`/framework/${p.id}`} className={({ isActive }) => `${item} ${isActive ? active : idle}`}>
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-md text-[10px] font-semibold tabular-nums ${p.state.phase === 2 ? "bg-emerald-500/15 text-emerald-400" : "bg-muted/80 text-muted-foreground"}`}>{(p.state.framework.named_steps?.length || p.state.framework.raw_steps?.length || 0) || p.title.trim().charAt(0).toUpperCase() || "?"}</span>
              {!collapsed && <span className="min-w-0 flex-1 truncate">{p.title}</span>}
              {!collapsed && (
                <button type="button" aria-label={`Delete ${p.title}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPendingDelete(p); }} className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:text-destructive focus-visible:opacity-100 group-hover:opacity-100">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </NavLink>
            </Tip>
          ))}
        </nav>

        <div className={`shrink-0 border-t border-black/40 bg-gradient-to-t from-black/35 to-transparent p-3 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)] ${collapsed ? "flex justify-center" : "flex items-center gap-2.5"}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold" aria-label="Jordan Lee">J</span>
          {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-medium">Jordan Lee</p><p className="truncate text-xs text-muted-foreground">you@example.com</p></div>}
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>

      <AlertDialog open={!!pendingDelete} onOpenChange={(o) => { if (!o) setPendingDelete(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this framework?</AlertDialogTitle>
            <AlertDialogDescription>“{pendingDelete?.title}” and everything extracted into it will be removed. This can't be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void confirmDelete()}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
