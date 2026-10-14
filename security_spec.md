# 2paraglide.com — Zero-Trust Security Specification (`security_spec.md`)

## 1. Data Invariants & Relationship Mapping

1. **PII Isolation Invariant**: `/users/{userId}` stores only non-PII role, license (`shvLicense`), and attribution (`partnerCode`) metadata. Email addresses and phone numbers are never stored in public profile documents. Reading `/users/{userId}` is restricted strictly to the profile owner (`request.auth.uid == userId`) or a verified platform Owner/Admin (`isAdmin()`).
2. **Role Escalation Prevention Invariant**: During profile creation or update on `/users/{userId}`, non-admin users can only select non-privileged marketplace roles (`['flyer', 'pilot', 'partner']`) and must initialize `verified == false`. Only `isAdmin()` can assign `role == 'owner'` or toggle `verified == true`.
3. **Flight Slot Ownership & Terminal State Invariant**: A `/flightSlots/{slotId}` document can only be created by a verified user whose `pilotId == request.auth.uid`. Once a slot reaches a terminal status (`'completed'` or `'cancelled'`), further mutations by non-admins are locked.
4. **Booking Escrow Split & Terminal State Invariant**: A `/bookings/{bookingId}` document can only be created by an authenticated, email-verified user where `flyerId == request.auth.uid`, `status == 'confirmed'`, and the financial split equations hold (`totalAmountCents == platformFeeCents + pilotPayoutCents + partnerCommissionCents`). Once a booking reaches `'completed'` or `'cancelled'`, it is locked against further non-admin updates.
5. **QR Campaign Attribution Invariant**: A `/qrCampaigns/{campaignId}` document belongs to `ownerId == request.auth.uid`. Non-admin owners may only update `status`, `partnerName`, `region`, `scansCount`, `bookingsCount`, and `updatedAt`, while `commissionBps` is locked to `1000` (10%) unless modified by `isAdmin()`.
6. **Temporal Integrity Invariant**: Every `create` operation across all collections must enforce `incoming().createdAt == request.time && incoming().updatedAt == request.time`. Every `update` operation must enforce `incoming().createdAt == existing().createdAt && incoming().updatedAt == request.time`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

### Payload 1: Self-Assigned Owner/Admin Privilege Escalation (Identity Spoofing)
```json
{
  "collection": "/users/attacker_uid",
  "operation": "create",
  "auth": { "uid": "attacker_uid", "email": "attacker@evil.ch", "email_verified": true },
  "payload": {
    "uid": "attacker_uid",
    "displayName": "Fake Owner",
    "role": "owner",
    "countryCode": "CH",
    "shvLicense": "",
    "partnerCode": "",
    "verified": true,
    "createdAt": "SERVER_TIMESTAMP",
    "updatedAt": "SERVER_TIMESTAMP"
  },
  "expected": "PERMISSION_DENIED"
}
```

### Payload 2: Unverified Admin Email Spoofing (Email Spoofing Attack)
```json
{
  "collection": "/users/victim_uid",
  "operation": "get",
  "auth": { "uid": "spoof_uid", "email": "clintoncronje@me.com", "email_verified": false },
  "expected": "PERMISSION_DENIED"
}
```

### Payload 3: Shadow Field Injection on User Profile (Shadow Update Attack)
```json
{
  "collection": "/users/user_1",
  "operation": "update",
  "auth": { "uid": "user_1", "email": "flyer@swiss.ch", "email_verified": true },
  "payload": {
    "displayName": "Lukas",
    "isSuperAdmin": true,
    "updatedAt": "SERVER_TIMESTAMP"
  },
  "expected": "PERMISSION_DENIED"
}
```

### Payload 4: Cross-User Profile Read (PII / Profile Blanket Read Test)
```json
{
  "collection": "/users/pilot_99",
  "operation": "get",
  "auth": { "uid": "flyer_12", "email": "flyer12@swiss.ch", "email_verified": true },
  "expected": "PERMISSION_DENIED"
}
```

