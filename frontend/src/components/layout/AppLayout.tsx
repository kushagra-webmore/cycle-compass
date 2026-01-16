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
        <div className="bg-amber-500 dark:bg-amber-600 text-white px-4 py-3 shadow-md">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <div className="text-sm">
                <span className="font-semibold">Impersonating User:</span>{' '}
                {impersonatedUser.name || 'Unnamed User'} ({impersonatedUser.email})
              </div>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExitImpersonation}
              className="gap-2 flex-shrink-0"
            >
              <LogOut className="h-4 w-4" />
              Exit Impersonation
            </Button>
          </div>
        </div>
      )}
      <Header title={title} showBack={showBack} />
      <main className="pb-4 px-4 pt-4 max-w-5xl mx-auto">
        {children}
      </main>
      <Footer />
      {showNav && <MobileNav />}
    </div>
  );
};
