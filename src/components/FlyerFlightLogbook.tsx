import React, { useState } from 'react';
import { FlyerFlightLogEntry, FlyerLogbookSummary } from '../types';
import {
  Clock,
  Compass,
  Download,
  FileSpreadsheet,
  CloudLightning,
  Plane,
  Trash2,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  Sparkles
} from 'lucide-react';

interface FlyerFlightLogbookProps {
  entries: FlyerFlightLogEntry[];
  summary: FlyerLogbookSummary;
  onOpenSyncModal: () => void;
  onAddManualEntry?: (entry: FlyerFlightLogEntry) => void;
  onDeleteEntry: (logId: string) => void;
}

export const FlyerFlightLogbook: React.FC<FlyerFlightLogbookProps> = ({
  entries,
  summary,
  onOpenSyncModal,
  onAddManualEntry,
  onDeleteEntry
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Quick Add State
  const [quickDate, setQuickDate] = useState(new Date().toISOString().slice(0, 10));
  const [quickTakeoff, setQuickTakeoff] = useState('Interlaken Beatenberg Amisbühl');
  const [quickLanding, setQuickLanding] = useState('Höhematte Central Field');
  const [quickWing, setQuickWing] = useState('Advance BiBeta 6');
  const [quickDuration, setQuickDuration] = useState('45');
  const [quickAltitude, setQuickAltitude] = useState('2100');
  const [quickDistance, setQuickDistance] = useState('14.5');
  const [quickType, setQuickType] = useState<any>('Tandem Passenger');
  const [quickNotes, setQuickNotes] = useState('');

  const filteredEntries = entries.filter((e) => {
    if (filterType !== 'ALL' && e.flightType !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        e.takeoffSite.toLowerCase().includes(q) ||
        e.landingZone.toLowerCase().includes(q) ||
        e.gliderWing.toLowerCase().includes(q) ||
        e.flightDate.includes(q)
      );
    }
    return true;
  });

  const handleExportCsv = () => {
    if (entries.length === 0) return;
    const header = 'Date,Takeoff Site,Landing Zone,Glider Wing,Duration (mins),Max Altitude (m),Distance (km),Flight Type,Source,Notes\n';
    const rows = entries
      .map(
        (e) =>
          `"${e.flightDate}","${e.takeoffSite}","${e.landingZone}","${e.gliderWing}",${e.durationMinutes},${e.maxAltitudeM || ''},${e.distanceKm || ''},"${e.flightType}","${e.source}","${e.notes || ''}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `2paraglide_flight_logbook_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSaveQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAddManualEntry) return;

    const newLog: FlyerFlightLogEntry = {
      logId: `manual_${Date.now()}`,
      flightDate: quickDate,
      takeoffSite: quickTakeoff.trim(),
      landingZone: quickLanding.trim(),
      gliderWing: quickWing.trim(),
      durationMinutes: parseInt(quickDuration, 10) || 45,
      maxAltitudeM: parseInt(quickAltitude, 10) || undefined,
      distanceKm: parseFloat(quickDistance) || undefined,
      flightType: quickType,
      source: 'Direct 2paraglide',
      notes: quickNotes.trim(),
      syncedAt: new Date().toLocaleTimeString()
    };

    onAddManualEntry(newLog);
    setShowQuickAdd(false);
    setQuickNotes('');
  };

  return (
    <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-2xl overflow-hidden shadow-xl space-y-6">
      {/* Top Header & Sync Action Bar */}
      <div className="p-5 sm:p-6 border-b border-[#8A8A8A]/20 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2 text-xs font-mono text-[#E62B1E] font-semibold">
            <Clock className="w-4 h-4" />
            <span>PILOT LOGBOOK &amp; AIRTIME TELEMETRY</span>
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#FFFFFF] tracking-tight">
            Synced Paragliding Flight Hours
          </h3>
          <p className="text-xs text-[#8A8A8A] leading-relaxed">
            Synchronize verified flight hours and airtime logs from external paragliding leagues (XContest, DHV-XC, Flymaster) or import manual CSV records.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onOpenSyncModal}
            className="px-4 py-2.5 text-xs font-bold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-xl transition-all shadow-[0_0_15px_rgba(230,43,30,0.35)] flex items-center gap-2 cursor-pointer"
          >
            <CloudLightning className="w-4 h-4" />
            <span>Sync Flight Logs</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="px-3.5 py-2.5 text-xs font-semibold bg-[#111111] border border-[#8A8A8A]/30 text-[#8A8A8A] hover:text-[#FFFFFF] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Log Flight</span>
          </button>

          {entries.length > 0 && (
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-3.5 py-2.5 text-xs font-mono bg-[#111111] border border-[#8A8A8A]/30 text-[#8A8A8A] hover:text-[#FFFFFF] rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Download entire logbook in CSV format"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Telemetry Metrics Cards */}
      <div className="px-5 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Flight Hours */}
          <div className="bg-[#111111] border border-[#E62B1E]/40 rounded-xl p-4 space-y-1 relative overflow-hidden shadow-inner">
            <div className="text-[11px] font-mono text-[#8A8A8A] flex items-center justify-between">
              <span>TOTAL FLIGHT HOURS</span>
              <Clock className="w-3.5 h-3.5 text-[#E62B1E]" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#FFFFFF] tracking-tight">
              {summary.totalHours.toFixed(1)} <span className="text-sm font-normal text-[#E62B1E]">hrs</span>
            </div>
            <div className="text-[11px] text-[#8A8A8A] font-mono flex items-center gap-1 pt-0.5">
              <span>{Math.round(summary.totalHours * 60)} minutes total airtime</span>
            </div>
          </div>

          {/* Card 2: Total Flights Logged */}
          <div className="bg-[#111111] border border-[#8A8A8A]/25 rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-mono text-[#8A8A8A] flex items-center justify-between">
              <span>FLIGHTS LOGGED</span>
              <Plane className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#FFFFFF] tracking-tight">
              {summary.totalFlights} <span className="text-sm font-normal text-[#8A8A8A]">flights</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono">
              {summary.connectedProvider || 'Manual & API Verified'}
            </div>
          </div>

          {/* Card 3: Longest Flight */}
          <div className="bg-[#111111] border border-[#8A8A8A]/25 rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-mono text-[#8A8A8A] flex items-center justify-between">
              <span>LONGEST GLIDE AIRTIME</span>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#FFFFFF] tracking-tight">
              {Math.floor(summary.longestFlightMins / 60)}h {summary.longestFlightMins % 60}m
            </div>
            <div className="text-[11px] text-[#8A8A8A] font-mono">
              Peak alpine endurance glide
            </div>
          </div>

          {/* Card 4: Max Altitude */}
          <div className="bg-[#111111] border border-[#8A8A8A]/25 rounded-xl p-4 space-y-1">
            <div className="text-[11px] font-mono text-[#8A8A8A] flex items-center justify-between">
              <span>MAX ALTITUDE REACHED</span>
              <Compass className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-3xl font-extrabold font-mono text-[#FFFFFF] tracking-tight">
              {summary.maxAltitudeM.toLocaleString()} <span className="text-sm font-normal text-[#8A8A8A]">m ASL</span>
            </div>
            <div className="text-[11px] text-[#8A8A8A] font-mono">
              Above sea level altitude
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Single Flight Form */}
      {showQuickAdd && (
        <form
          onSubmit={handleSaveQuickAdd}
          className="mx-5 sm:mx-6 p-4 sm:p-5 bg-[#111111] border border-[#8A8A8A]/30 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#8A8A8A]/20 pb-2">
            <div className="text-xs font-mono font-bold text-[#FFFFFF] flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#E62B1E]" />
              <span>LOG INDIVIDUAL FLIGHT MANUALLY</span>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickAdd(false)}
              className="text-xs text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#8A8A8A] mb-1">DATE *</label>
              <input
                type="date"
                required
                value={quickDate}
                onChange={(e) => setQuickDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#8A8A8A]/30 rounded-lg text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#8A8A8A] mb-1">TAKEOFF SITE *</label>
              <input
                type="text"
                required
                value={quickTakeoff}
                onChange={(e) => setQuickTakeoff(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#8A8A8A]/30 rounded-lg text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#8A8A8A] mb-1">LANDING ZONE *</label>
              <input
                type="text"
                required
                value={quickLanding}
                onChange={(e) => setQuickLanding(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#8A8A8A]/30 rounded-lg text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#8A8A8A] mb-1">GLIDER / WING *</label>
              <input
                type="text"
                required
                value={quickWing}
                onChange={(e) => setQuickWing(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#8A8A8A]/30 rounded-lg text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-mono text-[#8A8A8A] mb-1">DURATION (MINUTES) *</label>
              <input
                type="number"
                min="1"
                required
                value={quickDuration}
                onChange={(e) => setQuickDuration(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#8A8A8A]/30 rounded-lg text-[#FFFFFF] font-mono focus:outline-none focus:border-[#E62B1E]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#8A8A8A] mb-1">MAX ALTITUDE (M)</label>
              <input
                type="number"
                value={quickAltitude}
                onChange={(e) => setQuickAltitude(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#8A8A8A]/30 rounded-lg text-[#FFFFFF] font-mono focus:outline-none focus:border-[#E62B1E]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#8A8A8A] mb-1">DISTANCE (KM)</label>
              <input
                type="number"
                step="0.1"
                value={quickDistance}
                onChange={(e) => setQuickDistance(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#8A8A8A]/30 rounded-lg text-[#FFFFFF] font-mono focus:outline-none focus:border-[#E62B1E]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-mono text-[#8A8A8A] mb-1">FLIGHT TYPE</label>
              <select
                value={quickType}
                onChange={(e) => setQuickType(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#8A8A8A]/30 rounded-lg text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
              >
                <option value="Tandem Passenger">Tandem Passenger</option>
                <option value="Solo Alpine">Solo Alpine</option>
                <option value="Thermal XC">Thermal XC</option>
                <option value="Soaring">Soaring</option>
                <option value="Training">Training</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-mono text-[#8A8A8A] mb-1">FLIGHT NOTES / CONDITIONS</label>
            <input
              type="text"
              value={quickNotes}
              onChange={(e) => setQuickNotes(e.target.value)}
              placeholder="e.g., Smooth late afternoon thermals with calm 5 knot westerly wind"
              className="w-full px-3 py-2 text-xs bg-[#181818] border border-[#8A8A8A]/30 rounded-lg text-[#FFFFFF] focus:outline-none focus:border-[#E62B1E]"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-[#E62B1E] hover:bg-[#c82317] text-[#FFFFFF] rounded-lg cursor-pointer"
            >
              Add Flight to Logbook
            </button>
          </div>
        </form>
      )}

      {/* Flight History Table Controls & Search */}
      <div className="px-5 sm:px-6 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-[#8A8A8A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search takeoff, landing site, or glider..."
              className="w-full pl-9 pr-3 py-2 bg-[#111111] border border-[#8A8A8A]/30 rounded-lg text-xs text-[#FFFFFF] placeholder-[#8A8A8A]/60 focus:outline-none focus:border-[#E62B1E]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[#8A8A8A] text-[11px]">Type:</span>
            {['ALL', 'Tandem Passenger', 'Solo Alpine', 'Thermal XC'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilterType(t)}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  filterType === t
                    ? 'bg-[#E62B1E] text-[#FFFFFF] font-bold'
                    : 'bg-[#111111] text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Entries Table */}
        {entries.length === 0 ? (
          <div className="py-10 text-center space-y-3 border border-[#8A8A8A]/20 rounded-xl bg-[#111111]/40">
            <div className="w-12 h-12 rounded-full bg-[#181818] border border-[#8A8A8A]/30 flex items-center justify-center text-[#E62B1E] mx-auto">
              <CloudLightning className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="text-sm font-bold text-[#FFFFFF]">
                No Synced Flights in Logbook Yet
              </div>
              <p className="text-xs text-[#8A8A8A] max-w-sm mx-auto">
                Connect your paragliding league account (XContest, DHV-XC, Flymaster) or import a CSV file to automatically populate your total flight hours.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenSyncModal}
              className="px-4 py-2 text-xs font-bold text-[#FFFFFF] bg-[#E62B1E] hover:bg-[#c82317] rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2 shadow-md"
            >
              <CloudLightning className="w-3.5 h-3.5" />
              <span>Sync Flight Logs via API or CSV →</span>
            </button>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#8A8A8A] font-mono border border-[#8A8A8A]/20 rounded-xl bg-[#111111]">
            No flights match your search query &quot;{search}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto border border-[#8A8A8A]/20 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#111111] border-b border-[#8A8A8A]/25 text-[#8A8A8A] font-mono">
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Flight Path (Takeoff → Landing)</th>
                  <th className="py-3 px-4 font-semibold">Glider Model</th>
                  <th className="py-3 px-4 font-semibold text-right">Duration</th>
                  <th className="py-3 px-4 font-semibold text-right">Altitude</th>
                  <th className="py-3 px-4 font-semibold">Source</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#8A8A8A]/15 font-mono">
                {filteredEntries.map((log) => (
                  <tr key={log.logId} className="hover:bg-[#111111]/70 transition-colors">
                    <td className="py-3 px-4 text-[#FFFFFF] font-semibold whitespace-nowrap">
                      {log.flightDate}
                    </td>
                    <td className="py-3 px-4 min-w-[220px]">
                      <div className="text-[#FFFFFF] font-medium truncate">{log.takeoffSite}</div>
                      <div className="text-[#8A8A8A] text-[11px] truncate">→ {log.landingZone}</div>
                      {log.notes && (
                        <div className="text-[10px] text-[#8A8A8A]/80 italic mt-0.5 truncate">{log.notes}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-[#8A8A8A]">
                      <div className="text-[#FFFFFF]">{log.gliderWing}</div>
                      <div className="text-[10px] text-amber-400">{log.flightType}</div>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap font-bold text-[#E62B1E]">
                      {log.durationMinutes} min ({ (log.durationMinutes / 60).toFixed(1) }h)
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap text-[#8A8A8A]">
                      {log.maxAltitudeM ? `${log.maxAltitudeM}m` : '—'}
                      {log.distanceKm && <div className="text-[10px]">{log.distanceKm} km</div>}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-[#111111] border border-[#8A8A8A]/30 text-emerald-400 font-semibold">
                        {log.source}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(log.logId)}
                        className="p-1 text-[#8A8A8A] hover:text-[#E62B1E] rounded cursor-pointer"
                        title="Delete log entry"
                        aria-label="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="px-5 sm:px-6 pb-5 text-[11px] font-mono text-[#8A8A8A] flex items-center justify-between border-t border-[#8A8A8A]/15 pt-3">
        <span>Logged flights count towards official SHV tandem qualification and pilot airtime records.</span>
        <span>Last synced: {summary.lastSyncedAt || 'Live synced'}</span>
      </div>
    </div>
  );
};
