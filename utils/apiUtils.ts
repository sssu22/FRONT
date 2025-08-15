import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dataTransformers } from "./dataTransformers"; 
import type { Experience, Trend } from "../types";

axios.defaults.baseURL = "http://34.219.161.217:8080/api/v1";

const TOKEN_KEY = "TrendLog-token";
const REFRESH_KEY = "TrendLog-refresh";
const unwrap = <T,>(res: any): T => (res?.data?.data ?? res?.data);

const transformToTrend = (t: any): Trend => ({
  id: Number(t.trendId ?? t.id),
  title: t.title || "",
  description: t.description || "",
  category: t.categoryName || t.category ||t.tag || "",
  name: t.title || "",
  score: Number(t.score ?? 0),
  increaseScore: t.increaseRate != null ? Number(t.increaseRate) : (t.increaseScore != null ? Number(t.increaseScore) : undefined),
  tags: t.tag ? [t.tag] : (t.tags || []),
  prediction: t.confidence != null ? {
    confidence: Number(t.confidence),
    direction: t.increaseRate > 0 ? "up" : (t.increaseRate < 0 ? "down" : "stable"),
    nextMonthGrowth: Number(t.increaseRate ?? 0),
  } : undefined,
  likeCount: t.likeCount,
  postCount: t.postCount,
  viewCount: t.viewCount,
  comments: t.comments,
  liked: t.liked,
  scrapped: t.scrapped,
  snsMentions: t.snsMentions,
  youtubeTopView: t.youtubeTopView,
  peakPeriod: t.peakPeriod,
  similarTrends: t.similarTrends,
  recommendedNews: t.recommendedNews,
});

export type MapMarkerItem = {
  district: string;    
  postCount: number;    
  latitude: number;
  longitude: number;
};

export const tokenManager = {
  saveToken: async (token: string) => {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } catch (err) {
      console.error("❌ 토큰 저장 실패:", err);
    }
  },
  getToken: async (): Promise<string | null> => {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (err) {
      console.error("❌ 토큰 조회 실패:", err);
      return null;
    }
  },
  removeToken: async () => {
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      delete axios.defaults.headers.common["Authorization"];
    } catch (err) {
      console.error("❌ 토큰 삭제 실패:", err);
    }
  },
  initializeToken: async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        return token;
      }
    } catch (err) {
      console.error("❌ 토큰 초기화 실패:", err);
    }
    return null;
  },
  setToken: async (token: string) => tokenManager.saveToken(token),
};

