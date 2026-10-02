"use client";
import { useParams } from "next/navigation";
import { PublicChat } from "@/features/public-chat/components/public-chat";
export default function EmbeddedChat() { const { id } = useParams<{ id: string }>(); const origin = typeof window === "undefined" ? "" : new URLSearchParams(window.location.search).get("origin") || ""; return <main className="embed-page"><PublicChat shareId={id} mode="widget" embedOrigin={origin}/></main>; }
