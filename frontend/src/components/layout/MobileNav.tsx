import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Book, Settings, Users, Heart, Shield, Sparkles, User, History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const primaryNavItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/log', icon: Calendar, label: 'Log' },
    { href: '/chatbot', icon: Sparkles, label: 'Assistant' },
    { href: '/journal', icon: Book, label: 'Journal' },
    { href: '/cycles/history', icon: History, label: 'History' },
  ];

  const partnerNavItems = [
    { href: '/partner-dashboard', icon: Home, label: 'Home' },
    { href: '/chatbot', icon: Sparkles, label: 'Assistant' },
    { href: '/profile', icon: User, label: 'Profile' },
  ];

  const adminNavItems = [
    { href: '/admin', icon: Shield, label: 'Admin' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/consent', icon: Settings, label: 'Settings' },
  ];

  const getNavItems = () => {
    switch (user?.role) {
      case 'admin':
        return adminNavItems;
      case 'partner':
        return partnerNavItems;
      default:
        return primaryNavItems;
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border shadow-soft">
      <div className="flex items-center justify-around h-14 xs:h-16 px-1 xs:px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && item.href !== '/partner-dashboard' && item.href !== '/admin' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 xs:gap-1 px-2 xs:px-3 py-1.5 xs:py-2 rounded-xl transition-all duration-300",
                isActive 
                  ? "text-primary bg-primary-soft" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn("h-4 w-4 xs:h-5 xs:w-5", isActive && "animate-scale-in")} />
              <span className="text-[10px] xs:text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
