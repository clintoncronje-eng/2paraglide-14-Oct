import {
  FlightSlotData,
  BookingData,
  QrCampaignData,
  CountryExpansionConfig,
  PilotPublicProfileBundle,
  PilotBankingPrivateData,
  DigitalWaiverData
} from '../types';
import heroSwissImg from '../assets/images/hero_swiss_paragliding_1791707541299.jpg';
import spotZermattImg from '../assets/images/spot_zermatt_matterhorn_1791707554202.jpg';
import spotLauterbrunnenImg from '../assets/images/spot_lauterbrunnen_valley_1791707564850.jpg';
import pilotAvatarImg from '../assets/images/pilot_avatar_swiss_1791707581540.jpg';
import pilotAvatarMarcImg from '../assets/images/pilot_avatar_marc_1791805625538.jpg';
import pilotAvatarLucImg from '../assets/images/pilot_avatar_luc_1791805637676.jpg';
import heroSwissAlpsTandemImg from '../assets/images/hero_swiss_alps_tandem_1791812828800.jpg';
import logoImg from '../assets/images/logo_2paraglide.jpg';

export const GENERATED_ASSETS = {
  logo: 'https://i.ibb.co/svZDKJKM/2paraglide.jpg',
  logoFallback: logoImg,
  heroSwiss: heroSwissImg,
  heroSwissAlpsTandem: 'https://i.ibb.co/svZDKJKM/2paraglide.jpg',
  heroSwissAlpsTandemFallback: heroSwissAlpsTandemImg,
  spotZermatt: spotZermattImg,
  spotLauterbrunnen: spotLauterbrunnenImg,
  pilotAvatar: pilotAvatarImg,
  pilotAvatarMarc: pilotAvatarMarcImg,
  pilotAvatarLuc: pilotAvatarLucImg
};

export interface SpecChapter {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  summary: string;
  deliverables: string[];
  architectureRules: {
    heading: string;
    detail: string;
    codeOrFormula: string;
  }[];
  implementationChecklist: {
    id: string;
    task: string;
    phase: string;
    criticality: 'Mandatory' | 'High' | 'Expansion';
  }[];
}

