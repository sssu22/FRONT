// types.ts

export const emotionLabels = {
  joy: "기쁨", excitement: "흥분", nostalgia: "향수", surprise: "놀람", love: "사랑",
  regret: "아쉬움", sadness: "슬픔", irritation: "짜증", anger: "화남", embarrassment: "당황",
} as const;
export type EmotionType = keyof typeof emotionLabels;

export interface Comment {
  id: number;
  username?: string;
  time?: string;
  createdAt?: string;
  createAt? : string;
  timestamp?: string;
  content: string;
  likeCount: number;
  imageUrl?: string;
  liked: boolean;
  userId?: string;
  authorProfileImageUrl? : string;
  name?: string;
  authorName?: string;
  commentId?: number;
  _id?: number;
}

export interface NewsItem {
  title: string;
  link: string;
}

export interface Trend {
  id: number;
  title: string;
  description: string;
  category: string;
  name?: string;
  score?: number;
  increaseScore?: number;
  previousScore?: number;
  likeCount?: number;
  postCount?: number;
  snsMentions?: number;
  youtubeTopView?: number;
  viewCount?: number;
  scrapped?: boolean;
  peakPeriod?: string;
  tags?: string | string[];
  liked?: boolean;
  comments?: Comment[];
  similarTrends?: {
    trendId: number;
    title: string;
    score: number;
  }[];
  recommendedNews? : NewsItem[];
  isLiked?: boolean;
  userLiked?: boolean;
  isScrapped?: boolean;
  userScrapped?: boolean;
  popularity?: number;
  createdAt?: string;
  prediction?: {
    direction: "up" | "down" | "stable";
    confidence: number;
    nextMonthGrowth: number;
  };
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
  district? : string;
  experienceDate? : string;
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
}

export interface SearchResult {
  id: number;
  title: string;
  type: "experience" | "trend";
}
export interface User {
  id: string;
  name: string;
  email: string;
  profileImageUrl?: string;
  birth?: string;
  address?: string;
  stateMessage?: string;
  locationTracing?: boolean;
}