const getAuthHeaders = async () => {
  const token = await tokenManager.getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

axios.interceptors.request.use(
  async (config) => {
    if (!config.headers.Authorization) {
      const token = await tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (err) => Promise.reject(err)
);

axios.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await tokenManager.removeToken();
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  login: async (creds: { email: string; password: string }) => {
    // 1. 로그인하여 토큰 받기
    const loginRes = await axios.post("/auth/login", creds);
    const accessToken = loginRes.data?.data?.accessToken || loginRes.data?.accessToken || loginRes.data?.token;
    if (accessToken) {
      await tokenManager.saveToken(accessToken);
    } else {
      throw new Error("서버 응답에 인증 토큰이 없습니다.");
    }
    const refreshToken = loginRes.data?.data?.refreshToken || loginRes.data?.refreshToken;
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
    }

    // 2. 토큰 저장 후, 사용자 정보(/users/me)를 바로 가져오기
    const profileRes = await axios.get("/users/me", { headers: await getAuthHeaders() });
    const profileData = profileRes.data?.data;

    // 3. 받아온 프로필 정보로 최종 user 객체 생성
    const user = {
      id: profileData?.id, // 서버 응답에 id가 포함되어야 합니다.
      email: profileData?.email || creds.email,
      name: profileData?.name || "사용자",
      profileImage: profileData?.profileImage,
    };
    return user;
  },
  signup: async (user: { email: string; password: string; name: string }) => {
    const res = await axios.post("/auth/signup", user);
    const accessToken = res.data?.data?.accessToken || res.data?.accessToken || res.data?.token;
    if (accessToken) {
      await tokenManager.saveToken(accessToken);
    }
    const refreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
    }
    return res.data;
  },
  logout: async () => {
    try {
      const rt = await AsyncStorage.getItem(REFRESH_KEY);
      const body = rt ? { refreshToken: rt } : {};
      await axios.post("/auth/logout", body, { headers: await getAuthHeaders() });
    } catch (error) {
      console.warn("⚠️ 로그아웃 API 실패 (무시):", error);
    } finally {
      await AsyncStorage.removeItem(REFRESH_KEY);
      await tokenManager.removeToken();
    }
  },
  validateToken: async () => {
    const res = await axios.get("/users/me", { headers: await getAuthHeaders() });
    return res.data;
  },
};
export const trendsApi = {
  getAll: async (): Promise<Trend[]> => {
    const res = await axios.get("/trends");
    const body = res.data.data ?? res.data;
    const raw = Array.isArray(body.content) ? body.content : [];
    return raw.map(transformToTrend);
  },
  search: async (keyword: string): Promise<Trend[]> => {
    const res = await axios.get(`/search/trends?keyword=${encodeURIComponent(keyword)}&category=all&page=1&size=50&sortBy=latest`);
    const list = res.data?.data?.list ?? [];
    return list.map(transformToTrend);
  },
  getById: async (trendId: number): Promise<Trend> => {
    const res = await axios.get(`/trends/${Number(trendId)}`, { 
      headers: await getAuthHeaders() 
    });
    const body = res.data.data ?? res.data;
    return { 
      ...transformToTrend(body), 
      liked: body.liked || body.isLiked || body.userLiked || false,
      scrapped: body.scrapped || body.isScrapped || body.userScrapped || false,
    };
  },
  create: async (payload: { title: string; description: string; [key: string]: any }) => {
    const res = await axios.post("/trends", payload, { headers: await getAuthHeaders() });
    return unwrap(res);
  },
  update: async (id: number, p: any) => axios.put(`/trends/${id}`, p, { headers: await getAuthHeaders() }),
  delete: async (id: number) => axios.delete(`/trends/${id}`, { headers: await getAuthHeaders() }),
  like: async (trendId: number) => {
    return await axios.post(`/trends/${Number(trendId)}/like`, {}, { headers: await getAuthHeaders() });
  },
  scrap: async (trendId: number) => {
    return await axios.post(`/trends/${Number(trendId)}/scrap`, {}, { headers: await getAuthHeaders() });
  },
  getRecent: async (): Promise<Trend[]> => {
    const res = await axios.get("/trends/recent", { headers: await getAuthHeaders() });
    const list = unwrap<any[]>(res) ?? [];
    return list.map(transformToTrend);
  },
  getPopular: async (): Promise<Trend[]> => {
    const res = await axios.get("/trends/popular", { headers: await getAuthHeaders() });
    const list = unwrap<any[]>(res) ?? [];
    return list.map(transformToTrend);
  },
  getRecommendations: async (): Promise<Trend[]> => {
    const res = await axios.get("/recommend", { headers: await getAuthHeaders() });
    const list = res.data?.data ?? [];
    return list.map(transformToTrend);
  },
  getPredictions: async (): Promise<Trend[]> => {
    const res = await axios.get("/recommend/predictions", { headers: await getAuthHeaders() });
    const list = res.data?.data ?? [];
    return list.map(transformToTrend);
  },
};

