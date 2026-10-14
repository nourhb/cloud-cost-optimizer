# Architecture — Cloud Cost Optimizer

**Version:** 1.0  
**Status:** Approved (2026-10-14) — UI language: **English**; Milestone 1 in progress  
**Source:** Approved architecture proposal (project store). Product requirements remain in the CDC.  
**Stack:** Next.js App Router · TypeScript · Tailwind · Recharts · Supabase (Postgres + Auth) · Zod · Papa Parse · Vitest · Playwright · GitHub Actions · pnpm · shadcn/ui  

> **UI language:** All product copy (labels, empty states, errors) is English. Technical identifiers stay English.

---

## 1. Inspection du workspace

### État actuel

| Élément | Constat |
|---|---|
| Dépôt Git | Présent, branche `main`, commit unique `Initialize project` |
| Fichiers applicatifs | **Aucun** (pas de `package.json`, pas de `src/`, pas de README) |
| Contenu versionné | Arbre de travail vide côté application |
| Spec produit | CDC disponible dans le store projet : `docs/cahier-des-charges.md` |
| Docker / K8s / VM | Non requis et non présents — conforme aux contraintes |
| Secrets | Aucun fichier `.env` — à créer uniquement après approbation |

### Implications

Le projet part d’une **feuille blanche**. Toute structure, schéma, tooling et documentation d’installation seront créés après validation de cette proposition. Aucun code applicatif n’a été généré dans le cadre de ce document.

---

## 2. Structure de dossiers proposée

Organisation **feature-oriented** autour de l’App Router Next.js, avec séparation claire UI / API / domaine / infra.

```text
/
├── .github/
│   └── workflows/
│       └── ci.yml                 # lint, typecheck, vitest, playwright (smoke)
├── .env.example                   # variables documentées (sans secrets réels)
├── .gitignore
├── README.md                      # installation locale, modes demo/prod, scripts
├── package.json
├── pnpm-lock.yaml                 # ou package-lock.json (décision §6)
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.mjs
├── vitest.config.ts
├── playwright.config.ts
├── components.json                # config shadcn/ui (si approuvé)
│
├── public/
│   └── favicon.ico
│
├── docs/                          # doc technique versionnée dans le repo (copie/lien)
│   ├── architecture.md            # version repo de cette proposition (post-approbation)
│   └── data-model.md              # schéma SQL + politiques RLS
│
├── data/
│   └── samples/
│       ├── billing-valid.csv      # jeu synthétique valide (plusieurs mois)
│       ├── billing-invalid.csv    # colonnes manquantes, dates invalides
│       ├── billing-duplicates.csv
│       ├── billing-credits.csv    # coûts négatifs (crédits)
│       └── billing-multi-currency.csv
│
├── supabase/
│   ├── config.toml                # optionnel si CLI locale utilisée
│   └── migrations/
│       ├── 00001_init.sql         # tables, indexes, types money
│       ├── 00002_rls.sql          # RLS + policies
│       └── 00003_auth_trigger.sql # sync profil user depuis auth.users
│
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # landing marketing légère
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── (app)/                 # zone authentifiée (layout protégé)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── imports/
│   │   │   │   ├── page.tsx       # historique
│   │   │   │   └── new/page.tsx   # upload + preview
│   │   │   ├── analysis/page.tsx
│   │   │   ├── budgets/page.tsx
│   │   │   ├── alerts/page.tsx
│   │   │   ├── recommendations/page.tsx
│   │   │   └── reports/page.tsx
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── imports/route.ts
│   │       ├── imports/[id]/route.ts
│   │       ├── billing/summary/route.ts
│   │       ├── budgets/route.ts
│   │       ├── alerts/route.ts
│   │       ├── recommendations/route.ts
│   │       ├── forecast/route.ts
│   │       └── reports/
│   │           ├── csv/route.ts
│   │           └── pdf/route.ts
│   │
│   ├── components/
│   │   ├── ui/                    # primitives shadcn (Button, Input, Dialog…)
│   │   ├── charts/                # wrappers Recharts typés
│   │   ├── layout/                # AppShell, Nav, PageHeader
│   │   └── shared/                # EmptyState, ErrorBanner, Loading…
│   │
│   ├── features/                  # logique métier par domaine (cœur du design)
│   │   ├── auth/
│   │   ├── imports/               # parse CSV, preview, commit, historique
│   │   ├── billing/               # agrégations, filtres, variations
│   │   ├── budgets/
│   │   ├── alerts/                # règles d’alerte pures + orchestration
│   │   ├── forecast/              # prévision linéaire journalière
│   │   ├── recommendations/       # règles explicables
│   │   └── reports/               # CSV + PDF
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # createBrowserClient (anon key only)
│   │   │   ├── server.ts          # createServerClient (cookies, anon + session)
│   │   │   └── admin.ts           # service role — SERVER ONLY, jamais importé côté client
│   │   ├── money.ts               # helpers décimaux / format devise
│   │   ├── dates.ts
│   │   ├── env.ts                 # validation Zod des env vars au boot serveur
│   │   └── demo/                  # store mémoire / fixtures si DEMO_MODE=true
│   │
│   ├── schemas/                   # Zod (entrée CSV, API bodies, filtres)
│   │   ├── billing-csv.ts
│   │   ├── budget.ts
│   │   └── filters.ts
│   │
│   └── types/
│       ├── database.ts            # types générés ou manuels alignés sur SQL
│       └── domain.ts              # BillingRecord, Alert, ForecastResult…
│
└── tests/
    ├── unit/                      # Vitest — parsers, règles, forecast, money
    ├── integration/               # API + schéma (mock Supabase ou demo store)
    └── e2e/                       # Playwright — parcours critiques
```

