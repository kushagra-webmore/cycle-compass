
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface LiquidContainerProps {
  children: ReactNode;
  className?: string;
  intensity?: 'low' | 'medium' | 'high';
}

export const LiquidContainer = ({ 
  children, 
  className,
  intensity = 'medium' 
}: LiquidContainerProps) => {
  const intensityMap = {
    low: { y: -5, duration: 4 },
    medium: { y: -10, duration: 3 },
    high: { y: -15, duration: 2 }
  };

  const { y, duration } = intensityMap[intensity];

  return (
    <motion.div
      className={cn("relative z-10", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        animate={{ y: [0, y, 0] }}
        transition={{
          repeat: Infinity,
          duration: duration * 2,
          ease: "easeInOut"
        }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
