export type CyclePhase = 'MENSTRUAL' | 'FOLLICULAR' | 'OVULATION' | 'LUTEAL';

export interface CycleContext {
  currentDay: number;
  cycleLength: number;
  phase: CyclePhase;
  daysUntilNextPhase: number;
}

export const derivePhase = (day: number, length: number): CyclePhase => {
  if (day <= 5) return 'MENSTRUAL';
  if (day <= length * 0.4) return 'FOLLICULAR';
  if (day <= length * 0.5) return 'OVULATION';
  return 'LUTEAL';
};

export const getCycleContext = (startDate: string, cycleLength: number, referenceDate = new Date()): CycleContext => {
  const start = new Date(startDate);
  const diffMs = referenceDate.getTime() - start.getTime();
  const daysSinceStart = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const currentDay = (daysSinceStart % cycleLength) + 1;
  const phase = derivePhase(currentDay, cycleLength);

  let nextPhaseStart = 1;
  switch (phase) {
    case 'MENSTRUAL':
      nextPhaseStart = 6;
      break;
    case 'FOLLICULAR':
      nextPhaseStart = Math.floor(cycleLength * 0.4) + 1;
      break;
    case 'OVULATION':
      nextPhaseStart = Math.floor(cycleLength * 0.5) + 1;
      break;
    case 'LUTEAL':
    default:
      nextPhaseStart = cycleLength + 1;
      break;
  }

  const daysUntilNextPhase = nextPhaseStart > currentDay ? nextPhaseStart - currentDay : cycleLength - currentDay + 1;

  return {
    currentDay,
    cycleLength,
    phase,
    daysUntilNextPhase,
  };
};
