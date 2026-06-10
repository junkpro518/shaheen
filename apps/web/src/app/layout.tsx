import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
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
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans">
        {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
