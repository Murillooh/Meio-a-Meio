import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { generateInviteCode } from './inviteCode';
import type { Household, Member, Papel } from '@/types';

export interface Membership { member: Member; household: Household }

export interface AuthValue {
  user: User | null;
  session: Session | null;
  member: Member | null;
  household: Household | null;
  /** Todos os grupos de que o usuário participa (não só o ativo). */
  households: Membership[];
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signUpWithPassword: (email: string, password: string, nome?: string, telefone?: string) => Promise<void>;
  signOut: () => Promise<void>;
  createHousehold: (nome: string, papel: Papel | null) => Promise<Household>;
  joinHousehold: (inviteCode: string, papel?: Papel | null) => Promise<Household>;
  /** Troca qual grupo está ativo (persiste a escolha). */
  switchHousehold: (householdId: string) => void;
  refreshMembership: () => Promise<void>;
}

const ACTIVE_HOUSEHOLD_KEY = 'casa:activeHousehold';

export const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [households, setHouseholds] = useState<Membership[]>([]);
  const [activeHouseholdId, setActiveHouseholdId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_HOUSEHOLD_KEY),
  );
  const [loading, setLoading] = useState(true);

  const user = session?.user ?? null;

  const switchHousehold = useCallback((householdId: string) => {
    setActiveHouseholdId(householdId);
    localStorage.setItem(ACTIVE_HOUSEHOLD_KEY, householdId);
  }, []);

  // grupo ativo: o salvo em localStorage se o usuário ainda está nele, senão o primeiro
  const active = households.find((m) => m.household.id === activeHouseholdId) ?? households[0] ?? null;
  const member = active?.member ?? null;
  const household = active?.household ?? null;

  const loadMembership = useCallback(async (uid: string | undefined) => {
    if (!uid) {
      setHouseholds([]);
      return;
    }
    // tabelas ainda não existem: erro é tratado como "sem household"
    const { data, error } = await supabase
      .from('members')
      .select('*, household:households(*)')
      .eq('user_id', uid);

    if (error || !data) {
      setHouseholds([]);
      return;
    }
    const list = (data as (Member & { household: Household | null })[])
      .filter((row): row is Member & { household: Household } => !!row.household)
      .map(({ household: hh, ...rest }) => ({ member: rest as Member, household: hh }));
    setHouseholds(list);
  }, []);

  useEffect(() => {
    let alive = true;
    let initialBootDone = false;
    
    // Força a tela de splash a ficar visível por no mínimo 2 segundos para tocar a animação
    const minDelay = new Promise(resolve => setTimeout(resolve, 2000));
    
    const initAuth = async () => {
      const { data } = await supabase.auth.getSession();
      if (!alive) return;
      setSession(data.session);
      await loadMembership(data.session?.user.id);
    };

    Promise.all([minDelay, initAuth()]).then(() => {
      if (!alive) return;
      initialBootDone = true;
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, next) => {
      if (!alive) return;
      setSession(next);
      
      if (!initialBootDone) {
        // Se ainda estamos no boot, atualiza os dados mas NÃO altera o loading
        await loadMembership(next?.user.id);
      } else {
        // Mudanças de auth pós-boot (ex: login/logout)
        setLoading(true);
        await loadMembership(next?.user.id);
        if (alive) setLoading(false);
      }
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
    households,
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
      setHouseholds([]);
      localStorage.removeItem(ACTIVE_HOUSEHOLD_KEY);
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

      setHouseholds((prev) => [...prev, { member: mb as Member, household: hh as Household }]);
      switchHousehold((hh as Household).id);
      return hh as Household;
    },
    joinHousehold: async (inviteCode, papel = null) => {
      if (!user) throw new Error('Sem usuário autenticado');
      // usa RPC (security definer) porque RLS de households não deixa ver a casa
      // antes de virar membro dela — select direto sempre voltaria vazio aqui
      const { data: hh, error } = await supabase
        .rpc('household_by_invite_code', { code: inviteCode.trim().toUpperCase() })
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

      setHouseholds((prev) => [...prev, { member: mb as Member, household: hh as Household }]);
      switchHousehold((hh as Household).id);
      return hh as Household;
    },
    switchHousehold,
    refreshMembership: async () => loadMembership(user?.id),
  }), [user, session, member, household, households, loading, loadMembership, switchHousehold]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
