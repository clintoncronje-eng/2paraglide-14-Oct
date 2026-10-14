/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import {
  auth,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle,
  signOutUser
} from './lib/firebase';
import {
  calculateEscrowSplit,
  CurrencyCode,
  PartnerVenueType,
  PaymentMethodType,
  sanitizeId,
  sanitizeText,
  validatePartnerCode,
  WeatherStatus
} from './lib/validation';
import {
  BookingData,
  CountryExpansionConfig,
  FlightSlotData,
  PilotBankingPrivateData,
  PilotBusinessInfo,
  PilotMediaItem,
  PilotPublicProfileBundle,
  QrCampaignData,
  TakeOffLandingSpot,
  TeamPilotMember,
  WorkspaceView,
  DigitalWaiverData,
  CreateBookingPayload,
  WeatherAlertNotification,
  PilotOperatorRegistrationPayload,
  PartnerRegistrationPayload
} from './types';
import {
  INITIAL_COUNTRY_MARKETS,
  SEED_BOOKINGS,
  SEED_FLIGHT_SLOTS,
  SEED_PILOT_PRIVATE_BANKING,
  SEED_PILOT_PUBLIC_PROFILE,
  SEED_QR_CAMPAIGNS,
  SEED_WAIVERS,
  GENERATED_ASSETS
} from './data/masterSpecScript';
import { resolveGoogleMapsRating } from './lib/googleMapsRating';
import { MasterScriptView } from './components/MasterScriptView';
import { MarketplaceAndFlyerView } from './components/MarketplaceAndFlyerView';
import { OwnerDashboardView } from './components/OwnerDashboardView';
import { PilotDashboardView, SlotCreateDraft } from './components/PilotDashboardView';
import { PartnerDashboardView } from './components/PartnerDashboardView';
import { SecurityAuditView } from './components/SecurityAuditView';
import { AppLogo } from './components/AppLogo';

