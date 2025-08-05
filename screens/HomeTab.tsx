import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Card, Chip } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

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

const emotionItems = [
  { label: "전체", value: null },
  { label: "😊 기쁨", value: "joy" },
  { label: "🔥 흥분", value: "excitement" },
  { label: "💭 향수", value: "nostalgia" },
  { label: "😲 놀라움", value: "surprise" },
  { label: "💖 사랑", value: "love" },
  { label: "😞 아쉬움", value: "regret" },
  { label: "😢 슬픔", value: "sadness" },
  { label: "😒 짜증", value: "irritation" },
  { label: "😡 화남", value: "anger" },
  { label: "😳 당황", value: "embarrassment" },
];

interface Experience {
  id: string;
  title: string;
  date: string;
  location: string;
  emotion:
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
  tags: string[];
  description: string;
  trendScore: number;
}

interface HomeTabProps {
  experiences: Experience[];
  onExperienceClick: (experience: Experience) => void;
  searchQuery: string;
}

export default function HomeTab({ experiences, onExperienceClick, searchQuery }: HomeTabProps) {
  const [showFilter, setShowFilter] = useState(false);
  const [sortBy, setSortBy] = useState("최신순");
  const [emotionFilter, setEmotionFilter] = useState<string | null>(null);

  // ✅ 필터링
  let filteredExperiences = experiences.filter((exp) => {
    const matchEmotion = emotionFilter ? exp.emotion === emotionFilter : true;
    const matchSearch = searchQuery
        ? exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
        : true;
    return matchEmotion && matchSearch;
  });

  // ✅ 정렬
  if (sortBy === "최신순") {
    filteredExperiences = filteredExperiences.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } else if (sortBy === "인기순") {
    filteredExperiences = filteredExperiences.sort((a, b) => b.trendScore - a.trendScore);
  }

  const hotExperiences = filteredExperiences.slice(0, 3);

  return (
      <ScrollView style={styles.container}>
        {searchQuery ? (
            <>
              {/* ✅ 검색 결과 헤더 */}
              <View style={styles.searchHeader}>
                <View>
                  <Text style={styles.searchResultTitle}>검색 결과</Text>
                  <Text style={styles.resultsLabel}>
                    "{searchQuery}"에 대한 {filteredExperiences.length}개 결과
                  </Text>
                </View>
                <TouchableOpacity
                    style={styles.filterButton}
                    onPress={() => setShowFilter(!showFilter)}
                >
                  <Ionicons name="filter-outline" size={18} color="#7C3AED" />
                </TouchableOpacity>
              </View>

              {/* ✅ 필터 패널 */}
              {showFilter && (
                  <View style={styles.filterPanel}>
                    <Text style={styles.filterTitle}>정렬</Text>
                    <View style={styles.filterOptions}>
                      {["최신순", "인기순"].map((opt) => (
                          <TouchableOpacity
                              key={opt}
                              style={[
                                styles.optionChip,
                                sortBy === opt && styles.optionChipActive,
                              ]}
                              onPress={() => setSortBy(opt)}
                          >
                            <Text
                                style={
                                  sortBy === opt ? styles.optionTextActive : styles.optionText
                                }
                            >
                              {opt}
                            </Text>
                          </TouchableOpacity>
                      ))}
                    </View>

                    <Text style={styles.filterTitle}>감정</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {emotionItems.map((item) => (
                          <Chip
                              key={item.label}
                              style={
                                emotionFilter === item.value
                                    ? [styles.emotionChip, styles.emotionChipActive]
                                    : styles.emotionChip
                              }
                              selected={emotionFilter === item.value}
                              onPress={() => setEmotionFilter(item.value)}
                          >
                            {item.label}
                          </Chip>
                      ))}
                    </ScrollView>
                  </View>
              )}

              {/* ✅ 검색 결과 리스트 */}
              {filteredExperiences.length === 0 ? (
                  <Text style={styles.emptyText}>검색 결과가 없습니다.</Text>
              ) : (
                  filteredExperiences.map((exp) => (
                      <TouchableOpacity key={exp.id} onPress={() => onExperienceClick(exp)}>
                        <Card style={styles.expCard}>
                          <View style={styles.expHeader}>
                            <Text style={styles.emoji}>{emotionIcons[exp.emotion]}</Text>
                            <Text style={styles.expTitle}>{exp.title}</Text>
                            <View style={styles.trendBadge}>
                              <Text style={styles.trendBadgeText}>{exp.trendScore}</Text>
                            </View>
                          </View>
                          <Text style={styles.meta}>
                            {new Date(exp.date).toLocaleDateString("ko-KR")} | {exp.location}
                          </Text>
                          <Text style={styles.desc}>{exp.description}</Text>
                          <View style={styles.tagRow}>
                            {exp.tags.slice(0, 3).map((tag) => (
                                <Chip key={tag} style={styles.tagChip}>
                                  #{tag}
                                </Chip>
                            ))}
                          </View>
                        </Card>
                      </TouchableOpacity>
                  ))
              )}
            </>
        ) : (
            <>
              {/* 🔥 지금 뜨는 경험 */}
              <Text style={styles.sectionTitle}>🔥 지금 뜨는 경험</Text>
              <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.hotScroll}
                  contentContainerStyle={{ paddingVertical: 15 }}
              >
                {hotExperiences.map((exp) => (
                    <TouchableOpacity key={exp.id} onPress={() => onExperienceClick(exp)}>
                      <Card style={styles.hotCard}>
                        <View style={styles.hotHeader}>
                          <Text style={styles.emoji}>{emotionIcons[exp.emotion]}</Text>
                          <Text style={styles.hotTitle} numberOfLines={1}>
                            {exp.title}
                          </Text>
                          <Text style={styles.trendScore}>{exp.trendScore}</Text>
                        </View>
                        <View style={styles.tagRow}>
                          {exp.tags.slice(0, 2).map((tag) => (
                              <Chip key={tag} style={styles.tagChip}>
                                #{tag}
                              </Chip>
                          ))}
                        </View>
                      </Card>
                    </TouchableOpacity>
                ))}
              </ScrollView>

              {/* ✅ 모두 보기 */}
              <Text style={styles.sectionTitle}>모두 보기</Text>
              {filteredExperiences.map((exp) => (
                  <TouchableOpacity key={exp.id} onPress={() => onExperienceClick(exp)}>
                    <Card style={styles.expCard}>
                      <View style={styles.expHeader}>
                        <Text style={styles.emoji}>{emotionIcons[exp.emotion]}</Text>
                        <Text style={styles.expTitle}>{exp.title}</Text>
                        <View style={styles.trendBadge}>
                          <Text style={styles.trendBadgeText}>{exp.trendScore}</Text>
                        </View>
                      </View>
                      <Text style={styles.meta}>
                        {new Date(exp.date).toLocaleDateString("ko-KR")} | {exp.location}
                      </Text>
                      <Text style={styles.desc}>{exp.description}</Text>
                      <View style={styles.tagRow}>
                        {exp.tags.slice(0, 3).map((tag) => (
                            <Chip key={tag} style={styles.tagChip}>
                              #{tag}
                            </Chip>
                        ))}
                      </View>
                    </Card>
                  </TouchableOpacity>
              ))}
            </>
        )}
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fafaff", padding: 16 },

  // ✅ 검색 상태 헤더
  searchHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  searchResultTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4B5563", // 회색톤
    marginBottom: 2,
  },
  resultsLabel: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#6b21a8",
  },

  // ✅ 필터 UI
  filterButton: {
    borderWidth: 1,
    borderColor: "#a78bfa",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  filterPanel: {
    backgroundColor: "#f5f3ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  filterTitle: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#6b21a8",
    marginBottom: 6,
  },
  filterOptions: {
    flexDirection: "row",
    marginBottom: 10,
  },
  optionChip: {
    backgroundColor: "#ede9fe",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
  },
  optionChipActive: {
    backgroundColor: "#7C3AED",
  },
  optionText: {
    color: "#6b21a8",
    fontWeight: "600",
  },
  optionTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  emotionChip: {
    marginRight: 6,
    backgroundColor: "#f3e8ff",
  },
  emotionChipActive: {
    backgroundColor: "#7C3AED",
  },

  // 🔥 지금 뜨는 경험
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#7C3AED",
    marginBottom: 8,
  },
  hotScroll: {
    flexDirection: "row",
    marginBottom: 0,
    height: 150,
    overflow: "visible",
  },
  hotCard: {
    backgroundColor: "#f9f8ff",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginRight: 12,
    width: 220,
    height: 110,
    justifyContent: "space-between",
  },
  hotHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  emoji: { fontSize: 22, marginRight: 8 },
  hotTitle: {
    fontWeight: "bold",
    fontSize: 14,
    color: "#333",
    flex: 1,
    marginHorizontal: 6,
  },
  trendScore: { fontSize: 12, color: "#7C3AED", fontWeight: "bold" },
  tagRow: { flexDirection: "row", flexWrap: "wrap" },
  tagChip: { marginRight: 4, backgroundColor: "#ede9fe" },

  // ✅ 모두 보기 카드
  expCard: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  expHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  expTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
    color: "#222",
  },
  trendBadge: {
    backgroundColor: "#ede9fe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendBadgeText: { color: "#7C3AED", fontWeight: "bold" },
  meta: { color: "#6b7280", fontSize: 12, marginBottom: 4 },
  desc: { fontSize: 13, color: "#333", marginBottom: 8 },
  emptyText: {
    textAlign: "center",
    marginTop: 20,
    color: "#9CA3AF",
    fontSize: 14,
  },
});
