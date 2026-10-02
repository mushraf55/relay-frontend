import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from "./providers";
import { Inter, IBM_Plex_Sans } from "next/font/google";
import { cn } from "@/lib/utils";

const ibmPlexSansHeading = IBM_Plex_Sans({subsets:['latin'],variable:'--font-ibm-plex-sans'});

const inter = Inter({subsets:['latin'],variable:'--font-inter'});

export const metadata: Metadata = {
  title: "Relay — Shared AI rooms for your knowledge",
  description: "Turn PDFs, documents, websites, and notes into shared AI rooms for students, teams, and workplaces.",
  icons: {
    icon: [{ url: "/relay-icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ClerkProvider signInUrl="/login" signUpUrl="/signup" signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/onboarding"><html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={cn("font-sans", inter.variable, ibmPlexSansHeading.variable)}><body suppressHydrationWarning className="bg-background text-foreground"><Providers>{children}</Providers></body></html></ClerkProvider>;
}


