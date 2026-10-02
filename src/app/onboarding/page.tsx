"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { H1, Muted } from "@/components/ui/typography";
import { BrandMark, Icon } from "@/components/icon";
import { Field, Notice } from "@/components/ui";
import { createApi } from "@/lib/api";
import { planCatalog, type PlanName } from "@/lib/plans";
import { makeBot, updateWorkspace, useWorkspace } from "@/lib/workspace";

const categories = ["Study", "Work", "Website", "Team", "General"];
export default function Onboarding() {
  const { getToken } = useAuth();
  const state = useWorkspace(); const router = useRouter();
  const search = useSearchParams();
  const requestedPlan = planCatalog.find(plan => plan.name.toLowerCase() === search.get("plan"))?.name || "Trial";
  const [step, setStep] = useState(0); const [selectedPlan, setSelectedPlan] = useState<PlanName>(requestedPlan); const [autoPay, setAutoPay] = useState(true); const [name, setName] = useState(""); const [botName, setBotName] = useState(""); const [category, setCategory] = useState("Study"); const [sample, setSample] = useState(true); const [busy, setBusy] = useState(false); const [notice, setNotice] = useState("");
  const paid = selectedPlan === "Starter" || selectedPlan === "Growth" || selectedPlan === "Scale";
  async function finish(skip = false) {
    setBusy(true); setNotice("");
    updateWorkspace(draft => { draft.workspace = name.trim() || draft.workspace; draft.onboarded = true; draft.signedIn = true; draft.plan = selectedPlan; draft.cycle = selectedPlan === "Trial" ? "7-day trial" : "Monthly"; draft.autoPay = autoPay; if (!skip) { const bot = makeBot(botName.trim() || "My first assistant", category); draft.bots.unshift(bot); if (sample) draft.sources.push({ id: crypto.randomUUID(), botId: bot.id, title: "Example welcome guide", type: "Text", content: "Welcome to your new workspace. Add PDFs, docs, notes, or websites to your library, then ask grounded questions in a shared room.", status: "Pending", updated: new Date().toISOString().slice(0, 10) }); } });
    try {
      if (paid) {
        const result = await createApi(getToken)<{ url: string }>("/billing/checkout", { method: "POST", body: JSON.stringify({ plan: selectedPlan, cycle: "Monthly", autoPay }) });
        window.location.assign(result.url);
        return;
      }
      await createApi(getToken)("/billing/free-plan", { method: "POST", body: JSON.stringify({ plan: selectedPlan, autoPay }) });
      router.push("/dashboard");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Plan selection could not be saved.");
      setBusy(false);
    }
  }
  return <main className="mx-auto flex min-h-svh max-w-4xl flex-col items-center justify-center gap-5 p-6"><Link className="flex items-center gap-2 text-lg font-semibold" href="/"><BrandMark/>Relay<span className="text-primary">.</span></Link><Card className="w-full"><CardHeader><span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Let us make this yours</span><div className="flex flex-wrap gap-2">{["Plan", "Workspace", "Your assistant", "Ready to go"].map((label, index) => <BadgeStep key={label} active={index <= step}>{index < step ? "✓" : index + 1} {label}</BadgeStep>)}</div><H1>{["Choose how you want to start.", "A home for your ideas.", "Meet your first assistant.", "You are in good company."][step]}</H1><Muted>{["Start a 7-day trial with no credit card, or choose a paid plan now.", "Start with a name for your workspace.", "Give it a name and a purpose.", paid ? "Payment details are collected securely before your workspace opens." : "Try a sample library source, or start with a blank canvas."][step]}</Muted></CardHeader><CardContent><form className="grid gap-4" id="onboarding-form" onSubmit={event => { event.preventDefault(); if (step < 3) setStep(step + 1); else void finish(); }}>{step === 0 && <div className="grid gap-3 md:grid-cols-2">{planCatalog.map(plan => <button type="button" key={plan.name} onClick={() => setSelectedPlan(plan.name)} className={`rounded-lg border bg-card p-4 text-left transition-colors hover:bg-accent ${selectedPlan === plan.name ? "border-primary ring-2 ring-ring" : ""}`}><div className="mb-2 flex items-center justify-between gap-3"><strong>{plan.name}</strong><span className="rounded-full bg-secondary px-2 py-1 text-xs text-secondary-foreground">{plan.badge}</span></div><p className="text-sm text-muted-foreground">{plan.description}</p><strong className="mt-4 block text-2xl">{plan.price ? `$${plan.price}` : "$0"}<small className="text-xs font-normal text-muted-foreground">/{plan.cycle}</small></strong><ul className="mt-3 space-y-1 text-xs text-muted-foreground">{plan.features.slice(0, 4).map(feature => <li key={feature}>✓ {feature}</li>)}</ul></button>)}{paid && <Label className="md:col-span-2 flex items-start gap-3 rounded-lg border p-4"><Checkbox checked={autoPay} onCheckedChange={checked => setAutoPay(checked === true)}/><span><strong className="block">Enable autopay</strong><small className="text-muted-foreground">Use the saved payment method to renew {selectedPlan} automatically. You can manage it later from Billing.</small></span></Label>}</div>}{step === 1 && <Field label="Workspace name"><Input required maxLength={40} pattern=".*\S.*" value={name} onChange={event => setName(event.target.value)} placeholder={state.workspace}/></Field>}{step === 2 && <><Field label="Assistant name"><Input required maxLength={60} pattern=".*\S.*" value={botName} onChange={event => setBotName(event.target.value)} placeholder="Course guide"/></Field><Field label="Purpose"><Select value={category} onValueChange={value => setCategory(value ?? "Study")}><SelectTrigger className="w-full"><SelectValue /></SelectTrigger><SelectContent>{categories.map(item => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></Field></>}{step === 3 && <Label className="flex items-start gap-3 rounded-lg border p-4"><Checkbox checked={sample} onCheckedChange={checked => setSample(checked === true)}/><span><strong className="block">Add an example library source</strong><small className="text-muted-foreground">You can replace it with your own PDFs, docs, notes, or websites later.</small></span></Label>}</form></CardContent><CardFooter className="justify-between"><div>{step > 0 && <Button variant="outline" disabled={busy} onClick={() => setStep(step - 1)}>Back</Button>}</div><Button form="onboarding-form" type="submit" disabled={busy}>{step === 3 ? paid ? "Continue to payment" : selectedPlan === "Trial" ? "Start 7-day trial" : "Open my workspace" : "Continue"}<Icon name="arrow" size={15}/></Button></CardFooter></Card><Button variant="link" disabled={busy} onClick={() => void finish(true)}>{paid ? "Skip setup and continue to payment" : "Skip setup for now"}</Button><Notice>{notice}</Notice><Muted>{selectedPlan === "Trial" ? "No credit card required for the 7-day trial." : paid ? "Payment details are collected securely by Stripe." : "Starter runs monthly with the same launch limits."}</Muted></main>;
}

function BadgeStep({ active, children }: { active: boolean; children: React.ReactNode }) { return <span data-active={active || undefined} className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground data-[active]:bg-primary data-[active]:text-primary-foreground">{children}</span>; }
