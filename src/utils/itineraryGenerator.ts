import { DESTINATIONS, DestinationTemplateActivity, findDestinationInfo, GENERATED_IMAGES } from '../data/destinations';
import {
  Activity,
  AlternativeActivityOption,
  BudgetBreakdown,
  DayPace,
  DayPlan,
  TravelStyle,
  Trip,
} from '../types/trip';
import { addMinutesToTime, minutesToTime, parseTimeToMinutes } from './scheduleUtils';

export interface ItineraryGenerationRequest {
  origin: string;
  destination: string;
  daysCount: number;
  adults: number;
  children: number;
  budget: BudgetBreakdown;
  travelStyle: TravelStyle;
  dayPlans: DayPlan[];
  generalNotes: string[];
}

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function adjustCostForGroupAndBudget(
  baseCost: number,
  adults: number,
  children: number,
  targetDailyBudget: number,
  activitiesPerDay: number
): number {
  const travelersFactor = Math.max(1, adults + children * 0.6);
  const raw = baseCost * (travelersFactor > 2 ? 1 + (travelersFactor - 2) * 0.25 : 1);
  const budgetCapPerAct = targetDailyBudget > 0 ? (targetDailyBudget * 0.92) / Math.max(1, activitiesPerDay) : raw;
  const blended = targetDailyBudget > 0 ? Math.min(raw, Math.max(250, budgetCapPerAct * 1.05)) : raw;
  return Math.round(blended / 50) * 50;
}

function getSlotStartMinutes(slot: DestinationTemplateActivity['preferredSlot'], cursor: number): number {
  const defaults: Record<DestinationTemplateActivity['preferredSlot'], number> = {
    morning: 8 * 60 + 30,
    midday: 12 * 60 + 45,
    afternoon: 15 * 60,
    evening: 17 * 60 + 15,
  };
  return Math.max(defaults[slot], cursor + 30);
}

/**
 * Modular rule-based mock itinerary generator.
 * Designed so a live Gemini API call can replace the body without changing callers.
 */
