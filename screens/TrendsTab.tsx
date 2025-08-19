// sssu22/front/FRONT-feature-/screens/TrendsTab.tsx

import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import DropDownPicker from "react-native-dropdown-picker";
import { Trend } from "../types";
import { trendsApi, usersApi } from "../utils/apiUtils";
import { useGlobalContext } from "../GlobalContext";

// 필터 옵션 상수 정의
const sortOptions = [
  { label: '최신순', value: 'latest' },
  { label: '인기순', value: 'trend' },
];
const categories = ["all", "FOOD", "LIFESTYLE", "CULTURE", "HEALTH", "INVESTMENT", "SOCIAL", "ETC"];
const categoryLabels: Record<string, string> = {
  all: "전체", FOOD: "음식", LIFESTYLE: "라이프스타일", CULTURE: "문화",
  HEALTH: "건강", INVESTMENT: "투자", SOCIAL: "소셜", ETC: "기타",
};
const categoryIcons: Record<string, React.ComponentProps<typeof Ionicons>['name']> = {
  all: "apps-outline", FOOD: "restaurant-outline", LIFESTYLE: "happy-outline",
  CULTURE: "film-outline", HEALTH: "fitness-outline", INVESTMENT: "cash-outline",
  SOCIAL: "people-outline", ETC: "ellipse-outline",
};
const categoryItems = categories.map(cat => ({
  label: categoryLabels[cat],
  value: cat,
  icon: () => <Ionicons name={categoryIcons[cat]} size={18} color="#555" />
}));


interface TrendsTabProps {
  onTrendView?: (trendId: number) => void;
  searchQuery?: string;
}

