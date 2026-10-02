"use client";

import { useEffect, type ReactNode } from "react";
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "cn";
import { Icon } from "./icon";
import { toastKind, useToast } from "@/components/ui/toast";

export function Modal({ title, children, close, wide = false }: { title: string; children: ReactNode; close: () => void; wide?: boolean }) {
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent className={cn(wide && "sm:max-w-3xl")}><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>{children}</DialogContent></Dialog>;
}

export function Confirm({ title, children, confirm, close }: { title: string; children: ReactNode; confirm: () => void; close: () => void }) {
  return <Modal title={title} close={close}><p className="text-sm leading-6 text-muted-foreground">{children}</p><DialogFooter><Button variant="outline" onClick={close}>Cancel</Button><Button variant="destructive" onClick={() => { confirm(); close(); }}>Confirm</Button></DialogFooter></Modal>;
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) { return <div className="flex flex-col items-center rounded-lg border border-dashed p-12 text-center text-muted-foreground"><Icon name="inbox" size={30}/><h3 className="mt-4 scroll-m-20 text-lg font-semibold tracking-tight text-foreground">{title}</h3><div className="mt-2 text-sm leading-6">{children}</div></div>; }
function textFromNode(value: ReactNode): string {
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(textFromNode).join(" ");
  if (value && typeof value === "object" && "props" in value) return textFromNode((value as { props?: { children?: ReactNode } }).props?.children);
  return "";
}

export function Notice({ children }: { children: ReactNode }) {
  const toast = useToast();
  const message = textFromNode(children).trim();
  useEffect(() => {
    if (message) toast(message, toastKind(message));
  }, [message, toast]);
  return null;
}
export function Panel({ title, children }: { title: string; children: ReactNode }) { return <Card className="min-w-0"><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent>{children}</CardContent></Card>; }
export function Field({ label, children }: { label: string; children: ReactNode }) { return <Label className="grid gap-2 text-sm font-medium"><span>{label}</span>{children}</Label>; }
export function Badge({ children, good = false }: { children: ReactNode; good?: boolean }) { return <ShadcnBadge variant={good ? "default" : "secondary"}>{children}</ShadcnBadge>; }
