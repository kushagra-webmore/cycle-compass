import { useState, useMemo } from 'react';
import { format, differenceInDays, addDays, isSameMonth } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, ArrowLeft, Trash2, Edit2, Plus, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCycles, useCreateCycle, useUpdateCycle, useDeleteCycle } from '@/hooks/api/cycles';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { CycleHistoryChart } from '@/components/dashboard/CycleHistoryChart';

export default function CycleHistory() {
  const { user, updateUser } = useAuth(); // Destructure updateUser
  const { data: cycles = [], isLoading } = useCycles();
  const createCycle = useCreateCycle();
  const updateCycle = useUpdateCycle();
  const deleteCycle = useDeleteCycle();
  const { toast } = useToast();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isStatsEditOpen, setIsStatsEditOpen] = useState(false);
  const [statsForm, setStatsForm] = useState({
    cycleLength: user?.cycleLength?.toString() || '28',
    periodLength: user?.periodLength?.toString() || '5'
  });
  
  const [editingCycle, setEditingCycle] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    startDate: '',
    endDate: '',
  });

  const handleStatsUpdate = async () => {
    try {
      const cycleLen = parseInt(statsForm.cycleLength);
      const periodLen = parseInt(statsForm.periodLength);
      
      if (isNaN(cycleLen) || isNaN(periodLen) || cycleLen < 20 || cycleLen > 45 || periodLen < 1 || periodLen > 10) {
        toast({
          title: "Invalid input",
          description: "Please enter reasonable values (Cycle: 20-45, Period: 1-10).",
          variant: "destructive"
        });
        return;
      }

      await updateUser({
        cycleLength: cycleLen,
        periodLength: periodLen
      });
      
      setIsStatsEditOpen(false);
      toast({
         title: "Settings updated",
         description: "Your cycle averages have been updated."
      });
    } catch (e) {
      toast({
        title: "Update failed",
        description: "Could not update settings. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (!cycles.length) return null;
    
    // Sort cycles by date descending
    const sorted = [...cycles].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    // Filter out active cycle (no end date) for average calculations
    const completedCycles = sorted.filter(c => c.endDate);
    
    if (!completedCycles.length && sorted.length < 2) return {
      totalCycles: sorted.length,
      avgCycleLength: 0,
      avgPeriodLength: 0,
      shortestCycle: 0,
      longestCycle: 0
    };

    const periodLengths = completedCycles.map(c => 
      differenceInDays(new Date(c.endDate!), new Date(c.startDate)) + 1
    );
    
    // Determine cycle lengths (time between start of one period and start of next)
    const cycleLengths: number[] = [];
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentStart = new Date(sorted[i].startDate);
      const prevStart = new Date(sorted[i+1].startDate);
      const days = differenceInDays(currentStart, prevStart);
      
      console.log(`Cycle calc: ${sorted[i].startDate} - ${sorted[i+1].startDate} = ${days} days`);

      // Filter out unreasonable cycle lengths
      if (days > 5 && days < 180) {
        cycleLengths.push(days);
      }
    }
    
    // Calculate averages (only if we have data)
    const avgPeriod = periodLengths.length 
      ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
      : 5;
      
    const avgCycle = cycleLengths.length 
      ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
      : 0;
      
    return {
      totalCycles: sorted.length,
      avgCycleLength: avgCycle,
      avgPeriodLength: avgPeriod,
      shortestCycle: cycleLengths.length ? Math.min(...cycleLengths) : 0,
      longestCycle: cycleLengths.length ? Math.max(...cycleLengths) : 0
    };
  }, [cycles, user?.cycleLength]);

  const handleCreate = async () => {
    try {
      if (!formData.startDate) return;
      
      await createCycle.mutateAsync({
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
      });
      
      setIsCreateOpen(false);
      setFormData({ startDate: '', endDate: '' });
      toast({
        title: "Cycle logged",
        description: "New cycle has been added to your history."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log cycle.",
        variant: "destructive"
      });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      if (!formData.startDate) return;
      
      await updateCycle.mutateAsync({
        id,
        startDate: formData.startDate,
        endDate: formData.endDate || null, // Send null to clear the date
      });
      
      setEditingCycle(null);
      setFormData({ startDate: '', endDate: '' });
      toast({
        title: "Cycle updated",
        description: "Your cycle history has been updated."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cycle.",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this cycle?')) return;
    
    try {
      await deleteCycle.mutateAsync(id);
      toast({
        title: "Cycle deleted",
        description: "The cycle has been removed from your history."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete cycle.",
        variant: "destructive"
      });
    }
  };

  const openEdit = (cycle: any) => {
    // Use raw date strings to avoid timezone shifts during Date conversion
    // Ensure we only look at the date part (YYYY-MM-DD)
    const startDate = typeof cycle.startDate === 'string' ? cycle.startDate.split('T')[0] : '';
    const endDate = cycle.endDate && typeof cycle.endDate === 'string' ? cycle.endDate.split('T')[0] : '';
    
    setFormData({
      startDate,
      endDate: endDate && endDate < startDate ? '' : endDate, // Clear invalid end dates
    });
    setEditingCycle(cycle.id);
  };

  return (
    <AppLayout title="Cycle History">
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" asChild className="-ml-2">
                <Link to="/profile">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <h1 className="text-3xl font-display font-bold text-foreground">Cycle History</h1>
            </div>
            <p className="text-muted-foreground pl-10">Track and analyze your past cycles</p>
          </div>
          
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Log Past Cycle
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Past Cycle</DialogTitle>
                <DialogDescription>
                  Enter the start and end dates of a past period.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={!formData.startDate}>Save Cycle</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isStatsEditOpen} onOpenChange={setIsStatsEditOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Update Cycle Settings</DialogTitle>
                <DialogDescription>
                   Manually adjust your average cycle and period lengths.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                 <div className="grid gap-2">
                    <Label htmlFor="cycleLen">Average Cycle Length (Days)</Label>
                    <Input 
                      id="cycleLen" 
                      type="number" 
                      min="20" 
                      max="45"
                      value={statsForm.cycleLength}
                      onChange={e => setStatsForm(p => ({ ...p, cycleLength: e.target.value }))}
                    />
                 </div>
                 <div className="grid gap-2">
                    <Label htmlFor="periodLen">Average Period Length (Days)</Label>
                    <Input 
                      id="periodLen" 
                      type="number" 
                      min="1" 
                      max="15"
                      value={statsForm.periodLength}
                      onChange={e => setStatsForm(p => ({ ...p, periodLength: e.target.value }))}
                    />
                 </div>
              </div>
              <DialogFooter>
                 <Button variant="outline" onClick={() => setIsStatsEditOpen(false)}>Cancel</Button>
                 <Button onClick={handleStatsUpdate}>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 gap-6">
              
             {/* Charts */}
             <CycleHistoryChart cycles={cycles} />

             {/* Metric Cards */}
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-primary/5 border-primary/20 relative group">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setIsStatsEditOpen(true)}
                    >
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <div className="p-2 mb-2 rounded-full bg-primary/10 text-primary">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Cycle</p>
                    <p className="text-2xl font-bold">{stats.avgCycleLength || user?.cycleLength || '-'}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-rose-500/5 border-rose-500/20 relative group">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setIsStatsEditOpen(true)}
                    >
                      <Edit2 className="h-3 w-3 text-muted-foreground" />
                    </Button>
                    <div className="p-2 mb-2 rounded-full bg-rose-500/10 text-rose-500">
                      <Clock className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Avg Period</p>
                    <p className="text-2xl font-bold">{stats.avgPeriodLength}</p>
                    <p className="text-xs text-muted-foreground">days</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-500/5 border-purple-500/20">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="p-2 mb-2 rounded-full bg-purple-500/10 text-purple-500">
                      <Info className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total logged</p>
                    <p className="text-2xl font-bold">{stats.totalCycles}</p>
                    <p className="text-xs text-muted-foreground">cycles</p>
                  </CardContent>
                </Card>

                <Card className="bg-sky-500/5 border-sky-500/20">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className="p-2 mb-2 rounded-full bg-sky-500/10 text-sky-500">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Shortest/Longest</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{stats.shortestCycle || '-'}</span>
                      <span className="text-muted-foreground">/</span>
                      <span className="text-xl font-bold">{stats.longestCycle || '-'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">days</p>
                  </CardContent>
                </Card>
             </div>
          </div>
        )}

        {/* Cycles List */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>History Log</CardTitle>
            <CardDescription>
              Detailed view of your past menstrual cycles
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="p-8 text-center text-muted-foreground animate-pulse">
                Loading history...
              </div>
            ) : cycles.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground mb-4">No cycles logged yet</p>
                <Button variant="outline" onClick={() => setIsCreateOpen(true)}>Log your first cycle</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {cycles.map((cycle: any) => {
                  const startDate = new Date(cycle.startDate);
                  const endDate = cycle.endDate ? new Date(cycle.endDate) : null;
                  const length = endDate 
                    ? differenceInDays(endDate, startDate) + 1 
                    : differenceInDays(new Date(), startDate) + 1;
                  
                  const isEditingThis = editingCycle === cycle.id;

                  return (
                    <div 
                      key={cycle.id} 
                      className={cn(
                        "relative p-4 rounded-xl border transition-all duration-200",
                        endDate ? "bg-card border-border" : "bg-primary/5 border-primary/20"
                      )}
                    >
                      {isEditingThis ? (
                         <div className="grid gap-4 py-2">
                           <div className="grid grid-cols-2 gap-4">
                             <div className="grid gap-2">
                               <Label>Start Date</Label>
                               <Input
                                 type="date"
                                 value={formData.startDate}
                                 onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                 max={new Date().toISOString().split('T')[0]}
                               />
                             </div>
                             <div className="grid gap-2">
                               <Label>End Date</Label>
                               <Input
                                 type="date"
                                 value={formData.endDate}
                                 onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                 min={formData.startDate}
                                 max={new Date().toISOString().split('T')[0]}
                               />
                             </div>
                           </div>
                           <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="sm" onClick={() => setEditingCycle(null)}>Cancel</Button>
                             <Button size="sm" onClick={() => handleUpdate(cycle.id)}>Save Changes</Button>
                           </div>
                         </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-lg">
                                {format(startDate, 'MMMM d, yyyy')}
                              </span>
                              {!endDate && (
                                <Badge variant="default" className="bg-primary/90 hover:bg-primary">Current Cycle</Badge>
                              )}
                              {length > 8 && (
                                <Badge variant="outline" className="text-amber-600 border-amber-600/30 bg-amber-50">Long Period</Badge>
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <span>
                                {endDate ? `Ended ${format(endDate, 'MMMM d')}` : 'Ongoing'}
                              </span>
                              <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                              <span>{length} days</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => openEdit(cycle)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="text-muted-foreground hover:text-destructive"
                              onClick={() => handleDelete(cycle.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
