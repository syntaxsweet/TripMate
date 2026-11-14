import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Compass,
  IndianRupee,
  Loader2,
  MapPin,
  Mountain,
  Sliders,
  Sun,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AppLayout } from '../components/AppLayout';
import { TravelImage } from '../components/TravelImage';
import { useTripContext } from '../context/TripContext';
import { DESTINATIONS } from '../data/destinations';
import { DayPace, DayPlan, TravelStyle } from '../types/trip';
import { formatINR } from '../utils/scheduleUtils';

const STEPS = [
  { num: 1, label: 'Trip Basics' },
  { num: 2, label: 'Budget' },
  { num: 3, label: 'Travel Style' },
  { num: 4, label: 'Day Preferences' },
];

const TRAVEL_STYLES: {
  id: TravelStyle;
  title: string;
  description: string;
  icon: React.FC<{ className?: string }>;
}[] = [
  {
    id: 'Adventure',
    title: 'Adventure',
    description: 'High-energy trails, sunrise treks, cycling loops, and active sightseeing.',
    icon: Mountain,
  },
  {
    id: 'Relaxed',
    title: 'Relaxed',
    description: 'Unhurried mornings, scenic lakeside walks, slow lunches, and breathing room.',
    icon: Sun,
  },
  {
    id: 'Balanced',
    title: 'Balanced',
    description: 'A thoughtful mix of landmark exploration, local food stops, and leisure evenings.',
    icon: Compass,
  },
  {
    id: 'Custom',
    title: 'Custom',
    description: 'Fine-tune every single day pace and experience preference individually.',
    icon: Sliders,
  },
];

const NOTE_OPTIONS = [
  'Child-friendly',
  'Nature and sightseeing',
  'Local food experiences',
  'Avoid crowded locations',
];

const PACE_OPTIONS: DayPace[] = ['Relaxed', 'Balanced', 'Activity-heavy'];

