import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface UseInactivityTimeoutOptions {
  timeoutMinutes?: number;
  warningMinutes?: number;
  enabled?: boolean;
}

/**
 * Hook to automatically logout user after period of inactivity
 * @param options Configuration options
 * @returns Object with reset function
 */
export const useInactivityTimeout = ({
  timeoutMinutes = 30,
  warningMinutes = 5,
  enabled = true,
}: UseInactivityTimeoutOptions = {}) => {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const timeoutRef = useRef<NodeJS.Timeout>();
  const warningRef = useRef<NodeJS.Timeout>();
  const warningShownRef = useRef(false);

  const resetTimeout = useCallback(() => {
    // Clear existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (warningRef.current) {
      clearTimeout(warningRef.current);
    }
    warningShownRef.current = false;

    if (!enabled || !user) return;

    // Set warning timeout (shows warning before logout)
    const warningTime = (timeoutMinutes - warningMinutes) * 60 * 1000;
    if (warningTime > 0) {
      warningRef.current = setTimeout(() => {
        if (!warningShownRef.current) {
          warningShownRef.current = true;
          toast({
            title: '⚠️ Inactivity Warning',
            description: `You will be logged out in ${warningMinutes} minutes due to inactivity.`,
            duration: 10000,
          });
        }
      }, warningTime);
    }

    // Set logout timeout
    timeoutRef.current = setTimeout(async () => {
      toast({
        title: '🔒 Logged Out',
        description: 'You have been logged out due to inactivity.',
        variant: 'destructive',
      });
      await logout();
    }, timeoutMinutes * 60 * 1000);
  }, [enabled, user, logout, toast, timeoutMinutes, warningMinutes]);

  useEffect(() => {
    if (!enabled || !user) return;

    // Events that indicate user activity
    const events = [
      'mousedown',
      'mousemove',
      'keydown',
      'scroll',
      'touchstart',
      'click',
    ];

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, { passive: true });
    });

    // Initial timeout
    resetTimeout();

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (warningRef.current) {
        clearTimeout(warningRef.current);
      }
    };
  }, [enabled, user, resetTimeout]);

  return { resetTimeout };
};

/**
 * Hook specifically for admin users with 30-minute timeout
 */
export const useAdminInactivityTimeout = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return useInactivityTimeout({
    timeoutMinutes: 30,
    warningMinutes: 5,
    enabled: isAdmin,
  });
};
