export type CyclePhase = 'MENSTRUAL' | 'FOLLICULAR' | 'FERTILE' | 'OVULATION' | 'LUTEAL';

export interface CycleContext {
  currentDay: number;
  cycleLength: number;
  phase: CyclePhase;
  daysUntilNextPhase: number;
  fertileWindow: { start: number; end: number };
  ovulationDay: number;
}

// Default period length if not provided
const DEFAULT_PERIOD_LENGTH = 5;
const LUTEAL_LENGTH = 14;

export const derivePhase = (day: number, cycleLength: number, periodLength: number = DEFAULT_PERIOD_LENGTH): CyclePhase => {
  const ovulationDay = cycleLength - LUTEAL_LENGTH; // e.g. 28 - 14 = 14
  const fertileStart = ovulationDay - 5; // e.g. 9
  const fertileEnd = ovulationDay + 1; // e.g. 15

  // 1. Menstrual Phase: Day 1 to periodLength
  if (day <= periodLength) return 'MENSTRUAL';

  // 2. Follicular Phase: After period until fertile window
  // Note: If period is long or cycle short, follicular might be short or non-existent
  if (day < fertileStart) return 'FOLLICULAR';

  // 3. Fertile Window (including Ovulation)
  if (day >= fertileStart && day <= fertileEnd) {
    if (day === ovulationDay) return 'OVULATION';
    return 'FERTILE';
  }

  // 4. Luteal Phase: After fertile window until end
  return 'LUTEAL';
};

export const getCycleContext = (
  startDate: string, 
  cycleLength: number, 
  userPeriodLength?: number | null,
  referenceDate = new Date()
): CycleContext => {
  // Log for debugging timezone issues
  console.log('=== CYCLE CONTEXT DEBUG ===');
  console.log('Server current time (local):', new Date().toString());
  console.log('Server current time (ISO):', new Date().toISOString());
  console.log('Reference date input:', referenceDate.toISOString());
  console.log('Start date input:', startDate);
  
  const start = new Date(startDate);
  // Reset time part to ensure pure date calculation using UTC to avoid timezone issues
  start.setUTCHours(0, 0, 0, 0);
  const ref = new Date(referenceDate);
  ref.setUTCHours(0, 0, 0, 0);

  console.log('Start date (UTC normalized):', start.toISOString());
  console.log('Reference date (UTC normalized):', ref.toISOString());

  const diffMs = ref.getTime() - start.getTime();
  const daysSinceStart = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const currentDay = (daysSinceStart % cycleLength) + 1;
  
  console.log('Days since start:', daysSinceStart);
  console.log('Current day:', currentDay);
  console.log('===========================');
  const periodLength = userPeriodLength || DEFAULT_PERIOD_LENGTH;
  const phase = derivePhase(currentDay, cycleLength, periodLength);

  const ovulationDay = cycleLength - LUTEAL_LENGTH;
  const fertileStart = ovulationDay - 5;
  const fertileEnd = ovulationDay + 1;

  let nextPhaseStart = 1;
  
  if (phase === 'MENSTRUAL') {
    // Next is FOLLICULAR (starts day after period ends)
    nextPhaseStart = periodLength + 1;
    // Edge case: if Follicular is skipped (e.g. period overlaps fertile), next is Fertile
    if (nextPhaseStart >= fertileStart) nextPhaseStart = fertileStart;
  } else if (phase === 'FOLLICULAR') {
    nextPhaseStart = fertileStart;
  } else if (phase === 'FERTILE') {
    // If today is fertile but not ovulation checks
    if (currentDay < ovulationDay) nextPhaseStart = ovulationDay;
    else if (currentDay === ovulationDay) nextPhaseStart = ovulationDay + 1;
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