export const MASTER_SPEC_CHAPTERS: SpecChapter[] = [
  {
    id: 'security-zero-trust',
    number: '01.',
    title: 'Zero-Trust Security, SHV Licensing & Swiss FADP / GDPR Isolation',
    subtitle: 'Cryptographic RBAC, PII Split-Collections, and Aviation License Verification',
    summary:
      '2paraglide.com processes high-liability aviation bookings across Swiss and European jurisdictions. Security is enforced at the database layer via Attribute-Based Access Control (ABAC), strict PII isolation, and terminal state locking.',
    deliverables: [
      'PII Split-Collection Isolation: Public pilot & user profiles contain zero email/phone PII',
      'SHV/FSVL (Switzerland) & IPPI Stage 5 Tandem (EU) license verification state machine',
      'Terminal State Locking: Completed or cancelled flight records are immutable to non-admins',
      'Server Timestamp & Payload Boundary Enforcement against Denial-of-Wallet attacks'
    ],
    architectureRules: [
      {
        heading: 'Role-Based Access Control (RBAC) Without Client Claim Spoofing',
        detail:
          'Users cannot self-assign the Owner role or self-verify their SHV tandem pilot license during registration. Only verified administrators in /admins/{uid} can elevate privileges or approve pilot insurance certificates.',
        codeOrFormula: `allow create: if isVerifiedUser()
  && isValidUserProfile(incoming())
  && incoming().uid == request.auth.uid
  && incoming().role in ['flyer', 'pilot', 'partner']
  && incoming().verified == false;`
      },
      {
        heading: 'Mathematical Escrow Integrity Gate at Write Time',
        detail:
          'Every booking document written to Firestore is validated at the rule level to guarantee that the sum of Platform Fee + Pilot Payout + QR Partner Commission equals 100% of the Gross Amount in minor currency units (Rappen/Cents).',
        codeOrFormula: `data.totalAmountCents >= 5000 && data.totalAmountCents <= 250000 &&
(data.platformFeeCents + data.pilotPayoutCents + data.partnerCommissionCents == data.totalAmountCents)`
      }
    ],
    implementationChecklist: [
      { id: 'sec-1', task: 'Enforce email_verified == true across all write operations in Firestore', phase: 'Phase 1', criticality: 'Mandatory' },
      { id: 'sec-2', task: 'Isolate passenger waiver & emergency contact PII from public slot manifests', phase: 'Phase 1', criticality: 'Mandatory' },
      { id: 'sec-3', task: 'Verify SHV/BAZL tandem license & CHF 5M third-party liability insurance expiry before slot publication', phase: 'Phase 1', criticality: 'Mandatory' },
      { id: 'sec-4', task: 'Lock completed and cancelled bookings against subsequent client mutations', phase: 'Phase 1', criticality: 'Mandatory' }
    ]
  },
  {
    id: 'payment-gateway-escrow',
    number: '02.',
    title: 'Multi-Country Payment Gateway & 3-Way Escrow Split Engine',
    subtitle: 'Swiss TWINT + Stripe Connect Custom/Express in CHF, Scaling to EUR / SEPA',
    summary:
      'Tandem flights are weather-dependent. Funds are captured via TWINT, Apple Pay, or 3DS2 Cards into a segregated escrow hold and automatically split 3 ways upon pilot flight completion confirmation—or refunded 100% if Föhn winds cancel the slot.',
    deliverables: [
      'Swiss Launch Native Stack: TWINT QR Checkout + Visa/Mastercard 3DS2 + Apple Pay in CHF',
      'Automated 3-Way Split Ledger: 78% Pilot Payout · 10% QR Partner Commission · 12% Platform Fee',
      'Direct Booking Split Ledger (No QR Partner): 85% Pilot Payout · 0% Partner · 15% Platform Fee',
      'Multi-Country Tax & Currency Router: Swiss MWST (8.1%) vs EU Cross-Border VAT (France, Austria, Italy)'
    ],
    architectureRules: [
      {
        heading: 'Three-Way Marketplace Split Formula (Minor Units / Rappen & Cents)',
        detail:
          'All monetary calculations execute in integer Rappen (CHF) or Cents (EUR) to prevent floating-point rounding discrepancies across 3-party payouts.',
        codeOrFormula: `// With QR Partner Attribution (e.g., ref=HOTEL_BELVEDERE_INT):
partnerCommissionCents = Math.round(totalAmountCents * 0.10); // 10.0%
platformFeeCents       = Math.round(totalAmountCents * 0.12); // 12.0%
pilotPayoutCents       = totalAmountCents - partnerCommissionCents - platformFeeCents; // 78.0%

// Direct Website Booking (ref=DIRECT):
partnerCommissionCents = 0;
platformFeeCents       = Math.round(totalAmountCents * 0.15); // 15.0%
pilotPayoutCents       = totalAmountCents - platformFeeCents; // 85.0%`
      },
      {
        heading: 'Stripe Connect Separate Charges & Transfers Lifecycle',
        detail:
          'PaymentIntent is captured with transfer_group = bookingId. Funds remain in platform escrow until the Pilot Dashboard triggers Flight Completed (or 24h post-flight auto-settlement), firing two idempotent Transfer calls to the Pilot and Partner connected IBAN accounts.',
        codeOrFormula: `POST /v1/payment_intents
{
  "amount": 24000,
  "currency": "chf",
  "payment_method_types": ["twint", "card"],
  "transfer_group": "BOOK_2026_INT_8841",
  "metadata": { "pilotId": "pilot_wyss", "partnerCode": "HOTEL_BELVEDERE_INT" }
}`
      }
    ],
    implementationChecklist: [
      { id: 'pay-1', task: 'Enable Swiss TWINT & 3DS2 Cards via Stripe Connect Switzerland (CHF settlement)', phase: 'Phase 2', criticality: 'Mandatory' },
      { id: 'pay-2', task: 'Configure Connected Account onboarding (CH-IBAN for Swiss pilots & hotels, SEPA IBAN for EU expansion)', phase: 'Phase 2', criticality: 'Mandatory' },
      { id: 'pay-3', task: 'Implement instant weather-hold refund webhook (zero cancellation fee when pilot flags Föhn wind hold)', phase: 'Phase 2', criticality: 'High' },
      { id: 'pay-4', task: 'Add EUR multi-currency pricing table for Chamonix (FR), Stubai (AT), and Dolomites (IT)', phase: 'Phase 3', criticality: 'Expansion' }
    ]
  },
  {
    id: 'qr-partner-attribution',
    number: '03.',
    title: 'QR Code Partner Attribution Engine (Hotels, Coffee Shops, Tourism Boards)',
    subtitle: 'Offline-to-Online Referral Tracking, Custom Table Standees & Instant Commission Crediting',
    summary:
      'Local hospitality partners (hotels in Interlaken, mountain coffee shops in Grindelwald, tourism offices in Zermatt) place custom 2paraglide QR standees on reception desks and tables. Every scan binds the partner code to the flyer session and credits a 10% commission upon flight completion.',
    deliverables: [
      'Deterministic Signed Referral URLs: https://2paraglide.com/?ref=PARTNER_CODE&loc=REGION',
      'First-Party 30-Day Attribution Persistence (localStorage + session binding) surviving page reloads',
      'Vector SVG Print-Ready Standee Generator for Hotel Concierge Desks & Cafe Table Tents',
      'Real-Time Scan-to-Booking Conversion Funnel in the Partner Dashboard'
    ],
    architectureRules: [
      {
        heading: 'QR Referral Capture & Session Binding',
        detail:
          'When a guest scans a Partner QR code at a hotel or coffee shop, the app parses ?ref=<partnerCode>, increments the campaign scan counter, and locks the attribution token into the checkout flow.',
        codeOrFormula: `// URL Format Encoded in Partner QR Matrix:
https://2paraglide.com/?ref=CAFE_EIGER_GRINDELWALD&region=Interlaken

// Attribution Resolution Order:
1. Active URL query parameter (?ref=...)
2. Stored 30-day first-party referral token
3. Manual concierge promo code entry at checkout
4. Fallback: "DIRECT" (0% partner split, 85% pilot / 15% platform)`
      }
    ],
    implementationChecklist: [
      { id: 'qr-1', task: 'Generate unique alphanumeric partnerCode per venue (e.g., HOTEL_BELVEDERE_INT)', phase: 'Phase 2', criticality: 'Mandatory' },
      { id: 'qr-2', task: 'Provide downloadable SVG print standees with venue name, region, and instant booking QR', phase: 'Phase 2', criticality: 'Mandatory' },
      { id: 'qr-3', task: 'Track scansCount and bookingsCount atomically per QR campaign', phase: 'Phase 2', criticality: 'High' }
    ]
  },
  {
    id: 'four-dashboards-spec',
    number: '04.',
    title: 'Four-Role Dashboard Functional Specification',
    subtitle: '1. Owner Console · 2. Pilot Cockpit · 3. Flyer Marketplace · 4. Partner QR Portal',
    summary:
      'Each stakeholder operates within a dedicated workspace tailored to their operational workflow while sharing a single synchronized source of truth in Firestore.',
    deliverables: [
      '1. Owner Dashboard: Global GMV, Net Platform Revenue, Pilot SHV Verification Queue, Country Expansion Matrix (CH, FR, AT, IT), and Security Rules Audit',
      '2. Pilot Dashboard: Alpine Slot Publisher, Föhn/Wind Weather Status Toggles (Optimal / Marginal / Hold), Passenger Manifest, and CHF/EUR Escrow Payouts',
      '3. Flyer Dashboard: Swiss & European Flight Discovery, Live Weather & Altitude Telemetry, TWINT/Card Escrow Checkout, and Digital Boarding Passes',
      '4. Partner Dashboard: Venue QR Campaign Creator, Printable Standee Generator, Scan-to-Booking Funnel, and Automated 10% Commission Ledger'
    ],
    architectureRules: [
      {
        heading: 'Synchronized State Transitions Across All 4 Dashboards',
        detail:
          'When a Flyer books a slot via a Partner QR code, all 4 dashboards update in real time: Flyer receives a Confirmed Boarding Pass, Pilot sees the passenger on their Manifest, Partner sees a new attributed booking & pending commission, and Owner sees the escrow split.',
        codeOrFormula: `State Flow:
Pilot creates Slot ('available')
  -> Flyer scans Partner QR (?ref=PARTNER_CODE) & completes TWINT/Card checkout
  -> Booking created ('confirmed') + Slot transitions to ('booked') + QR bookingsCount +1
  -> Pilot completes flight & marks Booking ('completed')
  -> Escrow releases: 78% Pilot IBAN | 10% Partner IBAN | 12% 2paraglide Treasury`
      }
    ],
    implementationChecklist: [
      { id: 'dash-1', task: 'Build Owner Dashboard with Country Expansion switches (Switzerland live, France/Austria/Italy ready)', phase: 'Phase 1', criticality: 'Mandatory' },
      { id: 'dash-2', task: 'Build Pilot Dashboard with SHV license badge, weather hold switch, and slot creator', phase: 'Phase 1', criticality: 'Mandatory' },
      { id: 'dash-3', task: 'Build Flyer Marketplace & Booking Drawer with live 3-way escrow transparency', phase: 'Phase 1', criticality: 'Mandatory' },
      { id: 'dash-4', task: 'Build Partner Dashboard with live QR simulator, standee preview, and commission calculator', phase: 'Phase 1', criticality: 'Mandatory' }
    ]
  }
];

