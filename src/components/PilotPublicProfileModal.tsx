import React, { useState, useMemo } from 'react';
import {
  FlightSlotData,
  PilotPublicProfileBundle
} from '../types';
import { formatCurrency } from '../lib/validation';
import { ResilientImage } from './ResilientImage';
import { GENERATED_ASSETS } from '../data/masterSpecScript';
import {
  X,
  MapPin,
  Star,
  ExternalLink,
  Calendar,
  Clock,
  Search,
  Check,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Sun,
  User,
  Plane,
  Building2,
  Image as ImageIcon
} from 'lucide-react';

interface PilotPublicProfileModalProps {
  profile: PilotPublicProfileBundle;
  slots: FlightSlotData[];
  initialSlot?: FlightSlotData | null;
  onClose: () => void;
  onSelectSlotToBook?: (slot: FlightSlotData) => void;
}

const DEPARTURE_TIMES = [
  { time: '08:30', label: 'Early Bird Glide', note: 'Calm morning air & smooth glide' },
  { time: '10:15', label: 'Morning Thermal Ascent', note: 'Developing alpine thermals & high visibility' },
  { time: '11:45', label: 'Peak Altitude Soaring', note: 'Maximum vertical lift & grand panoramas' },
  { time: '13:30', label: 'Afternoon Cross-Country', note: 'Active thermals, high climb rate' },
  { time: '15:15', label: 'Alpine Cruise', note: 'Stable late afternoon mountain lift' },
  { time: '16:45', label: 'Golden Hour Sunset Glide', note: 'Gentle evening air & sunset glow' }
];

