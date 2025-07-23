// screens/PostsTab.tsx
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Modal,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { Feather, Ionicons } from "@expo/vector-icons";

export interface Experience {
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

const locationCoordinates: Record<string, { top: number; left: number }> = {
  "강남구 신사동":    { top: 65, left: 60 },
  "홍대입구역":      { top: 45, left: 25 },
  "잠실 올림픽공원": { top: 55, left: 75 },
  이태원동:            { top: 55, left: 50 },
  온라인:              { top: 30, left: 50 },
  명동:                { top: 50, left: 45 },
  건대입구:            { top: 50, left: 70 },
  신촌:                { top: 45, left: 30 },
  종로:                { top: 40, left: 45 },
  여의도:              { top: 55, left: 35 },
};

const emotionColors: Record<string, string> = {
  joy: "#fef08a",
  excitement: "#fecaca",
  nostalgia: "#ddd6fe",
  surprise: "#bfdbfe",
  love: "#fbcfe8",
  regret: "#fde68a",
  sadness: "#93c5fd",
  irritation: "#fecaca",
  anger: "#ef4444",
  embarrassment: "#fda4af",
};

const emotionIcons: Record<string, string> = {
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

interface Props {
  experiences: Experience[];
  onExperienceClick: (exp: Experience) => void;
  onEditExperience: (exp: Experience) => void;
  onDeleteExperience: (id: string) => void;
}

export default function PostsTab({
  experiences = [], // 기본값 추가
  onExperienceClick,
  onEditExperience,
  onDeleteExperience,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "trend" | "title">("date");
  const [filterEmotion, setFilterEmotion] = useState<"all" | Experience["emotion"]>("all");
  const [modalSortBy, setModalSortBy] = useState(sortBy);
  const [modalFilterEmotion, setModalFilterEmotion] = useState(filterEmotion);
  const [openSort, setOpenSort] = useState(false);
  const [sortItems, setSortItems] = useState([
    { label: "최신순", value: "date" },
    { label: "트렌드순", value: "trend" },
    { label: "제목순", value: "title" },
  ]);
  const [openEmotion, setOpenEmotion] = useState(false);
  const [emotionItems, setEmotionItems] = useState([
    { label: "전체", value: "all" },
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
  ]);
  const [showModal, setShowModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const { width, height } = useWindowDimensions();

  // 필터 & 정렬 - experiences가 undefined인 경우 처리
  let filtered = (experiences || []).filter((exp) => {
    if (!exp) return false; // undefined 체크 추가
    
    const matchesSearch = exp.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.tags?.some((t) => t?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      exp.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });
  
  if (filterEmotion !== "all") {
    filtered = filtered.filter((exp) => exp?.emotion === filterEmotion);
  }
  
  if (selectedLocation) {
    filtered = filtered.filter((exp) => exp?.location === selectedLocation);
  }
  
  filtered = [...filtered].sort((a, b) => {
    if (!a || !b) return 0; // undefined 체크
    
    if (sortBy === "date") return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === "trend") return b.trendScore - a.trendScore;
    return a.title.localeCompare(b.title);
  });

  const applyFilters = () => {
    setSortBy(modalSortBy);
    setFilterEmotion(modalFilterEmotion);
    setShowModal(false);
  };

  // FlatList Header (map + search)
  const renderHeader = () => (
    <>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>내 게시글</Text>
          <Text style={styles.headerSubtitle}>
            총 {filtered.length}개 경험
            {selectedLocation ? ` • ${selectedLocation}` : ""}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => {
            setModalSortBy(sortBy);
            setModalFilterEmotion(filterEmotion);
            setShowModal(true);
          }}
        >
          <Feather name="sliders" size={18} color="#374151" />
          <Text style={styles.filterTxt}>필터</Text>
        </TouchableOpacity>
      </View>

      {/* 지도 */}
      <View style={styles.mapCard}>
        <Text style={styles.mapTitle}>
          <Ionicons name="location-sharp" size={16} color="#16a34a" /> 서울 경험 지도
        </Text>
        <View style={styles.mapWrap}>
          {Object.entries(
            (experiences || []).reduce<Record<string, Experience[]>>((acc, exp) => {
              if (exp && exp.location) { // undefined 체크 추가
                (acc[exp.location] ||= []).push(exp);
              }
              return acc;
            }, {})
          ).map(([loc, exps]) => {
            const coords = locationCoordinates[loc] || { top: 50, left: 50 };
            const px = (coords.left / 100) * width * 0.8; // 지도 크기에 맞게 조정
            const py = (coords.top / 100) * 150; // 지도 높이에 맞게 조정
            const isSel = selectedLocation === loc;
            return (
              <TouchableOpacity
                key={loc}
                style={[styles.pin, { top: py, left: px }]}
                onPress={() =>
                  setSelectedLocation((prev) => (prev === loc ? null : loc))
                }
              >
                <View style={styles.shadow} />
                <View
                  style={[
                    styles.pinCircle,
                    isSel ? styles.selCircle : styles.defCircle,
                  ]}
                >
                  <Text style={styles.pinTxt}>{exps.length}</Text>
                </View>
                <View
                  style={[styles.pinTri, isSel ? styles.selTri : styles.defTri]}
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 검색 */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={18} style={styles.searchIcon} />
        <TextInput
          placeholder="내 경험 검색..."
          style={styles.searchInp}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => setSearchQuery("")}
            style={styles.clearBtn}
          >
            <Feather name="x" size={18} />
          </TouchableOpacity>
        ) : null}
      </View>
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => item?.id || `item-${index}`} // undefined 체크 추가
        ListHeaderComponent={renderHeader}
        renderItem={({ item }) => {
          // item이 undefined인 경우 처리
          if (!item) return null;
          
          return (
            <TouchableOpacity
              onPress={() => onExperienceClick(item)}
              style={styles.card}
            >
              <View style={styles.cardHd}>
                <Text style={styles.cardTitle}>{item.title || ''}</Text>
                <View style={styles.trendWrap}>
                  <Text style={styles.trendLbl}>트렌드</Text>
                  <Text style={styles.trendVal}>{item.trendScore || 0}</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="calendar" size={14} color="#6b7280" />
                <Text style={styles.metaTxt}>
                  {item.date ? new Date(item.date).toLocaleDateString("ko-KR") : ''}
                </Text>
                <TouchableOpacity
                  style={styles.locationMeta}
                  onPress={() =>
                    setSelectedLocation((prev) =>
                      prev === item.location ? null : item.location
                    )
                  }
                >
                  <Ionicons name="location-sharp" size={14} color="#6b7280" />
                  <Text style={styles.metaTxt}>{item.location || ''}</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.description}>{item.description || ''}</Text>

              <View style={styles.tagsWrap}>
                <View
                  style={[styles.badge, { backgroundColor: emotionColors[item.emotion] || '#f3f4f6' }]}
                >
                  <Text style={styles.badgeTxt}>
                    {emotionIcons[item.emotion] || '😐'}
                  </Text>
                </View>
                {(item.tags || []).map((tag, index) => (
                  <View key={`${tag}-${index}`} style={styles.badge}>
                    <Text style={styles.badgeTxt}>#{tag}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.actions}>
                {/* 수정 버튼 */}
                <TouchableOpacity
                  onPress={() => onEditExperience(item)}
                  style={styles.actBtn}
                >
                  <Feather name="edit" size={20} color="#374151" />
                </TouchableOpacity>
                {/* 삭제 버튼 */}
                <TouchableOpacity
                  onPress={() => onDeleteExperience(item.id)}
                  style={styles.actBtn}
                >
                  <Feather name="trash-2" size={20} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTxt}>
              {searchQuery || selectedLocation
                ? "검색 결과가 없습니다"
                : "작성된 경험이 없습니다"}
            </Text>
          </View>
        )}
      />

      {/* 필터 모달 */}
      <Modal transparent visible={showModal} animationType="fade">
        <View style={styles.modalOv}>
          <View style={styles.modalBox}>
            <Text style={styles.modalHeader}>필터 설정</Text>
            <View style={styles.modalRow}>
              <View style={styles.modalCol}>
                <Text style={styles.modalLabel}>정렬</Text>
                <DropDownPicker
                  open={openSort}
                  value={modalSortBy}
                  items={sortItems}
                  setOpen={setOpenSort}
                  setValue={setModalSortBy}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropDownContainer}
                />
              </View>
              <View style={styles.modalCol}>
                <Text style={styles.modalLabel}>감정</Text>
                <DropDownPicker
                  open={openEmotion}
                  value={modalFilterEmotion}
                  items={emotionItems}
                  setOpen={setOpenEmotion}
                  setValue={setModalFilterEmotion}
                  style={styles.dropdown}
                  dropDownContainerStyle={styles.dropDownContainer}
                />
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalBtn}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={applyFilters}>
                <Text style={styles.modalBtn}>적용</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  headerSubtitle: { fontSize: 12, color: "#6b7280" },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 6,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
  },
  filterTxt: { marginLeft: 4, fontSize: 14 },

  mapCard: {
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 16,
  },
  mapTitle: { fontSize: 16, fontWeight: "500", padding: 12 },
  mapWrap: { height: 200, backgroundColor: "#bfdbfe", position: "relative" },
  pin: { position: "absolute", alignItems: "center", justifyContent: "center" },
  shadow: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 24,
    height: 24,
    backgroundColor: "#000",
    opacity: 0.2,
    borderRadius: 12,
  },
  pinCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pinTxt: { color: "#fff", fontSize: 12, fontWeight: "bold" },
  defCircle: { backgroundColor: "#ef4444" },
  selCircle: { backgroundColor: "#7c3aed" },
  pinTri: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    marginTop: -2,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
  },
  defTri: { borderTopColor: "#dc2626" },
  selTri: { borderTopColor: "#7c3aed" },

  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchIcon: { position: "absolute", left: 24, zIndex: 1 },
  searchInp: {
    flex: 1,
    height: 36,
    paddingLeft: 48,
    paddingRight: 32,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
  },
  clearBtn: { position: "absolute", right: 8, zIndex: 1 },

  card: {
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardHd: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: "600", flex: 1 },
  trendWrap: { alignItems: "flex-end" },
  trendLbl: { fontSize: 12, color: "#6b7280" },
  trendVal: { fontSize: 16, fontWeight: "bold", color: "#7c3aed" },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaTxt: { fontSize: 14, color: "#6b7280", marginLeft: 4 },
  locationMeta: {
    marginLeft: 12,
    flexDirection: "row",
    alignItems: "center",
  },

  description: { fontSize: 14, color: "#4b5563", marginBottom: 12 },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 12,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  badgeTxt: { fontSize: 12, marginLeft: 4 },

  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actBtn: {
    marginLeft: 12,
    padding: 8,
    borderRadius: 8,
  },

  emptyContainer: { padding: 32, alignItems: "center" },
  emptyTxt: { fontSize: 14, color: "#6b7280" },

  modalOv: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
  },
  modalHeader: { fontSize: 18, fontWeight: "600", marginBottom: 12 },

  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 8,
  },
  modalLabel: { textAlign: "center", marginBottom: 6, fontSize: 14, fontWeight: "500" },

  dropdown: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    paddingHorizontal: 8,
    backgroundColor: "#fff",
  },
  dropDownContainer: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 4,
    backgroundColor: "#fff",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
  },
  modalBtn: { marginHorizontal: 8, fontSize: 14, fontWeight: "600", color: "#7c3aed" },
});