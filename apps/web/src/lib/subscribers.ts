import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_COOLDOWN_MS = 5 * 60 * 1000; // per-email: don't re-send confirmation within 5 min

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email);
}

export type SubscribeResult =
  | { state: "pending"; token: string } // caller should send the confirmation email
  | { state: "already_active" }
  | { state: "cooldown" }; // recently sent; suppress re-send (no enumeration signal)

// Double opt-in: create/refresh a `pending` subscriber and return its confirmation token.
// Existing active → no-op; pending refreshed within cooldown → suppressed.
export async function createOrResubscribePending(email: string, name?: string): Promise<SubscribeResult> {
  const supabase = createAdminClient();
  const e = normalizeEmail(email);

  const { data: existing } = await supabase
    .from("subscribers")
    .select("id, status, confirmation_token, updated_at")
    .eq("email", e)
    .maybeSingle();

  if (existing) {
    if (existing.status === "active") return { state: "already_active" };
    const updatedMs = existing.updated_at ? new Date(existing.updated_at).getTime() : 0;
    if (existing.status === "pending" && Date.now() - updatedMs < RESEND_COOLDOWN_MS) {
      return { state: "cooldown" };
    }
    const token = existing.confirmation_token ?? crypto.randomUUID();
    await supabase
      .from("subscribers")
      .update({
        status: "pending",
        confirmation_token: token,
        updated_at: new Date().toISOString(),
        ...(name ? { name } : {}),
      })
      .eq("id", existing.id);
    return { state: "pending", token };
  }

  const token = crypto.randomUUID();
  await supabase.from("subscribers").insert({
    email: e,
    name: name ?? null,
    status: "pending",
    confirmation_token: token,
    unsubscribe_token: crypto.randomUUID(),
    source: "web",
  });
  return { state: "pending", token };
}

// Confirm via the one-time token → active. Idempotent (unknown token → false).
export async function confirmSubscriber(token: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("subscribers").select("id").eq("confirmation_token", token).maybeSingle();
  if (!data) return false;
  await supabase
    .from("subscribers")
    .update({ status: "active", confirmed_at: new Date().toISOString(), confirmation_token: null })
    .eq("id", data.id);
  return true;
}

// Unsubscribe via the durable token → unsubscribed. Idempotent.
export async function unsubscribeByToken(token: string): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase.from("subscribers").select("id").eq("unsubscribe_token", token).maybeSingle();
  if (!data) return false;
  await supabase.from("subscribers").update({ status: "unsubscribed" }).eq("id", data.id);
  return true;
}

// Active recipients, deterministically ordered (stable batching for the email channel).
export async function listActiveOrdered(): Promise<Array<{ id: string; email: string; unsubscribe_token: string | null }>> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("subscribers")
    .select("id, email, unsubscribe_token")
    .eq("status", "active")
    .order("id", { ascending: true });
  return data ?? [];
}
