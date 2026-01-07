import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: 'Email required',
        description: 'Please enter your email address',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/forgot-password', { email });
      setIsSuccess(true);
      toast({
        title: 'Email sent! 📧',
        description: 'Check your inbox for password reset instructions',
      });
    } catch (error) {
      // Always show success to prevent email enumeration
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-calm flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Button>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 pb-8">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Forgot Password?
            </h1>
            <p className="text-muted-foreground">
              No worries! We'll send you reset instructions
            </p>
          </div>

          {/* Form Card */}
          <Card variant="elevated">
            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-xl">Reset Your Password</CardTitle>
              <CardDescription>
                Enter your email address and we'll send you a link to reset your password
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isSuccess ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-sage/30 flex items-center justify-center">
                    <Check className="h-8 w-8 text-sage-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Check your email</h3>
                    <p className="text-sm text-muted-foreground">
                      If an account exists with <strong>{email}</strong>, you will receive a password reset link shortly.
                    </p>
                  </div>
                  <Button
                    variant="gradient"
                    className="w-full"
                    onClick={() => navigate('/')}
                  >
                    Return to Login
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  {/* Submit */}
                  <Button
                    type="submit"
                    variant="gradient"
                    size="lg"
                    className="w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="animate-pulse">Sending...</span>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
