"use client";
import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { H2 } from "@/components/ui/typography";
import { Button } from "@/components/ui/button";
import { Badge, Empty, Notice, Panel } from "@/components/ui";
import { Icon } from "@/components/icon";
import { downloadFile, requestWorkspaceApi } from "@/lib/workspace";

type UsageMember = { userId: string | null; name: string; files: number; chunks: number; r2Bytes: number; vectorBytes: number; aiCalls: number; messages: number; isCurrent: boolean };
type UsageData = {
  period: { label: string; startsAt: string };
  totals: { chunks: number; r2Bytes: number; vectorBytes: number; files: number; aiCalls: number; messages: number; conversations: number; accountMembers: number };
  limits: { plan: string; bots: number; members: number; storageBytes: number; chunks: number; aiCalls: number };
  members: UsageMember[];
  trends: { date: string; aiCalls: number; embeddedChunks: number }[];
};

const compact = (value: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(value);
const bytes = (value: number) => {
  if (!value) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const unit = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
  return `${(value / 1024 ** unit).toFixed(unit ? 1 : 0)} ${units[unit]}`;
};
const percent = (used: number, limit: number) => limit > 0 ? Math.min(100, Math.round(used / limit * 100)) : 0;
const csvCell = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;

export function Analytics() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let active = true;
    requestWorkspaceApi<UsageData>("/analytics/usage")
      .then(result => { if (active) setUsage(result); })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : "Usage could not be loaded."); });
    return () => { active = false; };
  }, []);

  if (error) return <Empty title="Usage data is unavailable"><p>{error}</p><Button onClick={() => window.location.reload()}>Try again</Button></Empty>;
  if (!usage) return <div className="grid gap-4" role="status" aria-label="Loading usage analytics"><div className="h-32 animate-pulse rounded-xl border bg-card"/><div className="h-32 animate-pulse rounded-xl border bg-card"/><div className="h-32 animate-pulse rounded-xl border bg-card"/></div>;

  const quotas = [
    { label: "R2 storage", used: usage.totals.r2Bytes, limit: usage.limits.storageBytes, display: bytes },
    { label: "Searchable chunks", used: usage.totals.chunks, limit: usage.limits.chunks, display: compact },
    { label: "AI calls this month", used: usage.totals.aiCalls, limit: usage.limits.aiCalls, display: compact },
    { label: "Account members", used: usage.totals.accountMembers, limit: usage.limits.members, display: compact },
  ];
  const maxTrend = Math.max(1, ...usage.trends.flatMap(day => [day.aiCalls, day.embeddedChunks]));
  const exportData = () => {
    const header = "Member,R2 storage bytes,Files,Chunks,Vector bytes,AI calls this month,Messages\n";
    const rows = usage.members.map(member => [member.name, member.r2Bytes, member.files, member.chunks, member.vectorBytes, member.aiCalls, member.messages].map(csvCell).join(",")).join("\n");
    downloadFile("relay-usage-by-user.csv", header + rows, "text/csv");
    setNotice("Usage report downloaded.");
  };

  return <>
    <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><H2>Usage and capacity</H2><p className="mt-1 text-sm text-muted-foreground">Live workspace totals for your {usage.limits.plan} plan.</p></div><Button variant="outline" onClick={exportData}><Icon name="chart" size={14}/>Export CSV</Button></div>
    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{quotas.map(item => {
      const used = percent(item.used, item.limit);
      return <Panel key={item.label} title={item.label}><div className="flex items-baseline justify-between gap-2"><strong className="text-2xl">{item.display(item.used)}</strong><span className="text-xs text-muted-foreground">of {item.display(item.limit)}</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-label={`${item.label}: ${used}% used`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={used}><span className="block h-full rounded-full bg-primary" style={{ width: `${used}%` }}/></div><p className="mt-2 text-xs text-muted-foreground">{used}% used</p></Panel>;
    })}</div>
    <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[
      ["Library files", compact(usage.totals.files), "Stored sources"],
      ["Vector footprint", bytes(usage.totals.vectorBytes), "Embeddings + chunk text"],
      ["Chat rooms", compact(usage.totals.conversations), "Rooms with messages"],
      ["Messages", compact(usage.totals.messages), "All shared chat activity"],
    ].map(([title, value, label]) => <Panel key={title} title={title}><strong className="block text-3xl font-semibold">{value}</strong><p className="mt-1 text-sm text-muted-foreground">{label}</p></Panel>)}</div>
    <div className="mb-5 grid gap-4 lg:grid-cols-2">
      <Panel title="14-day activity"><p className="text-sm text-muted-foreground">AI calls and chunks embedded across the workspace.</p><div className="mt-5 flex h-48 items-end gap-2 border-b" role="img" aria-label={usage.trends.map(day => `${day.date}: ${day.aiCalls} AI calls and ${day.embeddedChunks} chunks`).join(", ")}>{usage.trends.map(day => <div className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" key={day.date}><div className="flex h-full w-full items-end justify-center gap-1"><span className="w-2 rounded-t bg-primary" style={{ height: `${Math.max(day.aiCalls ? 6 : 1, day.aiCalls / maxTrend * 100)}%` }}/><span className="w-2 rounded-t bg-muted-foreground" style={{ height: `${Math.max(day.embeddedChunks ? 6 : 1, day.embeddedChunks / maxTrend * 100)}%` }}/></div><small className="text-[10px] text-muted-foreground">{day.date.slice(5)}</small></div>)}</div><div className="mt-4 flex gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><i className="size-2 rounded bg-primary"/>AI calls</span><span className="flex items-center gap-2"><i className="size-2 rounded bg-muted-foreground"/>Embedded chunks</span></div></Panel>
      <Panel title="How usage is counted"><div className="divide-y rounded-lg border text-sm"><div className="flex justify-between gap-3 p-3"><span className="text-muted-foreground">R2 storage</span><strong>Uploaded file size</strong></div><div className="flex justify-between gap-3 p-3"><span className="text-muted-foreground">Vector footprint</span><strong>Database estimate</strong></div><div className="flex justify-between gap-3 p-3"><span className="text-muted-foreground">AI calls</span><strong>Current calendar month</strong></div><div className="flex justify-between gap-3 p-3"><span className="text-muted-foreground">Older records</span><strong>Shown as unattributed</strong></div></div></Panel>
    </div>
    <Panel title="Usage by user"><p className="mb-4 text-sm text-muted-foreground">Account activity is attributed from uploads, training jobs, and shared chats. Guest activity and older data stay visible as unattributed.</p><div className="overflow-x-auto rounded-lg border"><Table><TableHeader><TableRow><TableHead>User</TableHead><TableHead>R2 storage</TableHead><TableHead>Files</TableHead><TableHead>Chunks</TableHead><TableHead>Vector data</TableHead><TableHead>AI calls</TableHead><TableHead>Messages</TableHead></TableRow></TableHeader><TableBody>{usage.members.map(member => <TableRow key={member.userId || "unattributed"}><TableCell><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-secondary text-xs font-semibold">{member.name.slice(0, 2).toUpperCase()}</span><strong>{member.name}</strong>{member.isCurrent && <Badge>You</Badge>}</div></TableCell><TableCell>{bytes(member.r2Bytes)}</TableCell><TableCell>{compact(member.files)}</TableCell><TableCell>{compact(member.chunks)}</TableCell><TableCell>{bytes(member.vectorBytes)}</TableCell><TableCell>{compact(member.aiCalls)}</TableCell><TableCell>{compact(member.messages)}</TableCell></TableRow>)}</TableBody></Table></div></Panel>
    <Notice>{notice}</Notice>
  </>;
}


