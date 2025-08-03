// utils/apiUtils.ts - 토큰 추출 로직 수정된 버전
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dataTransformers } from "./dataTransformers";
import type { Experience } from "../App";

// 기본 baseURL 설정
axios.defaults.baseURL = "http://192.168.0.74:8080/api/v1";

// ✅ 토큰 키 통일
const TOKEN_KEY = "TrendLog-token";

// ==============================
// 토큰 관리 유틸
// ==============================
export const tokenManager = {
  saveToken: async (token: string) => {
    try {
      console.log("💾 토큰 저장 시작:", token.substring(0, 20) + "...");
      await AsyncStorage.setItem(TOKEN_KEY, token);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("✅ 토큰 저장 완료");
    } catch (err) {
      console.error("❌ 토큰 저장 실패:", err);
    }
  },

  getToken: async (): Promise<string | null> => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      console.log("🔍 토큰 조회:", token ? "있음" : "없음");
      return token;
    } catch (err) {
      console.error("❌ 토큰 조회 실패:", err);
      return null;
    }
  },

  removeToken: async () => {
    try {
      console.log("🗑️ 토큰 삭제 시작");
      await AsyncStorage.removeItem(TOKEN_KEY);
      delete axios.defaults.headers.common["Authorization"];
      console.log("✅ 토큰 삭제 완료");
    } catch (err) {
      console.error("❌ 토큰 삭제 실패:", err);
    }
  },

  initializeToken: async (): Promise<string | null> => {
    try {
      console.log("🚀 토큰 초기화 시작");
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (token) {
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        console.log("✅ 토큰 초기화 완료:", token.substring(0, 20) + "...");
        return token;
      } else {
        console.log("ℹ️ 저장된 토큰 없음");
      }
    } catch (err) {
      console.error("❌ 토큰 초기화 실패:", err);
    }
    return null;
  },

  // 기존 함수명도 호환성을 위해 유지
  setToken: async (token: string) => {
    return tokenManager.saveToken(token);
  },
};

const getAuthHeaders = async () => {
  const token = await tokenManager.getToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// ==============================
// Axios 인터셉터 설정
// ==============================
axios.interceptors.request.use(
  async (config) => {
    console.log(`📤 API 요청: ${config.method?.toUpperCase()} ${config.url}`);
    
    if (!config.headers?.Authorization) {
      const token = await tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("🔑 요청에 토큰 추가:", token.substring(0, 20) + "...");
      } else {
        console.log("⚠️ 토큰 없음 - 인증 없이 요청");
      }
    }
    return config;
  },
  (err) => {
    console.error("❌ 요청 인터셉터 오류:", err);
    return Promise.reject(err);
  }
);

axios.interceptors.response.use(
  (res) => {
    console.log(`📥 API 응답: ${res.status} ${res.config.url}`);
    return res;
  },
  async (err) => {
    const status = err.response?.status;
    const url = err.config?.url;
    console.error(`❌ API 오류: ${status} ${url}`);
    
    if (status === 401) {
      console.warn("⚠️ 401 인증 오류 - 토큰 제거");
      await tokenManager.removeToken();
    }
    return Promise.reject(err);
  }
);

// ==============================
// 인증 API - 토큰 추출 로직 수정
// ==============================
export const authApi = {
  login: async (creds: { email: string; password: string }) => {
    console.log("🔐 로그인 API 호출:", creds.email);
    const res = await axios.post("/auth/login", creds);
    console.log("📥 로그인 응답:", res.data);
    
    // ✅ 서버 응답 구조에 맞게 토큰 추출 로직 수정
    // 서버 응답: { data: { accessToken: "...", refreshToken: "..." } }
    const token = res.data.data?.accessToken ||  // 주된 경로
                 res.data.accessToken ||         // 직접 경로
                 res.data.token ||               // 기본 토큰 필드
                 res.data.data?.token ||         // 중첩된 토큰 필드
                 res.data.access_token ||        // 스네이크 케이스
                 res.data.jwt;                   // JWT 필드
    
    if (token) {
      console.log("🔑 토큰 발견, 저장 중:", token.substring(0, 20) + "...");
      await tokenManager.saveToken(token);
      
      // 저장 확인
      const saved = await tokenManager.getToken();
      console.log("✅ 토큰 저장 확인:", saved ? "성공" : "실패");
    } else {
      console.error("❌ 응답에서 토큰을 찾을 수 없음");
      console.error("📋 응답 구조:", Object.keys(res.data));
      console.error("📋 data 하위 구조:", res.data.data ? Object.keys(res.data.data) : "없음");
      
      // 상세한 응답 로깅
      console.log("🔍 전체 응답 데이터:", JSON.stringify(res.data, null, 2));
    }
    
    return res.data;
  },

  signup: async (user: { email: string; password: string; name: string }) => {
    console.log("📝 회원가입 API 호출:", user.email);
    const res = await axios.post("/auth/signup", user);
    console.log("📥 회원가입 응답:", res.data);
    
    // 회원가입도 동일한 토큰 추출 로직 적용
    const token = res.data.data?.accessToken ||
                 res.data.accessToken ||
                 res.data.token ||
                 res.data.data?.token ||
                 res.data.access_token ||
                 res.data.jwt;
    
    if (token) {
      console.log("🔑 회원가입 토큰 저장:", token.substring(0, 20) + "...");
      await tokenManager.saveToken(token);
    }
    
    return res.data;
  },

  logout: async () => {
    try {
      console.log("👋 로그아웃 API 호출");
      await axios.post("/auth/logout", {}, { headers: await getAuthHeaders() });
    } catch (error) {
      console.warn("⚠️ 로그아웃 API 실패 (무시):", error);
    } finally {
      await tokenManager.removeToken();
    }
  },

  validateToken: async () => {
    console.log("🔍 토큰 검증 API 호출");
    const res = await axios.get("/auth/me", { headers: await getAuthHeaders() });
    console.log("✅ 토큰 검증 성공");
    return res.data;
  },
};