### Rôles des dossiers clés

| Chemin | Rôle |
|---|---|
| `src/app/(app)/` | Pages UI authentifiées ; pas de logique métier lourde |
| `src/app/api/` | Route Handlers : auth gate, validation Zod, orchestration |
| `src/features/*` | Domaine pur (fonctions testables, sans React) + adaptateurs |
| `src/lib/supabase/` | Frontière auth/DB ; `admin.ts` isolé |
| `src/schemas/` | Contrats d’entrée (CSV + HTTP) |
| `supabase/migrations/` | Source de vérité du schéma et des RLS |
| `data/samples/` | Données synthétiques pour demo, tests et recettes CDC §9 |

---

## 3. Schéma de base de données & frontières de sécurité

Extension explicite du CDC §6. Les montants utilisent `NUMERIC(18,6)` (précision monétaire sans float). Les UUID sont `uuid` Postgres (`gen_random_uuid()`).

### 3.1. Entités SQL

#### `profiles` (extension de Users)

Supabase Auth possède déjà `auth.users`. On expose un profil applicatif :

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK, FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | `text` | NOT NULL |
| `display_name` | `text` | NULL |
| `preferred_currency` | `char(3)` | NOT NULL DEFAULT `'CAD'` |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

Trigger : à chaque `INSERT` sur `auth.users`, créer la ligne `profiles`.

#### `billing_imports`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `filename` | `text` | NOT NULL |
| `status` | `text` | NOT NULL, CHECK ∈ `pending\|previewed\|committed\|failed` |
| `rows_processed` | `integer` | NOT NULL DEFAULT 0, CHECK ≥ 0 |
| `rows_rejected` | `integer` | NOT NULL DEFAULT 0, CHECK ≥ 0 |
| `rows_duplicated` | `integer` | NOT NULL DEFAULT 0, CHECK ≥ 0 |
| `currency_mode` | `text` | NOT NULL DEFAULT `'single'`, CHECK ∈ `single\|separated` |
| `primary_currency` | `char(3)` | NULL (requis si `currency_mode = single`) |
| `error_summary` | `jsonb` | NULL |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |
| `committed_at` | `timestamptz` | NULL |

Indexes : `(user_id, created_at DESC)`.

