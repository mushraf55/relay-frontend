"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { BrandMark, Icon } from "@/components/icon"
import { CoreSidebar } from "./core-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export function DashboardFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const mobileTitle = pathname.includes("/chatbots/") ? "Chatbot" : pathname.endsWith("/chatbots") ? "Chatbots" : "Dashboard"
  return (
    <TooltipProvider>
      <SidebarProvider>
        <CoreSidebar />
        <SidebarInset className="bg-transparent">
          <div className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b bg-black/95 px-4 backdrop-blur md:hidden">
            <SidebarTrigger className="size-11" aria-label="Open sidebar">
              <Icon name="menu" />
              <span className="sr-only">Open sidebar</span>
            </SidebarTrigger>
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2 font-semibold">
              <BrandMark />
              <span>Relay.</span>
            </Link>
            <span className="ml-auto text-sm text-muted-foreground">{mobileTitle}</span>
          </div>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
