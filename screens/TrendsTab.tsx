// TrendsTab.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Card, Chip, Button, IconButton, ProgressBar } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

// 감정 이모지 10종
type EmotionType =
  | "joy"
  | "excitement"
  | "nostalgia"
  | "surprise"
  | "love"
  | "regret"
  | "sadness"
  | "irritation"
  | "anger"
  | "embarrassment";
const emotionIcons: Record<EmotionType, string> = {
  joy: "😊",
  excitement: "🔥",
  nostalgia: "💭",
  surprise: "😲",
  love: "💖",
  regret: "😞",
  sadness: "😢",
  irritation: "😒",
  anger: "😡",
  embarrassment: "😳",
};

// 카테고리
const categories = [
  "전체",
  "음식",
  "라이프스타일",
  "문화",
  "건강",
  "투자",
  "소셜",
  "환경",
];

// 트렌드 데이터 타입
interface Trend {
  id: string;
  name: string;
  description: string;
  category: string;
  popularity: number;
  createdAt: string;
  prediction?: {
    direction: "up" | "down" | "stable";
    confidence: number;
    nextMonthGrowth: number;
  };
}

// 경험 데이터 타입
export interface Experience {
  id: number;             // 👈 ID를 number로 변경
  title: string;
  date: string;
  location: string;
  emotion: EmotionType;
  tags: string[];
  description: string;
  trendScore: number;
  trend?: Trend;
}

// 사용자 활동 타입
interface UserActivity {
  likes: string[];
  searches: string[];
  views: string[];
  viewCounts: Record<string, number>;
  trendViews: string[];
  categoryInterests: Record<string, number>;
}

// 호출하는 쪽에서는 세 개만 넘겨도 OK
interface TrendsTabProps {
  experiences: Experience[];
  onExperienceClick: (experience: Experience) => void;
  searchQuery: string;
  userActivity?: UserActivity;                                    // optional
  onTrendView?: (trendId: string, category: string) => void;      // optional
  scrappedTrends?: string[];                                      // optional
  onToggleTrendScrap?: (trendId: string) => void;                 // optional
}

// 샘플 트렌드 리스트 (실제론 API나 상위 state에서 받아옵니다)
const allTrends: Trend[] = [
  {
    id: "1",
    name: "도넛 플렉스",
    description: "SNS에서 도넛을 자랑하는 트렌드",
    category: "음식",
    popularity: 95,
    createdAt: "2023-08-01",
    prediction: { direction: "up", confidence: 85, nextMonthGrowth: 15 },
  },
  {
    id: "2",
    name: "혼밥",
    description: "혼자 식사하는 문화",
    category: "라이프스타일",
    popularity: 88,
    createdAt: "2023-06-15",
    prediction: { direction: "stable", confidence: 92, nextMonthGrowth: 3 },
  },
  {
    id: "3",
    name: "K-POP 콘서트",
    description: "한국 아이돌 공연 관람",
    category: "문화",
    popularity: 92,
    createdAt: "2023-09-01",
    prediction: { direction: "up", confidence: 78, nextMonthGrowth: 12 },
  },
  {
    id: "4",
    name: "비건 라이프",
    description: "식물성 식단과 친환경 생활",
    category: "건강",
    popularity: 76,
    createdAt: "2023-07-01",
    prediction: { direction: "up", confidence: 88, nextMonthGrowth: 18 },
  },
  {
    id: "5",
    name: "NFT 투자",
    description: "디지털 자산 투자 트렌드",
    category: "투자",
    popularity: 82,
    createdAt: "2023-05-01",
    prediction: { direction: "down", confidence: 65, nextMonthGrowth: -8 },
  },
];

// AI 추천 알고리즘 (더미 구현)
function generateRecommendations(userActivity: UserActivity): Trend[] {
  const { categoryInterests, searches, trendViews } = userActivity;
  const topCats = Object.entries(categoryInterests)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([cat]) => cat);
  const keywords = searches.slice(-5);
  return allTrends
    .filter(
      (t) =>
        !trendViews.includes(t.id) &&
        (topCats.includes(t.category) ||
          keywords.some((k) =>
            t.name.toLowerCase().includes(k.toLowerCase()) ||
            t.description.toLowerCase().includes(k.toLowerCase())
          ))
    )
    .slice(0, 4);
}

