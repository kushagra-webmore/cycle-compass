import { Shield, Eye, Heart, Battery, BookOpen, AlertTriangle, UserX, User, Loader } from 'lucide-react';
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
];

export default function ConsentSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: pairing, isLoading, isError, refetch } = usePairing();
  const updateConsent = useUpdateConsent();
  const revokePairing = useRevokePairing();
  const hasPartner = Boolean(pairing && pairing.status === 'ACTIVE' && pairing.partnerUserId);
  const consents = consentFields.map((field) => ({
    ...field,
    enabled: Boolean(pairing?.consent?.[field.id]),
  }));

  const handleToggle = async (key: (typeof consentFields)[number]['id'], value: boolean) => {
    if (!pairing?.id) return;

    const payloadKey =
      key === 'share_phase'
        ? 'sharePhase'
        : key === 'share_mood_summary'
        ? 'shareMoodSummary'
        : key === 'share_energy_summary'
        ? 'shareEnergySummary'
        : key === 'share_symptoms'
        ? 'shareSymptoms'
        : 'shareJournals';

    try {
      await updateConsent.mutateAsync({ pairingId: pairing.id, [payloadKey]: value });
      toast({ title: 'Settings updated', description: 'Your consent preferences have been saved.' });
    } catch (error) {
      toast({
        title: 'Unable to update consent',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleRevoke = async () => {
    if (!pairing?.id) return;
    try {
      await revokePairing.mutateAsync(pairing.id);
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

  if (pairing) {
    console.log('Pairing data received:', pairing);
  }

  return (
    <AppLayout title="Consent & Privacy">
      <div className="space-y-6 animate-fade-in">
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

        {/* Partner Status */}
        {hasPartner && (
          <Card variant="lavender">
            <CardContent className="flex items-center gap-4 py-4">
              <div className="w-12 h-12 rounded-full bg-lavender/50 flex items-center justify-center">
                <User className="h-6 w-6 text-lavender-foreground" />
              </div>
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
        )}

        {/* Consent Toggles */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="text-base">Sharing Preferences</CardTitle>
            <CardDescription>Toggle what your partner can see</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.role === 'primary' ? (
              consents.map((consent) => {
              const Icon = consent.icon;
              return (
                <div
                  key={consent.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary-soft">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{consent.label}</p>
                      <p className="text-xs text-muted-foreground">{consent.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={consent.enabled}
                    disabled={!hasPartner || updateConsent.isPending}
                    onCheckedChange={(checked) => handleToggle(consent.id, checked)}
                  />
                </div>
              );
            })
            ) : (
              <div className="py-6 text-center text-muted-foreground">
                <p>Your partner controls what information is shared with you.</p>
              </div>
            )}
            
          </CardContent>
        </Card>

        {/* Important Notice */}
        <Card variant="peach" className="border-2 border-peach/50">
          <CardContent className="flex items-start gap-3 py-4">
            <AlertTriangle className="h-5 w-5 text-peach-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-peach-foreground">Changes Apply Instantly</p>
              <p className="text-xs text-muted-foreground mt-1">
                When you toggle a setting off, your partner immediately loses access to that information.
                There's no delay or waiting period.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Revoke Access */}
        {hasPartner && user?.role === 'primary' && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="lg" className="w-full">
                <UserX className="h-4 w-4 mr-2" />
                Revoke All Access
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Revoke Partner Access?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will immediately remove your partner's access to all shared information.
                  They will need a new invite to reconnect.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRevoke} className="bg-destructive text-destructive-foreground">
                  Yes, Revoke Access
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {/* Reassurance */}
        <div className="text-center p-4 rounded-xl bg-sage/20 border border-sage/30">
          <p className="text-sm font-medium text-sage-foreground">
            🔒 You are always in control. Your data, your decisions.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
