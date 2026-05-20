/**
 * Orakly landing copy — rich sections without repeating the same idea three ways.
 */

/** Qualitative proof strip — avoids fixed counts that change as listings grow. */
export const heroProofStats = [
  { label: "Markets", value: "Live" },
  { label: "Liquidity", value: "Deep" },
  { label: "Themes", value: "Broad" },
  { label: "Settlement", value: "On-chain" },
] as const;

export const whyOraklyCells = [
  {
    title: "Live odds, on-chain",
    body: "YES and NO prices update with order flow and settle on-chain. No batch marks.",
  },
  {
    title: "Rules before size",
    body: "Resolution criteria and collateral are visible on every market before you commit capital.",
  },
  {
    title: "Built with the crowd",
    body: "Markets the community proposes, ranks, and earns from. Reputation is on-chain.",
  },
] as const;

export const whyOraklyFeatures = [
  {
    title: "Crypto-native questions",
    detail: "Markets track themes traders already debate on-chain and in feeds.",
  },
  {
    title: "Fast-moving cycles",
    detail: "Short horizons map to contracts built for rotations, not year-long holds.",
  },
  {
    title: "Sentiment in the tape",
    detail: "Odds update as participants trade — not after a manual refresh.",
  },
  {
    title: "Probability discovery",
    detail: "YES / NO prices read as live implied probability while markets are open.",
  },
  {
    title: "Transparent participation",
    detail: "Collateral, resolution, and payout logic stay inspectable.",
  },
] as const;

export const whyOraklyBridgeColumns = [
  {
    title: "What traders get",
    lines: [
      "Readable implied probability before each click.",
      "Direct entry and exit while the market is live.",
      "Rules and settlement surfaced up front.",
    ],
  },
  {
    title: "What the platform optimizes for",
    lines: [
      "Context per market — why it exists, what resolves it.",
      "Stablecoin flow for crypto-native participants.",
      "Infrastructure aimed at verifiable outcomes.",
    ],
  },
] as const;

export const tradeBandMetrics = [
  {
    label: "Probability visibility",
    headline: "Read the tape fast",
    fact: "YES / NO prices summarize crowd conviction at a glance.",
  },
  {
    label: "Execution path",
    headline: "Fewer steps to risk-on",
    fact: "Discovery → quote → trade stays linear in-app.",
  },
  {
    label: "Settlement trust",
    headline: "Verify, do not guess",
    fact: "Resolutions tie to rules you can audit.",
  },
] as const;

export const oraklyFramework = [
  {
    k: "Market context first",
    d: "Framing and pricing appear before you commit size.",
  },
  {
    k: "Execution clarity",
    d: "Short trade flow on purpose — less hesitation at entry.",
  },
  {
    k: "Transparent resolution",
    d: "Outcomes follow published criteria with on-chain finality.",
  },
] as const;

export const howSteps = [
  {
    n: 1,
    title: "Discover",
    body: "Browse live YES/NO markets across crypto, macro, sports, tech, and more.",
    tag: "Browse",
  },
  {
    n: 2,
    title: "Trade",
    body: "Buy YES or NO with stablecoin collateral. Reposition or exit while the market is open.",
    tag: "Sides",
  },
  {
    n: 3,
    title: "Settle",
    body: "Winning positions redeem on-chain through published resolution rules.",
    tag: "Finality",
  },
] as const;

export const trustPillars = [
  {
    title: "On-chain settlement",
    body: "Payouts execute through public contracts. Every settlement is traceable.",
  },
  {
    title: "Transparent resolution",
    body: "Criteria are defined up front. No opaque operator can flip an outcome.",
  },
  {
    title: "Stablecoin collateral",
    body: "Sizes, fees, and payouts denominated in familiar stable units.",
  },
  {
    title: "Open market state",
    body: "Fees, funding, status, and depth are inspectable before you trade.",
  },
] as const;

export const roadmapQuarters = [
  {
    quarter: "Now",
    status: "Shipping",
    items: [
      { title: "Live market catalog", note: "macro, crypto, politics, sports, tech, science" },
      { title: "On-chain settlement", note: "stablecoin collateral, verifiable outcomes" },
    ],
  },
  {
    quarter: "Q3 2026",
    status: "Next",
    items: [
      { title: "Narrative indexes", note: "bundle markets into themes" },
      { title: "Mobile-first PWA", note: "no install, fast trade" },
    ],
  },
  {
    quarter: "Q4 2026",
    status: "Planned",
    items: [
      { title: "Community-listed markets", note: "permissionless creation flow" },
      { title: "Reputation & leaderboards", note: "on-chain accuracy signal" },
    ],
  },
  {
    quarter: "2027",
    status: "Vision",
    items: [
      { title: "Social + copy trading", note: "follow credible flows" },
      { title: "Multi-chain expansion", note: "meet traders where they custody" },
    ],
  },
] as const;

export const faqItems = [
  {
    q: "What is a YES/NO prediction market?",
    a: "A binary contract on a real-world question. YES shares pay out 1 unit if the event resolves true. NO shares pay out 1 unit if it resolves false. The live price reads as the market's implied probability.",
  },
  {
    q: "How does settlement work?",
    a: "Markets settle on-chain with collateral and payouts denominated in stablecoins where applicable, so sizing stays predictable. Supported networks are listed in the app as they go live.",
  },
  {
    q: "How are markets resolved?",
    a: "Every market ships with explicit, published resolution criteria. Outcomes execute through public contracts so payouts stay traceable on-chain.",
  },
  {
    q: "What does it cost to trade?",
    a: "Fee and funding schedules are visible on each market before you size. There is no hidden spread layer above the on-chain quote.",
  },
  {
    q: "Is Orakly available everywhere?",
    a: "Availability varies by jurisdiction and product phase. The app will note any regional restrictions before you sign up or trade.",
  },
  {
    q: "How does the email list work?",
    a: "Leave your email below to receive product and roadmap updates. We use the address only for that purpose — no spam, no resale.",
  },
] as const;

/** @deprecated — kept for imports that still reference vision copy. */
export const visionPoints = whyOraklyCells.map((c) => ({ title: c.title, body: c.body }));
export const visionSpecStrip = [
  { k: "Trade format", v: "YES / NO shares" },
  { k: "Pricing", v: "Continuous, flow-driven" },
  { k: "Settlement", v: "On-chain, verifiable" },
] as const;
export const communityFeatures = [
  { verb: "Create markets", detail: "Propose contracts the community wants to trade." },
  { verb: "Build reputation", detail: "Accuracy and participation feed public performance signals." },
  { verb: "Compete on leaderboards", detail: "Benchmark conviction against other traders." },
  { verb: "Earn on resolution", detail: "Winning positions settle in stablecoin terms." },
] as const;
export const securityItems = trustPillars.map((p) => ({ title: p.title, body: p.body }));
export const futureRoadmap = roadmapQuarters.flatMap((q) =>
  q.items.map((i) => ({
    title: i.title,
    body: i.note,
    phase: (q.status === "Next" ? "Next" : "Later") as "Next" | "Later",
  })),
);
export const earlyAccessBullets = [
  { title: "Product updates", body: "Roadmap and release notes in your inbox." },
  { title: "No noise", body: "We only message when there is something worth your time." },
] as const;
