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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils'; // Ensure utils are imported
// import { CycleContext, Phase } from '@/types/cycle'; 

type Phase = 'MENSTRUAL' | 'FOLLICULAR' | 'FERTILE' | 'OVULATION' | 'LUTEAL';

// Helper to determine phase color
const getPhaseColor = (phase: string) => {
  switch (phase) {
    case 'MENSTRUAL': return 'bg-rose-400 text-white hover:bg-rose-500';
    case 'FOLLICULAR': return 'bg-purple-200 text-purple-900 hover:bg-purple-300';
    case 'FERTILE': 
    case 'OVULATION': return 'bg-emerald-400 text-white hover:bg-emerald-500';
    case 'LUTEAL': return 'bg-blue-100 text-blue-900 hover:bg-blue-200';
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
}

export function CycleCalendar({ currentCycleStart, avgCycleLength, avgPeriodLength, cyclesHistory = [] }: CycleCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const getDayPhase = (date: Date): string | null => {
    // 1. Check Historical Data First
    // Sort cycles by date descending to find the most relevant one
    // We need to see if 'date' falls into any known cycle
    
    // Find a cycle where: cycle.startDate <= date < nextCycle.startDate (or today/future if last)
    // To do this reliably, let's just reverse sort history
    const sortedCycles = [...cyclesHistory].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    const relevantCycle = sortedCycles.find(c => {
         // Fix timezone issue: Treat YYYY-MM-DD string as local midnight
         // We can do this by splitting the string explicitly
         const [y, m, d] = c.startDate.split('-').map(Number);
         // Note: Month is 0-indexed in JS Date
         const start = new Date(y, m - 1, d);
         
         // Normalize 'date' to strictly midnight local for comparison just in case
         const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
         
         return current.getTime() >= start.getTime();
    });

    if (relevantCycle) {
        // Re-construct start date properly
        const [y, m, d] = relevantCycle.startDate.split('-').map(Number);
        const cycleStart = new Date(y, m - 1, d);
        
        const diff = differenceInDays(date, cycleStart);
        const dayInCycle = diff + 1; // 1-based

        // Check against ACTUAL period data if available
        if (relevantCycle.endDate) {
            const [ey, em, ed] = relevantCycle.endDate.split('-').map(Number);
            const cycleEnd = new Date(ey, em - 1, ed);
            
            // Ensure comparison is day-based
            const current = new Date(date.getFullYear(), date.getMonth(), date.getDate());
            
            if (current.getTime() <= cycleEnd.getTime()) {
                return 'MENSTRUAL';
            }
        } else {
            // No end date (e.g., current cycle or just missing), use avgPeriodLength for projection relative to this cycle start
            if (dayInCycle <= avgPeriodLength) return 'MENSTRUAL';
        }

        // Now calculate other phases relative to THIS cycle's start
        // We use the AVERAGE cycle length or THIS cycle's length to project phases?
        // If it's a past cycle, use its actual length if known, otherwise avg.
        // Actually, phases are biologically relative to ovulation which is relative to NEXT period.
        // But for visualization, we usually project from start.
        
        const effectiveCycleLength = relevantCycle.cycleLength || avgCycleLength;
        const ovulationDay = effectiveCycleLength - 14;
        const fertileStart = ovulationDay - 5;
        const fertileEnd = ovulationDay;

        // If 'relevantCycle' has an endDate known (meaning period finished), we know Menstrual logic above handled it.
        // If date > endDate, it is Follicular/Fertile/Luteal
        
        // We need to ensure we don't bleed into the *next* cycle if it exists.
        // In our search logic `sortedCycles.find`, we picked the *latest* cycle starting before-or-on date.
        // So we are safe from overlapping the next newer cycle.
        
        if (dayInCycle < fertileStart) return 'FOLLICULAR';
        if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd + 1) return 'FERTILE';
        if (dayInCycle > fertileEnd + 1) return 'LUTEAL';
        
        return null; // Fallback
    }

    // 2. Fallback for Future Projections (No history found) regarding the Current Cycle Start
    // If date is > currentCycleStart and no history found strictly (maybe cyclesHistory is empty?), use prop
    const diff = differenceInDays(date, currentCycleStart);
    if (diff < 0) return null; // Date is before known cycles
    
    const cycleIndex = Math.floor(diff / avgCycleLength);
    const dayInCycle = diff - (cycleIndex * avgCycleLength) + 1; 

    if (dayInCycle <= avgPeriodLength) return 'MENSTRUAL';
    
    const ovulationDay = avgCycleLength - 14;
    const fertileStart = ovulationDay - 5;
    const fertileEnd = ovulationDay;

    if (dayInCycle < fertileStart) return 'FOLLICULAR';
    if (dayInCycle >= fertileStart && dayInCycle <= fertileEnd + 1) return 'FERTILE';
    if (dayInCycle > fertileEnd + 1) return 'LUTEAL';

    return null;
  };

  return (
    <Card className="border-none shadow-none bg-transparent">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="font-display font-bold text-xl text-slate-800">
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
                <div key={d} className="text-xs font-medium text-slate-400 py-2">
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
                    <div key={date.toString()} className="h-10 w-full flex items-center justify-center relative">
                        <div 
                            className={cn(
                                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors cursor-default",
                                isCurrent && !phase && "bg-slate-900 text-white",
                                phase ? getPhaseColor(phase) : "text-slate-700 hover:bg-slate-100",
                                isCurrent && phase && "ring-2 ring-slate-900 ring-offset-2" 
                            )}
                        >
                            {date.getDate()}
                        </div>
                    </div>
                );
            })}
        </div>
    </Card>
  );
}
