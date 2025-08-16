import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView, // SafeAreaView import 추가
} from "react-native";
import { Card, IconButton, Chip } from "react-native-paper";

// 경험 타입 (App.tsx와 일치하도록 수정)
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

// 트렌드 타입
interface Trend {
  id: string;
  name: string;
  description: string;
  category: string;
  popularity: number;
  createdAt: string;
}

// Props 타입
interface ScrapScreenProps {
  experiences: Experience[];
  scrappedExperiences: string[];
  scrappedTrends: string[];
  onExperienceClick: (experience: Experience) => void;
  onToggleExperienceScrap: (experienceId: string) => void;
  onToggleTrendScrap: (trendId: string) => void;
  onClose: () => void;
}

type FilterType = "all" | "experiences" | "trends";
type SortType = "date" | "name" | "popularity";

// 감정 이모지 (10개 모두 지원)
const emotionIcons: Record<Experience['emotion'], string> = {
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

// 모의 트렌드 데이터
const allTrends: Trend[] = [
  {
    id: "1",
    name: "도넛 플렉스",
    description: "SNS에서 도넛을 자랑하는 트렌드",
    category: "음식",
    popularity: 95,
    createdAt: "2023-08-01",
  },
  {
    id: "2",
    name: "혼밥",
    description: "혼자 식사하는 문화",
    category: "라이프스타일",
    popularity: 88,
    createdAt: "2023-06-15",
  },
  {
    id: "3",
    name: "K-POP 콘서트",
    description: "한국 아이돌 공연 관람",
    category: "문화",
    popularity: 92,
    createdAt: "2023-09-01",
  },
  {
    id: "4",
    name: "비건 라이프",
    description: "식물성 식단과 친환경 생활",
    category: "건강",
    popularity: 76,
    createdAt: "2023-07-01",
  },
  {
    id: "5",
    name: "NFT 투자",
    description: "디지털 자산 투자 트렌드",
    category: "투자",
    popularity: 82,
    createdAt: "2023-05-01",
  },
];

export default function ScrapScreen({
                                      experiences,
                                      scrappedExperiences,
                                      scrappedTrends,
                                      onExperienceClick,
                                      onToggleExperienceScrap,
                                      onToggleTrendScrap,
                                      onClose,
                                    }: ScrapScreenProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [sortBy, setSortBy] = useState<SortType>("date");

  // 메모이제이션을 통한 성능 최적화
  const filteredAndSortedData = useMemo(() => {
    // 스크랩한 경험과 트렌드 필터링
    let scrappedExpList = experiences.filter((e) => scrappedExperiences.includes(e.id));
    let scrappedTrendList = allTrends.filter((t) => scrappedTrends.includes(t.id));

    // 검색 필터링
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      scrappedExpList = scrappedExpList.filter(
          (e) =>
              e.title.toLowerCase().includes(query) ||
              e.description.toLowerCase().includes(query) ||
              e.location.toLowerCase().includes(query) ||
              e.tags.some((tag) => tag.toLowerCase().includes(query))
      );
      scrappedTrendList = scrappedTrendList.filter(
          (t) =>
              t.name.toLowerCase().includes(query) ||
              t.description.toLowerCase().includes(query) ||
              t.category.toLowerCase().includes(query)
      );
    }

    // 정렬 함수
    const sortExperiences = (a: Experience, b: Experience) => {
      switch (sortBy) {
        case "date":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "name":
          return a.title.localeCompare(b.title);
        case "popularity":
          return b.trendScore - a.trendScore;
        default:
          return 0;
      }
    };

    const sortTrends = (a: Trend, b: Trend) => {
      switch (sortBy) {
        case "date":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "name":
          return a.name.localeCompare(b.name);
        case "popularity":
          return b.popularity - a.popularity;
        default:
          return 0;
      }
    };

    return {
      experiences: [...scrappedExpList].sort(sortExperiences),
      trends: [...scrappedTrendList].sort(sortTrends),
    };
  }, [experiences, scrappedExperiences, scrappedTrends, searchQuery, sortBy]);

  // 검색어 하이라이트 기능
  const highlightText = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;
    const regex = new RegExp(`(${keyword.trim()})`, "gi");
    const parts = text.split(regex);
    return (
        <Text>
          {parts.map((part, index) =>
              regex.test(part) ? (
                  <Text key={`${part}-${index}`} style={styles.highlightText}>
                    {part}
                  </Text>
              ) : (
                  part
              )
          )}
        </Text>
    );
  };

  const totalScraps = scrappedExperiences.length + scrappedTrends.length;
  const showExperiences = filterType === "all" || filterType === "experiences";
  const showTrends = filterType === "all" || filterType === "trends";

  const filterOptions = [
    { key: "all" as FilterType, label: "전체" },
    { key: "experiences" as FilterType, label: "스크랩한 경험" },
    { key: "trends" as FilterType, label: "스크랩한 트렌드" },
  ];

  const sortOptions = [
    { key: "date" as SortType, label: "최신순" },
    { key: "name" as SortType, label: "이름순" },
    { key: "popularity" as SortType, label: "인기도순" },
  ];

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return dateString;
    }
  };

  return (
      <SafeAreaView style={styles.container}>
        {/* 상단 헤더 */}
        <View style={styles.topBar}>
          <IconButton
              icon="arrow-left"
              onPress={onClose}
              iconColor="#3b0764"
          />
          <Text style={styles.headerText}>총 {totalScraps}개 스크랩</Text>
        </View>

        {/* 검색 입력 */}
        <TextInput
            style={styles.searchInput}
            placeholder="제목, 설명, 위치, 태그로 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
        />

        {/* 필터 버튼들 */}
        <View style={styles.filterRow}>
          {filterOptions.map((option) => (
              <Chip
                  key={option.key}
                  mode={filterType === option.key ? "flat" : "outlined"}
                  onPress={() => setFilterType(option.key)}
                  style={styles.filterChip}
                  textStyle={filterType === option.key ? styles.selectedChipText : styles.chipText}
              >
                {option.label}
              </Chip>
          ))}
        </View>

        {/* 정렬 버튼들 */}
        <View style={styles.filterRow}>
          {sortOptions.map((option) => (
              <Chip
                  key={option.key}
                  mode={sortBy === option.key ? "flat" : "outlined"}
                  onPress={() => setSortBy(option.key)}
                  style={styles.filterChip}
                  textStyle={sortBy === option.key ? styles.selectedChipText : styles.chipText}
              >
                {option.label}
              </Chip>
          ))}
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* 경험 리스트 */}
          {showExperiences && (
              <>
                <Text style={styles.subTitle}>
                  스크랩한 경험 ({filteredAndSortedData.experiences.length})
                </Text>
                {filteredAndSortedData.experiences.length === 0 ? (
                    <Text style={styles.emptyText}>
                      {searchQuery ? "검색 결과가 없습니다." : "스크랩한 경험이 없습니다."}
                    </Text>
                ) : (
                    filteredAndSortedData.experiences.map((experience) => (
                        <Card key={experience.id} style={styles.card}>
                          <TouchableOpacity
                              onPress={() => onExperienceClick(experience)}
                              style={styles.cardContent}
                              activeOpacity={0.7}
                          >
                            <Text style={styles.emotion}>{emotionIcons[experience.emotion]}</Text>
                            <View style={styles.contentArea}>
                              <Text style={styles.title}>
                                {searchQuery
                                    ? highlightText(experience.title, searchQuery)
                                    : experience.title}
                              </Text>
                              <Text style={styles.desc} numberOfLines={2}>
                                {searchQuery
                                    ? highlightText(experience.description, searchQuery)
                                    : experience.description}
                              </Text>
                              <Text style={styles.meta}>
                                {experience.location} • {formatDate(experience.date)}
                              </Text>
                              {experience.tags.length > 0 && (
                                  <View style={styles.tagsContainer}>
                                    {experience.tags.slice(0, 3).map((tag, index) => (
                                        <Text key={index} style={styles.tag}>
                                          #{tag}
                                        </Text>
                                    ))}
                                  </View>
                              )}
                            </View>
                            <IconButton
                                icon="bookmark"
                                size={20}
                                iconColor="#f59e42"
                                onPress={(e) => {
                                  e?.stopPropagation?.();
                                  onToggleExperienceScrap(experience.id);
                                }}
                            />
                          </TouchableOpacity>
                        </Card>
                    ))
                )}
              </>
          )}

          {/* 트렌드 리스트 */}
          {showTrends && (
              <>
                <Text style={styles.subTitle}>
                  스크랩한 트렌드 ({filteredAndSortedData.trends.length})
                </Text>
                {filteredAndSortedData.trends.length === 0 ? (
                    <Text style={styles.emptyText}>
                      {searchQuery ? "검색 결과가 없습니다." : "스크랩한 트렌드가 없습니다."}
                    </Text>
                ) : (
                    filteredAndSortedData.trends.map((trend) => (
                        <Card key={trend.id} style={styles.card}>
                          <View style={styles.cardContent}>
                            <View style={styles.trendIcon}>
                              <Text style={styles.trendIconText}>📈</Text>
                            </View>
                            <View style={styles.contentArea}>
                              <Text style={styles.title}>
                                {searchQuery ? highlightText(trend.name, searchQuery) : trend.name}
                              </Text>
                              <Text style={styles.desc} numberOfLines={2}>
                                {searchQuery
                                    ? highlightText(trend.description, searchQuery)
                                    : trend.description}
                              </Text>
                              <Text style={styles.meta}>
                                {trend.category} • 인기도 {trend.popularity}% • {formatDate(trend.createdAt)}
                              </Text>
                            </View>
                            <IconButton
                                icon="bookmark"
                                size={20}
                                iconColor="#f59e42"
                                onPress={() => onToggleTrendScrap(trend.id)}
                            />
                          </View>
                        </Card>
                    ))
                )}
              </>
          )}

          {/* 하단 여백 */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fafafa",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#3b0764",
  },
  searchInput: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },
  filterRow: {
    flexDirection: "row",
    marginBottom: 12,
    flexWrap: "wrap",
  },
  filterChip: {
    marginRight: 8,
    marginBottom: 4,
  },
  chipText: {
    fontSize: 12,
    color: "#666",
  },
  selectedChipText: {
    fontSize: 12,
    color: "#3b0764",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  subTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#3b0764",
    marginTop: 8,
    marginBottom: 12,
  },
  card: {
    marginVertical: 6,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  emotion: {
    fontSize: 28,
    marginRight: 12,
    marginTop: 2,
  },
  trendIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  trendIconText: {
    fontSize: 28,
  },
  contentArea: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
    color: "#1f2937",
    lineHeight: 22,
  },
  desc: {
    color: "#6b7280",
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  meta: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  tag: {
    fontSize: 11,
    color: "#7c3aed",
    marginRight: 8,
    fontWeight: "500",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 16,
    color: "#9ca3af",
    marginTop: 40,
    fontStyle: "italic",
  },
  highlightText: {
    backgroundColor: "#fef3c7",
    fontWeight: "600",
  },
  bottomSpacing: {
    height: 20,
  },
});