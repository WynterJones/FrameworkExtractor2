/**
 * Export drawer: a right slide-out sheet (70% of the viewport on desktop, full
 * width on phones) with three formats — Markdown, PDF, PowerPoint. The left rail
 * picks the format; the body shows a live preview of that format built from the
 * project, with one "Download" button above it.
 *   Markdown: the .md source in a monospace pane (headings and bold tinted).
 *   PDF: the printable brief rendered in an iframe as white paper; Download
 *   calls the iframe's print dialog (Save as PDF).
 *   PowerPoint: the slide list as 16:9 thumbnails; Download builds the .pptx
 *   client-side with pptxgenjs.
 */
import { useMemo, useRef, useState } from "react";
import { Download, FileText, FileType2, Loader2, Presentation } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { buildFrameworkBriefMarkdown, slugify } from "@/lib/framework/brief";
import { buildBriefHtml, buildSlides, downloadMarkdown, downloadPptx } from "@/lib/framework/export";
import type { FrameworkProject } from "@/types";

type Format = "markdown" | "pdf" | "pptx";

const FORMATS: { id: Format; label: string; ext: string; Icon: typeof FileText; blurb: string }[] = [
  { id: "markdown", label: "Markdown", ext: ".md", Icon: FileText, blurb: "Plain text with headings. Paste it into Notion, a doc, or a prompt." },
  { id: "pdf", label: "PDF", ext: ".pdf", Icon: FileType2, blurb: "A clean printed brief to hand to a client or keep on file." },
  { id: "pptx", label: "PowerPoint", ext: ".pptx", Icon: Presentation, blurb: "A 16:9 deck, one slide per step and component. Opens in Keynote and Slides too." },
];

export function ExportDrawer({ project, open, onOpenChange }: { project: FrameworkProject; open: boolean; onOpenChange: (o: boolean) => void }) {
  const [format, setFormat] = useState<Format>("markdown");
  const [busy, setBusy] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const md = useMemo(() => buildFrameworkBriefMarkdown(project), [project]);
  const html = useMemo(() => buildBriefHtml(project), [project]);
  const slides = useMemo(() => buildSlides(project), [project]);
  const current = FORMATS.find((f) => f.id === format)!;

  const download = async () => {
    if (format === "markdown") { downloadMarkdown(project); toast.success(`Saved ${slugify(project.title)}.md`); return; }
    if (format === "pdf") { frame.current?.contentWindow?.focus(); frame.current?.contentWindow?.print(); return; }
    setBusy(true);
    try { await downloadPptx(project); toast.success(`Saved ${slugify(project.title)}.pptx`); }
    catch (e) { toast.error(`PowerPoint export failed: ${(e as Error).message}`); }
    finally { setBusy(false); }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 border-l border-white/[0.08] bg-card p-0 sm:max-w-none md:w-[70vw]">
        <SheetHeader className="shrink-0 space-y-0.5 border-b border-border/60 px-6 py-4 text-left">
          <SheetTitle className="font-display text-lg">Export {project.title}</SheetTitle>
          <SheetDescription>Pick a format, check the preview, then download.</SheetDescription>
        </SheetHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <nav aria-label="Export format" className="flex shrink-0 gap-1 overflow-x-auto border-b border-border/60 p-2 md:w-56 md:flex-col md:border-b-0 md:border-r md:p-3">
            {FORMATS.map(({ id, label, ext, Icon }) => (
              <button key={id} type="button" aria-pressed={format === id} onClick={() => setFormat(id)} className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${format === id ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
                <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md border ${format === id ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-background/40"}`}><Icon className="h-4 w-4" /></span>
                <span className="flex flex-col leading-tight"><span>{label}</span><span className="text-[11px] font-normal text-muted-foreground">{ext}</span></span>
              </button>
            ))}
          </nav>

          <div className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-5 py-3">
              <p className="min-w-0 text-sm text-muted-foreground">{current.blurb}</p>
              <Button size="sm" className="h-9" onClick={() => void download()} disabled={busy}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download {current.ext}
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto bg-background/60 px-5 pb-6">
              {format === "markdown" && (
                <pre className="whitespace-pre-wrap rounded-xl border border-border/60 bg-background p-5 font-mono text-[12.5px] leading-relaxed text-foreground/90">
                  {md.split("\n").map((line, i) => (
                    <span key={i} className={/^#{1,3} /.test(line) ? "font-semibold text-primary" : line === "---" ? "text-muted-foreground" : /^\d+\. \*\*/.test(line) ? "text-foreground" : undefined}>{line}{"\n"}</span>
                  ))}
                </pre>
              )}
              {format === "pdf" && (
                <iframe ref={frame} title="PDF preview" srcDoc={html} className="h-full min-h-[70vh] w-full rounded-xl border border-border/60 bg-[#e9e9e9]" />
              )}
              {format === "pptx" && (
                <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {slides.map((s, i) => (
                    <li key={i} className={`relative flex aspect-video flex-col overflow-hidden rounded-lg border p-4 shadow-sm ${i === 0 ? "border-white/10 bg-[#141414] text-white" : "border-black/10 bg-white text-[#1a1a1a]"}`}>
                      {s.kicker && <p className="mb-1 text-[9px] font-bold uppercase tracking-[0.12em] text-primary">{s.kicker}</p>}
                      <h4 className={`font-display font-bold leading-tight ${i === 0 ? "text-lg" : "text-[15px]"}`}>{s.title}</h4>
                      {s.body && <p className={`mt-1.5 line-clamp-4 text-[10.5px] leading-snug ${i === 0 ? "text-white/60" : "text-[#444]"}`}>{s.body}</p>}
                      {s.bullets && <ol className="mt-1.5 list-decimal pl-4 text-[10.5px] leading-snug text-[#444]">{s.bullets.map((b, n) => <li key={n}>{b}</li>)}</ol>}
                      <span className={`absolute bottom-2 right-3 text-[8px] ${i === 0 ? "text-white/40" : "text-black/35"}`}>{i + 1}/{slides.length}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
