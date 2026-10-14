import React, { useState } from 'react';
import {
  FlyerNotificationItem,
  FlyerAlertPreferences
} from '../types';
import {
  Bell,
  BellRing,
  AlertTriangle,
  CheckCircle2,
  Info,
  CloudRain,
  ShieldAlert,
  Sliders,
  Check,
  X,
  Clock,
  Sparkles,
  Plane
} from 'lucide-react';

interface FlyerNotificationCenterProps {
  notifications: FlyerNotificationItem[];
  preferences: FlyerAlertPreferences;
  onUpdatePreferences: (prefs: FlyerAlertPreferences) => void;
  onDismissNotification: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSimulateAlert?: () => void;
}

export const FlyerNotificationCenter: React.FC<FlyerNotificationCenterProps> = ({
  notifications,
  preferences,
  onUpdatePreferences,
  onDismissNotification,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSimulateAlert
}) => {
  const [filter, setFilter] = useState<'all' | 'weather' | 'booking' | 'unread'>('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Filter notifications based on active alert preferences and filter tab
  const activeNotifications = notifications.filter((n) => {
    if (n.type === 'weather' && !preferences.weatherAlerts) return false;
    if (n.type === 'booking' && !preferences.bookingUpdates) return false;
    if (n.type === 'waiver' && !preferences.waiverReminders) return false;
    if (n.type === 'pilot' && !preferences.pilotBroadcasts) return false;

    if (filter === 'weather') return n.type === 'weather';
    if (filter === 'booking') return n.type === 'booking' || n.type === 'waiver';
    if (filter === 'unread') return !n.read;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="bg-[#181818] border border-[#8A8A8A]/25 rounded-2xl overflow-hidden shadow-xl">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-[#8A8A8A]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-xl bg-[#111111] border border-[#8A8A8A]/30 flex items-center justify-center text-[#E62B1E] shrink-0">
            {unreadCount > 0 ? (
              <BellRing className="w-5 h-5 animate-pulse text-[#E62B1E]" />
            ) : (
              <Bell className="w-5 h-5 text-[#8A8A8A]" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#E62B1E] text-[#FFFFFF] text-[10px] font-bold font-mono flex items-center justify-center shadow-md">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#FFFFFF]">
                Flyer Notification Center
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#111111] border border-[#8A8A8A]/30 text-[#8A8A8A]">
                REAL-TIME TELEMETRY
              </span>
            </div>
            <p className="text-xs text-[#8A8A8A] mt-0.5">
              Live tandem flight escrow updates, alpine weather advisories, and pre-flight statutory waiver notices.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2 text-xs font-mono">
          <button
            type="button"
            onClick={() => setShowPreferences(!showPreferences)}
            className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
              showPreferences
                ? 'bg-[#E62B1E] text-[#FFFFFF] border-[#E62B1E]'
                : 'bg-[#111111] text-[#8A8A8A] border-[#8A8A8A]/30 hover:text-[#FFFFFF]'
            }`}
            title="Configure which real-time alerts you receive"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Alert Preferences</span>
          </button>

          {onSimulateAlert && (
            <button
              type="button"
              onClick={onSimulateAlert}
              className="px-3 py-1.5 rounded-lg bg-[#111111] border border-[#8A8A8A]/30 text-[#8A8A8A] hover:text-[#FFFFFF] transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Test real-time notification push"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E62B1E]" />
              <span className="hidden sm:inline">Simulate Alert</span>
            </button>
          )}

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllAsRead}
              className="px-3 py-1.5 rounded-lg bg-[#111111] border border-[#8A8A8A]/30 text-[#8A8A8A] hover:text-[#FFFFFF] transition-colors cursor-pointer"
            >
              Mark Read
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-2.5 py-1.5 rounded-lg bg-[#111111] border border-[#8A8A8A]/30 text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
            aria-label={isExpanded ? 'Collapse panel' : 'Expand panel'}
          >
            {isExpanded ? '▲' : '▼'}
          </button>
        </div>
      </div>

      {/* Alert Preferences Drawer */}
      {showPreferences && (
        <div className="p-4 sm:p-5 bg-[#111111] border-b border-[#8A8A8A]/25 space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-mono text-[#E62B1E] font-semibold">
                ALERT PREFERENCES &amp; DISPATCH CHANNELS
              </div>
              <p className="text-xs text-[#8A8A8A]">
                Toggle real-time notifications to customize your flight telemetry feed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowPreferences(false)}
              className="text-[#8A8A8A] hover:text-[#FFFFFF] text-xs font-mono cursor-pointer"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Toggle 1: Weather Alerts */}
            <div
              onClick={() =>
                onUpdatePreferences({
                  ...preferences,
                  weatherAlerts: !preferences.weatherAlerts
                })
              }
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                preferences.weatherAlerts
                  ? 'bg-[#181818] border-[#E62B1E]/60 text-[#FFFFFF]'
                  : 'bg-[#181818]/60 border-[#8A8A8A]/20 text-[#8A8A8A]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <CloudRain className="w-3.5 h-3.5 text-[#E62B1E]" />
                  <span>Weather &amp; Föhn Alerts</span>
                </div>
                <p className="text-[11px] text-[#8A8A8A] font-mono leading-relaxed">
                  Real-time wind holds, thermal shifts, and launch safety advisories.
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                  preferences.weatherAlerts
                    ? 'bg-[#E62B1E] border-[#E62B1E] text-[#FFFFFF]'
                    : 'bg-[#111111] border-[#8A8A8A]/40 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Toggle 2: Booking & Escrow */}
            <div
              onClick={() =>
                onUpdatePreferences({
                  ...preferences,
                  bookingUpdates: !preferences.bookingUpdates
                })
              }
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                preferences.bookingUpdates
                  ? 'bg-[#181818] border-[#E62B1E]/60 text-[#FFFFFF]'
                  : 'bg-[#181818]/60 border-[#8A8A8A]/20 text-[#8A8A8A]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Plane className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Booking &amp; Escrow</span>
                </div>
                <p className="text-[11px] text-[#8A8A8A] font-mono leading-relaxed">
                  TWINT escrow holds, confirmed boarding passes, and receipts.
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                  preferences.bookingUpdates
                    ? 'bg-[#E62B1E] border-[#E62B1E] text-[#FFFFFF]'
                    : 'bg-[#111111] border-[#8A8A8A]/40 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Toggle 3: Legal Waiver Reminders */}
            <div
              onClick={() =>
                onUpdatePreferences({
                  ...preferences,
                  waiverReminders: !preferences.waiverReminders
                })
              }
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                preferences.waiverReminders
                  ? 'bg-[#181818] border-[#E62B1E]/60 text-[#FFFFFF]'
                  : 'bg-[#181818]/60 border-[#8A8A8A]/20 text-[#8A8A8A]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>Digital Waiver Clearance</span>
                </div>
                <p className="text-[11px] text-[#8A8A8A] font-mono leading-relaxed">
                  Statutory SHV pre-flight liability signature reminders before launch.
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                  preferences.waiverReminders
                    ? 'bg-[#E62B1E] border-[#E62B1E] text-[#FFFFFF]'
                    : 'bg-[#111111] border-[#8A8A8A]/40 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Toggle 4: Pilot Broadcasts */}
            <div
              onClick={() =>
                onUpdatePreferences({
                  ...preferences,
                  pilotBroadcasts: !preferences.pilotBroadcasts
                })
              }
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                preferences.pilotBroadcasts
                  ? 'bg-[#181818] border-[#E62B1E]/60 text-[#FFFFFF]'
                  : 'bg-[#181818]/60 border-[#8A8A8A]/20 text-[#8A8A8A]'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <Bell className="w-3.5 h-3.5 text-blue-400" />
                  <span>Pilot Broadcasts</span>
                </div>
                <p className="text-[11px] text-[#8A8A8A] font-mono leading-relaxed">
                  Meeting point updates and direct tandem pilot announcements.
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
                  preferences.pilotBroadcasts
                    ? 'bg-[#E62B1E] border-[#E62B1E] text-[#FFFFFF]'
                    : 'bg-[#111111] border-[#8A8A8A]/40 text-transparent'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Notification Body */}
      {isExpanded && (
        <div className="p-4 sm:p-5 space-y-4">
          {/* Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs font-mono border-b border-[#8A8A8A]/20 pb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  filter === 'all'
                    ? 'bg-[#E62B1E] text-[#FFFFFF] font-bold'
                    : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('weather')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  filter === 'weather'
                    ? 'bg-[#E62B1E] text-[#FFFFFF] font-bold'
                    : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
              >
                <CloudRain className="w-3 h-3" />
                <span>Weather</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('booking')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ${
                  filter === 'booking'
                    ? 'bg-[#E62B1E] text-[#FFFFFF] font-bold'
                    : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
              >
                <Plane className="w-3 h-3" />
                <span>Bookings &amp; Escrow</span>
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
                  filter === 'unread'
                    ? 'bg-[#E62B1E] text-[#FFFFFF] font-bold'
                    : 'text-[#8A8A8A] hover:text-[#FFFFFF]'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-[#8A8A8A] hover:text-[#E62B1E] cursor-pointer"
              >
                Clear History
              </button>
            )}
          </div>

          {/* Notifications List */}
          {activeNotifications.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#111111] border border-[#8A8A8A]/20 flex items-center justify-center text-[#8A8A8A] mx-auto">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-sm font-semibold text-[#FFFFFF]">
                No Active Notifications in This View
              </div>
              <p className="text-xs text-[#8A8A8A] max-w-sm mx-auto">
                All tandem reservations and alpine weather telemetry are clear. You will be alerted immediately if wind conditions or slot manifests update.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeNotifications.map((notif) => {
                const isWeather = notif.type === 'weather';
                const isWaiver = notif.type === 'waiver';
                const isBooking = notif.type === 'booking';

                return (
                  <div
                    key={notif.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row items-start justify-between gap-3 ${
                      notif.read
                        ? 'bg-[#111111]/70 border-[#8A8A8A]/20 opacity-80'
                        : notif.severity === 'critical'
                        ? 'bg-[#111111] border-[#E62B1E]/70 shadow-[0_0_15px_rgba(230,43,30,0.15)]'
                        : notif.severity === 'warning'
                        ? 'bg-[#111111] border-amber-500/50'
                        : 'bg-[#111111] border-emerald-500/40'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0">
                        {isWeather ? (
                          <div className="w-8 h-8 rounded-lg bg-[#181818] border border-[#E62B1E]/40 flex items-center justify-center text-[#E62B1E]">
                            <CloudRain className="w-4 h-4" />
                          </div>
                        ) : isWaiver ? (
                          <div className="w-8 h-8 rounded-lg bg-[#181818] border border-amber-500/40 flex items-center justify-center text-amber-400">
                            <ShieldAlert className="w-4 h-4" />
                          </div>
                        ) : isBooking && notif.severity === 'success' ? (
                          <div className="w-8 h-8 rounded-lg bg-[#181818] border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-[#181818] border border-blue-500/40 flex items-center justify-center text-blue-400">
                            <Plane className="w-4 h-4" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center flex-wrap gap-2">
                          <span className="text-xs font-bold text-[#FFFFFF]">
                            {notif.title}
                          </span>
                          {!notif.read && (
                            <span className="w-2 h-2 rounded-full bg-[#E62B1E] shrink-0" />
                          )}
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase font-semibold ${
                              notif.severity === 'critical'
                                ? 'bg-red-500/10 border-red-500/40 text-[#E62B1E]'
                                : notif.severity === 'warning'
                                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                                : notif.severity === 'success'
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                : 'bg-blue-500/10 border-blue-500/40 text-blue-400'
                            }`}
                          >
                            {notif.type}
                          </span>
                          {notif.locationName && (
                            <span className="text-[10px] font-mono text-[#8A8A8A]">
                              📍 {notif.locationName}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#8A8A8A] leading-relaxed">
                          {notif.message}
                        </p>

                        <div className="flex items-center gap-3 text-[10px] font-mono text-[#8A8A8A] pt-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{notif.timestamp}</span>
                          </div>
                          {notif.bookingId && (
                            <span>Ref: #{notif.bookingId}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0">
                      {!notif.read && (
                        <button
                          type="button"
                          onClick={() => onMarkAsRead(notif.id)}
                          className="px-2.5 py-1 text-[11px] font-mono rounded bg-[#181818] border border-[#8A8A8A]/30 text-[#8A8A8A] hover:text-[#FFFFFF] cursor-pointer"
                          title="Mark notification as read"
                        >
                          Mark Read
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onDismissNotification(notif.id)}
                        className="p-1 text-[#8A8A8A] hover:text-[#E62B1E] rounded cursor-pointer"
                        title="Dismiss notification"
                        aria-label="Dismiss notification"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
