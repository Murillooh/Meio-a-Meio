import { useContext } from 'react';
import { AuthContext, type AuthValue } from '@/lib/AuthContext';

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return ctx;
}
