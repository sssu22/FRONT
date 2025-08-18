// sssu22/front/FRONT-feature-UI-API2-/screens/HomeTab.tsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Card, Chip } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useIsFocused } from "@react-navigation/native";
import { postsApi, tagsApi } from "../utils/apiUtils";
import { Experience, PopularTag } from "../types";

// 감정 아이콘
const emotionIcons: Record<string, string> = {
  joy: "😊", excitement: "🔥", nostalgia: "💭", surprise: "😲", love: "💖",
  regret: "😞", sadness: "😢", irritation: "😒", anger: "😡", embarrassment: "😳",
};

// 감정 색상
const emotionColors: Record<string, string> = {
  joy: "#FFD700", excitement: "#FF4500", nostalgia: "#B0C4DE", surprise: "#9932CC",
  love: "#FF69B4", regret: "#778899", sadness: "#4682B4", irritation: "#F0E68C",
  anger: "#DC143C", embarrassment: "#FFB6C1",
};

// 감정 필터 아이템
const emotionItems = [
  { label: "전체", value: "all" },
  { label: "😊 기쁨", value: "JOY" },
  { label: "🔥 흥분", value: "EXCITEMENT" },
  { label: "💭 향수", value: "NOSTALGIA" },
  { label: "😲 놀라움", value: "SURPRISE" },
  { label: "💖 사랑", value: "LOVE" },
  { label: "😞 아쉬움", value: "REGRET" },
  { label: "😢 슬픔", value: "SADNESS" },
  { label: "😒 짜증", value: "IRRITATION" },
  { label: "😡 화남", value: "ANGER" },
  { label: "😳 당황", value: "EMBARRASSMENT" },
];

interface HomeTabProps {
  onExperienceClick: (experience: Experience) => void;
  searchQuery: string;
  onViewAllPress: () => void;
  onTagPress: (tag: string) => void;
}

export default function HomeTab({ onExperienceClick, searchQuery, onViewAllPress, onTagPress }: HomeTabProps) {
  const isFocused = useIsFocused();
  const [popularPosts, setPopularPosts] = useState<Experience[]>([]);
  const [allPosts, setAllPosts] = useState<Experience[]>([]);
  const [popularTags, setPopularTags] = useState<PopularTag[]>([]);
  const [searchResults, setSearchResults] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");

  const fetchHomeData = useCallback(async () => {
    setLoading(true);
    try {
      const [popularData, allDataResponse, tagsData] = await Promise.all([
        postsApi.getPopular(),
        postsApi.getAll({ sort: 'latest', page: 1, size: 5 }),
        tagsApi.getPopular(),
      ]);
      setPopularPosts(popularData);
      setAllPosts(allDataResponse.list);
      setPopularTags(tagsData);
    } catch (error) {
      console.error("홈 탭 데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused && !searchQuery) {
      fetchHomeData();
    }
  }, [isFocused, searchQuery, fetchHomeData]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const results = await postsApi.search(searchQuery);
      setSearchResults(results);
    } catch (error) {
      console.error("게시물 검색 실패:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery, performSearch]);

  useEffect(() => {
    // 필터가 변경되면 검색을 다시 수행
    if (searchQuery) {
      performSearch();
    }
  }, [sortBy, emotionFilter, performSearch, searchQuery]);


  if (loading && !searchQuery) {
    return (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={{ marginTop: 10 }}>데이터를 불러오는 중...</Text>
        </View>
    );
  }

  return (
      <ScrollView style={styles.container}>
        {searchQuery ? (
            <>
              <View style={styles.searchHeader}>
                <Text style={styles.resultsLabel}>
                  "{searchQuery}"에 대한 {isSearching ? '...' : searchResults.length}개 결과
                </Text>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilter(!showFilter)}
                >
                  <Ionicons name="filter-outline" size={18} color="#7C3AED" />
                  <Text style={styles.filterButtonText}>필터</Text>
                </TouchableOpacity>
              </View>

              {showFilter && (
                  <FilterPanel
                      sortBy={sortBy}
                      setSortBy={setSortBy}
                      emotionFilter={emotionFilter}
                      setEmotionFilter={setEmotionFilter}
                  />
              )}

              {isSearching ? (
                  <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }}/>
              ) : searchResults.length === 0 ? (
                  <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
              ) : (
                  searchResults.map((exp) => (
                      <ExperienceCard key={exp.id} experience={exp} onClick={onExperienceClick} />
                  ))
              )}
            </>
        ) : (
            <>
              <Text style={styles.sectionTitle}>🔥 지금 뜨는 경험</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hotScroll}>
                {popularPosts.map((exp) => (
                    <HotExperienceCard key={exp.id} experience={exp} onClick={onExperienceClick} />
                ))}
              </ScrollView>

              <View style={styles.filterHeader}>
                <Text style={styles.sectionTitle}>모든 경험</Text>
              </View>
              {allPosts.map((exp) => (
                  <ExperienceCard key={exp.id} experience={exp} onClick={onExperienceClick} />
              ))}
              <TouchableOpacity style={styles.viewMoreButton} onPress={onViewAllPress}>
                <Text style={styles.viewMoreButtonText}>모든 경험 보기</Text>
              </TouchableOpacity>
              <PopularTagsSection tags={popularTags} onTagPress={onTagPress} />
            </>
        )}
      </ScrollView>
  );
}

