/**
 * Machine-readable app summary for AI reviewers and crawlers.
 * Spec: https://llmstxt.org/ (lightweight variant at /llms.txt)
 */
export function GET() {
  const base = (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "https://orakly-frontend-web.vercel.app"
  ).replace(/\/$/, "");

  const body = `# Orakly Market

> On-chain prediction market terminal (BSC testnet). Public demo — no login required to browse.

Canonical URL: ${base}

## Review this app

- Hub: ${base}/dapp
- Markets explorer: ${base}/markets
- Activity tape: ${base}/activity
- Analytics charts: ${base}/analytics
- Narrative Wars: ${base}/narrative-wars
- Leaderboard: ${base}/leaderboard
- Attention dashboard: ${base}/attention

## Public API (JSON)

- Health: ${base}/api/v1/health
- Markets feed: ${base}/api/v1/markets?scope=hub&lane=list&filter=trending&take=8
- Activity feed: ${base}/api/v1/activity/feed?take=20
- Analytics history: ${base}/api/v1/analytics/history?narrative=all

## Trading

Wallet connect (MetaMask) + SIWE session required only to place on-chain trades.
Browse, charts, and market discovery work without authentication.

## Stack

Next.js 15, React 19, Prisma + Neon Postgres, Vercel serverless, BSC testnet contracts.

## Contact / repo

Frontend: https://github.com/thecwpk/orakly-frontend
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
