// screens/MyPostsTab.tsx
import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import DropDownPicker from "react-native-dropdown-picker";
import { WebView } from "react-native-webview";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

import { postsApi } from "../utils/apiUtils";
import districtCoordinates from "../constants/districtCoordinates";

const screenHeight = Dimensions.get("window").height;

const sortOptions = ["최신순", "트렌드순", "제목순"] as const;
type SortOption = typeof sortOptions[number];

const emotionLabels = {
  joy: "기쁨",
  excitement: "흥분",
  nostalgia: "향수",
  surprise: "놀람",
  love: "사랑",
  regret: "아쉬움",
  sadness: "슬픔",
  irritation: "짜증",
  anger: "화남",
  embarrassment: "당황",
} as const;
type EmotionKey = keyof typeof emotionLabels;
type EmotionLabel = typeof emotionLabels[EmotionKey];
const emotionIcons: Record<EmotionKey, string> = {
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
const emotionColors: Record<EmotionKey, string> = {
  joy: "#FFD700",
  excitement: "#FF4500",
  nostalgia: "#B0C4DE",
  surprise: "#9932CC",
  love: "#FF69B4",
  regret: "#778899",
  sadness: "#4682B4",
  irritation: "#F0E68C",
  anger: "#DC143C",
  embarrassment: "#FFB6C1",
};

export type Experience = {
  id: number;
  title: string;
  description: string;
  emotion: EmotionKey;
  location: string;
  date: string;
  tags: string[];
  trendScore: number;
  trendId: number;
  trendName?: string;
  latitude?: number;
  longitude?: number;
};

export interface MyPostsTabProps {
  onExperienceClick: (exp: Experience) => void;
  onEditExperience: (exp: Experience) => void;
  onDeleteExperience: (id: number) => void;
}

export default function MyPostsTab({
  onExperienceClick,
  onEditExperience,
  onDeleteExperience,
}: MyPostsTabProps) {
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("최신순");
  const [emotionFilter, setEmotionFilter] =
    useState<"전체" | EmotionLabel>("전체");
  const [districtFilter, setDistrictFilter] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [emotionOpen, setEmotionOpen] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const fetchExperiences = useCallback(async () => {
    setLoading(true);
    try {
      const apiSort =
        sortOption === "최신순"
          ? "latest"
          : sortOption === "트렌드순"
          ? "trend"
          : "title";
      let apiEmotion = "all";
      if (emotionFilter !== "전체") {
        const entry = (Object.entries(emotionLabels) as [
          EmotionKey,
          EmotionLabel
        ][]).find(([, label]) => label === emotionFilter);
        apiEmotion = entry ? entry[0].toUpperCase() : "all";
      }

      const list = await postsApi.getAll({
        sort: apiSort,
        emotion: apiEmotion,
        page: 1,
        size: 100,
      });

      setExperiences(list);
    } catch {
      Alert.alert("네트워크 오류", "게시글을 불러올 수 없습니다.");
      setExperiences([]);
    } finally {
      setLoading(false);
    }
  }, [sortOption, emotionFilter]);

  useEffect(() => {
    fetchExperiences();
  }, [fetchExperiences]);

  useEffect(() => {
    if (experiences.length) {
      const districtCounts: Record<string, number> = {};
      experiences.forEach((exp) => {
        if (exp.location && districtCoordinates[exp.location]) {
          districtCounts[exp.location] = (districtCounts[exp.location] || 0) + 1;
        }
      });
      const mapData = Object.keys(districtCounts).map(district => {
        const coords = districtCoordinates[district];
        if (coords) {
          return {
            district,
            count: districtCounts[district],
            lat: coords.lat,
            lng: coords.lng,
          };
        }
        return null;
      }).filter(Boolean);
      
      if (mapData.length > 0) {
        setTimeout(() => {
          webviewRef.current?.postMessage(JSON.stringify({ mapData }));
        }, 1000);
      }
    }
  }, [experiences]);

  const handleMessage = (event: any) => {
    try {
      const { district } = JSON.parse(event.nativeEvent.data);
      setDistrictFilter((prev) => (prev === district ? "" : district));
    } catch {}
  };

  const filteredExperiences = useMemo(() => {
    return experiences
      .filter((exp) => {
        const q = searchQuery.toLowerCase();
        return (
          exp.title.toLowerCase().includes(q) ||
          (exp.description && exp.description.toLowerCase().includes(q)) ||
          exp.location.toLowerCase().includes(q)
        );
      })
      .filter((exp) =>
        emotionFilter === "전체"
          ? true
          : emotionLabels[exp.emotion] === emotionFilter
      )
      .filter((exp) =>
        districtFilter ? exp.location === districtFilter : true
      )
      .sort((a, b) => {
        if (sortOption === "최신순") {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        if (sortOption === "트렌드순") {
          return (b.trendScore || 0) - (a.trendScore || 0);
        }
        return a.title.localeCompare(b.title);
      });
  }, [
    experiences,
    searchQuery,
    sortOption,
    emotionFilter,
    districtFilter,
  ]);
  
  const renderExperienceCard = ({ item }: { item: Experience }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onExperienceClick(item)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.trendInfo}>
          <Text style={styles.trendName}>{item.trendName || "트렌드"}</Text>
          <Text style={styles.trendScore}>{item.trendScore}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <Ionicons name="calendar-outline" size={12} color="#9E9E9E" />
        <Text style={styles.metaText}>
          {new Date(item.date).toLocaleDateString("ko-KR", {
            year: "2-digit",
            month: "2-digit",
            day: "2-digit",
          })}
        </Text>
        <Ionicons name="location-outline" size={12} color="#9E9E9E" style={{ marginLeft: 10 }} />
        <Text style={styles.metaText}>{item.location}</Text>
      </View>

      {item.description?.trim() && (
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description.trim()}
        </Text>
      )}

      <View style={styles.tagsAndActionsContainer}>
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, styles.emotionTag, { backgroundColor: emotionColors[item.emotion] + '30' }]}>
            <Text style={styles.tagText}>
              {emotionIcons[item.emotion]}
            </Text>
          </View>

          {item.tags?.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>#{tag}</Text>
            </View>
          ))}
          {item.tags?.length > 3 && (
            <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>
          )}
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onEditExperience(item); }}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons name="pencil-outline" size={18} color="#9E9E9E" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); onDeleteExperience(item.id); }}
            style={styles.actionButton}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={18} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const handleApplyFilters = () => {
    setSortOpen(false);
    setEmotionOpen(false);
    setShowFilterModal(false);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>게시글을 불러오는 중…</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredExperiences}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>내 게시글</Text>
                <Text style={styles.subtitle}>
                  총 {filteredExperiences.length}개 게시물
                  {districtFilter && ` • ${districtFilter} 필터링 중`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterModal(true)}
              >
                <Ionicons name="options-outline" size={20} color="#424242" />
              </TouchableOpacity>
            </View>

            <View style={styles.mapWrapper}>
              <WebView
                ref={webviewRef}
                originWhitelist={["*"]}
                source={{
                  html: `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=34bb066fa35861f283d741758f61344f"></script>
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
      #map { width: 100%; height: 100%; background-color: #f0f0f0; }
      .custom-pin {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        width: 32px;
        height: 32px;
        background: #EF4444;
        color: white;
        font-size: 13px;
        font-weight: bold;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        cursor: pointer;
        transition: all 0.2s;
        pointer-events: auto;
      }
      .custom-pin:hover {
        background: #DC2626;
        transform: rotate(-45deg) scale(1.1);
      }
      .pin-text {
        transform: rotate(45deg);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      let map = null;
      let overlays = [];
      function initMap() {
        if (!window.kakao || !window.kakao.maps) return;
        const container = document.getElementById('map');
        const options = {
          center: new kakao.maps.LatLng(37.5665, 126.9780),
          level: 8
        };
        map = new kakao.maps.Map(container, options);
      }
      function updateMapData(data) {
        if (!map || !data.mapData) return;
        overlays.forEach(overlay => overlay.setMap(null));
        overlays = [];
        data.mapData.forEach(item => {
          try {
            const position = new kakao.maps.LatLng(item.lat, item.lng);
            const overlayContent = document.createElement('div');
            overlayContent.className = 'custom-pin';
            const textSpan = document.createElement('span');
            textSpan.className = 'pin-text';
            textSpan.innerHTML = item.count;
            overlayContent.appendChild(textSpan);
            overlayContent.onclick = function() {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ district: item.district }));
              }
            };
            const customOverlay = new kakao.maps.CustomOverlay({
              position: position,
              content: overlayContent,
              yAnchor: 1.4,
              xAnchor: 0.5
            });
            customOverlay.setMap(map);
            overlays.push(customOverlay);
          } catch (error) {
            console.error('오버레이 생성 오류:', error);
          }
        });
        if (data.mapData[0]) {
          const centerPos = new kakao.maps.LatLng(data.mapData[0].lat, data.mapData[0].lng);
          map.setCenter(centerPos);
        }
      }
      if (window.kakao && window.kakao.maps) {
        initMap();
      } else {
        const interval = setInterval(() => {
          if (window.kakao && window.kakao.maps) {
            clearInterval(interval);
            initMap();
          }
        }, 100);
      }
      window.addEventListener('message', e => {
        try {
          const data = JSON.parse(e.data);
          updateMapData(data);
        } catch (error) {}
      });
    </script>
  </body>
</html>`,
                }}
                javaScriptEnabled
                domStorageEnabled
                onMessage={handleMessage}
              />
            </View>

            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#9E9E9E" />
              <TextInput
                placeholder="내 경험 검색..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>
          </>
        }
        renderItem={renderExperienceCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>작성된 게시글이 없습니다</Text>
            <Text style={styles.emptySubtitle}>새로운 경험을 기록해보세요!</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />

      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>필터 설정</Text>
            <Text style={styles.label}>정렬 기준</Text>
            <DropDownPicker<SortOption>
              open={sortOpen}
              setOpen={setSortOpen}
              value={sortOption}
              setValue={setSortOption}
              items={sortOptions.map(s => ({ label: s, value: s }))}
              style={styles.dropdown}
              zIndex={3000}
            />
            <Text style={styles.label}>감정 필터</Text>
            <DropDownPicker<"전체"|EmotionLabel>
              open={emotionOpen}
              setOpen={setEmotionOpen}
              value={emotionFilter}
              setValue={setEmotionFilter}
              items={[
                { label: "모든 감정", value: "전체" },
                ...Object.entries(emotionLabels).map(([key, label]) => ({
                  label: `${emotionIcons[key as EmotionKey]} ${label}`,
                  value: label
                }))
              ]}
              style={styles.dropdown}
              zIndex={2000}
            />
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={handleApplyFilters}
            >
              <Text style={styles.closeText}>적용</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F5" },
  loadingText: { marginTop: 10, color: "#757575" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#212121" },
  subtitle: { fontSize: 12, color: "#757575", marginTop: 2 },
  filterButton: { padding: 8 },
  mapWrapper: {
    height: screenHeight * 0.22,
    backgroundColor: "#E0E0E0",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, marginLeft: 8 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#212121",
    flex: 1,
    marginRight: 10,
    lineHeight: 24,
  },
  trendInfo: {
    alignItems: "flex-end",
  },
  trendName: {
    fontSize: 12,
    color: "#757575",
  },
  trendScore: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#673AB7",
    marginTop: 2,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  metaText: {
    fontSize: 12,
    color: "#757575",
    marginLeft: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#424242",
    lineHeight: 20,
    marginBottom: 12,
  },
  tagsAndActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: 'center',
    flex: 1,
  },
  tag: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
    marginBottom: 6,
    backgroundColor: "#EEEEEE",
  },
  emotionTag: {
    paddingHorizontal: 0,
    width: 26,
    height: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 13,
  },
  tagText: {
    fontSize: 12,
    color: "#616161",
    fontWeight: "500",
  },
  moreTagsText: {
    fontSize: 12,
    color: "#9E9E9E",
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    marginLeft: 8,
    padding: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
  },
  modalBackground: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.5)", 
    justifyContent: "center", 
    padding: 24 
  },
  modalContainer: { 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    padding: 20 
  },
  modalTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 20, 
    textAlign: "center" 
  },
  label: { 
    fontSize: 13, 
    color: "#4B5563", 
    marginBottom: 8, 
    fontWeight: "500" 
  },
  dropdown: { 
    borderColor: "#D1D5DB", 
    borderWidth: 1, 
    borderRadius: 10, 
    marginBottom: 16, 
    backgroundColor: "#FAFAFA" 
  },
  closeButton: { 
    marginTop: 16, 
    backgroundColor: "#7C3AED", 
    padding: 14, 
    borderRadius: 10 
  },
  closeText: { 
    textAlign: "center", 
    color: "white", 
    fontWeight: "600" 
  },
});