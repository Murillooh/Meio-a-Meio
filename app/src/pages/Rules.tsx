import { useState } from 'react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState, Loading } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useCategories } from '@/hooks/useHouseholdData';
import { useCategoryRules, useDeleteRule, useReapplyRules, useSaveRule } from '@/hooks/useCategoryRules';
import type { CategoryRule } from '@/types';

export default function Rules() {
  const { data: rules = [], isLoading } = useCategoryRules();
  const { data: categories = [] } = useCategories();
  const save = useSaveRule();
  const del = useDeleteRule();
  const reapply = useReapplyRules();

  const [editing, setEditing] = useState<CategoryRule | 'new' | null>(null);
  const [padrao, setPadrao] = useState('');
  const [categoriaId, setCategoriaId] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  function open(rule: CategoryRule | 'new') {
    setEditing(rule);
    setError('');
    setPadrao(rule === 'new' ? '' : rule.padrao);
    setCategoriaId(rule === 'new' ? (categories[0]?.id ?? '') : rule.categoria_id);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!padrao.trim()) return setError('Informe o texto a procurar na descrição.');
    if (!categoriaId) return setError('Escolha a categoria.');
    try {
      await save.mutateAsync({
        id: editing && editing !== 'new' ? editing.id : undefined,
        padrao, categoria_id: categoriaId,
      });
      setEditing(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar');
    }
  }

  return (
    <>
      <header className="mb-2 flex items-center justify-between">
        <h1 className="text-[26px] font-semibold tracking-tight">Regras</h1>
        <Button size="sm" onClick={() => open('new')}>+ Nova</Button>
      </header>
      <p className="text-[14px] text-ink-muted">
        Ao importar do banco, a primeira regra cujo texto aparece na descrição define a categoria. Sem match, a transação fica sem categoria.
      </p>

      <Button variant="ghost" full className="mt-4 md:max-w-[420px]" disabled={reapply.isPending}
        onClick={async () => { const n = await reapply.mutateAsync(rules); setMsg(`${n} transação(ões) categorizada(s).`); }}>
        {reapply.isPending ? 'Aplicando…' : 'Reaplicar nas sem categoria'}
      </Button>
      {msg && <p className="mt-3 rounded-xl border border-gold/30 bg-gold/10 px-3 py-2.5 text-[13px] text-gold-bright">{msg}</p>}

      <SectionTitle>{rules.length} regras</SectionTitle>
      {isLoading && <Loading rows={3} />}
      {!isLoading && rules.length === 0 && (
        <EmptyState title="Nenhuma regra ainda." hint="Crie a partir de uma transação na lista ou aqui." />
      )}

      <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
        {rules.map((r) => (
          <Card key={r.id} className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[13.5px] text-ink">{r.padrao}</p>
              <p className="text-[11.5px] text-ink-faint">→ {r.categoria?.nome ?? '—'}</p>
            </div>
            <button className="text-[12px] text-ink-faint hover:text-gold" onClick={() => open(r)}>editar</button>
            <button className="text-[12px] text-ink-faint hover:text-alert" onClick={() => del.mutate(r.id)}>excluir</button>
          </Card>
        ))}
      </div>

      <Modal open={editing !== null} title={editing === 'new' ? 'Nova regra' : 'Editar regra'} onClose={() => setEditing(null)}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Se a descrição contém" hint="case-insensitive, ignora acentos">
            <Input value={padrao} onChange={(e) => setPadrao(e.target.value)} placeholder="MENSALIDADE" autoFocus />
          </Field>
          <Field label="Categoria">
            <Select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </Field>
          {error && <p className="alert">{error}</p>}
          <Button full disabled={save.isPending}>{save.isPending ? 'Salvando…' : 'Salvar regra'}</Button>
        </form>
      </Modal>
    </>
  );
}
