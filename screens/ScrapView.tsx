// sssu22/front/FRONT-feature-/screens/ScrapView.tsx

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
  Alert,
  Modal,
} from "react-native";
import { Card, IconButton, Chip } from "react-native-paper";
import { useIsFocused } from "@react-navigation/native";
import { useGlobalContext } from "../GlobalContext";
import { Experience, Trend } from "../types";
import { scrapsApi } from "../utils/apiUtils";
import { Ionicons } from "@expo/vector-icons";

interface ScrapScreenProps {
  onExperienceClick: (experience: Experience) => void;
  onTrendClick: (trendId: number) => void;
  onClose: () => void;
}

const emotionIcons: Record<string, string> = {
  joy: "😊", excitement: "🔥", nostalgia: "💭", surprise: "😲", love: "💖",
  disappointment: "😞", sadness: "😢", annoyance: "😒", anger: "😡", embarrassment: "😳",
};

type ActiveView = 'experiences' | 'trends';
type SortOption = 'latest' | 'popular' | 'name';

const sortOptions: { label: string; value: SortOption }[] = [
  { label: '최신순', value: 'latest' },
  { label: '인기순', value: 'popular' },
  { label: '이름순', value: 'name' },
];

export default function ScrapScreen({
                                      onExperienceClick,
                                      onTrendClick,
                                      onClose,
                                    }: ScrapScreenProps) {
  const { togglePostScrap, toggleTrendScrap } = useGlobalContext();

  const [scrappedExperiences, setScrappedExperiences] = useState<Experience[]>([]);
  const [scrappedTrends, setScrappedTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const isFocused = useIsFocused();

  const [activeView, setActiveView] = useState<ActiveView>('experiences');
  const [sortOption, setSortOption] = useState<SortOption>('latest');
  const [isFilterVisible, setIsFilterVisible] = useState(false);

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
      Alert.alert("오류", "스크랩 데이터를 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchData();
    }
  }, [isFocused]);

  const handleTogglePostScrap = async (postId: number) => {
    await togglePostScrap(postId);
    setScrappedExperiences(prev => prev.filter(exp => exp.id !== postId));
  };

  const handleToggleTrendScrap = async (trendId: number) => {
    await toggleTrendScrap(trendId);
    setScrappedTrends(prev => prev.filter(trend => trend.id !== trendId));
  };

  const sortedData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const experiences = scrappedExperiences.filter(
        (e) => e.title.toLowerCase().includes(query) || e.description?.toLowerCase().includes(query)
    );
    const trends = scrappedTrends.filter(
        (t) => t.title.toLowerCase().includes(query) || t.description?.toLowerCase().includes(query)
    );

    // 정렬 로직
    switch (sortOption) {
      case 'name':
        experiences.sort((a, b) => a.title.localeCompare(b.title));
        trends.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'popular':
        experiences.sort((a, b) => (b.trendScore || 0) - (a.trendScore || 0));
        trends.sort((a, b) => (b.popularity || b.score || 0) - (b.popularity || b.score || 0));
        break;
      case 'latest':
      default:
        experiences.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        trends.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
    }
    return { experiences, trends };
  }, [searchQuery, scrappedExperiences, scrappedTrends, sortOption]);

  const totalScraps = scrappedExperiences.length + scrappedTrends.length;

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
          <IconButton icon="arrow-left" onPress={onClose} iconColor="#333" />
          <Text style={styles.headerText}>나의 스크랩</Text>
          <Text style={styles.totalCountText}>총 {totalScraps}개 스크랩</Text>
          <View style={{flex: 1}} />
          <TouchableOpacity style={styles.filterButton} onPress={() => setIsFilterVisible(true)}>
            <Ionicons name="filter-outline" size={18} color="#555" />
            <Text style={styles.filterButtonText}>필터</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" style={{marginLeft: 12}}/>
          <TextInput
              style={styles.searchInput}
              placeholder="스크랩한 항목 검색..."
              value={searchQuery}
              onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.summaryContainer}>
          <TouchableOpacity
              style={[styles.summaryCard, activeView === 'experiences' && styles.activeSummaryCard]}
              onPress={() => setActiveView('experiences')}
          >
            <Text style={[styles.summaryNumber, activeView === 'experiences' && styles.activeSummaryText]}>{scrappedExperiences.length}</Text>
            <Text style={[styles.summaryLabel, activeView === 'experiences' && styles.activeSummaryText]}>스크랩한 경험</Text>
          </TouchableOpacity>
          <TouchableOpacity
              style={[styles.summaryCard, activeView === 'trends' && styles.activeSummaryCard]}
              onPress={() => setActiveView('trends')}
          >
            <Text style={[styles.summaryNumber, activeView === 'trends' && styles.activeSummaryText]}>{scrappedTrends.length}</Text>
            <Text style={[styles.summaryLabel, activeView === 'trends' && styles.activeSummaryText]}>스크랩한 트렌드</Text>
          </TouchableOpacity>
        </View>


        <ScrollView style={styles.scrollView}>
          {activeView === 'trends' && (
              <>
                {sortedData.trends.length > 0 ? (
                    // map 함수에 index를 추가하고, key에 index를 포함시킵니다.
                    sortedData.trends.map((trend, index) => (
                        <Card key={`trend-${trend.id}-${index}`} style={styles.card}>
                          <TouchableOpacity style={styles.cardContent} onPress={() => onTrendClick(trend.id)}>
                            <View style={styles.trendIcon}>
                              <Text style={{fontSize: 20, color: '#9333ea'}}>#</Text>
                            </View>
                            <View style={styles.contentArea}>
                              <Text style={styles.title}>{trend.title}</Text>
                              <Text style={styles.desc} numberOfLines={1}>{trend.description}</Text>
                              <View style={{flexDirection: 'row', alignItems: 'center', marginTop: 6}}>
                                <View style={styles.chip}>
                                  <Text style={styles.chipText}>{trend.category}</Text>
                                </View>
                              </View>
                            </View>
                            <View style={styles.scoreContainer}>
                              <Text style={styles.scoreLabel}>인기도</Text>
                              <Text style={styles.scoreValue}>{trend.popularity || trend.score || 0}</Text>
                            </View>
                            <IconButton
                                icon="bookmark" size={20} iconColor="#f59e42"
                                onPress={() => handleToggleTrendScrap(trend.id)}
                                style={{marginLeft: 0, marginRight: -4}}
                            />
                          </TouchableOpacity>
                        </Card>
                    ))
                ) : <Text style={styles.emptyText}>스크랩한 트렌드가 없습니다.</Text>}
              </>
          )}

          {activeView === 'experiences' && (
              <>
                {sortedData.experiences.length > 0 ? (
                    // 안정성을 위해 경험 목록에도 index를 key에 추가합니다.
                    sortedData.experiences.map((exp, index) => (
                        <Card key={`exp-${exp.id}-${index}`} style={styles.card}>
                          <TouchableOpacity style={styles.cardContent} onPress={() => onExperienceClick(exp)}>
                            <View style={styles.trendIcon}><Text style={{fontSize: 20}}>{emotionIcons[exp.emotion.toLowerCase()]}</Text></View>
                            <View style={styles.contentArea}>
                              <Text style={styles.title} numberOfLines={1}>{exp.title}</Text>
                              <Text style={styles.desc} numberOfLines={1}>{exp.description}</Text>
                              <Text style={styles.dateText}>{exp.date ? new Date(exp.date).toLocaleDateString('ko-KR') : ''}</Text>
                            </View>
                            <IconButton
                                icon="bookmark" size={20} iconColor="#f59e42"
                                onPress={() => handleTogglePostScrap(exp.id)}
                                style={{marginLeft: 0, marginRight: -4}}
                            />
                          </TouchableOpacity>
                        </Card>
                    ))
                ) : <Text style={styles.emptyText}>스크랩한 경험이 없습니다.</Text>}
              </>
          )}
        </ScrollView>

        <Modal
            transparent={true}
            visible={isFilterVisible}
            onRequestClose={() => setIsFilterVisible(false)}
            animationType="fade"
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsFilterVisible(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>정렬</Text>
              {sortOptions.map(option => (
                  <TouchableOpacity
                      key={option.value}
                      style={styles.modalOption}
                      onPress={() => {
                        setSortOption(option.value);
                        setIsFilterVisible(false);
                      }}
                  >
                    <Text style={[styles.modalOptionText, sortOption === option.value && styles.modalOptionTextActive]}>
                      {option.label}
                    </Text>
                    {sortOption === option.value && <Ionicons name="checkmark" size={20} color="#7c3aed" />}
                  </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  topBar: { flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingVertical: 4 },
  headerText: { fontSize: 20, fontWeight: "bold", marginLeft: 0, color: "#1f2937" },
  totalCountText: { fontSize: 14, color: '#6b7280', marginLeft: 8, fontWeight: '500' },
  filterButton: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  filterButtonText: { color: '#374151', marginLeft: 4, fontWeight: '600', fontSize: 13 },
  searchInputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: "#fff", borderRadius: 12, marginHorizontal: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  searchInput: { flex: 1, backgroundColor: "transparent", paddingHorizontal: 8, paddingVertical: 12, fontSize: 15, color: '#1f2937' },
  summaryContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    gap: 12
  },
  summaryCard: {
    flex: 1, // ✨ Make each card take up equal space
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb'
  },
  activeSummaryCard: { backgroundColor: '#7c3aed', borderColor: '#7c3aed' },
  summaryNumber: { fontSize: 32, fontWeight: 'bold', color: '#1f2937', textAlign: 'center' },
  summaryLabel: { fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: '500' },
  activeSummaryText: { color: '#fff' },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  subTitle: { fontWeight: "bold", fontSize: 17, color: "#1f2937", marginTop: 8, marginBottom: 12, },
  card: { marginVertical: 6, borderRadius: 12, backgroundColor: "#ffffff", elevation: 1, shadowColor: "#475569", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, },
  cardContent: { flexDirection: "row", alignItems: "center", paddingLeft: 12, paddingRight: 8, paddingVertical: 12 },
  trendIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', marginRight: 12, },
  contentArea: { flex: 1, marginRight: 8, },
  title: { fontWeight: "bold", fontSize: 15, color: "#1f2937", marginBottom: 2 },
  desc: { color: "#6b7280", fontSize: 13, marginBottom: 4 },
  chip: {
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7c3aed'
  },
  dateText: { fontSize: 12, color: '#9ca3af', marginTop: 6 },
  scoreContainer: { alignItems: 'center', paddingHorizontal: 8 },
  scoreLabel: { fontSize: 11, color: '#9ca3af' },
  scoreValue: { fontSize: 18, fontWeight: 'bold', color: '#7c3aed' },
  emptyText: { textAlign: "center", fontSize: 14, color: "#9ca3af", marginVertical: 48, },
  // --- Filter Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 8,
    marginTop: 110,
    marginRight: 16,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    padding: 8,
    color: '#333'
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  modalOptionText: {
    fontSize: 14,
    color: '#333'
  },
  modalOptionTextActive: {
    color: '#7c3aed',
    fontWeight: 'bold',
  },
});