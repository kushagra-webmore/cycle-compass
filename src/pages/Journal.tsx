import { useState } from 'react';
import { Save, Sparkles, BookOpen, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';

export default function Journal() {
  const [entry, setEntry] = useState('');
  const [aiReflection, setAiReflection] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showReflection, setShowReflection] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!entry.trim()) {
      toast({
        title: "Empty entry",
        description: "Please write something before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 1500));

    if (aiReflection) {
      setShowReflection(true);
    }

    toast({
      title: "Journal saved! 📝",
      description: aiReflection ? "Check out the AI reflection below." : "Your thoughts have been recorded.",
    });
    setIsSaving(false);
  };

  const mockReflection = `It sounds like you're navigating some complex emotions today. The feelings you've described are completely valid and part of your natural cycle. 

Consider taking some time for self-care activities that resonate with you. Whether that's a warm bath, gentle stretching, or simply resting – listen to what your body needs.

Remember: It's okay to not feel okay sometimes. 💕`;

  const prompts = [
    "How is my body feeling today?",
    "What emotions am I experiencing?",
    "What do I need most right now?",
    "What am I grateful for today?",
  ];

  return (
    <AppLayout title="Journal">
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="text-center">
          <h2 className="font-display text-xl font-bold text-foreground flex items-center justify-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Your Private Space
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Writing Prompts */}
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

        {/* Journal Entry */}
        <Card variant="elevated">
          <CardContent className="pt-5">
            <Textarea
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
              placeholder="Write your thoughts here... This is your private space to reflect on how you're feeling."
              className="min-h-[200px] resize-none border-none bg-transparent focus-visible:ring-0 text-foreground placeholder:text-muted-foreground"
            />
          </CardContent>
        </Card>

        {/* AI Reflection Toggle */}
        <Card variant="soft">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label htmlFor="ai-reflection" className="font-medium text-foreground">AI Reflection</Label>
                <p className="text-xs text-muted-foreground">Get a gentle, supportive reflection</p>
              </div>
            </div>
            <Switch
              id="ai-reflection"
              checked={aiReflection}
              onCheckedChange={setAiReflection}
            />
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          variant="gradient"
          size="xl"
          className="w-full"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <span className="animate-pulse">Saving...</span>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Save Entry
            </>
          )}
        </Button>

        {/* AI Reflection Result */}
        {showReflection && (
          <Card variant="sage" className="animate-fade-in border-2 border-sage/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-sage-foreground" />
                <CardTitle className="text-base text-sage-foreground">AI Reflection</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground whitespace-pre-line">{mockReflection}</p>
            </CardContent>
          </Card>
        )}

        {/* Past Entries */}
        <div>
          <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Recent Entries
          </h3>
          <div className="space-y-3">
            {[
              { date: 'Yesterday', preview: 'Feeling a bit tired today but overall positive...' },
              { date: '2 days ago', preview: 'Had a really productive morning. Energy was high...' },
            ].map((entry, i) => (
              <Card key={i} variant="default" className="cursor-pointer hover:shadow-card transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">{entry.date}</span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">{entry.preview}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Privacy Note */}
        <div className="text-center p-3 rounded-xl bg-muted/50">
          <p className="text-xs text-muted-foreground">
            🔒 Journals are private by default. Only you can see them.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
