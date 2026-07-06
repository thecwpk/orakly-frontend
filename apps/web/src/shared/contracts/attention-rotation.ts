export type AttentionRotationFlow = {
  from: string;
  fromName: string;
  to: string;
  toName: string;
  magnitude: number;
  fromScore: number;
  toScore: number;
};

export type AttentionRotationRank = {
  slug: string;
  name: string;
  delta: number;
  score: number;
};

export type AttentionRotationPayload = {
  flows: AttentionRotationFlow[];
  gainers: AttentionRotationRank[];
  losers: AttentionRotationRank[];
};
