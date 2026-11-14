import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeftRight,
  CalendarRange,
  Clock,
  Edit3,
  Loader2,
  MapPin,
  PieChart,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { ActivityModal } from '../components/ActivityModal';
import { TravelImage } from '../components/TravelImage';
import { useTripContext } from '../context/TripContext';
import { Activity } from '../types/trip';
import { formatDuration, formatINR, sortActivitiesByTime } from '../utils/scheduleUtils';

export const ItineraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeTrip,
    activeTripMetrics,
    addActivity,
    updateActivity,
    deleteActivity,
    regenerateActiveTrip,
    autoResolveDay,
    setSelectedSwapActivityId,
    settings,
    showToast,
  } = useTripContext();

  const [selectedDay, setSelectedDay] = useState(1);
  const [isEditingMode, setIsEditingMode] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const safeDay = useMemo(() => {
    if (!activeTrip) return 1;
    return Math.min(Math.max(1, selectedDay), activeTrip.daysCount);
  }, [activeTrip, selectedDay]);

  if (!activeTrip || !activeTripMetrics) {
    return (
      <AppLayout title="Itinerary Dashboard">
        <div className="bg-white rounded-2xl border border-[#252B28]/10 p-12 text-center max-w-lg mx-auto">
          <h2 className="font-display text-2xl font-semibold text-[#252B28]">No active trip selected</h2>
          <p className="mt-2 text-sm text-[#5A645F]">
            Start a new personalized journey in the Trip Creation Wizard.
          </p>
          <button
            type="button"
            onClick={() => navigate('/create-trip')}
            className="mt-6 px-5 py-2.5 rounded-xl bg-[#174B3A] text-white text-sm font-semibold"
          >
            Create New Trip
          </button>
        </div>
      </AppLayout>
    );
  }

  const dayPlan = activeTrip.dayPlans.find((d) => d.dayNumber === safeDay);
  const daySummary = activeTripMetrics.dayMetrics.find((m) => m.dayNumber === safeDay);
  const dayActivities = sortActivitiesByTime(
    activeTrip.activities.filter((a) => a.day === safeDay)
  );
  const conflictMap = new Map(
    (daySummary?.conflicts || []).map((c) => [c.activityId, c])
  );

  const travelersCount = activeTrip.adults + activeTrip.children;

  const handleRegenerate = () => {
    setIsRegenerating(true);
    window.setTimeout(() => {
      regenerateActiveTrip();
      setIsRegenerating(false);
    }, 850);
  };

  const handleOpenAdd = () => {
    setEditingActivity(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setModalOpen(true);
  };

  const handleSaveModal = (payload: {
    id?: string;
    title: string;
    location: string;
    description: string;
    category: Activity['category'];
    day: number;
    startTime: string;
    durationMinutes: number;
    cost: number;
    imageUrl: string;
  }) => {
    if (payload.id) {
      updateActivity(payload.id, {
        title: payload.title,
        location: payload.location,
        description: payload.description,
        category: payload.category,
        day: payload.day,
        startTime: payload.startTime,
        durationMinutes: payload.durationMinutes,
        cost: payload.cost,
        imageUrl: payload.imageUrl,
      });
      showToast(`Updated "${payload.title}"`);
    } else {
      addActivity({
        title: payload.title,
        location: payload.location,
        description: payload.description,
        category: payload.category,
        day: payload.day,
        startTime: payload.startTime,
        durationMinutes: payload.durationMinutes,
        cost: payload.cost,
        imageUrl: payload.imageUrl,
        isChildFriendly: true,
        crowdLevel: 'Low',
      });
      setSelectedDay(payload.day);
    }
  };

  return (
    <AppLayout
      title={activeTrip.name}
      subtitle={`${activeTrip.origin} to ${activeTrip.destination} · ${activeTrip.travelStyle} style`}
    >
      <div className="space-y-6">
        {/* Top Summary Strip */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4">
            <div className="text-xs text-[#5A645F]">Destination</div>
            <div className="mt-1 font-display text-lg font-semibold text-[#252B28] truncate">
              {activeTrip.destination}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4">
            <div className="text-xs text-[#5A645F]">Trip Duration</div>
            <div className="mt-1 font-mono text-lg font-semibold text-[#252B28] tabular-nums">
              {activeTrip.daysCount} Days
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4">
            <div className="text-xs text-[#5A645F]">Travelers</div>
            <div className="mt-1 font-mono text-lg font-semibold text-[#252B28] tabular-nums">
              {travelersCount} {travelersCount === 1 ? 'Person' : 'People'}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4">
            <div className="text-xs text-[#5A645F]">Total Budget</div>
            <div className="mt-1 font-mono text-lg font-semibold text-[#252B28] tabular-nums">
              {formatINR(activeTrip.budget.total)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4">
            <div className="text-xs text-[#5A645F]">Estimated Expenses</div>
            <div className="mt-1 font-mono text-lg font-semibold text-[#174B3A] tabular-nums">
              {formatINR(activeTripMetrics.totalEstimatedExpense)}
            </div>
          </div>

          <div
            className={`rounded-2xl border p-4 ${
              activeTripMetrics.isOverBudget
                ? 'bg-red-50 border-red-200'
                : 'bg-[#F8F5EC] border-[#252B28]/10'
            }`}
          >
            <div className="text-xs text-[#5A645F]">Remaining Budget</div>
            <div
              className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
                activeTripMetrics.isOverBudget ? 'text-red-700' : 'text-[#174B3A]'
              }`}
            >
              {formatINR(activeTripMetrics.remainingBudget)}
            </div>
          </div>
        </section>

        {/* Functional Controls Toolbar */}
        <section className="bg-white rounded-2xl border border-[#252B28]/10 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Day Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((dayNum) => {
              const dm = activeTripMetrics.dayMetrics.find((m) => m.dayNumber === dayNum);
              const hasConflict = settings.enableConflictDetection && (dm?.conflicts.length || 0) > 0;
              const isSelected = safeDay === dayNum;
              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => setSelectedDay(dayNum)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 ${
                    isSelected
                      ? 'bg-[#174B3A] text-white'
                      : 'bg-[#FCFBF7] text-[#252B28] border border-[#252B28]/10 hover:bg-[#F8F5EC]'
                  }`}
                >
                  <span>Day {dayNum}</span>
                  <span
                    className={`font-mono text-[11px] tabular-nums ${
                      isSelected ? 'text-[#D8AC55]' : 'text-[#5A645F]'
                    }`}
                  >
                    {dm?.activitiesCount || 0}
                  </span>
                  {hasConflict && (
                    <AlertTriangle
                      className={`w-3.5 h-3.5 ${isSelected ? 'text-[#D8AC55]' : 'text-amber-600'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setIsEditingMode((v) => !v)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                isEditingMode
                  ? 'bg-[#D8AC55] border-[#D8AC55] text-[#252B28]'
                  : 'bg-[#FCFBF7] border-[#252B28]/15 text-[#252B28] hover:bg-[#F8F5EC]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingMode ? 'Done Editing' : 'Edit Itinerary'}</span>
            </button>

            <button
              type="button"
              onClick={handleRegenerate}
              disabled={isRegenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FCFBF7] border border-[#252B28]/15 text-xs font-semibold text-[#252B28] hover:bg-[#F8F5EC] transition-colors whitespace-nowrap disabled:opacity-60"
            >
              {isRegenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5" />
              )}
              <span>Regenerate Itinerary</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#174B3A] text-white text-xs font-semibold hover:bg-[#123B2D] transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Activity</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/expenses')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#F8F5EC] border border-[#252B28]/12 text-xs font-semibold text-[#174B3A] hover:bg-[#efe9d8] transition-colors whitespace-nowrap"
            >
              <PieChart className="w-3.5 h-3.5" />
              <span>View Expenses</span>
            </button>
          </div>
        </section>

        {/* Conflict Warning Banner */}
        {settings.enableConflictDetection && daySummary && daySummary.conflicts.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-amber-900">
                  Schedule overlap detected on Day {safeDay}
                </div>
                <p className="text-xs text-amber-800 mt-0.5">
                  Two or more activities share overlapping start and end times. Adjust times or auto-resolve sequentially.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => autoResolveDay(safeDay)}
              className="px-4 py-2 rounded-xl bg-amber-700 text-white text-xs font-semibold hover:bg-amber-800 transition-colors whitespace-nowrap shrink-0"
            >
              Auto-Resolve Times
            </button>
          </div>
        )}

        {/* Day Header & Daily Summary */}
        <section className="bg-[#F8F5EC] rounded-2xl border border-[#252B28]/10 p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-[#5A645F]">
              Day {safeDay} · {dayPlan?.pace || 'Balanced'} Pace
            </div>
            <h2 className="mt-1 font-display text-2xl font-semibold text-[#252B28]">
              Day {safeDay} – {dayPlan?.title || 'Exploration'}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-6 font-mono tabular-nums">
            <div>
              <div className="text-[11px] font-sans text-[#5A645F]">Activities</div>
              <div className="text-base font-semibold text-[#252B28]">
                {daySummary?.activitiesCount || 0}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-sans text-[#5A645F]">Estimated Activity Hours</div>
              <div className="text-base font-semibold text-[#252B28]">
                {Math.round(daySummary?.totalHours || 0)} hrs ({formatDuration(daySummary?.totalMinutes || 0)})
              </div>
            </div>
            <div>
              <div className="text-[11px] font-sans text-[#5A645F]">Daily Estimated Expense</div>
              <div className="text-base font-semibold text-[#174B3A]">
                {formatINR(daySummary?.totalExpense || 0)}
              </div>
            </div>
          </div>
        </section>

        {/* Activity Cards List */}
        {isRegenerating ? (
          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-12 text-center">
            <Loader2 className="w-7 h-7 text-[#174B3A] animate-spin mx-auto mb-3" />
            <div className="font-display text-lg font-semibold text-[#252B28]">
              Refreshing your {activeTrip.destination} itinerary...
            </div>
          </div>
        ) : dayActivities.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-12 text-center">
            <h3 className="font-display text-xl font-semibold text-[#252B28]">
              No activities scheduled for Day {safeDay}
            </h3>
            <p className="mt-2 text-sm text-[#5A645F]">
              Add a custom stop or move an activity here from the Drag-and-Drop Planner.
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2.5 rounded-xl bg-[#174B3A] text-white text-xs font-semibold"
              >
                Add Activity
              </button>
              <button
                type="button"
                onClick={() => navigate('/planner')}
                className="px-4 py-2.5 rounded-xl bg-[#F8F5EC] text-[#174B3A] text-xs font-semibold"
              >
                Open DnD Planner
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {dayActivities.map((act, index) => {
              const conflict = settings.enableConflictDetection ? conflictMap.get(act.id) : undefined;
              return (
                <article
                  key={act.id}
                  className={`bg-white rounded-2xl border overflow-hidden transition-colors ${
                    conflict
                      ? 'border-amber-400 bg-amber-50/30'
                      : 'border-[#252B28]/10 hover:border-[#174B3A]/30'
                  }`}
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 items-stretch">
                    <div className="md:col-span-3 h-48 md:h-auto min-h-[176px] overflow-hidden bg-[#F8F5EC]">
                      <TravelImage
                        src={act.imageUrl}
                        alt={act.title}
                        fallbackTitle={act.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="md:col-span-9 p-5 sm:p-6 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs text-[#5A645F] font-medium flex flex-wrap items-center gap-2">
                            <span className="font-mono font-semibold text-[#174B3A]">
                              0{index + 1}.
                            </span>
                            <span>{act.category}</span>
                            <span aria-hidden="true">·</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5" />
                              {act.location}
                            </span>
                          </div>

                          <div className="font-mono text-base font-semibold text-[#174B3A] tabular-nums">
                            {formatINR(act.cost)}
                          </div>
                        </div>

                        <h3 className="mt-2 font-display text-xl font-semibold text-[#252B28]">
                          {act.title}
                        </h3>
                        <p className="mt-1.5 text-sm text-[#5A645F] leading-relaxed">
                          {act.description}
                        </p>

                        {conflict && (
                          <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 bg-amber-100/70 px-3 py-1.5 rounded-lg">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                            <span>{conflict.message}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-[#252B28]/8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#252B28] tabular-nums">
                          <span className="inline-flex items-center gap-1.5 font-semibold">
                            <Clock className="w-3.5 h-3.5 text-[#174B3A]" />
                            {act.startTime} – {act.endTime}
                          </span>
                          <span className="text-[#5A645F]">
                            Duration: {formatDuration(act.durationMinutes)}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSwapActivityId(act.id);
                              navigate('/alternatives');
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8F5EC] text-[#174B3A] text-xs font-semibold hover:bg-[#efe9d8] transition-colors whitespace-nowrap"
                          >
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                            <span>Swap Alternative</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(act)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#252B28]/15 text-[#252B28] text-xs font-semibold hover:bg-[#FCFBF7] transition-colors whitespace-nowrap"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteActivity(act.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 text-red-700 text-xs font-semibold hover:bg-red-50 transition-colors whitespace-nowrap"
                            aria-label={`Delete ${act.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {isEditingMode && <span>Delete</span>}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Quick link to Visual Drag-and-Drop Planner */}
        <div className="bg-white rounded-2xl border border-[#252B28]/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CalendarRange className="w-5 h-5 text-[#174B3A] shrink-0" />
            <div>
              <div className="text-sm font-semibold text-[#252B28]">
                Want to drag activities across days?
              </div>
              <div className="text-xs text-[#5A645F]">
                Use the interactive multi-day board to reorder stops, adjust time slots, and inspect timeline blocks.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/planner')}
            className="px-4 py-2.5 rounded-xl bg-[#174B3A] text-white text-xs font-semibold hover:bg-[#123B2D] transition-colors whitespace-nowrap shrink-0"
          >
            Open Drag & Drop Planner
          </button>
        </div>
      </div>

      <ActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        daysCount={activeTrip.daysCount}
        defaultDay={safeDay}
        editingActivity={editingActivity}
        destination={activeTrip.destination}
        onSave={handleSaveModal}
      />
    </AppLayout>
  );
};
