import "server-only";

type SendArgs = {
  to: string;
  subject: string;
  html: string;
  headers?: Record<string, string>;
  idempotencyKey?: string;
};

// Send one email via the Resend REST API (raw fetch, matching the codebase's
// Telegram pattern — no SDK dependency). Throws on non-2xx.
export async function sendEmail({ to, subject, html, headers, idempotencyKey }: SendArgs): Promise<{ id?: string }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key) throw new Error("RESEND_API_KEY not set");
  if (!from) throw new Error("RESEND_FROM_EMAIL not set");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    },
    body: JSON.stringify({ from, to, subject, html, headers }),
  });
  const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!res.ok) throw new Error(`resend send failed: ${res.status} ${data?.message ?? ""}`);
  return { id: data?.id };
}