export const PilotPublicProfileModal: React.FC<PilotPublicProfileModalProps> = ({
  profile,
  slots,
  initialSlot,
  onClose,
  onSelectSlotToBook
}) => {
  const { businessInfo, spots, pilots, mediaGallery, lastPublishedAt } = profile;
  const availableSlots = useMemo(() => slots.filter((s) => s.status === 'available'), [slots]);

  // Active navigation tab within profile popup
  const [activeTab, setActiveTab] = useState<'calendar' | 'about' | 'spots' | 'pilots' | 'media'>('calendar');

  // Live Calendar State
  const [selectedDate, setSelectedDate] = useState<string>(
    initialSlot?.flightDate || '2026-10-14'
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    initialSlot?.flightTime || '10:15'
  );

  // Selected Spot
  const [selectedSpotId, setSelectedSpotId] = useState<string>(() => {
    if (initialSlot?.locationName) {
      const matched = spots.find((s) => s.spotName === initialSlot.locationName);
      if (matched) return matched.spotId;
    }
    return spots[0]?.spotId || '';
  });

  // Selected Pilot
  const [selectedPilotMemberId, setSelectedPilotMemberId] = useState<string>(() => {
    if (initialSlot?.pilotName) {
      const matched = pilots.find((p) => p.name === initialSlot.pilotName);
      if (matched) return matched.memberId;
    }
    return pilots[0]?.memberId || '';
  });

  // Search keyword for slots / pilots
  const [calendarSearchQuery, setCalendarSearchQuery] = useState<string>('');

  // Month navigation: default October 2026
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(9); // 0-indexed, 9 = October

  const selectedSpot = spots.find((s) => s.spotId === selectedSpotId) || spots[0];
  const selectedPilot = pilots.find((p) => p.memberId === selectedPilotMemberId) || pilots[0];

  const activeHeaderMedia =
    mediaGallery.find((m) => m.isHeaderImage) || mediaGallery[0];

  // Calendar days generation for viewYear/viewMonth
  const calendarDays = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon-first (0-6)
    const totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    const days: Array<{ dayNumber: number; dateString: string; isCurrentMonth: boolean }> = [];

    // Leading padding from prev month
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ dayNumber: 0, dateString: '', isCurrentMonth: false });
    }

    // Days in current month
    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(viewMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      days.push({
        dayNumber: d,
        dateString: `${viewYear}-${monthStr}-${dayStr}`,
        isCurrentMonth: true
      });
    }

    return days;
  }, [viewYear, viewMonth]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1);
      setViewMonth(11);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1);
      setViewMonth(0);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Quick Date Shortcut buttons
  const quickDates = [
    { label: 'Today (Oct 13)', date: '2026-10-13' },
    { label: 'Tomorrow (Oct 14)', date: '2026-10-14' },
    { label: 'Thu, Oct 15', date: '2026-10-15' },
    { label: 'Fri, Oct 16', date: '2026-10-16' },
    { label: 'Sat, Oct 17', date: '2026-10-17' },
    { label: 'Sun, Oct 18', date: '2026-10-18' }
  ];

  // Look up matching slot or craft resolved slot data for booking
  const resolvedSlotForBooking = useMemo<FlightSlotData>(() => {
    // 1. Try to find existing slot matching exact date, time, pilot, spot
    const exact = slots.find(
      (s) =>
        s.flightDate === selectedDate &&
        s.flightTime === selectedTime &&
        s.pilotName === selectedPilot?.name &&
        s.locationName === selectedSpot?.spotName
    );
    if (exact) return exact;

    // 2. Try match date and time
    const dateTimeMatch = slots.find(
      (s) => s.flightDate === selectedDate && s.flightTime === selectedTime
    );
    if (dateTimeMatch) {
      return {
        ...dateTimeMatch,
        pilotName: selectedPilot?.name || dateTimeMatch.pilotName,
        pilotId: selectedPilot?.memberId || dateTimeMatch.pilotId,
        shvLicense: selectedPilot?.shvLicense || dateTimeMatch.shvLicense,
        locationName: selectedSpot?.spotName || dateTimeMatch.locationName,
        launchAltitudeM: selectedSpot?.launchAltitudeM || dateTimeMatch.launchAltitudeM
      };
    }

    // 3. Construct pristine slot ready for instant checkout
    return {
      slotId: `live-${Date.now()}`,
      pilotId: selectedPilot?.memberId || 'pilot-beat-1',
      pilotName: selectedPilot?.name || 'Beat Wyss',
      shvLicense: selectedPilot?.shvLicense || 'SHV-CH-449',
      locationName: selectedSpot?.spotName || 'Interlaken Beatenberg Amisbühl',
      countryCode: selectedSpot?.region?.includes('FR') ? 'FR' : 'CH',
      launchAltitudeM: selectedSpot?.launchAltitudeM || 1350,
      flightDate: selectedDate,
      flightTime: selectedTime,
      priceCents: 24000,
      currency: 'CHF',
      weatherStatus: 'optimal',
      status: 'available',
      pilotPhotoUrl: selectedPilot?.photoUrl || GENERATED_ASSETS.pilotAvatar,
      collectionPoint: selectedSpot?.collectionPoint || 'Höheweg 95 Flight Desk / Interlaken Ost',
      dropOffPoint: selectedSpot?.dropOffPoint || 'Höhematte Park Lounge & Hotel Return Shuttle',
      landingZoneName: selectedSpot?.landingZoneName || 'Höhematte Landing Field',
      googleRating: selectedPilot?.googleRating || businessInfo.googleRating || 4.9,
      googleReviewCount: selectedPilot?.googleReviewCount || businessInfo.googleReviewCount || 348
    };
  }, [selectedDate, selectedTime, selectedPilot, selectedSpot, slots, businessInfo]);

  // Execute booking
  const handleProceedToBooking = () => {
    if (onSelectSlotToBook) {
      onSelectSlotToBook(resolvedSlotForBooking);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 lg:p-10">
      <div className="max-w-[1140px] mx-auto bg-[#181818] border border-[#8A8A8A]/40 rounded-2xl overflow-hidden shadow-2xl">
        {/* Top Hero Cover & Close Bar */}
        <div className="relative h-60 sm:h-68 bg-[#111111] border-b border-[#8A8A8A]/25">
          <ResilientImage
            src={activeHeaderMedia?.assetUrl || GENERATED_ASSETS.heroSwiss}
            alt={activeHeaderMedia?.title || businessInfo.companyName}
            className="w-full h-full object-cover opacity-65"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#181818] via-black/50 to-transparent" />

          <div className="absolute top-4 right-4 flex items-center gap-3">
            <span className="text-xs font-mono text-[#FFFFFF] bg-[#111111]/90 border border-[#8A8A8A]/40 px-3 py-1.5 rounded-lg shadow">
              LIVE SCHEDULE · PUBLISHED {lastPublishedAt}
            </span>
            <button
              onClick={onClose}
              className="p-2 bg-[#111111] text-[#FFFFFF] hover:bg-[#E62B1E] border border-[#8A8A8A]/40 rounded-lg transition-colors cursor-pointer"
              aria-label="Close public profile"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-5 left-5 right-5 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={selectedPilot?.photoUrl || pilots[0]?.photoUrl || GENERATED_ASSETS.pilotAvatar}
                alt={businessInfo.companyName}
                referrerPolicy="no-referrer"
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border-2 border-[#E62B1E] shadow-xl"
              />
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                  <span className="text-[#E62B1E] font-semibold">
                    SHV / BAZL VERIFIED OPERATOR · {businessInfo.countryCode}
                  </span>
                  <span>·</span>
                  <a
                    href={businessInfo.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[#FFFFFF] hover:text-[#E62B1E] transition-colors"
                  >
                    <Star className="w-3.5 h-3.5 text-[#E62B1E] fill-[#E62B1E]" />
                    <span className="font-bold">
                      {(businessInfo.googleRating || 4.9).toFixed(1)}
                    </span>
                    <span className="text-[#8A8A8A]">
                      ({businessInfo.googleReviewCount || 348} Google Reviews)
                    </span>
                  </a>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-[#FFFFFF]">
                  {businessInfo.companyName}
                </h1>
                <p className="text-xs sm:text-sm text-[#8A8A8A]">{businessInfo.tagline}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="bg-[#141414] border-b border-[#8A8A8A]/25 px-5 py-3 flex items-center gap-2 overflow-x-auto text-xs font-mono">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-[#E62B1E] text-[#FFFFFF] shadow-md shadow-[#E62B1E]/20'
                : 'text-[#8A8A8A] hover:text-[#FFFFFF] bg-[#181818] border border-[#8A8A8A]/20'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Search Live Calendar &amp; Book</span>
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'about'
                ? 'bg-[#E62B1E] text-[#FFFFFF]'
                : 'text-[#8A8A8A] hover:text-[#FFFFFF] bg-[#181818] border border-[#8A8A8A]/20'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>About &amp; Insurance</span>
          </button>
          <button
            onClick={() => setActiveTab('spots')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'spots'
                ? 'bg-[#E62B1E] text-[#FFFFFF]'
                : 'text-[#8A8A8A] hover:text-[#FFFFFF] bg-[#181818] border border-[#8A8A8A]/20'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Launch &amp; Landing Sites ({spots.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('pilots')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'pilots'
                ? 'bg-[#E62B1E] text-[#FFFFFF]'
                : 'text-[#8A8A8A] hover:text-[#FFFFFF] bg-[#181818] border border-[#8A8A8A]/20'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Pilots Roster ({pilots.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`px-3.5 py-1.5 rounded-lg flex items-center gap-2 font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'media'
                ? 'bg-[#E62B1E] text-[#FFFFFF]'
                : 'text-[#8A8A8A] hover:text-[#FFFFFF] bg-[#181818] border border-[#8A8A8A]/20'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Media ({mediaGallery.length})</span>
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="p-5 sm:p-7 space-y-8">
          {/* TAB 1: LIVE CALENDAR SEARCH & INSTANT FLIGHT BOOKING */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              {/* Header description */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#8A8A8A]/20 pb-4">
                <div>
                  <div className="text-xs font-mono text-[#E62B1E] font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>OPERATOR LIVE CALENDAR &amp; FLIGHT RESERVATION</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#FFFFFF] mt-1">
                    Select Your Preferred Date, Departure Time &amp; Book Direct
                  </h2>
                  <p className="text-xs text-[#8A8A8A] mt-0.5">
                    Real-time alpine weather checks · SHV licensed tandem pilots · Direct Swiss Escrow settlement
                  </p>
                </div>

                {/* Calendar Keyword Quick Search */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-[#8A8A8A] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={calendarSearchQuery}
                    onChange={(e) => setCalendarSearchQuery(e.target.value)}
                    placeholder="Filter pilot, location..."
                    className="w-full bg-[#111111] border border-[#8A8A8A]/30 rounded-lg pl-9 pr-3 py-2 text-xs text-[#FFFFFF] placeholder-[#8A8A8A] focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
              </div>

              {/* Main Calendar & Selection Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Interactive Month Calendar (lg:col-span-6) */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Quick Date Chips */}
                  <div>
                    <div className="text-[11px] font-mono text-[#8A8A8A] uppercase tracking-wider mb-2">
                      Quick Select Flight Date:
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {quickDates.map((item) => (
                        <button
                          key={item.date}
                          type="button"
                          onClick={() => {
                            setSelectedDate(item.date);
                            const parts = item.date.split('-');
                            setViewYear(parseInt(parts[0], 10));
                            setViewMonth(parseInt(parts[1], 10) - 1);
                          }}
                          className={`px-3 py-2 text-xs font-mono rounded-lg border transition-all text-left cursor-pointer ${
                            selectedDate === item.date
                              ? 'bg-[#E62B1E] border-[#E62B1E] text-[#FFFFFF] font-bold shadow-md shadow-[#E62B1E]/25'
                              : 'bg-[#111111] border-[#8A8A8A]/25 text-[#8A8A8A] hover:text-[#FFFFFF] hover:border-[#8A8A8A]/50'
                          }`}
                        >
                          <div className="text-[10px] opacity-75">Date</div>
                          <div className="font-semibold truncate">{item.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Monthly Calendar Box */}
                  <div className="bg-[#111111] border border-[#8A8A8A]/25 rounded-xl p-4 space-y-3">
                    {/* Month Header with Controls */}
                    <div className="flex items-center justify-between pb-2 border-b border-[#8A8A8A]/20">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#E62B1E]" />
                        <span className="font-bold text-sm text-[#FFFFFF]">
                          {monthNames[viewMonth]} {viewYear}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1 text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#181818] rounded cursor-pointer transition-colors"
                          title="Previous month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1 text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#181818] rounded cursor-pointer transition-colors"
                          title="Next month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Day of Week Headers */}
                    <div className="grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-[#8A8A8A] font-semibold">
                      <span>MO</span>
                      <span>TU</span>
                      <span>WE</span>
                      <span>TH</span>
                      <span>FR</span>
                      <span>SA</span>
                      <span>SU</span>
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map((cd, index) => {
                        if (!cd.isCurrentMonth) {
                          return <div key={`empty-${index}`} className="h-10" />;
                        }
                        const isSelected = selectedDate === cd.dateString;
                        const isPast = cd.dateString < '2026-10-13';

                        return (
                          <button
                            key={cd.dateString}
                            type="button"
                            disabled={isPast}
                            onClick={() => setSelectedDate(cd.dateString)}
                            className={`h-10 rounded-lg flex flex-col items-center justify-center font-mono text-xs transition-all cursor-pointer relative ${
                              isSelected
                                ? 'bg-[#E62B1E] text-[#FFFFFF] font-bold ring-2 ring-[#FFFFFF]/50 shadow-md'
                                : isPast
                                ? 'text-[#444444] cursor-not-allowed'
                                : 'text-[#8A8A8A] hover:text-[#FFFFFF] hover:bg-[#181818] border border-transparent hover:border-[#8A8A8A]/30'
                            }`}
                          >
                            <span>{cd.dayNumber}</span>
                            {!isPast && (
                              <span
                                className={`w-1 h-1 rounded-full mt-0.5 ${
                                  isSelected ? 'bg-[#FFFFFF]' : 'bg-emerald-400'
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Date Picker Input for Fast Manual Entry */}
                    <div className="pt-2 border-t border-[#8A8A8A]/15 flex items-center justify-between text-xs">
                      <span className="text-[#8A8A8A] font-mono">Custom Date Picker:</span>
                      <input
                        type="date"
                        value={selectedDate}
                        min="2026-10-13"
                        onChange={(e) => {
                          if (e.target.value) {
                            setSelectedDate(e.target.value);
                            const parts = e.target.value.split('-');
                            setViewYear(parseInt(parts[0], 10));
                            setViewMonth(parseInt(parts[1], 10) - 1);
                          }
                        }}
                        className="bg-[#181818] border border-[#8A8A8A]/30 rounded px-2.5 py-1 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E] cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Right Column: Time Slot Selection & Flight Specs (lg:col-span-6) */}
                <div className="lg:col-span-6 space-y-4">
                  {/* Select Departure Time */}
                  <div>
                    <div className="text-[11px] font-mono text-[#8A8A8A] uppercase tracking-wider mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#E62B1E]" />
                        <span>Available Departure Times:</span>
                      </span>
                      <span className="text-emerald-400 font-bold">● VFR Flights Active</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {DEPARTURE_TIMES.map((dt) => {
                        const isSelected = selectedTime === dt.time;
                        return (
                          <button
                            key={dt.time}
                            type="button"
                            onClick={() => setSelectedTime(dt.time)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#181818] border-2 border-[#E62B1E] shadow-md shadow-[#E62B1E]/20'
                                : 'bg-[#111111] border-[#8A8A8A]/25 hover:border-[#8A8A8A]/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-base font-extrabold text-[#FFFFFF]">
                                {dt.time}
                              </span>
                              {isSelected ? (
                                <span className="bg-[#E62B1E] text-white p-1 rounded-full">
                                  <Check className="w-3 h-3" />
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono text-[#8A8A8A]">Select</span>
                              )}
                            </div>
                            <div className="text-xs font-semibold text-[#FFFFFF] mt-0.5">
                              {dt.label}
                            </div>
                            <div className="text-[10px] text-[#8A8A8A] mt-0.5 leading-tight">
                              {dt.note}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Spot & Pilot Pickers */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Choose Launch Spot */}
                    <div className="bg-[#111111] border border-[#8A8A8A]/25 rounded-xl p-3 space-y-1.5">
                      <label className="text-[11px] font-mono text-[#8A8A8A] flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#E62B1E]" />
                        <span>Launch Zone:</span>
                      </label>
                      <select
                        value={selectedSpotId}
                        onChange={(e) => setSelectedSpotId(e.target.value)}
                        className="w-full bg-[#181818] border border-[#8A8A8A]/30 rounded-lg px-2.5 py-1.5 text-xs text-[#FFFFFF] font-semibold focus:outline-none focus:border-[#E62B1E] cursor-pointer"
                      >
                        {spots.map((sp) => (
                          <option key={sp.spotId} value={sp.spotId}>
                            {sp.spotName} ({sp.launchAltitudeM}m)
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Choose Pilot */}
                    <div className="bg-[#111111] border border-[#8A8A8A]/25 rounded-xl p-3 space-y-1.5">
                      <label className="text-[11px] font-mono text-[#8A8A8A] flex items-center gap-1">
                        <User className="w-3 h-3 text-[#E62B1E]" />
                        <span>Tandem Pilot:</span>
                      </label>
                      <select
                        value={selectedPilotMemberId}
                        onChange={(e) => setSelectedPilotMemberId(e.target.value)}
                        className="w-full bg-[#181818] border border-[#8A8A8A]/30 rounded-lg px-2.5 py-1.5 text-xs text-[#FFFFFF] font-semibold focus:outline-none focus:border-[#E62B1E] cursor-pointer"
                      >
                        {pilots.map((p) => (
                          <option key={p.memberId} value={p.memberId}>
                            {p.name} ({p.shvLicense})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Summary & Book Direct CTA Card */}
                  <div className="bg-gradient-to-br from-[#181818] to-[#111111] border-2 border-[#E62B1E] rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xl">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-[10px] font-mono text-[#E62B1E] font-bold uppercase tracking-wider">
                          RESERVATION SELECTION CONFIRMATION
                        </div>
                        <h4 className="text-base font-bold text-[#FFFFFF] mt-0.5">
                          {selectedSpot?.spotName || 'Interlaken Beatenberg'}
                        </h4>
                        <div className="text-xs font-mono text-[#8A8A8A] mt-0.5">
                          Pilot: <span className="text-[#FFFFFF] font-bold">{selectedPilot?.name}</span> · Launch {selectedSpot?.launchAltitudeM || 1350}m ASL
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black font-mono text-[#E62B1E]">
                          {formatCurrency(resolvedSlotForBooking.priceCents, resolvedSlotForBooking.currency)}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-400">
                          Swiss Escrow Protected
                        </div>
                      </div>
                    </div>

                    {/* Flight Specs Chips */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono bg-[#141414] p-3 rounded-lg border border-[#8A8A8A]/20">
                      <div>
                        <span className="text-[#8A8A8A]">Scheduled:</span>{' '}
                        <span className="text-[#FFFFFF] font-semibold">{selectedDate} @ {selectedTime}</span>
                      </div>
                      <div>
                        <span className="text-[#8A8A8A]">Weather:</span>{' '}
                        <span className="text-emerald-400 font-semibold">OPTIMAL (12 km/h WNW)</span>
                      </div>
                      <div className="col-span-2 truncate">
                        <span className="text-[#8A8A8A]">Meeting Desk:</span>{' '}
                        <span className="text-[#FFFFFF]">{selectedSpot?.collectionPoint || 'Höheweg 95 Desk'}</span>
                      </div>
                    </div>

                    {/* Action Button: Book Flight */}
                    <button
                      type="button"
                      onClick={handleProceedToBooking}
                      className="w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#E62B1E]/30"
                    >
                      <Plane className="w-4 h-4" />
                      <span>
                        Book Flight for {selectedDate} at {selectedTime} ({formatCurrency(resolvedSlotForBooking.priceCents, resolvedSlotForBooking.currency)})
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ABOUT FLIGHT OPERATION & REGULATORY COMPLIANCE */}
          {activeTab === 'about' && (
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                <div className="text-xs font-mono text-[#E62B1E]">
                  01 · PUBLISHED BUSINESS INFORMATION
                </div>
                <h2 className="text-lg font-bold text-[#FFFFFF]">About the Flight Operation</h2>
                <p className="text-sm text-[#8A8A8A] leading-relaxed">{businessInfo.bio}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 text-xs">
                  <div className="p-3 bg-[#111111] border border-[#8A8A8A]/25 rounded-lg">
                    <div className="text-[#8A8A8A]">Headquarters &amp; Meeting Desk</div>
                    <div className="font-semibold text-[#FFFFFF] mt-0.5">
                      {businessInfo.headquarters}
                    </div>
                  </div>
                  <div className="p-3 bg-[#111111] border border-[#8A8A8A]/25 rounded-lg">
                    <div className="text-[#8A8A8A]">Public Flight Desk Contact</div>
                    <div className="font-mono text-[#FFFFFF] mt-0.5">
                      {businessInfo.publicPhone} · {businessInfo.publicEmail}
                    </div>
                  </div>
                </div>

                {/* Verified Google Maps Profile */}
                <div className="p-3.5 bg-[#111111] border border-[#E62B1E]/40 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <Star className="w-4 h-4 text-[#E62B1E] fill-[#E62B1E] shrink-0" />
                    <div>
                      <span className="font-mono font-bold text-[#FFFFFF]">
                        {(businessInfo.googleRating || 4.9).toFixed(1)} ★ Google Maps Rating
                      </span>{' '}
                      <span className="font-mono text-[#8A8A8A]">
                        ({businessInfo.googleReviewCount || 348} verified reviews)
                      </span>
                    </div>
                  </div>
                  {businessInfo.googleMapsUrl && (
                    <a
                      href={businessInfo.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[#E62B1E] hover:underline shrink-0"
                    >
                      <span>Open Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </div>
              </div>

              <div className="lg:col-span-5 bg-[#111111] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-3 text-xs">
                <div className="text-xs font-mono text-[#E62B1E] font-semibold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>REGULATORY &amp; INSURANCE COMPLIANCE</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#8A8A8A]/15">
                    <span className="text-[#8A8A8A]">Commercial UID / VAT</span>
                    <span className="font-mono text-[#FFFFFF]">{businessInfo.uidVatNumber}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#8A8A8A]/15">
                    <span className="text-[#8A8A8A]">Aviation Insurer</span>
                    <span className="font-semibold text-[#FFFFFF]">
                      {businessInfo.insuranceProvider}
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-[#8A8A8A]/15">
                    <span className="text-[#8A8A8A]">Policy Reference</span>
                    <span className="font-mono text-[#FFFFFF]">{businessInfo.policyNumber}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[#8A8A8A]">Liability Coverage</span>
                    <span className="font-mono font-bold text-[#E62B1E]">
                      {businessInfo.coverageAmount}
                    </span>
                  </div>
                </div>
                <div className="pt-2 text-[11px] text-[#8A8A8A] border-t border-[#8A8A8A]/20">
                  Privacy Note: Operator IBAN banking details and security credentials are isolated in
                  private storage and never exposed on this public profile.
                </div>
              </div>
            </section>
          )}

          {/* TAB 3: SPOTS */}
          {activeTab === 'spots' && (
            <section className="space-y-4">
              <div className="text-xs font-mono text-[#E62B1E]">
                02 · TAKE OFF, LANDING, COLLECTION &amp; DROP-OFF POINTS ({spots.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {spots.map((sp) => (
                  <div
                    key={sp.spotId}
                    className="bg-[#111111] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-3 text-xs"
                  >
                    <div className="flex items-center justify-between font-mono text-[#8A8A8A]">
                      <span>{sp.region}</span>
                      <span className="text-[#E62B1E] font-bold">
                        Δ {sp.launchAltitudeM - sp.landingAltitudeM}m Drop
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-[#FFFFFF]">{sp.spotName}</h3>

                    <div className="p-3 bg-[#181818] border border-[#E62B1E]/40 rounded-lg space-y-2">
                      <div>
                        <div className="font-mono text-[10px] text-[#E62B1E] font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>1. COLLECTION / MEETING POINT</span>
                        </div>
                        <div className="text-[#FFFFFF] font-medium mt-0.5">
                          {sp.collectionPoint}
                        </div>
                      </div>
                      <div className="pt-1.5 border-t border-[#8A8A8A]/20">
                        <div className="font-mono text-[10px] text-[#E62B1E] font-semibold flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>2. DROP-OFF POINT</span>
                        </div>
                        <div className="text-[#FFFFFF] font-medium mt-0.5">
                          {sp.dropOffPoint}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 font-mono text-[#8A8A8A]">
                      <div>
                        Take-Off: <span className="text-[#FFFFFF]">{sp.launchAltitudeM}m ASL</span> ({sp.gpsTakeoff})
                      </div>
                      <div>
                        Landing: <span className="text-[#FFFFFF]">{sp.landingZoneName}</span> · {sp.landingAltitudeM}m
                      </div>
                      <div>
                        Wind Sector: <span className="text-[#E62B1E]">{sp.windOrientation}</span>
                      </div>
                      <div>
                        Access: <span className="text-[#FFFFFF]">{sp.cableCarLift}</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#8A8A8A] leading-relaxed pt-1 border-t border-[#8A8A8A]/15">
                      {sp.notes}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* TAB 4: PILOTS */}
          {activeTab === 'pilots' && (
            <section className="space-y-4">
              <div className="text-xs font-mono text-[#E62B1E]">
                03 · CERTIFIED TANDEM PILOTS ROSTER ({pilots.length})
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {pilots.map((member) => {
                  const pilotRating = member.googleRating || businessInfo.googleRating || 4.9;
                  const pilotReviews = member.googleReviewCount || businessInfo.googleReviewCount || 348;
                  const pilotMapsUrl = member.googleMapsUrl || businessInfo.googleMapsUrl;

                  return (
                    <div
                      key={member.memberId}
                      className="bg-[#111111] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-3 text-xs"
                    >
                      <div className="flex items-center gap-3.5">
                        <img
                          src={member.photoUrl || GENERATED_ASSETS.pilotAvatar}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-full object-cover border-2 border-[#E62B1E] shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1 font-mono">
                            <span className="text-[#E62B1E] font-semibold">
                              {member.shvLicense}
                            </span>
                            <span className="font-bold text-[#FFFFFF]">
                              ★ {pilotRating.toFixed(1)}
                            </span>
                          </div>
                          <h3 className="text-base font-bold text-[#FFFFFF] truncate">
                            {member.name}
                          </h3>
                          <div className="text-[#8A8A8A] truncate">{member.roleTitle}</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#8A8A8A]/15 space-y-1 font-mono text-[#8A8A8A]">
                        <div className="flex items-center justify-between">
                          <span>Duty Status:</span>
                          <span className="text-[#FFFFFF]">
                            {member.status === 'active' ? 'ON FLIGHT DUTY' : 'OFF DUTY'}
                          </span>
                        </div>
                        <div>
                          Logged Flights:{' '}
                          <span className="text-[#E62B1E] font-bold">
                            {member.tandemFlightsLogged.toLocaleString()}+
                          </span>
                        </div>
                        <div>
                          Languages: <span className="text-[#FFFFFF]">{member.languages}</span>
                        </div>
                        <div>
                          Tandem Wing: <span className="text-[#FFFFFF]">{member.gliderWing}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* TAB 5: MEDIA GALLERY */}
          {activeTab === 'media' && (
            <section className="space-y-4">
              <div className="text-xs font-mono text-[#E62B1E]">
                04 · PUBLISHED IMAGES &amp; VIDEOS ({mediaGallery.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {mediaGallery.map((item) => (
                  <div
                    key={item.mediaId}
                    className="bg-[#111111] border border-[#8A8A8A]/25 rounded-xl overflow-hidden flex flex-col justify-between"
                  >
                    <div className="aspect-4/3 relative bg-black">
                      <ResilientImage
                        src={item.assetUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-[#111111]/90 border border-[#8A8A8A]/40 px-2 py-0.5 rounded text-[10px] font-mono text-[#FFFFFF]">
                        {item.mediaType.toUpperCase()} · {item.durationOrResolution}
                      </div>
                    </div>
                    <div className="p-3.5 space-y-1">
                      <div className="text-[11px] font-mono text-[#E62B1E]">{item.locationTag}</div>
                      <div className="text-xs font-semibold text-[#FFFFFF] leading-snug">
                        {item.title}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
