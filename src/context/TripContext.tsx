import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlternativeActivityOption,
  AppNotification,
  AppSettings,
  DayPace,
  Trip,
  TripMetrics,
  UserProfile,
  WizardDraft,
} from '../types/trip';
import {
  addMinutesToTime,
  autoResolveDayConflicts,
  calculateTripMetrics,
  formatINR,
  sortActivitiesByTime,
} from '../utils/scheduleUtils';
import {
  createSeededDefaultTrip,
  generateMockItinerary,
  ItineraryGenerationRequest,
} from '../utils/itineraryGenerator';

const STORAGE_KEYS = {
  USER: 'tripmate_user_v1',
  TRIPS: 'tripmate_trips_v1',
  ACTIVE_TRIP_ID: 'tripmate_active_trip_id_v1',
  SETTINGS: 'tripmate_settings_v1',
  WIZARD_DRAFT: 'tripmate_wizard_draft_v1',
};

const DEFAULT_SETTINGS: AppSettings = {
  budgetWarningThresholdPct: 90,
  enableConflictDetection: true,
  autoSortByTime: true,
  defaultDayStartTime: '08:30',
};

const DEFAULT_WIZARD_DRAFT: WizardDraft = {
  origin: 'Bengaluru',
  destination: 'Jaipur',
  daysCount: 3,
  adults: 2,
  children: 0,
  budget: {
    total: 15000,
    daily: 5000,
    food: 4500,
    transport: 3500,
    attraction: 7000,
  },
  travelStyle: 'Balanced',
  dayPlans: [
    { dayNumber: 1, title: 'Arrival & Relaxed Exploration', pace: 'Relaxed', notes: ['Local food experiences'] },
    { dayNumber: 2, title: 'Heritage & Landmarks', pace: 'Activity-heavy', notes: ['Nature and sightseeing'] },
    { dayNumber: 3, title: 'Markets & Departure', pace: 'Balanced', notes: ['Avoid crowded locations'] },
  ],
  generalNotes: ['Nature and sightseeing', 'Local food experiences'],
};

interface TripContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => { ok: boolean; error?: string };
  register: (name: string, email: string, password: string) => { ok: boolean; error?: string };
  logout: () => void;
  updateProfile: (patch: Partial<UserProfile>) => void;

  trips: Trip[];
  activeTrip: Trip | null;
  activeTripMetrics: TripMetrics | null;
  setActiveTripId: (id: string) => void;
  createTripFromRequest: (req: ItineraryGenerationRequest) => Trip;
  regenerateActiveTrip: (styleOverride?: Trip['travelStyle']) => void;
  duplicateTrip: (id: string) => Trip | null;
  deleteTrip: (id: string) => void;

  addActivity: (activity: Omit<Activity, 'id' | 'endTime'>) => void;
  updateActivity: (activityId: string, patch: Partial<Activity>) => void;
  deleteActivity: (activityId: string) => void;
  replaceActivityWithAlternative: (targetActivityId: string, alt: AlternativeActivityOption) => void;
  moveOrReorderActivity: (activityId: string, targetDay: number, targetIndex?: number) => void;
  autoResolveDay: (day: number) => void;
  updateDayPace: (dayNumber: number, pace: DayPace) => void;
  updateTripMeta: (patch: Partial<Pick<Trip, 'name' | 'budget' | 'travelStyle'>>) => void;

  wizardDraft: WizardDraft;
  setWizardDraft: React.Dispatch<React.SetStateAction<WizardDraft>>;
  selectedSwapActivityId: string | null;
  setSelectedSwapActivityId: (id: string | null) => void;

  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => void;
  resetDemoData: () => void;

  notifications: AppNotification[];
  readNotificationIds: string[];
  markAllNotificationsRead: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
}

