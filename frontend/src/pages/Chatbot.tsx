import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { useSendMessage, useChatHistory, useClearHistory } from '@/hooks/api/chatbot';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useAuth } from '@/contexts/AuthContext';

export default function Chatbot() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { data: history, isLoading: historyLoading } = useChatHistory();
  const sendMessage = useSendMessage();
  const clearHistory = useClearHistory();

  const isPartner = user?.role === 'partner';

  const config = {
    title: isPartner ? "Luna 🌙 - Partner Guide" : "Luna 🌙 - Your Cycle Companion",
    description: isPartner 
      ? "Ask me how to support your partner based on her cycle"
      : "Ask me anything about your cycle, symptoms, or how you're feeling",
    emptyTitle: isPartner ? "Ask for guidance" : "Start a conversation",
    emptyDescription: isPartner 
      ? "I can explain your partner's current phase and suggest ways to help."
      : "Ask me about your cycle, symptoms, mood, or anything else you'd like to understand better.",
    prompts: isPartner 
      ? [
          "How can I support her today?",
          "What phase is she in?",
          "Why is she feeling tired?",
        ]
      : [
          "How am I feeling today?",
          "What should I eat?",
          "Why do I feel tired?",
        ]
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage(''); // Clear input immediately
    
    try {
      await sendMessage.mutateAsync(userMessage);
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleClear = async () => {
    if (!history || history.length === 0) return;
    
    try {
      await clearHistory.mutateAsync();
      toast({
        title: 'History cleared',
        description: 'Your chat history has been cleared.',
      });
    } catch (error) {
      toast({
        title: 'Failed to clear history',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AppLayout title="AI Assistant">
      <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] animate-fade-in">
        {/* Header */}
        <Card variant="elevated" className="mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-primary-soft">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">{config.title}</CardTitle>
                  <CardDescription>
                    {config.description}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                disabled={!history || history.length === 0 || clearHistory.isPending}
              >
                {clearHistory.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* Disclaimer */}
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            💕 This AI assistant provides educational information only, not medical advice. 
            Always consult a healthcare provider for medical concerns.
          </AlertDescription>
        </Alert>

        {/* Messages */}
        <Card variant="elevated" className="flex-1 flex flex-col overflow-hidden">
          <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
            {historyLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : !history || history.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
                <div className="p-4 rounded-full bg-primary-soft">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">{config.emptyTitle}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    {config.emptyDescription}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {config.prompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      onClick={() => setMessage(prompt)}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {history.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex',
                      msg.role === 'USER' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[80%] rounded-2xl px-4 py-3',
                        msg.role === 'USER'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      )}
                    >
                      {msg.role === 'USER' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      ) : (
                        <MarkdownMessage content={msg.message} className="text-sm" />
                      )}
                      <span className="text-xs opacity-70 mt-1 block">
                        {new Date(msg.created_at).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                ))}
                {sendMessage.isPending && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-muted flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Luna is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </CardContent>
        </Card>

        {/* Input */}
        <Card variant="elevated" className="mt-4">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sendMessage.isPending}
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessage.isPending}
                variant="gradient"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
