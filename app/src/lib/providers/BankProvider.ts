/**
 * Contrato de agregador de Open Finance.
 * Trocar Pluggy por Belvo/Klavi = nova implementação desta interface.
 * Nenhuma credencial do provider aparece no front-end: tudo passa por
 * uma Edge Function que guarda client id/secret nos secrets do Supabase.
 */

export interface ProviderAccount {
  externalId: string;
  banco: string | null;
  tipo: string | null;
  saldo: number;
  moeda: string;
}

export interface ProviderTransaction {
  externalId: string;
  descricao: string;
  /** positivo = entrada, negativo = saída */
  valor: number;
  /** YYYY-MM-DD */
  data: string;
}

export interface ProviderItem {
  id: string;
  status: string;
  connector: string | null;
}

export interface BankProvider {
  /** identificador gravado em bank_connections.provider */
  readonly name: string;
  /** token de curta duração para abrir o widget do provider */
  createConnectToken(itemId?: string): Promise<string>;
  /** abre o widget e resolve com o itemId conectado (null se cancelado) */
  openWidget(connectToken: string): Promise<{ itemId: string } | null>;
  listAccounts(itemId: string): Promise<ProviderAccount[]>;
  listTransactions(accountId: string, range?: { from?: string; to?: string }): Promise<ProviderTransaction[]>;
  getItem(itemId: string): Promise<ProviderItem>;
}
