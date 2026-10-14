# 2paraglide — Swiss & European Tandem Paragliding Platform

A multi-role tandem paragliding marketplace, architecture blueprint, payment-split engine, and QR partner-attribution platform for [2paraglide.com](https://2paraglide.com).

Built with **React 19**, **Vite**, **TypeScript**, **Tailwind CSS 4**, **Firebase** (Auth + Firestore), **Leaflet** maps, and **Google Gemini AI**.

## Features

- **Multi-role workspaces** — dedicated dashboards for four user roles:
  - 🪂 **Flyer** — browse the marketplace, book tandem flights, sign digital waivers, keep a personal flight logbook.
  - 👨‍✈️ **Pilot** — manage flight slots, public profile, media gallery, team members, and banking/payout details.
  - 🤝 **Partner** — QR campaign attribution with per-scan tracking and commission accounting.
  - 🛡️ **Owner/Admin** — platform-wide oversight, verification queue, country/market expansion config, and a zero-trust security audit view.
- **Escrow payment-split engine** — every booking enforces the invariant `totalAmountCents == platformFeeCents + pilotPayoutCents + partnerCommissionCents` (see `src/lib/validation.ts`).
- **QR partner attribution** — campaigns generate QR matrices that attribute bookings to partners with a locked 10% commission (`commissionBps = 1000`) unless modified by an admin.
- **Digital waivers** — legally structured waiver flow with weather-status gating.
- **Flight-slot map visualization** — Leaflet-based take-off/landing spot mapping (Zermatt/Matterhorn, Lauterbrunnen, etc.).
- **PDF receipts** — client-side receipt generation via `html2pdf.js`.
- **Weather alerts & flyer notifications** — real-time notification center driven by Firestore listeners.
- **Gemini AI integration** — server-side AI capabilities (`@google/genai`) for the platform's major capability (`MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API`).
- **Zero-trust Firestore security rules** — role-escalation prevention, PII isolation, terminal-state locking, and temporal integrity enforced at the database layer.

## Tech Stack

| Layer | Technology |
|---|---|
| UI | React 19, Tailwind CSS 4, lucide-react icons, motion (animations) |
| Build | Vite 8, TypeScript, esbuild |
| Backend | Firebase Auth (Google sign-in), Cloud Firestore |
| Maps | Leaflet |
| AI | Google Gemini (`@google/genai`) |
| Security | Firestore Security Rules (`firestore.rules`) + `@firebase/eslint-plugin-security-rules` |

## Getting Started

### Prerequisites

- Node.js (LTS) or [Bun](https://bun.sh)
- A Firebase project with Auth (Google provider) and Firestore enabled — configuration lives in `firebase-applet-config.json`
- A Gemini API key

### Installation

```bash
npm install        # or: bun install
```

### Environment

Copy `.env.example` to `.env` and fill in:

```bash
GEMINI_API_KEY="your-gemini-api-key"
APP_URL="http://localhost:3000"
```

> When hosted in AI Studio, both values are injected automatically at runtime.

### Run the dev server

```bash
npm run dev        # Vite dev server on port 3000 (host 0.0.0.0)
```

### Other scripts

```bash
npm run build      # Production build (dist/)
npm run preview    # Preview the production build
npm run lint       # Type-check with tsc --noEmit
npm run clean      # Remove dist and server artifacts
```

## Project Structure

```
├── firestore.rules              # Zero-trust security rules for all collections
├── firestore.rules.test.ts      # Rule tests against adversarial payloads
├── security_spec.md             # Data invariants & "Dirty Dozen" attack payloads
├── IMPROVEMENT_SUGGESTIONS.md   # Prioritized edit plan (P0 security/correctness first)
├── firebase-blueprint.json      # Firestore data blueprint / seed schema
├── index.html                   # App entry HTML
├── vite.config.ts               # Vite + React + Tailwind config
└── src/
    ├── App.tsx                  # Root component: auth, live listeners, workspace routing
    ├── main.tsx                 # React bootstrap
    ├── types.ts                 # Shared domain types (WorkspaceView, BookingData, …)
    ├── lib/
    │   ├── firebase.ts          # Firebase init, auth helpers, error handling
    │   ├── validation.ts        # Escrow split math, sanitizers, partner-code guards
    │   ├── pdfReceipt.ts        # PDF receipt generation
    │   └── googleMapsRating.ts  # Rating/review integration helper
    ├── data/
    │   └── masterSpecScript.ts  # Master architecture/spec script content
    └── components/
        ├── MarketplaceAndFlyerView.tsx     # Flyer marketplace & booking flow
        ├── PilotDashboardView.tsx          # Pilot slot/profile/banking management
        ├── PartnerDashboardView.tsx        # Partner QR campaign dashboard
        ├── OwnerDashboardView.tsx          # Admin oversight & market expansion
        ├── SecurityAuditView.tsx           # Rules & invariant audit UI
        ├── FlightSlotsMapVisualization.tsx # Leaflet slot map
        ├── DigitalWaiverModal.tsx          # Waiver signing flow
        ├── QrCodeMatrix.tsx                # QR campaign rendering
        ├── FlyerFlightLogbook.tsx          # Personal flight logbook
        ├── FlyerNotificationCenter.tsx     # Weather/booking/waiver alerts
        └── ...                             # Modals, sync, shared UI
```

## Security Model

The platform follows a **zero-trust** specification documented in [`security_spec.md`](./security_spec.md), enforced by [`firestore.rules`](./firestore.rules):

1. **PII isolation** — emails/phones never live in public documents; `/users/{uid}` is readable only by the owner or a verified admin.
2. **Role-escalation prevention** — non-admins can only self-assign `flyer`/`pilot`/`partner` roles with `verified == false`.
3. **Terminal-state locking** — completed/cancelled slots and bookings are immutable for non-admins.
4. **Escrow split enforcement** — booking writes must satisfy the financial split equation at the rules level.
5. **Temporal integrity** — `createdAt`/`updatedAt` timestamps are bound to `request.time` on every write.

Adversarial test payloads ("Dirty Dozen") and rule tests live in `security_spec.md` and `firestore.rules.test.ts`. Known hardening items are tracked in `IMPROVEMENT_SUGGESTIONS.md`.

## License

SPDX-License-Identifier: Apache-2.0
