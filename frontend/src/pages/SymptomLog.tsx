import { useState } from 'react';
import { Save, Droplets, Heart, Battery, Moon, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCurrentCycle } from '@/hooks/api/cycles';
import { useLogSymptom } from '@/hooks/api/cycles';

const moodOptions = [
  { value: 'HIGH', emoji: '😊', label: 'Great' },
  { value: 'NEUTRAL', emoji: '🙂', label: 'Good' },
  { value: 'LOW', emoji: '😐', label: 'Okay' },
  { value: 'LOW', emoji: '😔', label: 'Low' },
];

const energyOptions = [
  { value: 'HIGH', emoji: '⚡', label: 'High' },
  { value: 'MEDIUM', emoji: '🔋', label: 'Moderate' },
  { value: 'LOW', emoji: '😴', label: 'Low' },
];

const sleepMap: Record<string, number> = {
  great: 8,
  good: 7,
  poor: 5,
  bad: 4,
};

const sleepOptions = [
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'poor', label: 'Poor' },
  { value: 'bad', label: 'Bad' },
];

const defaultMood = 'NEUTRAL';
const defaultEnergy = 'MEDIUM';

export default function SymptomLog() {
  const { data: cycle, isLoading: cycleLoading, isError: cycleError, refetch: refetchCycle } = useCurrentCycle();
  const logSymptom = useLogSymptom();
  const [pain, setPain] = useState([3]);
  const [mood, setMood] = useState<string>('');
  const [energy, setEnergy] = useState<string>('');
  const [sleep, setSleep] = useState<string>('');
  const [cravings, setCravings] = useState('');
  const { toast } = useToast();

  const handleSave = async () => {
    if (!cycle) {
      toast({
        title: 'No active cycle found',
        description: 'Create a cycle before logging symptoms.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await logSymptom.mutateAsync({
        cycleId: cycle.id,
        date: new Date().toISOString().slice(0, 10),
        pain: pain[0],
        mood: (mood || defaultMood) as 'LOW' | 'NEUTRAL' | 'HIGH',
        energy: (energy || defaultEnergy) as 'LOW' | 'MEDIUM' | 'HIGH',
        sleepHours: sleep ? sleepMap[sleep] : undefined,
        cravings: cravings.trim() || undefined,
      });

      toast({
        title: 'Entry saved! 🌸',
        description: 'Your symptoms have been logged for today.',
      });
      setCravings('');
    } catch (error) {
      toast({
        title: 'Unable to save entry',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const getPainLabel = (value: number) => {
    if (value === 0) return 'None';
    if (value <= 3) return 'Mild';
    if (value <= 6) return 'Moderate';
    if (value <= 8) return 'Severe';
    return 'Very Severe';
  };

  return (
    <AppLayout title="Log Symptoms">
      <div className="space-y-5 animate-fade-in">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-foreground">How are you feeling today?</h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {cycleLoading && (
          <Card variant="soft">
            <CardContent className="py-8 text-center text-sm text-muted-foreground">
              Loading your current cycle...
            </CardContent>
          </Card>
        )}

        {cycleError && (
          <Card variant="destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Unable to fetch cycle details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-destructive-foreground/80">
              <p>Please refresh to try again.</p>
              <Button variant="outline" size="sm" onClick={() => refetchCycle()}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {!cycleLoading && !cycle && !cycleError && (
          <Card variant="gradient" className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-primary-soft flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>No active cycle</CardTitle>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                Create a cycle from the dashboard before logging symptoms so your entries are tracked correctly.
              </p>
            </CardContent>
          </Card>
        )}

        {cycle && (
          <>
            <Card variant="soft">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Droplets className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Pain Level</CardTitle>
                    <CardDescription>Rate any discomfort you're experiencing</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="px-2">
                  <Slider value={pain} onValueChange={setPain} max={10} step={1} className="w-full" />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">0</span>
                  <span
                    className={cn(
                      'font-semibold px-3 py-1 rounded-full',
                      pain[0] <= 3
                        ? 'bg-sage/30 text-sage-foreground'
                        : pain[0] <= 6
                        ? 'bg-peach/30 text-peach-foreground'
                        : 'bg-destructive/20 text-destructive',
                    )}
                  >
                    {pain[0]} - {getPainLabel(pain[0])}
                  </span>
                  <span className="text-muted-foreground">10</span>
                </div>
              </CardContent>
            </Card>

            <Card variant="lavender">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-lavender/30">
                    <Heart className="h-5 w-5 text-lavender-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Mood</CardTitle>
                    <CardDescription>How are you feeling emotionally?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map((option, index) => (
                    <button
                      key={`${option.value}-${index}`}
                      onClick={() => setMood(option.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 flex-1 min-w-[60px]',
                        mood === option.value
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'bg-muted/50 text-foreground hover:bg-muted',
                      )}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="peach">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-peach/30">
                    <Battery className="h-5 w-5 text-peach-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Energy Level</CardTitle>
                    <CardDescription>How energized do you feel?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {energyOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setEnergy(option.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 flex-1',
                        energy === option.value
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'bg-muted/50 text-foreground hover:bg-muted',
                      )}
                    >
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="text-xs font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="sage">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-sage/30">
                    <Moon className="h-5 w-5 text-sage-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Sleep Quality</CardTitle>
                    <CardDescription>How did you sleep last night?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2">
                  {sleepOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSleep(option.value)}
                      className={cn(
                        'p-3 rounded-xl text-sm font-medium transition-all duration-200',
                        sleep === option.value
                          ? 'bg-primary text-primary-foreground shadow-soft'
                          : 'bg-muted/50 text-foreground hover:bg-muted',
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card variant="soft">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cravings or notes</CardTitle>
                <CardDescription>Optional – share anything else you noticed today</CardDescription>
              </CardHeader>
              <CardContent>
                <textarea
                  value={cravings}
                  onChange={(e) => setCravings(e.target.value)}
                  className="w-full min-h-[100px] rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  placeholder="Any cravings, observations, or additional notes?"
                />
              </CardContent>
            </Card>

            <Button
              variant="gradient"
              size="xl"
              className="w-full"
              onClick={handleSave}
              disabled={logSymptom.isPending}
            >
              {logSymptom.isPending ? <span className="animate-pulse">Saving...</span> : (<>
                <Save className="h-5 w-5 mr-2" />
                Save Entry
              </>)}
            </Button>
          </>
        )}

        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground">🌸 All entries are private. You're doing great by tracking!</p>
        </div>
      </div>
    </AppLayout>
  );
}
