/**
 * Export tab: three formats — Markdown, PDF, PowerPoint. A segmented row picks
 * the format; below it a live preview of that format built from the project,
 * with one "Download" button on the right of the toolbar.
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
import { buildFrameworkBriefMarkdown, slugify } from "@/lib/framework/brief";
import { buildBriefHtml, buildSlides, downloadMarkdown, downloadPptx } from "@/lib/framework/export";
import type { FrameworkProject } from "@/types";

type Format = "markdown" | "pdf" | "pptx";

const FORMATS: { id: Format; label: string; ext: string; Icon: typeof FileText; blurb: string }[] = [
  { id: "markdown", label: "Markdown", ext: ".md", Icon: FileText, blurb: "Plain text with headings. Paste it into Notion, a doc, or a prompt." },
  { id: "pdf", label: "PDF", ext: ".pdf", Icon: FileType2, blurb: "A clean printed brief to hand to a client or keep on file." },
  { id: "pptx", label: "PowerPoint", ext: ".pptx", Icon: Presentation, blurb: "A 16:9 deck, one slide per step and component. Opens in Keynote and Slides too." },
];

export function ExportPanel({ project }: { project: FrameworkProject }) {
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
    <div className="pt-2">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Export format" className="inline-flex gap-1 rounded-xl border border-border/60 bg-background/40 p-1">
          {FORMATS.map(({ id, label, Icon }) => (
            <button key={id} type="button" aria-pressed={format === id} onClick={() => setFormat(id)} className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm transition-colors ${format === id ? "bg-muted font-semibold text-foreground" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}>
              <Icon className={`h-3.5 w-3.5 ${format === id ? "text-primary" : ""}`} />{label}
            </button>
          ))}
        </nav>
        <Button size="sm" className="h-9" onClick={() => void download()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download {current.ext}
        </Button>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{current.blurb}</p>

      {format === "markdown" && (
        <pre className="whitespace-pre-wrap rounded-xl border border-border/60 bg-background p-5 font-mono text-[12.5px] leading-relaxed text-foreground/90">
          {md.split("\n").map((line, i) => (
            <span key={i} className={/^#{1,3} /.test(line) ? "font-semibold text-primary" : line === "---" ? "text-muted-foreground" : undefined}>{line}{"\n"}</span>
          ))}
        </pre>
      )}
      {format === "pdf" && (
        <iframe ref={frame} title="PDF preview" srcDoc={html} className="h-[75vh] w-full rounded-xl border border-border/60 bg-[#e9e9e9]" />
      )}
      {format === "pptx" && (
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
  );
}
