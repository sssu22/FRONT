// App.tsx - 토큰 문제 해결된 완전한 버전
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  Modal,
  Alert,
  StatusBar,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

// ✅ 인증이 포함된 API 유틸리티 import
import { postsApi, authApi, tokenManager, initializeApi } from "./utils/apiUtils";

// 컴포넌트 imports
import CreateEditPostScreen, {
  SubmitPayload,
  InitialData,
  EmotionType,
} from "./screens/CreateEditPostScreen";
import MyPostsTab from "./screens/MyPostsTab";
import PostDetailScreen from "./screens/PostDetailScreen";

// 인증 컴포넌트들
import WelcomeScreen from "./screens/auth/WelcomeScreen";
import LoginForm from "./screens/auth/LoginForm";
import SignUpForm from "./screens/auth/SignUpForm";

// 타입 정의
export interface Experience {
  id: number;
  title: string;
  date: string;
  location: string;
  emotion: EmotionType;
  tags: string[];
  description: string;
  trendScore: number;
  trendId: number;
  trendName?: string;
  latitude?: number;
  longitude?: number;
}

type TabType = "홈" | "트렌드" | "내 게시물" | "프로필";
type AuthScreen = "welcome" | "login" | "signup";

const TAB_CONFIG: Record<TabType, { icon: string; label: string }> = {
  홈: { icon: "home-outline", label: "홈" },
  트렌드: { icon: "trending-up-outline", label: "트렌드" },
  "내 게시물": { icon: "document-text-outline", label: "내 게시물" },
  프로필: { icon: "person-outline", label: "프로필" },
};