### Payload 5: Pilot Impersonation on Flight Slot Creation (Identity Integrity)
```json
{
  "collection": "/flightSlots/slot_101",
  "operation": "create",
  "auth": { "uid": "attacker_uid", "email": "attacker@evil.ch", "email_verified": true },
  "payload": {
    "slotId": "slot_101",
    "pilotId": "other_pilot_uid",
    "pilotName": "Beat Wyss",
    "shvLicense": "SHV-44910",
    "locationName": "Interlaken Beatenberg",
    "countryCode": "CH",
    "launchAltitudeM": 1350,
    "flightDate": "2026-10-15",
    "flightTime": "10:30",
    "priceCents": 24000,
    "currency": "CHF",
    "weatherStatus": "optimal",
    "status": "available",
    "createdAt": "SERVER_TIMESTAMP",
    "updatedAt": "SERVER_TIMESTAMP"
  },
  "expected": "PERMISSION_DENIED"
}
```

### Payload 6: Negative Price / Escrow Split Manipulation on Booking (Integrity Violation)
```json
{
  "collection": "/bookings/book_55",
  "operation": "create",
  "auth": { "uid": "flyer_1", "email": "flyer1@swiss.ch", "email_verified": true },
  "payload": {
    "bookingId": "book_55",
    "flyerId": "flyer_1",
    "flyerName": "Elena Rossi",
    "pilotId": "pilot_1",
    "pilotName": "Beat Wyss",
    "partnerCode": "DIRECT",
    "locationName": "Interlaken",
    "countryCode": "CH",
    "flightDate": "2026-10-18",
    "flightTime": "14:00",
    "currency": "CHF",
    "totalAmountCents": -24000,
    "platformFeeCents": 0,
    "pilotPayoutCents": 500000,
    "partnerCommissionCents": 0,
    "paymentMethod": "TWINT",
    "status": "confirmed",
    "mediaIncluded": true,
    "createdAt": "SERVER_TIMESTAMP",
    "updatedAt": "SERVER_TIMESTAMP"
  },
  "expected": "PERMISSION_DENIED"
}
```

### Payload 7: Terminal State Mutation on Completed Booking (Terminal State Bypass)
```json
{
  "collection": "/bookings/completed_book_1",
  "operation": "update",
  "auth": { "uid": "flyer_1", "email": "flyer1@swiss.ch", "email_verified": true },
  "existingStatus": "completed",
  "payload": {
    "status": "cancelled",
    "updatedAt": "SERVER_TIMESTAMP"
  },
  "expected": "PERMISSION_DENIED"
}
```

### Payload 8: Unauthorized Blanket List Scraping on Bookings (Query Enforcer Test)
```json
{
  "collection": "/bookings",
  "operation": "list",
  "auth": { "uid": "random_user", "email": "random@swiss.ch", "email_verified": true },
  "query": "collection('bookings') // without flyerId or pilotId filter matching auth.uid",
  "expected": "PERMISSION_DENIED"
}
```

### Payload 9: Partner Self-Increasing Commission Rate to 90% (Action-Based Update Violation)
```json
{
  "collection": "/qrCampaigns/camp_1",
  "operation": "update",
  "auth": { "uid": "partner_1", "email": "hotel@jungfrau.ch", "email_verified": true },
  "payload": {
    "commissionBps": 9000,
    "updatedAt": "SERVER_TIMESTAMP"
  },
  "expected": "PERMISSION_DENIED"
}
```

### Payload 10: ID Poisoning with Path Traversal / Overlong String (Resource Poisoning)
```json
{
  "collection": "/qrCampaigns/invalid$id!with@special#chars",
  "operation": "create",
  "auth": { "uid": "partner_1", "email": "hotel@jungfrau.ch", "email_verified": true },
  "expected": "PERMISSION_DENIED"
}
```

### Payload 11: Client Timestamp Forgery (Temporal Integrity Violation)
```json
{
  "collection": "/qrCampaigns/camp_2",
  "operation": "create",
  "auth": { "uid": "partner_1", "email": "hotel@jungfrau.ch", "email_verified": true },
  "payload": {
    "createdAt": "2020-01-01T00:00:00Z"
  },
  "expected": "PERMISSION_DENIED"
}
```

### Payload 12: Direct Client Write to `/admins/{adminId}` (Master Gate / Privilege Lock)
```json
{
  "collection": "/admins/attacker_uid",
  "operation": "create",
  "auth": { "uid": "attacker_uid", "email": "attacker@evil.ch", "email_verified": true },
  "payload": {
    "uid": "attacker_uid",
    "createdAt": "SERVER_TIMESTAMP"
  },
  "expected": "PERMISSION_DENIED"
}
```