export const INITIAL_COUNTRY_MARKETS: CountryExpansionConfig[] = [
  {
    countryCode: 'CH',
    countryName: 'Switzerland',
    currency: 'CHF',
    aviationAuthority: 'SHV / FSVL & FOCA (BAZL)',
    vatRatePercent: 8.1,
    paymentMethods: ['TWINT', 'CARD_3DS', 'APPLE_PAY'],
    primaryHubs: ['Interlaken Beatenberg', 'Zermatt Rothorn', 'Lauterbrunnen Mürren', 'Verbier Ruinettes', 'Lucerne Rigi'],
    status: 'live',
    activePilotsCount: 42,
    activePartnersCount: 68
  },
  {
    countryCode: 'FR',
    countryName: 'France',
    currency: 'EUR',
    aviationAuthority: 'FFVL & DGAC (Brevet d’État)',
    vatRatePercent: 20.0,
    paymentMethods: ['CARD_3DS', 'APPLE_PAY', 'SEPA'],
    primaryHubs: ['Chamonix Planpraz', 'Annecy Col de la Forclaz', 'Samoëns'],
    status: 'pilot_onboarding',
    activePilotsCount: 14,
    activePartnersCount: 19
  },
  {
    countryCode: 'AT',
    countryName: 'Austria',
    currency: 'EUR',
    aviationAuthority: 'ÖAeC (Austrian Aero Club)',
    vatRatePercent: 20.0,
    paymentMethods: ['CARD_3DS', 'APPLE_PAY', 'SEPA'],
    primaryHubs: ['Stubai Valley Elfer', 'Zell am See Schmittenhöhe', 'Mayrhofen'],
    status: 'regulatory_review',
    activePilotsCount: 8,
    activePartnersCount: 11
  },
  {
    countryCode: 'IT',
    countryName: 'Italy',
    currency: 'EUR',
    aviationAuthority: 'AeCI (Aero Club d’Italia)',
    vatRatePercent: 22.0,
    paymentMethods: ['CARD_3DS', 'APPLE_PAY', 'SEPA'],
    primaryHubs: ['Dolomites Seceda (Val Gardena)', 'Kronplatz', 'Bassano del Grappa'],
    status: 'planned',
    activePilotsCount: 5,
    activePartnersCount: 7
  }
];

