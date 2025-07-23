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
import CreatePostScreen from "./screens/CreatePostScreen"
import EditPostScreen from "./screens/EditPostScreen"
import PostDetailScreen from "./screens/PostDetailScreen"

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

// — 더미 경험 (MyPostsTab 용)
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

// — 더미 트렌드 (TrendsTab 용)
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
  // … 나머지는 생략 …
]

export default function App() {
  const [userActivity, setUserActivity] = useState<UserTrendActivity>({
    likes: [],
    searches: ["도넛", "혼밥"],
    views: [],
    viewCounts: {},
    trendViews: [],
    categoryInterests: { 음식: 2, 라이프스타일: 1 },
  })
  const [scrappedTrends, setScrappedTrends] = useState<string[]>([])

  const handleTrendView = (trendId: string, category: string) => {
    if (!userActivity.trendViews.includes(trendId)) {
      setUserActivity((prev) => ({
        ...prev,
        trendViews: [...prev.trendViews, trendId],
      }))
    }
  }

  const handleToggleTrendScrap = (trendId: string) => {
    setScrappedTrends((prev) =>
      prev.includes(trendId)
        ? prev.filter((id) => id !== trendId)
        : [...prev, trendId]
    )
  }

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
            return <Ionicons name={icons[route.name]!} size={size} color={color} />
          },
          tabBarActiveTintColor: "#7C3AED",
          tabBarInactiveTintColor: "gray",
        })}
      >
        <Tab.Screen name="Home" component={HomeTab} />

        <Tab.Screen
          name="Posts"
          options={{ title: "내 게시글" }}
          children={({ navigation }) => (
            <PostsTab
              experiences={dummyExperiences}
              // 카드 전체 터치 → 부모(Stack) 네비게이터로 PostDetail 이동
              onExperienceClick={(exp) =>
                navigation.getParent()?.navigate("PostDetail", { experience: exp })
              }
              // ✏️ 아이콘 터치 → 부모(Stack) 네비게이터로 EditPost 이동
              onEditExperience={(exp) =>
                navigation.getParent()?.navigate("EditPost", {
                  experience: exp,
                  onSave: (updated: Experience) =>
                    console.log("수정된 경험:", updated),
                })
              }
              onDeleteExperience={(id) => console.log("삭제할 경험 ID:", id)}
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

        <Tab.Screen name="Profile" component={ProfileTab} />
      </Tab.Navigator>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* MainTabs */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={({ navigation }) => ({
            headerShown: true,
            headerTitleAlign: "left",
            headerShadowVisible: false,
            headerTitle: () => (
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>TrendLog</Text>
                <Text style={styles.headerSubtitle}>안녕하세요, 종민님!</Text>
              </View>
            ),
            headerRight: () => (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={() => navigation.navigate("CreatePost")}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            ),
          })}
        />

        {/* 게시글 작성 */}
        <Stack.Screen
          name="CreatePost"
          component={CreatePostScreen}
          options={{ title: "게시글 작성" }}
        />

        {/* 게시글 수정 */}
        <Stack.Screen
          name="EditPost"
          component={EditPostScreen}
          options={{ title: "경험 수정하기" }}
        />

        {/* 게시글 상세보기 */}
        <Stack.Screen
          name="PostDetail"
          component={PostDetailScreen}
          options={{ title: "상세보기" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  headerTitleContainer: { marginRight: 200 },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#7C3AED" },
  headerSubtitle: { fontSize: 12, color: "#7C3AED" },
  headerButton: {
    marginRight: 16,
    backgroundColor: "#7C3AED",
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
})
