// utils/dataTransformers.ts

// ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼ 이 부분을 수정합니다 ▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼▼
// import { Experience, EmotionType } from "../App"; // 기존 코드
import { Experience } from "../App"; // Experience는 App.tsx에서 가져오고
import { EmotionType } from "../screens/CreateEditPostScreen"; // EmotionType은 CreateEditPostScreen.tsx에서 가져옵니다.
// ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲ 이 부분을 수정합니다 ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

// 서버에서 온 데이터 타입을 정의합니다 (Swagger를 참고).
interface ServerPost {
  id: number;
  title: string;
  experienceDate: string; 
  location: string;
  summary: string; 
  emotion: string;
  trendTitle: string; 
  trendScore: number;
  trendId: number;
  tags: string[];
  latitude?: number;
  longitude?: number;
}

// '번역' 함수
const serverToApp = (post: ServerPost): Experience => {
  return {
    id: post.id,
    title: post.title,
    date: post.experienceDate,
    location: post.location,
    description: post.summary,
    emotion: post.emotion.toLowerCase() as EmotionType,
    trendName: post.trendTitle,
    trendScore: post.trendScore,
    trendId: post.trendId,
    tags: post.tags,
    latitude: post.latitude,
    longitude: post.longitude,
  };
};

export const dataTransformers = {
  serverToApp,
};