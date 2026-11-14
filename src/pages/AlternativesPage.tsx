import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Check, Clock, MapPin, PlusCircle } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { TravelImage } from '../components/TravelImage';
import { useTripContext } from '../context/TripContext';
import { GENERATED_IMAGES } from '../data/destinations';
import { getAlternativesForTrip } from '../utils/itineraryGenerator';
import { ActivityCategory, AlternativeActivityOption } from '../types/trip';
import { formatDuration, formatINR } from '../utils/scheduleUtils';

type FilterTag =
  | 'All'
  | 'Similar'
  | 'Lower Cost'
  | 'Child-Friendly'
  | 'Shorter Duration'
  | 'Different Type';

const FILTER_OPTIONS: { id: FilterTag; label: string }[] = [
  { id: 'All', label: 'All Alternatives' },
  { id: 'Similar', label: 'Similar Attractions' },
  { id: 'Lower Cost', label: 'Lower Cost' },
  { id: 'Child-Friendly', label: 'Child-Friendly' },
  { id: 'Shorter Duration', label: 'Shorter Duration' },
  { id: 'Different Type', label: 'Different Activity Type' },
];

const CATEGORIES: ActivityCategory[] = [
  'Food',
  'Attraction',
  'Culture',
  'Nature',
  'Leisure',
  'Transport',
];

