import { Card, CardContent } from "@/components/ui/card";
import { Info } from "lucide-react";

interface HydrationTipsProps {
  phase?: string;
}

export function HydrationTips({ phase }: HydrationTipsProps) {
  const getTip = () => {
    switch (phase) {
      case 'MENSTRUATION':
        return {
          text: "During menstruation, you lose fluids naturally. staying well-hydrated is critical to reduce cramping, headaches, and fatigue. Warm water or herbal tea can be especially soothing now.",
          bg: "bg-rose-50 dark:bg-rose-900/20",
          border: "border-rose-100 dark:border-rose-800",
          icon: "text-rose-500"
        };
      case 'FOLLICULAR':
        return {
           text: "As estrogen rises, your energy builds. Hydration supports healthy follicle development and gives your skin that 'glow'. Aim for consistent intake to fuel your increasing activity.",
           bg: "bg-blue-50 dark:bg-blue-900/20",
           border: "border-blue-100 dark:border-blue-800",
           icon: "text-blue-500"
        };
      case 'OVULATION':
        return {
            text: "Estrogen peaks and body temperature rises slightly. Hydration is essential for producing fertile cervical mucus. You may feel thirstier during this high-energy window—listen to it!",
            bg: "bg-purple-50 dark:bg-purple-900/20",
            border: "border-purple-100 dark:border-purple-800",
            icon: "text-purple-500"
        };
      case 'LUTEAL':
        return {
            text: "Progesterone dominates, often causing bloating and water retention. Paradoxically, drinking MORE water helps flush out excess sodium and reduces puffiness. It also helps stabilize mood swings.",
            bg: "bg-amber-50 dark:bg-amber-900/20",
            border: "border-amber-100 dark:border-amber-800",
            icon: "text-amber-500"
        };
      default:
        return {
            text: "General hydration supports every cell in your body. Your baseline need depends on activity, but 2.5L is a solid daily target. Consistent sipping is better than chugging!",
            bg: "bg-slate-50 dark:bg-slate-900/20",
            border: "border-slate-100 dark:border-slate-800",
            icon: "text-slate-500"
        };
    }
  };

  const tip = getTip();

  return (
    <Card className={`mt-0 border shadow-sm ${tip.bg} ${tip.border}`}>
      <CardContent className="p-2 flex gap-2 items-start">
        <Info className={`w-4 h-4 mt-0.5 shrink-0 ${tip.icon}`} />
        <p className="text-[11px] leading-relaxed text-foreground/90 font-medium">
          {tip.text}
        </p>
      </CardContent>
    </Card>
  );
}
