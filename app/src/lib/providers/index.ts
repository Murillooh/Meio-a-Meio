import type { BankProvider } from './BankProvider';
import { PluggyProvider } from './PluggyProvider';

/** Ponto único de troca de agregador (Pluggy → Belvo/Klavi). */
export const bankProvider: BankProvider = new PluggyProvider();
export type { BankProvider } from './BankProvider';
