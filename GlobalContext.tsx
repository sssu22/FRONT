import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { Experience, Trend, User, Comment } from './types'; // types.ts 경로 확인
import { authApi, postsApi, trendsApi, initializeApi } from './utils/apiUtils'; // apiUtils.ts 경로 확인

interface GlobalContextType {
  user: User | null;
  isInitializing: boolean;
  
  experiences: Experience[];
  trends: Trend[];
  loadingExperiences: boolean;
  loadingTrends: boolean;

  showForm: boolean;
  setShowForm: (show: boolean) => void;
  editingExperience: Experience | null;
  setEditingExperience: (exp: Experience | null) => void;
  
  selectedPostId: number | null;
  setSelectedPostId: (id: number | null) => void;
  selectedTrendId: number | null;
  setSelectedTrendId: (id: number | null) => void;

  handleLogin: (creds: { email: string; password: string }) => Promise<void>;
  handleSignup: (user: { email: string; password: string; name: string }) => Promise<void>;
  handleLogout: () => Promise<void>;
  fetchExperiences: () => Promise<void>;
  fetchTrends: () => Promise<void>;
  
  likedPosts: Set<number>;
  scrappedPosts: Set<number>;
  toggleLike: (postId: number) => void;
  toggleScrap: (postId: number) => void;
  setLikeStatus: (postId: number, isLiked: boolean) => void;
  setScrapStatus: (postId: number, isScrapped: boolean) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [selectedTrendId, setSelectedTrendId] = useState<number | null>(null);
  
  const [likedPosts, setLikedPosts] = useState(new Set<number>());
  const [scrappedPosts, setScrappedPosts] = useState(new Set<number>());

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = await initializeApi();
        if (token) {
          const profile = await authApi.validateToken();
          setUser(profile.data);
        }
      } catch (error) {
        console.log("초기화 중 토큰 검증 실패 (로그인 필요)");
      } finally {
        setIsInitializing(false);
      }
    };
    fetchInitialData();
  }, []);

  const fetchExperiences = useCallback(async () => {
    setLoadingExperiences(true);
    try {
      const data = await postsApi.getAll();
      setExperiences(data);
    } catch (error) {
      console.error("게시글 목록 로딩 실패:", error);
    } finally {
      setLoadingExperiences(false);
    }
  }, []);

  const fetchTrends = useCallback(async () => {
    setLoadingTrends(true);
    try {
      const data = await trendsApi.getAll();
      setTrends(data);
    } catch (error) {
      console.error("트렌드 목록 로딩 실패:", error);
    } finally {
      setLoadingTrends(false);
    }
  }, []);

  const handleLogin = useCallback(async (creds: { email: string; password: string }) => {
    try {
      const loggedInUser = await authApi.login(creds);
      setUser(loggedInUser);
    } catch (error) {
      Alert.alert("로그인 실패", "이메일 또는 비밀번호를 확인해주세요.");
      throw error;
    }
  }, []);

  const handleSignup = useCallback(async (userData: { email: string; password: string; name: string }) => {
    try {
      await authApi.signup(userData);
      await handleLogin({ email: userData.email, password: userData.password });
    } catch (error) {
      Alert.alert("회원가입 실패", "오류가 발생했습니다. 다시 시도해주세요.");
      throw error;
    }
  }, [handleLogin]);

  const handleLogout = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    setExperiences([]);
    setTrends([]);
    setLikedPosts(new Set());
    setScrappedPosts(new Set());
  }, []);

  const toggleLike = useCallback((postId: number) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }, []);
  
  const toggleScrap = useCallback((postId: number) => {
    setScrappedPosts(prev => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  }, []);

  const setLikeStatus = useCallback((postId: number, isLiked: boolean) => {
    setLikedPosts(prev => {
        const next = new Set(prev);
        if (isLiked) {
            next.add(postId);
        } else {
            next.delete(postId);
        }
        return next;
    });
  }, []);

  const setScrapStatus = useCallback((postId: number, isScrapped: boolean) => {
    setScrappedPosts(prev => {
        const next = new Set(prev);
        if (isScrapped) {
            next.add(postId);
        } else {
            next.delete(postId);
        }
        return next;
    });
  }, []);
  
  const value = useMemo(() => ({
    user,
    isInitializing,
    experiences,
    trends,
    loadingExperiences,
    loadingTrends,
    showForm,
    setShowForm,
    editingExperience,
    setEditingExperience,
    selectedPostId,
    setSelectedPostId,
    selectedTrendId,
    setSelectedTrendId,
    handleLogin,
    handleSignup,
    handleLogout,
    fetchExperiences,
    fetchTrends,
    likedPosts,
    scrappedPosts,
    toggleLike,
    toggleScrap,
    setLikeStatus,
    setScrapStatus,
  }), [
    user, isInitializing, experiences, trends, loadingExperiences, loadingTrends, 
    showForm, editingExperience, selectedPostId, selectedTrendId, likedPosts, scrappedPosts,
    handleLogin, handleSignup, handleLogout, fetchExperiences, fetchTrends,
    toggleLike, toggleScrap, setLikeStatus, setScrapStatus
  ]);

  return (
    <GlobalContext.Provider value={value}>
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContext = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalContext must be used within a GlobalProvider');
  }
  return context;
};