"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormattedText } from "@/components/formatted-text";
import { CitationList, type Citation } from "@/components/citation-list";
import { H2, Muted } from "@/components/ui/typography";
import { Icon } from "@/components/icon";
import { streamAi, type Assistant } from "@/lib/workspace";

type Message = { id: string; role: "user" | "assistant"; text: string; citations?: Citation[] };
type StreamEvent = { type: "delta"; delta: string } | { type: "done"; citations: Citation[] } | { type: "error"; error: string };

export function CorePlayground({ bot }: { bot: Assistant }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const suggestions = bot.suggestions.split("\n").map(item => item.trim()).filter(Boolean).slice(0, 3);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, waiting]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = draft.trim();
    if (!message || waiting) return;
    const history = messages.slice(-8).map(item => ({ role: item.role, content: item.text }));
    const assistantId = crypto.randomUUID();
    setMessages(current => [...current, { id: crypto.randomUUID(), role: "user", text: message }, { id: assistantId, role: "assistant", text: "" }]);
    form.reset();
    setDraft("");
    setWaiting(true);
    setError("");
    try {
      await streamAi<StreamEvent>("/chat/stream", { botId: bot.id, message, history }, event => {
        if (event.type === "error") throw new Error(event.error);
        setMessages(current => current.map(item => item.id === assistantId
          ? event.type === "delta" ? { ...item, text: item.text + event.delta } : { ...item, citations: event.citations }
          : item));
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The chatbot could not answer.");
    } finally {
      setWaiting(false);
    }
  }

  return <div className="mx-auto max-w-5xl space-y-5">
    <div className="flex items-end justify-between gap-4"><div><H2 className="text-xl font-medium">Test chatbot</H2><Muted className="mt-1">Preview answers exactly as visitors will receive them.</Muted></div>{messages.length > 0 && <Button variant="ghost" onClick={() => { setMessages([]); setError(""); }}>Clear conversation</Button>}</div>
    <section className="flex h-[min(680px,calc(100svh-15rem))] min-h-[520px] flex-col overflow-hidden rounded-2xl border bg-card" aria-label={`Test ${bot.name}`}>
      <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-5"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/20">{bot.avatar || bot.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><h3 className="truncate font-medium">{bot.name}</h3><p className="flex items-center gap-1.5 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-[#9ae187]"/>Test mode · Ready knowledge only</p></div></header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6" aria-live="polite"><div className="mx-auto flex min-h-full max-w-3xl flex-col justify-end gap-5">
        {!messages.length && <div className="my-auto py-8 text-center"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><Icon name="chat"/></span><h3 className="mt-5 text-lg font-medium">Ask the first question</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{bot.welcome}</p>{suggestions.length > 0 && <div className="mx-auto mt-6 flex max-w-xl flex-wrap justify-center gap-2">{suggestions.map(suggestion => <button className="min-h-11 rounded-xl border bg-background px-4 py-2 text-left text-sm transition-colors hover:border-primary/40 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" key={suggestion} onClick={() => setDraft(suggestion)} type="button">{suggestion}</button>)}</div>}</div>}
        {messages.map(item => <article className={`flex gap-2.5 ${item.role === "user" ? "ml-auto max-w-[88%] flex-row-reverse" : "mr-auto max-w-[92%]"}`} key={item.id}><span className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${item.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>{item.role === "user" ? "You" : "AI"}</span><div className={`min-w-0 rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === "user" ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md border bg-background"}`}>{item.role === "assistant" ? item.text ? <FormattedText text={item.text}/> : <span className="inline-flex gap-1 text-muted-foreground" aria-label="Relay is answering"><span className="animate-pulse">●</span><span className="animate-pulse [animation-delay:150ms]">●</span><span className="animate-pulse [animation-delay:300ms]">●</span></span> : item.text}<CitationList citations={item.citations}/></div></article>)}
        {waiting && <p className="flex items-center gap-2 pl-11 text-xs text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-primary"/>Searching ready knowledge…</p>}{error && <div className="ml-11 flex items-center justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert"><span>{error}</span><Button variant="ghost" size="sm" onClick={() => setError("")}>Dismiss</Button></div>}<div ref={endRef}/>
      </div></div>
      <footer className="border-t bg-background/60 p-3 sm:p-4"><form className="mx-auto flex max-w-3xl items-center gap-2" onSubmit={submit}><label className="min-w-0 flex-1"><span className="sr-only">Message</span><Input name="message" value={draft} onChange={event => setDraft(event.target.value)} required maxLength={1000} placeholder="Ask about the connected knowledge…" disabled={waiting} className="h-11 bg-card"/></label><Button className="size-11 px-0 sm:w-auto sm:px-5" type="submit" disabled={waiting || !draft.trim()} aria-label="Send message"><span className="hidden sm:inline">Send</span><Icon name="send"/></Button></form><p className="mx-auto mt-2 max-w-3xl text-center text-[11px] text-muted-foreground">Test messages are not visible to published chatbot visitors.</p></footer>
    </section>
  </div>;
}