export const AlternativesPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeTrip,
    selectedSwapActivityId,
    setSelectedSwapActivityId,
    replaceActivityWithAlternative,
    addActivity,
  } = useTripContext();

  const [filter, setFilter] = useState<FilterTag>('All');
  const [customTitle, setCustomTitle] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customDuration, setCustomDuration] = useState(90);
  const [customCost, setCustomCost] = useState(550);
  const [customCategory, setCustomCategory] = useState<ActivityCategory>('Attraction');
  const [customDay, setCustomDay] = useState(1);
  const [customStartTime, setCustomStartTime] = useState('15:30');
  const [formError, setFormError] = useState('');

  const targetActivity = useMemo(() => {
    if (!activeTrip || activeTrip.activities.length === 0) return null;
    if (selectedSwapActivityId) {
      const found = activeTrip.activities.find((a) => a.id === selectedSwapActivityId);
      if (found) return found;
    }
    return activeTrip.activities[0];
  }, [activeTrip, selectedSwapActivityId]);

  const alternativesPool = useMemo(() => {
    if (!activeTrip) return [];
    return getAlternativesForTrip(activeTrip.destination);
  }, [activeTrip]);

  const filteredAlternatives = useMemo(() => {
    return alternativesPool.filter((alt) => {
      if (filter === 'All') return true;
      if (filter === 'Lower Cost' && targetActivity) {
        return alt.tags.includes('Lower Cost') || alt.cost < targetActivity.cost;
      }
      if (filter === 'Shorter Duration' && targetActivity) {
        return alt.tags.includes('Shorter Duration') || alt.durationMinutes < targetActivity.durationMinutes;
      }
      if (filter === 'Child-Friendly') {
        return alt.isChildFriendly;
      }
      if (filter === 'Different Type' && targetActivity) {
        return alt.category !== targetActivity.category || alt.tags.includes('Different Type');
      }
      return alt.tags.includes(filter);
    });
  }, [alternativesPool, filter, targetActivity]);

  if (!activeTrip) {
    return (
      <AppLayout title="Explore Alternatives">
        <div className="bg-white rounded-2xl border border-[#252B28]/10 p-10 text-center text-sm text-[#5A645F]">
          Create or select a trip to discover activity alternatives.
        </div>
      </AppLayout>
    );
  }

  const handleReplace = (alt: AlternativeActivityOption) => {
    if (!targetActivity) return;
    replaceActivityWithAlternative(targetActivity.id, alt);
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!customTitle.trim()) {
      setFormError('Please enter an activity name.');
      return;
    }
    if (customDuration < 15) {
      setFormError('Duration must be at least 15 minutes.');
      return;
    }

    const imageByCategory =
      customCategory === 'Food'
        ? GENERATED_IMAGES.cafe
        : activeTrip.destination.toLowerCase().includes('jaipur')
        ? GENERATED_IMAGES.jaipur
        : activeTrip.destination.toLowerCase().includes('goa')
        ? GENERATED_IMAGES.goa
        : activeTrip.destination.toLowerCase().includes('manali')
        ? GENERATED_IMAGES.manali
        : activeTrip.destination.toLowerCase().includes('kerala')
        ? GENERATED_IMAGES.kerala
        : GENERATED_IMAGES.udaipur;

    addActivity({
      title: customTitle.trim(),
      location: customLocation.trim() || activeTrip.destination,
      description:
        customDescription.trim() ||
        `Custom ${customCategory.toLowerCase()} experience added for Day ${customDay}.`,
      durationMinutes: Number(customDuration),
      cost: Number(customCost),
      category: customCategory,
      day: Number(customDay),
      startTime: customStartTime,
      imageUrl: imageByCategory,
      isChildFriendly: true,
      crowdLevel: 'Low',
    });

    setCustomTitle('');
    setCustomLocation('');
    setCustomDescription('');
  };

  return (
    <AppLayout
      title="Explore Alternatives & Custom Stops"
      subtitle={`Discover alternative experiences in ${activeTrip.destination} or add your own`}
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left 8 Columns: Alternative Discovery */}
        <div className="xl:col-span-8 space-y-5">
          {/* Target Activity Selector */}
          <div className="bg-white rounded-2xl border border-[#252B28]/10 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-[#5A645F]">
                  Replacing Activity in {activeTrip.name}
                </div>
                {targetActivity ? (
                  <div className="mt-1 text-sm font-semibold text-[#252B28]">
                    Day {targetActivity.day} · {targetActivity.title} ({formatINR(targetActivity.cost)} ·{' '}
                    {formatDuration(targetActivity.durationMinutes)})
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-[#5A645F]">No activities in trip yet.</div>
                )}
              </div>

              <select
                value={targetActivity?.id || ''}
                onChange={(e) => setSelectedSwapActivityId(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-xs font-medium text-[#252B28] max-w-xs focus:outline-none focus:border-[#174B3A]"
              >
                {activeTrip.activities.map((a) => (
                  <option key={a.id} value={a.id}>
                    Day {a.day}: {a.title} ({formatINR(a.cost)})
                  </option>
                ))}
              </select>
            </div>

            {/* Intent Filter Tabs */}
            <div className="mt-4 pt-4 border-t border-[#252B28]/8 flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFilter(opt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                    filter === opt.id
                      ? 'bg-[#174B3A] text-white'
                      : 'bg-[#F8F5EC] text-[#5A645F] hover:text-[#252B28]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Alternative Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredAlternatives.map((alt) => {
              const costDiff = targetActivity ? alt.cost - targetActivity.cost : 0;
              return (
                <article
                  key={alt.id}
                  className="bg-white rounded-2xl border border-[#252B28]/10 overflow-hidden flex flex-col"
                >
                  <div className="h-44 overflow-hidden bg-[#F8F5EC]">
                    <TravelImage
                      src={alt.imageUrl}
                      alt={alt.title}
                      fallbackTitle={alt.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="text-xs text-[#5A645F] font-medium flex items-center gap-2">
                        <span>{alt.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(alt.durationMinutes)}
                        </span>
                        {alt.isChildFriendly && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>Child-friendly</span>
                          </>
                        )}
                      </div>
                      <h3 className="mt-2 font-display text-lg font-semibold text-[#252B28]">
                        {alt.title}
                      </h3>
                      <div className="mt-1 text-xs text-[#5A645F] flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        <span>{alt.location}</span>
                      </div>
                      <p className="mt-2.5 text-xs sm:text-sm text-[#5A645F] leading-relaxed">
                        {alt.description}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#252B28]/8 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-mono text-base font-semibold text-[#174B3A] tabular-nums">
                          {formatINR(alt.cost)}
                        </div>
                        {targetActivity && costDiff !== 0 && (
                          <div
                            className={`text-[11px] font-mono tabular-nums ${
                              costDiff < 0 ? 'text-[#174B3A]' : 'text-amber-700'
                            }`}
                          >
                            {costDiff < 0
                              ? `Saves ${formatINR(Math.abs(costDiff))}`
                              : `+${formatINR(costDiff)} vs current`}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={!targetActivity}
                        onClick={() => handleReplace(alt)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#174B3A] text-white text-xs font-semibold hover:bg-[#123B2D] transition-colors whitespace-nowrap disabled:opacity-50"
                      >
                        <ArrowLeftRight className="w-3.5 h-3.5" />
                        <span>Replace Activity</span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Right 4 Columns: Add Custom Activity Form */}
        <aside className="xl:col-span-4 bg-white rounded-2xl border border-[#252B28]/10 p-6 sticky top-24">
          <div className="flex items-center gap-2 text-[#174B3A] mb-1">
            <PlusCircle className="w-4 h-4" />
            <span className="text-xs font-semibold">Custom Experience</span>
          </div>
          <h2 className="font-display text-xl font-semibold text-[#252B28]">
            Add Custom Activity
          </h2>
          <p className="text-xs text-[#5A645F] mt-1">
            Insert your own restaurant booking, museum visit, or transit transfer directly into the trip.
          </p>

          {formError && (
            <div className="mt-4 px-3 py-2 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
              {formError}
            </div>
          )}

          <form onSubmit={handleAddCustom} className="mt-5 space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1">
                Activity Name
              </label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Sunset Rooftop Dinner"
                className="w-full px-3 py-2 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1">
                Location
              </label>
              <input
                type="text"
                value={customLocation}
                onChange={(e) => setCustomLocation(e.target.value)}
                placeholder={`Neighborhood in ${activeTrip.destination}`}
                className="w-full px-3 py-2 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1">
                Description
              </label>
              <textarea
                rows={2}
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="Short notes about this stop..."
                className="w-full px-3 py-2 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#252B28] mb-1">
                  Category
                </label>
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value as ActivityCategory)}
                  className="w-full px-3 py-2 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-xs font-medium focus:outline-none focus:border-[#174B3A]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B28] mb-1">Day</label>
                <select
                  value={customDay}
                  onChange={(e) => setCustomDay(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-xs font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                >
                  {Array.from({ length: activeTrip.daysCount }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      Day {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-[#252B28] mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={customStartTime}
                  onChange={(e) => setCustomStartTime(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-xs font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B28] mb-1">
                  Duration (m)
                </label>
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={customDuration}
                  onChange={(e) => setCustomDuration(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-xs font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#252B28] mb-1">
                  Cost (INR)
                </label>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={customCost}
                  onChange={(e) => setCustomCost(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-xs font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-[#174B3A] text-white text-sm font-semibold hover:bg-[#123B2D] transition-colors flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Add to Day {customDay}</span>
            </button>
          </form>

          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="mt-3 w-full py-2 rounded-xl bg-[#F8F5EC] text-[#174B3A] text-xs font-semibold hover:bg-[#efe9d8] transition-colors"
          >
            Return to Itinerary Dashboard
          </button>
        </aside>
      </div>
    </AppLayout>
  );
};
