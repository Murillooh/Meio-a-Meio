# Casa — finanças da família

PWA mobile-first (React + TypeScript + Vite + Tailwind + Supabase + TanStack Query)
para uma casa acompanhar contas, gastos por finalidade e a reserva de emergência.
Dois temas escolhidos pelo usuário: **Noite acolhedora** (marrom quente `#1c1512` + pêssego `#f0a06a`)
e **Caderno de cozinha** (creme `#faf6ef` + terracota `#c05f3c`), com verde sálvia como cor calma.
Tipografia Bricolage Grotesque + Instrument Serif nos títulos.

---

## 1. Setup passo a passo

```bash
# 1. dependências
cd app
npm install

# 2. variáveis do front
cp .env.example .env
#   VITE_SUPABASE_URL=...
#   VITE_SUPABASE_ANON_KEY=...

# 3. banco: rode no SQL Editor do Supabase, nesta ordem
#   supabase/migrations/0001_init.sql
#   supabase/migrations/0002_category_rules.sql

# 4. auth: Dashboard → Authentication → Providers
#   - Email/senha: habilitado
#   - Google: habilite e cole Client ID/Secret do Google Cloud
#   - Redirect URLs: http://localhost:5173 e a URL de produção

# 5. Open Finance (opcional, sandbox) — chaves NUNCA no front
supabase secrets set PLUGGY_CLIENT_ID=xxx PLUGGY_CLIENT_SECRET=yyy
supabase functions deploy pluggy

# 6. rodar
npm run dev        # http://localhost:5173

# 7. build de produção + preview (é aqui que o service worker existe)
npm run build
npm run preview    # http://localhost:4173
```

> O service worker só é gerado no build (`devOptions.enabled: false`).
> Para testar instalação/offline use `npm run build && npm run preview`.

---

## 2. Estrutura

```
app/
  index.html                 splash inicial, metas iOS, manifest
  vite.config.ts             React + vite-plugin-pwa (manifest + workbox)
  tailwind.config.js         tema escuro/dourado, Inter, safe-area
  public/                    ícones 192/512/maskable, apple-touch-icon, splash.png, favicon.svg
  src/
    components/              AppLayout, TabBar, TransactionModal, DepositModal,
                             EmergencyProgress, InlineCategory, ProtectedRoute, Screen, Splash
    components/ui/           Button, Input/Select/MoneyInput/Field, Card/StatCard/SectionTitle,
                             Modal, States (Loading/ErrorState/EmptyState)
    pages/                   Login, Onboarding, Dashboard, Transactions, Piggy,
                             Accounts, Categories, Rules
    hooks/                   useAuth, useHouseholdData, useEmergency, useBankSync, useCategoryRules
    lib/                     supabase.ts, queryClient.ts, AuthContext.tsx, format.ts,
                             rules.ts, inviteCode.ts, providers/ (BankProvider + PluggyProvider)
    types/                   Household, Member, Category, Account, Transaction, EmergencyFund, CategoryRule
supabase/
  migrations/0001_init.sql            tabelas + RLS + helper current_household_ids()
  migrations/0002_category_rules.sql  regras de categorização + seed
  functions/pluggy/index.ts           Edge Function proxy do agregador
```

---

## 3. Variáveis de ambiente

| Onde | Variável | Observação |
| --- | --- | --- |
| `app/.env` | `VITE_SUPABASE_URL` | pública |
| `app/.env` | `VITE_SUPABASE_ANON_KEY` | pública, protegida por RLS |
| Secrets Supabase | `PLUGGY_CLIENT_ID` | **nunca** no front |
| Secrets Supabase | `PLUGGY_CLIENT_SECRET` | **nunca** no front |
| Injetadas pelo Supabase | `SUPABASE_URL`, `SUPABASE_ANON_KEY` | usadas na função para validar o JWT |

---

## 4. Autenticação e household
- Google OAuth + e-mail/senha (`supabase.auth`).
- `AuthContext` expõe `user`, `member` (papel `pai`/`mae`), `household`, `loading` e as ações.
- `ProtectedRoute`: sem user → `/login`; user sem household → `/onboarding`; caso contrário libera.
- Criar casa gera código de convite de 6 caracteres (alfabeto sem I/O/0/1).

