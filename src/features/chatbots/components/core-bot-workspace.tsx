"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, Modal, Notice } from "@/components/ui";
import { Icon, type IconName } from "@/components/icon";
import { CoreKnowledge } from "@/features/knowledge/components/core-knowledge";
import { CorePlayground } from "./core-playground";
import { requestWorkspaceApi, updateWorkspace, type Assistant } from "@/lib/workspace";

const tabs: Array<{ value: string; label: string; description: string; icon: IconName }> = [
  { value: "knowledge", label: "Knowledge", description: "Add sources", icon: "book" },
  { value: "playground", label: "Test", description: "Check answers", icon: "chat" },
  { value: "embed", label: "Publish", description: "Share or embed", icon: "external" },
  { value: "settings", label: "Settings", description: "Tune behavior", icon: "sliders" },
];

export function CoreBotWorkspace({ bot, tab }: { bot: Assistant; tab: string }) {
  const router = useRouter();
  const [draft, setDraft] = useState(bot);
  const [notice, setNotice] = useState("");
  const [deployment, setDeployment] = useState<{ published: boolean; shareId?: string }>({ published: false });
  const [busy, setBusy] = useState(false);
  const [invite, setInvite] = useState<{ url: string; emailed: boolean } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (tab !== "embed") return;
    void requestWorkspaceApi<{ published: boolean; shareId?: string }>(`/deploy/${bot.id}`).then(setDeployment).catch(error => setNotice(error.message));
  }, [bot.id, tab]);

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateWorkspace(workspace => {
      workspace.bots = workspace.bots.map(item => item.id === bot.id ? { ...item, ...draft, name: draft.name.trim() || item.name } : item);
    });
    setNotice("Chatbot settings saved.");
  }

  async function togglePublish() {
    setBusy(true);
    setNotice("");
    try {
      if (deployment.published) {
        await requestWorkspaceApi(`/deploy/${bot.id}`, { method: "DELETE" });
        setDeployment({ ...deployment, published: false });
      } else {
        const result = await requestWorkspaceApi<{ published: boolean; shareId: string }>(`/deploy/${bot.id}/publish`, { method: "POST", body: "{}" });
        setDeployment(result);
      }
    } catch (error) { setNotice(error instanceof Error ? error.message : "Deployment failed."); }
    finally { setBusy(false); }
  }

  const apiOrigin = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";
  const snippet = deployment.shareId ? `<script src="${apiOrigin}/embed.js" data-chatbot="${deployment.shareId}" defer></script>` : "";
  const shareUrl = deployment.shareId && typeof window !== "undefined" ? `${window.location.origin}/share/${deployment.shareId}` : "";

  async function sendInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setInvite(null);
    const email = String(new FormData(event.currentTarget).get("email") || "");
    try {
      const result = await requestWorkspaceApi<{ inviteUrl: string; emailed: boolean }>(`/deploy/${bot.id}/invitations`, { method: "POST", body: JSON.stringify({ email }) });
      setInvite({ url: result.inviteUrl, emailed: result.emailed });
      setNotice(result.emailed ? "Invitation email sent." : "Invitation link created. Configure Resend to deliver emails automatically.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not create invitation."); }
    finally { setBusy(false); }
  }

  async function copyValue(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setNotice(`${label} copied.`); }
    catch { setNotice(`${label} could not be copied. Select it manually.`); }
  }

  async function deleteChatbot() {
    setBusy(true); setNotice("");
    try {
      await requestWorkspaceApi(`/deploy/${bot.id}`, { method: "DELETE" });
      const saved = await updateWorkspace(workspace => {
        workspace.bots = workspace.bots.filter(item => item.id !== bot.id);
        workspace.sources = workspace.sources.filter(source => source.botId !== bot.id);
      });
      if (!saved) throw new Error("The chatbot could not be deleted from the workspace.");
      setConfirmDelete(false); router.push("/dashboard/chatbots");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not delete chatbot."); }
    finally { setBusy(false); }
  }

  return <div className="space-y-6">
    <nav className="-mx-4 overflow-x-auto border-b px-4 sm:-mx-6 sm:px-6" aria-label={`${bot.name} sections`}><div className="flex min-w-max gap-1">{tabs.map(item => <Link className={`group relative flex min-h-16 items-center gap-3 px-3 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-4 ${tab === item.value ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`} href={`/dashboard/chatbots/${bot.id}/${item.value}`} key={item.value} aria-current={tab === item.value ? "page" : undefined}><Icon name={item.icon}/><span className="text-left"><span className="block text-sm font-medium">{item.label}</span><span className="hidden text-xs text-muted-foreground sm:block">{item.description}</span></span>{tab === item.value && <span className="absolute inset-x-3 bottom-0 h-0.5 bg-primary"/>}</Link>)}</div></nav>
    {tab === "settings" && <div className="mx-auto max-w-5xl space-y-6"><form className="space-y-6" onSubmit={save}>
      <section className="rounded-2xl border bg-card"><div className="border-b px-5 py-4 sm:px-6"><h2 className="font-medium">Chatbot details</h2><p className="mt-1 text-sm text-muted-foreground">The name and description people see when they open this chatbot.</p></div><div className="grid gap-4 p-5 sm:p-6 lg:grid-cols-2"><Field label="Name"><Input value={draft.name} maxLength={60} required onChange={event => setDraft({ ...draft, name: event.target.value })}/></Field><Field label="Description"><Input value={draft.description} maxLength={180} onChange={event => setDraft({ ...draft, description: event.target.value })}/></Field></div></section>
      <section className="rounded-2xl border bg-card"><div className="border-b px-5 py-4 sm:px-6"><h2 className="font-medium">Answer behavior</h2><p className="mt-1 text-sm text-muted-foreground">Tell Relay how to answer when it finds relevant knowledge.</p></div><div className="p-5 sm:p-6"><Field label="Instructions"><Textarea value={draft.instructions} rows={7} maxLength={4000} onChange={event => setDraft({ ...draft, instructions: event.target.value })}/></Field><p className="mt-2 text-right text-xs tabular-nums text-muted-foreground">{draft.instructions.length} / 4,000</p></div></section>
      <section className="rounded-2xl border bg-card"><div className="border-b px-5 py-4 sm:px-6"><h2 className="font-medium">Visitor messages</h2><p className="mt-1 text-sm text-muted-foreground">Set the first message and what Relay says when knowledge is insufficient.</p></div><div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2"><Field label="Welcome message"><Textarea value={draft.welcome} rows={4} maxLength={500} onChange={event => setDraft({ ...draft, welcome: event.target.value })}/></Field><Field label="Fallback answer"><Textarea value={draft.fallback} rows={4} maxLength={600} onChange={event => setDraft({ ...draft, fallback: event.target.value })}/></Field></div></section>
      <div className="flex justify-end"><Button type="submit">Save settings</Button></div>
    </form><section className="flex flex-col gap-4 rounded-2xl border border-destructive/30 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><h2 className="font-medium text-destructive">Delete chatbot</h2><p className="mt-1 max-w-2xl text-sm text-muted-foreground">Remove this chatbot, its knowledge, published link, and indexed content permanently.</p></div><Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)}>Delete chatbot</Button></section></div>}
    {tab === "knowledge" && <CoreKnowledge botId={bot.id}/>}
    {tab === "playground" && <CorePlayground bot={bot}/>}
    {tab === "embed" && <div className="mx-auto max-w-5xl space-y-5"><section className="overflow-hidden rounded-2xl border bg-card"><div className="flex flex-col gap-5 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><div className="flex items-center gap-2"><h2 className="text-lg font-medium">{bot.kind === "shared" ? "Shared room" : "Website chatbot"}</h2><span className={`rounded-full px-2.5 py-1 text-xs font-medium ${deployment.published ? "bg-[#9ae187]/15 text-[#9ae187]" : "bg-muted text-muted-foreground"}`}>{deployment.published ? "Published" : "Not published"}</span></div><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{bot.kind === "shared" ? bot.visibility === "private" ? "Only invited members can open this room." : "Anyone with the hosted link can join as a guest." : "Publish this chatbot before adding its embed code to your website."}</p></div><Button disabled={busy} variant={deployment.published ? "outline" : "default"} onClick={() => void togglePublish()}>{busy ? "Updating…" : deployment.published ? "Unpublish chatbot" : "Publish chatbot"}</Button></div>
      {deployment.published ? <div className="space-y-6 p-5 sm:p-6">{shareUrl && <div><h3 className="text-sm font-medium">Hosted link</h3><p className="mt-1 text-sm text-muted-foreground">Open this link to check the published experience or share it with visitors.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input value={shareUrl} readOnly aria-label="Hosted chatbot link"/><Button variant="outline" onClick={() => void copyValue(shareUrl, "Hosted link")}><Icon name="copy"/>Copy link</Button><Button variant="ghost" nativeButton={false} render={<a href={shareUrl} target="_blank" rel="noreferrer"/>}><Icon name="external"/>Open</Button></div></div>}{bot.kind === "shared" && bot.visibility === "private" && <form className="border-t pt-6" onSubmit={sendInvite}><h3 className="text-sm font-medium">Invite a member</h3><p className="mt-1 text-sm text-muted-foreground">Create a private invitation for one email address.</p><div className="mt-3 flex flex-col gap-2 sm:flex-row"><Input name="email" type="email" required placeholder="person@example.com" aria-label="Member email"/><Button type="submit" disabled={busy}>Send invitation</Button></div>{invite && <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted p-3"><p className="min-w-0 flex-1 truncate text-xs">{invite.url}</p><Button size="sm" variant="ghost" onClick={() => void copyValue(invite.url, "Invitation link")} type="button">Copy</Button></div>}</form>}{bot.kind !== "shared" && snippet && <div className="border-t pt-6"><h3 className="text-sm font-medium">Embed code</h3><p className="mt-1 text-sm text-muted-foreground">Paste this script before the closing body tag on your website.</p><div className="mt-3 rounded-xl bg-background p-4 font-mono text-xs leading-6 text-muted-foreground break-all">{snippet}</div><Button className="mt-3" variant="outline" onClick={() => void copyValue(snippet, "Embed code")}><Icon name="copy"/>Copy embed code</Button></div>}</div> : <div className="p-8 text-center sm:p-12"><span className="mx-auto grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground"><Icon name="external"/></span><h3 className="mt-5 font-medium">Publish when answers are ready</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Add knowledge and test a few questions first. Publishing creates the hosted link and embed code.</p><Button className="mt-6" disabled={busy} onClick={() => void togglePublish()}>Publish chatbot</Button></div>}</section></div>}
    <Notice>{notice}</Notice>
    {confirmDelete && <Modal title={`Delete ${bot.name}?`} close={() => !busy && setConfirmDelete(false)}><p className="text-sm leading-6 text-muted-foreground">This permanently removes the chatbot and every connected knowledge source. This cannot be undone.</p><div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>Cancel</Button><Button variant="destructive" disabled={busy} onClick={() => void deleteChatbot()}>{busy ? "Deleting…" : "Delete chatbot"}</Button></div></Modal>}
  </div>;
}
