import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { Modal } from "react-native";

// 컴포넌트 imports
import CreateEditPostScreen from "./screens/CreateEditPostScreen";
import HomeTab from "./screens/HomeTab";
import MyPostsTab from "./screens/MyPostsTab";
import TrendsTab from "./screens/TrendsTab";
import ProfileTab from "./screens/ProfileTab";
import PostDetailScreen from "./screens/PostDetailScreen";
import ScrapScreen from "./screens/ScrapView"; // 세미콜론 제거하여 올바른 import
import WelcomeScreen from "./screens/auth/WelcomeScreen";
import LoginForm from "./screens/auth/LoginForm";
import SignUpForm from "./screens/auth/SignUpForm";

interface Experience {
  id: string;
  title: string;
  date: string;
  location: string;
  emotion: "joy" | "excitement" | "nostalgia" | "surprise" | "love" | "regret" | "sadness" | "irritation" | "anger" | "embarrassment";
  tags: string[];
  description: string;
  trendScore: number;
  trend?: {
    id: string;
    name: string;
    description: string;
    category: string;
    popularity: number;
    createdAt: string;
  };
}

interface UserType {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface Trend {
  id: string;
  name: string;
  description: string;
  category: string;
  popularity: number;
  createdAt: string;
}

// 사용자 활동 로그 인터페이스
interface UserActivity {
  likes: string[]; // 좋아요한 경험 ID들
  searches: string[]; // 검색 기록
  views: string[]; // 조회한 경험 ID들
  viewCounts: Record<string, number>; // 각 경험별 조회 횟수
  trendViews: string[]; // 조회한 트렌드 ID들
  categoryInterests: Record<string, number>; // 카테고리별 관심도
}

const mockExperiences: Experience[] = [
  {
    id: "1",
    title: "첫 도넛 플렉스",
    date: "2023-08-15",
    location: "강남구 신사동",
    emotion: "joy",
    tags: ["도넛", "플렉스", "SNS", "트렌드"],
    description: "인스타그램에서 유행하던 도넛 플렉스를 처음 해봤다",
    trendScore: 85,
    trend: {
      id: "1",
      name: "도넛 플렉스",
      description: "SNS에서 도넛을 자랑하는 트렌드",
      category: "음식",
      popularity: 95,
      createdAt: "2023-08-01",
    },
  },
  {
    id: "2",
    title: "첫 혼밥 도전",
    date: "2023-06-20",
    location: "홍대입구역",
    emotion: "surprise",
    tags: ["혼밥", "자립", "성장"],
    description: "처음으로 혼자 식당에서 밥을 먹어봤다",
    trendScore: 72,
    trend: {
      id: "2",
      name: "혼밥",
      description: "혼자 식사하는 문화",
      category: "라이프스타일",
      popularity: 88,
      createdAt: "2023-06-15",
    },
  },
  {
    id: "3",
    title: "첫 K-POP 콘서트",
    date: "2023-09-10",
    location: "잠실 올림픽공원",
    emotion: "excitement",
    tags: ["K-POP", "콘서트", "한류", "문화"],
    description: "BTS 콘서트를 처음 가봤는데 정말 감동적이었다",
    trendScore: 95,
    trend: {
      id: "3",
      name: "K-POP 콘서트",
      description: "한국 아이돌 공연 관람",
      category: "문화",
      popularity: 92,
      createdAt: "2023-09-01",
    },
  },
  {
    id: "4",
    title: "첫 비건 레스토랑",
    date: "2023-07-05",
    location: "이태원동",
    emotion: "surprise",
    tags: ["비건", "건강", "환경", "새로운시도"],
    description: "비건 음식이 이렇게 맛있을 줄 몰랐다",
    trendScore: 68,
    trend: {
      id: "4",
      name: "비건 라이프",
      description: "식물성 식단과 친환경 생활",
      category: "건강",
      popularity: 76,
      createdAt: "2023-07-01",
    },
  },
  {
    id: "5",
    title: "첫 NFT 구매",
    date: "2023-05-12",
    location: "온라인",
    emotion: "excitement",
    tags: ["NFT", "블록체인", "디지털아트", "투자"],
    description: "첫 NFT를 구매해봤다. 미래가 궁금하다",
    trendScore: 78,
    trend: {
      id: "5",
      name: "NFT 투자",
      description: "디지털 자산 투자 트렌드",
      category: "투자",
      popularity: 82,
      createdAt: "2023-05-01",
    },
  },
];

type TabType = "home" | "posts" | "trends" | "profile";
type AuthScreen = "welcome" | "login" | "signup";

export default function TrendLogApp() {
  const [user, setUser] = useState<UserType | null>(null);
  const [authScreen, setAuthScreen] = useState<AuthScreen>("welcome");
  const [experiences, setExperiences] = useState<Experience[]>(mockExperiences);
  const [activeTab, setActiveTab] = useState<TabType>("home");
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [editingExperience, setEditingExperience] = useState<Experience | null>(null);
  const [showScrapsView, setShowScrapsView] = useState(false);

  // 스크랩 상태 관리
  const [scrappedExperiences, setScrappedExperiences] = useState<string[]>([]);
  const [scrappedTrends, setScrappedTrends] = useState<string[]>([]);

  // 사용자 활동 로그 상태 관리
  const [userActivity, setUserActivity] = useState<UserActivity>({
    likes: [],
    searches: [],
    views: [],
    viewCounts: {},
    trendViews: [],
    categoryInterests: {},
  });

  // AsyncStorage에서 사용자 정보 로드
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const savedUser = await AsyncStorage.getItem("TrendLog-user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      // 스크랩 데이터 로드
      const savedScrappedExperiences = await AsyncStorage.getItem("TrendLog-scrapped-experiences");
      const savedScrappedTrends = await AsyncStorage.getItem("TrendLog-scrapped-trends");

      if (savedScrappedExperiences) {
        setScrappedExperiences(JSON.parse(savedScrappedExperiences));
      }
      if (savedScrappedTrends) {
        setScrappedTrends(JSON.parse(savedScrappedTrends));
      }

      // 사용자 활동 로그 로드
      const savedUserActivity = await AsyncStorage.getItem("TrendLog-user-activity");
      if (savedUserActivity) {
        setUserActivity(JSON.parse(savedUserActivity));
      }
    } catch (error) {
      console.error("데이터 로드 중 오류:", error);
    }
  };

