import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

export default function PartnerJoin() {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let token: string | undefined;
    let pairCode: string | undefined;

    // Check if input is a URL with token
    if (code.includes('token=')) {
      try {
        const url = new URL(code);
        const tokenParam = url.searchParams.get('token');
        if (tokenParam) token = tokenParam;
      } catch (e) {
        // Not a valid URL, treat as raw string?
        const match = code.match(/token=([^&]+)/);
        if (match) token = match[1];
      }
    } 
    
    if (!token) {
       // Assume manual code
       // Remove spaces and uppercase
       const cleaned = code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
       if (cleaned.length === 6) {
         pairCode = cleaned;
       } else {
         // Maybe it's a raw token string (very long)
         if (code.length > 20) token = code;
       }
    }

    if (!token && !pairCode) {
      toast({
        title: 'Invalid Input',
        description: 'Please enter a valid 6-character code or a full invite link.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/pairings/accept', { pairCode, token });
      toast({
        title: 'Success! 🎉',
        description: 'You are now connected.',
      });
      navigate('/partner-dashboard');
    } catch (error: any) {
      toast({
        title: 'Connection Failed',
        description: error.response?.data?.message || 'Invalid code or invite expired.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout title="Join Partner" showBack>
      <div className="flex flex-col items-center justify-center p-4 min-h-[60vh] animate-fade-in">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">Enter Code or Link</CardTitle>
            <CardDescription>
              Enter the 6-digit code OR paste the full invite link shared by your partner.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Paste code or link here..."
                    className="pl-10 text-center text-lg md:text-xl"
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting || code.length < 6}
              >
                {isSubmitting ? 'Connecting...' : 'Connect'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
