import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

/** Só passa quem está logado E vinculado a um household. */
export function ProtectedRoute() {
  const { user, household, loading } = useAuth();
  const location = useLocation();

  if (!user && !loading) return <Navigate to="/login" replace state={{ from: location }} />;
  if (!household && !loading) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}
