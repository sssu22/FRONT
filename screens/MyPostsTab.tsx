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
} from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { useGlobalContext } from "../GlobalContext";
import DropDownPicker from "react-native-dropdown-picker";
import { WebView } from "react-native-webview";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { postsApi } from "../utils/apiUtils";
import { Experience, EmotionType, emotionLabels } from "../types";

const screenHeight = Dimensions.get("window").height;
const KAKAO_API_KEY = "34bb066fa35861f283d741758f61344f";

const sortOptions = ["최신순", "트렌드순", "제목순"] as const;
type SortOption = (typeof sortOptions)[number];
type EmotionLabel = (typeof emotionLabels)[EmotionType];

const emotionIcons: Record<EmotionType, string> = {
  joy: "😊", excitement: "🔥", nostalgia: "💭", surprise: "😲", love: "💖",
  regret: "😞", sadness: "😢", irritation: "�", anger: "😡", embarrassment: "😳",
};
const emotionColors: Record<EmotionType, string> = {
  joy: "#FFD700", excitement: "#FF4500", nostalgia: "#B0C4DE", surprise: "#9932CC",
  love: "#FF69B4", regret: "#778899", sadness: "#4682B4", irritation: "#F0E68C",
  anger: "#DC143C", embarrassment: "#FFB6C1",
};

type MapMarkerItem = {
  district: string;
  postCount: number;
  latitude: number;
  longitude: number;
};

export interface MyPostsTabProps {
  onExperienceClick: (exp: Experience) => void;
  onEditExperience: (exp: Experience) => void;
  onDeleteExperience: (id: number) => void;
  // ✅ 에러 수정: App.tsx로부터 받는 searchQuery prop의 타입을 정의합니다.
  searchQuery: string;
}

const normalizeDistrict = (name: string): string => {
  if (!name) return "";
  const onlyKor = name.replace(/[^\u3131-\uD79D]/g, "");
  const m = onlyKor.match(/([가-힣]+구)/);
  if (m && m[1]) return m[1];
  return name.replace(/\s+/g, "");
};