export const SEED_FLIGHT_SLOTS: FlightSlotData[] = [
  {
    slotId: 'slot_ch_interlaken_01',
    pilotId: 'demo_pilot_wyss',
    pilotName: 'Beat Wyss',
    pilotPhotoUrl: pilotAvatarImg,
    shvLicense: 'SHV-CH-44910',
    locationName: 'Interlaken Beatenberg Amisbühl',
    landingZoneName: 'Höhematte Park Interlaken',
    collectionPoint: 'Höheweg 95 Flight Desk / Interlaken Ost Station',
    dropOffPoint: 'Höhematte Park Lounge & Hotel Return Shuttle',
    simultaneousGroupCount: 3,
    countryCode: 'CH',
    launchAltitudeM: 1350,
    flightDate: '2026-10-14',
    flightTime: '10:30',
    priceCents: 24000,
    currency: 'CHF',
    weatherStatus: 'optimal',
    status: 'available',
    imageKey: 'heroSwiss',
    durationMinutes: 25,
    verticalDropM: 800
  },
  {
    slotId: 'slot_ch_zermatt_02',
    pilotId: 'demo_pilot_keller',
    pilotName: 'Marc Keller',
    pilotPhotoUrl: pilotAvatarMarcImg,
    shvLicense: 'SHV-CH-38204',
    locationName: 'Zermatt Rothorn Panorama',
    landingZoneName: 'Zermatt Zen Stecken Meadow',
    collectionPoint: 'Sunnegga Valley Station Terminal, Zermatt',
    dropOffPoint: 'Zermatt Bahnhof Square / E-Taxi Stand',
    simultaneousGroupCount: 4,
    countryCode: 'CH',
    launchAltitudeM: 3103,
    flightDate: '2026-10-14',
    flightTime: '13:15',
    priceCents: 32000,
    currency: 'CHF',
    weatherStatus: 'optimal',
    status: 'available',
    imageKey: 'spotZermatt',
    durationMinutes: 35,
    verticalDropM: 1480
  },
  {
    slotId: 'slot_ch_lauterbrunnen_03',
    pilotId: 'demo_pilot_wyss',
    pilotName: 'Beat Wyss',
    pilotPhotoUrl: pilotAvatarImg,
    shvLicense: 'SHV-CH-44910',
    locationName: 'Lauterbrunnen Mürren Schilthorn',
    landingZoneName: 'Stechelberg Valley Floor',
    collectionPoint: 'Schilthornbahn Stechelberg Ticket Hall',
    dropOffPoint: 'Stechelberg Landing Field / PostAuto Stop',
    simultaneousGroupCount: 3,
    countryCode: 'CH',
    launchAltitudeM: 1638,
    flightDate: '2026-10-15',
    flightTime: '11:00',
    priceCents: 26000,
    currency: 'CHF',
    weatherStatus: 'optimal',
    status: 'available',
    imageKey: 'spotLauterbrunnen',
    durationMinutes: 30,
    verticalDropM: 840
  },
  {
    slotId: 'slot_fr_chamonix_04',
    pilotId: 'demo_pilot_moreau',
    pilotName: 'Luc Moreau',
    pilotPhotoUrl: pilotAvatarLucImg,
    shvLicense: 'FFVL-FR-99214',
    locationName: 'Chamonix Planpraz Mont-Blanc',
    landingZoneName: 'Bois du Bouchet Chamonix',
    collectionPoint: 'Télécabine de Planpraz Departure Plaza',
    dropOffPoint: 'Bois du Bouchet Landing Chalet, Chamonix',
    simultaneousGroupCount: 2,
    countryCode: 'FR',
    launchAltitudeM: 2000,
    flightDate: '2026-10-16',
    flightTime: '14:00',
    priceCents: 21000,
    currency: 'EUR',
    weatherStatus: 'marginal',
    status: 'available',
    imageKey: 'spotZermatt',
    durationMinutes: 25,
    verticalDropM: 965
  }
];

