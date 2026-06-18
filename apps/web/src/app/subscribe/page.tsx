import { SubscribeForm } from "@/components/subscribe-form";
import { getBrandName } from "@/lib/brand";

export const metadata = { title: "اشترك" };

export default async function SubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ confirmed?: string; error?: string }>;
}) {
  const sp = await searchParams;
  const name = await getBrandName();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold">اشترك في نشرة {name}</h1>
      <p className="mb-6 text-muted-foreground">الذكاء الاصطناعي لروّاد الأعمال — يومياً في بريدك.</p>

      {sp.confirmed ? (
        <p className="rounded-md bg-muted p-4 leading-relaxed">✅ تم تأكيد اشتراكك. أهلاً بك في {name}.</p>
      ) : sp.error ? (
        <p className="rounded-md bg-muted p-4 leading-relaxed">
          ⚠️ رابط التأكيد غير صالح أو منتهٍ. جرّب الاشتراك من جديد.
        </p>
      ) : (
        <SubscribeForm />
      )}
    </main>
  );
}
