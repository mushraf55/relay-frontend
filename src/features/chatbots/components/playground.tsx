"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { H2, Muted } from "@/components/ui/typography";
import { Icon } from "@/components/icon";
import { FormattedText } from "@/components/formatted-text";
import { Badge, Modal, Notice } from "@/components/ui";
import { requestAiStream, updateWorkspace, useWorkspace, type Assistant } from "@/lib/workspace";
type Citation = { number: number; sourceId: string; title: string; content: string };
type Message = { id: string; role: "user" | "assistant"; text: string; citations?: Citation[]; streaming?: boolean; feedback?: "up" | "down" };
type StreamEvent = { type: "delta"; text: string } | { type: "done"; citations: Citation[] } | { type: "error"; error: string };

export function Playground({ bot, widget = false }: { bot: Assistant; widget?: boolean }) {
  const state = useWorkspace(); const sources = state.sources.filter(source => source.botId === bot.id && source.status === "Ready");
  const [messages, setMessages] = useState<Message[]>([]); const [waiting, setWaiting] = useState(false); const [error, setError] = useState(""); const [citation, setCitation] = useState<Citation | null>(null);
  const list = useRef<HTMLDivElement>(null); const generation = useRef(0);
  useEffect(() => () => { generation.current++; }, []);
  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight }); }, [messages, waiting]);
  function reset() { generation.current++; setMessages([]); setWaiting(false); setError(""); }
  async function send(text: string, retry = false) {
    if (!text.trim() || waiting) return; const request = ++generation.current; const history = (retry ? messages.slice(0, -1) : messages).slice(-8).map(message => ({ role: message.role, content: message.text.slice(0, 8000) }));
    const assistantId = crypto.randomUUID();
    if (!retry) setMessages(current => [...current, { id: crypto.randomUUID(), role: "user", text }]); setError(""); setWaiting(true);
    try {
      await requestAiStream<StreamEvent>("/chat/stream", { botId: bot.id, message: text, history }, event => {
        if (request !== generation.current) return;
        if (event.type === "error") throw new Error(event.error);
        setMessages(current => {
          const existing = current.find(message => message.id === assistantId);
          if (event.type === "delta") {
            if (!existing) return [...current, { id: assistantId, role: "assistant", text: event.text, streaming: true }];
            return current.map(message => message.id === assistantId ? { ...message, text: message.text + event.text } : message);
          }
          return current.map(message => message.id === assistantId ? { ...message, citations: event.citations, streaming: false } : message);
        });
      });
    }
    catch (cause) { if (request === generation.current) { setMessages(current => current.map(message => message.id === assistantId ? { ...message, streaming: false } : message)); setError(cause instanceof Error ? cause.message : "Could not reach your assistant."); } }
    finally { if (request === generation.current) setWaiting(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = event.currentTarget; void send(String(new FormData(form).get("message") || "").trim()); form.reset(); }
  function rate(messageId: string, rating: "up" | "down") {
    const message = messages.find(item => item.id === messageId);
    if (!message) return;
    setMessages(current => current.map(item => item.id === messageId ? { ...item, feedback: rating } : item));
    updateWorkspace(workspace => workspace.feedback.unshift({ id: crypto.randomUUID(), botId: bot.id, messageId, rating, note: rating === "up" ? "Playground answer marked helpful." : "Playground answer needs review.", createdAt: new Date().toISOString(), resolved: false }));
  }
  return <div className={widget ? "w-full" : "space-y-5"}>{!widget && <div className="flex flex-col justify-between gap-3 rounded-xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center"><div><H2>Put your library to work</H2><Muted>Ask a real question. Get an answer grounded in your sources.</Muted></div><Button variant="outline" disabled={waiting} onClick={reset}>Reset chat</Button></div>}<div className="mx-auto flex h-[min(680px,calc(100svh-12rem))] min-h-[520px] w-full max-w-3xl flex-col overflow-hidden rounded-xl border bg-card shadow-sm" style={{ "--widget-accent": bot.accent } as React.CSSProperties}><div className="flex items-center gap-3 border-b bg-[var(--widget-accent)] p-4 text-white"><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-white/20 text-sm font-semibold uppercase">{bot.avatar.slice(0, 2)}</span><div className="min-w-0 flex-1"><strong className="block truncate">{bot.name}</strong><small className="block truncate text-white/80">Your library. Real answers.</small></div><Icon name="chat"/></div><div className="flex-1 space-y-3 overflow-y-auto bg-background p-4" ref={list} aria-live="polite"><div className="max-w-[86%] rounded-xl border bg-secondary p-3 text-sm leading-6 text-secondary-foreground">{bot.welcome}</div>{messages.map(message => <div key={message.id} className={`max-w-[86%] rounded-xl border p-3 text-sm leading-6 ${message.role === "user" ? "ml-auto bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"} ${message.streaming ? "animate-pulse" : ""}`}>{message.role === "assistant" ? <FormattedText text={message.text}/> : message.text}<div className="mt-2 flex flex-wrap gap-2">{message.citations?.map(source => <Button key={source.number} size="xs" variant="outline" onClick={() => setCitation(source)}><Icon name="book" size={12}/>[{source.number}] {source.title}</Button>)}{message.role === "assistant" && !message.streaming && <><Button size="xs" variant={message.feedback === "up" ? "secondary" : "outline"} onClick={() => rate(message.id, "up")}>Helpful</Button><Button size="xs" variant={message.feedback === "down" ? "secondary" : "outline"} onClick={() => rate(message.id, "down")}>Needs review</Button></>}</div></div>)}{waiting && !messages.some(message => message.streaming) && <div className="space-y-2" role="status"><Skeleton className="h-3 w-40"/><Skeleton className="h-3 w-28"/></div>}{error && <div className="flex flex-col gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between" role="alert">{error}<Button size="sm" variant="outline" disabled={waiting} onClick={() => void send(messages.filter(message => message.role === "user").at(-1)?.text || "Hello", true)}>Retry</Button></div>}</div>{!messages.length && <div className="flex gap-2 overflow-x-auto border-t bg-background p-3">{bot.suggestions.split("\n").filter(Boolean).slice(0, 4).map((text, index) => <Button className="shrink-0" variant="outline" key={index} disabled={waiting} onClick={() => void send(text)}>{text}</Button>)}</div>}<form className="flex gap-2 border-t bg-card p-3" onSubmit={submit}><Input name="message" aria-label="Your message" required maxLength={1000} placeholder="Ask your assistant..." disabled={waiting}/><Button disabled={waiting} size="icon" aria-label="Send message" type="submit"><Icon name="send" size={16}/></Button></form><div className="flex flex-col gap-1 border-t bg-muted/30 px-4 py-2 text-[11px] text-muted-foreground sm:flex-row sm:justify-between"><span>Powered by Relay</span><span>Answers can make mistakes</span></div></div>{!widget && <Notice><Badge good={sources.length > 0}>{sources.length} ready sources</Badge> Train your sources in Library before chatting. Retrain after changing the embedding model. Playground rooms are temporary.</Notice>}{citation && <Modal title={`[${citation.number}] ${citation.title}`} close={() => setCitation(null)}><FormattedText className="whitespace-pre-wrap rounded-lg bg-secondary p-4 text-sm" text={citation.content}/></Modal>}</div>;
}
