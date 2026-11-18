"use client";

import Link from "next/link";
import { useClerk } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import { BrandMark, Icon, type IconName } from "@/components/icon";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/lib/workspace";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";

const navigation: { label: string; slug: string; icon: IconName }[] = [
  { label: "Dashboard", slug: "", icon: "grid" },
  { label: "Chatbots", slug: "chatbots", icon: "chat" },
];

export function CoreSidebar() {
  const pathname = usePathname();
  const section = pathname.split("/").filter(Boolean)[1] || "";
  const { signOut } = useClerk();
  const { setOpenMobile, state: sidebarState } = useSidebar();
  const state = useWorkspace();
  const recentBots = state.bots.slice(0, 4);
  const initials = (state.profile.name || state.profile.email || "Relay").split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();
  return <Sidebar collapsible="icon">
    <SidebarHeader><div className="flex h-14 items-center gap-2 px-2"><Link href="/dashboard" className="flex min-w-0 flex-1 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring" onClick={() => setOpenMobile(false)}><BrandMark/><span className="text-lg font-semibold group-data-[collapsible=icon]:hidden">Relay.</span></Link><SidebarTrigger className="size-9 group-data-[collapsible=icon]:hidden" aria-label={sidebarState === "expanded" ? "Collapse sidebar" : "Expand sidebar"}><Icon name="chevron" style={{ transform: sidebarState === "expanded" ? "rotate(90deg)" : "rotate(-90deg)" }}/></SidebarTrigger></div></SidebarHeader>
    <SidebarSeparator/>
    <SidebarContent>
      <SidebarGroup><SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{navigation.map(item => <SidebarMenuItem key={item.slug}><SidebarMenuButton className="h-11 rounded-lg px-3 md:h-10 data-active:bg-sidebar-accent data-active:text-primary" tooltip={item.label} isActive={section === item.slug} render={<Link href={`/dashboard${item.slug ? `/${item.slug}` : ""}`} onClick={() => setOpenMobile(false)}/>}><Icon name={item.icon}/><span>{item.label}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>
      <SidebarGroup><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton className="h-11 rounded-lg bg-primary px-3 text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground md:h-10" tooltip="Create chatbot" render={<Link href="/dashboard/chatbots?create=1" onClick={() => setOpenMobile(false)}/>}><Icon name="plus"/><span>Create chatbot</span></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>
      {recentBots.length > 0 && <SidebarGroup><SidebarGroupLabel>Recent chatbots</SidebarGroupLabel><SidebarGroupContent><SidebarMenu>{recentBots.map(bot => <SidebarMenuItem key={bot.id}><SidebarMenuButton className="h-10 rounded-lg px-3" tooltip={bot.name} isActive={pathname.includes(`/chatbots/${bot.id}/`)} render={<Link href={`/dashboard/chatbots/${bot.id}/knowledge`} onClick={() => setOpenMobile(false)}/>}><span className="grid size-5 shrink-0 place-items-center rounded-md bg-sidebar-accent text-[9px] font-semibold text-muted-foreground">{bot.avatar || bot.name.slice(0, 2).toUpperCase()}</span><span>{bot.name}</span><span className={`ml-auto size-1.5 rounded-full group-data-[collapsible=icon]:hidden ${bot.status === "Active" ? "bg-[#9ae187]" : "bg-muted-foreground"}`} aria-label={bot.status}/></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu></SidebarGroupContent></SidebarGroup>}
    </SidebarContent>
    <SidebarFooter><div className="flex items-center gap-2 rounded-xl border bg-card p-2 group-data-[collapsible=icon]:p-1"><span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">{initials}</span><div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden"><p className="truncate text-sm font-medium">{state.profile.name || "Relay account"}</p><p className="truncate text-xs text-muted-foreground">{state.profile.email}</p></div><Button className="size-9 shrink-0 group-data-[collapsible=icon]:hidden" variant="ghost" size="icon" aria-label="Sign out" title="Sign out" onClick={() => void signOut({ redirectUrl: "/login" })}><Icon name="logout"/></Button></div><Button className="hidden size-10 group-data-[collapsible=icon]:flex" variant="ghost" size="icon" aria-label="Sign out" title="Sign out" onClick={() => void signOut({ redirectUrl: "/login" })}><Icon name="logout"/></Button></SidebarFooter>
    <SidebarRail/>
  </Sidebar>;
}
