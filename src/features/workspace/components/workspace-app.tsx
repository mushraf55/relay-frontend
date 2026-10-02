"use client";
import Link from "next/link";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { SimpleSelect } from "@/components/ui/simple-select";
import { H1, H2, H3 } from "@/components/ui/typography";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { BrandMark, Icon, type IconName } from "@/components/icon";
import { Confirm, Empty, Field, Modal, Notice, Panel } from "@/components/ui";
import { BotWorkspace } from "@/features/chatbots/components/bot-workspace";
import { Knowledge } from "@/features/knowledge/components/knowledge";
import { Analytics } from "@/features/conversations/components/inbox-analytics";
import { WorkspaceSettings } from "@/features/settings/components/workspace-settings";
import { makeBot, requestWorkspaceApi, trainSource, updateWorkspace, useWorkspace, type Assistant } from "@/lib/workspace";

const personalNav: { label: string; slug: string; icon: IconName }[] = [{ label: "My rooms", slug: "my-chats", icon: "inbox" }];
const workspaceNav: { label: string; slug: string; icon: IconName }[] = [{ label: "Overview", slug: "", icon: "grid" }, { label: "Assistants", slug: "chatbots", icon: "chat" }, { label: "Library", slug: "knowledge", icon: "book" }, { label: "Analytics", slug: "analytics", icon: "chart" }, { label: "Settings", slug: "settings", icon: "settings" }];
const nav = [...personalNav, ...workspaceNav];

const sectionCopy: Record<string, string> = {
  "": "See what needs attention and continue setting up your AI workspace.",
  "my-chats": "Return to knowledge rooms you joined with your Relay account.",
  chatbots: "Create assistants from PDFs, websites, notes, and shared resources.",
  knowledge: "Manage PDFs, websites, notes, FAQs, and documents your assistants can answer from.",
  analytics: "Track plan usage, storage, embeddings, AI calls, and activity by user.",
  settings: "Manage your workspace, team access, billing, and integrations.",
};

type SharedChat = { shareId: string; botId: string; botName: string; role: "admin" | "member"; memberCount: number; lastMessage: string; lastSender: string; updatedAt: string };

function MyChats() {
  const [chats, setChats] = useState<SharedChat[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [leaving, setLeaving] = useState<SharedChat | null>(null); const [notice, setNotice] = useState("");
  useEffect(() => { let active = true; void requestWorkspaceApi<{ chats: SharedChat[] }>("/workspace/chats").then(result => { if (active) setChats(result.chats); }).catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Could not load your chats."); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  async function leaveRoom() {
    if (!leaving) return;
    await requestWorkspaceApi(`/workspace/chats/${leaving.shareId}`, { method: "DELETE" });
    setChats(values => values.filter(chat => chat.shareId !== leaving.shareId));
    setNotice(`You left ${leaving.botName}.`);
    setLeaving(null);
  }
  return <div className="space-y-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><H2>Your rooms <span className="text-muted-foreground">{chats.length}</span></H2><p className="mt-1 text-sm text-muted-foreground">Knowledge rooms joined with your Relay account stay available here.</p></div></div>{error && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{error}</div>}{loading ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{[0,1,2].map(item => <div className="h-28 animate-pulse rounded-xl border bg-card" key={item}/>)}</div> : chats.length ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{chats.map(chat => <div className="group relative rounded-xl border bg-card text-sm shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md" key={chat.shareId}><Link className="grid min-h-32 grid-cols-[42px_minmax(0,1fr)_18px] items-center gap-3 p-4 pr-24 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" href={`/share/${chat.shareId}`}><span className="grid size-10 place-items-center rounded-md bg-secondary text-xs font-semibold text-secondary-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">{chat.botName.slice(0,2).toUpperCase()}</span><div className="min-w-0"><span className="flex items-center gap-2"><strong className="truncate text-foreground">{chat.botName}</strong>{chat.role === "admin" && <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground transition-colors group-hover:border-primary/30 group-hover:text-primary">Admin</span>}</span><p className="mt-1 truncate text-muted-foreground">{chat.lastMessage ? <><b className="text-foreground">{chat.lastSender}:</b> {chat.lastMessage}</> : "No messages yet"}</p><small className="mt-1 block text-xs text-muted-foreground">{chat.memberCount} {chat.memberCount === 1 ? "member" : "members"} · {new Date(chat.updatedAt).toLocaleDateString()}</small></div><span className="text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"><Icon name="arrow" size={15}/></span></Link><Button className="absolute right-3 top-3" size="sm" variant="outline" onClick={() => setLeaving(chat)}>Leave</Button></div>)}</div> : <Empty title="No rooms yet"><p>Join or create a knowledge room and it will appear here automatically.</p></Empty>}<Notice>{notice}</Notice>{leaving && <Confirm title={`Leave ${leaving.botName}?`} close={() => setLeaving(null)} confirm={() => void leaveRoom()}>This removes the room from My rooms for your account. You can rejoin later if you still have the share link and access is allowed.</Confirm>}</div>;
}

