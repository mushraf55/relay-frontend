"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { BookOpen, Check, Clock3, Crown, LogIn, MoreHorizontal, Settings, ShieldCheck, ThumbsDown, ThumbsUp, UserMinus, Users, Wifi, WifiOff, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { H1, H2, Muted } from "@/components/ui/typography";
import { Icon } from "@/components/icon";
import { FormattedText } from "@/components/formatted-text";
import { Modal } from "@/components/ui";
import { publicApiOrigin, publicRequest } from "@/lib/public-chat";

type PublicBot = { name: string; description: string; welcome: string; suggestions: string; accent: string; avatar: string; position: string; leadCapture?: boolean; leadFields?: string };
type Citation = { number: number; sourceId: string; title: string; content: string };
type RoomMessage = { id: string; sender_id: string; sender_name: string; role: "member" | "assistant"; content: string; citations: Citation[]; created_at: string };
type Member = { id: string; name: string; role: "admin" | "member"; status: "active" | "pending" | "removed"; accountUserId?: string | null; online: boolean; joinedAt: string; lastSeenAt: string };
type KnowledgeItem = { id: string; title: string; type: string; updated?: string };
type Snapshot = { members: Member[]; knowledge: KnowledgeItem[] };
type Identity = { id: string; name: string; role: "admin" | "member"; status: "active" | "pending"; sessionToken: string };
type JoinResult = { member: Member; sessionToken: string };

function identityKey(shareId: string) { return `relay-public-identity:${shareId}`; }
function widgetRoomKey(shareId: string) { return `relay-widget-room:${shareId}`; }
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join("").toUpperCase(); }
function appendMessage(current: RoomMessage[], message: RoomMessage) { return current.some(item => item.id === message.id) ? current : [...current, message]; }

