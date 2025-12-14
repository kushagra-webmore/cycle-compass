import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('primary');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast({
          title: "Welcome back! 💕",
          description: "You've successfully logged in.",
        });
      } else {
        await signup(email, password, selectedRole);
        toast({
          title: "Account created! 🌸",
          description: "Welcome to Cycle-Aware Companion.",
        });
      }

      // Navigate based on role
      if (email === 'admin@demo.com') {
        navigate('/admin');
      } else if (email === 'partner@demo.com') {
        navigate('/partner-dashboard');
      } else if (selectedRole === 'partner') {
        navigate('/partner-accept');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    {
      id: 'primary' as UserRole,
      title: 'I am tracking my cycle',
      description: 'Track your menstrual cycle, log symptoms, and receive personalized insights.',
      icon: Heart,
      color: 'primary',
    },
    {
      id: 'partner' as UserRole,
      title: 'I am a partner',
      description: 'Receive shared insights to better understand and support your partner.',
      icon: Users,
      color: 'lavender',
    },
  ];

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

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4 pb-8">
        <div className="w-full max-w-md space-y-6 animate-fade-in">
          {/* Welcome Text */}
          <div className="text-center space-y-2">
            <h1 className="font-display text-3xl font-bold text-foreground">
              {isLogin ? 'Welcome Back' : 'Join Us'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? 'Continue your journey of self-awareness' 
                : 'Start your cycle-aware journey today'}
            </p>
          </div>

          {/* Auth Card */}
          <Card variant="elevated" className="overflow-hidden">
            <CardHeader className="space-y-1 text-center pb-4">
              <CardTitle className="text-xl">
                {isLogin ? 'Sign In' : 'Create Account'}
              </CardTitle>
              <CardDescription>
                {isLogin 
                  ? 'Enter your credentials to continue' 
                  : 'Choose your role and enter your details'}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Role Selection (Signup only) */}
                {!isLogin && (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">I want to...</Label>
                    <div className="grid gap-3">
                      {roles.map((role) => (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => setSelectedRole(role.id)}
                          className={cn(
                            "flex items-start gap-4 p-4 rounded-xl border-2 transition-all duration-300 text-left",
                            selectedRole === role.id
                              ? role.color === 'primary'
                                ? "border-primary bg-primary-soft"
                                : "border-lavender bg-lavender/20"
                              : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            role.color === 'primary' ? "bg-primary/20" : "bg-lavender/30"
                          )}>
                            <role.icon className={cn(
                              "h-5 w-5",
                              role.color === 'primary' ? "text-primary" : "text-lavender-foreground"
                            )} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground">{role.title}</h3>
                            <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
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

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in">
                    {error}
                  </div>
                )}

                {/* Submit */}
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="animate-pulse">Please wait...</span>
                  ) : (
                    <>
                      {isLogin ? 'Sign In' : 'Create Account'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Toggle */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>

          {/* Demo hint */}
          <div className="text-center p-4 rounded-xl bg-muted/50 border border-border/50">
            <p className="text-xs text-muted-foreground">
              <strong>Demo accounts:</strong><br />
              admin@demo.com / partner@demo.com<br />
              (any password works)
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
