import type { ComponentProps } from "react";
import { cn } from "cn";

export function H1({ className, ...props }: ComponentProps<"h1">) { return <h1 className={cn("font-heading scroll-m-20 text-4xl font-extrabold tracking-tight text-balance", className)} {...props} />; }
export function H2({ className, ...props }: ComponentProps<"h2">) { return <h2 className={cn("font-heading scroll-m-20 text-3xl font-semibold tracking-tight", className)} {...props} />; }
export function H3({ className, ...props }: ComponentProps<"h3">) { return <h3 className={cn("font-heading scroll-m-20 text-2xl font-semibold tracking-tight", className)} {...props} />; }
export function Lead({ className, ...props }: ComponentProps<"p">) { return <p className={cn("text-xl text-muted-foreground", className)} {...props} />; }
export function Muted({ className, ...props }: ComponentProps<"p">) { return <p className={cn("text-sm text-muted-foreground", className)} {...props} />; }