export default function MyPostsTab({
  onExperienceClick,
  onEditExperience,
  onDeleteExperience,
  searchQuery,
}: MyPostsTabProps) {
  const isFocused = useIsFocused();
  const [allExperiences, setAllExperiences] = useState<Experience[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const [searchResults, setSearchResults] = useState<Experience[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [districtFilter, setDistrictFilter] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("최신순");
  const [emotionFilter, setEmotionFilter] = useState<"전체" | EmotionLabel>("전체");
  
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [emotionOpen, setEmotionOpen] = useState(false);
  
  const webviewRef = useRef<WebView>(null);
  const { user } = useGlobalContext();

  // [지도 데이터 로딩]
  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const items: MapMarkerItem[] = await postsApi.getMyPostMap();
        const mapData = items.map((it) => ({
          district: it.district, norm: normalizeDistrict(it.district),
          lat: it.latitude, lng: it.longitude, postCount: it.postCount,
        }));
        if (mapData.length > 0) {
          setTimeout(() => {
            webviewRef.current?.postMessage(JSON.stringify({ mapData, selectedDistrict: districtFilter }));
          }, 500);
        }
      } catch (e) { console.error("지도 데이터 로딩 실패:", e); }
    };
    if (isFocused) { fetchMapData(); }
  }, [isFocused, districtFilter]);

  // [게시물 목록 로딩]
  useEffect(() => {
    if (searchQuery.trim()) {
      setAllExperiences([]);
      return;
    }
    const loadPosts = async () => {
      setLoading(true);
      try {
        const params = {
          sort: "latest", page: 1, size: 200,
          district: districtFilter ? districtFilter : undefined,
        };
        const experienceList = await postsApi.getMyPosts(params);
        setAllExperiences(experienceList);
      } catch (err) {
        console.error("게시물 로딩 실패:", err);
        setAllExperiences([]);
      } finally { setLoading(false); }
    };
    if (isFocused) { loadPosts(); }
  }, [isFocused, user?.id, districtFilter, searchQuery]);

  // [게시물 검색 로직]
  useEffect(() => {
    const performSearch = async () => {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) {
        setSearchResults(null);
        return;
      }
      setIsSearching(true);
      try {
        const results = await postsApi.searchMyPosts(trimmedQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("내 게시물 검색 실패:", error);
        setSearchResults([]);
      } finally { setIsSearching(false); }
    };
    const debounceTimer = setTimeout(() => {
      performSearch();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const displayedExperiences = useMemo(() => {
    const source = searchResults !== null ? searchResults : allExperiences;
    let filtered = [...source];
    if (emotionFilter !== "전체") {
      const entry = (Object.entries(emotionLabels) as [EmotionType, EmotionLabel][]).find(([, label]) => label === emotionFilter);
      if (entry) { filtered = filtered.filter((exp) => exp.emotion === entry[0]); }
    }
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "최신순": return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "트렌드순": return (b.trendScore || 0) - (a.trendScore || 0);
        case "제목순": return a.title.localeCompare(b.title, "ko");
        default: return 0;
      }
    });
    return filtered;
  }, [allExperiences, searchResults, emotionFilter, sortOption]);

  const handleMessage = useCallback((event: any) => {
    try {
      const payload = JSON.parse(event.nativeEvent.data);
      const clickedDistrict = normalizeDistrict(payload.norm || payload.district || "");
      if (!clickedDistrict) return;
      setDistrictFilter((currentFilter) => currentFilter === clickedDistrict ? "" : clickedDistrict);
    } catch (error) { console.error("지도 메시지 처리 오류:", error); }
  }, []);

  const renderExperienceCard = ({ item }: { item: Experience }) => {
    const emKey = item.emotion || "joy";
    const bg = emotionColors[emKey] ? `${emotionColors[emKey]}30` : "#EEEEEE";
    return (
      <TouchableOpacity style={styles.card} onPress={() => onExperienceClick(item)} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.trendInfo}>
            <Text style={styles.trendName}>{item.trendName || "트렌드"}</Text>
            <Text style={styles.trendScore}>{item.trendScore}</Text>
          </View>
        </View>
        <View style={styles.cardMeta}>
          <Ionicons name="calendar-outline" size={12} color="#9E9E9E" />
          <Text style={styles.metaText}>{new Date(item.date).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" })}</Text>
          <Ionicons name="location-outline" size={12} color="#9E9E9E" style={{ marginLeft: 10 }} />
          <Text style={styles.metaText}>{item.location}</Text>
        </View>
        {(item.description || "").trim().length > 0 && (<Text style={styles.cardDescription} numberOfLines={2}>{item.description.trim()}</Text>)}
        <View style={styles.tagsAndActionsContainer}>
          <View style={styles.tagsContainer}>
            <View style={[styles.tag, styles.emotionTag, { backgroundColor: bg }]}><Text style={styles.emotionTagText}>{emotionIcons[emKey] ?? "🙂"}</Text></View>
            {item.tags?.slice(0, 3).map((tag, index) => (<View key={index} style={styles.tag}><Text style={styles.tagText}>#{tag}</Text></View>))}
            {item.tags?.length > 3 && <Text style={styles.moreTagsText}>+{item.tags.length - 3}</Text>}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onEditExperience(item); }} style={styles.actionButton}><MaterialCommunityIcons name="pencil-outline" size={18} color="#9E9E9E" /></TouchableOpacity>
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); onDeleteExperience(item.id); }} style={styles.actionButton}><MaterialCommunityIcons name="trash-can-outline" size={18} color="#F44336" /></TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  
  if ((loading || isSearching) && searchResults === null) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>{isSearching ? '검색 중...' : '게시글을 불러오는 중…'}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={displayedExperiences}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>내 게시글</Text>
                <Text style={styles.subtitle}>
                  {`총 ${displayedExperiences.length}개의 게시글`}
                  {districtFilter && ` (${districtFilter} 필터)`}
                </Text>
              </View>
              <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
                <Ionicons name="options-outline" size={20} color="#424242" />
              </TouchableOpacity>
            </View>
            <View style={styles.mapWrapper}>
              <WebView
                ref={webviewRef} originWhitelist={["*"]}
                source={{ html: `<!DOCTYPE html><html><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"><script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${KAKAO_API_KEY}"></script><style>html, body { margin: 0; padding: 0; width: 100%; height: 100%; } #map { width: 100%; height: 100%; background-color: #f0f0f0; } .custom-pin { position: relative; display: flex; justify-content: center; align-items: center; width: 32px; height: 32px; background: #EF4444; color: white; font-size: 13px; font-weight: bold; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.4); cursor: pointer; transition: all 0.2s; pointer-events: auto; } .custom-pin:hover { background: #DC2626; transform: rotate(-45deg) scale(1.1); } .custom-pin.selected { background: #7C3AED; } .pin-text { transform: rotate(45deg); }</style></head><body><div id="map"></div><script>
let map = null; let overlays = []; let selectedDistrictNorm = '';
const normalizeDistrict = (name) => { if (!name) return ''; const onlyKor = String(name).replace(/[^\\u3131-\\uD79D]/g, ''); const m = onlyKor.match(/([가-힣]+구)/); if (m && m[1]) return m[1]; return String(name).replace(/\\s+/g, ''); };
function initMap() { if (!window.kakao || !window.kakao.maps) return; const container = document.getElementById('map'); const options = { center: new kakao.maps.LatLng(37.5665, 126.9780), level: 8 }; map = new kakao.maps.Map(container, options); }
function updateMapData(data) {
  if (!map) return;
  if (data.selectedDistrict !== undefined) { selectedDistrictNorm = normalizeDistrict(data.selectedDistrict); }
  if (data.mapData) {
    overlays.forEach(overlay => overlay.setMap(null)); overlays = [];
    data.mapData.forEach(item => {
      try {
        const position = new kakao.maps.LatLng(item.lat, item.lng);
        const itemNorm = normalizeDistrict(item.norm || item.district);
        const overlayContent = document.createElement('div');
        overlayContent.className = (selectedDistrictNorm && itemNorm === selectedDistrictNorm) ? 'custom-pin selected' : 'custom-pin';
        const textSpan = document.createElement('span'); textSpan.className = 'pin-text'; textSpan.innerHTML = item.postCount; overlayContent.appendChild(textSpan);
        overlayContent.onclick = function() { if (window.ReactNativeWebView) { window.ReactNativeWebView.postMessage(JSON.stringify({ district: item.district, norm: itemNorm })); } };
        const customOverlay = new kakao.maps.CustomOverlay({ position: position, content: overlayContent, yAnchor: 1.4, xAnchor: 0.5 });
        customOverlay.setMap(map); overlays.push(customOverlay);
      } catch (error) { console.error('오버레이 생성 오류:', error); }
    });
    if (data.mapData.length > 0 && map.getLevel() > 7) {
      const bounds = new kakao.maps.LatLngBounds();
      data.mapData.forEach(item => bounds.extend(new kakao.maps.LatLng(item.lat, item.lng)));
      map.setBounds(bounds);
    }
  }
}
if (window.kakao && window.kakao.maps) { initMap(); } else { const interval = setInterval(() => { if (window.kakao && window.kakao.maps) { clearInterval(interval); initMap(); } }, 100); }
window.addEventListener('message', e => { try { const data = JSON.parse(e.data); updateMapData(data); } catch (error) {} });
</script></body></html>`}}
                javaScriptEnabled domStorageEnabled onMessage={handleMessage}
              />
            </View>
          </>
        }
        renderItem={renderExperienceCard}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? "검색 결과가 없습니다." : (districtFilter ? `${districtFilter}에 작성된 게시글이 없습니다` : "작성된 게시글이 없습니다")}
            </Text>
            <Text style={styles.emptySubtitle}>새로운 경험을 기록해보세요!</Text>
          </View>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
      />
      <Modal visible={showFilterModal} transparent animationType="slide">
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>필터 및 정렬</Text>
            <Text style={styles.label}>정렬 기준</Text>
            <DropDownPicker
              open={sortOpen} setOpen={setSortOpen} value={sortOption} setValue={setSortOption}
              items={sortOptions.map((s) => ({ label: s, value: s }))}
              style={styles.dropdown} dropDownContainerStyle={styles.dropdownContainer}
              zIndex={3000} zIndexInverse={1000}
            />
            <Text style={styles.label}>감정 필터</Text>
            <DropDownPicker
              open={emotionOpen} setOpen={setEmotionOpen} value={emotionFilter} setValue={setEmotionFilter}
              items={[{ label: "모든 감정", value: "전체" }, ...Object.entries(emotionLabels).map(([key, label]) => ({ label: `${emotionIcons[key as EmotionType]} ${label}`, value: label, }))]}
              style={styles.dropdown} dropDownContainerStyle={styles.dropdownContainer}
              zIndex={2000} zIndexInverse={2000}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setShowFilterModal(false)}>
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
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, backgroundColor: "#FFFFFF", borderBottomWidth: 1, borderBottomColor: "#EEEEEE" },
    title: { fontSize: 22, fontWeight: "bold", color: "#212121" },
    subtitle: { fontSize: 12, color: "#757575", marginTop: 2 },
    filterButton: { padding: 8 },
    mapWrapper: { height: screenHeight * 0.22, backgroundColor: "#E0E0E0" },
    card: { backgroundColor: "#FFFFFF", borderRadius: 12, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderColor: "#EEEEEE", padding: 16 },
    cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
    cardTitle: { fontSize: 16, fontWeight: "bold", color: "#212121", flex: 1, marginRight: 10, lineHeight: 24 },
    trendInfo: { alignItems: "flex-end" },
    trendName: { fontSize: 10, color: "#757575" },
    trendScore: { fontSize: 18, fontWeight: "bold", color: "#673AB7", marginTop: 2 },
    cardMeta: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    metaText: { fontSize: 12, color: "#757575", marginLeft: 4 },
    cardDescription: { fontSize: 14, color: "#4B5563", lineHeight: 22, marginBottom: 12, marginLeft: 4, fontStyle: "italic" },
    tagsAndActionsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
    tagsContainer: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", flex: 1 },
    tag: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6, backgroundColor: "#EEEEEE" },
    emotionTag: { paddingHorizontal: 8, paddingVertical: 4, minWidth: 30, height: 26, justifyContent: "center", alignItems: "center", borderRadius: 13 },
    tagText: { fontSize: 12, color: "#616161", fontWeight: "500" },
    emotionTagText: { fontSize: 14, textAlign: "center" },
    moreTagsText: { fontSize: 12, color: "#9E9E9E" },
    actions: { flexDirection: "row" },
    actionButton: { marginLeft: 8, padding: 4 },
    emptyContainer: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
    emptyTitle: { fontSize: 18, fontWeight: "600", color: "#6B7280", marginTop: 16 },
    emptySubtitle: { fontSize: 14, color: "#9CA3AF", marginTop: 8 },
    modalBackground: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
    modalContainer: { backgroundColor: "#fff", borderRadius: 16, padding: 20 },
    modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
    label: { fontSize: 13, color: "#4B5563", marginBottom: 8, fontWeight: "500" },
    dropdown: { borderColor: "#D1D5DB", borderWidth: 1, borderRadius: 10, marginBottom: 16, backgroundColor: "#FAFAFA" },
    dropdownContainer: { borderColor: "#D1D5DB", backgroundColor: "#FFFFFF", borderRadius: 10 },
    closeButton: { marginTop: 16, backgroundColor: "#7C3AED", padding: 14, borderRadius: 10 },
    closeText: { textAlign: "center", color: "white", fontWeight: "600" },
});
