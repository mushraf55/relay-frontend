"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { H1, Muted } from "@/components/ui/typography";
import { Empty, Field, Modal, Notice } from "@/components/ui";
import { Icon } from "@/components/icon";
import { CoreBotWorkspace } from "@/features/chatbots/components/core-bot-workspace";
import { CoreDashboardAnalytics } from "@/features/analytics/components/core-dashboard-analytics";
import { makeBot, updateWorkspace, useWorkspace, type Assistant } from "@/lib/workspace";

function ChatbotLibrary({ bots, sources, createBot, deleteBot }: { bots: Assistant[]; sources: ReturnType<typeof useWorkspace>["sources"]; createBot: () => void; deleteBot: (bot: Assistant) => void }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | Assistant["kind"]>("all");
  const visible = bots.filter(bot => (kind === "all" || bot.kind === kind) && `${bot.name} ${bot.description}`.toLowerCase().includes(query.toLowerCase()));
  const readySources = sources.filter(source => source.status === "Ready").length;
  const attention = sources.filter(source => source.status === "Error" || source.status === "Processing").length;

  return <section className="space-y-5" aria-label="Chatbot list">
    <div className="flex flex-col gap-4 border-b pb-5 lg:flex-row lg:items-center lg:justify-between">
      <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{bots.length} {bots.length === 1 ? "chatbot" : "chatbots"}</span><span aria-hidden> · </span>{readySources} ready {readySources === 1 ? "source" : "sources"}{attention > 0 && <><span aria-hidden> · </span><span className="text-[#f6c177]">{attention} {attention === 1 ? "source needs" : "sources need"} attention</span></>}</p>
      <div className="flex flex-col gap-2 sm:flex-row"><label className="relative"><span className="sr-only">Search chatbots</span><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Icon name="search" size={16}/></span><Input className="h-11 w-full pl-9 sm:w-64" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name"/></label><div className="flex rounded-xl border bg-card p-1" aria-label="Filter chatbot type">{(["all", "website", "shared"] as const).map(value => <button aria-pressed={kind === value} className={`min-h-9 flex-1 rounded-lg px-3 text-xs font-medium capitalize transition-colors sm:flex-none ${kind === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`} key={value} onClick={() => setKind(value)} type="button">{value}</button>)}</div></div>
    </div>
    {visible.length ? <div className="overflow-hidden rounded-2xl border bg-card"><div className="hidden grid-cols-[minmax(0,1fr)_120px_120px_150px_auto] gap-4 border-b px-6 py-3 text-xs font-medium text-muted-foreground md:grid"><span>Chatbot</span><span>Type</span><span>Status</span><span>Knowledge</span><span className="sr-only">Actions</span></div><div className="divide-y">{visible.map(bot => { const botSources = sources.filter(source => source.botId === bot.id); const ready = botSources.filter(source => source.status === "Ready").length; const hasIssue = botSources.some(source => source.status === "Error"); const processing = botSources.some(source => source.status === "Processing"); return <article className="group grid gap-4 px-5 py-5 transition-colors hover:bg-white/[0.025] md:grid-cols-[minmax(0,1fr)_120px_120px_150px_auto] md:items-center md:px-6" key={bot.id}>
      <div className="flex min-w-0 items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-mono text-xs font-semibold text-primary ring-1 ring-primary/20">{bot.avatar || bot.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0"><h3 className="truncate font-medium">{bot.name}</h3><p className="mt-1 truncate text-sm text-muted-foreground">{bot.description}</p></div></div>
      <div><span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground md:hidden">Type · </span><span className="text-sm capitalize">{bot.kind}</span><span className="ml-2 text-xs text-muted-foreground">{bot.kind === "shared" ? bot.visibility : "Embed"}</span></div>
      <div className="flex items-center gap-2 text-sm"><span className="text-xs text-muted-foreground md:hidden">Status</span><span className={`size-2 rounded-full ${bot.status === "Active" ? "bg-[#9ae187]" : "bg-muted-foreground"}`}/>{bot.status}</div>
      <div className="text-sm"><span className="mr-2 text-xs text-muted-foreground md:hidden">Knowledge</span><span className={hasIssue ? "text-destructive" : "text-foreground"}>{ready} of {botSources.length}</span><span className="text-muted-foreground"> ready</span>{hasIssue && <span className="ml-2 text-xs text-destructive">Fix error</span>}{processing && !hasIssue && <span className="ml-2 text-xs text-[#f6c177]">Processing</span>}</div>
      <div className="flex items-center gap-2 md:justify-end"><Button className="h-11 flex-1 md:h-9 md:flex-none" nativeButton={false} render={<Link href={`/dashboard/chatbots/${bot.id}/knowledge`}/>}>Open chatbot <Icon name="arrow"/></Button><Button className="size-11 md:size-9" variant="ghost" size="icon" aria-label={`Delete ${bot.name}`} onClick={() => deleteBot(bot)}><Icon name="close"/></Button></div>
    </article>; })}</div></div> : bots.length ? <div className="rounded-2xl border border-dashed p-12 text-center"><span className="mx-auto grid size-10 place-items-center text-muted-foreground"><Icon name="search" size={28}/></span><h3 className="mt-4 font-medium">No matching chatbots</h3><p className="mt-1 text-sm text-muted-foreground">Try another name or chatbot type.</p><Button className="mt-5" variant="outline" onClick={() => { setQuery(""); setKind("all"); }}>Clear filters</Button></div> : <div className="relative overflow-hidden rounded-2xl border bg-card p-8 sm:p-12"><div className="absolute right-0 top-0 size-56 rounded-full bg-primary/10 blur-3xl"/><div className="relative max-w-lg"><span className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary"><Icon name="chat"/></span><h3 className="mt-6 text-2xl font-medium tracking-[-0.03em]">Create your first chatbot</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Choose a website chatbot or shared room, then connect its first PDF, TXT file, or website source.</p><Button className="mt-6" onClick={createBot}>Create chatbot <Icon name="arrow"/></Button></div></div>}
  </section>;
}

export function CoreWorkspaceApp() {
  const state = useWorkspace();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const parts = pathname.split("/").filter(Boolean).slice(1);
  const section = parts[0] === "knowledge" ? "chatbots" : parts[0] || "";
  const botId = section === "chatbots" ? parts[1] : undefined;
  const tab = parts[2] || "knowledge";
  const bot = state.bots.find(item => item.id === botId);
  const [creating, setCreating] = useState(false);
  const [createKind, setCreateKind] = useState<Assistant["kind"]>("website");
  const [deleting, setDeleting] = useState<Assistant | null>(null);
  const [notice, setNotice] = useState("");
  const createRequested = searchParams.get("create") === "1";
  const showCreating = creating || createRequested;

  function closeCreate() {
    setCreating(false);
    if (createRequested) router.replace(pathname);
  }

  async function createBot(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const kind = String(data.get("kind")) === "shared" ? "shared" : "website";
    const visibility = String(data.get("visibility")) === "private" ? "private" : "public";
    const created = makeBot(String(data.get("name") || "").trim(), "General", String(data.get("description") || "").trim() || "A chatbot that answers from your knowledge sources.", kind, visibility);
    const saved = await updateWorkspace(draft => draft.bots.unshift(created));
    if (!saved) return;
    setCreating(false);
    router.push(`/dashboard/chatbots/${created.id}/knowledge`);
  }

  function deleteBot() {
    if (!deleting) return;
    updateWorkspace(draft => {
      draft.bots = draft.bots.filter(item => item.id !== deleting.id);
      draft.sources = draft.sources.filter(source => source.botId !== deleting.id);
    });
    setNotice(`${deleting.name} deleted.`);
    setDeleting(null);
  }

  if (!state.ready) return <main className="grid min-h-screen place-items-center"><Muted>Opening your workspace…</Muted></main>;
  const validTab = ["settings", "knowledge", "playground", "embed"].includes(tab);

  return <main className="min-h-screen">
    <header className="flex flex-col gap-4 border-b bg-black/40 px-4 py-7 sm:flex-row sm:items-center sm:justify-between sm:px-8"><div><H1 className="text-3xl font-medium tracking-[-0.03em]">{bot ? bot.name : section === "chatbots" ? "Chatbots" : "Workspace overview"}</H1><Muted className="mt-1">{bot ? "Add knowledge, test its answers, and control how it is published." : section === "chatbots" ? "Create, train, test, and publish your chatbots from one place." : `${state.workspace} · Live workspace data`}</Muted></div>{bot ? <Button className="h-11 px-5" variant="outline" nativeButton={false} render={<Link href="/dashboard/chatbots"/>}><Icon name="arrow" style={{ transform: "rotate(180deg)" }}/>All chatbots</Button> : <Button className="h-11 px-5" onClick={() => setCreating(true)}>Create chatbot</Button>}</header>
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      {state.storageError && <p className="rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{state.storageError}</p>}
      {botId ? bot && validTab ? <CoreBotWorkspace bot={bot} tab={tab}/> : <Empty title="Chatbot not found"><Button nativeButton={false} render={<Link href="/dashboard/chatbots"/>}>Back to chatbots</Button></Empty>
        : section === "chatbots" ? <ChatbotLibrary bots={state.bots} sources={state.sources} createBot={() => setCreating(true)} deleteBot={setDeleting}/>
        : <CoreDashboardAnalytics/>}
      <Notice>{notice}</Notice>
    </div>
    {showCreating && <Modal title="Create chatbot" close={closeCreate}><form className="space-y-4" onSubmit={createBot}><Field label="Name"><Input name="name" required maxLength={60} autoFocus placeholder="Customer support"/></Field><Field label="Description (optional)"><Textarea name="description" rows={3} maxLength={180} placeholder="What this chatbot should help people with"/></Field><Field label="Chatbot type"><select name="kind" value={createKind} onChange={event => setCreateKind(event.target.value as Assistant["kind"])} className="h-11 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="website">Website chatbot — embed on a site</option><option value="shared">Shared chatbot — invite people to a room</option></select></Field>{createKind === "shared" && <Field label="Room access"><select name="visibility" className="h-11 w-full rounded-lg border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="public">Public — anyone with the link</option><option value="private">Private — invitation required</option></select></Field>}<div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end"><Button type="button" variant="ghost" onClick={closeCreate}>Cancel</Button><Button type="submit">Create chatbot</Button></div></form></Modal>}
    {deleting && <Modal title={`Delete ${deleting.name}?`} close={() => setDeleting(null)}><p className="text-sm leading-6 text-muted-foreground">This permanently removes the chatbot, its knowledge sources, and its embeddings.</p><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button><Button variant="destructive" onClick={deleteBot}>Delete chatbot</Button></div></Modal>}
  </main>;
}
