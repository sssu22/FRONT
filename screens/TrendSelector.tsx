import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { Chip } from "react-native-paper";

export interface Trend {
  id: number;           // 이제 항상 정의됩니다
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
}

const MAX_POPUP_WIDTH = Math.min(Dimensions.get("window").width - 32, 560);

export default function TrendSelector({
  trends = [],
  selectedTrend,
  onTrendSelect,
  onClose,
}: Props) {
  // 배열 아닌 경우 빈 배열로 대체
  const actualTrends = Array.isArray(trends) ? trends : [];

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("전체");

  const categories = [
    "전체",
    "FOOD",
    "LIFESTYLE",
    "CULTURE",
    "HEALTH",
    "INVESTMENT",
    "SOCIAL",
    "ETC",
  ];
  const categoryLabels: Record<string, string> = {
    전체: "전체",
    FOOD: "음식",
    LIFESTYLE: "라이프스타일",
    CULTURE: "문화",
    HEALTH: "건강",
    INVESTMENT: "투자",
    SOCIAL: "소셜",
    ETC: "기타",
  };

  const filtered = actualTrends
    .filter((t) => {
      const name = t.name || t.title || "";
      const desc = t.description || "";
      const q = search.toLowerCase();
      return (
        name.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q)
      );
    })
    .filter((t) => category === "전체" || t.category === category);

  const handleTrendSelect = (t: Trend) => {
    onTrendSelect({ ...t, name: t.name || t.title });
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.dimmed}>
        <View style={[styles.popup, { maxWidth: MAX_POPUP_WIDTH }]}>
          <View style={styles.popupHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <MaterialIcons name="trending-up" size={20} color="#7C3AED" />
              <Text style={styles.popupTitle}>트렌드 선택</Text>
              <Text style={styles.trendCount}>({actualTrends.length}개)</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {actualTrends.length === 0 ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="trending-up" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>사용 가능한 트렌드가 없습니다</Text>
              <Text style={styles.emptyDesc}>
                Swagger에서 트렌드를 먼저 생성해주세요.{"\n"}
                POST /api/v1/trends
              </Text>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Text style={styles.closeBtnText}>닫기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.searchRow}>
                <Feather name="search" size={17} color="#a3a3b7" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="트렌드 검색..."
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch("")}>
                    <Ionicons name="close-circle" size={20} color="#a3a3b7" />
                  </TouchableOpacity>
                )}
              </View>

              <ScrollView horizontal style={styles.categoryRow}>
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[
                      styles.categoryBadge,
                      cat === category && styles.categoryBadgeActive,
                    ]}
                  >
                    <Text
                      style={
                        cat === category ? styles.catActiveText : styles.catText
                      }
                    >
                      {categoryLabels[cat]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <ScrollView style={styles.listContainer}>
                {filtered.map((t) => {
                  const name = t.name || t.title || `#${t.id}`;
                  const active = selectedTrend?.id === t.id;
                  return (
                    <TouchableOpacity
                      key={t.id}  // ← 이제 고유 key
                      style={[
                        styles.trendItem,
                        active && styles.trendItemActive,
                      ]}
                      onPress={() => handleTrendSelect(t)}
                    >
                      <View style={styles.trendHeader}>
                        <Text
                          style={[
                            styles.trendName,
                            active && styles.trendNameActive,
                          ]}
                        >
                          {name}
                        </Text>
                        {active && (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color="#7C3AED"
                          />
                        )}
                      </View>
                      {t.description && (
                        <Text numberOfLines={2} style={styles.trendDesc}>
                          {t.description}
                        </Text>
                      )}
                      <View style={styles.trendFooter}>
                        <Chip
                          style={styles.trendChip}
                          textStyle={styles.trendChipText}
                        >
                          {categoryLabels[t.category] || t.category}
                        </Chip>
                        {typeof t.popularity === "number" && (
                          <Text style={styles.popularityText}>
                            인기도: {t.popularity}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
                {filtered.length === 0 && (
                  <View style={styles.noResultContainer}>
                    <Feather name="search" size={32} color="#D1D5DB" />
                    <Text style={styles.noResultText}>검색 결과가 없습니다</Text>
                    <Text style={styles.noResultDesc}>
                      다른 키워드로 검색해보세요
                    </Text>
                  </View>
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimmed: { flex: 1, backgroundColor: "rgba(0,0,0,0.22)", justifyContent: "center", alignItems: "center", padding: 16 },
  popup: { width: "100%", backgroundColor: "#fff", borderRadius: 20, padding: 16, elevation: 7 },
  popupHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  popupTitle: { marginLeft: 8, fontSize: 18, fontWeight: "bold", color: "#7C3AED" },
  trendCount: { marginLeft: 4, fontSize: 14, color: "#6B7280" },
  searchRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#f3f2fa", borderRadius: 8, padding: 8, marginBottom: 12 },
  searchInput: { flex: 1, marginLeft: 6, fontSize: 14 },
  categoryRow: { marginBottom: 12 },
  categoryBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: "#e3e4fa", marginRight: 8, backgroundColor: "#fff" },
  categoryBadgeActive: { backgroundColor: "#7C3AED", borderColor: "#7C3AED" },
  catText: { color: "#7C3AED", fontSize: 12, fontWeight: "500" },
  catActiveText: { color: "#fff", fontSize: 12, fontWeight: "500" },
  listContainer: { maxHeight: 300 },
  trendItem: { padding: 12, borderBottomWidth: 1, borderColor: "#f3f4f6", marginBottom: 4, borderRadius: 8 },
  trendItemActive: { backgroundColor: "#f8f7ff", borderColor: "#e0e7ff", borderWidth: 1 },
  trendHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  trendName: { fontWeight: "bold", fontSize: 16, color: "#1F2937", flex: 1 },
  trendNameActive: { color: "#7C3AED" },
  trendDesc: { color: "#6B7280", fontSize: 13, marginBottom: 8, lineHeight: 18 },
  trendFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  trendChip: { backgroundColor: "#f3f4f6", height: 24 },
  trendChipText: { fontSize: 11, color: "#4B5563" },
  popularityText: { fontSize: 12, color: "#9CA3AF" },
  emptyContainer: { alignItems: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "bold", color: "#374151", marginTop: 16, marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 20, marginBottom: 24 },
  closeBtn: { backgroundColor: "#7C3AED", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  closeBtnText: { color: "#fff", fontWeight: "600" },
  noResultContainer: { alignItems: "center", padding: 32 },
  noResultText: { fontSize: 16, fontWeight: "600", color: "#374151", marginTop: 12, marginBottom: 4 },
  noResultDesc: { fontSize: 14, color: "#6B7280", textAlign: "center" },
});
