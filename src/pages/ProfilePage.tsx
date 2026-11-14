import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, User } from 'lucide-react';
import { AppLayout } from '../components/AppLayout';
import { useTripContext } from '../context/TripContext';
import { TravelStyle } from '../types/trip';

const STYLES: TravelStyle[] = ['Adventure', 'Relaxed', 'Balanced', 'Custom'];

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, trips, updateProfile, login } = useTripContext();

  const [name, setName] = useState(user?.name || 'Simar Kaur');
  const [email, setEmail] = useState(user?.email || 'simar.kaur@tripmate.in');
  const [homeCity, setHomeCity] = useState(user?.homeCity || 'Mumbai');
  const [defaultStyle, setDefaultStyle] = useState<TravelStyle>(
    user?.defaultTravelStyle || 'Balanced'
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      login(email, 'travel2026', true);
    }
    updateProfile({
      name: name.trim() || 'Traveler',
      email: email.trim(),
      homeCity: homeCity.trim() || 'Mumbai',
      defaultTravelStyle: defaultStyle,
    });
  };

  return (
    <AppLayout title="Traveler Profile" subtitle="Manage your personal defaults and travel preferences">
      <div className="max-w-3xl space-y-6">
        <div className="bg-white rounded-2xl border border-[#252B28]/10 p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#174B3A] text-white font-display text-xl font-semibold flex items-center justify-center shrink-0">
              {name
                .split(' ')
                .map((p) => p[0])
                .join('')
                .slice(0, 2)
                .toUpperCase() || <User className="w-6 h-6" />}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold text-[#252B28]">{name}</h2>
              <div className="text-xs text-[#5A645F] mt-0.5">
                {email} · {trips.length} saved trip{trips.length === 1 ? '' : 's'}
              </div>
            </div>
          </div>

          {!user && (
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="px-4 py-2 rounded-xl bg-[#F8F5EC] text-[#174B3A] text-xs font-semibold hover:bg-[#efe9d8]"
            >
              Sign In / Switch Account
            </button>
          )}
        </div>

        <form
          onSubmit={handleSave}
          className="bg-white rounded-2xl border border-[#252B28]/10 p-6 sm:p-8 space-y-5"
        >
          <h3 className="font-display text-lg font-semibold text-[#252B28]">
            Traveler Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                Default Origin City
              </label>
              <input
                type="text"
                value={homeCity}
                onChange={(e) => setHomeCity(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                Default Travel Style
              </label>
              <select
                value={defaultStyle}
                onChange={(e) => setDefaultStyle(e.target.value as TravelStyle)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#174B3A] text-white text-sm font-semibold hover:bg-[#123B2D]"
            >
              <Check className="w-4 h-4" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
};
