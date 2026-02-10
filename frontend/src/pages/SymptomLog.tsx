import { useState, useRef } from 'react';
import { Save, Droplets, Heart, Battery, Moon, Activity, Shield, Calendar as CalendarIcon, Wind, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useCurrentCycle, useLogSymptom } from '@/hooks/api/cycles';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { getLocalDateString } from '@/lib/utils';

const moodOptions = [
  { value: 'HIGH', emoji: '😊', label: 'Great' },
  { value: 'NEUTRAL', emoji: '🙂', label: 'Good' },
  { value: 'LOW_OKAY', emoji: '😐', label: 'Okay' },
  { value: 'LOW_BAD', emoji: '😔', label: 'Low' },
];

const energyOptions = [
  { value: 'HIGH', emoji: '⚡', label: 'High' },
  { value: 'MEDIUM', emoji: '🔋', label: 'Medium' },
  { value: 'LOW', emoji: '😴', label: 'Low' },
];

const flowOptions = [
  { value: 'Light', label: 'Light', icon: '💧' },
  { value: 'Medium', label: 'Medium', icon: '💧💧' },
  { value: 'Heavy', label: 'Heavy', icon: '🌊' },
];

const symptomOptions = [
  { id: 'bloating', label: 'Bloating', icon: '🎈' },
  { id: 'cramps', label: 'Cramps', icon: '⚡' },
  { id: 'tender_breasts', label: 'Tender Breasts', icon: '🍈' },
  { id: 'headache', label: 'Headache', icon: '🤕' },
  { id: 'acne', label: 'Acne', icon: '🔴' },
  { id: 'backache', label: 'Backache', icon: '🦴' },
  { id: 'fatigue', label: 'Fatigue', icon: '💤' },
  { id: 'tiredness', label: 'Tiredness', icon: '😫' },
  { id: 'diarrhea', label: 'Diarrhea', icon: '🚽' },
  { id: 'constipation', label: 'Constipation', icon: '🧱' },
  { id: 'leg_cramps', label: 'Leg Cramps', icon: '🦵' },
];

const sleepMap: Record<string, number> = {
  great: 8,
  good: 7,
  poor: 5,
  bad: 4,
};

