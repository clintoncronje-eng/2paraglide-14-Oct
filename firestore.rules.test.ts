/**
 * 2paraglide.com — Firestore Security Rules Red Team Test Suite
 * Verifies that all 12 "Dirty Dozen" adversarial payloads in security_spec.md
 * return PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collectionPath: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  expectedOutcome: 'PERMISSION_DENIED' | 'ALLOWED';
  pillarVerified: string;
}

export const DIRTY_DOZEN_TEST_CASES: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Block self-assigned owner role or verified=true on UserProfile creation',
    collectionPath: '/users/attacker_uid',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Pillar 4: Tiered Identity Logic & Anti-Escalation'
  },
  {
    id: 2,
    name: 'Block spoofed admin email when email_verified is false',
    collectionPath: '/users/victim_uid',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Phase 5: Email Spoofing Guard'
  },
  {
    id: 3,
    name: 'Block shadow field injection (isSuperAdmin) on UserProfile update',
    collectionPath: '/users/user_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Pillar 2: Strict Keys & Anti-Update-Gap'
  },
  {
    id: 4,
    name: 'Block cross-user profile read by non-owner/non-admin',
    collectionPath: '/users/pilot_99',
    operation: 'get',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Pillar 6: PII & Profile Isolation'
  },
  {
    id: 5,
    name: 'Block pilot impersonation on FlightSlot creation',
    collectionPath: '/flightSlots/slot_101',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Pillar 2: Identity Integrity'
  },
  {
    id: 6,
    name: 'Block negative price or invalid escrow math on Booking creation',
    collectionPath: '/bookings/book_55',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Pillar 2: Boundary Limits & Value Integrity'
  },
  {
    id: 7,
    name: 'Block mutation of Booking once in terminal completed/cancelled state',
    collectionPath: '/bookings/completed_book_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Phase 4.6: Terminal State Locking'
  },
  {
    id: 8,
    name: 'Block blanket list query on Bookings without flyerId/pilotId ownership filter',
    collectionPath: '/bookings',
    operation: 'list',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Pillar 8: Secure List Queries (Query Enforcer)'
  },
  {
    id: 9,
    name: 'Block Partner from modifying commissionBps on QrCampaign',
    collectionPath: '/qrCampaigns/camp_1',
    operation: 'update',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Phase 4.5: Action-Based Update Pattern'
  },
  {
    id: 10,
    name: 'Block invalid characters and >128 byte IDs in document path variables',
    collectionPath: '/qrCampaigns/invalid$id!with@special#chars',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Pillar 3: Path Variable Hardening'
  },
  {
    id: 11,
    name: 'Block forged client timestamps not matching request.time',
    collectionPath: '/qrCampaigns/camp_2',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Phase 4.13: Temporal Integrity'
  },
  {
    id: 12,
    name: 'Block all client writes to /admins/{adminId} registry',
    collectionPath: '/admins/attacker_uid',
    operation: 'create',
    expectedOutcome: 'PERMISSION_DENIED',
    pillarVerified: 'Pillar 1: Master Gate & System-Only Path Lock'
  }
];
