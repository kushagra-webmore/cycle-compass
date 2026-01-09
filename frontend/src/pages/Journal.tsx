import { useMemo, useState } from 'react';
import { Save, Sparkles, BookOpen, Calendar, Loader2, RefreshCcw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { useJournalEntries, useCreateJournal, useDeleteJournal } from '@/hooks/api/journals';
import { useJournalSummary } from '@/hooks/api/ai';

const prompts = [
  'How is my body feeling today?',
  'What emotions am I experiencing?',
  'What do I need most right now?',
  'What am I grateful for today?',
];

export default function Journal() {
  const { data, isLoading, isError, refetch } = useJournalEntries();
  const createJournal = useCreateJournal();
  const deleteJournal = useDeleteJournal();
  const journalSummary = useJournalSummary();
  const [entry, setEntry] = useState('');
  const [aiReflection, setAiReflection] = useState(true);
  const [latestReflection, setLatestReflection] = useState<string | null>(null);
  const { toast } = useToast();

  const entries = useMemo(() => data ?? [], [data]);

  const handleSave = async () => {
    if (!entry.trim()) {
      toast({
        title: 'Empty entry',
        description: 'Please write something before saving.',
        variant: 'destructive',
      });
      return;
    }

    try {
      let aiSummary: string | undefined;
      if (aiReflection) {
        const response = await journalSummary.mutateAsync([entry.trim()]);
        aiSummary = response.summary;
        setLatestReflection(response.summary);
      } else {
        setLatestReflection(null);
      }

      await createJournal.mutateAsync({
        date: new Date().toISOString(),
        encryptedText: entry.trim(),
        aiSummary,
      });

      setEntry('');
      toast({
        title: 'Journal saved! 📝',
        description: aiReflection ? 'Your AI reflection is ready below.' : 'Your thoughts have been recorded.',
      });
    } catch (error) {
      setLatestReflection(null);
      toast({
        title: 'Unable to save entry',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this journal entry?')) return;
    
    try {
      await deleteJournal.mutateAsync(id);
      toast({
        title: 'Journal deleted',
        description: 'Your entry has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Unable to delete entry',
        description: 'Please try again later.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <AppLayout title="Journal">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
          <p className="text-sm">Loading your journal entries...</p>
        </div>
      </AppLayout>
    );
  }

  if (isError) {
    return (
      <AppLayout title="Journal">
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
          <Sparkles className="h-8 w-8 text-destructive" />
          <div className="space-y-1 text-center">
            <p className="font-medium text-foreground">We couldn't load your journal right now.</p>
            <p className="text-sm text-muted-foreground">Please try refreshing or come back later.</p>
          </div>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Try again
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Journal">
      <div className="space-y-5 animate-fade-in">
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center justify-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Your Private Space
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <Card variant="lavender">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Need inspiration?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {prompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => setEntry((prev) => prev + (prev ? '\n\n' : '') + prompt + '\n')}
                  className="px-3 py-1.5 text-xs rounded-full bg-card border border-border text-foreground hover:bg-muted transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent className="pt-5 space-y-4">
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Write your thoughts here... This is your private space to reflect on how you're feeling."
              className="min-h-[200px] resize-none border-none bg-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
            />

            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <Label htmlFor="ai-reflection" className="font-medium text-foreground">AI Reflection</Label>
                  <p className="text-xs text-muted-foreground">Get a gentle, supportive reflection with your entry.</p>
                </div>
              </div>
              <Switch
                id="ai-reflection"
                checked={aiReflection}
                onCheckedChange={setAiReflection}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          variant="gradient"
          size="xl"
          className="w-full"
          onClick={handleSave}
          disabled={createJournal.isPending || journalSummary.isPending}
        >
          {createJournal.isPending || journalSummary.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </span>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Entry
            </>
          )}
        </Button>

        {latestReflection && (
          <Card variant="sage" className="animate-fade-in border-2 border-sage/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sage-foreground" />
                <CardTitle className="text-base text-sage-foreground">AI Reflection</CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground">A gentle summary based on your latest entry.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-line">{latestReflection}</p>
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Recent Entries
          </h3>

          {entries.length === 0 ? (
            <Card variant="soft">
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No journal entries yet. Start by writing your first reflection above.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {entries.map((item) => (
                <Card key={item.id} variant="default" className="transition-shadow group relative">
                  <CardContent className="py-4 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(item.date ?? item.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                      })}</span>
                      <span>{item.ai_summary ? 'AI reflection saved' : 'Manual entry'}</span>
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-line line-clamp-3">
                      {item.encrypted_text}
                    </p>
                    {item.ai_summary && (
                      <div className="rounded-lg bg-sage/15 p-3 text-xs text-sage-foreground whitespace-pre-line">
                        {item.ai_summary}
                      </div>
                    )}
                    <div className="absolute top-4 right-4">
                      <Button
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => handleDelete(item.id)}
                        disabled={deleteJournal.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground">🔒 Journals are private by default. Only you can see them.</p>
        </div>
      </div>
    </AppLayout>
  );
}
