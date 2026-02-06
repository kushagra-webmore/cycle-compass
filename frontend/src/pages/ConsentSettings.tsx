import { Shield, Eye, Heart, Battery, BookOpen, AlertTriangle, UserX, User, Loader, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { usePairing, useUpdateConsent, useRevokePairing } from '@/hooks/api/pairing';

const consentFields = [
  {
    id: 'share_phase' as const,
    label: 'Share Phase',
    description: 'Let your partner see your current cycle phase',
    icon: Eye,
  },
  {
    id: 'share_mood_summary' as const,
    label: 'Share Mood Summary',
    description: 'Share a general overview of your mood',
    icon: Heart,
  },
  {
    id: 'share_energy_summary' as const,
    label: 'Share Energy Summary',
    description: 'Let your partner know your energy levels',
    icon: Battery,
  },
  {
    id: 'share_symptoms' as const,
    label: 'Share Symptoms',
    description: 'Share logged symptoms with your partner',
    icon: Shield,
  },
  {
    id: 'share_journals' as const,
    label: 'Share Journals',
    description: 'Allow partner to read your journal entries',
    icon: BookOpen,
  },
  {
    id: 'share_my_cycle' as const,
    label: 'Share My Cycle',
    description: 'Share your cycle history and calendar',
    icon: Calendar,
  },
];

export default function ConsentSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  // usePairing now returns an array
  const { data: pairings = [], isLoading, isError, refetch } = usePairing();
  const updateConsent = useUpdateConsent();
  const revokePairing = useRevokePairing();

  // Filter active pairings if needed, though backend returns active only
  const activePairings = Array.isArray(pairings) ? pairings : [];
  const hasPartner = activePairings.length > 0;

  const handleToggle = async (pairingId: string, key: (typeof consentFields)[number]['id'], value: boolean) => {
    const payloadKey =
      key === 'share_phase'
        ? 'sharePhase'
        : key === 'share_mood_summary'
        ? 'shareMoodSummary'
        : key === 'share_energy_summary'
        ? 'shareEnergySummary'
        : key === 'share_symptoms'
        ? 'shareSymptoms'
        : key === 'share_journals'
        ? 'shareJournals'
        : 'shareMyCycle';

    try {
      await updateConsent.mutateAsync({ pairingId, [payloadKey]: value });
      toast({ title: 'Settings updated', description: 'Your consent preferences have been saved.' });
    } catch (error) {
      toast({
        title: 'Unable to update consent',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async (pairingId: string) => {
    try {
      await revokePairing.mutateAsync(pairingId);
      toast({ title: 'Access revoked', description: 'Your partner no longer has access to shared data.' });
    } catch (error) {
      toast({
        title: 'Unable to revoke access',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Consent & Privacy">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading your consent preferences...</p>
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout title="Consent & Privacy">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <div className="space-y-1 text-center">
            <p className="font-medium text-foreground">We couldn't load your consent settings.</p>
            <p className="text-sm text-muted-foreground">Please try refreshing or come back later.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Consent & Privacy">
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-sage/30 flex items-center justify-center">
            <Shield className="h-8 w-8 text-sage-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Your Privacy, Your Control
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Decide exactly what information you want to share. Changes apply instantly.
          </p>
        </div>

        {/* Global Warning */}
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Changes Apply Instantly</p>
              <p className="text-xs text-muted-foreground mt-1">
                When you toggle a setting off, access is removed immediately. No waiting period.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* List of Partners */}
        {!hasPartner && (
            <div className="text-center p-8 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">No active partners connected.</p>
                <Button variant="link" asChild className="mt-2">
                    <a href="/connect">Connect a Partner</a>
                </Button>
            </div>
        )}

        {activePairings.map((pairing) => {
           // Calculate consents for THIS pairing instance
           const currentConsents = consentFields.map((field) => ({
             ...field,
             enabled: Boolean(pairing?.consent?.[field.id]),
           }));

           return (
             <div key={pairing.id} className="space-y-6">
                {/* Partner Status Card */}
                <Card className="bg-gradient-to-r from-violet-100 to-fuchsia-100 border-2 border-violet-200 dark:from-violet-900/30 dark:to-fuchsia-900/30 dark:border-violet-700 shadow-md">
                    <CardContent className="flex items-center gap-4 py-4">
                    <Avatar className="h-12 w-12 border-2 border-white/50 shadow-sm">
                        <AvatarImage src={(user?.role === 'primary' ? pairing?.partnerAvatar : pairing?.primaryUserAvatar) || undefined} className="object-cover" />
                        <AvatarFallback className="bg-lavender/50 text-lavender-foreground font-semibold">
                            {((user?.role === 'primary' ? pairing?.partnerUserName : pairing?.primaryUserName) || 'U')[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="font-semibold text-foreground">
                        {user?.role === 'primary' ? 'Partner Connected' : 'Connected With'}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                        {(user?.role === 'primary' ? pairing?.partnerUserName : pairing?.primaryUserName) || 
                        (user?.role === 'primary' ? pairing?.partner_user_id : pairing?.primary_user_id) || 
                        'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                        {(user?.role === 'primary' ? pairing?.partnerUserEmail : pairing?.primaryUserEmail) || 'No email'}
                        </p>
                    </div>
                    </CardContent>
                </Card>

                {/* Consent Toggles for THIS Partner */}
                <Card variant="elevated">
                <CardHeader>
                    <CardTitle className="text-base text-lg text-primary">Sharing Preferences</CardTitle>
                    <CardDescription>Control what <strong>{pairing.partnerUserName || 'this partner'}</strong> can see</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {user?.role === 'primary' ? (
                    currentConsents.map((consent) => {
                        const Icon = consent.icon;
                        return (
                        <div
                            key={consent.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                                <Icon className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="font-medium text-sm text-foreground">{consent.label}</p>
                                <p className="text-xs text-muted-foreground">{consent.description}</p>
                            </div>
                            </div>
                            <Switch
                            checked={consent.enabled}
                            disabled={updateConsent.isPending}
                            onCheckedChange={(checked) => handleToggle(pairing.id, consent.id, checked)}
                            />
                        </div>
                        );
                    })
                    ) : (
                    <div className="py-6 text-center text-muted-foreground">
                        <p>Your partner controls what information is shared with you.</p>
                    </div>
                    )}
                    
                    {/* Revoke for THIS partner */}
                    {user?.role === 'primary' && (
                        <div className="pt-4 mt-4 border-t">
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                <Button variant="ghost" className="w-full text-destructive hover:text-destructive hover:bg-destructive/10">
                                    <UserX className="h-4 w-4 mr-2" />
                                    Revoke Access for {pairing.partnerUserName || 'Partner'}
                                </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Revoke Access?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                    This will immediately remove access for {pairing.partnerUserName || 'this partner'}.
                                    They will need a new invite to reconnect.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleRevoke(pairing.id)} className="bg-destructive text-destructive-foreground">
                                    Yes, Revoke
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    )}
                </CardContent>
                </Card>
             </div>
           );
        })}

        {/* Reassurance */}
        <div className="text-center p-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 mt-6">
          <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
            🔒 You are always in control. Your data, your decisions.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
