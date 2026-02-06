import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

interface WaterBottleProps {
  current: number;
  target: number;
  onAdd: (amount: number) => void;
  className?: string;
}

export function WaterBottle({ current, target, onAdd, className }: WaterBottleProps) {
  const percentage = Math.min(Math.max((current / target) * 100, 0), 100);
  
  // Calculate distinct bubble positions once to avoid re-renders constantly changing them
  const bubbles = useMemo(() => [...Array(8)].map(() => ({
    size: Math.random() * 8 + 3,
    left: Math.random() * 80 + 10,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 2,
  })), []);

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      {/* Bottle Graphic */}
      <div className="relative flex flex-col items-center">
        {/* Cap */}
        <div className="w-12 h-5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-t-sm rounded-b-sm border border-slate-300 dark:border-slate-600 shadow-sm z-20 relative">
             <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-400/20 dark:bg-slate-900/40" />
        </div>
        
        {/* Neck */}
        <div className="w-8 h-3 bg-white/20 dark:bg-slate-800/20 border-x border-slate-300/50 dark:border-slate-600/50 backdrop-blur-sm z-10 relative overflow-hidden" />

        {/* Body */}
        <div className="relative w-32 h-52 rounded-[2rem] border-4 border-slate-200/50 dark:border-slate-700/50 overflow-hidden bg-gradient-to-br from-slate-50/80 to-slate-100/30 dark:from-slate-900/80 dark:to-slate-950/30 shadow-2xl backdrop-blur-md -mt-1 ring-1 ring-white/40 dark:ring-slate-800/40">
            
            {/* Measurement Lines (Graduation) */}
            <div className="absolute right-0 top-[15%] bottom-[15%] w-7 flex flex-col justify-between items-end pr-1 z-0 opacity-40 mix-blend-multiply dark:mix-blend-screen">
                 {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-0.5">
                        <span className="text-[7px] font-mono font-medium">{Math.round(target * (1 - (i+1)/6))}</span>
                        <div className="w-2 h-[1px] bg-slate-800 dark:bg-slate-200" />
                    </div>
                 ))}
            </div>

            {/* Water Liquid (Back Layer - Darker/Slower) */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-blue-600/40 dark:bg-blue-600/30 blur-sm"
              initial={{ height: 0 }}
              animate={{ height: `${percentage - 2}%` }}
              transition={{ type: "spring", bounce: 0.2, duration: 1.5 }}
            />

            {/* Water Liquid (Front Layer) */}
            <motion.div 
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-500 via-blue-400 to-cyan-300 opacity-90"
              initial={{ height: 0 }}
              animate={{ height: `${percentage}%` }}
              transition={{ type: "spring", bounce: 0.1, duration: 1 }}
            >
              {/* Surface Highlight */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-white/40 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
              
              {/* Bubbles */}
              <div className="absolute w-full h-full overflow-hidden pointer-events-none">
                 {bubbles.map((b, i) => (
                    <motion.div
                      key={i}
                      className="absolute bg-white/30 rounded-full"
                      style={{
                        width: b.size,
                        height: b.size,
                        left: `${b.left}%`,
                      }}
                      animate={{
                        y: [200, -20],
                        opacity: [0, 0.8, 0],
                        scale: [0.8, 1.2],
                      }}
                      transition={{
                        duration: b.duration,
                        repeat: Infinity,
                        delay: b.delay,
                        ease: "linear",
                      }}
                    />
                 ))}
              </div>
            </motion.div>

            {/* Glass Reflections / Highlights */}
            {/* Left curved highlight */}
            <div className="absolute top-4 left-3 w-3 h-[90%] bg-gradient-to-b from-white/80 via-white/20 to-transparent pointer-events-none rounded-full blur-[1px]" />
            {/* Right sharp highlight */}
            <div className="absolute top-8 right-3 w-1 h-[80%] bg-gradient-to-b from-white/60 to-transparent pointer-events-none rounded-full blur-[0.5px] opacity-70" />
            
            {/* Bottom Curve Shadow */}
            <div className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none" />

            {/* Text Overlay (Slightly reduced size for elegance) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 font-bold text-slate-800 dark:text-white drop-shadow-md pointer-events-none">
              <span className="text-2xl font-display font-black tracking-tight drop-shadow-sm">{Math.round(percentage)}%</span>
              <span className="text-[9px] opacity-90 font-bold tracking-widest uppercase mt-0.5 bg-white/30 dark:bg-black/30 px-1.5 py-0.5 rounded-full">{current} ml</span>
            </div>
        </div>
      </div>
    </div>
  );
}
