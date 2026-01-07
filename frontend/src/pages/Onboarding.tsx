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
  const [error, setError] = useState<string | null>(null);
  const [submittedCycles, setSubmittedCycles] = useState<ImportedCycle[]>([]);
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bulkCreate = useBulkCreateCycles();

  const totalSteps = 3;
  const MIN_CYCLES = 2;
  const DEFAULT_CYCLES = 6;
  const MAX_CYCLES = 12;

  const generateCycle = (monthsAgo: number) => ({
    startDate: format(subMonths(new Date(), monthsAgo), 'yyyy-MM-dd'),
    endDate: '',
    cycleLength: 28,
  });

  const [cycles, setCycles] = useState(() =>
    Array.from({ length: DEFAULT_CYCLES }, (_, index) => generateCycle(index)),
  );

  const completedCycles = useMemo(
    () => cycles.filter((cycle) => Boolean(cycle.startDate)),
    [cycles],
  );

  const handleCycleChange = (index: number, field: 'startDate' | 'endDate' | 'cycleLength', value: string) => {
    setCycles((prev) =>
      prev.map((cycle, i) =>
        i === index
          ? {
              ...cycle,
              [field]: field === 'cycleLength' ? Number(value) || 0 : value,
            }
          : cycle,
      ),
    );
  };

  const handleAddCycle = () => {
    if (cycles.length >= MAX_CYCLES) return;
    setCycles((prev) => [...prev, generateCycle(prev.length)]);
  };

  const handleRemoveCycle = (index: number) => {
    if (index < MIN_CYCLES) return;
    setCycles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateCycles = () => {
    if (completedCycles.length < MIN_CYCLES) {
      return 'Please provide at least your two most recent cycles.';
    }

    const invalid = completedCycles.slice(0, MIN_CYCLES).some((cycle) => !cycle.startDate);
    if (invalid) {
      return 'Your two most recent cycles need a start date.';
    }

    const futureDates = completedCycles.some((cycle) => new Date(cycle.startDate) > new Date());
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
      setStep(3);
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
      console.log('Starting onboarding completion...');
      
      // Invalidate all queries to ensure fresh data
      console.log('Invalidating queries...');
      await queryClient.invalidateQueries();
      
      // Update the user's onboarding status
      console.log('Updating user with onboardingCompleted: true');
      const updates = { 
        onboardingCompleted: true,
        lastPeriodDate: cycles[0]?.startDate, // Use the most recent cycle's start date
        cycleLength: cycles[0]?.cycleLength || 28 // Default to 28 if not set
      };
      
      console.log('Sending user updates:', updates);
      const updatedUser = await updateUser(updates);
      console.log('User update response:', updatedUser);
      
      if (!updatedUser?.onboardingCompleted) {
        console.warn('onboardingCompleted flag not set in response');
        // Continue anyway as the update might have succeeded but response is incomplete
      }
      
      // Force a refresh of the auth state
      console.log('Refreshing auth state...');
      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      
      // Show success message
      toast({
        title: "You're all set! 🌸",
        description: 'Your cycle companion is ready to support you.',
      });
      
      console.log('Navigation to dashboard...');
      // Navigate to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
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
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-peach flex items-center justify-center shadow-soft">
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

          {/* Step 1: Introduction */}
          {step === 1 && (
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary-soft">
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

                <Button variant="gradient" className="w-full" onClick={() => setStep(2)}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Cycle History */}
          {step === 2 && (
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
                <div className="space-y-3">
                  {cycles.map((cycle, index) => {
                    const isMandatory = index < MIN_CYCLES;
                    const label = format(subMonths(new Date(), index), 'MMMM yyyy');
                    return (
                      <div key={index} className="p-4 rounded-xl border border-border/60 bg-background/80 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-foreground">{label}</p>
                            <p className="text-xs text-muted-foreground">
                              {isMandatory ? 'Required' : 'Optional'} entry
                            </p>
                          </div>
                          {!isMandatory && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCycle(index)}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">
                              Start Date{isMandatory && ' *'}
                            </label>
                            <Input
                              type="date"
                              value={cycle.startDate}
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => handleCycleChange(index, 'startDate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">End Date</label>
                            <Input
                              type="date"
                              value={cycle.endDate}
                              max={new Date().toISOString().split('T')[0]}
                              onChange={(e) => handleCycleChange(index, 'endDate', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-xs uppercase tracking-wide text-muted-foreground">Cycle Length (days)</label>
                            <Input
                              type="number"
                              min={15}
                              max={60}
                              value={cycle.cycleLength}
                              onChange={(e) => handleCycleChange(index, 'cycleLength', e.target.value)}
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
                    onClick={() => setStep(1)}
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

          {/* Step 3: Confirmation */}
          {step === 3 && (
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
                        className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-xl border border-border/60 bg-background/80 px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {format(new Date(cycle.startDate), 'MMMM d, yyyy')}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Cycle length: {cycle.cycleLength} day{cycle.cycleLength === 1 ? '' : 's'}
                          </p>
                        </div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                          {cycle.phase ? `${cycle.phase.toLowerCase()} phase` : 'Phase pending'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="calm" className="flex-1" onClick={() => setStep(2)}>
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
