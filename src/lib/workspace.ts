"use client";

import { useEffect, useSyncExternalStore } from "react";
import { io } from "socket.io-client";
import { demoBots, type Bot } from "./demo-data";
import type { ApiRequest } from './api';
import { beginCloudWorkspace, mergeCloudWorkspace, type CloudWorkspaceResponse } from './cloud-state';

export type Assistant = Bot & {
  welcome: string; tone: string; instructions: string; suggestions: string;
  fallback: string; handoff: boolean; accent: string; avatar: string;
  position: string; launcher: string; domains: string; published: boolean;
  leadCapture: boolean; leadFields: string;
  verifiedDomains: string; themePreset: string; openingRule: string;
  businessHours: string; offlineCapture: boolean;
};
export type ChangedPage = { url: string; title: string; status: "New" | "Changed" | "Removed" | "Unchanged"; lastSeenAt: string };
export type Source = { id: string; botId: string; title: string; type: string; content: string; status: "Ready" | "Processing" | "Error" | "Pending"; updated: string; filename?: string; size?: number; progress?: number; progressStage?: string; progressDetail?: string; processedChunks?: number; totalChunks?: number; processingError?: string | null; sourceUrl?: string; sitemapUrl?: string; recrawl?: "Manual" | "Daily" | "Weekly" | "Monthly"; lastSyncedAt?: string; changedPages?: ChangedPage[]; connector?: { provider: string; site: string; items: number } };
export type ChatMessage = { id: string; role: "user" | "assistant"; text: string; source?: string; feedback?: string };
export type Conversation = { id: string; botId: string; name: string; email: string; date: string; status: string; topic: string; tags: string[]; notes: string[]; messages: ChatMessage[] };
export type BotTest = { id: string; botId: string; question: string; expected?: string; status: "Untested" | "Passed" | "Needs review"; lastRun?: string; answer?: string };
export type FeedbackItem = { id: string; botId: string; conversationId?: string; messageId?: string; rating: "up" | "down"; note: string; createdAt: string; resolved: boolean };
export type Lead = { id: string; botId: string; name: string; email: string; source: string; status: "New" | "Contacted" | "Qualified"; createdAt: string; notes: string };
export type AuditLog = { id: string; actor: string; action: string; target: string; createdAt: string };
export type ActivityItem = { id: string; botId?: string; type: string; title: string; detail: string; createdAt: string };
export type AiCost = { id: string; botId: string; period: string; calls: number; tokens: number; estimatedCost: number };
export type Workspace = {
  version: number; ready: boolean; storageError: string; signedIn: boolean; verified: boolean; onboarded: boolean;
  profile: { name: string; email: string }; workspace: string; timezone: string;
  bots: Assistant[]; sources: Source[]; conversations: Conversation[];
  tests: BotTest[]; feedback: FeedbackItem[]; leads: Lead[];
  team: { id: string; name: string; email: string; role: string; status: string }[];
  auditLog: AuditLog[]; activity: ActivityItem[]; aiCosts: AiCost[];
  notifications: { conversations: boolean; training: boolean; reports: boolean };
  plan: string; cycle: string; trialEndsAt?: string; trialDaysRemaining?: number; autoPay: boolean;
};
export function makeBot(name: string, category = "Support", description = "Your next helpful assistant."): Assistant {
  return { id: crypto.randomUUID(), name, description, category, status: "Draft", sources: 0, conversations: 0, color: "violet", icon: "chat", welcome: "Hi there! What should we look up together?", tone: "Friendly", instructions: "Be concise, helpful, and answer using the provided library sources.", suggestions: "Summarize this document\nFind the key result\nExplain this concept", fallback: "I’m not sure about that yet. Add the right source to the library and try again.", handoff: true, accent: "#1554db", avatar: "R", position: "Bottom right", launcher: "chat", domains: "", published: false, leadCapture: true, leadFields: "Name\nEmail\nTeam or class", verifiedDomains: "", themePreset: "Default", openingRule: "Manual", businessHours: "Mon-Fri, 9:00-17:00", offlineCapture: true };
}
function seed(): Workspace {
  const bots = demoBots.map(bot => ({ ...bot, welcome: `Hi! I’m ${bot.name}. What should we look up together?`, tone: "Friendly", instructions: "Answer clearly using the provided library sources. Be honest when you do not know.", suggestions: "Summarize this document\nFind the key result\nExplain this concept", fallback: "I don’t have that answer in the library yet.", handoff: true, accent: "#1554db", avatar: bot.name[0], position: "Bottom right", launcher: "chat", domains: "example.com", published: bot.status === "Active", leadCapture: true, leadFields: "Name\nEmail\nTeam or class", verifiedDomains: bot.status === "Active" ? "example.com" : "", themePreset: "Default", openingRule: "Manual", businessHours: "Mon-Fri, 9:00-17:00", offlineCapture: true }));
  const sources: Source[] = bots.flatMap(bot => [{ id: `${bot.id}-guide`, botId: bot.id, title: "Getting started guide", type: "Text", content: "Welcome! Create your account, name your workspace, and add your first assistant. You can test every feature in this local demo.", status: "Ready" as const, updated: "2026-09-07", recrawl: "Manual" as const }, { id: `${bot.id}-faq`, botId: bot.id, title: "Plans and billing FAQ", type: "FAQ", content: "Which plans are available?\nThe demo includes Starter, Growth, and Scale plans. All prices are illustrative and no payment is processed.", status: "Ready" as const, updated: "2026-09-07", recrawl: "Manual" as const }]);
  const conversations: Conversation[] = Array.from({ length: 18 }, (_, i) => {
    const bot = bots[i % bots.length]; const topic = ["How do I get started?", "Which plan is right for me?", "Can I export my data?", "Where is my order?"][i % 4];
    return { id: `conversation-${i}`, botId: bot.id, name: ["Alex Morgan", "Jamie Chen", "Sam Taylor", "Robin Lee", "Casey Patel", "Jordan Kim"][i % 6], email: `visitor${i + 1}@example.com`, date: `2026-09-${String(7 - (i % 7)).padStart(2, "0")}T${String(9 + i % 9).padStart(2, "0")}:20:00`, status: i % 3 === 0 ? "Open" : "Resolved", topic, tags: [i % 2 ? "Product" : "Support"], notes: [], messages: [{ id: `q-${i}`, role: "user", text: topic }, { id: `a-${i}`, role: "assistant", text: i % 4 > 1 ? bot.fallback : "Here’s a sample answer from our help center. You can create a workspace, add your knowledge, and test your assistant in the playground.", source: `${bot.id}-guide`, feedback: i % 5 === 0 ? "down" : i % 4 === 0 ? "up" : undefined }] };
  });
  const tests: BotTest[] = bots.flatMap(bot => ["How do I get started?", "Which plan is right for me?"].map(question => ({ id: crypto.randomUUID(), botId: bot.id, question, expected: "Answer should cite a ready source.", status: "Untested" as const })));
  const feedback: FeedbackItem[] = conversations.flatMap(conversation => conversation.messages.filter(message => message.feedback).map(message => ({ id: crypto.randomUUID(), botId: conversation.botId, conversationId: conversation.id, messageId: message.id, rating: message.feedback === "up" ? "up" as const : "down" as const, note: message.feedback === "up" ? "Helpful answer" : "Visitor said this needs review", createdAt: conversation.date, resolved: false })));
  const leads: Lead[] = conversations.slice(0, 6).map(conversation => ({ id: crypto.randomUUID(), botId: conversation.botId, name: conversation.name, email: conversation.email, source: "Shared room", status: "New" as const, createdAt: conversation.date, notes: conversation.topic }));
  const auditLog: AuditLog[] = [{ id: crypto.randomUUID(), actor: "System", action: "Workspace created", target: "My workspace", createdAt: new Date().toISOString() }];
  const activity: ActivityItem[] = [{ id: crypto.randomUUID(), type: "workspace", title: "Workspace created", detail: "Relay demo workspace is ready.", createdAt: new Date().toISOString() }];
  const aiCosts: AiCost[] = bots.map(bot => ({ id: crypto.randomUUID(), botId: bot.id, period: "Sep 2026", calls: conversations.filter(item => item.botId === bot.id).length, tokens: conversations.filter(item => item.botId === bot.id).length * 850, estimatedCost: Number((conversations.filter(item => item.botId === bot.id).length * 0.004).toFixed(3)) }));
  return { version: 1, ready: false, storageError: "", signedIn: false, verified: false, onboarded: false, profile: { name: "Jamie Davis", email: "jamie@example.com" }, workspace: "My workspace", timezone: "Asia/Dubai", bots, sources, conversations, tests, feedback, leads, team: [{ id: "owner", name: "Jamie Davis", email: "jamie@example.com", role: "Owner", status: "Active" }, { id: "member", name: "Alex Morgan", email: "alex@example.com", role: "Editor", status: "Active" }], auditLog, activity, aiCosts, notifications: { conversations: true, training: true, reports: false }, plan: "Trial", cycle: "7-day trial", autoPay: true };
}
const KEY = "relay-workspace-v1";
const initial = seed();
let state = initial;
let cloudApi: ApiRequest | null = null;
let connection: { revision: number; blocked: boolean } | null = null;
let cloudGeneration = 0;
let saveQueue = Promise.resolve();
let cloudBlocked = false;
let cloudCanEdit = false;
let cloudScope: string | null = null;
function cloudData(value: Workspace) {
  const { workspace, timezone, onboarded, bots, sources, conversations, tests, feedback, leads, team, auditLog, activity, aiCosts, notifications } = value;
  return { workspace, timezone, onboarded, bots, sources, conversations, tests, feedback, leads, team, auditLog, activity, aiCosts, notifications };
}
export function connectWorkspace(api: ApiRequest, profile: Workspace['profile'], loaded: (error?: string) => void, scope = "default") {
  const generation = ++cloudGeneration;
  const sameWorkspace = cloudScope === scope && state.ready;
  cloudScope = scope;
  cloudApi = api; cloudBlocked = true;
  const session = { revision: 0, blocked: false }; connection = session;
  state = beginCloudWorkspace(state, seed(), profile, sameWorkspace);
  if (!sameWorkspace) emit();
  saveQueue.then(() => api<CloudWorkspaceResponse>('/workspace')).then(result => {
    if (generation !== cloudGeneration) return;
    state = mergeCloudWorkspace(state, result);
    session.revision = result.revision; cloudCanEdit = result.canEdit; cloudBlocked = false;
    emit(); loaded();
  }).catch(error => { if (generation === cloudGeneration) loaded(error.message); });
  return () => {
    if (generation !== cloudGeneration) return;
    cloudGeneration++;
    cloudApi = null;
    cloudBlocked = true;
    connection = null;
  };
}
const listeners = new Set<() => void>();
const subscribe = (callback: () => void) => { listeners.add(callback); return () => { listeners.delete(callback); }; };
function emit() { listeners.forEach(callback => callback()); }
type KnowledgeProgress = { sourceId: string; status: string; progress: number; stage: string; detail?: string; processedChunks?: number; totalChunks?: number; error?: string | null };
function applyKnowledgeProgress(event: KnowledgeProgress) {
  const source = state.sources.find(item => item.id === event.sourceId);
  if (!source) return;
  const next = structuredClone(state); const item = next.sources.find(value => value.id === event.sourceId);
  if (!item) return;
  item.status = event.status === 'ready' ? 'Ready' : event.status === 'error' ? 'Error' : 'Processing';
  item.progress = event.progress; item.progressStage = event.stage; item.progressDetail = event.detail;
  item.processedChunks = event.processedChunks; item.totalChunks = event.totalChunks; item.processingError = event.error;
  if (item.status === 'Ready') item.updated = new Date().toISOString().slice(0,10);
  state = next; emit();
}
type TokenGetter = (options?: { skipCache?: boolean }) => Promise<string | null>;
export function connectKnowledgeProgress(getToken: TokenGetter, workspaceId: string) {
  const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000', {
    auth: async done => done({ token: await getToken({ skipCache: true }), workspaceId }),
  });
  socket.on('knowledge:progress', applyKnowledgeProgress);
  return () => socket.disconnect();
}
async function refreshCloudWorkspace() {
  const api = cloudApi; const session = connection; const generation = cloudGeneration;
  if (!api || !session) return false;
  const result = await api<CloudWorkspaceResponse>('/workspace');
  if (generation !== cloudGeneration) return false;
  state = mergeCloudWorkspace(state, result);
  session.revision = result.revision;
  cloudCanEdit = result.canEdit;
  cloudBlocked = false;
  emit();
  return true;
}
function persist() {
  if (cloudApi) {
    const api = cloudApi; const generation = cloudGeneration; const data = cloudData(state); const session = connection;
    saveQueue = saveQueue.then(async () => {
      if (!session || session.blocked) return;
      try {
        const result = await api<{ revision: number }>('/workspace', { method: 'PUT', body: JSON.stringify({ data, revision: session.revision }) });
        session.revision = result.revision;
        if (generation === cloudGeneration) { state = { ...state, storageError: '' }; emit(); }
      } catch (error) {
        session.blocked = true;
        if (generation !== cloudGeneration) return;
        cloudBlocked = true;
        state = { ...state, storageError: `${error instanceof Error ? error.message : 'Save failed'}. Changes are not saved. Export your work, then reload to reconnect.` }; emit();
      }
    });
    return;
  }
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch { state = { ...state, storageError: "Browser storage is unavailable or full. Current changes work here but may not survive refresh." }; }
}
function hydrate() {
  if (cloudApi) return;
  if (state.ready) return;
  let warning = "";
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Workspace;
      if (parsed.version !== 1 || !Array.isArray(parsed.bots) || !Array.isArray(parsed.sources) || !Array.isArray(parsed.conversations) || !Array.isArray(parsed.team) || !parsed.profile || !parsed.notifications) throw new Error("Invalid demo data");
      const fresh = seed();
      state = { ...fresh, ...parsed, bots: parsed.bots.map(bot => ({ ...makeBot(bot.name, bot.category, bot.description), ...bot })), tests: parsed.tests || fresh.tests, feedback: parsed.feedback || fresh.feedback, leads: parsed.leads || fresh.leads, auditLog: parsed.auditLog || fresh.auditLog, activity: parsed.activity || fresh.activity, aiCosts: parsed.aiCosts || fresh.aiCosts };
      state.sources = state.sources.map(source => source.status === "Processing" ? { ...source, status: "Error" } : source);
    }
  } catch { warning = "Saved demo data could not be loaded. A fresh sample workspace is ready."; state = seed(); }
  state = { ...state, ready: true, storageError: warning }; emit();
}
export function updateWorkspace(change: (draft: Workspace) => void) {
  if (cloudApi && (cloudBlocked || !cloudCanEdit)) return;
  const next = structuredClone(state); change(next); state = next; persist(); emit();
}
export function resetWorkspace(empty = false) {
  if (cloudApi) { updateWorkspace(d => { d.bots = []; d.sources = []; d.conversations = []; d.tests = []; d.feedback = []; d.leads = []; d.onboarded = false; }); return; }
  state = { ...seed(), ready: true, signedIn: true, verified: true, onboarded: !empty };
  if (empty) { state.bots = []; state.sources = []; state.conversations = []; state.tests = []; state.feedback = []; state.leads = []; }
  persist(); emit();
}
export function useWorkspace() {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => initial);
  useEffect(hydrate, []);
  return snapshot;
}
export async function requestAi<T>(path: string, body: unknown): Promise<T> {
  const api = cloudApi; const generation = cloudGeneration;
  if (!api) throw new Error('Sign in to your workspace to use AI.');
  await saveQueue;
  if (cloudBlocked || generation !== cloudGeneration) throw new Error('Reconnect your workspace before using AI.');
  return api<T>(`/ai${path}`, { method: 'POST', body: JSON.stringify(body) });
}
export async function requestAiStream<T>(path: string, body: unknown, onEvent: (event: T) => void): Promise<void> {
  const api = cloudApi; const generation = cloudGeneration;
  if (!api) throw new Error('Sign in to your workspace to use AI.');
  await saveQueue;
  if (cloudBlocked || generation !== cloudGeneration) throw new Error('Reconnect your workspace before using AI.');
  await api.stream<T>(`/ai${path}`, { method: 'POST', body: JSON.stringify(body) }, onEvent);
}
export async function requestWorkspaceApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const api = cloudApi; const generation = cloudGeneration;
  if (!api) throw new Error('Sign in to your workspace to continue.');
  await saveQueue;
  if (cloudBlocked || generation !== cloudGeneration) throw new Error('Reconnect your workspace before continuing.');
  return api<T>(path, options);
}
export async function uploadKnowledgeFile(id: string, botId: string, file: File) {
  const api = cloudApi; const generation = cloudGeneration;
  if (!api) throw new Error('Sign in to upload documents.');
  await saveQueue;
  if (cloudBlocked || generation !== cloudGeneration) throw new Error('Reconnect your workspace before uploading.');
  const form = new FormData(); form.append('sourceId', id); form.append('botId', botId); form.append('file', file);
  await api('/knowledge/upload', { method: 'POST', body: form });
  void pollKnowledgeFile(id, generation);
}
async function pollKnowledgeFile(id: string, generation: number) {
  for (let attempt = 0; attempt < 90; attempt++) {
    await new Promise(resolve => setTimeout(resolve, attempt < 10 ? 1500 : 3000));
    const api = cloudApi;
    if (!api || generation !== cloudGeneration) return;
    const source = state.sources.find(item => item.id === id);
    if (!source || source.status === "Ready" || source.status === "Error") return;
    try {
      const file = await api<{ status: string; error?: string | null; progress?: number; stage?: string; detail?: string; processedChunks?: number; totalChunks?: number }>('/ai/status/source', { method: 'POST', body: JSON.stringify({ sourceId: id }) });
      if (generation !== cloudGeneration) return;
      updateWorkspace(draft => {
        const item = draft.sources.find(source => source.id === id);
        if (!item) return;
        item.status = file.status === 'ready' ? 'Ready' : file.status === 'error' ? 'Error' : 'Processing';
        item.progress = file.progress ?? item.progress;
        item.progressStage = file.stage || item.progressStage;
        item.progressDetail = file.detail || item.progressDetail;
        item.processedChunks = file.processedChunks;
        item.totalChunks = file.totalChunks;
        item.processingError = file.error;
        if (item.status === 'Ready') item.updated = new Date().toISOString().slice(0, 10);
      });
    } catch {
      return;
    }
  }
}
export async function trainSource(id: string) {
  const generation = cloudGeneration;
  updateWorkspace(draft => { const source = draft.sources.find(item => item.id === id); if (source) source.status = "Processing"; });
  const source = state.sources.find(item => item.id === id);
  if (!source) return;
  try {
    const result = await requestAi<{ queued?: boolean }>('/train', { sourceId: id, botId: source.botId });
    if (result.queued) return;
    if (generation === cloudGeneration && !(await refreshCloudWorkspace())) {
      updateWorkspace(d => { const s = d.sources.find(item => item.id === id); if (s) { s.status = 'Ready'; s.updated = new Date().toISOString().slice(0,10); } });
    }
  } catch (error) {
    if (generation !== cloudGeneration) return;
    if (!(await refreshCloudWorkspace())) updateWorkspace(d => { const s = d.sources.find(item => item.id === id); if (s) s.status = 'Error'; });
    throw error;
  }
}
export function downloadFile(name: string, contents: string, type = "text/plain") {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a"); link.href = url; link.download = name; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}

