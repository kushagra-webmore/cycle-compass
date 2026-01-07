import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Heart, Check, X, Eye, Shield, Sparkles, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/lib/api-client';

interface InviteDetails {
  inviterName?: string;
  inviterEmail?: string;
  expiresAt: string;
}

export default function PartnerAccept() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const code = searchParams.get('code');
  
  const [isAccepting, setIsAccepting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [details, setDetails] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth(); // Just check user presence, don't use updateUser directly yet

  useEffect(() => {
    const fetchInvite = async () => {
      if (!token && !code) {
        setError('Invalid invitation link.');
        setIsLoading(false);
        return;
      }

      try {
        const query = token ? `token=${token}` : `code=${code}`;
        const { data } = await apiClient.get<InviteDetails>(`/pairings/invite?${query}`, {
          skipAuth: true // Invite preview should be public
        });
        setDetails(data);
      } catch (err) {
        console.error(err);
        setError('This invitation is invalid or has expired.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvite();
  }, [token, code]);

  const handleAccept = async () => {
    if (!user) {
      // Redirect to login/signup with return URL
      const returnUrl = encodeURIComponent(window.location.search);
      navigate(`/?redirect=/partner-accept${window.location.search}`);
      return;
    }

    setIsAccepting(true);
    try {
      await apiClient.post('/pairings/accept', { 
        token: token || undefined, 
        pairCode: code || undefined 
      });
      
      toast({
        title: "Connection accepted! 💕",
        description: "You can now view shared insights.",
      });
      navigate('/partner-dashboard');
    } catch (error) {
      toast({
        title: "Failed to accept",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    toast({
      title: "Invitation declined",
      description: "No connection was made.",
    });
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin text-primary">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-6">
          <CardTitle className="text-destructive mb-2">Invalid Invitation</CardTitle>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-calm flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-peach flex items-center justify-center shadow-soft">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg text-foreground">Cycle-Aware</span>
        </div>
        <ThemeToggle />
      </header>

      <main className="flex-1 flex items-center justify-center p-4 pb-8">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Invitation Card */}
          <Card variant="elevated" className="text-center overflow-hidden">
            <div className="h-2 gradient-primary" />
            <CardHeader className="space-y-4 pt-8">
              <div className="w-20 h-20 mx-auto rounded-full bg-lavender/30 flex items-center justify-center">
                <Heart className="h-10 w-10 text-lavender-foreground" />
              </div>
              <div>
                <CardTitle className="text-xl">You're Invited!</CardTitle>
                <CardDescription className="mt-2">
                  Someone wants to share their cycle insights with you
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Inviter Info */}
              <div className="p-4 rounded-xl bg-muted/50">
                <p className="text-sm text-muted-foreground">Invitation from</p>
                <div className="font-semibold text-foreground text-lg">
                  {details?.inviterName || 'A Cycle-Aware User'}
                </div>
                {details?.inviterEmail && (
                  <p className="text-sm text-muted-foreground">{details.inviterEmail}</p>
                )}
              </div>

              {/* What's Shared */}
              <div className="text-left">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  What you may see
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <span className="text-sm text-foreground">Cycle Phase & Mood</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-sage/30 text-sage-foreground">
                      Shared
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                     <span className="text-sm text-foreground">Symptom Details</span>
                     <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                       Can be toggled
                     </span>
                  </div>
                </div>
              </div>

              {/* Privacy Note */}
              <div className="p-3 rounded-xl bg-sage/20 border border-sage/30">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-sage-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-sage-foreground">
                    They control what's shared. You'll only see what they choose to share,
                    and they can change or revoke access at any time.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                {!user && (
                   <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded">
                     You need to sign in or create an account to accept this invitation.
                   </p>
                )}
                <div className="flex gap-3">
                  <Button
                    variant="calm"
                    size="lg"
                    className="flex-1"
                    onClick={handleDecline}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                  <Button
                    variant="gradient"
                    size="lg"
                    className="flex-1"
                    onClick={handleAccept}
                    disabled={isAccepting}
                  >
                    {isAccepting ? (
                      <span className="animate-pulse">Connecting...</span>
                    ) : (
                      <>
                        {user ? <Check className="h-4 w-4 mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
                        {user ? 'Accept' : 'Login to Accept'}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What This Means */}
          <Card variant="default">
            <CardHeader>
              <CardTitle className="text-base">What does this mean?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>By accepting, you'll receive selected insights about their cycle to help you be a supportive partner.</p>
              <p>You'll see suggestions on how to support them based on where they are in their cycle.</p>
              <p>Remember: Their body, their choice. They share what they're comfortable with.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
