
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner = ({ className, size = 'md' }: LoadingSpinnerProps) => {
  const sizeMap = {
    sm: 'w-6 h-6',
    md: 'w-12 h-12',
    lg: 'w-24 h-24'
  };

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <motion.div
        className={cn(
          "bg-primary/20 backdrop-blur-md border border-primary/30",
          sizeMap[size]
        )}
        animate={{
          scale: [1, 1.1, 1],
          borderRadius: [
            "60% 40% 30% 70% / 60% 30% 70% 40%",
            "30% 60% 70% 40% / 50% 60% 30% 60%",
            "60% 40% 30% 70% / 60% 30% 70% 40%"
          ],
          rotate: [0, 360]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <motion.div 
           className="w-full h-full rounded-full bg-primary/40 flex items-center justify-center"
           animate={{
            scale: [0.8, 0.4, 0.8],
            opacity: [0.5, 1, 0.5]
           }}
           transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
           }}
        />
      </motion.div>
    </div>
  );
};
