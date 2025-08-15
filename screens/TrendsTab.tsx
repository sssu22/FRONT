import React, { useMemo, useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Trend } from "../types"; 
import { trendsApi } from "../utils/apiUtils";

interface TrendsTabProps {
  onTrendView?: (trendId: number, category: string) => void;
  searchQuery?: string;
}

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
  trendIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", marginRight: 12 },
  hotTrendIcon: { backgroundColor: "#fef3c7" },
  recentTrendIcon: { backgroundColor: "#ddd6fe" },
  predictionTrendIcon: { backgroundColor: "#d1fae5" },
  trendInfo: { flex: 1 },
  trendTitle: { fontSize: 16, fontWeight: "bold", color: "#1f2937", marginBottom: 4 },
  trendTag: { fontSize: 12, color: "#8b5cf6", marginBottom: 4 },
  scoreContainer: { alignItems: "flex-end" },
  trendScore: { fontSize: 18, fontWeight: "bold", color: "#8b5cf6" },
  increaseContainer: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  increaseText: { fontSize: 12, fontWeight: "600", marginLeft: 4 },
  increasePositive: { color: "#16a34a" },
  increaseNegative: { color: "#dc2626" },
  confidenceText: { fontSize: 11, color: "#6b7280", marginTop: 2 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40 },
  emptyText: { textAlign: "center", color: "#6b7280", fontSize: 14, marginTop: 20, paddingVertical: 10 },
});

