// TrendsTab.tsx
import React, { useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
} from "react-native"
import {
  Card,
  IconButton,
  ProgressBar,
  Chip,
  Badge,
  Button,
  useTheme,
} from "react-native-paper"
import {
  MaterialIcons,
  Entypo,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons"

export interface Trend {
  id: string
  name: string
  description: string
  category: string
  popularity: number
  createdAt: string
  experienceCount: number
  prediction: {
    direction: "up" | "down" | "stable"
    confidence: number
    nextMonthGrowth: number
  }
}

export interface UserTrendActivity {
  likes: string[]
  searches: string[]
  views: string[]
  viewCounts: Record<string, number>
  trendViews: string[]
  categoryInterests: Record<string, number>
}

interface TrendsTabProps {
  experiences: Trend[]
  userActivity: UserTrendActivity
  onTrendView: (trendId: string, category: string) => void
  scrappedTrends: string[]
  onToggleTrendScrap: (trendId: string) => void
}

const categories = [
  "전체",
  "음식",
  "라이프스타일",
  "문화",
  "건강",
  "투자",
  "소셜",
  "환경",
]

// 추천·예측 헬퍼 (unchanged)
const generateRecommendations = (ua: UserTrendActivity, trends: Trend[]) => {
  const topCats = Object.entries(ua.categoryInterests)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([c]) => c)
  const kws = ua.searches.slice(-5)
  return trends
    .filter(
      (t) =>
        !ua.trendViews.includes(t.id) &&
        (topCats.includes(t.category) ||
          kws.some((k) =>
            t.name.toLowerCase().includes(k.toLowerCase()) ||
            t.description.toLowerCase().includes(k.toLowerCase())
          ))
    )
    .slice(0, 4)
}

const generatePredictions = (trends: Trend[]) =>
  trends
    .filter((t) => t.prediction.direction === "up" && t.prediction.confidence > 80)
    .sort((a, b) => b.prediction.nextMonthGrowth - a.prediction.nextMonthGrowth)
    .slice(0, 3)

