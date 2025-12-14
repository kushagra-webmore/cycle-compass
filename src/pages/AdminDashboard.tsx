import { useState } from 'react';
import { Users, Link2, Shield, Sparkles, ChevronRight, Search, BarChart3, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Mock data
const mockUsers = [
  { id: '1', email: 'user1@example.com', role: 'primary', status: 'active', lastActive: '2 hours ago' },
  { id: '2', email: 'user2@example.com', role: 'primary', status: 'active', lastActive: '1 day ago' },
  { id: '3', email: 'partner1@example.com', role: 'partner', status: 'active', lastActive: '3 hours ago' },
  { id: '4', email: 'partner2@example.com', role: 'partner', status: 'inactive', lastActive: '1 week ago' },
];

const mockPairings = [
  { id: '1', primary: 'user1@example.com', partner: 'partner1@example.com', status: 'active', created: '2024-01-15' },
  { id: '2', primary: 'user2@example.com', partner: 'partner2@example.com', status: 'revoked', created: '2024-01-10' },
];

const mockConsentLogs = [
  { id: '1', user: 'user1@example.com', action: 'Enabled phase sharing', timestamp: '2024-01-20 14:32' },
  { id: '2', user: 'user1@example.com', action: 'Disabled symptom sharing', timestamp: '2024-01-19 09:15' },
  { id: '3', user: 'user2@example.com', action: 'Revoked partner access', timestamp: '2024-01-18 16:45' },
];

const mockAILogs = [
  { id: '1', user: 'user1@example.com', type: 'Journal reflection', timestamp: '2024-01-20 15:00' },
  { id: '2', user: 'user2@example.com', type: 'Cycle question', timestamp: '2024-01-20 11:30' },
];

export default function AdminDashboard() {
  const [searchQuery, setSearchQuery] = useState('');

  const stats = [
    { label: 'Total Users', value: '1,247', icon: Users, color: 'bg-primary-soft text-primary' },
    { label: 'Active Pairings', value: '432', icon: Link2, color: 'bg-lavender/30 text-lavender-foreground' },
    { label: 'Consent Changes (24h)', value: '89', icon: Shield, color: 'bg-sage/30 text-sage-foreground' },
    { label: 'AI Interactions (24h)', value: '156', icon: Sparkles, color: 'bg-peach/30 text-peach-foreground' },
  ];

  const filteredUsers = mockUsers.filter(
    (user) => user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout title="Admin Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} variant="elevated" className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", stat.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <span className="text-2xl font-bold font-display text-foreground">{stat.value}</span>
                    <span className="text-xs text-muted-foreground block">{stat.label}</span>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted">
            <TabsTrigger value="users" className="text-xs py-2">Users</TabsTrigger>
            <TabsTrigger value="pairings" className="text-xs py-2">Pairings</TabsTrigger>
            <TabsTrigger value="consent" className="text-xs py-2">Consent</TabsTrigger>
            <TabsTrigger value="ai" className="text-xs py-2">AI Logs</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4 space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <Card key={user.id} variant="default" className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold",
                        user.role === 'primary' ? "bg-primary-soft text-primary" : "bg-lavender/30 text-lavender-foreground"
                      )}>
                        {user.email[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{user.email}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn(
                            "text-xs px-2 py-0.5 rounded-full",
                            user.role === 'primary' ? "bg-primary-soft text-primary" : "bg-lavender/20 text-lavender-foreground"
                          )}>
                            {user.role}
                          </span>
                          <span className={cn(
                            "text-xs",
                            user.status === 'active' ? "text-sage-foreground" : "text-muted-foreground"
                          )}>
                            {user.lastActive}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Pairings Tab */}
          <TabsContent value="pairings" className="mt-4 space-y-3">
            {mockPairings.map((pairing) => (
              <Card key={pairing.id} variant="default" className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full",
                    pairing.status === 'active' ? "bg-sage/30 text-sage-foreground" : "bg-destructive/20 text-destructive"
                  )}>
                    {pairing.status}
                  </span>
                  <span className="text-xs text-muted-foreground">{pairing.created}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-foreground font-medium">{pairing.primary}</span>
                  <Link2 className="h-3 w-3 text-muted-foreground" />
                  <span className="text-muted-foreground">{pairing.partner}</span>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* Consent Tab */}
          <TabsContent value="consent" className="mt-4 space-y-3">
            {mockConsentLogs.map((log) => (
              <Card key={log.id} variant="default" className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground text-sm">{log.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">{log.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                </div>
              </Card>
            ))}
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="mt-4 space-y-3">
            {mockAILogs.map((log) => (
              <Card key={log.id} variant="default" className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-peach/30">
                    <Sparkles className="h-4 w-4 text-peach-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{log.type}</p>
                    <p className="text-xs text-muted-foreground">{log.user}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.timestamp}</span>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>

        {/* Analytics Preview */}
        <Card variant="gradient">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Quick Analytics</CardTitle>
            </div>
            <CardDescription>User activity over the past 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end justify-between gap-2">
              {[65, 45, 80, 55, 90, 70, 85].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-primary/20 rounded-t-md transition-all hover:bg-primary/40"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
              <span>Sun</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
