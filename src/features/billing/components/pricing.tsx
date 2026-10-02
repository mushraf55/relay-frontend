"use client";
import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { H2, H3, Muted } from "@/components/ui/typography";
import { Icon } from "@/components/icon";
import { planCatalog } from "@/lib/plans";

export function Pricing() {
  const [cycle, setCycle] = useState("monthly");
  const yearly = cycle === "yearly";
  return <section id="pricing" className="mx-auto max-w-6xl border-b px-5 py-20"><div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end"><div><span className="text-[10px] font-semibold tracking-widest text-muted-foreground">START FREE. GROW WHEN READY.</span><H2 className="mt-3">Choose after signup, no pressure.</H2></div><Tabs value={cycle} onValueChange={setCycle}><TabsList><TabsTrigger value="monthly">Monthly</TabsTrigger><TabsTrigger value="yearly">Yearly · 2 months free</TabsTrigger></TabsList></Tabs></div><div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">{planCatalog.map((plan) => <Card className={plan.name === "Growth" ? "border-primary bg-secondary" : ""} key={plan.name}><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle><H3 className="text-xl">{plan.name}</H3></CardTitle><Badge variant={plan.name === "Growth" ? "default" : "secondary"}>{plan.badge}</Badge></div><Muted>{plan.description}</Muted></CardHeader><CardContent><strong className="my-6 block text-4xl font-semibold tracking-tight">{plan.price ? `$${yearly ? plan.price * 10 : plan.price}` : "$0"}<small className="text-xs font-normal tracking-normal text-muted-foreground">/{plan.name === "Trial" ? "7 days" : yearly && plan.price ? "year" : plan.cycle}</small></strong><ul className="space-y-3">{plan.features.map(feature => <li className="flex items-center gap-2 text-sm text-muted-foreground" key={feature}><Icon name="check" size={14}/>{feature}</li>)}</ul></CardContent><CardFooter><Button nativeButton={false} className="w-full" variant={plan.name === "Growth" ? "default" : "outline"} render={<Link href={`/signup?plan=${plan.name.toLowerCase()}`} />}>{plan.name === "Trial" ? "Start free trial" : `Explore ${plan.name}`}<Icon name="arrow" size={14}/></Button></CardFooter></Card>)}</div><Muted className="mt-6 text-center text-xs">Trial is 7 days with no credit card. Growth and Scale collect payment details and can use autopay.</Muted></section>;
}
