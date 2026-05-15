import { randomBytes } from "node:crypto";

const secret = (bytes = 32) => randomBytes(bytes).toString("base64url");

console.log("# Add to .env.local / Vercel (Production)\n");
console.log(`WALLET_SESSION_SECRET=${secret()}`);
console.log(`CRON_SECRET=${secret()}`);
console.log(`ADMIN_SESSION_SECRET=${secret()}`);
console.log(`ADMIN_API_TOKEN=${secret(24)}`);
console.log(`VERCEL_REVALIDATE_SECRET=${secret()}`);
console.log(`REALTIME_INGEST_SECRET=${secret(24)}`);
