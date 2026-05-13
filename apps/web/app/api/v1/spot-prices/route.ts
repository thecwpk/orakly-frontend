import { NextResponse } from "next/server";

/** CoinGecko public tier — server-side only (no browser key exposure). */
export const revalidate = 30;

type SpotBody = {
  btc: { usd: number | null; chg24hPct: number | null };
  eth: { usd: number | null; chg24hPct: number | null };
};

export async function GET(): Promise<NextResponse<SpotBody>> {
  try {
    const url =
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true";
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      return NextResponse.json(
        {
          btc: { usd: null, chg24hPct: null },
          eth: { usd: null, chg24hPct: null },
        },
        { status: 200 },
      );
    }
    const raw = (await res.json()) as Record<
      string,
      { usd?: number; usd_24h_change?: number }
    >;
    const btc = raw.bitcoin;
    const eth = raw.ethereum;
    return NextResponse.json({
      btc: {
        usd: typeof btc?.usd === "number" ? btc.usd : null,
        chg24hPct:
          typeof btc?.usd_24h_change === "number" ? btc.usd_24h_change : null,
      },
      eth: {
        usd: typeof eth?.usd === "number" ? eth.usd : null,
        chg24hPct:
          typeof eth?.usd_24h_change === "number" ? eth.usd_24h_change : null,
      },
    });
  } catch {
    return NextResponse.json(
      {
        btc: { usd: null, chg24hPct: null },
        eth: { usd: null, chg24hPct: null },
      },
      { status: 200 },
    );
  }
}