export const SEED_QR_CAMPAIGNS: QrCampaignData[] = [
  {
    campaignId: 'qr_hotel_belvedere_int',
    ownerId: 'demo_partner_belvedere',
    partnerName: 'Hotel Belvédère Strand & Spa',
    partnerType: 'Hotel',
    partnerCode: 'HOTEL_BELVEDERE_INT',
    region: 'Interlaken / Lake Thun',
    countryCode: 'CH',
    commissionBps: 1000,
    scansCount: 184,
    bookingsCount: 29,
    status: 'active'
  },
  {
    campaignId: 'qr_cafe_eiger_grindelwald',
    ownerId: 'demo_partner_eiger',
    partnerName: 'Eiger Roastery & Alpine Café',
    partnerType: 'Coffee Shop',
    partnerCode: 'CAFE_EIGER_GRINDELWALD',
    region: 'Grindelwald / Jungfrau',
    countryCode: 'CH',
    commissionBps: 1000,
    scansCount: 142,
    bookingsCount: 19,
    status: 'active'
  },
  {
    campaignId: 'qr_tourism_zermatt',
    ownerId: 'demo_partner_zermatt',
    partnerName: 'Zermatt Matterhorn Visitor Center',
    partnerType: 'Tourism Board',
    partnerCode: 'ZERMATT_TOURISM_HQ',
    region: 'Zermatt / Valais',
    countryCode: 'CH',
    commissionBps: 1000,
    scansCount: 310,
    bookingsCount: 46,
    status: 'active'
  }
];