export const postsApi = {
  getMyPosts: async (params?: { sort?: string; emotion?: string; page?: number; size?: number; gu?: string }): Promise<Experience[]> => {
    const q = { page: params?.page ?? 1, size: params?.size ?? 10, sort: params?.sort ?? "latest", emotion: params?.emotion ?? "all", ...(params?.gu && { gu: params.gu }), };
    const res = await axios.get("/users/me/posts", { params: q, headers: await getAuthHeaders() });
    const list = res.data?.data?.list || res.data?.data || res.data?.list || [];
    return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
  },
  searchMyPosts: async (keyword: string): Promise<Experience[]> => {
    if (!keyword) return [];
    const res = await axios.get(`/search/posts/my?keyword=${encodeURIComponent(keyword)}&emotion=all&page=1&size=50&sortBy=latest`, { 
      headers: await getAuthHeaders() 
    });
    const list = res.data?.data?.list || [];
    return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
  },
  getAll: async (params?: { sort?: string; emotion?: string; page?: number; size?: number; gu?: string }): Promise<Experience[]> => {
    const q = { page: params?.page ?? 1, size: params?.size ?? 10, sort: params?.sort ?? "latest", emotion: params?.emotion ?? "all", ...(params?.gu && { gu: params.gu }), };
    const res = await axios.get("/posts", { params: q, headers: await getAuthHeaders() });
    const list = res.data?.data?.list || [];
    return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
  },
  getById: async (id: number): Promise<Experience> => {
    const res = await axios.get(`/posts/${id}`, { headers: await getAuthHeaders() });
    const raw = res.data.data ?? res.data;
    return dataTransformers.serverToApp(raw);
  },
  create: async (p: any) => {
    const res = await axios.post("/posts", p, { headers: await getAuthHeaders() });
    return res.data;
  },
  update: async (id: number, p: any) => {
    const res = await axios.put(`/posts/${id}`, p, { headers: await getAuthHeaders() });
    return res.data;
  },
  delete: async (id: number) => {
    const res = await axios.delete(`/posts/${id}`, { headers: await getAuthHeaders() });
    return res.data;
  },
  getPopular: async (): Promise<Experience[]> => {
    const res = await axios.get("/posts/popular", { headers: await getAuthHeaders() });
    const list = res.data?.data?.list || [];
    return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
  },
  // 🔧 수정: 게시물 좋아요 API 경로 수정
  likePost: async (postId: number) => {
    const res = await axios.post(`/posts/${postId}/like`, {}, { headers: await getAuthHeaders() });
    return res.data;
  },
  // 🔧 수정: 게시물 스크랩 API 경로 수정
  scrapPost: async (postId: number) => {
    const res = await axios.post(`/posts/${postId}/scrap`, {}, { headers: await getAuthHeaders() });
    return res.data;
  },
  getMyPostMap: async (): Promise<MapMarkerItem[]> => {
    const res = await axios.get("/users/me/posts/map", { headers: await getAuthHeaders() });
    const body = res.data?.data ?? res.data?.result ?? res.data;
    return Array.isArray(body) ? body : Array.isArray(body?.list) ? body.list : [];
  },
};

export const commentsApi = {
  // 🔧 수정: 댓글 작성 API 경로 수정
  create: async (postId: number, content: string) => {
    const res = await axios.post(`/posts/${postId}/comments`, { content }, { headers: await getAuthHeaders() });
    return res.data;
  },
  // 🔧 수정: 댓글 삭제 API 경로 수정
  delete: async (postId: number, commentId: number) => {
    const res = await axios.delete(`/posts/${postId}/comments/${commentId}`, { headers: await getAuthHeaders() });
    return res.data;
  },
  // 🔧 수정: 댓글 좋아요 API 경로 수정
  like: async (postId: number, commentId: number) => {
    const res = await axios.post(`/posts/${postId}/comments/${commentId}/like`, {}, { headers: await getAuthHeaders() });
    return res.data;
  },
  createForTrend: async (trendId: number, content: string) => {
    const res = await axios.post(`/trends/${trendId}/comments`, { content }, { headers: await getAuthHeaders() });
    return res.data;
  },
  deleteForTrend: async (trendId: number, commentId: number) => {
    const res = await axios.delete(`/trends/comments/${commentId}`, { headers: await getAuthHeaders() });
    return res.data;
  },
  likeForTrend: async (commentId: number) => {
    const res = await axios.post(`/trends/comments/${commentId}/like`, {}, { headers: await getAuthHeaders() });
    return res.data;
  },
};

export const initializeApi = async (): Promise<string | null> => {
  return await tokenManager.initializeToken();
};