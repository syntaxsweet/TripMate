import React, { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeftRight,
  Bell,
  CalendarRange,
  ChevronDown,
  Compass,
  FolderKanban,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  PlusCircle,
  Settings,
  User,
  X,
  AlertTriangle,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { useTripContext } from '../context/TripContext';
import { formatINR } from '../utils/scheduleUtils';

interface AppLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/trips', label: 'My Trips', icon: FolderKanban },
  { to: '/create-trip', label: 'Create New Trip', icon: PlusCircle },
  { to: '/planner', label: 'Itinerary Planner', icon: CalendarRange },
  { to: '/alternatives', label: 'Explore Alternatives', icon: ArrowLeftRight },
  { to: '/expenses', label: 'Expense Tracker', icon: PieChart },
  { to: '/profile', label: 'Profile', icon: User },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const AppLayout: React.FC<AppLayoutProps> = ({ title, subtitle, children }) => {
  const {
    user,
    logout,
    trips,
    activeTrip,
    activeTripMetrics,
    setActiveTripId,
    notifications,
    markAllNotificationsRead,
    toastMessage,
  } = useTripContext();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tripSwitcherOpen, setTripSwitcherOpen] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const initials = (user?.name || 'Traveler')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#FCFBF7] text-[#252B28] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 bg-[#F8F5EC] border-r border-[#252B28]/10">
        <div className="h-16 px-6 flex items-center justify-between border-b border-[#252B28]/10">
          <Link
            to="/"
            className="font-display text-xl font-semibold tracking-tight text-[#174B3A] whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <Compass className="w-5 h-5 text-[#174B3A]" />
            <span>TripMate</span>
          </Link>
        </div>

        <div className="px-4 py-4 border-b border-[#252B28]/10">
          <div className="text-[11px] font-medium text-[#5A645F] mb-1.5 px-2">Active Trip</div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setTripSwitcherOpen((v) => !v)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#252B28]/10 text-left hover:border-[#174B3A]/40 transition-colors"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#252B28] truncate">
                  {activeTrip?.name || 'Select a trip'}
                </div>
                {activeTrip && (
                  <div className="text-xs text-[#5A645F] truncate tabular-nums">
                    {activeTrip.destination} · {activeTrip.daysCount} Days
                  </div>
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-[#5A645F] shrink-0" />
            </button>

            {tripSwitcherOpen && (
              <div className="absolute left-0 right-0 mt-1.5 bg-white rounded-xl border border-[#252B28]/12 shadow-lg z-30 py-1.5 max-h-60 overflow-y-auto">
                {trips.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTripId(t.id);
                      setTripSwitcherOpen(false);
                    }}
                    className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-[#F8F5EC] transition-colors ${
                      t.id === activeTrip?.id ? 'font-semibold text-[#174B3A] bg-[#F8F5EC]/70' : 'text-[#252B28]'
                    }`}
                  >
                    <span className="truncate">{t.name}</span>
                    <span className="text-xs text-[#5A645F] ml-2 shrink-0 tabular-nums">{t.daysCount}d</span>
                  </button>
                ))}
                <div className="border-t border-[#252B28]/10 mt-1 pt-1 px-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTripSwitcherOpen(false);
                      navigate('/create-trip');
                    }}
                    className="w-full px-2 py-1.5 text-xs font-semibold text-[#174B3A] hover:bg-[#F8F5EC] rounded-lg text-left"
                  >
                    + Plan New Trip
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Workspace navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? 'bg-[#174B3A] text-white'
                      : 'text-[#252B28]/80 hover:bg-[#174B3A]/8 hover:text-[#174B3A]'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {activeTrip && activeTripMetrics && (
          <div className="p-4 m-3 rounded-xl bg-white border border-[#252B28]/10">
            <div className="text-xs font-medium text-[#5A645F]">Trip Budget Status</div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-semibold font-mono tabular-nums text-[#252B28]">
                {formatINR(activeTripMetrics.totalEstimatedExpense)}
              </span>
              <span className="text-xs text-[#5A645F] font-mono tabular-nums">
                / {formatINR(activeTrip.budget.total)}
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#F8F5EC] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  activeTripMetrics.isOverBudget
                    ? 'bg-red-600'
                    : activeTripMetrics.budgetUtilizationPct >= 85
                    ? 'bg-[#D8AC55]'
                    : 'bg-[#174B3A]'
                }`}
                style={{ width: `${Math.min(100, activeTripMetrics.budgetUtilizationPct)}%` }}
              />
            </div>
            <div className="mt-1.5 text-xs text-[#5A645F] tabular-nums">
              {activeTripMetrics.isOverBudget
                ? `Over by ${formatINR(Math.abs(activeTripMetrics.remainingBudget))}`
                : `${formatINR(activeTripMetrics.remainingBudget)} remaining`}
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.16 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-72 max-w-[82vw] bg-[#F8F5EC] h-full flex flex-col border-r border-[#252B28]/10 z-10"
            >
              <div className="h-16 px-5 flex items-center justify-between border-b border-[#252B28]/10">
                <Link
                  to="/"
                  onClick={() => setMobileMenuOpen(false)}
                  className="font-display text-xl font-semibold text-[#174B3A] flex items-center gap-2"
                >
                  <Compass className="w-5 h-5" />
                  <span>TripMate</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg text-[#252B28] hover:bg-black/5"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[#174B3A] text-white'
                            : 'text-[#252B28] hover:bg-[#174B3A]/10'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white/95 backdrop-blur border-b border-[#252B28]/10 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-[#252B28] hover:bg-[#F8F5EC]"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-display text-lg sm:text-xl font-semibold text-[#252B28] truncate">
                {title}
              </h1>
              {subtitle && (
                <p className="hidden sm:block text-xs text-[#5A645F] truncate">{subtitle}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {location.pathname !== '/create-trip' && (
              <button
                type="button"
                onClick={() => navigate('/create-trip')}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#174B3A] text-white text-xs font-semibold hover:bg-[#123B2D] transition-colors whitespace-nowrap shrink-0"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>New Trip</span>
              </button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setNotifOpen((v) => !v);
                  setProfileOpen(false);
                }}
                className="relative p-2.5 rounded-xl border border-[#252B28]/10 bg-[#FCFBF7] hover:bg-[#F8F5EC] text-[#252B28] transition-colors"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#D8AC55] text-[#252B28] text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-[#252B28]/12 shadow-xl z-40 overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#252B28]/10 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#252B28]">Trip Alerts</span>
                    <button
                      type="button"
                      onClick={markAllNotificationsRead}
                      className="text-xs font-medium text-[#174B3A] hover:underline"
                    >
                      Mark all read
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto divide-y divide-[#252B28]/8">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-[#5A645F]">
                        No active alerts right now.
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <button
                          key={n.id}
                          type="button"
                          onClick={() => {
                            setNotifOpen(false);
                            if (n.actionRoute) navigate(n.actionRoute);
                          }}
                          className={`w-full text-left px-4 py-3 hover:bg-[#FCFBF7] transition-colors flex items-start gap-3 ${
                            !n.read ? 'bg-[#F8F5EC]/50' : ''
                          }`}
                        >
                          {n.type === 'warning' ? (
                            <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                          ) : n.type === 'success' ? (
                            <CheckCircle2 className="w-4 h-4 text-[#174B3A] mt-0.5 shrink-0" />
                          ) : (
                            <Info className="w-4 h-4 text-[#174B3A] mt-0.5 shrink-0" />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-semibold text-[#252B28]">{n.title}</span>
                              <span className="text-[11px] text-[#5A645F]">{n.createdAt}</span>
                            </div>
                            <p className="text-xs text-[#5A645F] mt-0.5 leading-relaxed">{n.message}</p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setProfileOpen((v) => !v);
                  setNotifOpen(false);
                }}
                className="flex items-center gap-2.5 pl-1.5 pr-3 py-1.5 rounded-xl border border-[#252B28]/10 bg-[#FCFBF7] hover:bg-[#F8F5EC] transition-colors"
              >
                <div className="w-7 h-7 rounded-lg bg-[#174B3A] text-white text-xs font-semibold flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <span className="hidden md:inline text-sm font-medium text-[#252B28] max-w-[120px] truncate">
                  {user?.name || 'Guest Traveler'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#5A645F]" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-[#252B28]/12 shadow-xl z-40 py-1.5">
                  <div className="px-4 py-2.5 border-b border-[#252B28]/10">
                    <div className="text-sm font-semibold text-[#252B28] truncate">
                      {user?.name || 'Guest Traveler'}
                    </div>
                    <div className="text-xs text-[#5A645F] truncate">
                      {user?.email || 'Local workspace mode'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/profile');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#252B28] hover:bg-[#F8F5EC] flex items-center gap-2.5"
                  >
                    <User className="w-4 h-4 text-[#5A645F]" />
                    <span>Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#252B28] hover:bg-[#F8F5EC] flex items-center gap-2.5"
                  >
                    <Settings className="w-4 h-4 text-[#5A645F]" />
                    <span>Settings</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      navigate('/');
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-[#252B28] hover:bg-[#F8F5EC] flex items-center gap-2.5"
                  >
                    <Compass className="w-4 h-4 text-[#5A645F]" />
                    <span>Landing Home</span>
                  </button>
                  <div className="border-t border-[#252B28]/10 mt-1 pt-1">
                    {user ? (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-sm text-red-700 hover:bg-red-50 flex items-center gap-2.5"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileOpen(false);
                          navigate('/login');
                        }}
                        className="w-full px-4 py-2 text-left text-sm font-medium text-[#174B3A] hover:bg-[#F8F5EC]"
                      >
                        Sign In / Create Account
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Feedback Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18 }}
            className="fixed bottom-5 right-5 z-50 bg-[#174B3A] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2.5 max-w-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-[#D8AC55] shrink-0" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