export const SEED_BOOKINGS: BookingData[] = [
  {
    bookingId: 'book_ch_9012',
    flyerId: 'demo_flyer_01',
    flyerName: 'Sophie Lindqvist',
    pilotId: 'demo_pilot_wyss',
    pilotName: 'Beat Wyss',
    partnerCode: 'HOTEL_BELVEDERE_INT',
    locationName: 'Interlaken Beatenberg',
    countryCode: 'CH',
    flightDate: '2026-10-12',
    flightTime: '10:30',
    currency: 'CHF',
    totalAmountCents: 28000,
    platformFeeCents: 3360,
    pilotPayoutCents: 21840,
    partnerCommissionCents: 2800,
    paymentMethod: 'TWINT',
    status: 'completed',
    mediaIncluded: true,
    waiverSigned: true,
    waiverId: 'waiver_book_ch_9012',
    waiverSignedAt: '2026-10-11 16:42 CET'
  },
  {
    bookingId: 'book_ch_9015',
    flyerId: 'demo_flyer_02',
    flyerName: 'Matteo Bernardi',
    pilotId: 'demo_pilot_keller',
    pilotName: 'Marc Keller',
    partnerCode: 'ZERMATT_TOURISM_HQ',
    locationName: 'Zermatt Rothorn Panorama',
    countryCode: 'CH',
    flightDate: '2026-10-14',
    flightTime: '11:00',
    currency: 'CHF',
    totalAmountCents: 32000,
    platformFeeCents: 3840,
    pilotPayoutCents: 24960,
    partnerCommissionCents: 3200,
    paymentMethod: 'CARD_3DS',
    status: 'confirmed',
    mediaIncluded: false,
    waiverSigned: false
  },
  {
    bookingId: 'book_ch_9019',
    flyerId: 'demo_flyer_03',
    flyerName: 'Hannah Vance',
    pilotId: 'demo_pilot_wyss',
    pilotName: 'Beat Wyss',
    partnerCode: 'CAFE_EIGER_GRINDELWALD',
    locationName: 'Lauterbrunnen Mürren Schilthorn',
    countryCode: 'CH',
    flightDate: '2026-10-15',
    flightTime: '09:30',
    currency: 'CHF',
    totalAmountCents: 30000,
    platformFeeCents: 3600,
    pilotPayoutCents: 23400,
    partnerCommissionCents: 3000,
    paymentMethod: 'APPLE_PAY',
    status: 'confirmed',
    mediaIncluded: true,
    waiverSigned: false
  }
];

export const SEED_WAIVERS: Record<string, DigitalWaiverData> = {
  book_ch_9012: {
    waiverId: 'waiver_book_ch_9012',
    bookingId: 'book_ch_9012',
    flyerId: 'demo_flyer_01',
    flyerName: 'Sophie Lindqvist',
    pilotId: 'demo_pilot_wyss',
    pilotName: 'Beat Wyss',
    locationName: 'Interlaken Beatenberg',
    flightDate: '2026-10-12',
    dateOfBirth: '1995-04-12',
    emergencyContactName: 'Nils Lindqvist',
    emergencyContactPhone: '+41 78 912 34 56',
    medicalDeclarationConfirmed: true,
    riskAcknowledgmentConfirmed: true,
    thirdPartyLiabilityConfirmed: true,
    signatureType: 'typed',
    signatureData: 'Sophie Lindqvist',
    status: 'signed',
    signedAt: '2026-10-11 16:42 CET'
  }
};

