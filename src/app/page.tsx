import Link from "next/link";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrandMark, Icon, type IconName } from "@/components/icon";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Pricing } from "@/features/billing/components/pricing";
import { ProductPreview } from "@/features/marketing/components/product-preview";

const useCases: { icon: IconName; title: string; body: string }[] = [
  { icon: "file", title: "Students", body: "Ask marksheets, lecture PDFs, notes, and textbooks without digging through pages." },
  { icon: "book", title: "Study rooms", body: "Bring friends into one shared room where answers stay grounded in the same library." },
  { icon: "grid", title: "Teams", body: "Turn SOPs, policies, reports, and project docs into faster internal answers." },
  { icon: "globe", title: "Websites", body: "Scrape public pages and build an assistant from your site knowledge." },
];

const steps = [
  ["01", "Add your library", "Upload PDFs and docs, paste notes, add FAQs, or import website pages."],
  ["02", "Train the room", "Relay extracts text, builds searchable chunks, and keeps source status visible."],
  ["03", "Ask together", "Use the playground or shared room to get cited answers from your own data."],
];

const faqs = [
  { q: "What is Relay for?", a: "Relay turns personal, study, team, and website knowledge into shared AI rooms. It is built for PDFs, documents, notes, FAQs, and scraped website pages." },
  { q: "Can it answer from large PDFs?", a: "Yes. Relay extracts text, chunks the document, embeds the content, and retrieves exact and semantic matches for answers. Structured counts use deterministic helpers where possible." },
  { q: "Is this only for website chatbots?", a: "No. Website assistants are one use case. The core product is shared knowledge chat for students, office workers, teams, and document-heavy workflows." },
  { q: "Do answers show sources?", a: "Yes. Playground and shared chat answers include citations when the answer uses indexed library content." },
];

