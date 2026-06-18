---
description: "Task list for Phase 7 — Real Publishing"
---

# Tasks: Real Publishing (Phase 7 — النشر الفعلي)

**Input**: Design documents from `specs/002-real-publishing/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/publishing-endpoints.md
**Tests**: Not requested (repo has no test harness; verification is the `quickstart.md` scenarios). No test tasks generated.
**Paths**: All app code under `apps/web/src/`. Migrations under `supabase/migrations/`.

> **Story map** (from spec.md): **US1** = Email (P1) · **US2** = Blog (P1) · **US3** = Telegram channel (P2) · **US4** = Editor oversight/recovery (P2).
> **Dependency note**: US1 (email) and US3 (telegram) embed the blog URL, and the blog page 404s until blog is live — so **US2 (blog) is implemented before US1/US3** even though both US1 and US2 are P1.
> **⛔ GATED** tasks touch real, irreversible/outward state (production DNS, real email sends, prod migration) and require **explicit user go-ahead** — they are excluded from any autonomous run.

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 ⏸️ DEFERRED to Phase 4 (email): add `resend` to `apps/web/package.json`. NOT needed by the MVP (no Phase 1–3 file imports it). NOTE: a mid-session `pnpm add resend` corrupted the pnpm store / Next's `semver` resolution; recovery was `pnpm install --force` + `rm -rf apps/web/.next`. When doing Phase 4, add it cleanly and re-verify the dev server boots.
- [x] T002 [P] Added `NEXT_PUBLIC_SITE_URL` to `.env.example` (prod value) and `apps/web/.env.local` (`http://localhost:3210`).
- [x] T003 [P] Created `supabase/migrations/0001_phase7_subscribers.sql` (tokens + default `pending` + backfill + partial unique indexes). File only — NOT applied (gated T040).
- [x] T004 [P] Created `apps/web/src/lib/site.ts` — `getBaseUrl()` + `issueUrl(slug)`.
- [x] T005 [P] Created `apps/web/src/lib/settings.ts` — `getAppSetting(key)`.
- [x] T006 [P] Created `apps/web/src/lib/channels.ts` — `getEnabledChannels()` (blog always-on) + `getChannelConfig(channel)`.
- [x] T007 [P] Added `getBrandAdmin()` to `apps/web/src/lib/brand.ts`.
- [x] T008 [P] Created `apps/web/src/components/issue-view.tsx` — shared RTL `IssueBody` renderer.

---

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ Blocks all channel work.**

