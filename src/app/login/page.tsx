import { AuthScreen } from "@/features/auth/components/auth-screen";
import { safeAuthRedirect } from "@/features/auth/safe-redirect";
import { auth } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page({ searchParams }: { searchParams: Promise<{ redirect_url?: string }> }) {
  const [{ redirect_url: value }, requestHeaders, session] = await Promise.all([searchParams, headers(), auth()]);
  const redirectUrl = safeAuthRedirect(value, requestHeaders.get("host")) || "/dashboard";
  if (session.userId) redirect(redirectUrl);
  return <AuthScreen mode="login" redirectUrl={redirectUrl}/>;
}