## 5. Telas
- **Início**: saldo consolidado, três cards por finalidade (Escola/Emergência/Casa), divisão pai × mãe em barras, últimos lançamentos.
- **Transações**: filtros combináveis na URL (`?mes=&conta=&categoria=&autor=`), dropdown inline de categoria, "criar regra a partir desta transação", modal de nova transação.
- **Cofrinho**: configuração de meta/despesa média, barra com glow dourado, "X meses de reserva", depósito/saque e histórico.
- **Ajustes**: perfil (nome + papel), renomear casa, código de convite, membros, atalhos para categorias/regras/bancos/meta da reserva e sair.
- **Contas**: conectar banco (Pluggy sandbox), sincronizar por conta, código de convite, atalhos para categorias e regras.

## 6. Categorização automática
`category_rules(padrao, categoria_id)` — se a descrição **contém** o padrão
(case-insensitive, acentos ignorados), aplica a categoria; padrões mais longos
têm prioridade; sem match fica sem categoria. Roda no import do Pluggy e em
**Regras → Reaplicar nas sem categoria**.

## 7. Open Finance (Pluggy) — SANDBOX
```
PluggyProvider ──POST──▶ Edge Function 'pluggy' ──▶ Pluggy (/auth, /connect_token,
(implementa BankProvider)  guarda CLIENT_ID/SECRET       /accounts, /transactions)
```
O front recebe só o connect token de curta duração e dados normalizados.
Trocar de agregador = nova classe implementando `src/lib/providers/BankProvider.ts`
(+ uma linha em `providers/index.ts`).

**Chaves de sandbox:** crie a conta em `dashboard.pluggy.ai`, copie `Client ID` e
`Client Secret` em Applications/API Keys e registre com `supabase secrets set`.
O widget roda com `includeSandbox: true` — use os conectores de teste
(ex. `user-ok`/`password-ok`, `user-mfa` para 2FA).

### ⚠️ Produção
Sandbox apenas. Produção exige credenciais de produção do Pluggy, contrato com
instituição autorizada pelo BACEN, consentimento explícito/revogável por usuário
(LGPD arts. 7º e 8º + regras do Open Finance), política de privacidade, retenção
mínima, trilha de auditoria e revisão das políticas de RLS. Não aponte para
produção sem revisão jurídica/compliance.

## 8. PWA
- `vite-plugin-pwa` com `registerType: 'autoUpdate'`; precache de JS/CSS/HTML/ícones,
  `CacheFirst` para Google Fonts e `NetworkFirst` (5s) para `/rest/v1` do Supabase.
- Manifest: nome "Casa", `display: standalone`, `theme_color`/`background_color` `#0c0c0b`,
  ícones 192/512 + maskable 512.
- iOS: `apple-mobile-web-app-capable`, status bar translúcida, `apple-touch-icon`,
  `apple-touch-startup-image` e `viewport-fit=cover` + `env(safe-area-inset-*)` no
  `body`, na tab bar e no `Screen`.
- Instalar: Android/Chrome → menu → "Instalar app"; iOS/Safari → Compartilhar →
  "Adicionar à Tela de Início".

## 9. Temas
- `ThemeProvider` (`src/lib/ThemeContext.tsx`) grava `data-theme` no `<html>` e persiste
  em `localStorage('casa:tema')`; um script inline no `index.html` aplica antes da
  primeira pintura para não piscar.
- Todas as cores são variáveis CSS (`--bg`, `--accent`, …) mapeadas no
  `tailwind.config.js`, então as telas usam `bg-base`, `text-ink`, `bg-accent` e
  trocam de tema sem tocar em componente.
- Escolha em **Ajustes → Aparência** (`ThemeToggle`); a `theme-color` do PWA
  acompanha o tema ativo.

## 10. Responsividade e acessibilidade
- Mobile-first em coluna única (`max-w-420px`) com bottom tab bar; a partir de `md`
  a navegação vira sidebar e as listas abrem em 2–3 colunas (`max-w-1080px`).
- Alvos de toque ≥ 44px (tabs 56px, botões 52px), `active:scale` no tap e
  transições de cor no hover.
- Foco visível global (`:focus-visible` dourado), `aria-label` na navegação,
  `role="status"`/`role="alert"` nos estados, `prefers-reduced-motion` respeitado.
- Estados padronizados de loading (skeleton), erro (com "tentar de novo") e vazio
  em Início, Transações, Cofrinho, Contas, Categorias e Regras.
