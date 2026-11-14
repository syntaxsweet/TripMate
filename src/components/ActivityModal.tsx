import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Activity, ActivityCategory } from '../types/trip';
import { addMinutesToTime } from '../utils/scheduleUtils';
import { GENERATED_IMAGES } from '../data/destinations';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  daysCount: number;
  defaultDay: number;
  editingActivity?: Activity | null;
  destination: string;
  onSave: (payload: {
    id?: string;
    title: string;
    location: string;
    description: string;
    category: ActivityCategory;
    day: number;
    startTime: string;
    durationMinutes: number;
    cost: number;
    imageUrl: string;
  }) => void;
}

const CATEGORIES: ActivityCategory[] = [
  'Food',
  'Attraction',
  'Culture',
  'Nature',
  'Leisure',
  'Transport',
];

function getDefaultImageForCategory(category: ActivityCategory, destination: string): string {
  if (category === 'Food') return GENERATED_IMAGES.cafe;
  const lower = destination.toLowerCase();
  if (lower.includes('jaipur')) return GENERATED_IMAGES.jaipur;
  if (lower.includes('goa')) return GENERATED_IMAGES.goa;
  if (lower.includes('manali')) return GENERATED_IMAGES.manali;
  if (lower.includes('kerala')) return GENERATED_IMAGES.kerala;
  if (lower.includes('delhi')) return GENERATED_IMAGES.delhi;
  return GENERATED_IMAGES.udaipur;
}

export const ActivityModal: React.FC<ActivityModalProps> = ({
  isOpen,
  onClose,
  daysCount,
  defaultDay,
  editingActivity,
  destination,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('Attraction');
  const [day, setDay] = useState(defaultDay);
  const [startTime, setStartTime] = useState('10:00');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [cost, setCost] = useState(600);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setError('');
    if (editingActivity) {
      setTitle(editingActivity.title);
      setLocation(editingActivity.location);
      setDescription(editingActivity.description);
      setCategory(editingActivity.category);
      setDay(editingActivity.day);
      setStartTime(editingActivity.startTime);
      setDurationMinutes(editingActivity.durationMinutes);
      setCost(editingActivity.cost);
    } else {
      setTitle('');
      setLocation(`${destination} Central`);
      setDescription('');
      setCategory('Attraction');
      setDay(defaultDay);
      setStartTime('10:00');
      setDurationMinutes(90);
      setCost(600);
    }
  }, [isOpen, editingActivity, defaultDay, destination]);

  if (!isOpen) return null;

  const computedEndTime = addMinutesToTime(startTime, durationMinutes);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Activity name is required.');
      return;
    }
    if (durationMinutes < 15) {
      setError('Duration must be at least 15 minutes.');
      return;
    }
    if (cost < 0) {
      setError('Estimated cost cannot be negative.');
      return;
    }

    onSave({
      id: editingActivity?.id,
      title: title.trim(),
      location: location.trim() || destination,
      description: description.trim() || `Planned ${category.toLowerCase()} stop in ${destination}.`,
      category,
      day,
      startTime,
      durationMinutes: Number(durationMinutes),
      cost: Number(cost),
      imageUrl: editingActivity?.imageUrl || getDefaultImageForCategory(category, destination),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45">
      <div className="bg-white rounded-2xl border border-[#252B28]/12 w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#252B28]/10 flex items-center justify-between bg-[#F8F5EC]">
          <h2 className="font-display text-lg font-semibold text-[#252B28]">
            {editingActivity ? 'Edit Activity' : 'Add Custom Activity'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5A645F] hover:text-[#252B28] hover:bg-black/5"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="px-3.5 py-2.5 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
              Activity Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Sunset Heritage Boat Ride"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                Location
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Neighborhood or landmark"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ActivityCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief notes on what you plan to see or do..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1.5">Day</label>
              <select
                value={day}
                onChange={(e) => setDay(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
              >
                {Array.from({ length: daysCount }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Day {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                Duration (min)
              </label>
              <input
                type="number"
                min={15}
                max={600}
                step={15}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                Cost (INR)
              </label>
              <input
                type="number"
                min={0}
                step={50}
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
              />
            </div>
          </div>

          <div className="px-3.5 py-2.5 rounded-xl bg-[#F8F5EC] text-xs text-[#5A645F] flex items-center justify-between font-mono tabular-nums">
            <span>Scheduled Window</span>
            <span className="font-semibold text-[#174B3A]">
              {startTime} – {computedEndTime}
            </span>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-[#252B28]/15 text-sm font-medium text-[#252B28] hover:bg-[#F8F5EC] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#174B3A] text-white text-sm font-semibold hover:bg-[#123B2D] transition-colors"
            >
              {editingActivity ? 'Save Changes' : 'Add to Itinerary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
