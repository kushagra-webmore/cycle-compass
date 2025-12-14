import { useState } from 'react';
import { Shield, Eye, Heart, Battery, BookOpen, AlertTriangle, UserX, User } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

interface ConsentToggle {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  enabled: boolean;
}

export default function ConsentSettings() {
  const { toast } = useToast();
  
  const [consents, setConsents] = useState<ConsentToggle[]>([
    {
      id: 'phase',
      label: 'Share Phase',
      description: 'Let your partner see your current cycle phase',
      icon: Eye,
      enabled: true,
    },
    {
      id: 'mood',
      label: 'Share Mood Summary',
      description: 'Share a general overview of your mood',
      icon: Heart,
      enabled: true,
    },
    {
      id: 'energy',
      label: 'Share Energy Summary',
      description: 'Let your partner know your energy levels',
      icon: Battery,
      enabled: false,
    },
    {
      id: 'symptoms',
      label: 'Share Symptoms',
      description: 'Share logged symptoms with your partner',
      icon: Shield,
      enabled: false,
    },
    {
      id: 'journals',
      label: 'Share Journals',
      description: 'Allow partner to read your journal entries',
      icon: BookOpen,
      enabled: false,
    },
  ]);

  const [hasPartner] = useState(true); // Mock data

  const toggleConsent = (id: string) => {
    setConsents((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, enabled: !c.enabled } : c
      )
    );
    toast({
      title: "Settings updated",
      description: "Your consent preferences have been saved.",
    });
  };

  const handleRevoke = () => {
    toast({
      title: "Access revoked",
      description: "Your partner no longer has access to any shared data.",
    });
  };

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
                <p className="font-semibold text-foreground">Partner Connected</p>
                <p className="text-xs text-muted-foreground">partner@example.com</p>
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
            {consents.map((consent) => {
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
                    onCheckedChange={() => toggleConsent(consent.id)}
                  />
                </div>
              );
            })}
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
        {hasPartner && (
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
