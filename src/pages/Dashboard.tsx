import { Link } from 'react-router-dom';
import { Calendar, Sparkles, Heart, Book, Battery, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { CycleWheel } from '@/components/dashboard/CycleWheel';
import { PhaseCard } from '@/components/dashboard/PhaseCard';
import { useAuth } from '@/contexts/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  
  // Calculate current cycle day and phase (mock data for demo)
  const today = new Date();
  const lastPeriod = user?.lastPeriodDate ? new Date(user.lastPeriodDate) : new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000);
  const cycleLength = user?.cycleLength || 28;
  const daysSinceLastPeriod = Math.floor((today.getTime() - lastPeriod.getTime()) / (1000 * 60 * 60 * 24));
  const currentDay = (daysSinceLastPeriod % cycleLength) + 1;

  // Determine phase
  const getPhase = (day: number, length: number) => {
    if (day <= 5) return 'menstrual';
    if (day <= length * 0.4) return 'follicular';
    if (day <= length * 0.5) return 'ovulatory';
    return 'luteal';
  };

  const phase = getPhase(currentDay, cycleLength);

  // Mock recent data
  const hasData = user?.lastPeriodDate;

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

        {hasData ? (
          <>
            {/* Cycle Wheel */}
            <Card variant="gradient" className="py-6">
              <CardContent className="flex justify-center">
                <CycleWheel currentDay={currentDay} cycleLength={cycleLength} phase={phase} />
              </CardContent>
            </Card>

            {/* Phase Card */}
            <PhaseCard phase={phase} />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <Card variant="soft" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Battery className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Energy</span>
                    <span className="font-semibold text-foreground">Moderate</span>
                  </div>
                </div>
              </Card>
              <Card variant="lavender" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-lavender/30">
                    <Smile className="h-5 w-5 text-lavender-foreground" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Mood</span>
                    <span className="font-semibold text-foreground">Good</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Action Buttons */}
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
        ) : (
          /* Empty State */
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

        {/* Privacy Reminder */}
        <div className="text-center p-3 rounded-xl bg-sage/20 border border-sage/30">
          <p className="text-xs text-sage-foreground">
            🔒 Your data is private. Only you control what's shared.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
