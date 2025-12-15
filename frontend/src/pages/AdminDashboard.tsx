import { useMemo, useState } from 'react';
import {
  Users,
  Link2,
  Shield,
  Sparkles,
  ChevronRight,
  Search,
  BarChart3,
  Activity,
  Loader2,
  AlertTriangle,
  Trash2,
  Check,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useAdminUsers,
  useUpdateAdminUser,
  useAdminPairings,
  useForceUnpair,
  useConsentLogs,
  useAIInteractions,
  useMythArticles,
  useUpsertMythArticle,
  useDeleteMythArticle,
  useAnalyticsOverview,
} from '@/hooks/api/admin';
import { useToast } from '@/hooks/use-toast';

const statusTone = {
  ACTIVE: 'bg-sage/30 text-sage-foreground',
  PENDING: 'bg-lavender/30 text-lavender-foreground',
  REVOKED: 'bg-destructive/20 text-destructive',
  SUSPENDED: 'bg-destructive/20 text-destructive',
  DELETED: 'bg-muted text-muted-foreground',
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const { data: analytics, isLoading: analyticsLoading } = useAnalyticsOverview();
  const {
    data: users,
    isLoading: usersLoading,
    isError: usersError,
    refetch: refetchUsers,
  } = useAdminUsers();
  const updateAdminUser = useUpdateAdminUser();

  const {
    data: pairings,
    isLoading: pairingsLoading,
    isError: pairingsError,
    refetch: refetchPairings,
  } = useAdminPairings();
  const forceUnpair = useForceUnpair();

  const { data: consentLogs, isLoading: consentLoading, isError: consentError, refetch: refetchConsent } = useConsentLogs();
  const { data: aiInteractions, isLoading: aiLoading, isError: aiError, refetch: refetchAI } = useAIInteractions();

  const {
    data: mythArticles,
    isLoading: mythsLoading,
    isError: mythsError,
    refetch: refetchMyths,
  } = useMythArticles();
  const upsertMythArticle = useUpsertMythArticle();
  const deleteMythArticle = useDeleteMythArticle();

  const [searchQuery, setSearchQuery] = useState('');
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [unpairingId, setUnpairingId] = useState<string | null>(null);
  const [mythForm, setMythForm] = useState({ title: '', content: '', tags: '', isPublished: true });
  const [savingMyth, setSavingMyth] = useState(false);
  const [deletingMythId, setDeletingMythId] = useState<string | null>(null);

  const stats = useMemo(
    () => [
      {
        label: 'Total Users',
        value: analytics ? analytics.total_users.toLocaleString() : '—',
        icon: Users,
        color: 'bg-primary-soft text-primary',
      },
      {
        label: 'Active Pairings',
        value: analytics ? analytics.active_pairings.toLocaleString() : '—',
        icon: Link2,
        color: 'bg-lavender/30 text-lavender-foreground',
      },
      {
        label: 'AI Interactions (24h)',
        value: analytics ? analytics.ai_interactions_count.toLocaleString() : '—',
        icon: Sparkles,
        color: 'bg-peach/30 text-peach-foreground',
      },
      {
        label: 'Snapshot Date',
        value: analytics ? new Date(analytics.snapshot_date).toLocaleDateString() : '—',
        icon: Activity,
        color: 'bg-muted text-muted-foreground',
      },
    ],
    [analytics]
  );

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((user) =>
      [user.id, user.profiles?.name, user.profiles?.timezone]
        .concat()
        .join(' ')
        .toLowerCase()
        .includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleUserUpdate = async (
    userId: string,
    changes: Partial<{ status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'; role: 'PRIMARY' | 'PARTNER' | 'ADMIN' }>
  ) => {
    setUpdatingUserId(userId);
    try {
      await updateAdminUser.mutateAsync({ userId, ...changes });
      toast({ title: 'User updated', description: 'Changes applied successfully.' });
    } catch (error) {
      toast({
        title: 'Unable to update user',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleForceUnpair = async (pairingId: string) => {
    setUnpairingId(pairingId);
    try {
      await forceUnpair.mutateAsync(pairingId);
      toast({ title: 'Pairing revoked', description: 'The users have been unpaired.' });
    } catch (error) {
      toast({
        title: 'Unable to revoke pairing',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setUnpairingId(null);
    }
  };

  const handleCreateMyth = async () => {
    if (!mythForm.title.trim() || !mythForm.content.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide both a title and content for the myth article.',
        variant: 'destructive',
      });
      return;
    }

    setSavingMyth(true);
    try {
      const tags = mythForm.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
      await upsertMythArticle.mutateAsync({
        title: mythForm.title.trim(),
        content: mythForm.content.trim(),
        tags,
        isPublished: mythForm.isPublished,
      });
      setMythForm({ title: '', content: '', tags: '', isPublished: true });
      toast({ title: 'Myth article saved', description: 'It is now available in the knowledge base.' });
    } catch (error) {
      toast({
        title: 'Unable to save myth',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setSavingMyth(false);
    }
  };

  const handleTogglePublish = async (id: string, isPublished: boolean, title: string, content: string, tags?: string[] | null) => {
    try {
      await upsertMythArticle.mutateAsync({
        id,
        title,
        content,
        tags: tags ?? [],
        isPublished,
      });
      toast({ title: 'Myth updated', description: `Article is now ${isPublished ? 'published' : 'draft'}.'` });
    } catch (error) {
      toast({
        title: 'Unable to update myth',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteMyth = async (id: string) => {
    setDeletingMythId(id);
    try {
      await deleteMythArticle.mutateAsync(id);
      toast({ title: 'Myth deleted', description: 'The article has been removed.' });
    } catch (error) {
      toast({
        title: 'Unable to delete myth',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setDeletingMythId(null);
    }
  };

  return (
    <AppLayout title="Admin Dashboard">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} variant="elevated" className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', stat.color)}>
                    {analyticsLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
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

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="w-full grid grid-cols-4 h-auto p-1 bg-muted">
            <TabsTrigger value="users" className="text-xs py-2">
              Users
            </TabsTrigger>
            <TabsTrigger value="pairings" className="text-xs py-2">
              Pairings
            </TabsTrigger>
            <TabsTrigger value="consent" className="text-xs py-2">
              Consent
            </TabsTrigger>
            <TabsTrigger value="ai" className="text-xs py-2">
              AI Logs
            </TabsTrigger>
          </TabsList>

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

            {usersError ? (
              <Card variant="destructive">
                <CardContent className="py-8 text-center text-sm text-destructive-foreground">
                  <p className="mb-3">Unable to load users right now.</p>
                  <Button variant="outline" size="sm" onClick={() => refetchUsers()}>
                    Try again
                  </Button>
                </CardContent>
              </Card>
            ) : usersLoading ? (
              <Card variant="soft">
                <CardContent className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading users...
                </CardContent>
              </Card>
            ) : filteredUsers.length === 0 ? (
              <Card variant="soft">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No users match your search.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <Card key={user.id} variant="default" className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold uppercase',
                            user.role === 'PRIMARY'
                              ? 'bg-primary-soft text-primary'
                              : user.role === 'ADMIN'
                              ? 'bg-peach/30 text-peach-foreground'
                              : 'bg-lavender/30 text-lavender-foreground'
                          )}
                        >
                          {(user.profiles?.name?.[0] ?? user.id[0] ?? 'U').toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium text-foreground text-sm">{user.id}</p>
                          <div className="flex items-center gap-2">
                            <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', statusTone[user.status] ?? 'bg-muted')}>
                              {user.status.toLowerCase()}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</span>
                          </div>
                          {user.profiles?.name && (
                            <p className="text-xs text-muted-foreground">{user.profiles.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-36">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingUserId === user.id || user.status === 'ACTIVE'}
                          onClick={() => handleUserUpdate(user.id, { status: 'ACTIVE' })}
                        >
                          Set Active
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingUserId === user.id || user.status === 'SUSPENDED'}
                          onClick={() => handleUserUpdate(user.id, { status: 'SUSPENDED' })}
                        >
                          Suspend
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={updatingUserId === user.id || user.role === 'ADMIN'}
                          onClick={() => handleUserUpdate(user.id, { role: 'ADMIN' })}
                        >
                          Promote to Admin
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="pairings" className="mt-4 space-y-3">
            {pairingsError ? (
              <Card variant="destructive">
                <CardContent className="py-8 text-center text-destructive-foreground text-sm">
                  Unable to load pairings.
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={() => refetchPairings()}>
                      Try again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : pairingsLoading ? (
              <Card variant="soft">
                <CardContent className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading pairings...
                </CardContent>
              </Card>
            ) : !pairings || pairings.length === 0 ? (
              <Card variant="soft">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No pairings found.
                </CardContent>
              </Card>
            ) : (
              pairings.map((pairing) => (
                <Card key={pairing.id} variant="default" className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full capitalize', statusTone[pairing.status] ?? 'bg-muted')}>
                      {pairing.status.toLowerCase()}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(pairing.created_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-foreground font-medium">Primary: {pairing.primary_user_id}</span>
                    <Link2 className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Partner: {pairing.partner_user_id ?? 'Pending acceptance'}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      Consent keys: {pairing.consent_settings ? Object.keys(pairing.consent_settings).length : 0}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={pairing.status !== 'ACTIVE' || unpairingId === pairing.id}
                      onClick={() => handleForceUnpair(pairing.id)}
                    >
                      {unpairingId === pairing.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Force unpair'
                      )}
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="consent" className="mt-4 space-y-3">
            {consentError ? (
              <Card variant="destructive">
                <CardContent className="py-8 text-center text-destructive-foreground text-sm">
                  Unable to load consent logs.
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={() => refetchConsent()}>
                      Try again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : consentLoading ? (
              <Card variant="soft">
                <CardContent className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading consent logs...
                </CardContent>
              </Card>
            ) : !consentLogs || consentLogs.length === 0 ? (
              <Card variant="soft">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No recent consent changes.
                </CardContent>
              </Card>
            ) : (
              consentLogs.map((log) => (
                <Card key={log.id} variant="default" className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground text-sm">{log.action}</p>
                      <p className="text-xs text-muted-foreground mt-1">Actor: {log.actor_user_id}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="ai" className="mt-4 space-y-3">
            {aiError ? (
              <Card variant="destructive">
                <CardContent className="py-8 text-center text-destructive-foreground text-sm">
                  Unable to load AI interactions.
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={() => refetchAI()}>
                      Try again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : aiLoading ? (
              <Card variant="soft">
                <CardContent className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading AI activity...
                </CardContent>
              </Card>
            ) : !aiInteractions || aiInteractions.length === 0 ? (
              <Card variant="soft">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  No AI interactions recorded yet.
                </CardContent>
              </Card>
            ) : (
              aiInteractions.map((log) => (
                <Card key={log.id} variant="default" className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-peach/30">
                      <Sparkles className="h-4 w-4 text-peach-foreground" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium text-foreground text-sm">{log.type}</p>
                      <p className="text-xs text-muted-foreground">User: {log.user_id}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">Prompt: {log.prompt}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        <Card variant="gradient">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Myth Articles</CardTitle>
            </div>
            <CardDescription>Educate users with trustworthy, moderated content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-3">
                <Input
                  placeholder="Title"
                  value={mythForm.title}
                  onChange={(e) => setMythForm((prev) => ({ ...prev, title: e.target.value }))}
                />
                <Textarea
                  placeholder="Content"
                  value={mythForm.content}
                  onChange={(e) => setMythForm((prev) => ({ ...prev, content: e.target.value }))}
                  className="min-h-[140px]"
                />
                <Input
                  placeholder="Tags (comma separated)"
                  value={mythForm.tags}
                  onChange={(e) => setMythForm((prev) => ({ ...prev, tags: e.target.value }))}
                />
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
                  <span className="text-sm text-foreground">Publish immediately</span>
                  <Switch
                    checked={mythForm.isPublished}
                    onCheckedChange={(checked) => setMythForm((prev) => ({ ...prev, isPublished: checked }))}
                  />
                </div>
                <Button onClick={handleCreateMyth} disabled={savingMyth}>
                  {savingMyth ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save article'}
                </Button>
              </div>

              <div className="space-y-3">
                {mythsError ? (
                  <div className="flex flex-col items-center justify-center gap-3 text-sm text-destructive">
                    <AlertTriangle className="h-5 w-5" />
                    <p>Unable to load myth articles.</p>
                    <Button variant="outline" size="sm" onClick={() => refetchMyths()}>
                      Retry
                    </Button>
                  </div>
                ) : mythsLoading ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading articles...
                  </div>
                ) : !mythArticles || mythArticles.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No myth articles yet. Create one using the form.</div>
                ) : (
                  <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                    {mythArticles.map((article) => (
                      <Card key={article.id} variant="soft" className="p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-sm text-foreground">{article.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{article.content}</p>
                          </div>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded-full',
                              article.is_published ? 'bg-sage/30 text-sage-foreground' : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {article.is_published ? 'Published' : 'Draft'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{article.tags?.length ? article.tags.join(', ') : 'No tags'}</span>
                          <span>{new Date(article.created_at).toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleTogglePublish(
                                article.id,
                                !article.is_published,
                                article.title,
                                article.content,
                                article.tags
                              )
                            }
                          >
                            {article.is_published ? 'Unpublish' : 'Publish'}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            disabled={deletingMythId === article.id}
                            onClick={() => handleDeleteMyth(article.id)}
                          >
                            {deletingMythId === article.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Trash2 className="h-4 w-4 mr-1" /> Delete
                              </>
                            )}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
