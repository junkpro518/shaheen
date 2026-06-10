import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { chatJSON, resetModelCache } from "@/lib/openrouter";
import type { Json } from "@/lib/database.types";
import * as P from "./prompts";
import type {
  Candidate,
  Scored,
  IssueBody,
  MainStory,
  RoundupItem,
  ToolItem,
  BrandVoice,
} from "./types";

const CANDIDATE_LIMIT = 60;
const BATCH = 6;
const ROUNDUP_COUNT = 6;
const TOOLS_COUNT = 3;

function chunk<T>(arr: T[], n: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}
const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
const composite = (s: Scored, trust: number) =>
  clamp(s.importance) * 0.5 + clamp(s.novelty) * 0.3 + trust * 0.2 - clamp(s.risk) * 0.3;

function titleTokens(t: string): Set<string> {
  return new Set(
    t
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}
function jaccard(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
// Drop near-duplicate headlines (same story from multiple feeds), keep higher trust.
function dedupeByTitle(cands: Candidate[]): Candidate[] {
  const kept: { c: Candidate; toks: Set<string> }[] = [];
  for (const c of [...cands].sort((a, b) => b.trust - a.trust)) {
    const toks = titleTokens(c.title);
    if (kept.some((k) => jaccard(k.toks, toks) > 0.6)) continue;
    kept.push({ c, toks });
  }
  return kept.map((k) => k.c);
}

export type BuildResult = {
  runId: string;
  draftId: string | null;
  candidates: number;
  scored: number;
  status: "completed" | "failed";
  error?: string;
};

// Daily issue pipeline: raw_items -> classify/score -> select -> write -> persist draft.
export async function buildDailyIssue(opts?: { candidateLimit?: number }): Promise<BuildResult> {
  const supabase = createAdminClient();
  const limit = opts?.candidateLimit ?? CANDIDATE_LIMIT;
  resetModelCache(); // pick up any model changes made from /admin/models

  const { data: run } = await supabase
    .from("pipeline_runs")
    .insert({ type: "daily", status: "running" })
    .select("id")
    .single();
  const runId = run!.id;

  try {
    const { data: brand } = await supabase
      .from("brand_config")
      .select("name, tone, banned_words")
      .limit(1)
      .maybeSingle();
    const voice: BrandVoice = {
      name: brand?.name ?? "الشاهين",
      tone: brand?.tone ?? "",
      bannedWords: brand?.banned_words ?? [],
    };

    // 1. candidates — recent raw_items not yet processed
    const { data: processed } = await supabase.from("processed_items").select("raw_item_id");
    const processedIds = new Set((processed ?? []).map((p) => p.raw_item_id));
    const { data: raws } = await supabase
      .from("raw_items")
      .select("id, title, content, url, source_id")
      .order("fetched_at", { ascending: false })
      .limit(limit + processedIds.size + 50);
    const { data: sources } = await supabase.from("sources").select("id, name, trust_score");
    const srcMap = new Map((sources ?? []).map((s) => [s.id, s]));

    const rawCandidates: Candidate[] = (raws ?? [])
      .filter((r) => !processedIds.has(r.id) && r.title)
      .slice(0, limit)
      .map((r) => {
        const src = r.source_id ? srcMap.get(r.source_id) : undefined;
        return {
          id: r.id,
          title: r.title as string,
          content: r.content ?? "",
          source_id: r.source_id,
          source_name: src?.name ?? "",
          url: r.url,
          trust: src?.trust_score ?? 50,
        };
      });

    const candidates = dedupeByTitle(rawCandidates);
    if (candidates.length === 0) throw new Error("no unprocessed candidates");

    // 2. classify + score (batched)
    const scored: Scored[] = [];
    for (const batch of chunk(candidates, BATCH)) {
      try {
        const { system, user } = P.classifyScorePrompt(batch);
        const out = await chatJSON<{ items: Scored[] }>({ task: "classify", system, user });
        for (const s of out.items ?? []) scored.push(s);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        await supabase.from("errors_log").insert({
          level: "warn",
          source: "pipeline:classify",
          message: `batch failed (${batch.length} items): ${msg}`,
        });
      }
    }
    if (scored.length === 0) throw new Error("classification produced no scored items");

    // persist processed_items
    const { data: cats } = await supabase.from("categories").select("id, slug");
    const catMap = new Map((cats ?? []).map((c) => [c.slug, c.id]));
    const byId = new Map(scored.map((s) => [s.id, s]));
    const procRows = candidates
      .filter((c) => byId.has(c.id))
      .map((c) => {
        const s = byId.get(c.id)!;
        return {
          raw_item_id: c.id,
          category_id: s.category_slug ? catMap.get(s.category_slug) ?? null : null,
          audience: Array.isArray(s.audience) ? s.audience : [],
          summary: s.summary ?? null,
          importance: clamp(s.importance),
          novelty: clamp(s.novelty),
          risk: clamp(s.risk),
          source_trust: c.trust,
          analysis: { reason: s.reason ?? "" } as Json,
        };
      });
    if (procRows.length) await supabase.from("processed_items").insert(procRows);

    // 3. select
    const ranked = scored
      .map((s) => ({ s, c: candidates.find((c) => c.id === s.id) }))
      .filter((x): x is { s: Scored; c: Candidate } => Boolean(x.c))
      .map((x) => ({ ...x, score: composite(x.s, x.c.trust) }))
      .sort((a, b) => b.score - a.score);

    // tools = items the classifier flagged as launchable tools (fallback: Product Hunt)
    let toolPicks = ranked.filter((x) => x.s.is_tool).slice(0, TOOLS_COUNT);
    if (toolPicks.length === 0) {
      toolPicks = ranked.filter((x) => /product hunt/i.test(x.c.source_name)).slice(0, TOOLS_COUNT);
    }
    const toolIds = new Set(toolPicks.map((x) => x.c.id));
    const rest = ranked.filter((x) => !toolIds.has(x.c.id));
    const main = rest[0];
    const roundup = rest.slice(1, 1 + ROUNDUP_COUNT);
    if (!main) throw new Error("no main story candidate");

    const selectedIds = [main.c.id, ...roundup.map((x) => x.c.id), ...toolPicks.map((x) => x.c.id)];
    await supabase.from("processed_items").update({ selected: true }).in("raw_item_id", selectedIds);

    // 4. write main story
    const mp = P.mainStoryPrompt(voice, main.c, main.s.summary);
    const mainOut = await chatJSON<Omit<MainStory, "news_id" | "source_url">>({
      task: "write",
      system: mp.system,
      user: mp.user,
    });
    const mainStory: MainStory = {
      news_id: main.c.id,
      source_url: main.c.url,
      title: mainOut.title?.trim() || main.c.title,
      what: mainOut.what ?? "",
      why: mainOut.why ?? "",
      who: mainOut.who ?? "",
      how: mainOut.how ?? "",
      warning: mainOut.warning ?? "",
      our_take: mainOut.our_take ?? "",
    };

    // roundup blurbs
    let roundupItems: RoundupItem[] = [];
    if (roundup.length) {
      const rp = P.roundupPrompt(
        voice,
        roundup.map((x) => ({ id: x.c.id, title: x.c.title, summary: x.s.summary }))
      );
      const rOut = await chatJSON<{ items: { id: string; title: string; blurb: string }[] }>({
        task: "write",
        system: rp.system,
        user: rp.user,
      });
      const rmap = new Map((rOut.items ?? []).map((i) => [i.id, i]));
      roundupItems = roundup.map((x) => ({
        news_id: x.c.id,
        source_url: x.c.url,
        title: rmap.get(x.c.id)?.title?.trim() || x.c.title,
        blurb: rmap.get(x.c.id)?.blurb ?? x.s.summary,
      }));
    }

    // tools blurbs
    let toolItems: ToolItem[] = [];
    if (toolPicks.length) {
      const tp = P.toolsPrompt(
        voice,
        toolPicks.map((x) => ({ id: x.c.id, title: x.c.title, summary: x.s.summary }))
      );
      const tOut = await chatJSON<{ items: { id: string; name: string; blurb: string }[] }>({
        task: "write",
        system: tp.system,
        user: tp.user,
      });
      const tm = new Map((tOut.items ?? []).map((i) => [i.id, i]));
      toolItems = toolPicks.map((x) => ({
        news_id: x.c.id,
        source_url: x.c.url,
        name: tm.get(x.c.id)?.name ?? x.c.title,
        blurb: tm.get(x.c.id)?.blurb ?? x.s.summary,
      }));
    }

    // 5. headline + intro + TL;DR
    const hp = P.headlinePrompt(voice, [main.s, ...roundup.map((x) => x.s)]);
    const head = await chatJSON<{
      title: string;
      intro: string;
      main_topic: string;
      tldr_bullets: string[];
    }>({ task: "headline", system: hp.system, user: hp.user });

    // 6. quality — banned words (non-blocking)
    const body: IssueBody = {
      tldr_bullets: Array.isArray(head.tldr_bullets) ? head.tldr_bullets : [],
      main: mainStory,
      roundup: roundupItems,
      tools: toolItems,
    };
    const flat = JSON.stringify(body) + (head.title ?? "") + (head.intro ?? "");
    const hits = voice.bannedWords.filter((w) => w && flat.includes(w));
    if (hits.length) {
      await supabase.from("errors_log").insert({
        level: "warn",
        source: "pipeline:quality",
        message: `banned words present: ${hits.join(", ")}`,
      });
    }

    // 7. persist draft
    const today = new Date().toISOString().slice(0, 10);
    const { data: draft } = await supabase
      .from("draft_issues")
      .insert({
        issue_date: today,
        type: "daily",
        title: head.title ?? "عدد اليوم",
        intro: head.intro ?? "",
        main_topic: head.main_topic ?? "",
        body: body as unknown as Json,
        status: "in_review",
        meta: { run_id: runId, banned_hits: hits } as Json,
      })
      .select("id")
      .single();

    await supabase
      .from("pipeline_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        state: { candidates: candidates.length, scored: scored.length, draft_id: draft?.id } as Json,
      })
      .eq("id", runId);

    return {
      runId,
      draftId: draft?.id ?? null,
      candidates: candidates.length,
      scored: scored.length,
      status: "completed",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("pipeline_runs")
      .update({ status: "failed", error: msg, finished_at: new Date().toISOString() })
      .eq("id", runId);
    await supabase.from("errors_log").insert({ level: "error", source: "pipeline:build", message: msg });
    return { runId, draftId: null, candidates: 0, scored: 0, status: "failed", error: msg };
  }
}