export function generateMockItinerary(req: ItineraryGenerationRequest): Trip {
  const destInfo = findDestinationInfo(req.destination);
  const destLabel = req.destination.trim() || destInfo.name;
  const isCustomCity = !DESTINATIONS.some((d) => d.name.toLowerCase() === destLabel.toLowerCase());

  const activities: Activity[] = [];
  const normalizedDayPlans: DayPlan[] = [];

  const avoidCrowds = req.generalNotes.some((n) => n.toLowerCase().includes('crowd'));
  const childFriendlyReq = req.children > 0 || req.generalNotes.some((n) => n.toLowerCase().includes('child'));
  const foodFocus = req.generalNotes.some((n) => n.toLowerCase().includes('food'));
  const natureFocus = req.generalNotes.some((n) => n.toLowerCase().includes('nature'));

  for (let d = 1; d <= req.daysCount; d++) {
    const requestedPlan = req.dayPlans.find((p) => p.dayNumber === d);
    const pace: DayPace =
      requestedPlan?.pace ||
      (req.travelStyle === 'Adventure'
        ? 'Activity-heavy'
        : req.travelStyle === 'Relaxed'
        ? 'Relaxed'
        : d === 1
        ? 'Relaxed'
        : 'Balanced');

    const dayTitle =
      requestedPlan?.title ||
      (d === 1
        ? 'Arrival & Relaxed Exploration'
        : d === req.daysCount
        ? 'Local Markets & Departure'
        : pace === 'Activity-heavy'
        ? `Active ${destLabel} Discovery`
        : `Heritage, Food & Scenic Views`);

    normalizedDayPlans.push({
      dayNumber: d,
      title: dayTitle,
      pace,
      notes: requestedPlan?.notes || [],
    });

    const targetCount = pace === 'Relaxed' ? 3 : pace === 'Activity-heavy' ? 5 : 4;

    // Rank pool items for this day based on preferences and rotate by day index
    const scored = [...destInfo.activitiesPool].map((item, idx) => {
      let score = 10;
      if (req.travelStyle !== 'Custom' && item.styleMatch.includes(req.travelStyle)) score += 4;
      if (childFriendlyReq && item.isChildFriendly) score += 3;
      if (childFriendlyReq && !item.isChildFriendly) score -= 5;
      if (avoidCrowds && item.crowdLevel === 'Low') score += 4;
      if (avoidCrowds && item.crowdLevel === 'High') score -= 4;
      if (foodFocus && item.category === 'Food') score += 3;
      if (natureFocus && (item.category === 'Nature' || item.category === 'Leisure')) score += 3;
      // Rotate variety across days
      score += ((idx + d * 2) % destInfo.activitiesPool.length) * 0.35;
      return { item, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Ensure at least one morning meal, one sightseeing/nature, one midday meal, and one evening item
    const chosen: DestinationTemplateActivity[] = [];
    const slotOrder: DestinationTemplateActivity['preferredSlot'][] = ['morning', 'morning', 'midday', 'afternoon', 'evening'];

    for (let sIdx = 0; sIdx < targetCount; sIdx++) {
      const wantedSlot = slotOrder[sIdx % slotOrder.length];
      const candidate =
        scored.find(
          (s) =>
            !chosen.includes(s.item) &&
            s.item.preferredSlot === wantedSlot
        ) || scored.find((s) => !chosen.includes(s.item));

      if (candidate) {
        chosen.push(candidate.item);
      }
    }

    // Sort chosen by slot chronology
    const slotWeight: Record<DestinationTemplateActivity['preferredSlot'], number> = {
      morning: 1,
      midday: 2,
      afternoon: 3,
      evening: 4,
    };
    chosen.sort((a, b) => slotWeight[a.preferredSlot] - slotWeight[b.preferredSlot]);

    let cursorMinutes = 8 * 60; // 08:00
    chosen.forEach((tpl, idx) => {
      const startMin =
        idx === 0
          ? 8 * 60 + 30
          : getSlotStartMinutes(tpl.preferredSlot, cursorMinutes);
      const startTime = minutesToTime(startMin);
      const duration = Math.max(30, tpl.durationMinutes);
      const endTime = addMinutesToTime(startTime, duration);
      cursorMinutes = parseTimeToMinutes(endTime);

      const cost = adjustCostForGroupAndBudget(
        tpl.baseCost,
        req.adults,
        req.children,
        req.budget.daily || Math.round(req.budget.total / Math.max(1, req.daysCount)),
        targetCount
      );

      activities.push({
        id: uid('act'),
        title: isCustomCity ? tpl.title.replace(/Udaipur|Lake Pichola/gi, destLabel) : tpl.title,
        description: tpl.description,
        category: tpl.category,
        location: isCustomCity ? `${destLabel} Central District` : tpl.location,
        imageUrl: tpl.imageUrl,
        startTime,
        endTime,
        durationMinutes: duration,
        cost,
        day: d,
        isChildFriendly: tpl.isChildFriendly,
        crowdLevel: tpl.crowdLevel,
      });
    });
  }

  const now = new Date().toISOString();
  return {
    id: uid('trip'),
    name: `${destLabel} ${req.daysCount}-Day Escape`,
    origin: req.origin.trim() || 'Bengaluru',
    destination: destLabel,
    daysCount: req.daysCount,
    adults: req.adults,
    children: req.children,
    budget: { ...req.budget },
    travelStyle: req.travelStyle,
    dayPlans: normalizedDayPlans,
    activities,
    generalNotes: req.generalNotes,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Seeded initial Udaipur trip matching the exact Day 1 example from the specification
 * so users immediately see an editable, realistic itinerary on first workspace visit.
 */
export function createSeededDefaultTrip(): Trip {
  const now = new Date().toISOString();
  return {
    id: 'trip-udaipur-demo',
    name: 'Udaipur Lakeside Retreat',
    origin: 'Mumbai',
    destination: 'Udaipur',
    daysCount: 3,
    adults: 2,
    children: 0,
    budget: {
      total: 12000,
      daily: 4000,
      food: 4000,
      transport: 2500,
      attraction: 5500,
    },
    travelStyle: 'Relaxed',
    generalNotes: ['Nature and sightseeing', 'Local food experiences'],
    dayPlans: [
      {
        dayNumber: 1,
        title: 'Arrival & Relaxed Exploration',
        pace: 'Relaxed',
        notes: ['Nature and sightseeing', 'Local food experiences'],
      },
      {
        dayNumber: 2,
        title: 'Lakeside Heritage & Culture',
        pace: 'Balanced',
        notes: ['Local food experiences'],
      },
      {
        dayNumber: 3,
        title: 'Hilltop Vistas & Artisan Markets',
        pace: 'Balanced',
        notes: ['Avoid crowded locations'],
      },
    ],
    activities: [
      // Exact Day 1 specification
      {
        id: 'act-seed-1',
        title: 'Breakfast at Café Morning',
        description: 'Warm sourdough toast, masala chai, and fresh seasonal fruit on a sunlit lakeside terrace.',
        category: 'Food',
        location: 'Lal Ghat, Udaipur',
        imageUrl: GENERATED_IMAGES.cafe,
        startTime: '08:30',
        endTime: '09:15',
        durationMinutes: 45,
        cost: 500,
        day: 1,
        isChildFriendly: true,
        crowdLevel: 'Low',
      },
      {
        id: 'act-seed-2',
        title: 'Visit Lakeside Park',
        description: 'Guided stroll through shaded lakeside gardens, carved stone pavilions, and tranquil shoreline paths.',
        category: 'Nature',
        location: 'Fateh Sagar Shoreline',
        imageUrl: GENERATED_IMAGES.udaipur,
        startTime: '10:00',
        endTime: '12:00',
        durationMinutes: 120,
        cost: 800,
        day: 1,
        isChildFriendly: true,
        crowdLevel: 'Low',
      },
      {
        id: 'act-seed-3',
        title: 'Lunch at Local Bistro',
        description: 'Homestyle Rajasthani thali and wood-fired flatbreads in a quiet heritage courtyard.',
        category: 'Food',
        location: 'Chandpole Old Quarter',
        imageUrl: GENERATED_IMAGES.cafe,
        startTime: '13:00',
        endTime: '14:00',
        durationMinutes: 60,
        cost: 700,
        day: 1,
        isChildFriendly: true,
        crowdLevel: 'Moderate',
      },
      {
        id: 'act-seed-4',
        title: 'Evening Leisure Walk',
        description: 'Golden-hour waterfront promenade walk past Ambrai Ghat with sunset boat views across the lake.',
        category: 'Leisure',
        location: 'Ambrai Ghat Promenade',
        imageUrl: GENERATED_IMAGES.hero,
        startTime: '17:00',
        endTime: '19:00',
        durationMinutes: 120,
        cost: 600,
        day: 1,
        isChildFriendly: true,
        crowdLevel: 'Moderate',
      },
      // Day 2
      {
        id: 'act-seed-5',
        title: 'City Palace Architecture Tour',
        description: 'Explore carved balconies, mosaic courtyards, and royal museum galleries overlooking Lake Pichola.',
        category: 'Culture',
        location: 'City Palace Complex',
        imageUrl: GENERATED_IMAGES.jaipur,
        startTime: '09:00',
        endTime: '11:30',
        durationMinutes: 150,
        cost: 1100,
        day: 2,
        isChildFriendly: true,
        crowdLevel: 'High',
      },
      {
        id: 'act-seed-6',
        title: 'Heritage Boat Transfer & Jagmandir',
        description: 'Scenic electric ferry across Lake Pichola with island garden access and refreshments.',
        category: 'Transport',
        location: 'Rameshwar Ghat Pier',
        imageUrl: GENERATED_IMAGES.udaipur,
        startTime: '12:15',
        endTime: '13:45',
        durationMinutes: 90,
        cost: 950,
        day: 2,
        isChildFriendly: true,
        crowdLevel: 'Moderate',
      },
      {
        id: 'act-seed-7',
        title: 'Bagore Ki Haveli Folk Evening',
        description: 'Traditional Rajasthani puppetry, acoustic folk music, and courtyard lamp lighting.',
        category: 'Culture',
        location: 'Gangaur Ghat',
        imageUrl: GENERATED_IMAGES.udaipur,
        startTime: '18:00',
        endTime: '19:30',
        durationMinutes: 90,
        cost: 550,
        day: 2,
        isChildFriendly: true,
        crowdLevel: 'Moderate',
      },
      // Day 3
      {
        id: 'act-seed-8',
        title: 'Badi Lake Morning E-Bike Loop',
        description: 'Quiet rural morning ride through Aravalli foothills and lakeside embankment viewpoints.',
        category: 'Attraction',
        location: 'Badi Lake Road',
        imageUrl: GENERATED_IMAGES.manali,
        startTime: '08:00',
        endTime: '10:30',
        durationMinutes: 150,
        cost: 1250,
        day: 3,
        isChildFriendly: false,
        crowdLevel: 'Low',
      },
      {
        id: 'act-seed-9',
        title: 'Spice Courtyard Farewell Lunch',
        description: 'Slow multi-course Rajasthani tasting menu with local seasonal chutneys.',
        category: 'Food',
        location: 'Hathi Pol Terrace',
        imageUrl: GENERATED_IMAGES.cafe,
        startTime: '13:00',
        endTime: '14:15',
        durationMinutes: 75,
        cost: 900,
        day: 3,
        isChildFriendly: true,
        crowdLevel: 'Low',
      },
      {
        id: 'act-seed-10',
        title: 'Monsoon Palace Sunset Drive',
        description: 'Private cab ascent to Sajjangarh hilltop terrace for panoramic valley views at dusk.',
        category: 'Attraction',
        location: 'Sajjangarh Wildlife Ridge',
        imageUrl: GENERATED_IMAGES.hero,
        startTime: '16:45',
        endTime: '18:45',
        durationMinutes: 120,
        cost: 1200,
        day: 3,
        isChildFriendly: true,
        crowdLevel: 'Moderate',
      },
    ],
    createdAt: now,
    updatedAt: now,
  };
}

export function getAlternativesForTrip(destination: string): AlternativeActivityOption[] {
  const destInfo = findDestinationInfo(destination);
  const globalFallbacks: AlternativeActivityOption[] = [
    {
      id: 'alt-global-1',
      title: 'Artisan Coffee & Morning Sketch Walk',
      description: 'Relaxed local café stop paired with a quiet neighborhood walking route.',
      category: 'Food',
      location: `${destInfo.name} Old Quarter`,
      imageUrl: GENERATED_IMAGES.cafe,
      durationMinutes: 60,
      cost: 400,
      isChildFriendly: true,
      crowdLevel: 'Low',
      tags: ['Lower Cost', 'Shorter Duration', 'Child-Friendly', 'Different Type'],
    },
    {
      id: 'alt-global-2',
      title: 'Public Botanical Gardens & Picnic',
      description: 'Open shaded lawns, heritage trees, and unhurried family downtime.',
      category: 'Nature',
      location: `${destInfo.name} Central Gardens`,
      imageUrl: GENERATED_IMAGES.delhi,
      durationMinutes: 90,
      cost: 250,
      isChildFriendly: true,
      crowdLevel: 'Low',
      tags: ['Lower Cost', 'Child-Friendly', 'Similar'],
    },
  ];
  return [...destInfo.alternativesPool, ...globalFallbacks];
}
