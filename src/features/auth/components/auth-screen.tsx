"use client";
import Link from 'next/link';
import { ClerkFailed, ClerkLoaded, ClerkLoading, SignIn, SignUp, useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';

function AuthStatus({ failed = false }: { failed?: boolean }) {
  return <section className="flex flex-col items-center gap-3 text-center" role={failed ? "alert" : "status"}>
    <span className={failed ? "grid size-10 place-items-center rounded-full bg-destructive text-destructive-foreground" : "grid size-10 place-items-center rounded-full bg-primary text-primary-foreground"}>{failed ? "!" : ""}</span>
    <h1>{failed ? "Sign in could not load" : "Loading secure sign in…"}</h1>
    <p>{failed ? "Check your connection to Clerk, then reload this page." : "Connecting to your Relay account."}</p>
  </section>;
}

function LoadedAuthScreen({ mode, redirectUrl }: { mode: 'login' | 'signup' | 'forgot' | 'reset' | 'verify'; redirectUrl: string }) {
  const { isSignedIn } = useAuth();

  useEffect(() => {
    if (!isSignedIn) return;
    window.location.replace(redirectUrl);
  }, [isSignedIn, redirectUrl]);

  if (isSignedIn) {
    return <section className="flex flex-col items-center gap-3 text-center" role="status">
      <span className="grid size-10 place-items-center rounded-full bg-primary text-primary-foreground" />
      <h1>Opening your workspace…</h1>
      <p>Your Relay account is ready.</p>
    </section>;
  }

  return mode === 'signup'
    ? <SignUp routing="hash" signInUrl="/login" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl}/>
    : <SignIn routing="hash" signUpUrl="/signup" forceRedirectUrl={redirectUrl} fallbackRedirectUrl={redirectUrl}/>;
}

export function AuthScreen({ mode, redirectUrl }: { mode: 'login' | 'signup' | 'forgot' | 'reset' | 'verify'; redirectUrl?: string }) {
  const destination = redirectUrl || (mode === 'signup' ? '/onboarding' : '/dashboard');
  return <main className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-6 p-6"><Link href="/" className="text-lg font-semibold">Relay<span className="text-primary">.</span></Link><ClerkLoading><AuthStatus/></ClerkLoading><ClerkFailed><AuthStatus failed/></ClerkFailed><ClerkLoaded><LoadedAuthScreen mode={mode} redirectUrl={destination}/></ClerkLoaded></main>;
}
