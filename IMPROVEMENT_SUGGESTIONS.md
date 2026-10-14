# 2paraglide — Improvement Suggestions & Edit Plan (Qwen Developer)

Prepared: 2026-10-14 · Verified baseline: `tsc --noEmit` ✅ passes, `vite build` ✅ succeeds.
This document is the edit plan for the next pass in Qwen Developer. Items are ordered by priority;
each includes file/line anchors so edits can be applied precisely.

---

## P0 — Security & Correctness

### 1. Hard-coded owner email as sole admin gate (privilege fragility)
- **Where:** `firestore.rules:36,42` (`isBootstrappedOwner()`), `src/App.tsx:953`, `src/App.tsx:1052` — all compare against the literal `'clintoncronje@me.com'`.
- **Problem:** Admin identity is baked into both client and rules. Rotation requires a redeploy of everything; the address leaks in the public JS bundle; there is no secondary admin.
- **Fix:**
  - Rules: keep `isBootstrappedOwner()` only for cold-start bootstrap; make `isAdmin()` the authoritative check via the `/admins/{uid}` collection (already exists at `firestore.rules:249` but is effectively unused for authorization).
  - Client: replace email literals with a runtime role lookup (`users/{uid}.role == 'owner'`) already synced from Firestore; centralize in one helper (e.g. `lib/roles.ts`).

### 2. Silent auth-failure UX + unguarded `catch {}` writes
- **Where:** `src/App.tsx:173-174` (`catch { /* Profile may already exist */ }`); every `handleFirestoreError(...)` path throws a generic `Error(JSON.stringify(...))` (`src/lib/firebase.ts:58-59`) which most call sites swallow.
- **Fix:** Distinguish `permission-denied` / `unavailable` / duplicate-merge cases; surface a user-facing toast instead of console-only errors. Never expose raw authInfo JSON to end users (it echoes email/UIDs — information disclosure if rendered).

### 3. Seed data masquerades as live data when offline
- **Where:** `src/App.tsx:78-105` initializes state from `SEED_*` constants; snapshot handlers merge remote docs on top without ever clearing seeds (`src/App.tsx:210-218`).
- **Problem:** Bookings/slots/waivers that exist only as demo seeds are displayed as real marketplace inventory; flyers could "book" phantom slots (writes will then fail rules → error cascade from item 2).
- **Fix:** Gate seed rendering behind an explicit `demoMode` flag; show "Demo data — not connected to Firestore" banner when listeners error or return empty.

### 4. `localStorage` holds logbook & partner attribution without sanitization on read
- **Where:** `src/components/MarketplaceAndFlyerView.tsx:551,561,633`; `src/App.tsx:140`.
- **Problem:** Values are parsed back with `JSON.parse` inside try/catch? (verify) and used directly in UI/rendering paths; a tampered `2paraglide_partner_ref` alters escrow attribution shown to pilots/partners.
- **Fix:** Re-validate every value read from storage through the existing guards (`validatePartnerCode`, schema checks in `src/lib/validation.ts`) before use; treat stored flight logs as untrusted input.

