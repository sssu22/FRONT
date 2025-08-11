// utils/apiUtils.ts
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dataTransformers } from "./dataTransformers"; 
import type { Experience, Trend } from "../types";

axios.defaults.baseURL = "http://192.168.0.212:8080/api/v1";

const TOKEN_KEY = "TrendLog-token";
const REFRESH_KEY = "TrendLog-refresh";

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
    const res = await axios.post("/auth/login", creds);
    const accessToken = res.data?.data?.accessToken || res.data?.accessToken || res.data?.token;
    if (accessToken) {
      await tokenManager.saveToken(accessToken);
    } else {
      throw new Error("서버 응답에 인증 토큰이 없습니다.");
    }
    const refreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;
    if (refreshToken) {
      await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
    }
    const user = {
      id: res.data?.user?.id || res.data?.data?.user?.id || res.data?.id,
      email: res.data?.user?.email || res.data?.data?.user?.email || creds.email,
      name: res.data?.user?.name || res.data?.data?.user?.name || "사용자",
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
    return raw.map((t: any) => ({ ...t, id: Number(t.trendId), name: t.title }));
  },
  getById: async (trendId: number): Promise<Trend> => {
    const res = await axios.get(`/trends/${trendId}`);
    const body = res.data.data ?? res.data;
    return { ...body, id: Number(body.trendId) };
  },
  create: async (p: any) => axios.post("/trends", p, { headers: await getAuthHeaders() }),
  update: async (id: number, p: any) => axios.put(`/trends/${id}`, p, { headers: await getAuthHeaders() }),
  delete: async (id: number) => axios.delete(`/trends/${id}`, { headers: await getAuthHeaders() }),
};

export const postsApi = {
  getAll: async (params?: { sort?: string; emotion?: string; page?: number; size?: number; gu?: string }): Promise<Experience[]> => {
    const q = {
      page: params?.page ?? 1,
      size: params?.size ?? 10,
      sort: params?.sort ?? "latest",
      emotion: params?.emotion ?? "all",
      ...(params?.gu && { gu: params.gu }),
    };
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
  likePost: async (postId: number) => {
    const res = await axios.post(`/posts/${postId}/like`, {}, { headers: await getAuthHeaders() });
    return res.data;
  },
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
  create: async (postId: number, content: string) => {
    const res = await axios.post(`/posts/${postId}/comments`, { content }, { headers: await getAuthHeaders() });
    return res.data;
  },
  delete: async (postId: number, commentId: number) => {
    const res = await axios.delete(`/posts/${postId}/comments/${commentId}`, { headers: await getAuthHeaders() });
    return res.data;
  },
  like: async (postId: number, commentId: number) => {
    const res = await axios.post(`/posts/${postId}/comments/${commentId}/like`, {}, { headers: await getAuthHeaders() });
    return res.data;
  },
};

export const initializeApi = async (): Promise<string | null> => {
  return await tokenManager.initializeToken();
};