import type { IconName } from "@/components/icon";

export type Bot = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: "Active" | "Draft" | "Archived";
  sources: number;
  conversations: number;
  color: string;
  icon: IconName;
};

export const demoBots: Bot[] = [
  { id: "support", name: "Course guide", description: "Help students understand notes, grades, and concepts.", category: "Study", status: "Active", sources: 12, conversations: 1248, color: "violet", icon: "chat" },
  { id: "sales", name: "Office assistant", description: "Turn policies, reports, and PDFs into fast answers.", category: "Work", status: "Active", sources: 8, conversations: 846, color: "peach", icon: "bolt" },
  { id: "product", name: "Website expert", description: "Answer from public pages, docs, and help articles.", category: "Website", status: "Active", sources: 24, conversations: 632, color: "blue", icon: "book" },
  { id: "onboarding", name: "Project room", description: "Keep a shared project library easy to ask.", category: "Team", status: "Draft", sources: 6, conversations: 0, color: "pink", icon: "grid" },
  { id: "commerce", name: "Research assistant", description: "Summarize long sources and compare details quickly.", category: "Study", status: "Active", sources: 18, conversations: 524, color: "mint", icon: "globe" },
  { id: "team", name: "Team library", description: "Your team's answers, all in one place.", category: "Team", status: "Draft", sources: 9, conversations: 0, color: "yellow", icon: "file" },
];

export const demoConversations = [
  { name: "Alex Morgan", initials: "AM", topic: "Can I change my subscription?", bot: "Customer support", time: "2 min ago", status: "Resolved", color: "violet" },
  { name: "Jamie Chen", initials: "JC", topic: "How do I get started with the API?", bot: "Product expert", time: "12 min ago", status: "Open", color: "blue" },
  { name: "Sam Taylor", initials: "ST", topic: "Do you offer a team plan?", bot: "Sales assistant", time: "24 min ago", status: "Resolved", color: "peach" },
  { name: "Robin Lee", initials: "RL", topic: "Looking for a gift under $50", bot: "Shopping assistant", time: "41 min ago", status: "Resolved", color: "mint" },
];
