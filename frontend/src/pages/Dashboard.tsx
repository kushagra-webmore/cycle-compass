import { Link, useNavigate } from 'react-router-dom';
import { Calendar, Sparkles, Heart, AlertTriangle, History, Baby } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { CycleWheel } from '@/components/dashboard/CycleWheel';
import { PhaseCard } from '@/components/dashboard/PhaseCard';
import { CycleDailyInsights } from '@/components/dashboard/CycleDailyInsights';
import { AvgCycleStats } from '@/components/dashboard/AvgCycleStats';
import { FertilityChart } from '@/components/dashboard/FertilityChart';
import { HistoryChart } from '@/components/dashboard/HistoryChart';
import { CycleCalendar } from '@/components/dashboard/CycleCalendar';
import { useCurrentCycle, useSymptomHistory, useCycles } from '@/hooks/api/cycles';
import { useAuth } from '@/contexts/AuthContext';
import { format, addDays, differenceInDays } from 'date-fns';
import { useMemo } from 'react';

const moodLabels: Record<string, string> = {
  LOW: 'Low',
  NEUTRAL: 'Balanced',
  HIGH: 'Upbeat',
};

const energyLabels: Record<string, string> = {
  LOW: 'Low',
  MEDIUM: 'Moderate',
  HIGH: 'High',
};

