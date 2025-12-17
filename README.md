# Gaming Bank

Minutes-first ledger for trading focus into gaming time with decay, habits, and weekly penalties. Built with Next.js (App Router), SQLite, and Vitest.

## Quick start

```bash
npm install
npm run migrate   # create SQLite schema at data/gaming-bank.sqlite
npm run dev       # open http://localhost:3000
```

- First visit `/login` to set the passcode. A long-lived cookie keeps you signed in locally.
- Timezone is auto-detected after login; override in Settings. Weekly cutoff is Sunday 23:59:59 local.
- DB + migrations are local only. No external services.

## Scripts
- `npm run dev` – Next.js dev server.
- `npm run migrate` – run bundled migrations.
- `npm run test` – Vitest domain tests.
- `npm run lint` – Next.js lint.

## Project layout
- `app/` – App Router pages + API route handlers (Node runtime).
- `domain/` – Pure rules: rates, decay, habits, time windows, defaults.
- `data/` – SQLite connection, migrations, repositories.
- `services/` – Orchestration: auth, maintenance (decay/weekly cutoff), blocks, habits, dashboard, settings.
- `scripts/` – migration runner entrypoint.
- `tests/` – Vitest domain coverage.

## Feature notes
- Ledger-first: balance derives from `ledger_entries` (no direct balance field).
- Time blocks: FOCUS earns (debt-first at additive interest), GAME spends 1:1, HABIT/MILESTONE/OTHER track only. Editing/deleting posts ADJUSTMENT entries.
- Anti-hoarding: soft cap decay + hard cap earning pause.
- Habits: weekly vesting capped at % of focus-earned gaming minutes; excess recorded.
- Weekly cutoff: habit vest + penalty record if debt > 0; penalty marked settled manually.
- Lazy catch-up: decay and weekly processing run on demand per request with idempotent markers.

## Testing
Domain rules are covered in `tests/domain.test.ts`. Add service/database tests with `vitest` using `tsconfig.vitest.json` if you expand coverage.

## Data safety
SQLite file lives in `data/gaming-bank.sqlite` (ignored by git). No external backups are created automatically.