const ExperienceCard = ({ experience: item, onClick }: { experience: Experience; onClick: (exp: Experience) => void }) => {
  const emKey = item.emotion || "joy";
  const bg = emotionColors[emKey] ? `${emotionColors[emKey]}30` : "#EEEEEE";
  return (
      <TouchableOpacity style={styles.unifiedCard} onPress={() => onClick(item)} activeOpacity={0.8}>
        <View style={styles.unifiedCardHeader}>
          <Text style={styles.unifiedCardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.unifiedTrendInfo}>
            <Text style={styles.unifiedTrendName}>{item.trendName || "트렌드"}</Text>
            <Text style={styles.unifiedTrendScore}>{item.trendScore}</Text>
          </View>
        </View>
        <View style={styles.unifiedCardMeta}>
          <Ionicons name="calendar-outline" size={12} color="#9E9E9E" />
          <Text style={styles.unifiedMetaText}>{new Date(item.date).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" })}</Text>
          <Ionicons name="location-outline" size={12} color="#9E9E9E" style={{ marginLeft: 10 }} />
          <Text style={styles.unifiedMetaText}>{item.location}</Text>
        </View>
        {(item.description || "").trim().length > 0 && (<Text style={styles.unifiedCardDescription} numberOfLines={2}>{item.description.trim()}</Text>)}
        <View style={styles.unifiedTagsAndActionsContainer}>
          <View style={styles.unifiedTagsContainer}>
            <View style={[styles.unifiedTag, styles.unifiedEmotionTag, { backgroundColor: bg }]}><Text style={styles.unifiedEmotionTagText}>{emotionIcons[emKey] ?? "🙂"}</Text></View>
            {item.tags?.slice(0, 3).map((tag, index) => (<View key={index} style={styles.unifiedTag}><Text style={styles.unifiedTagText}>#{tag}</Text></View>))}
            {item.tags?.length > 3 && <Text style={styles.unifiedMoreTagsText}>+{item.tags.length - 3}</Text>}
          </View>
        </View>
      </TouchableOpacity>
  );
};

const HotExperienceCard = ({ experience: exp, onClick }: { experience: Experience, onClick: (exp: Experience) => void }) => (
    <TouchableOpacity onPress={() => onClick(exp)}>
      <Card style={styles.hotCard}>
        <View style={styles.hotCardTop}>
          <Text style={styles.hotEmoji}>{emotionIcons[exp.emotion.toLowerCase()] || '😊'}</Text>
          <View style={styles.hotTitleContainer}>
            <Text style={styles.hotTitle} numberOfLines={2}>{exp.title}</Text>
            <Text style={styles.hotTrendName} numberOfLines={1}>#{exp.trendName || '알 수 없는 트렌드'}</Text>
          </View>
        </View>
        <View style={styles.hotCardBottom}>
          <View style={styles.hotTagContainer}>
            {(exp.tags || []).slice(0, 2).map((tag) => (
                <Text key={tag} style={styles.hotTagText}>#{tag}</Text>
            ))}
          </View>
          <View style={styles.hotTrendScoreContainer}>
            <Text style={styles.hotTrendLabel}>트렌드 점수</Text>
            <Text style={styles.hotTrendScore}>{exp.trendScore}</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
);

const FilterPanel = ({ sortBy, setSortBy, emotionFilter, setEmotionFilter }: any) => (
    <View style={styles.filterPanel}>
      <Text style={styles.filterTitle}>정렬</Text>
      <View style={styles.filterOptions}>
        {[{label: '최신순', value: 'latest'}, {label: '인기순', value: 'popular'}].map((opt) => (
            <TouchableOpacity
                key={opt.value}
                style={[styles.optionChip, sortBy === opt.value && styles.optionChipActive]}
                onPress={() => setSortBy(opt.value)}
            >
              <Text style={sortBy === opt.value ? styles.optionTextActive : styles.optionText}>{opt.label}</Text>
            </TouchableOpacity>
        ))}
      </View>
      <Text style={styles.filterTitle}>감정</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {emotionItems.map((item) => (
            <Chip
                key={item.label}
                style={emotionFilter === item.value ? [styles.emotionChip, styles.emotionChipActive] : styles.emotionChip}
                selected={emotionFilter === item.value}
                onPress={() => setEmotionFilter(item.value)}
            >
              {item.label}
            </Chip>
        ))}
      </ScrollView>
    </View>
);

const PopularTagCard = ({ tag, index, maxCount, onPress }: { tag: PopularTag, index: number, maxCount: number, onPress: () => void }) => {
  const progress = maxCount > 0 ? (tag.postCount / maxCount) * 100 : 0;
  return (
      <TouchableOpacity style={styles.tagCard} onPress={onPress}>
        <View style={styles.tagCardHeader}>
          <Text style={styles.tagCardTitle}>#{tag.name}</Text>
          <Text style={styles.tagCardRank}>#{index + 1}</Text>
        </View>
        <Text style={styles.tagCardCount}>{tag.postCount}개 경험</Text>
        <View style={styles.tagProgressBarBackground}>
          <View style={[styles.tagProgressBarFill, { width: `${progress}%` }]} />
        </View>
      </TouchableOpacity>
  );
};

const PopularTagsSection = ({ tags, onTagPress }: { tags: PopularTag[], onTagPress: (tag: string) => void }) => {
  if (!tags || tags.length === 0) return null;
  const maxCount = tags[0]?.postCount || 1;
  return (
      <View style={styles.tagsSectionContainer}>
        <Text style={styles.sectionTitle}>✨ 인기 태그</Text>
        <View style={styles.tagsGrid}>
          {tags.map((tag, index) => (
              <PopularTagCard key={tag.name} tag={tag} index={index} maxCount={maxCount} onPress={() => onTagPress(tag.name)} />
          ))}
        </View>
      </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: "#fafaff", padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  resultsLabel: { fontWeight: "bold", fontSize: 15, color: "#6b21a8" },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: "#a78bfa", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  filterButtonText: { color: '#7C3AED', marginLeft: 4, fontWeight: '600', fontSize: 13 },
  filterPanel: { backgroundColor: "#f5f3ff", borderRadius: 10, padding: 12, marginBottom: 10 },
  filterTitle: { fontWeight: "bold", fontSize: 14, color: "#6b21a8", marginBottom: 6 },
  filterOptions: { flexDirection: "row", marginBottom: 10 },
  optionChip: { backgroundColor: "#ede9fe", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  optionChipActive: { backgroundColor: "#7C3AED" },
  optionText: { color: "#6b21a8", fontWeight: "600" },
  optionTextActive: { color: "#fff", fontWeight: "700" },
  emotionChip: { marginRight: 6, backgroundColor: "#f3e8ff" },
  emotionChipActive: { backgroundColor: "#7C3AED" },
  sectionTitle: { fontWeight: "bold", fontSize: 18, color: "#7C3AED", marginBottom: 8, marginTop: 16 },
  hotScroll: { flexDirection: "row", marginBottom: 24, paddingBottom: 8 },
  hotCard: { backgroundColor: "#f9f8ff", borderRadius: 12, padding: 14, marginRight: 12, width: 256, height: 120, justifyContent: "space-between", elevation: 2, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4 },
  hotCardTop: { flexDirection: 'row', alignItems: 'flex-start', flexShrink: 1 },
  hotEmoji: { fontSize: 24, marginRight: 10, marginTop: 2 },
  hotTitleContainer: { flex: 1 },
  hotTitle: { fontWeight: "bold", fontSize: 16, color: "#333", lineHeight: 22 },
  hotTrendName: { fontSize: 13, color: '#8b5cf6', marginTop: 2 },
  hotCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 },
  hotTagContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap' },
  hotTagText: { color: '#6b7280', fontSize: 13, fontWeight: '500', marginRight: 6 },
  hotTrendScoreContainer: { alignItems: 'flex-end' },
  hotTrendLabel: { fontSize: 11, color: '#9ca3af' },
  hotTrendScore: { fontSize: 20, color: "#7C3AED", fontWeight: "bold" },
  unifiedCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#EEEEEE", padding: 16, marginHorizontal: -4 },
  unifiedCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  unifiedCardTitle: { fontSize: 16, fontWeight: "bold", color: "#212121", flex: 1, marginRight: 10, lineHeight: 24 },
  unifiedTrendInfo: { alignItems: "flex-end" },
  unifiedTrendName: { fontSize: 10, color: "#757575" },
  unifiedTrendScore: { fontSize: 18, fontWeight: "bold", color: "#673AB7", marginTop: 2 },
  unifiedCardMeta: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  unifiedMetaText: { fontSize: 12, color: "#757575", marginLeft: 4 },
  unifiedCardDescription: { fontSize: 14, color: "#4B5563", lineHeight: 22, marginBottom: 12, marginLeft: 4, fontStyle: "italic" },
  unifiedTagsAndActionsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  unifiedTagsContainer: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", flex: 1 },
  unifiedTag: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6, backgroundColor: "#EEEEEE" },
  unifiedEmotionTag: { paddingHorizontal: 8, paddingVertical: 4, minWidth: 30, height: 26, justifyContent: "center", alignItems: "center", borderRadius: 13 },
  unifiedTagText: { fontSize: 12, color: "#616161", fontWeight: "500" },
  unifiedEmotionTagText: { fontSize: 14, textAlign: "center" },
  unifiedMoreTagsText: { fontSize: 12, color: "#9E9E9E" },
  viewMoreButton: { backgroundColor: '#F5F3FF', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 8 },
  viewMoreButtonText: { color: '#7C3AED', fontWeight: 'bold' },
  emptyText: { textAlign: "center", marginTop: 40, color: "#9CA3AF", fontSize: 14 },
  tagsSectionContainer: { marginTop: 24 },
  tagsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  tagCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#f0f0f0' },
  tagCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tagCardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  tagCardRank: { fontSize: 12, fontWeight: 'bold', color: '#aaa' },
  tagCardCount: { fontSize: 12, color: '#888', marginVertical: 8 },
  tagProgressBarBackground: { height: 4, backgroundColor: '#eee', borderRadius: 2, overflow: 'hidden' },
  tagProgressBarFill: { height: '100%', backgroundColor: '#8B5CF6' },
});