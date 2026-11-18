"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { H2, Muted } from "@/components/ui/typography";
import { Field, Modal, Notice } from "@/components/ui";
import { Icon } from "@/components/icon";
import { Progress, ProgressLabel } from "@/components/ui/progress";
import { streamWorkspaceApi, trainSource, updateWorkspace, uploadKnowledgeFile, useWorkspace } from "@/lib/workspace";

type ScrapeResult = { title: string; content: string; sourceUrl: string; pages: number };
type ScrapeEvent = { type: "progress"; stage: string; detail: string; url: string; current: number; limit: number; title?: string; discovered?: number } | { type: "done"; result: ScrapeResult } | { type: "error"; error: string };

export function CoreKnowledge({ botId }: { botId?: string }) {
  const state = useWorkspace();
  const selectedBotId = botId || state.bots[0]?.id || "";
  const selectedBot = state.bots.find(bot => bot.id === selectedBotId);
  const sources = state.sources.filter(source => !selectedBotId || source.botId === selectedBotId);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [scrapeFeed, setScrapeFeed] = useState<Array<{ stage: string; detail: string; url: string }>>([]);
  const [deleting, setDeleting] = useState<{ id: string; title: string } | null>(null);

  async function addPdf(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedBotId) return setNotice("Create a chatbot first.");
    const form = event.currentTarget;
    const file = (new FormData(form).get("file") as File | null);
    if (!file) return;
    const id = crypto.randomUUID();
    updateWorkspace(draft => draft.sources.unshift({ id, botId: selectedBotId, title: file.name.replace(/\.(pdf|txt)$/i, ""), type: "File", content: "", filename: file.name, size: file.size, status: "Processing", updated: new Date().toISOString().slice(0, 10), progress: 1, progressStage: "Uploading document", progressDetail: "Sending the document to private storage." }));
    setBusy(true);
    try { await uploadKnowledgeFile(id, selectedBotId, file); form.reset(); setNotice("Document uploaded. Its status will update while processing."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Upload failed."); }
    finally { setBusy(false); }
  }

  async function addWebsite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedBotId) return;
    const form = event.currentTarget; const data = new FormData(form);
    setBusy(true); setNotice(""); setScrapeFeed([]); let scraped: ScrapeResult | null = null;
    try {
      await streamWorkspaceApi<ScrapeEvent>("/websites/scrape/stream", { url: String(data.get("url") || "").trim(), maxPages: Number(data.get("maxPages")) }, update => {
        if (update.type === "error") throw new Error(update.error);
        if (update.type === "done") scraped = update.result;
        else setScrapeFeed(current => [...current.slice(-14), { stage: update.stage, detail: update.detail, url: update.url }]);
      });
      if (!scraped) throw new Error("The scraper finished without returning content.");
      const result = scraped as ScrapeResult; const id = crypto.randomUUID();
      const saved = await updateWorkspace(draft => draft.sources.unshift({ id, botId: selectedBotId, title: result.title, type: "Website", content: result.content, sourceUrl: result.sourceUrl, status: "Processing", updated: new Date().toISOString().slice(0, 10) }));
      if (saved) await trainSource(id);
      form.reset(); setNotice(`Scraped and trained ${result.pages} page${result.pages === 1 ? "" : "s"}.`);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Website scraping failed."); }
    finally { setBusy(false); }
  }

  async function retrain(id: string) {
    setBusy(true);
    try { await trainSource(id); setNotice("Source retrained."); }
    catch (error) { setNotice(error instanceof Error ? error.message : "Retraining failed."); }
    finally { setBusy(false); }
  }

  function remove() {
    if (!deleting) return;
    updateWorkspace(draft => { draft.sources = draft.sources.filter(source => source.id !== deleting.id); });
    setNotice("Source deleted.");
    setDeleting(null);
  }

  return <div className="mx-auto max-w-6xl space-y-6">
    <div><H2 className="text-xl font-medium">Knowledge sources</H2><Muted className="mt-1">Add the material this chatbot is allowed to use in its answers.</Muted></div>
    {!selectedBotId ? <p className="rounded-xl border p-4 text-sm">Create a chatbot before adding knowledge.</p> : <section className={`grid gap-4 ${selectedBot?.kind === "website" ? "lg:grid-cols-2" : ""}`} aria-label="Add knowledge">
      {selectedBot?.kind === "website" && <form className="rounded-2xl border bg-card" onSubmit={addWebsite}><div className="flex items-center gap-3 border-b px-5 py-4"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon name="globe"/></span><div><h3 className="font-medium">Add website</h3><p className="text-xs text-muted-foreground">Scrape up to 15 public pages.</p></div></div><div className="space-y-4 p-5"><Field label="Website URL"><Input name="url" type="url" required maxLength={500} placeholder="https://example.com/docs" disabled={busy}/></Field><Field label="Page limit"><select name="maxPages" defaultValue="5" disabled={busy} className="h-11 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="5">5 pages</option><option value="10">10 pages</option><option value="15">15 pages</option></select></Field><Button className="w-full sm:w-auto" type="submit" disabled={busy}>{busy ? "Scraping website…" : "Add website"}</Button></div></form>}
      <form className="rounded-2xl border bg-card" onSubmit={addPdf}><div className="flex items-center gap-3 border-b px-5 py-4"><span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary"><Icon name="file"/></span><div><h3 className="font-medium">Upload document</h3><p className="text-xs text-muted-foreground">PDF or TXT, up to 5 MB.</p></div></div><div className="space-y-4 p-5"><Field label="Choose document"><Input className="h-11 file:mr-3" name="file" type="file" accept="application/pdf,text/plain,.pdf,.txt" required disabled={busy}/></Field><Button className="w-full sm:w-auto" type="submit" disabled={busy}>{busy ? "Uploading document…" : "Upload document"}</Button></div></form>
    </section>}
    {scrapeFeed.length > 0 && <section className="overflow-hidden rounded-xl border bg-slate-950 text-slate-100"><div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><h3 className="text-sm font-semibold">Live scraper activity</h3><span className="flex items-center gap-2 text-xs text-emerald-300"><span className="size-2 animate-pulse rounded-full bg-emerald-400"/>Live</span></div><div className="max-h-72 space-y-1 overflow-y-auto p-3 font-mono text-xs">{scrapeFeed.map((item, index) => <div className="grid gap-1 rounded-md px-2 py-2 hover:bg-white/5 sm:grid-cols-[8rem_1fr]" key={`${item.url}-${index}`}><span className="text-blue-300">{item.stage}</span><div className="min-w-0"><p className="truncate text-slate-300">{item.url}</p><p className="mt-0.5 text-slate-500">{item.detail}</p></div></div>)}</div></section>}
    <section className="overflow-hidden rounded-2xl border bg-card"><div className="flex items-center justify-between border-b px-5 py-4 sm:px-6"><div><h3 className="font-medium">Connected sources</h3><p className="mt-1 text-sm text-muted-foreground">{sources.length ? `${sources.filter(source => source.status === "Ready").length} of ${sources.length} ready to answer questions.` : "No knowledge has been connected yet."}</p></div><span className="rounded-full bg-muted px-2.5 py-1 text-xs tabular-nums text-muted-foreground">{sources.length}</span></div><div className="divide-y">{sources.map(source => {
      const progress = source.status === "Ready" ? 100 : Math.max(0, Math.min(100, source.progress || 0));
      return <article className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:px-6" key={source.id}>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex min-w-0 items-start gap-3"><span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground"><Icon name={source.type === "Website" ? "globe" : "file"}/></span><div className="min-w-0"><strong className="block truncate text-sm">{source.title}</strong><p className="mt-0.5 text-xs text-muted-foreground">{source.type} · <span className={source.status === "Ready" ? "text-[#9ae187]" : source.status === "Error" ? "text-destructive" : "text-[#f6c177]"}>{source.status}</span></p></div></div>
          {source.type === "File" && source.status !== "Error" && <Progress value={progress} aria-label={`${source.title} processing progress`}>
            <ProgressLabel>{source.progressStage || "Waiting to process"}</ProgressLabel><span className="ml-auto text-sm tabular-nums text-muted-foreground">{progress}%</span>
          </Progress>}
          {source.progressDetail && <p className="text-xs text-muted-foreground" aria-live="polite">{source.progressDetail}</p>}
          {!!source.totalChunks && <p className="text-xs text-muted-foreground">Chunks processed: {source.processedChunks || 0} / {source.totalChunks}</p>}
          {source.processingError && <p className="text-sm text-destructive" role="alert">{source.processingError}</p>}
        </div>
        <div className="flex gap-2"><Button variant="outline" disabled={busy || source.status === "Processing"} onClick={() => void retrain(source.id)}>Retrain</Button><Button variant="ghost" disabled={busy} onClick={() => setDeleting({ id: source.id, title: source.title })}>Delete</Button></div>
      </article>;
    })}{!sources.length && <div className="p-10 text-center"><span className="mx-auto grid size-11 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon name="book"/></span><h4 className="mt-4 font-medium">Add the first source</h4><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">Upload a document or add a website above, then watch its processing status here.</p></div>}</div></section>
    <Notice>{notice}</Notice>
    {deleting && <Modal title={`Delete ${deleting.title}?`} close={() => setDeleting(null)}><p className="text-sm leading-6 text-muted-foreground">This source and its indexed chunks will be removed from the chatbot.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" onClick={remove}>Delete source</Button></div></Modal>}
  </div>;
}
