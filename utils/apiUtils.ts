// sssu22/front/FRONT-feature-/utils/apiUtils.ts

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { dataTransformers } from "./dataTransformers";
import type { Experience, Trend, User, PopularTag, PaginatedResponse } from "../types";

// 1. 기본 설정
axios.defaults.baseURL = "http://34.219.161.217:8080/api/v1";
const TOKEN_KEY = "TrendLog-token";
const REFRESH_KEY = "TrendLog-refresh";
const unwrap = <T,>(res: any): T => (res?.data?.data ?? res?.data);

export interface UserStats {
    postCount: number;
    averageScore: number;
    visitPlaceCount: number;
    scrapCount: number;
}


// --- 데이터 변환 유틸리티 ---
const toServerUser = (userData: Partial<User>): object => {
    const serverData: { [key: string]: any } = { ...userData };
    if (serverData.profileImageUrl !== undefined) {
        serverData.profileImage = serverData.profileImageUrl;
        delete serverData.profileImageUrl;
    }
    return serverData;
};

// 서버 응답(userData)을 클라이언트 타입(User)으로 변환하는 함수
const toClientUser = (userData: any = {}): User => {
    return {
        id: String(userData.id),
        name: userData.name,
        email: userData.email,
        profileImageUrl: userData.profileImage || userData.profileImageUrl,
        birth: userData.birth,
        address: userData.address,
        stateMessage: userData.stateMessage,
        locationTracing: userData.locationTracing,
        signUpDate: userData.signDate, // swagger의 'signdate'를 'signUpDate'로 매핑
    };
};

const transformToTrend = (t: any): Trend => ({ id: Number(t.trendId ?? t.id), title: t.title || "", description: t.description || "", category: t.categoryName || t.category || t.tag || "", name: t.title || "", score: Number(t.score ?? 0), increaseScore: t.increaseRate != null ? Number(t.increaseRate) : (t.increaseScore != null ? Number(t.increaseScore) : undefined), tags: t.tag ? [t.tag] : (t.tags || []), prediction: t.confidence != null ? { confidence: Number(t.confidence), direction: t.increaseRate > 0 ? "up" : (t.increaseRate < 0 ? "down" : "stable"), nextMonthGrowth: Number(t.increaseRate ?? 0), } : undefined, likeCount: t.likeCount, postCount: t.postCount, viewCount: t.viewCount, comments: t.comments, liked: t.liked, scrapped: t.scrapped, snsMentions: t.snsMentions, youtubeTopView: t.youtubeTopView, peakPeriod: t.peakPeriod, similarTrends: t.similarTrends, recommendedNews: t.recommendedNews, });
export type MapMarkerItem = { district: string; postCount: number; latitude: number; longitude: number; };

// --- 토큰 관리 및 Axios 설정 ---
export const tokenManager = {
    saveToken: async (token: string) => { try { await AsyncStorage.setItem(TOKEN_KEY, token); axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; } catch (err) { console.error("❌ 토큰 저장 실패:", err); } },
    getToken: async (): Promise<string | null> => { try { return await AsyncStorage.getItem(TOKEN_KEY); } catch (err) { console.error("❌ 토큰 조회 실패:", err); return null; } },
    removeToken: async () => { try { await AsyncStorage.removeItem(TOKEN_KEY); delete axios.defaults.headers.common["Authorization"]; } catch (err) { console.error("❌ 토큰 삭제 실패:", err); } },
    initializeToken: async (): Promise<string | null> => { try { const token = await AsyncStorage.getItem(TOKEN_KEY); if (token) { axios.defaults.headers.common["Authorization"] = `Bearer ${token}`; return token; } } catch (err) { console.error("❌ 토큰 초기화 실패:", err); } return null; },
};
axios.interceptors.request.use( async (config) => { if (!(config as any)._isPublic) { const token = await tokenManager.getToken(); if (token) { config.headers.Authorization = `Bearer ${token}`; } } if (config.data instanceof FormData) { delete config.headers['Content-Type']; } else if (!config.headers['Content-Type']) { config.headers['Content-Type'] = 'application/json'; } return config; }, (error) => Promise.reject(error) );
axios.interceptors.response.use( (res) => res, async (err) => { if (err.response?.status === 401) { await tokenManager.removeToken(); } return Promise.reject(err); } );

