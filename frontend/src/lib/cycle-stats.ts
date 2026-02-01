import { differenceInDays } from 'date-fns';

export interface CycleStatInput {
  startDate: string;
  endDate?: string | null;
}

export interface CycleStats {
  avgCycleLength: number;
  avgPeriodLength: number;
}

export function calculateCycleStats(cycles: CycleStatInput[], defaultCycle = 28, defaultPeriod = 5): CycleStats {
  if (!cycles || cycles.length === 0) {
    return { avgCycleLength: defaultCycle, avgPeriodLength: defaultPeriod };
  }

  // Sort cycles by date descending (newest first)
  const sortedCycles = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  
  // 1. Calculate Average Period Length
  // Filter cycles that have an end date
  const completedCycles = sortedCycles.filter(c => c.endDate);
  const periodLengths = completedCycles.map(c => 
    differenceInDays(new Date(c.endDate!), new Date(c.startDate)) + 1
  );
  
  const avgPeriodLength = periodLengths.length 
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : defaultPeriod;

  // 2. Calculate Average Cycle Length
  // Calculate differences between consecutive start dates
  const cycleLengths: number[] = [];
  for (let i = 0; i < sortedCycles.length - 1; i++) {
    const currentStart = new Date(sortedCycles[i].startDate);
    const prevStart = new Date(sortedCycles[i+1].startDate);
    const days = differenceInDays(currentStart, prevStart);
    
    // Filter out unreasonable cycle lengths (matching CycleHistory.tsx logic)
    // "unreasonable" means < 5 days or > 180 days (approx 6 months)
    if (days > 5 && days < 180) {
      cycleLengths.push(days);
    }
  }
  
  const avgCycleLength = cycleLengths.length 
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : defaultCycle;

  return {
    avgCycleLength,
    avgPeriodLength
  };
}
