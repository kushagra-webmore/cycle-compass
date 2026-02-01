import { useMemo, useRef, useEffect } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useMediaQuery } from "@/hooks/use-media-query";

interface HistoryChartProps {
  data: {
    startDate: string;
    cycleLength: number;
    periodLength: number;
  }[];
  title?: string;
  subtitle?: string;
  averageCycleLength?: number;
}

export function HistoryChart({ data, title = "My Cycle", subtitle = "History & Trends", averageCycleLength = 28 }: HistoryChartProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // Transform data for the chart
  const allChartData = useMemo(() => 
    data
      .slice(0, 24) // Limit to last 24 cycles max
      .reverse() // Show chronological order left to right
      .map(cycle => ({
        date: format(new Date(cycle.startDate), 'MMM'),
        fullDate: format(new Date(cycle.startDate), 'MMMM d, yyyy'),
        period: cycle.periodLength,
        cycleRemainder: cycle.cycleLength - cycle.periodLength,
        totalLength: cycle.cycleLength,
      })),
    [data]
  );

  // Scroll to end on mount or when data changes
  useEffect(() => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({
        left: scrollWidth - clientWidth,
        behavior: 'smooth'
      });
    }
  }, [allChartData]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover p-3 border border-border rounded-xl shadow-lg text-sm z-50">
          <p className="font-semibold text-popover-foreground mb-1">{data.fullDate}</p>
          <p className="text-muted-foreground font-medium">
            {data.totalLength} days cycle
          </p>
          <p className="text-rose-500 text-xs mt-0.5">
            {data.period} days period
          </p>
        </div>
      );
    }
    return null;
  };

  if (allChartData.length === 0) {
    return null;
  }

  // Calculate dynamic width based on number of items
  // Minimum width or a fixed width per item
  const minWidthPerItem = 60; // px
  const dynamicWidth = Math.max(allChartData.length * minWidthPerItem, 300); // 300px min or calculated

  return (
    <div className="w-full max-w-full">
      <div className="flex items-center justify-between mb-4 px-2">
        <div>
          <h3 className="text-xl font-display font-bold text-foreground">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="w-full overflow-x-auto pb-2 scrollbar-hide"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        <div style={{ width: allChartData.length > 5 ? `${dynamicWidth}px` : '100%', minWidth: '100%', height: '250px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={allChartData} barSize={32} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                  dy={10}
                  interval={0} // Force show all ticks
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis 
                  hide 
                  domain={[0, 45]} // Fix max to a reasonable cycle length + padding
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
                <ReferenceLine 
                  y={averageCycleLength} 
                  stroke="#94a3b8" 
                  strokeDasharray="3 3" 
                  strokeOpacity={0.5} 
                  label={{ 
                    value: `Avg: ${averageCycleLength}`, 
                    position: 'insideRight', 
                    fill: '#94a3b8', 
                    fontSize: 10, 
                    offset: 10,
                    // Add background-like effect for readability if overlapping
                    style: { textShadow: '0px 0px 4px white' }
                  }} 
                />
                
                {/* Stacked Bars */}
                <Bar dataKey="period" stackId="a" fill="#f43f5e" radius={[0, 0, 4, 4]} />
                <Bar dataKey="cycleRemainder" stackId="a" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Navigation Controls */}
      {allChartData.length > 5 && (
        <div className="flex justify-center items-center gap-4 mt-1">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={scrollLeft}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={scrollRight}
            className="h-8 w-8 rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
