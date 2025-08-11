import React, { useState, useMemo } from "react";
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
} from "react-native";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Chip, Button } from "react-native-paper";
import { trendsApi } from "../utils/apiUtils";

export interface Trend {
  id: number;
  title?: string;
  name?: string;
  description: string;
  category: string;
  popularity?: number;
  createdAt?: string;
}

interface Props {
  trends?: Trend[];
  selectedTrend: Trend | null;
  onTrendSelect: (t: Trend) => void;
  onClose: () => void;
  onTrendCreated: () => void | Promise<void>;
}

const MAX_POPUP_WIDTH = Math.min(Dimensions.get("window").width - 32, 560);

export default function TrendSelector({
  trends = [],
  selectedTrend,
  onTrendSelect,
  onClose,
  onTrendCreated,
}: Props) {
  const actualTrends = Array.isArray(trends) ? trends : [];
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newTrend, setNewTrend] = useState({ title: "", description: "", category: "FOOD" });
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const categories = ["전체", "FOOD", "LIFESTYLE", "CULTURE", "HEALTH", "INVESTMENT", "SOCIAL", "ETC"];
  const categoryLabels: Record<string, string> = {
    전체: "전체", FOOD: "음식", LIFESTYLE: "라이프스타일", CULTURE: "문화",
    HEALTH: "건강", INVESTMENT: "투자", SOCIAL: "소셜", ETC: "기타",
  };

  const filtered = useMemo(() => {
    return actualTrends
      .filter((t) => {
        const name = t.name || t.title || "";
        const desc = t.description || "";
        const q = search.toLowerCase();
        return name.toLowerCase().includes(q) || desc.toLowerCase().includes(q);
      })
      .filter((t) => category === "전체" || t.category === category);
  }, [actualTrends, search, category]);

  const handleTrendSelect = (t: Trend) => {
    onTrendSelect({ ...t, name: t.name || t.title });
  };

  const handleCreateTrend = async () => {
    if (!newTrend.title || !newTrend.description) {
      setCreateError("이름과 설명을 모두 입력해주세요.");
      return;
    }
    setIsCreating(true);
    setCreateError("");
    try {
      await trendsApi.create(newTrend);
      setShowCreateForm(false);
      setNewTrend({ title: "", description: "", category: "FOOD" });
      await onTrendCreated();
    } catch (error) {
      console.error("트렌드 생성 실패:", error);
      setCreateError("트렌드 생성에 실패했습니다.");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.dimmed}>
        <View style={[styles.popup, { maxWidth: MAX_POPUP_WIDTH }]}>
          <View style={styles.popupHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="trending-up" size={20} color="#7C3AED" />
              <Text style={styles.popupTitle}>{showCreateForm ? "새 트렌드 만들기" : "트렌드 선택"}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {showCreateForm ? (
            <View>
              <Text style={styles.label}>트렌드 이름</Text>
              <TextInput style={styles.input} placeholder="예: 치맥, 탕후루" value={newTrend.title} onChangeText={(t) => setNewTrend(p => ({...p, title: t}))} />
              
              <Text style={styles.label}>한 줄 설명</Text>
              <TextInput style={styles.input} placeholder="예: 치킨은 문화입니다" value={newTrend.description} onChangeText={(t) => setNewTrend(p => ({...p, description: t}))} />

              <Text style={styles.label}>카테고리</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                {categories.filter(c => c !== '전체').map((cat) => (
                  <TouchableOpacity key={cat} onPress={() => setNewTrend(p => ({...p, category: cat}))} style={[styles.categoryBadge, cat === newTrend.category && styles.categoryBadgeActive]}>
                    <Text style={cat === newTrend.category ? styles.catActiveText : styles.catText}>{categoryLabels[cat]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              {createError && <Text style={styles.errorText}>{createError}</Text>}

              <View style={styles.buttonRow}>
                <Button onPress={() => setShowCreateForm(false)} disabled={isCreating}>취소</Button>
                <Button mode="contained" onPress={handleCreateTrend} loading={isCreating} disabled={isCreating}>생성하기</Button>
              </View>
            </View>
          ) : (
            <>
              <View style={styles.searchRow}>
                <Feather name="search" size={17} color="#a3a3b7" />
                <TextInput style={styles.searchInput} placeholder="트렌드 검색..." value={search} onChangeText={setSearch} />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={20} color="#a3a3b7" />
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                {categories.map((cat) => (
                  <TouchableOpacity key={cat} onPress={() => setCategory(cat)} style={[styles.categoryBadge, cat === category && styles.categoryBadgeActive]}>
                    <Text style={cat === category ? styles.catActiveText : styles.catText}>{categoryLabels[cat]}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <ScrollView style={styles.listContainer}>
                {filtered.map((t) => {
                  const name = t.name || t.title || `#${t.id}`;
                  const active = selectedTrend?.id === t.id;
                  return (
                    <TouchableOpacity key={t.id} style={[styles.trendItem, active && styles.trendItemActive]} onPress={() => handleTrendSelect(t)}>
                      <View style={styles.trendHeader}>
                        <Text style={[styles.trendName, active && styles.trendNameActive]}>{name}</Text>
                        {active && <Ionicons name="checkmark-circle" size={20} color="#7C3AED" />}
                      </View>
                      {t.description && <Text numberOfLines={2} style={styles.trendDesc}>{t.description}</Text>}
                      <View style={styles.trendFooter}>
                        <Chip style={styles.trendChip} textStyle={styles.trendChipText}>{categoryLabels[t.category] || t.category}</Chip>
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {filtered.length === 0 && (
                  <View style={styles.noResultContainer}>
                    <Feather name="search" size={32} color="#D1D5DB" />
                    <Text style={styles.noResultText}>검색 결과가 없습니다</Text>
                  </View>
                )}
              </ScrollView>
              <TouchableOpacity style={styles.addNewButton} onPress={() => setShowCreateForm(true)}>
                <Ionicons name="add-circle" size={18} color="#7C3AED" />
                <Text style={styles.addNewText}>원하는 트렌드가 없나요? 새로 만들기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimmed: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center", padding: 16 },
  popup: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 16, elevation: 7 },
  popupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  popupTitle: { marginLeft: 8, fontSize: 18, fontWeight: "bold", color: "#7C3AED" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f3f2fa", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 8, fontSize: 14 },
  categoryRow: { marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "#e3e4fa", marginRight: 8, backgroundColor: "#fff" },
  categoryBadgeActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  catText: { color: "#7C3AED", fontSize: 12, fontWeight: "500" },
  catActiveText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  listContainer: { maxHeight: 300 },
  trendItem: { padding: 12, borderBottomWidth: 1, borderColor: "#f3f4f6", marginBottom: 4, borderRadius: 8 },
  trendItemActive: { backgroundColor: "#f3f0ff", borderColor: "#d8cfff", borderWidth: 1 },
  trendHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  trendName: { fontWeight: "bold", fontSize: 16, color: "#1F2937", flex: 1 },
  trendNameActive: { color: "#7C3AED" },
  trendDesc: { color: "#6B7280", fontSize: 13, marginBottom: 8, lineHeight: 18 },
  trendFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trendChip: { backgroundColor: "#f3f4f6", height: 24 },
  trendChipText: { fontSize: 11, color: "#4B5563" },
  noResultContainer: { alignItems: "center", padding: 32 },
  noResultText: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 12, marginBottom: 4 },
  addNewButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingTop: 16, borderTopWidth: 1, borderColor: '#f3f4f6', marginTop: 8 },
  addNewText: { marginLeft: 8, color: '#7C3AED', fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, color: '#333' },
  input: { backgroundColor: '#f3f2fa', borderRadius: 8, padding: 12, fontSize: 15, marginBottom: 12 },
  buttonRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 16 },
  errorText: { color: 'red', textAlign: 'center', marginBottom: 8 },
});