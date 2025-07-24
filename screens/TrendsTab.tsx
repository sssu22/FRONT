import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Card, Chip, Button, Badge, ProgressBar, IconButton } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

// 감정 이모지 10종
const emotionIcons = {
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
const categories = ["전체", "음식", "라이프스타일", "문화", "건강", "투자", "소셜", "환경"];

// 트렌드 데이터 타입
interface Trend {
  id: string;
  name: string;
  description: string;
  category: string;
  popularity: number;
  createdAt: string;
  experienceCount?: number;
  prediction?: {
    direction: "up" | "down" | "stable";
    confidence: number;
    nextMonthGrowth: number;
  };
}

// 경험 데이터 타입
interface Experience {
  id: string;
  title: string;
  date: string;
  location: string;
  emotion:
    | "joy" | "excitement" | "nostalgia" | "surprise" | "love"
    | "regret" | "sadness" | "irritation" | "anger" | "embarrassment";
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

interface TrendsTabProps {
  experiences: Experience[];
  onExperienceClick: (experience: Experience) => void;
  searchQuery: string;
  userActivity: UserActivity;
  onTrendView: (trendId: string, category: string) => void;
  scrappedTrends: string[];
  onToggleTrendScrap: (trendId: string) => void;
}

// 샘플 트렌드 리스트(실제론 데이터 받아옴)
const allTrends: Trend[] = [
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
    prediction: { direction: "up", confidence: 78, nextMonthGrowth: 12 },
  },
  {
    id: "4", 
    name: "비건 라이프", 
    description: "식물성 식단과 친환경 생활",
    category: "건강", 
    popularity: 76, 
    createdAt: "2023-07-01", 
    experienceCount: 1,
    prediction: { direction: "up", confidence: 88, nextMonthGrowth: 18 },
  },
  {
    id: "5", 
    name: "NFT 투자", 
    description: "디지털 자산 투자 트렌드",
    category: "투자", 
    popularity: 82, 
    createdAt: "2023-05-01", 
    experienceCount: 1,
    prediction: { direction: "down", confidence: 65, nextMonthGrowth: -8 },
  },
];

// 추천 및 예측 트렌드 생성 함수
function generateRecommendations(userActivity: UserActivity): Trend[] {
  const { categoryInterests, searches, trendViews } = userActivity;
  const topCategories = Object.entries(categoryInterests)
    .sort(([, a], [, b]) => b - a).slice(0, 3).map(([cat]) => cat);
  const keywords = searches.slice(-5);
  return allTrends.filter(
    (t) =>
      !trendViews.includes(t.id) &&
      (topCategories.includes(t.category) ||
        keywords.some((k) =>
          t.name.toLowerCase().includes(k.toLowerCase()) ||
          t.description.toLowerCase().includes(k.toLowerCase())
        )
      )
  ).slice(0, 4);
}

function generatePredictions(): Trend[] {
  return allTrends
    .filter((t) => t.prediction?.direction === "up" && (t.prediction?.confidence || 0) > 80)
    .sort((a, b) => (b.prediction?.nextMonthGrowth || 0) - (a.prediction?.nextMonthGrowth || 0))
    .slice(0, 3);
}

export default function TrendsTab({
  experiences,
  onExperienceClick,
  searchQuery,
  userActivity,
  onTrendView,
  scrappedTrends,
  onToggleTrendScrap,
}: TrendsTabProps) {
  const [showAllTrends, setShowAllTrends] = useState(false);
  const [sortBy, setSortBy] = useState<"popularity" | "recent" | "relevance">("popularity");
  const [filterCategory, setFilterCategory] = useState("전체");

  const recommendations = generateRecommendations(userActivity);
  const predictions = generatePredictions();
  let displayTrends = allTrends;

  // 검색 및 필터
  if (searchQuery) {
    displayTrends = displayTrends.filter(
      (trend) =>
        trend.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trend.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trend.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  if (filterCategory !== "전체") {
    displayTrends = displayTrends.filter((trend) => trend.category === filterCategory);
  }

  // 정렬
  displayTrends = [...displayTrends].sort((a, b) => {
    if (sortBy === "popularity") return b.popularity - a.popularity;
    if (sortBy === "recent") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    return b.popularity - a.popularity;
  });

  // 검색어 강조
  const highlightText = (txt: string, query: string) => {
    if (!query.trim()) return txt;
    const idx = txt.toLowerCase().indexOf(query.toLowerCase());
    if (idx === -1) return txt;
    return (
      <>
        {txt.slice(0, idx)}
        <Text style={{ backgroundColor: "#fbbf24" }}>
          {txt.slice(idx, idx + query.length)}
        </Text>
        {txt.slice(idx + query.length)}
      </>
    );
  };

  // 예측 아이콘
  const getPredictionIcon = (direction: string) => {
    if (direction === "up") return <Ionicons name="arrow-up" size={16} color="#16a34a" />;
    if (direction === "down") return <Ionicons name="arrow-down" size={16} color="#e11d48" />;
    return <Ionicons name="remove" size={16} color="#888" />;
  };

  return (
    <ScrollView style={styles.container}>
      {/* --- 트렌드 AI 추천 섹션 --- */}
      {recommendations.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>AI 맞춤 추천</Text>
          {recommendations.map((trend) => (
            <Card key={trend.id} style={styles.trendCard}>
              <TouchableOpacity onPress={() => onTrendView(trend.id, trend.category)}>
                <View style={styles.trendRow}>
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendTitle}>{trend.name}</Text>
                    <Text style={styles.trendCategory}>{trend.category}</Text>
                    <Text style={styles.trendDesc}>{trend.description}</Text>
                    {trend.prediction && (
                      <View style={styles.predictionRow}>
                        {getPredictionIcon(trend.prediction.direction)}
                        <Text style={styles.predictionText}>
                          {trend.prediction.nextMonthGrowth > 0 ? '+' : ''}{trend.prediction.nextMonthGrowth}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <IconButton
                    icon={scrappedTrends.includes(trend.id) ? "bookmark" : "bookmark-outline"}
                    size={24}
                    iconColor={scrappedTrends.includes(trend.id) ? "#f59e42" : "#aaa"}
                    onPress={() => onToggleTrendScrap(trend.id)}
                  />
                </View>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      )}

      {/* --- 예측 트렌드 섹션 --- */}
      {predictions.length > 0 && (
        <View>
          <Text style={styles.sectionTitle}>상승 예측 트렌드</Text>
          {predictions.map((trend) => (
            <Card key={`pred-${trend.id}`} style={[styles.trendCard, { backgroundColor: "#e8f5e8" }]}>
              <TouchableOpacity onPress={() => onTrendView(trend.id, trend.category)}>
                <View style={styles.trendRow}>
                  <View style={styles.trendInfo}>
                    <Text style={styles.trendTitle}>{trend.name}</Text>
                    <Text style={styles.trendCategory}>{trend.category}</Text>
                    <Text style={styles.trendDesc}>{trend.description}</Text>
                    {trend.prediction && (
                      <View style={styles.predictionRow}>
                        {getPredictionIcon(trend.prediction.direction)}
                        <Text style={styles.predictionText}>
                          신뢰도 {trend.prediction.confidence}% • +{trend.prediction.nextMonthGrowth}%
                        </Text>
                      </View>
                    )}
                  </View>
                  <IconButton
                    icon={scrappedTrends.includes(trend.id) ? "bookmark" : "bookmark-outline"}
                    size={24}
                    iconColor={scrappedTrends.includes(trend.id) ? "#f59e42" : "#aaa"}
                    onPress={() => onToggleTrendScrap(trend.id)}
                  />
                </View>
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      )}
      
      {/* --- 필터/정렬 --- */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {categories.map((cat) => (
            <Chip
              key={cat}
              selected={cat === filterCategory}
              onPress={() => setFilterCategory(cat)}
              style={[
                styles.chip,
                cat === filterCategory && styles.chipSelected,
              ]}
            >
              {cat}
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
          }
        >
          {sortBy === "popularity" && "인기순"}
          {sortBy === "recent" && "최신순"}
          {sortBy === "relevance" && "관련도순"}
        </Button>
      </View>

      {/* --- 트렌드 리스트 --- */}
      <View>
        <Text style={styles.sectionTitle}>트렌드 랭킹</Text>
        {displayTrends.length === 0 ? (
          <Text style={styles.emptyText}>검색 결과가 없습니다. 다른 키워드로 검색해보세요.</Text>
        ) : (
          <FlatList
            data={displayTrends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => onTrendView(item.id, item.category)}
              >
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
                            {item.prediction.nextMonthGrowth > 0 ? '+' : ''}{item.prediction.nextMonthGrowth}%
                          </Text>
                        </View>
                      )}
                    </View>
                    <View
                      style={{
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: 38,
                      }}
                    >
                      <Text style={styles.popularity}>
                        {item.popularity}
                      </Text>
                      <Text style={styles.trendDate}>
                        {new Date(item.createdAt).toLocaleDateString("ko-KR")}
                      </Text>
                    </View>
                    <IconButton
                      icon={
                        scrappedTrends.includes(item.id)
                          ? "bookmark"
                          : "bookmark-outline"
                      }
                      size={22}
                      iconColor={scrappedTrends.includes(item.id) ? "#f59e42" : "#aaa"}
                      onPress={() => onToggleTrendScrap(item.id)}
                    />
                  </View>
                </Card>
              </TouchableOpacity>
            )}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 12 },
  sectionTitle: { fontWeight: "bold", fontSize: 18, marginVertical: 11, color: "#7c3aed" },
  filterRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  chip: { marginRight: 9, backgroundColor: "#ececf6" },
  chipSelected: { backgroundColor: "#a78bfa" },
  trendCard: {
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 12,
    backgroundColor: "#f6f6fc",
  },
  trendRow: { flexDirection: "row", alignItems: "center" },
  trendInfo: { flex: 1, minWidth: 0 },
  trendTitle: { fontWeight: "bold", fontSize: 16, color: "#8633fc", marginBottom: 2 },
  trendCategory: { color: "#a78bfa", fontSize: 12, marginBottom: 2 },
  trendDesc: { color: "#555", fontSize: 13, marginBottom: 4 },
  progressBar: { marginTop: 2, height: 7, borderRadius: 4 },
  popularity: { fontWeight: "bold", color: "#e87705", fontSize: 17 },
  trendDate: { color: "#98a5b3", fontSize: 10 },
  predictionRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  predictionText: { color: "#10b981", fontWeight: "bold", marginLeft: 5, fontSize: 12 },
  emptyText: { textAlign: "center", color: "#dc2626", marginTop: 16, fontSize: 15 },
});