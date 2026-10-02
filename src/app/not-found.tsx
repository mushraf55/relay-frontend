import Link from "next/link";
import { Button } from "@/components/ui/button";
import { H1, Muted } from "@/components/ui/typography";
export default function NotFound() { return <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-6 text-center"><H1>A little off the beaten path.</H1><Muted>We couldn’t find this page.</Muted><Button nativeButton={false} render={<Link href="/" />}>Back to home</Button></main>; }
