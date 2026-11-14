import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, PlusCircle, Search, Trash2 } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { TravelImage } from '../components/TravelImage';
import { useTripContext } from '../context/TripContext';
import { findDestinationInfo } from '../data/destinations';
import { calculateTripMetrics, formatINR } from '../utils/scheduleUtils';

export const MyTripsPage: React.FC = () => {
  const navigate = useNavigate();
  const { trips, activeTrip, setActiveTripId, duplicateTrip, deleteTrip } = useTripContext();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trips;
    return trips.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.destination.toLowerCase().includes(q) ||
        t.origin.toLowerCase().includes(q)
    );
  }, [trips, query]);

  return (
    <AppLayout
      title="My Trips"
      subtitle="Manage all saved itineraries stored locally in your browser"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-[#5A645F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search trips by destination or name..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
            />
          </div>

          <button
            type="button"
            onClick={() => navigate('/create-trip')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#174B3A] text-white text-xs font-semibold hover:bg-[#123B2D] whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Trip</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((trip) => {
            const metrics = calculateTripMetrics(trip);
            const destInfo = findDestinationInfo(trip.destination);
            const isActive = activeTrip?.id === trip.id;

            return (
              <article
                key={trip.id}
                className={`bg-white rounded-2xl border overflow-hidden flex flex-col transition-colors ${
                  isActive ? 'border-[#174B3A] ring-2 ring-[#174B3A]/15' : 'border-[#252B28]/10'
                }`}
              >
                <div className="h-44 overflow-hidden bg-[#F8F5EC]">
                  <TravelImage
                    src={destInfo.imageUrl}
                    alt={trip.destination}
                    fallbackTitle={trip.destination}
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-xs text-[#5A645F] font-medium flex items-center gap-2 tabular-nums">
                      <span>{trip.origin} → {trip.destination}</span>
                      <span aria-hidden="true">·</span>
                      <span>{trip.daysCount} Days</span>
                      <span aria-hidden="true">·</span>
                      <span>{trip.travelStyle}</span>
                    </div>
                    <h2 className="mt-1.5 font-display text-xl font-semibold text-[#252B28]">
                      {trip.name}
                    </h2>

                    <div className="mt-4 grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#FCFBF7] border border-[#252B28]/8 text-xs font-mono tabular-nums">
                      <div>
                        <div className="font-sans text-[11px] text-[#5A645F]">Estimated Spend</div>
                        <div className="font-semibold text-[#174B3A] mt-0.5">
                          {formatINR(metrics.totalEstimatedExpense)}
                        </div>
                      </div>
                      <div>
                        <div className="font-sans text-[11px] text-[#5A645F]">Activities</div>
                        <div className="font-semibold text-[#252B28] mt-0.5">
                          {metrics.totalActivities} stops
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#252B28]/8 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTripId(trip.id);
                        navigate('/dashboard');
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                        isActive
                          ? 'bg-[#174B3A] text-white'
                          : 'bg-[#F8F5EC] text-[#174B3A] hover:bg-[#174B3A] hover:text-white'
                      }`}
                    >
                      {isActive ? 'Open Active Trip' : 'Select & View'}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => duplicateTrip(trip.id)}
                        className="p-2 rounded-lg border border-[#252B28]/12 text-[#5A645F] hover:text-[#174B3A] hover:bg-[#F8F5EC]"
                        title="Duplicate Trip"
                        aria-label={`Duplicate ${trip.name}`}
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTrip(trip.id)}
                        className="p-2 rounded-lg border border-[#252B28]/12 text-[#5A645F] hover:text-red-700 hover:bg-red-50"
                        title="Delete Trip"
                        aria-label={`Delete ${trip.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
};
