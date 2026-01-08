import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useAdminInactivityTimeout } from "@/hooks/useInactivityTimeout";

// Pages
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import PartnerJoin from './pages/PartnerJoin';
import Dashboard from "./pages/Dashboard";
import SymptomLog from "./pages/SymptomLog";
import PartnerConnect from "./pages/PartnerConnect";
import ConsentSettings from "./pages/ConsentSettings";
import PartnerAccept from "./pages/PartnerAccept";
import PartnerDashboard from "./pages/PartnerDashboard";
import Journal from "./pages/Journal";
import AdminDashboard from "./pages/AdminDashboard";
import Chatbot from "./pages/Chatbot";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Profile from "./pages/Profile";
import CycleHistory from "./pages/CycleHistory";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected route wrapper
const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  // No user, redirect to login
  if (!user) {
    console.log('No user found in ProtectedRoute, redirecting to login');
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    console.log(`User role ${user.role} not allowed, redirecting to home`);
    return <Navigate to="/" replace />;
  }

  // For primary users, check if they need to complete onboarding
  if (user.role === 'primary' && location.pathname !== '/onboarding') {
    const hasRequiredData = user.onboardingCompleted && 
                          user.lastPeriodDate && 
                          user.cycleLength !== undefined;
    
    if (!hasRequiredData) {
      return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }
  }

  // If we get here, user is authenticated and authorized
  return <>{children}</>;
};

  // Route based on role
const RoleBasedRedirect = () => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  // If no user, show the auth page
  if (!user) {
    return <Auth />;
  }

  // Handle admin role
  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  // Handle partner role
  if (user.role === 'partner') {
    return <Navigate to="/partner-dashboard" replace />;
  }

  // Handle primary user with onboarding check
  if (user.role === 'primary') {
    const hasCompletedOnboarding = 
      !!user.onboardingCompleted && 
      !!user.lastPeriodDate && 
      user.cycleLength !== null && 
      user.cycleLength !== undefined;
    
    // If missing required data and not on onboarding, redirect to onboarding
    if (!hasCompletedOnboarding && !location.pathname.startsWith('/onboarding')) {
      return <Navigate to="/onboarding" replace />;
    }
    
    // If has required data and on onboarding page, redirect to dashboard
    if (hasCompletedOnboarding && location.pathname === '/onboarding') {
      return <Navigate to="/dashboard" replace />;
    }
    
    // If has required data and on root path, redirect to dashboard
    if (hasCompletedOnboarding && location.pathname === '/') {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Otherwise let router handle it (user is on a valid page)
    return null;
  }

  return <Navigate to="/dashboard" replace />;
};

const AppRoutes = () => {
  // Enable 30-minute inactivity timeout for admin users
  useAdminInactivityTimeout();
  
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<RoleBasedRedirect />} />
      <Route path="/partner-accept" element={<PartnerAccept />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute allowedRoles={['primary']}>
            <Onboarding />
          </ProtectedRoute>
        }
      />

      {/* Primary User Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['primary']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/log"
        element={
          <ProtectedRoute allowedRoles={['primary']}>
            <SymptomLog />
          </ProtectedRoute>
        }
      />
      <Route
        path="/connect"
        element={
          <ProtectedRoute allowedRoles={['primary']}>
            <PartnerConnect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/journal"
        element={
          <ProtectedRoute allowedRoles={['primary']}>
            <Journal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chatbot"
        element={
          <ProtectedRoute allowedRoles={['primary', 'partner']}>
            <Chatbot />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['primary', 'partner']}>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cycles/history"
        element={
          <ProtectedRoute allowedRoles={['primary']}>
            <CycleHistory />
          </ProtectedRoute>
        }
      />

      {/* Partner Routes */}
      <Route
        path="/partner-dashboard"
        element={
          <ProtectedRoute allowedRoles={['partner']}>
            <PartnerDashboard />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Shared Routes */}
      <Route path="/partner-dashboard" element={
        <ProtectedRoute>
          <PartnerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/join" element={
        <ProtectedRoute>
          <PartnerJoin />
        </ProtectedRoute>
      } />
      <Route
        path="/consent"
        element={
          <ProtectedRoute>
            <ConsentSettings />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

// Wrapper component to ensure hooks are called within the Router context
const AppContent = () => {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppRoutes />
      </TooltipProvider>
    </AuthProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
