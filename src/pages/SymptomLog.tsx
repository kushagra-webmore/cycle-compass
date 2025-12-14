import { useState } from 'react';
import { Save, Droplets, Heart, Battery, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const moodOptions = [
  { value: 'great', emoji: '😊', label: 'Great' },
  { value: 'good', emoji: '🙂', label: 'Good' },
  { value: 'okay', emoji: '😐', label: 'Okay' },
  { value: 'low', emoji: '😔', label: 'Low' },
  { value: 'anxious', emoji: '😰', label: 'Anxious' },
];

const energyOptions = [
  { value: 'high', emoji: '⚡', label: 'High' },
  { value: 'moderate', emoji: '🔋', label: 'Moderate' },
  { value: 'low', emoji: '😴', label: 'Low' },
  { value: 'exhausted', emoji: '💤', label: 'Exhausted' },
];

export default function SymptomLog() {
  const [pain, setPain] = useState([3]);
  const [mood, setMood] = useState('');
  const [energy, setEnergy] = useState('');
  const [sleep, setSleep] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((r) => setTimeout(r, 1000));
    
    toast({
      title: "Entry saved! 🌸",
      description: "Your symptoms have been logged for today.",
    });
    setIsSaving(false);
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
        {/* Date Header */}
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-foreground">
            How are you feeling today?
          </h2>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Pain Level */}
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
              <Slider
                value={pain}
                onValueChange={setPain}
                max={10}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">0</span>
              <span className={cn(
                "font-semibold px-3 py-1 rounded-full",
                pain[0] <= 3 ? "bg-sage/30 text-sage-foreground" :
                pain[0] <= 6 ? "bg-peach/30 text-peach-foreground" :
                "bg-destructive/20 text-destructive"
              )}>
                {pain[0]} - {getPainLabel(pain[0])}
              </span>
              <span className="text-muted-foreground">10</span>
            </div>
          </CardContent>
        </Card>

        {/* Mood */}
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
              {moodOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setMood(option.value)}
                  className={cn(
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 flex-1 min-w-[60px]",
                    mood === option.value
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Energy */}
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
                    "flex flex-col items-center gap-1 p-3 rounded-xl transition-all duration-200 flex-1",
                    energy === option.value
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sleep */}
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
              {['Great', 'Good', 'Poor', 'Bad'].map((option) => (
                <button
                  key={option}
                  onClick={() => setSleep(option.toLowerCase())}
                  className={cn(
                    "p-3 rounded-xl text-sm font-medium transition-all duration-200",
                    sleep === option.toLowerCase()
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          variant="gradient"
          size="xl"
          className="w-full"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Entry
            </>
          )}
        </Button>

        {/* Reassurance */}
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground">
            🌸 All entries are private. You're doing great by tracking!
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
