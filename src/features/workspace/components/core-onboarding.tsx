"use client";

import Link from "next/link";
import { BrandMark } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { H1, Muted } from "@/components/ui/typography";

export default function CoreOnboarding() {
  return <main className="relative grid min-h-svh place-items-center overflow-hidden p-6"><div className="absolute top-[-8rem] size-[28rem] rounded-full bg-primary/10 blur-3xl"/><section className="relative max-w-xl rounded-3xl border bg-card p-10 text-center"><BrandMark className="mx-auto size-12"/><H1 className="mt-6 text-4xl tracking-[-0.04em]">Your account is ready.</H1><Muted className="mt-4 text-base">Create your first chatbot, connect a PDF, TXT file, or website, then test every answer before publishing.</Muted><Button className="mt-8" size="lg" render={<Link href="/dashboard"/>}>Open dashboard</Button></section></main>;
}