  // 스크랩 데이터 저장 
  useEffect(() => {
    if (scrappedExperiences.length > 0 || scrappedExperiences.length === 0) {
      saveScrappedExperiences();
    }
  }, [scrappedExperiences]);

  useEffect(() => {
    if (scrappedTrends.length > 0 || scrappedTrends.length === 0) {
      saveScrappedTrends();
    }
  }, [scrappedTrends]);

  // 사용자 활동 로그 저장
  useEffect(() => {
    saveUserActivity();
  }, [userActivity]);

  // 스크랩 데이터 저장 함수들
  const saveScrappedExperiences = async () => {
    try {
      await AsyncStorage.setItem("TrendLog-scrapped-experiences", JSON.stringify(scrappedExperiences));
    } catch (error) {
      console.error("스크랩 경험 저장 중 오류:", error);
    }
  };

  const saveScrappedTrends = async () => {
    try {
      await AsyncStorage.setItem("TrendLog-scrapped-trends", JSON.stringify(scrappedTrends));
    } catch (error) {
      console.error("스크랩 트렌드 저장 중 오류:", error);
    }
  };

  const saveUserActivity = async () => {
    try {
      await AsyncStorage.setItem("TrendLog-user-activity", JSON.stringify(userActivity));
    } catch (error) {
      console.error("사용자 활동 저장 중 오류:", error);
    }
  };

  // 사용자 정보를 AsyncStorage에 저장
  const saveUser = async (userData: UserType) => {
    try {
      await AsyncStorage.setItem("TrendLog-user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("사용자 정보 저장 중 오류:", error);
    }
  };

  const handleLogin = (userData: UserType) => {
    saveUser(userData);
  };

  const handleSignup = (userData: UserType) => {
    saveUser(userData);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("TrendLog-user");
      setUser(null);
      setAuthScreen("welcome");
      setActiveTab("home");
      setSearchQuery("");
      setSelectedExperience(null);
      setEditingExperience(null);
      setShowForm(false);
      setShowScrapsView(false);
    } catch (error) {
      console.error("로그아웃 중 오류:", error);
    }
  };

  // 경험 조회 로그 기록
  const handleExperienceClick = (experience: Experience) => {
    setSelectedExperience(experience);
    setUserActivity((prev) => ({
      ...prev,
      views: prev.views.includes(experience.id) ? prev.views : [...prev.views, experience.id],
      viewCounts: {
        ...prev.viewCounts,
        [experience.id]: (prev.viewCounts[experience.id] || 0) + 1,
      },
      categoryInterests: {
        ...prev.categoryInterests,
        [experience.trend?.category || "기타"]:
          (prev.categoryInterests[experience.trend?.category || "기타"] || 0) + 1,
      },
    }));
  };

