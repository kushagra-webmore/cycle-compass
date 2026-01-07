import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  
  // Extract token from query params OR hash (Supabase default)
  const getToken = () => {
    const queryToken = searchParams.get('token');
    if (queryToken) return queryToken;

    // Check hash for access_token
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    return hashParams.get('access_token') || '';
  };

  const token = getToken();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters',
        variant: 'destructive',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same',
        variant: 'destructive',
      });
      return;
    }

    if (!token) {
      toast({
        title: 'Invalid reset link',
        description: 'This password reset link is invalid or expired',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post('/auth/reset-password', { token, newPassword });
      setIsSuccess(true);
      toast({
        title: 'Password reset successful! 🎉',
        description: 'You can now log in with your new password',
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error) {
      toast({
        title: 'Reset failed',
        description: error instanceof Error ? error.message : 'The reset link may be expired or invalid',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen gradient-calm flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-end p-4">
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 pb-8">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Title */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-3xl font-bold text-foreground">
              Reset Password
            </h1>
            <p className="text-muted-foreground">
              Choose a new password for your account
            </p>
          </div>

          {/* Form Card */}
          <Card variant="elevated">
            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-xl">Create New Password</CardTitle>
              <CardDescription>
                Your new password must be at least 8 characters long
              </CardDescription>
            </CardHeader>

            <CardContent>
              {isSuccess ? (
                <div className="space-y-4 text-center">
                  <div className="mx-auto w-16 h-16 rounded-full bg-sage/30 flex items-center justify-center">
                    <Check className="h-8 w-8 text-sage-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">Password reset successful!</h3>
                    <p className="text-sm text-muted-foreground">
                      Redirecting you to login...
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* New Password */}
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {newPassword && newPassword.length < 8 && (
                      <p className="text-xs text-destructive">At least 8 characters required</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-xs text-destructive">Passwords do not match</p>
                    )}
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
                      <span className="animate-pulse">Resetting...</span>
                    ) : (
                      'Reset Password'
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
