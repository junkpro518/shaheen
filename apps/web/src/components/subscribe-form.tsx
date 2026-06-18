"use client";
import { useState } from "react";

export function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error" | "limited">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.status === 429) setStatus("limited");
      else if (res.ok) setStatus("sent");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <p className="rounded-md bg-muted p-4 leading-relaxed">
        📧 أرسلنا رابط تأكيد إلى بريدك. افتحه لإكمال الاشتراك.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <input
        type="email"
        required
        dir="ltr"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="بريدك الإلكتروني"
        className="rounded-md border bg-background px-3 py-2 text-start"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-50"
      >
        {status === "loading" ? "جارٍ…" : "اشترك"}
      </button>
      {status === "error" && <p className="text-sm text-red-600">تعذّر الاشتراك. حاول لاحقاً.</p>}
      {status === "limited" && <p className="text-sm text-red-600">محاولات كثيرة. حاول بعد قليل.</p>}
    </form>
  );
}
