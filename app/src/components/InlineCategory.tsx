import { useState } from 'react';
import { useCategories, useUpdateTransaction } from '@/hooks/useHouseholdData';
import type { TransactionRow } from '@/types';

/** Dropdown inline para recategorizar uma transação sem sair da lista. */
export function InlineCategory({ tx, onCreateRule }: { tx: TransactionRow; onCreateRule: () => void }) {
  const { data: categories = [] } = useCategories();
  const update = useUpdateTransaction();
  const [saving, setSaving] = useState(false);
  const cor = tx.categoria?.cor ?? 'rgba(244,242,236,.3)';

  return (
    <div className="flex items-center gap-2">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cor }} />
      <select
        value={tx.categoria_id ?? ''}
        disabled={saving}
        onChange={async (e) => {
          setSaving(true);
          try { await update.mutateAsync({ id: tx.id, categoria_id: e.target.value || null }); }
          finally { setSaving(false); }
        }}
        className="max-w-[150px] appearance-none rounded-lg border border-base-line bg-black/30 px-2 py-1 text-[11.5px] text-ink-muted outline-none focus:border-gold"
      >
        <option value="">Sem categoria</option>
        {categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
      </select>
      <button type="button" onClick={onCreateRule} className="text-[11px] text-ink-faint hover:text-gold">criar regra</button>
    </div>
  );
}