export default function TrendsTab({
  onTrendView = () => {},
  searchQuery = "",
}: TrendsTabProps) {
  const [recentTrends, setRecentTrends] = useState<Trend[]>([]);
  const [popularTrends, setPopularTrends] = useState<Trend[]>([]);
  const [recommendedTrends, setRecommendedTrends] = useState<Trend[]>([]);
  const [predictedTrends, setPredictedTrends] = useState<Trend[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Trend[]>([]);

  const loadDefaultTrends = useCallback(async () => {
    setLoading(true);
    try {
      const [recentData, popularData, recData, predData] = await Promise.all([
        trendsApi.getRecent(),
        trendsApi.getPopular(),
        trendsApi.getRecommendations(),
        trendsApi.getPredictions(),
      ]);
      setRecentTrends(recentData);
      setPopularTrends(popularData);
      setRecommendedTrends(recData);
      setPredictedTrends(predData);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

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
        console.error('트렌드 검색 실패:', error);
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

  const totalTrendsCount = useMemo(() => {
    const combined = [...popularTrends, ...recentTrends, ...recommendedTrends, ...predictedTrends];
    const trendMap = new Map<number, Trend>();
    combined.forEach((trend) => trendMap.set(trend.id, trend));
    return trendMap.size;
  }, [popularTrends, recentTrends, recommendedTrends, predictedTrends]);

  const showEmptySearch = searchQuery && !isSearching && searchResults.length === 0;

  const getTrendTag = (trend: Trend) => {
    return (Array.isArray(trend.tags) ? trend.tags[0] : trend.tags) || trend.category || "";
  };

  const renderTrendIcon = (type: 'hot' | 'recent' | 'prediction') => {
    let iconStyle = styles.hotTrendIcon;
    let iconName: any = "sparkles";
    let iconColor = "#f59e0b";
    if (type === 'recent') { iconStyle = styles.recentTrendIcon; iconName = "time"; iconColor = "#8b5cf6"; }
    else if (type === 'prediction') { iconStyle = styles.predictionTrendIcon; iconName = "analytics"; iconColor = "#10b981"; }
    return <View style={[styles.trendIcon, iconStyle]}><Ionicons name={iconName} size={20} color={iconColor} /></View>;
  };
  const renderRankIcon = (index: number) => {
    const rankStyles = [styles.rank1, styles.rank2, styles.rank3];
    const rankStyle = rankStyles[index] || styles.rankDefault;
    return <View style={[styles.rankContainer, rankStyle]}><Text style={styles.rankText}>{index + 1}</Text></View>;
  };
  const renderIncreaseIndicator = (increaseScore?: number, confidence?: number) => {
    if (increaseScore === undefined) return null;
    const isPositive = increaseScore > 0;
    const iconName = isPositive ? "trending-up" : increaseScore < 0 ? "trending-down" : "remove";
    const color = isPositive ? "#16a34a" : increaseScore < 0 ? "#dc2626" : "#6b7280";
    return (
      <View style={styles.increaseContainer}>
        <Ionicons name={iconName} size={14} color={color} />
        <Text style={[styles.increaseText, isPositive ? styles.increasePositive : styles.increaseNegative]}>
          {increaseScore > 0 ? '+' : ''}{increaseScore.toString()}%
        </Text>
        {confidence && <Text style={styles.confidenceText}> 신뢰도 {confidence.toString()}%</Text>}
      </View>
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
              <Text style={styles.emptyText}>'{searchQuery}'에 대한 검색 결과가 없습니다.</Text>
            </View>
          ) : (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="search" size={20} color="#8b5cf6" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>검색 결과</Text>
                <Text style={styles.sectionSubtitle}>{searchResults.length}개</Text>
              </View>
              {searchResults.map((trend, index) => {
                const tag = getTrendTag(trend);
                return (
                  <TouchableOpacity
                    key={`search-${trend.id}`}
                    style={styles.trendCard}
                    onPress={() => onTrendView(trend.id, tag)}
                  >
                    {renderRankIcon(index)}
                    <View style={styles.trendInfo}>
                      <Text style={styles.trendTitle}>{trend.title}</Text>
                      {tag && <Text style={styles.trendTag}>#{tag}</Text>}
                    </View>
                    <View style={styles.scoreContainer}>
                      <Text style={styles.trendScore}>{trend.score?.toString()}</Text>
                      {renderIncreaseIndicator(trend.increaseScore, trend.prediction?.confidence)}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </>
      ) : (
        <>
          <View style={styles.statsContainer}>
            <Text style={styles.statsNumber}>{totalTrendsCount.toString()}</Text>
            <Text style={styles.statsLabel}>내 트렌드 점수</Text>
            <View style={styles.progressBar}><View style={[styles.progressFill, { width: '70%' }]} /></View>
          </View>

          {/* ★ 수정: 맞춤 추천 섹션 (데이터가 있을 때만 표시) */}
          {recommendedTrends.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={20} color="#8b5cf6" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>맞춤 추천</Text>
                <Text style={styles.sectionSubtitle}>추천</Text>
              </View>
              {recommendedTrends.slice(0, 2).map((trend) => {
                const tag = getTrendTag(trend);
                return (
                  <TouchableOpacity key={trend.id} style={styles.trendCard} onPress={() => onTrendView(trend.id, tag)}>
                    {renderTrendIcon('hot')}
                    <View style={styles.trendInfo}>
                      <Text style={styles.trendTitle}>{trend.title}</Text>
                      {tag && <Text style={styles.trendTag}>#{tag}</Text>}
                    </View>
                    <View style={styles.scoreContainer}><Text style={styles.trendScore}>{trend.score?.toString()}</Text></View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
          
          {/* ★ 수정: 앞으로의 트렌드 섹션 (데이터가 있을 때만 표시) */}
          {predictedTrends.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Ionicons name="analytics" size={20} color="#10b981" style={styles.sectionIcon} />
                <Text style={styles.sectionTitle}>앞으로의 트렌드</Text>
                <Text style={styles.sectionSubtitle}>시세별 분석</Text>
              </View>
              {predictedTrends.slice(0, 2).map((trend) => {
                const tag = getTrendTag(trend);
                return (
                  <TouchableOpacity key={trend.id} style={styles.trendCard} onPress={() => onTrendView(trend.id, tag)}>
                    {renderTrendIcon('prediction')}
                    <View style={styles.trendInfo}>
                      <Text style={styles.trendTitle}>{trend.title}</Text>
                      {tag && <Text style={styles.trendTag}>#{tag}</Text>}
                    </View>
                    <View style={styles.scoreContainer}>
                      {renderIncreaseIndicator(trend.increaseScore, trend.prediction?.confidence)}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {popularTrends.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="trophy" size={20} color="#f59e0b" style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>최고 트렌드 경험</Text>
                </View>
                {popularTrends.slice(0, 4).map((trend, index) => {
                  const tag = getTrendTag(trend);
                  return (
                    <TouchableOpacity key={`top-${trend.id}`} style={styles.trendCard} onPress={() => onTrendView(trend.id, tag)}>
                      {renderRankIcon(index)}
                      <View style={styles.trendInfo}>
                        <Text style={styles.trendTitle}>{trend.title}</Text>
                        {tag && <Text style={styles.trendTag}>#{tag}</Text>}
                      </View>
                      <View style={styles.scoreContainer}>
                        <Text style={styles.trendScore}>{trend.score?.toString()}</Text>
                        <Text style={styles.confidenceText}>점</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
          )}

          {recentTrends.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time" size={20} color="#8b5cf6" style={styles.sectionIcon} />
                  <Text style={styles.sectionTitle}>최근 트렌드</Text>
                </View>
                {recentTrends.slice(0, 4).map((trend, index) => {
                  const tag = getTrendTag(trend);
                  return (
                    <TouchableOpacity key={`recent-${trend.id}`} style={styles.trendCard} onPress={() => onTrendView(trend.id, tag)}>
                      {renderRankIcon(index)}
                      <View style={styles.trendInfo}>
                        <Text style={styles.trendTitle}>{trend.title}</Text>
                        {tag && <Text style={styles.trendTag}>#{tag}</Text>}
                      </View>
                      <View style={styles.scoreContainer}>
                        <Text style={styles.trendScore}>{trend.score?.toString()}</Text>
                        {renderIncreaseIndicator(trend.increaseScore)}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </>
          )}

          {recommendedTrends.length === 0 &&
            predictedTrends.length === 0 &&
            popularTrends.length === 0 &&
            recentTrends.length === 0 && (
            <Text style={styles.emptyText}>아직 트렌드 데이터가 없습니다.</Text>
          )}
        </>
      )}
    </ScrollView>
  );
}
