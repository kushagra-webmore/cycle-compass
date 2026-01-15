import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Users, Mail, Lock, ArrowRight, Sparkles, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('primary');
  const [isLoading, setIsLoading] = useState(false);
  
  // Signup-specific fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [city, setCity] = useState('');
  
  const [touched, setTouched] = useState({
    email: false,
    password: false,
    name: false,
    phone: false,
    dateOfBirth: false,
    city: false,
  });

  const { login, signup, error: authError, clearError, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Clear error when switching between login/signup
  useEffect(() => {
    clearError();
  }, [isLogin, clearError]);
  
  // Handle redirection after successful authentication
  useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'partner') {
        navigate(user.onboardingCompleted ? '/partner-dashboard' : '/partner-accept');
      } else {
        navigate(user.onboardingCompleted ? '/dashboard' : '/onboarding');
      }
    }
  }, [user, navigate]);

  const validateForm = () => {
    if (!email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return 'Please enter a valid email address';
    }
    if (!password) {
      return 'Password is required';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    
    // Additional validation for signup
    if (!isLogin) {
      if (!name.trim()) {
        return 'Full name is required';
      }
      if (!phone.trim()) {
        return 'Phone number is required';
      }
      if (!/^[0-9]{10}$/.test(phone.replace(/[\s-]/g, ''))) {
        return 'Please enter a valid 10-digit phone number';
      }
      if (!dateOfBirth) {
        return 'Date of birth is required';
      }
      // Check if user is at least 13 years old
      const dob = new Date(dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 13) {
        return 'You must be at least 13 years old to sign up';
      }
      if (!city.trim()) {
        return 'City is required';
      }
    }
    
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ 
      email: true, 
      password: true,
      name: !isLogin,
      phone: !isLogin,
      dateOfBirth: !isLogin,
      city: !isLogin,
    });
    
    const validationError = validateForm();
    if (validationError) {
      return;
    }

    setIsLoading(true);

    try {
      if (isLogin) {
        const loggedInUser = await login(email, password);
        const firstName = loggedInUser.name ? loggedInUser.name.split(' ')[0] : '';
        toast({
          title: firstName ? `Welcome back, ${firstName} 💖` : "Welcome back 💖",
          description: "You've successfully logged in.",
        });
      } else {
        await signup(email, password, selectedRole, {
          name,
          dateOfBirth,
          phone,
          city,
        });
        toast({
          title: `Welcome, ${name}! 🌸`,
          description: "Your account has been created successfully.",
        });
      }
    } catch (err) {
      console.error('Authentication error:', err);
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
      <header className="flex items-center justify-between p-4 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-peach dark:from-primary/80 dark:to-peach/80 flex items-center justify-center shadow-soft">
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
                                ? "border-primary bg-primary/20"
                                : "border-lavender bg-lavender/30"
                              : "border-border hover:border-muted-foreground/30 hover:bg-muted/50"
                          )}
                        >
                          <div className={cn(
                            "p-2 rounded-lg",
                            role.color === 'primary' ? "bg-primary/20" : "bg-lavender/30"
                          )}>
                            <role.icon className={cn(
                              "h-5 w-5",
                              role.color === 'primary' ? "text-primary dark:text-primary-foreground" : "text-lavender-foreground"
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

                {/* Signup-specific fields */}
                {!isLogin && (
                  <>
                    {/* Full Name */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="name">Full Name</Label>
                        {touched.name && !name.trim() && (
                          <span className="text-xs text-destructive">Name is required</span>
                        )}
                      </div>
                      <Input
                        id="name"
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setTouched(prev => ({ ...prev, name: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, name: true }))}
                        className={touched.name && !name.trim() ? 'border-destructive' : ''}
                        required
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="phone">Phone Number</Label>
                        {touched.phone && !phone.trim() && (
                          <span className="text-xs text-destructive">Phone is required</span>
                        )}
                        {touched.phone && phone.trim() && !/^[0-9]{10}$/.test(phone.replace(/[\s-]/g, '')) && (
                          <span className="text-xs text-destructive">Invalid phone number</span>
                        )}
                      </div>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="1234567890"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setTouched(prev => ({ ...prev, phone: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, phone: true }))}
                        className={touched.phone && (!/^[0-9]{10}$/.test(phone.replace(/[\s-]/g, '')) || !phone.trim()) ? 'border-destructive' : ''}
                        required
                      />
                    </div>

                    {/* Date of Birth */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        {touched.dateOfBirth && !dateOfBirth && (
                          <span className="text-xs text-destructive">DOB is required</span>
                        )}
                      </div>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={dateOfBirth}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          setDateOfBirth(e.target.value);
                          setTouched(prev => ({ ...prev, dateOfBirth: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, dateOfBirth: true }))}
                        className={touched.dateOfBirth && !dateOfBirth ? 'border-destructive' : ''}
                        required
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label htmlFor="city">City</Label>
                        {touched.city && !city.trim() && (
                          <span className="text-xs text-destructive">City is required</span>
                        )}
                      </div>
                      <Input
                        id="city"
                        type="text"
                        placeholder="Your city"
                        value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          setTouched(prev => ({ ...prev, city: true }));
                        }}
                        onBlur={() => setTouched(prev => ({ ...prev, city: true }))}
                        className={touched.city && !city.trim() ? 'border-destructive' : ''}
                        required
                      />
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="email">Email</Label>
                    {touched.email && !email.trim() && (
                      <span className="text-xs text-destructive">Email is required</span>
                    )}
                    {touched.email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (
                      <span className="text-xs text-destructive">Please enter a valid email</span>
                    )}
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setTouched(prev => ({ ...prev, email: true }));
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, email: true }))}
                      className={`pl-10 ${touched.email && !email.trim() ? 'border-destructive' : ''}`}
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password">
                      Password
                      {!isLogin && <span className="text-muted-foreground text-xs ml-1">(min 8 characters)</span>}
                    </Label>
                    {touched.password && !password && (
                      <span className="text-xs text-destructive">Password is required</span>
                    )}
                    {touched.password && password && password.length < 8 && (
                      <span className="text-xs text-destructive">At least 8 characters</span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="enter pass"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setTouched(prev => ({ ...prev, password: true }));
                      }}
                      onBlur={() => setTouched(prev => ({ ...prev, password: true }))}
                      className={`pl-10 pr-10 ${touched.password && password.length < 8 ? 'border-destructive' : ''}`}
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
                  {isLogin && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={() => navigate('/forgot-password')}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                  )}
                </div>

                {/* Auth Error */}
                {authError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm animate-fade-in flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{authError}</span>
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
                clearError();
              }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin 
                ? "Don't have an account? Sign up" 
                : 'Already have an account? Sign in'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
