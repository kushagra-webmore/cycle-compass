import { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addDays,
  differenceInDays,
  isToday,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Ensure utils are imported
// import { CycleContext, Phase } from '@/types/cycle'; 

type Phase = 'MENSTRUAL' | 'FOLLICULAR' | 'FERTILE' | 'OVULATION' | 'LUTEAL';

// Helper to determine phase color
const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'MENSTRUAL': return 'bg-rose-400 text-white hover:bg-rose-500';
    case 'FOLLICULAR': return 'bg-purple-200 text-purple-900 border border-purple-300 dark:bg-purple-900/40 dark:text-purple-100 dark:border-purple-700 hover:bg-purple-300 dark:hover:bg-purple-800/60';
    case 'FERTILE': 
    case 'OVULATION': return 'bg-emerald-400 text-white hover:bg-emerald-500';
    case 'LUTEAL': return 'bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-100 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800/60';
    default: return 'hover:bg-accent hover:text-accent-foreground';
  }
};

interface CycleCalendarProps {
  currentCycleStart: Date;
  avgCycleLength: number;
  avgPeriodLength: number;
  cyclesHistory?: {
      startDate: string;
      endDate?: string | null;
      cycleLength: number;
  }[];
  intercourseDates?: string[];
}

export function CycleCalendar({ currentCycleStart, avgCycleLength, avgPeriodLength, cyclesHistory = [], intercourseDates = [] }: CycleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Optimize history sorting
  const sortedCycles = useMemo(() => {
    return [...cyclesHistory].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [cyclesHistory]);

  const getDayPhase = (date: Date): string | null => {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const checkTime = checkDate.getTime();

    // 1. Check Historical Data
    const relevantCycle = sortedCycles.find(c => {
      const [y, m, d] = c.startDate.split('-').map(Number);
      const start = new Date(y, m - 1, d);
      return checkTime >= start.getTime();
    });

    if (relevantCycle) {
      const [y, m, d] = relevantCycle.startDate.split('-').map(Number);
      const cycleStart = new Date(y, m - 1, d);
      
      // If we have a concrete end date for this cycle, respect it strictly
      if (relevantCycle.endDate) {
        const [ey, em, ed] = relevantCycle.endDate.split('-').map(Number);
        const cycleEnd = new Date(ey, em - 1, ed);
        
        // If the date is within the actual period flow of this historic cycle
        if (checkTime <= cycleEnd.getTime()) {
           return 'MENSTRUAL';
        }
      }

      const diff = differenceInDays(checkDate, cycleStart);
      const dayInCycle = diff + 1; // 1-based

      // Use recorded cycle length if available, otherwise average
      const effectiveCycleLength = relevantCycle.cycleLength || avgCycleLength;
      
      // If no end date recorded, use average period length for menstruation projection
      if (!relevantCycle.endDate && dayInCycle <= avgPeriodLength) {
        return 'MENSTRUAL';
      }

      // Calculate phases relative to this cycle's start
      const ovulationDay = effectiveCycleLength - 14;
      const fertileStart = ovulationDay - 5;
      const fertileEnd = ovulationDay;
      
      // If we are within the expected length of this cycle
      if (dayInCycle <= effectiveCycleLength) {
          if (dayInCycle < fertileStart) return 'FOLLICULAR';
          if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd + 1) return 'FERTILE';
          return 'LUTEAL';
      }
      
      // If we are PAST the expected length, project future cycles
      const projectedDayInCycle = ((dayInCycle - 1) % avgCycleLength) + 1;
      
      if (projectedDayInCycle <= avgPeriodLength) return 'MENSTRUAL';
      
      const pOvulationDay = avgCycleLength - 14;
      const pFertileStart = pOvulationDay - 5;
      const pFertileEnd = pOvulationDay;
      
      if (projectedDayInCycle < pFertileStart) return 'FOLLICULAR';
      if (projectedDayInCycle >= pFertileStart && projectedDayInCycle <= pFertileEnd + 1) return 'FERTILE';
      return 'LUTEAL';
      
      return null;
    }

    // 2. Future Projections (Beyond History)
    const currentStartNormalized = new Date(currentCycleStart.getFullYear(), currentCycleStart.getMonth(), currentCycleStart.getDate());
    
    if (checkTime >= currentStartNormalized.getTime()) {
        const diff = differenceInDays(checkDate, currentStartNormalized);
        // This date is in the current cycle or future cycles
        // We can treat it as a continuous projection
        
        // simple math: which "virtual cycle" index is this?
        // Index 0 = current cycle
        // Index 1 = next cycle, etc.
        const cycleIndex = Math.floor(diff / avgCycleLength);
        const dayInMockCycle = (diff % avgCycleLength) + 1;
        
        if (dayInMockCycle <= avgPeriodLength) return 'MENSTRUAL';
        
        const ovulationDay = avgCycleLength - 14;
        const fertileStart = ovulationDay - 5;
        const fertileEnd = ovulationDay;

        if (dayInMockCycle < fertileStart) return 'FOLLICULAR';
        if (dayInMockCycle >= fertileStart && dayInMockCycle <= fertileEnd + 1) return 'FERTILE';
        if (dayInMockCycle > fertileEnd + 1) return 'LUTEAL';
    }
    
    return null;
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-display font-bold text-xl text-foreground">
                {format(currentMonth, 'MMMM yyyy')}
            </h3>
            <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6 px-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Period
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span> Follicular
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Fertile
            </div>
            <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-300"></span> Luteal
            </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map(d => (
                <div key={d} className="text-xs font-medium text-muted-foreground py-2">
                    {d}
                </div>
            ))}
            
            {/* Empty start padding */}
            {Array.from({ length: (calendarDays[0].getDay() + 6) % 7 }).map((_, i) => (
                <div key={`empty-${i}`} />
            ))}

            {calendarDays.map((date) => {
                const phase = getDayPhase(date);
                const isCurrent = isToday(date);
                
                return (
                    <div key={date.toString()} className="h-16 w-full flex items-center justify-center relative">
                        <div 
                            className={cn(
                                "h-12 w-12 rounded-full flex items-center justify-center text-lg font-medium transition-colors cursor-default relative",
                                isCurrent && !phase && "bg-foreground text-background",
                                phase ? getPhaseColor(phase) : "text-foreground hover:bg-muted",
                                isCurrent && phase && "ring-2 ring-foreground ring-offset-2 ring-offset-background" 
                            )}
                        >
                            {date.getDate()}
                            {/* Intercourse Indicator */}
                            {intercourseDates.some(bgDate => isSameDay(parseISO(bgDate), date)) && (
                                <Heart className="w-2 h-2 text-rose-500 fill-rose-500 absolute bottom-1 left-1/2 -translate-x-1/2" />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </Card>
  );
}
