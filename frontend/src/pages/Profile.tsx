import { useState } from 'react';
import { User as UserIcon, Calendar, MapPin, Phone, Mail, Clock, Edit2, Save, X, Lock, Shield, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/api-client';
import { format, formatDistanceToNow } from 'date-fns';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    city: user?.city || '',
    timezone: user?.timezone || 'Asia/Kolkata',
    dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
    goal: user?.goal || 'TRACKING',
  });

  // Calculate age from DOB
  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge(formData.dateOfBirth);

  const handleSave = async () => {
    try {
      await updateUser(formData);
      setIsEditing(false);
      toast({
        title: '✅ Profile Updated',
        description: 'Your profile has been updated successfully.',
      });
    } catch (error) {
      toast({
        title: '❌ Update Failed',
        description: 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      phone: user?.phone || '',
      city: user?.city || '',
      timezone: user?.timezone || 'Asia/Kolkata',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth).toISOString().split('T')[0] : '',
      goal: user?.goal || 'TRACKING',
    });
    setIsEditing(false);
  };

  /* Add state for password dialog */
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please ensure both passwords are the same.',
        variant: 'destructive',
      });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters.',
        variant: 'destructive',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await apiClient.post('/auth/update-password', { 
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword 
      });
      toast({
        title: 'Success',
        description: 'Password updated successfully.',
        variant: 'destructive',
      });
      setIsPasswordDialogOpen(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to update password. Please check your current password.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <AppLayout title="Profile">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">My Profile</h1>
            <p className="text-muted-foreground">Manage your personal information</p>
          </div>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Button variant="outline" asChild className="gap-2 flex-1 md:flex-none">
              <a href="/consent">
                <Shield className="h-4 w-4" />
                Consent & Privacy
              </a>
            </Button>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(true)} className="gap-2 flex-1 md:flex-none">
              <Lock className="h-4 w-4" />
              Change Password
            </Button>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} className="gap-2 flex-1 md:flex-none">
                <Edit2 className="h-4 w-4" />
                Edit Profile
              </Button>
            ) : (
              <div className="flex gap-2 w-full md:w-auto">
                <Button onClick={handleSave} className="gap-2 flex-1 md:flex-none">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" className="gap-2 flex-1 md:flex-none">
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Enter your new password below.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPass">Current Password</Label>
                <Input
                  id="currentPass"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  required
                  className="bg-white/50 dark:bg-black/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPass">New Password</Label>
                <Input
                  id="newPass"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  required
                  className="bg-white/50 dark:bg-black/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPass">Confirm Password</Label>
                <Input
                  id="confirmPass"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  required
                  className="bg-white/50 dark:bg-black/20"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setIsPasswordDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Information */}
          <Card variant="elevated" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Your basic profile details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  {isEditing ? (
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <UserIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{user.name || 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{user.email}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  {isEditing ? (
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{user.dateOfBirth ? format(new Date(user.dateOfBirth), 'dd MMM yyyy') : 'Not set'}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="age">Age</Label>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{age !== null ? `${age} years old` : 'Not set'}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  {isEditing ? (
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{user.phone || 'Not set'}</span>
                    </div>
                  )}
                </div>



                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  {isEditing ? (
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  ) : (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{user.city || 'Not set'}</span>
                    </div>
                  )}
                </div>


                {user.role === 'primary' && (
                  <div className="space-y-2">
                    <Label htmlFor="goal">Primary Goal</Label>
                    {isEditing ? (
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant={formData.goal === 'TRACKING' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setFormData({ ...formData, goal: 'TRACKING' as any })}
                        >
                          Track Cycle
                        </Button>
                        <Button
                          type="button"
                          variant={formData.goal === 'CONCEIVE' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => setFormData({ ...formData, goal: 'CONCEIVE' as any })}
                        >
                          Conceive
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                        <Sparkles className="h-4 w-4 text-muted-foreground" />
                        <span>{user.goal === 'CONCEIVE' ? 'Conceive a baby' : 'Track my cycle'}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Account Info */}
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>Your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Role</p>
                <Badge variant="default" className="capitalize">
                  {user.role}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Status</p>
                <Badge variant={user.status === 'ACTIVE' ? 'default' : 'destructive'}>
                  {user.status}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Last Login</p>
                <p className="text-sm">
                  {user.lastLogin
                    ? formatDistanceToNow(new Date(user.lastLogin)) + ' ago'
                    : 'Never'}
                </p>
                {user.lastLogin && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {format(new Date(user.lastLogin), 'dd MMM yyyy, hh:mm a')}
                  </p>
                )}
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-1">Onboarding</p>
                <Badge variant={user.onboardingCompleted ? 'default' : 'secondary'}>
                  {user.onboardingCompleted ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {user.role === 'primary' && (
            <Card variant="elevated" className="lg:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle>Cycle Information</CardTitle>
                  <CardDescription>Your menstrual cycle details</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <a href="/cycles/history" className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    View History
                  </a>
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Last Period Date</p>
                    <p className="text-lg font-semibold">
                      {user.lastPeriodDate
                        ? format(new Date(user.lastPeriodDate), 'dd MMM yyyy')
                        : 'Not set'}
                    </p>
                    {user.lastPeriodDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(user.lastPeriodDate))} ago
                      </p>
                    )}
                  </div>

                  <div className="p-4 rounded-lg bg-sage/20 border border-sage/30">
                    <p className="text-sm text-muted-foreground mb-1">Cycle Length</p>
                    <p className="text-lg font-semibold">
                      {user.cycleLength ? `${user.cycleLength} days` : 'Not set'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Average cycle duration</p>
                  </div>

                  <div className="p-4 rounded-lg bg-lavender/30 border border-lavender/40">
                    <p className="text-sm text-muted-foreground mb-1">Next Period (Est.)</p>
                    <p className="text-lg font-semibold">
                      {user.lastPeriodDate && user.cycleLength
                        ? (() => {
                            const nextDate = new Date(user.lastPeriodDate);
                            nextDate.setDate(nextDate.getDate() + user.cycleLength);
                            return format(nextDate, 'dd MMM yyyy');
                          })()
                        : 'Not available'}
                    </p>
                    {user.lastPeriodDate && user.cycleLength && (
                      <p className="text-xs text-muted-foreground mt-1">
                        In{' '}
                        {(() => {
                          const nextDate = new Date(user.lastPeriodDate);
                          nextDate.setDate(nextDate.getDate() + user.cycleLength);
                          return formatDistanceToNow(nextDate);
                        })()}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
