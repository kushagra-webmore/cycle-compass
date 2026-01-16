import { ReactNode } from 'react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

export const AppLayout = ({ children, title, showNav = true, showBack }: AppLayoutProps & { showBack?: boolean }) => {
  return (
    <div className="min-h-screen bg-background gradient-calm">
      <Header title={title} showBack={showBack} />
      <main className="pb-4 px-4 pt-4 max-w-5xl mx-auto">
        {children}
      </main>
      <Footer />
      {showNav && <MobileNav />}
    </div>
  );
};