export default function TrendsTab({
                                    onTrendView = () => {},
                                    searchQuery = "",
                                  }: TrendsTabProps) {
  const { user, scrappedTrends, toggleTrendScrap } = useGlobalContext();

  const [recentTrends, setRecentTrends] = useState<Trend[]>([]);
  const [popularTrends, setPopularTrends] = useState<Trend[]>([]);
  const [recommendedTrends, setRecommendedTrends] = useState<Trend[]>([]);
  const [predictedTrends, setPredictedTrends] = useState<Trend[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [loading, setLoading] = useState(true);

  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Trend[]>([]);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'trend'>('latest');
  const [category, setCategory] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);

  const [sortOpen, setSortOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);

  const onSortOpen = useCallback(() => setCategoryOpen(false), []);
  const onCategoryOpen = useCallback(() => setSortOpen(false), []);

  const loadDefaultTrends = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, recentData, popularData, recData, predData] =
          await Promise.all([
            user ? usersApi.getMyStats() : Promise.resolve(null),
            trendsApi.getRecent(),
            trendsApi.getPopular(),
            trendsApi.getRecommendations(),
            trendsApi.getPredictions(),
          ]);
      if (statsData?.averageScore) { setAverageScore(statsData.averageScore); }
      setRecentTrends(recentData);
      setPopularTrends(popularData);
      setRecommendedTrends(recData);
      setPredictedTrends(predData);
    } catch (error) {
      console.error("기본 데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!searchQuery) {
      loadDefaultTrends();
    }
  }, [searchQuery, loadDefaultTrends]);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setTotalResults(0);
        return;
      }
      setIsSearching(true);
      try {
        const response = await trendsApi.search({
          keyword: searchQuery,
          category: category,
          sortBy: sortBy,
          page: currentPage,
        });
        setSearchResults(response.list);
        setTotalPages(response.pageInfo.totalPages);
        setTotalResults(response.pageInfo.totalElements);
      } catch (error) {
        console.error("트렌드 검색 실패:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery, category, sortBy, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, category, sortBy]);

  const handleScrap = async (trendId: number) => {
    if (!user) {
      Alert.alert("로그인 필요", "스크랩 기능은 로그인 후 사용할 수 있습니다.");
      return;
    }
    await toggleTrendScrap(trendId);
  };

  const getTrendTag = (trend: Trend) => (
      (Array.isArray(trend.tags) ? trend.tags[0] : trend.tags) || trend.category || ""
  );

  const renderRankIcon = (index: number) => {
    const rank = (currentPage - 1) * 10 + index + 1;
    const rankStyles = [styles.rank1, styles.rank2, styles.rank3];
    const rankStyle = rank <= 3 ? rankStyles[rank - 1] : styles.rankDefault;
    return (
        <View style={[styles.rankContainer, rankStyle]}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
    );
  };

  const renderIncreaseIndicator = (increaseScore?: number, confidence?: number) => {
    if (increaseScore === undefined || increaseScore === null) return null;
    const isPositive = increaseScore > 0;
    const iconName = isPositive ? "trending-up" : "trending-down";
    const color = isPositive ? "#16a34a" : "#dc2626";
    return (
        <View style={styles.increaseContainer}>
          <Ionicons name={iconName} size={14} color={color} />
          <Text style={[styles.increaseText, isPositive ? styles.increasePositive : styles.increaseNegative]}>
            {isPositive ? "+" : ""}{increaseScore.toString()}%
          </Text>
          {confidence && (<Text style={styles.confidenceText}>신뢰도 {confidence.toString()}%</Text>)}
        </View>
    );
  };

  // ✅ 렌더링 함수에 section 파라미터를 다시 추가하고, 내부 로직을 복원합니다.
  const renderTrendCard = (trend: Trend, index?: number, section?: string) => {
    const tag = getTrendTag(trend);
    const isScrapped = scrappedTrends.has(trend.id);
    const showRank = index !== undefined && section !== 'predicted' && section !== 'recommended';

    return (
        <TouchableOpacity key={`trend-${trend.id}`} style={styles.trendCard} onPress={() => onTrendView(trend.id)}>
          {showRank && renderRankIcon(index)}
          <View style={styles.trendInfo}>
            <Text style={styles.trendTitle} numberOfLines={1}>{trend.title}</Text>
            {tag && <Text style={styles.trendTag}>#{tag}</Text>}
          </View>
          <View style={styles.rightContainer}>
            {section === 'predicted' ? (
                renderIncreaseIndicator(trend.increaseScore, trend.prediction?.confidence)
            ) : (
                <View style={styles.scoreContainer}>
                  <Text style={styles.trendScore}>{trend.score?.toString() || "0"}</Text>
                  {renderIncreaseIndicator(trend.increaseScore)}
                </View>
            )}
            <TouchableOpacity onPress={() => handleScrap(trend.id)}>
              <Ionicons name={isScrapped ? "bookmark" : "bookmark-outline"} size={22} color={isScrapped ? "#FFC107" : "#6b7280"}/>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
    );
  };

  const PaginationControls = () => {
    if (totalPages <= 1) return null;
    return (
        <View style={styles.paginationContainer}>
          <TouchableOpacity onPress={() => setCurrentPage(p => p - 1)} disabled={currentPage <= 1 || isSearching} style={[styles.pageButton, (currentPage <= 1 || isSearching) && styles.disabledButton]}>
            <Text style={styles.pageButtonText}>이전</Text>
          </TouchableOpacity>
          <Text style={styles.pageInfoText}>{`${currentPage} / ${totalPages}`}</Text>
          <TouchableOpacity onPress={() => setCurrentPage(p => p + 1)} disabled={currentPage >= totalPages || isSearching} style={[styles.pageButton, (currentPage >= totalPages || isSearching) && styles.disabledButton]}>
            <Text style={styles.pageButtonText}>다음</Text>
          </TouchableOpacity>
        </View>
    );
  };

  if (loading && !searchQuery) {
    return (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8b5cf6" />
            <Text style={styles.emptyText}>트렌드 데이터를 불러오는 중...</Text>
          </View>
        </View>
    );
  }

  return (
      <View style={{flex: 1}}>
        {searchQuery ? (
            <FlatList
                style={styles.container}
                data={searchResults}
                keyExtractor={(item) => item.id.toString()}
                // ✅ FlatList의 renderItem이 renderTrendCard를 올바르게 호출하도록 수정
                renderItem={({ item, index }) => renderTrendCard(item, index, 'search')}
                ListHeaderComponent={
                  <>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="search" size={20} color="#8b5cf6" style={styles.sectionIcon} />
                      <Text style={styles.sectionTitle}>"{searchQuery}" 검색 결과</Text>
                      <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
                        <Ionicons name="options-outline" size={20} color="#424242" />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.totalResultsText}>총 {totalResults}개</Text>
                  </>
                }
                ListFooterComponent={isSearching ? <ActivityIndicator style={{margin: 20}}/> : <PaginationControls />}
                ListEmptyComponent={!isSearching ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
                    </View>
                ) : null
                }
            />
        ) : (
            <ScrollView style={styles.container}>
              <View style={styles.statsContainer}>
                <Text style={styles.statsNumber}>{averageScore.toString()}</Text>
                <Text style={styles.statsLabel}>내 트렌드 점수</Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${averageScore}%` }]} />
                </View>
              </View>

              {recommendedTrends.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="sparkles" size={20} color="#8b5cf6" style={styles.sectionIcon} />
                      <Text style={styles.sectionTitle}>맞춤 추천</Text>
                      <Text style={styles.sectionSubtitle}>추천</Text>
                    </View>
                    {/* ✅ map 함수에서 renderTrendCard를 올바르게 호출하도록 수정 */}
                    {recommendedTrends.slice(0, 3).map((trend) => renderTrendCard(trend, undefined, 'recommended'))}
                  </>
              )}

              {predictedTrends.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="analytics" size={20} color="#10b981" style={styles.sectionIcon} />
                      <Text style={styles.sectionTitle}>앞으로의 트렌드</Text>
                      <Text style={styles.sectionSubtitle}>시계열 분석</Text>
                    </View>
                    {predictedTrends.slice(0, 3).map((trend) => renderTrendCard(trend, undefined, 'predicted'))}
                  </>
              )}

              {popularTrends.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="trophy" size={20} color="#f59e0b" style={styles.sectionIcon} />
                      <Text style={styles.sectionTitle}>최고 트렌드 경험</Text>
                    </View>
                    {popularTrends.slice(0, 5).map((trend, index) => renderTrendCard(trend, index, 'popular'))}
                  </>
              )}

              {recentTrends.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Ionicons name="time" size={20} color="#8b5cf6" style={styles.sectionIcon} />
                      <Text style={styles.sectionTitle}>최근 트렌드</Text>
                    </View>
                    {recentTrends.slice(0, 3).map((trend, index) => renderTrendCard(trend, index, 'recent'))}
                  </>
              )}

              {recommendedTrends.length === 0 && predictedTrends.length === 0 && popularTrends.length === 0 && recentTrends.length === 0 && (
                  <Text style={styles.emptyText}>아직 트렌드 데이터가 없습니다.</Text>
              )}
            </ScrollView>
        )}

        <Modal visible={showFilterModal} transparent animationType="slide" onRequestClose={() => setShowFilterModal(false)}>
          <TouchableOpacity style={styles.modalBackground} activeOpacity={1} onPressOut={() => setShowFilterModal(false)}>
            <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
              <Text style={styles.modalTitle}>필터 및 정렬</Text>

              <View style={{zIndex: 2000}}>
                <Text style={styles.label}>정렬 기준</Text>
                <DropDownPicker
                    open={sortOpen}
                    value={sortBy}
                    items={sortOptions}
                    setOpen={setSortOpen}
                    setValue={setSortBy}
                    onOpen={onSortOpen}
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainerStyle}
                />
              </View>

              <View style={{zIndex: 1000}}>
                <Text style={styles.label}>카테고리</Text>
                <DropDownPicker
                    open={categoryOpen}
                    value={category}
                    items={categoryItems}
                    setOpen={setCategoryOpen}
                    setValue={setCategory}
                    onOpen={onCategoryOpen}
                    style={styles.dropdown}
                    dropDownContainerStyle={styles.dropdownContainerStyle}
                />
              </View>

              <TouchableOpacity style={styles.closeButton} onPress={() => setShowFilterModal(false)}>
                <Text style={styles.closeText}>적용</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9ff", paddingHorizontal: 16, paddingTop: 8 },
  statsContainer: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  statsNumber: { fontSize: 48, fontWeight: "bold", color: "#8b5cf6", marginBottom: 4 },
  statsLabel: { fontSize: 16, color: "#6b7280", marginBottom: 16 },
  progressBar: { width: "100%", height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#8b5cf6", borderRadius: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8, marginTop: 8, paddingHorizontal: 4 },
  sectionIcon: { marginRight: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1f2937", flex: 1 },
  sectionSubtitle: { fontSize: 12, color: "#8b5cf6", fontWeight: "600" },
  trendCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: "row", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  rankContainer: { width: 30, height: 30, borderRadius: 15, justifyContent: "center", alignItems: "center", marginRight: 12 },
  rank1: { backgroundColor: "#ffd700" },
  rank2: { backgroundColor: "#c0c0c0" },
  rank3: { backgroundColor: "#cd7f32" },
  rankDefault: { backgroundColor: "#e5e7eb" },
  rankText: { fontSize: 14, fontWeight: "bold", color: "#fff" },
  trendInfo: { flex: 1, marginRight: 8 },
  trendTitle: { fontSize: 16, fontWeight: "bold", color: "#1f2937", marginBottom: 4 },
  trendTag: { fontSize: 12, color: "#8b5cf6", marginBottom: 4 },
  rightContainer: { flexDirection: 'row', alignItems: 'center' },
  scoreContainer: { alignItems: "flex-end", marginRight: 8 },
  trendScore: { fontSize: 18, fontWeight: "bold", color: "#8b5cf6" },
  increaseContainer: { flexDirection: "row", alignItems: "center" },
  increaseText: { fontSize: 12, fontWeight: "600", marginLeft: 4 },
  increasePositive: { color: "#16a34a" },
  increaseNegative: { color: "#dc2626" },
  confidenceText: { fontSize: 11, color: "#6b7280", marginLeft: 8 },
  filterButton: { padding: 8 },
  totalResultsText: { color: '#6b7280', fontSize: 12, marginBottom: 8, marginLeft: 4, marginTop: 16},
  paginationContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16 },
  pageButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#e5e7eb', borderRadius: 8 },
  pageButtonText: { fontWeight: 'bold' },
  disabledButton: { backgroundColor: '#f3f4f6', opacity: 0.6 },
  pageInfoText: { fontSize: 16, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyText: { textAlign: "center", color: "#6b7280", fontSize: 14, marginTop: 20, paddingVertical: 10 },
  modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  modalContainer: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  label: { fontSize: 13, color: "#4B5563", marginBottom: 8, fontWeight: "500", marginTop: 8 },
  dropdown: { borderColor: "#D1D5DB", borderWidth: 1, borderRadius: 10, backgroundColor: "#FAFAFA", marginBottom: 16 },
  dropdownContainerStyle: { borderColor: "#D1D5DB", backgroundColor: "#FFFFFF", borderRadius: 10 },
  closeButton: { marginTop: 16, backgroundColor: "#7C3AED", padding: 14, borderRadius: 10 },
  closeText: { textAlign: "center", color: "white", fontWeight: "600" },
});