  const handleCloseDetail = () => {
    setSelectedExperience(null);
  };

  const handleAddExperience = (newExperience: Omit<Experience, "id" | "trendScore" | "trend">) => {
    const experience: Experience = {
      ...newExperience,
      id: Date.now().toString(),
      trendScore: Math.floor(Math.random() * 40) + 60,
      trend: {
        id: "6", // 임시 ID
        name: "새로운 트렌드", // 임시 이름
        description: "새로운 트렌드 설명", // 임시 설명
        category: "기타", // 임시 카테고리
        popularity: 50, // 임시 인기도
        createdAt: new Date().toISOString().split("T")[0], // 임시 생성일
      },
    };
    setExperiences([experience, ...experiences]);
    setShowForm(false);
  };

  const handleEditExperience = (experience: Experience) => {
    setEditingExperience(experience);
    setShowForm(true);
  };

  const handleUpdateExperience = (updatedExperience: Omit<Experience, "id" | "trendScore" | "trend">) => {
    if (editingExperience) {
      const updated: Experience = {
        ...updatedExperience,
        id: editingExperience.id,
        trendScore: editingExperience.trendScore,
        trend: editingExperience.trend, // 기존 trend 정보 유지
      };
      setExperiences(experiences.map((exp) => (exp.id === editingExperience.id ? updated : exp)));
      setEditingExperience(null);
      setShowForm(false);
    }
  };

