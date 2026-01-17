import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { Copy, QrCode, Link2, Heart, Shield, Check, UserCheck, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useConfirm } from '@/components/ui/confirm-dialog';

interface PairingData {
  id: string;
  status: 'active' | 'pending' | 'revoked';
  partnerName?: string;
  partnerUserId?: string;
}

export default function PartnerConnect() {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const [activePairings, setActivePairings] = useState<PairingData[]>([]);
  const [inviteLink, setInviteLink] = useState('');
  const [pairingCode, setPairingCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [isRevoking, setIsRevoking] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      // Check for existing active pairing
      try {
        const { data: pairings } = await apiClient.get<PairingData[]>('/pairings/me');
        if (pairings && Array.isArray(pairings) && pairings.length > 0) {
          // Filter only active ones just in case
          const active = pairings.filter(p => p.status === 'active');
          setActivePairings(active);
          setLoading(false);
          // Don't return here, we might still want to show invite options or generate a new invite for MORE partners?
          // If we want to allow adding multiple, we should proceed to generate invite.
        }
      } catch (e) {
        // Ignore 404 or missing
      }

      // If no active pairing, generate invite
      const { data } = await apiClient.post<{ 
        inviteLink: string; 
        pairCode: string; 
        expiresAt: string 
      }>('/pairings/create', { method: 'ALL' });

      setInviteLink(data.inviteLink);
      setPairingCode(data.pairCode);
    } catch (error) {
      console.error('Failed to init connect page:', error);
      toast({
        title: 'Error',
        description: 'Failed to load connection settings.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    toast({
      title: "Copied! 📋",
      description: `${type === 'link' ? 'Invite link' : 'Pairing code'} copied to clipboard.`,
    });
    setTimeout(() => setCopied(null), 2000);
  };

  const handleUnlink = async (pairingId: string) => {
    if (!await confirm({ title: "Disconnect Partner", description: "Are you sure you want to disconnect? Your partner will lose access to your shared data.", variant: "destructive" })) return;

    setIsRevoking(true);
    try {
      await apiClient.post('/pairings/revoke', { pairingId });
      toast({
        title: 'Disconnected',
        description: 'You have successfully unlinked from your partner.',
      });
      // Remove locally
      setActivePairings(prev => prev.filter(p => p.id !== pairingId));
      // Reload to generate new invite
      checkStatus();
    } catch (error) {
      toast({
        title: 'Failed to disconnect',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRevoking(false);
    }
  };

  // Render logic: Show Active Partners List + Invite Section
  // If we have active pairings, we show them. We ALSO show the invite section below to allow adding more.

  return (
    <AppLayout title="Partner Connection">
      <div className="space-y-4 xs:space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 xs:w-16 xs:h-16 mx-auto rounded-full bg-lavender/30 flex items-center justify-center">
            <Heart className="h-6 w-6 xs:h-8 xs:w-8 text-lavender-foreground" />
          </div>
          <h2 className="font-display text-lg xs:text-xl font-bold text-foreground">
            Connect with Your Partner
          </h2>
          {/* Active Partners List */}
          {activePairings.length > 0 && (
            <div className="w-full max-w-md mx-auto space-y-4 mb-8">
              {activePairings.map(pairing => (
                <Card key={pairing.id} variant="gradient" className="border-2 border-primary/20">
                  <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-2">
                       <UserCheck className="h-6 w-6 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg">Connected with {pairing.partnerName || 'Partnerm'}</CardTitle>
                    <CardDescription className="text-primary-foreground/80 text-xs">
                       {pairing.partnerUserId ? 'Active Connection' : 'Pending...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                     <p className="text-xs text-primary-foreground/70 text-center">
                        Sharing data based on your consent settings.
                     </p>
                     <div className="flex flex-col gap-2">
                        <Button 
                          variant="secondary" 
                          size="sm"
                          className="w-full"
                          onClick={() => navigate('/consent')}
                        >
                          Manage Consent
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          className="w-full bg-white/10 hover:bg-white/20 text-white border-none"
                          onClick={() => handleUnlink(pairing.id)}
                          disabled={isRevoking}
                        >
                          Disconnect
                        </Button>
                     </div>
                  </CardContent>
                </Card>
              ))}
              <div className="flex items-center gap-4 py-2">
                 <div className="h-px bg-border flex-1" />
                 <span className="text-xs text-muted-foreground uppercase font-medium">Add Another Partner</span>
                 <div className="h-px bg-border flex-1" />
              </div>
            </div>
          )}
          {loading && (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
          <p className="text-xs xs:text-sm text-muted-foreground max-w-sm mx-auto px-2">
            Share selected insights with someone you trust. You control exactly what they see.
          </p>
          <div className="pt-2">
            <Button variant="default" asChild className="gap-2 shadow-lg hover:shadow-xl transition-all duration-300">
              <a href="/consent">
                <Shield className="h-4 w-4" />
                Click here to view Consent & Privacy Settings
              </a>
            </Button>
          </div>
        </div>

        {/* Privacy Notice */}
        <Card className="border-2 border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/20">
          <CardContent className="flex items-start gap-3 py-4">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Privacy First</p>
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
            <div className="flex items-center gap-1.5 xs:gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 min-w-0 px-2 xs:px-3 py-2 rounded-lg bg-muted text-xs xs:text-sm text-foreground border border-border overflow-hidden text-ellipsis"
              />
              <Button
                variant={copied === 'link' ? 'sage' : 'default'}
                size="icon"
                className="flex-shrink-0"
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
            <div className="w-32 h-32 xs:w-40 xs:h-40 bg-card rounded-xl flex items-center justify-center border-2 border-border">
              {/* Mock QR Code */}
              <div className="w-24 h-24 xs:w-32 xs:h-32 grid grid-cols-8 gap-0.5">
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
            <div className="flex justify-center gap-1 xs:gap-2">
              {pairingCode.split('').map((digit, i) => (
                <div
                  key={i}
                  className="w-9 h-11 xs:w-12 xs:h-14 rounded-lg xs:rounded-xl bg-card border-2 border-primary/30 flex items-center justify-center"
                >
                  <span className="text-xl xs:text-2xl font-bold font-display text-foreground">{digit}</span>
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
        <div className="text-center p-4 rounded-xl bg-secondary/50 border border-secondary">
          <p className="text-sm font-medium text-secondary-foreground">
            💕 You are in control of what you share
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