function BotList({ create }: { create: () => void }) {
  const state = useWorkspace(); const [query, setQuery] = useState(""); const [status, setStatus] = useState("All assistants"); const [category, setCategory] = useState("All categories"); const [sort, setSort] = useState("Recent"); const [view, setView] = useState("Grid"); const [deleting, setDeleting] = useState<Assistant | null>(null); const [notice, setNotice] = useState("");
  const bots = state.bots.filter(b => (status === "All assistants" ? b.status !== "Archived" : b.status === status) && (category === "All categories" || b.category === category) && `${b.name} ${b.description}`.toLowerCase().includes(query.toLowerCase())).sort((a, b) => sort === "Name" ? a.name.localeCompare(b.name) : sort === "Rooms" ? state.conversations.filter(c => c.botId === b.id).length - state.conversations.filter(c => c.botId === a.id).length : 0);
  function duplicate(bot: Assistant) { const id = crypto.randomUUID(); updateWorkspace(d => { d.bots.unshift({ ...bot, id, name: `${bot.name} copy`.slice(0, 60), status: "Draft", published: false }); d.sources.push(...d.sources.filter(s => s.botId === bot.id).map(s => ({ ...s, id: crypto.randomUUID(), botId: id }))); }); setNotice(`${bot.name} duplicated with its library and settings.`); }
  return <><div className="mb-5 flex flex-wrap gap-2">{["All assistants", "Active", "Draft", "Archived"].map(t => <Button key={t} variant={status === t ? "default" : "outline"} onClick={() => setStatus(t)}>{t}<span className="ml-1 rounded-full bg-background/20 px-1.5">{state.bots.filter(b => t === "All assistants" ? b.status !== "Archived" : b.status === t).length}</span></Button>)}</div><div className="mb-5 flex flex-col justify-between gap-4 xl:flex-row xl:items-end"><div><H2>Your assistants <span className="text-muted-foreground">{bots.length}</span></H2><p className="mt-1 text-sm text-muted-foreground">Create one assistant per course, project, team, or website.</p></div><div className="grid gap-2 md:grid-cols-[minmax(220px,1fr)_180px_150px_auto]"><Input aria-label="Search assistants" placeholder="Search assistants..." value={query} onChange={e => setQuery(e.target.value)}/><SimpleSelect aria-label="Filter by category" value={category} onValueChange={setCategory} options={["All categories", "Study", "Work", "Website", "Team", "General"]}/><SimpleSelect aria-label="Sort assistants" value={sort} onValueChange={setSort} options={["Recent", "Name", "Rooms"]}/><div className="flex rounded-md border p-1">{["Grid", "List"].map(v => <Button key={v} size="sm" variant={view === v ? "secondary" : "ghost"} onClick={() => setView(v)}>{v}</Button>)}</div></div></div>
    <div className={view === "Grid" ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3" : "grid gap-3"}>{bots.map(bot => <article className="rounded-xl border bg-card p-4 shadow-sm" key={bot.id}><div className="mb-4 flex items-start justify-between gap-3"><span className="grid size-11 place-items-center rounded-lg bg-secondary text-primary"><Icon name={bot.icon} size={22}/></span><div className="flex items-center gap-2"><span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">{bot.status}</span><DropdownMenu><DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label={`Actions for ${bot.name}`}/>}>•••</DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => duplicate(bot)}>Duplicate</DropdownMenuItem><DropdownMenuItem onClick={() => { updateWorkspace(d => { const b = d.bots.find(b => b.id === bot.id); if (b) { b.status = b.status === "Archived" ? "Draft" : "Archived"; b.published = false; } }); setNotice(bot.status === "Archived" ? "Assistant restored as a draft." : "Assistant archived. Restore it from the Archived tab."); }}>{bot.status === "Archived" ? "Restore" : "Archive"}</DropdownMenuItem><DropdownMenuItem variant="destructive" onClick={() => setDeleting(bot)}>Delete</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div></div><H3 className="text-lg">{bot.name}</H3><p className="mt-1 min-h-10 text-sm text-muted-foreground">{bot.description}</p><div className="mt-4 grid gap-2 border-t pt-3 text-sm"><div className="flex justify-between gap-3"><span className="text-muted-foreground">Library sources</span><strong>{state.sources.filter(s => s.botId === bot.id).length}</strong></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Rooms</span><strong>{state.conversations.filter(c => c.botId === bot.id).length}</strong></div><div className="flex justify-between gap-3"><span className="text-muted-foreground">Category</span><strong>{bot.category}</strong></div></div><div className="mt-4 grid grid-cols-2 gap-2"><Button variant="secondary" nativeButton={false} render={<Link href={`/dashboard/chatbots/${bot.id}/playground`}/>}><Icon name="chat" size={14}/>Ask</Button><Button variant="outline" nativeButton={false} render={<Link href={`/dashboard/chatbots/${bot.id}/overview`}/>}>Manage<Icon name="arrow" size={14}/></Button></div></article>)}{status === "All assistants" && !query && category === "All categories" && <Button variant="outline" className="min-h-44 flex-col gap-2 border-dashed p-6" onClick={create}><span className="grid size-10 place-items-center rounded-lg bg-secondary"><Icon name="plus" size={23}/></span><strong>A new room starts here</strong><span className="text-sm text-muted-foreground">Create an assistant for your next course, project, or website.</span><span className="inline-flex items-center gap-1 text-sm font-medium">Create assistant <Icon name="arrow" size={14}/></span></Button>}</div>
    {!bots.length && <Empty title={query ? "No matching assistants" : "No assistants in this view"}><p>Create your first assistant or adjust the filters.</p><Button onClick={() => { setQuery(""); setCategory("All categories"); setStatus("All assistants"); }}>Clear filters</Button></Empty>}<Notice>{notice}</Notice>
    {deleting && <Confirm title={`Delete ${deleting.name}?`} close={() => setDeleting(null)} confirm={() => { updateWorkspace(d => { d.bots = d.bots.filter(b => b.id !== deleting.id); d.sources = d.sources.filter(s => s.botId !== deleting.id); d.conversations = d.conversations.filter(c => c.botId !== deleting.id); }); setNotice("Assistant and its local demo data deleted."); }}>This removes the assistant, its sources, and its sample rooms. Use Archive if you want to restore it later.</Confirm>}
  </>;
}

