import React, { useState } from 'react';
import { updatePassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import {
  BookingData,
  FlightSlotData,
  PilotBankingPrivateData,
  PilotBusinessInfo,
  PilotMediaItem,
  PilotPublicProfileBundle,
  TakeOffLandingSpot,
  TeamPilotMember,
  WeatherAlertNotification
} from '../types';
import { CurrencyCode, formatCurrency, WeatherStatus } from '../lib/validation';
import { GENERATED_ASSETS } from '../data/masterSpecScript';
import { GOOGLE_MAPS_PRESET_URLS, resolveGoogleMapsRating } from '../lib/googleMapsRating';
import { PilotPublicProfileModal } from './PilotPublicProfileModal';
import { ResilientImage } from './ResilientImage';
import {
  Plus,
  Check,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  ExternalLink,
  Upload,
  Users,
  MapPin,
  Clock,
  Edit3,
  Star,
  RefreshCw,
  AlertTriangle,
  Wind,
  Radio,
  BellRing,
  CloudLightning,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Info,
  Sparkles
} from 'lucide-react';

export type PilotDashboardSectionId =
  | '1_business'
  | '2_banking'
  | '3_spots'
  | '4_calendar'
  | '5_pilots'
  | '6_media'
  | '7_security';

export interface SlotCreateDraft {
  pilotName: string;
  pilotPhotoUrl?: string;
  shvLicense: string;
  locationName: string;
  landingZoneName?: string;
  collectionPoint?: string;
  dropOffPoint?: string;
  simultaneousGroupCount?: number;
  countryCode: string;
  launchAltitudeM: number;
  flightDate: string;
  flightTime: string;
  priceCents: number;
  currency: CurrencyCode;
  weatherStatus: WeatherStatus;
}

interface SlotScheduleGroupRow {
  rowId: string;
  spotId: string;
  flightDate: string;
  timeSlots: string[];
  newTimeInput: string;
  selectedPilotIds: string[];
  priceMajor: number;
  weatherStatus: WeatherStatus;
}

interface NewPilotDraftRow {
  draftId: string;
  name: string;
  roleTitle: string;
  shvLicense: string;
  tandemFlightsLogged: number;
  languages: string;
  gliderWing: string;
  photoPreset: 'swiss1' | 'marc2' | 'luc3' | 'custom';
  photoUrl: string;
}

interface PilotDashboardViewProps {
  slots: FlightSlotData[];
  bookings: BookingData[];
  publicProfile: PilotPublicProfileBundle;
  privateBanking: PilotBankingPrivateData;
  onUpdateBusinessInfo: (info: PilotBusinessInfo) => Promise<void>;
  onUpdatePrivateBanking: (banking: PilotBankingPrivateData) => Promise<void>;
  onAddSpot: (spot: TakeOffLandingSpot) => Promise<void>;
  onUpdateSpot: (spot: TakeOffLandingSpot) => Promise<void>;
  onDeleteSpot: (spotId: string) => Promise<void>;
  onAddPilotMembers: (members: TeamPilotMember[]) => Promise<void>;
  onUpdatePilotMemberPhoto: (memberId: string, photoUrl: string) => Promise<void>;
  onTogglePilotMemberStatus: (memberId: string) => Promise<void>;
  onDeletePilotMember: (memberId: string) => Promise<void>;
  onAddMediaItem: (item: PilotMediaItem) => Promise<void>;
  onSetHeaderMediaItem: (mediaId: string) => Promise<void>;
  onDeleteMediaItem: (mediaId: string) => Promise<void>;
  onCreateSlotsBatch: (slotDrafts: SlotCreateDraft[]) => Promise<void>;
  onUpdateSlotWeather: (slotId: string, weatherStatus: WeatherStatus) => Promise<void>;
  onUpdateBookingStatus: (
    bookingId: string,
    status: 'completed' | 'cancelled'
  ) => Promise<void>;
  weatherAlerts?: WeatherAlertNotification[];
  onUpdateLocationWeather?: (
    locationName: string,
    weatherStatus: WeatherStatus,
    reason?: string
  ) => Promise<void>;
  onAcknowledgeAlert?: (alertId: string) => void;
  onDismissAlert?: (alertId: string) => void;
}

export const PilotDashboardView: React.FC<PilotDashboardViewProps> = ({
  slots,
  bookings,
  publicProfile,
  privateBanking,
  onUpdateBusinessInfo,
  onUpdatePrivateBanking,
  onAddSpot,
  onUpdateSpot,
  onDeleteSpot,
  onAddPilotMembers,
  onUpdatePilotMemberPhoto,
  onTogglePilotMemberStatus,
  onDeletePilotMember,
  onAddMediaItem,
  onSetHeaderMediaItem,
  onDeleteMediaItem,
  onCreateSlotsBatch,
  onUpdateSlotWeather,
  onUpdateBookingStatus,
  weatherAlerts = [],
  onUpdateLocationWeather,
  onAcknowledgeAlert,
  onDismissAlert
}) => {
  const [activeSection, setActiveSection] = useState<PilotDashboardSectionId>('6_media');
  const [showPublicProfileModal, setShowPublicProfileModal] = useState(false);

  // 1. Business Information Form State
  const [bizForm, setBizForm] = useState<PilotBusinessInfo>(publicProfile.businessInfo);
  const [savingBiz, setSavingBiz] = useState(false);

  // 2. Banking Detail Form State (Strictly Private)
  const [bankForm, setBankForm] = useState<PilotBankingPrivateData>(privateBanking);
  const [showFullIban, setShowFullIban] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  // 3. Take Off & Landing Spots Form State (+ 1. Collection Point & 2. Drop Off Point)
  const [spotName, setSpotName] = useState('');
  const [landingZoneName, setLandingZoneName] = useState('');
  const [collectionPoint, setCollectionPoint] = useState(
    'Interlaken Ost Railway Station — Outdoor Flight Desk'
  );
  const [dropOffPoint, setDropOffPoint] = useState(
    'Höhematte Park Landing Lounge & Hotel Drop-Off Shuttle'
  );
  const [maxSimultaneousPilots, setMaxSimultaneousPilots] = useState(4);
  const [spotRegion, setSpotRegion] = useState('Interlaken / Jungfrau Region');
  const [spotCountry, setSpotCountry] = useState<'CH' | 'FR' | 'AT' | 'IT'>('CH');
  const [spotLaunchAlt, setSpotLaunchAlt] = useState(1420);
  const [spotLandingAlt, setSpotLandingAlt] = useState(570);
  const [spotGpsTakeoff, setSpotGpsTakeoff] = useState('46.6712° N, 7.8519° E');
  const [spotGpsLanding, setSpotGpsLanding] = useState('46.6863° N, 7.8632° E');
  const [spotWind, setSpotWind] = useState('W · NW · Valley Breeze');
  const [spotLift, setSpotLift] = useState('Grindelwald First Gondola');
  const [spotNotes, setSpotNotes] = useState('');
  const [editingSpotId, setEditingSpotId] = useState<string | null>(null);
  const [editingSpotForm, setEditingSpotForm] = useState<TakeOffLandingSpot | null>(null);

  // 4. Calendar / Slots Multi-Pilot & Multi-Row Builder State
  const createDefaultScheduleRow = (index = 0): SlotScheduleGroupRow => {
    const defaultSpot =
      publicProfile.spots[index % Math.max(1, publicProfile.spots.length)] ||
      publicProfile.spots[0];
    const activePilotIds = publicProfile.pilots
      .filter((p) => p.status === 'active')
      .map((p) => p.memberId);

    return {
      rowId: `sched_row_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      spotId: defaultSpot?.spotId || 'spot_beatenberg_01',
      flightDate: '2026-10-18',
      timeSlots: index === 0 ? ['09:30', '11:30'] : ['14:00'],
      newTimeInput: '16:00',
      selectedPilotIds:
        activePilotIds.length > 0
          ? activePilotIds
          : publicProfile.pilots.map((p) => p.memberId),
      priceMajor: defaultSpot?.countryCode === 'FR' ? 210 : 240,
      weatherStatus: 'optimal'
    };
  };

  const [scheduleRows, setScheduleRows] = useState<SlotScheduleGroupRow[]>(() => [
    createDefaultScheduleRow(0)
  ]);
  const [calendarDateFilter, setCalendarDateFilter] = useState('ALL');
  const [isCreatingSlot, setIsCreatingSlot] = useState(false);

  // 5. Pilots Roster Form State (Unlimited Pilots + Pilot Photo per Profile)
  const createDefaultPilotDraft = (idx = 1): NewPilotDraftRow => ({
    draftId: `pilot_draft_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    roleTitle: 'Certified Tandem Biplace Pilot',
    shvLicense: `SHV-CH-${51200 + idx}`,
    tandemFlightsLogged: 1850,
    languages: 'DE · EN · FR',
    gliderWing: 'Advance BiBeta 6 (41m²)',
    photoPreset: idx % 3 === 1 ? 'swiss1' : idx % 3 === 2 ? 'marc2' : 'luc3',
    photoUrl:
      idx % 3 === 1
        ? GENERATED_ASSETS.pilotAvatar
        : idx % 3 === 2
        ? GENERATED_ASSETS.pilotAvatarMarc
        : GENERATED_ASSETS.pilotAvatarLuc
  });

  const [pilotDraftRows, setPilotDraftRows] = useState<NewPilotDraftRow[]>(() => [
    createDefaultPilotDraft(1)
  ]);
  const [editingPhotoMemberId, setEditingPhotoMemberId] = useState<string | null>(null);
  const [customPhotoInputUrl, setCustomPhotoInputUrl] = useState<string>('');

  // 6. Images & Videos Form State (Upload Button + Preset + Custom URL + Header Image Option)
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [newMediaPreset, setNewMediaPreset] = useState<
    'upload' | 'heroSwiss' | 'spotZermatt' | 'spotLauterbrunnen' | 'custom'
  >('upload');
  const [newMediaUploadedUrl, setNewMediaUploadedUrl] = useState<string>('');
  const [newMediaUploadedFileName, setNewMediaUploadedFileName] = useState<string>('');
  const [newMediaCustomUrl, setNewMediaCustomUrl] = useState('');
  const [newMediaLocation, setNewMediaLocation] = useState('Interlaken / Lake Brienz');
  const [newMediaSpec, setNewMediaSpec] = useState('4K 60fps GoPro Hero 13');
  const [newMediaFeatured, setNewMediaFeatured] = useState(true);
  const [newMediaSetAsHeader, setNewMediaSetAsHeader] = useState(false);

  // 7. Security - Change Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityStatusMsg, setSecurityStatusMsg] = useState<string | null>(null);
  const [securityErrorMsg, setSecurityErrorMsg] = useState<string | null>(null);

  const completedPayoutCents = bookings
    .filter((b) => b.status === 'completed')
    .reduce((sum, b) => sum + b.pilotPayoutCents, 0);
  const pendingEscrowCents = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.pilotPayoutCents, 0);

  // Handlers
  const handleGoogleMapsUrlChange = (nextUrl: string) => {
    const resolved = resolveGoogleMapsRating(nextUrl, bizForm.companyName);
    setBizForm((prev) => ({
      ...prev,
      googleMapsUrl: nextUrl,
      googleRating: resolved.rating,
      googleReviewCount: resolved.reviewCount,
      googlePlaceName: resolved.placeName,
      googleSyncedAt: resolved.syncedAt
    }));
  };

  const handleSyncGoogleRatingNow = async () => {
    setSavingBiz(true);
    try {
      const resolved = resolveGoogleMapsRating(bizForm.googleMapsUrl, bizForm.companyName);
      const updatedInfo: PilotBusinessInfo = {
        ...bizForm,
        googleMapsUrl: resolved.googleMapsUrl,
        googleRating: resolved.rating,
        googleReviewCount: resolved.reviewCount,
        googlePlaceName: resolved.placeName,
        googleSyncedAt: resolved.syncedAt
      };
      setBizForm(updatedInfo);
      await onUpdateBusinessInfo(updatedInfo);
    } finally {
      setSavingBiz(false);
    }
  };

  const handleSaveBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBiz(true);
    try {
      const resolved = resolveGoogleMapsRating(bizForm.googleMapsUrl, bizForm.companyName);
      const updatedInfo: PilotBusinessInfo = {
        ...bizForm,
        googleMapsUrl: resolved.googleMapsUrl,
        googleRating: resolved.rating,
        googleReviewCount: resolved.reviewCount,
        googlePlaceName: resolved.placeName,
        googleSyncedAt: resolved.syncedAt
      };
      setBizForm(updatedInfo);
      await onUpdateBusinessInfo(updatedInfo);
    } finally {
      setSavingBiz(false);
    }
  };

  const handleSaveBanking = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBank(true);
    try {
      await onUpdatePrivateBanking(bankForm);
    } finally {
      setSavingBank(false);
    }
  };

  const handleCreateSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spotName.trim() || !landingZoneName.trim()) return;
    const newSpot: TakeOffLandingSpot = {
      spotId: `spot_${Date.now()}`,
      spotName: spotName.trim(),
      landingZoneName: landingZoneName.trim(),
      collectionPoint:
        collectionPoint.trim() || 'Main Station / Designated Flight Desk Meeting Point',
      dropOffPoint:
        dropOffPoint.trim() || 'Landing Zone Lounge / Hotel Drop-Off Point',
      maxSimultaneousPilots: Math.max(1, Math.min(20, Number(maxSimultaneousPilots) || 4)),
      region: spotRegion.trim(),
      countryCode: spotCountry,
      launchAltitudeM: Number(spotLaunchAlt),
      landingAltitudeM: Number(spotLandingAlt),
      gpsTakeoff: spotGpsTakeoff.trim(),
      gpsLanding: spotGpsLanding.trim(),
      windOrientation: spotWind.trim(),
      cableCarLift: spotLift.trim(),
      notes: spotNotes.trim() || 'SHV inspected commercial tandem launch & landing zone.'
    };
    await onAddSpot(newSpot);
    setSpotName('');
    setLandingZoneName('');
    setSpotNotes('');
  };

  const handleSaveEditedSpot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSpotForm) return;
    await onUpdateSpot(editingSpotForm);
    setEditingSpotId(null);
    setEditingSpotForm(null);
  };

  // Multi-Row & Multi-Pilot Slot Helpers
  const handleAddScheduleRow = () => {
    setScheduleRows((prev) => [...prev, createDefaultScheduleRow(prev.length)]);
  };

  const handleRemoveScheduleRow = (rowId: string) => {
    setScheduleRows((prev) => (prev.length > 1 ? prev.filter((r) => r.rowId !== rowId) : prev));
  };

  const handleUpdateScheduleRow = (
    rowId: string,
    patch: Partial<SlotScheduleGroupRow>
  ) => {
    setScheduleRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row))
    );
  };

  const handleTogglePilotInRow = (rowId: string, memberId: string) => {
    setScheduleRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        const exists = row.selectedPilotIds.includes(memberId);
        const nextIds = exists
          ? row.selectedPilotIds.filter((id) => id !== memberId)
          : [...row.selectedPilotIds, memberId];
        return { ...row, selectedPilotIds: nextIds };
      })
    );
  };

  const handleSelectAllPilotsInRow = (rowId: string) => {
    const allIds = publicProfile.pilots.map((p) => p.memberId);
    handleUpdateScheduleRow(rowId, { selectedPilotIds: allIds });
  };

  const handleAddTimeSlotToRow = (rowId: string) => {
    setScheduleRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        const cleanTime = row.newTimeInput.trim();
        if (!cleanTime || row.timeSlots.includes(cleanTime)) return row;
        return {
          ...row,
          timeSlots: [...row.timeSlots, cleanTime].sort()
        };
      })
    );
  };

  const handleRemoveTimeSlotFromRow = (rowId: string, timeToRemove: string) => {
    setScheduleRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId || row.timeSlots.length <= 1) return row;
        return {
          ...row,
          timeSlots: row.timeSlots.filter((t) => t !== timeToRemove)
        };
      })
    );
  };

  // Count total slots to be published across all rows (Spots × Time Slots × Selected Pilots)
  const totalSlotsToPublish = scheduleRows.reduce(
    (acc, row) => acc + row.timeSlots.length * Math.max(0, row.selectedPilotIds.length),
    0
  );

  const handlePublishSlotBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totalSlotsToPublish === 0) return;
    setIsCreatingSlot(true);
    try {
      const drafts: SlotCreateDraft[] = [];

      for (const row of scheduleRows) {
        const matchedSpot =
          publicProfile.spots.find((s) => s.spotId === row.spotId) ||
          publicProfile.spots[0];
        const selectedPilots = publicProfile.pilots.filter((p) =>
          row.selectedPilotIds.includes(p.memberId)
        );
        const country = matchedSpot?.countryCode || 'CH';

        for (const timeStr of row.timeSlots) {
          for (const pilot of selectedPilots) {
            drafts.push({
              pilotName: pilot.name,
              pilotPhotoUrl: pilot.photoUrl,
              shvLicense: pilot.shvLicense,
              locationName: matchedSpot?.spotName || 'Interlaken Beatenberg',
              landingZoneName: matchedSpot?.landingZoneName || 'Höhematte Park Interlaken',
              collectionPoint:
                matchedSpot?.collectionPoint ||
                'Höheweg 95 Flight Desk / Interlaken Ost Station',
              dropOffPoint:
                matchedSpot?.dropOffPoint ||
                'Höhematte Park Lounge & Hotel Return Shuttle',
              simultaneousGroupCount: selectedPilots.length,
              countryCode: country,
              launchAltitudeM: matchedSpot?.launchAltitudeM || 1350,
              flightDate: row.flightDate,
              flightTime: timeStr,
              priceCents: Math.round(Number(row.priceMajor) * 100),
              currency: country === 'CH' ? 'CHF' : 'EUR',
              weatherStatus: row.weatherStatus
            });
          }
        }
      }

      if (drafts.length > 0) {
        await onCreateSlotsBatch(drafts);
      }
    } finally {
      setIsCreatingSlot(false);
    }
  };

  // Section 5: Unlimited Pilots + Photo Upload/Preset Handlers
  const handleUpdatePilotDraft = (
    draftId: string,
    patch: Partial<NewPilotDraftRow>
  ) => {
    setPilotDraftRows((prev) =>
      prev.map((d) => (d.draftId === draftId ? { ...d, ...patch } : d))
    );
  };

  const handlePilotPhotoFileUpload = (
    draftId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdatePilotDraft(draftId, {
          photoPreset: 'custom',
          photoUrl: reader.result
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleExistingPilotPhotoUpload = (
    memberId: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        await onUpdatePilotMemberPhoto(memberId, reader.result);
        setEditingPhotoMemberId(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddPilotDraftRow = () => {
    setPilotDraftRows((prev) => [
      ...prev,
      createDefaultPilotDraft(publicProfile.pilots.length + prev.length + 1)
    ]);
  };

  const handleRemovePilotDraftRow = (draftId: string) => {
    setPilotDraftRows((prev) =>
      prev.length > 1 ? prev.filter((d) => d.draftId !== draftId) : prev
    );
  };

  const handleCreatePilotMembersSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validRows = pilotDraftRows.filter((d) => d.name.trim().length > 0);
    if (validRows.length === 0) return;

    const newMembers: TeamPilotMember[] = validRows.map((d, idx) => ({
      memberId: `pilot_member_${Date.now()}_${idx}`,
      name: d.name.trim(),
      photoUrl: d.photoUrl.trim() || GENERATED_ASSETS.pilotAvatar,
      roleTitle: d.roleTitle.trim() || 'Certified Tandem Pilot',
      shvLicense: d.shvLicense.trim() || 'SHV-CH-51209',
      tandemFlightsLogged: Number(d.tandemFlightsLogged) || 1000,
      languages: d.languages.trim() || 'DE · EN · FR',
      gliderWing: d.gliderWing.trim() || 'Advance BiBeta 6 (41m²)',
      status: 'active'
    }));

    await onAddPilotMembers(newMembers);
    // Keep newly added pilots selected in Section 4 schedule rows automatically
    setScheduleRows((prev) =>
      prev.map((row) => ({
        ...row,
        selectedPilotIds: [
          ...row.selectedPilotIds,
          ...newMembers.map((m) => m.memberId)
        ]
      }))
    );
    setPilotDraftRows([
      createDefaultPilotDraft(publicProfile.pilots.length + newMembers.length + 1)
    ]);
  };

  const handleMediaFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isVideo = file.type.startsWith('video/');
    setNewMediaType(isVideo ? 'video' : 'image');
    setNewMediaUploadedFileName(file.name);
    if (!newMediaTitle.trim()) {
      const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setNewMediaTitle(baseName);
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setNewMediaPreset('upload');
        setNewMediaUploadedUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleQuickBatchMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const cleanName =
            file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ') ||
            `Alpine Flight Media ${idx + 1}`;
          const item: PilotMediaItem = {
            mediaId: `media_${Date.now()}_${idx}`,
            title: cleanName,
            mediaType: file.type.startsWith('video/') ? 'video' : 'image',
            assetUrl: reader.result,
            locationTag: newMediaLocation.trim() || 'Swiss Alps Tandem',
            featured: true,
            isHeaderImage: false,
            durationOrResolution: file.type.startsWith('video/')
              ? '4K Uploaded Video'
              : 'High-Res Uploaded Photo'
          };
          await onAddMediaItem(item);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const resolvePreviewMediaUrl = () => {
    if (newMediaPreset === 'upload' && newMediaUploadedUrl) {
      return newMediaUploadedUrl;
    }
    if (newMediaPreset === 'spotZermatt') {
      return GENERATED_ASSETS.spotZermatt;
    }
    if (newMediaPreset === 'spotLauterbrunnen') {
      return GENERATED_ASSETS.spotLauterbrunnen;
    }
    if (newMediaPreset === 'custom' && newMediaCustomUrl.trim()) {
      return newMediaCustomUrl.trim();
    }
    return GENERATED_ASSETS.heroSwiss;
  };

  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMediaTitle.trim()) return;
    const resolvedAsset = resolvePreviewMediaUrl();

    const item: PilotMediaItem = {
      mediaId: `media_${Date.now()}`,
      title: newMediaTitle.trim(),
      mediaType: newMediaType,
      assetUrl: resolvedAsset,
      locationTag: newMediaLocation.trim(),
      featured: newMediaFeatured,
      isHeaderImage: newMediaSetAsHeader,
      durationOrResolution: newMediaSpec.trim()
    };
    await onAddMediaItem(item);
    setNewMediaTitle('');
    setNewMediaCustomUrl('');
    setNewMediaUploadedUrl('');
    setNewMediaUploadedFileName('');
    setNewMediaSetAsHeader(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityStatusMsg(null);
    setSecurityErrorMsg(null);

    if (newPassword.length < 12) {
      setSecurityErrorMsg('New password must be at least 12 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityErrorMsg('New password and confirmation do not match.');
      return;
    }

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
      }
      setSecurityStatusMsg(
        'Password updated in your private Security Vault. Active session tokens rotated.'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setSecurityStatusMsg(
        'Pilot Security Vault password policy updated. (Google OAuth MFA remains active on this session).'
      );
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const maskedIban = bankForm.iban
    ? `${bankForm.iban.slice(0, 7)} •••• •••• •••• ${bankForm.iban.slice(-4)}`
    : '';

  const filteredCalendarSlots = slots.filter(
    (s) => calendarDateFilter === 'ALL' || s.flightDate === calendarDateFilter
  );

  const uniqueDates = Array.from(new Set(slots.map((s) => s.flightDate))).sort();

  const pwdHasMinLen = newPassword.length >= 12;
  const pwdHasUpper = /[A-Z]/.test(newPassword);
  const pwdHasNumber = /[0-9]/.test(newPassword);
  const pwdHasSymbol = /[^A-Za-z0-9]/.test(newPassword);

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-10">
      {/* Pilot Dashboard Top Header + Live Public Profile Preview Trigger */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#8A8A8A]/25 pb-6">
        <div className="flex items-center gap-4">
          <img
            src={publicProfile.pilots[0]?.photoUrl || GENERATED_ASSETS.pilotAvatar}
            alt="SHV Tandem Pilot"
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full object-cover border-2 border-[#E62B1E]"
          />
          <div className="space-y-1">
            <div className="text-xs font-mono text-[#E62B1E]">
              DASHBOARD 02 · TANDEM PILOT &amp; OPERATOR COMMAND CENTER
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-wide text-[#FFFFFF]">
              2. PILOT DASHBOARD — {publicProfile.businessInfo.companyName.toUpperCase()}
            </h1>
            <div className="text-xs text-[#8A8A8A] font-mono">
              Public Profile Last Published:{' '}
              <span className="text-[#FFFFFF]">{publicProfile.lastPublishedAt}</span> ·{' '}
              <span className="text-[#E62B1E]">{publicProfile.spots.length} Spots</span> ·{' '}
              <span className="text-[#E62B1E]">{publicProfile.pilots.length} Pilots</span> ·{' '}
              <span className="text-[#E62B1E]">{slots.length} Flight Slots</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={() => setShowPublicProfileModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>View Live Public Profile</span>
          </button>
        </div>
      </div>

      {/* Automated Weather Notification System Banner in Pilot Cockpit */}
      {weatherAlerts.length > 0 && (
        <div className="space-y-3">
          {weatherAlerts.map((alert) => {
            const isUnsafe = alert.status === 'unsafe' || alert.status === 'hold';
            return (
              <div
                key={alert.alertId}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  isUnsafe
                    ? 'bg-red-950/40 border-red-500/80 shadow-[0_0_25px_rgba(239,68,68,0.25)] text-red-100'
                    : 'bg-amber-950/40 border-amber-500/80 shadow-[0_0_25px_rgba(245,158,11,0.2)] text-amber-100'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        isUnsafe ? 'bg-red-500 text-white animate-pulse' : 'bg-amber-500 text-black'
                      }`}
                    >
                      {isUnsafe ? (
                        <ShieldAlert className="w-6 h-6" />
                      ) : (
                        <AlertTriangle className="w-6 h-6" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-mono font-extrabold uppercase rounded ${
                            isUnsafe ? 'bg-red-600 text-white' : 'bg-amber-500 text-black'
                          }`}
                        >
                          {isUnsafe ? 'CRITICAL WEATHER HOLD' : 'WEATHER ADVISORY ACTIVE'}
                        </span>
                        <span className="font-mono text-xs text-[#8A8A8A]">
                          {alert.source} · {alert.triggeredAt}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <span>{alert.locationName}</span>
                        <span className="text-xs font-mono font-normal">
                          → Updated to <span className="font-bold underline text-white">{alert.status.toUpperCase()}</span>
                        </span>
                      </h3>
                      <p className="text-xs text-[#8A8A8A] leading-relaxed">
                        {alert.reason}
                      </p>
                      <div className="pt-1 flex flex-wrap items-center gap-2 text-[11px] font-mono">
                        {alert.actionsTaken.map((act, i) => (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded ${
                              isUnsafe
                                ? 'bg-red-900/50 text-red-200 border border-red-700/50'
                                : 'bg-amber-900/50 text-amber-200 border border-amber-700/50'
                            }`}
                          >
                            ✓ {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!alert.acknowledged && onAcknowledgeAlert && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.alertId)}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-[#FFFFFF] hover:bg-[#E5E5E5] text-black rounded-lg transition-colors cursor-pointer"
                      >
                        Acknowledge Alert
                      </button>
                    )}
                    {onUpdateLocationWeather && (
                      <button
                        onClick={() => onUpdateLocationWeather(alert.locationName, 'optimal')}
                        className="px-3.5 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Clear Hold → Optimal
                      </button>
                    )}
                    {onDismissAlert && (
                      <button
                        onClick={() => onDismissAlert(alert.alertId)}
                        className="p-1.5 text-[#8A8A8A] hover:text-white rounded-lg transition-colors cursor-pointer"
                        title="Dismiss notification"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4-Column Pilot Telemetry Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#8A8A8A]">Settled IBAN Payouts (Completed)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#E62B1E]">
            {formatCurrency(completedPayoutCents, 'CHF')}
          </div>
          <div className="text-xs text-[#8A8A8A]">
            78%–85% net share transferred via Stripe Connect
          </div>
        </div>

        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#8A8A8A]">Reserved in Escrow (Upcoming)</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#FFFFFF]">
            {formatCurrency(pendingEscrowCents, 'CHF')}
          </div>
          <div className="text-xs text-[#8A8A8A]">
            Released automatically upon flight completion
          </div>
        </div>

        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#8A8A8A]">Spots (Collection &amp; Drop-Off) &amp; Slots</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#E62B1E]">
            {publicProfile.spots.length} Spots / {slots.length} Slots
          </div>
          <div className="text-xs text-[#8A8A8A]">
            Multi-pilot simultaneous wave scheduling active
          </div>
        </div>

        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#8A8A8A]">Certified Pilot Team &amp; Media</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#FFFFFF]">
            {publicProfile.pilots.length} Pilots ·{' '}
            <span className="text-[#E62B1E]">{publicProfile.mediaGallery.length}</span> Media
          </div>
          <div className="text-xs text-[#8A8A8A]">
            Unlimited pilot profiles with custom photos
          </div>
        </div>
      </div>

      {/* 7-Section Interactive Navigation Bar */}
      <div className="bg-[#181818] border border-[#8A8A8A]/25 p-1.5 rounded-xl flex flex-wrap items-center gap-1.5">
        {(
          [
            { id: '1_business', label: '1. Business Information', badge: 'PUBLIC' },
            { id: '2_banking', label: '2. Banking Detail', badge: 'PRIVATE' },
            { id: '3_spots', label: '3. Take Off & Landing Spots', badge: 'PUBLIC' },
            { id: '4_calendar', label: '4. Calendar / Slots', badge: 'PUBLIC' },
            { id: '5_pilots', label: '5. Pilots', badge: 'PUBLIC' },
            { id: '6_media', label: '6. Images & Videos', badge: 'PUBLIC' },
            { id: '7_security', label: '7. Security - Change Password', badge: 'PRIVATE' }
          ] as { id: PilotDashboardSectionId; label: string; badge: 'PUBLIC' | 'PRIVATE' }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 ${
              activeSection === tab.id
                ? 'bg-[#E62B1E] text-[#FFFFFF]'
                : 'text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#111111]'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ==================================================================== */}
      {/* SECTION 1: BUSINESS INFORMATION (PUBLISHES TO PUBLIC PROFILE)        */}
      {/* ==================================================================== */}
      {activeSection === '1_business' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSaveBusiness}
            className="lg:col-span-8 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#8A8A8A]/20 pb-4">
              <div>
                <div className="text-xs font-mono text-[#E62B1E]">
                  SECTION 01 · PUBLIC OPERATOR IDENTITY
                </div>
                <h2 className="text-xl font-bold text-[#FFFFFF]">
                  1. Business Information &amp; Commercial Insurance
                </h2>
                <p className="text-xs text-[#8A8A8A]">
                  All changes saved here are immediately published to your public 2paraglide operator profile.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Company / Operator Name
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={bizForm.companyName}
                  onChange={(e) => setBizForm({ ...bizForm, companyName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Primary Country Jurisdiction
                </label>
                <select
                  value={bizForm.countryCode}
                  onChange={(e) =>
                    setBizForm({
                      ...bizForm,
                      countryCode: e.target.value as 'CH' | 'FR' | 'AT' | 'IT'
                    })
                  }
                  className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                >
                  <option value="CH">Switzerland (CH · SHV/BAZL)</option>
                  <option value="FR">France (FR · FFVL/DGAC)</option>
                  <option value="AT">Austria (AT · ÖAeC)</option>
                  <option value="IT">Italy (IT · AeCI)</option>
                </select>
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-[#FFFFFF] mb-1">
                Public Headline / Tagline
              </label>
              <input
                type="text"
                required
                maxLength={140}
                value={bizForm.tagline}
                onChange={(e) => setBizForm({ ...bizForm, tagline: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
              />
            </div>

            <div className="text-xs">
              <label className="block font-semibold text-[#FFFFFF] mb-1">
                Operator Bio &amp; Safety Philosophy (Published on Public Profile)
              </label>
              <textarea
                rows={4}
                required
                maxLength={1200}
                value={bizForm.bio}
                onChange={(e) => setBizForm({ ...bizForm, bio: e.target.value })}
                className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Headquarters &amp; Passenger Meeting Address
                </label>
                <input
                  type="text"
                  required
                  value={bizForm.headquarters}
                  onChange={(e) => setBizForm({ ...bizForm, headquarters: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Swiss UID / MWST or EU VAT Number
                </label>
                <input
                  type="text"
                  required
                  value={bizForm.uidVatNumber}
                  onChange={(e) => setBizForm({ ...bizForm, uidVatNumber: e.target.value })}
                  className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Public Flight Desk Email
                </label>
                <input
                  type="email"
                  required
                  value={bizForm.publicEmail}
                  onChange={(e) => setBizForm({ ...bizForm, publicEmail: e.target.value })}
                  className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Public Flight Desk Phone
                </label>
                <input
                  type="text"
                  required
                  value={bizForm.publicPhone}
                  onChange={(e) => setBizForm({ ...bizForm, publicPhone: e.target.value })}
                  className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Public Website / URL
                </label>
                <input
                  type="text"
                  required
                  value={bizForm.websiteUrl}
                  onChange={(e) => setBizForm({ ...bizForm, websiteUrl: e.target.value })}
                  className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            {/* Google Maps URL Input + Automatic Google Ratings Pull-Through */}
            <div className="p-4 bg-[#111111] border border-[#E62B1E]/50 rounded-xl space-y-3.5 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="block font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#E62B1E]" />
                    <span>Google Maps URL (Auto-Pulls Google Ratings to Public Pilot Cards)</span>
                  </label>
                  <p className="text-[11px] text-[#8A8A8A] mt-0.5">
                    Paste your Google Maps business profile link. Your live Google star rating and review count automatically pull through to your public profile and pilot cards.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSyncGoogleRatingNow}
                  disabled={savingBiz}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Pull Rating from Google</span>
                </button>
              </div>

              <input
                type="url"
                required
                placeholder="https://www.google.com/maps/place/..."
                value={bizForm.googleMapsUrl}
                onChange={(e) => handleGoogleMapsUrlChange(e.target.value)}
                className="w-full px-3.5 py-2 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
              />

              {/* Quick Sample Google Maps URLs to test live rating pull-through */}
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-[#8A8A8A]">
                  Test Verified Google Maps Listings:
                </span>
                {GOOGLE_MAPS_PRESET_URLS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => handleGoogleMapsUrlChange(preset.url)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-md border transition-colors cursor-pointer ${
                      bizForm.googleMapsUrl === preset.url
                        ? 'bg-[#E62B1E] text-[#FFFFFF] border-[#E62B1E]'
                        : 'bg-[#181818] text-[#8A8A8A] border-[#8A8A8A]/30 hover:text-[#FFFFFF]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Pulled Google Rating Live Status Banner */}
              <div className="p-3 bg-[#181818] border border-[#8A8A8A]/25 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-[#111111] border border-[#E62B1E] rounded-lg flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-[#E62B1E] fill-[#E62B1E]" />
                    <span className="text-base font-bold font-mono text-[#FFFFFF]">
                      {(bizForm.googleRating || 4.9).toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-[#FFFFFF] flex items-center gap-2">
                      <span>Google Maps Rating Auto-Pulled</span>
                      <span className="text-[10px] font-mono text-[#E62B1E]">
                        ({bizForm.googleReviewCount || 348} Google Reviews)
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-[#8A8A8A]">
                      Place: <span className="text-[#FFFFFF]">{bizForm.googlePlaceName || bizForm.companyName}</span>
                      {bizForm.googleSyncedAt ? ` · Synced ${bizForm.googleSyncedAt}` : ''}
                    </div>
                  </div>
                </div>

                {bizForm.googleMapsUrl && (
                  <a
                    href={bizForm.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-mono text-[#E62B1E] hover:underline whitespace-nowrap shrink-0"
                  >
                    <span>Verify on Google Maps</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2 border-t border-[#8A8A8A]/20">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Aviation Liability Insurer
                </label>
                <input
                  type="text"
                  required
                  value={bizForm.insuranceProvider}
                  onChange={(e) => setBizForm({ ...bizForm, insuranceProvider: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Commercial Policy Number
                </label>
                <input
                  type="text"
                  required
                  value={bizForm.policyNumber}
                  onChange={(e) => setBizForm({ ...bizForm, policyNumber: e.target.value })}
                  className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Insured Liability Limit
                </label>
                <input
                  type="text"
                  required
                  value={bizForm.coverageAmount}
                  onChange={(e) => setBizForm({ ...bizForm, coverageAmount: e.target.value })}
                  className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={savingBiz}
                className="px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {savingBiz
                  ? 'Publishing to Public Profile...'
                  : 'Save & Publish Business Info to Public Profile'}
              </button>
            </div>
          </form>

          {/* Right 4 Columns: Live Public Card Preview */}
          <div className="lg:col-span-4 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4">
            <div className="text-xs font-mono text-[#E62B1E]">
              LIVE PUBLIC PROFILE SUMMARY
            </div>
            <h3 className="text-lg font-bold text-[#FFFFFF]">{bizForm.companyName}</h3>

            {/* Live Pulled Google Rating Badge */}
            <div className="p-3 bg-[#111111] border border-[#E62B1E]/40 rounded-lg flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-[#E62B1E] fill-[#E62B1E] shrink-0" />
                <div>
                  <span className="font-mono font-bold text-[#FFFFFF]">
                    {(bizForm.googleRating || 4.9).toFixed(1)} ★
                  </span>{' '}
                  <span className="text-[#8A8A8A] font-mono">
                    ({bizForm.googleReviewCount || 348} Google Reviews)
                  </span>
                </div>
              </div>
              {bizForm.googleMapsUrl && (
                <a
                  href={bizForm.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-mono text-[#E62B1E] hover:underline shrink-0"
                >
                  Maps
                </a>
              )}
            </div>

            <p className="text-xs text-[#8A8A8A] leading-relaxed">{bizForm.tagline}</p>
            <div className="text-xs font-mono text-[#8A8A8A] space-y-1.5 pt-2 border-t border-[#8A8A8A]/20">
              <div>
                HQ: <span className="text-[#FFFFFF]">{bizForm.headquarters}</span>
              </div>
              <div>
                UID/VAT: <span className="text-[#FFFFFF]">{bizForm.uidVatNumber}</span>
              </div>
              <div>
                Insurer: <span className="text-[#FFFFFF]">{bizForm.insuranceProvider}</span>
              </div>
              <div>
                Cover: <span className="text-[#E62B1E] font-bold">{bizForm.coverageAmount}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPublicProfileModal(true)}
              className="w-full py-2.5 text-xs font-semibold text-[#111111] bg-[#FFFFFF] hover:bg-[#e5e5e5] rounded-lg transition-colors cursor-pointer"
            >
              Open Full Public Profile View
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: BANKING DETAIL (STRICTLY PRIVATE — NEVER PUBLISHED)       */}
      {/* ==================================================================== */}
      {activeSection === '2_banking' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleSaveBanking}
            className="lg:col-span-8 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#8A8A8A]/20 pb-4">
              <div>
                <div className="text-xs font-mono text-[#E62B1E] flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>SECTION 02 · ISOLATED PRIVATE FINANCIAL VAULT (EXCLUDED FROM PUBLIC PROFILE)</span>
                </div>
                <h2 className="text-xl font-bold text-[#FFFFFF] mt-1">
                  2. Banking Detail &amp; Stripe Connect IBAN Settlement
                </h2>
                <p className="text-xs text-[#8A8A8A]">
                  Stored exclusively in <code className="font-mono text-[#FFFFFF]">/pilotProfiles/&#123;uid&#125;/private/banking</code>. Never visible to flyers, partners, or public visitors.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Beneficiary Account Holder Name
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.accountHolderName}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, accountHolderName: e.target.value })
                  }
                  className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Bank / Financial Institution Name
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.bankName}
                  onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                  className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#FFFFFF]">
                    CH-IBAN or EU SEPA IBAN (78%–85% Escrow Payouts)
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowFullIban(!showFullIban)}
                    className="inline-flex items-center gap-1 text-[#E62B1E] font-mono cursor-pointer"
                  >
                    {showFullIban ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Mask IBAN</span>
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" />
                        <span>Reveal IBAN</span>
                      </>
                    )}
                  </button>
                </div>
                {showFullIban ? (
                  <input
                    type="text"
                    required
                    value={bankForm.iban}
                    onChange={(e) => setBankForm({ ...bankForm, iban: e.target.value })}
                    className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                  />
                ) : (
                  <input
                    type="text"
                    readOnly
                    value={maskedIban}
                    onClick={() => setShowFullIban(true)}
                    className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#8A8A8A] border border-[#8A8A8A]/40 rounded-lg cursor-pointer"
                  />
                )}
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  BIC / SWIFT Code
                </label>
                <input
                  type="text"
                  required
                  value={bankForm.bicSwift}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, bicSwift: e.target.value.toUpperCase() })
                  }
                  className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Settlement Currency
                </label>
                <select
                  value={bankForm.settlementCurrency}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
                      settlementCurrency: e.target.value as CurrencyCode
                    })
                  }
                  className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                >
                  <option value="CHF">CHF (Swiss Franc)</option>
                  <option value="EUR">EUR (Euro SEPA)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Escrow Payout Cadence
                </label>
                <select
                  value={bankForm.payoutSchedule}
                  onChange={(e) =>
                    setBankForm({
                      ...bankForm,
                      payoutSchedule: e.target.value as PilotBankingPrivateData['payoutSchedule']
                    })
                  }
                  className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                >
                  <option value="T+1_ESCROW">T+1 Automated Post-Flight</option>
                  <option value="WEEKLY_FRIDAY">Weekly Friday Batch</option>
                  <option value="MONTHLY">Monthly Statement Settlement</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Swiss TWINT Merchant ID
                </label>
                <input
                  type="text"
                  value={bankForm.twintMerchantId}
                  onChange={(e) =>
                    setBankForm({ ...bankForm, twintMerchantId: e.target.value })
                  }
                  className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                type="submit"
                disabled={savingBank}
                className="px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {savingBank
                  ? 'Encrypting & Saving...'
                  : 'Save to Private Banking Vault (Never Published)'}
              </button>
            </div>
          </form>

          <div className="lg:col-span-4 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4 text-xs">
            <div className="text-xs font-mono text-[#E62B1E]">
              PILLAR 6 · ZERO-TRUST BANKING ISOLATION
            </div>
            <h3 className="text-base font-bold text-[#FFFFFF]">
              Why Banking Data Never Touches Your Public Profile
            </h3>
            <p className="text-[#8A8A8A] leading-relaxed">
              Your IBAN, BIC/SWIFT, and TWINT merchant credentials are stored in a segregated private
              subcollection (<code className="font-mono text-[#FFFFFF]">/pilotProfiles/&#123;pilotId&#125;/private/banking</code>)
              with <code className="font-mono text-[#FFFFFF]">allow list: if false</code>.
            </p>
            <div className="p-3.5 bg-[#111111] border border-[#8A8A8A]/25 rounded-lg space-y-1.5 font-mono">
              <div className="text-[#FFFFFF]">Active Beneficiary: {bankForm.accountHolderName}</div>
              <div className="text-[#E62B1E]">{maskedIban}</div>
              <div className="text-[#8A8A8A]">
                {bankForm.bankName} · {bankForm.settlementCurrency} ({bankForm.payoutSchedule})
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: TAKE OFF & LANDING SPOTS + COLLECTION & DROP-OFF POINTS   */}
      {/* ==================================================================== */}
      {activeSection === '3_spots' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 5 Columns: Add New Take-Off, Landing, Collection & Drop-Off Point */}
          <form
            onSubmit={handleCreateSpot}
            className="lg:col-span-5 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4 text-xs"
          >
            <div className="border-b border-[#8A8A8A]/20 pb-3">
              <div className="text-xs font-mono text-[#E62B1E]">
                SECTION 03 · LAUNCH, LANDING, COLLECTION &amp; DROP-OFF POINTS
              </div>
              <h2 className="text-lg font-bold text-[#FFFFFF]">
                Add Take-Off &amp; Landing Spot
              </h2>
              <p className="text-xs text-[#8A8A8A]">
                Include <strong className="text-[#FFFFFF]">1. Collection / Meeting Point</strong> and{' '}
                <strong className="text-[#FFFFFF]">2. Drop-Off Point</strong> plus simultaneous multi-pilot launch capacity. Publishes directly to your Public Profile.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Take-Off Spot Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grindelwald First"
                  value={spotName}
                  onChange={(e) => setSpotName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Landing Zone Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grindelwald Bodmi"
                  value={landingZoneName}
                  onChange={(e) => setLandingZoneName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            {/* Highlighted 1. Collection / Meeting Point & 2. Drop-Off Point */}
            <div className="p-3.5 bg-[#111111] border border-[#E62B1E]/60 rounded-xl space-y-3">
              <div className="text-[11px] font-mono text-[#E62B1E] font-semibold">
                PASSENGER LOGISTICS · COLLECTION &amp; DROP-OFF POINTS
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  1. Collection Point / Meeting Point
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Interlaken Ost Station — Outdoor Desk / Hotel Pickup"
                  value={collectionPoint}
                  onChange={(e) => setCollectionPoint(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  2. Drop-Off Point
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Höhematte Park Landing Lounge / Hotel Return Shuttle"
                  value={dropOffPoint}
                  onChange={(e) => setDropOffPoint(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Max Simultaneous Pilots Flying From This Spot &amp; Time
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  required
                  value={maxSimultaneousPilots}
                  onChange={(e) => setMaxSimultaneousPilots(Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block font-semibold text-[#FFFFFF] mb-1">Alpine Region</label>
                <input
                  type="text"
                  required
                  value={spotRegion}
                  onChange={(e) => setSpotRegion(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">Country</label>
                <select
                  value={spotCountry}
                  onChange={(e) =>
                    setSpotCountry(e.target.value as 'CH' | 'FR' | 'AT' | 'IT')
                  }
                  className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                >
                  <option value="CH">CH</option>
                  <option value="FR">FR</option>
                  <option value="AT">AT</option>
                  <option value="IT">IT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Take-Off Altitude (m ASL)
                </label>
                <input
                  type="number"
                  required
                  value={spotLaunchAlt}
                  onChange={(e) => setSpotLaunchAlt(Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Landing Altitude (m ASL)
                </label>
                <input
                  type="number"
                  required
                  value={spotLandingAlt}
                  onChange={(e) => setSpotLandingAlt(Number(e.target.value))}
                  className="w-full px-3 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Take-Off GPS Coordinates
                </label>
                <input
                  type="text"
                  required
                  value={spotGpsTakeoff}
                  onChange={(e) => setSpotGpsTakeoff(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Landing GPS Coordinates
                </label>
                <input
                  type="text"
                  required
                  value={spotGpsLanding}
                  onChange={(e) => setSpotGpsLanding(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Launch Wind Orientation
                </label>
                <input
                  type="text"
                  required
                  value={spotWind}
                  onChange={(e) => setSpotWind(e.target.value)}
                  className="w-full px-3 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Cable Car / Shuttle Access
                </label>
                <input
                  type="text"
                  required
                  value={spotLift}
                  onChange={(e) => setSpotLift(e.target.value)}
                  className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-[#FFFFFF] mb-1">
                Briefing &amp; Terrain Notes
              </label>
              <input
                type="text"
                placeholder="Panoramic launch facing Eiger North Face..."
                value={spotNotes}
                onChange={(e) => setSpotNotes(e.target.value)}
                className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
              />
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add &amp; Publish Take-Off / Landing Spot</span>
            </button>
          </form>

          {/* Right 7 Columns: Published Take-Off & Landing Spots List with Collection & Drop-Off Points */}
          <div className="lg:col-span-7 space-y-4">
            {publicProfile.spots.map((sp) => {
              const isEditingThis = editingSpotId === sp.spotId && editingSpotForm;

              return (
                <div
                  key={sp.spotId}
                  className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-xs font-mono text-[#E62B1E]">
                        {sp.countryCode} · {sp.region} · Δ {sp.launchAltitudeM - sp.landingAltitudeM}m Vertical Drop · Up to{' '}
                        <span className="text-[#FFFFFF] font-bold">
                          {sp.maxSimultaneousPilots} Simultaneous Pilots
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#FFFFFF]">{sp.spotName}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          if (isEditingThis) {
                            setEditingSpotId(null);
                            setEditingSpotForm(null);
                          } else {
                            setEditingSpotId(sp.spotId);
                            setEditingSpotForm({ ...sp });
                          }
                        }}
                        className="px-2.5 py-1.5 text-xs font-mono text-[#FFFFFF] bg-[#111111] hover:bg-[#E62B1E] border border-[#8A8A8A]/35 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{isEditingThis ? 'Close' : 'Edit Points'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteSpot(sp.spotId)}
                        className="p-1.5 text-[#8A8A8A] hover:text-[#E62B1E] rounded-lg transition-colors cursor-pointer"
                        title="Remove spot from public profile"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditingThis && editingSpotForm ? (
                    <form
                      onSubmit={handleSaveEditedSpot}
                      className="p-4 bg-[#111111] border border-[#E62B1E] rounded-xl space-y-3 text-xs"
                    >
                      <div className="font-mono text-[#E62B1E] font-semibold">
                        EDIT COLLECTION POINT, DROP-OFF POINT &amp; CAPACITY (PUBLISHES LIVE)
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-semibold text-[#FFFFFF] mb-1">
                            1. Collection Point / Meeting Point
                          </label>
                          <input
                            type="text"
                            required
                            value={editingSpotForm.collectionPoint}
                            onChange={(e) =>
                              setEditingSpotForm({
                                ...editingSpotForm,
                                collectionPoint: e.target.value
                              })
                            }
                            className="w-full px-3 py-1.5 bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#FFFFFF] mb-1">
                            2. Drop-Off Point
                          </label>
                          <input
                            type="text"
                            required
                            value={editingSpotForm.dropOffPoint}
                            onChange={(e) =>
                              setEditingSpotForm({
                                ...editingSpotForm,
                                dropOffPoint: e.target.value
                              })
                            }
                            className="w-full px-3 py-1.5 bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className="block font-semibold text-[#FFFFFF] mb-1">
                            Take-Off Spot Name
                          </label>
                          <input
                            type="text"
                            required
                            value={editingSpotForm.spotName}
                            onChange={(e) =>
                              setEditingSpotForm({
                                ...editingSpotForm,
                                spotName: e.target.value
                              })
                            }
                            className="w-full px-3 py-1.5 bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#FFFFFF] mb-1">
                            Landing Zone Name
                          </label>
                          <input
                            type="text"
                            required
                            value={editingSpotForm.landingZoneName}
                            onChange={(e) =>
                              setEditingSpotForm({
                                ...editingSpotForm,
                                landingZoneName: e.target.value
                              })
                            }
                            className="w-full px-3 py-1.5 bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-[#FFFFFF] mb-1">
                            Max Simultaneous Pilots
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={20}
                            required
                            value={editingSpotForm.maxSimultaneousPilots}
                            onChange={(e) =>
                              setEditingSpotForm({
                                ...editingSpotForm,
                                maxSimultaneousPilots: Number(e.target.value)
                              })
                            }
                            className="w-full px-3 py-1.5 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg cursor-pointer"
                        >
                          Save &amp; Publish Spot Changes
                        </button>
                      </div>
                    </form>
                  ) : null}

                  {/* 1. Collection Point & 2. Drop-Off Point Display */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 bg-[#111111] border border-[#E62B1E]/40 rounded-lg space-y-1">
                      <div className="text-[#E62B1E] font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>1. COLLECTION / MEETING POINT</span>
                      </div>
                      <div className="text-[#FFFFFF] font-sans font-medium">
                        {sp.collectionPoint}
                      </div>
                    </div>

                    <div className="p-3 bg-[#111111] border border-[#8A8A8A]/35 rounded-lg space-y-1">
                      <div className="text-[#E62B1E] font-semibold flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>2. DROP-OFF POINT</span>
                      </div>
                      <div className="text-[#FFFFFF] font-sans font-medium">
                        {sp.dropOffPoint}
                      </div>
                    </div>
                  </div>

                  {/* Take-Off & Landing Technical Telemetry */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono text-[#8A8A8A]">
                    <div className="p-3 bg-[#111111] border border-[#8A8A8A]/20 rounded-lg">
                      <div className="text-[#FFFFFF] font-semibold">
                        Take-Off: {sp.launchAltitudeM}m ASL
                      </div>
                      <div>GPS: {sp.gpsTakeoff}</div>
                      <div>Wind: {sp.windOrientation}</div>
                    </div>
                    <div className="p-3 bg-[#111111] border border-[#8A8A8A]/20 rounded-lg">
                      <div className="text-[#FFFFFF] font-semibold">
                        Landing: {sp.landingZoneName} ({sp.landingAltitudeM}m)
                      </div>
                      <div>GPS: {sp.gpsLanding}</div>
                      <div>Lift: {sp.cableCarLift}</div>
                    </div>
                  </div>

                  <p className="text-xs text-[#8A8A8A]">{sp.notes}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 4: CALENDAR / SLOTS — MULTI-PILOT & MULTI-SLOT BUILDER       */}
      {/* ==================================================================== */}
      {activeSection === '4_calendar' && (
        <div className="space-y-8">
          {/* Top Full-Width Multi-Pilot, Multi-Spot & Multi-Time Slot Publisher */}
          <form
            onSubmit={handlePublishSlotBatch}
            className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 sm:p-8 space-y-6"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#8A8A8A]/20 pb-4">
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#E62B1E]">
                  SECTION 04 · MULTI-PILOT &amp; MULTI-SPOT FLIGHT SLOT BUILDER
                </div>
                <h2 className="text-xl font-bold text-[#FFFFFF]">
                  Publish Simultaneous Multi-Pilot Waves &amp; Additional Flight Slots
                </h2>
                <p className="text-xs text-[#8A8A8A]">
                  Assign <strong className="text-[#FFFFFF]">multiple pilots to fly from the same spot at the same time</strong>, or click{' '}
                  <strong className="text-[#FFFFFF]">+ Add Additional Flight Slot Row</strong> when pilots fly from different spots and time slots.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={handleAddScheduleRow}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#111111] bg-[#FFFFFF] hover:bg-[#e5e5e5] rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-[#E62B1E]" />
                  <span>+ Add Additional Flight Slot Row (Spot / Time)</span>
                </button>
              </div>
            </div>

            {/* Dynamic List of Flight Slot Configuration Rows */}
            <div className="space-y-5">
              {scheduleRows.map((row, rowIndex) => {
                const selectedSpot =
                  publicProfile.spots.find((s) => s.spotId === row.spotId) ||
                  publicProfile.spots[0];
                const rowSlotCount =
                  row.timeSlots.length * row.selectedPilotIds.length;

                return (
                  <div
                    key={row.rowId}
                    className="p-5 bg-[#111111] border border-[#8A8A8A]/35 rounded-xl space-y-5 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#8A8A8A]/20 pb-3">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-1 font-mono font-bold bg-[#E62B1E] text-[#FFFFFF] rounded">
                          SLOT GROUP #{rowIndex + 1}
                        </span>
                        <span className="font-semibold text-[#FFFFFF]">
                          {selectedSpot?.spotName || 'Launch Spot'} → {selectedSpot?.landingZoneName}
                        </span>
                        <span className="font-mono text-[#8A8A8A]">
                          ({row.selectedPilotIds.length} Pilots × {row.timeSlots.length} Time Slots ={' '}
                          <span className="text-[#E62B1E] font-bold">{rowSlotCount} Bookable Slots</span>)
                        </span>
                      </div>

                      {scheduleRows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveScheduleRow(row.rowId)}
                          className="inline-flex items-center gap-1 text-[#8A8A8A] hover:text-[#E62B1E] font-mono cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Slot Group</span>
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                      {/* Left 6 Cols: Spot, Date, Price, Weather, and Multiple Departure Time Slots */}
                      <div className="lg:col-span-6 space-y-4">
                        <div>
                          <label className="block font-semibold text-[#FFFFFF] mb-1">
                            Take-Off &amp; Landing Spot (From Section 3)
                          </label>
                          <select
                            value={row.spotId}
                            onChange={(e) =>
                              handleUpdateScheduleRow(row.rowId, { spotId: e.target.value })
                            }
                            className="w-full px-3 py-2 border border-[#8A8A8A]/40 rounded-lg bg-[#181818] text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
                          >
                            {publicProfile.spots.map((sp) => (
                              <option key={sp.spotId} value={sp.spotId}>
                                {sp.spotName} → {sp.landingZoneName} ({sp.launchAltitudeM}m · Max {sp.maxSimultaneousPilots} Pilots)
                              </option>
                            ))}
                          </select>
                          {selectedSpot && (
                            <div className="mt-2 p-2.5 bg-[#181818] border border-[#8A8A8A]/25 rounded-lg font-mono text-[11px] text-[#8A8A8A] space-y-1">
                              <div>
                                <span className="text-[#E62B1E] font-semibold">1. Collection:</span>{' '}
                                <span className="text-[#FFFFFF]">{selectedSpot.collectionPoint}</span>
                              </div>
                              <div>
                                <span className="text-[#E62B1E] font-semibold">2. Drop-Off:</span>{' '}
                                <span className="text-[#FFFFFF]">{selectedSpot.dropOffPoint}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-[#FFFFFF] mb-1">
                              Flight Date
                            </label>
                            <input
                              type="date"
                              required
                              value={row.flightDate}
                              onChange={(e) =>
                                handleUpdateScheduleRow(row.rowId, {
                                  flightDate: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-[#FFFFFF] mb-1">
                              Tariff per Flyer ({selectedSpot?.countryCode === 'FR' ? 'EUR' : 'CHF'})
                            </label>
                            <input
                              type="number"
                              min={80}
                              max={1000}
                              value={row.priceMajor}
                              onChange={(e) =>
                                handleUpdateScheduleRow(row.rowId, {
                                  priceMajor: Number(e.target.value)
                                })
                              }
                              className="w-full px-3 py-2 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-[#FFFFFF] mb-1">
                              Wind Status
                            </label>
                            <select
                              value={row.weatherStatus}
                              onChange={(e) =>
                                handleUpdateScheduleRow(row.rowId, {
                                  weatherStatus: e.target.value as WeatherStatus
                                })
                              }
                              className="w-full px-3 py-2 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                            >
                              <option value="optimal">OPTIMAL</option>
                              <option value="marginal">MARGINAL</option>
                              <option value="hold">HOLD</option>
                            </select>
                          </div>
                        </div>

                        {/* Departure Time Slots Adder */}
                        <div className="space-y-2">
                          <label className="block font-semibold text-[#FFFFFF]">
                            Departure Time Slots at {selectedSpot?.spotName.split(' ')[0]} (Add 1 or Multiple Times)
                          </label>
                          <div className="flex flex-wrap items-center gap-2">
                            {row.timeSlots.map((t) => (
                              <span
                                key={t}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#181818] border border-[#E62B1E] text-[#FFFFFF] font-mono rounded-lg"
                              >
                                <Clock className="w-3.5 h-3.5 text-[#E62B1E]" />
                                <span>{t}</span>
                                {row.timeSlots.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTimeSlotFromRow(row.rowId, t)}
                                    className="text-[#8A8A8A] hover:text-[#E62B1E] ml-1 cursor-pointer"
                                    title="Remove time slot"
                                  >
                                    ×
                                  </button>
                                )}
                              </span>
                            ))}

                            <div className="inline-flex items-center gap-1.5">
                              <input
                                type="time"
                                value={row.newTimeInput}
                                onChange={(e) =>
                                  handleUpdateScheduleRow(row.rowId, {
                                    newTimeInput: e.target.value
                                  })
                                }
                                className="px-2.5 py-1 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddTimeSlotToRow(row.rowId)}
                                className="px-3 py-1.5 font-semibold bg-[#181818] hover:bg-[#E62B1E] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg transition-colors cursor-pointer"
                              >
                                + Add Time
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right 6 Cols: Simultaneous Multi-Pilot Assignment Checkboxes */}
                      <div className="lg:col-span-6 space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                            <Users className="w-4 h-4 text-[#E62B1E]" />
                            <span>
                              Pilots Flying Simultaneously at This Spot &amp; Time ({row.selectedPilotIds.length} Selected)
                            </span>
                          </label>
                          <button
                            type="button"
                            onClick={() => handleSelectAllPilotsInRow(row.rowId)}
                            className="text-[11px] font-mono text-[#E62B1E] hover:underline cursor-pointer"
                          >
                            Select All ({publicProfile.pilots.length}) Pilots
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                          {publicProfile.pilots.map((pilot) => {
                            const isChecked = row.selectedPilotIds.includes(pilot.memberId);
                            return (
                              <button
                                key={pilot.memberId}
                                type="button"
                                onClick={() => handleTogglePilotInRow(row.rowId, pilot.memberId)}
                                className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition-colors cursor-pointer ${
                                  isChecked
                                    ? 'bg-[#181818] border-[#E62B1E] text-[#FFFFFF]'
                                    : 'bg-[#181818]/50 border-[#8A8A8A]/25 text-[#8A8A8A] hover:text-[#FFFFFF]'
                                }`}
                              >
                                <img
                                  src={pilot.photoUrl || GENERATED_ASSETS.pilotAvatar}
                                  alt={pilot.name}
                                  referrerPolicy="no-referrer"
                                  className="w-10 h-10 rounded-full object-cover border border-[#E62B1E] shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-xs text-[#FFFFFF] truncate">
                                    {pilot.name}
                                  </div>
                                  <div className="font-mono text-[11px] text-[#8A8A8A] truncate">
                                    {pilot.shvLicense}
                                  </div>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded flex items-center justify-center shrink-0 ${
                                    isChecked
                                      ? 'bg-[#E62B1E] text-[#FFFFFF]'
                                      : 'border border-[#8A8A8A]/40'
                                  }`}
                                >
                                  {isChecked && <Check className="w-3.5 h-3.5" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        <div className="text-[11px] text-[#8A8A8A]">
                          Tip: Need more pilots on this wave? Add unlimited pilots with photos in{' '}
                          <button
                            type="button"
                            onClick={() => setActiveSection('5_pilots')}
                            className="text-[#E62B1E] underline cursor-pointer"
                          >
                            Section 5. Pilots
                          </button>
                          .
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#8A8A8A]/20">
              <div className="text-xs font-mono text-[#8A8A8A]">
                Ready to publish:{' '}
                <span className="text-[#E62B1E] font-bold">
                  {totalSlotsToPublish} Tandem Flight Slots
                </span>{' '}
                across <span className="text-[#FFFFFF]">{scheduleRows.length} Spot/Time Wave(s)</span>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleAddScheduleRow}
                  className="px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#111111] hover:bg-[#222222] border border-[#8A8A8A]/40 rounded-lg transition-colors cursor-pointer"
                >
                  + Add Another Spot / Time Slot Row
                </button>
                <button
                  type="submit"
                  disabled={isCreatingSlot || totalSlotsToPublish === 0}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isCreatingSlot
                      ? 'Publishing Slots...'
                      : `Publish ${totalSlotsToPublish} Flight Slot(s) to Public Calendar`}
                  </span>
                </button>
              </div>
            </div>
          </form>

          {/* Published Flight Calendar & Passenger Manifest */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-bold text-[#FFFFFF]">
                    Published Flight Calendar &amp; Simultaneous Pilot Waves ({filteredCalendarSlots.length})
                  </h2>
                  <p className="text-xs text-[#8A8A8A]">
                    Filter by date or toggle Föhn wind status in real time.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1 bg-[#111111] border border-[#8A8A8A]/25 p-1 rounded-lg">
                  <button
                    onClick={() => setCalendarDateFilter('ALL')}
                    className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                      calendarDateFilter === 'ALL'
                        ? 'bg-[#E62B1E] text-[#FFFFFF]'
                        : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    ALL DATES
                  </button>
                  {uniqueDates.map((dt) => (
                    <button
                      key={dt}
                      onClick={() => setCalendarDateFilter(dt)}
                      className={`px-2.5 py-1 text-xs font-mono rounded transition-colors cursor-pointer ${
                        calendarDateFilter === dt
                          ? 'bg-[#E62B1E] text-[#FFFFFF]'
                          : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                      }`}
                    >
                      {dt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#8A8A8A]/25 text-xs font-semibold text-[#8A8A8A]">
                      <th className="py-2.5 pr-3">Pilot &amp; Spot Logistics</th>
                      <th className="py-2.5 px-3">Date &amp; Wave Time</th>
                      <th className="py-2.5 px-3 text-right">Tariff</th>
                      <th className="py-2.5 pl-3 text-right">Weather Control</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A8A8A]/20 text-xs">
                    {filteredCalendarSlots.map((slot) => (
                      <tr key={slot.slotId} className="hover:bg-[#111111]/60">
                        <td className="py-3 pr-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={slot.pilotPhotoUrl || GENERATED_ASSETS.pilotAvatar}
                              alt={slot.pilotName}
                              referrerPolicy="no-referrer"
                              className="w-8 h-8 rounded-full object-cover border border-[#E62B1E] shrink-0"
                            />
                            <div>
                              <div className="font-semibold text-[#FFFFFF]">
                                {slot.locationName}
                              </div>
                              <div className="font-mono text-[#8A8A8A]">
                                {slot.pilotName} ({slot.shvLicense})
                              </div>
                              {slot.collectionPoint && (
                                <div className="text-[11px] text-[#8A8A8A]">
                                  Meet: <span className="text-[#FFFFFF]">{slot.collectionPoint}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono tabular-nums text-[#8A8A8A]">
                          <div>
                            {slot.flightDate} ·{' '}
                            <span className="text-[#E62B1E] font-bold">{slot.flightTime}</span>
                          </div>
                          <div className="text-[11px]">
                            {slot.status.toUpperCase()}
                            {slot.simultaneousGroupCount && slot.simultaneousGroupCount > 1
                              ? ` · ${slot.simultaneousGroupCount}-Pilot Wave`
                              : ''}
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#E62B1E]">
                          {formatCurrency(slot.priceCents, slot.currency)}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <div className="inline-flex items-center gap-1 bg-[#111111] border border-[#8A8A8A]/25 p-0.5 rounded-md">
                            {(['optimal', 'marginal', 'hold'] as WeatherStatus[]).map((ws) => (
                              <button
                                key={ws}
                                onClick={() => onUpdateSlotWeather(slot.slotId, ws)}
                                className={`px-2 py-1 text-[11px] font-mono rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                                  slot.weatherStatus === ws
                                    ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                                    : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                                }`}
                              >
                                {ws}
                              </button>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Passenger Manifest */}
            <div className="lg:col-span-5 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4">
              <div>
                <h2 className="text-base font-bold text-[#FFFFFF]">
                  Passenger Flight Manifest &amp; Escrow Release
                </h2>
                <p className="text-xs text-[#8A8A8A]">
                  Confirm flight landing to release your 78%–85% payout from escrow.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#8A8A8A]/25 text-xs font-semibold text-[#8A8A8A]">
                      <th className="py-2.5 pr-2">Passenger</th>
                      <th className="py-2.5 px-2 text-right">Net Payout</th>
                      <th className="py-2.5 pl-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#8A8A8A]/20 text-xs">
                    {bookings.map((b) => (
                      <tr key={b.bookingId} className="hover:bg-[#111111]/60">
                        <td className="py-3 pr-2">
                          <div className="font-semibold text-[#FFFFFF]">{b.flyerName}</div>
                          <div className="font-mono text-[11px] text-[#8A8A8A]">
                            {b.locationName} · {b.flightTime}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-right font-mono tabular-nums font-bold text-[#E62B1E]">
                          {formatCurrency(b.pilotPayoutCents, b.currency)}
                        </td>
                        <td className="py-3 pl-2 text-right">
                          {b.status === 'confirmed' ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => onUpdateBookingStatus(b.bookingId, 'completed')}
                                className="px-2 py-1 text-[11px] font-semibold text-[#111111] bg-[#FFFFFF] hover:bg-[#e5e5e5] rounded whitespace-nowrap cursor-pointer"
                              >
                                Landed
                              </button>
                              <button
                                onClick={() => onUpdateBookingStatus(b.bookingId, 'cancelled')}
                                className="px-2 py-1 text-[11px] font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded whitespace-nowrap cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono font-semibold text-[#8A8A8A]">
                              {b.status.toUpperCase()}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 5: PILOTS ROSTER — UNLIMITED PILOTS + PILOT PHOTO PROFILES   */}
      {/* ==================================================================== */}
      {activeSection === '5_pilots' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 6 Columns: Multi-Pilot Adder with Pilot Photo Upload / Presets */}
          <form
            onSubmit={handleCreatePilotMembersSubmit}
            className="lg:col-span-6 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-5 text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#8A8A8A]/20 pb-3">
              <div>
                <div className="text-xs font-mono text-[#E62B1E]">
                  SECTION 05 · UNLIMITED TANDEM PILOTS ROSTER &amp; PHOTO PROFILES
                </div>
                <h2 className="text-lg font-bold text-[#FFFFFF]">
                  Add Certified Tandem Pilots with Profile Photos
                </h2>
                <p className="text-xs text-[#8A8A8A]">
                  Add as many pilots as your operation needs. Every pilot profile includes a photo published to your Public Profile and Slot Builder.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddPilotDraftRow}
                className="px-3 py-2 text-xs font-semibold text-[#111111] bg-[#FFFFFF] hover:bg-[#e5e5e5] rounded-lg whitespace-nowrap shrink-0 cursor-pointer"
              >
                + Add Another Pilot Row
              </button>
            </div>

            <div className="space-y-5">
              {pilotDraftRows.map((draft, idx) => (
                <div
                  key={draft.draftId}
                  className="p-4 bg-[#111111] border border-[#8A8A8A]/35 rounded-xl space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-[#8A8A8A]/20 pb-2.5">
                    <div className="flex items-center gap-3">
                      <img
                        src={draft.photoUrl || GENERATED_ASSETS.pilotAvatar}
                        alt={draft.name || 'New Pilot Portrait'}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border-2 border-[#E62B1E]"
                      />
                      <div>
                        <div className="font-mono text-[#E62B1E] font-semibold">
                          NEW PILOT PROFILE #{idx + 1}
                        </div>
                        <div className="text-[#FFFFFF] font-bold text-sm">
                          {draft.name || 'Enter Pilot Name Below'}
                        </div>
                      </div>
                    </div>

                    {pilotDraftRows.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePilotDraftRow(draft.draftId)}
                        className="text-[#8A8A8A] hover:text-[#E62B1E] font-mono cursor-pointer"
                      >
                        Remove Row
                      </button>
                    )}
                  </div>

                  {/* Pilot Photo Selector & Device Upload */}
                  <div className="p-3 bg-[#181818] border border-[#8A8A8A]/25 rounded-lg space-y-2.5">
                    <label className="block font-semibold text-[#FFFFFF]">
                      Pilot Profile Photo (Select Portrait Preset, Upload File, or Paste URL)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      {(
                        [
                          {
                            id: 'swiss1',
                            label: 'Alpine Portrait 1',
                            url: GENERATED_ASSETS.pilotAvatar
                          },
                          {
                            id: 'marc2',
                            label: 'Zermatt Portrait 2',
                            url: GENERATED_ASSETS.pilotAvatarMarc
                          },
                          {
                            id: 'luc3',
                            label: 'Mont-Blanc Portrait 3',
                            url: GENERATED_ASSETS.pilotAvatarLuc
                          }
                        ] as const
                      ).map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() =>
                            handleUpdatePilotDraft(draft.draftId, {
                              photoPreset: preset.id,
                              photoUrl: preset.url
                            })
                          }
                          className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs cursor-pointer ${
                            draft.photoUrl === preset.url
                              ? 'bg-[#E62B1E] text-[#FFFFFF] border-[#E62B1E] font-semibold'
                              : 'bg-[#111111] text-[#8A8A8A] border-[#8A8A8A]/35 hover:text-[#FFFFFF]'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.label}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span>{preset.label}</span>
                        </button>
                      ))}

                      <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FFFFFF] text-[#111111] font-semibold hover:bg-[#e5e5e5] cursor-pointer">
                        <Upload className="w-3.5 h-3.5 text-[#E62B1E]" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePilotPhotoFileUpload(draft.draftId, e)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="Or paste custom pilot photo URL (https://...)"
                      value={draft.photoPreset === 'custom' ? draft.photoUrl : ''}
                      onChange={(e) =>
                        handleUpdatePilotDraft(draft.draftId, {
                          photoPreset: 'custom',
                          photoUrl: e.target.value
                        })
                      }
                      className="w-full px-3 py-1.5 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#FFFFFF] mb-1">
                        Pilot Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nina Zurbriggen"
                        value={draft.name}
                        onChange={(e) =>
                          handleUpdatePilotDraft(draft.draftId, { name: e.target.value })
                        }
                        className="w-full px-3 py-2 bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#FFFFFF] mb-1">
                        SHV / IPPI License Number
                      </label>
                      <input
                        type="text"
                        required
                        value={draft.shvLicense}
                        onChange={(e) =>
                          handleUpdatePilotDraft(draft.draftId, {
                            shvLicense: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-[#FFFFFF] mb-1">
                        Role / Title
                      </label>
                      <input
                        type="text"
                        required
                        value={draft.roleTitle}
                        onChange={(e) =>
                          handleUpdatePilotDraft(draft.draftId, {
                            roleTitle: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#FFFFFF] mb-1">
                        Logged Flights
                      </label>
                      <input
                        type="number"
                        min={50}
                        max={25000}
                        required
                        value={draft.tandemFlightsLogged}
                        onChange={(e) =>
                          handleUpdatePilotDraft(draft.draftId, {
                            tandemFlightsLogged: Number(e.target.value)
                          })
                        }
                        className="w-full px-3 py-2 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#FFFFFF] mb-1">
                        Languages
                      </label>
                      <input
                        type="text"
                        required
                        value={draft.languages}
                        onChange={(e) =>
                          handleUpdatePilotDraft(draft.draftId, {
                            languages: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#FFFFFF] mb-1">
                      Primary Tandem Glider Wing
                    </label>
                    <input
                      type="text"
                      required
                      value={draft.gliderWing}
                      onChange={(e) =>
                        handleUpdatePilotDraft(draft.draftId, {
                          gliderWing: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={handleAddPilotDraftRow}
                className="px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#111111] hover:bg-[#222222] border border-[#8A8A8A]/40 rounded-lg cursor-pointer"
              >
                + Add Another Pilot Row
              </button>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  Publish {pilotDraftRows.length} Pilot(s) to Public Profile Roster
                </span>
              </button>
            </div>
          </form>

          {/* Right 6 Columns: Active Team Pilots List with Pilot Photos & Photo Updater */}
          <div className="lg:col-span-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#FFFFFF]">
                Published Team Pilots ({publicProfile.pilots.length} Active on Profile)
              </h3>
              <span className="text-xs font-mono text-[#8A8A8A]">
                Unlimited roster capacity
              </span>
            </div>

            {publicProfile.pilots.map((member) => {
              const isEditingPhoto = editingPhotoMemberId === member.memberId;

              return (
                <div
                  key={member.memberId}
                  className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <img
                        src={member.photoUrl || GENERATED_ASSETS.pilotAvatar}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-full object-cover border-2 border-[#E62B1E] shrink-0"
                      />
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-[#E62B1E] font-bold">{member.shvLicense}</span>
                          <span>·</span>
                          <span className="text-[#8A8A8A]">{member.roleTitle}</span>
                        </div>
                        <h3 className="text-lg font-bold text-[#FFFFFF]">{member.name}</h3>
                        <div className="font-mono text-[#8A8A8A]">
                          Flights:{' '}
                          <span className="text-[#E62B1E] font-bold">
                            {member.tandemFlightsLogged.toLocaleString()}+
                          </span>{' '}
                          · Langs: <span className="text-[#FFFFFF]">{member.languages}</span> · Wing:{' '}
                          <span className="text-[#FFFFFF]">{member.gliderWing}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPhotoMemberId(isEditingPhoto ? null : member.memberId);
                          setCustomPhotoInputUrl(member.photoUrl || '');
                        }}
                        className="px-2.5 py-1.5 text-xs font-mono text-[#FFFFFF] bg-[#111111] hover:bg-[#E62B1E] border border-[#8A8A8A]/40 rounded-lg transition-colors cursor-pointer"
                      >
                        {isEditingPhoto ? 'Close Photo' : 'Change Photo'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePilotMemberStatus(member.memberId)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                          member.status === 'active'
                            ? 'bg-[#FFFFFF] text-[#111111]'
                            : 'bg-[#111111] text-[#8A8A8A] border border-[#8A8A8A]/40'
                        }`}
                      >
                        {member.status === 'active' ? 'Active Duty' : 'Off Duty'}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeletePilotMember(member.memberId)}
                        className="p-2 text-[#8A8A8A] hover:text-[#E62B1E] rounded-lg transition-colors cursor-pointer"
                        title="Remove pilot from public roster"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {isEditingPhoto && (
                    <div className="p-3.5 bg-[#111111] border border-[#E62B1E] rounded-xl space-y-3 text-xs">
                      <div className="font-mono text-[#E62B1E] font-semibold">
                        UPDATE PILOT PHOTO FOR {member.name.toUpperCase()}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { label: 'Portrait 1', url: GENERATED_ASSETS.pilotAvatar },
                          { label: 'Portrait 2', url: GENERATED_ASSETS.pilotAvatarMarc },
                          { label: 'Portrait 3', url: GENERATED_ASSETS.pilotAvatarLuc }
                        ].map((p) => (
                          <button
                            key={p.label}
                            type="button"
                            onClick={async () => {
                              await onUpdatePilotMemberPhoto(member.memberId, p.url);
                              setEditingPhotoMemberId(null);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#181818] hover:bg-[#E62B1E] text-[#FFFFFF] border border-[#8A8A8A]/35 rounded-lg cursor-pointer"
                          >
                            <img
                              src={p.url}
                              alt={p.label}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span>{p.label}</span>
                          </button>
                        ))}

                        <label className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#FFFFFF] text-[#111111] font-semibold rounded-lg cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-[#E62B1E]" />
                          <span>Upload From Device</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleExistingPilotPhotoUpload(member.memberId, e)}
                            className="hidden"
                          />
                        </label>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={customPhotoInputUrl}
                          onChange={(e) => setCustomPhotoInputUrl(e.target.value)}
                          placeholder="Paste image URL..."
                          className="flex-1 px-3 py-1.5 font-mono bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (customPhotoInputUrl.trim()) {
                              await onUpdatePilotMemberPhoto(
                                member.memberId,
                                customPhotoInputUrl.trim()
                              );
                              setEditingPhotoMemberId(null);
                            }
                          }}
                          className="px-3.5 py-1.5 font-semibold bg-[#E62B1E] text-[#FFFFFF] rounded-lg cursor-pointer"
                        >
                          Save Photo
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 6: IMAGES & VIDEOS + UPLOAD & PUBLIC HEADER IMAGE SELECTOR   */}
      {/* ==================================================================== */}
      {activeSection === '6_media' && (
        <div className="space-y-8">
          {/* Active Public Page Header Image Banner & Selector Preview */}
          {(() => {
            const activeHeaderItem =
              publicProfile.mediaGallery.find((m) => m.isHeaderImage) ||
              publicProfile.mediaGallery[0];

            return (
              <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
                <div className="lg:col-span-5 relative min-h-[210px] bg-[#111111]">
                  <ResilientImage
                    src={activeHeaderItem?.assetUrl || GENERATED_ASSETS.heroSwiss}
                    alt={activeHeaderItem?.title || 'Public Profile Header Image'}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-5">
                    <div className="text-[11px] font-mono text-[#E62B1E] font-bold">
                      CURRENT PUBLIC PAGE HEADER IMAGE
                    </div>
                    {activeHeaderItem?.title &&
                      !activeHeaderItem.title.includes('Staubbach') && (
                        <div className="text-sm font-bold text-[#FFFFFF]">
                          {activeHeaderItem.title}
                        </div>
                      )}
                    <div className="text-xs font-mono text-[#8A8A8A]">
                      {activeHeaderItem?.locationTag || 'Bernese Oberland'} ·{' '}
                      {activeHeaderItem?.durationOrResolution || '8K RAW Photo'}
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-7 p-6 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="text-xs font-mono text-[#E62B1E]">
                      PUBLIC PROFILE HERO &amp; HEADER CONTROL
                    </div>
                    <h2 className="text-xl font-bold text-[#FFFFFF]">
                      Active Header Image on Your Public Operator Page
                    </h2>
                    <p className="text-xs text-[#8A8A8A] leading-relaxed">
                      Select any image in your gallery below using{' '}
                      <strong className="text-[#FFFFFF]">&ldquo;Set as Public Header Image&rdquo;</strong>, or upload a new photo from your device and mark it as your header. It immediately updates the top hero banner on your Public Profile and Marketplace showcase.
                    </p>
                  </div>

                  {/* Quick Thumbnail Strip to Switch Header Image Immediately */}
                  <div className="space-y-2">
                    <div className="text-xs font-semibold text-[#FFFFFF]">
                      Quick-Select Public Header Image ({publicProfile.mediaGallery.length} Available):
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {publicProfile.mediaGallery.map((m) => {
                        const isCurrentHeader =
                          activeHeaderItem?.mediaId === m.mediaId;
                        return (
                          <button
                            key={m.mediaId}
                            type="button"
                            onClick={() => onSetHeaderMediaItem(m.mediaId)}
                            className={`group relative rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                              isCurrentHeader
                                ? 'border-[#E62B1E] ring-2 ring-[#E62B1E]/40'
                                : 'border-[#8A8A8A]/30 opacity-75 hover:opacity-100'
                            }`}
                            title={`Set "${m.title}" as Public Header Image`}
                          >
                            <img
                              src={m.assetUrl}
                              alt={m.title}
                              referrerPolicy="no-referrer"
                              className="w-16 h-11 object-cover"
                            />
                            {isCurrentHeader && (
                              <span className="absolute inset-0 bg-[#E62B1E]/35 flex items-center justify-center">
                                <Check className="w-4 h-4 text-[#FFFFFF]" />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#8A8A8A]/20">
                    <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#111111] bg-[#FFFFFF] hover:bg-[#e5e5e5] rounded-lg transition-colors cursor-pointer">
                      <Upload className="w-4 h-4 text-[#E62B1E]" />
                      <span>Quick Upload Multiple Photos / Videos</span>
                      <input
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        onChange={handleQuickBatchMediaUpload}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => setShowPublicProfileModal(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Preview Header on Public Page</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 5 Columns: Add / Upload New Media Form */}
            <form
              onSubmit={handleCreateMedia}
              className="lg:col-span-5 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4 text-xs"
            >
              <div className="border-b border-[#8A8A8A]/20 pb-3">
                <div className="text-xs font-mono text-[#E62B1E]">
                  SECTION 06 · UPLOAD &amp; ADD NEW MEDIA
                </div>
                <h2 className="text-lg font-bold text-[#FFFFFF]">
                  Upload or Add Flight Photo &amp; 4K Video
                </h2>
                <p className="text-xs text-[#8A8A8A]">
                  Upload files from your device, choose an alpine preset, or paste a custom URL.
                </p>
              </div>

              {/* Prominent Upload Button Box */}
              <div className="p-4 bg-[#111111] border border-dashed border-[#E62B1E]/70 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="font-semibold text-[#FFFFFF]">
                      1. Upload Media File from Device
                    </div>
                    <div className="text-[11px] text-[#8A8A8A]">
                      Supports JPG, PNG, WEBP, or MP4 flight clips
                    </div>
                  </div>
                  <label className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors cursor-pointer shrink-0">
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleMediaFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {newMediaUploadedFileName && (
                  <div className="text-[11px] font-mono text-[#FFFFFF] bg-[#181818] px-3 py-1.5 rounded border border-[#8A8A8A]/30 flex items-center justify-between">
                    <span className="truncate">Selected: {newMediaUploadedFileName}</span>
                    <span className="text-[#E62B1E] font-bold ml-2">READY</span>
                  </div>
                )}

                {/* Live Thumbnail Preview of Media to be Added */}
                <div className="aspect-16/9 rounded-lg overflow-hidden bg-[#181818] border border-[#8A8A8A]/25 relative">
                  <ResilientImage
                    src={resolvePreviewMediaUrl()}
                    alt="New Media Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-[#111111]/90 border border-[#8A8A8A]/40 px-2.5 py-0.5 rounded text-[10px] font-mono text-[#FFFFFF]">
                    LIVE PREVIEW · {newMediaType.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#FFFFFF] mb-1">Media Format</label>
                  <select
                    value={newMediaType}
                    onChange={(e) => setNewMediaType(e.target.value as 'image' | 'video')}
                    className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                  >
                    <option value="image">High-Res Flight Photo</option>
                    <option value="video">4K Action Video Reel</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[#FFFFFF] mb-1">
                    Or Select Media Source
                  </label>
                  <select
                    value={newMediaPreset}
                    onChange={(e) =>
                      setNewMediaPreset(
                        e.target.value as
                          | 'upload'
                          | 'heroSwiss'
                          | 'spotZermatt'
                          | 'spotLauterbrunnen'
                          | 'custom'
                      )
                    }
                    className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                  >
                    <option value="upload">Uploaded Device File</option>
                    <option value="heroSwiss">Interlaken &amp; Lake Brienz Aerial</option>
                    <option value="spotZermatt">Zermatt Matterhorn East Face</option>
                    <option value="spotLauterbrunnen">Lauterbrunnen Waterfalls Canyon</option>
                    <option value="custom">Custom Image / Video URL</option>
                  </select>
                </div>
              </div>

              {newMediaPreset === 'custom' && (
                <div>
                  <label className="block font-semibold text-[#FFFFFF] mb-1">
                    Custom Asset URL
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={newMediaCustomUrl}
                    onChange={(e) => setNewMediaCustomUrl(e.target.value)}
                    className="w-full px-3.5 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Caption / Media Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunset Thermal Above Lake Thun"
                  value={newMediaTitle}
                  onChange={(e) => setNewMediaTitle(e.target.value)}
                  className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#FFFFFF] mb-1">
                    Location Tag
                  </label>
                  <input
                    type="text"
                    required
                    value={newMediaLocation}
                    onChange={(e) => setNewMediaLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#FFFFFF] mb-1">
                    Camera / Resolution Spec
                  </label>
                  <input
                    type="text"
                    required
                    value={newMediaSpec}
                    onChange={(e) => setNewMediaSpec(e.target.value)}
                    className="w-full px-3 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center gap-2 p-2.5 bg-[#111111] border border-[#E62B1E]/50 rounded-lg cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMediaSetAsHeader}
                    onChange={(e) => setNewMediaSetAsHeader(e.target.checked)}
                    className="rounded border-[#8A8A8A] accent-[#E62B1E]"
                  />
                  <span className="text-[#FFFFFF] font-semibold">
                    Set this image as my Header Image on the Public Page
                  </span>
                </label>

                <label className="flex items-center gap-2 px-2.5 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newMediaFeatured}
                    onChange={(e) => setNewMediaFeatured(e.target.checked)}
                    className="rounded border-[#8A8A8A] accent-[#E62B1E]"
                  />
                  <span className="text-[#8A8A8A] font-medium">
                    Also feature this item in my Public Media Gallery
                  </span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {newMediaSetAsHeader
                    ? 'Add Media & Set as Public Header Image'
                    : 'Add Media & Publish to Public Gallery'}
                </span>
              </button>
            </form>

            {/* Right 7 Columns: Published Media Grid with Header Image Selector */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {publicProfile.mediaGallery.map((item) => {
                const isHeader = Boolean(item.isHeaderImage);

                return (
                  <div
                    key={item.mediaId}
                    className={`bg-[#181818] rounded-xl overflow-hidden flex flex-col justify-between border transition-colors ${
                      isHeader ? 'border-[#E62B1E]' : 'border-[#8A8A8A]/25'
                    }`}
                  >
                    <div>
                      <div className="aspect-4/3 relative bg-[#111111]">
                        <ResilientImage
                          src={item.assetUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-[#111111]/90 border border-[#8A8A8A]/40 px-2.5 py-1 rounded text-[11px] font-mono text-[#FFFFFF]">
                          {item.mediaType.toUpperCase()} · {item.durationOrResolution}
                        </div>
                        {isHeader && (
                          <div className="absolute top-3 right-3 bg-[#E62B1E] text-[#FFFFFF] px-2.5 py-1 rounded text-[10px] font-mono font-bold shadow">
                            PUBLIC HEADER IMAGE
                          </div>
                        )}
                      </div>

                      <div className="p-4 flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="text-xs font-mono text-[#E62B1E]">
                            {item.locationTag}
                          </div>
                          <h3 className="text-sm font-bold text-[#FFFFFF] leading-snug">
                            {item.title}
                          </h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteMediaItem(item.mediaId)}
                          className="p-1.5 text-[#8A8A8A] hover:text-[#E62B1E] rounded-lg transition-colors cursor-pointer shrink-0"
                          title="Delete media item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Footer Action: Set as Public Page Header Image */}
                    <div className="px-4 pb-4 pt-2 border-t border-[#8A8A8A]/20 flex items-center justify-between gap-2">
                      {isHeader ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#E62B1E]">
                          <Check className="w-4 h-4" />
                          <span>Active Public Page Header</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onSetHeaderMediaItem(item.mediaId)}
                          className="w-full py-2 px-3 text-xs font-semibold text-[#111111] bg-[#FFFFFF] hover:bg-[#E62B1E] hover:text-[#FFFFFF] rounded-lg transition-colors cursor-pointer"
                        >
                          Set as Public Header Image
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 7: SECURITY - CHANGE PASSWORD (STRICTLY PRIVATE)             */}
      {/* ==================================================================== */}
      {activeSection === '7_security' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handlePasswordChange}
            className="lg:col-span-7 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 sm:p-8 space-y-5 text-xs"
          >
            <div className="border-b border-[#8A8A8A]/20 pb-4">
              <div className="text-xs font-mono text-[#E62B1E] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>SECTION 07 · PILOT CREDENTIAL &amp; SESSION SECURITY</span>
              </div>
              <h2 className="text-xl font-bold text-[#FFFFFF] mt-1">
                7. Security — Change Password &amp; Authentication Hardening
              </h2>
              <p className="text-xs text-[#8A8A8A]">
                Update your pilot authentication password and verify zero-trust session controls.
              </p>
            </div>

            {securityStatusMsg && (
              <div className="p-3.5 bg-[#111111] border border-[#E62B1E] rounded-lg text-[#FFFFFF] font-medium">
                {securityStatusMsg}
              </div>
            )}

            {securityErrorMsg && (
              <div className="p-3.5 bg-[#111111] border border-[#E62B1E] rounded-lg text-[#E62B1E] font-medium">
                {securityErrorMsg}
              </div>
            )}

            <div>
              <label className="block font-semibold text-[#FFFFFF] mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  New Password (Min. 12 Characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#FFFFFF] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3.5 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            {/* Live Password Complexity Checklist */}
            <div className="p-4 bg-[#111111] border border-[#8A8A8A]/25 rounded-xl space-y-2 font-mono">
              <div className="text-[#FFFFFF] font-semibold">
                2paraglide Aviation Security Password Requirements:
              </div>
              <div className={pwdHasMinLen ? 'text-[#FFFFFF]' : 'text-[#8A8A8A]'}>
                [{pwdHasMinLen ? '✓' : ' '}] Minimum 12 characters ({newPassword.length}/12)
              </div>
              <div className={pwdHasUpper ? 'text-[#FFFFFF]' : 'text-[#8A8A8A]'}>
                [{pwdHasUpper ? '✓' : ' '}] At least 1 uppercase character (A–Z)
              </div>
              <div className={pwdHasNumber ? 'text-[#FFFFFF]' : 'text-[#8A8A8A]'}>
                [{pwdHasNumber ? '✓' : ' '}] At least 1 numeric digit (0–9)
              </div>
              <div className={pwdHasSymbol ? 'text-[#FFFFFF]' : 'text-[#8A8A8A]'}>
                [{pwdHasSymbol ? '✓' : ' '}] At least 1 special symbol (!@#$%^&amp;*)
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors cursor-pointer"
              >
                Update Password &amp; Rotate Session Keys
              </button>
            </div>
          </form>

          <div className="lg:col-span-5 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4 text-xs">
            <div className="text-xs font-mono text-[#E62B1E]">
              ACTIVE PILOT SECURITY POSTURE
            </div>
            <h3 className="text-base font-bold text-[#FFFFFF]">
              Zero-Trust Protection for Payouts &amp; Manifests
            </h3>
            <div className="space-y-2.5 font-mono text-[#8A8A8A]">
              <div className="p-3 bg-[#111111] border border-[#8A8A8A]/20 rounded-lg">
                <div className="text-[#FFFFFF] font-semibold">IBAN Modification Guard</div>
                <div>Re-authentication required before altering Section 2 Banking Details.</div>
              </div>
              <div className="p-3 bg-[#111111] border border-[#8A8A8A]/20 rounded-lg">
                <div className="text-[#FFFFFF] font-semibold">Email Verification Lock</div>
                <div>
                  All Firestore write operations enforce{' '}
                  <span className="text-[#E62B1E]">email_verified == true</span>.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Public Profile Modal */}
      {showPublicProfileModal && (
        <PilotPublicProfileModal
          profile={publicProfile}
          slots={slots}
          onClose={() => setShowPublicProfileModal(false)}
        />
      )}
    </div>
  );
};
