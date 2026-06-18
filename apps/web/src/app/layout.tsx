import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Thmanyah Sans — the project's adopted typeface (local woff2).
const arabic = localFont({
  variable: "--font-arabic",
  // "block" (not "swap"): hold text invisibly for the brief local-font load, then
  // paint in Thmanyah — never flash a system fallback (brand fidelity). Local woff2
  // loads in ~40ms so the block period is imperceptible.
  display: "block",
  src: [
    { path: "../fonts/thmanyah/thmanyahsans-Light.woff2", weight: "300", style: "normal" },
    { path: "../fonts/thmanyah/thmanyahsans-Regular.woff2", weight: "400", style: "normal" },
    { path: "../fonts/thmanyah/thmanyahsans-Medium.woff2", weight: "500", style: "normal" },
    { path: "../fonts/thmanyah/thmanyahsans-Bold.woff2", weight: "700", style: "normal" },
    { path: "../fonts/thmanyah/thmanyahsans-Black.woff2", weight: "900", style: "normal" },
  ],
});

const brandName = process.env.NEXT_PUBLIC_BRAND_NAME ?? "الشاهين";

export const metadata: Metadata = {
  title: brandName,
  description: "خلاصة عملية يومية عن الذكاء الاصطناعي والأعمال والتقنية",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${arabic.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