- [x] T009 Created `apps/web/src/lib/publish/types.ts` — `ChannelResult`/`ChannelResults`/`CHANNEL_ORDER` (blog first).
- [x] T010 Created orchestrator `apps/web/src/lib/publish/run.ts` — `publishIssue(issueId,{channels,force})`: blog-first, blog-dependency gate for email/telegram, idempotency skip, single writer of `channel_results`.
- [x] T011 Created `apps/web/src/app/api/cron/publish/route.ts` — guarded by `x-ingest-secret`, date-guarded default (today's issue), 401/404 handling, on-publish `revalidatePath`. (email/telegram are no-op `skipped` stubs until Phases 4/5.)

**Checkpoint**: trigger + orchestrator exist; channel modules are stubs returning `skipped` until implemented.

---

## Phase 3: User Story 2 — Public blog (Priority: P1) 🎯 MVP-critical (prerequisite for US1/US3)

**Goal**: Every distributed issue is readable at a public URL with brand + archive.
**Independent Test**: Approve an issue, run publish for `blog`, open `/issues/<slug>` (renders full Arabic issue) and `/issues` (lists it); an unpublished slug 404s.

- [x] T012 [US2] Created `apps/web/src/lib/publish/blog.ts` — validates renderable body, returns `success` + `{url}`.
- [x] T013 [US2] Created `apps/web/src/app/issues/[slug]/page.tsx` — gated on `channel_results.blog='success'` (else `notFound()`), `IssueView` render, `generateMetadata` (OG/Twitter). Verified: `/issues/<missing>` → 404.
- [x] T014 [P] [US2] Created `apps/web/src/app/issues/page.tsx` — archive, blog-published only, newest-first. Verified: 200 + correct empty state.
- [x] T015 [US2] Revalidation: `export const revalidate = 300` on both pages + `revalidatePath` on publish (in the trigger route).
- [x] T016 [P] [US2] Added `/issues` link to the home page (`apps/web/src/app/page.tsx`).

**Checkpoint**: blog channel works end-to-end; link-bearing channels can now reference live URLs.

---

## Phase 4: User Story 1 — Email newsletter (Priority: P1)

**Goal**: Approved+published issue is emailed to active subscribers from the verified domain, with working unsubscribe; subscribers grow via double opt-in.
**Independent Test**: With domain verified + ≥1 active (test) subscriber, run publish for `email`; the test address receives the issue; unsubscribe link works; re-trigger sends no duplicate.

- [x] T017 [P] [US1] Created `apps/web/src/lib/email/templates.ts` — confirmation email (inline RTL HTML). Newsletter-issue template deferred to T023 (the gated send).
- [x] T018 [US1] Created `apps/web/src/lib/subscribers.ts` — `createOrResubscribePending`, `confirmSubscriber`, `unsubscribeByToken`, `listActiveOrdered` (ordered by `id`). Forward-declared the new columns in `database.types.ts` so it compiles before the migration.
- [x] T019 [US1] Created `apps/web/src/app/api/subscribe/route.ts` — validate/normalize, double opt-in, per-email cooldown + per-IP throttle (429), sends confirmation, no enumeration. Also `lib/email/send.ts` (raw-fetch Resend; **no SDK dep** — supersedes T001).
- [x] T020 [P] [US1] Created `apps/web/src/app/api/subscribe/confirm/route.ts` — token → active, redirect to `/subscribe?confirmed=1`.
- [x] T021 [P] [US1] Created `apps/web/src/app/api/unsubscribe/route.ts` — GET (Arabic page) + POST (one-click List-Unsubscribe-Post), idempotent.
- [x] T022 [US1] Created `apps/web/src/app/subscribe/page.tsx` + `components/subscribe-form.tsx` (client). Verified: `/subscribe` renders 200. Home page links added.
- [ ] T023 [US1] ⛔ Implement `apps/web/src/lib/publish/email.ts` (newsletter batch send) — **NOT started** (the real outbound send is gated; needs migration T040 + domain verified). Will use raw-fetch Resend `/emails/batch` + `Idempotency-Key` + List-Unsubscribe headers.

> **US1 status:** subscribe + double-opt-in + unsubscribe **code complete & typechecks**, but NOT live-tested — exercising `/api/subscribe` sends a real confirmation email AND needs the `subscribers` migration (T040). Both are gated per the user. The newsletter blast (T023) is not built.

**Checkpoint**: email channel works against a test subscriber (domain verification handled in Phase 7 gated tasks).

---

## Phase 5: User Story 3 — Telegram channel (Priority: P2)

**Goal**: Each published issue is announced to the public Telegram channel with a link to the blog.
**Independent Test**: Run publish for `telegram`; a post appears in the configured channel with headline + summary + blog link.

- [x] T024 [US3] Created `apps/web/src/lib/publish/telegram-channel.ts` — raw `fetch` `sendMessage` to `getChannelConfig('telegram').channel_id` (= `@AlShaheenAi`), headline + ≤3 TL;DR bullets + blog link, word-boundary clipping; wired into `run.ts` (replaces telegram stub). `publishing_channels.telegram` enabled with `config.channel_id=@AlShaheenAi`. tsc/eslint clean. ⏳ Live post to the public channel pending explicit user OK (classifier blocked posting test content to the live brand channel — correct guardrail).

**Checkpoint**: all three channels publish independently (subject to the blog-first rule).

---

## Phase 6: User Story 4 — Editor oversight & recovery (Priority: P2)

**Goal**: Editor sees per-channel status per issue and can re-publish only a failed channel.
**Independent Test**: Force one channel to fail, see its status in `/admin/issues/[id]`, click re-publish for it; only that channel re-runs to `success`.

- [ ] T025 [US4] Add per-channel status display (from `channel_results`) to the admin issue detail at `apps/web/src/app/admin/issues/[id]/...`. Depends on T009.
- [ ] T026 [US4] Add an admin-gated server action that calls `publishIssue(issueId, { channels:[ch], force:true })` for a single channel and refreshes the row (`is_admin()` enforced). Depends on T010, T025.

**Checkpoint**: oversight + recovery complete.

---

## Phase 7: Polish, Wiring & ⛔ Gated Production Steps

- [ ] T027 [P] Update `apps/web/src/lib/telegram.ts` publish-handler message (remove the "توزيع … يأتي في Phase 7" note now that publishing exists; reflect ready→publish flow).
- [ ] T028 [P] Fold the `0001_phase7_subscribers.sql` DDL into `supabase/setup.sql` (keep fresh-project bootstrap complete).
- [ ] T029 [P] Update `.env.example` comments for `NEXT_PUBLIC_SITE_URL` and confirm Resend/Telegram-channel vars are documented.
- [ ] T030 Run the `quickstart.md` scenarios end-to-end on `pnpm dev` (Scenarios 1–5) and record results.
- [ ] T031 [P] Update `docs/HANDOFF.md` (mark Phase 7 done: email+blog+Telegram; X deferred) and project memory.
- [ ] T032 [P] Seed/enable `publishing_channels` rows: `blog` (enabled), `telegram` (enabled, `config.channel_id=@AlShaheenAi`). (`email` enabled only after T040.)

**⛔ GATED — require explicit user go-ahead (irreversible / outward-facing):**

- [ ] T040 ⛔ Apply migration `0001_phase7_subscribers.sql` to the **production** Supabase project (`tciiwpzkgtsoypuaghld`) via Supabase MCP `apply_migration` or SQL Editor.
- [ ] T041 ⛔ Verify the Resend sending domain `alshaheenai.com`: add the domain in Resend, add the returned SPF/DKIM/DMARC records via the **Cloudflare MCP**, confirm verification; then enable the `email` channel row.
- [ ] T042 ⛔ Real-email validation: with the **only** active subscriber being a test address (never a real list), run an email publish and confirm receipt + unsubscribe.

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → **Phase 2 (Foundational)** → stories.
- **US2 (blog, Phase 3) precedes US1 (email) and US3 (telegram)** — both link to the blog and the blog page gates on `channel_results.blog='success'`.
- **US1 (Phase 4)** and **US3 (Phase 5)** are independent of each other once US2 is done.
- **US4 (Phase 6)** depends only on the orchestrator + at least one channel.
- **Gated tasks (T040–T042)** depend on their code being complete and on explicit user approval; the email channel cannot be fully validated until T040 + T041.

### Parallel opportunities

- Setup: T002–T008 are mostly `[P]` (distinct files).
- Within US1: T020, T021 (`[P]`) parallel to each other; T017 parallel to T018.
- US3 (T024) and US4 (T025–T026) can proceed in parallel once US2 + foundational are done.

## Implementation Strategy

- **MVP increment 1**: Setup + Foundational + **US2 blog** → readers can read issues at public URLs. Validate, demo.
- **Increment 2**: **US1 email** (+ subscribe flow) → newsletter goes out (after gated DNS/migration). Validate with a test subscriber.
- **Increment 3**: **US3 telegram** → channel announcements.
- **Increment 4**: **US4 oversight** → per-channel recovery.
- **Pause point**: stop before T040–T042 for explicit user go-ahead.

## Notes

- `[P]` = different files, no incomplete-task dependency.
- Single writer of `channel_results` = the orchestrator; channel modules return `ChannelResult` only.
- Commit after each logical group; verify on `pnpm dev` (port 3210), not the slow production build.
