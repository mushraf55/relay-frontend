import type { Metadata } from "next";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs';
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Relay — RAG chatbot builder",
  description: "Create an embeddable AI chatbot from PDFs, pasted text, and website content.",
  icons: {
    icon: [{ url: "/relay-icon.png", type: "image/png", sizes: "512x512" }],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <ClerkProvider signInUrl="/login" signUpUrl="/signup" signInFallbackRedirectUrl="/dashboard" signUpFallbackRedirectUrl="/onboarding"><html lang="en" suppressHydrationWarning data-type="software" data-radius="soft" data-buttons="pill" data-motion="standard"><body suppressHydrationWarning className="bg-background text-foreground"><Providers>{children}</Providers></body></html></ClerkProvider>;
}


