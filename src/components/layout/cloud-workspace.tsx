"use client";
import { RedirectToSignIn, useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { H1, Muted } from "@/components/ui/typography";
import { createApi } from "@/lib/api";
import { connectKnowledgeProgress, connectWorkspace } from "@/lib/workspace";

export function CloudWorkspace({ children }: { children: React.ReactNode }) {
  const { userId, orgId, isLoaded } = useAuth();
  if (!isLoaded) return <WorkspaceStatus message="Checking your Relay session…"/>;
  if (!userId) return <><RedirectToSignIn/><WorkspaceStatus message="Taking you to sign in…"/></>;
  return <ConnectedWorkspace key={`${userId}:${orgId}`}>{children}</ConnectedWorkspace>;
}

function WorkspaceStatus({ message }: { message: string }) {
  return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-8">
    <H1>Your workspace</H1>
    <Muted role="status">{message}</Muted>
  </main>;
}

function ConnectedWorkspace({ children }: { children: React.ReactNode }) {
  const { getToken, userId, orgId, isLoaded } = useAuth();
  const { user } = useUser();
  const getTokenRef = useRef(getToken);
  const [status, setStatus] = useState("Connecting your workspace…");
  const [authIssue, setAuthIssue] = useState(false);
  const [ready, setReady] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const workspaceId = orgId ? `org:${orgId}` : userId ? `user:${userId}` : "";
  const profileName = user?.fullName || user?.firstName || "Your account";
  const profileEmail = user?.primaryEmailAddress?.emailAddress || "";

  useEffect(() => { getTokenRef.current = getToken; }, [getToken]);

  useEffect(() => {
    if (!isLoaded || !workspaceId) return;
    let active = true;
    const token = (options?: { skipCache?: boolean }) => getTokenRef.current(options);
    const disconnect = connectWorkspace(createApi(token, workspaceId), { name: profileName, email: profileEmail }, error => {
      if (!active) return;
      setReady(!error);
      setAuthIssue(!!error && /sign in|session|unauthorized/i.test(error));
      setStatus(error ? error === "Sign in to continue" ? "Your browser is signed in, but the backend did not accept the current Clerk session. Try refreshing the session." : error : "");
    }, workspaceId);
    const disconnectProgress = connectKnowledgeProgress(token, workspaceId);
    return () => { active = false; disconnectProgress(); disconnect(); };
  }, [isLoaded, workspaceId, profileName, profileEmail, attempt]);

  if (!ready) return <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center gap-4 p-8"><H1>Your workspace</H1><Muted role="status">{status}</Muted><div className="flex flex-wrap gap-2"><Button className="w-fit" onClick={() => { setReady(false); setAuthIssue(false); setStatus("Reconnecting your workspace…"); setAttempt(value => value + 1); }}>Reconnect</Button>{authIssue && <Button className="w-fit" variant="outline" onClick={() => window.location.reload()}>Refresh session</Button>}</div></main>;
  return children;
}