### 5. Escrow split math — rounding drift & clamped totals
- **Where:** `src/lib/validation.ts:70-80` (`calculateEscrowSplit`).
- **Observations:** The invariant `fee + pilot + partner === total` holds because pilot payout is computed as remainder — good. However: (a) `Math.max(5000, Math.min(250000, ...))` silently *changes* the customer's total instead of rejecting out-of-band amounts; (b) bps values (1000/1200/7800) are described in comments but implemented as decimal literals — drift risk between doc and code.
- **Fix:** Throw/reject on out-of-range totals; define basis-point constants once and derive percentages from them; add unit tests (see P2 #12).

---

## P1 — Architecture & Maintainability

### 6. God-component `App.tsx` (1,538 LOC, 15 useState, 4 useEffect, all Firestore I/O)
- **Fix plan (incremental, test-guarded):**
  1. Extract Firestore listeners + writes into hooks: `useFlightSlots()`, `useBookings(user)`, `useWaivers()`, `useQrCampaigns()` under `src/hooks/`.
  2. Move pure helpers (`getCurrentTimestampStr`, `showToast`) to `src/lib/time.ts` and a `ToastProvider` context.
  3. Move `SEED_WEATHER_ALERTS` (defined mid-component body at `src/App.tsx:97-110`!) into `src/data/masterSpecScript.ts` where the other seeds live.
  4. Target: `App.tsx` < 300 LOC (routing + composition only).

### 7. Oversized dashboard components
- **Where:** `PilotDashboardView.tsx` (3,390 LOC), `MarketplaceAndFlyerView.tsx` (2,518 LOC), `PilotPublicProfileModal.tsx` (906 LOC).
- **Fix:** Split by feature tab (slots / bookings / payouts / profile-editor…), colocate types, and lazy-load per-role dashboards with `React.lazy` + `Suspense` (currently zero code-splitting anywhere — confirmed by grep).

### 8. Bundle: single 2.27 MB JS chunk (634 kB gzip) + 800 kB–1 MB JPEGs shipped as-is
- **Evidence:** `vite build` warning; `dist/assets/*.jpg` up to 1,028 kB each.
- **Fix:**
  - Route/role-level `import()` splitting (pairs with #7).
  - Convert hero/avatar images to WebP/AVIF ≤ 200 kB, add `loading="lazy"` + width/height in `ResilientImage` (`src/components/ResilientImage.tsx` — nice component, just needs `loading`/`decoding` props).
  - Consider `manualChunks` for `firebase` vs `leaflet` vs `motion`.

### 9. Dead weight & config mismatch
- `@google/genai` is a dependency and `metadata.json` declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`, but **no code imports it** (grep confirms). Either wire it up (AI weather advisories / waiver summaries) or remove the dep + capability claim.
- `express` + `@types/express` are listed but no server entry exists (`package.json` has no `server` script). Remove or add the intended server.
- `eslint.config.js` only configures the Firebase-rules plugin — `npm run lint` never lints TS/TSX. Add `@eslint/js` + `typescript-eslint` + `react-hooks` recommended configs so `npx eslint src` actually runs today's gap (it currently errors "all files ignored").
- `DRAFT_firestore.rules` (25 kB) duplicates `firestore.rules` — delete or document its purpose.

### 10. Realtime listener inefficiency
- **Where:** `src/App.tsx:186+` — four separate `onSnapshot` collections merged into local Maps on every change.
- **Fix:** Memoize row mappers, avoid full-array rebuilds (`Array.from(map.values())` on every snapshot re-sorts/re-renders everything); key by doc id and use stable references to prevent re-render storms in the 3k-line dashboards.

---

## P2 — Testing, Types, DX

### 11. Type safety of Firestore documents
- Snapshot handlers read `data.slotId`, `data.priceCents`, … untyped (`src/App.tsx:190-207`). Adopt `zod` (or hand-written decoders in `src/lib/validation.ts`) with `withConverter()` on each collection so malformed docs fail loudly at the boundary.

### 12. Rules tests are declarative only
- `firestore.rules.test.ts` defines the "Dirty Dozen" cases but contains **no assertions/runner**. Wire it to `@firebase/rules-unit-testing` with an emulator suite (`firebase emulator:exec` or npm script `test:rules`), plus vitest unit tests for `calculateEscrowSplit` invariants and the sanitizer edge cases (empty strings, overlong unicode, control chars).

### 13. Misc hygiene
- `tsconfig.json`: enable `strict: true` (currently unset → implicit `any` everywhere) and `noUncheckedIndexedAccess` incrementally.
- `main.tsx`: add `ErrorBoundary` + `<StrictMode>` (double-invocation would have caught the localStorage effects early).
- Timestamps are hand-formatted with a hard-coded `' CET'` suffix (`src/App.tsx:125-133`) — wrong half the year (CEST) and non-localizable; use `Intl.DateTimeFormat` with `timeZone: 'Europe/Zurich'`.
- `sanitizeId` fallback `'id_default'` (`src/lib/validation.ts:31`) can collide across users; prefer throwing.

---

## Suggested execution order for Qwen Developer
1. **#1/#2/#5** security-critical micro-edits (small diffs, verifiable with `firestore.rules.test.ts` + new unit tests).
2. **#12** test harness first — it protects every refactor after this point.
3. **#9** config cleanup (lint actually running gives immediate feedback for #6/#7).
4. **#6 → #7 → #8** progressive decomposition + code-splitting (one component per commit, `tsc --noEmit && vite build` green between steps).
5. **#11/#13** typing & polish.

Each step keeps `npm run lint` (fixed) and `vite build` green; no behavior change without a test.