function Overview({ create }: { create: () => void }) {
  const state = useWorkspace(); const active = state.bots.filter(b => b.status === "Active").length; const resolved = state.conversations.filter(c => c.status === "Resolved").length;
  const nextHref = !state.bots.length ? "" : !state.sources.length ? "/dashboard/knowledge" : state.bots.some(b => b.published) ? "/dashboard/my-chats" : `/dashboard/chatbots/${state.bots[0].id}/deploy`;
  const nextLabel = !state.bots.length ? "Create your first assistant" : !state.sources.length ? "Add library" : state.bots.some(b => b.published) ? "Review rooms" : "Share your assistant";
  const nextText = !state.bots.length ? "Create an assistant, then connect the library it should use." : !state.sources.length ? "Give your assistants reliable information to answer from." : state.bots.some(b => b.published) ? "See what people are asking across shared knowledge rooms." : "Share a room link or embed it on a website.";
  const steps = [
    { done: state.bots.length > 0, label: "Create your first assistant", href: "", action: create },
    { done: state.sources.length > 0, label: "Add your library", href: "/dashboard/knowledge" },
    { done: false, label: "Customize its appearance", href: state.bots[0] ? `/dashboard/chatbots/${state.bots[0].id}/appearance` : "/onboarding" },
    { done: state.bots.some(b => b.published), label: "Share the room", href: state.bots[0] ? `/dashboard/chatbots/${state.bots[0].id}/deploy` : "/onboarding" },
  ];
  return <>
    <section className="grid gap-4 rounded-xl border bg-card p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex flex-col justify-center">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Welcome back</span>
        <H2 className="mt-3 text-2xl md:text-3xl">Good to see you, {state.profile.name.split(" ")[0]}.</H2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Your workspace is ready. Follow the next step or jump back into an active assistant.</p>
      </div>
      <div className="rounded-lg border bg-background p-4">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Next best action</span>
        <strong className="mt-2 block text-base">{nextLabel}</strong>
        <p className="mt-1 min-h-10 text-sm leading-6 text-muted-foreground">{nextText}</p>
        {nextHref ? <Button className="mt-4 w-full" nativeButton={false} render={<Link href={nextHref}/>}>{nextLabel}<Icon name="arrow" size={14}/></Button> : <Button className="mt-4 w-full" onClick={create}>{nextLabel}<Icon name="arrow" size={14}/></Button>}
      </div>
    </section>

    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[["Assistants", state.bots.length, "Created"], ["Active assistants", active, "Published"], ["Rooms", state.conversations.length, "All time"], ["Resolved", resolved, "Completed" ]].map(([label, value, note]) => <Panel key={label} title={String(label)}><strong className="block text-3xl font-semibold tracking-tight">{value}</strong><p className="mt-1 text-sm text-muted-foreground">{note}</p></Panel>)}
    </div>

    <div className="mt-6 grid gap-4 lg:grid-cols-2">
      <Panel title="Workspace setup">
        <p className="mb-4 text-sm text-muted-foreground">Complete these steps to launch a useful assistant.</p>
        <div className="divide-y rounded-lg border">
          {steps.map((step, index) => step.action ? <Button key={step.label} variant="ghost" className="h-auto w-full justify-start gap-3 rounded-none p-4 text-foreground hover:bg-muted/60 hover:text-foreground" onClick={step.action}><span className="grid size-6 place-items-center rounded-full bg-secondary text-xs text-secondary-foreground">{step.done ? "✓" : index + 1}</span>{step.label}<span className="ml-auto text-muted-foreground"><Icon name="arrow" size={15}/></span></Button> : <Link key={step.label} className="group flex items-center gap-3 p-4 text-sm text-foreground transition-colors hover:bg-muted/60" href={step.href}><span className="grid size-6 place-items-center rounded-full bg-secondary text-xs text-secondary-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">{step.done ? "✓" : index + 1}</span>{step.label}<span className="ml-auto text-muted-foreground transition-colors group-hover:text-primary"><Icon name="arrow" size={15}/></span></Link>)}
        </div>
        <Button className="mt-4" variant="link" nativeButton={false} render={<Link href="/onboarding"/>}>Open guided setup <Icon name="arrow" size={14}/></Button>
      </Panel>
      <Panel title="Recent rooms">
        <p className="mb-4 text-sm text-muted-foreground">The latest activity across all assistants.</p>
        {state.conversations.length ? <div className="divide-y rounded-lg border">{state.conversations.slice(0, 4).map(c => <Link className="flex items-center justify-between gap-3 p-4 text-sm hover:bg-accent" href="/dashboard/my-chats" key={c.id}><span className="min-w-0"><strong className="block truncate">{c.name}</strong><small className="block truncate text-muted-foreground">{c.topic}</small></span><span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">{c.status}</span></Link>)}</div> : <Empty title="No rooms yet"><p>New rooms will appear here after you share an assistant.</p></Empty>}
      </Panel>
    </div>
  </>;
}

export function WorkspaceApp() {
  const state = useWorkspace(); const pathname = usePathname(); const router = useRouter(); const parts = pathname.split("/").filter(Boolean).slice(1); const section = parts[0] || ""; const botId = section === "chatbots" ? parts[1] : undefined; const tab = parts[2] || "overview";
  const bot = state.bots.find(b => b.id === botId); const [create, setCreate] = useState(false); const [creating, setCreating] = useState(false); const [help, setHelp] = useState(false); const [notice, setNotice] = useState("");
  const title = nav.find(n => n.slug === section)?.label || "Page not found";
  const pageDescription = bot ? `${bot.name} · ${tab.charAt(0).toUpperCase()}${tab.slice(1)}` : sectionCopy[section] || "Return to the workspace overview and choose a section.";
  async function addBot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget); const name = String(data.get("name") || "").trim(); if (!name) return;
    const bot = makeBot(name, String(data.get("category")), String(data.get("description") || "Your next helpful assistant.")); const websiteUrl = String(data.get("websiteUrl") || "").trim();
    updateWorkspace(d => d.bots.unshift(bot)); setCreating(true); setNotice("");
    if (!websiteUrl) { setCreate(false); setCreating(false); router.push(`/dashboard/chatbots/${bot.id}/overview`); return; }
    try {
      const result = await requestWorkspaceApi<{ title: string; content: string; site: string; pages: number; truncated: boolean; sourceUrl?: string }>("/websites/scrape", { method: "POST", body: JSON.stringify({ url: websiteUrl, maxPages: Number(data.get("maxPages") || 5) }) });
      const sourceId = crypto.randomUUID(); updateWorkspace(d => d.sources.unshift({ id: sourceId, botId: bot.id, title: result.title, type: "Website", content: result.content, status: "Processing", updated: new Date().toISOString().slice(0,10), sourceUrl: result.sourceUrl || websiteUrl, recrawl: "Manual" }));
      setCreate(false); router.push(`/dashboard/chatbots/${bot.id}/knowledge`); setNotice(`Read ${result.pages} page${result.pages === 1 ? "" : "s"} from ${result.site}. Training the new assistant...`); await trainSource(sourceId); setNotice(`${bot.name} is ready with library from ${result.site}.`);
    } catch (error) { setCreate(false); router.push(`/dashboard/chatbots/${bot.id}/knowledge`); setNotice(`The assistant was created, but the website could not be imported: ${error instanceof Error ? error.message : "Website import failed."}`); }
    finally { setCreating(false); }
  }
  if (!state.ready) return <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-6 text-center" role="status"><BrandMark/><H1>Opening your workspace...</H1><Skeleton className="h-24 w-full"/><Skeleton className="h-24 w-full"/></main>;
  const invalid = !nav.some(n => n.slug === section) || (botId && !bot) || (botId && !["overview", "knowledge", "playground", "quality", "appearance", "deploy", "settings"].includes(tab));
  return <div className="min-h-screen bg-background text-foreground"><main className="min-w-0 bg-background"><header className="flex flex-col gap-4 border-b bg-background px-4 py-4 sm:min-h-20 sm:flex-row sm:items-center sm:justify-between sm:px-6"><div className="min-w-0"><span className="block truncate text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{state.workspace} / {bot ? "Assistants" : title}</span><H1 className="break-words text-2xl sm:text-3xl">{bot ? bot.name : title}</H1><p className="mt-1 text-sm text-muted-foreground">{pageDescription}</p></div><Button className="w-full shrink-0 sm:w-auto" onClick={() => setCreate(true)}><Icon name="plus" size={16}/>Create assistant</Button></header><div className="mx-auto max-w-[1540px] px-4 py-4 sm:px-6 sm:py-6">{section !== "" && <div className="mb-5 flex flex-col items-start justify-between gap-3 rounded-lg border bg-card p-3 text-xs text-muted-foreground sm:flex-row sm:items-center"><span className="flex flex-wrap items-center gap-x-1 gap-y-1"><span className="size-2 rounded-full bg-emerald-500"/><strong>Workspace synced</strong><span>Changes save automatically.</span></span><Button className="w-full sm:w-auto" onClick={() => setHelp(true)}>Open setup guide <Icon name="arrow" size={12}/></Button></div>}{state.storageError && <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive" role="alert">{state.storageError}</div>}
    {invalid ? <Empty title="This page isn’t available"><p>The assistant may have been deleted or the link is incorrect.</p><Button nativeButton={false} render={<Link href="/dashboard/chatbots"/>}>Back to assistants</Button></Empty> : bot ? <BotWorkspace key={`${bot.id}-${tab}`} bot={bot} tab={tab}/> : section === "my-chats" ? <MyChats/> : section === "chatbots" ? <BotList create={() => setCreate(true)}/> : section === "knowledge" ? <Knowledge/> : section === "analytics" ? <Analytics/> : section === "settings" ? <WorkspaceSettings/> : <Overview create={() => setCreate(true)}/>} 
    <Notice>{notice}</Notice><footer className="mt-8 flex flex-col gap-2 border-t pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span className="inline-flex items-center gap-2"><span className="size-2 rounded-full bg-emerald-500"/>All systems ready</span><span>Relay Cloud · Changes save automatically</span></footer></div></main>
    {create && <Modal title="Meet your next assistant." close={() => { if (!creating) setCreate(false); }}><p>Start with a name and optionally give it a website to learn from.</p><form className="grid gap-4" onSubmit={addBot}><Field label="Assistant name"><Input name="name" required disabled={creating} maxLength={60} pattern=".*\S.*" placeholder="Course guide" autoFocus/></Field><Field label="Description"><Textarea name="description" disabled={creating} maxLength={180} rows={3} placeholder="What documents, website, or topic should this assistant help with?"/></Field><Field label="Category"><SimpleSelect name="category" defaultValue="Study" disabled={creating} options={["Study", "Work", "Website", "Team", "General"]}/></Field><Field label="Website URL (optional)"><Input name="websiteUrl" type="url" disabled={creating} maxLength={500} placeholder="https://example.com/help"/><small>Add a public URL now, or add library later.</small></Field><Field label="Pages to import"><SimpleSelect name="maxPages" defaultValue="5" disabled={creating} options={[{ value: "1", label: "This page only" }, { value: "5", label: "Up to 5 pages" }, { value: "10", label: "Up to 10 pages" }]}/></Field><div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="outline" disabled={creating} onClick={() => setCreate(false)}>Cancel</Button><Button type="submit" disabled={creating}>{creating ? "Creating & scraping..." : "Create assistant"}</Button></div></form></Modal>}
    {help && <Modal title="Make yourself at home." close={() => setHelp(false)}><ol className="list-decimal space-y-3 pl-5 text-sm"><li><strong>Create an assistant</strong><p className="text-muted-foreground">Name it for a course, project, team, or website.</p></li><li><strong>Add library</strong><p className="text-muted-foreground">Upload PDFs and docs, scrape a website, or add notes and FAQs.</p></li><li><strong>Make it yours</strong><p className="text-muted-foreground">Adjust behavior, appearance, and sharing settings.</p></li><li><strong>Try the whole workspace</strong><p className="text-muted-foreground">Explore rooms, analytics, your team, and billing.</p></li></ol><p className="text-sm text-muted-foreground">Changes are saved in your workspace. Use Settings to reset the sample workspace or try an empty one.</p><Button className="w-full" onClick={() => { setHelp(false); setNotice("You’re ready to explore."); }}>Let’s explore</Button></Modal>}
  </div>;
}






