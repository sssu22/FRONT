// sssu22/front/FRONT-feature-3/screens/HomeTab.tsx

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
import { useIsFocused } from "@react-navigation/native"; // 탭이 활성화될 때마다 새로고침하기 위해 import
import { postsApi } from "../utils/apiUtils"; // API 호출을 위해 import
import { Experience } from "../types"; // 타입 import

// 감정 아이콘 (기존과 동일)
const emotionIcons: Record<string, string> = {
  joy: "😊", excitement: "🔥", nostalgia: "💭", surprise: "😲", love: "💖",
  regret: "😞", sadness: "😢", irritation: "😒", anger: "😡", embarrassment: "😳",
};

// 감정 필터 아이템 (기존과 동일)
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
}

// ✅ API 연동이 적용된 HomeTab 컴포넌트
export default function HomeTab({ onExperienceClick, searchQuery }: HomeTabProps) {
  const isFocused = useIsFocused();
  const [popularPosts, setPopularPosts] = useState<Experience[]>([]);
  const [allPosts, setAllPosts] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 인기 게시글과 전체 게시글을 동시에 API로 가져옵니다.
      const [popularData, allData] = await Promise.all([
        postsApi.getPopular(),
        postsApi.getAll({ sort: sortBy, emotion: emotionFilter }),
      ]);
      setPopularPosts(popularData);
      setAllPosts(allData);
    } catch (error) {
      console.error("홈 탭 데이터 로딩 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, emotionFilter]);

  // 화면이 포커스될 때마다 데이터를 새로고침합니다.
  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused, fetchData]);

  // 검색어 필터링 로직
  const filteredExperiences = useMemo(() => {
    if (!searchQuery) {
      return allPosts;
    }
    const query = searchQuery.toLowerCase();
    return allPosts.filter(
        (exp) =>
            exp.title.toLowerCase().includes(query) ||
            exp.description.toLowerCase().includes(query) ||
            exp.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery, allPosts]);

  if (loading) {
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
            // 검색 결과 화면
            <>
              <View style={styles.searchHeader}>
                <Text style={styles.resultsLabel}>
                  "{searchQuery}"에 대한 {filteredExperiences.length}개 결과
                </Text>
              </View>
              {filteredExperiences.length === 0 ? (
                  <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
              ) : (
                  filteredExperiences.map((exp) => (
                      <ExperienceCard key={exp.id} experience={exp} onClick={onExperienceClick} />
                  ))
              )}
            </>
        ) : (
            // 기본 홈 화면
            <>
              <Text style={styles.sectionTitle}>🔥 지금 뜨는 경험</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.hotScroll}>
                {popularPosts.map((exp) => (
                    <HotExperienceCard key={exp.id} experience={exp} onClick={onExperienceClick} />
                ))}
              </ScrollView>

              <View style={styles.filterHeader}>
                <Text style={styles.sectionTitle}>모두 보기</Text>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilter(!showFilter)}
                >
                  <Ionicons name="filter-outline" size={18} color="#7C3AED" />
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
              {allPosts.map((exp) => (
                  <ExperienceCard key={exp.id} experience={exp} onClick={onExperienceClick} />
              ))}
            </>
        )}
      </ScrollView>
  );
}

// --- 재사용 가능한 컴포넌트들 ---

const ExperienceCard = ({ experience: exp, onClick }: { experience: Experience, onClick: (exp: Experience) => void }) => (
    <TouchableOpacity onPress={() => onClick(exp)}>
      <Card style={styles.expCard}>
        <View style={styles.expHeader}>
          <Text style={styles.emoji}>{emotionIcons[exp.emotion.toLowerCase()] || '😊'}</Text>
          <Text style={styles.expTitle}>{exp.title}</Text>
          <View style={styles.trendBadge}>
            <Text style={styles.trendBadgeText}>{exp.trendScore}</Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {new Date(exp.date).toLocaleDateString("ko-KR")} | {exp.location}
        </Text>
        <Text style={styles.desc} numberOfLines={2}>{exp.description}</Text>
        <View style={styles.tagRow}>
          {exp.tags.slice(0, 3).map((tag) => (
              <Chip key={tag} style={styles.tagChip}>#{tag}</Chip>
          ))}
        </View>
      </Card>
    </TouchableOpacity>
);