export default function TrendsTab({
  experiences,
  userActivity,
  onTrendView,
  scrappedTrends,
  onToggleTrendScrap,
}: TrendsTabProps) {
  const theme = useTheme()
  const [searchQuery, setSearchQuery] = useState("")
  const [showFilterUI, setShowFilterUI] = useState(false)
  const [sortBy, setSortBy] = useState<"popularity" | "recent" | "relevance">(
    "popularity"
  )
  const [filterCat, setFilterCat] = useState("전체")
  const [showAll, setShowAll] = useState(false)

  // 필터·정렬·검색 적용
  let displayTrends = experiences
  const q = searchQuery.toLowerCase().trim()
  if (q) {
    displayTrends = displayTrends.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
    )
  }
  if (filterCat !== "전체") {
    displayTrends = displayTrends.filter((t) => t.category === filterCat)
  }
  displayTrends = [...displayTrends].sort((a, b) => {
    if (sortBy === "popularity") return b.popularity - a.popularity
    if (sortBy === "recent")
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    if (!q) return b.popularity - a.popularity
    const aRel = a.name.toLowerCase().includes(q) ? 2 : 1
    const bRel = b.name.toLowerCase().includes(q) ? 2 : 1
    return bRel - aRel
  })
  const trendsToShow = showAll ? displayTrends : displayTrends.slice(0, 5)

  // 요약·통계
  const avgTrendScore = Math.round(
    experiences.reduce((sum, e) => sum + e.prediction.nextMonthGrowth, 0) /
      experiences.length
  )
  const recommendations = generateRecommendations(userActivity, experiences)
  const predictions = generatePredictions(experiences)
  const topExps = [...experiences].sort((a, b) => b.popularity - a.popularity).slice(0, 5)
  const recentExps = [...experiences]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
  const tagCounts = experiences.reduce<Record<string, number>>((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + 1
    return acc
  }, {})
  const popularTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  return (
    <View style={styles.container}>
      {/* 검색바 (고정) */}
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={20} color="#888" />
        <TextInput
          style={styles.searchInput}
          placeholder="트렌드, 카테고리 검색..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* 나머지 스크롤 영역 */}
      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 0 }}>
        {/* 요약 카드 */}
        <Card style={styles.overviewCard}>
          <Card.Content style={{ alignItems: "center" }}>
            <Text style={styles.overviewScore}>{avgTrendScore}</Text>
            <Text>내 트렌드 점수</Text>
            <ProgressBar
              progress={avgTrendScore / 100}
              style={{ width: "100%", marginTop: 8 }}
            />
          </Card.Content>
        </Card>

        {/* 맞춤 추천 */}
        {recommendations.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FontAwesome5 name="lightbulb" size={20} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>맞춤 추천</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {recommendations.map((item) => (
                <Card
                  key={item.id}
                  style={[styles.smallCard, { backgroundColor: "#E3F2FD" }]}
                  onPress={() => onTrendView(item.id, item.category)}
                >
                  <Card.Content>
                    <Text style={styles.smallCardTitle}>{item.name}</Text>
                    <Text numberOfLines={1}>{item.description}</Text>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 트렌드 예측 */}
        {predictions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons
                name="chart-line"
                size={20}
                color={theme.colors.secondary}
              />
              <Text style={styles.sectionTitle}>트렌드 예측</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {predictions.map((item) => (
                <Card
                  key={item.id}
                  style={[styles.smallCard, { backgroundColor: "#E8F5E9" }]}
                  onPress={() => onTrendView(item.id, item.category)}
                >
                  <Card.Content style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcons
                      name="arrow-upward"
                      size={18}
                      color="green"
                      style={{ marginRight: 6 }}
                    />
                    <View>
                      <Text style={styles.smallCardTitle}>{item.name}</Text>
                      <Text numberOfLines={1}>+{item.prediction.nextMonthGrowth}%</Text>
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 필터 헤더 (우측) */}
        <View style={styles.filterHeader}>
          <IconButton
            icon="filter"
            size={24}
            onPress={() => setShowFilterUI((v) => !v)}
          />
        </View>

        {/* 필터 UI */}
        {showFilterUI && (
          <View style={styles.filterBox}>
            <Text style={styles.filterLabel}>정렬</Text>
            <View style={styles.chipRow}>
              {(["popularity", "recent", "relevance"] as const).map((opt) => (
                <Chip
                  key={opt}
                  mode={sortBy === opt ? "flat" : "outlined"}
                  onPress={() => setSortBy(opt)}
                  style={styles.chip}
                >
                  {opt === "popularity"
                    ? "인기순"
                    : opt === "recent"
                    ? "최신순"
                    : "관련도순"}
                </Chip>
              ))}
            </View>
            <Text style={styles.filterLabel}>카테고리</Text>
            <View style={styles.chipRow}>
              {categories.map((cat) => (
                <Chip
                  key={cat}
                  mode={filterCat === cat ? "flat" : "outlined"}
                  onPress={() => setFilterCat(cat)}
                  style={styles.chip}
                >
                  {cat}
                </Chip>
              ))}
            </View>
          </View>
        )}

        {/* 트렌드 리스트 (최대 5개 표시) */}
        <View style={styles.section}>
          {trendsToShow.map((item) => (
            <Card
              key={item.id}
              style={styles.trendCard}
              onPress={() => onTrendView(item.id, item.category)}
            >
              <Card.Content>
                <View style={styles.trendHeader}>
                  <Text style={styles.trendName}>{item.name}</Text>
                  <TouchableOpacity onPress={() => onToggleTrendScrap(item.id)}>
                    {scrappedTrends.includes(item.id) ? (
                      <MaterialCommunityIcons
                        name="bookmark-remove"
                        size={24}
                        color={theme.colors.secondary}
                      />
                    ) : (
                      <MaterialCommunityIcons
                        name="bookmark-outline"
                        size={24}
                        color={theme.colors.onSurfaceVariant}
                      />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={styles.trendDesc}>{item.description}</Text>
                <View style={styles.trendFooter}>
                  <Badge>{item.category}</Badge>
                  <View style={styles.predictionBadge}>
                    {item.prediction.direction === "up" ? (
                      <MaterialIcons name="arrow-upward" size={14} color="green" />
                    ) : item.prediction.direction === "down" ? (
                      <MaterialIcons name="arrow-downward" size={14} color="red" />
                    ) : (
                      <Entypo name="minus" size={14} color="gray" />
                    )}
                    <Text style={styles.predictionText}>
                      {item.prediction.nextMonthGrowth > 0 ? "+" : ""}
                      {item.prediction.nextMonthGrowth}%
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          ))}

          <Button mode="text" onPress={() => setShowAll((v) => !v)} style={styles.showAllButton}>
            {showAll ? "접기" : "전체 트렌드 보기"}
          </Button>
        </View>

        {/* 최고 트렌드 경험 (2열) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="emoji-events" size={20} color="#FFD700" />
            <Text style={styles.sectionTitle}>최고 트렌드 경험</Text>
          </View>
          <View style={styles.grid}>
            {topExps.map((exp, idx) => (
              <Card
                key={exp.id}
                style={[
                  styles.gridCard,
                  idx === 0 && { borderColor: "#FFD700", borderWidth: 2 },
                ]}
                onPress={() => onTrendView(exp.id, exp.category)}
              >
                <Card.Content style={styles.gridCardContent}>
                  <Text style={styles.rankCircle}>{idx + 1}</Text>
                  <Text style={styles.gridCardTitle}>{exp.name}</Text>
                  <Text style={styles.gridCardScore}>{exp.popularity}</Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* 최근 트렌드 (2열) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="history" size={20} color={theme.colors.onSurfaceVariant} />
            <Text style={styles.sectionTitle}>최근 트렌드</Text>
          </View>
          <View style={styles.grid}>
            {recentExps.map((exp) => (
              <Card
                key={exp.id}
                style={styles.gridCard}
                onPress={() => onTrendView(exp.id, exp.category)}
              >
                <Card.Content style={styles.gridCardContent}>
                  <Text style={styles.gridCardTitle}>{exp.name}</Text>
                  <Text style={styles.gridCardScore}>{exp.popularity}</Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        </View>

        {/* 인기 태그 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MaterialIcons name="tag" size={20} color={theme.colors.onSurface} />
            <Text style={styles.sectionTitle}>인기 태그</Text>
          </View>
          <View style={styles.chipWrap}>
            {popularTags.map(([tag, cnt]) => (
              <Chip
                key={tag}
                mode="outlined"
                compact
                onPress={() => console.log("태그 클릭:", tag)}
                style={styles.chip}
              >
                #{tag} ({cnt})
              </Chip>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  // 검색바 고정
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#fff",
    elevation: 2,
    zIndex: 10,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },

  overviewCard: { marginBottom: 16 },
  overviewScore: { fontSize: 32, fontWeight: "700", color: "#7e22ce", marginBottom: 4 },

  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  sectionTitle: { marginLeft: 6, fontSize: 16, fontWeight: "600" },

  smallCard: { width: 140, marginRight: 12, marginBottom: 12 },
  smallCardTitle: { fontSize: 14, fontWeight: "600" },

  filterHeader: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 8 },
  filterBox: { padding: 8, borderWidth: 1, borderColor: "#ddd", borderRadius: 8, marginBottom: 12 },
  filterLabel: { fontWeight: "600", marginTop: 4 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginVertical: 4 },
  chip: { margin: 4 },

  trendCard: { marginBottom: 12 },
  trendHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trendName: { fontSize: 16, fontWeight: "600", flex: 1 },
  trendDesc: { color: "#555", marginVertical: 6 },
  trendFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  predictionBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "#eef",
  },
  predictionText: { marginLeft: 4, fontSize: 12, fontWeight: "500" },

  showAllButton: { alignSelf: "flex-start", marginTop: 8 },

  // 2열 그리드
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  gridCard: { width: "48%", marginBottom: 12 },
  gridCardContent: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rankCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#7e22ce",
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
    fontWeight: "700",
  },
  gridCardTitle: { fontSize: 14, fontWeight: "600" },
  gridCardScore: { fontSize: 12, fontWeight: "700", color: "#7e22ce" },

  chipWrap: { flexDirection: "row", flexWrap: "wrap" },
})
