"use client";

import { useSyncExternalStore } from "react";
import { ApiError, type ApiRequest } from "./api";

export type Assistant = {
  id: string;
  name: string;
  description: string;
  status: "Draft" | "Active";
  category: string;
  welcome: string;
  tone: string;
  instructions: string;
  suggestions: string;
  fallback: string;
  accent: string;
  avatar: string;
  kind: "shared" | "website";
  visibility: "public" | "private";
};

export type Source = {
  id: string;
  botId: string;
  title: string;
  type: "File" | "Text" | "Website";
  content: string;
  status: "Ready" | "Processing" | "Error" | "Pending";
  updated: string;
  filename?: string;
  size?: number;
  sourceUrl?: string;
  progress?: number;
  progressStage?: string;
  progressDetail?: string;
  processedChunks?: number;
  totalChunks?: number;
  processingError?: string | null;
};

export type Workspace = {
  ready: boolean;
  storageError: string;
  profile: { name: string; email: string };
  workspace: string;
  onboarded: boolean;
  bots: Assistant[];
  sources: Source[];
};

const emptyWorkspace = (): Workspace => ({
  ready: false,
  storageError: "",
  profile: { name: "", email: "" },
  workspace: "My workspace",
  onboarded: true,
  bots: [],
  sources: [],
});

let state = emptyWorkspace();
let cloudApi: ApiRequest | null = null;
let revision = 0;
let generation = 0;
let saveQueue: Promise<boolean> = Promise.resolve(true);
let blocked = false;
const listeners = new Set<() => void>();
const pollingSources = new Set<string>();

const subscribe = (callback: () => void) => {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
};
const emit = () => listeners.forEach(callback => callback());

export function makeBot(name: string, category = "General", description = "A chatbot that answers from your knowledge sources.", kind: Assistant["kind"] = "website", visibility: Assistant["visibility"] = "public"): Assistant {
  return {
    id: crypto.randomUUID(),
    name,
    description,
    category,
    status: "Draft",
    welcome: "Hi! Ask me a question about the knowledge I have been trained on.",
    tone: "Friendly",
    instructions: "Answer clearly using only the provided knowledge. Say when the answer is not available.",
    suggestions: "Summarize the main points\nWhat should I know first?\nExplain this simply",
    fallback: "I could not find that answer in my knowledge sources.",
    accent: "#1554db",
    avatar: name.slice(0, 2).toUpperCase(),
    kind,
    visibility,
  };
}

type WorkspaceResponse = { data: Partial<Workspace>; revision: number; canEdit: boolean };

function applyServer(result: WorkspaceResponse, profile = state.profile) {
  if (!result.data || typeof result.data !== "object" || !Array.isArray(result.data.bots || []) || !Array.isArray(result.data.sources || [])) {
    throw new Error("The saved workspace data is invalid.");
  }
  state = {
    ...emptyWorkspace(),
    ...result.data,
    profile,
    bots: result.data.bots || [],
    sources: result.data.sources || [],
    ready: true,
    storageError: result.canEdit ? "" : "This workspace is read-only.",
  };
  revision = result.revision;
  blocked = !result.canEdit;
  emit();
}

export function connectWorkspace(api: ApiRequest, profile: Workspace["profile"], loaded: (error?: string) => void, scope = "default") {
  void scope;
  const currentGeneration = ++generation;
  cloudApi = api;
  blocked = true;
  state = { ...emptyWorkspace(), profile };
  emit();
  void api<WorkspaceResponse>("/workspace").then(result => {
    if (currentGeneration !== generation) return;
    applyServer(result, profile);
    for (const source of state.sources) {
      if (source.type === "File" && source.status === "Processing") void pollKnowledgeFile(source.id);
    }
    loaded();
  }).catch(error => {
    if (currentGeneration === generation) loaded(error instanceof Error ? error.message : "Could not load the workspace.");
  });
  return () => {
    if (currentGeneration !== generation) return;
    generation++;
    cloudApi = null;
    blocked = true;
  };
}

export function connectKnowledgeProgress(getToken?: unknown, workspaceId?: unknown) {
  void getToken;
  void workspaceId;
  return () => {};
}

function dataForSave(value: Workspace) {
  return { workspace: value.workspace, onboarded: value.onboarded, bots: value.bots, sources: value.sources };
}

