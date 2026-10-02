"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { Icon } from "@/components/icon";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => undefined, () => true, () => false);
  if (!mounted) return <span className={`theme-toggle-placeholder ${className}`} aria-hidden="true" />;

  const dark = resolvedTheme === "dark";
  return <Button className={className} variant="ghost" size="icon" aria-label={`Switch to ${dark ? "light" : "dark"} mode`} onClick={() => setTheme(dark ? "light" : "dark")}><Icon name={dark ? "sun" : "moon"} size={16}/></Button>;
}
