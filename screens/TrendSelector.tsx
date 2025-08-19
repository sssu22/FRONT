// sssu22/front/FRONT-feature-/screens/TrendSelector.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Button } from "react-native-paper";
import { trendsApi } from "../utils/apiUtils";
import { Trend } from "../types";

interface Props {
  selectedTrend: Trend | null;
  onTrendSelect: (t: Trend) => void;
  onClose: () => void;
  onTrendCreated: () => void | Promise<void>;
  onClear: () => void;
}

const MAX_POPUP_WIDTH = Math.min(Dimensions.get("window").width - 32, 560);

export default function TrendSelector({
                                        selectedTrend,
                                        onTrendSelect,
                                        onClose,
                                        onTrendCreated,
                                        onClear,
                                      }: Props) {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTrend, setNewTrend] = useState({ title: "", description: "", category: "음식" });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const categories = ["전체", "음식", "라이프스타일", "문화", "건강", "투자", "소설", "기타"];
  const categoryKeyMap: Record<string, string> = {
    음식: "FOOD", 라이프스타일: "LIFESTYLE", 문화: "CULTURE",
    건강: "HEALTH", 투자: "INVESTMENT", 소설: "SOCIAL", 기타: "ETC",
  };

  // ✨ 실시간 검색 로직 (useEffect)
  useEffect(() => {
    const performSearch = async () => {
      setIsLoading(true);
      try {
        if (search.trim() === "") {
          const results = await trendsApi.getAll();
          setTrends(results);
        } else {
          // ✨ 수정된 부분: response 객체에서 .list를 추출하여 사용
          const response = await trendsApi.search({
            keyword: search,
            category: category === "전체" ? undefined : category,
          });
          setTrends(response.list); // response가 아닌 response.list를 사용
        }
      } catch (error) {
        console.error("트렌드 데이터 로딩/검색 실패:", error);
        setTrends([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [search, category]);


  const handleTrendSelect = (t: Trend) => {
    onTrendSelect({ ...t, name: t.name || t.title });
  };

  const handleCreateTrend = async () => {
    if (!newTrend.title.trim() || !newTrend.description.trim()) {
      setCreateError("제목과 설명을 모두 입력해주세요.");
      return;
    }
    setCreateError("");
    setIsCreating(true);
    try {
      await trendsApi.create({
        title: newTrend.title,
        description: newTrend.description,
        category: categoryKeyMap[newTrend.category] || "ETC",
      });
      Alert.alert("성공", "새로운 트렌드가 생성되었습니다.");
      setShowCreateForm(false);
      setNewTrend({ title: "", description: "", category: "음식" });
      await onTrendCreated();
      // ✨ 생성 후 검색어 초기화하여 전체 목록 다시 불러오기
      setSearch("");
    } catch (error) {
      console.error("트렌드 생성 실패:", error);
      setCreateError("트렌드 생성에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsCreating(false);
    }
  };

  const renderTrendSelection = () => (
      <>
        <View style={styles.popupHeader}>
          <View>
            <Text style={styles.popupTitle}>트렌드 선택</Text>
            <Text style={styles.popupSubtitle}>경험과 관련된 트렌드를 선택하거나 새로 만드세요</Text>
          </View>
          <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
        </View>
        <View style={{ flex: 1, flexDirection: 'column' }}>
          {selectedTrend && (
              <View style={styles.selectedTrendContainer}>
                <Text style={styles.selectedTrendText} numberOfLines={1}>
                  {selectedTrend.name || selectedTrend.title}
                </Text>
                <TouchableOpacity onPress={onClear}>
                  <Ionicons name="close-circle" size={22} color="#9333EA" />
                </TouchableOpacity>
              </View>
          )}
          <View style={styles.searchRow}>
            <Feather name="search" size={20} color="#9E9E9E" />
            <TextInput style={styles.searchInput} placeholder="트렌드 검색..." value={search} onChangeText={setSearch} />
            {search.length > 0 && <TouchableOpacity onPress={() => setSearch("")}><Ionicons name="close-circle" size={20} color="#9E9E9E" /></TouchableOpacity>}
          </View>
          <View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
              {categories.map((cat) => (
                  <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.chip, cat === category && styles.chipActive]}>
                    {cat === category && <MaterialIcons name="check" size={14} color="#fff" style={{marginRight: 4}}/>}
                    <Text style={cat === category ? styles.chipTextActive : styles.chipText}>{cat}</Text>
                  </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <TouchableOpacity style={styles.addNewButton} onPress={() => setShowCreateForm(true)}>
            <Ionicons name="add" size={22} color="#7C3AED" />
            <Text style={styles.addNewText}>새 트렌드 만들기</Text>
          </TouchableOpacity>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>인기 트렌드</Text>
            {/* ✨ trends.length로 변경 */}
            <Text style={styles.listCount}>{trends.length}개</Text>
          </View>
          <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
            {isLoading ? <ActivityIndicator size="large" color="#7C3AED" style={{ marginTop: 40 }} /> :
                // ✨ trends.length로 변경
                trends.length === 0 ? (
                    <View style={styles.noResultContainer}>
                      <Feather name="search" size={32} color="#D1D5DB" />
                      <Text style={styles.noResultText}>{search ? '검색 결과가 없습니다' : '표시할 트렌드가 없습니다'}</Text>
                    </View>
                    // ✨ filtered.map을 trends.map으로 변경
                ) : trends.map((t, index) => {
                  const name = t.name || t.title || `#${t.id}`;
                  const active = selectedTrend?.id === t.id;
                  let rankBadgeStyle = {};
                  let rankTextStyle = {};
                  if (index < 3) {
                    rankBadgeStyle = styles.rankBadgeTop3;
                    rankTextStyle = styles.rankTextTop3;
                  }
                  return (
                      <TouchableOpacity key={t.id} style={[styles.trendCard, active && styles.trendCardActive]} onPress={() => handleTrendSelect(t)}>
                        <View style={styles.trendCardLeft}>
                          <View style={[styles.rankBadge, rankBadgeStyle]}><Text style={[styles.rankText, rankTextStyle]}>#{index + 1}</Text></View>
                          <View style={styles.trendInfo}>
                            <Text style={styles.trendName}>{name}</Text>
                            {t.description && <Text numberOfLines={1} style={styles.trendDesc}>{t.description}</Text>}
                          </View>
                        </View>
                        <View style={styles.trendCardRight}>
                          <Text style={styles.trendCategory}>{t.category}</Text>
                          <Text style={styles.trendScore}>{t.score || 0}</Text>
                        </View>
                      </TouchableOpacity>
                  );
                })
            }
          </ScrollView>
        </View>
      </>
  );

  const renderCreateForm = () => (
      <View style={styles.createPopup}>
        <View style={styles.popupHeader}>
          <Text style={styles.popupTitle}>새 트렌드 만들기</Text>
          <TouchableOpacity onPress={() => setShowCreateForm(false)}><Ionicons name="close" size={24} color="#6B7280" /></TouchableOpacity>
        </View>
        {!!createError && <Text style={styles.errorText}>{createError}</Text>}
        <Text style={styles.label}>제목</Text>
        <TextInput
            style={styles.input}
            placeholder="트렌드 제목을 입력하세요"
            value={newTrend.title}
            onChangeText={(text) => setNewTrend(p => ({ ...p, title: text }))}
        />
        <Text style={styles.label}>설명</Text>
        <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="트렌드에 대한 간단한 설명"
            value={newTrend.description}
            onChangeText={(text) => setNewTrend(p => ({ ...p, description: text }))}
            multiline
        />
        <Text style={styles.label}>카테고리</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {Object.keys(categoryKeyMap).map((cat) => (
              <TouchableOpacity
                  key={cat}
                  style={[styles.chip, newTrend.category === cat && styles.chipActive]}
                  onPress={() => setNewTrend(p => ({ ...p, category: cat }))}
              >
                <Text style={newTrend.category === cat ? styles.chipTextActive : styles.chipText}>{cat}</Text>
              </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.buttonRow}>
          <Button mode="outlined" onPress={() => setShowCreateForm(false)} disabled={isCreating}>
            취소
          </Button>
          <Button mode="contained" onPress={handleCreateTrend} loading={isCreating} disabled={isCreating}>
            생성하기
          </Button>
        </View>
      </View>
  );

  return (
      <Modal visible transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.dimmed}>
          <View style={[styles.popup, { maxWidth: MAX_POPUP_WIDTH }]}>
            {showCreateForm ? renderCreateForm() : renderTrendSelection()}
          </View>
        </View>
      </Modal>
  );
}

const styles = StyleSheet.create({
  dimmed: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 16 },
  popup: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 20, maxHeight: "85%", flexDirection: 'column', flex: 1 },
  popupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  popupTitle: { fontSize: 20, fontWeight: "bold", color: "#1F2937" },
  popupSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  selectedTrendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  selectedTrendText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7C3AED',
    flex: 1,
    marginRight: 8,
  },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#F3F4F6", borderRadius: 10, paddingHorizontal: 12, marginBottom: 16 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 15, height: 44 },
  categoryRow: { paddingBottom: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F3F4F6", marginRight: 8 },
  chipActive: { backgroundColor: "#7C3AED" },
  chipText: { color: "#4B5563", fontSize: 14, fontWeight: "500" },
  chipTextActive: { color: "#fff", fontSize: 14, fontWeight: "bold" },
  addNewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, marginBottom: 16 },
  addNewText: { marginLeft: 8, color: '#4B5563', fontWeight: '600', fontSize: 15 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingHorizontal: 4 },
  listTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937' },
  listCount: { fontSize: 14, color: '#6B7280' },
  listContainer: { flex: 1 },
  trendCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: 'transparent' },
  trendCardActive: { borderColor: "#7C3AED", backgroundColor: "#F5F3FF" },
  trendCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 },
  rankBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rankText: { color: '#4B5563', fontWeight: 'bold' },
  trendInfo: { flex: 1 },
  trendName: { fontWeight: "bold", fontSize: 16, color: "#1F2937", marginBottom: 2 },
  trendDesc: { color: "#6B7280", fontSize: 13 },
  trendCardRight: { alignItems: 'flex-end' },
  trendCategory: { color: '#6B7280', fontSize: 12, fontWeight: '500', marginBottom: 4 },
  trendScore: { color: '#7C3AED', fontSize: 14, fontWeight: 'bold' },
  noResultContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  noResultText: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 12 },
  rankBadgeTop3: { backgroundColor: '#7C3AED' },
  rankTextTop3: { color: '#FFFFFF' },
  createPopup: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    maxHeight: "85%",
  },
  errorText: { color: '#ef4444', marginBottom: 12, textAlign: 'center' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6, marginTop: 8 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
    gap: 8,
  },
});