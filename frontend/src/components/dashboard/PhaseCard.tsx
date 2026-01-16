import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Zap, Flower2, ThermometerSun, Leaf } from 'lucide-react';

interface PhaseCardProps {
  phase: 'MENSTRUAL' | 'FOLLICULAR' | 'FERTILE' | 'OVULATION' | 'LUTEAL';
}

const phaseContent = {
  MENSTRUAL: {
    title: 'Menstrual Phase',
    description: 'Rest and recharge. Your energy may be lower than usual.',
    icon: <Leaf className="h-5 w-5 text-rose-500 dark:text-rose-400" />,
    color: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900 text-rose-900 dark:text-rose-100',
  },
  FOLLICULAR: {
    title: 'Follicular Phase',
    description: 'Energy is rising! Great time to start new projects.',
    icon: <Sparkles className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
    color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900 text-blue-900 dark:text-blue-100',
  },
  FERTILE: {
    title: 'Fertile Window',
    description: 'You are entering your fertile window. Energy is high.',
    icon: <Flower2 className="h-5 w-5 text-green-500 dark:text-green-400" />,
    color: 'bg-green-50 dark:bg-green-950/30 border-green-100 dark:border-green-900 text-green-900 dark:text-green-100',
  },
  OVULATION: {
    title: 'Ovulation Day',
    description: 'Peak fertility and confidence. You might feel social.',
    icon: <Zap className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />,
    color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900 text-emerald-900 dark:text-emerald-100',
  },
  LUTEAL: {
    title: 'Luteal Phase',
    description: 'Winding down. Focus on completing tasks and self-care.',
    icon: <ThermometerSun className="h-5 w-5 text-orange-500 dark:text-orange-400" />,
    color: 'bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900 text-orange-900 dark:text-orange-100',
  },
};

export const PhaseCard = ({ phase }: PhaseCardProps) => {
  // Default to MENSTRUAL if phase is invalid or undefined (shouldn't happen with strict types)
  const content = phaseContent[phase] || phaseContent.MENSTRUAL;

  return (
    <Card className={`border ${content.color} transition-all duration-300 hover:shadow-md animate-fade-in`}>
      <CardHeader className="pb-1.5 xs:pb-2 px-3 xs:px-6 pt-3 xs:pt-6">
        <CardTitle className="text-sm xs:text-base flex items-center gap-1.5 xs:gap-2">
          {content.icon}
          {content.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-3 xs:px-6 pb-3 xs:pb-6">
        <p className="text-xs xs:text-sm opacity-90">{content.description}</p>
      </CardContent>
    </Card>
  );
};