export const SEED_PILOT_PUBLIC_PROFILE: PilotPublicProfileBundle = {
  businessInfo: {
    pilotId: 'demo_pilot_wyss',
    companyName: 'Swiss Paragliding Interlaken AG',
    tagline: 'SHV / BAZL Certified Commercial Tandem Operations in the Bernese Oberland & Valais',
    bio: 'Founded by chief SHV tandem pilot Beat Wyss, we operate year-round commercial biplace flights over Lake Brienz, the Eiger-Mönch-Jungfrau massif, Lauterbrunnen Valley, and Zermatt. Every flight uses current-year EN-B/C certified tandem wings and includes full passenger pre-flight briefings.',
    headquarters: 'Höheweg 95, 3800 Interlaken, Switzerland',
    countryCode: 'CH',
    publicEmail: 'flightdesk@swissparagliding-interlaken.ch',
    publicPhone: '+41 33 822 44 90',
    websiteUrl: 'https://2paraglide.com/operators/swiss-paragliding-interlaken',
    googleMapsUrl: 'https://www.google.com/maps/place/Swiss+Paragliding+Interlaken+AG/@46.6863,7.8632,16z',
    googleRating: 4.9,
    googleReviewCount: 348,
    googlePlaceName: 'Swiss Paragliding Interlaken AG',
    googleSyncedAt: '2026-10-12 10:45 CET',
    uidVatNumber: 'CHE-391.402.881 MWST',
    insuranceProvider: 'AXA Winterthur Aviation Switzerland',
    policyNumber: 'CH-BAZL-500912-TANDEM',
    coverageAmount: 'CHF 5,000,000'
  },
  spots: [
    {
      spotId: 'spot_beatenberg_01',
      spotName: 'Interlaken Beatenberg Amisbühl',
      landingZoneName: 'Höhematte Park Interlaken',
      collectionPoint: 'Höheweg 95 Flight Desk / Interlaken Ost Station',
      dropOffPoint: 'Höhematte Park Lounge & Hotel Return Shuttle',
      maxSimultaneousPilots: 5,
      region: 'Interlaken / Lake Thun & Brienz',
      countryCode: 'CH',
      launchAltitudeM: 1350,
      landingAltitudeM: 568,
      gpsTakeoff: '46.6983° N, 7.7921° E',
      gpsLanding: '46.6863° N, 7.8632° E',
      windOrientation: 'S · SW · SE',
      cableCarLift: 'Shuttle Van / PostAuto Beatenberg (20 min)',
      notes: 'Gentle grassy alpine meadow launch with panoramic Eiger, Mönch & Jungfrau views.'
    },
    {
      spotId: 'spot_zermatt_02',
      spotName: 'Zermatt Rothorn Panorama',
      landingZoneName: 'Zermatt Zen Stecken Meadow',
      collectionPoint: 'Sunnegga Valley Station Terminal, Zermatt',
      dropOffPoint: 'Zermatt Bahnhof Square / E-Taxi Stand',
      maxSimultaneousPilots: 4,
      region: 'Zermatt / Matterhorn Valais',
      countryCode: 'CH',
      launchAltitudeM: 3103,
      landingAltitudeM: 1620,
      gpsTakeoff: '46.0236° N, 7.7814° E',
      gpsLanding: '46.0169° N, 7.7450° E',
      windOrientation: 'W · SW · NW',
      cableCarLift: 'Sunnegga–Blauherd–Rothorn Funicular & Gondola',
      notes: 'High-alpine glacier thermal flight directly facing the Matterhorn East Face.'
    },
    {
      spotId: 'spot_lauterbrunnen_03',
      spotName: 'Lauterbrunnen Mürren Schilthorn',
      landingZoneName: 'Stechelberg Valley Floor',
      collectionPoint: 'Schilthornbahn Stechelberg Ticket Hall',
      dropOffPoint: 'Stechelberg Landing Field / PostAuto Stop',
      maxSimultaneousPilots: 3,
      region: 'Lauterbrunnen / 72 Waterfalls Valley',
      countryCode: 'CH',
      launchAltitudeM: 1638,
      landingAltitudeM: 862,
      gpsTakeoff: '46.5594° N, 7.8927° E',
      gpsLanding: '46.5541° N, 7.9018° E',
      windOrientation: 'N · NE · Valley Breeze',
      cableCarLift: 'Schilthornbahn Stechelberg–Mürren',
      notes: 'Soar past sheer limestone walls and glacial waterfalls in the Lauterbrunnen canyon.'
    }
  ],
  pilots: [
    {
      memberId: 'pilot_member_01',
      name: 'Beat Wyss',
      photoUrl: pilotAvatarImg,
      roleTitle: 'Chief Tandem Pilot & Safety Officer',
      shvLicense: 'SHV-CH-44910',
      tandemFlightsLogged: 4280,
      languages: 'DE · EN · FR',
      gliderWing: 'Advance BiBeta 6 (41m²)',
      status: 'active',
      googleRating: 4.9,
      googleReviewCount: 348,
      googleMapsUrl: 'https://www.google.com/maps/place/Swiss+Paragliding+Interlaken+AG/@46.6863,7.8632,16z'
    },
    {
      memberId: 'pilot_member_02',
      name: 'Marc Keller',
      photoUrl: pilotAvatarMarcImg,
      roleTitle: 'Senior High-Alpine & Thermal Pilot',
      shvLicense: 'SHV-CH-38204',
      tandemFlightsLogged: 3190,
      languages: 'DE · EN · IT',
      gliderWing: 'Ozone Magnum 4 (41m²)',
      status: 'active',
      googleRating: 4.9,
      googleReviewCount: 348,
      googleMapsUrl: 'https://www.google.com/maps/place/Swiss+Paragliding+Interlaken+AG/@46.6863,7.8632,16z'
    },
    {
      memberId: 'pilot_member_03',
      name: 'Luc Moreau',
      photoUrl: pilotAvatarLucImg,
      roleTitle: 'Cross-Border Mont-Blanc & Valais Pilot',
      shvLicense: 'FFVL-FR-99214',
      tandemFlightsLogged: 2640,
      languages: 'FR · EN · DE',
      gliderWing: 'Supair Sora 2 Evo (42m²)',
      status: 'active',
      googleRating: 4.9,
      googleReviewCount: 348,
      googleMapsUrl: 'https://www.google.com/maps/place/Swiss+Paragliding+Interlaken+AG/@46.6863,7.8632,16z'
    }
  ],
  mediaGallery: [
    {
      mediaId: 'media_01',
      title: 'Golden Hour Glide Over Lake Brienz & Jungfrau Massif',
      mediaType: 'image',
      assetUrl: heroSwissImg,
      locationTag: 'Interlaken Beatenberg',
      featured: true,
      isHeaderImage: true,
      durationOrResolution: '8K RAW Photo'
    },
    {
      mediaId: 'media_02',
      title: 'Matterhorn East Face High-Alpine Thermal Flight',
      mediaType: 'video',
      assetUrl: spotZermattImg,
      locationTag: 'Zermatt Rothorn 3,103m',
      featured: true,
      isHeaderImage: false,
      durationOrResolution: '4K 60fps GoPro Reel (01:45)'
    },
    {
      mediaId: 'media_03',
      title: '',
      mediaType: 'image',
      assetUrl: spotLauterbrunnenImg,
      locationTag: 'Lauterbrunnen Mürren',
      featured: false,
      isHeaderImage: false,
      durationOrResolution: '4K Action Still'
    },
    {
      mediaId: 'media_04',
      title: 'Pre-Flight SHV Harness & Reserve Check at Launch',
      mediaType: 'image',
      assetUrl: pilotAvatarImg,
      locationTag: 'Grindelwald / Interlaken',
      featured: false,
      isHeaderImage: false,
      durationOrResolution: 'Editorial Portrait'
    }
  ],
  lastPublishedAt: '2026-10-12 10:45 CET'
};

