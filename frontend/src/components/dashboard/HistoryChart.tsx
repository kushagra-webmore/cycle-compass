import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { format } from "date-fns";

interface HistoryChartProps {
  data: {
    startDate: string;
    cycleLength: number;
    periodLength: number;
  }[];
}

export function HistoryChart({ data }: HistoryChartProps) {
  // Transform data for the chart
  // We want to show the last 6-12 cycles
  const chartData = data
    .slice(0, 12)
    .reverse() // Show chronological order left to right
    .map(cycle => ({
      date: format(new Date(cycle.startDate), 'MMM'), // Jun, Jul
      fullDate: format(new Date(cycle.startDate), 'MMMM d, yyyy'),
      period: cycle.periodLength,
      cycleRemainder: cycle.cycleLength - cycle.periodLength,
      totalLength: cycle.cycleLength,
    }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover p-3 border border-border rounded-xl shadow-lg text-sm">
          <p className="font-semibold text-popover-foreground mb-1">{data.fullDate}</p>
          <p className="text-muted-foreground font-medium">
            {data.totalLength} days cycle
          </p>
          <p className="text-rose-500 text-xs mt-0.5">
            {data.period} days Period
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
          <h3 className="text-xl font-display font-bold text-foreground">My Cycle</h3>
          <p className="text-sm text-muted-foreground">History & Trends</p>
        </div>
      </div>
      <div className="h-[250px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barSize={32} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                dy={10}
              />
              <YAxis 
                hide 
                domain={[0, 45]} // Fix max to a reasonable cycle length + padding
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
              <ReferenceLine y={28} stroke="#94a3b8" strokeDasharray="3 3" strokeOpacity={0.5} label={{ value: 'Avg', position: 'right', fill: '#94a3b8', fontSize: 10 }} />
              
              {/* Stacked Bars */}
              <Bar dataKey="period" stackId="a" fill="#f43f5e" radius={[0, 0, 4, 4]} />
              <Bar dataKey="cycleRemainder" stackId="a" fill="#bfdbfe" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