const TripContext = createContext<TripContextValue | undefined>(undefined);

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export const TripProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => loadJson<UserProfile | null>(STORAGE_KEYS.USER, null));
  const [trips, setTrips] = useState<Trip[]>(() => {
    const stored = loadJson<Trip[]>(STORAGE_KEYS.TRIPS, []);
    return stored.length > 0 ? stored : [createSeededDefaultTrip()];
  });
  const [activeTripId, setActiveTripIdState] = useState<string>(() => {
    const storedId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TRIP_ID);
    return storedId || 'trip-udaipur-demo';
  });
  const [settings, setSettings] = useState<AppSettings>(() =>
    loadJson<AppSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS)
  );
  const [wizardDraft, setWizardDraft] = useState<WizardDraft>(() =>
    loadJson<WizardDraft>(STORAGE_KEYS.WIZARD_DRAFT, DEFAULT_WIZARD_DRAFT)
  );
  const [selectedSwapActivityId, setSelectedSwapActivityId] = useState<string | null>(null);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    window.setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRIPS, JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TRIP_ID, activeTripId);
  }, [activeTripId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.WIZARD_DRAFT, JSON.stringify(wizardDraft));
  }, [wizardDraft]);

  const activeTrip = useMemo(() => {
    return trips.find((t) => t.id === activeTripId) || trips[0] || null;
  }, [trips, activeTripId]);

  const activeTripMetrics = useMemo(() => {
    return activeTrip ? calculateTripMetrics(activeTrip) : null;
  }, [activeTrip]);

  const setActiveTripId = (id: string) => {
    setActiveTripIdState(id);
  };

  const login = (email: string, password: string, rememberMe = true) => {
    if (!email.trim() || !email.includes('@')) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    const existingName =
      user?.email === email ? user.name : email.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    setUser({
      id: 'user-1',
      name: existingName || 'Aarav Mehta',
      email: email.trim(),
      homeCity: user?.homeCity || 'Mumbai',
      defaultTravelStyle: user?.defaultTravelStyle || 'Balanced',
      preferredNotes: user?.preferredNotes || ['Nature and sightseeing', 'Local food experiences'],
      rememberMe,
    });
    showToast(`Welcome back, ${existingName}`);
    return { ok: true };
  };

  const register = (name: string, email: string, password: string) => {
    if (name.trim().length < 2) {
      return { ok: false, error: 'Please enter your full name.' };
    }
    if (!email.trim() || !email.includes('@')) {
      return { ok: false, error: 'Please enter a valid email address.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Password must be at least 6 characters.' };
    }
    const profile: UserProfile = {
      id: `user-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      homeCity: 'Bengaluru',
      defaultTravelStyle: 'Balanced',
      preferredNotes: ['Local food experiences'],
      rememberMe: true,
    };
    setUser(profile);
    showToast(`Account created for ${profile.name}`);
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    showToast('Signed out of TripMate');
  };

  const updateProfile = (patch: Partial<UserProfile>) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    showToast('Profile preferences saved');
  };

  const updateActiveTripRecord = (updater: (trip: Trip) => Trip) => {
    if (!activeTrip) return;
    setTrips((prev) =>
      prev.map((t) =>
        t.id === activeTrip.id
          ? { ...updater(t), updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const createTripFromRequest = (req: ItineraryGenerationRequest): Trip => {
    const newTrip = generateMockItinerary(req);
    setTrips((prev) => [newTrip, ...prev]);
    setActiveTripIdState(newTrip.id);
    showToast(`Generated ${newTrip.daysCount}-day ${newTrip.destination} itinerary`);
    return newTrip;
  };

  const regenerateActiveTrip = (styleOverride?: Trip['travelStyle']) => {
    if (!activeTrip) return;
    const regenerated = generateMockItinerary({
      origin: activeTrip.origin,
      destination: activeTrip.destination,
      daysCount: activeTrip.daysCount,
      adults: activeTrip.adults,
      children: activeTrip.children,
      budget: activeTrip.budget,
      travelStyle: styleOverride || activeTrip.travelStyle,
      dayPlans: activeTrip.dayPlans,
      generalNotes: activeTrip.generalNotes,
    });
    const updatedTrip: Trip = {
      ...regenerated,
      id: activeTrip.id,
      name: activeTrip.name,
      createdAt: activeTrip.createdAt,
    };
    setTrips((prev) => prev.map((t) => (t.id === activeTrip.id ? updatedTrip : t)));
    showToast(`Regenerated itinerary for ${activeTrip.destination}`);
  };

  const duplicateTrip = (id: string): Trip | null => {
    const found = trips.find((t) => t.id === id);
    if (!found) return null;
    const now = new Date().toISOString();
    const copy: Trip = {
      ...found,
      id: `trip-${Date.now()}`,
      name: `${found.name} (Copy)`,
      activities: found.activities.map((a, idx) => ({ ...a, id: `act-${Date.now()}-${idx}` })),
      createdAt: now,
      updatedAt: now,
    };
    setTrips((prev) => [copy, ...prev]);
    setActiveTripIdState(copy.id);
    showToast(`Duplicated "${found.name}"`);
    return copy;
  };

  const deleteTrip = (id: string) => {
    setTrips((prev) => {
      const next = prev.filter((t) => t.id !== id);
      if (next.length === 0) {
        const seeded = createSeededDefaultTrip();
        setActiveTripIdState(seeded.id);
        return [seeded];
      }
      if (activeTripId === id) {
        setActiveTripIdState(next[0].id);
      }
      return next;
    });
    showToast('Trip removed');
  };

  const addActivity = (activityInput: Omit<Activity, 'id' | 'endTime'>) => {
    const duration = Math.max(15, Number(activityInput.durationMinutes) || 60);
    const endTime = addMinutesToTime(activityInput.startTime, duration);
    const newAct: Activity = {
      ...activityInput,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      durationMinutes: duration,
      endTime,
    };

    updateActiveTripRecord((trip) => {
      const nextActs = [...trip.activities, newAct];
      return {
        ...trip,
        activities: settings.autoSortByTime ? sortActivitiesByTime(nextActs) : nextActs,
      };
    });
    showToast(`Added "${newAct.title}" to Day ${newAct.day}`);
  };

  const updateActivity = (activityId: string, patch: Partial<Activity>) => {
    updateActiveTripRecord((trip) => {
      const nextActs = trip.activities.map((act) => {
        if (act.id !== activityId) return act;
        const startTime = patch.startTime ?? act.startTime;
        const durationMinutes =
          patch.durationMinutes !== undefined
            ? Math.max(15, Number(patch.durationMinutes))
            : act.durationMinutes;
        const endTime = addMinutesToTime(startTime, durationMinutes);
        return {
          ...act,
          ...patch,
          startTime,
          durationMinutes,
          endTime,
        };
      });
      return {
        ...trip,
        activities: settings.autoSortByTime ? sortActivitiesByTime(nextActs) : nextActs,
      };
    });
  };

  const deleteActivity = (activityId: string) => {
    updateActiveTripRecord((trip) => ({
      ...trip,
      activities: trip.activities.filter((a) => a.id !== activityId),
    }));
    showToast('Activity removed from itinerary');
  };

  const replaceActivityWithAlternative = (targetActivityId: string, alt: AlternativeActivityOption) => {
    updateActiveTripRecord((trip) => ({
      ...trip,
      activities: trip.activities.map((act) => {
        if (act.id !== targetActivityId) return act;
        const endTime = addMinutesToTime(act.startTime, alt.durationMinutes);
        return {
          ...act,
          title: alt.title,
          description: alt.description,
          category: alt.category,
          location: alt.location,
          imageUrl: alt.imageUrl,
          durationMinutes: alt.durationMinutes,
          endTime,
          cost: alt.cost,
          isChildFriendly: alt.isChildFriendly,
          crowdLevel: alt.crowdLevel,
        };
      }),
    }));
    showToast(`Replaced activity with "${alt.title}"`);
  };

  const moveOrReorderActivity = (activityId: string, targetDay: number, targetIndex?: number) => {
    updateActiveTripRecord((trip) => {
      const moving = trip.activities.find((a) => a.id === activityId);
      if (!moving) return trip;

      const remaining = trip.activities.filter((a) => a.id !== activityId);
      const targetDayActs = remaining.filter((a) => a.day === targetDay);
      const otherDaysActs = remaining.filter((a) => a.day !== targetDay);

      const updatedMoving: Activity = {
        ...moving,
        day: targetDay,
      };

      const insertIdx =
        targetIndex !== undefined
          ? Math.max(0, Math.min(targetDayActs.length, targetIndex))
          : targetDayActs.length;

      targetDayActs.splice(insertIdx, 0, updatedMoving);

      // Gently re-sequence start/end times if moved to a different day or reordered manually so visual order reflects schedule
      let cursor = 8 * 60 + 30;
      const sequencedTargetDay = targetDayActs.map((act, idx) => {
        const dur = Math.max(30, act.durationMinutes || 60);
        const startMin = idx === 0 ? Math.min(cursor, 9 * 60 + 30) : cursor + 30;
        const startTime = `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`;
        const endTime = addMinutesToTime(startTime, dur);
        cursor = Math.min(22 * 60, startMin + dur);
        return {
          ...act,
          startTime,
          endTime,
        };
      });

      return {
        ...trip,
        activities: [...otherDaysActs, ...sequencedTargetDay],
      };
    });
  };

  const autoResolveDay = (day: number) => {
    updateActiveTripRecord((trip) => ({
      ...trip,
      activities: autoResolveDayConflicts(trip.activities, day),
    }));
    showToast(`Adjusted Day ${day} times to resolve schedule overlaps`);
  };

  const updateDayPace = (dayNumber: number, pace: DayPace) => {
    updateActiveTripRecord((trip) => ({
      ...trip,
      dayPlans: trip.dayPlans.map((dp) =>
        dp.dayNumber === dayNumber ? { ...dp, pace } : dp
      ),
    }));
  };

  const updateTripMeta = (patch: Partial<Pick<Trip, 'name' | 'budget' | 'travelStyle'>>) => {
    updateActiveTripRecord((trip) => ({
      ...trip,
      ...patch,
    }));
    showToast('Trip details updated');
  };

  const updateSettings = (patch: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
    showToast('Application settings updated');
  };

  const resetDemoData = () => {
    const seeded = createSeededDefaultTrip();
    setTrips([seeded]);
    setActiveTripIdState(seeded.id);
    setSettings(DEFAULT_SETTINGS);
    setWizardDraft(DEFAULT_WIZARD_DRAFT);
    showToast('Restored default Udaipur sample itinerary');
  };

  const notifications = useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];
    if (activeTrip && activeTripMetrics) {
      if (activeTripMetrics.isOverBudget) {
        const id = `notif-overbudget-${activeTrip.id}-${activeTripMetrics.totalEstimatedExpense}`;
        list.push({
          id,
          title: 'Budget Exceeded',
          message: `${activeTrip.name} is ${formatINR(Math.abs(activeTripMetrics.remainingBudget))} over your ${formatINR(activeTrip.budget.total)} budget.`,
          type: 'warning',
          read: readNotificationIds.includes(id),
          createdAt: 'Just now',
          actionRoute: '/expenses',
        });
      } else if (activeTripMetrics.budgetUtilizationPct >= settings.budgetWarningThresholdPct) {
        const id = `notif-nearbudget-${activeTrip.id}-${activeTripMetrics.budgetUtilizationPct}`;
        list.push({
          id,
          title: 'Approaching Budget Limit',
          message: `You have allocated ${activeTripMetrics.budgetUtilizationPct}% of your ${formatINR(activeTrip.budget.total)} trip budget.`,
          type: 'info',
          read: readNotificationIds.includes(id),
          createdAt: 'Active',
          actionRoute: '/expenses',
        });
      }

      if (settings.enableConflictDetection && activeTripMetrics.totalConflictsCount > 0) {
        const id = `notif-conflict-${activeTrip.id}-${activeTripMetrics.totalConflictsCount}`;
        list.push({
          id,
          title: 'Schedule Overlap Detected',
          message: `${activeTripMetrics.totalConflictsCount} time conflict${activeTripMetrics.totalConflictsCount > 1 ? 's' : ''} found in ${activeTrip.destination}. Review in the planner.`,
          type: 'warning',
          read: readNotificationIds.includes(id),
          createdAt: 'Schedule check',
          actionRoute: '/planner',
        });
      }

      const idSaved = `notif-saved-${activeTrip.id}`;
      list.push({
        id: idSaved,
        title: 'Itinerary Synced Locally',
        message: `${activeTrip.activities.length} activities across ${activeTrip.daysCount} days are saved in browser storage.`,
        type: 'success',
        read: readNotificationIds.includes(idSaved),
        createdAt: 'LocalStorage',
        actionRoute: '/dashboard',
      });
    }
    return list;
  }, [activeTrip, activeTripMetrics, readNotificationIds, settings]);

  const markAllNotificationsRead = () => {
    setReadNotificationIds(notifications.map((n) => n.id));
  };

  return (
    <TripContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        updateProfile,
        trips,
        activeTrip,
        activeTripMetrics,
        setActiveTripId,
        createTripFromRequest,
        regenerateActiveTrip,
        duplicateTrip,
        deleteTrip,
        addActivity,
        updateActivity,
        deleteActivity,
        replaceActivityWithAlternative,
        moveOrReorderActivity,
        autoResolveDay,
        updateDayPace,
        updateTripMeta,
        wizardDraft,
        setWizardDraft,
        selectedSwapActivityId,
        setSelectedSwapActivityId,
        settings,
        updateSettings,
        resetDemoData,
        notifications,
        readNotificationIds,
        markAllNotificationsRead,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </TripContext.Provider>
  );
};

export function useTripContext(): TripContextValue {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTripContext must be used inside TripProvider');
  return ctx;
}
