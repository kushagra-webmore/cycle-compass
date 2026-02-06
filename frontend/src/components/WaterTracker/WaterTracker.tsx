import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WaterBottle } from './WaterBottle';
import { ReminderSettings } from './ReminderSettings';
import { HydrationTips } from './HydrationTips';
import { Droplets, Plus, Minus, Pencil, Check } from 'lucide-react';
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
      setAmount(Math.max(0, total));
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
      <CardContent className="flex flex-row items-center justify-center gap-6 px-4 pb-6 pt-2">
        
        <WaterBottle 
          current={amount} 
          target={target} 
          onAdd={handleAddWater}
          className="scale-95 origin-center shrink-0"
        />

        <div className="flex flex-col gap-3 w-full max-w-[200px]">
            {/* Target Editor */}
            <div className="flex items-center justify-between p-2 rounded-lg border border-slate-300 bg-slate-50 shadow-sm dark:border-slate-700 dark:bg-slate-900">
               <span className="text-xs text-muted-foreground font-medium">Daily Goal</span>
               {isEditingTarget ? (
                 <div className="flex items-center gap-1">
                   <Input 
                     value={tempTarget} 
                     onChange={(e) => setTempTarget(e.target.value)}
                     className="h-5 w-14 px-1 text-center bg-white dark:bg-black text-xs border-slate-200 dark:border-slate-700"
                   />
                   <Button size="icon" variant="ghost" className="h-5 w-5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full" onClick={saveTarget}>
                     <Check className="w-3 h-3 text-green-600 dark:text-green-500" />
                   </Button>
                 </div>
               ) : (
                 <button 
                   onClick={() => setIsEditingTarget(true)} 
                   className="font-semibold text-xs text-foreground hover:text-blue-600 flex items-center gap-1.5 transition-colors px-1.5 py-0.5 rounded-md hover:bg-white dark:hover:bg-slate-800"
                 >
                   {target} ml
                   <Pencil className="w-3 h-3 opacity-40" />
                 </button>
               )}
            </div>

            {/* Quick Actions (Buttons) */}
            <div className="grid grid-cols-2 gap-2">
               <Button 
                variant="outline" 
                size="sm" 
                className="h-8 text-xs font-medium border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                onClick={() => handleAddWater(-250)}
                disabled={amount <= 0}
               >
                 <Minus className="w-3 h-3 mr-1" /> 250
               </Button>
               <Button 
                variant="default" 
                size="sm" 
                className="h-8 text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-200 dark:shadow-none"
                onClick={() => handleAddWater(250)}
               >
                 <Plus className="w-3 h-3 mr-1" /> 250
               </Button>
            </div>

            {/* Custom Input */}
            <div className="flex gap-2 w-full">
              <div className="relative flex-1">
                 <Input 
                   type="number" 
                   placeholder="Custom..." 
                   value={customInput}
                   onChange={(e) => setCustomInput(e.target.value)}
                   className="pr-6 h-8 text-xs bg-white dark:bg-slate-900" 
                 />
                 <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">ml</span>
              </div>
              <Button size="icon" className="h-8 w-8 shrink-0 bg-slate-800 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600" onClick={handleCustomAdd} disabled={!customInput}>
                <Plus className="w-3 h-3" />
              </Button>
            </div>
            
            <HydrationTips phase={phase} />
        </div>

      </CardContent>
    </Card>
  );
}
