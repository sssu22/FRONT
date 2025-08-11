// App.tsx
import React, { useState } from "react";
import {
  View, Text, SafeAreaView, Modal, Alert, StatusBar, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { postsApi } from "./utils/apiUtils";
import CreateEditPostScreen, { SubmitPayload, InitialData } from "./screens/CreateEditPostScreen";
import MyPostsTab from "./screens/MyPostsTab";
import PostDetailScreen from "./screens/PostDetailScreen";
import WelcomeScreen from "./screens/auth/WelcomeScreen";
import LoginForm from "./screens/auth/LoginForm";
import SignUpForm from "./screens/auth/SignUpForm";
import TrendsTab from "./screens/TrendsTab";
import { Experience, Trend } from "./types";
import { GlobalProvider, useGlobalContext } from "./GlobalContext";

type TabType = "홈" | "트렌드" | "내 게시물" | "프로필";
type AuthScreen = "welcome" | "login" | "signup";

export default function App() {
  return (
    <GlobalProvider>
      <AppContent />
    </GlobalProvider>
  );
}

const TAB_CONFIG: Record<TabType, { icon: string; label: string }> = {
  홈: { icon: "home-outline", label: "홈" },
  트렌드: { icon: "trending-up-outline", label: "트렌드" },
  "내 게시물": { icon: "document-text-outline", label: "내 게시물" },
  프로필: { icon: "person-outline", label: "프로필" },
};

function AppContent() {
  const {
    user, isInitializing, experiences, trends, loadingExperiences, loadingTrends,
    handleLogin, handleSignup, handleLogout, fetchExperiences,
    showForm, setShowForm, editingExperience, setEditingExperience, selectedPostId, setSelectedPostId,
  } = useGlobalContext();

  const [authScreen, setAuthScreen] = useState<AuthScreen>("welcome");
  const [activeTab, setActiveTab] = useState<TabType>("홈");
  const [searchQuery, setSearchQuery] = useState("");

  const handleExperienceClick = (exp: Experience) => setSelectedPostId(exp.id);
  const handleCloseDetail = () => setSelectedPostId(null);
  const handleEditClick = (exp: Experience) => {
    setEditingExperience(exp);
    setShowForm(true);
  };
  
  const handleTrendPress = (trendId: number) => {
    setSelectedPostId(null);
    setActiveTab("트렌드");
    console.log(`트렌드 #${trendId} 상세 보기로 이동`);
  };

  const handleAddExperience = async (p: SubmitPayload) => {
    try {
      await postsApi.create(p);
      await fetchExperiences();
      setShowForm(false);
      Alert.alert("성공", "게시글이 등록되었습니다.");
    } catch (error: any) {
      if (error.response?.status === 401) await handleLogout();
      else Alert.alert("추가 실패", "게시글 추가에 실패했습니다.");
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
      if (error.response?.status === 401) await handleLogout();
      else Alert.alert("수정 실패", "게시글 수정에 실패했습니다.");
    }
  };

  const handleDeleteExperience = (id: number) => {
    Alert.alert("삭제 확인", "정말 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제", style: "destructive",
        onPress: async () => {
          try {
            await postsApi.delete(id);
            await fetchExperiences();
            if (selectedPostId === id) setSelectedPostId(null);
          } catch (error: any) {
            if (error.response?.status === 401) await handleLogout();
            else Alert.alert("삭제 실패", "게시글 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const filteredExperiences = Array.isArray(experiences)
    ? experiences.filter((exp) => {
        const q = searchQuery.toLowerCase();
        return (exp.title + exp.description + exp.location + exp.tags.join('')).toLowerCase().includes(q);
      })
    : [];

  if (isInitializing) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.appTitle}>TrendLog</Text>
        <ActivityIndicator size="large" color="#7C3AED" style={{marginVertical: 16}}/>
        <Text style={styles.greeting}>앱을 초기화하는 중...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    if (authScreen === "login") return <LoginForm onLogin={handleLogin} onShowSignup={() => setAuthScreen("signup")} onBack={() => setAuthScreen("welcome")} />;
    if (authScreen === "signup") return <SignUpForm onSignup={handleSignup} onShowLogin={() => setAuthScreen("login")} onBack={() => setAuthScreen("welcome")} />;
    return <WelcomeScreen onShowLogin={() => setAuthScreen("login")} onShowSignup={() => setAuthScreen("signup")} />;
  }

  const renderTabContent = () => {
    const isLoading = loadingExperiences || loadingTrends;
    if (isLoading && activeTab !== '내 게시물') { // 내 게시물 탭은 자체 로딩이 있음
      return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" /></View>
    }
    
    switch (activeTab) {
      case "홈":
        return (
          <View style={{ flex: 1, padding: 16 }}>
            <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 16 }}>인기 게시물</Text>
            {filteredExperiences.length > 0 ? (
              filteredExperiences.map((exp) => (
                <TouchableOpacity key={exp.id} style={styles.homeCard} onPress={() => handleExperienceClick(exp)}>
                  <Text style={{ fontWeight: "bold" }}>{exp.title}</Text>
                  <Text style={{ color: "#6B7280", fontSize: 12 }}>{exp.location} • {new Date(exp.date).toLocaleDateString("ko-KR")}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={{ textAlign: "center", color: "#6B7280" }}>아직 작성된 게시글이 없습니다.</Text>
            )}
          </View>
        );
      case "트렌드":
        return <TrendsTab trends={trends} />;
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
      {(activeTab === "홈" || activeTab === "트렌드") && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput style={styles.searchInput} placeholder="경험 또는 트렌드 검색..." value={searchQuery} onChangeText={setSearchQuery} />
        </View>
      )}
      <View style={styles.mainContent}>
        {renderTabContent()}
      </View>
      <View style={styles.bottomNav}>
        {(Object.keys(TAB_CONFIG) as TabType[]).map((tab) => {
          const cfg = TAB_CONFIG[tab];
          const active = tab === activeTab;
          return (
            <TouchableOpacity key={tab} style={styles.navButton} onPress={() => setActiveTab(tab)}>
              <Ionicons name={cfg.icon as any} size={24} color={active ? "#7C3AED" : "#9CA3AF"} />
              <Text style={[styles.navLabel, { color: active ? "#7C3AED" : "#9CA3AF" }]}>{cfg.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Modal visible={showForm} animationType="slide" onRequestClose={() => { setShowForm(false); setEditingExperience(null); }}>
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
          {selectedPostId !== null && <PostDetailScreen postId={selectedPostId} onClose={handleCloseDetail} onTrendPress={handleTrendPress} />}
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