  const handleDeleteExperience = (experienceId: string) => {
    Alert.alert("삭제 확인", "정말로 이 경험을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제",
        style: "destructive",
        onPress: () => {
          setExperiences(experiences.filter((exp) => exp.id !== experienceId));
        },
      },
    ]);
  };

  // 검색 로그 기록
  const handleSearch = (query: string) => {
    setSearchQuery(query);

    if (query.trim() && !userActivity.searches.includes(query.trim())) {
      setUserActivity((prev) => ({
        ...prev,
        searches: [...prev.searches, query.trim()],
      }));
    }
  };

  // 좋아요 로그 기록
  const handleToggleLike = (experienceId: string) => {
    setUserActivity((prev) => ({
      ...prev,
      likes: prev.likes.includes(experienceId)
        ? prev.likes.filter((id) => id !== experienceId)
        : [...prev.likes, experienceId],
    }));
  };

  // 트렌드 조회 로그 기록
  const handleTrendView = (trendId: string, category: string) => {
    setUserActivity((prev) => ({
      ...prev,
      trendViews: prev.trendViews.includes(trendId) ? prev.trendViews : [...prev.trendViews, trendId],
      categoryInterests: {
        ...prev.categoryInterests,
        [category]: (prev.categoryInterests[category] || 0) + 1,
      },
    }));
  };

  // 스크랩 관련 함수들
  const handleToggleExperienceScrap = (experienceId: string) => {
    setScrappedExperiences((prev) =>
      prev.includes(experienceId) ? prev.filter((id) => id !== experienceId) : [...prev, experienceId]
    );
  };

  const handleToggleTrendScrap = (trendId: string) => {
    setScrappedTrends((prev) => (prev.includes(trendId) ? prev.filter((id) => id !== trendId) : [...prev, trendId]));
  };

  const filteredExperiences = experiences.filter(
    (exp) =>
      exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exp.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 인증되지 않은 사용자에게 인증 화면 표시
  if (!user) {
    switch (authScreen) {
      case "login":
        return (
          <LoginForm
            onLogin={handleLogin}
            onShowSignup={() => setAuthScreen("signup")}
            onBack={() => setAuthScreen("welcome")}
          />
        );
      case "signup":
        return (
          <SignUpForm
            onSignup={handleSignup}
            onShowLogin={() => setAuthScreen("login")}
            onBack={() => setAuthScreen("welcome")}
          />
        );
      default:
        return <WelcomeScreen onShowLogin={() => setAuthScreen("login")} onShowSignup={() => setAuthScreen("signup")} />;
    }
  }

  // 스크랩 뷰 표시
  if (showScrapsView) {
    return (
      <ScrapScreen
        experiences={experiences}
        scrappedExperiences={scrappedExperiences}
        scrappedTrends={scrappedTrends}
        onExperienceClick={handleExperienceClick}
        onToggleExperienceScrap={handleToggleExperienceScrap}
        onToggleTrendScrap={handleToggleTrendScrap}
        onClose={() => setShowScrapsView(false)}
      />
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <HomeTab
            experiences={filteredExperiences} // filteredExperiences 사용
            onExperienceClick={handleExperienceClick}
            onAddExperience={() => setShowForm(true)}
            onSearch={handleSearch}
            searchQuery={searchQuery}
          />
        );
      case "posts":
        return (
          <MyPostsTab
            experiences={experiences}
            onExperienceClick={handleExperienceClick}
            onEditExperience={handleEditExperience}
            onDeleteExperience={handleDeleteExperience}
          />
        );
      case "trends":
        return (
          <TrendsTab
            experiences={experiences}
            onExperienceClick={handleExperienceClick}
            searchQuery={searchQuery}
            userActivity={userActivity}
            onTrendView={handleTrendView}
            scrappedTrends={scrappedTrends}
            onToggleTrendScrap={handleToggleTrendScrap}
          />
        );
      case "profile":
        return (
          <ProfileTab
            experiences={experiences}
            onExperienceClick={handleExperienceClick}
            onLogout={handleLogout}
            onShowScraps={() => setShowScrapsView(true)}
            user={user}
            scrappedCount={scrappedExperiences.length + scrappedTrends.length}
            userActivity={userActivity}
          />
        );
      default:
        return (
          <HomeTab
            experiences={filteredExperiences}
            onExperienceClick={handleExperienceClick}
            onAddExperience={() => setShowForm(true)}
            onSearch={handleSearch}
            searchQuery={searchQuery}
          />
        );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* App Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={styles.appTitle}>TrendLog</Text>
              <Text style={styles.welcomeText}>안녕하세요, {user?.name}님!</Text>
            </View>
            <TouchableOpacity onPress={() => setShowForm(true)} style={styles.addButton}>
              <Ionicons name="add" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {/* Search Bar - Show on home and trends tab */}
          {(activeTab === "home" || activeTab === "trends") && (
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={16} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder={activeTab === "home" ? "경험, 태그, 장소 검색..." : "트렌드, 카테고리 검색..."}
                value={searchQuery}
                onChangeText={handleSearch}
                placeholderTextColor="#9CA3AF"
                returnKeyType="search"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch("")} style={styles.clearButton}>
                  <Ionicons name="close" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {/* Main Content */}
      <View style={styles.mainContent}>{renderTabContent()}</View>

      {/* Bottom Navigation - 4 tabs */}
      <View style={styles.bottomNav}>
        <View style={styles.tabContainer}>
          {[
            { id: "home", iconName: "home-outline", activeIconName: "home", label: "홈" },
            { id: "posts", iconName: "book-outline", activeIconName: "book", label: "내 게시글" },
            { id: "trends", iconName: "trending-up-outline", activeIconName: "trending-up", label: "트렌드" },
            { id: "profile", iconName: "person-outline", activeIconName: "person", label: "프로필" },
          ].map(({ id, iconName, activeIconName, label }) => (
            <TouchableOpacity
              key={id}
              onPress={() => {
                setActiveTab(id as TabType);
                if (id !== "home" && id !== "trends") {
                  setSearchQuery("");
                }
              }}
              style={styles.tabButton}
              activeOpacity={0.7}
            >
              <Ionicons
                name={activeTab === id ? (activeIconName as any) : (iconName as any)}
                size={20}
                color={activeTab === id ? "#7C3AED" : "#9CA3AF"}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: activeTab === id ? "#7C3AED" : "#9CA3AF" },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Experience Form Modal */}
      <Modal
        animationType="slide"
        visible={showForm}
        onRequestClose={() => {
          setShowForm(false);
          setEditingExperience(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          <CreateEditPostScreen
            onSubmit={editingExperience ? handleUpdateExperience : handleAddExperience}
            onClose={() => {
              setShowForm(false);
              setEditingExperience(null);
            }}
            initialData={editingExperience}
          />
        </SafeAreaView>
      </Modal>

      {/* Experience Detail */}
      <Modal
        animationType="slide"
        visible={!!selectedExperience}
        onRequestClose={handleCloseDetail}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
          {selectedExperience && (
            <PostDetailScreen
              experience={selectedExperience}
              allExperiences={experiences}
              onClose={handleCloseDetail}
              isBookmarked={scrappedExperiences.includes(selectedExperience.id)}
              onToggleBookmark={() => handleToggleExperienceScrap(selectedExperience.id)}
              isLiked={userActivity.likes.includes(selectedExperience.id)}
              onToggleLike={() => handleToggleLike(selectedExperience.id)}
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
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  welcomeText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  addButton: {
    backgroundColor: "#7C3AED",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  mainContent: {
    flex: 1,
  },
  bottomNav: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 5,
  },
  tabContainer: {
    flexDirection: "row",
    paddingVertical: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 4,
  },
});