#### `billing_records`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `import_id` | `uuid` | NOT NULL, FK → `billing_imports(id)` ON DELETE CASCADE |
| `billing_date` | `date` | NOT NULL |
| `provider` | `text` | NOT NULL |
| `service` | `text` | NOT NULL |
| `region` | `text` | NOT NULL |
| `resource_id` | `text` | NOT NULL |
| `usage_quantity` | `numeric(24,8)` | NOT NULL |
| `usage_unit` | `text` | NOT NULL |
| `cost` | `numeric(18,6)` | NOT NULL — négatif autorisé (crédits) |
| `currency` | `char(3)` | NOT NULL |
| `environment` | `text` | NOT NULL |
| `dedupe_key` | `text` | NOT NULL |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

**Stratégie anti-doublons (décision §6.5) :**

- `dedupe_key` = hash SHA-256 (hex) de la concaténation normalisée :
  `user_id | billing_date | provider | service | region | resource_id | usage_quantity | usage_unit | cost | currency | environment`
- Contrainte : `UNIQUE (user_id, dedupe_key)`
- À l’import : `INSERT … ON CONFLICT DO NOTHING` ; compter les lignes ignorées dans `rows_duplicated`
- Même fichier réimporté → 0 nouvelles lignes (idempotent) ; lignes réellement nouvelles (autre jour/coût) → acceptées

Indexes :

- `(user_id, billing_date)`
- `(user_id, service, billing_date)`
- `(user_id, region, billing_date)`
- `(user_id, environment, billing_date)`
- `(user_id, currency, billing_date)`
- `(import_id)`
- UNIQUE `(user_id, dedupe_key)`

#### `budgets`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `name` | `text` | NOT NULL |
| `amount` | `numeric(18,6)` | NOT NULL, CHECK > 0 |
| `currency` | `char(3)` | NOT NULL |
| `period_start` | `date` | NOT NULL |
| `period_end` | `date` | NOT NULL, CHECK `period_end >= period_start` |
| `scope_type` | `text` | NOT NULL, CHECK ∈ `global\|service\|environment\|provider` |
| `scope_value` | `text` | NULL — requis si `scope_type ≠ global` |
| `warning_threshold` | `numeric(5,2)` | NOT NULL DEFAULT 80, CHECK entre 0 et 100 |
| `critical_threshold` | `numeric(5,2)` | NOT NULL DEFAULT 100, CHECK ≥ `warning_threshold` |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

Index : `(user_id, period_start, period_end)`.

#### `alerts`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `type` | `text` | NOT NULL — ex. `budget_warning`, `budget_critical`, `daily_spike`, `service_surge`, `insufficient_data` |
| `severity` | `text` | NOT NULL, CHECK ∈ `info\|warning\|critical` |
| `title` | `text` | NOT NULL |
| `description` | `text` | NOT NULL |
| `status` | `text` | NOT NULL DEFAULT `'open'`, CHECK ∈ `open\|acknowledged\|resolved` |
| `trigger_data` | `jsonb` | NOT NULL DEFAULT `'{}'` |
| `recommended_action` | `text` | NULL |
| `related_budget_id` | `uuid` | NULL, FK → `budgets(id)` ON DELETE SET NULL |
| `import_id` | `uuid` | NULL, FK → `billing_imports(id)` ON DELETE SET NULL |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |
| `resolved_at` | `timestamptz` | NULL |

Indexes : `(user_id, status, created_at DESC)`, `(user_id, severity)`.

#### `recommendations`

| Colonne | Type | Contraintes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | NOT NULL, FK → `profiles(id)` ON DELETE CASCADE |
| `category` | `text` | NOT NULL — ex. `concentration`, `growth`, `budget_risk`, `environment_skew` |
| `title` | `text` | NOT NULL |
| `description` | `text` | NOT NULL |
| `evidence` | `jsonb` | NOT NULL |
| `proposed_action` | `text` | NOT NULL |
| `estimated_savings` | `numeric(18,6)` | NULL — uniquement si défendable |
| `estimated_savings_currency` | `char(3)` | NULL |
| `limitations` | `text` | NOT NULL |
| `status` | `text` | NOT NULL DEFAULT `'active'`, CHECK ∈ `active\|dismissed\|completed` |
| `import_id` | `uuid` | NULL, FK → `billing_imports(id)` ON DELETE SET NULL |
| `created_at` | `timestamptz` | NOT NULL DEFAULT `now()` |