// --- API 함수들 ---
export const authApi = {
    login: async (creds: { email: string; password: string }): Promise<User> => {
        const loginRes = await axios.post("/auth/login", creds, { _isPublic: true } as any);
        const accessToken = loginRes.data?.data?.accessToken || loginRes.data?.accessToken || loginRes.data?.token;
        if (!accessToken) throw new Error("서버 응답에 인증 토큰이 없습니다.");
        await tokenManager.saveToken(accessToken);
        const refreshToken = loginRes.data?.data?.refreshToken || loginRes.data?.refreshToken;
        if (refreshToken) await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
        return await authApi.validateToken();
    },
    signup: async (user: { email: string; password: string; name: string }) => {
        const res = await axios.post("/auth/signup", user, { _isPublic: true } as any);
        const accessToken = res.data?.data?.accessToken || res.data?.accessToken || res.data?.token;
        if (accessToken) await tokenManager.saveToken(accessToken);
        const refreshToken = res.data?.data?.refreshToken || res.data?.refreshToken;
        if (refreshToken) await AsyncStorage.setItem(REFRESH_KEY, refreshToken);
        return res.data;
    },
    logout: async () => {
        try { const rt = await AsyncStorage.getItem(REFRESH_KEY); await axios.post("/auth/logout", rt ? { refreshToken: rt } : {}); }
        catch (error) { console.warn("⚠️ 로그아웃 API 실패 (무시):", error); }
        finally { await AsyncStorage.removeItem(REFRESH_KEY); await tokenManager.removeToken(); }
    },
    validateToken: async (): Promise<User> => {
        const res = await axios.get("/users/me");
        const profileData = unwrap(res);
        if (!profileData) throw new Error("유효한 사용자 정보를 가져오지 못했습니다.");
        return toClientUser(profileData);
    },
    requestPasswordReset: async (email: string) => { const res = await axios.post("/password/reset-request", { email }, { _isPublic: true } as any); return unwrap(res); },
};

export const usersApi = {
    updateMe: async (profileData: Partial<User>): Promise<User> => {
        const serverPayload = toServerUser(profileData);
        const res = await axios.patch("/users/me", serverPayload);
        return toClientUser(unwrap(res));
    },
    changePassword: async (passwordData: { currentPassword: string; newPassword: string; }) => {
        const res = await axios.patch("/users/password", passwordData);
        return unwrap(res);
    },
    deleteAccount: async () => {
        const res = await axios.delete("/users/me");
        return unwrap(res);
    },
    updateProfileImage: async (asset: { uri: string; fileName?: string | null; mimeType?: string | null }): Promise<string> => {
        const formData = new FormData();
        const uri = asset.uri;
        const fileName = asset.fileName || uri.split('/').pop() || 'profile.jpg';
        const type = asset.mimeType || `image/${fileName.split('.').pop()}`;
        formData.append('file', { uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''), name: fileName, type: type, } as any);
        const token = await tokenManager.getToken();
        if (!token) throw new Error('인증 토큰이 없어 요청을 보낼 수 없습니다.');
        const config = { headers: { 'Authorization': `Bearer ${token}` } };
        const res = await axios.post("/users/profile-image", formData, config);
        const unwrappedResponse = unwrap<string>(res);
        if (typeof unwrappedResponse !== 'string') throw new Error('API did not return a valid URL string');
        return unwrappedResponse;
    },
    getMyStats: async (): Promise<UserStats> => {
        const res = await axios.get("/users/me/stats");
        return unwrap(res);
    },
    getMyRecentPosts: async (): Promise<Experience[]> => {
        const res = await axios.get("/users/me/posts/recent");
        const list = res.data?.data?.list || res.data?.data || [];
        return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
    },
    getMyProfile: async (): Promise<Partial<User>> => {
        const res = await axios.get("/users/me/profile");
        return toClientUser(unwrap(res));
    },
};

