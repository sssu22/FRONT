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
  // 서버에서 다양한 필드명으로 올 수 있는 경우 대비
  name?: string;
  authorName?: string;
  commentId?: number;
  _id?: number;
}

export interface NewsItem {
  title: string;
  link: string;
}

// Trend와 TrendDetail을 하나로 통합한 타입
export interface Trend {
  id: number;
  title: string;
  description: string;
  category: string;
  name?: string;
  score?: number;
  increaseScore?: number;
  // 상세 정보 필드를 모두 선택적(optional)으로 추가
  previousScore?: number;
  likeCount?: number;
  postCount?: number;
  snsMentions?: number;
  youtubeTopView?: number;
  viewCount?: number;
  scrapped?: boolean;
  peakPeriod?: string;
  tags?: string | string[]; // 배열도 지원
  liked?: boolean;
  comments?: Comment[];
  similarTrends?: {
    trendId: number;
    title: string;
    score: number;
  }[];
  recommendedNews? : NewsItem[];
  // 서버에서 다양한 필드명으로 올 수 있는 경우를 대비
  isLiked?: boolean;        // 서버에서 isLiked로 올 수도 있음
  userLiked?: boolean;      // 서버에서 userLiked로 올 수도 있음
  isScrapped?: boolean;     // 서버에서 isScrapped로 올 수도 있음
  userScrapped?: boolean;   // 서버에서 userScrapped로 올 수도 있음

  // 기존 Trend의 다른 속성들
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
  id: string; // 또는 number일 수 있음, API 응답에 따라 조정
  name: string;
  email: string;
  profileImageUrl?: string;
  birth?: string;
  address?: string;
  stateMessage?: string;
  locationTracing?: boolean;
}