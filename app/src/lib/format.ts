const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const brlCompact = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const dayMonth = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const monthYear = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' });

export const formatBRL = (v: number | null | undefined) => brl.format(Number(v ?? 0));
export const formatBRLCompact = (v: number | null | undefined) => brlCompact.format(Number(v ?? 0));

/** 'YYYY-MM-DD' → Date local (evita o shift de fuso do construtor ISO). */
export const parseDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
};

export const formatDayMonth = (iso: string) => dayMonth.format(parseDate(iso));
export const formatMonthLabel = (ym: string) => monthYear.format(parseDate(ym + '-01'));

/** 'YYYY-MM' do mês atual. */
export const currentMonth = () => new Date().toISOString().slice(0, 7);

/** Primeiro e último dia (YYYY-MM-DD) de um mês 'YYYY-MM'. */
export function monthRange(ym: string) {
  const [y, m] = ym.split('-').map(Number);
  const last = new Date(y, m, 0).getDate();
  return { from: `${ym}-01`, to: `${ym}-${String(last).padStart(2, '0')}` };
}

export function shiftMonth(ym: string, delta: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

/** Apelido/papel da pessoa no grupo — texto livre. Mantém o rótulo bonito pra dados antigos ('pai'/'mae'). */
export const papelLabel = (p?: string | null) => {
  if (p === 'mae') return 'Mãe';
  if (p === 'pai') return 'Pai';
  return p?.trim() || '—';
};
