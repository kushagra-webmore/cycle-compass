import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, Sparkles, Check, Plus, Trash2, Info } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Input } from '@/components/ui/input';
import { useBulkCreateCycles } from '@/hooks/api/cycles';
import { useQueryClient } from '@tanstack/react-query';

interface ImportedCycle {
  id: string;
  startDate: string;
  endDate?: string | null;
  cycleLength: number;
  phase?: string;
}

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [goal, setGoal] = useState<'TRACKING' | 'CONCEIVE'>('TRACKING');
  const [periodLength, setPeriodLength] = useState<number | string>(5);
  const [avgCycleLength, setAvgCycleLength] = useState<number | string>(28);
  const [error, setError] = useState<string | null>(null);
  const [submittedCycles, setSubmittedCycles] = useState<ImportedCycle[]>([]);
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bulkCreate = useBulkCreateCycles();

  const totalSteps = 4;
  const MIN_CYCLES = 2;
  const DEFAULT_CYCLES = 6;
  const MAX_CYCLES = 12;

  const generateCycle = (monthsAgo: number) => ({
    startDate: '', // Default to empty to allow user to input
    endDate: '',
    cycleLength: 28,
  });

  // Helper to calculate difference in days
  const getDaysDiff = (start: string, end: string) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.round(diff / (1000 * 60 * 60 * 24));
  };

  const [cycles, setCycles] = useState(() =>
    // Initialize with empty start dates, user fills them
    Array.from({ length: DEFAULT_CYCLES }, (_, index) => generateCycle(index)),
  );

  const completedCycles = useMemo(
    () => cycles.filter((cycle) => Boolean(cycle.startDate)),
    [cycles],
  );

  const handleCycleChange = (index: number, field: 'startDate' | 'endDate' | 'cycleLength', value: string) => {
    setCycles((prev) => {
      const newCycles = [...prev];
      const cycle = { ...newCycles[index], [field]: field === 'cycleLength' ? Number(value) || 0 : value };
      newCycles[index] = cycle;

      // Auto-calculate cycle length if start date changes
      if (field === 'startDate') {
         // Update THIS cycle's length if we have a Newer cycle (index - 1)
         if (index > 0 && newCycles[index - 1].startDate && value) {
            const days = getDaysDiff(value, newCycles[index - 1].startDate);
            if (days > 0 && days < 100) {
               newCycles[index] = { ...newCycles[index], cycleLength: days };
            }
         }

         // Update OLDER cycle's length (index + 1) if it exists
         if (index < newCycles.length - 1 && newCycles[index + 1].startDate && value) {
            const olderIndex = index + 1;
            const days = getDaysDiff(newCycles[olderIndex].startDate, value);
            if (days > 0 && days < 100) {
              newCycles[olderIndex] = { ...newCycles[olderIndex], cycleLength: days };
            }
         }
      }
      return newCycles;
    });
  };

  const handleAddCycle = () => {
    if (cycles.length >= MAX_CYCLES) return;
    setCycles((prev) => [...prev, generateCycle(prev.length)]);
  };

  const handleRemoveCycle = (index: number) => {
    setCycles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateCycles = () => {
    // Filter out empty rows
    const validRows = cycles.filter(c => !!c.startDate);

    if (validRows.length < 2) {
      return 'Please provide at least 2 recent cycles.';
    }
    
    const futureDates = validRows.some((cycle) => new Date(cycle.startDate) > new Date());
    if (futureDates) {
      return 'Cycle start dates cannot be in the future.';
    }

    return null;
  };

  const handleSubmit = async () => {
    setError(null);
    const validationError = validateCycles();
    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      cycles: completedCycles.map((cycle) => ({
        startDate: cycle.startDate,
        endDate: cycle.endDate || undefined,
        cycleLength: cycle.cycleLength || undefined,
      })),
    };

    try {
      const result = await bulkCreate.mutateAsync(payload);
      const imported = result.cycles?.map((cycle) => ({
        id: cycle.id,
        startDate: cycle.startDate,
        endDate: cycle.endDate ?? null,
        cycleLength: cycle.cycleLength,
        phase: cycle.context?.phase,
      })) ?? [];
      setSubmittedCycles(imported);
      setStep(4);
      toast({
        title: 'Cycles imported 💫',
        description: 'Review your history below before finishing setup.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to save your history right now.';
      setError(message);
    }
  };

  const handleFinish = async () => {
    try {
      // Invalidate all queries to ensure fresh data
      await queryClient.invalidateQueries();
      
      // Update the user's onboarding status
      const updates = { 
        onboardingCompleted: true,
        lastPeriodDate: cycles[0]?.startDate, // Use the most recent cycle's start date
        cycleLength: typeof avgCycleLength === 'string' ? parseInt(avgCycleLength) || 28 : avgCycleLength, // Use user-defined average
        periodLength: typeof periodLength === 'string' ? parseInt(periodLength) || 5 : periodLength, // From user input
        goal: goal
      };
      
      await updateUser(updates);
      
      // Force a refresh of the auth state
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // Show success message
      toast({
        title: "You're all set! 🌸",
        description: 'Your cycle companion is ready to support you.',
      });
      
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete onboarding. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen gradient-calm flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-peach dark:from-primary/80 dark:to-peach/80 flex items-center justify-center shadow-soft">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">Setup</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 pb-8">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Progress */}
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  s === step ? "w-8 bg-primary" : s < step ? "w-8 bg-primary/50" : "w-8 bg-muted"
                )}
              />
            ))}
          </div>

          {/* Welcome Message */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">
              {step === 1 ? "Let's get started" : "Almost there!"}
            </h1>
            <p className="text-muted-foreground text-sm">
              This helps us provide personalized insights. You can skip this anytime.
            </p>
          </div>

          {/* Step 1: Goal Selection */}
          {step === 1 && (
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/40">
                    <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <CardTitle>What brings you here?</CardTitle>
                    <CardDescription>
                      We'll customize your experience based on your goal.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => { setGoal('TRACKING'); setStep(2); }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left hover:border-primary/50 hover:bg-primary/5",
                        goal === 'TRACKING' ? "border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20" : "border-border bg-card hover:bg-muted/50"
                      )}
                    >
                       <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-full">
                          <Calendar className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="font-semibold text-foreground">Track my cycle</p>
                          <p className="text-sm text-muted-foreground">I want to understand my body and symptoms.</p>
                       </div>
                    </button>

                    <button
                      onClick={() => { setGoal('CONCEIVE'); setStep(2); }}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left hover:border-rose-400/50 hover:bg-rose-50 dark:hover:bg-rose-900/10",
                        goal === 'CONCEIVE' ? "border-rose-400 bg-rose-50 dark:bg-rose-900/20 ring-1 ring-rose-400/20" : "border-border bg-card hover:bg-muted/50"
                      )}
                    >
                       <div className="p-3 bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-300 rounded-full">
                          <Sparkles className="h-5 w-5" />
                       </div>
                       <div>
                          <p className="font-semibold text-foreground">Conceive a baby</p>
                          <p className="text-sm text-muted-foreground">I want to identify my most fertile days.</p>
                       </div>
                    </button>
                 </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Introduction (shifted) */}
          {step === 2 && (
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Let’s capture your cycle history</CardTitle>
                    <CardDescription>
                      We need at least your two most recent cycles. You can add more for richer insights.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-muted/40 p-4 text-left space-y-2">
                  <p className="text-sm text-muted-foreground">
                    • Provide at least <strong>two consecutive cycles</strong> (most recent months).
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Add up to 12 cycles now, and you can always add more later.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    • Accurate history helps the AI understand your rhythm better.
                  </p>
                </div>

                <div className="flex gap-3">
                    <Button variant="calm" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                    <Button variant="gradient" className="flex-1" onClick={() => setStep(3)}>
                      Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Cycle History */}
          {step === 3 && (
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-lavender/30">
                    <Sparkles className="h-6 w-6 text-lavender-foreground" />
                  </div>
                  <div>
                    <CardTitle>Your recent cycles</CardTitle>
                    <CardDescription>
                      Fill in the start date for at least the two most recent cycles. End date and cycle length are optional.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      Avg Period Length (Days)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      How many days do you bleed?
                    </p>
                    <Input
                      type="number"
                      min={2}
                      max={15}
                      value={periodLength}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') setPeriodLength('');
                        else setPeriodLength(parseInt(val));
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">
                      Avg Cycle Length (Days)
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Typical days between periods?
                    </p>
                    <Input
                      type="number"
                      min={15}
                      max={60}
                      value={avgCycleLength}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '') {
                          setAvgCycleLength('');
                        } else {
                          const num = parseInt(val);
                          setAvgCycleLength(num);
                          setCycles(prev => prev.map(c => ({ ...c, cycleLength: num })));
                        }
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {cycles.map((cycle, index) => {
                    const baseDate = cycles[0]?.startDate ? new Date(cycles[0].startDate) : new Date();
                    const targetDate = subMonths(baseDate, index);
                    const label = index === 0 
                      ? "Current / Most Recent Cycle" 
                      : `Previous Cycle (${format(targetDate, 'MMMM')})`;
                    return (
                      <div key={index} className="p-4 rounded-xl border border-border/60 bg-muted/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">
                               {index === 0 ? "If started, enter date" : "Enter details"}
                            </p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveCycle(index)}
                            className="text-muted-foreground hover:text-destructive"
                            disabled={cycles.length <= 1} 
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">
                              Start Date
                            </label>
                            <Input
                              type="date"
                              value={cycle.startDate}
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => handleCycleChange(index, 'startDate', e.target.value)}
                              className="dark:bg-background/50"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">End Date</label>
                            <Input
                              type="date"
                              value={cycle.endDate}
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => handleCycleChange(index, 'endDate', e.target.value)}
                              className="dark:bg-background/50"
                            />
                          </div>
                          <div className="space-y-1 col-span-2">
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">Cycle Length (days)</label>
                            <Input
                              type="number"
                              min={15}
                              max={60}
                              value={cycle.cycleLength}
                              onChange={(e) => handleCycleChange(index, 'cycleLength', e.target.value)}
                              className="dark:bg-background/50"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between rounded-lg bg-muted/40 p-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    <span>
                      You have provided {completedCycles.length} cycle{completedCycles.length === 1 ? '' : 's'}.
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddCycle}
                    disabled={cycles.length >= MAX_CYCLES}
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add another month
                  </Button>
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    variant="calm"
                    className="flex-1"
                    onClick={() => setStep(2)}
                    disabled={bulkCreate.isPending}
                  >
                    Back
                  </Button>
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={handleSubmit}
                    disabled={bulkCreate.isPending}
                  >
                    {bulkCreate.isPending ? (
                      <span className="animate-pulse">Saving...</span>
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Review cycles
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-success/20">
                    <Check className="h-6 w-6 text-success" />
                  </div>
                  <div>
                    <CardTitle>Review & confirm</CardTitle>
                    <CardDescription>
                      Here’s what we imported. Everything look right?
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {submittedCycles.length === 0 ? (
                  <div className="p-4 rounded-lg bg-muted/40 text-sm text-muted-foreground">
                    We didn’t detect any cycles. Please go back and add them again.
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {submittedCycles.map((cycle, index) => (
                      <div
                        key={cycle.id ?? `${cycle.startDate}-${index}`}
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {format(new Date(cycle.startDate), 'MMMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cycle length: {cycle.cycleLength} day{cycle.cycleLength === 1 ? '' : 's'}
                          </p>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="calm" className="flex-1" onClick={() => setStep(3)}>
                    Back
                  </Button>
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={handleFinish}
                    disabled={submittedCycles.length === 0}
                  >
                    Complete setup
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reassurance */}
          <div className="text-center p-4 rounded-xl bg-sage/20 border border-sage/30">
            <p className="text-xs text-sage-foreground">
              💚 Your data stays private. You control what you share.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