const HotExperienceCard = ({ experience: exp, onClick }: { experience: Experience, onClick: (exp: Experience) => void }) => (
    <TouchableOpacity onPress={() => onClick(exp)}>
      <Card style={styles.hotCard}>
        <View style={styles.hotHeader}>
          <Text style={styles.emoji}>{emotionIcons[exp.emotion.toLowerCase()] || '😊'}</Text>
          <Text style={styles.hotTitle} numberOfLines={1}>{exp.title}</Text>
          <Text style={styles.trendScore}>{exp.trendScore}</Text>
        </View>
        <View style={styles.tagRow}>
          {exp.tags.slice(0, 2).map((tag) => (
              <Chip key={tag} style={styles.tagChip}>#{tag}</Chip>
          ))}
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


// --- 스타일 (기존 스타일과 새 스타일 병합) ---
const styles = StyleSheet.create({
  container: { backgroundColor: "#fafaff", padding: 16 },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchHeader: { marginBottom: 10 },
  resultsLabel: { fontWeight: "bold", fontSize: 15, color: "#6b21a8" },
  filterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filterButton: { borderWidth: 1, borderColor: "#a78bfa", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 6 },
  filterPanel: { backgroundColor: "#f5f3ff", borderRadius: 10, padding: 12, marginBottom: 10 },
  filterTitle: { fontWeight: "bold", fontSize: 14, color: "#6b21a8", marginBottom: 6 },
  filterOptions: { flexDirection: "row", marginBottom: 10 },
  optionChip: { backgroundColor: "#ede9fe", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 8 },
  optionChipActive: { backgroundColor: "#7C3AED" },
  optionText: { color: "#6b21a8", fontWeight: "600" },
  optionTextActive: { color: "#fff", fontWeight: "700" },
  emotionChip: { marginRight: 6, backgroundColor: "#f3e8ff" },
  emotionChipActive: { backgroundColor: "#7C3AED" },
  sectionTitle: { fontWeight: "bold", fontSize: 18, color: "#7C3AED", marginBottom: 8 },
  hotScroll: {flexDirection: "row", marginBottom: 16, height: 150,},
  hotCard: { backgroundColor: "#f9f8ff", borderRadius: 12, paddingVertical: 10, paddingHorizontal: 14, marginRight: 12, width: 220, height: 110, justifyContent: "space-between", elevation: 2 },
  hotHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 },
  emoji: { fontSize: 22, marginRight: 8 },
  hotTitle: { fontWeight: "bold", fontSize: 14, color: "#333", flex: 1, marginHorizontal: 6 },
  trendScore: { fontSize: 12, color: "#7C3AED", fontWeight: "bold" },
  tagRow: { flexDirection: "row", flexWrap: "wrap" },
  tagChip: { marginRight: 4, backgroundColor: "#ede9fe" },
  expCard: { backgroundColor: "#fff", padding: 14, borderRadius: 12, marginBottom: 12, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  expHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  expTitle: { fontWeight: "bold", fontSize: 16, marginLeft: 8, flex: 1, color: "#222" },
  trendBadge: { backgroundColor: "#ede9fe", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  trendBadgeText: { color: "#7C3AED", fontWeight: "bold" },
  meta: { color: "#6b7280", fontSize: 12, marginBottom: 4 },
  desc: { fontSize: 13, color: "#333", marginBottom: 8, lineHeight: 18 },
  emptyText: { textAlign: "center", marginTop: 20, color: "#9CA3AF", fontSize: 14 },
});