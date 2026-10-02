"use client";
import { useState, type FormEvent } from "react";
import { OrganizationProfile, UserProfile, useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RealBilling } from "@/features/billing/components/real-billing";
import { Confirm, Field, Notice, Panel } from "@/components/ui";
import { downloadFile, resetWorkspace, updateWorkspace, useWorkspace } from "@/lib/workspace";

const tabs = ["Profile", "Workspace", "Team", "Clerk", "Notifications", "Billing", "Ops", "Data"];
const timezones = ["Asia/Dubai", "Europe/London", "America/New_York", "UTC"];

export function WorkspaceSettings() {
  const { orgId } = useAuth();
  const state = useWorkspace();
  const [tab, setTab] = useState("Profile");
  const [timezone, setTimezone] = useState(state.timezone);
  const [notice, setNotice] = useState("");
  const [clear, setClear] = useState(false);
  const actor = state.profile.name || state.profile.email || "Workspace admin";

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    updateWorkspace(draft => { draft.workspace = String(data.get("workspace")).trim(); draft.timezone = timezone; });
    setNotice("Changes queued for cloud storage. Any save errors appear above.");
  }
  function log(action: string, target: string) {
    return { id: crypto.randomUUID(), actor, action, target, createdAt: new Date().toISOString() };
  }
  function inviteMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const email = String(data.get("email") || "").trim().toLowerCase();
    const role = String(data.get("role") || "Viewer");
    if (!email) return;
    updateWorkspace(draft => {
      if (draft.team.some(member => member.email.toLowerCase() === email)) return;
      draft.team.push({ id: crypto.randomUUID(), name: email.split("@")[0], email, role, status: "Invited" });
      draft.auditLog.unshift(log("Invited member", `${email} as ${role}`));
    });
    form.reset();
    setNotice(`Invite recorded for ${email}. Send the Clerk invite from organization settings when ready.`);
  }
  function changeMember(id: string, role: string) {
    updateWorkspace(draft => {
      const member = draft.team.find(item => item.id === id);
      if (!member) return;
      member.role = role;
      draft.auditLog.unshift(log("Changed role", `${member.email} to ${role}`));
    });
  }
  function toggleMember(id: string) {
    updateWorkspace(draft => {
      const member = draft.team.find(item => item.id === id);
      if (!member || member.role === "Owner") return;
      member.status = member.status === "Active" ? "Suspended" : "Active";
      draft.auditLog.unshift(log(member.status === "Active" ? "Reactivated member" : "Suspended member", member.email));
    });
  }

  return <div className="space-y-5">
    <Tabs value={tab} onValueChange={(value) => { setTab(value); setNotice(""); }}>
      <TabsList aria-label="Workspace settings" className="flex h-auto flex-wrap justify-start">{tabs.map(item => <TabsTrigger key={item} value={item}>{item}</TabsTrigger>)}</TabsList>
    </Tabs>
    {tab === "Profile" && <UserProfile routing="hash"/>}
    {tab === "Workspace" && <form className="max-w-2xl space-y-4" onSubmit={save}><Panel title="Workspace details"><div className="grid gap-4"><Field label="Workspace name"><Input name="workspace" defaultValue={state.workspace} required pattern=".*\S.*" maxLength={100}/></Field><Field label="Timezone"><Select value={timezone} onValueChange={(value) => setTimezone(value ?? state.timezone)}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{timezones.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field></div></Panel><Button type="submit">Save workspace</Button></form>}
    {tab === "Team" && <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="grid gap-4"><Panel title="App roles & permissions"><div className="grid gap-3">{state.team.map(member => <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_150px_auto]" key={member.id}><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><strong className="truncate">{member.name}</strong><Badge variant={member.status === "Active" ? "default" : member.status === "Invited" ? "secondary" : "destructive"}>{member.status}</Badge></div><p className="truncate text-sm text-muted-foreground">{member.email}</p></div><Select value={member.role} disabled={member.role === "Owner"} onValueChange={value => changeMember(member.id, value ?? member.role)}><SelectTrigger aria-label={`Role for ${member.name}`}><SelectValue /></SelectTrigger><SelectContent>{["Owner", "Admin", "Editor", "Viewer"].map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select><Button variant="outline" disabled={member.role === "Owner"} onClick={() => toggleMember(member.id)}>{member.status === "Active" ? "Suspend" : "Activate"}</Button></div>)}</div></Panel><Panel title="Invite teammate"><form className="grid gap-3" onSubmit={inviteMember}><Field label="Email"><Input name="email" type="email" required placeholder="teammate@example.com"/></Field><Field label="App role"><Select name="role" defaultValue="Viewer"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Admin", "Editor", "Viewer"].map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}</SelectContent></Select></Field><Button type="submit">Add invite</Button></form><p className="mt-3 text-sm text-muted-foreground">App roles control Relay screens. Clerk organizations still control account membership and authentication.</p>{orgId ? <Button className="mt-3" variant="outline" onClick={() => setTab("Clerk")}>Open Clerk organization tools</Button> : <p className="mt-3 text-sm text-muted-foreground">Create an organization using the sidebar switcher to send real Clerk invitations.</p>}</Panel></div><Panel title="Audit log"><div className="grid gap-3">{state.auditLog.length ? state.auditLog.slice(0, 20).map(item => <div className="rounded-lg border p-3 text-sm" key={item.id}><strong>{item.action}</strong><p className="text-muted-foreground">{item.target}</p><small className="text-muted-foreground">{item.actor} · {new Date(item.createdAt).toLocaleString()}</small></div>) : <p className="text-sm text-muted-foreground">No team activity yet.</p>}</div></Panel></div>}
    {tab === "Clerk" && (orgId ? <OrganizationProfile routing="hash"/> : <Panel title="Personal workspace"><p className="text-sm text-muted-foreground">Create an organization using the sidebar switcher to invite and manage your team through Clerk.</p></Panel>)}
    {tab === "Notifications" && <Panel title="Notification preferences"><p className="mb-4 text-sm text-muted-foreground">Preferences are stored in Supabase. Delivery is not connected yet.</p><div className="divide-y rounded-lg border">{(["conversations", "training", "reports"] as const).map(key => <Label className="flex items-center justify-between gap-4 p-4" key={key}><span>{key === "conversations" ? "Rooms" : key === "training" ? "Training" : "Reports"}</span><Checkbox checked={state.notifications[key]} onCheckedChange={(checked) => updateWorkspace(draft => { draft.notifications[key] = checked === true; })}/></Label>)}</div></Panel>}
    {tab === "Billing" && <RealBilling/>}
    {tab === "Ops" && <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]"><div className="grid gap-4"><Panel title="Workspace activity feed"><div className="grid gap-3">{[...state.activity, ...state.auditLog.map(item => ({ id: `audit-${item.id}`, title: item.action, detail: item.target, createdAt: item.createdAt, type: "audit" }))].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 20).map(item => <div className="rounded-lg border p-3 text-sm" key={item.id}><div className="flex items-center justify-between gap-3"><strong>{item.title}</strong><Badge variant="outline">{item.type}</Badge></div><p className="mt-1 text-muted-foreground">{item.detail}</p><small className="text-muted-foreground">{new Date(item.createdAt).toLocaleString()}</small></div>)}</div></Panel><Panel title="AI cost tracking per assistant"><div className="grid gap-3">{state.bots.map(bot => { const cost = state.aiCosts.find(item => item.botId === bot.id); const conversations = state.conversations.filter(item => item.botId === bot.id).length; const fallback = { calls: conversations, tokens: conversations * 850, estimatedCost: Number((conversations * 0.004).toFixed(3)), period: "Current" }; const value = cost || fallback; return <div className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,1fr)_120px_120px_100px]" key={bot.id}><div className="min-w-0"><strong className="block truncate">{bot.name}</strong><small className="text-muted-foreground">{value.period}</small></div><span className="text-sm text-muted-foreground">{value.calls} calls</span><span className="text-sm text-muted-foreground">{value.tokens.toLocaleString()} tokens</span><strong>${value.estimatedCost.toFixed(3)}</strong></div>; })}</div></Panel></div><div className="grid gap-4"><Panel title="Usage billing summary"><div className="space-y-3 text-sm"><div className="flex items-center justify-between rounded-lg border p-3"><span>Plan</span><strong>{state.plan}</strong></div><div className="flex items-center justify-between rounded-lg border p-3"><span>Cycle</span><strong>{state.cycle}</strong></div><div className="flex items-center justify-between rounded-lg border p-3"><span>Estimated AI cost</span><strong>${state.aiCosts.reduce((sum, item) => sum + item.estimatedCost, 0).toFixed(3)}</strong></div><Button className="w-full" variant="outline" onClick={() => setTab("Billing")}>Open billing</Button></div></Panel><Panel title="Audit log"><div className="grid gap-3">{state.auditLog.length ? state.auditLog.slice(0, 8).map(item => <div className="rounded-lg border p-3 text-sm" key={item.id}><strong>{item.action}</strong><p className="text-muted-foreground">{item.target}</p><small className="text-muted-foreground">{item.actor} · {new Date(item.createdAt).toLocaleString()}</small></div>) : <p className="text-sm text-muted-foreground">No audit events yet.</p>}</div></Panel></div></div>}
    {tab === "Data" && <Panel title="Workspace data"><p className="text-sm text-muted-foreground">Your assistants, library sources, rooms and preferences are stored in Supabase. Text and FAQ sources can be trained for real AI answers. Playground rooms are temporary.</p><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" onClick={() => downloadFile("relay-workspace.json", JSON.stringify(state, null, 2), "application/json")}>Export data</Button><Button variant="destructive" onClick={() => setClear(true)}>Clear workspace data</Button></div></Panel>}
    <Notice>{notice}</Notice>
    {clear && <Confirm title="Clear saved workspace data?" close={() => setClear(false)} confirm={() => resetWorkspace(true)}>This deletes the assistants, library sources and rooms in this workspace. Export a copy first. Your Clerk account and billing subscription remain active.</Confirm>}
  </div>;
}
