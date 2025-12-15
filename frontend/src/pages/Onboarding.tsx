import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, ChevronRight, SkipForward, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/layout/ThemeToggle';

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const totalSteps = 2;

  const handleComplete = () => {
    updateUser({
      onboardingCompleted: true,
      lastPeriodDate,
      cycleLength,
    });
    toast({
      title: "You're all set! 🌸",
      description: "Your cycle companion is ready to support you.",
    });
    navigate('/dashboard');
  };

  const handleSkip = () => {
    updateUser({ onboardingCompleted: true });
    toast({
      title: "No worries!",
      description: "You can add this information anytime from settings.",
    });
    navigate('/dashboard');
  };

  const cycleLengthOptions = [21, 25, 26, 27, 28, 29, 30, 31, 32, 35];

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
            {[1, 2].map((s) => (
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

          {/* Step 1: Last Period Date */}
          {step === 1 && (
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary-soft">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>When did your last period start?</CardTitle>
                    <CardDescription>An approximate date is perfectly fine</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  type="date"
                  value={lastPeriodDate}
                  onChange={(e) => setLastPeriodDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full p-4 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                
                <div className="flex gap-3">
                  <Button
                    variant="calm"
                    className="flex-1"
                    onClick={handleSkip}
                  >
                    <SkipForward className="h-4 w-4 mr-2" />
                    Skip for now
                  </Button>
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={() => setStep(2)}
                    disabled={!lastPeriodDate}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Cycle Length */}
          {step === 2 && (
            <Card variant="elevated" className="animate-slide-up">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-lavender/30">
                    <Sparkles className="h-6 w-6 text-lavender-foreground" />
                  </div>
                  <div>
                    <CardTitle>What's your average cycle length?</CardTitle>
                    <CardDescription>Most cycles are between 21-35 days</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-5 gap-2">
                  {cycleLengthOptions.map((length) => (
                    <button
                      key={length}
                      onClick={() => setCycleLength(length)}
                      className={cn(
                        "h-12 rounded-xl font-semibold transition-all duration-200",
                        cycleLength === length
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      {length}
                    </button>
                  ))}
                </div>
                
                <p className="text-center text-sm text-muted-foreground">
                  Selected: <strong>{cycleLength} days</strong>
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="calm"
                    className="flex-1"
                    onClick={() => setStep(1)}
                  >
                    Back
                  </Button>
                  <Button
                    variant="gradient"
                    className="flex-1"
                    onClick={handleComplete}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Complete Setup
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
