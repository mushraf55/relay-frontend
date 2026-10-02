import { Skeleton } from "@/components/ui/skeleton";
import { H2 } from "@/components/ui/typography";
export default function Loading() { return <div className="mx-auto flex min-h-svh max-w-xl flex-col justify-center gap-4 p-6" role="status"><H2>Opening workspace...</H2><Skeleton className="h-24 w-full"/><Skeleton className="h-24 w-full"/></div>; }
