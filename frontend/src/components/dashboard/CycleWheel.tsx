import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateCycle } from '@/hooks/api/cycles';
import { useToast } from '@/hooks/use-toast';

interface CycleWheelProps {
  currentDay: number;
  cycleLength: number;
  phase: 'MENSTRUAL' | 'FOLLICULAR' | 'FERTILE' | 'OVULATION' | 'LUTEAL';
  ovulationDay?: number;
  fertileWindow?: { start: number; end: number };
}

const phaseColors = {
  MENSTRUAL: 'text-red-500 dark:text-red-400 stroke-red-500', 
  FOLLICULAR: 'text-blue-600 dark:text-blue-400 stroke-blue-600', 
  FERTILE: 'text-green-500 dark:text-green-400 stroke-green-500', 
  OVULATION: 'text-emerald-600 dark:text-emerald-400 stroke-emerald-600', 
  LUTEAL: 'text-blue-400 dark:text-blue-300 stroke-blue-400', 
};

const phaseLabels = {
  MENSTRUAL: 'Menstrual',
  FOLLICULAR: 'Follicular',
  FERTILE: 'Fertile Window',
  OVULATION: 'Ovulation',
  LUTEAL: 'Luteal',
};

// Start days (approximate for visualization if exact windows aren't passed, but better to use passed props)
const getSegments = (length: number, ovDay: number, fertile: { start: number; end: number }) => {
  const circumference = 2 * Math.PI * 80;
  
  const toDash = (days: number) => (days / length) * circumference;
  
  // Note: SVG circles draw from 3 o'clock clockwise by default, rotated -90 makes it 12 o'clock.
  // Dasharray: [length of arc, length of gap]
  
  // Menstrual (Day 1-5)
  const mensDays = 5;
  const mensDash = `${toDash(mensDays)} ${circumference - toDash(mensDays)}`;
  
  // Follicular (Day 6 to FertileStart)
  const follDays = Math.max(0, fertile.start - 1 - 5);
  const follOffset = circumference - toDash(5); // Start after menstrual
  const follDash = `${toDash(follDays)} ${circumference - toDash(follDays)}`;

  // Fertile + Ovulation
  // We can draw the whole fertile window in Light Green, and Ovulation day in Dark Green?
  const fertileDays = fertile.end - fertile.start + 1;
  const fertileOffset = circumference - toDash(fertile.start - 1);
  const fertileDash = `${toDash(fertileDays)} ${circumference - toDash(fertileDays)}`;
  
  // Ovulation Day (Single day)
  const ovDays = 1;
  const ovOffset = circumference - toDash(ovDay - 1);
  const ovDash = `${toDash(ovDays)} ${circumference - toDash(ovDays)}`;
  
  // Luteal (FertileEnd+1 to Length)
  const lutDays = length - fertile.end;
  const lutOffset = circumference - toDash(fertile.end);
  const lutDash = `${toDash(lutDays)} ${circumference - toDash(lutDays)}`;

  return { 
    mens: { dash: mensDash, off: 0 },
    foll: { dash: follDash, off: follOffset },
    fert: { dash: fertileDash, off: fertileOffset },
    ov: { dash: ovDash, off: ovOffset },
    lut: { dash: lutDash, off: lutOffset } 
  };
};

