import { NextResponse } from "next/server";
import { chainPublicEnv } from "@/lib/chain-public-env";
import { getPlatformConfigMap } from "@/server/admin/platform-config.service";
import { ok } from "../../_lib/response";

/** GET /api/v1/chain/config — public chain addresses (platform override wins). */
export async function GET() {
  let overrideFactory = "";
  let overrideBlock = "";
  try {
    const map = await getPlatformConfigMap();
    overrideFactory = map.chain_factory_address?.trim() ?? "";
    overrideBlock = map.chain_factory_deploy_block?.trim() ?? "";
  } catch {
    /* DB optional for public config */
  }

  return NextResponse.json(
    ok({
      factoryAddress: overrideFactory || chainPublicEnv.factoryAddress,
      factoryDeployBlock: overrideBlock || chainPublicEnv.factoryDeployBlock,
      collateralAddress: chainPublicEnv.collateralAddress,
      treasuryAddress: chainPublicEnv.treasuryAddress,
      umaOptimisticOracleV3: chainPublicEnv.umaOptimisticOracleV3,
      collateralDecimals: chainPublicEnv.collateralDecimals,
      chainId: 97,
    }),
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      },
    },
  );
}
