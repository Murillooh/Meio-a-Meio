import type { CategoryRule } from '@/types';

const norm = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

/**
 * Primeira regra cujo padrão está contido na descrição (case/acento-insensitive).
 * Regras mais específicas (padrão mais longo) têm prioridade.
 */
export function matchRule(descricao: string, rules: CategoryRule[]): CategoryRule | null {
  const alvo = norm(descricao);
  const ativas = rules.filter((r) => r.ativa !== false && r.padrao.trim());
  const ordenadas = [...ativas].sort((a, b) => b.padrao.length - a.padrao.length);
  return ordenadas.find((r) => alvo.includes(norm(r.padrao))) ?? null;
}

export function applyRules(descricao: string, rules: CategoryRule[]): string | null {
  return matchRule(descricao, rules)?.categoria_id ?? null;
}

/** Sugere um padrão a partir de uma descrição: primeiras palavras significativas. */
export function suggestPattern(descricao: string): string {
  return descricao
    .replace(/[0-9]{2,}/g, ' ')
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .join(' ')
    .toUpperCase()
    .trim();
}
