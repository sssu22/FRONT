import React, { useState, useCallback } from "react";
import {
  View, Text, SafeAreaView, Modal, Alert, StatusBar, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator,
} from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { postsApi } from "./utils/apiUtils";
import CreateEditPostScreen, { SubmitPayload, InitialData } from "./screens/CreateEditPostScreen";
import PostDetailScreen from "./screens/PostDetailScreen";
import WelcomeScreen from "./screens/auth/WelcomeScreen";
import LoginForm from "./screens/auth/LoginForm";
import SignUpForm from "./screens/auth/SignUpForm";
import ResetPasswordForm from "./screens/auth/ResetPasswordForm";
import ResetConfirmForm from "./screens/auth/ResetConfirmForm";

import HomeTab from "./screens/HomeTab";
import TrendsTab from "./screens/TrendsTab";
import MyPostsTab from "./screens/MyPostsTab";
import ProfileTab from "./screens/ProfileTab";
import ScrapView from "./screens/ScrapView";

import { Experience, User } from "./types";
import { GlobalProvider, useGlobalContext } from "./GlobalContext";

type TabType = "홈" | "트렌드" | "내 게시물" | "프로필";
type AuthScreen = "welcome" | "login" | "signup" | "resetPassword" | "resetConfirm";

export default function App() {
  return (
      <GlobalProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
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
  const TrendDetailScreen = require("./screens/TrendDetailScreen").default;
  const {
    user, isInitializing, experiences,
    handleLogin, handleSignup, handleLogout, fetchExperiences,
    showForm, setShowForm, editingExperience, setEditingExperience,
    selectedPostId, setSelectedPostId,
    selectedTrendId, setSelectedTrendId,
    scrappedPosts, scrappedTrends,
    togglePostScrap, toggleTrendScrap,
  } = useGlobalContext();

  const [authScreen, setAuthScreen] = useState<AuthScreen>("welcome");
  const [activeTab, setActiveTab] = useState<TabType>("홈");
  const [searchQuery, setSearchQuery] = useState("");
  const [showScraps, setShowScraps] = useState(false);

  const scrappedCount = (scrappedPosts?.size || 0) + (scrappedTrends?.size || 0);

  const handleExperienceClick = useCallback((exp: Experience) => {
    setSelectedPostId(exp.id);
  }, [setSelectedPostId]);

  const handleCloseDetail = useCallback(() => {
    setSelectedPostId(null);
  }, [setSelectedPostId]);

  const handleEditClick = useCallback((exp: Experience) => {
    setEditingExperience(exp);
    setShowForm(true);
  }, [setEditingExperience, setShowForm]);

  const handleTrendPress = useCallback((trendId: number) => {
    setSelectedPostId(null);
    setSelectedTrendId(trendId);
  }, [setSelectedPostId, setSelectedTrendId]);

  const handleAddExperience = useCallback(async (p: SubmitPayload) => {
    try {
      await postsApi.create(p);
      await fetchExperiences();
      setShowForm(false);
      Alert.alert("성공", "게시글이 등록되었습니다.");
    } catch (error: any) {
      if (error.response?.status === 401) await handleLogout();
      else Alert.alert("추가 실패", "게시글 추가에 실패했습니다.");
    }
  }, [fetchExperiences, setShowForm, handleLogout]);

  const handleUpdateExperience = useCallback(async (p: SubmitPayload) => {
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
  }, [editingExperience, fetchExperiences, setShowForm, setEditingExperience, handleLogout]);

  const handleDeleteExperience = useCallback((id: number) => {
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
  }, [selectedPostId, fetchExperiences, setSelectedPostId, handleLogout]);

  if (isInitializing) {
    return (
        <SafeAreaView style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
          <Text style={styles.appTitle}>TrendLog</Text>
          <ActivityIndicator size="large" color="#7C3AED" style={{marginVertical: 16}}/>
          <Text style={styles.greeting}>앱을 초기화하는 중...</Text>
        </SafeAreaView>
    );
  }

  // 👇 로그인 되어 있지 않을 때의 화면 전환 로직을 switch 문으로 변경
  if (!user) {
    switch (authScreen) {
      case "login":
        return <LoginForm onLogin={handleLogin} onShowSignup={() => setAuthScreen("signup")} onBack={() => setAuthScreen("welcome")} onShowResetPassword={() => setAuthScreen("resetPassword")} />;
      case "signup":
        return <SignUpForm onSignup={handleSignup} onShowLogin={() => setAuthScreen("login")} onBack={() => setAuthScreen("welcome")} />;
      case "resetPassword":
        return <ResetPasswordForm onBack={() => setAuthScreen("login")} />;
      case "welcome":
      default:
        return <WelcomeScreen onShowLogin={() => setAuthScreen("login")} onShowSignup={() => setAuthScreen("signup")} />;
    }
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "홈":
        return <HomeTab onExperienceClick={handleExperienceClick} searchQuery={searchQuery} />;
      case "트렌드":
        return <TrendsTab searchQuery={searchQuery} onTrendView={(trendId) => setSelectedTrendId(trendId)} />;
      case "내 게시물":
        return <MyPostsTab onExperienceClick={handleExperienceClick} onEditExperience={handleEditClick} onDeleteExperience={handleDeleteExperience} searchQuery={searchQuery} />;
      case "프로필":
        return <ProfileTab experiences={experiences} onExperienceClick={handleExperienceClick} onLogout={handleLogout} onShowScraps={() => setShowScraps(true)} user={user} scrappedCount={scrappedCount} />;
      default:
        return null;
    }
  };

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case "홈": return "경험, 태그, 위치 검색...";
      case "트렌드": return "트렌드, 카테고리 검색...";
      case "내 게시물": return "내 게시물 검색...";
      default: return "검색...";
    }
  };

  return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
        <View style={styles.header}>
          <Text style={styles.appTitle}>TrendLog</Text>
          <TouchableOpacity style={styles.addButton} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
        {(activeTab === "홈" || activeTab === "트렌드" || activeTab === "내 게시물") && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#9CA3AF" />
              <TextInput
                  style={styles.searchInput}
                  placeholder={getSearchPlaceholder()}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                  </TouchableOpacity>
              )}
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
                <TouchableOpacity key={tab} style={styles.navButton} onPress={() => { setActiveTab(tab); setSearchQuery(''); }}>
                  <Ionicons name={cfg.icon as any} size={24} color={active ? "#7C3AED" : "#9CA3AF"} />
                  <Text style={[styles.navLabel, { color: active ? "#7C3AED" : "#9CA3AF" }]}>{cfg.label}</Text>
                </TouchableOpacity>
            );
          })}
        </View>

        <Modal visible={showForm} animationType="slide" onRequestClose={() => { setShowForm(false); setEditingExperience(null); }}>
          <CreateEditPostScreen
              onSubmit={(payload) => { editingExperience ? handleUpdateExperience(payload) : handleAddExperience(payload); }}
              onClose={() => { setShowForm(false); setEditingExperience(null); }}
              initialData={editingExperience ? ({ ...editingExperience } as InitialData) : null}
          />
        </Modal>

        <Modal visible={selectedPostId !== null} animationType="slide" onRequestClose={handleCloseDetail}>
          {selectedPostId !== null && <PostDetailScreen postId={selectedPostId} onClose={handleCloseDetail} onTrendPress={handleTrendPress} />}
        </Modal>

        <Modal visible={selectedTrendId !== null} animationType="slide" onRequestClose={() => setSelectedTrendId(null)}>
          {selectedTrendId !== null && (
              <TrendDetailScreen
                  trendId={selectedTrendId}
                  onClose={() => setSelectedTrendId(null)}
                  onNavigateToTrend={(newTrendId: number) => setSelectedTrendId(newTrendId)}
              />
          )}
        </Modal>

        <Modal visible={showScraps} animationType="slide" onRequestClose={() => setShowScraps(false)}>
          <ScrapView
              onExperienceClick={(exp) => {
                setShowScraps(false);
                handleExperienceClick(exp);
              }}
              onTrendClick={(trendId) => {
                setShowScraps(false);
                setSelectedTrendId(trendId);
              }}
              onToggleExperienceScrap={togglePostScrap}
              onToggleTrendScrap={toggleTrendScrap}
              onClose={() => setShowScraps(false)}
          />
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  header: { flexDirection: "row", padding: 16, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "space-between", },
  appTitle: { fontSize: 20, fontWeight: "bold", color: "#7C3AED" },
  greeting: { fontSize: 14, color: "#6B7280" },
  addButton: { backgroundColor: "#7C3AED", padding: 8, borderRadius: 8 },
  searchContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "#FFF", borderBottomWidth: 1, borderColor: "#E5E7EB", },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 16 },
  mainContent: { flex: 1 },
  bottomNav: { flexDirection: "row", borderTopWidth: 1, borderColor: "#E5E7EB", backgroundColor: "#FFF", paddingVertical: 8, },
  navButton: { flex: 1, alignItems: "center" },
  navLabel: { fontSize: 10, fontWeight: "500", marginTop: 4 },
});