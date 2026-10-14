# 2paraglide — Swiss & European Tandem Paragliding Platform

**2paraglide.com** is a multi-role tandem paragliding marketplace, architecture blueprint, payment split engine, and QR partner attribution platform. It connects flyers, pilots, partners (venues/resorts), and platform owners with real-time Firebase data, role-based dashboards, and a zero-trust security model.

## Major Capabilities

- 🪂 **Multi-role marketplace** — dedicated dashboards for Flyers, Pilots, Partners, and Owners/Admins (`MarketplaceAndFlyerView`, `PilotDashboardView`, `PartnerDashboardView`, `OwnerDashboardView`)
- 💰 **Payment split / escrow engine** — enforced financial invariants on bookings: `totalAmountCents == platformFeeCents + pilotPayoutCents + partnerCommissionCents`
- 🔗 **QR partner attribution** — QR campaign management with scan/booking tracking and locked commission rates (`QrCodeMatrix`)
- 🗓️ **Flight slots & booking lifecycle** — pilot-created slots with terminal-state locking (`completed` / `cancelled`), visualized on an interactive Leaflet map (`FlightSlotsMapVisualization`)
- 📄 **Digital waivers & PDF receipts** — client-side waiver signing (`DigitalWaiverModal`) and receipt generation (`html2pdf.js`, `lib/pdfReceipt.ts`)
- ✈️ **Flyer logbook** — personal flight logbook with sync modal (`FlyerFlightLogbook`, `FlyerLogbookSyncModal`)
- 🤖 **Gemini AI integration** — server-side Gemini API capability via `@google/genai` (architecture/master-spec assistance)
- 🔒 **Zero-trust security** — Firestore Security Rules with PII isolation, role-escalation prevention, temporal integrity, and adversarial payload test suite (`security_spec.md`, `firestore.rules`, `firestore.rules.test.ts`, `SecurityAuditView`)

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build tool | Vite (with `@tailwindcss/vite`, Tailwind CSS v4) |
| Backend / Data | Firebase (Auth, Firestore) — config in `firebase-applet-config.json` |
| Maps | Leaflet |
| Animation | Motion (Framer Motion successor) |
| Icons | lucide-react |
| AI | Google Gemini (`@google/genai`) |
| PDF | html2pdf.js |
| Server (optional) | Express |

## Project Structure

```
├── src/
│   ├── App.tsx                  # Root app: auth state, role routing, live Firestore subscriptions
│   ├── main.tsx                 # Entry point
│   ├── types.ts                 # Shared domain types (roles, bookings, slots, campaigns)
│   ├── components/              # Role dashboards, modals, map, QR matrix, security audit view
│   ├── lib/                     # firebase.ts, pdfReceipt.ts, validation.ts, googleMapsRating.ts
│   ├── data/                    # masterSpecScript.ts (platform architecture blueprint)
│   └── assets/images/           # Hero, spot, pilot, and logo imagery
├── firestore.rules              # Zero-trust Firestore Security Rules
├── firestore.rules.test.ts      # Adversarial payload tests ("Dirty Dozen")
├── security_spec.md             # Data invariants & threat specification
├── firebase-blueprint.json      # Firebase deployment blueprint
├── index.html                   # Vite HTML entry
└── vite.config.ts               # Vite + React + Tailwind config
```

## Getting Started

### Prerequisites

- Node.js 18+ (Bun also works; `bun.lock` is included)
- A Firebase project with Auth (Google sign-in) and Firestore enabled
- A Gemini API key for AI features

### Installation

```bash
npm install   # or: bun install
```

### Environment

Copy `.env.example` to `.env` and fill in:

```env
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="https://your-app-url"
```

> Note: When deployed as a Google AI Studio applet, these values are injected automatically at runtime from the Secrets panel / Cloud Run service URL.

Firebase client configuration lives in `firebase-applet-config.json` (loaded by `src/lib/firebase.ts`).

### Development

```bash
npm run dev        # Start Vite dev server on http://localhost:3000
```

### Production

```bash
npm run build      # Bundle to dist/
npm run preview    # Preview the production build
```

### Quality & Security

```bash
npm run lint       # TypeScript type-check (tsc --noEmit)
npx eslint .       # Lint (eslint.config.js, incl. @firebase/eslint-plugin-security-rules)
```

Firestore rules carry a dedicated adversarial test suite (`firestore.rules.test.ts`) covering the "Dirty Dozen" payloads defined in `security_spec.md` — privilege escalation, email spoofing, shadow-field injection, terminal-state mutation, escrow-split tampering, and more.

## Security Model (Summary)

Rules enforce six core invariants:

1. **PII isolation** — no emails/phones in public profile docs; `/users/{id}` readable only by owner or admin.
2. **Role-escalation prevention** — self-signup limited to `flyer`/`pilot`/`partner` with `verified == false`.
3. **Slot ownership & terminal states** — only verified pilots create their own slots; completed/cancelled slots are locked.
4. **Booking escrow splits** — booking creation requires correct split math and `flyerId == auth.uid`; terminal bookings locked.
5. **QR campaign attribution** — owner-scoped campaigns; `commissionBps` locked at 1000 unless admin-modified.
6. **Temporal integrity** — `createdAt`/`updatedAt` must match `request.time` on create; immutable `createdAt` on update.

See `security_spec.md` and `firestore.rules` for full details.

## License

SPDX-License-Identifier: Apache-2.0
