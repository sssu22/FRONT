import { Experience, EmotionType, Comment } from '../types';

interface ServerPost {
  id: number;
  title?: string;
  experienceDate?: string;
  date?: string;
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
  comments?: any[]; // 서버 댓글 타입이 다르므로 any로 받고 아래에서 변환
  liked?: boolean;
  scrapped?: boolean;
  isScrapped?: boolean;
  userScrapped?: boolean;
  gu?: string;
  locationDetail?: string;
}


const normalizeComment = (comment: any): Comment => {
  return {
    id: comment.id || comment.commentId, // id와 commentId 모두 처리
    content: comment.content || '',
    createdAt: comment.createdAt || comment.createAt || comment.time || new Date().toISOString(), // createdAt, createAt, time 모두 처리
    likeCount: comment.likeCount || 0,
    liked: comment.liked ?? false,
    username: comment.userName || comment.authorName || '사용자', // userName과 authorName 모두 처리
    userId: comment.userId,
    imageUrl: comment.imageUrl || comment.authorProfileImageUrl, // imageUrl과 authorProfileImageUrl 모두 처리
  };
};

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
    // 여기서 댓글 정규화 함수를 사용
    comments: (post.comments || []).map(normalizeComment),
    // 좋아요/스크랩 상태 필드를 하나로 통일
    liked: post.liked ?? false,
    scrapped: post.scrapped ?? false,
  };
};

export const dataTransformers = {
  serverToApp,
};
