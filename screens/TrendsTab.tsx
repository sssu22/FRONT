import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Trend } from "../types";
import { trendsApi, usersApi } from "../utils/apiUtils";
import { useGlobalContext } from "../GlobalContext";

interface TrendsTabProps {
  onTrendView?: (trendId: number, category: string) => void;
  searchQuery?: string;
}

// Stylesheet
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9ff", padding: 16 },
  statsContainer: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 24, alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  statsNumber: { fontSize: 48, fontWeight: "bold", color: "#8b5cf6", marginBottom: 4 },
  statsLabel: { fontSize: 16, color: "#6b7280", marginBottom: 16 },
  progressBar: { width: "100%", height: 6, backgroundColor: "#e5e7eb", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#8b5cf6", borderRadius: 3 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16, marginTop: 8 },
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
  increaseContainer: { flexDirection: "row", alignItems: "center", marginRight: 8 },
  increaseText: { fontSize: 12, fontWeight: "600", marginLeft: 4 },
  increasePositive: { color: "#16a34a" },
  increaseNegative: { color: "#dc2626" },
  confidenceText: { fontSize: 11, color: "#6b7280", marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyText: { textAlign: "center", color: "#6b7280", fontSize: 14, marginTop: 20, paddingVertical: 10 },
});

export default function TrendsTab({
                                    onTrendView = () => {},
                                    searchQuery = "",
                                  }: TrendsTabProps) {
  // --- GlobalContext에서 상태와 함수 가져오기 ---
  const { user, scrappedTrends, toggleTrendScrap } = useGlobalContext();

  // --- 컴포넌트 내부 상태 ---
  const [recentTrends, setRecentTrends] = useState<Trend[]>([]);
  const [popularTrends, setPopularTrends] = useState<Trend[]>([]);
  const [recommendedTrends, setRecommendedTrends] = useState<Trend[]>([]);
  const [predictedTrends, setPredictedTrends] = useState<Trend[]>([]);
  const [averageScore, setAverageScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Trend[]>([]);

  // --- 데이터 로딩 및 검색 로직 ---
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

      if (statsData?.averageScore) {
        setAverageScore(statsData.averageScore);
      }

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
    loadDefaultTrends();
  }, [loadDefaultTrends]);

  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await trendsApi.search(searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("트렌드 검색 실패:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // --- 스크랩 핸들러 ---
  const handleScrap = async (trendId: number) => {
    if (!user) {
      Alert.alert("로그인 필요", "스크랩 기능은 로그인 후 사용할 수 있습니다.");
      return;
    }
    await toggleTrendScrap(trendId);
  };

  // --- 렌더링 관련 로직 ---
  const showEmptySearch =
      searchQuery && !isSearching && searchResults.length === 0;

  const getTrendTag = (trend: Trend) => {
    return (
        (Array.isArray(trend.tags) ? trend.tags[0] : trend.tags) ||
        trend.category ||
        ""
    );
  };

  const renderRankIcon = (index: number) => {
    const rankStyles = [styles.rank1, styles.rank2, styles.rank3];
    const rankStyle = rankStyles[index] || styles.rankDefault;
    return (
        <View style={[styles.rankContainer, rankStyle]}>
          <Text style={styles.rankText}>{index + 1}</Text>
        </View>
    );
  };

  const renderIncreaseIndicator = (
      increaseScore?: number,
      confidence?: number
  ) => {
    if (!increaseScore) return null;

    const isPositive = increaseScore > 0;
    const iconName = isPositive ? "trending-up" : "trending-down";
    const color = isPositive ? "#16a34a" : "#dc2626";

    return (
        <View style={styles.increaseContainer}>
          <Ionicons name={iconName} size={14} color={color} />
          <Text
              style={[
                styles.increaseText,
                isPositive ? styles.increasePositive : styles.increaseNegative,
              ]}
          >
            {isPositive ? "+" : ""}
            {increaseScore.toString()}%
          </Text>
          {confidence && (
              <Text style={styles.confidenceText}>
                신뢰도 {confidence.toString()}%
              </Text>
          )}
        </View>
    );
  };

  const renderTrendCard = (trend: Trend, index?: number, section?: string) => {
    const tag = getTrendTag(trend);
    const isScrapped = scrappedTrends.has(trend.id);

    return (
        <TouchableOpacity
            key={`trend-${trend.id}`}
            style={styles.trendCard}
            onPress={() => onTrendView(trend.id, tag)}
        >
          {index !== undefined && renderRankIcon(index)}
          <View style={styles.trendInfo}>
            <Text style={styles.trendTitle} numberOfLines={1}>
              {trend.title}
            </Text>
            {tag && <Text style={styles.trendTag}>#{tag}</Text>}
          </View>
          <View style={styles.rightContainer}>
            {section === 'predicted' ? (
                renderIncreaseIndicator(trend.increaseScore, trend.prediction?.confidence)
            ) : (
                <View style={styles.scoreContainer}>
                  <Text style={styles.trendScore}>
                    {trend.score?.toString() || "0"}
                  </Text>
                  {trend.increaseScore !== undefined && (
                      <Text
                          style={[
                            styles.increaseText,
                            trend.increaseScore > 0
                                ? styles.increasePositive
                                : styles.increaseNegative,
                          ]}
                      >
                        {trend.increaseScore > 0 ? "+" : ""}
                        {trend.increaseScore}%
                      </Text>
                  )}
                </View>
            )}
            <TouchableOpacity onPress={() => handleScrap(trend.id)}>
              <Ionicons
                  name={isScrapped ? "bookmark" : "bookmark-outline"}
                  size={22}
                  color={isScrapped ? "#FFC107" : "#6b7280"}
              />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
    );
  };

  if (loading) {
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
      <ScrollView style={styles.container}>
        {searchQuery ? (
            <>
              {isSearching ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8b5cf6" />
                    <Text style={styles.emptyText}>'{searchQuery}' 검색 중...</Text>
                  </View>
              ) : showEmptySearch ? (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.emptyText}>
                      '{searchQuery}'에 대한 검색 결과가 없습니다.
                    </Text>
                  </View>
              ) : (
                  <>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                          name="search"
                          size={20}
                          color="#8b5cf6"
                          style={styles.sectionIcon}
                      />
                      <Text style={styles.sectionTitle}>검색 결과</Text>
                      <Text style={styles.sectionSubtitle}>
                        {searchResults.length}개
                      </Text>
                    </View>
                    {searchResults.map((trend, index) =>
                        renderTrendCard(trend, index, 'search')
                    )}
                  </>
              )}
            </>
        ) : (
            <>
              <View style={styles.statsContainer}>
                <Text style={styles.statsNumber}>{averageScore.toString()}</Text>
                <Text style={styles.statsLabel}>내 트렌드 점수</Text>
                <View style={styles.progressBar}>
                  <View
                      style={[styles.progressFill, { width: `${averageScore}%` }]}
                  />
                </View>
              </View>

              {recommendedTrends.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                          name="sparkles"
                          size={20}
                          color="#8b5cf6"
                          style={styles.sectionIcon}
                      />
                      <Text style={styles.sectionTitle}>맞춤 추천</Text>
                      <Text style={styles.sectionSubtitle}>추천</Text>
                    </View>
                    {recommendedTrends
                        .slice(0, 3)
                        .map((trend) => renderTrendCard(trend, undefined, 'recommended'))}
                  </>
              )}

              {predictedTrends.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                          name="analytics"
                          size={20}
                          color="#10b981"
                          style={styles.sectionIcon}
                      />
                      <Text style={styles.sectionTitle}>앞으로의 트렌드</Text>
                      <Text style={styles.sectionSubtitle}>사계열 분석</Text>
                    </View>
                    {predictedTrends
                        .slice(0, 3)
                        .map((trend) => renderTrendCard(trend, undefined, 'predicted'))}
                  </>
              )}

              {popularTrends.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                          name="trophy"
                          size={20}
                          color="#f59e0b"
                          style={styles.sectionIcon}
                      />
                      <Text style={styles.sectionTitle}>최고 트렌드 경험</Text>
                    </View>
                    {popularTrends
                        .slice(0, 5)
                        .map((trend, index) => renderTrendCard(trend, index, 'popular'))}
                  </>
              )}

              {recentTrends.length > 0 && (
                  <>
                    <View style={styles.sectionHeader}>
                      <Ionicons
                          name="time"
                          size={20}
                          color="#8b5cf6"
                          style={styles.sectionIcon}
                      />
                      <Text style={styles.sectionTitle}>최근 트렌드</Text>
                    </View>
                    {/* ✨ 'recent' 섹션 정보를 전달합니다. */}
                    {recentTrends
                        .slice(0, 3)
                        .map((trend, index) => renderTrendCard(trend, index, 'recent'))}
                  </>
              )}

              {recommendedTrends.length === 0 &&
                  predictedTrends.length === 0 &&
                  popularTrends.length === 0 &&
                  recentTrends.length === 0 && (
                      <Text style={styles.emptyText}>
                        아직 트렌드 데이터가 없습니다.
                      </Text>
                  )}
            </>
        )}
      </ScrollView>
  );
}
