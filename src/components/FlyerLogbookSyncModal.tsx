import React, { useState } from 'react';
import { FlyerFlightLogEntry } from '../types';
import {
  X,
  CloudLightning,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Plane,
  Compass,
  Link2
} from 'lucide-react';

interface FlyerLogbookSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportLogs: (logs: FlyerFlightLogEntry[], providerName: string) => void;
}

const SAMPLE_CSV_CONTENT = `Date,Takeoff Site,Landing Zone,Glider Wing,Duration (mins),Max Altitude (m),Distance (km),Flight Type,Notes
2026-09-14,Interlaken Beatenberg Amisbuehl,Hoehematte Central Field,Advance BiBeta 6,45,2150,14.2,Tandem Passenger,Smooth evening thermal glide above Lake Brienz
2026-08-28,Zermatt Gornergrat,Furi Landing Zone,Advance IOTA DLS,85,3820,28.5,Thermal XC,Matterhorn north wall ridge lift
2026-08-12,Lauterbrunnen Maennlichen,Stechelberg Airfield,Ozone Geo 6,55,2480,18.0,Solo Alpine,Spectacular waterfall canyon soaring
2026-07-22,Grindelwald First,Bodmi Landing Field,Gin Explorer 2,60,2650,21.3,Solo Alpine,Eiger north face morning thermals
2026-07-05,Chamonix Planpraz,Le Bois du Bouchet,Advance Alpha 7,40,2100,12.0,Training,High alpine flight above Chamonix valley`;

