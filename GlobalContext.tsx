// GlobalContext.tsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { postsApi, authApi, tokenManager, initializeApi, trendsApi } from './utils/apiUtils';
import { Experience, Trend } from './types';

interface GlobalContextType {
  user: { id: string; email: string; name: string } | null;
  isInitializing: boolean;
  experiences: Experience[];
  trends: Trend[];
  loadingExperiences: boolean;
  loadingTrends: boolean;
  likedPosts: Set<number>;
  scrappedPosts: Set<number>;
  
  toggleLike: (postId: number) => void;
  toggleScrap: (postId: number) => void;
  handleLogin: (credentials: { email: string; password: string }) => Promise<void>;
  handleSignup: (userData: { email: string; password: string; name: string }) => Promise<void>;
  handleLogout: () => Promise<void>;
  fetchExperiences: () => Promise<void>;
  fetchTrends: () => Promise<void>;
  
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editingExperience: Experience | null;
  setEditingExperience: (exp: Experience | null) => void;
  selectedPostId: number | null;
  setSelectedPostId: (id: number | null) => void;
}

const GlobalContext = createContext<GlobalContextType | null>(null);

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};

export const GlobalProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [likedPosts, setLikedPosts] = useState(new Set<number>());
  const [scrappedPosts, setScrappedPosts] = useState(new Set<number>());
  
  const [showForm, setShowForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const toggleLike = (postId: number) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const toggleScrap = (postId: number) => {
    setScrappedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const saveUser = async (u: { id: string; email: string; name: string }) => {
    await AsyncStorage.setItem("TrendLog-user", JSON.stringify(u));
    setUser(u);
  };
  
  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("로그아웃 API 실패 (무시)", error);
    } finally {
      await AsyncStorage.multiRemove(["TrendLog-user", "TrendLog-token", "TrendLog-refresh"]);
      setUser(null);
      setExperiences([]);
      setTrends([]);
      setLikedPosts(new Set());
      setScrappedPosts(new Set());
    }
  }, []);

  const fetchExperiences = useCallback(async () => {
    setLoadingExperiences(true);
    try {
      const list = await postsApi.getPopular();
      setExperiences(list);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        Alert.alert("에러", "게시글 로딩에 실패했습니다.");
      }
    } finally {
      setLoadingExperiences(false);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const trendList = await trendsApi.getAll();
      setTrends(trendList);
    } catch (error: any) {
      if (error.response?.status !== 401) {
        Alert.alert("에러", "트렌드 로딩에 실패했습니다.");
      }
    } finally {
      setLoadingTrends(false);
    }
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const token = await initializeApi();
        if (token) {
          try {
            const currentUser = await authApi.validateToken();
            const userData = {
              id: currentUser.id || currentUser.data?.id,
              email: currentUser.email || currentUser.data?.email,
              name: currentUser.name || currentUser.data?.name,
            };
            if (userData.id && userData.email && userData.name) {
              await saveUser(userData);
              await Promise.all([fetchExperiences(), fetchTrends()]);
            } else {
              await handleLogout();
            }
          } catch (error) {
            await handleLogout();
          }
        }
      } catch (error) {
        console.error("❌ 앱 초기화 실패:", error);
      } finally {
        setIsInitializing(false);
      }
    };
    initializeApp();
  }, [fetchExperiences, fetchTrends, handleLogout]);

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      const userData = await authApi.login(credentials);
      await saveUser(userData);
      await initializeApi();
      await Promise.all([fetchExperiences(), fetchTrends()]);
    } catch (error: any) {
      Alert.alert("로그인 실패", "이메일 또는 비밀번호를 확인해주세요.");
      throw error;
    }
  };

  const handleSignup = async (userData: { email: string; password: string; name: string }) => {
    try {
      const response = await authApi.signup(userData);
      const userInfo = {
        id: response.user?.id || response.data?.user?.id || "1",
        email: response.user?.email || response.data?.user?.email || userData.email,
        name: response.user?.name || response.data?.user?.name || userData.name
      };
      await saveUser(userInfo);
      await initializeApi();
      await Promise.all([fetchExperiences(), fetchTrends()]);
    } catch(e) {
      Alert.alert("회원가입 실패", "이미 사용중인 이메일이거나, 입력 정보를 확인해주세요.");
      throw e;
    }
  };

  const value = {
    user, isInitializing, experiences, trends, loadingExperiences, loadingTrends,
    likedPosts, scrappedPosts, toggleLike, toggleScrap,
    handleLogin, handleSignup, handleLogout, fetchExperiences, fetchTrends,
    showForm, setShowForm, editingExperience, setEditingExperience, selectedPostId, setSelectedPostId,
  };

  return <GlobalContext.Provider value={value}>{children}</GlobalContext.Provider>;
};