import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  FlightSlotData,
  BookingData,
  QrCampaignData,
  WorkspaceView,
  PilotPublicProfileBundle,
  DigitalWaiverData,
  CreateBookingPayload,
  PilotOperatorRegistrationPayload,
  PartnerRegistrationPayload,
  FlyerFlightLogEntry,
  FlyerLogbookSummary,
  FlyerNotificationItem,
  FlyerAlertPreferences,
  WeatherAlertNotification
} from '../types';
import { GENERATED_ASSETS } from '../data/masterSpecScript';
import {
  calculateEscrowSplit,
  formatCurrency,
  PaymentMethodType,
  validatePartnerCode,
  PartnerVenueType
} from '../lib/validation';
import { ResilientImage } from './ResilientImage';
import { PilotPublicProfileModal } from './PilotPublicProfileModal';
import { DigitalWaiverModal } from './DigitalWaiverModal';
import { generateAndDownloadReceipt } from '../lib/pdfReceipt';
import { FlightSlotsMapVisualization } from './FlightSlotsMapVisualization';
import { QrCodeMatrix } from './QrCodeMatrix';
import { FlyerNotificationCenter } from './FlyerNotificationCenter';
import { FlyerFlightLogbook } from './FlyerFlightLogbook';
import { FlyerLogbookSyncModal } from './FlyerLogbookSyncModal';
import { AppLogo } from './AppLogo';
import {
  ArrowRight,
  Check,
  QrCode,
  X,
  ExternalLink,
  Star,
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  FileText,
  PenTool,
  Type,
  RotateCcw,
  ShieldCheck,
  Lock,
  ChevronRight,
  Download,
  Map as MapIcon,
  LayoutGrid,
  Compass,
  Search,
  Plane,
  Building2,
  UserPlus
} from 'lucide-react';

interface MarketplaceAndFlyerViewProps {
  mode: 'marketplace' | 'flyer_dashboard';
  slots: FlightSlotData[];
  bookings: BookingData[];
  qrCampaigns: QrCampaignData[];
  pilotPublicProfile: PilotPublicProfileBundle;
  activePartnerCode: string;
  onApplyPartnerCode: (code: string) => void;
  onCreateBooking: (params: CreateBookingPayload) => Promise<void>;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onNavigate: (view: WorkspaceView) => void;
  currentUserName: string;
  waivers?: Map<string, DigitalWaiverData>;
  onSubmitWaiver?: (waiver: DigitalWaiverData) => Promise<void>;
  onRegisterPilotOperator?: (data: PilotOperatorRegistrationPayload) => Promise<void>;
  onRegisterPartner?: (data: PartnerRegistrationPayload) => Promise<void>;
  weatherAlerts?: WeatherAlertNotification[];
}

