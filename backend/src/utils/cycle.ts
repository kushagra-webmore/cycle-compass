export type CyclePhase = 'MENSTRUAL' | 'FOLLICULAR' | 'FERTILE' | 'OVULATION' | 'LUTEAL';

export interface CycleContext {
  currentDay: number;
  cycleLength: number;
  phase: CyclePhase;
  daysUntilNextPhase: number;
  fertileWindow: { start: number; end: number };
  ovulationDay: number;
}

const LUTEAL_LENGTH = 14;

export const derivePhase = (day: number, length: number): CyclePhase => {
  const ovulationDay = length - LUTEAL_LENGTH;
  const fertileStart = ovulationDay - 5;
  const fertileEnd = ovulationDay + 1;

  if (day <= 5) return 'MENSTRUAL';
  if (day === ovulationDay) return 'OVULATION';
  if (day >= fertileStart && day <= fertileEnd) return 'FERTILE';
  if (day < ovulationDay) return 'FOLLICULAR';
  return 'LUTEAL';
};

export const getCycleContext = (startDate: string, cycleLength: number, referenceDate = new Date()): CycleContext => {
  const start = new Date(startDate);
  // Reset time part to ensure pure date calculation
  start.setHours(0, 0, 0, 0);
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const diffMs = ref.getTime() - start.getTime();
  const daysSinceStart = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const currentDay = (daysSinceStart % cycleLength) + 1;
  const phase = derivePhase(currentDay, cycleLength);

  const ovulationDay = cycleLength - LUTEAL_LENGTH;
  const fertileStart = ovulationDay - 5;
  const fertileEnd = ovulationDay + 1;

  let nextPhaseStart = 1;
  // Calculate next phase based on current phase progression
  // Order: MENSTRUAL -> FOLLICULAR -> FERTILE -> OVULATION -> LUTEAL
  // Note: This simple switch might need refinement if phases overlap or skip (e.g. short cycles)
  
  if (phase === 'MENSTRUAL') {
    // Next is FOLLICULAR (or FERTILE if short cycle)
    // If fertile start <= 6, next is FERTILE
    nextPhaseStart = 6;
    if (fertileStart <= 5) nextPhaseStart = fertileStart; // Overlap edge case
  } else if (phase === 'FOLLICULAR') {
    nextPhaseStart = fertileStart;
  } else if (phase === 'FERTILE') {
    // If today is fertile but not ovulation
    // Next "Phase change" is Ovulation Day? 
    // Actually FERTILE is a window. OVULATION is a single day inside it.
    // If currentDay < Ovulation, next is Ovulation?
    // If currentDay == Ovulation, next is Luteal (Fertile day + 1 is still fertile? Yes, O+1)
    // Our logic says O+1 is FERTILE.
    // So if today is OVULATION, next is day O+1 (which returns FERTILE? No, O+1 is FertileEnd)
    // Let's look at derivePhase:
    // O+1 falls into FERTILE.
    // So if today is OVULATION, next 'Visual Phase Change' might be LUTEAL (when Fertile ends)?
    // Or back to FERTILE for 1 day?
    // Let's simplify: Next MAJOR phase.
    if (currentDay < ovulationDay) nextPhaseStart = ovulationDay;
    else if (currentDay === ovulationDay) nextPhaseStart = ovulationDay + 1; // Still Fertile
    else nextPhaseStart = fertileEnd + 1; // Start of Luteal
  } else if (phase === 'OVULATION') {
     nextPhaseStart = currentDay + 1;
  } else {
    // LUTEAL
    nextPhaseStart = cycleLength + 1;
  }

  // Fallback if calculations go weird or next phase is past cycle end
  if (nextPhaseStart > cycleLength) nextPhaseStart = cycleLength + 1;

  const daysUntilNextPhase = nextPhaseStart > currentDay ? nextPhaseStart - currentDay : 0;

  return {
    currentDay,
    cycleLength,
    phase,
    daysUntilNextPhase,
    fertileWindow: { start: fertileStart, end: fertileEnd },
    ovulationDay
  };
};
