import { ReactNode } from 'react';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AlertCircle, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showNav?: boolean;
}

export const AppLayout = ({ children, title, showNav = true, showBack }: AppLayoutProps & { showBack?: boolean }) => {
  const { isImpersonating, impersonatedUser, exitImpersonation } = useAuth();
  const navigate = useNavigate();

  const handleExitImpersonation = async () => {
    await exitImpersonation();
    navigate('/admin');
  };

  return (
    <div className="min-h-screen bg-background gradient-calm">
      {isImpersonating && impersonatedUser && (
        <div className="bg-amber-500 dark:bg-amber-600 text-white px-3 xs:px-4 py-2 xs:py-3 shadow-md">
          <div className="max-w-5xl mx-auto flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2 xs:gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 xs:h-5 xs:w-5 flex-shrink-0" />
              <div className="text-xs xs:text-sm">
                <span className="font-semibold">Impersonating:</span>{' '}
                <span className="block xs:inline">{impersonatedUser.name || 'Unnamed User'} ({impersonatedUser.email})</span>
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExitImpersonation}
              className="gap-1 xs:gap-2 flex-shrink-0 text-xs h-8"
            >
              <LogOut className="h-3 w-3 xs:h-4 xs:w-4" />
              <span className="hidden xs:inline">Exit Impersonation</span>
              <span className="xs:hidden">Exit</span>
            </Button>
          </div>
        </div>
      )}
      <Header title={title} showBack={showBack} />
      <main className="pb-3 xs:pb-4 px-3 xs:px-4 pt-3 xs:pt-4 max-w-5xl mx-auto">
        {children}
      </main>
      <Footer />
      {showNav && <MobileNav />}
    </div>
  );
};
