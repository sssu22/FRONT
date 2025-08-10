// App.tsx
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
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { postsApi, authApi, tokenManager, initializeApi } from "./utils/apiUtils";
import CreateEditPostScreen, {
  SubmitPayload,
  InitialData,
} from "./screens/CreateEditPostScreen";
import MyPostsTab from "./screens/MyPostsTab";
import PostDetailScreen from "./screens/PostDetailScreen";
import WelcomeScreen from "./screens/auth/WelcomeScreen";
import LoginForm from "./screens/auth/LoginForm";
import SignUpForm from "./screens/auth/SignUpForm";

export const emotionLabels = {
  joy: "기쁨", excitement: "흥분", nostalgia: "향수", surprise: "놀람", love: "사랑",
  regret: "아쉬움", sadness: "슬픔", irritation: "짜증", anger: "화남", embarrassment: "당황",
} as const;
export type EmotionType = keyof typeof emotionLabels;

export interface Comment {
  id: number;
  username: string;
  time: string;
  content: string;
  likeCount: number;
  imageUrl?: string;
  liked: boolean;
}

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
  viewCount?: number;
  likeCount?: number;
  commentCount?: number;
  scrapCount?: number;
  comments?: Comment[];
  liked?: boolean;
  scrapped?: boolean;
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
  const [user, setUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("welcome");
  const [isInitializing, setIsInitializing] = useState(true);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loadingExperiences, setLoadingExperiences] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("홈");
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);

  const fetchExperiences = async () => {
    setLoadingExperiences(true);
    try {
      const list = await postsApi.getPopular();
      setExperiences(list);
    } catch (error: any) {
      let msg = "게시글을 불러오는데 실패했습니다.";
      if (error.response?.status === 500) msg = "서버 오류가 발생했습니다.";
      Alert.alert("에러", msg);
      setExperiences([]);
    } finally {
      setLoadingExperiences(false);
    }
  };

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setIsInitializing(true);
        const token = await initializeApi();
        const savedUser = await AsyncStorage.getItem("TrendLog-user");
        if (savedUser && token) {
          const userData = JSON.parse(savedUser);
          setUser(userData);
          try {
            const currentUser = await authApi.validateToken();
            if (currentUser) {
              const updatedUser = {
                id: currentUser.id || currentUser.data?.id || userData.id,
                email: currentUser.email || currentUser.data?.email || userData.email,
                name: currentUser.name || currentUser.data?.name || userData.name,
              };
              await saveUser(updatedUser);
            }
          } catch (error: any) {
            const status = error?.response?.status;
            if (status === 401 || status === 403) {
              await handleLogout();
              return;
            }
          }
        }
        if (await tokenManager.getToken()) {
          await fetchExperiences();
        }
      } catch (error) {
      } finally {
        setIsInitializing(false);
      }
    };
    initializeApp();
  }, []);

  const saveUser = async (u: { id: string; email: string; name: string }) => {
    await AsyncStorage.setItem("TrendLog-user", JSON.stringify(u));
    setUser(u);
  };

  const handleLogin = async (credentials: { email: string; password: string }) => {
    try {
      const userData = await authApi.login(credentials);
      await saveUser(userData);
      await fetchExperiences();
    } catch (error: any) {
      let msg = "로그인에 실패했습니다.";
      if (error.response?.status === 401) msg = "이메일 또는 비밀번호가 잘못되었습니다.";
      else if (error.message) msg = error.message;
      Alert.alert("로그인 실패", msg);
      throw error;
    }
  };

  const handleSignup = async (userData: { email: string; password: string; name: string }) => {
    try {
      const response = await authApi.signup(userData);
      const saved = {
        id: response.user?.id || response.data?.user?.id || response.id || "1",
        email: response.user?.email || response.data?.user?.email || response.email || userData.email,
        name: response.user?.name || response.data?.user?.name || response.name || userData.name,
      };
      await saveUser(saved);
      await fetchExperiences();
    } catch (error: any) {
      let msg = "회원가입에 실패했습니다.";
      if (error.response?.status === 409) msg = "이미 존재하는 이메일입니다.";
      Alert.alert("회원가입 실패", msg);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
    } finally {
      await AsyncStorage.removeItem("TrendLog-user");
      setUser(null);
      setAuthScreen("welcome");
      setActiveTab("홈");
      setSelectedPostId(null);
      setExperiences([]);
    }
  };

  const handleExperienceClick = (exp: Experience) => setSelectedPostId(exp.id);
  const handleCloseDetail = () => setSelectedPostId(null);
  const handleEditClick = (exp: Experience) => {
    setEditingExperience(exp);
    setShowForm(true);
  };

  const handleAddExperience = async (p: SubmitPayload) => {
    try {
      await postsApi.create(p);
      await fetchExperiences();
      setShowForm(false);
      Alert.alert("성공", "게시글이 등록되었습니다.");
    } catch (error: any) {
      if (error.response?.status === 401) {
        await handleLogout();
        return;
      }
      Alert.alert("추가 실패", "게시글 추가에 실패했습니다.");
    }
  };

  const handleUpdateExperience = async (p: SubmitPayload) => {
    if (!editingExperience) return;
    try {
      await postsApi.update(editingExperience.id, p);
      await fetchExperiences();
      setShowForm(false);
      setEditingExperience(null);
      Alert.alert("성공", "게시글이 수정되었습니다.");
    } catch (error: any) {
      if (error.response?.status === 401) {
        await handleLogout();
        return;
      }
      Alert.alert("수정 실패", "게시글 수정에 실패했습니다.");
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
            await postsApi.delete(id);
            await fetchExperiences();
            if (selectedPostId === id) setSelectedPostId(null);
          } catch (error: any) {
            if (error.response?.status === 401) {
              await handleLogout();
              return;
            }
            Alert.alert("삭제 실패", "게시글 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

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

  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ fontSize: 24, fontWeight: "bold", color: "#7C3AED", marginBottom: 16 }}>TrendLog</Text>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={{ color: "#6B7280", marginTop: 16 }}>앱을 초기화하는 중...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    if (authScreen === "login") {
      return <LoginForm onLogin={handleLogin} onShowSignup={() => setAuthScreen("signup")} onBack={() => setAuthScreen("welcome")} />;
    }
    if (authScreen === "signup") {
      return <SignUpForm onSignup={handleSignup} onShowLogin={() => setAuthScreen("login")} onBack={() => setAuthScreen("welcome")} />;
    }
    return <WelcomeScreen onShowLogin={() => setAuthScreen("login")} onShowSignup={() => setAuthScreen("signup")} />;
  }
  
  const renderTabContent = () => {
    switch (activeTab) {
      case "홈":
        return (
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>홈 화면</Text>
            {filteredExperiences.length > 0 ? (
              filteredExperiences.map((exp) => (
                <TouchableOpacity key={exp.id} style={styles.homeCard} onPress={() => handleExperienceClick(exp)}>
                  <Text style={{ fontWeight: "bold" }}>{exp.title}</Text>
                  <Text style={{ color: "#6B7280", fontSize: 12 }}>{exp.location} • {new Date(exp.date).toLocaleDateString("ko-KR")}</Text>
                </TouchableOpacity>
              ))
            ) : (<Text style={{ textAlign: "center", color: "#6B7280" }}>아직 작성된 게시글이 없습니다.</Text>)}
          </View>
        );
      case "트렌드":
        return (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <Text style={{ fontSize: 18, fontWeight: "bold" }}>트렌드 화면</Text>
            <Text style={{ color: "#6B7280", marginTop: 8 }}>준비 중입니다...</Text>
          </View>
        );
      case "내 게시물":
        return <MyPostsTab onExperienceClick={handleExperienceClick} onEditExperience={handleEditClick} onDeleteExperience={handleDeleteExperience} />;
      case "프로필":
        return (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center", padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>프로필</Text>
            <Text style={{ marginBottom: 8 }}>이름: {user?.name}</Text>
            <Text style={{ marginBottom: 24 }}>이메일: {user?.email}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={{ color: "white", fontWeight: "600" }}>로그아웃</Text>
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
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.appTitle}>TrendLog</Text>
          <Text style={styles.greeting}>안녕하세요, {user.name}님!</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      {activeTab === "홈" && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput style={styles.searchInput} placeholder="경험 검색..." value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      )}
      <View style={styles.mainContent}>{loadingExperiences ? (<ActivityIndicator size="large" color="#7C3AED" />) : (renderTabContent())}</View>
      <View style={styles.bottomNav}>
        {(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => {
          const cfg = TAB_CONFIG[tab];
          const active = tab === activeTab;
          return (
            <TouchableOpacity key={tab} style={styles.navButton} onPress={() => { setActiveTab(tab); }}>
              <Ionicons name={cfg.icon as any} size={24} color={active ? "#7C3AED" : "#9CA3AF"} />
              <Text style={[styles.navLabel, { color: active ? "#7C3AED" : "#9CA3AF" }]}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Modal visible={showForm} animationType="slide" onRequestClose={() => {setShowForm(false); setEditingExperience(null);}}>
        <SafeAreaView style={{ flex: 1 }}>
          <CreateEditPostScreen
            onSubmit={(payload) => { editingExperience ? handleUpdateExperience(payload) : handleAddExperience(payload); }}
            onClose={() => { setShowForm(false); setEditingExperience(null); }}
            initialData={editingExperience ? ({ ...editingExperience } as InitialData) : null}
          />
        </SafeAreaView>
      </Modal>
      <Modal visible={selectedPostId !== null} animationType="slide" onRequestClose={handleCloseDetail}>
        <SafeAreaView style={{ flex: 1 }}>
          {selectedPostId !== null && <PostDetailScreen postId={selectedPostId} onClose={handleCloseDetail} />}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flex: 1 },
  appTitle: { fontSize: 20, fontWeight: "bold", color: "#7C3AED" },
  greeting: { fontSize: 14, color: "#6B7280" },
  addButton: { backgroundColor: "#7C3AED", padding: 8, borderRadius: 8 },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  mainContent: { flex: 1 },
  bottomNav: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "#FFF",
    paddingVertical: 8,
  },
  navButton: { flex: 1, alignItems: "center" },
  navLabel: { fontSize: 10, fontWeight: "500", marginTop: 4 },
  homeCard: {
    padding: 12,
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    marginBottom: 8,
  },
  logoutButton: {
    backgroundColor: "#EF4444",
    padding: 12,
    borderRadius: 8,
  },
});