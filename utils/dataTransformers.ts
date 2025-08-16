import { Experience, EmotionType, Comment } from '../types';

interface ServerPost {
  id: number;
  title?: string;
  experienceDate?: string;
  location?: string;
  summary?: string;
  description?: string;
  emotion?: string;
  trendTitle?: string;
  trendScore?: number;
  trendId?: number;
  tags?: string[];
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  scrapCount?: number;
  comments?: Comment[];
  liked?: boolean;
  scrapped?: boolean;
  gu?: string;
}

const serverToApp = (post: ServerPost): Experience => {
  return {
    id: post.id,
    title: post.title || "제목 없음",
    date: post.experienceDate || new Date().toISOString(),
    location: post.location || "알 수 없는 위치",
    description: post.description || post.summary || "",
    emotion: (post.emotion?.toLowerCase() || "joy") as EmotionType,
    trendName: post.trendTitle,
    trendScore: post.trendScore || 0,
    trendId: post.trendId || 0,
    tags: post.tags || [],
    viewCount: post.viewCount,
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    scrapCount: post.scrapCount,
    comments: post.comments || [],
    liked: post.liked,
    scrapped: post.scrapped,
    district: post.gu,
  };
};

export const dataTransformers = {
  serverToApp,
};