// 상승 예측 알고리즘 (더미 구현)
function generatePredictions(): Trend[] {
  return allTrends
    .filter((t) => t.prediction?.direction === "up" && (t.prediction?.confidence || 0) > 80)
    .sort((a, b) => (b.prediction!.nextMonthGrowth - a.prediction!.nextMonthGrowth))
    .slice(0, 3);
}

export default function TrendsTab({
  experiences,
  onExperienceClick,
  searchQuery,
  userActivity = {
    likes: [],
    searches: [],
    views: [],
    viewCounts: {},
    trendViews: [],
    categoryInterests: {},
  },
  onTrendView = () => {},
  scrappedTrends = [],
  onToggleTrendScrap = () => {},
}: TrendsTabProps) {
  const [sortBy, setSortBy] = useState<"popularity" | "recent" | "relevance">("popularity");
  const [filterCategory, setFilterCategory] = useState("전체");

  const recommendations = generateRecommendations(userActivity);
  const predictions = generatePredictions();

  // 트렌드 목록 필터/정렬
  let displayTrends = allTrends;
  if (searchQuery) {
    displayTrends = displayTrends.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (filterCategory !== "전체") {
    displayTrends = displayTrends.filter((t) => t.category === filterCategory);
  }
  displayTrends = [...displayTrends].sort((a, b) => {
    if (sortBy === "popularity") return b.popularity - a.popularity;
    if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return b.popularity - a.popularity;
  });

  // 검색어 강조 함수
  const highlightText = (txt: string, q: string) => {
    const lower = txt.toLowerCase();
    const idx = lower.indexOf(q.toLowerCase());
    if (idx === -1) return txt;
    return (
      <>
        {txt.slice(0, idx)}
        <Text style={styles.highlight}>{txt.slice(idx, idx + q.length)}</Text>
        {txt.slice(idx + q.length)}
      </>
    );
  };

  // 예측 아이콘
  const getPredictionIcon = (dir: string) => {
    if (dir === "up") return <Ionicons name="arrow-up" size={16} color="#16a34a" />;
    if (dir === "down") return <Ionicons name="arrow-down" size={16} color="#e11d48" />;
    return <Ionicons name="remove" size={16} color="#888" />;
  };

  return (
    <ScrollView style={styles.container}>
      {/* AI 추천 */}
      {recommendations.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>AI 맞춤 추천</Text>
          {recommendations.map((t) => (
            <Card key={t.id} style={styles.trendCard}>
              <TouchableOpacity onPress={() => onTrendView!(t.id, t.category)}>
                <View style={styles.trendRow}>
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendTitle}>{t.name}</Text>
                    <Text style={styles.trendCategory}>{t.category}</Text>
                    <Text style={styles.trendDesc}>{t.description}</Text>
                    {t.prediction && (
                      <View style={styles.predictionRow}>
                        {getPredictionIcon(t.prediction.direction)}
                        <Text style={styles.predictionText}>
                          +{t.prediction.nextMonthGrowth}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <IconButton
                    icon={scrappedTrends.includes(t.id) ? "bookmark" : "bookmark-outline"}
                    size={24}
                    iconColor={scrappedTrends.includes(t.id) ? "#f59e42" : "#aaa"}
                    onPress={() => onToggleTrendScrap!(t.id)}
                  />
                </View>
              </TouchableOpacity>
            </Card>
          ))}
        </>
      )}

      {/* 상승 예측 */}
      {predictions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>상승 예측 트렌드</Text>
          {predictions.map((t) => (
            <Card key={`pred-${t.id}`} style={[styles.trendCard, { backgroundColor: "#e8f5e8" }]}>
              <TouchableOpacity onPress={() => onTrendView!(t.id, t.category)}>
                <View style={styles.trendRow}>
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendTitle}>{t.name}</Text>
                    <Text style={styles.trendCategory}>{t.category}</Text>
                    <Text style={styles.trendDesc}>{t.description}</Text>
                    {t.prediction && (
                      <View style={styles.predictionRow}>
                        {getPredictionIcon(t.prediction.direction)}
                        <Text style={styles.predictionText}>
                          신뢰도 {t.prediction.confidence}% • +{t.prediction.nextMonthGrowth}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <IconButton
                    icon={scrappedTrends.includes(t.id) ? "bookmark" : "bookmark-outline"}
                    size={24}
                    iconColor={scrappedTrends.includes(t.id) ? "#f59e42" : "#aaa"}
                    onPress={() => onToggleTrendScrap!(t.id)}
                  />
                </View>
              </TouchableOpacity>
            </Card>
          ))}
        </>
      )}

      {/* 필터 / 정렬 */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((c) => (
            <Chip
              key={c}
              selected={c === filterCategory}
              onPress={() => setFilterCategory(c)}
              style={[styles.chip, c === filterCategory && styles.chipSelected]}>
              {c}
            </Chip>
          ))}
        </ScrollView>
        <Button
          compact
          mode="text"
          onPress={() =>
            setSortBy(
              sortBy === "popularity"
                ? "recent"
                : sortBy === "recent"
                ? "relevance"
                : "popularity"
            )
          }>
          {sortBy === "popularity"
            ? "인기순"
            : sortBy === "recent"
            ? "최신순"
            : "관련도순"}
        </Button>
      </View>

      {/* 랭킹 리스트 */}
      <Text style={styles.sectionTitle}>트렌드 랭킹</Text>
      <FlatList
        data={displayTrends}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => onTrendView!(item.id, item.category)}>
            <Card style={styles.trendCard}>
              <View style={styles.trendRow}>
                <View style={styles.trendInfo}>
                  <Text style={styles.trendTitle}>
                    {searchQuery
                      ? highlightText(item.name, searchQuery)
                      : item.name}
                  </Text>
                  <Text style={styles.trendCategory}>{item.category}</Text>
                  <Text style={styles.trendDesc}>
                    {searchQuery
                      ? highlightText(item.description, searchQuery)
                      : item.description}
                  </Text>
                  <ProgressBar
                    progress={item.popularity / 100}
                    color="#a78bfa"
                    style={styles.progressBar}
                  />
                  {item.prediction && (
                    <View style={styles.predictionRow}>
                      {getPredictionIcon(item.prediction.direction)}
                      <Text style={styles.predictionText}>
                        +{item.prediction.nextMonthGrowth}%
                      </Text>
                    </View>
                  )}
                </View>
                <IconButton
                  icon={
                    scrappedTrends.includes(item.id)
                      ? "bookmark"
                      : "bookmark-outline"
                  }
                  size={22}
                  iconColor={scrappedTrends.includes(item.id) ? "#f59e42" : "#aaa"}
                  onPress={() => onToggleTrendScrap!(item.id)}
                />
              </View>
            </Card>
          </TouchableOpacity>
        )}
        scrollEnabled={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            검색 결과가 없습니다. 다른 키워드로 검색해보세요.
          </Text>
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 12 },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginVertical: 11,
    color: "#7c3aed",
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  chip: {
    marginRight: 9,
    backgroundColor: "#ececf6",
  },
  chipSelected: {
    backgroundColor: "#a78bfa",
  },
  trendCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: "#f6f6fc",
    padding: 10,
  },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendInfo: {
    flex: 1,
    minWidth: 0,
  },
  trendTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#8633fc",
    marginBottom: 2,
  },
  trendCategory: { color: "#a78bfa", fontSize: 12, marginBottom: 2 },
  trendDesc: { color: "#555", fontSize: 13, marginBottom: 4 },
  progressBar: { height: 7, borderRadius: 4 },
  predictionRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  predictionText: { color: "#10b981", fontWeight: "bold", marginLeft: 5, fontSize: 12 },
  emptyText: { textAlign: "center", color: "#dc2626", marginTop: 16, fontSize: 15 },
  highlight: { backgroundColor: "#fbbf24", borderRadius: 2 },
});
