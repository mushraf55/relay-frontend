"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormattedText } from "@/components/formatted-text";
import { CitationList, type Citation } from "@/components/citation-list";
import { announceRoomChange, subscribeToRoom, type RealtimeChannel } from "@/lib/realtime";
import { useAuth } from "@clerk/nextjs";
import { Icon } from "@/components/icon";

type Bot = { name: string; description: string; welcome: string; suggestions: string; accent: string; avatar: string; kind?: "shared" | "website"; visibility?: "public" | "private" };
type Message = { id: string; role: "user" | "assistant"; text: string; citations?: Citation[] };
type StreamEvent = { type: "delta"; delta: string } | { type: "done"; citations: Citation[] } | { type: "error"; error: string };
const apiOrigin = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

export function CorePublicChat({ shareId }: { shareId: string }) {
  const [bot, setBot] = useState<Bot | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, waiting]);

  useEffect(() => {
    void fetch(`${apiOrigin}/public/bots/${encodeURIComponent(shareId)}`, { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error("Chatbot not found.");
      setBot((await response.json()).bot);
    }).catch(cause => setError(cause.message));
  }, [shareId]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const message = String(new FormData(form).get("message") || "").trim();
    if (!message || waiting) return;
    const history = messages.slice(-8).map(item => ({ role: item.role, content: item.text }));
    const assistantId = crypto.randomUUID();
    setMessages(current => [...current, { id: crypto.randomUUID(), role: "user", text: message }, { id: assistantId, role: "assistant", text: "" }]);
    form.reset();
    setWaiting(true);
    setError("");
    try {
      const response = await fetch(`${apiOrigin}/public/bots/${encodeURIComponent(shareId)}/chat/stream`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message, history }) });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error || "The chatbot could not answer."); }
      if (!response.body) throw new Error("The response stream was unavailable.");
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) {
        const { done, value } = await reader.read(); buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        const lines = buffer.split("\n"); buffer = lines.pop() || "";
        for (const line of lines) if (line.trim()) {
          const event = JSON.parse(line) as StreamEvent;
          if (event.type === "error") throw new Error(event.error);
          setMessages(current => current.map(item => item.id === assistantId
            ? event.type === "delta" ? { ...item, text: item.text + event.delta } : { ...item, citations: event.citations }
            : item));
        }
        if (done) break;
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "The chatbot could not answer."); }
    finally { setWaiting(false); }
  }

  if (!bot) return <main className="grid h-svh place-items-center p-6 text-center text-sm text-muted-foreground">{error ? <div role="alert"><p className="font-medium text-destructive">This chatbot could not be opened.</p><p className="mt-1">{error}</p></div> : <div className="flex items-center gap-2"><span className="size-2 animate-pulse rounded-full bg-primary"/>Opening chatbot…</div>}</main>;
  if (bot.kind === "shared") return <SharedChat bot={bot} shareId={shareId}/>;
  return <main className="flex h-svh flex-col bg-background text-foreground">
    <header className="border-b bg-card"><div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/20">{bot.avatar || bot.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><h1 className="truncate font-medium">{bot.name}</h1><p className="truncate text-xs text-muted-foreground">{bot.description}</p></div><span className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"><span className="size-1.5 rounded-full bg-[#9ae187]"/>Online</span></div></header>
    <div className="min-h-0 flex-1 overflow-y-auto" aria-live="polite"><div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end gap-5 px-4 py-6 sm:px-6"><article className="mr-auto flex max-w-[92%] gap-2.5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-[10px] font-semibold">AI</span><div className="rounded-2xl rounded-tl-md border bg-card px-4 py-3 text-sm leading-6">{bot.welcome}</div></article>{messages.map(item => <article className={`flex gap-2.5 ${item.role === "user" ? "ml-auto max-w-[88%] flex-row-reverse" : "mr-auto max-w-[92%]"}`} key={item.id}><span className={`grid size-8 shrink-0 place-items-center rounded-full text-[10px] font-semibold ${item.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{item.role === "user" ? "You" : "AI"}</span><div className={`min-w-0 rounded-2xl px-4 py-3 text-sm leading-6 ${item.role === "user" ? "rounded-tr-md bg-primary text-primary-foreground" : "rounded-tl-md border bg-card"}`}>{item.role === "assistant" ? <>{item.text ? <FormattedText text={item.text}/> : <span className="inline-flex gap-1 text-muted-foreground" aria-label="Chatbot is answering"><span className="animate-pulse">●</span><span className="animate-pulse [animation-delay:150ms]">●</span><span className="animate-pulse [animation-delay:300ms]">●</span></span>}<CitationList citations={item.citations}/></> : item.text}</div></article>)}{waiting && <p className="flex items-center gap-2 pl-11 text-xs text-muted-foreground"><span className="size-1.5 animate-pulse rounded-full bg-primary"/>Searching knowledge…</p>}{error && <div className="ml-11 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}<div ref={endRef}/></div></div>
    <footer className="border-t bg-card p-3 sm:p-4"><form className="mx-auto flex max-w-4xl items-center gap-2" onSubmit={submit}><label className="min-w-0 flex-1"><span className="sr-only">Message</span><Input name="message" required maxLength={1000} placeholder="Ask a question…" disabled={waiting} className="h-11 bg-background"/></label><Button type="submit" disabled={waiting} className="size-11 px-0 sm:w-auto sm:px-5" aria-label="Send message"><span className="hidden sm:inline">Send</span><Icon name="send"/></Button></form><p className="mx-auto mt-2 max-w-4xl text-center text-[11px] text-muted-foreground">Answers use the knowledge connected by this chatbot&apos;s owner.</p></footer>
  </main>;
}

