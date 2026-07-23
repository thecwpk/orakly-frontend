import { config } from "dotenv";
import { resolve } from "node:path";
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  const { runNarrativeUpdatePipeline } = await import("@orakly/jobs");
  const result = await runNarrativeUpdatePipeline();
  console.log(result);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