export default function TrendLogApp() {
  // 인증 상태
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("welcome");
  const [isInitializing, setIsInitializing] = useState(true);

  // 데이터 상태
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(false);

  // UI 상태
  const [activeTab, setActiveTab] = useState<TabType>("홈");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  // ✅ 개선된 데이터 로딩 함수
  const fetchExperiences = async () => {
    setLoadingExperiences(true);
    try {
      const list = await postsApi.getAll();
      console.log("✅ 경험 목록 로드 성공:", list.length, "개");
      setExperiences(list);
    } catch (error: any) {
      console.error("❌ 데이터 로딩 실패:", error);
      
      // 401 에러는 인터셉터에서 처리됨
      if (error.response?.status === 401) {
        return;
      }
      
      let msg = "게시글 불러오기에 실패했습니다.";
      if (error.response?.status === 404) msg = "게시글 API를 찾을 수 없습니다.";
      else if (error.response?.status === 500) msg = "서버 오류가 발생했습니다.";
      else if (!error.response) msg = "네트워크 연결을 확인해주세요.";
      Alert.alert("에러", msg);
      setExperiences([]);
    } finally {
      setLoadingExperiences(false);
    }
  };

  // ✅ 앱 초기화 (토큰 복원 + 사용자 정보 로드)
  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        
        // 1. API 토큰 초기화
        const token = await initializeApi();
        console.log("🚀 토큰 초기화:", token ? "토큰 있음" : "토큰 없음");
        
        // 2. 저장된 사용자 정보 복원
        const savedUser = await AsyncStorage.getItem("TrendLog-user");
        if (savedUser && token) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          console.log("✅ 저장된 사용자 정보 복원:", userData);
          
          // 3. 토큰이 유효한지 검증 (선택사항)
          try {
            const currentUser = await authApi.validateToken();
            console.log("✅ 토큰 유효성 검증 완료");
            
            // 서버에서 받은 최신 정보로 업데이트
            if (currentUser) {
              const updatedUser = {
                id: currentUser.id || currentUser.data?.id || userData.id,
                email: currentUser.email || currentUser.data?.email || userData.email,
                name: currentUser.name || currentUser.data?.name || userData.name
              };
              await saveUser(updatedUser);
            }
          } catch (error) {
            console.warn("⚠️ 토큰 만료, 로그아웃 처리");
            await handleLogout();
            return;
          }
        }
        
        // 4. 초기 데이터 로드
        if (token && user) {
          await fetchExperiences();
        }
        
      } catch (error) {
        console.error("❌ 앱 초기화 실패:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  // ✅ 인증 핸들러들 (토큰 관리 포함)
  const saveUser = async (u: { id: string; email: string; name: string }) => {
    await AsyncStorage.setItem("TrendLog-user", JSON.stringify(u));
    setUser(u);
  };

  // ✅ 로그인 핸들러 (토큰 저장 확인 강화)
  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      console.log("📤 로그인 시도:", credentials.email);
      
      // 1. 로그인 API 호출 (authApi.login에서 자동으로 토큰 저장됨)
      const response = await authApi.login(credentials);
      console.log("🔐 로그인 응답:", response);
      
      // 2. 토큰이 제대로 저장되었는지 확인
      let savedToken = await tokenManager.getToken();
      console.log("💾 1차 토큰 확인:", savedToken ? "있음" : "없음");
      
      // 3. 토큰이 저장되었는지 재확인 (authApi.login에서 자동 저장됨)
      savedToken = await tokenManager.getToken();
      console.log("💾 2차 토큰 확인:", savedToken ? "있음" : "없음");
      
      // 4. 여전히 토큰이 없다면 오류
      if (!savedToken) {
        console.error("❌ 로그인 후에도 토큰이 없음");
        console.error("📋 로그인 응답 구조:", Object.keys(response || {}));
        Alert.alert("로그인 오류", "서버에서 인증 토큰을 받지 못했습니다.");
        return;
      }
      
      // 5. 사용자 정보 저장
      const userData = {
        id: response.user?.id || response.data?.user?.id || response.id || "1",
        email: response.user?.email || response.data?.user?.email || response.email || credentials.email,
        name: response.user?.name || response.data?.user?.name || response.name || "사용자"
      };
      
      await saveUser(userData);
      console.log("✅ 로그인 완료:", userData);
      
      // 6. API 헤더 업데이트 강제 실행
      await initializeApi();
      const finalToken = await tokenManager.getToken();
      console.log("🔄 API 재초기화 후 토큰:", finalToken ? "있음" : "없음");
      
      // 7. 로그인 후 데이터 로드
      await fetchExperiences();
      
    } catch (error: any) {
      console.error("❌ 로그인 실패:", error);
      let msg = "로그인에 실패했습니다.";
      if (error.response?.status === 401) msg = "이메일 또는 비밀번호가 잘못되었습니다.";
      else if (error.response?.status === 500) msg = "서버 오류가 발생했습니다.";
      else if (!error.response) msg = "네트워크 연결을 확인해주세요.";
      Alert.alert("로그인 실패", msg);
      throw error;
    }
  };

  // ✅ 회원가입 핸들러 (조정사항 적용)
  const handleSignup = async (userData: { email: string; password: string; name: string }) => {
    try {
      console.log("📤 회원가입 시도:", userData.email);
      
      const response = await authApi.signup(userData);
      
      const userInfo = {
        id: response.user?.id || response.data?.user?.id || response.id || "1",
        email: response.user?.email || response.data?.user?.email || response.email || userData.email,
        name: response.user?.name || response.data?.user?.name || response.name || userData.name
      };
      
      await saveUser(userInfo);
      console.log("✅ 회원가입 완료:", userInfo);
      
      // 회원가입 후 데이터 로드
      await fetchExperiences();
      
    } catch (error: any) {
      console.error("❌ 회원가입 실패:", error);
      let msg = "회원가입에 실패했습니다.";
      if (error.response?.status === 409) msg = "이미 존재하는 이메일입니다.";
      else if (error.response?.status === 400) msg = "입력 정보를 확인해주세요.";
      else if (!error.response) msg = "네트워크 연결을 확인해주세요.";
      Alert.alert("회원가입 실패", msg);
      throw error;
    }
  };

  // ✅ 로그아웃 핸들러
  const handleLogout = async () => {
    try {
      // 서버에 로그아웃 요청 + 로컬 토큰 삭제
      await authApi.logout();
      
      // 로컬 사용자 정보 삭제
      await AsyncStorage.removeItem("TrendLog-user");
      
      // 상태 초기화
      setUser(null);
      setAuthScreen("welcome");
      setActiveTab("홈");
      setSearchQuery("");
      setSelectedPostId(null);
      setEditingExperience(null);
      setShowForm(false);
      setExperiences([]);
      
      console.log("✅ 로그아웃 완료");
    } catch (error) {
      console.error("❌ 로그아웃 실패:", error);
    }
  };

  // 경험 관련 핸들러들
  const handleExperienceClick = (exp: Experience) => setSelectedPostId(exp.id);
  const handleCloseDetail = () => setSelectedPostId(null);
  const handleEditClick = (exp: Experience) => {
    console.log("✅ 수정 클릭:", exp);
    setEditingExperience(exp);
    setShowForm(true);
  };

  // ✅ 개선된 게시글 생성 핸들러 (토큰 확인 강화)
  const handleAddExperience = async (p: SubmitPayload) => {
    try {
      console.log("📤 생성 시작:", p);
      
      // 1. 토큰 상태 다중 확인
      const currentToken = await tokenManager.getToken();
      console.log("🔑 현재 토큰:", currentToken ? `있음 (${currentToken.substring(0, 20)}...)` : "없음");
      
      // 2. 토큰이 없으면 다시 로그인 요청
      if (!currentToken) {
        console.error("❌ 토큰 없음 - 재로그인 필요");
        Alert.alert("인증 필요", "다시 로그인해주세요.", [
          { text: "확인", onPress: () => handleLogout() }
        ]);
        return;
      }
      
      // 3. AsyncStorage에서 직접 토큰 확인
      const directToken = await AsyncStorage.getItem("TrendLog-token");
      console.log("🔍 AsyncStorage 토큰:", directToken ? "있음" : "없음");
      
      // 4. API 호출 전 토큰 다시 설정
      await initializeApi();
      
      // 5. 실제 API 호출
      console.log("🚀 API 호출 시작...");
      await postsApi.create(p);
      console.log("✅ 생성 성공");
      
      await fetchExperiences();
      setShowForm(false);
      Alert.alert("성공", "게시글이 등록되었습니다.");
      
    } catch (error: any) {
      console.error("❌ 생성 실패:", error);
      console.error("❌ 에러 상세:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        headers: error.response?.headers
      });
      
      // 401 에러는 인터셉터에서 처리됨
      if (error.response?.status === 401) {
        // 토큰 상태 재확인
        const tokenAfterError = await tokenManager.getToken();
        console.log("🔍 401 에러 후 토큰 상태:", tokenAfterError ? "있음" : "없음");
        
        Alert.alert("인증 오류", "다시 로그인해주세요.");
        await handleLogout();
        return;
      }
      
      let msg = "게시글 추가에 실패했습니다.";
      if (error.response?.status === 400) msg = "입력 데이터를 확인해주세요.";
      else if (error.response?.status === 500) msg = "서버 오류가 발생했습니다.";
      Alert.alert("추가 실패", msg);
    }
  };

  const handleUpdateExperience = async (p: SubmitPayload) => {
    if (!editingExperience) return;
    try {
      console.log("📤 수정 시작:", p);
      await postsApi.update(editingExperience.id, p);
      console.log("✅ 수정 성공");
      await fetchExperiences();
      setShowForm(false);
      setEditingExperience(null);
      Alert.alert("성공", "게시글이 수정되었습니다.");
    } catch (error: any) {
      console.error("❌ 수정 실패:", error);
      
      // 401 에러는 인터셉터에서 처리됨
      if (error.response?.status === 401) {
        Alert.alert("인증 오류", "다시 로그인해주세요.");
        await handleLogout();
        return;
      }
      
      let msg = "게시글 수정에 실패했습니다.";
      if (error.response?.status === 404) msg = "게시글을 찾을 수 없습니다.";
      else if (error.response?.status === 400) msg = "입력 데이터를 확인해주세요.";
      Alert.alert("수정 실패", msg);
    }
  };

  const handleDeleteExperience = (id: number) => {
    Alert.alert("삭제 확인", "정말 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: async () => {
          try {
            console.log("🗑️ 삭제 시작:", id);
            await postsApi.delete(id);
            console.log("✅ 삭제 성공");
            await fetchExperiences();
            if (selectedPostId === id) setSelectedPostId(null);
            Alert.alert("성공", "게시글이 삭제되었습니다.");
          } catch (error: any) {
            console.error("❌ 삭제 실패:", error);
            
            // 401 에러는 인터셉터에서 처리됨
            if (error.response?.status === 401) {
              Alert.alert("인증 오류", "다시 로그인해주세요.");
              await handleLogout();
              return;
            }
            
            let msg = "게시글 삭제에 실패했습니다.";
            if (error.response?.status === 404) msg = "게시글을 찾을 수 없습니다.";
            Alert.alert("삭제 실패", msg);
          }
        },
      },
    ]);
  };

  // ✅ 토큰 디버깅을 위한 임시 함수
  const debugTokenStatus = async () => {
    try {
      const token = await tokenManager.getToken();
      const asyncToken = await AsyncStorage.getItem("TrendLog-token");
      const user = await AsyncStorage.getItem("TrendLog-user");
      
      Alert.alert("토큰 디버그", 
        `TokenManager: ${token ? "있음" : "없음"}\n` +
        `AsyncStorage: ${asyncToken ? "있음" : "없음"}\n` +
        `User: ${user ? "있음" : "없음"}\n` +
        `같은 토큰: ${token === asyncToken ? "예" : "아니오"}`
      );
    } catch (error) {
      Alert.alert("디버그 오류", String(error));
    }
  };

  // 검색 필터링
  const filteredExperiences = Array.isArray(experiences)
    ? experiences.filter((exp) => {
        const q = searchQuery.toLowerCase();
        return (
          exp.title.toLowerCase().includes(q) ||
          exp.description.toLowerCase().includes(q) ||
          exp.location.toLowerCase().includes(q) ||
          exp.tags.some((t) => t.toLowerCase().includes(q))
        );
      })
    : [];

  // ✅ 초기화 로딩 화면
  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#7C3AED', marginBottom: 16 }}>
          TrendLog
        </Text>
        <Text style={{ color: '#6B7280' }}>앱을 초기화하는 중...</Text>
      </SafeAreaView>
    );
  }

  // 인증 전 화면들
  if (!user) {
    if (authScreen === "login") {
      return (
        <LoginForm
          onLogin={handleLogin}
          onShowSignup={() => setAuthScreen("signup")}
          onBack={() => setAuthScreen("welcome")}
        />
      );
    }
    if (authScreen === "signup") {
      return (
        <SignUpForm
          onSignup={handleSignup}
          onShowLogin={() => setAuthScreen("login")}
          onBack={() => setAuthScreen("welcome")}
        />
      );
    }
    return (
      <WelcomeScreen
        onShowLogin={() => setAuthScreen("login")}
        onShowSignup={() => setAuthScreen("signup")}
      />
    );
  }

  // 탭 콘텐츠 렌더링 함수
  const renderTabContent = () => {
    switch (activeTab) {
      case "홈":
        return (
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>홈 화면</Text>
            {filteredExperiences.length > 0 ? (
              filteredExperiences.map((exp) => (
                <TouchableOpacity
                  key={exp.id}
                  style={{
                    padding: 12,
                    backgroundColor: '#F3F4F6',
                    borderRadius: 8,
                    marginBottom: 8
                  }}
                  onPress={() => handleExperienceClick(exp)}
                >
                  <Text style={{ fontWeight: 'bold' }}>{exp.title}</Text>
                  <Text style={{ color: '#6B7280', fontSize: 12 }}>
                    {exp.location} • {new Date(exp.date).toLocaleDateString('ko-KR')}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ textAlign: 'center', color: '#6B7280' }}>
                아직 작성된 게시글이 없습니다.
              </Text>
            )}
          </View>
        );
      
      case "트렌드":
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>트렌드 화면</Text>
            <Text style={{ color: '#6B7280', marginTop: 8 }}>준비 중입니다...</Text>
          </View>
        );
      
      case "내 게시물":
        return (
          <MyPostsTab
            onExperienceClick={handleExperienceClick}
            onEditExperience={handleEditClick}
            onDeleteExperience={handleDeleteExperience}
          />
        );
      
      case "프로필":
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>프로필</Text>
            <Text style={{ marginBottom: 8 }}>이름: {user?.name}</Text>
            <Text style={{ marginBottom: 24 }}>이메일: {user?.email}</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#EF4444', padding: 12, borderRadius: 8 }}
              onPress={handleLogout}
            >
              <Text style={{ color: 'white', fontWeight: '600' }}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        );
      
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>TrendLog</Text>
          <Text style={styles.greeting}>안녕하세요, {user.name}님!</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Search Bar (홈 탭일 때만 표시) */}
      {activeTab === "홈" && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="경험 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      )}

      {/* Main Content */}
      <View style={styles.mainContent}>
        {loadingExperiences ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text>로딩중...</Text>
          </View>
        ) : (
          renderTabContent()
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => {
          const cfg = TAB_CONFIG[tab];
          const active = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              style={styles.navButton}
              onPress={() => {
                setActiveTab(tab);
                setSearchQuery("");
                setSelectedPostId(null);
              }}
            >
              <Ionicons name={cfg.icon as any} size={24} color={active ? "#7C3AED" : "#9CA3AF"} />
              <Text style={[styles.navLabel, { color: active ? "#7C3AED" : "#9CA3AF" }]}>
                {cfg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Create/Edit Modal */}
      <Modal 
        visible={showForm} 
        animationType="slide" 
        onRequestClose={() => { 
          setShowForm(false); 
          setEditingExperience(null); 
        }}
      >
        <SafeAreaView style={{ flex: 1 }}>
          <CreateEditPostScreen
            onSubmit={(payload) => {
              if (editingExperience) {
                handleUpdateExperience(payload);
              } else {
                handleAddExperience(payload);
              }
            }}
            onClose={() => { 
              setShowForm(false); 
              setEditingExperience(null); 
            }}
            initialData={
              editingExperience ? ({
                id: editingExperience.id,
                title: editingExperience.title,
                date: editingExperience.date,
                location: editingExperience.location,
                emotion: editingExperience.emotion,
                tags: editingExperience.tags,
                description: editingExperience.description,
                trendId: editingExperience.trendId,
                latitude: editingExperience.latitude || 0,
                longitude: editingExperience.longitude || 0,
              } as InitialData) : null
            }
          />
        </SafeAreaView>
      </Modal>

      {/* Detail Modal */}
      <Modal 
        visible={selectedPostId !== null} 
        animationType="slide" 
        onRequestClose={handleCloseDetail}
      >
        <SafeAreaView style={{ flex: 1 }}>
          {selectedPostId !== null && (
            <PostDetailScreen 
              postId={selectedPostId} 
              onClose={handleCloseDetail} 
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F9FAFB" 
  },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { 
    flex: 1 
  },
  appTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#7C3AED" 
  },
  greeting: { 
    fontSize: 14, 
    color: "#6B7280" 
  },
  addButton: { 
    backgroundColor: "#7C3AED", 
    padding: 8, 
    borderRadius: 8 
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  mainContent: { 
    flex: 1 
  },
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
    paddingVertical: 8,
  },
  navButton: { 
    flex: 1, 
    alignItems: "center" 
  },
  navLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
  },
});