
export interface ElectionResult {
  party: string;
  percentage: number;
  leader: string;
  color: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface MockPost {
  platform: 'facebook' | 'youtube';
  username: string;
  content: string;
  sentiment: 'pro-al' | 'pro-bnp' | 'pro-jam' | 'neutral';
  timestamp: string;
}

export interface UserFeedback {
  id: string;
  postId: string;
  type: 'positive' | 'negative';
  timestamp: string;
}

export interface PredictionData {
  predictions: ElectionResult[];
  analysis: string;
  likelyPrimeMinister: string;
  sources: GroundingSource[];
  sentimentFeed: MockPost[];
  timestamp: string;
}

export enum PartyColor {
  AL = "#006a4e",    // Green
  BNP = "#ffcd00",   // Yellow/Gold
  JP = "#ff0000",    // Red
  JAM = "#0d9488",   // Teal (Jamaat-e-Islami)
  OTH = "#64748b"    // Gray
}
