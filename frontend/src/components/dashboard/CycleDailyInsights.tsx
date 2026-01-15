import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Utensils, Activity, Sparkles, Brain } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCurrentCycle } from '@/hooks/api/cycles';

// Mocking the AI service hook for now, or we can create a real one.
// Since we added generateDailyInsights to backend, we need a frontend hook to call it.
// Assuming we'll add `useDailyInsights` to `hooks/api/ai.ts`.

interface DailyInsights {
  food: string;
  activity: string;
  wisdom: string;
}

import { useDailyInsights } from '@/hooks/api/ai';
import { Loader } from 'lucide-react';

export function CycleDailyInsights() {
  const { data: cycle } = useCurrentCycle();
  const { data, isLoading } = useDailyInsights();
  
  const insights = data?.insights;

  if (!cycle) return null;
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="h-32 bg-muted border-border flex items-center justify-center">
            <Loader className="h-4 w-4 animate-spin text-muted-foreground" />
          </Card>
        ))}
      </div>
    );
  }

  if (!insights) return null; // Or show error/empty state

  if (!cycle) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in text-left">
      <Card className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-background border-emerald-100 dark:border-emerald-900 shadow-sm hover:shadow-md transition-all duration-300 group">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 text-lg">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-full group-hover:scale-110 transition-transform">
               <Utensils className="h-5 w-5" />
            </div>
            Nourish
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-emerald-900/80 dark:text-emerald-100/80 leading-relaxed font-medium">
            {insights.food}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/30 dark:to-background border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-all duration-300 group">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-full group-hover:scale-110 transition-transform">
               <Activity className="h-5 w-5" />
            </div>
            Move
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-blue-900/80 dark:text-blue-100/80 leading-relaxed font-medium">
            {insights.activity}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-violet-50 to-white dark:from-violet-950/30 dark:to-background border-violet-100 dark:border-violet-900 shadow-sm hover:shadow-md transition-all duration-300 group">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-violet-700 dark:text-violet-400 text-lg">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/50 rounded-full group-hover:scale-110 transition-transform">
               <Sparkles className="h-5 w-5" />
            </div>
            Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-violet-900/80 dark:text-violet-100/80 leading-relaxed font-medium italic">
            "{insights.wisdom}"
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
