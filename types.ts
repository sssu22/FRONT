// types.ts
export const emotionLabels = {
  joy: "기쁨", excitement: "흥분", nostalgia: "향수", surprise: "놀람", love: "사랑",
  regret: "아쉬움", sadness: "슬픔", irritation: "짜증", anger: "화남", embarrassment: "당황",
} as const;
export type EmotionType = keyof typeof emotionLabels;

export interface Comment {
  id: number;
  username: string;
  time: string;
  content: string;
  likeCount: number;
  imageUrl?: string;
  liked: boolean;
  userId?: string;
}

export interface Trend {
  id: number;
  title?: string;
  name?: string;
  description: string;
  category: string;
  popularity?: number;
  createdAt?: string;
  prediction?: {
    direction: "up" | "down" | "stable";
    confidence: number;
    nextMonthGrowth: number;
  };
  score?: number;
}

export interface Experience {
  id: number;
  title: string;
  date: string;
  location: string;
  emotion: EmotionType;
  tags: string[];
  description: string;
  trendScore: number;
  trendId: number;
  trendName?: string;
  latitude?: number;
  longitude?: number;
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  scrapCount?: number;
  comments?: Comment[];
  liked?: boolean;
  scrapped?: boolean;
  gu?: string;
}