import "server-only";
import crypto from "crypto";
import Parser from "rss-parser";
import { createAdminClient } from "@/lib/supabase/admin";
import type { TablesInsert } from "@/lib/database.types";

const parser = new Parser({
  timeout: 15000,
  headers: {
    "User-Agent": "ShaheenBot/0.1 (+https://github.com/junkpro518/shaheen)",
  },
});

const MAX_ITEMS_PER_FEED = 20;

function urlHash(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex");
}

export type IngestResult = {
  sources: number;
  inserted: number;
  skipped: number;
  errors: { source: string; error: string }[];
};

// Pull active RSS sources, fetch + dedup their items, upsert into raw_items.
// Runs with the service-role client (bypasses RLS) — server-only.
export async function ingestRssSources(): Promise<IngestResult> {
  const supabase = createAdminClient();
  const result: IngestResult = { sources: 0, inserted: 0, skipped: 0, errors: [] };

  const { data: sources, error } = await supabase
    .from("sources")
    .select("*")
    .eq("active", true)
    .eq("type", "rss");

  if (error) throw new Error(`load sources: ${error.message}`);
  if (!sources?.length) return result;

  for (const source of sources) {
    if (!source.url) continue;
    result.sources++;

    try {
      const feed = await parser.parseURL(source.url);
      const items = (feed.items ?? []).slice(0, MAX_ITEMS_PER_FEED);

      const rows: TablesInsert<"raw_items">[] = items.flatMap((it) => {
        const link = (it.link ?? it.guid ?? "").trim();
        if (!link) return [];
        return [
          {
            source_id: source.id,
            url: link,
            url_hash: urlHash(link),
            title: (it.title ?? "").trim() || null,
            content: (it.contentSnippet ?? it.content ?? "").trim() || null,
            raw: {
              isoDate: it.isoDate ?? null,
              categories: it.categories ?? [],
              creator: it.creator ?? null,
            },
          },
        ];
      });

      if (rows.length) {
        const { data: inserted, error: insErr } = await supabase
          .from("raw_items")
          .upsert(rows, { onConflict: "url_hash", ignoreDuplicates: true })
          .select("id");
        if (insErr) throw new Error(insErr.message);
        const n = inserted?.length ?? 0;
        result.inserted += n;
        result.skipped += rows.length - n;
      }

      await supabase
        .from("sources")
        .update({ last_fetched_at: new Date().toISOString() })
        .eq("id", source.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      result.errors.push({ source: source.name, error: msg });
      await supabase.from("errors_log").insert({
        level: "warn",
        source: `ingest:${source.name}`,
        message: msg,
      });
    }
  }

  return result;
}