export const SEED_PILOT_PRIVATE_BANKING: PilotBankingPrivateData = {
  pilotId: 'demo_pilot_wyss',
  accountHolderName: 'Swiss Paragliding Interlaken AG',
  iban: 'CH93 0076 2011 6238 5295 7',
  bicSwift: 'UBSWCHZH80A',
  bankName: 'UBS Switzerland AG (Interlaken Branch)',
  settlementCurrency: 'CHF',
  payoutSchedule: 'T+1_ESCROW',
  twintMerchantId: 'TWINT-CH-BIZ-884920'
};

export function generateFullMarkdownScript(): string {
  const lines: string[] = [
    '# 2PARAGLIDE.COM — MASTER RECODING & ARCHITECTURE SPECIFICATION SCRIPT',
    'Version: 2.0 (Switzerland Production Launch + European Multi-Country Expansion)',
    '',
    '## EXECUTIVE SUMMARY',
    '2paraglide.com connects SHV/IPPI-certified tandem paragliding pilots and operators with flyers,',
    'powered by offline-to-online QR partner attribution for hotels, coffee shops, mountain railways, and tourism boards.',
    '',
    '## DESIGN SYSTEM & BRAND TOKENS',
    '- **Background**: `#111111` (Deep Matte Black / Dark Charcoal)',
    '- **Primary Accent / Highlights**: `#E62B1E` (Vibrant Crimson Red used for numbers, specific buttons, and small tags)',
    '- **Primary Text**: `#FFFFFF` (Pure White for headings, primary buttons, and main labels)',
    '- **Secondary Text / Borders**: `#8A8A8A` (Medium Gray used for descriptions, tags, and thin border dividers)',
    '- **H1 Headings (e.g., "TOP PARAGLIDING PILOTS")**: `Syne` Bold / Extended Wide Grotesk',
    '- **H2 Headings & Body (e.g., "Swiss Paragliding Interlaken", "SEARCH YOUR AREA")**: `Inter` / `Helvetica Neue` (Medium / Bold weights)',
    '',
    '---',
    ''
  ];

  for (const ch of MASTER_SPEC_CHAPTERS) {
    lines.push(`## ${ch.number} ${ch.title}`);
    lines.push(`*${ch.subtitle}*`);
    lines.push('');
    lines.push(ch.summary);
    lines.push('');
    lines.push('### Key Deliverables');
    for (const del of ch.deliverables) {
      lines.push(`- ${del}`);
    }
    lines.push('');
    lines.push('### Core Architectural Rules & Code Blueprints');
    for (const rule of ch.architectureRules) {
      lines.push(`#### ${rule.heading}`);
      lines.push(rule.detail);
      lines.push('```typescript');
      lines.push(rule.codeOrFormula);
      lines.push('```');
      lines.push('');
    }
    lines.push('### Implementation Checklist');
    for (const item of ch.implementationChecklist) {
      lines.push(`- [x] [${item.phase} · ${item.criticality}] ${item.task}`);
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  return lines.join('\n');
}
