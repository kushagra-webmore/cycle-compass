import { useState, useMemo } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  differenceInDays,
  isToday,
  parseISO,
  setMonth,
  setYear
} from 'date-fns';
import { ChevronLeft, ChevronRight, Heart, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
// import { CycleContext, Phase } from '@/types/cycle'; 

type Phase = 'MENSTRUAL' | 'FOLLICULAR' | 'FERTILE' | 'OVULATION' | 'LUTEAL';

// Helper to determine phase color
const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'MENSTRUAL': return 'bg-rose-400 text-white hover:bg-rose-500';
    case 'MENSTRUAL': return 'bg-rose-400 text-white hover:bg-rose-500';
    case 'FOLLICULAR': return 'bg-purple-300 text-purple-900 border border-purple-400 dark:bg-purple-700 dark:text-white dark:border-purple-600 hover:bg-purple-400 dark:hover:bg-purple-600';
    case 'FERTILE': return 'bg-green-400 text-white hover:bg-green-500';
    case 'OVULATION': return 'bg-emerald-600 text-white hover:bg-emerald-700';
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
  currentCycleLength?: number;
}

export function CycleCalendar({ currentCycleStart, avgCycleLength, avgPeriodLength, cyclesHistory = [], intercourseDates = [], currentCycleLength }: CycleCalendarProps) {
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
      // If this is the current cycle, prefer the passed currentCycleLength
      let effectiveCycleLength = relevantCycle.cycleLength || avgCycleLength;
      
      if (isSameDay(cycleStart, currentCycleStart) && currentCycleLength) {
          effectiveCycleLength = currentCycleLength;
      }
      
      // If no end date recorded, use average period length for menstruation projection
      if (!relevantCycle.endDate && dayInCycle <= avgPeriodLength) {
        return 'MENSTRUAL';
      }

      // Calculate phases relative to this cycle's start
      const ovulationDay = effectiveCycleLength - 14;
      const fertileStart = ovulationDay - 3;
      const fertileEnd = ovulationDay + 3;
      
      // If we are within the expected length of this cycle
      if (dayInCycle <= effectiveCycleLength) {
          if (dayInCycle < fertileStart) return 'FOLLICULAR';
          if (dayInCycle === ovulationDay) return 'OVULATION';
          if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd) return 'FERTILE';
          return 'LUTEAL';
      }
      
      // If we are PAST the expected length, project future cycles
      const projectedDayInCycle = ((dayInCycle - effectiveCycleLength - 1) % avgCycleLength) + 1;
      
      if (projectedDayInCycle <= avgPeriodLength) return 'MENSTRUAL';
      
      const pOvulationDay = avgCycleLength - 14;
      const pFertileStart = pOvulationDay - 3;
      const pFertileEnd = pOvulationDay + 3;
      
      if (projectedDayInCycle < pFertileStart) return 'FOLLICULAR';
      if (projectedDayInCycle === pOvulationDay) return 'OVULATION';
      if (projectedDayInCycle >= pFertileStart && projectedDayInCycle <= pFertileEnd) return 'FERTILE';
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
        const fertileStart = ovulationDay - 3;
        const fertileEnd = ovulationDay + 3;

        if (dayInMockCycle < fertileStart) return 'FOLLICULAR';
        if (dayInMockCycle === ovulationDay) return 'OVULATION';
        if (dayInMockCycle >= fertileStart && dayInMockCycle <= fertileEnd) return 'FERTILE';
        if (dayInMockCycle > fertileEnd) return 'LUTEAL';
    }
    
    return null;
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 xs:mb-4 px-1 xs:px-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="font-display font-bold text-base xs:text-lg sm:text-xl text-foreground hover:bg-muted/50 px-1.5 xs:px-2 h-auto">
                  {format(currentMonth, 'MMMM yyyy')}
                  <CalendarIcon className="ml-1.5 xs:ml-2 h-3.5 w-3.5 xs:h-4 xs:w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-card p-4">
                 <div className="flex gap-2">
                    <Select 
                      value={currentMonth.getMonth().toString()} 
                      onValueChange={(val) => setCurrentMonth(prev => setMonth(prev, parseInt(val)))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Month" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {format(new Date(2000, i, 1), 'MMMM')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={currentMonth.getFullYear().toString()} 
                      onValueChange={(val) => setCurrentMonth(prev => setYear(prev, parseInt(val)))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Year" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }).map((_, i) => {
                           const y = new Date().getFullYear() - 5 + i;
                           return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                        })}
                      </SelectContent>
                    </Select>
                 </div>
              </PopoverContent>
            </Popover>

            <div className="flex gap-0.5 xs:gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7 xs:h-8 xs:w-8" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
                    <ChevronLeft className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 xs:h-8 xs:w-8" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
                    <ChevronRight className="h-3.5 w-3.5 xs:h-4 xs:w-4" />
                </Button>
            </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 xs:gap-3 mb-4 xs:mb-6 px-1 xs:px-2 text-[10px] xs:text-xs text-muted-foreground">
            <div className="flex items-center gap-1 xs:gap-1.5">
                <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-rose-500"></span> Period
            </div>
            <div className="flex items-center gap-1 xs:gap-1.5">
                <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-purple-400"></span> Follicular
            </div>
            <div className="flex items-center gap-1 xs:gap-1.5">
                <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-green-400"></span> Fertile
            </div>
            <div className="flex items-center gap-1 xs:gap-1.5">
                <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-emerald-600"></span> Ovulation
            </div>
            <div className="flex items-center gap-1 xs:gap-1.5">
                <span className="w-1.5 h-1.5 xs:w-2 xs:h-2 rounded-full bg-blue-300"></span> Luteal
            </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-0.5 xs:gap-1 text-center">
            {weekDays.map(d => (
                <div key={d} className="text-[10px] xs:text-xs font-medium text-muted-foreground py-1 xs:py-2">
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
                    <div key={date.toString()} className="h-11 xs:h-12 sm:h-16 w-full flex items-center justify-center relative">
                        <div 
                            className={cn(
                                "h-9 w-9 xs:h-10 xs:w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center text-sm xs:text-base sm:text-lg font-medium transition-colors cursor-default relative",
                                isCurrent && !phase && "bg-foreground text-background",
                                phase ? getPhaseColor(phase) : "text-foreground hover:bg-muted",
                                isCurrent && phase && "ring-1 xs:ring-2 ring-foreground ring-offset-1 xs:ring-offset-2 ring-offset-background" 
                            )}
                        >
                            {date.getDate()}
                            {/* Intercourse Indicator */}
                            {intercourseDates.some(bgDate => isSameDay(parseISO(bgDate), date)) && (
                                <Heart className="w-1.5 h-1.5 xs:w-2 xs:h-2 text-rose-500 fill-rose-500 absolute bottom-0.5 xs:bottom-1 left-1/2 -translate-x-1/2" />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    </Card>
  );
}