Index : `(user_id, status, created_at DESC)`.

### 3.2. Types TypeScript (domaine)

Alignés sur SQL (pas de `number` pour l’argent dans les couches persistées/API : préférer `string` décimal sérialisé ou un type `Money` `{ amount: string; currency: string }` pour éviter les erreurs IEEE-754).

```ts
type CurrencyCode = string; // ISO 4217, validé Zod length 3
type Money = { amount: string; currency: CurrencyCode };

type BillingImportStatus = "pending" | "previewed" | "committed" | "failed";
type AlertSeverity = "info" | "warning" | "critical";
type ForecastConfidence = "none" | "low" | "medium"; // never "high" in MVP formula
```

### 3.3. RLS (Row Level Security)

Activer RLS sur **toutes** les tables applicatives. Politique de base :

```sql
-- Exemple générique (répété par table)
CREATE POLICY "users_own_rows_select" ON billing_records
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "users_own_rows_insert" ON billing_records
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_rows_update" ON billing_records
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_own_rows_delete" ON billing_records
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
```

Règles spécifiques :

- `profiles` : SELECT/UPDATE du propre `id` uniquement ; pas d’INSERT client (trigger Auth)
- Aucune policy pour le rôle `anon` sur les tables financières
- Pas de policy « service role bypass » custom : le service role **ignore** RLS par design Supabase — donc usage strictement limité

### 3.4. Client vs service-role vs auth boundary

| Client | Clé | Où | RLS | Usage autorisé |
|---|---|---|---|---|
| Browser Supabase client | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client components / browser | Oui | Auth UI, lectures/écritures user-scoped via session |
| Server Supabase client | Anon key + cookies session | Server Components, Route Handlers, Server Actions | Oui | Même périmètre, côté serveur |
| Service role | `SUPABASE_SERVICE_ROLE_KEY` | **Uniquement** modules serveur isolés (`lib/supabase/admin.ts`) | Non (bypass) | Triggers admin, maintenance, seed — **jamais** exposé au frontend ni importé dans des modules partagés client |

**Frontière d’auth :**

1. Middleware Next.js : protéger `/dashboard`, `/imports`, `/analysis`, `/budgets`, `/alerts`, `/recommendations`, `/reports` et `/api/*` (sauf `/api/health`).
2. Chaque Route Handler : vérifier `supabase.auth.getUser()` ; refuser 401 sinon.
3. Toutes les requêtes DB passent par le client **session-bound** (RLS) pour les opérations utilisateur.
4. Validation Zod **côté serveur** sur chaque body/query (défense en profondeur, CDC §7.1).
5. Aucune opération Cloud destructive ; aucune credential provider Cloud dans le MVP.

---

## 4. Phases d’implémentation & dépendances

### Correspondance avec le CDC §8

| Phase CDC | Contenu CDC | Mapping proposition | Bloque |
|---|---|---|---|
| 1 | Init + architecture | **Milestone 1** (ce document → scaffold) | Tout le reste |
| 2 | UI + dashboard | M2 — shell UI + dashboard **demo mode** | Visualisations M4 |
| 3 | DB + auth | M2/M3 — migrations + Auth Supabase | Imports persistés |
| 4 | Import CSV | M3 | Analyse réelle |
| 5 | Analyse + charts | M4 | Budgets/alertes basés sur agrégats |
| 6 | Budgets, alertes, prévisions | M5 | Recommandations budget-aware |
| 7 | Recommandations + export | M6 | Recette complète |
| 8 | Tests, sécurité | Continu dès M1 ; intensifié M7 | Déploiement |
| 9 | Déploiement + docs | M8 | — |

### Jalons proposés

