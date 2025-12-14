import { Heart, Lightbulb, Coffee, MessageCircle, Gift, Moon, Sparkles, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';

export default function PartnerDashboard() {
  // Mock data - in reality would come from shared data
  const hasSharedData = true;
  const currentPhase: 'menstrual' | 'follicular' | 'ovulatory' | 'luteal' = 'luteal';
  const sharedMood = 'okay';
  const sharedEnergy = 'low';

  const phaseInfo = {
    menstrual: {
      title: 'Menstrual Phase',
      description: 'A time of renewal and rest. Energy may be lower than usual.',
      color: 'phase-menstrual',
    },
    follicular: {
      title: 'Follicular Phase',
      description: 'Energy is rising! A great time for new activities together.',
      color: 'phase-follicular',
    },
    ovulatory: {
      title: 'Ovulatory Phase',
      description: 'Peak energy and sociability. Great for quality time!',
      color: 'phase-ovulatory',
    },
    luteal: {
      title: 'Luteal Phase',
      description: 'Energy is winding down. Comfort and patience are appreciated.',
      color: 'phase-luteal',
    },
  };

  const suggestions = [
    {
      icon: Coffee,
      title: 'Bring her favorite warm drink',
      description: 'Comfort foods and warm beverages can help during this phase.',
      color: 'bg-peach/30',
    },
    {
      icon: Moon,
      title: 'Suggest a quiet evening in',
      description: 'Low-key activities might be more appealing right now.',
      color: 'bg-lavender/30',
    },
    {
      icon: MessageCircle,
      title: 'Ask how she\'s feeling',
      description: 'Simple check-ins show you care. Listen without trying to fix.',
      color: 'bg-primary-soft',
    },
  ];

  const dailyTip = {
    icon: Gift,
    title: "Today's Tip",
    content: "Small gestures matter most. A gentle backrub, making dinner, or just sitting together can mean a lot during this time.",
  };

  const phase = phaseInfo[currentPhase as keyof typeof phaseInfo];

  return (
    <AppLayout title="Partner View">
      <div className="space-y-6 animate-fade-in">
        {hasSharedData ? (
          <>
            {/* Greeting */}
            <div className="text-center pt-2">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Hey there, partner 💕
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Here's how you can be supportive today
              </p>
            </div>

            {/* Phase Summary */}
            <Card className="border-2 bg-phase-luteal/10 border-phase-luteal/30">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className={cn(
                    "h-5 w-5",
                    `text-${phase.color}`
                  )} />
                  {phase.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{phase.description}</p>
              </CardContent>
            </Card>

            {/* Shared Status */}
            <div className="grid grid-cols-2 gap-3">
              <Card variant="lavender" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-lavender/30">
                    <Heart className="h-5 w-5 text-lavender-foreground" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Mood</span>
                    <span className="font-semibold text-foreground capitalize">{sharedMood}</span>
                  </div>
                </div>
              </Card>
              <Card variant="peach" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-peach/30">
                    <Moon className="h-5 w-5 text-peach-foreground" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Energy</span>
                    <span className="font-semibold text-foreground capitalize">{sharedEnergy}</span>
                  </div>
                </div>
              </Card>
            </div>

            {/* What This Means */}
            <Card variant="gradient">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">What does this mean?</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  During the luteal phase, hormones are shifting and energy tends to decrease.
                  She might feel more tired, emotional, or in need of comfort. This is completely normal
                  and understanding this can help you be more supportive.
                </p>
              </CardContent>
            </Card>

            {/* Supportive Actions */}
            <div>
              <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Supportive Actions
              </h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, i) => {
                  const Icon = suggestion.icon;
                  return (
                    <Card key={i} variant="default" className="overflow-hidden">
                      <CardContent className="flex items-start gap-4 py-4">
                        <div className={cn("p-3 rounded-xl shrink-0", suggestion.color)}>
                          <Icon className="h-5 w-5 text-foreground" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground text-sm">{suggestion.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Daily Tip */}
            <Card variant="sage" className="border-2 border-sage/50">
              <CardContent className="flex items-start gap-4 py-4">
                <div className="p-3 rounded-xl bg-sage/30 shrink-0">
                  <Gift className="h-5 w-5 text-sage-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-sage-foreground text-sm">{dailyTip.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{dailyTip.content}</p>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Empty State */
          <Card variant="gradient" className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>Waiting for Shared Data</CardTitle>
              <CardDescription className="max-w-xs mx-auto">
                Your partner hasn't shared any insights yet. Once they do, you'll see helpful
                information here.
              </CardDescription>
            </CardContent>
          </Card>
        )}

        {/* Privacy Reminder */}
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground">
            💚 Only seeing what they've chosen to share. Respect their privacy.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
