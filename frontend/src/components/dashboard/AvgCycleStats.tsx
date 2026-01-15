import { Card, CardContent } from "@/components/ui/card";

interface AvgCycleStatsProps {
  avgCycleLength: number;
  avgPeriodLength: number;
}

export function AvgCycleStats({ avgCycleLength, avgPeriodLength }: AvgCycleStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      <Card className="flex flex-col items-center justify-center p-4 bg-card shadow-sm border border-rose-100 dark:border-rose-900 border-opacity-50">
        <div className="text-4xl font-display font-bold text-foreground flex items-baseline">
          {avgCurrentPeriod(avgPeriodLength)}
          <span className="text-sm font-normal text-muted-foreground ml-1">Days</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground mt-1">Avg. Period Length</p>
        <div className="flex items-center gap-2 mt-2">
           <div className="w-3 h-3 rounded-full bg-[#ef4444]"></div>
           <span className="text-xs text-muted-foreground">Menstruation</span>
        </div>
      </Card>

      <Card className="flex flex-col items-center justify-center p-4 bg-card shadow-sm border border-blue-100 dark:border-blue-900 border-opacity-50">
        <div className="text-4xl font-display font-bold text-foreground flex items-baseline">
          {avgCurrentCycle(avgCycleLength)}
          <span className="text-sm font-normal text-muted-foreground ml-1">Days</span>
        </div>
        <p className="text-sm font-medium text-muted-foreground mt-1">Avg. Cycle Length</p>
        <div className="flex items-center gap-2 mt-2">
           <div className="w-3 h-3 rounded-full bg-[#93c5fd]"></div>
           <span className="text-xs text-muted-foreground">Total Cycle</span>
        </div>
      </Card>
    </div>
  );
}

// Helper to format or validate numbers
const avgCurrentPeriod = (n: number) => n > 0 ? n : 5;
const avgCurrentCycle = (n: number) => n > 0 ? n : 28;