function HeroDashboard() {
  return (
    <div className="relative animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="absolute -inset-x-4 -bottom-4 top-12 rounded-[2rem] bg-primary/10 blur-3xl" />
      <div className="relative overflow-hidden rounded-2xl border bg-card shadow-2xl shadow-foreground/10">
        <div className="flex items-center justify-between border-b bg-muted/40 px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-destructive/70" />
            <span className="size-2.5 rounded-full bg-amber-400" />
            <span className="size-2.5 rounded-full bg-emerald-500" />
          </div>
          <span className="text-xs text-muted-foreground">relay.app/dashboard</span>
        </div>
        <ProductPreview />
      </div>
      <Card className="absolute -bottom-8 left-4 hidden w-64 shadow-xl md:flex">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm"><Icon name="check" size={15} /> Library ready</CardTitle>
          <CardDescription>2,758 searchable chunks indexed from a marksheet PDF.</CardDescription>
        </CardHeader>
      </Card>
      <Card className="absolute -right-8 top-16 hidden w-60 shadow-xl lg:flex">
        <CardHeader>
          <CardTitle className="text-sm">Source-backed answer</CardTitle>
          <CardDescription>“There are 5,282 unique students based on indexed seat numbers.”</CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function MiniScreenshot() {
  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <div className="flex border-b">
        <aside className="hidden w-40 border-r bg-sidebar p-3 md:block">
          <div className="mb-5 flex items-center gap-2 font-semibold"><BrandMark /> Relay.</div>
          {["Overview", "Assistants", "Library", "Rooms", "Analytics"].map((item, index) => (
            <div className={`mb-1 rounded-lg px-3 py-2 text-xs ${index === 2 ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"}`} key={item}>{item}</div>
          ))}
        </aside>
        <div className="min-w-0 flex-1 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Library / Sources</p>
              <h3 className="text-xl font-semibold">Knowledge library</h3>
            </div>
            <Button size="sm"><Icon name="plus" size={14} /> Add source</Button>
          </div>
          <div className="grid gap-2">
            {[
              ["Course marksheet.pdf", "Ready", "2,758 chunks"],
              ["Science textbook notes", "Ready", "42 chunks"],
              ["Website sitemap", "Processing", "8 of 10 pages"],
            ].map(([name, status, detail]) => (
              <div className="grid grid-cols-[32px_minmax(0,1fr)_auto] items-center gap-3 rounded-lg border p-3" key={name}>
                <span className="grid size-8 place-items-center rounded-md bg-secondary text-primary"><Icon name={name.includes("Website") ? "globe" : "file"} size={15} /></span>
                <div className="min-w-0">
                  <strong className="block truncate text-sm">{name}</strong>
                  <small className="text-muted-foreground">{detail}</small>
                </div>
                <Badge variant={status === "Ready" ? "default" : "secondary"}>{status}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="overflow-hidden border-b bg-primary py-2 text-primary-foreground">
        <div className="flex w-max gap-10 whitespace-nowrap text-xs font-semibold uppercase tracking-wide [animation:relay-demo-marquee_28s_linear_infinite]">
          {Array.from({ length: 4 }).map((_, index) => (
            <span key={index}>
              Demo build for portfolio/interviews. Payments are in Stripe test mode and do not charge real money.
            </span>
          ))}
        </div>
        <style>{`
          @keyframes relay-demo-marquee {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
        `}</style>
      </div>
      <header className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-[min(1180px,calc(100%-2rem))] items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <BrandMark /> Relay<span className="text-primary">.</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-muted-foreground md:flex" aria-label="Main navigation">
            <a className="transition-colors hover:text-foreground" href="#product">Product</a>
            <a className="transition-colors hover:text-foreground" href="#workflow">Workflow</a>
            <a className="transition-colors hover:text-foreground" href="#pricing">Pricing</a>
            <a className="transition-colors hover:text-foreground" href="#questions">FAQs</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" render={<Link href="/login" />}>Log in</Button>
            <Button size="sm" render={<Link href="/signup" />}>Start free <Icon name="arrow" size={14} /></Button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-12 py-16 lg:grid-cols-[0.86fr_1.14fr] lg:items-center lg:py-24">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-700">
            <Badge variant="secondary" className="mb-5 rounded-full px-3 py-1">Shared AI rooms for real knowledge</Badge>
            <h1 className="font-heading text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl xl:text-7xl">
              Ask your PDFs, docs, and websites together.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-muted-foreground">
              Relay helps students, office workers, teams, and website owners turn scattered knowledge into shared AI rooms with source-backed answers.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" render={<Link href="/signup" />}>Create your room <Icon name="arrow" size={16} /></Button>
              <Button size="lg" variant="outline" render={<a href="#product" />}>View dashboard</Button>
            </div>
            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3 text-sm">
              {["PDFs & DOCX", "Shared rooms", "Cited answers"].map((item) => (
                <div className="rounded-xl border bg-card p-3 text-center text-muted-foreground" key={item}>{item}</div>
              ))}
            </div>
          </div>
          <HeroDashboard />
        </section>

        <section className="border-y bg-muted/30">
          <div className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-4 py-8 md:grid-cols-4">
            {useCases.map((item, index) => (
              <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${index * 80}ms` }} key={item.title}>
                <CardHeader>
                  <span className="mb-2 grid size-9 place-items-center rounded-lg bg-secondary text-primary"><Icon name={item.icon} size={18} /></span>
                  <CardTitle>{item.title}</CardTitle>
                  <CardDescription>{item.body}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        <section id="product" className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-10 py-20 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">The Product</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight">A workspace that feels like the app, because it is the app.</h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              The homepage now shows the same navigation, source cards, badges, and controls users see after signing in. No fake product universe, no mismatched colors.
            </p>
            <div className="mt-6 grid gap-3">
              {["Upload private files up to 10 MB", "Scrape websites and sitemap pages", "Track source status and answer quality"].map((item) => (
                <div className="flex items-center gap-3 text-sm" key={item}><span className="grid size-6 place-items-center rounded-full bg-secondary text-primary"><Icon name="check" size={14} /></span>{item}</div>
              ))}
            </div>
          </div>
          <MiniScreenshot />
        </section>

        <section id="workflow" className="border-y">
          <div className="mx-auto w-[min(1180px,calc(100%-2rem))] py-20">
            <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Workflow</p>
                <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight">From messy files to a useful room.</h2>
              </div>
              <p className="max-w-md text-sm leading-7 text-muted-foreground">Built for the boring but important work: uploading, indexing, asking, checking sources, and sharing.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map(([number, title, body]) => (
                <Card key={number}>
                  <CardHeader>
                    <span className="text-sm font-semibold text-primary">{number}</span>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{body}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <Pricing />

        <section id="questions" className="mx-auto grid w-[min(1180px,calc(100%-2rem))] gap-10 py-20 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">FAQs</p>
            <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Before you ship it.</h2>
            <p className="mt-4 text-muted-foreground">Straight answers for the product you are actually building.</p>
          </div>
          <Accordion className="rounded-xl border bg-card px-4">
            {faqs.map((item) => (
              <AccordionItem key={item.q} value={item.q}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        <section className="mx-auto mb-8 w-[min(1180px,calc(100%-2rem))] overflow-hidden rounded-2xl border bg-primary p-8 text-primary-foreground md:p-12">
          <div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Ready when you are</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold tracking-tight">Turn your next PDF pile into a room people can ask.</h2>
            </div>
            <Button variant="secondary" size="lg" render={<Link href="/signup" />}>Start 7-day trial <Icon name="arrow" size={16} /></Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex w-[min(1180px,calc(100%-2rem))] flex-col gap-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2 font-semibold text-foreground"><BrandMark /> Relay<span className="text-primary">.</span></Link>
          <span>Shared AI rooms for documents, websites, students, and teams.</span>
          <span>© 2026 Relay</span>
        </div>
      </footer>
    </div>
  );
}