export const CycleWheel = ({ currentDay, cycleLength, phase, ovulationDay, fertileWindow }: CycleWheelProps) => {
  const [hoverInfo, setHoverInfo] = useState<{ name: string; range: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const createCycle = useCreateCycle();
  const { toast } = useToast();

  const handleStartNewCycle = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      await createCycle.mutateAsync({
        startDate: today,
        endDate: undefined,
      });
      
      setIsDialogOpen(false);
      toast({
        title: "New cycle started",
        description: "Your new cycle has been logged successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start new cycle. Please try again.",
        variant: "destructive",
      });
    }
  };

  const radius = 80;
  const strokeWidth = 12; // Increased for easier hovering
  
  // Default values if not provided (fallback)
  const ovDay = ovulationDay ?? (cycleLength - 14);
  const fertile = fertileWindow ?? { start: ovDay - 3, end: ovDay + 3 };
  
  const segments = getSegments(cycleLength, ovDay, fertile);

  // Calculate day ranges for each phase
  const phaseRanges = {
    menstrual: { start: 1, end: 5 },
    follicular: { start: 6, end: fertile.start - 1 },
    fertile: { start: fertile.start, end: fertile.end },
    ovulation: { start: ovDay, end: ovDay },
    luteal: { start: fertile.end + 1, end: cycleLength }
  };

  // Helper for legend dots
  const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center w-[180px] h-[180px] xs:w-[200px] xs:h-[200px]">
        <svg
          className="transform -rotate-90 w-full h-full"
          viewBox="0 0 200 200"
        >
          {/* Background track */}
          <circle cx="100" cy="100" r={radius} fill="none" className="stroke-muted" strokeWidth={strokeWidth} />
          
          {/* Segments - with hover handlers */}
          
          {/* Menstrual */}
          <circle cx="100" cy="100" r={radius} fill="none" className="stroke-red-500 transition-all hover:stroke-width-[16] cursor-pointer" strokeWidth={strokeWidth}
            strokeDasharray={segments.mens.dash} strokeDashoffset={0} 
            onMouseEnter={() => setHoverInfo({ name: 'Menstrual', range: `Day ${phaseRanges.menstrual.start}-${phaseRanges.menstrual.end}` })}
            onMouseLeave={() => setHoverInfo(null)}
          />
            
          {/* Follicular */}
          <circle cx="100" cy="100" r={radius} fill="none" className="stroke-blue-600 transition-all hover:stroke-width-[16] cursor-pointer" strokeWidth={strokeWidth}
            strokeDasharray={segments.foll.dash} strokeDashoffset={segments.foll.off} 
            onMouseEnter={() => setHoverInfo({ name: 'Follicular', range: `Day ${phaseRanges.follicular.start}-${phaseRanges.follicular.end}` })}
            onMouseLeave={() => setHoverInfo(null)}
          />
  
          {/* Fertile */}
          <circle cx="100" cy="100" r={radius} fill="none" className="stroke-green-500 transition-all hover:stroke-width-[16] cursor-pointer" strokeWidth={strokeWidth}
            strokeDasharray={segments.fert.dash} strokeDashoffset={segments.fert.off}
            onMouseEnter={() => setHoverInfo({ name: 'Fertile Window', range: `Day ${phaseRanges.fertile.start}-${phaseRanges.fertile.end}` })}
            onMouseLeave={() => setHoverInfo(null)} 
          />
            
          {/* Ovulation */}
          <circle cx="100" cy="100" r={radius} fill="none" className="stroke-emerald-600 transition-all hover:stroke-width-[16] cursor-pointer" strokeWidth={strokeWidth}
            strokeDasharray={segments.ov.dash} strokeDashoffset={segments.ov.off}
            onMouseEnter={() => setHoverInfo({ name: 'Ovulation', range: `Day ${phaseRanges.ovulation.start}` })}
            onMouseLeave={() => setHoverInfo(null)}
          />
            
          {/* Luteal */}
          <circle cx="100" cy="100" r={radius} fill="none" className="stroke-blue-400 transition-all hover:stroke-width-[16] cursor-pointer" strokeWidth={strokeWidth}
            strokeDasharray={segments.lut.dash} strokeDashoffset={segments.lut.off}
            onMouseEnter={() => setHoverInfo({ name: 'Luteal', range: `Day ${phaseRanges.luteal.start}-${phaseRanges.luteal.end}` })}
            onMouseLeave={() => setHoverInfo(null)}
          />
          
          {/* Current day marker */}
          <circle
            cx="100"
            cy={100 - radius}
            r="6"
            fill="currentColor"
            className="text-foreground animate-pulse-gentle shadow-lg pointer-events-none"
            style={{
              transformOrigin: '100px 100px',
              transform: `rotate(${((currentDay - 1) / cycleLength) * 360 + 90}deg)`,
            }}
          />
        </svg>
  
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          {hoverInfo ? (
            <div className="animate-fade-in">
              <span className="text-base xs:text-lg font-bold text-foreground block">
                {hoverInfo.name}
              </span>
              <span className="text-xs xs:text-sm text-muted-foreground mt-1 block">
                {hoverInfo.range}
              </span>
            </div>
          ) : (
            <>
              <span className="text-3xl xs:text-4xl font-display font-bold text-foreground">
                Day {currentDay}
              </span>
              <span className="text-[10px] xs:text-xs text-muted-foreground mt-0.5 xs:mt-1">
                of {cycleLength}
              </span>
              <span className={cn(
                "text-[9px] xs:text-[10px] font-semibold mt-1.5 xs:mt-2 px-1.5 xs:px-2 py-0.5 rounded-full bg-muted",
                phaseColors[phase].split(' ')[0] + ' ' + phaseColors[phase].split(' ')[1] // Gets text-color dark:text-color
              )}>
                {phaseLabels[phase]}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 xs:mt-4 flex flex-wrap justify-center gap-2 xs:gap-3 px-2">
        <LegendItem color="bg-red-500" label="Period" />
        <LegendItem color="bg-blue-600" label="Follicular" />
        <LegendItem color="bg-green-500" label="Fertile" />
        <LegendItem color="bg-emerald-600" label="Ovulation" />
        <LegendItem color="bg-blue-400" label="Luteal" />
      </div>

      {/* Start New Cycle Button - Below Legend */}
      <Button
        variant="outline"
        size="sm"
        className="mt-3 xs:mt-4 h-8 xs:h-9 px-3 xs:px-4 text-xs gap-1.5 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
        onClick={() => setIsDialogOpen(true)}
      >
        <Plus className="h-3.5 w-3.5" />
        <span>Start New Cycle</span>
      </Button>

      {/* Start New Cycle Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start New Cycle?</DialogTitle>
            <DialogDescription>
              This will mark today as the start of a new menstrual cycle. Your previous cycle will be automatically ended.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleStartNewCycle}
              disabled={createCycle.isPending}
            >
              {createCycle.isPending ? 'Starting...' : 'Start New Cycle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
