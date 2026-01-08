import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { differenceInDays, format } from 'date-fns';

interface CycleHistoryChartProps {
  cycles: any[];
}

export function CycleHistoryChart({ cycles }: CycleHistoryChartProps) {
  // Process cycles to get lengths
  // Cycle Length = Start Date of Cycle N - Start Date of Cycle N+1 (reverse chronological)
  // Actually, Cycle Length for Cycle N is (Start of N+1) - (Start of N)
  // Or if we have endDate, cycle length usually spans until the next period starts.
  // Standard def: Day 1 to Day 1 of next.
  
  const data = useMemo(() => {
    if (!cycles || cycles.length < 2) return [];

    const sorted = [...cycles].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const chartData = [];

    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i+1];
        
        const length = differenceInDays(new Date(next.startDate), new Date(current.startDate));
        
        // Filter outliers
        if (length > 15 && length < 100) {
            chartData.push({
                date: format(new Date(current.startDate), 'MMM d'),
                length: length,
                fullDate: format(new Date(current.startDate), 'MMM d, yyyy')
            });
        }
    }
    return chartData;
  }, [cycles]);

  if (data.length === 0) return null;
  
  const avgLength = Math.round(data.reduce((acc, curr) => acc + curr.length, 0) / data.length);

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Cycle Length History</CardTitle>
        <CardDescription>
          Tracking consistency over time (Avg: {avgLength} days)
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
         <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
               <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
               <XAxis 
                 dataKey="date" 
                 fontSize={12} 
                 tickLine={false} 
                 axisLine={false} 
                 tickMargin={10}
               />
               <YAxis 
                 fontSize={12} 
                 tickLine={false} 
                 axisLine={false} 
                 domain={['auto', 'auto']}
               />
               <Tooltip 
                 cursor={{ fill: '#f1f5f9' }}
                 contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
               />
               <ReferenceLine y={28} stroke="#94a3b8" strokeDasharray="3 3" label={{ position: 'right', value: '28d', fontSize: 10, fill: '#94a3b8' }} />
               {avgLength !== 28 && (
                   <ReferenceLine y={avgLength} stroke="#ec4899" strokeDasharray="3 3" label={{ position: 'right', value: 'Avg', fontSize: 10, fill: '#ec4899' }} />
               )}
               <Bar 
                 dataKey="length" 
                 fill="#ec4899" 
                 radius={[4, 4, 0, 0]} 
                 barSize={40}
                 fillOpacity={0.8}
                 activeBar={{ fill: '#be185d' }}
               />
            </BarChart>
         </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

import { useMemo } from 'react';
