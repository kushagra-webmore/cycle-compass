import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Bell } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { usePushNotifications } from '@/hooks/usePushNotifications';

interface ReminderSettingsProps {
  // We can pass initial settings or fetch inside
  onSave?: (settings: any) => void;
}

export function ReminderSettings({ onSave }: ReminderSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('22:00');
  const [interval, setInterval] = useState(60);
  const [loading, setLoading] = useState(false);
  const { subscribeToPush, subscription } = usePushNotifications();

  // In a real app, use React Query or useEffect to fetch current settings
  useEffect(() => {
    if (isOpen) {
       const fetchSettings = async () => {
         try {
           const data = await apiFetch<any>('/notifications/settings', { auth: true });
           setEnabled(data.enabled);
           setStartTime(data.reminder_start_time.slice(0, 5)); // HH:MM
           setEndTime(data.reminder_end_time.slice(0, 5));
           setInterval(data.reminder_interval_minutes);
         } catch(e) { console.error(e); }
       };
       fetchSettings();
    }
  }, [isOpen]);

  const handleSave = async () => {
    if (interval < 15) {
      toast.error('Interval must be at least 15 minutes');
      return;
    }

    setLoading(true);
    try {
      const settings = {
        enabled,
        reminder_start_time: startTime,
        reminder_end_time: endTime,
        reminder_interval_minutes: Number(interval)
      };
      
      await apiFetch('/notifications/settings', {
        method: 'PUT',
        auth: true,
        body: JSON.stringify(settings)
      });
      
      // If enabled, ensure we are subscribed
      if (enabled && Notification.permission === 'granted' && !subscription) {
          await subscribeToPush();
      }

      toast.success('Reminder settings saved!');
      setIsOpen(false);
      onSave?.(settings);
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800">
          <Settings className="w-5 h-5 text-slate-500" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Hydration Reminders
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="notifications" className="flex flex-col space-y-1">
              <span>Enable Notifications</span>
              <span className="font-normal text-xs text-muted-foreground">Receive periodic reminders to drink water</span>
            </Label>
            <Switch id="notifications" checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input 
                id="start-time" 
                type="time" 
                value={startTime} 
                onChange={(e) => setStartTime(e.target.value)}
                disabled={!enabled}
                className="bg-white dark:bg-slate-900"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input 
                id="end-time" 
                type="time" 
                value={endTime} 
                onChange={(e) => setEndTime(e.target.value)}
                disabled={!enabled}
                className="bg-white dark:bg-slate-900"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="interval">Interval (minutes)</Label>
            <div className="flex items-center gap-4">
                <Input 
                    id="interval" 
                    type="number" 
                    min="15"
                    step="15"
                    value={interval} 
                    onChange={(e) => setInterval(Number(e.target.value))}
                    disabled={!enabled}
                    className="bg-white dark:bg-slate-900"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">min</span>
            </div>
             <p className="text-[0.8rem] text-muted-foreground">
              We'll remind you if you haven't logged water for this long.
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center gap-3">
          <Button variant="secondary" size="sm" onClick={async () => {
             // 1. Check/Request Permission & Subscribe
             if (Notification.permission !== 'granted') {
                 const perm = await Notification.requestPermission();
                 if (perm !== 'granted') {
                     toast.error('Notification permission denied');
                     return;
                 }
             }

             // Ensure backend has subscription
             await subscribeToPush();

             const loadingToast = toast.loading('Sending test...');
             try {
                // Short delay to ensure subscription propagation
                await new Promise(r => setTimeout(r, 500));
                
                const res = await apiFetch<{ message: string }>('/notifications/test', { method: 'POST', auth: true });
                toast.dismiss(loadingToast);
                toast.success('Test sent! Check notification center.');
             } catch (e) {
                toast.dismiss(loadingToast);
                toast.error('Failed to send test notification');
             }
          }}>
             Test Notification
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={loading}>Save Changes</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
