"use client";
import { useParams } from "next/navigation";
import { CorePublicChat } from "@/features/public-chat/components/core-public-chat";
export default function EmbeddedChat() { const { id } = useParams<{ id: string }>(); return <main className="embed-page"><CorePublicChat shareId={id}/></main>; }
