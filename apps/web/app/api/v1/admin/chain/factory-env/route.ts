import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import {
  AdminAuthError,
  requireAdminPermission,
} from "@/server/admin/admin-session";
import { upsertPlatformConfigs } from "@/server/admin/platform-config.service";

const bodySchema = z.object({
  factoryAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid factory address"),
  factoryDeployBlock: z.string().regex(/^\d+$/).optional(),
});

/**
 * POST /api/v1/admin/chain/factory-env
 * Persists upgraded factory address to PlatformConfig and, in local dev, patches .env.local.
 */
export async function POST(req: NextRequest) {
  try {
    const ctx = await requireAdminPermission(req, "markets.write");
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.message },
        { status: 400 },
      );
    }

    const { factoryAddress, factoryDeployBlock } = parsed.data;
    const entries = [
      { key: "chain_factory_address", value: factoryAddress },
      ...(factoryDeployBlock
        ? [{ key: "chain_factory_deploy_block", value: factoryDeployBlock }]
        : []),
    ];
    await upsertPlatformConfigs(entries, ctx.userId);

    let envPatched = false;
    if (process.env.NODE_ENV !== "production" || process.env.VERCEL !== "1") {
      try {
        const envPath = path.join(process.cwd(), ".env.local");
        let text = "";
        try {
          text = await readFile(envPath, "utf8");
        } catch {
          text = "";
        }
        const upsert = (key: string, value: string) => {
          const line = `${key}="${value}"`;
          const re = new RegExp(`^${key}=.*$`, "m");
          if (re.test(text)) text = text.replace(re, line);
          else text = `${text.trimEnd()}\n${line}\n`;
        };
        upsert("NEXT_PUBLIC_FACTORY_ADDRESS", factoryAddress);
        if (factoryDeployBlock) {
          upsert("NEXT_PUBLIC_FACTORY_DEPLOY_BLOCK", factoryDeployBlock);
        }
        await writeFile(envPath, text, "utf8");
        envPatched = true;
      } catch {
        envPatched = false;
      }
    }

    return NextResponse.json({
      ok: true,
      factoryAddress,
      factoryDeployBlock: factoryDeployBlock ?? null,
      envPatched,
    });
  } catch (e) {
    if (e instanceof AdminAuthError) {
      return NextResponse.json({ error: e.message }, { status: e.httpStatus });
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
