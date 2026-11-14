import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Compass,
  IndianRupee,
  Layers,
  MapPin,
  Menu,
  SlidersHorizontal,
  Users,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { DESTINATIONS, GENERATED_IMAGES } from '../data/destinations';
import { useTripContext } from '../context/TripContext';
import { TravelImage } from '../components/TravelImage';
import { formatINR } from '../utils/scheduleUtils';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, wizardDraft, setWizardDraft, createTripFromRequest } = useTripContext();

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [origin, setOrigin] = useState(wizardDraft.origin || 'Mumbai');
  const [destination, setDestination] = useState('Udaipur');
  const [daysCount, setDaysCount] = useState(3);
  const [travelers, setTravelers] = useState(2);
  const [budgetTotal, setBudgetTotal] = useState(15000);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const safeDays = Math.max(1, Math.min(14, Number(daysCount) || 3));
    const safeBudget = Math.max(2000, Number(budgetTotal) || 12000);
    const safeTravelers = Math.max(1, Number(travelers) || 2);
    const daily = Math.round(safeBudget / safeDays);

    setWizardDraft((prev) => ({
      ...prev,
      origin: origin.trim() || 'Mumbai',
      destination: destination.trim() || 'Udaipur',
      daysCount: safeDays,
      adults: safeTravelers,
      children: 0,
      budget: {
        total: safeBudget,
        daily,
        food: Math.round(safeBudget * 0.3),
        transport: Math.round(safeBudget * 0.2),
        attraction: Math.round(safeBudget * 0.5),
      },
      dayPlans: Array.from({ length: safeDays }, (_, i) => ({
        dayNumber: i + 1,
        title: i === 0 ? 'Arrival & Relaxed Exploration' : `Day ${i + 1} Discovery`,
        pace: i === 0 ? 'Relaxed' : 'Balanced',
        notes: prev.generalNotes,
      })),
    }));

    navigate('/create-trip');
  };

  const handleQuickPlanDestination = (destName: string, recDays: number, dailyBudget: number) => {
    const total = recDays * dailyBudget;
    createTripFromRequest({
      origin: origin || 'Mumbai',
      destination: destName,
      daysCount: recDays,
      adults: 2,
      children: 0,
      budget: {
        total,
        daily: dailyBudget,
        food: Math.round(total * 0.3),
        transport: Math.round(total * 0.2),
        attraction: Math.round(total * 0.5),
      },
      travelStyle: 'Balanced',
      dayPlans: Array.from({ length: recDays }, (_, i) => ({
        dayNumber: i + 1,
        title: i === 0 ? 'Arrival & Relaxed Exploration' : `Day ${i + 1} Exploration`,
        pace: i === 0 ? 'Relaxed' : 'Balanced',
        notes: ['Nature and sightseeing', 'Local food experiences'],
      })),
      generalNotes: ['Nature and sightseeing', 'Local food experiences'],
    });
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#FCFBF7] text-[#252B28]">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#FCFBF7]/95 backdrop-blur border-b border-[#252B28]/10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="font-display text-xl font-semibold tracking-tight text-[#174B3A] whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <Compass className="w-5 h-5 text-[#174B3A]" />
            <span>TripMate</span>
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#252B28]/80">
            <a href="#top" className="hover:text-[#174B3A] transition-colors whitespace-nowrap shrink-0">
              Home
            </a>
            <a href="#explore" className="hover:text-[#174B3A] transition-colors whitespace-nowrap shrink-0">
              Explore
            </a>
            <Link to="/trips" className="hover:text-[#174B3A] transition-colors whitespace-nowrap shrink-0">
              My Trips
            </Link>
            <a href="#about" className="hover:text-[#174B3A] transition-colors whitespace-nowrap shrink-0">
              About
            </a>
          </nav>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-4 py-2 rounded-xl bg-[#174B3A] text-white text-sm font-semibold hover:bg-[#123B2D] transition-colors whitespace-nowrap shrink-0"
              >
                Open Workspace
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-[#252B28] hover:text-[#174B3A] transition-colors whitespace-nowrap shrink-0"
                >
                  Login
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 rounded-xl bg-[#174B3A] text-white text-sm font-semibold hover:bg-[#123B2D] transition-colors whitespace-nowrap shrink-0"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="md:hidden p-2 rounded-lg text-[#252B28] hover:bg-[#F8F5EC]"
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="md:hidden border-t border-[#252B28]/10 bg-[#FCFBF7] px-4 py-4 space-y-2">
            <a
              href="#top"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-sm font-medium text-[#252B28]"
            >
              Home
            </a>
            <a
              href="#explore"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-sm font-medium text-[#252B28]"
            >
              Explore
            </a>
            <Link
              to="/trips"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-sm font-medium text-[#252B28]"
            >
              My Trips
            </Link>
            <a
              href="#about"
              onClick={() => setMobileNavOpen(false)}
              className="block py-2 text-sm font-medium text-[#252B28]"
            >
              About
            </a>
            <div className="pt-2 border-t border-[#252B28]/10 flex items-center gap-3">
              <Link
                to="/login"
                className="flex-1 text-center py-2.5 rounded-xl border border-[#252B28]/15 text-sm font-medium"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="flex-1 text-center py-2.5 rounded-xl bg-[#174B3A] text-white text-sm font-semibold"
              >
                Sign Up
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="top" className="relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 pt-6 pb-16">
          <div className="relative rounded-3xl overflow-hidden min-h-[540px] lg:min-h-[600px] flex flex-col justify-end">
            <TravelImage
              src={GENERATED_IMAGES.hero}
              alt="Golden hour view overlooking Lake Pichola in Udaipur"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />

            <div className="relative z-10 p-6 sm:p-10 lg:p-14 max-w-3xl">
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="font-display text-white font-semibold tracking-tight leading-[1.08] [text-wrap:balance]"
                style={{ fontSize: 'clamp(2.35rem, 4.4vw, 3.85rem)' }}
              >
                Your Journey, Your Way.
              </motion.h1>
              <p className="mt-4 text-base sm:text-lg text-white/90 max-w-xl leading-relaxed">
                Plan smarter, explore more, and create unforgettable journeys with AI.
                Give yourself a starting plan — then reshape every hour, swap attractions, and track every rupee live.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3.5">
                <button
                  type="button"
                  onClick={() => navigate('/create-trip')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#D8AC55] text-[#252B28] text-sm font-semibold hover:bg-[#e1b866] transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Start Planning</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <a
                  href="#explore"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/15 backdrop-blur text-white border border-white/25 text-sm font-semibold hover:bg-white/25 transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Explore Destinations</span>
                </a>
              </div>
            </div>
          </div>

          {/* Interactive Trip Search Bar */}
          <form
            onSubmit={handleHeroSearch}
            className="relative z-20 -mt-10 mx-2 sm:mx-6 lg:mx-10 bg-white rounded-2xl border border-[#252B28]/12 shadow-xl p-4 sm:p-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-[#5A645F] mb-1.5">
                  Starting Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-[#174B3A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="Mumbai, Delhi..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FCFBF7] border border-[#252B28]/15 text-sm focus:outline-none focus:border-[#174B3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A645F] mb-1.5">
                  Destination
                </label>
                <input
                  type="text"
                  list="tripmate-destinations"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="Jaipur, Goa, Manali..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FCFBF7] border border-[#252B28]/15 text-sm focus:outline-none focus:border-[#174B3A]"
                />
                <datalist id="tripmate-destinations">
                  {DESTINATIONS.map((d) => (
                    <option key={d.id} value={d.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A645F] mb-1.5">
                  Number of Days
                </label>
                <div className="relative">
                  <CalendarDays className="w-4 h-4 text-[#174B3A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={daysCount}
                    onChange={(e) => setDaysCount(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FCFBF7] border border-[#252B28]/15 text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A645F] mb-1.5">
                  Travelers
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-[#174B3A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={travelers}
                    onChange={(e) => setTravelers(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FCFBF7] border border-[#252B28]/15 text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5A645F] mb-1.5">
                  Total Budget (INR)
                </label>
                <div className="relative">
                  <IndianRupee className="w-4 h-4 text-[#174B3A] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    min={2000}
                    step={500}
                    value={budgetTotal}
                    onChange={(e) => setBudgetTotal(Number(e.target.value))}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#FCFBF7] border border-[#252B28]/15 text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-[#174B3A] text-white text-sm font-semibold hover:bg-[#123B2D] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <span>Build Itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Popular Destinations */}
      <section id="explore" className="py-16 border-t border-[#252B28]/8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#252B28] [text-wrap:balance]">
                Curated Indian Destinations
              </h2>
              <p className="mt-2 text-base text-[#5A645F] max-w-2xl">
                Start with a realistic day-wise blueprint tailored to each region’s rhythm, then customize every stop.
              </p>
            </div>
            <Link
              to="/dashboard"
              className="text-sm font-semibold text-[#174B3A] hover:underline inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <span>Preview Sample Udaipur Plan</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {DESTINATIONS.map((dest) => (
              <article
                key={dest.id}
                className="bg-white rounded-2xl border border-[#252B28]/10 overflow-hidden flex flex-col hover:border-[#174B3A]/35 transition-colors"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#F8F5EC]">
                  <TravelImage
                    src={dest.imageUrl}
                    alt={`${dest.name}, ${dest.region}`}
                    fallbackTitle={dest.name}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-300"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-xs text-[#5A645F] flex items-center gap-2 font-medium tabular-nums">
                    <span>{dest.region}</span>
                    <span aria-hidden="true">·</span>
                    <span>{dest.recommendedDays} Days</span>
                    <span aria-hidden="true">·</span>
                    <span>~{formatINR(dest.typicalDailyBudget)}/day</span>
                  </div>
                  <h3 className="mt-2 font-display text-xl font-semibold text-[#252B28]">
                    {dest.name}
                  </h3>
                  <p className="mt-2 text-sm text-[#5A645F] leading-relaxed flex-1">
                    {dest.description}
                  </p>
                  <div className="mt-5 pt-4 border-t border-[#252B28]/8 flex items-center justify-between gap-3">
                    <span className="text-xs text-[#5A645F]">Best: {dest.bestSeason}</span>
                    <button
                      type="button"
                      onClick={() =>
                        handleQuickPlanDestination(dest.name, dest.recommendedDays, dest.typicalDailyBudget)
                      }
                      className="px-4 py-2 rounded-xl bg-[#F8F5EC] text-[#174B3A] text-xs font-semibold hover:bg-[#174B3A] hover:text-white transition-colors whitespace-nowrap shrink-0"
                    >
                      Generate Plan
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* How TripMate Works */}
      <section id="about" className="py-16 bg-[#F8F5EC] border-y border-[#252B28]/8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold text-[#252B28] [text-wrap:balance]">
              Give travelers a starting plan, not a fixed plan.
            </h2>
            <p className="mt-3 text-base text-[#5A645F]">
              Every edit shapes the journey. Adjust daily intensity, drag activities across days, and watch your budget update instantaneously.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl border border-[#252B28]/10 p-7">
              <div className="text-xs font-mono font-semibold text-[#174B3A]">01.</div>
              <h3 className="mt-3 font-display text-xl font-semibold text-[#252B28]">
                Set Budget & Day Pace
              </h3>
              <p className="mt-2.5 text-sm text-[#5A645F] leading-relaxed">
                Define your INR budget split across food, transport, and attractions, then assign individual energy levels to each day.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#252B28]/10 p-7">
              <div className="text-xs font-mono font-semibold text-[#174B3A]">02.</div>
              <h3 className="mt-3 font-display text-xl font-semibold text-[#252B28]">
                Drag, Swap & Resolve Conflicts
              </h3>
              <p className="mt-2.5 text-sm text-[#5A645F] leading-relaxed">
                Move cards across days with drag-and-drop, replace crowded stops with lower-cost or child-friendly alternatives, and catch time overlaps immediately.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-[#252B28]/10 p-7">
              <div className="text-xs font-mono font-semibold text-[#174B3A]">03.</div>
              <h3 className="mt-3 font-display text-xl font-semibold text-[#252B28]">
                Track Expenses Dynamically
              </h3>
              <p className="mt-2.5 text-sm text-[#5A645F] leading-relaxed">
                Inspect live daily spend bars, category distributions, and remaining INR headroom without touching a single spreadsheet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Experiences & Platform Capabilities (Asymmetric Bento) */}
      <section className="py-16">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-7 bg-[#174B3A] text-white rounded-3xl p-8 sm:p-10 flex flex-col justify-between">
              <div>
                <div className="text-xs font-medium text-[#D8AC55]">Interactive Workspace</div>
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight [text-wrap:balance]">
                  Built for travelers who adjust plans on the move.
                </h2>
                <p className="mt-4 text-sm sm:text-base text-white/85 max-w-xl leading-relaxed">
                  Whether you want a relaxed first morning in Udaipur or a packed heritage circuit in Jaipur, TripMate keeps every hour, route, and rupee aligned.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-6 border-t border-white/15">
                <div>
                  <Layers className="w-5 h-5 text-[#D8AC55] mb-2" />
                  <div className="text-sm font-semibold">Drag-and-Drop Days</div>
                  <div className="text-xs text-white/75 mt-1">Reorder or shift between days smoothly.</div>
                </div>
                <div>
                  <SlidersHorizontal className="w-5 h-5 text-[#D8AC55] mb-2" />
                  <div className="text-sm font-semibold">Smart Alternatives</div>
                  <div className="text-xs text-white/75 mt-1">Swap for lower-cost or kid-friendly stops.</div>
                </div>
                <div>
                  <IndianRupee className="w-5 h-5 text-[#D8AC55] mb-2" />
                  <div className="text-sm font-semibold">Live INR Analytics</div>
                  <div className="text-xs text-white/75 mt-1">Instant recalculation on every edit.</div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#252B28]/10 overflow-hidden flex flex-col">
              <div className="h-56 overflow-hidden">
                <TravelImage
                  src={GENERATED_IMAGES.cafe}
                  alt="Morning terrace cafe dining"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-[#5A645F] font-medium">Sample Day 1 Blueprint · Udaipur</div>
                  <h3 className="mt-2 font-display text-2xl font-semibold text-[#252B28]">
                    Arrival & Relaxed Exploration
                  </h3>
                  <ul className="mt-4 space-y-2 text-sm text-[#5A645F] font-mono tabular-nums">
                    <li className="flex justify-between">
                      <span className="font-sans text-[#252B28]">08:30 · Breakfast at Café Morning</span>
                      <span>₹500</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-sans text-[#252B28]">10:00 · Visit Lakeside Park</span>
                      <span>₹800</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-sans text-[#252B28]">13:00 · Lunch at Local Bistro</span>
                      <span>₹700</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="font-sans text-[#252B28]">17:00 · Evening Leisure Walk</span>
                      <span>₹600</span>
                    </li>
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-[#252B28]/10 flex items-center justify-between">
                  <span className="text-xs font-mono text-[#5A645F] tabular-nums">
                    4 activities · ₹2,600 total
                  </span>
                  <Link
                    to="/dashboard"
                    className="text-sm font-semibold text-[#174B3A] hover:underline inline-flex items-center gap-1"
                  >
                    <span>Edit This Plan</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-[#F8F5EC] border-t border-[#252B28]/8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8">
          <h2 className="font-display text-2xl sm:text-3xl font-semibold text-[#252B28] mb-8">
            How travelers use TripMate
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <blockquote className="bg-white rounded-2xl border border-[#252B28]/10 p-6 flex flex-col justify-between">
              <p className="text-sm text-[#252B28] leading-relaxed">
                “Our 4-day Goa family trip originally ran ₹3,200 over budget. Swapping two crowded stops for South Goa botanical and beach alternatives brought us ₹1,400 under target in two minutes.”
              </p>
              <footer className="mt-5 pt-4 border-t border-[#252B28]/8 text-xs text-[#5A645F]">
                <strong className="text-[#252B28] font-semibold">Ananya Deshmukh</strong> · Product Manager, Pune
              </footer>
            </blockquote>

            <blockquote className="bg-white rounded-2xl border border-[#252B28]/10 p-6 flex flex-col justify-between">
              <p className="text-sm text-[#252B28] leading-relaxed">
                “Being able to mark Day 1 of our Udaipur trip as Relaxed while keeping Day 2 packed meant we actually enjoyed our morning coffee instead of rushing from 7 AM.”
              </p>
              <footer className="mt-5 pt-4 border-t border-[#252B28]/8 text-xs text-[#5A645F]">
                <strong className="text-[#252B28] font-semibold">Rohan Kulkarni</strong> · Architect, Bengaluru
              </footer>
            </blockquote>

            <blockquote className="bg-white rounded-2xl border border-[#252B28]/10 p-6 flex flex-col justify-between">
              <p className="text-sm text-[#252B28] leading-relaxed">
                “The overlap warning caught a double-booked afternoon between Amber Fort and a block-printing workshop in Jaipur before we even booked cabs.”
              </p>
              <footer className="mt-5 pt-4 border-t border-[#252B28]/8 text-xs text-[#5A645F]">
                <strong className="text-[#252B28] font-semibold">Meera Nair</strong> · Independent Consultant, Kochi
              </footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Quiet Editorial Footer */}
      <footer className="bg-[#FCFBF7] border-t border-[#252B28]/10 py-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="font-display text-lg font-semibold text-[#174B3A] flex items-center gap-2">
              <Compass className="w-4 h-4" />
              <span>TripMate</span>
            </div>
            <p className="mt-1 text-xs text-[#5A645F]">
              Interactive trip planning, drag-and-drop scheduling, and dynamic INR expense tracking.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#5A645F]">
            <Link to="/create-trip" className="hover:text-[#174B3A]">
              Trip Wizard
            </Link>
            <Link to="/dashboard" className="hover:text-[#174B3A]">
              Itinerary Dashboard
            </Link>
            <Link to="/planner" className="hover:text-[#174B3A]">
              Drag & Drop Planner
            </Link>
            <Link to="/expenses" className="hover:text-[#174B3A]">
              Expense Tracker
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
