// Supabase Edge Function — proxy do agregador Pluggy (SANDBOX).
//
// As credenciais (PLUGGY_CLIENT_ID / PLUGGY_CLIENT_SECRET) vivem SOMENTE aqui,
// nos secrets do projeto Supabase. O front-end recebe apenas:
//   - um connect token de curta duração (para abrir o widget), ou
//   - dados já normalizados de accounts/transactions.
//
// Deploy:
//   supabase secrets set PLUGGY_CLIENT_ID=... PLUGGY_CLIENT_SECRET=...
//   supabase functions deploy pluggy
//
// Requer usuário autenticado: o header Authorization (JWT do Supabase) é
// validado antes de qualquer chamada ao Pluggy.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PLUGGY_API = 'https://api.pluggy.ai';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type Action =
  | { action: 'connect_token'; itemId?: string }
  | { action: 'accounts'; itemId: string }
  | { action: 'transactions'; accountId: string; from?: string; to?: string }
  | { action: 'item'; itemId: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** API key do Pluggy (2h de validade). Nunca sai da função. */
async function pluggyApiKey(): Promise<string> {
  const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
  const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw new Error('PLUGGY_CLIENT_ID/SECRET não configurados');

  const res = await fetch(`${PLUGGY_API}/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!res.ok) throw new Error(`Pluggy /auth falhou: ${res.status}`);
  const { apiKey } = await res.json();
  return apiKey as string;
}

async function pluggyGet<T>(path: string, apiKey: string): Promise<T> {
  const res = await fetch(`${PLUGGY_API}${path}`, { headers: { 'X-API-KEY': apiKey } });
  if (!res.ok) throw new Error(`Pluggy ${path} falhou: ${res.status}`);
  return await res.json() as T;
}

/** Só passa requisição de usuário autenticado no Supabase. */
async function requireUser(req: Request) {
  const authHeader = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const user = await requireUser(req);
  if (!user) return json({ error: 'Não autenticado' }, 401);

  let body: Action;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  try {
    const apiKey = await pluggyApiKey();

    switch (body.action) {
      // 1. connect token de curta duração para o widget
      case 'connect_token': {
        const res = await fetch(`${PLUGGY_API}/connect_token`, {
          method: 'POST',
          headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // itemId presente = atualizar/reautenticar uma conexão existente
            itemId: body.itemId,
            options: { clientUserId: user.id },
          }),
        });
        if (!res.ok) return json({ error: `connect_token falhou: ${res.status}` }, 502);
        const { accessToken } = await res.json();
        return json({ connectToken: accessToken });
      }

      // 2. contas de um item
      case 'accounts': {
        const data = await pluggyGet<{ results: any[] }>(`/accounts?itemId=${body.itemId}`, apiKey);
        return json({
          accounts: (data.results ?? []).map((a) => ({
            externalId: a.id,
            banco: a.marketingName ?? a.name ?? null,
            tipo: a.type ?? null,
            saldo: Number(a.balance ?? 0),
            moeda: a.currencyCode ?? 'BRL',
          })),
        });
      }

      // 3. transações de uma conta
      case 'transactions': {
        const params = new URLSearchParams({ accountId: body.accountId, pageSize: '200' });
        if (body.from) params.set('from', body.from);
        if (body.to) params.set('to', body.to);
        const data = await pluggyGet<{ results: any[] }>(`/transactions?${params}`, apiKey);
        return json({
          transactions: (data.results ?? []).map((t) => ({
            externalId: t.id,
            descricao: t.description ?? t.descriptionRaw ?? 'Lançamento',
            valor: Number(t.amount ?? 0),
            data: String(t.date ?? '').slice(0, 10),
          })),
        });
      }

      case 'item': {
        const item = await pluggyGet<any>(`/items/${body.itemId}`, apiKey);
        return json({ item: { id: item.id, status: item.status, connector: item.connector?.name ?? null } });
      }

      default:
        return json({ error: 'Ação desconhecida' }, 400);
    }
  } catch (err) {
    console.error(err);
    return json({ error: err instanceof Error ? err.message : 'Erro interno' }, 500);
  }
});
