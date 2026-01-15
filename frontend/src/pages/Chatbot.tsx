import { useState, useRef, useEffect } from 'react';
import { Send, Trash2, Sparkles, Loader2, AlertCircle, Plus, MessageSquare, Menu, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppLayout } from '@/components/layout/AppLayout';
import { MarkdownMessage } from '@/components/MarkdownMessage';
import { 
  useSendMessage, 
  useChatHistory, 
  useChatSessions, 
  useDeleteSession 
} from '@/hooks/api/chatbot';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { format, isToday, isYesterday } from 'date-fns';

export default function Chatbot() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState<string | undefined>(undefined);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const { data: sessions, isLoading: sessionsLoading } = useChatSessions();
  const { data: history, isLoading: historyLoading } = useChatHistory(selectedSessionId);
  const sendMessage = useSendMessage(selectedSessionId);
  const deleteSession = useDeleteSession();

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
  }, [history, sendMessage.isPending]);

  // Clear message input when switching sessions
  useEffect(() => {
    setMessage('');
  }, [selectedSessionId]);

  const handleSend = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage(''); // Clear input immediately
    
    try {
      const response = await sendMessage.mutateAsync(userMessage);
      
      // If this was a new chat (no sessionId), set the new sessionId
      if (!selectedSessionId && response.sessionId) {
        setSelectedSessionId(response.sessionId);
      }
    } catch (error) {
      toast({
        title: 'Failed to send message',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
      setMessage(userMessage); // Restore message on error
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (!sessionId) return;
    
    try {
      await deleteSession.mutateAsync(sessionId);
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(undefined); // Reset to new chat
      }
      toast({
        title: 'Chat deleted',
        description: 'The conversation has been removed.',
      });
    } catch (error) {
      toast({
        title: 'Failed to delete chat',
        description: 'Please try again',
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

  // Group sessions by date
  const groupedSessions = sessions?.reduce((acc, session) => {
    const date = new Date(session.updated_at);
    let key = format(date, 'MMMM d, yyyy');
    if (isToday(date)) key = 'Today';
    if (isYesterday(date)) key = 'Yesterday';
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(session);
    return acc;
  }, {} as Record<string, typeof sessions>);

  const SidebarContent = ({ isMobile }: { isMobile?: boolean } = {}) => (
    <div className="flex flex-col h-full bg-card/50">
      <div className={cn("p-4 border-b", isMobile && "pr-12 pt-5")}>
        <Button 
          className="w-full justify-start gap-2" 
          variant={!selectedSessionId ? "secondary" : "ghost"}
          onClick={() => {
            setSelectedSessionId(undefined);
            setIsSidebarOpen(false);
          }}
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sessionsLoading ? (
            <div className="flex justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
        ) : !sessions || sessions.length === 0 ? (
          <div className="text-center text-muted-foreground text-sm p-4">
            No history yet
          </div>
        ) : (
          Object.entries(groupedSessions || {}).map(([date, dateSessions]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-muted-foreground mb-2 px-2">{date}</h3>
              <div className="space-y-1">
                {dateSessions?.map((session) => (
                  <div
                    key={session.id}
                    className={cn(
                      "group flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors",
                      selectedSessionId === session.id && "bg-accent text-accent-foreground font-medium"
                    )}
                    onClick={() => {
                      setSelectedSessionId(session.id);
                      setIsSidebarOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                      <MessageSquare className="h-4 w-4 shrink-0 opacity-50" />
                      <span className="truncate">{session.title || "Untitled Chat"}</span>
                    </div>
                    {/* Only show delete button on hover or if active */}
                    <div className="flex items-center gap-1">
                        <span className="text-[10px] text-muted-foreground whitespace-nowrap opacity-60">
                            {format(new Date(session.updated_at), 'h:mm a')}
                        </span>
                        <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        >
                        <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                        </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <AppLayout title="AI Assistant">
      <div className="flex h-[calc(100vh-10rem)] max-h-[800px] gap-4 animate-fade-in relative">
        
        {/* Desktop Sidebar */}
        <div className="hidden md:flex w-64 flex-col rounded-xl border bg-card shadow-sm overflow-hidden shrink-0">
          <SidebarContent />
        </div>

        {/* Mobile Sidebar Trigger */}
        <div className="md:hidden absolute top-3 left-4 z-10">
          <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="h-8 w-8 bg-background/80 backdrop-blur">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85%] max-w-[300px] p-0">
              <SheetTitle className="sr-only">Chat History</SheetTitle>
              <SidebarContent isMobile />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-xl border bg-card shadow-sm relative">
          {/* Messages Header - Optional, mainly for context */}
          <div className="h-14 border-b flex items-center px-4 bg-muted/20 justify-between">
             <div className="flex items-center gap-2 pl-12 md:pl-0">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm truncate max-w-[200px] md:max-w-full">
                  {selectedSessionId 
                    ? sessions?.find(s => s.id === selectedSessionId)?.title || config.title
                    : config.title}
                </span>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Disclaimer */}
            <Alert className="mb-4 bg-primary-soft/50 border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-xs text-primary-dark">
                This AI assistant provides educational information only, not medical advice.
              </AlertDescription>
            </Alert>

            {/* Empty State / Loading / Messages */}
            {historyLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (!history || history.length === 0) && !sendMessage.isPending ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 p-8">
                <div className="p-4 rounded-full bg-primary-soft animate-pulse-slow">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-2">{config.emptyTitle}</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {config.emptyDescription}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center max-w-md">
                  {config.prompts.map((prompt, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => {
                        setMessage(prompt);
                      }}
                    >
                      {prompt}
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {history?.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex w-full animate-slide-up',
                      msg.role === 'USER' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 shadow-sm',
                        msg.role === 'USER'
                          ? 'bg-primary text-primary-foreground rounded-br-none'
                          : 'bg-muted text-foreground rounded-bl-none'
                      )}
                    >
                      {msg.role === 'USER' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      ) : (
                        <MarkdownMessage content={msg.message} className="text-sm" />
                      )}
                      
                      {/* Timestamp & Integrity Check */}
                      <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                         {msg.context_type === 'OPTIMISTIC' && (
                            <Clock className="h-3 w-3 animate-pulse" />
                         )}
                         <span className="text-[10px]">
                            {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : '...'}
                         </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {sendMessage.isPending && (
                  <div className="flex justify-start animate-slide-up">
                    <div className="bg-muted rounded-2xl rounded-bl-none px-4 py-3 flex items-center gap-2">
                       <span className="flex gap-1">
                         <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                         <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                         <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce"></span>
                       </span>
                       <span className="text-xs text-muted-foreground">Luna is typing...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="p-4 border-t bg-card/50 backdrop-blur">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={sendMessage.isPending}
                className="flex-1"
                autoFocus
              />
              <Button
                onClick={handleSend}
                disabled={!message.trim() || sendMessage.isPending}
                variant="gradient"
                className="shadow-md hover:shadow-lg transition-all"
              >
                {sendMessage.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
