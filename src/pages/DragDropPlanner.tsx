import React, { useMemo, useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  AlertTriangle,
  Clock,
  GripVertical,
  Plus,
  Trash2,
  Wand2,
} from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { ActivityModal } from '../components/ActivityModal';
import { useTripContext } from '../context/TripContext';
import { Activity, ActivityConflict } from '../types/trip';
import {
  formatDuration,
  formatINR,
  parseTimeToMinutes,
  sortActivitiesByTime,
} from '../utils/scheduleUtils';

interface SortableCardProps {
  activity: Activity;
  conflict?: ActivityConflict;
  onUpdateTime: (id: string, startTime: string) => void;
  onUpdateDuration: (id: string, durationMinutes: number) => void;
  onDelete: (id: string) => void;
}

const SortablePlannerCard: React.FC<SortableCardProps> = ({
  activity,
  conflict,
  onUpdateTime,
  onUpdateDuration,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: activity.id,
    data: { day: activity.day },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border p-3.5 bg-white transition-colors ${
        conflict ? 'border-amber-400 bg-amber-50/40' : 'border-[#252B28]/12 hover:border-[#174B3A]/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 -ml-1 rounded-md text-[#5A645F] hover:text-[#174B3A] hover:bg-[#F8F5EC] cursor-grab active:cursor-grabbing shrink-0"
          aria-label={`Drag ${activity.title}`}
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-[#5A645F] flex items-center justify-between gap-2">
            <span className="truncate">{activity.category}</span>
            <span className="font-mono font-semibold text-[#174B3A] tabular-nums shrink-0">
              {formatINR(activity.cost)}
            </span>
          </div>
          <h4 className="mt-0.5 text-sm font-semibold text-[#252B28] leading-snug">
            {activity.title}
          </h4>
          <div className="text-[11px] text-[#5A645F] truncate mt-0.5">
            {activity.location}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDelete(activity.id)}
          className="p-1 rounded-md text-[#5A645F] hover:text-red-700 hover:bg-red-50 shrink-0"
          aria-label={`Delete ${activity.title}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Inline Time & Duration Editors */}
      <div className="mt-3 pt-2.5 border-t border-[#252B28]/8 grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] text-[#5A645F] mb-0.5">Start Time</label>
          <input
            type="time"
            value={activity.startTime}
            onChange={(e) => onUpdateTime(activity.id, e.target.value)}
            className="w-full px-2 py-1 rounded-lg border border-[#252B28]/15 bg-[#FCFBF7] text-xs font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
          />
        </div>
        <div>
          <label className="block text-[10px] text-[#5A645F] mb-0.5">Duration (min)</label>
          <select
            value={activity.durationMinutes}
            onChange={(e) => onUpdateDuration(activity.id, Number(e.target.value))}
            className="w-full px-2 py-1 rounded-lg border border-[#252B28]/15 bg-[#FCFBF7] text-xs font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
          >
            {[30, 45, 60, 75, 90, 120, 150, 180, 240].map((m) => (
              <option key={m} value={m}>
                {formatDuration(m)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-[#5A645F] tabular-nums">
        <span className="inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-[#174B3A]" />
          {activity.startTime} – {activity.endTime}
        </span>
      </div>

      {conflict && (
        <div className="mt-2 px-2.5 py-1.5 rounded-lg bg-amber-100 text-[11px] font-medium text-amber-900 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{conflict.message}</span>
        </div>
      )}
    </div>
  );
};

interface DayColumnProps {
  dayNumber: number;
  title: string;
  activities: Activity[];
  conflicts: ActivityConflict[];
  totalExpense: number;
  totalHours: number;
  enableConflictDetection: boolean;
  onAddToDay: (day: number) => void;
  onAutoResolve: (day: number) => void;
  onUpdateTime: (id: string, startTime: string) => void;
  onUpdateDuration: (id: string, durationMinutes: number) => void;
  onDelete: (id: string) => void;
}

const DayColumn: React.FC<DayColumnProps> = ({
  dayNumber,
  title,
  activities,
  conflicts,
  totalExpense,
  totalHours,
  enableConflictDetection,
  onAddToDay,
  onAutoResolve,
  onUpdateTime,
  onUpdateDuration,
  onDelete,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: `day-col-${dayNumber}`,
    data: { day: dayNumber },
  });

  const conflictMap = new Map(conflicts.map((c) => [c.activityId, c]));
  const hasConflicts = enableConflictDetection && conflicts.length > 0;

  return (
    <div
      ref={setNodeRef}
      className={`w-[320px] sm:w-[340px] shrink-0 rounded-2xl border flex flex-col transition-colors ${
        isOver
          ? 'bg-[#F8F5EC] border-[#174B3A]'
          : 'bg-[#F8F5EC]/75 border-[#252B28]/10'
      }`}
    >
      <div className="p-4 border-b border-[#252B28]/10 bg-white rounded-t-2xl">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[11px] font-mono font-semibold text-[#174B3A]">
              DAY {dayNumber}
            </div>
            <h3 className="font-display text-base font-semibold text-[#252B28] truncate max-w-[200px]">
              {title}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onAddToDay(dayNumber)}
            className="p-1.5 rounded-lg bg-[#F8F5EC] text-[#174B3A] hover:bg-[#174B3A] hover:text-white transition-colors"
            aria-label={`Add activity to Day ${dayNumber}`}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-2.5 flex items-center justify-between text-xs font-mono text-[#5A645F] tabular-nums">
          <span>{activities.length} stops · {totalHours}h</span>
          <span className="font-semibold text-[#174B3A]">{formatINR(totalExpense)}</span>
        </div>

        {hasConflicts && (
          <div className="mt-2.5 pt-2.5 border-t border-[#252B28]/8 flex items-center justify-between gap-2">
            <span className="text-[11px] font-medium text-amber-800 inline-flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Time overlap
            </span>
            <button
              type="button"
              onClick={() => onAutoResolve(dayNumber)}
              className="text-[11px] font-semibold text-[#174B3A] hover:underline inline-flex items-center gap-1"
            >
              <Wand2 className="w-3 h-3" />
              <span>Auto-Fix</span>
            </button>
          </div>
        )}
      </div>

      <div className="p-3 space-y-3 flex-1 min-h-[260px]">
        <SortableContext
          items={activities.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {activities.length === 0 ? (
            <div className="h-44 rounded-xl border border-dashed border-[#252B28]/20 flex flex-col items-center justify-center text-center p-4 text-xs text-[#5A645F]">
              <p>Drop an activity card here or add a new stop for Day {dayNumber}.</p>
            </div>
          ) : (
            activities.map((act) => (
              <SortablePlannerCard
                key={act.id}
                activity={act}
                conflict={enableConflictDetection ? conflictMap.get(act.id) : undefined}
                onUpdateTime={onUpdateTime}
                onUpdateDuration={onUpdateDuration}
                onDelete={onDelete}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
};

export const DragDropPlanner: React.FC = () => {
  const {
    activeTrip,
    activeTripMetrics,
    moveOrReorderActivity,
    updateActivity,
    deleteActivity,
    addActivity,
    autoResolveDay,
    settings,
  } = useTripContext();

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDay, setModalDay] = useState(1);
  const [viewMode, setViewMode] = useState<'board' | 'timeline'>('board');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const draggingActivity = useMemo(
    () => activeTrip?.activities.find((a) => a.id === draggingId) || null,
    [activeTrip, draggingId]
  );

  if (!activeTrip || !activeTripMetrics) {
    return (
      <AppLayout title="Interactive Drag-and-Drop Planner">
        <div className="bg-white rounded-2xl border border-[#252B28]/10 p-10 text-center text-sm text-[#5A645F]">
          Create or select a trip to use the drag-and-drop planner.
        </div>
      </AppLayout>
    );
  }

  const handleDragStart = (event: DragStartEvent) => {
    setDraggingId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setDraggingId(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;

    if (overId.startsWith('day-col-')) {
      const targetDay = Number(overId.replace('day-col-', ''));
      moveOrReorderActivity(activeId, targetDay);
      return;
    }

    const overActivity = activeTrip.activities.find((a) => a.id === overId);
    if (!overActivity) return;

    const targetDayActs = sortActivitiesByTime(
      activeTrip.activities.filter((a) => a.day === overActivity.day && a.id !== activeId)
    );
    const targetIndex = targetDayActs.findIndex((a) => a.id === overId);

    moveOrReorderActivity(activeId, overActivity.day, targetIndex >= 0 ? targetIndex : undefined);
  };

  const handleOpenAddForDay = (day: number) => {
    setModalDay(day);
    setModalOpen(true);
  };

  // Timeline helper hours: 07:00 to 22:00 (900 minutes span)
  const TIMELINE_START = 7 * 60;
  const TIMELINE_SPAN = 15 * 60;

  return (
    <AppLayout
      title="Interactive Drag-and-Drop Planner"
      subtitle={`Drag cards within or across days for ${activeTrip.name}`}
    >
      <div className="space-y-5">
        {/* Controls & Mode Switch */}
        <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-[#5A645F] flex-wrap">
            <span className="font-semibold text-[#252B28]">
              {activeTrip.activities.length} total activities
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Total: {formatINR(activeTripMetrics.totalEstimatedExpense)}
            </span>
            {activeTripMetrics.totalConflictsCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-700 font-semibold inline-flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {activeTripMetrics.totalConflictsCount} schedule conflict(s)
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-[#F8F5EC] border border-[#252B28]/10">
              <button
                type="button"
                onClick={() => setViewMode('board')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'board' ? 'bg-white text-[#174B3A] shadow-sm' : 'text-[#5A645F]'
                }`}
              >
                Day Columns
              </button>
              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  viewMode === 'timeline' ? 'bg-white text-[#174B3A] shadow-sm' : 'text-[#5A645F]'
                }`}
              >
                Timeline Visualization
              </button>
            </div>

            <button
              type="button"
              onClick={() => handleOpenAddForDay(1)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#174B3A] text-white text-xs font-semibold hover:bg-[#123B2D] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Activity</span>
            </button>
          </div>
        </div>

        {viewMode === 'board' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-5 overflow-x-auto pb-4 planner-scroll items-start">
              {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((dayNum) => {
                const dp = activeTrip.dayPlans.find((d) => d.dayNumber === dayNum);
                const dm = activeTripMetrics.dayMetrics.find((m) => m.dayNumber === dayNum);
                const dayActs = sortActivitiesByTime(
                  activeTrip.activities.filter((a) => a.day === dayNum)
                );

                return (
                  <DayColumn
                    key={dayNum}
                    dayNumber={dayNum}
                    title={dp?.title || `Day ${dayNum}`}
                    activities={dayActs}
                    conflicts={dm?.conflicts || []}
                    totalExpense={dm?.totalExpense || 0}
                    totalHours={dm?.totalHours || 0}
                    enableConflictDetection={settings.enableConflictDetection}
                    onAddToDay={handleOpenAddForDay}
                    onAutoResolve={autoResolveDay}
                    onUpdateTime={(id, startTime) => updateActivity(id, { startTime })}
                    onUpdateDuration={(id, durationMinutes) =>
                      updateActivity(id, { durationMinutes })
                    }
                    onDelete={deleteActivity}
                  />
                );
              })}
            </div>

            <DragOverlay>
              {draggingActivity ? (
                <div className="w-[310px] rounded-xl border-2 border-[#174B3A] bg-white p-3.5 shadow-2xl">
                  <div className="text-[11px] text-[#5A645F] flex justify-between">
                    <span>{draggingActivity.category}</span>
                    <span className="font-mono font-semibold text-[#174B3A]">
                      {formatINR(draggingActivity.cost)}
                    </span>
                  </div>
                  <div className="mt-1 text-sm font-semibold text-[#252B28]">
                    {draggingActivity.title}
                  </div>
                  <div className="mt-1 text-xs font-mono text-[#5A645F]">
                    {draggingActivity.startTime} – {draggingActivity.endTime}
                  </div>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        ) : (
          /* Timeline Visualization View */
          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-5 overflow-x-auto planner-scroll">
            <div className="min-w-[880px]">
              <div className="grid grid-cols-[120px_1fr] border-b border-[#252B28]/10 pb-2 mb-4">
                <div className="text-xs font-semibold text-[#5A645F]">Day / Hour</div>
                <div className="grid grid-cols-15 text-[11px] font-mono text-[#5A645F] tabular-nums">
                  {Array.from({ length: 15 }, (_, idx) => 7 + idx).map((hr) => (
                    <div key={hr} className="border-l border-[#252B28]/8 pl-1">
                      {String(hr).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((dayNum) => {
                  const dayActs = sortActivitiesByTime(
                    activeTrip.activities.filter((a) => a.day === dayNum)
                  );
                  const dm = activeTripMetrics.dayMetrics.find((m) => m.dayNumber === dayNum);
                  const conflictIds = new Set((dm?.conflicts || []).map((c) => c.activityId));

                  return (
                    <div
                      key={dayNum}
                      className="grid grid-cols-[120px_1fr] items-center gap-2"
                    >
                      <div className="pr-2">
                        <div className="text-xs font-semibold text-[#252B28]">Day {dayNum}</div>
                        <div className="text-[11px] font-mono text-[#5A645F] tabular-nums">
                          {formatINR(dm?.totalExpense || 0)}
                        </div>
                      </div>

                      <div className="relative h-14 rounded-xl bg-[#FCFBF7] border border-[#252B28]/10 overflow-hidden">
                        {dayActs.map((act) => {
                          const startMin = parseTimeToMinutes(act.startTime);
                          const endMin = parseTimeToMinutes(act.endTime);
                          const leftPct = Math.max(
                            0,
                            Math.min(96, ((startMin - TIMELINE_START) / TIMELINE_SPAN) * 100)
                          );
                          const widthPct = Math.max(
                            4,
                            Math.min(100 - leftPct, ((endMin - startMin) / TIMELINE_SPAN) * 100)
                          );
                          const isConflicting =
                            settings.enableConflictDetection && conflictIds.has(act.id);

                          return (
                            <div
                              key={act.id}
                              title={`${act.title} (${act.startTime}–${act.endTime})`}
                              style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                              className={`absolute top-1.5 bottom-1.5 rounded-lg px-2 py-1 text-[11px] flex flex-col justify-center overflow-hidden border ${
                                isConflicting
                                  ? 'bg-amber-200/90 border-amber-500 text-amber-950'
                                  : 'bg-[#174B3A] border-[#123B2D] text-white'
                              }`}
                            >
                              <div className="font-semibold truncate">{act.title}</div>
                              <div className="text-[10px] opacity-85 font-mono truncate">
                                {act.startTime}–{act.endTime}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      <ActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        daysCount={activeTrip.daysCount}
        defaultDay={modalDay}
        destination={activeTrip.destination}
        onSave={(payload) =>
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
          })
        }
      />
    </AppLayout>
  );
};
