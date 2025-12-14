import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Check, X, Eye, Shield, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export default function PartnerAccept() {
  const [isAccepting, setIsAccepting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateUser } = useAuth();

  const sharedData = [
    { label: 'Current phase', enabled: true },
    { label: 'Mood summary', enabled: true },
    { label: 'Energy levels', enabled: false },
    { label: 'Symptom details', enabled: false },
  ];

  const handleAccept = async () => {
    setIsAccepting(true);
    await new Promise((r) => setTimeout(r, 1000));
    
    updateUser({ onboardingCompleted: true });
    toast({
      title: "Connection accepted! 💕",
      description: "You can now view shared insights.",
    });
    navigate('/partner-dashboard');
  };

  const handleDecline = () => {
    toast({
      title: "Invitation declined",
      description: "No connection was made.",
    });
    navigate('/');
  };

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
                <p className="font-semibold text-foreground">user@example.com</p>
              </div>

              {/* What's Shared */}
              <div className="text-left">
                <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-primary" />
                  What you may see
                </h3>
                <div className="space-y-2">
                  {sharedData.map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                    >
                      <span className="text-sm text-foreground">{item.label}</span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        item.enabled 
                          ? 'bg-sage/30 text-sage-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {item.enabled ? 'Shared' : 'Not shared'}
                      </span>
                    </div>
                  ))}
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
                      <Check className="h-4 w-4 mr-2" />
                      Accept
                    </>
                  )}
                </Button>
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
