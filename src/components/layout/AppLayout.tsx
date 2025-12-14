import { ReactNode } from 'react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

export const AppLayout = ({ children, title, showNav = true }: AppLayoutProps) => {
  return (
    <div className="min-h-screen bg-background gradient-calm">
      <Header title={title} />
      <main className="pb-4 px-4 pt-4 max-w-4xl mx-auto">
        {children}
      </main>
      <Footer />
      {showNav && <MobileNav />}
    </div>
  );
};