export const TripWizard: React.FC = () => {
  const navigate = useNavigate();
  const { wizardDraft, setWizardDraft, createTripFromRequest } = useTripContext();

  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState(0);
  const [customNoteInput, setCustomNoteInput] = useState('');

  // Keep dayPlans array synced with daysCount
  useEffect(() => {
    setWizardDraft((prev) => {
      const targetDays = Math.max(1, Math.min(14, prev.daysCount));
      if (prev.dayPlans.length === targetDays) return prev;
      const nextPlans: DayPlan[] = Array.from({ length: targetDays }, (_, idx) => {
        const existing = prev.dayPlans.find((d) => d.dayNumber === idx + 1);
        if (existing) return existing;
        return {
          dayNumber: idx + 1,
          title: idx === 0 ? 'Arrival & Relaxed Exploration' : `Day ${idx + 1} Exploration`,
          pace: idx === 0 ? 'Relaxed' : prev.travelStyle === 'Adventure' ? 'Activity-heavy' : 'Balanced',
          notes: [...prev.generalNotes],
        };
      });
      return { ...prev, dayPlans: nextPlans };
    });
  }, [wizardDraft.daysCount, wizardDraft.travelStyle, setWizardDraft]);

  const handleTotalBudgetChange = (val: number) => {
    const safeTotal = Math.max(0, val);
    const days = Math.max(1, wizardDraft.daysCount);
    setWizardDraft((prev) => ({
      ...prev,
      budget: {
        total: safeTotal,
        daily: Math.round(safeTotal / days),
        food: Math.round(safeTotal * 0.3),
        transport: Math.round(safeTotal * 0.2),
        attraction: Math.round(safeTotal * 0.5),
      },
    }));
  };

  const applySmartSplit = () => {
    const safeTotal = Math.max(1000, wizardDraft.budget.total);
    const days = Math.max(1, wizardDraft.daysCount);
    setWizardDraft((prev) => ({
      ...prev,
      budget: {
        total: safeTotal,
        daily: Math.round(safeTotal / days),
        food: Math.round(safeTotal * 0.3),
        transport: Math.round(safeTotal * 0.2),
        attraction: safeTotal - Math.round(safeTotal * 0.3) - Math.round(safeTotal * 0.2),
      },
    }));
  };

  const toggleGeneralNote = (note: string) => {
    setWizardDraft((prev) => {
      const exists = prev.generalNotes.includes(note);
      const nextNotes = exists
        ? prev.generalNotes.filter((n) => n !== note)
        : [...prev.generalNotes, note];
      return { ...prev, generalNotes: nextNotes };
    });
  };

  const addCustomNote = () => {
    const trimmed = customNoteInput.trim();
    if (!trimmed) return;
    if (!wizardDraft.generalNotes.includes(trimmed)) {
      setWizardDraft((prev) => ({
        ...prev,
        generalNotes: [...prev.generalNotes, trimmed],
      }));
    }
    setCustomNoteInput('');
  };

  const updateDayPace = (dayNum: number, pace: DayPace) => {
    setWizardDraft((prev) => ({
      ...prev,
      dayPlans: prev.dayPlans.map((d) => (d.dayNumber === dayNum ? { ...d, pace } : d)),
    }));
  };

  const validateStep = (currentStep: number): boolean => {
    setError('');
    if (currentStep === 1) {
      if (!wizardDraft.origin.trim()) {
        setError('Please enter your starting city.');
        return false;
      }
      if (!wizardDraft.destination.trim()) {
        setError('Please select or enter a destination.');
        return false;
      }
      if (wizardDraft.daysCount < 1 || wizardDraft.daysCount > 14) {
        setError('Trip duration must be between 1 and 14 days.');
        return false;
      }
      if (wizardDraft.adults < 1) {
        setError('At least 1 adult traveler is required.');
        return false;
      }
    }
    if (currentStep === 2) {
      if (wizardDraft.budget.total < 1000) {
        setError('Please set a total trip budget of at least ₹1,000.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(4, s + 1));
  };

  const handlePrev = () => {
    setError('');
    setStep((s) => Math.max(1, s - 1));
  };

  const handleGenerate = () => {
    if (!validateStep(step)) return;
    setIsGenerating(true);
    setGenerationStage(1);

    window.setTimeout(() => setGenerationStage(2), 450);
    window.setTimeout(() => setGenerationStage(3), 900);
    window.setTimeout(() => {
      createTripFromRequest({
        origin: wizardDraft.origin,
        destination: wizardDraft.destination,
        daysCount: wizardDraft.daysCount,
        adults: wizardDraft.adults,
        children: wizardDraft.children,
        budget: wizardDraft.budget,
        travelStyle: wizardDraft.travelStyle,
        dayPlans: wizardDraft.dayPlans,
        generalNotes: wizardDraft.generalNotes,
      });
      setIsGenerating(false);
      navigate('/dashboard');
    }, 1350);
  };

  const allocatedSum =
    (wizardDraft.budget.food || 0) +
    (wizardDraft.budget.transport || 0) +
    (wizardDraft.budget.attraction || 0);

  if (isGenerating) {
    const stages = [
      `Mapping curated stops in ${wizardDraft.destination}...`,
      'Balancing daily pace, travel gaps, and meal windows...',
      'Checking INR budget targets across food, transit, and attractions...',
    ];
    return (
      <AppLayout title="Building Your Itinerary" subtitle="Drafting your customizable starting plan">
        <div className="max-w-xl mx-auto my-12 bg-white rounded-3xl border border-[#252B28]/10 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#174B3A]/10 text-[#174B3A] flex items-center justify-center mx-auto mb-6">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <h2 className="font-display text-2xl font-semibold text-[#252B28]">
            Crafting your {wizardDraft.daysCount}-day {wizardDraft.destination} journey
          </h2>
          <p className="mt-2 text-sm text-[#5A645F]">
            Using smart rule-based planning tailored to your {wizardDraft.travelStyle.toLowerCase()} pace and {formatINR(wizardDraft.budget.total)} budget.
          </p>

          <div className="mt-8 space-y-3 text-left">
            {stages.map((label, idx) => {
              const active = generationStage >= idx + 1;
              return (
                <div
                  key={label}
                  className={`px-4 py-3 rounded-xl border text-xs font-medium flex items-center gap-3 transition-colors ${
                    active
                      ? 'bg-[#F8F5EC] border-[#174B3A]/30 text-[#174B3A]'
                      : 'bg-[#FCFBF7] border-[#252B28]/8 text-[#5A645F]'
                  }`}
                >
                  <Check className={`w-4 h-4 shrink-0 ${active ? 'opacity-100' : 'opacity-20'}`} />
                  <span>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Create New Trip"
      subtitle="Step-by-step setup for your personalized itinerary"
    >
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="bg-white rounded-2xl border border-[#252B28]/10 p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {STEPS.map((s) => {
              const isCompleted = step > s.num;
              const isCurrent = step === s.num;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => {
                    if (s.num < step) setStep(s.num);
                  }}
                  className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                    isCurrent
                      ? 'bg-[#174B3A] border-[#174B3A] text-white'
                      : isCompleted
                      ? 'bg-[#F8F5EC] border-[#174B3A]/25 text-[#174B3A]'
                      : 'bg-[#FCFBF7] border-[#252B28]/10 text-[#5A645F]'
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg text-xs font-mono font-semibold flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? 'bg-[#D8AC55] text-[#252B28]'
                        : isCompleted
                        ? 'bg-[#174B3A] text-white'
                        : 'bg-[#252B28]/10 text-[#5A645F]'
                    }`}
                  >
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : s.num}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] opacity-80">Step {s.num}</div>
                    <div className="text-xs sm:text-sm font-semibold truncate">{s.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18 }}
          className="bg-white rounded-2xl border border-[#252B28]/10 p-6 sm:p-8"
        >
          {/* STEP 1: TRIP BASICS */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#252B28]">
                  Where are you heading?
                </h2>
                <p className="text-sm text-[#5A645F] mt-1">
                  Enter your origin, choose a destination, and set your group size.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Origin City
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-[#174B3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={wizardDraft.origin}
                      onChange={(e) =>
                        setWizardDraft((prev) => ({ ...prev, origin: e.target.value }))
                      }
                      placeholder="e.g., Bengaluru, Mumbai"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Destination
                  </label>
                  <input
                    type="text"
                    value={wizardDraft.destination}
                    onChange={(e) =>
                      setWizardDraft((prev) => ({ ...prev, destination: e.target.value }))
                    }
                    placeholder="Select below or type any city"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
                  />
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-[#5A645F] mb-2.5">
                  Quick Select Featured Destinations
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  {DESTINATIONS.map((d) => {
                    const selected =
                      wizardDraft.destination.trim().toLowerCase() === d.name.toLowerCase();
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() =>
                          setWizardDraft((prev) => ({
                            ...prev,
                            destination: d.name,
                            daysCount: d.recommendedDays,
                          }))
                        }
                        className={`rounded-xl border overflow-hidden text-left transition-all ${
                          selected
                            ? 'border-[#174B3A] ring-2 ring-[#174B3A]/20'
                            : 'border-[#252B28]/12 hover:border-[#174B3A]/40'
                        }`}
                      >
                        <div className="h-16 overflow-hidden">
                          <TravelImage
                            src={d.imageUrl}
                            alt={d.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="p-2 bg-[#FCFBF7]">
                          <div className="text-xs font-semibold text-[#252B28] truncate">
                            {d.name}
                          </div>
                          <div className="text-[11px] text-[#5A645F] tabular-nums">
                            {d.recommendedDays}d rec.
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Number of Days (1–14)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={14}
                    value={wizardDraft.daysCount}
                    onChange={(e) =>
                      setWizardDraft((prev) => ({
                        ...prev,
                        daysCount: Math.max(1, Math.min(14, Number(e.target.value) || 1)),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Adults
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-[#174B3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={1}
                      max={15}
                      value={wizardDraft.adults}
                      onChange={(e) =>
                        setWizardDraft((prev) => ({
                          ...prev,
                          adults: Math.max(1, Number(e.target.value) || 1),
                        }))
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Children
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={10}
                    value={wizardDraft.children}
                    onChange={(e) =>
                      setWizardDraft((prev) => ({
                        ...prev,
                        children: Math.max(0, Number(e.target.value) || 0),
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: BUDGET */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-[#252B28]">
                    Set your budget in INR
                  </h2>
                  <p className="text-sm text-[#5A645F] mt-1">
                    Define your overall cap and category targets so TripMate flags overruns early.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applySmartSplit}
                  className="px-3.5 py-2 rounded-xl bg-[#F8F5EC] border border-[#252B28]/12 text-xs font-semibold text-[#174B3A] hover:bg-[#efe9d8] whitespace-nowrap shrink-0"
                >
                  Auto-Balance Categories
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Total Trip Budget (INR)
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-[#174B3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={1000}
                      step={500}
                      value={wizardDraft.budget.total}
                      onChange={(e) => handleTotalBudgetChange(Number(e.target.value))}
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Daily Budget Target (INR)
                  </label>
                  <div className="relative">
                    <IndianRupee className="w-4 h-4 text-[#174B3A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="number"
                      min={500}
                      step={250}
                      value={wizardDraft.budget.daily}
                      onChange={(e) =>
                        setWizardDraft((prev) => ({
                          ...prev,
                          budget: { ...prev.budget, daily: Math.max(0, Number(e.target.value)) },
                        }))
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Food Budget (INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={250}
                    value={wizardDraft.budget.food}
                    onChange={(e) =>
                      setWizardDraft((prev) => ({
                        ...prev,
                        budget: { ...prev.budget, food: Math.max(0, Number(e.target.value)) },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Transportation Budget (INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={250}
                    value={wizardDraft.budget.transport}
                    onChange={(e) =>
                      setWizardDraft((prev) => ({
                        ...prev,
                        budget: { ...prev.budget, transport: Math.max(0, Number(e.target.value)) },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#252B28] mb-1.5">
                    Attraction Budget (INR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    step={250}
                    value={wizardDraft.budget.attraction}
                    onChange={(e) =>
                      setWizardDraft((prev) => ({
                        ...prev,
                        budget: { ...prev.budget, attraction: Math.max(0, Number(e.target.value)) },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm font-mono tabular-nums focus:outline-none focus:border-[#174B3A]"
                  />
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#F8F5EC] border border-[#252B28]/10 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div>
                  <span className="text-[#5A645F]">Category Allocation Sum: </span>
                  <span className="font-mono font-semibold text-[#252B28] tabular-nums">
                    {formatINR(allocatedSum)}
                  </span>
                </div>
                <div className="font-mono tabular-nums">
                  {allocatedSum > wizardDraft.budget.total ? (
                    <span className="text-amber-700 font-semibold">
                      Exceeds total cap by {formatINR(allocatedSum - wizardDraft.budget.total)}
                    </span>
                  ) : (
                    <span className="text-[#174B3A] font-semibold">
                      {formatINR(wizardDraft.budget.total - allocatedSum)} buffer available for leisure
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: TRAVEL STYLE */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#252B28]">
                  Choose your overall travel style
                </h2>
                <p className="text-sm text-[#5A645F] mt-1">
                  This guides how many experiences are scheduled per day and their energy level.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {TRAVEL_STYLES.map((style) => {
                  const Icon = style.icon;
                  const active = wizardDraft.travelStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      type="button"
                      onClick={() =>
                        setWizardDraft((prev) => ({ ...prev, travelStyle: style.id }))
                      }
                      className={`p-6 rounded-2xl border text-left transition-all flex items-start gap-4 ${
                        active
                          ? 'bg-[#174B3A] border-[#174B3A] text-white'
                          : 'bg-[#FCFBF7] border-[#252B28]/12 text-[#252B28] hover:border-[#174B3A]/40'
                      }`}
                    >
                      <div
                        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          active ? 'bg-[#D8AC55] text-[#252B28]' : 'bg-white border border-[#252B28]/10 text-[#174B3A]'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-display text-lg font-semibold">{style.title}</div>
                        <p
                          className={`mt-1 text-xs leading-relaxed ${
                            active ? 'text-white/85' : 'text-[#5A645F]'
                          }`}
                        >
                          {style.description}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: DAY-SPECIFIC PREFERENCES */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-[#252B28]">
                  Fine-tune each day & preferences
                </h2>
                <p className="text-sm text-[#5A645F] mt-1">
                  Set an individual pace for each day of your {wizardDraft.daysCount}-day {wizardDraft.destination} trip.
                </p>
              </div>

              <div className="space-y-3">
                {wizardDraft.dayPlans.map((dp) => (
                  <div
                    key={dp.dayNumber}
                    className="p-4 rounded-xl bg-[#FCFBF7] border border-[#252B28]/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-sm font-semibold text-[#252B28]">
                        Day {dp.dayNumber}
                      </div>
                      <div className="text-xs text-[#5A645F]">
                        {dp.dayNumber === 1
                          ? 'Arrival & settling in'
                          : dp.dayNumber === wizardDraft.daysCount
                          ? 'Closing day & departure'
                          : 'Core exploration day'}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#252B28]/10">
                      {PACE_OPTIONS.map((pace) => (
                        <button
                          key={pace}
                          type="button"
                          onClick={() => updateDayPace(dp.dayNumber, pace)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                            dp.pace === pace
                              ? 'bg-[#174B3A] text-white'
                              : 'text-[#5A645F] hover:text-[#252B28]'
                          }`}
                        >
                          {pace}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <label className="block text-xs font-semibold text-[#252B28] mb-2.5">
                  Experience Focus & Accessibility Notes
                </label>
                <div className="flex flex-wrap gap-2">
                  {NOTE_OPTIONS.map((note) => {
                    const selected = wizardDraft.generalNotes.includes(note);
                    return (
                      <button
                        key={note}
                        type="button"
                        onClick={() => toggleGeneralNote(note)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-medium transition-colors ${
                          selected
                            ? 'bg-[#174B3A] border-[#174B3A] text-white'
                            : 'bg-[#FCFBF7] border-[#252B28]/15 text-[#252B28] hover:border-[#174B3A]/40'
                        }`}
                      >
                        {note}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={customNoteInput}
                    onChange={(e) => setCustomNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addCustomNote();
                      }
                    }}
                    placeholder="Add custom preference (e.g., Vegetarian dining, Early sunset views)..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-[#252B28]/15 bg-[#FCFBF7] text-sm focus:outline-none focus:border-[#174B3A]"
                  />
                  <button
                    type="button"
                    onClick={addCustomNote}
                    className="px-4 py-2 rounded-xl bg-[#F8F5EC] border border-[#252B28]/12 text-xs font-semibold text-[#174B3A] hover:bg-[#efe9d8]"
                  >
                    Add Note
                  </button>
                </div>

                {wizardDraft.generalNotes.filter((n) => !NOTE_OPTIONS.includes(n)).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {wizardDraft.generalNotes
                      .filter((n) => !NOTE_OPTIONS.includes(n))
                      .map((custom) => (
                        <button
                          key={custom}
                          type="button"
                          onClick={() => toggleGeneralNote(custom)}
                          className="px-3 py-1.5 rounded-xl bg-[#F8F5EC] border border-[#174B3A]/30 text-xs text-[#174B3A] font-medium"
                        >
                          {custom} ×
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Wizard Navigation Footer */}
          <div className="mt-8 pt-6 border-t border-[#252B28]/10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handlePrev}
              disabled={step === 1}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                step === 1
                  ? 'border-[#252B28]/10 text-[#5A645F]/40 cursor-not-allowed'
                  : 'border-[#252B28]/15 text-[#252B28] hover:bg-[#F8F5EC]'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#174B3A] text-white text-sm font-semibold hover:bg-[#123B2D] transition-colors"
              >
                <span>Next Step</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#D8AC55] text-[#252B28] text-sm font-semibold hover:bg-[#e1b866] transition-colors"
              >
                <span>Generate Itinerary</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
};
