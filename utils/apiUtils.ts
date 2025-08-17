// sssu22/front/FRONT-feature-4/utils/apiUtils.ts

import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { dataTransformers } from "./dataTransformers";
import type { Experience, Trend, User } from "../types";

// 1. 기본 설정
axios.defaults.baseURL = "http://34.219.161.217:8080/api/v1";
const TOKEN_KEY = "TrendLog-token";
const REFRESH_KEY = "TrendLog-refresh";
const unwrap = <T,>(res: any): T => (res?.data?.data ?? res?.data);

// --- 데이터 변환 함수 (기존과 동일) ---
const transformToTrend = (t: any): Trend => ({
    id: Number(t.trendId ?? t.id),
    title: t.title || "",
    description: t.description || "",
    category: t.categoryName || t.category || t.tag || "",
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

// --- 토큰 관리 (기존과 동일) ---
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
};

// 2. Axios 인터셉터 (기존과 동일)
axios.interceptors.request.use(
    async (config) => {
        // public 요청이 아닌 경우에만 토큰을 추가
        if (!(config as any)._isPublic) {
            const token = await tokenManager.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        // FormData의 경우 Content-Type을 axios가 자동으로 설정하도록 비워둡니다.
        if (config.data instanceof FormData) {
            // Let axios handle the Content-Type
        } else if (!config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }
        return config;
    },
    (error) => Promise.reject(error)
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


// 3. API 함수들 (잘못된 경로 수정)
export const authApi = {
    login: async (creds: { email: string; password: string }) => {
        try {
            const loginRes = await axios.post("/auth/login", creds, { _isPublic: true } as any);
            const accessToken = loginRes.data?.data?.accessToken || loginRes.data?.accessToken || loginRes.data?.token;
            if (!accessToken) throw new Error("서버 응답에 인증 토큰이 없습니다.");

            await tokenManager.saveToken(accessToken);

            const refreshToken = loginRes.data?.data?.refreshToken || loginRes.data?.refreshToken;
            if (refreshToken) await AsyncStorage.setItem(REFRESH_KEY, refreshToken);

            // ✅ 참고: API 문서에는 GET /users/me/profile 경로도 있습니다. 필요시 이 경로로 변경할 수 있습니다.
            const profileRes = await axios.get("/users/me");
            const profileData = unwrap(profileRes);
            if (!profileData) throw new Error("프로필 정보를 가져오지 못했습니다.");

            return {
                id: profileData.id,
                email: profileData.email || creds.email,
                name: profileData.name || "사용자",
                ...profileData
            };
        } catch (error: any) {
            console.error("❗️ 로그인 과정 중 에러 발생:", error.response?.data || error.message);
            throw error;
        }
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
        try {
            const rt = await AsyncStorage.getItem(REFRESH_KEY);
            const body = rt ? { refreshToken: rt } : {};
            await axios.post("/auth/logout", body);
        } catch (error) {
            console.warn("⚠️ 로그아웃 API 실패 (무시):", error);
        } finally {
            await AsyncStorage.removeItem(REFRESH_KEY);
            await tokenManager.removeToken();
        }
    },
    validateToken: async () => {
        // ✅ 참고: API 문서에는 GET /users/me/profile 경로도 있습니다. 필요시 이 경로로 변경할 수 있습니다.
        const res = await axios.get("/users/me");
        const profileData = unwrap(res);
        if (!profileData) throw new Error("유효한 사용자 정보를 가져오지 못했습니다.");
        return {
            id: profileData.id,
            email: profileData.email,
            name: profileData.name || "사용자",
            ...profileData
        };
    },
    requestPasswordReset: async (email: string) => {
        const res = await axios.post("/password/reset-request", { email }, { _isPublic: true } as any);
        return unwrap(res);
    },
};

export const usersApi = {
    updateMe: async (profileData: {
        name: string;
        address: string;
        stateMessage: string;
        locationTracing: boolean;
    }) => {
        const res = await axios.patch("/users/me", profileData);
        return unwrap(res);
    },
    changePassword: async (passwordData: { currentPassword: string; newPassword: string; }) => {
        const res = await axios.patch("/users/password", passwordData);
        return unwrap(res);
    },
    deleteAccount: async () => {
        const res = await axios.delete("/users/me");
        return unwrap(res);
    },
    updateProfileImage: async (imageUri: string) => {
        const formData = new FormData();
        const fileName = imageUri.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(fileName);
        const type = match ? `image/${match[1]}` : 'image';

        formData.append('file', { uri: imageUri, name: fileName, type } as any);

        // ✅ 수정된 경로: /users/profile-image -> /users/me/profile-image (API 문서 기반 추정)
        // Users API 이미지에 /users/profile-image로 되어 있으나, 보통 인증이 필요한 리소스는 /me 하위에 위치하므로 /users/me/profile-image 일 가능성이 높습니다.
        // 만약 /users/profile-image가 맞다면 원래대로 되돌려주세요.
        const res = await axios.post("/users/me/profile-image", formData);
        return unwrap(res);
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
        const res = await axios.get(`/trends/${Number(trendId)}`);
        const body = res.data.data ?? res.data;
        return {
            ...transformToTrend(body),
            liked: body.liked || body.isLiked || body.userLiked || false,
            scrapped: body.scrapped || body.isScrapped || body.userScrapped || false,
        };
    },
    create: async (payload: { title: string; description: string; [key: string]: any }) => {
        const res = await axios.post("/trends", payload);
        return unwrap(res);
    },
    // ✅ 참고: API 문서에 PUT, DELETE /trends/{id} 가 없어 사용되지 않는 함수일 수 있습니다.
    update: async (id: number, p: any) => axios.put(`/trends/${id}`, p),
    delete: async (id: number) => axios.delete(`/trends/${id}`),
    like: async (trendId: number) => axios.post(`/trends/${Number(trendId)}/like`, {}),
    scrap: async (trendId: number) => axios.post(`/trends/${Number(trendId)}/scrap`, {}),
    getRecent: async (): Promise<Trend[]> => {
        const res = await axios.get("/trends/recent");
        const list = unwrap<any[]>(res) ?? [];
        return list.map(transformToTrend);
    },
    getPopular: async (): Promise<Trend[]> => {
        const res = await axios.get("/trends/popular");
        const list = unwrap<any[]>(res) ?? [];
        return list.map(transformToTrend);
    },
    getRecommendations: async (): Promise<Trend[]> => {
        const res = await axios.get("/recommend");
        const list = res.data?.data ?? [];
        return list.map(transformToTrend);
    },
    getPredictions: async (): Promise<Trend[]> => {
        const res = await axios.get("/recommend/predictions");
        const list = res.data?.data ?? [];
        return list.map(transformToTrend);
    },
};

export const postsApi = {
    getMyPosts: async (params?: { sort?: string; emotion?: string; page?: number; size?: number; gu?: string }): Promise<Experience[]> => {
        const q = { page: params?.page ?? 1, size: params?.size ?? 10, sort: params?.sort ?? "latest", emotion: params?.emotion ?? "all", ...(params?.gu && { gu: params.gu }), };
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
    getAll: async (params?: { sort?: string; emotion?: string; page?: number; size?: number; gu?: string }): Promise<Experience[]> => {
        const q = { page: params?.page ?? 1, size: params?.size ?? 10, sort: params?.sort ?? "latest", emotion: params?.emotion ?? "all", ...(params?.gu && { gu: params.gu }), };
        const res = await axios.get("/posts", { params: q });
        const list = res.data?.data?.list || [];
        return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
    },
    getById: async (id: number): Promise<Experience> => {
        const res = await axios.get(`/posts/${id}`);
        const raw = res.data.data ?? res.data;
        return dataTransformers.serverToApp(raw);
    },
    create: async (p: any) => {
        const res = await axios.post("/posts", p);
        return res.data;
    },
    update: async (id: number, p: any) => {
        const res = await axios.put(`/posts/${id}`, p);
        return res.data;
    },
    delete: async (id: number) => {
        const res = await axios.delete(`/posts/${id}`);
        return res.data;
    },
    getPopular: async (): Promise<Experience[]> => {
        const res = await axios.get("/posts/popular");
        const list = res.data?.data?.list || [];
        return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
    },
    likePost: async (postId: number) => {
        const res = await axios.post(`/posts/${postId}/like`, {});
        return res.data;
    },
    scrapPost: async (postId: number) => {
        const res = await axios.post(`/posts/${postId}/scrap`, {});
        return res.data;
    },
    getMyPostMap: async (): Promise<MapMarkerItem[]> => {
        const res = await axios.get("/users/me/posts/map");
        const body = res.data?.data ?? res.data?.result ?? res.data;
        return Array.isArray(body) ? body : Array.isArray(body?.list) ? body.list : [];
    },
};

export const commentsApi = {
    create: async (postId: number, content: string) => {
        const res = await axios.post(`/posts/${postId}/comments`, { content });
        return res.data;
    },
    delete: async (postId: number, commentId: number) => {
        const res = await axios.delete(`/posts/${postId}/comments/${commentId}`);
        return res.data;
    },
    like: async (postId: number, commentId: number) => {
        const res = await axios.post(`/posts/${postId}/comments/${commentId}/like`, {});
        return res.data;
    },
    createForTrend: async (trendId: number, content: string) => {
        const res = await axios.post(`/trends/${trendId}/comments`, { content });
        return res.data;
    },
    deleteForTrend: async (trendId: number, commentId: number) => {
        const res = await axios.delete(`/trends/comments/${commentId}`);
        return res.data;
    },
    likeForTrend: async (commentId: number) => {
        const res = await axios.post(`/trends/comments/${commentId}/like`, {});
        return res.data;
    },
};

// ✨ --- 수정된 부분 시작 --- ✨
export const scrapsApi = {
    getMyScrappedPosts: async (): Promise<Experience[]> => {
        // ✅ 수정된 경로: /users/me/scraps/posts -> /users/me/scraps
        const res = await axios.get("/users/me/scraps");
        const list = res.data?.data?.list || res.data?.data || [];
        return (Array.isArray(list) ? list : []).map(dataTransformers.serverToApp);
    },
    getMyScrappedTrends: async (): Promise<Trend[]> => {
        // ✅ 수정된 경로: /users/me/scraps/trends -> /users/me/trends
        const res = await axios.get("/users/me/trends");
        const list = res.data?.data?.list || res.data?.data || [];
        return (Array.isArray(list) ? list : []).map(transformToTrend);
    },
};
// ✨ --- 수정된 부분 끝 --- ✨

export const initializeApi = async (): Promise<string | null> => {
    return await tokenManager.initializeToken();
};