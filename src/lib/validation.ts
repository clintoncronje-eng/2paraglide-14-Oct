/**
 * Verbatim Schema Validation Constants & Guards synchronized with firebase-blueprint.json
 * and firestore.rules.
 */

export const VALIDATION_CONSTRAINTS = {
  ID_MAX_LENGTH: 128,
  ID_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  DISPLAY_NAME_MAX_LENGTH: 80,
  SHV_LICENSE_MAX_LENGTH: 40,
  PARTNER_CODE_MAX_LENGTH: 40,
  PARTNER_CODE_PATTERN: /^[a-zA-Z0-9_\-]+$/,
  COUNTRY_CODE_PATTERN: /^[A-Z]{2}$/,
  LOCATION_NAME_MAX_LENGTH: 80,
  REGION_MAX_LENGTH: 60,
  FLIGHT_DATE_MAX_LENGTH: 20,
  FLIGHT_TIME_MAX_LENGTH: 10,
} as const;

export type UserRole = 'flyer' | 'pilot' | 'partner' | 'owner';
export type CurrencyCode = 'CHF' | 'EUR';
export type WeatherStatus = 'optimal' | 'marginal' | 'hold' | 'risky' | 'unsafe';
export type SlotStatus = 'available' | 'booked' | 'completed' | 'cancelled';
export type BookingStatus = 'confirmed' | 'completed' | 'cancelled';
export type PaymentMethodType = 'TWINT' | 'CARD_3DS' | 'APPLE_PAY' | 'SEPA';
export type PartnerVenueType = 'Hotel' | 'Coffee Shop' | 'Tourism Board' | 'Hostel' | 'Mountain Railway';

export function sanitizeId(raw: string): string {
  const cleaned = raw.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, VALIDATION_CONSTRAINTS.ID_MAX_LENGTH);
  return cleaned.length > 0 ? cleaned : 'id_default';
}

export function sanitizeText(raw: string, maxLength: number, fallback = 'Unknown'): string {
  const trimmed = raw.trim().slice(0, maxLength);
  return trimmed.length > 0 ? trimmed : fallback;
}

export function validatePartnerCode(code: string): string {
  const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9_\-]/g, '_').slice(0, VALIDATION_CONSTRAINTS.PARTNER_CODE_MAX_LENGTH);
  return cleaned.length >= 3 ? cleaned : 'DIRECT';
}

export interface EscrowSplitBreakdown {
  totalAmountCents: number;
  platformFeeCents: number;
  pilotPayoutCents: number;
  partnerCommissionCents: number;
  hasPartnerReferral: boolean;
}

/**
 * Computes exact integer cents/rappen 3-way escrow split guaranteed to satisfy:
 * platformFeeCents + pilotPayoutCents + partnerCommissionCents === totalAmountCents
 *
 * - With QR Partner Referral (e.g. Hotel / Coffee Shop / Tourism Board):
 *   Partner: 10% (1000 bps)
 *   2paraglide Platform: 12% (1200 bps)
 *   Pilot Escrow Payout: 78% (7800 bps)
 * - Direct Booking (No Partner Referral / 'DIRECT'):
 *   Partner: 0%
 *   2paraglide Platform: 15% (1500 bps)
 *   Pilot Escrow Payout: 85% (8500 bps)
 */
export function calculateEscrowSplit(
  totalAmountCents: number,
  partnerCode: string
): EscrowSplitBreakdown {
  const safeTotal = Math.max(5000, Math.min(250000, Math.round(totalAmountCents)));
  const hasPartnerReferral = Boolean(partnerCode && partnerCode !== 'DIRECT');

  const partnerCommissionCents = hasPartnerReferral ? Math.round(safeTotal * 0.10) : 0;
  const platformFeeCents = hasPartnerReferral
    ? Math.round(safeTotal * 0.12)
    : Math.round(safeTotal * 0.15);
  const pilotPayoutCents = safeTotal - partnerCommissionCents - platformFeeCents;

  return {
    totalAmountCents: safeTotal,
    platformFeeCents,
    pilotPayoutCents,
    partnerCommissionCents,
    hasPartnerReferral,
  };
}

export function formatCurrency(cents: number, currency: CurrencyCode = 'CHF'): string {
  const major = (cents / 100).toFixed(2);
  return `${currency} ${major}`;
}
