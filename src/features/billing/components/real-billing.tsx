"use client";
import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createApi } from "@/lib/api";
import { Notice, Panel } from "@/components/ui";
import { paidPlans, planCatalog } from "@/lib/plans";

type Billing = { plan: string; cycle: string; status: string; hasCustomer: boolean; trialEndsAt?: string; trialDaysRemaining?: number; autoPay?: boolean };

export function RealBilling() {
  const { getToken } = useAuth();
  const [billing, setBilling] = useState<Billing | null>(null);
  const [cycle, setCycle] = useState("Monthly");
  const [autoPay, setAutoPay] = useState(true);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { createApi(getToken)<Billing>("/billing").then(result => { setBilling(result); setAutoPay(result.autoPay !== false); }).catch(error => setNotice(error.message)); }, [getToken]);
  async function open(plan?: string) {
    setBusy(true); setNotice("");
    try {
      const result = await createApi(getToken)<{ url: string }>(plan ? "/billing/checkout" : "/billing/portal", { method: "POST", body: JSON.stringify({ plan, cycle, autoPay }) });
      window.location.assign(result.url);
    } catch (error) { setNotice(error instanceof Error ? error.message : "Billing is unavailable"); setBusy(false); }
  }
  async function chooseFree(plan: "Trial") {
    setBusy(true); setNotice("");
    try {
      const result = await createApi(getToken)<Billing>("/billing/free-plan", { method: "POST", body: JSON.stringify({ plan, autoPay }) });
      setBilling({ ...result, status: "free", hasCustomer: billing?.hasCustomer || false });
      setNotice("7-day trial selected. No credit card required.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Plan could not be changed."); }
    finally { setBusy(false); }
  }
  const trialText = billing?.plan === "Trial" && billing.trialEndsAt ? `${billing.trialDaysRemaining ?? 0} day${billing.trialDaysRemaining === 1 ? "" : "s"} left · ends ${new Date(billing.trialEndsAt).toLocaleDateString()}` : "";
  return <Panel title="Subscription & billing"><div className="grid gap-4"><div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">{billing ? `${billing.plan} · ${billing.cycle}` : "Loading subscription…"}</p>{trialText && <strong className="mt-1 block text-sm">{trialText}</strong>}<p className="mt-2 text-sm text-muted-foreground">Trial is 7 days with no credit card. Paid plans collect payment details in Stripe.</p></div><div className="grid gap-3">{planCatalog.filter(plan => plan.name === "Trial").map(plan => <div className="rounded-lg border p-4" key={plan.name}><div className="flex items-center justify-between gap-3"><strong>{plan.name}</strong><span className="rounded-full bg-secondary px-2 py-1 text-xs">{plan.badge}</span></div><p className="mt-2 text-sm text-muted-foreground">{plan.features.join(" · ")}</p><Button className="mt-4 w-full" variant={billing?.plan === plan.name ? "secondary" : "outline"} disabled={busy || !billing} onClick={() => void chooseFree(plan.name)}>Choose {plan.name}</Button></div>)}</div><div className="grid gap-3 rounded-lg border p-4"><Select value={cycle} onValueChange={(value) => setCycle(value ?? "Monthly")}><SelectTrigger aria-label="Payment interval"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Monthly">Monthly</SelectItem><SelectItem value="Yearly">Yearly</SelectItem></SelectContent></Select><Label className="flex items-start gap-3 rounded-lg border bg-background p-3"><Checkbox checked={autoPay} onCheckedChange={checked => setAutoPay(checked === true)}/><span><strong className="block">Autopay paid plans</strong><small className="text-muted-foreground">Save the payment method and renew automatically unless disabled in billing.</small></span></Label><div className="grid gap-2 sm:grid-cols-4">{paidPlans.map(plan => <Button key={plan.name} variant="outline" disabled={busy || !billing} onClick={() => open(plan.name)}>Choose {plan.name}</Button>)}<Button disabled={busy || !billing?.hasCustomer} onClick={() => open()}>Manage subscription</Button></div></div></div><Notice>{notice}</Notice></Panel>;
}
