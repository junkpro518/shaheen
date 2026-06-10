import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export type Brand = Tables<"brand_config">;

const FALLBACK_NAME = process.env.NEXT_PUBLIC_BRAND_NAME ?? "الشاهين";

// Single source of truth for brand identity. DB row wins; env is the fallback.
export async function getBrand(): Promise<Brand | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("brand_config").select("*").limit(1).maybeSingle();
  return data;
}

export async function getBrandName(): Promise<string> {
  const brand = await getBrand();
  return brand?.name?.trim() || FALLBACK_NAME;
}
