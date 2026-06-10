// Dev-only: long-poll Telegram getUpdates and forward each update to the local
// webhook route. Lets review buttons work locally without a public URL.
// Run:  cd apps/web && set -a && source .env.local && set +a && node scripts/tg-poll.mjs
const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SECRET = process.env.INGEST_SECRET;
const PORT = process.env.PORT || "3210";
const WEBHOOK = `http://localhost:${PORT}/api/telegram/webhook?secret=${SECRET}`;
const API = (m) => `https://api.telegram.org/bot${TOKEN}/${m}`;

if (!TOKEN || !SECRET) {
  console.error("missing TELEGRAM_BOT_TOKEN or INGEST_SECRET in env");
  process.exit(1);
}

await fetch(API("deleteWebhook"), { method: "POST" }).catch(() => {});
console.log("tg-poll: forwarding callbacks ->", WEBHOOK);

let offset = 0;
for (;;) {
  try {
    const r = await fetch(
      API(`getUpdates?timeout=30&offset=${offset}&allowed_updates=["callback_query","message"]`)
    );
    const d = await r.json();
    for (const up of d.result ?? []) {
      offset = up.update_id + 1;
      const kind = up.callback_query ? `callback ${up.callback_query.data}` : "message";
      console.log("→", kind);
      await fetch(WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(up),
      }).catch((e) => console.error("forward failed:", e.message));
    }
  } catch (e) {
    console.error("poll error:", e.message);
    await new Promise((r) => setTimeout(r, 2000));
  }
}
