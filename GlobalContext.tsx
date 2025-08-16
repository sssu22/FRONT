import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { Experience, Trend, User } from './types';
import { authApi, postsApi, trendsApi, initializeApi } from './utils/apiUtils';

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

  // --- 스크랩/좋아요 상태 및 함수 분리 ---
  likedPosts: Set<number>;
  scrappedPosts: Set<number>;
  scrappedTrends: Set<number>; // 트렌드 스크랩 상태 추가
  togglePostLike: (postId: number) => Promise<void>;
  togglePostScrap: (postId: number) => Promise<void>;
  toggleTrendScrap: (trendId: number) => Promise<void>; // 트렌드 스크랩 함수 추가
  setLikeStatus: (postId: number, isLiked: boolean) => void;
  setScrapStatus: (postId: number, isScrapped: boolean) => void;
  setTrendScrapStatus: (trendId: number, isScrapped: boolean) => void; // 개별 트렌드 상태 동기화 함수
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
  const [scrappedTrends, setScrappedTrends] = useState(new Set<number>());

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
    if (!user) return;
    setLoadingExperiences(true);
    try {
      const data = await postsApi.getMyPosts();
      setExperiences(data);
      const newScrappedPosts = new Set<number>();
      const newLikedPosts = new Set<number>();
      data.forEach(post => {
        if (post.scrapped) newScrappedPosts.add(post.id);
        if (post.liked) newLikedPosts.add(post.id);
      });
      setScrappedPosts(newScrappedPosts);
      setLikedPosts(newLikedPosts);
    } catch (error) {
      console.error("게시글 목록 로딩 실패:", error);
    } finally {
      setLoadingExperiences(false);
    }
  }, [user]);

  const fetchTrends = useCallback(async () => {
    if (!user) return;
    setLoadingTrends(true);
    try {
      const data = await trendsApi.getAll();
      setTrends(data);
      const newScrappedTrends = new Set<number>();
      data.forEach(trend => {
        if (trend.scrapped) newScrappedTrends.add(trend.id);
      });
      setScrappedTrends(newScrappedTrends);
    } catch (error) {
      console.error("트렌드 목록 로딩 실패:", error);
    } finally {
      setLoadingTrends(false);
    }
  }, [user]);

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
    setScrappedTrends(new Set());
  }, []);

  const togglePostLike = useCallback(async (postId: number) => {
    const originalState = new Set(likedPosts);
    const newState = new Set(likedPosts);
    if (newState.has(postId)) newState.delete(postId);
    else newState.add(postId);
    setLikedPosts(newState);

    try {
      await postsApi.likePost(postId);
      await fetchExperiences(); // ✨ 좋아요 후 최신 정보 다시 가져오기
    } catch (error) {
      setLikedPosts(originalState);
      Alert.alert("오류", "좋아요 처리에 실패했습니다.");
    }
  }, [likedPosts, fetchExperiences]);

  const togglePostScrap = useCallback(async (postId: number) => {
    const originalState = new Set(scrappedPosts);
    const newState = new Set(scrappedPosts);
    if (newState.has(postId)) newState.delete(postId);
    else newState.add(postId);
    setScrappedPosts(newState);

    try {
      await postsApi.scrapPost(postId);
      await fetchExperiences(); // ✨ 스크랩 후 최신 정보 다시 가져오기
    } catch (error) {
      setScrappedPosts(originalState);
      Alert.alert("오류", "게시물 스크랩 처리에 실패했습니다.");
    }
  }, [scrappedPosts, fetchExperiences]);

  const toggleTrendScrap = useCallback(async (trendId: number) => {
    const originalState = new Set(scrappedTrends);
    const newState = new Set(scrappedTrends);
    if (newState.has(trendId)) newState.delete(trendId);
    else newState.add(trendId);
    setScrappedTrends(newState);

    try {
      await trendsApi.scrap(trendId);
      await fetchTrends(); // 트렌드 스크랩 후 최신 정보 다시 가져오기
    } catch (error) {
      setScrappedTrends(originalState);
      Alert.alert("오류", "트렌드 스크랩 처리에 실패했습니다.");
    }
  }, [scrappedTrends, fetchTrends]);

  const setLikeStatus = useCallback((postId: number, isLiked: boolean) => {
    setLikedPosts(prev => {
      const next = new Set(prev);
      if (isLiked) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }, []);

  const setScrapStatus = useCallback((postId: number, isScrapped: boolean) => {
    setScrappedPosts(prev => {
      const next = new Set(prev);
      if (isScrapped) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }, []);

  const setTrendScrapStatus = useCallback((trendId: number, isScrapped: boolean) => {
    setScrappedTrends(prev => {
      const next = new Set(prev);
      if (isScrapped) {
        next.add(trendId);
      } else {
        next.delete(trendId);
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
    scrappedTrends,
    togglePostLike,
    togglePostScrap,
    toggleTrendScrap,
    setLikeStatus,
    setScrapStatus,
    setTrendScrapStatus,
  }), [
    user, isInitializing, experiences, trends, loadingExperiences, loadingTrends,
    showForm, editingExperience, selectedPostId, selectedTrendId,
    likedPosts, scrappedPosts, scrappedTrends,
    handleLogin, handleSignup, handleLogout, fetchExperiences, fetchTrends,
    togglePostLike, togglePostScrap, toggleTrendScrap, setLikeStatus, setScrapStatus, setTrendScrapStatus
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