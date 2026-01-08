import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CycleWheelProps {
  currentDay: number;
  cycleLength: number;
  phase: 'MENSTRUAL' | 'FOLLICULAR' | 'FERTILE' | 'OVULATION' | 'LUTEAL';
  ovulationDay?: number;
  fertileWindow?: { start: number; end: number };
}

const phaseColors = {
  MENSTRUAL: 'text-[#ef4444] stroke-[#ef4444]', // Red
  FOLLICULAR: 'text-[#1e3a8a] stroke-[#1e3a8a]', // Dark Blue
  FERTILE: 'text-[#86efac] stroke-[#86efac]', // Light Green
  OVULATION: 'text-[#166534] stroke-[#166534]', // Dark Green
  LUTEAL: 'text-[#93c5fd] stroke-[#93c5fd]', // Light Blue
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
  const [hoverInfo, setHoverInfo] = useState<string | null>(null);

  const radius = 80;
  const strokeWidth = 12; // Increased for easier hovering
  
  // Default values if not provided (fallback)
  const ovDay = ovulationDay ?? (cycleLength - 14);
  const fertile = fertileWindow ?? { start: ovDay - 5, end: ovDay + 1 };
  
  const segments = getSegments(cycleLength, ovDay, fertile);

  // Helper for legend dots
  const LegendItem = ({ color, label }: { color: string, label: string }) => (
    <div className="flex items-center gap-1.5">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      <span className="text-[10px] text-muted-foreground font-medium">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center">
        <svg
          className="transform -rotate-90"
          width="200"
          height="200"
          viewBox="0 0 200 200"
        >
          {/* Background track */}
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
          
          {/* Segments - with hover handlers */}
          
          {/* Menstrual */}
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#ef4444" strokeWidth={strokeWidth}
            strokeDasharray={segments.mens.dash} strokeDashoffset={0} 
            className="transition-all hover:stroke-width-[16] cursor-pointer"
            onMouseEnter={() => setHoverInfo('Menstrual')}
            onMouseLeave={() => setHoverInfo(null)}
          />
            
          {/* Follicular */}
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#1e3a8a" strokeWidth={strokeWidth}
            strokeDasharray={segments.foll.dash} strokeDashoffset={segments.foll.off} 
            className="transition-all hover:stroke-width-[16] cursor-pointer"
            onMouseEnter={() => setHoverInfo('Follicular')}
            onMouseLeave={() => setHoverInfo(null)}
          />
  
          {/* Fertile */}
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#86efac" strokeWidth={strokeWidth}
            strokeDasharray={segments.fert.dash} strokeDashoffset={segments.fert.off}
            className="transition-all hover:stroke-width-[16] cursor-pointer"
            onMouseEnter={() => setHoverInfo('Fertile Window')}
            onMouseLeave={() => setHoverInfo(null)} 
          />
            
          {/* Ovulation */}
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#166534" strokeWidth={strokeWidth}
            strokeDasharray={segments.ov.dash} strokeDashoffset={segments.ov.off}
            className="transition-all hover:stroke-width-[16] cursor-pointer"
            onMouseEnter={() => setHoverInfo('Ovulation')}
            onMouseLeave={() => setHoverInfo(null)}
          />
            
          {/* Luteal */}
          <circle cx="100" cy="100" r={radius} fill="none" stroke="#93c5fd" strokeWidth={strokeWidth}
            strokeDasharray={segments.lut.dash} strokeDashoffset={segments.lut.off}
            className="transition-all hover:stroke-width-[16] cursor-pointer"
            onMouseEnter={() => setHoverInfo('Luteal')}
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
              transform: `rotate(${(currentDay / cycleLength) * 360}deg)`,
            }}
          />
        </svg>
  
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          {hoverInfo ? (
            <span className="text-lg font-bold text-foreground animate-fade-in">
              {hoverInfo}
            </span>
          ) : (
            <>
              <span className="text-4xl font-display font-bold text-foreground">
                Day {currentDay}
              </span>
              <span className="text-xs text-muted-foreground mt-1">
                of {cycleLength}
              </span>
              <span className={cn(
                "text-[10px] font-semibold mt-2 px-2 py-0.5 rounded-full bg-slate-100",
                phaseColors[phase].split(' ')[0]
              )}>
                {phaseLabels[phase]}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-3 px-2">
        <LegendItem color="bg-[#ef4444]" label="Period" />
        <LegendItem color="bg-[#1e3a8a]" label="Follicular" />
        <LegendItem color="bg-[#86efac]" label="Fertile" />
        <LegendItem color="bg-[#166534]" label="Ovulation" />
        <LegendItem color="bg-[#93c5fd]" label="Luteal" />
      </div>
    </div>
  );
};
