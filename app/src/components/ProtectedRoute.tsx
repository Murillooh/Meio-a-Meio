import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Splash } from './Splash';

/** Só passa quem está logado E vinculado a um household. */
export function ProtectedRoute() {
  const { user, household, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!household) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
