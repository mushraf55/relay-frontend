"use client";
import { Button } from "@/components/ui/button";
import { H1, Muted } from "@/components/ui/typography";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-svh max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
      <H1>Something didn’t load.</H1>
      <Muted>
        Your saved data is still available. Try opening the page again.
      </Muted>
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
