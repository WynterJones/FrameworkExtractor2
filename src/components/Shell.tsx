import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useSearchParams } from "react-router-dom";
import { BookOpen, Compass, Home, Library, Menu, PanelLeftClose, PanelLeftOpen, Plus, Settings, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { BrainStatus } from "@/components/BrainStatus";
import { NewFrameworkDialog } from "@/components/framework/NewFrameworkDialog";
import "@/lib/mock/data";

/**
 * Framework Extractor's own shell: a collapsible left sidebar (brand,
 * + New framework, Home, My Frameworks, Examples; Settings, the quiet Brain
 * status and the account at the bottom) beside the routed page. Nothing from
 * the MarketingSecretsAI host appears here. `?new=1` on any route opens the
 * new-framework dialog (`&example=<id>` prefills it). Under 768px the sidebar
 * is an off-canvas drawer opened from a top bar.
 */
export default function Shell() {
  const { pathname } = useLocation();
  const [search, setSearch] = useSearchParams();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsedPref, setCollapsed] = useState(() => { try { return localStorage.getItem("fe:sidebar") === "collapsed"; } catch { return false; } });
  // On a phone the sidebar is a full-width drawer, never the 56px rail.
  const collapsed = isMobile ? false : collapsedPref;
  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => { try { localStorage.setItem("fe:sidebar", collapsedPref ? "collapsed" : "open"); } catch { /* ignore */ } }, [collapsedPref]);

  const closeNew = () => setSearch((s) => { s.delete("new"); s.delete("example"); return s; });

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
  const nav: [string, string, typeof Home][] = [["/", "Home", Home], ["/frameworks", "My Frameworks", Library], ["/examples", "Examples", BookOpen]];
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-background md:flex-row">
      {/* Phone top bar: menu + brand. The sidebar slides in over the page. */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-2 md:hidden">
        <button type="button" onClick={() => setMobileOpen(true)} aria-label="Open menu" className="grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Menu className="h-5 w-5" /></button>
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-lg border border-border bg-card text-foreground"><Compass className="h-3.5 w-3.5" /></span>
          <span className="text-sm font-semibold">Framework Extractor</span>
        </Link>
        <Link to="?new=1" aria-label="New framework" className="ml-auto grid h-9 w-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"><Plus className="h-5 w-5" /></Link>
      </header>
      {isMobile && mobileOpen && <button type="button" aria-label="Close menu" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/60 md:hidden" />}

      <aside className={`${isMobile ? `fixed inset-y-0 left-0 z-50 w-72 transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}` : `relative shrink-0 transition-[width] duration-300 ${collapsed ? "w-14" : "w-60"}`} flex flex-col border-r border-white/[0.07] bg-card shadow-[inset_-1px_0_0_hsl(0_0%_0%/0.5)]`}>
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

        <nav aria-label="Framework Extractor" className={`flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto p-2 ${collapsed ? "items-center" : ""}`}>
          <Tip label="New framework">
            <Link to="?new=1" className={`mb-2 flex h-9 items-center rounded-lg bg-primary text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 ${collapsed ? "w-9 justify-center" : "gap-2 px-2.5"}`}>
              <Plus className="h-4 w-4 shrink-0" />{!collapsed && "New framework"}
            </Link>
          </Tip>
          {nav.map(([to, label, Icon]) => (
            <Tip key={to} label={label}>
              <NavLink to={to} end className={({ isActive }) => `${item} ${isActive ? active : idle}`}>
                <Icon className="h-4 w-4 shrink-0" />{!collapsed && label}
              </NavLink>
            </Tip>
          ))}
        </nav>

        <div className={`flex shrink-0 flex-col gap-1 p-2 ${collapsed ? "items-center" : ""}`}>
          <Tip label="Settings">
            <NavLink to="/settings" className={({ isActive }) => `${item} ${isActive ? active : idle}`}><Settings className="h-4 w-4 shrink-0" />{!collapsed && "Settings"}</NavLink>
          </Tip>
          {!collapsed && <BrainStatus side="top" align="start" className="self-start" />}
        </div>
        <div className={`shrink-0 border-t border-black/40 bg-gradient-to-t from-black/35 to-transparent p-3 shadow-[inset_0_1px_0_hsl(0_0%_100%/0.04)] ${collapsed ? "flex justify-center" : "flex items-center gap-2.5"}`}>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold" aria-label="Jordan Lee">J</span>
          {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-medium">Jordan Lee</p><p className="truncate text-xs text-muted-foreground">you@example.com</p></div>}
        </div>
      </aside>

      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <Outlet />
      </main>

      <NewFrameworkDialog open={search.has("new")} exampleId={search.get("example")} onClose={closeNew} />
    </div>
  );
}
