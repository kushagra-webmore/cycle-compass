import { Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="pb-20 xs:pb-24 pt-6 xs:pt-8 px-4 text-center">
      <p className="text-xs xs:text-sm text-muted-foreground flex items-center justify-center gap-1.5 flex-wrap">
        Made to support you, always
        <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500/30" />
        by <a href="https://linktr.ee/kushagra_singh" target="_blank" rel="noopener noreferrer" className="font-medium text-foreground/80 hover:text-primary transition-all duration-300 underline decoration-primary/30 underline-offset-2 inline-block hover:scale-110 hover:decoration-primary px-2 py-1 -mx-2 -my-1 rounded touch-manipulation">KS</a>
      </p>
    </footer>
  );
};
