// Inline-styled RTL Arabic email templates (email clients ignore external CSS).

function esc(s: string): string {
  return (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Double opt-in confirmation email.
export function confirmationEmailHtml(args: {
  brandName: string;
  confirmUrl: string;
  accent?: string;
}): { subject: string; html: string } {
  const { brandName, confirmUrl, accent = "#C8932A" } = args;
  const subject = `أكّد اشتراكك في نشرة ${brandName}`;
  const html = `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"></head>
<body style="margin:0;background:#EFE9DA;font-family:'Segoe UI',Tahoma,Arial,sans-serif;color:#0C2340;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <h1 style="font-size:22px;margin:0 0 16px;">${esc(brandName)}</h1>
    <p style="font-size:16px;line-height:1.8;margin:0 0 24px;">شكراً لاشتراكك. اضغط الزرّ أدناه لتأكيد بريدك والبدء باستلام النشرة.</p>
    <p style="margin:0 0 28px;">
      <a href="${esc(confirmUrl)}" style="display:inline-block;background:${esc(accent)};color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:16px;">تأكيد الاشتراك</a>
    </p>
    <p style="font-size:13px;color:#555;line-height:1.7;margin:0;">إن لم تطلب هذا الاشتراك، تجاهل هذه الرسالة.</p>
  </div>
</body></html>`;
  return { subject, html };
}
