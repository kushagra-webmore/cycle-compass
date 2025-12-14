import { useState } from 'react';
import { Copy, QrCode, Link2, Heart, Shield, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';

export default function PartnerConnect() {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  // Generate mock data
  const inviteLink = 'https://cycle-aware.app/invite/abc123';
  const pairingCode = '847291';

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: "Copied! 📋",
      description: `${type === 'link' ? 'Invite link' : 'Pairing code'} copied to clipboard.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <AppLayout title="Partner Connection">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-full bg-lavender/30 flex items-center justify-center">
            <Heart className="h-8 w-8 text-lavender-foreground" />
          </div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Connect with Your Partner
          </h2>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Share selected insights with someone you trust. You control exactly what they see.
          </p>
        </div>

        {/* Privacy Notice */}
        <Card variant="sage" className="border-2 border-sage/50">
          <CardContent className="flex items-start gap-3 py-4">
            <Shield className="h-5 w-5 text-sage-foreground shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-sage-foreground">Privacy First</p>
              <p className="text-xs text-muted-foreground mt-1">
                Your partner will only see what you explicitly share. You can revoke access anytime.
                Symptom details, journals, and personal notes remain private by default.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Invite Link */}
        <Card variant="elevated">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-soft">
                <Link2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Invite Link</CardTitle>
                <CardDescription>Share this link with your partner</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg bg-muted text-sm text-foreground border border-border"
              />
              <Button
                variant={copied === 'link' ? 'sage' : 'default'}
                size="icon"
                onClick={() => handleCopy(inviteLink, 'link')}
              >
                {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* QR Code */}
        <Card variant="gradient">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-lavender/30">
                <QrCode className="h-5 w-5 text-lavender-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">QR Code</CardTitle>
                <CardDescription>Let your partner scan this</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-40 h-40 bg-card rounded-xl flex items-center justify-center border-2 border-border">
              {/* Mock QR Code */}
              <div className="w-32 h-32 grid grid-cols-8 gap-0.5">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className={`rounded-sm ${Math.random() > 0.5 ? 'bg-foreground' : 'bg-transparent'}`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pairing Code */}
        <Card variant="lavender">
          <CardHeader>
            <CardTitle className="text-base text-center">6-Digit Pairing Code</CardTitle>
            <CardDescription className="text-center">
              Your partner can enter this code in their app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-center gap-2">
              {pairingCode.split('').map((digit, i) => (
                <div
                  key={i}
                  className="w-12 h-14 rounded-xl bg-card border-2 border-primary/30 flex items-center justify-center"
                >
                  <span className="text-2xl font-bold font-display text-foreground">{digit}</span>
                </div>
              ))}
            </div>
            <Button
              variant={copied === 'code' ? 'sage' : 'soft'}
              className="w-full"
              onClick={() => handleCopy(pairingCode, 'code')}
            >
              {copied === 'code' ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Code
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* What Partners See */}
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-base">What can partners see?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-sage" />
                Current phase (if you enable it)
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-sage" />
                Mood summary (if you enable it)
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-sage" />
                Energy levels (if you enable it)
              </li>
              <li className="flex items-center gap-2 text-muted-foreground">
                <span className="w-2 h-2 rounded-full bg-destructive" />
                Never: Specific symptoms, journals, or personal notes
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Reassurance */}
        <div className="text-center p-4 rounded-xl bg-primary-soft">
          <p className="text-sm font-medium text-primary">
            💕 You are in control of what you share
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