// ==============================
// 트렌드 API
// ==============================
export interface Trend {
  trendId: number;
  id: number;
  title: string;
  description: string;
  category: string;
  popularity?: number;
  createdAt?: string;
}

export const trendsApi = {
  getAll: async (): Promise<Trend[]> => {
    console.log("📊 트렌드 목록 조회");
    const res = await axios.get("/trends");
    const body = res.data.data ?? res.data;
    const raw = Array.isArray(body.content) ? body.content : [];
    return raw.map((t: any) => ({ ...t, id: t.trendId }));
  },
  
  getById: async (trendId: number): Promise<Trend> => {
    const res = await axios.get(`/trends/${trendId}`);
    const body = res.data.data ?? res.data;
    return { ...body, id: body.trendId };
  },
  
  create: async (p: any) => axios.post("/trends", p, { headers: await getAuthHeaders() }),
  update: async (id: number, p: any) => axios.put(`/trends/${id}`, p, { headers: await getAuthHeaders() }),
  delete: async (id: number) => axios.delete(`/trends/${id}`, { headers: await getAuthHeaders() }),
};

// ==============================
// 게시글 API
// ==============================
export interface Post {
  id: number;
  title: string;
  description: string;
  emotion: string;
  location: string;
  date: string;
  tags: string[];
  trendScore: number;
  trendId: number;
  trendName?: string;
  latitude?: number;
  longitude?: number;
}

export const postsApi = {
  getAll: async (
    params?: { sort?: string; emotion?: string; page?: number; size?: number }
  ): Promise<Experience[]> => {
    console.log("📝 게시글 목록 조회", params);
    const res = await axios.get("/posts", {
      params,
      headers: await getAuthHeaders(),
    });
    const body = res.data.data ?? res.data;
    const list = body.data?.list ?? body.list ?? body.content ?? [];
    console.log("✅ 게시글 목록 조회 완료:", list.length + "개");
    return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
  },

  getById: async (id: number): Promise<Experience> => {
    console.log("📖 게시글 상세 조회:", id);
    const res = await axios.get(`/posts/${id}`, { headers: await getAuthHeaders() });
    const raw = res.data.data ?? res.data;
    return dataTransformers.serverToApp(raw);
  },

  create: async (p: any) => {
    console.log("✏️ 게시글 생성 API 호출");
    console.log("📋 생성 데이터:", p);
    const res = await axios.post("/posts", p, { headers: await getAuthHeaders() });
    console.log("✅ 게시글 생성 완료");
    return res.data;
  },

  update: async (id: number, p: any) => {
    console.log("📝 게시글 수정:", id);
    const res = await axios.put(`/posts/${id}`, p, { headers: await getAuthHeaders() });
    console.log("✅ 게시글 수정 완료");
    return res.data;
  },

  delete: async (id: number) => {
    console.log("🗑️ 게시글 삭제:", id);
    const res = await axios.delete(`/posts/${id}`, { headers: await getAuthHeaders() });
    console.log("✅ 게시글 삭제 완료");
    return res.data;
  },

  getPopular: async (): Promise<Experience[]> => {
    const res = await axios.get("/posts/popular", { headers: await getAuthHeaders() });
    const body = res.data.data ?? res.data;
    const list = body.data?.list ?? body.list ?? body.content ?? [];
    return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
  },
};

// ==============================
// 초기화 함수
// ==============================
export const initializeApi = async (): Promise<string | null> => {
  console.log("🚀 API 초기화 시작");
  const token = await tokenManager.initializeToken();
  console.log("🚀 API 초기화 완료:", token ? "토큰 있음" : "토큰 없음");
  return token;
};