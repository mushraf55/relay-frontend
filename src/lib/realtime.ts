import { createClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

function realtimeClient() {
  if (client !== undefined) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  client = url && key ? createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }) : null;
  return client;
}

export function subscribeToRoom(shareId: string, onChange: () => void) {
  const supabase = realtimeClient();
  if (!supabase) return { channel: null, unsubscribe: async () => {} };
  const channel = supabase
    .channel(`relay-room:${shareId}`, { config: { broadcast: { self: true } } })
    .on("broadcast", { event: "messages-changed" }, onChange)
    .subscribe();
  return { channel, unsubscribe: () => supabase.removeChannel(channel) };
}

export async function announceRoomChange(channel: RealtimeChannel | null) {
  if (!channel) return;
  await channel.send({ type: "broadcast", event: "messages-changed", payload: {} });
}

export type { RealtimeChannel };
