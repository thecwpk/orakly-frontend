export type CreatorProfileMarket = {
  id: string;
  question: string;
  status: string;
  volume: number;
  feesEarned: number;
  creatorRewardPercent: number;
  createdAt: string;
};

export type CreatorProfileStats = {
  address: string;
  isCreator: boolean;
  approvedMarkets: number;
  pendingMarkets: number;
  totalVolumeGenerated: number;
  totalFeesEarned: number;
  creatorRank: number | null;
  markets: CreatorProfileMarket[];
};
