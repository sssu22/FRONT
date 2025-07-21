// App.tsx
import React, { useState } from "react"
import { View, Text, TouchableOpacity, StyleSheet } from "react-native"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import { Ionicons } from "@expo/vector-icons"

import HomeTab from "./screens/HomeTab"
import PostsTab, { Experience } from "./screens/MyPostsTab"
import TrendsTab, { Trend, UserTrendActivity } from "./screens/TrendsTab"
import ProfileTab from "./screens/ProfileTab"
import CreatePostScreen from "./screens/CreatePostScreen"  // 추가된 작성 화면

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// — 더미 경험 (MyPostsTab용)
const dummyExperiences: Experience[] = [
  {
    id: "1",
    title: "첫 번째 경험",
    date: "2025-07-15T10:00:00Z",
    location: "홍대입구역",
    emotion: "joy",
    tags: ["여행", "친구"],
    description: "친구들과 홍대에서 즐거운 시간을 보냈어요.",
    trendScore: 42,
  },
  {
    id: "2",
    title: "두 번째 경험",
    date: "2025-07-10T14:30:00Z",
    location: "강남구 신사동",
    emotion: "excitement",
    tags: ["맛집", "데이트"],
    description: "연인과 함께 맛집 탐방을 즐겼습니다.",
    trendScore: 35,
  },
  {
    id: "3",
    title: "세 번째 경험",
    date: "2025-06-01T09:00:00Z",
    location: "잠실 올림픽공원",
    emotion: "nostalgia",
    tags: ["산책", "회상"],
    description: "올림픽공원 산책하며 옛 추억을 떠올렸어요.",
    trendScore: 28,
  },
]

// — 더미 트렌드 (TrendsTab용)
const dummyTrends: Trend[] = [
  {
    id: "1",
    name: "도넛 플렉스",
    description: "SNS에서 도넛을 자랑하는 트렌드",
    category: "음식",
    popularity: 95,
    createdAt: "2023-08-01",
    experienceCount: 1,
    prediction: { direction: "up", confidence: 85, nextMonthGrowth: 15 },
  },
  {
    id: "2",
    name: "혼밥",
    description: "혼자 식사하는 문화",
    category: "라이프스타일",
    popularity: 88,
    createdAt: "2023-06-15",
    experienceCount: 1,
    prediction: { direction: "stable", confidence: 92, nextMonthGrowth: 3 },
  },
  {
    id: "3",
    name: "K-POP 콘서트",
    description: "한국 아이돌 공연 관람",
    category: "문화",
    popularity: 92,
    createdAt: "2023-09-01",
    experienceCount: 1,
    prediction: { direction: "up", confidence: 78, nextMonthGrowth: 22 },
  },
  {
    id: "4",
    name: "비건 라이프",
    description: "식물성 식단과 친환경 생활",
    category: "건강",
    popularity: 76,
    createdAt: "2023-07-01",
    experienceCount: 1,
    prediction: { direction: "up", confidence: 89, nextMonthGrowth: 18 },
  },
  {
    id: "5",
    name: "NFT 투자",
    description: "디지털 자산 투자 트렌드",
    category: "투자",
    popularity: 82,
    createdAt: "2023-05-01",
    experienceCount: 1,
    prediction: { direction: "down", confidence: 73, nextMonthGrowth: -8 },
  },
]

export default function App() {
  // TrendsTab 전용 유저 활동 로그
  const [userActivity, setUserActivity] = useState<UserTrendActivity>({
    likes: [],
    searches: ["도넛", "혼밥"],
    views: [],
    viewCounts: {},
    trendViews: [],
    categoryInterests: { 음식: 2, 라이프스타일: 1 },
  })

  // 스크랩된 트렌드 ID
  const [scrappedTrends, setScrappedTrends] = useState<string[]>([])

  // 트렌드 클릭 핸들러
  const handleTrendView = (trendId: string, category: string) => {
    if (!userActivity.trendViews.includes(trendId)) {
      setUserActivity((prev) => ({
        ...prev,
        trendViews: [...prev.trendViews, trendId],
      }))
    }
    console.log(`[트렌드 클릭] ${trendId} / ${category}`)
  }

  // 트렌드 스크랩 토글
  const handleToggleTrendScrap = (trendId: string) => {
    setScrappedTrends((prev) =>
      prev.includes(trendId) ? prev.filter((id) => id !== trendId) : [...prev, trendId]
    )
  }

  // Bottom Tab Navigator
  function MainTabs() {
    return (
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ color, size }) => {
            const icons: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
              Home: "home-outline",
              Posts: "book-outline",
              Trends: "trending-up-outline",
              Profile: "person-outline",
            }
            return <Ionicons name={icons[route.name] ?? "help-circle-outline"} size={size} color={color} />
          },
          tabBarActiveTintColor: "#7C3AED",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Home" component={HomeTab} options={{ title: "홈" }} />

        <Tab.Screen
          name="Posts"
          options={{ title: "내 게시글" }}
          children={() => (
            <PostsTab
              experiences={dummyExperiences}
              onExperienceClick={(exp) => console.log("[경험 클릭]", exp)}
              onEditExperience={(exp) => console.log("[수정 클릭]", exp)}
              onDeleteExperience={(id) => console.log("[삭제 클릭]", id)}
            />
          )}
        />

        <Tab.Screen
          name="Trends"
          options={{ title: "트렌드" }}
          children={() => (
            <TrendsTab
              experiences={dummyTrends}
              userActivity={userActivity}
              onTrendView={handleTrendView}
              scrappedTrends={scrappedTrends}
              onToggleTrendScrap={handleToggleTrendScrap}
            />
          )}
        />

        <Tab.Screen name="Profile" component={ProfileTab} options={{ title: "프로필" }} />
      </Tab.Navigator>
    )
  }

  // Stack Navigator
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* 메인 탭 */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={({ navigation }) => ({
            headerShown: true,
            headerStyle: { backgroundColor: "#fff" },
            headerShadowVisible: false,
            headerTitleAlign: "left",
            headerTitle: () => (
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>TrendLog</Text>
                <Text style={styles.headerSubtitle}>안녕하세요, 종민님!</Text>
              </View>
            ),
            headerRight: () => (
              <TouchableOpacity onPress={() => navigation.navigate("CreatePost")} style={styles.headerButton}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            ),
          })}
        />

        {/* 게시글 작성 화면 추가 */}
        <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: "게시글 작성" }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  headerTitleContainer: { marginRight: 200 },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#7a96ceff" },
  headerSubtitle: { fontSize: 12, color: "#7a96ceff" },
  headerButton: {
    marginRight: 16,
    backgroundColor: "#7a96ceff",
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
})
