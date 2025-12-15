import { Link } from 'react-router-dom';
import { Calendar, Sparkles, Heart, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { CycleWheel } from '@/components/dashboard/CycleWheel';
import { PhaseCard } from '@/components/dashboard/PhaseCard';
import { useCurrentCycle, useSymptomHistory } from '@/hooks/api/cycles';

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

const phaseLabel = (phase?: string) => {
  switch (phase) {
    case 'MENSTRUAL':
      return 'menstrual';
    case 'FOLLICULAR':
      return 'follicular';
    case 'OVULATION':
      return 'ovulatory';
    case 'LUTEAL':
      return 'luteal';
    default:
      return 'menstrual';
  }
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
  } = useSymptomHistory(14);

  const latestSymptom = symptomHistory?.[0];
  const hasData = Boolean(cycle);
  const phase = phaseLabel(cycle?.context.phase);

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Greeting */}
        <div className="text-center pt-2">
          <h2 className="font-display text-2xl font-bold text-foreground">
            Hello, beautiful 💕
          </h2>
          <p className="text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {(cycleLoading || symptomLoading) && (
          <Card variant="soft">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              Loading your latest cycle insights...
            </CardContent>
          </Card>
        )}

        {(cycleError || symptomError) && (
          <Card variant="destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Unable to load data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-destructive-foreground/80">
              <p>We couldn’t fetch your latest cycle details. Please try refreshing.</p>
              <Button variant="outline" size="sm" onClick={() => { refetchCycle(); refetchSymptoms(); }}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {!cycleLoading && !cycleError && !hasData && (
          <Card variant="gradient" className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary-soft flex items-center justify-center">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Start Your Journey</CardTitle>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                Begin tracking to see personalized insights about your cycle.
              </p>
              <Button asChild variant="gradient" size="lg">
                <Link to="/log">
                  <Calendar className="h-4 w-4 mr-2" />
                  Log Your First Entry
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {hasData && cycle && (
          <>
            <Card variant="gradient" className="py-6">
              <CardContent className="flex justify-center">
                <CycleWheel
                  currentDay={cycle.context.currentDay}
                  cycleLength={cycle.context.cycleLength}
                  phase={phase}
                />
              </CardContent>
            </Card>

            <PhaseCard phase={phase} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card variant="soft" className="p-4">
                <CardDescription className="uppercase text-xs">Cycle Day</CardDescription>
                <p className="text-2xl font-display text-foreground">{cycle.context.currentDay}</p>
              </Card>
              <Card variant="soft" className="p-4">
                <CardDescription className="uppercase text-xs">Days until next phase</CardDescription>
                <p className="text-2xl font-display text-foreground">{cycle.context.daysUntilNextPhase}</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <Card variant="lavender" className="p-4">
                <CardDescription className="uppercase text-xs">Mood trend</CardDescription>
                <p className="text-lg font-semibold text-foreground">
                  {latestSymptom?.mood ? moodLabels[latestSymptom.mood] ?? 'Mixed' : 'Not logged yet'}
                </p>
              </Card>
              <Card variant="peach" className="p-4">
                <CardDescription className="uppercase text-xs">Energy trend</CardDescription>
                <p className="text-lg font-semibold text-foreground">
                  {latestSymptom?.energy ? energyLabels[latestSymptom.energy] ?? 'Balanced' : 'Not logged yet'}
                </p>
              </Card>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button asChild variant="default" size="lg" className="h-auto py-4 flex-col gap-2">
                <Link to="/log">
                  <Calendar className="h-6 w-6" />
                  <span>Log Symptoms</span>
                </Link>
              </Button>
              <Button asChild variant="lavender" size="lg" className="h-auto py-4 flex-col gap-2">
                <Link to="/journal">
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
