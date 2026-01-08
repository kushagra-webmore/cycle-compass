import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap, Flower2, ThermometerSun, Leaf } from 'lucide-react';

interface PhaseCardProps {
  phase: 'MENSTRUAL' | 'FOLLICULAR' | 'FERTILE' | 'OVULATION' | 'LUTEAL';
}

const phaseContent = {
  MENSTRUAL: {
    title: 'Menstrual Phase',
    description: 'Rest and recharge. Your energy may be lower than usual.',
    icon: <Leaf className="h-5 w-5 text-rose-500" />,
    color: 'bg-rose-50 border-rose-100 text-rose-900',
  },
  FOLLICULAR: {
    title: 'Follicular Phase',
    description: 'Energy is rising! Great time to start new projects.',
    icon: <Sparkles className="h-5 w-5 text-blue-500" />,
    color: 'bg-blue-50 border-blue-100 text-blue-900',
  },
  FERTILE: {
    title: 'Fertile Window',
    description: 'You are entering your fertile window. Energy is high.',
    icon: <Flower2 className="h-5 w-5 text-green-500" />,
    color: 'bg-green-50 border-green-100 text-green-900',
  },
  OVULATION: {
    title: 'Ovulation Day',
    description: 'Peak fertility and confidence. You might feel social.',
    icon: <Zap className="h-5 w-5 text-emerald-600" />,
    color: 'bg-emerald-50 border-emerald-100 text-emerald-900',
  },
  LUTEAL: {
    title: 'Luteal Phase',
    description: 'Winding down. Focus on completing tasks and self-care.',
    icon: <ThermometerSun className="h-5 w-5 text-orange-500" />,
    color: 'bg-orange-50 border-orange-100 text-orange-900',
  },
};

export const PhaseCard = ({ phase }: PhaseCardProps) => {
  // Default to MENSTRUAL if phase is invalid or undefined (shouldn't happen with strict types)
  const content = phaseContent[phase] || phaseContent.MENSTRUAL;

  return (
    <Card className={`border ${content.color} transition-all duration-300 hover:shadow-md animate-fade-in`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          {content.icon}
          {content.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm opacity-90">{content.description}</p>
      </CardContent>
    </Card>
  );
};
