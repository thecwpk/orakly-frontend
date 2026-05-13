# Orakly Frontend

Next.js app (`apps/web`) and shared UI/config packages.

## Layout with backend (required for `npm install`)

Clone **next to** the backend repo so paths resolve:

```
your-projects/
  orakly-backend/    ← database, jobs, crypto-integrations
  orakly-frontend/   ← this repo
```

`apps/web` links `@orakly/database`, `@orakly/jobs`, and `@orakly/crypto-integrations` via `file:../../../orakly-backend/packages/...`.

### Alternative layouts

- **Monorepo again:** merge both folders under one root with npm workspaces.
- **Private npm:** publish `@orakly/database` etc. from `orakly-backend` and replace `file:` deps with semver versions.
- **Git subtree:** vendor `orakly-backend/packages/*` under `packages/` here (more maintenance).

## Setup

```bash
cd orakly-frontend
npm install
npm run dev --workspace=web
```

Prisma: generate client using backend package (after install):

```bash
npm run db:generate --prefix ../orakly-backend/packages/database
```

Or from backend root: `npm run db:generate`.

`.env` for Postgres can live at `../orakly-backend/packages/database/.env`; Next.js also reads that path when present.