const MarketplaceAndFlyerViewInner: React.FC<MarketplaceAndFlyerViewProps> = ({
  mode,
  slots,
  bookings,
  qrCampaigns,
  pilotPublicProfile,
  activePartnerCode,
  onApplyPartnerCode,
  onCreateBooking,
  onCancelBooking,
  onNavigate,
  currentUserName,
  waivers,
  onSubmitWaiver,
  onRegisterPilotOperator,
  onRegisterPartner,
  weatherAlerts = []
}) => {
  const [countryFilter, setCountryFilter] = useState<'ALL' | 'CH' | 'FR'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<FlightSlotData | null>(null);
  const [selectedDetailsSlot, setSelectedDetailsSlot] = useState<FlightSlotData | null>(null);
  const [showPublicOperatorModal, setShowPublicOperatorModal] = useState<boolean>(false);
  const [activeWaiverBooking, setActiveWaiverBooking] = useState<BookingData | null>(null);
  const [flyerNameInput, setFlyerNameInput] = useState<string>(currentUserName || 'Elena Rossi');
  const [partnerCodeInput, setPartnerCodeInput] = useState<string>(
    activePartnerCode !== 'DIRECT' ? activePartnerCode : 'HOTEL_BELVEDERE_INT'
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('TWINT');
  const [mediaIncluded, setMediaIncluded] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [bookingSuccessId, setBookingSuccessId] = useState<string | null>(null);
  const [slotsDisplayMode, setSlotsDisplayMode] = useState<'combined' | 'map' | 'grid'>('combined');

  // Digital Waiver in Checkout state
  const [checkoutStep, setCheckoutStep] = useState<'details' | 'waiver' | 'payment'>('details');
  const [waiverDob, setWaiverDob] = useState<string>('1996-05-18');
  const [emergencyContactName, setEmergencyContactName] = useState<string>('Marcus Lindqvist');
  const [emergencyContactPhone, setEmergencyContactPhone] = useState<string>('+41 79 382 91 04');
  const [waiverMedical, setWaiverMedical] = useState<boolean>(true);
  const [waiverRisk, setWaiverRisk] = useState<boolean>(true);
  const [waiverLiability, setWaiverLiability] = useState<boolean>(true);
  const [waiverSignatureMode, setWaiverSignatureMode] = useState<'draw' | 'typed'>('draw');
  const [waiverTypedSignature, setWaiverTypedSignature] = useState<string>(currentUserName || 'Elena Rossi');
  const [waiverDrawnData, setWaiverDrawnData] = useState<string>('');
  const [waiverHasDrawn, setWaiverHasDrawn] = useState<boolean>(false);
  const [waiverError, setWaiverError] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const waiverCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // List Your Operation Signup state & handler
  const [showOperatorSignupModal, setShowOperatorSignupModal] = useState<boolean>(false);
  const [signupOperationType, setSignupOperationType] = useState<'commercial_school' | 'independent_tandem'>('commercial_school');
  const [signupCompanyName, setSignupCompanyName] = useState<string>('');
  const [signupLeadPilotName, setSignupLeadPilotName] = useState<string>('');
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupCountryCode, setSignupCountryCode] = useState<string>('CH');
  const [signupLicense, setSignupLicense] = useState<string>('');
  const [signupLocation, setSignupLocation] = useState<string>('Interlaken Beatenberg Amisbühl');
  const [signupInsurance, setSignupInsurance] = useState<string>('AXA Winterthur CHF 5,000,000');
  const [signupSubmitting, setSignupSubmitting] = useState<boolean>(false);
  const [signupError, setSignupError] = useState<string | null>(null);

  const handleOperatorSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError(null);

    if (!signupCompanyName.trim()) {
      setSignupError('Please enter your tandem operation or school name.');
      return;
    }
    if (!signupLeadPilotName.trim()) {
      setSignupError('Please enter the lead pilot full name.');
      return;
    }
    if (!signupEmail.trim() || !signupEmail.includes('@')) {
      setSignupError('Please enter a valid business email address.');
      return;
    }
    if (!signupLicense.trim()) {
      setSignupError('Please enter your SHV or commercial tandem license number.');
      return;
    }

    setSignupSubmitting(true);
    try {
      if (onRegisterPilotOperator) {
        await onRegisterPilotOperator({
          companyName: signupCompanyName.trim(),
          leadPilotName: signupLeadPilotName.trim(),
          email: signupEmail.trim(),
          countryCode: signupCountryCode,
          shvLicense: signupLicense.trim(),
          locationName: signupLocation.trim(),
          insuranceProvider: signupInsurance.trim(),
          operationType: signupOperationType
        });
      }
      setShowOperatorSignupModal(false);
      onNavigate('pilot_dashboard');
    } catch {
      setSignupError('Failed to register operation. Please check your inputs.');
    } finally {
      setSignupSubmitting(false);
    }
  };

  // Become a Partner QR Registration state & handler (routes directly to unique Partner QR dashboard)
  const [showPartnerSignupModal, setShowPartnerSignupModal] = useState<boolean>(false);
  const [partnerVenueName, setPartnerVenueName] = useState<string>('');
  const [partnerVenueType, setPartnerVenueType] = useState<PartnerVenueType>('Hotel');
  const [partnerContactName, setPartnerContactName] = useState<string>('');
  const [partnerEmail, setPartnerEmail] = useState<string>('');
  const [partnerPassword, setPartnerPassword] = useState<string>('');
  const [partnerCodeCustom, setPartnerCodeCustom] = useState<string>('');
  const [partnerRegion, setPartnerRegion] = useState<string>('Interlaken / Jungfrau Region');
  const [partnerCountryCode, setPartnerCountryCode] = useState<'CH' | 'FR' | 'AT' | 'IT'>('CH');
  const [partnerIban, setPartnerIban] = useState<string>('');
  const [partnerSubmitting, setPartnerSubmitting] = useState<boolean>(false);
  const [partnerError, setPartnerError] = useState<string | null>(null);

  const handlePartnerSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPartnerError(null);

    if (!partnerVenueName.trim()) {
      setPartnerError('Please enter your hotel, café, or venue business name.');
      return;
    }
    if (!partnerContactName.trim()) {
      setPartnerError('Please enter the partner contact person or manager name.');
      return;
    }
    if (!partnerEmail.trim() || !partnerEmail.includes('@')) {
      setPartnerError('Please enter a valid business email address.');
      return;
    }

    const resolvedCode = validatePartnerCode(
      partnerCodeCustom ||
      partnerVenueName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 20)
    );

    setPartnerSubmitting(true);
    try {
      if (onRegisterPartner) {
        await onRegisterPartner({
          partnerName: partnerVenueName.trim(),
          partnerType: partnerVenueType,
          contactName: partnerContactName.trim(),
          contactEmail: partnerEmail.trim(),
          partnerCode: resolvedCode,
          region: partnerRegion.trim() || 'Interlaken / Jungfrau Region',
          countryCode: partnerCountryCode,
          ibanOrTwint: partnerIban.trim()
        });
      }
      setShowPartnerSignupModal(false);
      onNavigate('partner_dashboard');
    } catch {
      setPartnerError('Failed to register partner account. Please try again.');
    } finally {
      setPartnerSubmitting(false);
    }
  };

  // Initialize canvas pad when waiver step is active
  useEffect(() => {
    if (selectedSlot && checkoutStep === 'waiver' && waiverSignatureMode === 'draw' && waiverCanvasRef.current) {
      const canvas = waiverCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [selectedSlot, checkoutStep, waiverSignatureMode]);

  const getCanvasCoords = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!waiverCanvasRef.current) return { x: 0, y: 0 };
    const rect = waiverCanvasRef.current.getBoundingClientRect();
    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleStartDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    setIsDrawing(true);
    const { x, y } = getCanvasCoords(e);
    const ctx = waiverCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const handleDrawMove = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    const { x, y } = getCanvasCoords(e);
    const ctx = waiverCanvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      setWaiverHasDrawn(true);
    }
  };

  const handleStopDraw = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (waiverCanvasRef.current) {
      setWaiverDrawnData(waiverCanvasRef.current.toDataURL('image/png'));
    }
  };

  const handleClearPad = () => {
    if (waiverCanvasRef.current) {
      const ctx = waiverCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, waiverCanvasRef.current.width, waiverCanvasRef.current.height);
      }
      setWaiverDrawnData('');
      setWaiverHasDrawn(false);
    }
  };

  // Performance: memoized filtering avoids re-scanning all slots on every render
  // (e.g., while typing in unrelated form fields or drawing the waiver canvas).
  const availableSlots = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return slots.filter((slot) => {
      const matchesCountry = countryFilter === 'ALL' || slot.countryCode === countryFilter;
      const matchesQuery =
        !q ||
        slot.locationName.toLowerCase().includes(q) ||
        slot.pilotName.toLowerCase().includes(q);
      return matchesCountry && matchesQuery;
    });
  }, [slots, countryFilter, searchQuery]);

  // Performance: one pass over bookings for waiver progress stats
  const waiverStats = useMemo(() => {
    let signedCount = 0;
    for (const b of bookings) {
      if (b.waiverSigned || waivers?.has(b.bookingId)) signedCount++;
    }
    return { signedCount, total: bookings.length };
  }, [bookings, waivers]);

  const resolveSlotImage = (slot: FlightSlotData) => {
    if (
      slot.imageKey === 'spotZermatt' ||
      slot.locationName.toLowerCase().includes('zermatt') ||
      slot.locationName.toLowerCase().includes('chamonix')
    ) {
      return GENERATED_ASSETS.spotZermatt;
    }
    if (
      slot.imageKey === 'spotLauterbrunnen' ||
      slot.locationName.toLowerCase().includes('lauterbrunnen')
    ) {
      return GENERATED_ASSETS.spotLauterbrunnen;
    }
    return pilotPublicProfile.mediaGallery[0]?.assetUrl || GENERATED_ASSETS.heroSwiss;
  };

  const handleOpenBookingModal = (slot: FlightSlotData) => {
    setSelectedSlot(slot);
    setCheckoutStep('details');
    setBookingSuccessId(null);
    setWaiverError(null);
    setFlyerNameInput(currentUserName || 'Elena Rossi');
    setWaiverTypedSignature(currentUserName || 'Elena Rossi');
    setPartnerCodeInput(activePartnerCode);
    setPaymentMethod(slot.currency === 'CHF' ? 'TWINT' : 'CARD_3DS');
  };

  const validateDetailsStep = (): boolean => {
    setWaiverError(null);
    if (!flyerNameInput.trim()) {
      setWaiverError('Please provide the passenger full name for the flight manifest.');
      return false;
    }
    if (!emergencyContactName.trim() || !emergencyContactPhone.trim()) {
      setWaiverError('Please provide passenger emergency contact name and phone number.');
      return false;
    }
    return true;
  };

  const validateWaiverStep = (): boolean => {
    setWaiverError(null);
    if (!waiverMedical || !waiverRisk || !waiverLiability) {
      setWaiverError('All three statutory pre-flight legal declarations must be acknowledged.');
      return false;
    }
    if (waiverSignatureMode === 'draw') {
      if (!waiverHasDrawn && !waiverDrawnData) {
        setWaiverError('Please draw your digital signature on the signature pad provided.');
        return false;
      }
    } else {
      if (!waiverTypedSignature.trim()) {
        setWaiverError('Please type your legal full name for electronic signature.');
        return false;
      }
    }
    return true;
  };

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    if (!validateDetailsStep()) {
      setCheckoutStep('details');
      return;
    }

    if (!validateWaiverStep()) {
      setCheckoutStep('waiver');
      return;
    }

    let finalSig = '';
    if (waiverSignatureMode === 'draw') {
      finalSig = waiverDrawnData || (waiverCanvasRef.current ? waiverCanvasRef.current.toDataURL('image/png') : '');
    } else {
      finalSig = waiverTypedSignature.trim();
    }

    setIsSubmitting(true);
    try {
      const cleanPartner = validatePartnerCode(partnerCodeInput);
      onApplyPartnerCode(cleanPartner);
      await onCreateBooking({
        slot: selectedSlot,
        flyerName: flyerNameInput.trim(),
        partnerCode: cleanPartner,
        paymentMethod,
        mediaIncluded,
        waiver: {
          dateOfBirth: waiverDob,
          emergencyContactName: emergencyContactName.trim(),
          emergencyContactPhone: emergencyContactPhone.trim(),
          medicalDeclarationConfirmed: waiverMedical,
          riskAcknowledgmentConfirmed: waiverRisk,
          thirdPartyLiabilityConfirmed: waiverLiability,
          signatureType: waiverSignatureMode,
          signatureData: finalSig
        }
      });
      // Add real-time booking notification
      handleAddNotification({
        id: `conf_notif_${Date.now()}`,
        type: 'booking',
        severity: 'success',
        title: 'Tandem Flight Confirmed in Swiss Escrow',
        message: `Your reservation in ${selectedSlot.locationName} with Pilot ${selectedSlot.pilotName} is confirmed. Funds safely secured in 2paraglide Escrow.`,
        timestamp: 'Just now',
        bookingId: `CONF-${Date.now().toString().slice(-5)}`,
        read: false
      });
      // Automatically route flyer to their dashboard detailing their purchases
      setSelectedSlot(null);
      setBookingSuccessId(null);
      onNavigate('flyer_dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalGrossCents = selectedSlot
    ? selectedSlot.priceCents + (mediaIncluded ? 4000 : 0)
    : 24000;
  const modalSplit = calculateEscrowSplit(
    modalGrossCents,
    validatePartnerCode(partnerCodeInput)
  );

  // PDF Receipt Download state & handler using html2pdf
  const [generatingReceiptId, setGeneratingReceiptId] = useState<string | null>(null);
  const [receiptFeedback, setReceiptFeedback] = useState<string | null>(null);

  const handleDownloadPdfReceipt = async (booking: BookingData) => {
    try {
      setGeneratingReceiptId(booking.bookingId);
      setReceiptFeedback(null);
      await generateAndDownloadReceipt(booking, pilotPublicProfile);
      setReceiptFeedback(
        `Official PDF Receipt for Booking #${booking.bookingId} downloaded successfully.`
      );
      setTimeout(() => setReceiptFeedback(null), 5000);
    } catch (err) {
      console.error('Failed to generate PDF receipt via html2pdf', err);
      setReceiptFeedback('Failed to generate PDF receipt. Please try again.');
      setTimeout(() => setReceiptFeedback(null), 5000);
    } finally {
      setGeneratingReceiptId(null);
    }
  };

  // -------------------------------------------------------------
  // FLYER PARAGLIDING FLIGHT LOGBOOK & AIRTIME TELEMETRY STATE
  // -------------------------------------------------------------
  const INITIAL_FLYER_LOGS: FlyerFlightLogEntry[] = [
    {
      logId: 'seed_log_1',
      flightDate: '2026-09-18',
      takeoffSite: 'Interlaken Beatenberg Amisbühl (1,350m)',
      landingZone: 'Höhematte Central Field (567m)',
      gliderWing: 'Advance BiBeta 6 (Tandem 41m²)',
      durationMinutes: 52,
      maxAltitudeM: 2180,
      distanceKm: 15.6,
      flightType: 'Tandem Passenger',
      source: 'Direct 2paraglide',
      notes: 'Alpine tandem flight over Lake Thun and Interlaken with certified pilot',
      syncedAt: '2026-09-18 16:30'
    },
    {
      logId: 'seed_log_2',
      flightDate: '2026-08-30',
      takeoffSite: 'Zermatt Gornergrat (3,135m)',
      landingZone: 'Zermatt Furi Landing (1,867m)',
      gliderWing: 'Advance IOTA DLS (EN-B)',
      durationMinutes: 75,
      maxAltitudeM: 3650,
      distanceKm: 26.4,
      flightType: 'Thermal XC',
      source: 'XContest API',
      notes: 'Matterhorn glacier thermal lift with +3.8 m/s climb',
      syncedAt: '2026-08-30 14:15'
    },
    {
      logId: 'seed_log_3',
      flightDate: '2026-08-14',
      takeoffSite: 'Lauterbrunnen Männlichen (2,229m)',
      landingZone: 'Stechelberg Landing (910m)',
      gliderWing: 'Gin Explorer 2',
      durationMinutes: 58,
      maxAltitudeM: 2420,
      distanceKm: 19.2,
      flightType: 'Solo Alpine',
      source: 'DHV-XC API',
      notes: 'Staubbach falls valley run in smooth morning conditions',
      syncedAt: '2026-08-14 11:45'
    },
    {
      logId: 'seed_log_4',
      flightDate: '2026-07-28',
      takeoffSite: 'Grindelwald First (2,168m)',
      landingZone: 'Bodmi Arena (1,190m)',
      gliderWing: 'Ozone Geo 6',
      durationMinutes: 45,
      maxAltitudeM: 2350,
      distanceKm: 14.1,
      flightType: 'Solo Alpine',
      source: 'Manual CSV',
      notes: 'Eiger north face morning glide',
      syncedAt: '2026-07-28 10:20'
    }
  ];

  const [flyerFlightLogs, setFlyerFlightLogs] = useState<FlyerFlightLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('2paraglide_flyer_flight_logs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_FLYER_LOGS;
  });

  const [connectedLogbookProvider, setConnectedLogbookProvider] = useState<string>(() => {
    return localStorage.getItem('2paraglide_logbook_provider') || 'XContest API & Manual CSV';
  });

  const [isLogbookSyncModalOpen, setIsLogbookSyncModalOpen] = useState(false);

  // Compute live logbook summary and total flight hours
  const totalFlightMinutes = flyerFlightLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
  const flyerLogbookSummary: FlyerLogbookSummary = {
    totalHours: totalFlightMinutes / 60,
    totalFlights: flyerFlightLogs.length,
    longestFlightMins:
      flyerFlightLogs.length > 0
        ? Math.max(...flyerFlightLogs.map((l) => l.durationMinutes))
        : 0,
    maxAltitudeM:
      flyerFlightLogs.length > 0
        ? Math.max(...flyerFlightLogs.map((l) => l.maxAltitudeM || 0))
        : 0,
    lastSyncedAt: new Date().toLocaleDateString() + ' (Synchronized)',
    connectedProvider: connectedLogbookProvider
  };

  const handleImportFlightLogs = (newLogs: FlyerFlightLogEntry[], providerName: string) => {
    setFlyerFlightLogs((prev) => {
      const combined = [...newLogs, ...prev];
      try {
        localStorage.setItem('2paraglide_flyer_flight_logs', JSON.stringify(combined));
        localStorage.setItem('2paraglide_logbook_provider', providerName);
      } catch {}
      return combined;
    });
    setConnectedLogbookProvider(providerName);

    const addedMins = newLogs.reduce((sum, l) => sum + l.durationMinutes, 0);
    const addedHours = (addedMins / 60).toFixed(1);

    handleAddNotification({
      id: `sync_notif_${Date.now()}`,
      type: 'booking',
      severity: 'success',
      title: `Flight Logs Synced via ${providerName}`,
      message: `Successfully synchronized ${newLogs.length} verified flights (+${addedHours} hrs). Your total flight hours are updated.`,
      timestamp: 'Just now',
      read: false
    });
  };

  const handleDeleteFlightLog = (logId: string) => {
    setFlyerFlightLogs((prev) => {
      const updated = prev.filter((l) => l.logId !== logId);
      try {
        localStorage.setItem('2paraglide_flyer_flight_logs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleAddManualFlightLog = (entry: FlyerFlightLogEntry) => {
    setFlyerFlightLogs((prev) => {
      const updated = [entry, ...prev];
      try {
        localStorage.setItem('2paraglide_flyer_flight_logs', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // -------------------------------------------------------------
  // FLYER NOTIFICATION CENTER STATE & REAL-TIME ALERTS
  // -------------------------------------------------------------
  const [alertPreferences, setAlertPreferences] = useState<FlyerAlertPreferences>(() => {
    try {
      const saved = localStorage.getItem('2paraglide_alert_preferences');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      weatherAlerts: true,
      bookingUpdates: true,
      waiverReminders: true,
      pilotBroadcasts: true
    };
  });

  const handleUpdateAlertPreferences = (prefs: FlyerAlertPreferences) => {
    setAlertPreferences(prefs);
    try {
      localStorage.setItem('2paraglide_alert_preferences', JSON.stringify(prefs));
    } catch {}
  };

  const [flyerNotifications, setFlyerNotifications] = useState<FlyerNotificationItem[]>(() => {
    return [
      {
        id: 'notif_welcome_escrow',
        type: 'booking',
        severity: 'info',
        title: 'Escrow Protection Active',
        message: 'All tandem flight payments are held in segregated Swiss Escrow until landing confirmation.',
        timestamp: 'Today at 08:00 CET',
        read: false
      },
      {
        id: 'notif_weather_foehn',
        type: 'weather',
        severity: 'warning',
        title: 'MeteoSwiss Wind Advisory · Interlaken',
        message: 'South Föhn pressure gradient detected across Jungfrau crest. Afternoon launch held for pilot wind shear inspection.',
        timestamp: 'Today at 09:15 CET',
        locationName: 'Interlaken Beatenberg Amisbühl',
        read: false
      },
      {
        id: 'notif_waiver_reminder',
        type: 'waiver',
        severity: 'warning',
        title: 'Pre-Flight Legal Waiver Required',
        message: 'Statutory SHV digital liability release is required prior to cable car boarding at Höheweg.',
        timestamp: 'Today at 10:30 CET',
        bookingId: 'BK-8902',
        read: false
      },
      {
        id: 'notif_pilot_broadcast',
        type: 'pilot',
        severity: 'success',
        title: 'Pilot Safety Broadcast · Beat Wyss',
        message: 'Thermal window opening at 13:30 CET. Meet at Höheweg 95 Flight Desk / Interlaken Ost.',
        timestamp: 'Today at 11:00 CET',
        locationName: 'Interlaken Ost',
        read: false
      }
    ];
  });

  const handleAddNotification = (item: FlyerNotificationItem) => {
    setFlyerNotifications((prev) => [item, ...prev]);
  };

  const handleDismissNotification = (id: string) => {
    setFlyerNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleMarkNotificationAsRead = (id: string) => {
    setFlyerNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllNotificationsAsRead = () => {
    setFlyerNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAllNotifications = () => {
    setFlyerNotifications([]);
  };

  const handleSimulateAlert = () => {
    const sampleAlerts: FlyerNotificationItem[] = [
      {
        id: `sim_alert_${Date.now()}_1`,
        type: 'weather',
        severity: 'critical',
        title: 'Live Alpine Weather Alert: Föhn Gust Warning',
        message: 'Wind gusts exceeding 35 km/h at Beatenberg launch. Flights temporarily held for pilot safety review.',
        timestamp: 'Just now',
        locationName: 'Interlaken Beatenberg',
        read: false
      },
      {
        id: `sim_alert_${Date.now()}_2`,
        type: 'booking',
        severity: 'success',
        title: 'Escrow Settlement Released',
        message: 'Tandem Flight confirmed. Escrow released: 78% Pilot Payout · 10% Partner Commission.',
        timestamp: 'Just now',
        read: false
      },
      {
        id: `sim_alert_${Date.now()}_3`,
        type: 'pilot',
        severity: 'info',
        title: 'Pilot Broadcast from Zermatt Cockpit',
        message: 'Gornergrat launch conditions optimal (+2.8 m/s climb rate). Matterhorn panoramic flight cleared.',
        timestamp: 'Just now',
        locationName: 'Zermatt Gornergrat',
        read: false
      }
    ];

    const pick = sampleAlerts[Math.floor(Math.random() * sampleAlerts.length)];
    handleAddNotification(pick);
  };

  // Synchronize incoming weather alerts into Flyer Notification Center
  useEffect(() => {
    if (weatherAlerts && weatherAlerts.length > 0) {
      setFlyerNotifications((prev) => {
        const existingIds = new Set(prev.map((n) => n.id));
        const newNotifs: FlyerNotificationItem[] = [];

        weatherAlerts.forEach((alert) => {
          if (!existingIds.has(alert.alertId)) {
            newNotifs.push({
              id: alert.alertId,
              type: 'weather',
              severity:
                alert.status === 'unsafe' || alert.status === 'hold'
                  ? 'critical'
                  : 'warning',
              title: `MeteoSwiss Alert: ${alert.status.toUpperCase()} at ${alert.locationName}`,
              message:
                alert.reason ||
                `Weather status updated to ${alert.status.toUpperCase()} affecting ${alert.affectedSlotsCount} slot(s).`,
              timestamp: alert.triggeredAt || 'Recent',
              locationName: alert.locationName,
              read: false
            });
          }
        });

        if (newNotifs.length > 0) {
          return [...newNotifs, ...prev];
        }
        return prev;
      });
    }
  }, [weatherAlerts]);

  // Interactive Flight Slots Discovery & Spatial Map Section
  const flightSlotsSection = (
    <section id="flight-slots-section" className="w-full space-y-6">
      <div className="max-w-[1280px] mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#8A8A8A]/25 pb-4">
          <div>
            <h2 className="text-xl font-bold text-[#FFFFFF] tracking-wide">
              SEARCH YOUR AREA
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Highlighted Search Bar */}
            <div className="relative flex items-center w-full sm:w-80">
              <div className="flex items-center w-full bg-[#181818] border-2 border-[#E62B1E] rounded-xl px-3 py-1.5 shadow-[0_0_15px_rgba(230,43,30,0.3)] ring-1 ring-[#E62B1E]/40 focus-within:ring-2 focus-within:ring-[#E62B1E] focus-within:shadow-[0_0_20px_rgba(230,43,30,0.5)] transition-all">
                <Search className="w-4 h-4 text-[#E62B1E] mr-2 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Interlaken, Zermatt, pilot, region..."
                  className="w-full bg-transparent text-xs text-[#FFFFFF] placeholder-[#8A8A8A] focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[#8A8A8A] hover:text-[#FFFFFF] ml-1.5 p-0.5 cursor-pointer"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* View Mode Switcher: Combined / Map / Grid */}
            <div className="flex items-center gap-1 p-1 bg-[#181818] border border-[#8A8A8A]/25 rounded-lg text-xs font-mono">
              <button
                onClick={() => setSlotsDisplayMode('combined')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  slotsDisplayMode === 'combined'
                    ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                    : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
                title="View interactive spatial map and slot cards together"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Map + Grid</span>
              </button>
              <button
                onClick={() => setSlotsDisplayMode('map')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  slotsDisplayMode === 'map'
                    ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                    : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
                title="View full interactive spatial map with launch sites & landing zones"
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Map Only</span>
              </button>
              <button
                onClick={() => setSlotsDisplayMode('grid')}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center gap-1.5 cursor-pointer ${
                  slotsDisplayMode === 'grid'
                    ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                    : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
                title="View flight slots cards grid"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Cards Only</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Spatial Map Visualization (Leaflet) - Full Screen Width */}
      {(slotsDisplayMode === 'combined' || slotsDisplayMode === 'map') && (
        <div className="w-full">
          <FlightSlotsMapVisualization
            slots={availableSlots}
            onSelectSlotToBook={handleOpenBookingModal}
            selectedSlotId={selectedSlot?.slotId}
          />
        </div>
      )}

      {/* Slot Cards Grid */}
      {(slotsDisplayMode === 'combined' || slotsDisplayMode === 'grid') && (
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {availableSlots.map((slot) => (
          <div
            key={slot.slotId}
            className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="aspect-4/3 relative overflow-hidden bg-[#111111]">
                <ResilientImage
                  src={resolveSlotImage(slot)}
                  alt={slot.locationName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-5 space-y-3">
                {/* Pilot Photo + Google Rating + Unboxed clean metadata per Zero-Pill rule */}
                <div className="text-xs text-[#8A8A8A] flex items-center justify-between gap-3 font-mono">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={
                        slot.pilotPhotoUrl ||
                        pilotPublicProfile.pilots.find((p) => p.name === slot.pilotName)
                          ?.photoUrl ||
                        GENERATED_ASSETS.pilotAvatar
                      }
                      alt={slot.pilotName}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover border-2 border-[#E62B1E] shrink-0 shadow-sm"
                    />
                    <div className="truncate">
                      <span className="text-[#FFFFFF] text-sm font-semibold">{slot.pilotName}</span>
                    </div>
                  </div>
                </div>

                {/* Auto-Pulled Google Maps Rating Row on Flight Slot / Pilot Card */}
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 bg-[#111111] border border-[#E62B1E]/35 rounded-lg text-xs font-mono">
                  <div className="flex items-center gap-1.5 text-[#FFFFFF]">
                    <Star className="w-3.5 h-3.5 text-[#E62B1E] fill-[#E62B1E] shrink-0" />
                    <span className="font-bold">
                      {(
                        slot.googleRating ||
                        pilotPublicProfile.businessInfo.googleRating ||
                        4.9
                      ).toFixed(1)}
                    </span>
                    <span className="text-[#8A8A8A]">
                      ({slot.googleReviewCount || pilotPublicProfile.businessInfo.googleReviewCount || 348} Google)
                    </span>
                  </div>
                  {pilotPublicProfile.businessInfo.googleMapsUrl && (
                    <a
                      href={pilotPublicProfile.businessInfo.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-[#E62B1E] hover:underline shrink-0"
                    >
                      Maps ★
                    </a>
                  )}
                </div>

                <div className="text-xs font-mono space-y-1">
                  <div className="text-xs text-[#8A8A8A] font-medium truncate">
                    {pilotPublicProfile.businessInfo.companyName || 'Swiss Paragliding Interlaken AG'}
                  </div>
                  <div className="text-sm font-bold text-[#FFFFFF] leading-snug">
                    {slot.locationName || 'Interlaken Beatenberg Amisbühl'}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 border-t border-[#8A8A8A]/20">
              <button
                type="button"
                onClick={() => {
                  setSelectedDetailsSlot(slot);
                  setShowPublicOperatorModal(true);
                }}
                className="w-full py-2.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap text-center bg-[#111111] hover:bg-[#222222] text-[#FFFFFF] border border-[#8A8A8A]/35 hover:border-[#E62B1E] cursor-pointer"
              >
                Details
              </button>
            </div>
          </div>
        ))}
          </div>
        </div>
      )}

      {/* List Your Tandem Paragliding Operation (Directly below pilot cards) */}
      <div className="max-w-[1280px] mx-auto px-6 pt-3 pb-4">
        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-2xl p-6 sm:p-8 lg:p-10 relative overflow-hidden space-y-8 shadow-xl">
          {/* Top header & headline */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#8A8A8A]/20 pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-[#E62B1E] font-semibold">
                <Building2 className="w-4 h-4" />
                <span>COMMERCIAL OPERATOR &amp; PILOT NETWORK · SWISS &amp; EUROPEAN ALPS</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] tracking-tight uppercase">
                List Your Tandem Paragliding Operation
              </h3>
              <p className="text-sm text-[#8A8A8A] leading-relaxed">
                Connect your alpine tandem operation with flyers and hotel QR partners across Switzerland and the European Alps.
                Enjoy guaranteed 78% escrow settlements released directly to your IBAN upon landing, statutory digital pre-flight liability waivers, and live weather rescheduling.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setShowOperatorSignupModal(true)}
                className="px-6 py-3.5 bg-[#E62B1E] hover:bg-[#c82317] text-[#FFFFFF] font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(230,43,30,0.4)] hover:shadow-[0_0_25px_rgba(230,43,30,0.6)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Join &amp; List Your Operation</span>
              </button>
            </div>
          </div>

          {/* 4 Feature Value Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-[#111111] border border-[#8A8A8A]/20 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-[#FFFFFF] font-semibold text-xs">
                <ShieldCheck className="w-4 h-4 text-[#E62B1E]" />
                <span>Guaranteed Escrow Payouts</span>
              </div>
              <p className="text-[11px] text-[#8A8A8A] leading-relaxed font-mono">
                78% pilot settlement released immediately post-landing via Swiss IBAN with zero chargeback risk.
              </p>
            </div>

            <div className="p-4 bg-[#111111] border border-[#8A8A8A]/20 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-[#FFFFFF] font-semibold text-xs">
                <FileCheck2 className="w-4 h-4 text-[#E62B1E]" />
                <span>Pre-Flight Digital Waivers</span>
              </div>
              <p className="text-[11px] text-[#8A8A8A] leading-relaxed font-mono">
                Passengers sign statutory Swiss SHV liability releases on mobile before launch, stored in Firestore.
              </p>
            </div>

            <div className="p-4 bg-[#111111] border border-[#8A8A8A]/20 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-[#FFFFFF] font-semibold text-xs">
                <Compass className="w-4 h-4 text-[#E62B1E]" />
                <span>Airspace &amp; Spot Radar</span>
              </div>
              <p className="text-[11px] text-[#8A8A8A] leading-relaxed font-mono">
                Publish custom launch zones and landing points with live GPS telemetry and Google rating pull-through.
              </p>
            </div>

            <div className="p-4 bg-[#111111] border border-[#8A8A8A]/20 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2 text-[#FFFFFF] font-semibold text-xs">
                <QrCode className="w-4 h-4 text-[#E62B1E]" />
                <span>Hotel &amp; Café QR Network</span>
              </div>
              <p className="text-[11px] text-[#8A8A8A] leading-relaxed font-mono">
                Attract bookings from partner hotels and tourist desks with automated 10% attribution commissions.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Become a Partner Section (Promote 2paraglide via QR Codes) */}
      <div className="max-w-[1280px] mx-auto px-6 pt-3 pb-8">
        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-2xl p-6 sm:p-8 lg:p-10 relative overflow-hidden space-y-8 shadow-xl">
          {/* Top header & headline */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[#8A8A8A]/20 pb-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2 text-xs font-mono text-[#E62B1E] font-semibold">
                <QrCode className="w-4 h-4" />
                <span>HOSPITALITY &amp; TOURISM AFFILIATE PROGRAM · 10% ATTRIBUTION COMMISSION</span>
              </div>
              <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-[#FFFFFF] tracking-tight uppercase">
                Become a Partner
              </h3>
              <p className="text-sm text-[#8A8A8A] leading-relaxed">
                Join and promote 2paraglide via QR codes. Display elegant acrylic QR standees at your hotel reception desk, café counter, or tourism lounge. Earn an automated 10% commission on every tandem paragliding booking credited directly to your venue.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                type="button"
                onClick={() => setShowPartnerSignupModal(true)}
                className="px-6 py-3.5 bg-[#E62B1E] hover:bg-[#c82317] text-[#FFFFFF] font-bold text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(230,43,30,0.4)] hover:shadow-[0_0_25px_rgba(230,43,30,0.6)] flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Join &amp; Become a Partner</span>
              </button>
            </div>
          </div>

          {/* Interactive QR Standee Teaser Preview + 4 Value Pillars */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            {/* Live Acrylic Standee Preview Teaser */}
            <div className="lg:col-span-5 bg-[#111111] border border-[#8A8A8A]/25 rounded-2xl p-6 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between border-b border-[#8A8A8A]/20 pb-3">
                <div className="text-xs font-mono text-[#8A8A8A] flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>PREVIEW: ACRYLIC TABLE STANDEE</span>
                </div>
                <span className="text-[10px] font-mono text-[#E62B1E] bg-[#E62B1E]/10 border border-[#E62B1E]/30 px-2 py-0.5 rounded font-bold">
                  10% COMMISSION
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 py-2">
                <div className="p-3 bg-[#181818] border border-[#8A8A8A]/30 rounded-xl shrink-0 shadow-inner flex flex-col items-center">
                  <QrCodeMatrix value="https://2paraglide.com/?ref=HOTEL_BELVEDERE_INT" size={120} />
                  <span className="text-[9px] font-mono text-[#8A8A8A] mt-2 tracking-widest">
                    SCAN TO FLY
                  </span>
                </div>

                <div className="space-y-2 text-left min-w-0">
                  <div className="text-xs text-[#E62B1E] font-mono font-semibold">
                    YOUR VENUE QR CODE
                  </div>
                  <h4 className="text-base font-bold text-[#FFFFFF] leading-snug">
                    Grand Hotel Belvedere
                  </h4>
                  <p className="text-xs text-[#8A8A8A] leading-relaxed">
                    Guests scan this custom code to browse local alpine slots. Your venue automatically receives 10% (approx. CHF 24–40) upon completed flight.
                  </p>
                  <div className="text-[11px] font-mono text-emerald-400">
                    Active Code: <span className="font-bold underline">HOTEL_BELVEDERE_INT</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[#8A8A8A]/20 flex items-center justify-between text-xs font-mono text-[#8A8A8A]">
                <span>Printable Standee: SVG &amp; PDF</span>
                <button
                  type="button"
                  onClick={() => setShowPartnerSignupModal(true)}
                  className="text-[#E62B1E] hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                >
                  <span>Claim Your QR Standee →</span>
                </button>
              </div>
            </div>

            {/* 4 Feature Value Pillars */}
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#111111] border border-[#8A8A8A]/20 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#FFFFFF] font-semibold text-xs">
                    <ShieldCheck className="w-4 h-4 text-[#E62B1E]" />
                    <span>10% Guaranteed Commission</span>
                  </div>
                  <p className="text-[11px] text-[#8A8A8A] leading-relaxed font-mono">
                    1000 bps automated escrow split released directly to your hotel or café CH-IBAN / SEPA account per completed flight.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-[#E62B1E] pt-2">CHF 24 – 40 PER PASSENGER</div>
              </div>

              <div className="p-4 bg-[#111111] border border-[#8A8A8A]/20 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#FFFFFF] font-semibold text-xs">
                    <QrCode className="w-4 h-4 text-[#E62B1E]" />
                    <span>Instant Print-Ready Standees</span>
                  </div>
                  <p className="text-[11px] text-[#8A8A8A] leading-relaxed font-mono">
                    Download custom high-res vector acrylic table standees (SVG) ready for front desk, breakfast lounge, or room keycard inserts.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 pt-2">INSTANT VECTOR DOWNLOAD</div>
              </div>

              <div className="p-4 bg-[#111111] border border-[#8A8A8A]/20 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#FFFFFF] font-semibold text-xs">
                    <Compass className="w-4 h-4 text-[#E62B1E]" />
                    <span>Real-Time Scan Telemetry</span>
                  </div>
                  <p className="text-[11px] text-[#8A8A8A] leading-relaxed font-mono">
                    Live Partner Dashboard displays guest scans, booked flights, conversion rates, and ledger receipts with zero guesswork.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-[#E62B1E] pt-2">LIVE METRICS &amp; CONVERSIONS</div>
              </div>

              <div className="p-4 bg-[#111111] border border-[#8A8A8A]/20 rounded-xl space-y-1.5 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-[#FFFFFF] font-semibold text-xs">
                    <FileCheck2 className="w-4 h-4 text-[#E62B1E]" />
                    <span>Zero Effort &amp; Full Pilot Care</span>
                  </div>
                  <p className="text-[11px] text-[#8A8A8A] leading-relaxed font-mono">
                    Licensed SHV / FSVL tandem pilots manage all equipment, weather checks, digital waivers, and insurance manifests.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 pt-2">100% SHV COMPLIANT</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="space-y-12 pb-16">
      {/* Grand Swiss Alps Tandem Hero Section Directly Below Navigation Bar */}
      {mode === 'marketplace' && (
        <section className="relative w-full border-b border-[#8A8A8A]/25 overflow-hidden">
          <div className="relative min-h-[540px] sm:min-h-[600px] lg:min-h-[660px] flex items-center">
            {/* High quality image of a tandem paragliding flight above the Swiss Alps */}
            <ResilientImage
              src={GENERATED_ASSETS.heroSwissAlpsTandem}
              fallbackSrc={GENERATED_ASSETS.heroSwissAlpsTandemFallback}
              alt="High quality tandem paragliding flight above the Swiss Alps - 2paraglide"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Image Overlay Reduced to 10% Opacity */}
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />

            <div className="relative z-10 max-w-[1280px] mx-auto px-6 py-16 sm:py-20 lg:py-24 w-full">
              <div className="max-w-3xl space-y-6 [text-shadow:_0_2px_10px_rgb(0_0_0_/_80%)]">
                {/* Alpine Trust & Authority Badges */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono font-medium text-[#8A8A8A]">
                  <AppLogo size="xs" showText={false} />
                  <span className="px-2.5 py-1 bg-[#E62B1E] text-[#FFFFFF] font-bold rounded">2PARAGLIDE</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#FFFFFF]">SWITZERLAND COMMERCIAL TANDEM OPERATIONS</span>
                  <span aria-hidden="true">·</span>
                  <span>SHV / FSVL &amp; BAZL COMPLIANT</span>
                </div>

                {/* H1: fly the swiss alps */}
                <h1 className="font-display text-4xl sm:text-6xl md:text-7xl lg:text-[76px] font-extrabold tracking-tight text-[#FFFFFF] uppercase leading-[0.95]">
                  fly the swiss alps
                </h1>

                {/* H2: Book certified pilots instantly. */}
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[#FFFFFF] flex flex-wrap items-center gap-3">
                  <span>Book certified pilots instantly.</span>
                </h2>

                {/* Alpine Flight Hubs Indicator */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <span className="text-xs font-mono text-[#8A8A8A]">
                    Interlaken · Zermatt · Lauterbrunnen · Chamonix
                  </span>
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center gap-3.5 pt-3">
                  <a
                    href="#flight-slots-section"
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 text-sm font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors whitespace-nowrap shadow-lg cursor-pointer"
                  >
                    <span>Browse Available Tandem Flights</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Interactive Flight Slots Discovery & Landing Zones Spatial Map Section (Directly Below Hero Section on Home Page) */}
      {mode === 'marketplace' && flightSlotsSection}



      {/* 3. Flyer Dashboard Header & Boarding Passes (Only in Flyer Dashboard view) */}
      {mode === 'flyer_dashboard' && (
        <section className="max-w-[1280px] mx-auto px-6 pt-6 pb-14 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#8A8A8A]/25 pb-5">
            <div className="space-y-1">
              <div className="text-xs font-mono text-[#E62B1E]">
                DASHBOARD 03 · PERSONAL FLYER DASHBOARD
              </div>
              <h2 className="text-2xl font-bold text-[#FFFFFF]">
                Your Active Tandem Flight Reservations
              </h2>
              <p className="text-sm text-[#8A8A8A]">
                Review your confirmed boarding passes, purchase details, digital legal liability waivers, and escrow receipts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
              <button
                onClick={() => onNavigate('marketplace')}
                className="px-3.5 py-2 bg-[#E62B1E] hover:bg-[#c82317] text-[#FFFFFF] font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>+ Book Another Flight</span>
              </button>
              {bookings.length > 0 && (
                <div className="px-3 py-1.5 bg-[#181818] border border-[#8A8A8A]/30 rounded-lg flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-[#E62B1E]" />
                  <span className="text-[#8A8A8A]">Waivers Signed:</span>
                  <span className="text-[#FFFFFF] font-bold">
                    {waiverStats.signedCount} / {waiverStats.total}
                  </span>
                </div>
              )}
              <span className="text-[#8A8A8A]">
                Active Referral Token: <span className="text-[#E62B1E] font-semibold">{activePartnerCode}</span>
              </span>
            </div>
          </div>

          {/* PDF Receipt Generation Feedback Banner */}
          {receiptFeedback && (
            <div className="p-3.5 bg-emerald-500/15 border border-emerald-500/50 rounded-xl text-xs text-emerald-400 flex items-center justify-between gap-3 font-mono">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{receiptFeedback}</span>
              </div>
              <button
                onClick={() => setReceiptFeedback(null)}
                className="text-xs text-emerald-400/80 hover:text-emerald-400 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* 1. Flyer Notification Center: Real-Time Booking Updates & Weather Alerts with Alert Toggles */}
          <FlyerNotificationCenter
            notifications={flyerNotifications}
            preferences={alertPreferences}
            onUpdatePreferences={handleUpdateAlertPreferences}
            onDismissNotification={handleDismissNotification}
            onMarkAsRead={handleMarkNotificationAsRead}
            onMarkAllAsRead={handleMarkAllNotificationsAsRead}
            onClearAll={handleClearAllNotifications}
            onSimulateAlert={handleSimulateAlert}
          />

          {bookings.length === 0 ? (
            <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-2xl p-10 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-[#111111] border border-[#8A8A8A]/30 mx-auto flex items-center justify-center text-[#E62B1E]">
                <Plane className="w-6 h-6" />
              </div>
              <div className="text-base font-semibold text-[#FFFFFF]">
                No Tandem Flights Booked Yet
              </div>
              <p className="text-xs text-[#8A8A8A] max-w-md mx-auto leading-relaxed">
                You do not have any active flight reservations. Browse verified Swiss and European flight slots on the marketplace to reserve your tandem flight with TWINT or Card escrow protection.
              </p>
              <button
                onClick={() => onNavigate('marketplace')}
                className="px-5 py-2.5 bg-[#E62B1E] hover:bg-[#c82317] text-[#FFFFFF] text-xs font-bold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2 shadow-md"
              >
                <span>Search Available Flight Slots →</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {bookings.map((b) => {
                const isWaiverSigned = Boolean(b.waiverSigned || waivers?.has(b.bookingId));

                return (
                  <div
                    key={b.bookingId}
                    className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-5 flex flex-col justify-between space-y-4 shadow-lg"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs text-[#8A8A8A] font-mono">
                        <span className="text-[#E62B1E] font-semibold">#{b.bookingId}</span>
                        <span className={b.status === 'completed' ? 'text-emerald-400 font-bold' : 'text-[#FFFFFF]'}>
                          {b.status === 'completed'
                            ? 'COMPLETED · ESCROW SETTLED'
                            : b.status === 'cancelled'
                            ? 'CANCELLED · REFUNDED'
                            : 'CONFIRMED · IN ESCROW'}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-[#FFFFFF]">{b.locationName}</h3>

                      <div className="text-xs text-[#8A8A8A] space-y-1">
                        <div>
                          Passenger: <span className="font-medium text-[#FFFFFF]">{b.flyerName}</span> ·
                          Pilot: <span className="font-medium text-[#FFFFFF]">{b.pilotName}</span>
                        </div>
                        <div className="font-mono tabular-nums text-[#8A8A8A]">
                          {b.flightDate} at {b.flightTime} · {b.paymentMethod} ·{' '}
                          {b.mediaIncluded ? '4K Media Included' : 'Flight Only'}
                        </div>
                        <div className="font-mono text-[#8A8A8A]">
                          Partner Attribution: <span className="text-[#FFFFFF]">{b.partnerCode}</span>
                        </div>
                      </div>

                      {/* Pre-Flight Digital Waiver Status Banner */}
                      <div className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2.5 ${
                        isWaiverSigned
                          ? 'bg-[#111111] border-emerald-500/40'
                          : 'bg-[#111111] border-[#E62B1E]/40'
                      }`}>
                        <div className="flex items-center gap-2 min-w-0">
                          {isWaiverSigned ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-[#E62B1E] shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className={`font-semibold truncate ${
                              isWaiverSigned ? 'text-emerald-400' : 'text-[#FFFFFF]'
                            }`}>
                              {isWaiverSigned ? 'Digital Waiver Signed' : 'Legal Waiver Required'}
                            </div>
                            <div className="text-[11px] font-mono text-[#8A8A8A] truncate">
                              {isWaiverSigned ? 'Clearance on File' : 'Sign before launch'}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => setActiveWaiverBooking(b)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            isWaiverSigned
                              ? 'bg-[#181818] hover:bg-[#222222] text-[#FFFFFF] border border-[#8A8A8A]/30'
                              : 'bg-[#E62B1E] hover:bg-[#c82317] text-[#FFFFFF]'
                          }`}
                        >
                          {isWaiverSigned ? 'View Release' : 'Sign Waiver'}
                        </button>
                      </div>

                      {/* For Completed bookings: Escrow Payment Split & Receipt Summary */}
                      {b.status === 'completed' && (
                        <div className="p-3 bg-[#111111] border border-emerald-500/35 rounded-xl text-xs font-mono space-y-1.5">
                          <div className="flex items-center justify-between text-emerald-400 font-semibold text-[11px]">
                            <span>ESCROW SETTLEMENT SPLIT</span>
                            <span>✓ Verified Settled</span>
                          </div>
                          <div className="text-[11px] text-[#8A8A8A] flex items-center justify-between">
                            <span>Pilot Payout ({b.pilotName}):</span>
                            <span className="text-[#FFFFFF] font-medium">{formatCurrency(b.pilotPayoutCents, b.currency)}</span>
                          </div>
                          <div className="text-[11px] text-[#8A8A8A] flex items-center justify-between">
                            <span>Partner Attribution ({b.partnerCode}):</span>
                            <span className="text-[#FFFFFF] font-medium">{formatCurrency(b.partnerCommissionCents, b.currency)}</span>
                          </div>
                          <div className="text-[11px] text-[#8A8A8A] flex items-center justify-between">
                            <span>Platform &amp; Insurance Fee:</span>
                            <span className="text-[#E62B1E] font-medium">{formatCurrency(b.platformFeeCents, b.currency)}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#8A8A8A]/20 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-xs text-[#8A8A8A]">Total Paid</div>
                        <div className="text-sm font-bold font-mono tabular-nums text-[#E62B1E]">
                          {formatCurrency(b.totalAmountCents, b.currency)}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Download Receipt Button for Completed Bookings via html2pdf */}
                        {b.status === 'completed' && (
                          <button
                            onClick={() => handleDownloadPdfReceipt(b)}
                            disabled={generatingReceiptId === b.bookingId}
                            className="px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Download professional PDF receipt containing booking ID, partner attribution, and payment split summary"
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {generatingReceiptId === b.bookingId ? 'Generating PDF...' : 'Download Receipt'}
                            </span>
                          </button>
                        )}

                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => onCancelBooking(b.bookingId)}
                            className="px-3 py-1.5 text-xs font-medium text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#E62B1E] border border-[#8A8A8A]/40 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Cancel Reservation
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. Synced Paragliding Logbook & Airtime Telemetry (External API + Manual CSV) */}
          <FlyerFlightLogbook
            entries={flyerFlightLogs}
            summary={flyerLogbookSummary}
            onOpenSyncModal={() => setIsLogbookSyncModalOpen(true)}
            onAddManualEntry={handleAddManualFlightLog}
            onDeleteEntry={handleDeleteFlightLog}
          />
        </section>
      )}

      {/* Public Operator & Pilot Profile Modal */}
      {showPublicOperatorModal && (
        <PilotPublicProfileModal
          profile={pilotPublicProfile}
          slots={slots}
          initialSlot={selectedDetailsSlot}
          onClose={() => {
            setShowPublicOperatorModal(false);
            setSelectedDetailsSlot(null);
          }}
          onSelectSlotToBook={(slot) => handleOpenBookingModal(slot)}
        />
      )}

      {/* Digital Waiver Signing Modal */}
      {activeWaiverBooking && (
        <DigitalWaiverModal
          booking={activeWaiverBooking}
          existingWaiver={waivers?.get(activeWaiverBooking.bookingId) || null}
          insuranceProvider={pilotPublicProfile.businessInfo.insuranceProvider}
          coverageAmount={pilotPublicProfile.businessInfo.coverageAmount}
          onClose={() => setActiveWaiverBooking(null)}
          onSubmitWaiver={async (waiver) => {
            if (onSubmitWaiver) {
              await onSubmitWaiver(waiver);
            }
            setActiveWaiverBooking(null);
          }}
        />
      )}

      {/* Checkout & Digital Waiver Escrow Modal */}
      {selectedSlot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-[#8A8A8A]/40 rounded-2xl max-w-2xl w-full p-6 sm:p-7 space-y-5 shadow-2xl my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-[#8A8A8A]/25 pb-4 shrink-0">
              <div className="flex items-start gap-3">
                <AppLogo size="sm" showText={false} className="mt-0.5" />
                <div>
                  <div className="text-xs font-mono text-[#E62B1E] flex items-center gap-1.5 font-semibold">
                    <ShieldCheck className="w-4 h-4" />
                    <span>2PARAGLIDE ESCROW CHECKOUT &amp; PRE-FLIGHT WAIVER ({selectedSlot.currency})</span>
                  </div>
                  <h3 className="text-xl font-bold text-[#FFFFFF] mt-0.5">{selectedSlot.locationName}</h3>
                  <div className="text-xs text-[#8A8A8A] font-mono mt-0.5">
                    Pilot: <span className="text-[#FFFFFF]">{selectedSlot.pilotName}</span> ({selectedSlot.shvLicense}) · {selectedSlot.flightDate} at {selectedSlot.flightTime}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedSlot(null)}
                className="p-1.5 text-[#8A8A8A] hover:text-[#FFFFFF] rounded-lg cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccessId ? (
              /* Booking & Waiver Success Screen */
              <div className="space-y-5 py-2 overflow-y-auto">
                <div className="p-4 bg-[#111111] border border-[#E62B1E] rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-[#8A8A8A]/20 pb-2">
                    <AppLogo size="sm" showText={true} />
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                      OFFICIAL ESCROW RECEIPT
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[#FFFFFF] font-bold text-sm">
                    <Check className="w-4 h-4 text-[#E62B1E]" />
                    <span>Escrow Reservation Confirmed ({bookingSuccessId})</span>
                  </div>
                  <p className="text-xs text-[#8A8A8A] leading-relaxed">
                    Your tandem flight reservation with {selectedSlot.pilotName} is confirmed. Funds are held safely
                    in 2paraglide Swiss Escrow and will only be released after landing.
                  </p>
                </div>

                <div className="p-4 bg-[#111111] border border-emerald-500/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Pre-Flight Digital Legal Waiver Signed &amp; Stored in Firestore</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      100% PRE-FLIGHT CLEARED
                    </span>
                  </div>
                  <p className="text-xs text-[#8A8A8A] leading-relaxed">
                    Your statutory liability release and emergency contacts have been saved directly to Firestore (/waivers).
                    Your pilot and insurance manifest are notified of your flight clearance.
                  </p>
                  <div className="pt-2 border-t border-[#8A8A8A]/20 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono text-[#8A8A8A]">
                    <div>Passenger: <span className="text-[#FFFFFF]">{flyerNameInput}</span></div>
                    <div>DOB: <span className="text-[#FFFFFF]">{waiverDob}</span></div>
                    <div>Emergency Contact: <span className="text-[#FFFFFF]">{emergencyContactName} ({emergencyContactPhone})</span></div>
                    <div>Insurance: <span className="text-[#FFFFFF]">AXA Winterthur CHF 5M</span></div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedSlot(null);
                      onNavigate('flyer_dashboard');
                    }}
                    className="px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] rounded-lg hover:bg-[#c82317] cursor-pointer whitespace-nowrap shrink-0"
                  >
                    View in Flyer Dashboard &amp; Boarding Pass
                  </button>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-[#8A8A8A] hover:text-[#FFFFFF] border border-[#8A8A8A]/30 rounded-lg cursor-pointer whitespace-nowrap shrink-0"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 overflow-y-auto pr-1 flex-1">
                {/* 3-Step Progress Navigation Header */}
                <div className="grid grid-cols-3 gap-2 text-xs font-mono border-b border-[#8A8A8A]/20 pb-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('details')}
                    className={`py-2 px-2.5 rounded-lg border text-left transition-colors flex items-center gap-1.5 cursor-pointer ${
                      checkoutStep === 'details'
                        ? 'border-[#E62B1E] bg-[#E62B1E]/10 text-[#FFFFFF] font-bold'
                        : 'border-[#8A8A8A]/20 text-[#8A8A8A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#111111] flex items-center justify-center text-[10px] shrink-0 border border-current">
                      1
                    </span>
                    <span className="truncate">Passenger Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validateDetailsStep()) {
                        setCheckoutStep('waiver');
                      }
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-left transition-colors flex items-center gap-1.5 cursor-pointer ${
                      checkoutStep === 'waiver'
                        ? 'border-[#E62B1E] bg-[#E62B1E]/10 text-[#FFFFFF] font-bold'
                        : waiverHasDrawn || waiverTypedSignature.trim()
                        ? 'border-emerald-500/40 text-emerald-400'
                        : 'border-[#8A8A8A]/20 text-[#8A8A8A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#111111] flex items-center justify-center text-[10px] shrink-0 border border-current">
                      2
                    </span>
                    <span className="truncate">Digital Waiver</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (validateDetailsStep() && validateWaiverStep()) {
                        setCheckoutStep('payment');
                      }
                    }}
                    className={`py-2 px-2.5 rounded-lg border text-left transition-colors flex items-center gap-1.5 cursor-pointer ${
                      checkoutStep === 'payment'
                        ? 'border-[#E62B1E] bg-[#E62B1E]/10 text-[#FFFFFF] font-bold'
                        : 'border-[#8A8A8A]/20 text-[#8A8A8A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <span className="w-5 h-5 rounded-full bg-[#111111] flex items-center justify-center text-[10px] shrink-0 border border-current">
                      3
                    </span>
                    <span className="truncate">Escrow &amp; Pay</span>
                  </button>
                </div>

                {/* Validation Error Banner */}
                {waiverError && (
                  <div className="p-3 bg-[#E62B1E]/15 border border-[#E62B1E]/60 rounded-xl text-xs text-[#FFFFFF] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#E62B1E] shrink-0" />
                    <span>{waiverError}</span>
                  </div>
                )}

                {/* STEP 1: Passenger & Reservation Details */}
                {checkoutStep === 'details' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#FFFFFF] mb-1">
                        Passenger Legal Full Name (For SHV Flight Manifest &amp; Legal Waiver)
                      </label>
                      <input
                        type="text"
                        required
                        maxLength={80}
                        value={flyerNameInput}
                        onChange={(e) => {
                          setFlyerNameInput(e.target.value);
                          if (!waiverTypedSignature || waiverTypedSignature === flyerNameInput) {
                            setWaiverTypedSignature(e.target.value);
                          }
                        }}
                        placeholder="e.g. Elena Rossi"
                        className="w-full px-3.5 py-2 text-sm bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#FFFFFF] mb-1">
                          Date of Birth (Manifest)
                        </label>
                        <input
                          type="date"
                          value={waiverDob}
                          onChange={(e) => setWaiverDob(e.target.value)}
                          className="w-full px-3 py-2 text-xs bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#FFFFFF] mb-1">
                          Emergency Contact Name
                        </label>
                        <input
                          type="text"
                          value={emergencyContactName}
                          onChange={(e) => setEmergencyContactName(e.target.value)}
                          placeholder="e.g. Marcus Lindqvist"
                          className="w-full px-3 py-2 text-xs bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[#FFFFFF] mb-1">
                          Emergency Phone
                        </label>
                        <input
                          type="text"
                          value={emergencyContactPhone}
                          onChange={(e) => setEmergencyContactPhone(e.target.value)}
                          placeholder="+41 79 382 91 04"
                          className="w-full px-3 py-2 text-xs bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[#FFFFFF] mb-1">
                          Partner QR Referral Code
                        </label>
                        <input
                          type="text"
                          maxLength={40}
                          value={partnerCodeInput}
                          onChange={(e) => setPartnerCodeInput(e.target.value)}
                          placeholder="HOTEL_BELVEDERE_INT or DIRECT"
                          className="w-full px-3.5 py-2 text-xs font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#FFFFFF] mb-1">
                          Payment Method
                        </label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                          className="w-full px-3 py-2 text-xs font-medium border border-[#8A8A8A]/40 rounded-lg bg-[#111111] text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
                        >
                          <option value="TWINT">Swiss TWINT Instant QR</option>
                          <option value="CARD_3DS">Credit / Debit Card (3DS2)</option>
                          <option value="APPLE_PAY">Apple Pay</option>
                          <option value="SEPA">SEPA Instant (EUR)</option>
                        </select>
                      </div>
                    </div>

                    <label className="flex items-center justify-between p-3 bg-[#111111] border border-[#8A8A8A]/30 rounded-lg cursor-pointer">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={mediaIncluded}
                          onChange={(e) => setMediaIncluded(e.target.checked)}
                          className="rounded border-[#8A8A8A] accent-[#E62B1E]"
                        />
                        <span className="text-xs font-medium text-[#FFFFFF]">
                          Add In-Flight GoPro 4K Photos &amp; Edited Reel
                        </span>
                      </div>
                      <span className="text-xs font-mono font-semibold text-[#E62B1E] tabular-nums">
                        +{formatCurrency(4000, selectedSlot.currency)}
                      </span>
                    </label>

                    {/* Navigation Footer for Step 1 */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#8A8A8A]/20">
                      <button
                        type="button"
                        onClick={() => setSelectedSlot(null)}
                        className="px-4 py-2 text-xs font-semibold text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateDetailsStep()) {
                            setCheckoutStep('waiver');
                          }
                        }}
                        className="px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        <span>Continue to Digital Waiver</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: Digital Legal Liability Waiver */}
                {checkoutStep === 'waiver' && (
                  <div className="space-y-4">
                    {/* Legal Context Header */}
                    <div className="p-3 bg-[#111111] border border-[#8A8A8A]/25 rounded-xl space-y-1">
                      <div className="text-[11px] font-mono text-[#E62B1E] font-semibold flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4" />
                        <span>BAZL / FOCA &amp; SHV COMPLIANT LEGAL RELEASE · AXA CHF 5,000,000</span>
                      </div>
                      <div className="text-xs text-[#8A8A8A]">
                        Scheduled Tandem Flight with Pilot <span className="text-[#FFFFFF] font-semibold">{selectedSlot.pilotName}</span> at <span className="text-[#FFFFFF]">{selectedSlot.locationName}</span> on <span className="text-[#FFFFFF]">{selectedSlot.flightDate} @ {selectedSlot.flightTime}</span>.
                      </div>
                    </div>

                    {/* Three Statutory Checkbox Declarations */}
                    <div className="space-y-2.5 text-xs">
                      <label className="flex items-start gap-3 p-3 bg-[#111111] border border-[#8A8A8A]/25 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waiverMedical}
                          onChange={(e) => setWaiverMedical(e.target.checked)}
                          className="mt-0.5 rounded border-[#8A8A8A] accent-[#E62B1E] shrink-0"
                        />
                        <span className="text-[#8A8A8A] leading-relaxed">
                          <strong className="text-[#FFFFFF]">1. Medical Fitness Declaration:</strong> I declare that I am physically and mentally fit for a tandem paragliding flight, weigh under 105 kg, and do not suffer from acute cardiovascular diseases, epilepsy, or recent spinal conditions that could impair takeoff or landing.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-[#111111] border border-[#8A8A8A]/25 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waiverRisk}
                          onChange={(e) => setWaiverRisk(e.target.checked)}
                          className="mt-0.5 rounded border-[#8A8A8A] accent-[#E62B1E] shrink-0"
                        />
                        <span className="text-[#8A8A8A] leading-relaxed">
                          <strong className="text-[#FFFFFF]">2. Alpine Risk Acknowledgment:</strong> I acknowledge the natural risks inherent to alpine free-flight paragliding (unforeseen thermals, turbulence, rough terrain landings) and agree to follow all instructions issued by the SHV-certified tandem pilot.
                        </span>
                      </label>

                      <label className="flex items-start gap-3 p-3 bg-[#111111] border border-[#8A8A8A]/25 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={waiverLiability}
                          onChange={(e) => setWaiverLiability(e.target.checked)}
                          className="mt-0.5 rounded border-[#8A8A8A] accent-[#E62B1E] shrink-0"
                        />
                        <span className="text-[#8A8A8A] leading-relaxed">
                          <strong className="text-[#FFFFFF]">3. Third-Party Liability &amp; Insurance:</strong> I confirm passenger coverage under Swiss Aviation Law (LFG/BAZL) and the pilot's commercial insurance policy ({pilotPublicProfile.businessInfo.insuranceProvider || 'AXA Winterthur Aviation Switzerland'}, {pilotPublicProfile.businessInfo.coverageAmount || 'CHF 5,000,000'}).
                        </span>
                      </label>
                    </div>

                    {/* Interactive Digital Signature Pad & Mode Toggle */}
                    <div className="p-4 bg-[#111111] border border-[#8A8A8A]/30 rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-[#FFFFFF] flex items-center gap-1.5">
                          <PenTool className="w-4 h-4 text-[#E62B1E]" />
                          <span>Passenger Digital Legal Signature</span>
                        </span>

                        <div className="flex items-center gap-1 bg-[#181818] p-1 border border-[#8A8A8A]/25 rounded-lg text-xs">
                          <button
                            type="button"
                            onClick={() => setWaiverSignatureMode('draw')}
                            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                              waiverSignatureMode === 'draw'
                                ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                                : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                            }`}
                          >
                            Draw Signature
                          </button>
                          <button
                            type="button"
                            onClick={() => setWaiverSignatureMode('typed')}
                            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                              waiverSignatureMode === 'typed'
                                ? 'bg-[#E62B1E] text-[#FFFFFF] font-semibold'
                                : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                            }`}
                          >
                            Type Legal Name
                          </button>
                        </div>
                      </div>

                      {waiverSignatureMode === 'draw' ? (
                        <div className="space-y-2">
                          <div className="relative border-2 border-dashed border-[#8A8A8A]/40 rounded-lg overflow-hidden bg-[#181818]">
                            <canvas
                              ref={waiverCanvasRef}
                              width={580}
                              height={110}
                              onMouseDown={handleStartDraw}
                              onMouseMove={handleDrawMove}
                              onMouseUp={handleStopDraw}
                              onMouseLeave={handleStopDraw}
                              onTouchStart={handleStartDraw}
                              onTouchMove={handleDrawMove}
                              onTouchEnd={handleStopDraw}
                              className="w-full h-28 touch-none cursor-crosshair block"
                            />
                            {!waiverHasDrawn && !waiverDrawnData && (
                              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs font-mono text-[#8A8A8A]/60">
                                Draw your signature on pad with finger or mouse
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <button
                              type="button"
                              onClick={handleClearPad}
                              className="text-[#8A8A8A] hover:text-[#FFFFFF] flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>Clear Signature Pad</span>
                            </button>
                            <span className={waiverHasDrawn || waiverDrawnData ? 'text-emerald-400 font-semibold' : 'text-[#8A8A8A]'}>
                              {waiverHasDrawn || waiverDrawnData ? '✓ Signature Drawn' : 'Signature Required'}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={waiverTypedSignature}
                            onChange={(e) => setWaiverTypedSignature(e.target.value)}
                            placeholder="Type your legal full name"
                            className="w-full px-3.5 py-2 text-sm bg-[#181818] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                          />
                          {waiverTypedSignature.trim() && (
                            <div className="p-2.5 bg-[#181818] border border-[#8A8A8A]/20 rounded-lg text-center">
                              <span className="font-serif italic text-lg text-emerald-400 tracking-wider">
                                {waiverTypedSignature}
                              </span>
                              <div className="text-[10px] font-mono text-[#8A8A8A] mt-0.5">
                                Electronic Signature · {new Date().toISOString().slice(0, 10)}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Ready Indicator */}
                      {waiverMedical && waiverRisk && waiverLiability && (waiverHasDrawn || waiverTypedSignature.trim()) && (
                        <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg flex items-center gap-2 text-xs text-emerald-400">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Waiver Complete · Ready to save to Firestore upon Escrow Authorization</span>
                        </div>
                      )}
                    </div>

                    {/* Navigation Footer for Step 2 */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#8A8A8A]/20">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('details')}
                        className="px-4 py-2 text-xs font-semibold text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
                      >
                        ← Back to Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (validateWaiverStep()) {
                            setCheckoutStep('payment');
                          }
                        }}
                        className="px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors flex items-center gap-2 cursor-pointer shadow-lg"
                      >
                        <span>Accept Waiver &amp; Continue to Pay</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 3: Escrow Authorization & Payment */}
                {checkoutStep === 'payment' && (
                  <form onSubmit={handleConfirmBooking} className="space-y-4">
                    {/* Pre-Flight Clearance & Passenger Summary Card */}
                    <div className="p-4 bg-[#111111] border border-emerald-500/40 rounded-xl space-y-2 text-xs font-mono">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Pre-Flight Clearance Complete</span>
                        </div>
                        <span className="text-[10px] text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded">
                          LEGAL WAIVER ON FILE
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[#8A8A8A]">
                        <div>Passenger: <span className="text-[#FFFFFF] font-semibold">{flyerNameInput}</span></div>
                        <div>DOB: <span className="text-[#FFFFFF]">{waiverDob}</span></div>
                        <div>Emergency: <span className="text-[#FFFFFF]">{emergencyContactName}</span></div>
                        <div>Signature: <span className="text-[#FFFFFF]">{waiverSignatureMode === 'draw' ? 'Drawn on Canvas' : `"${waiverTypedSignature}"`}</span></div>
                      </div>
                    </div>

                    {/* Payment Method Selector Review */}
                    <div className="p-3 bg-[#111111] border border-[#8A8A8A]/25 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[#8A8A8A] block text-[10px] font-mono">PAYMENT METHOD</span>
                        <span className="font-semibold text-[#FFFFFF]">{paymentMethod}</span>
                      </div>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodType)}
                        className="px-3 py-1.5 text-xs font-medium border border-[#8A8A8A]/40 rounded-lg bg-[#181818] text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
                      >
                        <option value="TWINT">Swiss TWINT Instant QR</option>
                        <option value="CARD_3DS">Credit / Debit Card (3DS2)</option>
                        <option value="APPLE_PAY">Apple Pay</option>
                        <option value="SEPA">SEPA Instant (EUR)</option>
                      </select>
                    </div>

                    {/* Live 3-Way Escrow Breakdown */}
                    <div className="p-4 bg-[#111111] border border-[#8A8A8A]/25 rounded-xl space-y-2 text-xs">
                      <div className="font-semibold text-[#FFFFFF] flex items-center justify-between pb-1 border-b border-[#8A8A8A]/20">
                        <span>Total Escrow Charge</span>
                        <span className="font-mono text-base tabular-nums text-[#E62B1E] font-bold">
                          {formatCurrency(modalSplit.totalAmountCents, selectedSlot.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#8A8A8A]">
                        <span>Pilot Escrow Allocation ({selectedSlot.pilotName})</span>
                        <span className="font-mono tabular-nums text-[#FFFFFF]">
                          {formatCurrency(modalSplit.pilotPayoutCents, selectedSlot.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#8A8A8A]">
                        <span>
                          QR Partner Attribution ({validatePartnerCode(partnerCodeInput)})
                        </span>
                        <span className="font-mono tabular-nums text-[#FFFFFF]">
                          {formatCurrency(modalSplit.partnerCommissionCents, selectedSlot.currency)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[#8A8A8A]">
                        <span>2paraglide Platform &amp; Aviation Insurance Fee</span>
                        <span className="font-mono tabular-nums text-[#E62B1E]">
                          {formatCurrency(modalSplit.platformFeeCents, selectedSlot.currency)}
                        </span>
                      </div>
                    </div>

                    <div className="text-[11px] text-[#8A8A8A] flex items-center gap-1.5 leading-relaxed font-mono">
                      <Lock className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>
                        Protected by 2paraglide Escrow. Funds are released to pilot only post-landing. Pre-flight waiver stored in Firestore.
                      </span>
                    </div>

                    {/* Navigation Footer for Step 3 */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#8A8A8A]/20">
                      <button
                        type="button"
                        onClick={() => setCheckoutStep('waiver')}
                        className="px-4 py-2 text-xs font-semibold text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
                      >
                        ← Review Legal Waiver
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-5 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors cursor-pointer flex items-center gap-2 shadow-lg"
                      >
                        <Lock className="w-4 h-4" />
                        <span>
                          {isSubmitting
                            ? 'Authorizing Escrow & Registering Waiver...'
                            : `Authorize ${formatCurrency(modalSplit.totalAmountCents, selectedSlot.currency)} via ${paymentMethod}`}
                        </span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Operator Signup Modal */}
      {showOperatorSignupModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-[#8A8A8A]/40 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-start justify-between gap-4 border-b border-[#8A8A8A]/25 pb-4 shrink-0">
              <div>
                <div className="text-xs font-mono text-[#E62B1E] flex items-center gap-1.5 font-semibold">
                  <Building2 className="w-4 h-4" />
                  <span>OPERATOR &amp; PILOT REGISTRATION</span>
                </div>
                <h3 className="text-xl font-bold text-[#FFFFFF] mt-0.5">
                  List Your Tandem Paragliding Operation
                </h3>
                <p className="text-xs text-[#8A8A8A] mt-1">
                  Create your commercial tandem account. On completion, you will be automatically routed to your Operator Cockpit to configure flight slots, schedules, team pilots, and bank payout details.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOperatorSignupModal(false)}
                className="p-1.5 text-[#8A8A8A] hover:text-[#FFFFFF] rounded-lg cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {signupError && (
              <div className="p-3 bg-red-500/10 border border-[#E62B1E]/40 rounded-xl text-xs text-[#E62B1E] font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{signupError}</span>
              </div>
            )}

            <form onSubmit={handleOperatorSignupSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Operation Type Switcher */}
              <div>
                <label className="block text-xs font-mono text-[#8A8A8A] mb-1.5">
                  ORGANIZATION STRUCTURE
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setSignupOperationType('commercial_school')}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      signupOperationType === 'commercial_school'
                        ? 'border-[#E62B1E] bg-[#E62B1E]/10 text-[#FFFFFF] font-semibold'
                        : 'border-[#8A8A8A]/25 bg-[#111111] text-[#8A8A8A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <div className="font-bold">Flight School / Fleet</div>
                    <div className="text-[10px] text-[#8A8A8A] font-mono mt-0.5">Multi-pilot commercial operator</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSignupOperationType('independent_tandem')}
                    className={`p-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                      signupOperationType === 'independent_tandem'
                        ? 'border-[#E62B1E] bg-[#E62B1E]/10 text-[#FFFFFF] font-semibold'
                        : 'border-[#8A8A8A]/25 bg-[#111111] text-[#8A8A8A] hover:text-[#FFFFFF]'
                    }`}
                  >
                    <div className="font-bold">Independent Pilot</div>
                    <div className="text-[10px] text-[#8A8A8A] font-mono mt-0.5">Certified individual SHV pilot</div>
                  </button>
                </div>
              </div>

              {/* Company / Operation Name */}
              <div>
                <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                  OPERATION / BUSINESS NAME *
                </label>
                <input
                  type="text"
                  required
                  value={signupCompanyName}
                  onChange={(e) => setSignupCompanyName(e.target.value)}
                  placeholder="e.g., Alpine Soaring Interlaken GmbH"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              {/* Lead Pilot Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    LEAD PILOT FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupLeadPilotName}
                    onChange={(e) => setSignupLeadPilotName(e.target.value)}
                    placeholder="e.g., Beat Wyss"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    PILOT / BUSINESS EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="e.g., info@alpinesoaring.ch"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
              </div>

              {/* Password & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    PASSWORD *
                  </label>
                  <input
                    type="password"
                    required
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    OPERATING COUNTRY *
                  </label>
                  <select
                    value={signupCountryCode}
                    onChange={(e) => setSignupCountryCode(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
                  >
                    <option value="CH">Switzerland (SHV / BAZL)</option>
                    <option value="FR">France (FFVL / DGAC)</option>
                    <option value="AT">Austria (ÖAeC)</option>
                    <option value="IT">Italy (AeCI)</option>
                    <option value="DE">Germany (DHV)</option>
                  </select>
                </div>
              </div>

              {/* SHV License & Primary Launch Zone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    COMMERCIAL TANDEM LICENSE *
                  </label>
                  <input
                    type="text"
                    required
                    value={signupLicense}
                    onChange={(e) => setSignupLicense(e.target.value)}
                    placeholder="e.g., SHV-CH-44910"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    PRIMARY LAUNCH ZONE / BASE
                  </label>
                  <input
                    type="text"
                    value={signupLocation}
                    onChange={(e) => setSignupLocation(e.target.value)}
                    placeholder="e.g., Interlaken Beatenberg Amisbühl"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
              </div>

              {/* Third-Party Aviation Liability Insurance */}
              <div>
                <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                  THIRD-PARTY AVIATION LIABILITY COVERAGE
                </label>
                <input
                  type="text"
                  value={signupInsurance}
                  onChange={(e) => setSignupInsurance(e.target.value)}
                  placeholder="e.g., AXA Winterthur CHF 5,000,000"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div className="p-3 bg-[#111111] border border-emerald-500/30 rounded-xl text-xs text-[#8A8A8A] font-mono flex items-center gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Immediate access: You will be routed directly to your Pilot &amp; Operator Dashboard to configure flight slots, pricing, team pilots, and bank payout details.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#8A8A8A]/20">
                <button
                  type="button"
                  onClick={() => setShowOperatorSignupModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={signupSubmitting}
                  className="px-6 py-2.5 text-xs font-bold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {signupSubmitting ? 'Registering Operation...' : 'Complete Sign Up & Open Dashboard →'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Become a Partner Registration Modal */}
      {showPartnerSignupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#181818] border border-[#8A8A8A]/35 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#8A8A8A]/20 pb-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#E62B1E] font-semibold">
                  <QrCode className="w-4 h-4" />
                  <span>PARTNER REGISTRATION · 10% ATTRIBUTION COMMISSION</span>
                </div>
                <h3 className="text-xl font-bold text-[#FFFFFF] mt-1">
                  Join &amp; Promote 2paraglide via QR Codes
                </h3>
                <p className="text-xs text-[#8A8A8A] mt-1">
                  Register your venue. You will be routed directly to your unique Partner QR Dashboard where you can download custom acrylic standees and live referral tracking links.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPartnerSignupModal(false)}
                className="p-1.5 text-[#8A8A8A] hover:text-[#FFFFFF] rounded-lg cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {partnerError && (
              <div className="p-3 bg-red-500/10 border border-[#E62B1E]/40 rounded-xl text-xs text-[#E62B1E] font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{partnerError}</span>
              </div>
            )}

            <form onSubmit={handlePartnerSignupSubmit} className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Venue Type & Country */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    VENUE / BUSINESS TYPE *
                  </label>
                  <select
                    value={partnerVenueType}
                    onChange={(e) => setPartnerVenueType(e.target.value as PartnerVenueType)}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
                  >
                    <option value="Hotel">Hotel / Resort</option>
                    <option value="Coffee Shop">Café / Coffee Shop</option>
                    <option value="Tourism Board">Tourism Board / Info Desk</option>
                    <option value="Hostel">Hostel / Backpacker Lodge</option>
                    <option value="Mountain Railway">Mountain Railway / Station</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    OPERATING COUNTRY *
                  </label>
                  <select
                    value={partnerCountryCode}
                    onChange={(e) => setPartnerCountryCode(e.target.value as 'CH' | 'FR' | 'AT' | 'IT')}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
                  >
                    <option value="CH">Switzerland (CH)</option>
                    <option value="FR">France (FR)</option>
                    <option value="AT">Austria (AT)</option>
                    <option value="IT">Italy (IT)</option>
                  </select>
                </div>
              </div>

              {/* Venue Business Name */}
              <div>
                <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                  VENUE / BUSINESS NAME *
                </label>
                <input
                  type="text"
                  required
                  value={partnerVenueName}
                  onChange={(e) => setPartnerVenueName(e.target.value)}
                  placeholder="e.g., Grand Hotel Belvedere"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              {/* Contact Person Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    CONTACT PERSON / MANAGER *
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerContactName}
                    onChange={(e) => setPartnerContactName(e.target.value)}
                    placeholder="e.g., Marco Bernasconi"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    BUSINESS EMAIL *
                  </label>
                  <input
                    type="email"
                    required
                    value={partnerEmail}
                    onChange={(e) => setPartnerEmail(e.target.value)}
                    placeholder="e.g., concierge@hotelbelvedere.ch"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
              </div>

              {/* Unique Partner Referral Code & Region */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    CUSTOM PARTNER QR CODE
                  </label>
                  <input
                    type="text"
                    value={partnerCodeCustom}
                    onChange={(e) => setPartnerCodeCustom(e.target.value.toUpperCase())}
                    placeholder={
                      partnerVenueName
                        ? partnerVenueName.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 18)
                        : 'e.g., HOTEL_BELVEDERE'
                    }
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 font-mono focus:outline-none focus:border-[#E62B1E]"
                  />
                  <span className="text-[10px] font-mono text-[#8A8A8A] mt-0.5 block">
                    Embedded into your standee &amp; QR link
                  </span>
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                    REGION / HUB
                  </label>
                  <input
                    type="text"
                    value={partnerRegion}
                    onChange={(e) => setPartnerRegion(e.target.value)}
                    placeholder="e.g., Interlaken / Jungfrau Region"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
              </div>

              {/* Commission Payout IBAN / TWINT */}
              <div>
                <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                  PAYOUT IBAN / TWINT (FOR 10% COMMISSION CREDITS)
                </label>
                <input
                  type="text"
                  value={partnerIban}
                  onChange={(e) => setPartnerIban(e.target.value)}
                  placeholder="e.g., CH93 0076 2011 6238 5295 7 or TWINT Mobile"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 font-mono focus:outline-none focus:border-[#E62B1E]"
                />
              </div>

              <div className="p-3 bg-[#111111] border border-emerald-500/30 rounded-xl text-xs text-[#8A8A8A] font-mono flex items-center gap-2 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Immediate access: You will be routed directly to your unique Partner QR Dashboard where your custom QR code standee and referral tracking links are ready.
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#8A8A8A]/20">
                <button
                  type="button"
                  onClick={() => setShowPartnerSignupModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={partnerSubmitting}
                  className="px-6 py-2.5 text-xs font-bold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>
                    {partnerSubmitting ? 'Registering Venue...' : 'Complete Registration & Open Partner QR Dashboard →'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flyer Logbook Synchronization Modal (API & CSV Input) */}
      <FlyerLogbookSyncModal
        isOpen={isLogbookSyncModalOpen}
        onClose={() => setIsLogbookSyncModalOpen(false)}
        onImportLogs={handleImportFlightLogs}
      />
    </div>
  );
};

// Performance: skip re-renders when unrelated App state (toasts, tab switches) changes
export const MarketplaceAndFlyerView = React.memo(MarketplaceAndFlyerViewInner);
