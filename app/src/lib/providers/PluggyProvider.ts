import { supabase } from '../supabase';
import type { BankProvider, ProviderAccount, ProviderItem, ProviderTransaction } from './BankProvider';

const WIDGET_SRC = 'https://cdn.pluggy.ai/pluggy-connect/v2.9.2/pluggy-connect.js';

declare global {
  interface Window { PluggyConnect?: new (opts: Record<string, unknown>) => { init: () => void } }
}

async function loadWidget(): Promise<NonNullable<Window['PluggyConnect']>> {
  if (window.PluggyConnect) return window.PluggyConnect;
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = WIDGET_SRC;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Falha ao carregar o Pluggy Connect'));
    document.head.appendChild(s);
  });
  if (!window.PluggyConnect) throw new Error('Pluggy Connect indisponível');
  return window.PluggyConnect;
}

/** Chama a Edge Function 'pluggy' com o JWT do usuário; credenciais ficam no servidor. */
async function callEdge<T>(payload: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke<T>('pluggy', { body: payload });
  if (error) throw error;
  if (!data) throw new Error('Resposta vazia da Edge Function');
  return data;
}

export class PluggyProvider implements BankProvider {
  readonly name = 'pluggy';

  async createConnectToken(itemId?: string): Promise<string> {
    const { connectToken } = await callEdge<{ connectToken: string }>({ action: 'connect_token', itemId });
    return connectToken;
  }

  async openWidget(connectToken: string): Promise<{ itemId: string } | null> {
    const PluggyConnect = await loadWidget();
    return new Promise((resolve, reject) => {
      const widget = new PluggyConnect({
        connectToken,
        includeSandbox: true, // SANDBOX: mostra os conectores de teste
        onSuccess: (payload: { item?: { id?: string } }) => {
          const id = payload?.item?.id;
          resolve(id ? { itemId: id } : null);
        },
        onError: (err: unknown) => reject(err instanceof Error ? err : new Error('Erro no Pluggy Connect')),
        onClose: () => resolve(null),
      });
      widget.init();
    });
  }

  async listAccounts(itemId: string): Promise<ProviderAccount[]> {
    const { accounts } = await callEdge<{ accounts: ProviderAccount[] }>({ action: 'accounts', itemId });
    return accounts;
  }

  async listTransactions(accountId: string, range?: { from?: string; to?: string }): Promise<ProviderTransaction[]> {
    const { transactions } = await callEdge<{ transactions: ProviderTransaction[] }>({
      action: 'transactions', accountId, ...range,
    });
    return transactions;
  }

  async getItem(itemId: string): Promise<ProviderItem> {
    const { item } = await callEdge<{ item: ProviderItem }>({ action: 'item', itemId });
    return item;
  }
}