export const trendsApi = { getAll: async (): Promise<Trend[]> => { const res = await axios.get("/trends"); const body = res.data.data ?? res.data; const raw = Array.isArray(body.content) ? body.content : []; return raw.map(transformToTrend); }, search: async (keyword: string): Promise<Trend[]> => { const res = await axios.get(`/search/trends?keyword=${encodeURIComponent(keyword)}&category=all&page=1&size=50&sortBy=latest`); const list = res.data?.data?.list ?? []; return list.map(transformToTrend); }, getById: async (trendId: number): Promise<Trend> => { const res = await axios.get(`/trends/${Number(trendId)}`); const body = res.data.data ?? res.data; return { ...transformToTrend(body), liked: body.liked || body.isLiked || body.userLiked || false, scrapped: body.scrapped || body.isScrapped || body.userScrapped || false, }; }, create: async (payload: { title: string; description: string; [key: string]: any }) => { const res = await axios.post("/trends", payload); return unwrap(res); }, update: async (id: number, p: any) => axios.put(`/trends/${id}`, p), delete: async (id: number) => axios.delete(`/trends/${id}`), like: async (trendId: number) => axios.post(`/trends/${Number(trendId)}/like`, {}), scrap: async (trendId: number) => axios.post(`/trends/${Number(trendId)}/scrap`, {}), getRecent: async (): Promise<Trend[]> => { const res = await axios.get("/trends/recent"); const list = unwrap<any[]>(res) ?? []; return list.map(transformToTrend); }, getPopular: async (): Promise<Trend[]> => { const res = await axios.get("/trends/popular"); const list = unwrap<any[]>(res) ?? []; return list.map(transformToTrend); }, getRecommendations: async (): Promise<Trend[]> => { const res = await axios.get("/recommend"); const list = res.data?.data ?? []; return list.map(transformToTrend); }, getPredictions: async (): Promise<Trend[]> => { const res = await axios.get("/recommend/predictions"); const list = res.data?.data ?? []; return list.map(transformToTrend); }, };
export const postsApi = {
    getMyPosts: async (params?: { sort?: string; emotion?: string; page?: number; size?: number; district?: string }): Promise<Experience[]> => {
        const q = { page: params?.page ?? 1, size: params?.size ?? 10, sort: params?.sort ?? "latest", emotion: params?.emotion ?? "all", ...(params?.district && { district: params.district }) };
        const res = await axios.get("/users/me/posts", { params: q });
        const list = res.data?.data?.list || res.data?.data || res.data?.list || [];
        return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
    },
    searchMyPosts: async (keyword: string): Promise<Experience[]> => {
        if (!keyword) return [];
        const res = await axios.get(`/search/posts/my?keyword=${encodeURIComponent(keyword)}&emotion=all&page=1&size=50&sortBy=latest`);
        const list = res.data?.data?.list || [];
        return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
    },
    search: async (keyword: string): Promise<Experience[]> => {
        if (!keyword.trim()) return [];
        const res = await axios.get(`/search/posts`, {
            params: { keyword, page: 1, size: 999, sortBy: 'latest', emotion: 'all' },
            _isPublic: true
        } as any);
        const list = res.data?.data?.list || res.data?.data || [];
        return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
    },
    getAll: async (params?: { sort?: string; emotion?: string; page?: number; size?: number; district?: string }): Promise<PaginatedResponse<Experience>> => {
        const q = { page: params?.page ?? 1, size: params?.size ?? 10, sort: params?.sort ?? "latest", emotion: params?.emotion ?? "all", ...(params?.district && { district: params.district }) };
        const res = await axios.get("/posts", { params: q, _isPublic: true } as any);
        const data = res.data?.data ?? res.data;
        const pageInfo = data?.pageInfo ?? {
            page: params?.page ?? 1,
            size: params?.size ?? 10,
            totalElements: data?.totalElements ?? data?.list?.length ?? 0,
            totalPages: data?.totalPages ?? 1,
        };
        return {
            list: (data?.list || data || []).map(dataTransformers.serverToApp),
            pageInfo: pageInfo
        };
    },
    getById: async (id: number): Promise<Experience> => { const res = await axios.get(`/posts/${id}`); const raw = res.data.data ?? res.data; return dataTransformers.serverToApp(raw); },
    create: async (p: any) => { const res = await axios.post("/posts", p); return res.data; },
    update: async (id: number, p: any) => { const res = await axios.put(`/posts/${id}`, p); return res.data; },
    delete: async (id: number) => { const res = await axios.delete(`/posts/${id}`); return res.data; },
    getPopular: async (): Promise<Experience[]> => { const res = await axios.get("/posts/popular"); const list = res.data?.data?.list || []; return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp); },
    likePost: async (postId: number) => {
        const res = await axios.post(`/posts/${postId}/like`, {});
        return res.data;
    },
    scrapPost: async (postId: number) => {
        const res = await axios.post(`/posts/${postId}/scrap`, {});
        return res.data;
    },
    getMyPostMap: async (): Promise<MapMarkerItem[]> => { const res = await axios.get("/users/me/posts/map"); const body = res.data?.data ?? res.data?.result ?? res.data; return Array.isArray(body) ? body : Array.isArray(body?.list) ? body.list : []; },
};

export const commentsApi = {
    create: async (postId: number, content: string) => { const res = await axios.post(`/posts/${postId}/comments`, { content }); return res.data; },
    delete: async (postId: number, commentId: number) => { const res = await axios.delete(`/posts/${postId}/comments/${commentId}`); return res.data; },
    like: async (postId: number, commentId: number) => {
        const res = await axios.post(`/posts/${postId}/comments/${commentId}/like`, {});
        return res.data?.data || res.data;
    },
    createForTrend: async (trendId: number, content: string) => { const res = await axios.post(`/trends/${trendId}/comments`, { content }); return res.data; },
    deleteForTrend: async (trendId: number, commentId: number) => { const res = await axios.delete(`/trends/comments/${commentId}`); return res.data; },
    likeForTrend: async (commentId: number) => { const res = await axios.post(`/trends/comments/${commentId}/like`, {}); return res.data; },
};

export const scrapsApi = { getMyScrappedPosts: async (): Promise<Experience[]> => { const res = await axios.get("/users/me/scraps"); const list = res.data?.data?.list || res.data?.data || []; return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp); }, getMyScrappedTrends: async (): Promise<Trend[]> => { const res = await axios.get("/users/me/trends"); const list = res.data?.data?.list || res.data?.data || []; return (Array.isArray(list) ? list : []).map(transformToTrend); }, };
export const tagsApi = {
    getPopular: async (): Promise<PopularTag[]> => {
        const res = await axios.get("/tags/popular", { params: { page: 1, size: 8 } });
        const list = res.data?.data?.list || res.data?.data || [];
        return (list || []).map((item: any) => ({
            name: item.tagName || item.name,
            postCount: item.postCount || 0,
        }));
    },
};
export const initializeApi = async (): Promise<string | null> => { return await tokenManager.initializeToken(); };