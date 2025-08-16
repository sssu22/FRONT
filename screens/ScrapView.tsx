// sssu22/front/FRONT-feature-3/screens/ScrapView.tsx

import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Card, IconButton, Chip } from "react-native-paper";
import { useIsFocused } from "@react-navigation/native";

import { Experience, Trend } from "../types";
import { scrapsApi } from "../utils/apiUtils"; // ✅ API import

// Props 타입 (App.tsx와 일치하도록 수정)
interface ScrapScreenProps {
  onExperienceClick: (experience: Experience) => void;
  onTrendClick: (trendId: number) => void; // ✅ 트렌드 클릭 핸들러 추가
  onToggleExperienceScrap: (experienceId: number) => void;
  onToggleTrendScrap: (trendId: number) => void;
  onClose: () => void;
}

type FilterType = "all" | "experiences" | "trends";

// 감정 이모지
const emotionIcons: Record<string, string> = {
  joy: "😊", excitement: "🔥", nostalgia: "💭", surprise: "😲", love: "💖",
  regret: "😞", sadness: "😢", irritation: "😒", anger: "😡", embarrassment: "😳",
};


export default function ScrapScreen({
                                      onExperienceClick,
                                      onTrendClick,
                                      onToggleExperienceScrap,
                                      onToggleTrendScrap,
                                      onClose,
                                    }: ScrapScreenProps) {
  const [scrappedExperiences, setScrappedExperiences] = useState<Experience[]>([]);
  const [scrappedTrends, setScrappedTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const isFocused = useIsFocused();

  // ✅ 화면이 보일 때마다 스크랩 데이터를 새로 불러옵니다.
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [posts, trends] = await Promise.all([
          scrapsApi.getMyScrappedPosts(),
          scrapsApi.getMyScrappedTrends(),
        ]);
        setScrappedExperiences(posts);
        setScrappedTrends(trends);
      } catch (error) {
        console.error("스크랩 데이터 로딩 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);


  // 검색 및 필터링 로직
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return { experiences: scrappedExperiences, trends: scrappedTrends };
    }

    const experiences = scrappedExperiences.filter(
        (e) => e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query)
    );
    const trends = scrappedTrends.filter(
        (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
    );

    return { experiences, trends };
  }, [searchQuery, scrappedExperiences, scrappedTrends]);

  const totalScraps = scrappedExperiences.length + scrappedTrends.length;
  const showExperiences = filterType === "all" || filterType === "experiences";
  const showTrends = filterType === "all" || filterType === "trends";

  if (loading) {
    return (
        <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#6b21a8" />
          <Text style={{ marginTop: 10 }}>스크랩 목록을 불러오는 중...</Text>
        </SafeAreaView>
    );
  }

  return (
      <SafeAreaView style={styles.container}>
        <View style={styles.topBar}>
          <IconButton icon="arrow-left" onPress={onClose} iconColor="#3b0764" />
          <Text style={styles.headerText}>총 {totalScraps}개 스크랩</Text>
        </View>

        <TextInput
            style={styles.searchInput}
            placeholder="제목, 설명으로 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
        />

        <View style={styles.filterRow}>
          {(["all", "experiences", "trends"] as FilterType[]).map((type) => (
              <Chip
                  key={type}
                  mode={filterType === type ? "flat" : "outlined"}
                  onPress={() => setFilterType(type)}
                  style={styles.filterChip}
                  textStyle={filterType === type ? styles.selectedChipText : styles.chipText}
              >
                {type === 'all' ? '전체' : type === 'experiences' ? '경험' : '트렌드'}
              </Chip>
          ))}
        </View>

        <ScrollView style={styles.scrollView}>
          {showExperiences && (
              <>
                <Text style={styles.subTitle}>스크랩한 경험 ({filteredData.experiences.length})</Text>
                {filteredData.experiences.length > 0 ? (
                    filteredData.experiences.map((exp) => (
                        <Card key={`exp-${exp.id}`} style={styles.card}>
                          <TouchableOpacity style={styles.cardContent} onPress={() => onExperienceClick(exp)}>
                            <Text style={styles.emotion}>{emotionIcons[exp.emotion.toLowerCase()]}</Text>
                            <View style={styles.contentArea}>
                              <Text style={styles.title}>{exp.title}</Text>
                              <Text style={styles.desc} numberOfLines={2}>{exp.description}</Text>
                            </View>
                            <IconButton
                                icon="bookmark" size={20} iconColor="#f59e42"
                                onPress={() => onToggleExperienceScrap(exp.id)}
                            />
                          </TouchableOpacity>
                        </Card>
                    ))
                ) : <Text style={styles.emptyText}>스크랩한 경험이 없습니다.</Text>}
              </>
          )}

          {showTrends && (
              <>
                <Text style={styles.subTitle}>스크랩한 트렌드 ({filteredData.trends.length})</Text>
                {filteredData.trends.length > 0 ? (
                    filteredData.trends.map((trend) => (
                        <Card key={`trend-${trend.id}`} style={styles.card}>
                          <TouchableOpacity style={styles.cardContent} onPress={() => onTrendClick(trend.id)}>
                            <View style={styles.trendIcon}><Text style={styles.trendIconText}>📈</Text></View>
                            <View style={styles.contentArea}>
                              <Text style={styles.title}>{trend.title}</Text>
                              <Text style={styles.desc} numberOfLines={2}>{trend.description}</Text>
                            </View>
                            <IconButton
                                icon="bookmark" size={20} iconColor="#f59e42"
                                onPress={() => onToggleTrendScrap(trend.id)}
                            />
                          </TouchableOpacity>
                        </Card>
                    ))
                ) : <Text style={styles.emptyText}>스크랩한 트렌드가 없습니다.</Text>}
              </>
          )}
        </ScrollView>
      </SafeAreaView>
  );
}


// ... (기존 styles 코드는 그대로 사용)
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fafafa", },
  topBar: { flexDirection: "row", alignItems: "center", marginBottom: 16, },
  headerText: { fontSize: 20, fontWeight: "bold", marginLeft: 8, color: "#3b0764", },
  searchInput: { backgroundColor: "#ffffff", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, marginBottom: 16, fontSize: 16, borderWidth: 1, borderColor: "#e5e5e5", },
  filterRow: { flexDirection: "row", marginBottom: 12, flexWrap: "wrap", },
  filterChip: { marginRight: 8, marginBottom: 4, },
  chipText: { fontSize: 12, color: "#666", },
  selectedChipText: { fontSize: 12, color: "#3b0764", fontWeight: "600", },
  scrollView: { flex: 1, },
  subTitle: { fontWeight: "bold", fontSize: 18, color: "#3b0764", marginTop: 8, marginBottom: 12, },
  card: { marginVertical: 6, borderRadius: 16, backgroundColor: "#ffffff", elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, },
  cardContent: { flexDirection: "row", alignItems: "center", padding: 16, },
  emotion: { fontSize: 28, marginRight: 12, },
  trendIcon: { marginRight: 12, },
  trendIconText: { fontSize: 28, },
  contentArea: { flex: 1, marginRight: 8, },
  title: { fontWeight: "bold", fontSize: 16, marginBottom: 4, color: "#1f2937", lineHeight: 22, },
  desc: { color: "#6b7280", fontSize: 14, marginBottom: 8, lineHeight: 20, },
  emptyText: { textAlign: "center", fontSize: 16, color: "#9ca3af", marginTop: 40, fontStyle: "italic", },
});