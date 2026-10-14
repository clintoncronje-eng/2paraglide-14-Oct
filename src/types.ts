import {
  UserRole,
  CurrencyCode,
  WeatherStatus,
  SlotStatus,
  BookingStatus,
  PaymentMethodType,
  PartnerVenueType
} from './lib/validation';

export type WorkspaceView =
  | 'marketplace'
  | 'script'
  | 'owner_dashboard'
  | 'pilot_dashboard'
  | 'flyer_dashboard'
  | 'partner_dashboard'
  | 'security_audit';

export interface UserProfileData {
  uid: string;
  displayName: string;
  role: UserRole;
  countryCode: string;
  shvLicense: string;
  partnerCode: string;
  verified: boolean;
}

export interface FlightSlotData {
  slotId: string;
  pilotId: string;
  pilotName: string;
  shvLicense: string;
  locationName: string;
  countryCode: string;
  launchAltitudeM: number;
  flightDate: string;
  flightTime: string;
  priceCents: number;
  currency: CurrencyCode;
  weatherStatus: WeatherStatus;
  status: SlotStatus;
  imageKey?: 'heroSwiss' | 'spotZermatt' | 'spotLauterbrunnen';
  durationMinutes?: number;
  verticalDropM?: number;
  pilotPhotoUrl?: string;
  collectionPoint?: string;
  dropOffPoint?: string;
  landingZoneName?: string;
  simultaneousGroupCount?: number;
  googleRating?: number;
  googleReviewCount?: number;
  googleMapsUrl?: string;
}

export interface BookingData {
  bookingId: string;
  flyerId: string;
  flyerName: string;
  pilotId: string;
  pilotName: string;
  partnerCode: string;
  locationName: string;
  countryCode: string;
  flightDate: string;
  flightTime: string;
  currency: CurrencyCode;
  totalAmountCents: number;
  platformFeeCents: number;
  pilotPayoutCents: number;
  partnerCommissionCents: number;
  paymentMethod: PaymentMethodType;
  status: BookingStatus;
  mediaIncluded: boolean;
  waiverSigned?: boolean;
  waiverId?: string;
  waiverSignedAt?: string;
}

export interface DigitalWaiverData {
  waiverId: string;
  bookingId: string;
  flyerId: string;
  flyerName: string;
  pilotId: string;
  pilotName: string;
  locationName: string;
  flightDate: string;
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalDeclarationConfirmed: boolean;
  riskAcknowledgmentConfirmed: boolean;
  thirdPartyLiabilityConfirmed: boolean;
  signatureType: 'draw' | 'typed';
  signatureData: string;
  status: 'signed' | 'pending';
  signedAt: string;
}

export interface CheckoutWaiverPayload {
  dateOfBirth: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  medicalDeclarationConfirmed: boolean;
  riskAcknowledgmentConfirmed: boolean;
  thirdPartyLiabilityConfirmed: boolean;
  signatureType: 'draw' | 'typed';
  signatureData: string;
}

export interface CreateBookingPayload {
  slot: FlightSlotData;
  flyerName: string;
  partnerCode: string;
  paymentMethod: PaymentMethodType;
  mediaIncluded: boolean;
  waiver?: CheckoutWaiverPayload;
}

export interface QrCampaignData {
  campaignId: string;
  ownerId: string;
  partnerName: string;
  partnerType: PartnerVenueType;
  partnerCode: string;
  region: string;
  countryCode: string;
  commissionBps: number;
  scansCount: number;
  bookingsCount: number;
  status: 'active' | 'paused' | 'archived';
}

export interface CountryExpansionConfig {
  countryCode: string;
  countryName: string;
  currency: CurrencyCode;
  aviationAuthority: string;
  vatRatePercent: number;
  paymentMethods: PaymentMethodType[];
  primaryHubs: string[];
  status: 'live' | 'pilot_onboarding' | 'regulatory_review' | 'planned';
  activePilotsCount: number;
  activePartnersCount: number;
}

// ============================================================================
// Pilot Dashboard 7-Section Models & Synchronized Public Profile Bundle
// ============================================================================

