# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**الشاهين (Al-Shaheen)** — an Arabic daily AI newsletter for Gulf entrepreneurs. A pnpm monorepo where **all application and engine logic lives in `apps/web`** (Next.js 16 App Router, Tailwind v4, shadcn/ui, RTL Arabic). `services/` is reserved but intentionally empty — ingestion, the AI pipeline, the Telegram bot, and publishing are `lib/` modules + `app/api/cron/*` routes, kept in one deployable unit.

## Commands

Run from `apps/web` unless noted. **Use `next dev` locally** — the production `next build` (Turbopack) is very slow in some shells.

- `pnpm install` (repo root) — install workspace
- `pnpm dev` / `pnpm --filter web dev` — dev server
- `pnpm --filter web build` · `pnpm --filter web lint`
- **Trigger jobs locally** (server on `:3210`, `SECRET=$(grep INGEST_SECRET apps/web/.env.local|cut -d= -f2)`):
  - ingest RSS → `curl -XPOST localhost:3210/api/cron/ingest -H "x-ingest-secret: $SECRET"`
  - build today's issue → `.../api/cron/build-issue` (JSON body `{"candidateLimit":N}`)
  - send draft to Telegram → `.../api/cron/send-review`
- **Telegram buttons locally**: `node scripts/tg-poll.mjs` (long-poll forwarder → `/api/telegram/webhook`; no public URL needed)
- **DB schema on a fresh Supabase project**: run `supabase/setup.sql` in the SQL Editor (full schema + RLS + Al-Shaheen seed). The `supabase` MCP in `.mcp.json` targets the official project once authenticated.

## Architecture (big picture)

Data flows through Supabase tables, one stage per cron route:

1. **Ingest** — `lib/ingest.ts` reads active `sources` (RSS), dedups by `sha256(url)`, writes `raw_items`. → `/api/cron/ingest`
2. **Build** — `lib/pipeline/run.ts` `buildDailyIssue()`: batched classify+score → **relevance gate** → select into fixed blocks → Arabic write (main + `our_take`, roundup, tools) → headline + 5-bullet TL;DR → persists `draft_issues`. State/tokens recorded in `pipeline_runs`. → `/api/cron/build-issue`
3. **Review** — `lib/telegram.ts` sends the draft + action keyboard to the admin chat. → `/api/cron/send-review`; button presses hit `/api/telegram/webhook` (publish → `published_issues`, reject/postpone/stop, regen rebuilds).

Key modules:
- **`lib/openrouter.ts`** — one model **per task** read from the `ai_models_config` table (editable at `/admin/models`); per-run token + USD cost accounting stored in `pipeline_runs.state.tokens`. Images use nano-banana via OpenRouter (same key).
- **`lib/supabase/`** — three clients: `client.ts` (browser), `server.ts` (SSR, user session), **`admin.ts`** (service_role, bypasses RLS, `server-only`, used by every background job).
- **Auth** — magic-link; `proxy.ts` guards `/admin`. Every table has RLS; **writes are gated by `is_admin()`** (email present in the `admins` table).
- **Pipeline shape** — plain staged TypeScript modelled like LangGraph nodes (`lib/pipeline/{run,prompts,types}.ts`); not the LangGraph library.

## Conventions & gotchas

- **Brand is data-driven, never hardcoded**: name/tone/palette/section-names/voice live in `brand_config` (`settings` jsonb) + `NEXT_PUBLIC_BRAND_NAME`. The pipeline reads voice and section labels from `brand_config` at runtime.
- **Editorial focus is enforced in code**: the classifier scores `relevance` (AI ↔ something an entrepreneur can build/use); `RELEVANCE_MIN` in `run.ts` drops generic tech (hardware/games/policy). Preserve this lens.
- **`NEXT_PUBLIC_*` are inlined at build time** — after changing the Supabase URL/anon key or brand env, **rebuild** (a restart isn't enough).
- Cron + webhook routes are guarded by the shared **`INGEST_SECRET`** (`x-ingest-secret` header, or `?secret=` for the webhook) and run on the Node runtime.
- The official Supabase project (`tciiwpzkgtsoypuaghld`, eu-central-1) is under a **different account** than the originally-connected MCP token — apply DDL via the Management API + a PAT, the SQL Editor, or the `supabase` MCP in `.mcp.json` after OAuth.
- All secrets in `apps/web/.env.local` (gitignored; documented in `.env.example`). Rotate before production.
- Observability: PostHog via `lib/posthog.ts` (`getPostHogClient()`), captured across server actions/routes; Sentry DSN in env.

## Status

Done: foundation · RSS ingestion · AI pipeline (+ relevance focus) · Telegram review bot · token/cost tracking · brand identity · migrated to the official Supabase project. Remaining: gifts (Phase 4), review-mode + schedule UI (5), images (6), full publishing — email/blog/Telegram-channel/X (7), weekly digest (8), analytics + reader ratings (9), VPS deploy + cron (10). The phase plan and key decisions are in the project memory.

---

## Behavioral guidelines

Bias toward caution over speed; for trivial tasks, use judgment.

1. **Think before coding** — state assumptions; if multiple interpretations exist, present them rather than picking silently; prefer the simpler approach and say so; if something is unclear, stop and ask.
2. **Simplicity first** — minimum code that solves the problem, nothing speculative; no unrequested abstractions/flexibility; if 200 lines could be 50, rewrite.
3. **Surgical changes** — touch only what the request needs; match existing style; don't refactor what isn't broken; remove only orphans your own change created; mention (don't delete) pre-existing dead code.
4. **Goal-driven execution** — turn tasks into verifiable goals and loop until verified; for multi-step work, state a brief plan with a verify step per item.
5. **Spec-first development** — no feature code without a spec. Before any new feature, major refactor, DB/API change, UI flow, or architectural decision, these must exist: Spec → Clarifications → Plan → Tasks. Treat spec files as the single source of truth. Decisions not in the specs: ask the user when they affect product/architecture/data/security/cost/UX; otherwise document under an **Assumptions** section. Trivial non-behavioral changes (typos, formatting, doc wording, broken-import fixes) need no spec.
6. **Workflow compliance** — this project uses **Spec Kit** (github/spec-kit; scaffold in `.specify/` + `.claude/skills/speckit-*`). Before meaningful work: review the Constitution (`.specify/memory/constitution.md`), existing specs, task scope, and current implementation; then run **clarify → plan → tasks → implement** in order — skip nothing for new/major/unclear work. If asked to implement immediately while spec artifacts are missing, stop and create them first. If Spec Kit isn't installed, stop and notify.
7. **Claude Code plugins** — only install plugins that directly match approved project tools/workflow (verify trusted, relevant, documented). No speculative installs.
8. **Instruction sync: CLAUDE.md ↔ AGENTS.md** — keep both aligned on core rules (overview, architecture, spec-first workflow, commands, security, style, deployment, prohibited actions). When editing one, update shared rules in the other.

<!-- SPECKIT START -->
**New session? Start with `docs/HANDOFF.md`** — current state, what's built, what's left, and the Spec Kit workflow to continue. For additional context about technologies, project structure, and commands, read the current plan.
<!-- SPECKIT END -->
