import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { generateInviteCode } from './inviteCode';
import type { Household, Member, Papel } from '@/types';

export interface AuthValue {
  user: User | null;
  session: Session | null;
  member: Member | null;
  household: Household | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, nome?: string, telefone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  createHousehold: (nome: string, papel: Papel) => Promise<Household>;
  joinHousehold: (inviteCode: string, papel?: Papel) => Promise<Household>;
  refreshMembership: () => Promise<void>;
}

export const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  const loadMembership = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setMember(null);
      setHousehold(null);
      return;
    }
    // tabelas ainda não existem: erro é tratado como "sem household"
    const { data, error } = await supabase
      .from('members')
      .select('*, household:households(*)')
      .eq('user_id', uid)
      .maybeSingle();

    if (error || !data) {
      setMember(null);
      setHousehold(null);
      return;
    }
    const { household: hh, ...rest } = data as Member & { household: Household | null };
    setMember(rest as Member);
    setHousehold(hh ?? null);
  }, []);

  useEffect(() => {
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      setSession(data.session);
      await loadMembership(data.session?.user.id);
      if (alive) setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, next) => {
      setSession(next);
      setLoading(true);
      await loadMembership(next?.user.id);
      setLoading(false);
    });

    return () => {
      alive = false;
      sub.subscription.unsubscribe();
    };
  }, [loadMembership]);

  const value = useMemo<AuthValue>(() => ({
    user,
    session,
    member,
    household,
    loading,
    signInWithGoogle: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    },
    signInWithApple: async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: { redirectTo: window.location.origin },
      });
      if (error) throw error;
    },
    signInWithPassword: async (email, password) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    },
    signUpWithPassword: async (email, password, nome, telefone) => {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            full_name: nome,
            phone: telefone
          }
        }
      });
      if (error) throw error;
    },
    signOut: async () => {
      await supabase.auth.signOut();
      setMember(null);
      setHousehold(null);
    },
    createHousehold: async (nome, papel) => {
      if (!user) throw new Error('Sem usuário autenticado');
      const invite_code = generateInviteCode();
      const { data: hh, error } = await supabase
        .from('households')
        .insert({ nome, invite_code })
        .select()
        .single();
      if (error) throw error;

      const { data: mb, error: mErr } = await supabase
        .from('members')
        .insert({
          user_id: user.id,
          household_id: (hh as Household).id,
          papel,
          nome: user.user_metadata?.full_name ?? null,
        })
        .select()
        .single();
      if (mErr) throw mErr;

      setHousehold(hh as Household);
      setMember(mb as Member);
      return hh as Household;
    },
    joinHousehold: async (inviteCode, papel = 'mae') => {
      if (!user) throw new Error('Sem usuário autenticado');
      const { data: hh, error } = await supabase
        .from('households')
        .select('*')
        .eq('invite_code', inviteCode.trim().toUpperCase())
        .maybeSingle();
      if (error) throw error;
      if (!hh) throw new Error('Código de convite não encontrado');

      const { data: mb, error: mErr } = await supabase
        .from('members')
        .insert({
          user_id: user.id,
          household_id: (hh as Household).id,
          papel,
          nome: user.user_metadata?.full_name ?? null,
        })
        .select()
        .single();
      if (mErr) throw mErr;

      setHousehold(hh as Household);
      setMember(mb as Member);
      return hh as Household;
    },
    refreshMembership: async () => loadMembership(user?.id),
  }), [user, session, member, household, loading, loadMembership]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
