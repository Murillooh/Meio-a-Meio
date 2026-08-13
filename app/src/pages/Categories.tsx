import { useState } from 'react';
import { Card, SectionTitle } from '@/components/ui/Card';
import { EmptyState, Loading } from '@/components/ui/States';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { useCategories, useCreateCategory } from '@/hooks/useHouseholdData';
import type { CategoriaTipo } from '@/types';

const TIPOS: { value: CategoriaTipo; label: string }[] = [
  { value: 'escola', label: 'Escola' },
  { value: 'emergencia', label: 'Emergência' },
  { value: 'geral', label: 'Geral' },
  { value: 'livre', label: 'Livre' },
];
const CORES = ['#d4a017', '#f0a3b1', '#8ab0a0', '#9aa7d4', '#e8b839', '#c98b6b'];
const ICONES = ['graduation-cap', 'shield', 'home', 'cart', 'car', 'heart'];

export default function Categories() {
  const { data: categories = [], isLoading } = useCategories();
  const create = useCreateCategory();
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<CategoriaTipo>('geral');
  const [cor, setCor] = useState(CORES[0]);
  const [icone, setIcone] = useState(ICONES[0]);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return setError('Dê um nome para a categoria.');
    try {
      await create.mutateAsync({ nome: nome.trim(), tipo, cor, icone });
      setNome(''); setTipo('geral'); setCor(CORES[0]); setError(''); setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar');
    }
  }

  return (
    <>
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-[26px] font-semibold tracking-tight">Categorias</h1>
        <Button size="sm" onClick={() => setOpen(true)}>+ Nova</Button>
      </header>

      <SectionTitle>{categories.length} categorias</SectionTitle>
      {isLoading && <Loading rows={3} />}
      {!isLoading && categories.length === 0 && <EmptyState title="Nenhuma categoria ainda." />}

      <div className="flex flex-col gap-2 md:grid md:grid-cols-2">
        {categories.map((c) => (
          <Card key={c.id} className="flex items-center gap-3">
            <span className="h-9 w-9 rounded-xl" style={{ background: (c.cor ?? '#d4a017') + '2e', border: '1px solid ' + (c.cor ?? '#d4a017') + '55' }} />
            <div className="flex-1">
              <p className="text-[15px]">{c.nome}</p>
              <p className="text-[11.5px] uppercase tracking-[0.08em] text-ink-faint">{c.tipo}</p>
            </div>
            <span className="font-mono text-[11.5px] text-ink-faint">{c.icone}</span>
          </Card>
        ))}
      </div>

      <Modal open={open} title="Nova categoria" onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label="Nome"><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Mercado" autoFocus /></Field>
          <Field label="Tipo">
            <Select value={tipo} onChange={(e) => setTipo(e.target.value as CategoriaTipo)}>
              {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
          <Field label="Cor">
            <div className="flex gap-2.5">
              {CORES.map((c) => (
                <button key={c} type="button" onClick={() => setCor(c)}
                  className={'h-9 w-9 rounded-full transition ' + (cor === c ? 'ring-2 ring-offset-2 ring-offset-base-card ring-white/70' : '')}
                  style={{ background: c }} aria-label={c} />
              ))}
            </div>
          </Field>
          <Field label="Ícone">
            <Select value={icone} onChange={(e) => setIcone(e.target.value)}>
              {ICONES.map((i) => <option key={i} value={i}>{i}</option>)}
            </Select>
          </Field>
          {error && <p className="alert">{error}</p>}
          <Button full disabled={create.isPending}>{create.isPending ? 'Salvando…' : 'Criar categoria'}</Button>
        </form>
      </Modal>
    </>
  );
}
