import { LogOut, User, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeToggle } from './ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useConfirm } from '@/components/ui/confirm-dialog';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title?: string;
  showBack?: boolean;
}

export const Header = ({ title = 'Cycle-Aware Companion', showBack }: HeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { confirm } = useConfirm();

  const handleLogout = async () => {
    if (await confirm({ 
      title: "Log Out", 
      description: "Are you sure you want to log out?",
      confirmLabel: "Log Out",
      cancelLabel: "Cancel",
      variant: "destructive"
    })) {
      logout();
      navigate('/');
    }
  };

  const handleLogoClick = () => {
    navigate('/dashboard');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b-0 mb-3 xs:mb-4">
      <div className="flex items-center justify-between h-14 xs:h-16 px-3 xs:px-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 xs:gap-3 cursor-pointer group" onClick={handleLogoClick}>
          {showBack ? (
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigate(-1); }} className="mr-1 -ml-2 hover:bg-white/20 h-8 w-8 xs:h-10 xs:w-10">
                  <ArrowLeft className="h-4 w-4 xs:h-5 xs:w-5 text-primary" />
              </Button>
          ) : (
            <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-md rounded-full transform group-hover:scale-110 transition-transform duration-300" />
                <img 
                    src="/logo.svg" 
                    alt="Logo" 
                    className="h-8 w-8 xs:h-10 xs:w-10 relative z-10 transition-transform duration-300 group-hover:rotate-12"
                    onError={(e) => {
                        // Fallback if logo fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                />
                <div className="hidden w-8 h-8 xs:w-10 xs:h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-glow">
                    <span className="text-white font-bold text-base xs:text-lg">C</span>
                </div>
            </div>
          )}
          <h1 className="font-display font-bold text-base xs:text-lg sm:text-xl text-primary tracking-tight group-hover:text-primary/80 transition-colors">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center gap-1 xs:gap-2">
          <ThemeToggle />
          {user && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-primary hover:bg-primary/10 hover:text-primary transition-all duration-300 rounded-full h-8 w-8 xs:h-10 xs:w-10"
                onClick={() => navigate('/profile')}
              >
                {user.avatarUrl ? (
                  <Avatar className="h-6 w-6 xs:h-8 xs:w-8">
                    <AvatarImage src={user.avatarUrl} className="object-cover" />
                    <AvatarFallback className="text-[10px] xs:text-xs bg-primary/10 text-primary">
                      {user.name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <User className="h-4 w-4 xs:h-5 xs:w-5" />
                )}
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="text-primary hover:bg-destructive/10 hover:text-destructive transition-all duration-300 rounded-full h-8 w-8 xs:h-10 xs:w-10"
              >
                <LogOut className="h-4 w-4 xs:h-5 xs:w-5" />
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