type RoomMessage = { id: number; sender_id: string; sender_name: string; role: "member" | "assistant"; content: string; citations?: Citation[] };
type KnowledgeSource = { id: string; title: string; type: "File" | "Text" | "Website"; status: string };

function SharedChat({ bot, shareId }: { bot: Bot; shareId: string }) {
  const { getToken } = useAuth();
  const storageKey = `relay-room:${shareId}`;
  const [session, setSession] = useState(() => typeof window === "undefined" ? "" : localStorage.getItem(storageKey) || "");
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [error, setError] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [selfId, setSelfId] = useState("");
  const [knowledgeSources, setKnowledgeSources] = useState<KnowledgeSource[]>([]);
  const lastMessageId = useRef(0);
  const roomEndRef = useRef<HTMLDivElement>(null);
  const realtimeChannel = useRef<RealtimeChannel | null>(null);
  useEffect(() => { roomEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [messages, waiting]);
  useEffect(() => {
    if (!session) return;
    void getToken().then(token => token ? fetch(`${apiOrigin}/public/bots/${encodeURIComponent(shareId)}/claim`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "X-Chat-Session": session } }) : null).catch(() => { /* Guest sessions remain usable if account linking is unavailable. */ });
  }, [getToken, session, shareId]);
  useEffect(() => {
    if (!session) return;
    let active = true;
    async function poll() {
      try {
        const after = lastMessageId.current;
        const response = await fetch(`${apiOrigin}/public/bots/${encodeURIComponent(shareId)}/messages?after=${after}`, { headers: { "X-Chat-Session": session }, cache: "no-store" });
        if (response.ok) { const result = await response.json(); if (active) { setSelfId(result.selfId || ""); setKnowledgeSources(result.sources || []); if (result.messages.length) { const incoming = result.messages as RoomMessage[]; lastMessageId.current = Math.max(lastMessageId.current, ...incoming.map(item => item.id)); setMessages(current => { const withoutTemporaryAi = incoming.some(item => item.role === "assistant") ? current.filter(item => item.id >= 0) : current; return [...withoutTemporaryAi, ...incoming.filter(next => !withoutTemporaryAi.some(item => item.id === next.id))]; }); } } }
      } catch { /* Poll again; a temporary network failure should not end the room. */ }
    }
    const realtime = subscribeToRoom(shareId, () => void poll());
    realtimeChannel.current = realtime.channel;
    void poll(); const timer = window.setInterval(() => void poll(), 15_000);
    return () => { active = false; realtimeChannel.current = null; window.clearInterval(timer); void realtime.unsubscribe(); };
  }, [session, shareId]);

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const displayName = String(new FormData(event.currentTarget).get("name") || "");
    const inviteToken = new URLSearchParams(window.location.search).get("invite") || undefined;
    const token = await getToken();
    const response = await fetch(`${apiOrigin}/public/bots/${encodeURIComponent(shareId)}/join`, { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ displayName, inviteToken }) });
    const result = await response.json();
    if (!response.ok) return setError(result.error || "Could not join this chat.");
    localStorage.setItem(storageKey, result.sessionToken); setSession(result.sessionToken);
  }

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const message = String(new FormData(form).get("message") || "").trim(); if (!message || waiting) return;
    form.reset(); setWaiting(true); setError("");
    try {
      const response = await fetch(`${apiOrigin}/public/bots/${encodeURIComponent(shareId)}/messages/stream`, { method: "POST", headers: { "Content-Type": "application/json", "X-Chat-Session": session }, body: JSON.stringify({ message, history: [] }) });
      if (!response.ok) { const result = await response.json(); throw new Error(result.error || "Could not send message."); }
      if (!response.body) throw new Error("The response stream was unavailable.");
      const tempId = -Date.now(); let hasAiDelta = false;
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      while (true) { const { done, value } = await reader.read(); buffer += decoder.decode(value || new Uint8Array(), { stream: !done }); const lines = buffer.split("\n"); buffer = lines.pop() || ""; for (const line of lines) if (line.trim()) { const update = JSON.parse(line) as StreamEvent; if (update.type === "error") throw new Error(update.error); if (update.type === "delta" && !hasAiDelta) { hasAiDelta = true; setMessages(current => [...current, { id: tempId, sender_id: "assistant", sender_name: bot.name, role: "assistant", content: update.delta }]); } else if (hasAiDelta) setMessages(current => current.map(item => item.id === tempId ? update.type === "delta" ? { ...item, content: item.content + update.delta } : { ...item, citations: update.citations } : item)); } if (done) break; }
      if (!hasAiDelta) setMessages(current => current.filter(item => item.id !== tempId));
      await announceRoomChange(realtimeChannel.current);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not send message."); }
    finally { setWaiting(false); }
  }

  if (!session) return <main className="relative grid min-h-svh place-items-center overflow-hidden bg-[#f4f7fb] p-6 text-slate-950"><div className="absolute inset-x-0 top-0 h-48 bg-[#1554db]"/><form onSubmit={join} className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10"><div className="bg-[#1554db] px-7 py-8 text-white"><div className="mb-5 grid size-12 place-items-center rounded-xl bg-white/15 text-lg font-semibold ring-1 ring-white/20">{bot.avatar || bot.name.slice(0, 2).toUpperCase()}</div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Relay shared room</p><h1 className="mt-2 text-2xl font-semibold tracking-tight">Join {bot.name}</h1><p className="mt-2 text-sm leading-6 text-blue-100">{bot.description}</p></div><div className="space-y-4 p-7"><div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">{bot.visibility === "private" ? "This is a private room. Open it using your invitation link." : "Anyone with this link can join as a guest."}</div><label className="block space-y-2"><span className="text-sm font-medium">Display name</span><Input name="name" required minLength={2} maxLength={60} placeholder="How others will see you" autoFocus/></label><Button type="submit" className="w-full">Enter room</Button>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{error}</p>}<p className="text-center text-xs text-slate-500">Use <strong>@relay</strong> in the room whenever you want an AI answer.</p></div></form></main>;
  return <main className="flex h-svh flex-col bg-[#eef2f7] text-slate-950">
    <header className="border-b border-slate-200 bg-white"><div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3 sm:px-6"><span className="grid size-10 shrink-0 place-items-center rounded-xl text-sm font-semibold text-white shadow-sm" style={{ background: bot.accent || "#1554db" }}>{bot.avatar || bot.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><h1 className="truncate font-semibold tracking-tight">{bot.name}</h1><div className="flex items-center gap-2 text-xs text-slate-500"><span className="size-2 rounded-full bg-emerald-500"/><span>Shared room</span><span aria-hidden>·</span><span>AI available with <strong className="text-slate-700">@relay</strong></span></div></div><span className="hidden rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 sm:block">{bot.visibility === "private" ? "Private" : "Public"}</span></div>{knowledgeSources.length > 0 && <div className="border-t border-slate-100 bg-slate-50/70"><div className="mx-auto flex max-w-4xl items-center gap-2 overflow-x-auto px-4 py-2 sm:px-6"><span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Knowledge</span>{knowledgeSources.map(source => <span className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600" key={source.id}>{source.title}<span className="ml-1.5 text-[10px] uppercase text-slate-400">{source.type}</span></span>)}</div></div>}</header>
    <div className="min-h-0 flex-1 overflow-y-auto" aria-live="polite"><div className="mx-auto flex min-h-full max-w-4xl flex-col justify-end gap-4 px-4 py-6 sm:px-6">
      {!messages.length && <div className="my-auto text-center"><div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-100 text-xl text-blue-700">#</div><h2 className="mt-4 font-semibold">The room is ready</h2><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">Start a conversation with other guests. Mention <strong>@relay</strong> when the room needs help from the knowledge base.</p></div>}
      {messages.map(item => {
        const mine = item.role === "member" && item.sender_id === selfId;
        return <article data-mine={mine ? "true" : "false"} data-role={item.role} className={`flex items-end gap-2 ${mine ? "ml-auto max-w-[88%] flex-row-reverse" : "mr-auto max-w-[92%]"}`} key={item.id}>
          <span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${item.role === "assistant" ? "bg-[#1554db] text-white" : mine ? "bg-blue-100 text-blue-700" : "bg-slate-200 text-slate-700"}`}>{item.role === "assistant" ? "AI" : item.sender_name.slice(0, 2).toUpperCase()}</span>
          <div className={`min-w-0 rounded-2xl px-4 py-2.5 ${item.role === "assistant" ? "rounded-bl-md border border-blue-100 bg-blue-50" : mine ? "rounded-br-md bg-[#1554db] text-white" : "rounded-bl-md border border-slate-200 bg-white"}`}>
            <div className={`mb-1 flex items-center gap-2 ${mine ? "justify-end" : ""}`}><p className={`text-[11px] font-semibold ${mine ? "text-blue-100" : "text-slate-500"}`}>{mine ? "You" : item.sender_name}</p>{item.role === "assistant" && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-700">Relay</span>}</div>
            <div className={`text-sm leading-6 ${mine ? "text-white" : "text-slate-800"}`}><FormattedText text={item.content}/></div><CitationList citations={item.citations}/>
          </div>
        </article>;
      })}
      {waiting && <div className="flex items-center gap-2 text-xs text-muted-foreground"><span className="size-2 animate-pulse rounded-full bg-primary"/>Sending message…</div>}{error && <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</p>}<div ref={roomEndRef}/>
    </div></div>
    <footer className="border-t border-slate-200 bg-white p-3 sm:p-4"><form className="mx-auto flex max-w-4xl items-end gap-2" onSubmit={send}><div className="min-w-0 flex-1"><Input name="message" required maxLength={1000} placeholder="Message everyone, or type @relay to ask AI…" className="h-11 bg-slate-50"/></div><Button type="submit" disabled={waiting} className="h-11 px-5">Send</Button></form><p className="mx-auto mt-2 max-w-4xl text-center text-[11px] text-slate-400">Messages are visible to everyone in this shared room.</p></footer>
  </main>;
}
