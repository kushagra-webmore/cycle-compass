import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WaterBottle } from './WaterBottle';
import { ReminderSettings } from './ReminderSettings';
import { HydrationTips } from './HydrationTips';
import { Droplets, Plus, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';

interface WaterTrackerProps {
  phase?: string;
}

export function WaterTracker({ phase }: WaterTrackerProps) {
  const [amount, setAmount] = useState(0);
  const [target, setTarget] = useState(2500); 
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [tempTarget, setTempTarget] = useState("2500");
  const [customInput, setCustomInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Load target from local storage on mount
  useEffect(() => {
    const savedTarget = localStorage.getItem('water-target');
    if (savedTarget) {
      setTarget(parseInt(savedTarget));
      setTempTarget(savedTarget);
    }
    fetchDailyLog();
  }, []);

  const fetchDailyLog = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const logs = await apiFetch<any[]>(`/water/${today}`, { auth: true });
      const total = logs.reduce((acc: number, log: any) => acc + log.amount_ml, 0);
      setAmount(total);
    } catch (error) {
      console.error('Failed to fetch water logs', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddWater = async (addAmount: number) => {
    try {
      const newAmount = Math.max(0, amount + addAmount);
      setAmount(newAmount);

      await apiFetch('/water', {
        method: 'POST',
        auth: true,
        body: JSON.stringify({ amount: addAmount })
      });
      
      toast.success(`Logged ${addAmount}ml`);
    } catch (error) {
      setAmount(amount);
      toast.error('Failed to log water intake');
    }
  };

  const handleCustomAdd = () => {
    const val = parseInt(customInput);
    if (!isNaN(val) && val > 0) {
      handleAddWater(val);
      setCustomInput('');
    }
  };

  const saveTarget = () => {
    const val = parseInt(tempTarget);
    if (!isNaN(val) && val > 500 && val < 10000) {
      setTarget(val);
      localStorage.setItem('water-target', val.toString());
      setIsEditingTarget(false);
      toast.success('Daily target updated');
    } else {
      toast.error('Please enter a valid amount (500-10000)');
    }
  };

  return (
    <Card className="w-full h-full overflow-hidden relative border-none shadow-sm bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold flex items-center gap-2 text-blue-900 dark:text-blue-100">
          <Droplets className="w-5 h-5 text-blue-500" />
          Hydration
        </CardTitle>
        <ReminderSettings />
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-6">
        
        {/* Target Editor */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground -mt-2 mb-2">
           <span>Daily Goal:</span>
           {isEditingTarget ? (
             <div className="flex items-center gap-1">
               <Input 
                 value={tempTarget} 
                 onChange={(e) => setTempTarget(e.target.value)}
                 className="h-6 w-16 px-1 text-center bg-white dark:bg-black"
               />
               <Button size="icon" variant="ghost" className="h-6 w-6" onClick={saveTarget}>
                 <Check className="w-3 h-3 text-green-500" />
               </Button>
             </div>
           ) : (
             <button 
               onClick={() => setIsEditingTarget(true)} 
               className="font-medium hover:text-foreground flex items-center gap-1 transition-colors"
             >
               {target} ml
               <Pencil className="w-3 h-3 opacity-50" />
             </button>
           )}
        </div>

        <WaterBottle 
          current={amount} 
          target={target} 
          onAdd={handleAddWater}
          className="my-2"
        />

        <div className="w-full max-w-xs space-y-4">
           {/* Custom Input */}
           <div className="flex gap-2">
             <div className="relative flex-1">
                <Input 
                  type="number" 
                  placeholder="Custom amount..." 
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  className="pr-8 bg-white dark:bg-slate-900" 
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">ml</span>
             </div>
             <Button size="icon" onClick={handleCustomAdd} disabled={!customInput}>
               <Plus className="w-4 h-4" />
             </Button>
           </div>
           
           <HydrationTips phase={phase} />
        </div>

      </CardContent>
    </Card>
  );
}
