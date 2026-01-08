import { useState } from 'react';
import { 
  Users, MessageSquare, Activity, Calendar, Heart, 
  Clock, MapPin, Mail, Phone, Shield, Trash2, Eye,
  ChevronDown, ChevronRight, Search, Filter
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  useAdminUsers, 
  useUserDetails, 
  useUserActivity, 
  useUserChatbot, 
  useUserCycles,
  useDeleteUser
} from '@/hooks/api/admin';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

export default function ComprehensiveAdminDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    profile: true,
    partner: false,
    cycles: true,
    symptoms: false,
    journals: false,
    chatbot: false,
    activity: false,
  });

  const { data: users, isLoading: usersLoading } = useAdminUsers();
  const { data: userDetails } = useUserDetails(selectedUserId);
  const { data: userActivity } = useUserActivity(selectedUserId);
  const { data: chatbotHistory } = useUserChatbot(selectedUserId);
  const { data: cycleData } = useUserCycles(selectedUserId);
  const deleteUserMutation = useDeleteUser();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteUser = async () => {
    if (!selectedUserId) return;
    try {
      await deleteUserMutation.mutateAsync(selectedUserId);
      setDeleteDialogOpen(false);
      setSelectedUserId(null);
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const filteredUsers = users?.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const profile = user.profiles;
    return (
      user.id.toLowerCase().includes(searchLower) ||
      profile?.name?.toLowerCase().includes(searchLower) ||
      user.role.toLowerCase().includes(searchLower)
    );
  });

  const selectedUser = users?.find(u => u.id === selectedUserId);

  // Convert IST timestamp
  const formatIST = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return format(date, 'dd MMM yyyy, hh:mm a') + ' IST';
  };

  return (
    <AppLayout title="Admin Dashboard" showNav={false}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">Complete data overview for all users</p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Shield className="h-4 w-4" />
            Admin Access
          </Badge>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{users?.length || 0}</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.status === 'ACTIVE').length || 0}
                  </p>
                </div>
                <Activity className="h-8 w-8 text-sage" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Primary Users</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.role === 'PRIMARY').length || 0}
                  </p>
                </div>
                <Heart className="h-8 w-8 text-rose" />
              </div>
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Partners</p>
                  <p className="text-2xl font-bold">
                    {users?.filter(u => u.role === 'PARTNER').length || 0}
                  </p>
                </div>
                <Users className="h-8 w-8 text-lavender" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User List */}
          <Card variant="elevated" className="lg:col-span-1">
            <CardHeader>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Select a user to view complete data</CardDescription>
              <div className="relative mt-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto space-y-2">
              {usersLoading ? (
                <p className="text-center text-muted-foreground py-8">Loading users...</p>
              ) : filteredUsers?.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No users found</p>
              ) : (
                filteredUsers?.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all",
                      selectedUserId === user.id
                        ? "border-primary bg-primary-soft"
                        : "border-border hover:border-primary/50 hover:bg-muted"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">
                        {user.profiles?.name || 'Unnamed User'}
                      </p>
                      <Badge variant={user.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.id}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>
                        {user.last_login 
                          ? formatDistanceToNow(new Date(user.last_login)) + ' ago'
                          : 'Never logged in'}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          {/* User Details */}
          <Card variant="elevated" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedUser ? `${selectedUser.profiles?.name || 'User'} - Complete Data` : 'Select a User'}
              </CardTitle>
              <CardDescription>
                {selectedUser ? 'All collected data from Supabase' : 'Click on a user to view their complete information'}
              </CardDescription>
            </CardHeader>
            <CardContent className="max-h-[600px] overflow-y-auto">
              {!selectedUserId ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Select a user from the list to view their data</p>
                </div>
              ) : (
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="health">Health Data</TabsTrigger>
                    <TabsTrigger value="chatbot">Chatbot</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-4 mt-4">
                    {/* Profile Information */}
                    <div className="space-y-3">
                      <button
                        onClick={() => toggleSection('profile')}
                        className="flex items-center justify-between w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedSections.profile ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <h3 className="font-semibold">Profile Information</h3>
                        </div>
                      </button>
                      
                      {expandedSections.profile && userDetails && (
                        <>
                        <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
                          <div>
                            <p className="text-xs text-muted-foreground">User ID</p>
                            <p className="text-sm font-mono">{userDetails.user.id}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Email</p>
                            <p className="text-sm font-medium">{userDetails.user.email || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Role</p>
                            <Badge>{userDetails.user.role}</Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Status</p>
                            <Badge variant={userDetails.user.status === 'ACTIVE' ? 'default' : 'destructive'}>
                              {userDetails.user.status}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Name</p>
                            <p className="text-sm">{userDetails.user.profiles?.name || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Age</p>
                            <p className="text-sm">{userDetails.user.profiles?.age || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Phone</p>
                            <p className="text-sm">{userDetails.user.profiles?.phone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">City</p>
                            <p className="text-sm">{userDetails.user.profiles?.city || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Timezone</p>
                            <p className="text-sm">{userDetails.user.profiles?.timezone || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Account Created</p>
                            <p className="text-sm">{formatIST(userDetails.user.created_at)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Last Login</p>
                            <p className="text-sm">{formatIST(userDetails.user.last_login)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Last Activity</p>
                            <p className="text-sm">
                              {userDetails.user.last_activity 
                                ? formatIST(userDetails.user.last_activity)
                                : 'Never'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Onboarding</p>
                            <Badge variant={userDetails.user.profiles?.onboarding_completed ? 'default' : 'secondary'}>
                              {userDetails.user.profiles?.onboarding_completed ? 'Complete' : 'Incomplete'}
                            </Badge>
                          </div>
                        </div>
                        
                         <div className="flex justify-end pt-4">
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete User Account
                          </Button>

                          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the user account
                                  and remove their data from our servers.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDeleteUser}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  {deleteUserMutation.isPending ? 'Deleting...' : 'Delete Account'}
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                        </>
                      )}
                    </div>

                    {/* Partner Information */}
                    {userDetails?.pairing && (
                      <div className="space-y-3">
                        <button
                          onClick={() => toggleSection('partner')}
                          className="flex items-center justify-between w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expandedSections.partner ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <h3 className="font-semibold">Partner Connection</h3>
                          </div>
                          <Badge variant="outline" className="ml-auto">
                            {userDetails.pairing.status}
                          </Badge>
                        </button>
                        
                        {expandedSections.partner && (
                          <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg animate-fade-in">
                            <div>
                              <p className="text-xs text-muted-foreground">Pairing ID</p>
                              <p className="text-sm font-mono truncate" title={userDetails.pairing.id}>{userDetails.pairing.id}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Connected Partner</p>
                              <p className="text-sm font-medium">
                                {userDetails.user.id === userDetails.pairing.primary_user_id 
                                  ? (userDetails.pairing.partner?.profiles?.name || 'Unknown') 
                                  : (userDetails.pairing.primary?.profiles?.name || 'Unknown')}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Partner Role</p>
                              <Badge variant="secondary">
                                {userDetails.user.id === userDetails.pairing.primary_user_id 
                                  ? (userDetails.pairing.partner?.role || 'PARTNER') 
                                  : (userDetails.pairing.primary?.role || 'PRIMARY')}
                              </Badge>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Connected Since</p>
                              <p className="text-sm">{format(new Date(userDetails.pairing.created_at), 'dd MMM yyyy')}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* Health Data Tab */}
                  <TabsContent value="health" className="space-y-4 mt-4">
                    {/* Cycle Data */}
                    <div className="space-y-3">
                      <button
                        onClick={() => toggleSection('cycles')}
                        className="flex items-center justify-between w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {expandedSections.cycles ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          <h3 className="font-semibold">Cycle History ({cycleData?.length || 0})</h3>
                        </div>
                      </button>
                      
                      {expandedSections.cycles && cycleData && (
                        <div className="space-y-2">
                          {cycleData.length === 0 ? (
                            <p className="text-sm text-muted-foreground p-4 text-center">No cycle data</p>
                          ) : (
                            cycleData.slice(0, 5).map((cycle: any) => (
                              <div key={cycle.id} className="p-3 border rounded-lg">
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <p className="text-xs text-muted-foreground">Start Date</p>
                                    <p>{format(new Date(cycle.start_date), 'dd MMM yyyy')}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">End Date</p>
                                    <p>{cycle.end_date ? format(new Date(cycle.end_date), 'dd MMM yyyy') : 'Ongoing'}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Cycle Length</p>
                                    <p>{cycle.cycle_length} days</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-muted-foreground">Period Length</p>
                                    <p>{cycle.period_length} days</p>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Symptoms */}
                    {userDetails && (
                      <div className="space-y-3">
                        <button
                          onClick={() => toggleSection('symptoms')}
                          className="flex items-center justify-between w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expandedSections.symptoms ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <h3 className="font-semibold">Recent Symptoms ({userDetails.symptoms?.length || 0})</h3>
                          </div>
                        </button>
                        
                        {expandedSections.symptoms && (
                          <div className="space-y-2">
                            {userDetails.symptoms?.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-4 text-center">No symptoms logged</p>
                            ) : (
                              userDetails.symptoms?.slice(0, 10).map((symptom: any) => (
                                <div key={symptom.id} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge>{symptom.type}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(symptom.logged_at))} ago
                                    </span>
                                  </div>
                                  <p className="text-sm">Severity: {symptom.severity}/10</p>
                                  {symptom.notes && <p className="text-xs text-muted-foreground mt-1">{symptom.notes}</p>}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Journals */}
                    {userDetails && (
                      <div className="space-y-3">
                        <button
                          onClick={() => toggleSection('journals')}
                          className="flex items-center justify-between w-full p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {expandedSections.journals ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <h3 className="font-semibold">Journal Entries ({userDetails.journals?.length || 0})</h3>
                          </div>
                        </button>
                        
                        {expandedSections.journals && (
                          <div className="space-y-2">
                            {userDetails.journals?.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-4 text-center">No journal entries</p>
                            ) : (
                              userDetails.journals?.slice(0, 5).map((journal: any) => (
                                <div key={journal.id} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge>{journal.mood}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {format(new Date(journal.created_at), 'dd MMM yyyy')}
                                    </span>
                                  </div>
                                  {journal.tags && journal.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {journal.tags.map((tag: string, i: number) => (
                                        <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  {/* Chatbot Tab */}
                  <TabsContent value="chatbot" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Chat History ({chatbotHistory?.length || 0} messages)</h3>
                        <Badge variant="outline">Includes soft-deleted</Badge>
                      </div>
                      
                      {!chatbotHistory || chatbotHistory.length === 0 ? (
                        <p className="text-sm text-muted-foreground p-4 text-center">No chat history</p>
                      ) : (
                        <div className="space-y-3">
                          {chatbotHistory.map((msg: any) => (
                            <div
                              key={msg.id}
                              className={cn(
                                "p-3 rounded-lg border",
                                msg.is_deleted && "opacity-50 border-dashed border-destructive"
                              )}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant={msg.role === 'USER' ? 'default' : 'secondary'}>
                                    {msg.role}
                                  </Badge>
                                  {msg.is_deleted && (
                                    <Badge variant="destructive" className="text-xs">
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      Soft Deleted
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(msg.created_at), 'dd MMM, HH:mm')}
                                </span>
                              </div>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              {msg.deleted_at && (
                                <p className="text-xs text-destructive mt-2">
                                  Deleted: {formatDistanceToNow(new Date(msg.deleted_at))} ago
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  {/* Activity Tab */}
                  <TabsContent value="activity" className="space-y-4 mt-4">
                    {userActivity && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground mb-1">Last Login</p>
                              <p className="text-lg font-semibold">
                                {userActivity.lastLogin 
                                  ? formatDistanceToNow(new Date(userActivity.lastLogin)) + ' ago'
                                  : 'Never'}
                              </p>
                              {userActivity.lastLogin && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {formatIST(userActivity.lastLogin)}
                                </p>
                              )}
                            </CardContent>
                          </Card>

                          <Card>
                            <CardContent className="pt-6">
                              <p className="text-sm text-muted-foreground mb-1">Account Created</p>
                              <p className="text-lg font-semibold">
                                {formatDistanceToNow(new Date(userActivity.accountCreated))} ago
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatIST(userActivity.accountCreated)}
                              </p>
                            </CardContent>
                          </Card>
                        </div>

                        <div>
                          <h3 className="font-semibold mb-3">Audit Logs ({userActivity.auditLogs?.length || 0})</h3>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {userActivity.auditLogs?.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-4 text-center">No audit logs</p>
                            ) : (
                              userActivity.auditLogs?.map((log: any) => (
                                <div key={log.id} className="p-3 border rounded-lg">
                                  <div className="flex items-center justify-between mb-1">
                                    <Badge>{log.action}</Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {formatDistanceToNow(new Date(log.created_at))} ago
                                    </span>
                                  </div>
                                  {log.metadata && (
                                    <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
