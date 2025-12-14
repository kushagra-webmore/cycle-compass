import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Book, Settings, Users, Heart, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

export const MobileNav = () => {
  const location = useLocation();
  const { user } = useAuth();

  const primaryNavItems = [
    { href: '/dashboard', icon: Home, label: 'Home' },
    { href: '/log', icon: Calendar, label: 'Log' },
    { href: '/journal', icon: Book, label: 'Journal' },
    { href: '/connect', icon: Heart, label: 'Connect' },
    { href: '/consent', icon: Settings, label: 'Settings' },
  ];

  const partnerNavItems = [
    { href: '/partner-dashboard', icon: Home, label: 'Home' },
    { href: '/consent', icon: Settings, label: 'Settings' },
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
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== '/dashboard' && item.href !== '/partner-dashboard' && item.href !== '/admin' && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300",
                isActive 
                  ? "text-primary bg-primary-soft" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "animate-scale-in")} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
