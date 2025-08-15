// utils/dataTransformers.ts
import { Experience, EmotionType, Comment } from '../types';

// 서버에서 오는 데이터는 필드가 다를 수 있으므로, 모두 옵셔널(?)로 선언해 안전하게 만듭니다.
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

// '만능 번역' 함수: summary가 있든 description이 있든 알아서 처리합니다.
const serverToApp = (post: ServerPost): Experience => {
  return {
    id: post.id,
    title: post.title || "제목 없음",
    date: post.experienceDate || new Date().toISOString(),
    location: post.location || "알 수 없는 위치",
    // ✨ 핵심: description이 있으면 그걸 쓰고, 없으면 summary를 쓴다. 둘 다 없으면 빈 문자열.
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
    //gu: post.gu,
  };
};

export const dataTransformers = {
  serverToApp,
};