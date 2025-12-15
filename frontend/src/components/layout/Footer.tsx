import { Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="pb-24 pt-8 px-4 text-center">
      <p className="text-sm text-muted-foreground flex items-center justify-center gap-1.5">
        Made to support you, always
        <Heart className="h-3.5 w-3.5 text-primary fill-primary/30" />
        by <span className="font-medium text-foreground/80">KS</span>
      </p>
    </footer>
  );
};
