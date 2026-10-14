import React, { useState, useEffect } from 'react';
import { BookingData, QrCampaignData, WorkspaceView } from '../types';
import {
  formatCurrency,
  PartnerVenueType,
  validatePartnerCode
} from '../lib/validation';
import { QrCodeMatrix } from './QrCodeMatrix';
import { Download, Plus, ArrowRight } from 'lucide-react';

interface PartnerDashboardViewProps {
  qrCampaigns: QrCampaignData[];
  bookings: BookingData[];
  initialCampaignId?: string;
  onCreateQrCampaign: (draft: {
    partnerName: string;
    partnerType: PartnerVenueType;
    partnerCode: string;
    region: string;
    countryCode: string;
  }) => Promise<void>;
  onSimulateQrScan: (campaign: QrCampaignData) => Promise<void>;
  onNavigate: (view: WorkspaceView) => void;
}

export const PartnerDashboardView: React.FC<PartnerDashboardViewProps> = ({
  qrCampaigns,
  bookings,
  initialCampaignId,
  onCreateQrCampaign,
  onSimulateQrScan,
  onNavigate
}) => {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    initialCampaignId || qrCampaigns[0]?.campaignId || ''
  );

  useEffect(() => {
    if (initialCampaignId) {
      setSelectedCampaignId(initialCampaignId);
    }
  }, [initialCampaignId]);
  const [partnerName, setPartnerName] = useState('Grand Hotel Giessbach');
  const [partnerType, setPartnerType] = useState<PartnerVenueType>('Hotel');
  const [partnerCode, setPartnerCode] = useState('HOTEL_GIESSBACH_BRIENZ');
  const [region, setRegion] = useState('Lake Brienz / Interlaken');
  const [countryCode, setCountryCode] = useState<'CH' | 'FR'>('CH');
  const [isCreating, setIsCreating] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const selectedCampaign =
    qrCampaigns.find((c) => c.campaignId === selectedCampaignId) || qrCampaigns[0];

  const totalScans = qrCampaigns.reduce((sum, c) => sum + c.scansCount, 0);
  const totalQrBookings = qrCampaigns.reduce((sum, c) => sum + c.bookingsCount, 0);
  const conversionRate =
    totalScans > 0 ? ((totalQrBookings / totalScans) * 100).toFixed(1) : '0.0';

  const partnerBookings = bookings.filter(
    (b) => b.partnerCode !== 'DIRECT' && b.status !== 'cancelled'
  );
  const totalCommissionCents = partnerBookings.reduce(
    (sum, b) => sum + b.partnerCommissionCents,
    0
  );

  const referralUrl = selectedCampaign
    ? `https://2paraglide.com/?ref=${selectedCampaign.partnerCode}&region=${encodeURIComponent(
        selectedCampaign.region
      )}`
    : 'https://2paraglide.com/?ref=HOTEL_BELVEDERE_INT';

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const cleanCode = validatePartnerCode(partnerCode);
      await onCreateQrCampaign({
        partnerName,
        partnerType,
        partnerCode: cleanCode,
        region,
        countryCode
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleDownloadStandeeSvg = () => {
    if (!selectedCampaign) return;
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
      <rect width="600" height="800" rx="24" fill="#111111"/>
      <rect x="24" y="24" width="552" height="752" rx="16" fill="#181818" stroke="#8A8A8A" stroke-width="1"/>
      <text x="300" y="95" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="700" fill="#E62B1E" letter-spacing="2">2PARAGLIDE.COM · OFFICIAL PARTNER</text>
      <text x="300" y="145" text-anchor="middle" font-family="sans-serif" font-size="28" font-weight="800" fill="#FFFFFF">${selectedCampaign.partnerName.replace(/&/g, '&amp;')}</text>
      <text x="300" y="180" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#8A8A8A">${selectedCampaign.partnerType} · ${selectedCampaign.region}</text>
      <rect x="170" y="220" width="260" height="260" rx="12" fill="#FFFFFF" stroke="#8A8A8A" stroke-width="2"/>
      <text x="300" y="355" text-anchor="middle" font-family="monospace" font-size="16" font-weight="700" fill="#111111">SCAN QR AT CONCIERGE</text>
      <text x="300" y="540" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="700" fill="#FFFFFF">Book Your Swiss Tandem Flight</text>
      <text x="300" y="575" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#8A8A8A">SHV Certified Pilots · Instant TWINT &amp; Card Checkout</text>
      <rect x="120" y="620" width="360" height="54" rx="10" fill="#E62B1E"/>
      <text x="300" y="653" text-anchor="middle" font-family="monospace" font-size="16" font-weight="700" fill="#FFFFFF">CODE: ${selectedCampaign.partnerCode}</text>
      <text x="300" y="730" text-anchor="middle" font-family="sans-serif" font-size="13" fill="#8A8A8A">100% Weather Refund Guarantee · CHF 5M Liability Insured</text>
    </svg>`;
    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `2paraglide-standee-${selectedCampaign.partnerCode.toLowerCase()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#8A8A8A]/25 pb-6">
        <div className="space-y-1">
          <div className="text-xs font-mono text-[#E62B1E]">
            DASHBOARD 04 · HOSPITALITY &amp; TOURISM QR AFFILIATE PORTAL
          </div>
          <h1 className="font-display text-3xl font-extrabold tracking-wide text-[#FFFFFF]">
            4. PARTNER DASHBOARD — HOTELS, CAFÉS &amp; TOURISM BOARDS
          </h1>
          <p className="text-sm text-[#8A8A8A]">
            Generate print-ready QR table tents and reception standees. Earn an automated 10.0%
            escrow commission on every guest tandem flight.
          </p>
        </div>
      </div>

      {/* 4-Column Partner KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#8A8A8A]">Total QR Standee Scans</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#E62B1E]">
            {totalScans} Scans
          </div>
          <div className="text-xs text-[#8A8A8A]">
            Across {qrCampaigns.length} active hospitality venues
          </div>
        </div>

        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#8A8A8A]">Attributed QR Flight Bookings</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#FFFFFF]">
            {totalQrBookings} Flights
          </div>
          <div className="text-xs text-[#8A8A8A] font-mono">
            <span className="text-[#E62B1E] font-semibold">{conversionRate}%</span> Scan-to-Booking Conversion
          </div>
        </div>

        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#8A8A8A]">Partner Commission Rate</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#E62B1E]">
            10.0% (1000 bps)
          </div>
          <div className="text-xs text-[#8A8A8A]">
            Credited automatically per completed flight
          </div>
        </div>

        <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-5 space-y-1">
          <div className="text-xs text-[#8A8A8A]">Accrued Partner Commissions</div>
          <div className="text-2xl font-bold font-mono tabular-nums text-[#FFFFFF]">
            {formatCurrency(totalCommissionCents, 'CHF')}
          </div>
          <div className="text-xs text-[#8A8A8A]">
            Direct payout to Hotel / Cafe CH-IBAN or SEPA
          </div>
        </div>
      </div>

      {/* Main Split: Left 7 Cols Active QR Campaigns & New Generator | Right 5 Cols Printable QR Standee Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 space-y-6">
          {/* Active Hospitality QR Campaigns Table */}
          <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4">
            <div>
              <h2 className="text-base font-bold text-[#FFFFFF]">
                Active Venue QR Code Campaigns
              </h2>
              <p className="text-xs text-[#8A8A8A]">
                Click any venue row to preview its printable QR standee or simulate a guest scan.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#8A8A8A]/25 text-xs font-semibold text-[#8A8A8A]">
                    <th className="py-2.5 pr-3">Venue &amp; Type</th>
                    <th className="py-2.5 px-3">Partner Code</th>
                    <th className="py-2.5 px-3 text-right">Scans</th>
                    <th className="py-2.5 px-3 text-right">Bookings</th>
                    <th className="py-2.5 pl-3 text-right">Test Scan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#8A8A8A]/20 text-xs">
                  {qrCampaigns.map((camp) => {
                    const isSelected = selectedCampaign?.campaignId === camp.campaignId;
                    return (
                      <tr
                        key={camp.campaignId}
                        onClick={() => setSelectedCampaignId(camp.campaignId)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-[#111111]' : 'hover:bg-[#111111]/60'
                        }`}
                      >
                        <td className="py-3 pr-3">
                          <div className="font-semibold text-[#FFFFFF]">{camp.partnerName}</div>
                          <div className="text-[#8A8A8A]">
                            {camp.partnerType} · {camp.region} ({camp.countryCode})
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-semibold text-[#E62B1E]">
                          {camp.partnerCode}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums text-[#8A8A8A]">
                          {camp.scansCount}
                        </td>
                        <td className="py-3 px-3 text-right font-mono tabular-nums font-semibold text-[#FFFFFF]">
                          {camp.bookingsCount}
                        </td>
                        <td className="py-3 pl-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSimulateQrScan(camp);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Simulate Scan
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Register New Hotel / Coffee Shop / Tourism Board QR Code */}
          <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4">
            <div className="border-b border-[#8A8A8A]/20 pb-3">
              <div className="text-xs font-mono text-[#E62B1E]">NEW VENUE ONBOARDING</div>
              <h2 className="text-base font-bold text-[#FFFFFF]">
                Create New Partner QR Attribution Code
              </h2>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#FFFFFF] mb-1">
                    Partner Business Name
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    placeholder="e.g. Alpine Roast Coffee Interlaken"
                    className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[#FFFFFF] mb-1">
                    Venue Category
                  </label>
                  <select
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value as PartnerVenueType)}
                    className="w-full px-3 py-2 border border-[#8A8A8A]/40 rounded-lg bg-[#111111] text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
                  >
                    <option value="Hotel">Hotel / Concierge Desk</option>
                    <option value="Coffee Shop">Coffee Shop / Café Table Tent</option>
                    <option value="Tourism Board">Tourism Board / Visitor Center</option>
                    <option value="Hostel">Alpine Hostel / Chalet</option>
                    <option value="Mountain Railway">Mountain Railway / Cable Car Station</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-[#FFFFFF] mb-1">
                    Custom QR Referral Code
                  </label>
                  <input
                    type="text"
                    required
                    value={partnerCode}
                    onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 font-mono bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#FFFFFF] mb-1">
                    Alpine Region
                  </label>
                  <input
                    type="text"
                    required
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 bg-[#111111] text-[#FFFFFF] border border-[#8A8A8A]/40 rounded-lg focus:outline-none focus:border-[#E62B1E]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#FFFFFF] mb-1">
                    Country
                  </label>
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value as 'CH' | 'FR')}
                    className="w-full px-3 py-2 border border-[#8A8A8A]/40 rounded-lg bg-[#111111] text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
                  >
                    <option value="CH">Switzerland (CH)</option>
                    <option value="FR">France (FR)</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{isCreating ? 'Generating QR Campaign...' : 'Generate Venue QR Campaign'}</span>
              </button>
            </form>
          </div>
        </div>

        {/* Right 5 Columns: Live Printable Table Standee / Concierge QR Preview */}
        {selectedCampaign && (
          <div className="lg:col-span-5 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[#8A8A8A]/20 pb-4">
              <div>
                <div className="text-xs font-mono text-[#8A8A8A]">
                  PRINT-READY HOSPITALITY STANDEE
                </div>
                <h3 className="text-base font-bold text-[#FFFFFF]">
                  {selectedCampaign.partnerName}
                </h3>
              </div>
              <span className="text-xs font-mono text-[#E62B1E] font-semibold">
                10.0% Commission
              </span>
            </div>

            {/* Standee Visual Card */}
            <div className="bg-[#111111] border border-[#8A8A8A]/30 text-[#FFFFFF] rounded-xl p-6 text-center space-y-4">
              <div className="text-[11px] font-mono tracking-wider text-[#E62B1E] font-bold">
                2PARAGLIDE.COM · SWISS ALPS TANDEM FLIGHTS
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-[#FFFFFF]">{selectedCampaign.partnerName}</div>
                <div className="text-xs text-[#8A8A8A]">
                  {selectedCampaign.partnerType} · {selectedCampaign.region}
                </div>
              </div>

              <div className="flex justify-center py-2">
                <QrCodeMatrix
                  value={referralUrl}
                  size={168}
                  label={`QR Code for ${selectedCampaign.partnerName}`}
                />
              </div>

              <div className="space-y-1">
                <div className="text-xs text-[#8A8A8A]">
                  Scan with phone camera to book SHV-certified tandem flights
                </div>
                <div className="font-mono text-xs text-[#E62B1E] font-bold">
                  Partner Code: {selectedCampaign.partnerCode}
                </div>
              </div>
            </div>

            {/* Signed Attribution Link Box */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-[#FFFFFF]">
                Encoded QR Attribution Link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={referralUrl}
                  className="flex-1 px-3 py-2 text-xs font-mono bg-[#111111] border border-[#8A8A8A]/30 rounded-lg text-[#8A8A8A]"
                />
                <button
                  onClick={handleCopyUrl}
                  className="px-3 py-2 text-xs font-semibold text-[#111111] bg-[#FFFFFF] rounded-lg hover:bg-[#e5e5e5] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {copiedUrl ? 'Copied' : 'Copy URL'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleDownloadStandeeSvg}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#111111] border border-[#8A8A8A]/40 hover:border-[#FFFFFF] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Standee SVG</span>
              </button>

              <button
                onClick={async () => {
                  await onSimulateQrScan(selectedCampaign);
                  onNavigate('marketplace');
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Scan &amp; Open Booking Page</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
