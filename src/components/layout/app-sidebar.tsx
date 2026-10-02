"use client"

import Link from "next/link"
import { OrganizationSwitcher, useClerk } from "@clerk/nextjs"
import { usePathname } from "next/navigation"
import { BrandMark, Icon, type IconName } from "@/components/icon"
import { ThemeToggle } from "./theme-toggle"
import { useWorkspace } from "@/lib/workspace"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const navigation: { label: string; slug: string; icon: IconName }[] = [
  { label: "My rooms", slug: "my-chats", icon: "inbox" },
  { label: "Overview", slug: "", icon: "grid" },
  { label: "Assistants", slug: "chatbots", icon: "chat" },
  { label: "Library", slug: "knowledge", icon: "book" },
  { label: "Analytics", slug: "analytics", icon: "chart" },
  { label: "Settings", slug: "settings", icon: "settings" },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { signOut } = useClerk()
  const { setOpenMobile } = useSidebar()
  const state = useWorkspace()
  const section = pathname.split("/").filter(Boolean)[1] || ""
  const closeMobileSidebar = () => setOpenMobile(false)

  return <Sidebar collapsible="icon"><SidebarHeader><div className="flex h-11 items-center gap-2 px-2"><BrandMark/><span className="text-base font-semibold group-data-[collapsible=icon]:hidden">Relay.</span></div><SidebarMenu><SidebarMenuItem><SidebarMenuButton size="lg" tooltip={state.workspace} render={<Link href="/dashboard/settings" onClick={closeMobileSidebar}/> }><span className="flex size-8 items-center justify-center rounded-md bg-sidebar-accent text-xs font-semibold">W</span><span className="min-w-0"><span className="block truncate font-medium">{state.workspace}</span><span className="block truncate text-xs text-muted-foreground">Knowledge workspace</span></span></SidebarMenuButton></SidebarMenuItem></SidebarMenu><div className="group-data-[collapsible=icon]:hidden"><OrganizationSwitcher afterSelectOrganizationUrl="/dashboard" afterSelectPersonalUrl="/dashboard" afterCreateOrganizationUrl="/dashboard"/></div></SidebarHeader><SidebarSeparator/><SidebarContent><SidebarGroup><SidebarGroupLabel>Rooms & library</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{navigation.map(item => <SidebarMenuItem key={item.slug}><SidebarMenuButton tooltip={item.label} isActive={section === item.slug} render={<Link href={`/dashboard${item.slug ? `/${item.slug}` : ""}`} onClick={closeMobileSidebar}/> }><Icon name={item.icon}/><span>{item.label}</span></SidebarMenuButton>{item.slug === "chatbots" && <SidebarMenuBadge>{state.bots.filter(bot => bot.status !== "Archived").length}</SidebarMenuBadge>}</SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup></SidebarContent><SidebarFooter><Card size="sm" className="group-data-[collapsible=icon]:hidden"><CardHeader><CardTitle>{state.plan} plan</CardTitle></CardHeader><CardContent><Link className="text-xs text-muted-foreground hover:text-foreground" href="/dashboard/settings" onClick={closeMobileSidebar}>Manage billing and usage →</Link></CardContent></Card><div className="flex items-center justify-between rounded-lg border p-2 group-data-[collapsible=icon]:justify-center"><span className="text-sm group-data-[collapsible=icon]:hidden">Theme</span><ThemeToggle/></div><SidebarTrigger className="h-9 w-full justify-start gap-2 rounded-lg border px-2 group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0" aria-label="Collapse sidebar"><Icon name="menu"/><span className="text-sm group-data-[collapsible=icon]:hidden">Collapse</span></SidebarTrigger><div className="flex items-center gap-2 px-1"><span className="flex size-8 items-center justify-center rounded-full bg-sidebar-accent text-xs font-medium">{state.profile.name.split(" ").map(part => part[0]).join("").slice(0,2)}</span><span className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><span className="block truncate text-sm font-medium">{state.profile.name}</span><span className="block text-xs text-muted-foreground">Clerk account</span></span><Button className="group-data-[collapsible=icon]:hidden" variant="ghost" size="icon-sm" aria-label="Log out" onClick={() => void signOut({ redirectUrl: "/login" })}><Icon name="logout"/></Button></div></SidebarFooter><SidebarRail/></Sidebar>
}
