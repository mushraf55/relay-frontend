"use client"

import Link from "next/link"

import { BrandMark, Icon } from "@/components/icon"
import { AppSidebar } from "./app-sidebar"
import { ThemeToggle } from "./theme-toggle"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"

export function DashboardFrame({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:hidden">
            <SidebarTrigger className="size-9" aria-label="Open sidebar">
              <Icon name="menu" />
              <span className="sr-only">Open sidebar</span>
            </SidebarTrigger>
            <Link href="/dashboard" className="flex min-w-0 items-center gap-2 font-semibold">
              <BrandMark />
              <span>Relay<span className="text-primary">.</span></span>
            </Link>
            <ThemeToggle className="ml-auto" />
          </div>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
