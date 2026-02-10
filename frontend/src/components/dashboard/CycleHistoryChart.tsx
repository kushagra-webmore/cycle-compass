import { useState, useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { differenceInDays, format } from 'date-fns';
import { useMediaQuery } from '@/hooks/use-media-query';
import { parseLocalYYYYMMDD } from '@/lib/utils';

interface CycleHistoryChartProps {
  cycles: any[];
}

export function CycleHistoryChart({ cycles }: CycleHistoryChartProps) {
  const [currentPage, setCurrentPage] = useState(0);
  
  // Responsive cycles per page
  const isMobile = useMediaQuery("(max-width: 640px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  
  const cyclesPerPage = useMemo(() => {
    if (isMobile) return 4;
    if (isTablet) return 6;
  }, [isMobile, isTablet]);

  // Process cycles to get lengths
  const allData = useMemo(() => {
    if (!cycles || cycles.length < 2) return [];

    const sorted = [...cycles].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    const chartData = [];

    for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i+1];
        
        // Use parseLocalYYYYMMDD to ensure we count days based on local dates, preventing UTC shifts
        const startDate = parseLocalYYYYMMDD(current.startDate);
        const nextStartDate = parseLocalYYYYMMDD(next.startDate);
        
        const length = differenceInDays(nextStartDate, startDate);
        
        // Filter outliers
        if (length > 15 && length < 100) {
            chartData.push({
                date: format(startDate, 'MMM d'),
                length: length,
                fullDate: format(startDate, 'MMM d, yyyy')
            });
        }
    }
    return chartData;
  }, [cycles]);

  // Pagination
  const totalPages = Math.ceil(allData.length / cyclesPerPage);
  const startIndex = currentPage * cyclesPerPage;
  const endIndex = startIndex + cyclesPerPage;
  const data = allData.slice(startIndex, endIndex);

  // Get date range for current page
  const dateRange = useMemo(() => {
    if (data.length === 0) return "";
    const firstDate = data[0].fullDate;
    const lastDate = data[data.length - 1].fullDate;
    if (data.length === 1) return firstDate;
    return `${format(new Date(firstDate), 'MMM yyyy')} - ${format(new Date(lastDate), 'MMM yyyy')}`;
  }, [data]);

  const goToNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (allData.length === 0) return null;
  
  const avgLength = Math.round(allData.reduce((acc, curr) => acc + curr.length, 0) / allData.length);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Cycle Length History</CardTitle>
            <CardDescription>
              Tracking consistency over time (Avg: {avgLength} days)
            </CardDescription>
          </div>
          
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevPage}
                disabled={currentPage === 0}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs text-muted-foreground min-w-[80px] text-center">
                Page {currentPage + 1} of {totalPages}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextPage}
                disabled={currentPage === totalPages - 1}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        
        {totalPages > 1 && dateRange && (
          <p className="text-xs text-muted-foreground text-center mt-2">{dateRange}</p>
        )}
      </CardHeader>
      <CardContent className="w-full">
         <div className="h-[300px] w-full min-w-0">
            <ResponsiveContainer width="99%" height="100%">
               <BarChart data={data} margin={{ top: 20, right: 45, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tickMargin={10}
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.2)' }}
                    contentStyle={{ 
                       borderRadius: '8px', 
                       border: '1px solid hsl(var(--border))', 
                       backgroundColor: 'hsl(var(--popover))',
                       color: 'hsl(var(--popover-foreground))',
                       boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
                    }}
                  />
                  <ReferenceLine y={28} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ position: 'right', value: '28d', fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
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
         </div>

         {/* Page dots indicator for mobile */}
         {totalPages > 1 && isMobile && (
           <div className="flex justify-center gap-1.5 mt-6 pb-2">
             {Array.from({ length: totalPages }).map((_, index) => (
               <button
                 key={index}
                 onClick={() => setCurrentPage(index)}
                 className={`h-1.5 rounded-full transition-all ${
                   index === currentPage 
                     ? 'w-6 bg-primary' 
                     : 'w-1.5 bg-muted-foreground/30'
                 }`}
                 aria-label={`Go to page ${index + 1}`}
               />
             ))}
           </div>
         )}
      </CardContent>
    </Card>
  );
}
