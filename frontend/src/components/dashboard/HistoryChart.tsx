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
        <div className="bg-white p-3 border border-slate-100 rounded-xl shadow-lg text-sm">
          <p className="font-semibold text-slate-800 mb-1">{data.fullDate}</p>
          <p className="text-slate-600 font-medium">
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
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-display font-bold text-slate-800">My Cycle</CardTitle>
            <CardDescription>History & Trends</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 12 }} 
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
      </CardContent>
    </Card>
  );
}