```text
M1 (Scaffold) ──► M2 (UI + Auth + Schema)
                      │
                      ├─► M3 (Import CSV + historique)
                      │       │
                      │       └─► M4 (Analyse + Recharts)
                      │               │
                      │               └─► M5 (Budgets + Alertes + Forecast)
                      │                       │
                      │                       └─► M6 (Recommendations + Export)
                      │                               │
                      └───────────────────────────────┴─► M7 (Hardening + CI gates)
                                                              │
                                                              └─► M8 (Deploy Vercel/Supabase)
```

### Milestone 1 — définition claire

**Objectif :** rendre le repo **clônable, typé, testable et documenté**, avec une app Next.js qui démarre en mode demo, **sans** livrer encore les fonctionnalités métier FinOps.

**Inclut :**

- Scaffold Next.js App Router + TypeScript + Tailwind
- Config Vitest + Playwright + GitHub Actions (lint, `tsc`, unit smoke)
- Structure de dossiers feature-oriented (§2)
- README + `.env.example` + `docs/architecture.md` (copie de cette proposition)
- Mode `DEMO_MODE=true` : page landing + shell app minimal (navigation) alimenté par fixtures mémoire
- Stub optionnel : fichiers `supabase/migrations/*.sql` **écrits mais non appliqués obligatoirement** en local M1
- Stub auth : pages login/signup UI (formulaires) ; branchement Supabase réel reporté à M2 si demo-first

**Exclut (volontairement) :**

- Import CSV réel, agrégations, budgets, alertes, prévisions, recommandations, PDF
- Connexion obligatoire à Supabase pour lancer l’UI
- Déploiement production
- Toute intégration API cloud provider

Les milestones M2–M8 livrent le MVP CDC §3.1 (F01–F12) jusqu’à la recette §9.

---

## 5. Variables d’environnement & commandes de setup

### 5.1. Variables

| Variable | Public / Secret | Requis | Description |
|---|---|---|---|
| `NEXT_PUBLIC_APP_URL` | Public | Oui | URL de base (ex. `http://127.0.0.1:43123`) |
| `NEXT_PUBLIC_DEMO_MODE` | Public | Oui | `true` \| `false` — UI sans Supabase |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Si demo=false | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Si demo=false | Clé anon (RLS) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Secret** | Serveur only | Jamais `NEXT_PUBLIC_*` |
| `CSV_MAX_BYTES` | Secret/server | Oui (défaut) | Limite taille upload (défaut `5242880` = 5 Mo) |
| `CSV_MAX_ROWS` | Secret/server | Oui (défaut) | Limite lignes (défaut `50000`) |

Règles :

- Seules les variables `NEXT_PUBLIC_*` sont embarquées côté client.
- `SUPABASE_SERVICE_ROLE_KEY` validée au boot serveur via Zod dans `lib/env.ts` ; absente en demo mode.
- `.env.local` gitignored ; `.env.example` versionné sans valeurs secrètes.

### 5.2. Options Supabase respectant les contraintes locales

| Option | Description | Recommandation |
|---|---|---|
| **A. Demo mode (défaut M1–M2 UI)** | Aucun backend distant ; fixtures in-memory | **Par défaut pour le développement Cursor local** |
| **B. Supabase free-tier cloud** | Projet gratuit distant ; migrations via SQL Editor ou CLI `db push` | Pour Auth + RLS réels dès M2/M3 |
| **C. Supabase CLI local** | `supabase start` (Docker) | **Non retenu** pour le flux principal : contrainte « pas de Docker » |

Décision : **A + B**. Le développement quotidien peut rester en demo ; l’intégration Auth/RLS utilise un projet Supabase free-tier (pas de VM/Docker local).

### 5.3. Commandes (après approbation / scaffold)

```bash
# Install
corepack enable && pnpm install   # ou: npm install

# Env
cp .env.example .env.local
# Éditer NEXT_PUBLIC_DEMO_MODE=true pour démarrer sans Supabase

# Dev (port non standard)
pnpm dev -- --port 43123 -H 127.0.0.1

# Qualité
pnpm lint
pnpm typecheck
pnpm test           # Vitest
pnpm test:e2e       # Playwright

# Migrations (option B, quand configuré)
pnpm supabase db push   # ou coller SQL dans le SQL Editor du dashboard
```