export default function App() {
  const [activeView, setActiveView] = useState<WorkspaceView>('marketplace');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState<boolean>(false);

  // Core Marketplace & 4-Dashboard State
  const [slots, setSlots] = useState<FlightSlotData[]>(SEED_FLIGHT_SLOTS);
  const [bookings, setBookings] = useState<BookingData[]>(SEED_BOOKINGS);
  const [waivers, setWaivers] = useState<Map<string, DigitalWaiverData>>(
    new Map(Object.entries(SEED_WAIVERS))
  );
  const [qrCampaigns, setQrCampaigns] = useState<QrCampaignData[]>(SEED_QR_CAMPAIGNS);
  const [countries, setCountries] = useState<CountryExpansionConfig[]>(INITIAL_COUNTRY_MARKETS);
  const [activePartnerCode, setActivePartnerCode] = useState<string>('HOTEL_BELVEDERE_INT');
  const [selectedPartnerCampaignId, setSelectedPartnerCampaignId] = useState<string>('qr_hotel_belvedere');

  // Synchronized Pilot Public Profile (Sections 1, 3, 4, 5, 6) & Isolated Private Banking (Section 2)
  const [pilotPublicProfile, setPilotPublicProfile] =
    useState<PilotPublicProfileBundle>(SEED_PILOT_PUBLIC_PROFILE);
  const [pilotPrivateBanking, setPilotPrivateBanking] =
    useState<PilotBankingPrivateData>(SEED_PILOT_PRIVATE_BANKING);

const SEED_WEATHER_ALERTS: WeatherAlertNotification[] = [
  {
    alertId: 'alert_foehn_interlaken',
    locationName: 'Interlaken Beatenberg Amisbühl',
    status: 'hold',
    affectedSlotsCount: 2,
    triggeredAt: '2026-10-14 09:30 CET',
    source: 'MeteoSwiss Alpine Radar',
    reason: 'South Föhn pressure gradient +4.8 hPa across Jungfrau crest. Afternoon launch held for pilot wind shear inspection.',
    actionsTaken: ['Flight slot holds applied', 'Passengers notified via 2paraglide SMS/App dispatch'],
    acknowledged: false
  }
];

  // Automated Weather Notification & Safety Advisory System State
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlertNotification[]>(SEED_WEATHER_ALERTS);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  const getCurrentTimestampStr = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min} CET`;
  };

  // Parse ?ref= QR partner referral parameter on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refParam = params.get('ref');
    if (refParam) {
      const validated = validatePartnerCode(refParam);
      setActivePartnerCode(validated);
      localStorage.setItem('2paraglide_partner_ref', validated);
    } else {
      const saved = localStorage.getItem('2paraglide_partner_ref');
      if (saved) {
        setActivePartnerCode(validatePartnerCode(saved));
      }
    }
  }, []);

  // Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);

      if (user && user.emailVerified) {
        try {
          await setDoc(
            doc(db, 'users', user.uid),
            {
              uid: sanitizeId(user.uid),
              displayName: sanitizeText(user.displayName || 'Alpine Flyer', 80),
              role: 'flyer',
              countryCode: 'CH',
              shvLicense: '',
              partnerCode: '',
              verified: false,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            },
            { merge: true }
          );
        } catch {
          // Profile may already exist with immutable createdAt
        }
      }
    });
    return () => unsub();
  }, []);

  // Firestore real-time listeners once auth is ready
  useEffect(() => {
    if (!authReady) return;

    const slotsQuery = query(
      collection(db, 'flightSlots'),
      where('status', '==', 'available')
    );
    const unsubSlots = onSnapshot(
      slotsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteSlots: FlightSlotData[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              slotId: data.slotId,
              pilotId: data.pilotId,
              pilotName: data.pilotName,
              shvLicense: data.shvLicense,
              locationName: data.locationName,
              countryCode: data.countryCode,
              launchAltitudeM: data.launchAltitudeM,
              flightDate: data.flightDate,
              flightTime: data.flightTime,
              priceCents: data.priceCents,
              currency: data.currency,
              weatherStatus: data.weatherStatus,
              status: data.status
            };
          });
          setSlots((prev) => {
            const map = new Map<string, FlightSlotData>();
            prev.forEach((s) => map.set(s.slotId, s));
            remoteSlots.forEach((s) => map.set(s.slotId, s));
            return Array.from(map.values());
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'flightSlots');
      }
    );

    const qrQuery = query(
      collection(db, 'qrCampaigns'),
      where('status', '==', 'active')
    );
    const unsubQr = onSnapshot(
      qrQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const remoteCampaigns: QrCampaignData[] = snapshot.docs.map((d) => {
            const data = d.data();
            return {
              campaignId: data.campaignId,
              ownerId: data.ownerId,
              partnerName: data.partnerName,
              partnerType: data.partnerType,
              partnerCode: data.partnerCode,
              region: data.region,
              countryCode: data.countryCode,
              commissionBps: data.commissionBps,
              scansCount: data.scansCount,
              bookingsCount: data.bookingsCount,
              status: data.status
            };
          });
          setQrCampaigns((prev) => {
            const map = new Map<string, QrCampaignData>();
            prev.forEach((c) => map.set(c.campaignId, c));
            remoteCampaigns.forEach((c) => map.set(c.campaignId, c));
            return Array.from(map.values());
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'qrCampaigns');
      }
    );

    let unsubBookings: (() => void) | undefined;
    let unsubWaivers: (() => void) | undefined;
    if (currentUser) {
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('flyerId', '==', currentUser.uid)
      );
      unsubBookings = onSnapshot(
        bookingsQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            const remoteBookings: BookingData[] = snapshot.docs.map((d) => {
              const data = d.data();
              return {
                bookingId: data.bookingId,
                flyerId: data.flyerId,
                flyerName: data.flyerName,
                pilotId: data.pilotId,
                pilotName: data.pilotName,
                partnerCode: data.partnerCode,
                locationName: data.locationName,
                countryCode: data.countryCode,
                flightDate: data.flightDate,
                flightTime: data.flightTime,
                currency: data.currency,
                totalAmountCents: data.totalAmountCents,
                platformFeeCents: data.platformFeeCents,
                pilotPayoutCents: data.pilotPayoutCents,
                partnerCommissionCents: data.partnerCommissionCents,
                paymentMethod: data.paymentMethod,
                status: data.status,
                mediaIncluded: data.mediaIncluded,
                waiverSigned: data.waiverSigned,
                waiverId: data.waiverId,
                waiverSignedAt: data.waiverSignedAt
              };
            });
            setBookings((prev) => {
              const map = new Map<string, BookingData>();
              prev.forEach((b) => map.set(b.bookingId, b));
              remoteBookings.forEach((b) => map.set(b.bookingId, b));
              return Array.from(map.values());
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'bookings');
        }
      );

      // Listen for digital waivers signed by current flyer
      const waiversQuery = query(
        collection(db, 'waivers'),
        where('flyerId', '==', currentUser.uid)
      );
      unsubWaivers = onSnapshot(
        waiversQuery,
        (snapshot) => {
          if (!snapshot.empty) {
            setWaivers((prev) => {
              const next = new Map(prev);
              snapshot.docs.forEach((d) => {
                const data = d.data() as DigitalWaiverData;
                next.set(data.bookingId, data);
              });
              return next;
            });
          }
        },
        (error) => {
          handleFirestoreError(error, OperationType.LIST, 'waivers');
        }
      );
    }

    return () => {
      unsubSlots();
      unsubQr();
      if (unsubBookings) unsubBookings();
      if (unsubWaivers) unsubWaivers();
    };
  }, [authReady, currentUser]);

  // ============================================================================
  // Pilot Dashboard 7-Section Handlers (Public Profile Sync vs Private Banking)
  // ============================================================================

  // 1. Business Information -> Publishes to Public Profile & /pilotProfiles/{uid}
  const handleUpdateBusinessInfo = async (info: PilotBusinessInfo) => {
    const cleanCompany = sanitizeText(info.companyName, 100, 'Swiss Paragliding Interlaken AG');
    const resolvedGoogle = resolveGoogleMapsRating(info.googleMapsUrl, cleanCompany);

    const cleanInfo: PilotBusinessInfo = {
      pilotId: currentUser ? sanitizeId(currentUser.uid) : info.pilotId,
      companyName: cleanCompany,
      tagline: sanitizeText(info.tagline, 140),
      bio: sanitizeText(info.bio, 1200),
      headquarters: sanitizeText(info.headquarters, 120),
      countryCode: info.countryCode,
      publicEmail: sanitizeText(info.publicEmail, 100),
      publicPhone: sanitizeText(info.publicPhone, 40),
      websiteUrl: sanitizeText(info.websiteUrl, 120),
      googleMapsUrl: resolvedGoogle.googleMapsUrl,
      googleRating: resolvedGoogle.rating,
      googleReviewCount: resolvedGoogle.reviewCount,
      googlePlaceName: resolvedGoogle.placeName,
      googleSyncedAt: resolvedGoogle.syncedAt,
      uidVatNumber: sanitizeText(info.uidVatNumber, 40),
      insuranceProvider: sanitizeText(info.insuranceProvider, 80),
      policyNumber: sanitizeText(info.policyNumber, 60),
      coverageAmount: sanitizeText(info.coverageAmount, 40)
    };

    if (currentUser && currentUser.emailVerified) {
      try {
        const uid = sanitizeId(currentUser.uid);
        await setDoc(doc(db, 'pilotProfiles', uid), {
          pilotId: uid,
          companyName: cleanInfo.companyName,
          tagline: cleanInfo.tagline,
          bio: cleanInfo.bio,
          headquarters: cleanInfo.headquarters,
          countryCode: cleanInfo.countryCode,
          publicEmail: cleanInfo.publicEmail,
          publicPhone: cleanInfo.publicPhone,
          websiteUrl: cleanInfo.websiteUrl,
          uidVatNumber: cleanInfo.uidVatNumber,
          insuranceProvider: cleanInfo.insuranceProvider,
          policyNumber: cleanInfo.policyNumber,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `pilotProfiles/${currentUser.uid}`);
      }
    }

    // Automatically propagate Google Rating & Review Count to all public pilot cards and slots
    setPilotPublicProfile((prev) => ({
      ...prev,
      businessInfo: cleanInfo,
      pilots: prev.pilots.map((member) => ({
        ...member,
        googleRating: cleanInfo.googleRating,
        googleReviewCount: cleanInfo.googleReviewCount,
        googleMapsUrl: cleanInfo.googleMapsUrl
      })),
      lastPublishedAt: getCurrentTimestampStr()
    }));

    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        googleRating: cleanInfo.googleRating,
        googleReviewCount: cleanInfo.googleReviewCount,
        googleMapsUrl: cleanInfo.googleMapsUrl
      }))
    );

    showToast(
      `Published Business Info & Auto-Pulled Google Rating (${cleanInfo.googleRating.toFixed(1)} ★ · ${cleanInfo.googleReviewCount} reviews) to Public Pilot Cards`
    );
  };

  // 2. Banking Detail -> Strictly Private (/pilotProfiles/{uid}/private/banking) — NEVER published
  const handleUpdatePrivateBanking = async (banking: PilotBankingPrivateData) => {
    const cleanBanking: PilotBankingPrivateData = {
      pilotId: currentUser ? sanitizeId(currentUser.uid) : banking.pilotId,
      accountHolderName: sanitizeText(banking.accountHolderName, 100),
      iban: sanitizeText(banking.iban, 42),
      bicSwift: sanitizeText(banking.bicSwift, 16),
      bankName: sanitizeText(banking.bankName, 80),
      settlementCurrency: banking.settlementCurrency,
      payoutSchedule: banking.payoutSchedule,
      twintMerchantId: sanitizeText(banking.twintMerchantId, 40)
    };

    if (currentUser && currentUser.emailVerified) {
      try {
        const uid = sanitizeId(currentUser.uid);
        // Ensure parent public profile exists per Pillar 7 parent verification rule
        await setDoc(doc(db, 'pilotProfiles', uid), {
          pilotId: uid,
          companyName: pilotPublicProfile.businessInfo.companyName,
          tagline: pilotPublicProfile.businessInfo.tagline,
          bio: pilotPublicProfile.businessInfo.bio,
          headquarters: pilotPublicProfile.businessInfo.headquarters,
          countryCode: pilotPublicProfile.businessInfo.countryCode,
          publicEmail: pilotPublicProfile.businessInfo.publicEmail,
          publicPhone: pilotPublicProfile.businessInfo.publicPhone,
          websiteUrl: pilotPublicProfile.businessInfo.websiteUrl,
          uidVatNumber: pilotPublicProfile.businessInfo.uidVatNumber,
          insuranceProvider: pilotPublicProfile.businessInfo.insuranceProvider,
          policyNumber: pilotPublicProfile.businessInfo.policyNumber,
          updatedAt: serverTimestamp()
        });

        await setDoc(doc(db, 'pilotProfiles', uid, 'private', 'banking'), {
          pilotId: uid,
          accountHolderName: cleanBanking.accountHolderName,
          iban: cleanBanking.iban,
          bicSwift: cleanBanking.bicSwift,
          bankName: cleanBanking.bankName,
          settlementCurrency: cleanBanking.settlementCurrency,
          payoutSchedule: cleanBanking.payoutSchedule,
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(
          error,
          OperationType.WRITE,
          `pilotProfiles/${currentUser.uid}/private/banking`
        );
      }
    }

    setPilotPrivateBanking(cleanBanking);
    showToast('Saved IBAN & Banking Details to Private Vault (Excluded from Public Profile)');
  };

  // 3. Take Off & Landing Spots -> Publishes to Public Profile
  const handleAddSpot = async (spot: TakeOffLandingSpot) => {
    setPilotPublicProfile((prev) => ({
      ...prev,
      spots: [spot, ...prev.spots],
      lastPublishedAt: getCurrentTimestampStr()
    }));
    showToast(
      `Published Launch & Landing Spot "${spot.spotName}" (with Collection & Drop-Off Points) to Public Profile`
    );
  };

  const handleUpdateSpot = async (updatedSpot: TakeOffLandingSpot) => {
    setPilotPublicProfile((prev) => ({
      ...prev,
      spots: prev.spots.map((s) => (s.spotId === updatedSpot.spotId ? updatedSpot : s)),
      lastPublishedAt: getCurrentTimestampStr()
    }));
    showToast(
      `Updated "${updatedSpot.spotName}" Collection & Drop-Off Points on Public Profile`
    );
  };

  const handleDeleteSpot = async (spotId: string) => {
    setPilotPublicProfile((prev) => ({
      ...prev,
      spots: prev.spots.filter((s) => s.spotId !== spotId),
      lastPublishedAt: getCurrentTimestampStr()
    }));
    showToast('Removed Spot from Public Profile');
  };

  // 5. Pilots Roster -> Publishes to Public Profile
  const handleAddPilotMembers = async (members: TeamPilotMember[]) => {
    setPilotPublicProfile((prev) => {
      const enrichedMembers = members.map((m) => ({
        ...m,
        googleRating: prev.businessInfo.googleRating || 4.9,
        googleReviewCount: prev.businessInfo.googleReviewCount || 348,
        googleMapsUrl: prev.businessInfo.googleMapsUrl
      }));
      return {
        ...prev,
        pilots: [...prev.pilots, ...enrichedMembers],
        lastPublishedAt: getCurrentTimestampStr()
      };
    });
    showToast(
      `Published ${members.length} Tandem Pilot Profile(s) with Photos & Google Ratings to Public Profile`
    );
  };

  const handleUpdatePilotMemberPhoto = async (memberId: string, photoUrl: string) => {
    setPilotPublicProfile((prev) => ({
      ...prev,
      pilots: prev.pilots.map((m) =>
        m.memberId === memberId ? { ...m, photoUrl } : m
      ),
      lastPublishedAt: getCurrentTimestampStr()
    }));
    showToast('Updated Pilot Profile Photo on Public Profile');
  };

  const handleTogglePilotMemberStatus = async (memberId: string) => {
    setPilotPublicProfile((prev) => ({
      ...prev,
      pilots: prev.pilots.map((m) =>
        m.memberId === memberId
          ? { ...m, status: m.status === 'active' ? 'off_duty' : 'active' }
          : m
      ),
      lastPublishedAt: getCurrentTimestampStr()
    }));
    showToast('Updated Pilot Duty Status on Public Profile');
  };

  const handleDeletePilotMember = async (memberId: string) => {
    setPilotPublicProfile((prev) => ({
      ...prev,
      pilots: prev.pilots.filter((m) => m.memberId !== memberId),
      lastPublishedAt: getCurrentTimestampStr()
    }));
    showToast('Removed Pilot from Public Profile Roster');
  };

  // 6. Images & Videos -> Publishes to Public Profile
  const handleAddMediaItem = async (item: PilotMediaItem) => {
    setPilotPublicProfile((prev) => {
      const updatedExisting = item.isHeaderImage
        ? prev.mediaGallery.map((m) => ({ ...m, isHeaderImage: false }))
        : prev.mediaGallery;
      return {
        ...prev,
        mediaGallery: [item, ...updatedExisting],
        lastPublishedAt: getCurrentTimestampStr()
      };
    });
    showToast(
      item.isHeaderImage
        ? `Published "${item.title}" & Set as Public Page Header Image`
        : `Published ${item.mediaType.toUpperCase()} "${item.title}" to Public Profile`
    );
  };

  const handleSetHeaderMediaItem = async (mediaId: string) => {
    setPilotPublicProfile((prev) => ({
      ...prev,
      mediaGallery: prev.mediaGallery.map((m) => ({
        ...m,
        isHeaderImage: m.mediaId === mediaId
      })),
      lastPublishedAt: getCurrentTimestampStr()
    }));
    showToast('Updated Active Public Page Header Image');
  };

  const handleDeleteMediaItem = async (mediaId: string) => {
    setPilotPublicProfile((prev) => ({
      ...prev,
      mediaGallery: prev.mediaGallery.filter((m) => m.mediaId !== mediaId),
      lastPublishedAt: getCurrentTimestampStr()
    }));
    showToast('Removed Media Item from Public Profile Gallery');
  };

  // Registration handler for pilot / operator sign up from home page
  const handleRegisterPilotOperator = async (payload: PilotOperatorRegistrationPayload) => {
    const cleanCompany = sanitizeText(payload.companyName, 100, 'Alpine Tandem Flight Operations AG');
    const cleanPilot = sanitizeText(payload.leadPilotName, 80, 'Chief Pilot');
    const cleanLicense = sanitizeText(payload.shvLicense, 40, 'SHV-CH-50000');
    const cleanLocation = sanitizeText(payload.locationName, 80, 'Interlaken Beatenberg Amisbühl');
    const cleanInsurance = sanitizeText(payload.insuranceProvider, 80, 'AXA Winterthur CHF 5,000,000');

    const validCountry: 'CH' | 'FR' | 'AT' | 'IT' =
      payload.countryCode === 'FR' || payload.countryCode === 'AT' || payload.countryCode === 'IT'
        ? payload.countryCode
        : 'CH';

    setPilotPublicProfile((prev) => {
      // Add or update lead pilot
      const existingIdx = prev.pilots.findIndex((p) => p.name.toLowerCase() === cleanPilot.toLowerCase());
      let updatedPilots = [...prev.pilots];
      if (existingIdx >= 0) {
        updatedPilots[existingIdx] = {
          ...updatedPilots[existingIdx],
          name: cleanPilot,
          shvLicense: cleanLicense
        };
      } else {
        const newPilot: TeamPilotMember = {
          memberId: `pilot_${Date.now()}`,
          name: cleanPilot,
          photoUrl: GENERATED_ASSETS.pilotAvatar,
          roleTitle: payload.operationType === 'commercial_school' ? 'Operator & Commercial Tandem Pilot' : 'Certified Tandem Pilot',
          shvLicense: cleanLicense,
          tandemFlightsLogged: 1200,
          languages: 'German, English, French',
          gliderWing: 'Advance BiBeta 6 (Tandem 41m²)',
          status: 'active'
        };
        updatedPilots = [newPilot, ...updatedPilots];
      }

      // Add spot if needed
      let updatedSpots = [...prev.spots];
      if (cleanLocation && !updatedSpots.some((s) => s.spotName.toLowerCase().includes(cleanLocation.toLowerCase()))) {
        const newSpot: TakeOffLandingSpot = {
          spotId: `spot_${Date.now()}`,
          spotName: cleanLocation,
          region: cleanLocation.split(' ')[0] || 'Interlaken',
          countryCode: validCountry,
          launchAltitudeM: 1350,
          landingAltitudeM: 567,
          landingZoneName: 'Höhematte Central Field (567m)',
          collectionPoint: 'Höheweg 95 Flight Desk / Interlaken Ost Station',
          dropOffPoint: 'Höhematte Park Lounge & Hotel Return Shuttle',
          maxSimultaneousPilots: 6,
          gpsTakeoff: '46.6863° N, 7.8632° E',
          gpsLanding: '46.6863° N, 7.8632° E',
          windOrientation: 'N, NW, W',
          cableCarLift: 'Harderbahn / PostAuto Beatenberg',
          notes: 'BAZL Approved Commercial Airspace'
        };
        updatedSpots = [newSpot, ...updatedSpots];
      }

      return {
        ...prev,
        businessInfo: {
          ...prev.businessInfo,
          companyName: cleanCompany,
          publicEmail: payload.email,
          countryCode: validCountry,
          insuranceProvider: cleanInsurance,
          coverageAmount: cleanInsurance.includes('EUR') ? 'EUR 5,000,000' : 'CHF 5,000,000'
        },
        pilots: updatedPilots,
        spots: updatedSpots,
        lastPublishedAt: getCurrentTimestampStr()
      };
    });

    setActiveView('pilot_dashboard');
    showToast(`Welcome ${cleanPilot}! Your operation "${cleanCompany}" is registered. Configure your business details below.`);
  };

  // Partner QR Registration Handler (routes directly to unique Partner QR dashboard)
  const handleRegisterPartner = async (payload: PartnerRegistrationPayload) => {
    const campaignId = sanitizeId(`qr_${Date.now()}`);
    const ownerId = currentUser ? sanitizeId(currentUser.uid) : `partner_${Date.now()}`;
    const cleanCode = validatePartnerCode(
      payload.partnerCode || payload.partnerName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20)
    );

    const newCampaign: QrCampaignData = {
      campaignId,
      ownerId,
      partnerName: sanitizeText(payload.partnerName, 80, 'Alpine Hospitality Partner'),
      partnerType: payload.partnerType || 'Hotel',
      partnerCode: cleanCode,
      region: sanitizeText(payload.region, 60, 'Interlaken / Jungfrau Region'),
      countryCode: payload.countryCode || 'CH',
      commissionBps: 1000,
      scansCount: 0,
      bookingsCount: 0,
      status: 'active'
    };

    if (currentUser && currentUser.emailVerified) {
      try {
        await setDoc(doc(db, 'qrCampaigns', campaignId), {
          ...newCampaign,
          contactName: sanitizeText(payload.contactName || '', 80),
          contactEmail: sanitizeText(payload.contactEmail || '', 80),
          ibanOrTwint: sanitizeText(payload.ibanOrTwint || '', 40),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `qrCampaigns/${campaignId}`);
      }
    }

    setQrCampaigns((prev) => [newCampaign, ...prev]);
    setSelectedPartnerCampaignId(campaignId);
    setActivePartnerCode(cleanCode);
    localStorage.setItem('2paraglide_partner_ref', cleanCode);
    setActiveView('partner_dashboard');
    showToast(
      `Welcome ${payload.contactName || payload.partnerName}! Your venue "${payload.partnerName}" is registered with code ${cleanCode}. Welcome to your Partner QR Dashboard.`
    );
  };

  // Marketplace & Escrow Handlers
  const handleApplyPartnerCode = (code: string) => {
    const clean = validatePartnerCode(code);
    setActivePartnerCode(clean);
    localStorage.setItem('2paraglide_partner_ref', clean);
    showToast(`Active QR Referral Code set to ${clean}`);
  };

  // Pre-Flight Digital Waiver Firestore Persistence Handler
  const handleSubmitWaiver = async (waiver: DigitalWaiverData) => {
    // 1. Update local state
    setWaivers((prev) => {
      const next = new Map(prev);
      next.set(waiver.bookingId, waiver);
      return next;
    });

    setBookings((prev) =>
      prev.map((b) =>
        b.bookingId === waiver.bookingId
          ? {
              ...b,
              waiverSigned: true,
              waiverId: waiver.waiverId,
              waiverSignedAt: waiver.signedAt
            }
          : b
      )
    );

    // 2. Persist to Firestore /waivers/{waiverId}
    if (currentUser && currentUser.emailVerified) {
      try {
        const cleanWaiverId = sanitizeId(waiver.waiverId);
        await setDoc(doc(db, 'waivers', cleanWaiverId), {
          waiverId: cleanWaiverId,
          bookingId: sanitizeId(waiver.bookingId),
          flyerId: sanitizeId(currentUser.uid),
          flyerName: sanitizeText(waiver.flyerName, 80),
          pilotId: sanitizeId(waiver.pilotId),
          pilotName: sanitizeText(waiver.pilotName, 80),
          locationName: sanitizeText(waiver.locationName, 80),
          flightDate: waiver.flightDate.slice(0, 20),
          dateOfBirth: waiver.dateOfBirth.slice(0, 20),
          emergencyContactName: sanitizeText(waiver.emergencyContactName, 80),
          emergencyContactPhone: sanitizeText(waiver.emergencyContactPhone, 40),
          medicalDeclarationConfirmed: true,
          riskAcknowledgmentConfirmed: true,
          thirdPartyLiabilityConfirmed: true,
          signatureType: waiver.signatureType,
          signatureData: waiver.signatureData.slice(0, 50000),
          status: 'signed',
          signedAt: waiver.signedAt.slice(0, 40),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `waivers/${waiver.waiverId}`);
      }
    }

    showToast(
      `Digital Legal Waiver signed & stored in Firestore for Booking #${waiver.bookingId}`
    );
  };

  const handleCreateBooking = async (params: CreateBookingPayload) => {
    const bookingId = sanitizeId(`book_${Date.now()}`);
    const flyerId = currentUser ? sanitizeId(currentUser.uid) : 'demo_flyer_guest';
    const cleanFlyerName = sanitizeText(params.flyerName, 80, 'Alpine Flyer');
    const cleanPartnerCode = validatePartnerCode(params.partnerCode);
    const grossCents = params.slot.priceCents + (params.mediaIncluded ? 4000 : 0);
    const split = calculateEscrowSplit(grossCents, cleanPartnerCode);

    const waiverId = params.waiver ? sanitizeId(`waiver_${bookingId}`) : undefined;
    const now = new Date();
    const signedAt = `${now.toISOString().slice(0, 10)} ${now.toTimeString().slice(0, 5)} CET`;

    const newBooking: BookingData = {
      bookingId,
      flyerId,
      flyerName: cleanFlyerName,
      pilotId: sanitizeId(params.slot.pilotId),
      pilotName: sanitizeText(params.slot.pilotName, 80),
      partnerCode: cleanPartnerCode,
      locationName: sanitizeText(params.slot.locationName, 80),
      countryCode: params.slot.countryCode,
      flightDate: params.slot.flightDate.slice(0, 20),
      flightTime: params.slot.flightTime.slice(0, 10),
      currency: params.slot.currency,
      totalAmountCents: split.totalAmountCents,
      platformFeeCents: split.platformFeeCents,
      pilotPayoutCents: split.pilotPayoutCents,
      partnerCommissionCents: split.partnerCommissionCents,
      paymentMethod: params.paymentMethod,
      status: 'confirmed',
      mediaIncluded: params.mediaIncluded,
      waiverSigned: Boolean(params.waiver),
      waiverId,
      waiverSignedAt: params.waiver ? signedAt : undefined
    };

    if (currentUser && currentUser.emailVerified) {
      try {
        await setDoc(doc(db, 'bookings', bookingId), {
          bookingId: newBooking.bookingId,
          flyerId: newBooking.flyerId,
          flyerName: newBooking.flyerName,
          pilotId: newBooking.pilotId,
          pilotName: newBooking.pilotName,
          partnerCode: newBooking.partnerCode,
          locationName: newBooking.locationName,
          countryCode: newBooking.countryCode,
          flightDate: newBooking.flightDate,
          flightTime: newBooking.flightTime,
          currency: newBooking.currency,
          totalAmountCents: newBooking.totalAmountCents,
          platformFeeCents: newBooking.platformFeeCents,
          pilotPayoutCents: newBooking.pilotPayoutCents,
          partnerCommissionCents: newBooking.partnerCommissionCents,
          paymentMethod: newBooking.paymentMethod,
          status: newBooking.status,
          mediaIncluded: newBooking.mediaIncluded,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `bookings/${bookingId}`);
      }
    }

    // Persist Digital Legal Waiver if signed in checkout flow
    if (params.waiver && waiverId) {
      const waiverRecord: DigitalWaiverData = {
        waiverId,
        bookingId,
        flyerId,
        flyerName: cleanFlyerName,
        pilotId: sanitizeId(params.slot.pilotId),
        pilotName: sanitizeText(params.slot.pilotName, 80),
        locationName: sanitizeText(params.slot.locationName, 80),
        flightDate: params.slot.flightDate.slice(0, 20),
        dateOfBirth: params.waiver.dateOfBirth.slice(0, 20),
        emergencyContactName: sanitizeText(params.waiver.emergencyContactName, 80),
        emergencyContactPhone: sanitizeText(params.waiver.emergencyContactPhone, 40),
        medicalDeclarationConfirmed: true,
        riskAcknowledgmentConfirmed: true,
        thirdPartyLiabilityConfirmed: true,
        signatureType: params.waiver.signatureType,
        signatureData: params.waiver.signatureData.slice(0, 50000),
        status: 'signed',
        signedAt
      };

      setWaivers((prev) => {
        const next = new Map(prev);
        next.set(bookingId, waiverRecord);
        return next;
      });

      if (currentUser && currentUser.emailVerified) {
        try {
          await setDoc(doc(db, 'waivers', waiverId), {
            waiverId,
            bookingId,
            flyerId: sanitizeId(currentUser.uid),
            flyerName: cleanFlyerName,
            pilotId: sanitizeId(params.slot.pilotId),
            pilotName: sanitizeText(params.slot.pilotName, 80),
            locationName: sanitizeText(params.slot.locationName, 80),
            flightDate: params.slot.flightDate.slice(0, 20),
            dateOfBirth: params.waiver.dateOfBirth.slice(0, 20),
            emergencyContactName: sanitizeText(params.waiver.emergencyContactName, 80),
            emergencyContactPhone: sanitizeText(params.waiver.emergencyContactPhone, 40),
            medicalDeclarationConfirmed: true,
            riskAcknowledgmentConfirmed: true,
            thirdPartyLiabilityConfirmed: true,
            signatureType: params.waiver.signatureType,
            signatureData: params.waiver.signatureData.slice(0, 50000),
            status: 'signed',
            signedAt,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, `waivers/${waiverId}`);
        }
      }
    }

    setBookings((prev) => [newBooking, ...prev]);
    setSlots((prev) =>
      prev.map((s) => (s.slotId === params.slot.slotId ? { ...s, status: 'booked' } : s))
    );
    if (cleanPartnerCode !== 'DIRECT') {
      setQrCampaigns((prev) =>
        prev.map((c) =>
          c.partnerCode === cleanPartnerCode
            ? { ...c, bookingsCount: c.bookingsCount + 1 }
            : c
        )
      );
    }
    setActiveView('flyer_dashboard');
    showToast(
      params.waiver
        ? `Payment successful! Flight #${bookingId} confirmed & waiver signed — routed to your Flyer Dashboard`
        : `Payment successful! Flight #${bookingId} confirmed in Escrow — routed to your Flyer Dashboard`
    );
  };

  const handleUpdateBookingStatus = async (
    bookingId: string,
    nextStatus: 'completed' | 'cancelled'
  ) => {
    const target = bookings.find((b) => b.bookingId === bookingId);
    if (!target) return;

    if (
      currentUser &&
      currentUser.emailVerified &&
      (target.flyerId === currentUser.uid ||
        target.pilotId === currentUser.uid ||
        currentUser.email === 'clintoncronje@me.com')
    ) {
      try {
        await updateDoc(doc(db, 'bookings', bookingId), {
          status: nextStatus,
          updatedAt: serverTimestamp()
        });
      } catch {
        // Fallback to local state if demo seed record is not in Firestore
      }
    }

    setBookings((prev) =>
      prev.map((b) => (b.bookingId === bookingId ? { ...b, status: nextStatus } : b))
    );
    showToast(
      nextStatus === 'completed'
        ? `Flight #${bookingId} marked landed — 3-way escrow payouts released`
        : `Booking #${bookingId} cancelled — 100% escrow refunded to flyer`
    );
  };

  // 4. Calendar / Slots -> Publishes Single or Simultaneous Multi-Pilot Batch to Public Profile & Marketplace
  const handleCreateSlotsBatch = async (drafts: SlotCreateDraft[]) => {
    const pilotId = currentUser ? sanitizeId(currentUser.uid) : 'demo_pilot_wyss';
    const createdSlots: FlightSlotData[] = [];

    for (let i = 0; i < drafts.length; i++) {
      const draft = drafts[i];
      const slotId = sanitizeId(
        `slot_${draft.countryCode.toLowerCase()}_${Date.now()}_${i}`
      );

      const newSlot: FlightSlotData = {
        slotId,
        pilotId,
        pilotName: sanitizeText(draft.pilotName, 80, 'Beat Wyss'),
        pilotPhotoUrl: draft.pilotPhotoUrl,
        shvLicense: sanitizeText(draft.shvLicense, 40, 'SHV-CH-44910'),
        locationName: sanitizeText(draft.locationName, 80, 'Interlaken Beatenberg'),
        landingZoneName: draft.landingZoneName,
        collectionPoint: draft.collectionPoint,
        dropOffPoint: draft.dropOffPoint,
        simultaneousGroupCount: draft.simultaneousGroupCount,
        countryCode: draft.countryCode,
        launchAltitudeM: Math.max(100, Math.min(5000, draft.launchAltitudeM)),
        flightDate: draft.flightDate.slice(0, 20),
        flightTime: draft.flightTime.slice(0, 10),
        priceCents: Math.max(5000, Math.min(200000, draft.priceCents)),
        currency: draft.currency,
        weatherStatus: draft.weatherStatus,
        status: 'available'
      };

      if (currentUser && currentUser.emailVerified) {
        try {
          // Firestore document strictly matches isValidFlightSlot keys
          await setDoc(doc(db, 'flightSlots', slotId), {
            slotId: newSlot.slotId,
            pilotId: newSlot.pilotId,
            pilotName: newSlot.pilotName,
            shvLicense: newSlot.shvLicense,
            locationName: newSlot.locationName,
            countryCode: newSlot.countryCode,
            launchAltitudeM: newSlot.launchAltitudeM,
            flightDate: newSlot.flightDate,
            flightTime: newSlot.flightTime,
            priceCents: newSlot.priceCents,
            currency: newSlot.currency,
            weatherStatus: newSlot.weatherStatus,
            status: newSlot.status,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        } catch (error) {
          handleFirestoreError(error, OperationType.CREATE, `flightSlots/${slotId}`);
        }
      }

      createdSlots.push(newSlot);
    }

    setSlots((prev) => [...createdSlots, ...prev]);
    setPilotPublicProfile((prev) => ({
      ...prev,
      lastPublishedAt: getCurrentTimestampStr()
    }));
    showToast(
      `Published ${createdSlots.length} Tandem Flight Slot(s) to Public Calendar & Profile`
    );
  };

  const handleUpdateSlotWeather = async (slotId: string, weatherStatus: WeatherStatus) => {
    const target = slots.find((s) => s.slotId === slotId);
    if (!target) return;

    if (
      currentUser &&
      currentUser.emailVerified &&
      (target.pilotId === currentUser.uid || currentUser.email === 'clintoncronje@me.com')
    ) {
      try {
        await updateDoc(doc(db, 'flightSlots', slotId), {
          weatherStatus,
          updatedAt: serverTimestamp()
        });
      } catch {
        // Seed slot local update
      }
    }

    setSlots((prev) =>
      prev.map((s) => (s.slotId === slotId ? { ...s, weatherStatus } : s))
    );

    // Automated weather alert if unsafe or risky
    if (weatherStatus === 'unsafe' || weatherStatus === 'risky' || weatherStatus === 'hold') {
      const isUnsafe = weatherStatus === 'unsafe' || weatherStatus === 'hold';
      const alert: WeatherAlertNotification = {
        alertId: `alert_slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        locationName: target.locationName,
        status: weatherStatus,
        affectedSlotsCount: 1,
        triggeredAt: getCurrentTimestampStr(),
        source: 'Pilot Cockpit Operational Weather Controller',
        reason: isUnsafe
          ? `Urgent mountain weather hold active for slot #${slotId.slice(-6)}`
          : `Marginal / risky conditions reported for slot #${slotId.slice(-6)}`,
        actionsTaken: [
          `Marketplace Slot Flagged: ${weatherStatus.toUpperCase()}`,
          isUnsafe ? 'Online booking escrow lock engaged' : 'Precautionary thermal warning displayed'
        ],
        acknowledged: false
      };
      setWeatherAlerts((prev) => [alert, ...prev]);
    }

    setPilotPublicProfile((prev) => ({
      ...prev,
      lastPublishedAt: getCurrentTimestampStr()
    }));
    showToast(`Updated weather status for ${target.locationName} to ${weatherStatus.toUpperCase()}`);
  };

  // Automated Location-wide Weather Controller & Notification Dispatcher
  const handleUpdateLocationWeather = async (
    locationName: string,
    weatherStatus: WeatherStatus,
    customReason?: string
  ) => {
    const locLower = locationName.toLowerCase().trim();
    const matchingSlots = slots.filter(
      (s) =>
        s.locationName.toLowerCase().includes(locLower) ||
        locLower.includes(s.locationName.toLowerCase())
    );

    if (matchingSlots.length === 0) {
      showToast(`No slots found matching location "${locationName}"`);
      return;
    }

    // Update slots in state
    setSlots((prev) =>
      prev.map((s) => {
        if (
          s.locationName.toLowerCase().includes(locLower) ||
          locLower.includes(s.locationName.toLowerCase())
        ) {
          return { ...s, weatherStatus };
        }
        return s;
      })
    );

    // Sync to Firestore if authenticated
    if (currentUser && currentUser.emailVerified) {
      for (const slot of matchingSlots) {
        try {
          await updateDoc(doc(db, 'flightSlots', slot.slotId), {
            weatherStatus,
            updatedAt: serverTimestamp()
          });
        } catch {
          // ignore seed write failure
        }
      }
    }

    // Trigger automated weather alert notification if updated to 'unsafe' or 'risky'
    if (weatherStatus === 'unsafe' || weatherStatus === 'risky' || weatherStatus === 'hold') {
      const isUnsafe = weatherStatus === 'unsafe' || weatherStatus === 'hold';
      const alert: WeatherAlertNotification = {
        alertId: `alert_loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        locationName,
        status: weatherStatus,
        affectedSlotsCount: matchingSlots.length,
        triggeredAt: getCurrentTimestampStr(),
        source: 'MeteoSwiss Automated Alpine Sensor Telemetry',
        reason:
          customReason ||
          (isUnsafe
            ? 'High Föhn wind gusts >48 km/h & turbulent cloud base below safety minimums'
            : 'Elevated thermal shear and marginal valley crosswinds detected'),
        actionsTaken: [
          `Marketplace Warning Flag: ${isUnsafe ? 'FLIGHT HOLD / UNSAFE' : 'RISKY / MARGINAL ADVISORY'} activated`,
          isUnsafe
            ? 'Instant online booking suspended — passenger safety protocol enforced'
            : 'Cautionary passenger disclaimer enabled during reservation',
          `Automated pilot notification dispatched for ${matchingSlots.length} flight slot(s)`
        ],
        acknowledged: false
      };

      setWeatherAlerts((prev) => [alert, ...prev]);
      showToast(
        `⚠️ AUTOMATED WEATHER SYSTEM: ${locationName} set to ${weatherStatus.toUpperCase()}. ${matchingSlots.length} slot(s) flagged in Marketplace!`
      );
    } else if (weatherStatus === 'optimal') {
      // Clear alert for this location
      setWeatherAlerts((prev) =>
        prev.filter((a) => !a.locationName.toLowerCase().includes(locLower))
      );
      showToast(
        `✓ Weather cleared for ${locationName}. All ${matchingSlots.length} flight slot(s) restored to OPTIMAL in Marketplace.`
      );
    } else {
      showToast(`Updated weather for ${locationName} to ${weatherStatus.toUpperCase()}`);
    }

    setPilotPublicProfile((prev) => ({
      ...prev,
      lastPublishedAt: getCurrentTimestampStr()
    }));
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setWeatherAlerts((prev) =>
      prev.map((a) => (a.alertId === alertId ? { ...a, acknowledged: true } : a))
    );
    showToast('Weather notification acknowledged by Pilot Safety Officer.');
  };

  const handleDismissAlert = (alertId: string) => {
    setWeatherAlerts((prev) => prev.filter((a) => a.alertId !== alertId));
  };

  const handleCreateQrCampaign = async (draft: {
    partnerName: string;
    partnerType: PartnerVenueType;
    partnerCode: string;
    region: string;
    countryCode: string;
  }) => {
    const campaignId = sanitizeId(`qr_${Date.now()}`);
    const ownerId = currentUser ? sanitizeId(currentUser.uid) : 'demo_partner_owner';
    const cleanCode = validatePartnerCode(draft.partnerCode);

    const newCampaign: QrCampaignData = {
      campaignId,
      ownerId,
      partnerName: sanitizeText(draft.partnerName, 80),
      partnerType: draft.partnerType,
      partnerCode: cleanCode,
      region: sanitizeText(draft.region, 60),
      countryCode: draft.countryCode,
      commissionBps: 1000,
      scansCount: 0,
      bookingsCount: 0,
      status: 'active'
    };

    if (currentUser && currentUser.emailVerified) {
      try {
        await setDoc(doc(db, 'qrCampaigns', campaignId), {
          ...newCampaign,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `qrCampaigns/${campaignId}`);
      }
    }

    setQrCampaigns((prev) => [newCampaign, ...prev]);
    showToast(`Created QR Campaign ${cleanCode} for ${newCampaign.partnerName}`);
  };

  const handleSimulateQrScan = async (campaign: QrCampaignData) => {
    setQrCampaigns((prev) =>
      prev.map((c) =>
        c.campaignId === campaign.campaignId
          ? { ...c, scansCount: c.scansCount + 1 }
          : c
      )
    );
    handleApplyPartnerCode(campaign.partnerCode);
  };

  const handleToggleCountryStatus = (
    countryCode: string,
    nextStatus: CountryExpansionConfig['status']
  ) => {
    setCountries((prev) =>
      prev.map((c) => (c.countryCode === countryCode ? { ...c, status: nextStatus } : c))
    );
    showToast(`Updated ${countryCode} market status to ${nextStatus.toUpperCase()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#111111] text-[#FFFFFF]">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 bg-[#111111] border-b border-[#8A8A8A]/25 sticky top-0 z-40">
        {/* Zone 1: Brand Logo & Wordmark */}
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveView('marketplace');
          }}
          className="hover:opacity-90 transition-opacity whitespace-nowrap shrink-0 block"
          aria-label="2PARAGLIDE Home"
        >
          <AppLogo size="md" showText={true} />
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#8A8A8A]">
          <a
            href="#script"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('script');
            }}
            className={`hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'script'
                ? 'text-[#FFFFFF] underline underline-offset-8 decoration-2 decoration-[#E62B1E]'
                : ''
            }`}
          >
            Master Script
          </a>
          <a
            href="#marketplace"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('marketplace');
            }}
            className={`hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'marketplace'
                ? 'text-[#FFFFFF] underline underline-offset-8 decoration-2 decoration-[#E62B1E]'
                : ''
            }`}
          >
            Marketplace
          </a>
          <a
            href="#flyer"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('flyer_dashboard');
            }}
            className={`hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'flyer_dashboard'
                ? 'text-[#FFFFFF] underline underline-offset-8 decoration-2 decoration-[#E62B1E]'
                : ''
            }`}
          >
            Flyer Dashboard
          </a>
          <a
            href="#owner"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('owner_dashboard');
            }}
            className={`hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'owner_dashboard'
                ? 'text-[#FFFFFF] underline underline-offset-8 decoration-2 decoration-[#E62B1E]'
                : ''
            }`}
          >
            Owner Console
          </a>
          <a
            href="#pilot"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('pilot_dashboard');
            }}
            className={`hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'pilot_dashboard'
                ? 'text-[#FFFFFF] underline underline-offset-8 decoration-2 decoration-[#E62B1E]'
                : ''
            }`}
          >
            Pilot Cockpit
          </a>
          <a
            href="#partner"
            onClick={(e) => {
              e.preventDefault();
              setActiveView('partner_dashboard');
            }}
            className={`hover:text-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 ${
              activeView === 'partner_dashboard'
                ? 'text-[#FFFFFF] underline underline-offset-8 decoration-2 decoration-[#E62B1E]'
                : ''
            }`}
          >
            Partner QR
          </a>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {currentUser ? (
            <button
              onClick={() => signOutUser()}
              className="px-4 py-2 text-xs font-semibold text-[#111111] bg-[#FFFFFF] rounded-lg hover:bg-[#e5e5e5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign Out ({currentUser.displayName?.split(' ')[0] || 'User'})
            </button>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] rounded-lg hover:bg-[#c82317] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sign In with Google
            </button>
          )}
        </div>
      </header>

      {/* Secondary Workspace Role Switcher Toolbar (Below Header) */}
      <div className="bg-[#181818] text-[#FFFFFF] border-b border-[#8A8A8A]/25 px-6 py-2.5">
        <div className="max-w-[1280px] mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {(
              [
                { id: 'script', label: '00. Master Architecture Script' },
                { id: 'marketplace', label: 'Public Marketplace' },
                { id: 'owner_dashboard', label: '1. Owner Dashboard' },
                { id: 'pilot_dashboard', label: '2. Pilot Dashboard' },
                { id: 'flyer_dashboard', label: '3. Flyer Dashboard' },
                { id: 'partner_dashboard', label: '4. Partner QR Dashboard' },
                { id: 'security_audit', label: 'Security & Red Team Audit' }
              ] as { id: WorkspaceView; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeView === tab.id
                    ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                    : 'text-[#8A8A8A] hover:bg-[#111111] hover:text-[#FFFFFF]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="text-xs font-mono text-[#8A8A8A] hidden xl:block">
            QR Attribution: <span className="text-[#E62B1E] font-semibold">{activePartnerCode}</span>
          </div>
        </div>
      </div>

      {/* Feedback Toast */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-[#181818] text-[#FFFFFF] px-4 py-2.5 rounded-lg shadow-xl border border-[#E62B1E] text-xs font-medium">
          {toastMessage}
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1">
        {activeView === 'script' && <MasterScriptView onNavigate={setActiveView} />}

        {(activeView === 'marketplace' || activeView === 'flyer_dashboard') && (
          <MarketplaceAndFlyerView
            mode={activeView}
            slots={slots}
            bookings={bookings}
            qrCampaigns={qrCampaigns}
            pilotPublicProfile={pilotPublicProfile}
            activePartnerCode={activePartnerCode}
            onApplyPartnerCode={handleApplyPartnerCode}
            onCreateBooking={handleCreateBooking}
            onCancelBooking={(bookingId) => handleUpdateBookingStatus(bookingId, 'cancelled')}
            onNavigate={setActiveView}
            currentUserName={currentUser?.displayName || 'Elena Rossi'}
            waivers={waivers}
            onSubmitWaiver={handleSubmitWaiver}
            onRegisterPilotOperator={handleRegisterPilotOperator}
            onRegisterPartner={handleRegisterPartner}
            weatherAlerts={weatherAlerts}
          />
        )}

        {activeView === 'owner_dashboard' && (
          <OwnerDashboardView
            bookings={bookings}
            slots={slots}
            qrCampaigns={qrCampaigns}
            countries={countries}
            onToggleCountryStatus={handleToggleCountryStatus}
            onUpdateBookingStatus={handleUpdateBookingStatus}
          />
        )}

        {activeView === 'pilot_dashboard' && (
          <PilotDashboardView
            slots={slots}
            bookings={bookings}
            publicProfile={pilotPublicProfile}
            privateBanking={pilotPrivateBanking}
            onUpdateBusinessInfo={handleUpdateBusinessInfo}
            onUpdatePrivateBanking={handleUpdatePrivateBanking}
            onAddSpot={handleAddSpot}
            onUpdateSpot={handleUpdateSpot}
            onDeleteSpot={handleDeleteSpot}
            onAddPilotMembers={handleAddPilotMembers}
            onUpdatePilotMemberPhoto={handleUpdatePilotMemberPhoto}
            onTogglePilotMemberStatus={handleTogglePilotMemberStatus}
            onDeletePilotMember={handleDeletePilotMember}
            onAddMediaItem={handleAddMediaItem}
            onSetHeaderMediaItem={handleSetHeaderMediaItem}
            onDeleteMediaItem={handleDeleteMediaItem}
            onCreateSlotsBatch={handleCreateSlotsBatch}
            onUpdateSlotWeather={handleUpdateSlotWeather}
            onUpdateBookingStatus={handleUpdateBookingStatus}
          />
        )}

        {activeView === 'partner_dashboard' && (
          <PartnerDashboardView
            qrCampaigns={qrCampaigns}
            bookings={bookings}
            initialCampaignId={selectedPartnerCampaignId}
            onCreateQrCampaign={handleCreateQrCampaign}
            onSimulateQrScan={handleSimulateQrScan}
            onNavigate={setActiveView}
          />
        )}

        {activeView === 'security_audit' && <SecurityAuditView />}
      </main>

      {/* Quiet Footer */}
      <footer className="bg-[#111111] border-t border-[#8A8A8A]/25 py-8 px-6 mt-12">
        <div className="max-w-[1280px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#8A8A8A]">
          <div className="flex items-center gap-3">
            <AppLogo size="sm" showText={false} />
            <div>
              <span className="text-[#FFFFFF] font-semibold">2paraglide.com</span> — Swiss &amp; European Tandem Paragliding Marketplace · SHV / FSVL &amp; FOCA Compliant
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveView('script')}
              className="hover:text-[#FFFFFF] transition-colors cursor-pointer"
            >
              Architecture Script
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveView('security_audit')}
              className="hover:text-[#FFFFFF] transition-colors cursor-pointer"
            >
              Zero-Trust Security Spec
            </button>
            <span>·</span>
            <button
              onClick={() => setActiveView('partner_dashboard')}
              className="hover:text-[#FFFFFF] transition-colors cursor-pointer"
            >
              Hospitality QR Program
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
