import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { ActivityModal } from '../components/ActivityModal';
import { useTripContext } from '../context/TripContext';
import { formatDuration, formatINR, mapCategoryToExpenseBucket, sortActivitiesByTime } from '../utils/scheduleUtils';

const CHART_COLORS = ['#174B3A', '#D8AC55', '#3B7A57', '#8D7B56'];

export const ExpenseTracker: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeTrip,
    activeTripMetrics,
    updateActivity,
    deleteActivity,
    addActivity,
    updateTripMeta,
  } = useTripContext();

  const [modalOpen, setModalOpen] = useState(false);
  const [filterDay, setFilterDay] = useState<number | 'all'>('all');

  const dailyExpenseData = useMemo(() => {
    if (!activeTrip || !activeTripMetrics) return [];
    return activeTripMetrics.dayMetrics.map((dm) => ({
      name: `Day ${dm.dayNumber}`,
      expense: dm.totalExpense,
      hours: dm.totalHours,
      activities: dm.activitiesCount,
    }));
  }, [activeTrip, activeTripMetrics]);

  const categoryPieData = useMemo(() => {
    if (!activeTripMetrics) return [];
    const { Food, Attraction, Transport, Leisure } = activeTripMetrics.categoryTotals;
    return [
      { name: 'Food', value: Food },
      { name: 'Attraction', value: Attraction },
      { name: 'Transport', value: Transport },
      { name: 'Leisure', value: Leisure },
    ].filter((d) => d.value > 0);
  }, [activeTripMetrics]);

  const budgetComparisonData = useMemo(() => {
    if (!activeTrip || !activeTripMetrics) return [];
    const leisurePlanned = Math.max(
      0,
      activeTrip.budget.total -
        activeTrip.budget.food -
        activeTrip.budget.attraction -
        activeTrip.budget.transport
    );
    return [
      {
        name: 'Food',
        Planned: activeTrip.budget.food,
        Estimated: activeTripMetrics.categoryTotals.Food,
      },
      {
        name: 'Attraction',
        Planned: activeTrip.budget.attraction,
        Estimated: activeTripMetrics.categoryTotals.Attraction,
      },
      {
        name: 'Transport',
        Planned: activeTrip.budget.transport,
        Estimated: activeTripMetrics.categoryTotals.Transport,
      },
      {
        name: 'Leisure',
        Planned: leisurePlanned,
        Estimated: activeTripMetrics.categoryTotals.Leisure,
      },
    ];
  }, [activeTrip, activeTripMetrics]);

  const filteredActivities = useMemo(() => {
    if (!activeTrip) return [];
    const list =
      filterDay === 'all'
        ? activeTrip.activities
        : activeTrip.activities.filter((a) => a.day === filterDay);
    return [...list].sort((a, b) => {
      if (a.day !== b.day) return a.day - b.day;
      return sortActivitiesByTime([a, b])[0].id === a.id ? -1 : 1;
    });
  }, [activeTrip, filterDay]);

  if (!activeTrip || !activeTripMetrics) {
    return (
      <AppLayout title="Dynamic Expense Tracker">
        <div className="bg-white rounded-2xl border border-[#252B28]/10 p-10 text-center text-sm text-[#5A645F]">
          Create or select a trip to inspect dynamic expenses.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Dynamic Expense Tracker"
      subtitle={`Live INR breakdown for ${activeTrip.name}`}
    >
      <div className="space-y-6">
        {/* Budget Alert Banner */}
        {activeTripMetrics.isOverBudget && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-red-900">
                  Trip expenses exceed your {formatINR(activeTrip.budget.total)} budget
                </div>
                <p className="text-xs text-red-800 mt-0.5">
                  You are currently over by {formatINR(Math.abs(activeTripMetrics.remainingBudget))}. Swap to lower-cost alternatives or adjust costs below.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/alternatives')}
              className="px-4 py-2 rounded-xl bg-red-700 text-white text-xs font-semibold hover:bg-red-800 whitespace-nowrap shrink-0"
            >
              Find Lower-Cost Swaps
            </button>
          </div>
        )}

        {/* 6 Summary Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4">
            <div className="text-xs text-[#5A645F]">Total Trip Expenses</div>
            <div className="mt-1.5 font-mono text-xl font-semibold text-[#174B3A] tabular-nums">
              {formatINR(activeTripMetrics.totalEstimatedExpense)}
            </div>
            <div className="mt-1 text-[11px] text-[#5A645F] font-mono tabular-nums">
              {activeTripMetrics.budgetUtilizationPct}% of budget
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4">
            <div className="text-xs text-[#5A645F]">Food Expenses</div>
            <div className="mt-1.5 font-mono text-xl font-semibold text-[#252B28] tabular-nums">
              {formatINR(activeTripMetrics.categoryTotals.Food)}
            </div>
            <div className="mt-1 text-[11px] text-[#5A645F] font-mono tabular-nums">
              Target: {formatINR(activeTrip.budget.food)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4">
            <div className="text-xs text-[#5A645F]">Attraction Expenses</div>
            <div className="mt-1.5 font-mono text-xl font-semibold text-[#252B28] tabular-nums">
              {formatINR(activeTripMetrics.categoryTotals.Attraction)}
            </div>
            <div className="mt-1 text-[11px] text-[#5A645F] font-mono tabular-nums">
              Target: {formatINR(activeTrip.budget.attraction)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4">
            <div className="text-xs text-[#5A645F]">Transport Expenses</div>
            <div className="mt-1.5 font-mono text-xl font-semibold text-[#252B28] tabular-nums">
              {formatINR(activeTripMetrics.categoryTotals.Transport)}
            </div>
            <div className="mt-1 text-[11px] text-[#5A645F] font-mono tabular-nums">
              Target: {formatINR(activeTrip.budget.transport)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4">
            <div className="text-xs text-[#5A645F]">Leisure Expenses</div>
            <div className="mt-1.5 font-mono text-xl font-semibold text-[#252B28] tabular-nums">
              {formatINR(activeTripMetrics.categoryTotals.Leisure)}
            </div>
            <div className="mt-1 text-[11px] text-[#5A645F]">Parks & walks</div>
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
              className={`mt-1.5 font-mono text-xl font-semibold tabular-nums ${
                activeTripMetrics.isOverBudget ? 'text-red-700' : 'text-[#174B3A]'
              }`}
            >
              {formatINR(activeTripMetrics.remainingBudget)}
            </div>
            <div className="mt-1 text-[11px] text-[#5A645F] font-mono tabular-nums">
              Cap: {formatINR(activeTrip.budget.total)}
            </div>
          </div>
        </section>

        {/* 4 Recharts Analytics Cards */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Daily Expense Bar Chart */}
          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#252B28]">
                  Daily Estimated Expense
                </h2>
                <p className="text-xs text-[#5A645F]">
                  Compared against your {formatINR(activeTrip.budget.daily)}/day target
                </p>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyExpenseData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5A645F' }} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#5A645F' }}
                    tickFormatter={(v) => `₹${v}`}
                  />
                  <Tooltip
                    formatter={(value) => [formatINR(Number(value) || 0), 'Estimated Expense']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2DFD5',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  {activeTrip.budget.daily > 0 && (
                    <ReferenceLine
                      y={activeTrip.budget.daily}
                      stroke="#D8AC55"
                      strokeDasharray="4 4"
                      label={{ value: 'Daily Target', fill: '#9A7428', fontSize: 11, position: 'right' }}
                    />
                  )}
                  <Bar dataKey="expense" fill="#174B3A" radius={[8, 8, 0, 0]} maxBarSize={52} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Category-wise Pie Chart */}
          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-6">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-[#252B28]">
                Category-Wise Distribution
              </h2>
              <p className="text-xs text-[#5A645F]">
                Share of estimated spend across Food, Attractions, Transport, and Leisure
              </p>
            </div>
            <div className="h-64 w-full">
              {categoryPieData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-[#5A645F]">
                  No expenses logged yet.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={3}
                    >
                      {categoryPieData.map((entry, index) => (
                        <Cell
                          key={entry.name}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatINR(Number(value) || 0)}
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        borderColor: '#E2DFD5',
                        borderRadius: '12px',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Chart 3: Budget vs Estimated Expense Chart */}
          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-6">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-[#252B28]">
                Planned Budget vs. Estimated Cost
              </h2>
              <p className="text-xs text-[#5A645F]">
                Spot categories where scheduled activities exceed your initial budget split
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetComparisonData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5A645F' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#5A645F' }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip
                    formatter={(value) => formatINR(Number(value) || 0)}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2DFD5',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="Planned" fill="#D8AC55" radius={[6, 6, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="Estimated" fill="#174B3A" radius={[6, 6, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: Daily Activity-Hours Chart */}
          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-6">
            <div className="mb-4">
              <h2 className="font-display text-lg font-semibold text-[#252B28]">
                Daily Scheduled Activity Hours
              </h2>
              <p className="text-xs text-[#5A645F]">
                Track pacing balance across every day of the trip
              </p>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyExpenseData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#5A645F' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#5A645F' }} unit="h" />
                  <Tooltip
                    formatter={(value) => [`${Number(value) || 0} hrs`, 'Scheduled Time']}
                    contentStyle={{
                      backgroundColor: '#FFFFFF',
                      borderColor: '#E2DFD5',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="hours" fill="#3B7A57" radius={[8, 8, 0, 0]} maxBarSize={52} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Interactive Expense Ledger Table */}
        <section className="bg-white rounded-2xl border border-[#252B28]/10 overflow-hidden">
          <div className="p-5 border-b border-[#252B28]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#252B28]">
                Activity Expense Ledger
              </h2>
              <p className="text-xs text-[#5A645F]">
                Edit any activity’s INR estimate inline — all totals and charts recalculate instantaneously.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[#5A645F]">Trip Budget Cap:</span>
                <input
                  type="number"
                  min={1000}
                  step={500}
                  value={activeTrip.budget.total}
                  onChange={(e) =>
                    updateTripMeta({
                      budget: {
                        ...activeTrip.budget,
                        total: Math.max(0, Number(e.target.value)),
                      },
                    })
                  }
                  className="w-28 px-2.5 py-1.5 rounded-lg border border-[#252B28]/15 bg-[#FCFBF7] font-mono text-xs tabular-nums focus:outline-none focus:border-[#174B3A]"
                />
              </div>

              <select
                value={filterDay}
                onChange={(e) =>
                  setFilterDay(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="px-3 py-1.5 rounded-lg border border-[#252B28]/15 bg-[#FCFBF7] text-xs font-medium"
              >
                <option value="all">All Days</option>
                {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#174B3A] text-white text-xs font-semibold hover:bg-[#123B2D]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense Item</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#252B28]/10 bg-[#FCFBF7] text-[11px] font-semibold text-[#5A645F]">
                  <th className="py-3 px-5">Day</th>
                  <th className="py-3 px-4">Activity</th>
                  <th className="py-3 px-4">Budget Bucket</th>
                  <th className="py-3 px-4">Time & Duration</th>
                  <th className="py-3 px-4 text-right">Estimated Cost (INR)</th>
                  <th className="py-3 px-5 text-right">Remove</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#252B28]/8 text-sm">
                {filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-[#FCFBF7] transition-colors">
                    <td className="py-3 px-5 font-mono text-xs font-semibold text-[#174B3A] tabular-nums">
                      Day {act.day}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-[#252B28]">{act.title}</div>
                      <div className="text-xs text-[#5A645F]">{act.location}</div>
                    </td>
                    <td className="py-3 px-4 text-xs text-[#5A645F]">
                      {mapCategoryToExpenseBucket(act.category)} ({act.category})
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-[#5A645F] tabular-nums whitespace-nowrap">
                      {act.startTime}–{act.endTime} · {formatDuration(act.durationMinutes)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <input
                        type="number"
                        min={0}
                        step={50}
                        value={act.cost}
                        onChange={(e) =>
                          updateActivity(act.id, { cost: Math.max(0, Number(e.target.value) || 0) })
                        }
                        aria-label={`Cost for ${act.title}`}
                        className="w-28 text-right px-2.5 py-1.5 rounded-lg border border-[#252B28]/15 bg-[#FCFBF7] font-mono text-xs font-semibold text-[#252B28] tabular-nums focus:outline-none focus:border-[#174B3A]"
                      />
                    </td>
                    <td className="py-3 px-5 text-right">
                      <button
                        type="button"
                        onClick={() => deleteActivity(act.id)}
                        className="p-1.5 rounded-lg text-[#5A645F] hover:text-red-700 hover:bg-red-50 transition-colors"
                        aria-label={`Delete ${act.title}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ActivityModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        daysCount={activeTrip.daysCount}
        defaultDay={filterDay === 'all' ? 1 : filterDay}
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