CI GitHub Actions : sur PR/push — `lint` → `typecheck` → `vitest` → `playwright` (projet demo mode, sans secrets cloud obligatoires).

---

## 6. Risques, décisions techniques & hypothèses

### 6.1. Décisions tranchées

| Sujet | Décision | Justification |
|---|---|---|
| Composants UI | **shadcn/ui** (+ Radix) | Primitives accessibles, Tailwind-native, ownership du code ; évite une lib opaque. Conforme aux defaults projet Cursor. |
| Mode sans Supabase | **`DEMO_MODE`** avec store mémoire + CSV samples | Respecte la contrainte locale ; débloque UI/charts avant Auth. |
| Gestion monétaire | `NUMERIC(18,6)` en DB ; `string` décimal en transit API ; totaux **par devise** | CDC §4.4 : pas d’addition cross-currency. MVP = une devise primaire par import **ou** totaux séparés. Pas de taux de change. |
| Devise par défaut | CAD | Aligné exemples CDC |
| Limite CSV | **5 Mo** et **50 000 lignes** | Protection DoS / mémoire Node ; message d’erreur clair + suggestion de découpage |
| Parsing CSV | Papa Parse **côté serveur** (Route Handler) | Ne jamais faire confiance au seul parse client ; preview peut pré-valider côté client pour UX |
| PDF | **`@react-pdf/renderer`** | Génération déclarative React, pas de binaire natif, compatible Route Handler Node ; alternative écartée : Puppeteer (lourd, proche « navigateur headless » / ops) |
| Dedupe key | Hash SHA-256 des champs métier normalisés + `UNIQUE(user_id, dedupe_key)` | Idempotence d’import ; documenté ; gère crédits négatifs comme lignes distinctes si `cost` diffère |
| Prévision | Formule CDC §4.7 | Confiance : `none` si &lt; 3 jours de données dans le mois ; `low` si 3–9 jours ; `medium` si ≥ 10 jours. **Jamais « high »** avec cette formule linéaire. |
| Variation % | Formule CDC ; si précédent = 0 → afficher `n/a` / « non comparable » | Évite division par zéro |
| Package manager | **pnpm** | Lockfile déterministe, disque efficace ; acceptable de basculer npm si l’équipe préfère |
| Auth providers M2 | Email/password Supabase uniquement | OAuth (GitHub/Google) = post-MVP |
| Alertes | Calcul synchrone à l’import + refresh dashboard | Pas de worker/cron en MVP (CDC §4.6) |
| Cloud ops | **Lecture seule / aucune** | Interdit delete/stop/resize de ressources ; reco consultatives seulement |

### 6.2. Risques

| Risque | Impact | Mitigation |
|---|---|---|
| Free-tier Supabase indisponible / rate-limit | Blocage Auth | Demo mode + retry ; documenter fallback |
| Gros CSV / parse synchrone | Timeout Vercel / OOM | Limites bytes/rows ; streaming parse ; pagination DB |
| fausse confiance dans le forecast | Mauvaise décision FinOps | Labels de confiance + texte de limites toujours visibles |
| Fuite service role | Compromission totale DB | Lint/architecture : `admin.ts` jamais dans barrel client ; revue CI grep |
| Doublons « légitimes » (même resource, même jour, deux lignes distinctes usage) | Perte de données si clé trop agressive | Inclure `usage_quantity`, `usage_unit`, `cost` dans la clé ; documenter ; tests sur crédits |
| PDF non pixel-perfect | Rapport « moche » | Template simple, focus contenu CDC §4.9 |
| Scope creep advanced CDC §3.2 | Retard MVP | Gate d’approbation : MVP only jusqu’à recette §9 |

### 6.3. Hypothèses

1. Un utilisateur = un espace de données (pas de multi-tenant org/team en MVP).
2. Les CSV sont déjà au format normalisé CDC §4.2 (pas de mapping AWS CUR natif en MVP).
3. Les coûts négatifs sont des crédits/ajustements valides.
4. Le déploiement cible est Vercel + Supabase free/hobby, dans les limites des offres.
5. English is the UI language; technical IDs remain English.