export interface PilotBusinessInfo {
  pilotId: string;
  companyName: string;
  tagline: string;
  bio: string;
  headquarters: string;
  countryCode: 'CH' | 'FR' | 'AT' | 'IT';
  publicEmail: string;
  publicPhone: string;
  websiteUrl: string;
  googleMapsUrl: string;
  googleRating: number;
  googleReviewCount: number;
  googlePlaceName?: string;
  googleSyncedAt?: string;
  uidVatNumber: string;
  insuranceProvider: string;
  policyNumber: string;
  coverageAmount: string;
}

/**
 * Strictly Private — Stored in /pilotProfiles/{pilotId}/private/banking
 * NEVER published or exposed to the Public Profile.
 */
export interface PilotBankingPrivateData {
  pilotId: string;
  accountHolderName: string;
  iban: string;
  bicSwift: string;
  bankName: string;
  settlementCurrency: CurrencyCode;
  payoutSchedule: 'T+1_ESCROW' | 'WEEKLY_FRIDAY' | 'MONTHLY';
  twintMerchantId: string;
}

export interface TakeOffLandingSpot {
  spotId: string;
  spotName: string;
  landingZoneName: string;
  collectionPoint: string;
  dropOffPoint: string;
  maxSimultaneousPilots: number;
  region: string;
  countryCode: 'CH' | 'FR' | 'AT' | 'IT';
  launchAltitudeM: number;
  landingAltitudeM: number;
  gpsTakeoff: string;
  gpsLanding: string;
  windOrientation: string;
  cableCarLift: string;
  notes: string;
}

export interface TeamPilotMember {
  memberId: string;
  name: string;
  photoUrl: string;
  roleTitle: string;
  shvLicense: string;
  tandemFlightsLogged: number;
  languages: string;
  gliderWing: string;
  status: 'active' | 'off_duty';
  googleRating?: number;
  googleReviewCount?: number;
  googleMapsUrl?: string;
}

export interface PilotMediaItem {
  mediaId: string;
  title: string;
  mediaType: 'image' | 'video';
  assetUrl: string;
  locationTag: string;
  featured: boolean;
  isHeaderImage?: boolean;
  durationOrResolution: string;
}

export interface PilotPublicProfileBundle {
  businessInfo: PilotBusinessInfo;
  spots: TakeOffLandingSpot[];
  pilots: TeamPilotMember[];
  mediaGallery: PilotMediaItem[];
  lastPublishedAt: string;
}

export interface WeatherAlertNotification {
  alertId: string;
  locationName: string;
  status: WeatherStatus;
  affectedSlotsCount: number;
  triggeredAt: string;
  source: string;
  reason: string;
  actionsTaken: string[];
  acknowledged: boolean;
}

export interface PilotOperatorRegistrationPayload {
  companyName: string;
  leadPilotName: string;
  email: string;
  countryCode: string;
  shvLicense: string;
  locationName: string;
  insuranceProvider: string;
  operationType: 'commercial_school' | 'independent_tandem';
}

export interface PartnerRegistrationPayload {
  partnerName: string;
  partnerType: PartnerVenueType;
  partnerCode: string;
  region: string;
  countryCode: string;
  contactName?: string;
  contactEmail?: string;
  ibanOrTwint?: string;
}

export interface FlyerFlightLogEntry {
  logId: string;
  flightDate: string;
  takeoffSite: string;
  landingZone: string;
  gliderWing: string;
  durationMinutes: number;
  maxAltitudeM?: number;
  distanceKm?: number;
  flightType: 'Tandem Passenger' | 'Solo Alpine' | 'Thermal XC' | 'Soaring' | 'Training';
  source: 'XContest API' | 'DHV-XC API' | 'Flymaster Cloud' | 'Leonardo XC' | 'Manual CSV' | 'Direct 2paraglide';
  notes?: string;
  syncedAt?: string;
}

export interface FlyerLogbookSummary {
  totalHours: number;
  totalFlights: number;
  longestFlightMins: number;
  maxAltitudeM: number;
  lastSyncedAt?: string;
  connectedProvider?: string;
}

export interface FlyerNotificationItem {
  id: string;
  type: 'weather' | 'booking' | 'waiver' | 'pilot';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: string;
  locationName?: string;
  bookingId?: string;
  actionLabel?: string;
  read: boolean;
}

export interface FlyerAlertPreferences {
  weatherAlerts: boolean;
  bookingUpdates: boolean;
  waiverReminders: boolean;
  pilotBroadcasts: boolean;
}