export function PublicChat({ shareId, mode = "group", embedOrigin = "" }: { shareId: string; mode?: "group" | "widget"; embedOrigin?: string }) {
  const { getToken, isLoaded } = useAuth();
  const { user, isSignedIn } = useUser();
  const [bot, setBot] = useState<PublicBot | null>(null);
  const [room, setRoom] = useState("");
  const [accessMode, setAccessMode] = useState<"open" | "approval">("open");
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [snapshot, setSnapshot] = useState<Snapshot>({ members: [], knowledge: [] });
  const [streamingText, setStreamingText] = useState("");
  const [waiting, setWaiting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [citation, setCitation] = useState<Citation | null>(null);
  const [ratings, setRatings] = useState<Record<string, "up" | "down">>({});
  const [leadSaved, setLeadSaved] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const list = useRef<HTMLDivElement>(null);
  const identityId = identity?.id;
  const identityToken = identity?.sessionToken;
  const identityStatus = identity?.status;

  async function register(roomToken: string, name: string, saved?: Partial<Identity>) {
    const clerkToken = mode === "group" ? await getToken().catch(() => null) : null;
    const result = await publicRequest<JoinResult>(`/rooms/${encodeURIComponent(roomToken)}/join`, {
      method: "POST",
      headers: clerkToken ? { Authorization: `Bearer ${clerkToken}` } : {},
      body: JSON.stringify({ name, memberId: saved?.id, sessionToken: saved?.sessionToken }),
    }, embedOrigin);
    const next: Identity = { id: result.member.id, name: result.member.name, role: result.member.role, status: result.member.status === "pending" ? "pending" : "active", sessionToken: result.sessionToken };
    if (mode === "group") localStorage.setItem(identityKey(shareId), JSON.stringify(next));
    setIdentity(next);
  }

  useEffect(() => {
    if (!isLoaded || (mode === "widget" && !embedOrigin)) return;
    let active = true;
    async function start() {
      try {
        const result = await publicRequest<{ bot: PublicBot; roomToken: string; accessMode: "open" | "approval" }>(`/bots/${encodeURIComponent(shareId)}`);
        if (!active) return;
        setBot(result.bot);
        setAccessMode(result.accessMode || "open");
        if (mode === "widget") {
          const savedRoom = sessionStorage.getItem(widgetRoomKey(shareId));
          const roomToken = savedRoom || (await publicRequest<{ roomToken: string }>(`/bots/${encodeURIComponent(shareId)}/rooms`, { method: "POST", body: "{}" }, embedOrigin)).roomToken;
          sessionStorage.setItem(widgetRoomKey(shareId), roomToken);
          setRoom(roomToken);
          await register(roomToken, "Visitor");
        } else {
          setRoom(result.roomToken);
          const raw = localStorage.getItem(identityKey(shareId));
          if (raw) {
            try {
              const saved = JSON.parse(raw) as Identity;
              if (saved.id && saved.name && saved.sessionToken) await register(result.roomToken, saved.name, saved);
              else localStorage.removeItem(identityKey(shareId));
            } catch { localStorage.removeItem(identityKey(shareId)); }
          }
        }
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Shared assistant not found."); }
    }
    void start();
    return () => { active = false; };
    // register deliberately uses the latest Clerk token without restarting this boot effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shareId, mode, embedOrigin, isLoaded]);

  useEffect(() => {
    if (!room || !identityId || !identityToken) return;
    const socket = io(publicApiOrigin, {
      transports: ["websocket", "polling"],
      auth: { kind: "public-room", roomToken: room, memberId: identityId, sessionToken: identityToken },
    });
    socketRef.current = socket;
    socket.on("connect", () => { setConnected(true); setError(""); });
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", reason => setError(reason.message === "Unauthorized" ? "Your room access expired. Rejoin the chat." : "Reconnecting to the room…"));
    socket.on("chat:ready", ({ messages: history, snapshot: next }: { messages: RoomMessage[]; snapshot: Snapshot }) => { setMessages(history); setSnapshot(next); });
    socket.on("chat:snapshot", (next: Snapshot) => {
      setSnapshot(next);
      const self = next.members.find(member => member.id === identityId);
      if (self) setIdentity(current => current ? { ...current, role: self.role, status: self.status === "pending" ? "pending" : "active" } : current);
    });
    socket.on("chat:membership", ({ status }: { status: "active" | "pending" }) => setIdentity(current => {
      if (!current) return current;
      const next = { ...current, status };
      if (mode === "group") localStorage.setItem(identityKey(shareId), JSON.stringify(next));
      return next;
    }));
    socket.on("chat:message", (message: RoomMessage) => setMessages(current => appendMessage(current, message)));
    socket.on("chat:assistant:start", () => { setWaiting(true); setStreamingText(""); });
    socket.on("chat:assistant:delta", ({ text }: { text: string }) => setStreamingText(current => current + text));
    socket.on("chat:assistant:done", ({ message }: { message: RoomMessage }) => { setMessages(current => appendMessage(current, message)); setStreamingText(""); setWaiting(false); });
    socket.on("chat:assistant:error", ({ error: message }: { error: string }) => { setError(message); setStreamingText(""); setWaiting(false); });
    socket.on("chat:removed", ({ message }: { message: string }) => { localStorage.removeItem(identityKey(shareId)); setIdentity(null); setError(message); });
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [room, identityId, identityToken, identityStatus, mode, shareId]);

  useEffect(() => { list.current?.scrollTo({ top: list.current.scrollHeight, behavior: "smooth" }); }, [messages, streamingText]);

  async function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError("");
    const name = String(new FormData(event.currentTarget).get("name") || "").trim();
    if (!name || !room) return;
    try { await register(room, name); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not join this room."); }
  }

  function send(text: string) {
    if (!text.trim() || !socketRef.current?.connected) return setError("The room is reconnecting. Try again in a moment.");
    setError("");
    socketRef.current.timeout(12_000).emit("chat:send", { text: text.trim() }, (timeout: Error | null, result?: { ok: boolean; error?: string }) => {
      if (timeout) setError("The message timed out. Check your connection and retry.");
      else if (!result?.ok) setError(result?.error || "Message could not be sent.");
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const text = String(new FormData(form).get("message") || "");
    if (!text.trim()) return; form.reset(); send(text);
  }

  function manage(memberId: string, action: "make-admin" | "make-member" | "approve" | "deny" | "remove") {
    socketRef.current?.timeout(10_000).emit("chat:member:update", { memberId, action }, (timeout: Error | null, result?: { ok: boolean; error?: string }) => {
      if (timeout) setError("The member update timed out."); else if (!result?.ok) setError(result?.error || "Member could not be updated.");
    });
  }

  async function rate(messageId: string, rating: "up" | "down") {
    setRatings(current => ({ ...current, [messageId]: rating }));
    try { localStorage.setItem(`relay-public-feedback:${shareId}:${messageId}`, rating); } catch {}
    try {
      await publicRequest(`/rooms/${encodeURIComponent(room)}/feedback`, { method: "POST", body: JSON.stringify({ memberId: identity?.id, sessionToken: identity?.sessionToken, messageId, rating }) }, embedOrigin);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Feedback could not be saved."); }
  }

  async function captureLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    try {
      await publicRequest(`/rooms/${encodeURIComponent(room)}/leads`, { method: "POST", body: JSON.stringify({ memberId: identity?.id, sessionToken: identity?.sessionToken, name: data.get("name"), email: data.get("email"), notes: data.get("notes") || "" }) }, embedOrigin);
      setLeadSaved(true);
      form.reset();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Lead could not be saved."); }
  }

  if (error && !bot) return <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-6 text-center"><span className="text-2xl">✦</span><H1>Chat unavailable</H1><Muted>{error}</Muted></div>;
  if (!bot || !room || !isLoaded) return <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-6 text-center"><span className="text-2xl">✦</span><H1>Opening the room...</H1><Muted>Loading the assistant and recent messages.</Muted><Skeleton className="h-10 w-full" /></div>;
  if (!identity && mode === "group") {
    const redirect = encodeURIComponent(`/share/${shareId}`);
    const accountName = user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress || "Relay member";
    return <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6"><div className="grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground"><Users /></div><span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Shared room · {bot.name}</span><H1>{accessMode === "approval" ? "Request to join" : "Join the room"}</H1><Muted>{accessMode === "approval" ? "An admin will review your request before you can read or send messages." : "Join with a Relay account to keep this room in your history, or enter as a guest."}</Muted>{error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}{isSignedIn ? <Button onClick={() => void register(room, accountName)}><LogIn />{accessMode === "approval" ? `Request as ${accountName}` : `Continue as ${accountName}`}</Button> : <div className="grid gap-2 sm:grid-cols-2"><Button nativeButton={false} render={<Link href={`/login?redirect_url=${redirect}`} />}><LogIn />Sign in</Button><Button nativeButton={false} variant="outline" render={<Link href={`/signup?redirect_url=${redirect}`} />}>Create Relay account</Button></div>}<div className="flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border"><span>or continue as a guest</span></div><form className="grid gap-3" onSubmit={join}><Label htmlFor="join-name">Guest username</Label><Input id="join-name" name="name" required autoFocus maxLength={40} placeholder="e.g. Jamie" /><Button type="submit" variant={isSignedIn ? "outline" : "default"}>{accessMode === "approval" ? "Send join request" : "Join as guest"}<Icon name="arrow" size={15} /></Button></form></div>;
  }
  if (!identity) return <div className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-6 text-center"><span className="text-2xl">✦</span><H1>Joining the room...</H1><Muted>Creating a secure guest session.</Muted><Skeleton className="h-10 w-full" /></div>;
  if (identity.status === "pending") return <div className="mx-auto flex min-h-svh max-w-md flex-col justify-center gap-4 p-6"><div className="grid size-12 place-items-center rounded-full bg-secondary text-secondary-foreground"><Clock3 /></div><span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Request sent · {bot.name}</span><H1>Waiting for an admin</H1><Muted>Your request is saved. Keep this page open and you will enter automatically when an admin approves you.</Muted><div className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-sm ${connected ? "text-emerald-600" : "text-muted-foreground"}`}>{connected ? <Wifi /> : <WifiOff />}{connected ? "Waiting live" : "Reconnecting..."}</div><Button variant="outline" onClick={() => { localStorage.removeItem(identityKey(shareId)); socketRef.current?.disconnect(); setIdentity(null); }}>Cancel request</Button></div>;

  const self = snapshot.members.find(member => member.id === identity.id);
  const isAdmin = self?.role === "admin" || identity.role === "admin";
  const memberCount = snapshot.members.filter(member => member.status === "active").length;
  const groupLabel = memberCount >= 2 ? `${memberCount} members · Group chat` : memberCount === 1 ? "1 member · Invite someone" : "Connecting members…";

  return <div className={mode === "widget" ? "flex h-svh flex-col bg-background text-foreground" : "mx-auto flex h-svh max-w-5xl flex-col bg-background text-foreground"}>
    <header className="flex items-center gap-3 border-b bg-card p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary text-sm font-semibold text-secondary-foreground">{bot.avatar}</span>
      <div><strong>{bot.name}</strong><small>{mode === "group" ? groupLabel : bot.description || "Ask me anything"}</small></div>
      <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${connected ? "text-emerald-600" : "text-muted-foreground"}`}>{connected ? <Wifi /> : <WifiOff />}<span>{connected ? "Live" : "Connecting"}</span></span>
      {mode === "group" && <RoomSettings bot={bot} identity={identity} snapshot={snapshot} isAdmin={isAdmin} manage={manage} />}
    </header>
    {mode === "group" && <div className="flex items-center gap-2 border-b bg-muted/50 px-4 py-2 text-sm text-muted-foreground"><span>✦</span><span><strong>Mention @relay</strong> to bring the assistant into the conversation.</span></div>}
    <div className="flex-1 space-y-4 overflow-y-auto p-4" ref={list} aria-live="polite">
      {!messages.length && <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-3 py-16 text-center"><span className="text-2xl">✦</span><H2>{bot.welcome}</H2><Muted>{mode === "group" ? "Send the first message. When another person joins, this room becomes a group chat." : bot.description}</Muted></div>}
      {messages.map(message => {
        const mine = message.role === "member" && message.sender_id === identity.id;
        return <article className={`flex gap-2 ${mine ? "justify-end" : ""}`} key={message.id}>
          {!mine && <span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">{message.role === "assistant" ? bot.avatar : initials(message.sender_name)}</span>}
          <div className={`max-w-[78%] rounded-xl border p-3 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-card"}`}><header className="mb-1 flex items-center gap-2 text-xs opacity-70"><strong>{mine ? "You" : message.role === "assistant" ? bot.name : message.sender_name}</strong><time>{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time></header>{message.role === "assistant" ? <FormattedText text={message.content} /> : <p>{message.content}</p>}<div className="mt-2 flex flex-wrap gap-2">{message.citations?.map(source => <Button size="xs" variant="outline" key={`${message.id}-${source.number}`} onClick={() => setCitation(source)}><BookOpen />[{source.number}] {source.title}</Button>)}{message.role === "assistant" && <><Button size="xs" variant={ratings[message.id] === "up" ? "secondary" : "outline"} aria-label="Helpful answer" onClick={() => void rate(message.id, "up")}><ThumbsUp />Helpful</Button><Button size="xs" variant={ratings[message.id] === "down" ? "secondary" : "outline"} aria-label="Bad answer" onClick={() => void rate(message.id, "down")}><ThumbsDown />Needs review</Button></>}</div></div>
        </article>;
      })}
      {streamingText && <article className="flex gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">{bot.avatar}</span><div className="max-w-[78%] rounded-xl border bg-card p-3 text-sm"><header className="mb-1 flex items-center gap-2 text-xs text-muted-foreground"><strong>{bot.name}</strong><span>typing</span></header><div className="animate-pulse"><FormattedText text={streamingText} /></div></div></article>}
      {waiting && !streamingText && <div className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-2 text-sm text-muted-foreground"><span>✦</span>{mode === "group" ? "Relay is reading the conversation and knowledge..." : "Checking the knowledge..."}</div>}
    </div>
    {error && <div className="mx-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}
    {bot.leadCapture && !leadSaved && <form className="grid gap-2 border-t bg-muted/40 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]" onSubmit={captureLead}><Input name="name" required maxLength={80} placeholder="Name"/><Input name="email" required type="email" maxLength={200} placeholder="Email"/><Input name="notes" maxLength={500} placeholder="What do you need?"/><Button type="submit" variant="outline">Leave details</Button></form>}
    {leadSaved && <div className="border-t bg-muted/40 p-3 text-sm text-muted-foreground">Thanks, your details were saved.</div>}
    {!messages.length && mode === "widget" && <div className="flex gap-2 overflow-x-auto border-t p-3">{bot.suggestions.split("\n").filter(Boolean).slice(0, 3).map(text => <Button className="shrink-0" variant="outline" key={text} disabled={waiting} onClick={() => send(text)}>{text}</Button>)}</div>}
    <form className="flex gap-2 border-t bg-card p-3" onSubmit={submit}><div className="grid flex-1 gap-1"><Input name="message" required maxLength={1000} disabled={!connected} aria-label="Message" placeholder={mode === "group" ? "Message the group..." : "Ask a question..."} />{mode === "group" && <span className="text-xs text-muted-foreground">Use @relay for an AI answer</span>}</div><Button type="submit" size="icon" disabled={!connected} aria-label="Send"><Icon name="send" size={17} /></Button></form>
    <footer className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground"><span>Powered by Relay</span>{mode === "group" && <Button variant="ghost" size="sm" onClick={() => { localStorage.removeItem(identityKey(shareId)); socketRef.current?.disconnect(); setIdentity(null); }}>Leave as {identity.name}</Button>}</footer>
    {citation && <Modal title={`[${citation.number}] ${citation.title}`} close={() => setCitation(null)}><FormattedText className="max-h-[60vh] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted p-4 text-sm" text={citation.content} /></Modal>}
  </div>;
}

function RoomSettings({ bot, identity, snapshot, isAdmin, manage }: { bot: PublicBot; identity: Identity; snapshot: Snapshot; isAdmin: boolean; manage: (id: string, action: "make-admin" | "make-member" | "approve" | "deny" | "remove") => void }) {
  const pending = snapshot.members.filter(member => member.status === "pending");
  const active = snapshot.members.filter(member => member.status === "active");
  return <Sheet><SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Room settings" />}><Settings /></SheetTrigger><SheetContent className="flex flex-col gap-4">
    <SheetHeader><SheetTitle>{bot.name} room</SheetTitle><SheetDescription>People and library sources available in this shared room.</SheetDescription></SheetHeader>
    <div className="flex-1 space-y-6 overflow-auto">
      {isAdmin && pending.length > 0 && <section className="space-y-3"><div className="flex items-center justify-between"><div className="inline-flex items-center gap-2"><Clock3 /><strong>Join requests</strong></div><Badge>{pending.length}</Badge></div><div className="grid gap-2">{pending.map(member => <div className="flex items-center gap-3 rounded-lg border p-3" key={member.id}><span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">{initials(member.name)}</span><div className="min-w-0 flex-1"><strong className="block truncate">{member.name}</strong><small className="text-muted-foreground">{member.accountUserId ? "Relay account" : "Guest"} · Waiting</small></div><div className="flex gap-2"><Button size="icon-sm" aria-label={`Approve ${member.name}`} onClick={() => manage(member.id, "approve")}><Check /></Button><Button size="icon-sm" variant="outline" aria-label={`Decline ${member.name}`} onClick={() => manage(member.id, "deny")}><X /></Button></div></div>)}</div></section>}
      <section className="space-y-3"><div className="flex items-center justify-between"><div className="inline-flex items-center gap-2"><Users /><strong>People</strong></div><Badge variant="secondary">{active.length}</Badge></div><div className="grid gap-2">
        {active.map(member => <div className="flex items-center gap-3 rounded-lg border p-3" key={member.id}><span className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">{initials(member.name)}</span><div className="min-w-0 flex-1"><strong className="block truncate">{member.name}{member.id === identity.id ? " (you)" : ""}</strong><small className="inline-flex items-center gap-1 text-muted-foreground"><span className={`size-2 rounded-full ${member.online ? "bg-emerald-500" : "bg-muted-foreground"}`} />{member.online ? "Online" : "Offline"}{member.accountUserId ? " · Relay account" : " · Guest"}</small></div>{member.role === "admin" && <Badge variant="outline"><Crown />Admin</Badge>}{isAdmin && member.id !== identity.id && <DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Manage ${member.name}`} />}><MoreHorizontal /></DropdownMenuTrigger><DropdownMenuContent align="end">{member.role === "admin" ? <DropdownMenuItem onClick={() => manage(member.id, "make-member")}><Users />Make member</DropdownMenuItem> : <DropdownMenuItem onClick={() => manage(member.id, "make-admin")}><ShieldCheck />Make admin</DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem variant="destructive" onClick={() => manage(member.id, "remove")}><UserMinus />Remove from chat</DropdownMenuItem></DropdownMenuContent></DropdownMenu>}</div>)}
      </div>{isAdmin && <p className="inline-flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck />You can promote admins or remove members from this room.</p>}</section>
      <section className="space-y-3"><div className="flex items-center justify-between"><div className="inline-flex items-center gap-2"><BookOpen /><strong>Library</strong></div><Badge variant="secondary">{snapshot.knowledge.length}</Badge></div>{snapshot.knowledge.length ? <div className="grid gap-2">{snapshot.knowledge.map(source => <div className="flex items-center gap-3 rounded-lg border p-3" key={source.id}><span className="grid size-9 place-items-center rounded-full bg-secondary text-secondary-foreground"><BookOpen /></span><div className="min-w-0 flex-1"><strong className="block truncate">{source.title}</strong><small className="text-muted-foreground">{source.type}{source.updated ? ` · Updated ${source.updated}` : ""}</small></div><Badge variant="outline">Ready</Badge></div>)}</div> : <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground"><BookOpen className="mx-auto mb-2" /><strong className="block text-foreground">No ready library sources yet</strong><p>This assistant can still use its configured purpose and room context.</p></div>}</section>
    </div>
  </SheetContent></Sheet>;
}
