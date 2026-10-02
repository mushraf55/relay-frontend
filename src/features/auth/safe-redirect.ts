export function safeAuthRedirect(value: string | undefined, host: string | null) {
  if (!value) return undefined;
  const allowed = (path: string) => path.startsWith("/") && !path.startsWith("//") && !/^\/(login|signup)(?:[/?#]|$)/.test(path);
  if (allowed(value)) return value;
  try {
    const target = new URL(value);
    const path = `${target.pathname}${target.search}${target.hash}`;
    if (host && target.host === host && allowed(path)) return path;
  } catch {}
  return undefined;
}
