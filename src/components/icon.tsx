import Image from "next/image";
import type { CSSProperties } from "react";

export type IconName = "grid" | "chat" | "inbox" | "book" | "chart" | "settings" | "search" | "plus" | "arrow" | "chevron" | "external" | "close" | "send" | "check" | "globe" | "file" | "bolt" | "code" | "logout" | "menu" | "help" | "sliders" | "copy" | "sun" | "moon";

const paths: Record<IconName, string> = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  chat: "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3h2a8.5 8.5 0 0 1 8.5 8.5Z M7 10h9 M7 14h5",
  inbox: "M4 4h16l2 12v4H2v-4L4 4Z M2 15h6l2 3h4l2-3h6",
  book: "M12 5c-4-3-9-2-9-2v16s5-1 9 2c4-3 9-2 9-2V3s-5-1-9 2Z M12 5v16",
  chart: "M4 20V10h4v10 M10 20V4h4v16 M16 20v-7h4v7 M2 20h20",
  settings: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Z",
  search: "M10.5 3a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Z M16 16l5 5",
  plus: "M12 5v14 M5 12h14",
  arrow: "M4 12h16 M14 6l6 6-6 6",
  chevron: "m8 10 4 4 4-4",
  external: "M14 3h7v7 M21 3l-12 12 M10 3H3v18h18v-7",
  close: "m6 6 12 12 M18 6 6 18",
  send: "m3 3 19 9-19 9 4-9-4-9Z M7 12h15",
  check: "m5 12 4 4L19 6",
  globe: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M2 12h20 M12 2c-6 6-6 14 0 20 M12 2c6 6 6 14 0 20",
  file: "M14 2H4v20h16V8l-6-6Z M14 2v6h6 M8 12h8 M8 16h6",
  bolt: "m13 2-9 12h7l-1 8 10-13h-8l1-7Z",
  code: "m8 6-6 6 6 6 M16 6l6 6-6 6 M14 3l-4 18",
  logout: "M10 3H3v18h7 M9 12h13 M17 7l5 5-5 5",
  menu: "M4 6h16 M4 12h16 M4 18h16",
  help: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z M9 8a3 3 0 0 1 6 0c0 3-3 2-3 5 M12 17h.01",
  sliders: "M4 7h8 M16 7h4 M4 17h3 M11 17h9 M12 4v6 M7 14v6",
  copy: "M8 8h13v13H8z M16 8V3H3v13h5",
  sun: "M12 4V2 M12 22v-2 M4 12H2 M22 12h-2 M6.34 6.34 4.93 4.93 M19.07 19.07l-1.41-1.41 M17.66 6.34l1.41-1.41 M4.93 19.07l1.41-1.41 M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  moon: "M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z",
};

export function Icon({ name, size = 18, style }: { name: IconName; size?: number; style?: CSSProperties }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}><path d={paths[name]} /></svg>;
}

export function BrandMark({ className = "size-7 shrink-0" }: { className?: string }) {
  return <Image src="/relay-logo.png?v=relay-r" alt="" aria-hidden="true" width={28} height={28} className={className} priority unoptimized />;
}
