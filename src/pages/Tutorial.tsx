/**
 * SCREEN: /tutorial — plain-language docs for the whole flow, one scrolling
 * page. On wide screens an "On this page" list sticks on the left; each
 * section is an anchor (#start, #interview, …). Static content, no state.
 */
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Lightbulb, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOC = [
  ["what", "What it does"],
  ["start", "1. Start a framework"],
  ["interview", "2. The interview"],
  ["framework", "3. Check the framework"],
  ["teaching", "4. Build the teaching plan"],
  ["proof", "5. Mark what's real"],
  ["export", "6. Export it"],
  ["ai", "7. Turn it into anything"],
  ["manage", "Managing your frameworks"],
  ["brain", "The Brain"],
  ["faq", "Questions"],
] as const;

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} className="scroll-mt-6 space-y-3 border-t border-border/60 pt-8 text-[15px] leading-relaxed text-foreground/85">
    <h2 className="font-display text-xl font-semibold tracking-tight text-foreground">{title}</h2>
    {children}
  </section>
);
const Tip = ({ children }: { children: ReactNode }) => (
  <p className="flex gap-2.5 rounded-xl border border-primary/25 bg-primary/[0.06] px-4 py-3 text-sm"><Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><span>{children}</span></p>
);
const B = ({ children }: { children: ReactNode }) => <strong className="font-semibold text-foreground">{children}</strong>;
const PROMPTS = [
  ["A landing page", "Using this framework, write a landing page for my offer: headline, the promise, who it's for, the steps as sections, and a call to action. Give me the HTML."],
  ["An email sequence", "Turn this framework into a 7-email sequence. Email 1 tells the origin story, then one email per step, and the last one makes the offer."],
  ["A PDF guide", "Turn this framework into a polished lead-magnet guide I can save as a PDF: a cover, an intro, one page per step, and a checklist at the end."],
  ["Social posts", "Write 10 short social posts from this framework. Each one teaches a single step in my voice and ends with a question."],
  ["A webinar or workshop", "Make a 60-minute webinar outline from this framework: the story, one section per step with the talk track, then the offer."],
  ["A course", "Plan a course with one module per step. For each module list lessons for the story, strategy and tactics, and use the case study as homework."],
] as const;
const List = ({ items, ordered }: { items: ReactNode[]; ordered?: boolean }) => {
  const Tag = ordered ? "ol" : "ul";
  return <Tag className={`space-y-1.5 pl-5 ${ordered ? "list-decimal" : "list-disc"} marker:text-muted-foreground`}>{items.map((x, i) => <li key={i}>{x}</li>)}</Tag>;
};

