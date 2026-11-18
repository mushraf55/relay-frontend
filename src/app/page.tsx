import type { Metadata } from "next";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Relay: knowledge chatbots for small teams",
  description:
    "Build website chatbots and shared AI rooms from PDF, TXT, and website knowledge with source citations.",
  openGraph: {
    title: "Relay: knowledge chatbots for small teams",
    description:
      "Connect knowledge, retrieve the relevant source, and publish a grounded chatbot.",
    type: "website",
    images: ["/relay-og.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["/relay-og.jpg"],
  },
};

export { default } from "@/features/marketing/components/core-home";
