import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceArea } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCurrentCycle } from '@/hooks/api/cycles';

export function FertilityChart() {
  const { data: cycle } = useCurrentCycle();

  if (!cycle) return null;

  const cycleLength = cycle.context.cycleLength;
  const ovulationDay = cycleLength - 14; 
  
  const chartData = [];
  
  // Generate data points for the FULL cycle to show all phases
  for (let d = 1; d <= cycleLength; d++) {
    let prob = 2; // Baseline very low
    const dist = ovulationDay - d;
    
    // Fertility Calculation
    if (dist === 0) prob = 95; // Ovulation
    else if (dist === 1) prob = 85;
    else if (dist === 2) prob = 70;
    else if (dist === 3) prob = 45;
    else if (dist === 4) prob = 25;
    else if (dist === 5) prob = 10;
    else if (dist < 0 && dist >= -1) prob = 10; // Day after
    else if (dist < 0 && dist >= -2) prob = 5;
    
    chartData.push({
      day: `Day ${d}`,
      probability: prob,
      label: dist === 0 ? 'Ovulation' : '',
    });
  }

  // Phase Ranges
  // Menstrual: 1-5
  // Follicular: 6 to FertileStart (Ovulation - 6)
  // Fertile: Ovulation - 5 to Ovulation + 1
  // Luteal: Ovulation + 2 to End

  const fertileStart = ovulationDay - 5;
  const fertileEnd = ovulationDay + 1;

  return (
    <Card className="mt-6 border-pink-100 bg-gradient-to-br from-pink-50/50 to-white">
      <CardHeader>
        <CardTitle className="text-base text-pink-700 flex items-center gap-2">
            Fertility & Cycle Phases
        </CardTitle>
        <CardDescription>
            Your fertility curve across the cycle phases.
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[300px] w-full">
         <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
               <defs>
                  <linearGradient id="colorFertility" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                     <stop offset="95%" stopColor="#ec4899" stopOpacity={0.1}/>
                  </linearGradient>
               </defs>
               
               <XAxis 
                  dataKey="day" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  interval={Math.floor(cycleLength / 5)} // Show fewer ticks
               />
               <YAxis hide domain={[0, 100]} />
               <Tooltip 
                 contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                 labelStyle={{ color: '#831843', fontWeight: 'bold' }}
               />

               {/* Phase Backgrounds */}
               {/* Menstrual: Red-ish */}
               <ReferenceArea x1="Day 1" x2={`Day 5`} fill="#fee2e2" fillOpacity={0.5} strokeOpacity={0} label={{ value: "Period", position: 'insideTopLeft', fill: '#ef4444', fontSize: 10 }} />
               
               {/* Follicular: Blue-ish */}
               <ReferenceArea x1={`Day 5`} x2={`Day ${fertileStart}`} fill="#dbeafe" fillOpacity={0.5} strokeOpacity={0} label={{ value: "Follicular", position: 'insideTop', fill: '#1e3a8a', fontSize: 10 }} />
               
               {/* Fertile: Green-ish */}
               <ReferenceArea x1={`Day ${fertileStart}`} x2={`Day ${fertileEnd}`} fill="#dcfce7" fillOpacity={0.6} strokeOpacity={0} label={{ value: "Fertile", position: 'insideTop', fill: '#166534', fontSize: 10 }} />
               
               {/* Luteal: Purple-ish */}
               <ReferenceArea x1={`Day ${fertileEnd}`} x2={`Day ${cycleLength}`} fill="#f3e8ff" fillOpacity={0.5} strokeOpacity={0} label={{ value: "Luteal", position: 'insideTopRight', fill: '#9333ea', fontSize: 10 }} />

               <Area 
                 type="monotone" 
                 dataKey="probability" 
                 stroke="#ec4899" 
                 strokeWidth={3}
                 fillOpacity={1} 
                 fill="url(#colorFertility)" 
                 animationDuration={1500}
               />
            </AreaChart>
         </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
