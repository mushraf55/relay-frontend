export const publicApiOrigin = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:4000";

export async function publicRequest<T>(path: string, options: RequestInit = {}, embedOrigin = "") {
  const response = await fetch(`${publicApiOrigin}/public${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(embedOrigin ? { "X-Relay-Embed-Origin": embedOrigin } : {}), ...options.headers },
    cache: "no-store",
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Could not reach this chat.");
  return body as T;
}

export async function publicRequestStream<T>(path: string, options: RequestInit, onEvent: (event: T) => void, embedOrigin = "") {
  const response = await fetch(`${publicApiOrigin}/public${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(embedOrigin ? { "X-Relay-Embed-Origin": embedOrigin } : {}), ...options.headers },
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || "Could not reach this chat.");
  }
  if (!response.body) throw new Error("The response stream was unavailable.");
  const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
  while (true) {
    const { done, value } = await reader.read(); buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n"); buffer = lines.pop() || "";
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as T);
    if (done) break;
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as T);
}
