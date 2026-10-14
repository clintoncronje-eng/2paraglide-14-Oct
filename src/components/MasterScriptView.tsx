import React, { useState } from 'react';
import {
  MASTER_SPEC_CHAPTERS,
  generateFullMarkdownScript
} from '../data/masterSpecScript';
import {
  calculateEscrowSplit,
  formatCurrency,
  CurrencyCode,
  PaymentMethodType
} from '../lib/validation';
import { WorkspaceView } from '../types';
import {
  Download,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';

interface MasterScriptViewProps {
  onNavigate: (view: WorkspaceView) => void;
}

export const MasterScriptView: React.FC<MasterScriptViewProps> = ({ onNavigate }) => {
  const [activeChapterId, setActiveChapterId] = useState<string>(MASTER_SPEC_CHAPTERS[0].id);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    'sec-1': true,
    'sec-2': true,
    'sec-3': true,
    'sec-4': true,
    'pay-1': true,
    'pay-2': true,
    'qr-1': true,
    'qr-2': true,
    'dash-1': true,
    'dash-2': true,
    'dash-3': true,
    'dash-4': true
  });
  const [copiedScript, setCopiedScript] = useState(false);

  // Interactive Escrow Split Simulator State
  const [simCurrency, setSimCurrency] = useState<CurrencyCode>('CHF');
  const [simBasePriceMajor, setSimBasePriceMajor] = useState<number>(240);
  const [simIncludeMedia, setSimIncludeMedia] = useState<boolean>(true);
  const [simPartnerMode, setSimPartnerMode] = useState<'PARTNER_QR' | 'DIRECT'>('PARTNER_QR');
  const [simPaymentMethod, setSimPaymentMethod] = useState<PaymentMethodType>('TWINT');

  const activeChapter =
    MASTER_SPEC_CHAPTERS.find((c) => c.id === activeChapterId) || MASTER_SPEC_CHAPTERS[0];

  const totalSimCents = (simBasePriceMajor + (simIncludeMedia ? 40 : 0)) * 100;
  const splitBreakdown = calculateEscrowSplit(
    totalSimCents,
    simPartnerMode === 'PARTNER_QR' ? 'HOTEL_BELVEDERE_INT' : 'DIRECT'
  );

  const handleCopyFullScript = () => {
    const md = generateFullMarkdownScript();
    navigator.clipboard.writeText(md);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleDownloadFullScript = () => {
    const md = generateFullMarkdownScript();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '2paraglide-master-architecture-script.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleChecklist = (id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-[1280px] mx-auto px-6 py-10 space-y-12">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-8 border-b border-[#8A8A8A]/25">
        <div className="space-y-3 max-w-3xl">
          <div className="text-xs font-medium text-[#8A8A8A] flex flex-wrap items-center gap-2">
            <span className="text-[#E62B1E] font-semibold">2PARAGLIDE.COM RE-ENGINEERING</span>
            <span aria-hidden="true">·</span>
            <span>Switzerland Launch (CHF / TWINT)</span>
            <span aria-hidden="true">·</span>
            <span>European Multi-Country Architecture</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wide text-[#FFFFFF]">
            MASTER SPECIFICATION &amp; ARCHITECTURE SCRIPT
          </h1>
          <p className="text-sm sm:text-base text-[#8A8A8A] leading-relaxed">
            Complete functional and security blueprint for rebuilding 2paraglide.com from scratch.
            Includes zero-trust Firestore ABAC rules, 3-way Stripe Connect &amp; TWINT escrow splits,
            offline-to-online QR hospitality attribution, and live interactive workspaces for all four roles.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleCopyFullScript}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#181818] border border-[#8A8A8A]/40 rounded-lg hover:border-[#FFFFFF] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedScript ? <Check className="w-4 h-4 text-[#E62B1E]" /> : <Copy className="w-4 h-4" />}
            <span>{copiedScript ? 'Copied Markdown Script' : 'Copy Full Script'}</span>
          </button>
          <button
            onClick={handleDownloadFullScript}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#FFFFFF] bg-[#E62B1E] rounded-lg hover:bg-[#c82317] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Master Script (.md)</span>
          </button>
        </div>
      </div>

      {/* Direct Interactive Launchers for the 4 Dashboards */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-[#FFFFFF]">
            <span className="text-[#E62B1E] font-mono mr-2">01.</span>
            Interactive Role Dashboards (Live Prototypes Connected to Firestore)
          </h2>
          <span className="text-xs text-[#8A8A8A]">
            Select any dashboard to test its real-time workflows
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-mono text-[#8A8A8A]">
                <span className="text-[#E62B1E] font-semibold">01</span> · PLATFORM GOVERNANCE
              </div>
              <h3 className="text-base font-bold text-[#FFFFFF]">1. Owner Dashboard</h3>
              <p className="text-sm text-[#8A8A8A] leading-relaxed">
                Global GMV ledger, 12%/15% platform fee tracking, SHV/IPPI pilot license verification queue, and country expansion toggles (CH, FR, AT, IT).
              </p>
            </div>
            <button
              onClick={() => onNavigate('owner_dashboard')}
              className="w-full inline-flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#111111] bg-[#FFFFFF] hover:bg-[#e5e5e5] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Owner Dashboard</span>
              <ArrowRight className="w-4 h-4 text-[#E62B1E]" />
            </button>
          </div>

          <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-mono text-[#8A8A8A]">
                <span className="text-[#E62B1E] font-semibold">02</span> · FLIGHT OPERATIONS
              </div>
              <h3 className="text-base font-bold text-[#FFFFFF]">2. Pilot Dashboard</h3>
              <p className="text-sm text-[#8A8A8A] leading-relaxed">
                Publish tandem flight slots, set live Föhn &amp; valley wind status (Optimal / Marginal / Hold), manage passenger manifests, and trigger 78%–85% escrow payouts.
              </p>
            </div>
            <button
              onClick={() => onNavigate('pilot_dashboard')}
              className="w-full inline-flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#111111] bg-[#FFFFFF] hover:bg-[#e5e5e5] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Pilot Dashboard</span>
              <ArrowRight className="w-4 h-4 text-[#E62B1E]" />
            </button>
          </div>

          <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-mono text-[#8A8A8A]">
                <span className="text-[#E62B1E] font-semibold">03</span> · PASSENGER EXPERIENCE
              </div>
              <h3 className="text-base font-bold text-[#FFFFFF]">3. Flyer Dashboard</h3>
              <p className="text-sm text-[#8A8A8A] leading-relaxed">
                Browse SHV-certified Swiss &amp; European flights, book via TWINT or 3DS2 Card with QR promo binding, view digital boarding passes, and weather-hold protection.
              </p>
            </div>
            <button
              onClick={() => onNavigate('flyer_dashboard')}
              className="w-full inline-flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#111111] bg-[#FFFFFF] hover:bg-[#e5e5e5] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Flyer Dashboard</span>
              <ArrowRight className="w-4 h-4 text-[#E62B1E]" />
            </button>
          </div>

          <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 flex flex-col justify-between space-y-5">
            <div className="space-y-2">
              <div className="text-xs font-mono text-[#8A8A8A]">
                <span className="text-[#E62B1E] font-semibold">04</span> · HOSPITALITY AFFILIATES
              </div>
              <h3 className="text-base font-bold text-[#FFFFFF]">4. Partner QR Dashboard</h3>
              <p className="text-sm text-[#8A8A8A] leading-relaxed">
                Built for hotels, coffee shops, and tourism boards. Generate custom SVG QR table standees, track live scan-to-booking conversion, and earn 10% commission.
              </p>
            </div>
            <button
              onClick={() => onNavigate('partner_dashboard')}
              className="w-full inline-flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-[#111111] bg-[#FFFFFF] hover:bg-[#e5e5e5] rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Open Partner Dashboard</span>
              <ArrowRight className="w-4 h-4 text-[#E62B1E]" />
            </button>
          </div>
        </div>
      </section>

      {/* Chapter Navigation & Detailed Specification Reader */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#8A8A8A]/25 pb-4">
          <h2 className="text-lg font-bold text-[#FFFFFF]">
            <span className="text-[#E62B1E] font-mono mr-2">02.</span>
            Step-by-Step Architectural Specification Chapters
          </h2>
          <div className="flex flex-wrap items-center gap-1.5 bg-[#181818] border border-[#8A8A8A]/25 p-1 rounded-lg">
            {MASTER_SPEC_CHAPTERS.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChapterId(ch.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  activeChapterId === ch.id
                    ? 'bg-[#E62B1E] text-[#FFFFFF]'
                    : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
              >
                {ch.number} {ch.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left 7 Columns: Deep Specification & Code Rules */}
          <div className="lg:col-span-7 bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-7 space-y-6">
            <div className="space-y-2 border-b border-[#8A8A8A]/20 pb-5">
              <div className="text-xs font-mono text-[#E62B1E]">
                SPECIFICATION MODULE {activeChapter.number}
              </div>
              <h3 className="text-2xl font-bold text-[#FFFFFF]">
                {activeChapter.title}
              </h3>
              <p className="text-sm font-medium text-[#8A8A8A]">
                {activeChapter.subtitle}
              </p>
              <p className="text-sm text-[#8A8A8A] leading-relaxed pt-2">
                {activeChapter.summary}
              </p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-[#FFFFFF]">
                Core Functional Deliverables
              </h4>
              <ul className="space-y-2 text-sm text-[#FFFFFF]/90">
                {activeChapter.deliverables.map((del, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="font-mono text-xs text-[#E62B1E] font-bold pt-0.5">
                      0{idx + 1}
                    </span>
                    <span>{del}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-5 pt-2">
              {activeChapter.architectureRules.map((rule, idx) => (
                <div key={idx} className="space-y-2">
                  <h4 className="text-sm font-bold text-[#FFFFFF]">{rule.heading}</h4>
                  <p className="text-xs text-[#8A8A8A] leading-relaxed">{rule.detail}</p>
                  <pre className="bg-[#111111] border border-[#8A8A8A]/25 text-[#FFFFFF] font-mono text-xs p-4 rounded-lg overflow-x-auto leading-relaxed">
                    <code>{rule.codeOrFormula}</code>
                  </pre>
                </div>
              ))}
            </div>
          </div>

          {/* Right 5 Columns: Interactive Escrow Split Simulator & Implementation Checklist */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live 3-Way Escrow & Payment Gateway Calculator */}
            <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-5">
              <div className="space-y-1">
                <div className="text-xs font-mono text-[#E62B1E]">
                  PAYMENT GATEWAY &amp; ESCROW ENGINE
                </div>
                <h3 className="text-base font-bold text-[#FFFFFF]">
                  Interactive 3-Way Split Simulator (CHF &amp; EUR)
                </h3>
                <p className="text-xs text-[#8A8A8A]">
                  Test how every booking is automatically partitioned in integer Rappen/Cents across Pilot, QR Partner, and 2paraglide.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#8A8A8A] mb-1">
                    Settlement Currency
                  </label>
                  <div className="flex bg-[#111111] border border-[#8A8A8A]/25 p-1 rounded-lg">
                    {(['CHF', 'EUR'] as CurrencyCode[]).map((cur) => (
                      <button
                        key={cur}
                        onClick={() => setSimCurrency(cur)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          simCurrency === cur
                            ? 'bg-[#E62B1E] text-[#FFFFFF]'
                            : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                        }`}
                      >
                        {cur}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#8A8A8A] mb-1">
                    Attribution Channel
                  </label>
                  <div className="flex bg-[#111111] border border-[#8A8A8A]/25 p-1 rounded-lg">
                    <button
                      onClick={() => setSimPartnerMode('PARTNER_QR')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        simPartnerMode === 'PARTNER_QR'
                          ? 'bg-[#E62B1E] text-[#FFFFFF]'
                          : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                      }`}
                    >
                      QR Partner
                    </button>
                    <button
                      onClick={() => setSimPartnerMode('DIRECT')}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                        simPartnerMode === 'DIRECT'
                          ? 'bg-[#E62B1E] text-[#FFFFFF]'
                          : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                      }`}
                    >
                      Direct
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#8A8A8A]">Base Tandem Flight Tariff</span>
                  <span className="font-mono font-bold text-[#E62B1E] tabular-nums">
                    {simCurrency} {simBasePriceMajor}.00
                  </span>
                </div>
                <input
                  type="range"
                  min={150}
                  max={380}
                  step={10}
                  value={simBasePriceMajor}
                  onChange={(e) => setSimBasePriceMajor(Number(e.target.value))}
                  className="w-full accent-[#E62B1E] cursor-pointer"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="text-xs font-medium text-[#FFFFFF] flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={simIncludeMedia}
                      onChange={(e) => setSimIncludeMedia(e.target.checked)}
                      className="rounded border-[#8A8A8A] accent-[#E62B1E]"
                    />
                    <span>Include GoPro 4K Photo &amp; Video (+{simCurrency} 40.00)</span>
                  </label>
                </div>

                <div>
                  <span className="block text-xs font-medium text-[#8A8A8A] mb-1.5">
                    Payment Instrument
                  </span>
                  <div className="grid grid-cols-4 gap-1.5 bg-[#111111] border border-[#8A8A8A]/25 p-1 rounded-lg">
                    {(['TWINT', 'CARD_3DS', 'APPLE_PAY', 'SEPA'] as PaymentMethodType[]).map((pm) => (
                      <button
                        key={pm}
                        onClick={() => setSimPaymentMethod(pm)}
                        className={`py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          simPaymentMethod === pm
                            ? 'bg-[#FFFFFF] text-[#111111] font-semibold'
                            : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                        }`}
                      >
                        {pm === 'CARD_3DS' ? '3DS Card' : pm === 'APPLE_PAY' ? 'Apple Pay' : pm}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Calculated Ledger Table */}
              <div className="border-t border-[#8A8A8A]/25 pt-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between font-semibold text-[#FFFFFF]">
                  <span>Gross Flyer Charge ({simPaymentMethod})</span>
                  <span className="font-mono tabular-nums text-sm text-[#E62B1E] font-bold">
                    {formatCurrency(splitBreakdown.totalAmountCents, simCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8A8A8A]">
                  <span>
                    Pilot Escrow Payout ({simPartnerMode === 'PARTNER_QR' ? '78.0%' : '85.0%'})
                  </span>
                  <span className="font-mono tabular-nums font-medium text-[#FFFFFF]">
                    {formatCurrency(splitBreakdown.pilotPayoutCents, simCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8A8A8A]">
                  <span>
                    Partner QR Commission ({simPartnerMode === 'PARTNER_QR' ? '10.0%' : '0.0%'})
                  </span>
                  <span className="font-mono tabular-nums font-medium text-[#FFFFFF]">
                    {formatCurrency(splitBreakdown.partnerCommissionCents, simCurrency)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#8A8A8A]">
                  <span>
                    2paraglide Net Platform Fee ({simPartnerMode === 'PARTNER_QR' ? '12.0%' : '15.0%'})
                  </span>
                  <span className="font-mono tabular-nums font-medium text-[#E62B1E]">
                    {formatCurrency(splitBreakdown.platformFeeCents, simCurrency)}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#8A8A8A]/20 flex items-center justify-between text-[#8A8A8A]">
                  <span>
                    Included VAT / MWST ({simCurrency === 'CHF' ? 'Switzerland 8.1%' : 'EU Standard 20.0%'})
                  </span>
                  <span className="font-mono tabular-nums text-[#FFFFFF]">
                    {formatCurrency(
                      Math.round(
                        splitBreakdown.totalAmountCents * (simCurrency === 'CHF' ? 0.081 : 0.2)
                      ),
                      simCurrency
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Module Implementation Checklist */}
            <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#FFFFFF]">
                  Module {activeChapter.number} Verification Checklist
                </h3>
                <span className="text-xs font-mono text-[#E62B1E] font-semibold tabular-nums">
                  {
                    activeChapter.implementationChecklist.filter((i) => checkedItems[i.id])
                      .length
                  }
                  /{activeChapter.implementationChecklist.length} Verified
                </span>
              </div>

              <div className="space-y-2.5">
                {activeChapter.implementationChecklist.map((item) => (
                  <label
                    key={item.id}
                    className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-[#111111] transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(checkedItems[item.id])}
                      onChange={() => toggleChecklist(item.id)}
                      className="mt-0.5 rounded border-[#8A8A8A] accent-[#E62B1E]"
                    />
                    <div className="space-y-0.5">
                      <div className="text-xs font-medium text-[#FFFFFF] leading-snug">
                        {item.task}
                      </div>
                      <div className="text-xs text-[#8A8A8A]">
                        <span>{item.phase}</span>
                        <span aria-hidden="true"> · </span>
                        <span className="text-[#E62B1E]">{item.criticality}</span>
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