function persist() {
  const api = cloudApi;
  const currentGeneration = generation;
  if (!api || blocked) return Promise.resolve(false);
  const data = dataForSave(state);
  saveQueue = saveQueue.then(async () => {
    try {
      let result: { revision: number } | undefined;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          result = await api<{ revision: number }>("/workspace", { method: "PUT", body: JSON.stringify({ data, revision }) });
          break;
        } catch (error) {
          const temporary = !(error instanceof ApiError) || error.status >= 500;
          if (!temporary || attempt === 2) throw error;
          await new Promise(resolve => setTimeout(resolve, 400 * (attempt + 1)));
        }
      }
      if (!result) throw new Error("The workspace save did not complete.");
      if (currentGeneration !== generation) return false;
      revision = result.revision;
      state = { ...state, storageError: "" };
      emit();
      return true;
    } catch (error) {
      if (currentGeneration !== generation) return false;
      blocked = true;
      state = { ...state, storageError: (error instanceof Error ? error.message : "Save failed") + ". Reload to reconnect." };
      emit();
      return false;
    }
  });
  return saveQueue;
}

export function updateWorkspace(change: (draft: Workspace) => void) {
  if (blocked) return Promise.resolve(false);
  const next = structuredClone(state);
  change(next);
  state = next;
  const saved = persist();
  emit();
  return saved;
}

export function useWorkspace() {
  return useSyncExternalStore(subscribe, () => state, () => state);
}

async function refreshWorkspace() {
  const api = cloudApi;
  if (!api) return;
  const result = await api<WorkspaceResponse>("/workspace");
  applyServer(result);
}

export async function requestAi<T>(path: string, body: unknown): Promise<T> {
  const api = cloudApi;
  if (!api) throw new Error("Sign in to use the chatbot.");
  await saveQueue;
  if (blocked) throw new Error("Reload the workspace before continuing.");
  return api<T>("/ai" + path, { method: "POST", body: JSON.stringify(body) });
}

export async function streamAi<T>(path: string, body: unknown, onEvent: (event: T) => void): Promise<void> {
  const api = cloudApi;
  if (!api) throw new Error("Sign in to use the chatbot.");
  await saveQueue;
  if (blocked) throw new Error("Reload the workspace before continuing.");
  return api.stream<T>("/ai" + path, { method: "POST", body: JSON.stringify(body) }, onEvent);
}

export async function requestWorkspaceApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const api = cloudApi;
  if (!api) throw new Error("Sign in to continue.");
  await saveQueue;
  if (blocked) throw new Error("Reload the workspace before continuing.");
  return api<T>(path, options);
}

export async function streamWorkspaceApi<T>(path: string, body: unknown, onEvent: (event: T) => void): Promise<void> {
  const api = cloudApi;
  if (!api) throw new Error("Sign in to continue.");
  await saveQueue;
  if (blocked) throw new Error("Reload the workspace before continuing.");
  return api.stream<T>(path, { method: "POST", body: JSON.stringify(body) }, onEvent);
}

export async function uploadKnowledgeFile(id: string, botId: string, file: File) {
  const api = cloudApi;
  if (!api) throw new Error("Sign in to upload a document.");
  await saveQueue;
  const form = new FormData();
  form.append("sourceId", id);
  form.append("botId", botId);
  form.append("file", file);
  await api("/knowledge/upload", { method: "POST", body: form });
  void pollKnowledgeFile(id);
}

async function pollKnowledgeFile(id: string) {
  if (pollingSources.has(id)) return;
  pollingSources.add(id);
  try {
  for (let attempt = 0; attempt < 90; attempt++) {
    await new Promise(resolve => setTimeout(resolve, attempt < 10 ? 1500 : 3000));
    const api = cloudApi;
    const source = state.sources.find(item => item.id === id);
    if (!api || !source || source.status === "Ready" || source.status === "Error") return;
    try {
      const result = await api<{ status: string; error?: string | null; progress?: number; stage?: string; detail?: string; processedChunks?: number; totalChunks?: number }>("/ai/status/source", { method: "POST", body: JSON.stringify({ sourceId: id }) });
      const nextState = structuredClone(state);
      const item = nextState.sources.find(value => value.id === id);
      if (!item) return;
      item.status = result.status === "ready" ? "Ready" : result.status === "error" ? "Error" : "Processing";
      item.progress = result.progress;
      item.progressStage = result.stage;
      item.progressDetail = result.detail;
      item.processedChunks = result.processedChunks;
      item.totalChunks = result.totalChunks;
      item.processingError = result.error;
      state = nextState;
      emit();
      if (item.status === "Ready" || item.status === "Error") persist();
    } catch {
      if (attempt >= 89) return;
    }
  }
  } finally {
    pollingSources.delete(id);
  }
}

export async function trainSource(id: string) {
  const source = state.sources.find(item => item.id === id);
  if (!source) throw new Error("Source not found.");
  updateWorkspace(draft => {
    const item = draft.sources.find(value => value.id === id);
    if (item) item.status = "Processing";
  });
  const result = await requestAi<{ queued?: boolean }>("/train", { sourceId: id, botId: source.botId });
  if (result.queued) void pollKnowledgeFile(id);
  else await refreshWorkspace();
}