export default function Tutorial() {
  const { hash } = useLocation();
  // The page scrolls inside the shell, so the browser does not jump to #anchors on arrival.
  useEffect(() => { if (hash) document.getElementById(hash.slice(1))?.scrollIntoView(); }, [hash]);
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-5xl gap-10 px-4 py-10 sm:px-8">
        <nav aria-label="On this page" className="sticky top-10 hidden h-fit w-48 shrink-0 lg:block">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">On this page</p>
          <ul className="space-y-1 text-sm">
            {TOC.map(([id, label]) => <li key={id}><a href={`#${id}`} className="block rounded-md px-2 py-1 text-muted-foreground hover:bg-muted/40 hover:text-foreground">{label}</a></li>)}
          </ul>
        </nav>

        <article className="min-w-0 max-w-[680px] flex-1 space-y-8">
          <header>
            <p className="text-sm font-medium text-primary">Tutorial</p>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">How to use Framework Extractor</h1>
            <p className="mt-2 text-muted-foreground">About ten minutes from a blank page to a framework you can teach. Here is every step.</p>
          </header>

          <Section id="what" title="What it does">
            <p>You already have a method: the way you get clients their result. It just lives in your head. Framework Extractor interviews you about it, turns your answers into a named framework of 3 to 7 steps, and then helps you write a teaching plan for each step.</p>
            <p>You talk on the left; the framework builds itself on the right as you go. Everything saves automatically.</p>
          </Section>

          <Section id="start" title="1. Start a framework">
            <List ordered items={[
              <>Click <B>+ New framework</B> (top of the sidebar, or on Home).</>,
              <>Describe what you do in one sentence: <B>"I help [who] achieve [result] by [how]."</B> Rough is fine.</>,
              <>Check the <B>Character</B>, <B>Voice</B> and <B>Audience</B> chips. They come from your Brain or your last framework. Click <B>Change</B> to pick others.</>,
              <>Click <B>Start extracting</B>.</>,
            ]} />
            <Tip>Not sure what to write? Pick one of the <B>Or start from an example</B> chips to see how it works first.</Tip>
          </Section>

          <Section id="interview" title="2. The interview">
            <p>The Creative Director asks one question at a time. The bar at the top of the workspace shows where you are:</p>
            <List items={[
              <><B>Discover</B>: who you help, the result, and the story of how you figured it out.</>,
              <><B>Structure</B>: the steps you take a client through, then short names for them.</>,
              <><B>Refine</B>: a name and a one-line promise for the whole framework.</>,
              <><B>Teach</B>: four pieces of teaching for every step.</>,
              <><B>Activate</B>: it's finished and ready to export.</>,
            ]} />
            <p>Along the way the chat shows cards you can click instead of typing:</p>
            <List items={[
              <><B>Step names</B>: edit any name in place, add a step, then <B>Use these names</B>.</>,
              <><B>Framework name</B>: <B>Accept</B>, <B>Refine</B> or <B>Try another</B> (up to 5 ideas).</>,
              <><B>Quick replies</B>: one-click answers like "Draft it for me".</>,
              <><B>Stage complete</B>: a green card each time a stage is done, with a link to review it.</>,
            ]} />
            <Tip>Answered something wrong? Hover your message and click the <B>pencil</B> to edit it. The interview rewinds to that point, so anything after it is rebuilt.</Tip>
          </Section>

          <Section id="framework" title="3. Check the framework">
            <p>Open the <B>Framework</B> tab on the right at any time. You can edit any text directly, move steps <B>up</B> or <B>down</B>, <B>remove</B> one, or <B>add</B> one. A framework needs at least 3 steps and at most 7.</p>
            <p>Use the layout switch in the header to see just the chat, both side by side, or just the output.</p>
          </Section>

          <Section id="teaching" title="4. Build the teaching plan">
            <p>Once the framework is locked, the <B>Teaching plan</B> tab opens. Each step gets four parts:</p>
            <List ordered items={[
              <><B>Story</B>: a moment that shows why the step matters.</>,
              <><B>Strategy</B>: the principle behind it, the why.</>,
              <><B>Tactics</B>: the how. Sub-steps, tools and pitfalls.</>,
              <><B>Case Study</B>: a real client who got the result.</>,
            ]} />
            <p>Answer in the chat, or say <B>"Draft it for me"</B>. Don't like a draft? Use <B>Rewrite</B> on that part: Regenerate, Shorter, More tactical, or More like my voice.</p>
          </Section>

          <Section id="proof" title="5. Mark what's real">
            <p>Drafted stories and case studies can sound true without being true. So each one carries a label:</p>
            <List items={[
              <><B>Verified by you</B>: this really happened.</>,
              <><B>Illustrative example</B>: a made-up example to show the idea.</>,
              <><B>Needs proof</B>: you still have to find a real one.</>,
            ]} />
            <p>Set it with <B>This really happened</B> or <B>It's illustrative</B> in the Teaching plan. When a case study mentions a specific number or result, the chat will ask you about it. Editing the text clears the label, so you confirm it again.</p>
            <Tip>Anything not verified exports with an "illustrative example" label, so you don't accidentally publish a result that never happened.</Tip>
          </Section>

          <Section id="export" title="6. Export it">
            <p>Open the <B>Export</B> tab and click <B>Download .md</B>. You get one Markdown file with the whole framework and its teaching plan. Then see the next step for what to do with it.</p>
            <p>The preview shows exactly what's in the file. An amber note warns you if any case studies are still unconfirmed.</p>
          </Section>

          <Section id="ai" title="7. Turn it into anything">
            <p>The Markdown file is built to be handed to an AI. Give it to your favorite assistant, like <B>Claude</B> or <B>ChatGPT</B>, and it can turn your framework into websites, PDFs, emails, posts, slides or a whole course, all from the same source.</p>
            <List ordered items={[
              <>In Export, click <B>Download .md</B> (or <B>Copy</B> to grab the text).</>,
              <>Open Claude, ChatGPT or any AI chat and attach the file, or paste the text.</>,
              <>Tell it what to make. Start with one of the prompts below.</>,
              <>Read what comes back and edit it so it sounds like you.</>,
            ]} />
            <ul className="grid gap-2 sm:grid-cols-2">
              {PROMPTS.map(([t, prompt]) => (
                <li key={t} className="rounded-xl border border-border/60 bg-card p-3.5">
                  <p className="text-sm font-semibold text-foreground">{t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">"{prompt}"</p>
                </li>
              ))}
            </ul>
            <Tip>The file already has your voice, your audience, your steps and which stories are real. Ask the AI to keep anything marked "illustrative example" out of public copy until you swap in a real client.</Tip>
          </Section>

          <Section id="manage" title="Managing your frameworks">
            <p>Every framework is listed in the sidebar, newest first. Hover one and click <B>…</B> to <B>Rename</B>, <B>Duplicate</B>, <B>Archive</B> or <B>Delete</B> it. The same menu is in the workspace header, along with <B>Regenerate everything</B>, which rebuilds the framework from your conversation.</p>
            <p>Archived frameworks are under <B>Archived</B> at the bottom of the list, and you can restore them from there.</p>
          </Section>

          <Section id="brain" title="The Brain">
            <p>The Brain is the profile you already set up: your Attractive Character, Voice, Customer Avatar, offer and past stories. Framework Extractor <B>reads</B> it so it doesn't ask you things it already knows. It never writes anything back.</p>
            <p>Click the Brain pill to see what it uses, or to disconnect. Everything still works without it; you'll just answer a few more questions.</p>
          </Section>

          <Section id="faq" title="Questions">
            <p><B>How many frameworks should I make?</B> Most people need one to three: one for their main offer, maybe one for a second audience. Make one great one first.</p>
            <p><B>Can I stop halfway?</B> Yes. Everything saves as you go. Home shows <B>Continue working</B> for the framework you left.</p>
            <p><B>Do I have to write everything myself?</B> No. Ask for a draft any time, then edit it so it sounds like you.</p>
          </Section>

          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card px-5 py-4">
            <p className="text-sm font-medium">Ready? It starts with one sentence.</p>
            <Button asChild><Link to="?new=1"><Plus className="h-4 w-4" /> New framework</Link></Button>
          </div>
        </article>
      </div>
    </div>
  );
}