export const FlyerLogbookSyncModal: React.FC<FlyerLogbookSyncModalProps> = ({
  isOpen,
  onClose,
  onImportLogs
}) => {
  const [activeTab, setActiveTab] = useState<'api' | 'csv'>('api');

  // API State
  const [apiProvider, setApiProvider] = useState<'XContest API' | 'DHV-XC API' | 'Flymaster Cloud' | 'Leonardo XC' | 'Syride SYS\u0027Nav'>('XContest API');
  const [pilotUsername, setPilotUsername] = useState('elena_flyer_swiss');
  const [apiKey, setApiKey] = useState('');
  const [regionFilter, setRegionFilter] = useState('Swiss Alps / Interlaken');
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [apiFeedback, setApiFeedback] = useState<string | null>(null);

  // CSV State
  const [csvText, setCsvText] = useState('');
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [parsedEntries, setParsedEntries] = useState<FlyerFlightLogEntry[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseSuccessMsg, setParseSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handler: Simulate Live API Connection & Sync
  const handleSyncApi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pilotUsername.trim()) {
      setApiFeedback('Please enter a pilot username or member ID.');
      return;
    }

    setIsSyncingApi(true);
    setApiFeedback(null);

    // Realistic API network simulation
    setTimeout(() => {
      const generatedApiLogs: FlyerFlightLogEntry[] = [
        {
          logId: `api_${Date.now()}_1`,
          flightDate: '2026-10-02',
          takeoffSite: 'Interlaken Beatenberg Amisbühl (1,350m)',
          landingZone: 'Höhematte Central Field (567m)',
          gliderWing: 'Advance BiBeta 6 (Tandem 41m²)',
          durationMinutes: 48,
          maxAltitudeM: 2280,
          distanceKm: 16.4,
          flightType: 'Tandem Passenger',
          source: apiProvider as any,
          notes: 'Golden hour thermal flight over Lake Thun and Interlaken',
          syncedAt: new Date().toLocaleTimeString()
        },
        {
          logId: `api_${Date.now()}_2`,
          flightDate: '2026-09-24',
          takeoffSite: 'Zermatt Gornergrat (3,135m)',
          landingZone: 'Zermatt Furi Landing (1,867m)',
          gliderWing: 'Advance IOTA DLS (EN-B)',
          durationMinutes: 92,
          maxAltitudeM: 3840,
          distanceKm: 34.2,
          flightType: 'Thermal XC',
          source: apiProvider as any,
          notes: 'Matterhorn glacier lift with +4.2 m/s average climb',
          syncedAt: new Date().toLocaleTimeString()
        },
        {
          logId: `api_${Date.now()}_3`,
          flightDate: '2026-09-10',
          takeoffSite: 'Lauterbrunnen Männlichen (2,229m)',
          landingZone: 'Stechelberg Landing (910m)',
          gliderWing: 'Advance Xi Light (EN-B)',
          durationMinutes: 62,
          maxAltitudeM: 2590,
          distanceKm: 21.8,
          flightType: 'Solo Alpine',
          source: apiProvider as any,
          notes: 'Spectacular Jungfrau mass transit & Staubbach falls valley run',
          syncedAt: new Date().toLocaleTimeString()
        },
        {
          logId: `api_${Date.now()}_4`,
          flightDate: '2026-08-19',
          takeoffSite: 'Grindelwald First (2,168m)',
          landingZone: 'Bodmi Arena (1,190m)',
          gliderWing: 'Gin Explorer 2',
          durationMinutes: 75,
          maxAltitudeM: 2890,
          distanceKm: 27.6,
          flightType: 'Thermal XC',
          source: apiProvider as any,
          notes: 'Eiger north face convergence zone thermals',
          syncedAt: new Date().toLocaleTimeString()
        },
        {
          logId: `api_${Date.now()}_5`,
          flightDate: '2026-08-04',
          takeoffSite: 'Chamonix Planpraz (2,000m)',
          landingZone: 'Le Bois du Bouchet (1,040m)',
          gliderWing: 'Ozone Geo 6',
          durationMinutes: 44,
          maxAltitudeM: 2310,
          distanceKm: 13.9,
          flightType: 'Solo Alpine',
          source: apiProvider as any,
          notes: 'Mont Blanc panorama flight with gentle valley breeze',
          syncedAt: new Date().toLocaleTimeString()
        }
      ];

      const totalMins = generatedApiLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
      const totalHours = (totalMins / 60).toFixed(1);

      onImportLogs(generatedApiLogs, apiProvider);
      setIsSyncingApi(false);
      setApiFeedback(`Successfully connected to ${apiProvider}! Synced 5 verified flights (${totalHours} flight hours added).`);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 900);
  };

  // Handler: CSV Parsing
  const parseCsvData = (content: string) => {
    setParseError(null);
    setParseSuccessMsg(null);

    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length < 2) {
      setParseError('CSV must include at least a header row and one flight entry.');
      return;
    }

    const header = lines[0].toLowerCase();
    const rows = lines.slice(1);
    const parsed: FlyerFlightLogEntry[] = [];

    for (let i = 0; i < rows.length; i++) {
      const line = rows[i];
      // handle comma or semicolon separated values
      const cols = line.includes(';') ? line.split(';') : line.split(',');

      if (cols.length < 4) continue;

      const dateStr = cols[0]?.trim() || new Date().toISOString().slice(0, 10);
      const takeoff = cols[1]?.trim() || 'Interlaken Launch';
      const landing = cols[2]?.trim() || 'Höhematte Field';
      const wing = cols[3]?.trim() || 'Tandem Paraglider';
      const duration = parseFloat(cols[4]?.trim() || '45') || 45;
      const altitude = cols[5] ? parseFloat(cols[5].trim()) : undefined;
      const distance = cols[6] ? parseFloat(cols[6].trim()) : undefined;
      const fType = (cols[7]?.trim() as any) || 'Solo Alpine';
      const notes = cols[8]?.trim() || '';

      parsed.push({
        logId: `csv_${Date.now()}_${i}`,
        flightDate: dateStr,
        takeoffSite: takeoff,
        landingZone: landing,
        gliderWing: wing,
        durationMinutes: Math.round(duration),
        maxAltitudeM: altitude,
        distanceKm: distance,
        flightType: fType,
        source: 'Manual CSV',
        notes: notes,
        syncedAt: new Date().toLocaleTimeString()
      });
    }

    if (parsed.length === 0) {
      setParseError('Could not parse any valid flights from the provided CSV data.');
      return;
    }

    setParsedEntries(parsed);
    const totalMinutes = parsed.reduce((sum, item) => sum + item.durationMinutes, 0);
    const hours = (totalMinutes / 60).toFixed(1);
    setParseSuccessMsg(`✓ Successfully parsed ${parsed.length} flight records (${hours} flight hours). Click below to apply to your logbook.`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      parseCsvData(text);
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCsv = () => {
    const blob = new Blob([SAMPLE_CSV_CONTENT], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'sample_paragliding_flight_logs.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoadSampleCsv = () => {
    setCsvText(SAMPLE_CSV_CONTENT);
    setCsvFileName('sample_paragliding_flight_logs.csv');
    parseCsvData(SAMPLE_CSV_CONTENT);
  };

  const handleApplyCsv = () => {
    if (parsedEntries.length === 0) {
      parseCsvData(csvText);
    }
    if (parsedEntries.length > 0) {
      onImportLogs(parsedEntries, 'Manual CSV');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#181818] border border-[#8A8A8A]/35 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#8A8A8A]/20 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#E62B1E] font-semibold">
              <CloudLightning className="w-4 h-4" />
              <span>PARAGLIDING LOGBOOK SYNCHRONIZATION</span>
            </div>
            <h3 className="text-xl font-bold text-[#FFFFFF]">
              Sync Flight Logs &amp; Hours
            </h3>
            <p className="text-xs text-[#8A8A8A]">
              Connect to external paragliding leagues via API or upload your CSV logs to automatically populate your total flight hours and airtime telemetry.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#8A8A8A] hover:text-[#FFFFFF] rounded-lg cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Method Tabs */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`py-3 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'api'
                ? 'bg-[#E62B1E] text-[#FFFFFF] border-[#E62B1E] shadow-lg'
                : 'bg-[#111111] text-[#8A8A8A] border-[#8A8A8A]/25 hover:text-[#FFFFFF]'
            }`}
          >
            <Link2 className="w-4 h-4" />
            <span>Connect via API (Live Sync)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`py-3 px-4 rounded-xl border font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-[#E62B1E] text-[#FFFFFF] border-[#E62B1E] shadow-lg'
                : 'bg-[#111111] text-[#8A8A8A] border-[#8A8A8A]/25 hover:text-[#FFFFFF]'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Manual CSV / IGC Input</span>
          </button>
        </div>

        {/* TAB 1: API SYNC */}
        {activeTab === 'api' && (
          <form onSubmit={handleSyncApi} className="space-y-4">
            <div className="p-3.5 bg-[#111111] border border-[#8A8A8A]/20 rounded-xl space-y-1 text-xs text-[#8A8A8A]">
              <div className="text-[#FFFFFF] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#E62B1E]" />
                <span>Automated Paragliding League Telemetry Pull</span>
              </div>
              <p className="font-mono text-[11px] leading-relaxed">
                Connect your XC flight database to sync verified glider tracklogs, airtime duration, takeoff altitudes, and GPS tracks directly into your 2paraglide Flyer Cockpit.
              </p>
            </div>

            {/* Provider Selector */}
            <div>
              <label className="block text-xs font-mono text-[#8A8A8A] mb-1.5">
                PARAGLIDING LOGBOOK PROVIDER / XC LEAGUE *
              </label>
              <select
                value={apiProvider}
                onChange={(e) => setApiProvider(e.target.value as any)}
                className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
              >
                <option value="XContest API">XContest World (Open XC League)</option>
                <option value="DHV-XC API">DHV-XC (Deutscher Hängegleiterverband)</option>
                <option value="Flymaster Cloud">Flymaster Live Tracking Cloud</option>
                <option value="Leonardo XC">Leonardo XC League (paraglidingforum.com)</option>
                <option value="Syride SYS'Nav">Syride SYS&apos;Evolution Live</option>
              </select>
            </div>

            {/* Username & API Key */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                  PILOT USERNAME / MEMBER ID *
                </label>
                <input
                  type="text"
                  required
                  value={pilotUsername}
                  onChange={(e) => setPilotUsername(e.target.value)}
                  placeholder="e.g., elena_flyer_swiss"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 font-mono focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
              <div>
                <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                  API KEY / LIVE TRACK TOKEN (OPTIONAL)
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 font-mono focus:outline-none focus:border-[#E62B1E]"
                />
              </div>
            </div>

            {/* Region / Home Base */}
            <div>
              <label className="block text-xs font-mono text-[#8A8A8A] mb-1">
                PRIMARY ALPINE REGION / CLUB
              </label>
              <input
                type="text"
                value={regionFilter}
                onChange={(e) => setRegionFilter(e.target.value)}
                placeholder="e.g., Swiss Alps / Interlaken Beatenberg"
                className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
              />
            </div>

            {apiFeedback && (
              <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                apiFeedback.includes('Successfully')
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                  : 'bg-red-500/10 border-red-500/40 text-[#E62B1E]'
              }`}>
                {apiFeedback.includes('Successfully') ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#E62B1E]" />
                )}
                <span>{apiFeedback}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#8A8A8A]/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSyncingApi}
                className="px-6 py-2.5 text-xs font-bold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <CloudLightning className="w-4 h-4" />
                <span>{isSyncingApi ? 'Connecting & Fetching Flights...' : `Sync via ${apiProvider} →`}</span>
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: MANUAL CSV / IGC INPUT */}
        {activeTab === 'csv' && (
          <div className="space-y-4">
            {/* Quick Actions toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#8A8A8A]/20 pb-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSampleCsv}
                  className="px-3 py-1.5 text-xs font-mono bg-[#111111] hover:bg-[#222222] border border-[#8A8A8A]/30 text-[#8A8A8A] hover:text-[#FFFFFF] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Download CSV template format"
                >
                  <Download className="w-3.5 h-3.5 text-[#E62B1E]" />
                  <span>Download Sample CSV Template</span>
                </button>
                <button
                  type="button"
                  onClick={handleLoadSampleCsv}
                  className="px-3 py-1.5 text-xs font-mono bg-[#111111] hover:bg-[#222222] border border-[#8A8A8A]/30 text-emerald-400 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Pre-populate 5 realistic Swiss tandem and solo flights"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load Sample Swiss Flights (1-Click)</span>
                </button>
              </div>

              {csvText && (
                <button
                  type="button"
                  onClick={() => {
                    setCsvText('');
                    setCsvFileName(null);
                    setParsedEntries([]);
                    setParseSuccessMsg(null);
                    setParseError(null);
                  }}
                  className="text-xs text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* File Upload Dropzone */}
            <div className="relative border-2 border-dashed border-[#8A8A8A]/35 hover:border-[#E62B1E] rounded-xl p-5 text-center transition-colors bg-[#111111]/60">
              <input
                type="file"
                accept=".csv,.txt,.igc"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="space-y-1.5 pointer-events-none">
                <Upload className="w-6 h-6 text-[#E62B1E] mx-auto" />
                <div className="text-xs font-semibold text-[#FFFFFF]">
                  {csvFileName ? `Selected File: ${csvFileName}` : 'Choose a .CSV file or drag & drop here'}
                </div>
                <div className="text-[11px] font-mono text-[#8A8A8A]">
                  Supports XContest, DHV, Syride, or custom CSV with Duration, Takeoff, and Wing columns
                </div>
              </div>
            </div>

            {/* Raw CSV Text Input */}
            <div>
              <div className="flex items-center justify-between text-xs font-mono text-[#8A8A8A] mb-1.5">
                <span>OR PASTE RAW CSV LOGS DIRECTLY:</span>
                <span className="text-[10px]">Columns: Date, Takeoff, Landing, Wing, Duration(mins)...</span>
              </div>
              <textarea
                rows={5}
                value={csvText}
                onChange={(e) => {
                  setCsvText(e.target.value);
                  if (e.target.value.trim()) {
                    parseCsvData(e.target.value);
                  }
                }}
                placeholder="Date,Takeoff Site,Landing Zone,Glider Wing,Duration (mins),Max Altitude (m),Distance (km),Flight Type,Notes&#10;2026-09-14,Interlaken Beatenberg,Hoehematte,Advance BiBeta 6,45,2150,14.2,Tandem Passenger,Lake Brienz flight"
                className="w-full px-3.5 py-2.5 text-xs bg-[#111111] border border-[#8A8A8A]/35 rounded-xl text-[#FFFFFF] placeholder-[#8A8A8A]/50 font-mono focus:outline-none focus:border-[#E62B1E] resize-y"
              />
            </div>

            {/* Feedback & Error notices */}
            {parseError && (
              <div className="p-3 bg-red-500/10 border border-[#E62B1E]/40 rounded-xl text-xs text-[#E62B1E] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{parseError}</span>
              </div>
            )}

            {parseSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{parseSuccessMsg}</span>
              </div>
            )}

            {/* Parsed Preview Table */}
            {parsedEntries.length > 0 && (
              <div className="border border-[#8A8A8A]/25 rounded-xl overflow-hidden">
                <div className="bg-[#111111] px-3.5 py-2 text-xs font-mono font-semibold text-[#FFFFFF] border-b border-[#8A8A8A]/20 flex items-center justify-between">
                  <span>PREVIEW: {parsedEntries.length} DETECTED FLIGHTS</span>
                  <span className="text-emerald-400">
                    Total Airtime: {(parsedEntries.reduce((s, p) => s + p.durationMinutes, 0) / 60).toFixed(1)} hrs
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto divide-y divide-[#8A8A8A]/15 text-[11px] font-mono">
                  {parsedEntries.map((p, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between gap-3 bg-[#181818]">
                      <div>
                        <span className="text-[#FFFFFF] font-bold">{p.flightDate}</span> · {p.takeoffSite} → {p.landingZone}
                        <div className="text-[#8A8A8A] text-[10px]">{p.gliderWing} ({p.flightType})</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[#E62B1E] font-bold">{p.durationMinutes} mins</span>
                        {p.maxAltitudeM && <div className="text-[#8A8A8A] text-[10px]">{p.maxAltitudeM}m</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#8A8A8A]/20">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-semibold text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyCsv}
                disabled={parsedEntries.length === 0}
                className="px-6 py-2.5 text-xs font-bold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-xl transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {parsedEntries.length > 0
                    ? `Import ${parsedEntries.length} Flights to Logbook →`
                    : 'Parse & Import CSV'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
