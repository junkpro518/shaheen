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
      <Link href="/admin" className={buttonVariants()}>
        لوحة التحكم
      </Link>
    </main>
  );
}
