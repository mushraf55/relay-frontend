"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ToastKind = "info" | "success" | "error";
type Toast = { id: string; title: string; kind: ToastKind };
type ToastContextValue = { toast: (title: string, kind?: ToastKind) => void };

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const dismiss = useCallback((id: string) => setToasts(current => current.filter(item => item.id !== id)), []);
  const toast = useCallback((title: string, kind: ToastKind = "info") => {
    const message = title.trim();
    if (!message) return;
    const id = crypto.randomUUID();
    setToasts(current => [{ id, title: message, kind }, ...current].slice(0, 4));
    window.setTimeout(() => dismiss(id), kind === "error" ? 7000 : 4200);
  }, [dismiss]);
  const value = useMemo(() => ({ toast }), [toast]);
  return <ToastContext.Provider value={value}>{children}<div className="fixed right-4 top-4 z-[100] grid w-[min(420px,calc(100vw-2rem))] gap-2" role="region" aria-label="Notifications">{toasts.map(item => <div className={cn("rounded-lg border bg-card p-4 text-sm shadow-lg", item.kind === "error" && "border-destructive/40 bg-destructive/10 text-destructive", item.kind === "success" && "border-primary/30")} role={item.kind === "error" ? "alert" : "status"} key={item.id}><div className="flex items-start gap-3"><div className="min-w-0 flex-1"><strong className="block text-foreground">{item.kind === "error" ? "Something needs attention" : item.kind === "success" ? "Done" : "Update"}</strong><p className="mt-1 text-muted-foreground">{item.title}</p></div><Button variant="ghost" size="icon-sm" aria-label="Dismiss notification" onClick={() => dismiss(item.id)}>×</Button></div></div>)}</div></ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used inside ToastProvider");
  return context.toast;
}

export function toastKind(message: string): ToastKind {
  return /\b(error|failed|invalid|unavailable|could not|retry|rejected|denied|blocked|not found|too many|limit reached|expired)\b/i.test(message) ? "error" : /\b(saved|ready|published|complete|completed|copied|verified|created|trained|done|success)\b/i.test(message) ? "success" : "info";
}
