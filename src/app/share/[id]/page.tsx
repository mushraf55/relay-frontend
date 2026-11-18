"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { BrandMark } from "@/components/icon";
import { CorePublicChat } from "@/features/public-chat/components/core-public-chat";
export default function Share() {
  const { id } = useParams<{ id: string }>();
  return <main className="min-h-svh bg-background text-foreground"><nav className="mx-auto flex max-w-5xl items-center justify-between border-b px-4 py-3 text-sm text-muted-foreground"><Link className="flex items-center gap-2 font-semibold text-foreground" href="/"><BrandMark/>Relay<span className="text-primary">.</span></Link><span>Chatbot</span></nav><CorePublicChat shareId={id}/></main>;
}
