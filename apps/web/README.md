This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Railway worker + shared Postgres

If your **worker** runs on Railway but the **database** is the same Postgres URL you use on Vercel (`DATABASE_URL`), Prisma migrations still target that database. Run `prisma migrate deploy` from any environment that has that URL (local CI, one-off command, or your Railway release step).

**Odds snapshots for 24h movers** are implemented as a **Next.js route** on Vercel: `GET /api/internal/cron/sample-market-odds-snapshots`. This repo schedules it via **`vercel.json` → `crons`** (hourly). Set **`CRON_SECRET`** on the Vercel project; Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when that variable exists.

If you prefer **not** to use Vercel Cron, configure Railway (e.g. Cron or a worker timer) to `curl` your deployed app instead:

`curl -fsS -H "Authorization: Bearer $CRON_SECRET" "$INTERNAL_APP_URL/api/internal/cron/sample-market-odds-snapshots"`

Use the same `CRON_SECRET` and `INTERNAL_APP_URL` values you already keep on the Railway worker.