export default function Dashboard() {
  const {
    data: cycle,
    isLoading: cycleLoading,
    isError: cycleError,
    refetch: refetchCycle,
  } = useCurrentCycle();
  const {
    data: symptomHistory,
    isLoading: symptomLoading,
    isError: symptomError,
    refetch: refetchSymptoms,
  } = useSymptomHistory(90); // Increased to 90 days for better stats
  const { data: cyclesHistory } = useCycles();
  const { user } = useAuth();

  const latestSymptom = symptomHistory?.[0];
  const hasData = Boolean(cycle);
  const navigate = useNavigate();

  // Calculate Average Cycle Length from history
  const avgCycleLength = useMemo(() => {
    if (!cyclesHistory || cyclesHistory.length === 0) return user?.cycleLength || 28;
    const total = cyclesHistory.reduce((acc, c) => acc + c.cycleLength, 0);
    return Math.round(total / cyclesHistory.length);
  }, [cyclesHistory, user?.cycleLength]);

  // Calculate Average Period Length based on recorded flow in symptoms
  const avgPeriodLength = useMemo(() => {
    if (!symptomHistory || symptomHistory.length === 0) return user?.periodLength || 5;

    // Filter, sort and group consecutive flow days
    const flowLogs = symptomHistory
      .filter(log => log.flow && log.flow !== 'NONE')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (flowLogs.length === 0) return user?.periodLength || 5;

    const periods: number[] = [];
    let currentStreak = 1;

    for (let i = 0; i < flowLogs.length - 1; i++) {
       const current = new Date(flowLogs[i].date);
       const next = new Date(flowLogs[i+1].date);
       const diff = Math.round((next.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));

       if (diff === 1) {
          currentStreak++;
       } else {
          if (currentStreak > 1) periods.push(currentStreak);
          currentStreak = 1;
       }
    }
    // Push the last streak if valid
    if (currentStreak > 1) periods.push(currentStreak);

    if (periods.length === 0) return user?.periodLength || 5;

    const totalDays = periods.reduce((a, b) => a + b, 0);
    return Math.round(totalDays / periods.length);
  }, [symptomHistory, user?.periodLength]);

  // Check for discrepancy
  const discrepancy = useMemo(() => {
    if (!cycle) return null;
    const currentDay = cycle.context.currentDay;
    const diff = currentDay - avgCycleLength;
    if (diff > 2) { // 2 days buffer
       return { type: 'longer', days: diff };
    }
    return null;
  }, [cycle, avgCycleLength]);

  // Calculate intercourse dates for calendar
  const intercourseDates = useMemo(() => 
    symptomHistory?.filter(log => log.intercourse).map(log => log.date) || [], 
  [symptomHistory]);

  // Helper date formatting
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return {
      day: d.getDate(),
      month: d.toLocaleString('default', { month: 'short' }),
    };
  };

  const nextPeriodDate = cycle ? addDays(new Date(cycle.startDate), cycle.context.cycleLength) : new Date();

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in pb-20">
        {/* Greeting */}
        <div className="text-center pt-2">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Hello, beautiful 💕
          </h2>
          <p className="text-muted-foreground mt-1">
            {format(new Date(), 'EEEE, MMMM d')}
          </p>
        </div>

        {/* Log Today Reminder */}
        {!cycleLoading && !symptomLoading && !symptomError && 
         !symptomHistory?.some(log => log.date.startsWith(new Date().toISOString().split('T')[0])) && (
           <div className="animate-in fade-in slide-in-from-top-4 duration-700">
             <Card className="bg-gradient-to-r from-pink-50 to-white dark:from-pink-950/30 dark:to-background border-pink-200 dark:border-pink-900 shadow-sm">
                <CardContent className="p-4 flex items-center justify-between">
                   <div className="flex gap-3 items-center">
                      <div className="p-2 bg-white dark:bg-card rounded-full text-pink-500 shadow-sm ring-1 ring-pink-100 dark:ring-pink-900">
                         <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                           <p className="font-semibold text-sm text-foreground">How are you feeling?</p>
                           <p className="text-xs text-muted-foreground">Log today's symptoms for better insights.</p>
                      </div>
                   </div>
                   <Button asChild size="sm" variant="default" className="shadow-md shadow-pink-200 dark:shadow-none">
                      <Link to="/log">Log Now</Link>
                   </Button>
                </CardContent>
             </Card>
           </div>
        )}

        {(cycleLoading || symptomLoading) && (
          <Card variant="soft">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Loading your latest cycle insights...
            </CardContent>
          </Card>
        )}

        {cycleError && (
          <Card variant="destructive">
            <CardContent className="pt-6 text-center">
               <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
               <p className="text-sm text-destructive-foreground">Unable to load cycle data.</p>
               <Button variant="link" onClick={() => refetchCycle()}>Try again</Button>
            </CardContent>
          </Card>
        )}

        {!cycleLoading && !cycleError && !hasData && (
          <Card variant="gradient" className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary-soft flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Welcome to Cycle Compass 🌸</CardTitle>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Start by logging your current cycle to unlock insights and predictions.
              </p>
              <Button asChild variant="gradient" size="lg">
                 <Link to="/onboarding">Get Started</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hasData && cycle && (
          <>
            {/* Discrepancy Alert */}
            {discrepancy && (
              <div className="mb-4 animate-in slide-in-from-top-2">
                <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900">
                  <CardContent className="p-3 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900 dark:text-amber-100 text-sm">
                        Cycle is {discrepancy.days} days longer than average
                      </p>
                      <p className="text-xs text-amber-700 dark:text-amber-400">
                        Based on your history (avg. {avgCycleLength} days).
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Main Wheel & Phase */}
            <Card variant="gradient" className="py-6 border-none shadow-sm dark:bg-card dark:bg-none">
              <CardContent className="flex flex-col items-center justify-center">
                <CycleWheel
                  currentDay={cycle.context.currentDay}
                  cycleLength={cycle.context.cycleLength}
                  phase={cycle.context.phase as any}
                />
              </CardContent>
            </Card>

            <PhaseCard phase={cycle.context.phase as any} />

            {/* Daily Insights Cards */}
            <div className="mt-4">
               <h3 className="text-lg font-display font-semibold mb-3 px-1 text-foreground">Daily Insights</h3>
               <CycleDailyInsights />
            </div>

            {/* Fertility Chart - Show if relevant or user goal is conception (future) */}
            <div className="mt-6">
               <FertilityChart />
            </div>

            {/* Conception / Fertilization Chance (Only if Fertile/Ovulation) */}
            {(cycle.context.phase === 'FERTILE' || cycle.context.phase === 'OVULATION') && (
               <Card className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-950/50 dark:to-rose-950/50 border-pink-100 dark:border-pink-900">
                  <CardContent className="p-4 flex items-center justify-between">
                     <div className="flex gap-3 items-center">
                        <div className="p-2 bg-white dark:bg-card rounded-full text-pink-500 shadow-sm">
                           <Baby className="h-5 w-5" />
                        </div>
                        <div>
                           <p className="font-semibold text-pink-900 dark:text-pink-100">Pregnancy Chance: High</p>
                           <p className="text-xs text-pink-700 dark:text-pink-300">You are in your fertile window.</p>
                        </div>
                     </div>
                  </CardContent>
               </Card>
            )}

            {/* Last Period & Next Period Split */}
            <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="flex flex-col items-center">
                   <span className="text-4xl font-display font-bold text-foreground">
                      {formatDate(cycle.startDate).day}<span className="text-base align-top ml-0.5">th</span>
                   </span>
                   <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide mt-1">
                      {formatDate(cycle.startDate).month}
                   </span>
                   <span className="text-xs text-muted-foreground mt-1">Last Period</span>
                   <div className="flex items-center gap-2 mt-2">
                      <span className="h-2 w-2 rounded-full bg-rose-400" />
                      <span className="text-[10px] text-muted-foreground">Period</span>
                   </div>
                </div>

                <div className="flex flex-col items-center">
                   <span className="text-4xl font-display font-bold text-foreground">
                       {cycle.context.daysUntilNextPhase}
                       <span className="text-sm font-normal text-muted-foreground ml-1">days</span>
                   </span>
                   <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide mt-1">
                      Remaining
                   </span>
                   <span className="text-xs text-muted-foreground mt-1">
                      Expected: {format(nextPeriodDate, 'MMM d')}
                   </span>
                   <div className="flex items-center gap-2 mt-2">
                       <span className="h-2 w-2 rounded-full bg-foreground" />
                       <span className="text-[10px] text-muted-foreground">Until Bleed</span>
                   </div>
                </div>
            </div>

            {/* History & Calendar Section */}
            <div className="mt-8">
               <HistoryChart data={cyclesHistory?.map(c => ({
                  startDate: c.startDate,
                  cycleLength: c.cycleLength,
                  periodLength: avgPeriodLength 
               })) || []} />
            </div>

            <div className="mt-8 mx-auto max-w-xl">
               <CycleCalendar 
                  currentCycleStart={new Date(cycle.startDate)}
                  avgCycleLength={avgCycleLength}
                  avgPeriodLength={avgPeriodLength}
                  cyclesHistory={cyclesHistory || []}
                  intercourseDates={intercourseDates}
               />
            </div>

            <AvgCycleStats 
               avgCycleLength={avgCycleLength} 
               avgPeriodLength={avgPeriodLength} 
            />

            {/* Mood/Energy Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
              <Card variant="lavender" className="p-4">
                <CardDescription className="uppercase text-xs font-semibold tracking-wider text-lavender-foreground/70">Mood Trend</CardDescription>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {latestSymptom?.mood ? moodLabels[latestSymptom.mood] ?? 'Mixed' : 'Not logged yet'}
                </p>
              </Card>
              <Card variant="peach" className="p-4">
                <CardDescription className="uppercase text-xs font-semibold tracking-wider text-peach-foreground/70">Energy Trend</CardDescription>
                <p className="text-lg font-semibold text-foreground mt-1">
                  {latestSymptom?.energy ? energyLabels[latestSymptom.energy] ?? 'Balanced' : 'Not logged yet'}
                </p>
              </Card>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pb-8">
              <Button asChild variant="default" size="lg" className="h-auto py-4 flex-col gap-2 shadow-lg shadow-primary/20">
                <Link to="/log">
                  <Calendar className="h-6 w-6" />
                  <span>Log Symptoms</span>
                </Link>
              </Button>
              <Button asChild variant="lavender" size="lg" className="h-auto py-4 flex-col gap-2 shadow-lg shadow-lavender/20">
                <Link to="/chatbot">
                  <Sparkles className="h-6 w-6" />
                  <span>Ask AI</span>
                </Link>
              </Button>
            </div>
          </>
        )}

        <div className="text-center p-3 rounded-xl bg-sage/20 border border-sage/30">
          <p className="text-xs text-sage-foreground">
            🔒 Your data is private. Only you control what's shared.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
