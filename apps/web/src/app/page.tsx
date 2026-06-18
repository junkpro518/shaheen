import Link from "next/link";
import { getBrand } from "@/lib/brand";
import { buttonVariants } from "@/components/ui/button";

export default async function Home() {
  const brand = await getBrand();
  const name = brand?.name ?? process.env.NEXT_PUBLIC_BRAND_NAME ?? "الشاهين";

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
      <h1 className="text-4xl font-bold">{name}</h1>
      {brand?.tagline && (
        <p className="max-w-xl text-lg text-muted-foreground">{brand.tagline}</p>
      )}
      <div className="flex gap-3">
        <Link href="/subscribe" className={buttonVariants()}>
          اشترك
        </Link>
        <Link href="/issues" className={buttonVariants({ variant: "outline" })}>
          كل الأعداد
        </Link>
        <Link href="/admin" className={buttonVariants({ variant: "outline" })}>
          لوحة التحكم
        </Link>
      </div>
    </main>
  );
}