export default function SymptomLog() {
  const { data: cycle } = useCurrentCycle();
  const logSymptom = useLogSymptom();
  
  // Date State - Default to Today (Local)
  const [logDate, setLogDate] = useState(getLocalDateString());
  const dateInputRef = useRef<HTMLInputElement>(null);
  
  const [pain, setPain] = useState([0]); // Slider expects array
  const [flow, setFlow] = useState<string | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [cravings, setCravings] = useState('');
  
  const [mood, setMood] = useState<string>('');
  const [energy, setEnergy] = useState<string>('');
  const [sleep, setSleep] = useState<string>('');
  
  // Intercourse Tracking
  const [intercourse, setIntercourse] = useState(false);
  const [protection, setProtection] = useState(false);

  const { toast } = useToast();

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!cycle) return;

    try {
      const hasBloating = selectedSymptoms.includes('bloating');
      const hasCramps = selectedSymptoms.includes('cramps');
      
      // Combine other symptoms into a note if needed, or rely on backend to just ignore them if not in schema?
      // For now, adhering to existing schema mapping where possible.
      // Assuming backend handles extra data gracefully or ignoring it implies we need to update backend too for full support.
      // But preserving user request for UI first.
      
      await logSymptom.mutateAsync({
        cycleId: cycle.id,
        date: logDate,
        pain: pain[0],
        mood: (mood === 'LOW_OKAY' || mood === 'LOW_BAD' ? 'LOW' : mood || 'NEUTRAL') as 'LOW' | 'NEUTRAL' | 'HIGH',
        energy: (energy || 'MEDIUM') as 'LOW' | 'MEDIUM' | 'HIGH',
        sleepHours: sleep ? sleepMap[sleep] : undefined,
        bloating: hasBloating,
        cravings: cravings || (selectedSymptoms.includes('cravings') ? 'Yes' : undefined),
        intercourse,
        protection: intercourse ? protection : undefined,
        flow: flow || undefined,
        otherSymptoms: selectedSymptoms,
      });

      toast({
        title: 'Entry saved! 🌸',
        description: `Log for ${format(new Date(logDate), 'MMMM d')} updated.`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not save log.',
        variant: 'destructive',
      });
    }
  };

  return (
    <AppLayout title="Log Symptoms">
      <div className="space-y-6 pb-20 animate-fade-in px-1">
        
        {/* Date Picker Section */}
        <Card className="border-none shadow-none bg-transparent">
          <div className="flex items-center justify-center gap-2">
             <CalendarIcon 
               className="h-5 w-5 text-muted-foreground cursor-pointer" 
               onClick={() => dateInputRef.current?.showPicker()}
             />
             <Input 
               ref={dateInputRef}
               type="date" 
               value={logDate} 
               max={getLocalDateString()}
               onChange={(e) => setLogDate(e.target.value)}
               className="w-auto font-display font-semibold text-lg bg-transparent border-none shadow-none focus-visible:ring-0 cursor-pointer dark:bg-card/50 dark:px-3 [&::-webkit-calendar-picker-indicator]:hidden"
             />
          </div>
        </Card>

        {/* Period Flow */}
        <Card className="border-l-4 border-l-blue-400 dark:border-l-blue-600">
          <CardHeader className="pb-3">
             <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-4 w-4 text-blue-500" /> Period Flow
             </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {flowOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFlow(flow === opt.value ? null : opt.value)}
                  className={cn(
                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                    flow === opt.value 
                      ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 dark:border-blue-400 text-blue-700 dark:text-blue-100 shadow-sm" 
                      : "border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <span className="text-2xl mb-1">{opt.icon}</span>
                  <span className="text-xs font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Physical Signs */}
        <Card className="border-l-4 border-l-pink-400 dark:border-l-pink-600">
          <CardHeader className="pb-3">
             <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-pink-500" /> Physical Signs
             </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {symptomOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggleSymptom(opt.id)}
                  className={cn(
                    "flex flex-col items-center p-2 rounded-xl transition-all h-24 justify-center border-2",
                    selectedSymptoms.includes(opt.id) 
                      ? "bg-pink-50 dark:bg-pink-950/40 border-pink-400 dark:border-pink-500 text-pink-700 dark:text-pink-100 shadow-sm" 
                      : "border-transparent bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <span className="text-2xl mb-1">{opt.icon}</span>
                  <span className="text-[10px] leading-tight font-medium text-center">{opt.label}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Cravings */}
        <Card className="border-l-4 border-l-orange-400 dark:border-l-orange-600">
           <CardHeader className="pb-3">
              <CardTitle className="text-base">Cravings</CardTitle>
           </CardHeader>
           <CardContent>
              <Textarea 
                placeholder="Chocolate, salty snacks, sweets..." 
                value={cravings}
                onChange={(e) => setCravings(e.target.value)}
                className="resize-none bg-muted/30 border-none focus-visible:ring-1 focus-visible:ring-primary"
              />
           </CardContent>
        </Card>

        {/* Pain Level */}
        <Card className="border-l-4 border-l-rose-500 dark:border-l-rose-700">
           <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-rose-500" /> Pain Level
                </CardTitle>
                <span className="text-sm font-bold text-rose-500 bg-rose-50 dark:bg-rose-950/40 px-2 py-1 rounded-md">
                   {pain[0] === 0 ? 'None' : pain[0]}
                </span>
              </div>
           </CardHeader>
           <CardContent>
              <Slider
                value={pain}
                onValueChange={setPain}
                max={10}
                step={1}
                className="py-4 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                 <span>No Pain</span>
                 <span>Moderate</span>
                 <span>Severe</span>
              </div>
           </CardContent>
        </Card>

        {/* Intercourse & Protection */}
        <Card className="border-l-4 border-l-violet-500 dark:border-l-violet-700">
           <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-violet-500" />
                    <Label className="text-base">Intercourse</Label>
                 </div>
                 <Switch checked={intercourse} onCheckedChange={setIntercourse} />
              </div>
              
              {intercourse && (
                <div className="flex items-center justify-between pl-7 animate-in slide-in-from-top-2">
                   <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-500" />
                      <Label className="text-sm text-muted-foreground">Protection Used?</Label>
                   </div>
                   <Switch checked={protection} onCheckedChange={setProtection} />
                </div>
              )}
           </CardContent>
        </Card>

        {/* Mood & Energy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
           <Card className="border-l-4 border-l-amber-400 dark:border-l-amber-600">
             <CardHeader className="p-4 pb-2">
               <CardTitle className="text-sm">Mood</CardTitle>
             </CardHeader>
             <CardContent className="p-4 pt-0 select-none">
                <div className="flex justify-between gap-1">
                  {moodOptions.map(m => (
                    <button 
                      key={m.value} 
                      onClick={() => setMood(m.value)} 
                      className={cn(
                        "flex flex-col items-center p-2 rounded-lg transition-all hover:bg-muted w-full", 
                        mood === m.value ? "bg-amber-100 dark:bg-amber-900/40 scale-105 shadow-sm" : "opacity-70 hover:opacity-100"
                      )}
                    >
                      <span className="text-2xl">{m.emoji}</span>
                      <span className="text-[10px] font-medium mt-1">{m.label}</span>
                    </button>
                  ))}
                </div>
             </CardContent>
           </Card>
           
           <Card className="border-l-4 border-l-yellow-400 dark:border-l-yellow-600">
             <CardHeader className="p-4 pb-2">
               <CardTitle className="text-sm">Energy</CardTitle>
             </CardHeader>
             <CardContent className="p-4 pt-0 select-none">
                <div className="flex justify-between gap-1">
                  {energyOptions.map(e => (
                    <button 
                      key={e.value} 
                      onClick={() => setEnergy(e.value)} 
                      className={cn(
                        "flex flex-col items-center p-2 rounded-lg transition-all hover:bg-muted w-full", 
                        energy === e.value ? "bg-yellow-100 dark:bg-yellow-900/40 scale-105 shadow-sm" : "opacity-70 hover:opacity-100"
                      )}
                    >
                      <span className="text-2xl">{e.emoji}</span>
                      <span className="text-[10px] font-medium mt-1">{e.label}</span>
                    </button>
                  ))}
                </div>
             </CardContent>
           </Card>
        </div>

        <Button size="xl" className="w-full shadow-lg" onClick={handleSave} disabled={logSymptom.isPending}>
          {logSymptom.isPending ? 'Saving...' : 'Save Log'}
        </Button>
      </div>
    </AppLayout>
  );
}
