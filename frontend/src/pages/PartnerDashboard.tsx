import { useState } from 'react';
import { Heart, Lightbulb, Coffee, MessageCircle, Gift, Moon, Sparkles, HelpCircle, Loader, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { usePartnerSummary } from '@/hooks/api/partner';
import { usePartnerGuidance } from '@/hooks/api/ai';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/contexts/AuthContext';

const phaseInfo = {
  MENSTRUAL: {
    title: 'Menstrual Phase',
    description: 'A time of renewal and rest. Energy may be lower than usual.',
    color: 'phase-menstrual',
  },
  FOLLICULAR: {
    title: 'Follicular Phase',
    description: 'Energy is rising! A great time for new activities together.',
    color: 'phase-follicular',
  },
  OVULATION: {
    title: 'Ovulation Phase',
    description: 'Peak energy and sociability. Great for quality time!',
    color: 'phase-ovulatory',
  },
  LUTEAL: {
    title: 'Luteal Phase',
    description: 'Energy is winding down. Comfort and patience are appreciated.',
    color: 'phase-luteal',
  },
};

export default function PartnerDashboard() {
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = usePartnerSummary();
  const partnerGuidance = usePartnerGuidance();
  const { toast } = useToast();
  const [guidanceText, setGuidanceText] = useState<string | null>(null);

  const phaseKey = data?.cycle?.context.phase ?? 'MENSTRUAL';
  const phase = phaseInfo[phaseKey as keyof typeof phaseInfo];

  const sharedMood = data?.summaries.moodSummary;
  const sharedEnergy = data?.summaries.energySummary;

  const suggestions = [
    {
      icon: Coffee,
      title: 'Bring a comfort treat',
      description: 'Warm drinks or favorite snacks can feel extra soothing right now.',
      color: 'bg-peach/30',
    },
    {
      icon: Moon,
      title: 'Create a calm space',
      description: 'Offer a quiet evening in or gentle activities together.',
      color: 'bg-lavender/30',
    },
    {
      icon: MessageCircle,
      title: 'Check in kindly',
      description: 'Ask open questions and listen without trying to fix things.',
      color: 'bg-primary-soft',
    },
  ];

  const dailyTip = {
    icon: Gift,
    title: "Today's Tip",
    content: 'Tiny gestures matter—preparing a cozy spot, drawing a bath, or handling chores shows your care.',
  };

  const handleGuidance = async () => {
    try {
      const response = await partnerGuidance.mutateAsync();
      setGuidanceText(response.guidance);
    } catch (error) {
      toast({
        title: 'Unable to fetch guidance',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const consentAllowsGuidance = Boolean(data?.consent?.share_phase);

  return (
    <AppLayout title="Partner View">
      <div className="space-y-6 animate-fade-in">
        {isLoading && (
          <Card variant="soft">
            <CardContent className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Loader className="h-4 w-4 animate-spin" />
              Loading shared insights...
            </CardContent>
          </Card>
        )}

        {isError && (
          <Card variant="destructive">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Unable to load partner summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-destructive-foreground/80">
              <p>Please refresh to try again.</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </CardContent>
          </Card>
        )}

        {!isLoading && !data && !isError && (
          <Card variant="gradient" className="text-center py-12">
            <CardContent className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <CardTitle>No active connection</CardTitle>
              <CardDescription className="max-w-xs mx-auto">
                You are not connected to a partner yet.
              </CardDescription>
              <Button onClick={() => window.location.href = '/join'} className="mt-4">
                Enter Invite Code
              </Button>
            </CardContent>
          </Card>
        )}

        {data && (
          <>

            <div className="text-center pt-2">
              <h2 className="font-display text-2xl font-bold text-foreground">
                Hey {user?.name ? user.name.split(' ')[0] : 'there'} 💕
              </h2>
              <p className="text-muted-foreground mt-1 text-sm">
                Check in on {data.primaryUserName || 'your partner'} today
              </p>
            </div>

            <Card className="border-l-4 border-l-primary/50 shadow-sm mt-4">
               <CardContent className="flex items-center justify-between p-4">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                     {data.primaryUserName ? data.primaryUserName[0].toUpperCase() : 'P'}
                   </div>
                   <div>
                     <p className="font-semibold text-sm">Connected to {data.primaryUserName || 'Partner'}</p>
                     <p className="text-xs text-muted-foreground">Sharing is active</p>
                   </div>
                 </div>
                 <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                    onClick={async () => {
                      if(!confirm("Are you sure you want to unlink?")) return;
                      try {
                        await apiClient.post('/pairings/revoke', { pairingId: data.pairingId });
                        toast({ title: "Unlinked successfully" });
                        refetch();
                      } catch(e) { toast({ title: "Failed to unlink", variant: "destructive" }); }
                    }}
                 >
                   Unlink
                 </Button>
               </CardContent>
            </Card>

            {data.cycle && (
              <Card className="border-2 bg-phase-luteal/10 border-phase-luteal/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className={cn('h-5 w-5', `text-${phase.color}`)} />
                    {phase.title}
                  </CardTitle>
                  <CardDescription>
                    Day {data.cycle.context.currentDay} • {data.cycle.context.daysUntilNextPhase} days until the next phase
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{phase.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Shared Data Sections */}
            {(data.sharedData?.symptoms?.length > 0 || data.sharedData?.journals?.length > 0) && (
              <div className="space-y-4">
                {data.sharedData.symptoms.length > 0 && (
                  <Card variant="soft">
                    <CardHeader className="pb-2">
                       <CardTitle className="text-base">Recent Symptoms</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {data.sharedData.symptoms.slice(0, 3).map((log: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-sm p-2 bg-background/50 rounded-lg">
                           <span>{new Date(log.date).toLocaleDateString()}</span>
                           <div className="flex gap-2">
                             {log.pain > 0 && <span className="text-destructive">Pain: {log.pain}</span>}
                             {log.bloating && <span className="text-primary">Bloating</span>}
                             {/* Fallback if no specific symptoms */}
                             {log.pain === 0 && !log.bloating && <span className="text-muted-foreground">Logged</span>}
                           </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {data.sharedData.journals.length > 0 && (
                  <Card variant="soft">
                    <CardHeader className="pb-2">
                       <CardTitle className="text-base">Journal Entries</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {data.sharedData.journals.map((entry: any, i: number) => (
                        <div key={i} className="p-3 bg-background/50 rounded-lg text-sm">
                           <div className="flex justify-between mb-1 text-xs text-muted-foreground">
                             <span>{new Date(entry.date).toLocaleDateString()}</span>
                           </div>
                           {entry.ai_summary ? (
                             <p className="text-foreground">{entry.ai_summary}</p>
                           ) : (
                             <p className="italic text-muted-foreground">Written entry (Private)</p>
                           )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Card variant="lavender" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-lavender/30">
                    <Heart className="h-5 w-5 text-lavender-foreground" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Mood</span>
                    <span className="font-semibold text-foreground capitalize">
                      {data.consent?.share_mood_summary ? sharedMood ?? 'Not shared yet' : 'Not shared'}
                    </span>
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
                    <span className="font-semibold text-foreground capitalize">
                      {data.consent?.share_energy_summary ? sharedEnergy ?? 'Not shared yet' : 'Not shared'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            <Card variant="gradient">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">What does this mean?</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use these shared insights to offer the kind of support that feels best right now. Focus on gentle check-ins,
                  patience, and meeting your partner where they are today.
                </p>
              </CardContent>
            </Card>

            <div>
              <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Supportive actions
              </h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, i) => {
                  const Icon = suggestion.icon;
                  return (
                    <Card key={i} variant="default" className="overflow-hidden">
                      <CardContent className="flex items-start gap-4 py-4">
                        <div className={cn('p-3 rounded-xl shrink-0', suggestion.color)}>
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

            <Card variant="soft">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Need a gentle nudge?</CardTitle>
                <CardDescription>Get AI-powered guidance aligned with today’s phase.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleGuidance}
                  disabled={!consentAllowsGuidance || partnerGuidance.status === 'pending'}
                >
                  {partnerGuidance.status === 'pending' ? 'Fetching guidance...' : 'Ask for guidance'}
                </Button>
                {!consentAllowsGuidance && (
                  <p className="text-xs text-muted-foreground">
                    Your partner disabled phase sharing, so we can’t provide guidance right now.
                  </p>
                )}
                {guidanceText && (
                  <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground whitespace-pre-line">
                    {guidanceText}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground">
            💚 Only seeing what’s been shared. Respect their privacy.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
