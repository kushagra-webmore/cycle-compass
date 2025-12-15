import { cn } from '@/lib/utils';

interface CycleWheelProps {
  currentDay: number;
  cycleLength: number;
  phase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';
}

const phaseColors = {
  menstrual: 'phase-menstrual',
  follicular: 'phase-follicular',
  ovulatory: 'phase-ovulatory',
  luteal: 'phase-luteal',
};

const phaseLabels = {
  menstrual: 'Menstrual',
  follicular: 'Follicular',
  ovulatory: 'Ovulatory',
  luteal: 'Luteal',
};

export const CycleWheel = ({ currentDay, cycleLength, phase }: CycleWheelProps) => {
  const progress = (currentDay / cycleLength) * 100;
  const strokeWidth = 12;
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        className="transform -rotate-90"
        width="200"
        height="200"
        viewBox="0 0 200 200"
      >
        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted"
        />
        
        {/* Phase segments */}
        <circle
          cx="100"
          cy="100"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn("transition-all duration-1000 ease-out", `text-${phaseColors[phase]}`)}
        />
        
        {/* Current day marker */}
        <circle
          cx="100"
          cy={100 - radius}
          r="6"
          fill="currentColor"
          className="text-primary animate-pulse-gentle"
          style={{
            transformOrigin: '100px 100px',
            transform: `rotate(${(currentDay / cycleLength) * 360}deg)`,
          }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-4xl font-display font-bold text-foreground">
          Day {currentDay}
        </span>
        <span className="text-sm text-muted-foreground mt-1">
          of {cycleLength}
        </span>
        <span className={cn(
          "text-xs font-semibold mt-2 px-3 py-1 rounded-full",
          phase === 'menstrual' && "bg-phase-menstrual/20 text-phase-menstrual",
          phase === 'follicular' && "bg-phase-follicular/20 text-phase-follicular",
          phase === 'ovulatory' && "bg-phase-ovulatory/20 text-phase-ovulatory",
          phase === 'luteal' && "bg-phase-luteal/20 text-phase-luteal"
        )}>
          {phaseLabels[phase]} Phase
        </span>
      </div>
    </div>
  );
};
