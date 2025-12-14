import { Droplets, Sun, Moon, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

type Phase = 'menstrual' | 'follicular' | 'ovulatory' | 'luteal';

interface PhaseCardProps {
  phase: Phase;
}

const phaseData = {
  menstrual: {
    icon: Droplets,
    title: 'Menstrual Phase',
    description: 'Your body is renewing. Rest and gentle movement are encouraged.',
    energy: 'Low to moderate',
    mood: 'Reflective, introspective',
    tip: 'Honor your need for rest. Warm drinks and comfort food can help.',
    color: 'bg-phase-menstrual/20 border-phase-menstrual/30',
    iconBg: 'bg-phase-menstrual/30',
    iconColor: 'text-phase-menstrual',
  },
  follicular: {
    icon: Sun,
    title: 'Follicular Phase',
    description: 'Energy is rising! Great time for new projects and socializing.',
    energy: 'Rising',
    mood: 'Optimistic, creative',
    tip: 'Channel this energy into planning and starting new things.',
    color: 'bg-phase-follicular/20 border-phase-follicular/30',
    iconBg: 'bg-phase-follicular/30',
    iconColor: 'text-phase-follicular',
  },
  ovulatory: {
    icon: Sparkles,
    title: 'Ovulatory Phase',
    description: 'Peak energy and confidence. Communication flows easily.',
    energy: 'High',
    mood: 'Confident, social',
    tip: 'Great time for important conversations and challenging workouts.',
    color: 'bg-phase-ovulatory/20 border-phase-ovulatory/30',
    iconBg: 'bg-phase-ovulatory/30',
    iconColor: 'text-phase-ovulatory',
  },
  luteal: {
    icon: Moon,
    title: 'Luteal Phase',
    description: 'Energy is winding down. Focus on completing tasks.',
    energy: 'Moderate to low',
    mood: 'Detail-oriented, nesting',
    tip: 'Finish projects, organize, and prepare for rest ahead.',
    color: 'bg-phase-luteal/20 border-phase-luteal/30',
    iconBg: 'bg-phase-luteal/30',
    iconColor: 'text-phase-luteal',
  },
};

export const PhaseCard = ({ phase }: PhaseCardProps) => {
  const data = phaseData[phase];
  const Icon = data.icon;

  return (
    <Card className={cn("border-2", data.color)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={cn("p-3 rounded-xl", data.iconBg)}>
            <Icon className={cn("h-6 w-6", data.iconColor)} />
          </div>
          <CardTitle className="text-lg">{data.title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{data.description}</p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/50">
            <span className="text-xs text-muted-foreground block mb-1">Energy</span>
            <span className="text-sm font-medium text-foreground">{data.energy}</span>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <span className="text-xs text-muted-foreground block mb-1">Mood</span>
            <span className="text-sm font-medium text-foreground">{data.mood}</span>
          </div>
        </div>

        <div className="p-3 rounded-lg bg-sage/20 border border-sage/30">
          <span className="text-xs font-medium text-sage-foreground">💡 Tip: {data.tip}</span>
        </div>
      </CardContent>
    </Card>
  );
};