---

## 7. Critères d’acceptation — Milestone 1

Checklist **testable**. M1 est accepté lorsque **tous** les points « Inclus » sont verts.

### Inclus

- [ ] Repo contient une app Next.js App Router TypeScript démarrant avec `pnpm dev` (ou `npm run dev`) sur un port documenté (ex. `43123`)
- [ ] Tailwind configuré ; page landing + shell de navigation app visibles
- [ ] `DEMO_MODE=true` permet d’ouvrir l’UI **sans** credentials Supabase
- [ ] Structure `src/features`, `src/app/api`, `supabase/migrations` (stubs SQL acceptables), `data/samples` présente
- [ ] `.env.example` liste toutes les variables §5.1 avec commentaires public/secret
- [ ] README : prérequis, install, run, test, explication demo vs Supabase, limites « no destructive cloud ops »
- [ ] `docs/architecture.md` dans le repo (contenu aligné sur cette proposition)
- [ ] Vitest : au moins 1 test smoke qui passe en CI
- [ ] Playwright : au moins 1 test e2e smoke (landing ou shell) qui passe localement
- [ ] GitHub Actions `ci.yml` exécute lint + typecheck + vitest
- [ ] Aucun secret réel commité ; aucun `SUPABASE_SERVICE_ROLE_KEY` préfixé `NEXT_PUBLIC_`
- [ ] Aucune feature métier F03–F11 implémentée (hors placeholders UI vides)

### Exclus explicitement de M1

- Auth Supabase fonctionnelle (F01) — **M2**
- Schema appliqué + RLS vérifiée — **M2**
- Import CSV (F03–F04) — **M3**
- Dashboard data-bound (F02/F05/F06) — **M2/M4**
- Budgets, alertes, forecast, reco, export (F07–F11) — **M5–M6**
- Déploiement Vercel — **M8**

### Definition of Done M1

> Un développeur clone le repo, copie `.env.example` → `.env.local` avec `NEXT_PUBLIC_DEMO_MODE=true`, lance l’app, voit le shell Cloud Cost Optimizer, et la CI verte valide lint/types/tests unitaires — **sans** compte Cloud ni Docker.

---

## Gate d’approbation (obligatoire avant toute implémentation)

Merci de confirmer explicitement les points suivants avant le démarrage du scaffold (M1) :

1. **Périmètre M1** — Accord sur le scope Inclus/Exclus §7 (scaffold + tooling + docs + demo shell ; pas de FinOps métier).
2. **shadcn/ui** — Validation de l’usage de shadcn/ui pour les primitives (sinon : alternative à préciser).
3. **Demo mode** — Validation de `NEXT_PUBLIC_DEMO_MODE` comme chemin par défaut local (sans Docker / sans obligation Supabase immédiate).
4. **Supabase** — Confirmation option **B** (projet free-tier distant) pour Auth/RLS dès M2 ; CLI Docker locale non retenue.
5. **Dedupe** — Accord sur la clé `SHA-256(champs métier normalisés)` + `UNIQUE(user_id, dedupe_key)` et comportement `ON CONFLICT DO NOTHING`.
6. **Monnaie** — Pas de conversion FX en MVP ; totaux séparés par devise ; CAD par défaut.
7. **Limites CSV** — 5 Mo / 50 000 lignes acceptables (sinon valeurs cibles).
8. **PDF** — `@react-pdf/renderer` accepté pour F11.
9. **Forecast confidence** — Règles `none` / `low` / `medium` (§6.1) acceptées ; jamais `high` en MVP.
10. **Package manager** — pnpm OK (sinon npm).
11. **UI language** — English by default (**approved**).
12. **No cloud write** — Product never offers destructive / mutative cloud infrastructure actions.

**Status:** ✅ Approved (2026-10-14) — points 1–12 validated; UI English.  
**Next action:** Implement M1 per §7 — do not start M2+.
