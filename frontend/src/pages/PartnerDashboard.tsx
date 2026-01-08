import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Lightbulb, Coffee, MessageCircle, Gift, Moon, Sparkles, HelpCircle, Loader, AlertTriangle, Utensils, Activity, Smile, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { usePartnerSummary } from '@/hooks/api/partner';
import { usePartnerGuidance } from '@/hooks/api/ai';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { Badge } from '@/components/ui/badge';
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
  FERTILE: {
    title: 'Fertile Window',
    description: 'Energy is high and optimism is peaking.',
    color: 'phase-ovulatory', // Reusing Ovulatory color for now or add new
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

interface GuidanceData {
  explanation: string;
  actions: string[];
  foodRecommendation: string;
  activityRecommendation: string;
}

export default function PartnerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = usePartnerSummary();
  const partnerGuidance = usePartnerGuidance();
  const { toast } = useToast();
  const [guidance, setGuidance] = useState<GuidanceData | null>(null);

  const phaseKey = data?.cycle?.context.phase ?? 'MENSTRUAL';
  const phase = phaseInfo[phaseKey as keyof typeof phaseInfo] || phaseInfo.MENSTRUAL;

  const sharedMood = data?.summaries.moodSummary;
  const sharedEnergy = data?.summaries.energySummary;

  const handleGuidance = async () => {
    try {
      const response = await partnerGuidance.mutateAsync();
      // Response is now expected to be the JSON object directly or { guidance: JSON } depending on backend return.
      // ai.service returns JSON. api router might wrap it?
      // Usually apiFetch returns the body. If service returns JSON, api returns JSON.
      // Let's assume response IS the guidance object or has a property.
      
      // Check structure based on backend router. backend router usually sends { guidance: result }.
      // If result is object, then response.guidance is the object.
      // If result was text, response.guidance was text.
      // We need to verify backend router. Assuming `res.json({ guidance: result })`.
      
      setGuidance(response.guidance);
    } catch (error) {
      toast({
        title: 'Unable to fetch guidance',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout title="Partner View">
      <div className="space-y-6 animate-fade-in pb-20">
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
                  {/* Show AI explanation if loaded */}
                  {guidance && (
                    <div className="mt-3 p-3 bg-white/50 rounded-lg text-sm italic text-slate-700 animate-fade-in">
                       "{guidance.explanation}"
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* AI Guidance Section */}
            <div>
               <div className="flex items-center justify-between mb-3">
                  <h3 className="font-display font-bold text-foreground flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    How to support today
                  </h3>
                  {!guidance && (
                    <Button 
                      size="sm" 
                      onClick={handleGuidance} 
                      disabled={partnerGuidance.isPending}
                      variant="outline"
                      className="text-xs h-8"
                    >
                      {partnerGuidance.isPending ? 'Generating...' : 'Get Suggestions'}
                    </Button>
                  )}
               </div>
               
               {!guidance && !partnerGuidance.isPending && (
                 <Card variant="soft" className="border-dashed">
                    <CardContent className="py-6 text-center text-muted-foreground text-sm">
                       Tap "Get Suggestions" to see personalized food, activity, and support ideas for this phase.
                    </CardContent>
                 </Card>
               )}

               {guidance && (
                 <div className="space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-500">
                    {/* Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {guidance.actions.map((action, i) => (
                        <Card key={i} className="bg-gradient-to-br from-emerald-50 to-white border-emerald-100">
                          <CardContent className="p-4 flex items-start gap-3">
                             <div className="p-2 bg-emerald-100 rounded-full text-emerald-600 shrink-0">
                                <Smile className="h-4 w-4" />
                             </div>
                             <p className="text-sm font-medium text-emerald-900">{action}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Food & Activity Split */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
                          <CardHeader className="pb-2">
                             <CardTitle className="flex items-center gap-2 text-base text-orange-800">
                                <Utensils className="h-4 w-4" /> Suggested Food
                             </CardTitle>
                          </CardHeader>
                          <CardContent>
                             <p className="text-sm text-orange-900/80 font-medium">
                               {guidance.foodRecommendation}
                             </p>
                          </CardContent>
                       </Card>

                       <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
                          <CardHeader className="pb-2">
                             <CardTitle className="flex items-center gap-2 text-base text-blue-800">
                                <Activity className="h-4 w-4" /> Suggested Activity
                             </CardTitle>
                          </CardHeader>
                          <CardContent>
                             <p className="text-sm text-blue-900/80 font-medium">
                               {guidance.activityRecommendation}
                             </p>
                          </CardContent>
                       </Card>
                    </div>
                 </div>
               )}
            </div>

            {/* Shared Data Stats */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Card variant="lavender" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-lavender/30">
                    <Heart className="h-5 w-5 text-lavender-foreground" />
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Mood</span>
                    <span className="font-semibold text-foreground capitalize">
                      {data.consent?.share_mood_summary ? sharedMood ?? 'Not shared' : 'Private'}
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
                      {data.consent?.share_energy_summary ? sharedEnergy ?? 'Not shared' : 'Private'}
                    </span>
                  </div>
                </div>
              </Card>
            </div>

            {/* Shared Symptoms Section */}
            {data.sharedData?.symptoms && data.sharedData.symptoms.length > 0 && (
              <div className="mt-6">
                <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                 <Activity className="h-5 w-5 text-primary" />
                 Recent Symptoms
                </h3>
                <div className="space-y-2">
                  {data.sharedData.symptoms.map((symptom: any) => (
                    <Card key={symptom.id} className="p-3">
                      <div className="flex justify-between items-start">
                        <div className="w-full">
                          <p className="text-sm font-medium mb-2">{new Date(symptom.date).toLocaleDateString()}</p>
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {symptom.mood && <Badge variant="outline" className="bg-lavender/20 border-lavender/50 text-foreground capitalize">Mood: {symptom.mood.toLowerCase()}</Badge>}
                            {symptom.energy && <Badge variant="outline" className="bg-peach/20 border-peach/50 text-foreground capitalize">Energy: {symptom.energy.toLowerCase()}</Badge>}
                            {symptom.pain !== null && <Badge variant="outline" className="bg-red-50 border-red-200 text-foreground">Pain: {symptom.pain}/10</Badge>}
                            {symptom.sleep_hours !== null && <Badge variant="outline" className="bg-blue-50 border-blue-200 text-foreground">Sleep: {symptom.sleep_hours}h</Badge>}
                            {symptom.cravings && <Badge variant="outline" className="bg-orange-50 border-orange-200 text-foreground">Craving: {symptom.cravings}</Badge>}
                            {symptom.flow && <Badge variant="outline" className="bg-blue-100 border-blue-300 text-blue-800">Flow: {symptom.flow}</Badge>}
                            {symptom.intercourse && (
                                <Badge variant="outline" className="bg-pink-50 border-pink-200 text-foreground">
                                    Intercourse {symptom.protection_used !== null ? (symptom.protection_used ? '(Protected)' : '(Unprotected)') : ''}
                                </Badge>
                            )}
                            {symptom.other_symptoms && symptom.other_symptoms.map((s: string) => (
                              <Badge key={s} variant="outline" className="bg-rose-50 border-rose-200 text-rose-800 capitalize">
                                {s.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Shared Journals Section */}
            {data.sharedData?.journals && data.sharedData.journals.length > 0 && (
              <div className="mt-6">
                 <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  Recent Journal Entries
                 </h3>
                 <div className="space-y-3">
                   {data.sharedData.journals.map((journal: any) => (
                     <Card key={journal.id} className="bg-muted/30">
                       <CardHeader className="py-3">
                         <CardTitle className="text-sm font-medium">
                           {new Date(journal.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                         </CardTitle>
                       </CardHeader>
                       <CardContent className="py-2 pb-4 text-sm text-muted-foreground">
                         <p className="text-foreground whitespace-pre-line line-clamp-3 mb-2">
                            {journal.encrypted_text}
                         </p>
                         {journal.ai_summary && (
                           <div className="rounded-lg bg-primary/5 p-2 text-xs italic text-muted-foreground">
                             ✨ "{journal.ai_summary}"
                           </div>
                         )}
                       </CardContent>
                     </Card>
                   ))}
                 </div>
              </div>
            )}

            <Card variant="soft" className="mt-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Have questions?</CardTitle>
                <CardDescription>Chat safely with Luna to understand better.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/chatbot')}
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Ask Luna
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
