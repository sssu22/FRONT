// screens/MyPostsTab.tsx - UI 개선 버전
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
import { Ionicons } from "@expo/vector-icons";

import { postsApi } from "../utils/apiUtils";
import districtCoordinates from "../constants/districtCoordinates";

const screenHeight = Dimensions.get("window").height;

// 정렬 옵션 정의
const sortOptions = ["최신순", "트렌드순", "제목순"] as const;
type SortOption = typeof sortOptions[number];

// 감정 라벨 & 아이콘
const emotionLabels = {
  joy: "기쁜",
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

  // ✅ 지도 데이터 업데이트 (districtCoordinates 활용)
  useEffect(() => {
    if (experiences.length) {
      console.log("📍 지도 데이터 업데이트 시작, 총 게시글:", experiences.length);
      
      // 구별로 게시글 개수 집계
      const districtCounts: Record<string, number> = {};
      
      experiences.forEach((exp, index) => {
        console.log(`게시글 ${index + 1}:`, {
          location: exp.location,
          lat: exp.latitude,
          lng: exp.longitude
        });
        
        if (exp.location && districtCoordinates[exp.location]) {
          districtCounts[exp.location] = (districtCounts[exp.location] || 0) + 1;
        }
      });

      console.log("📊 구별 집계 결과:", districtCounts);
      console.log("📍 사용 가능한 구 좌표:", Object.keys(districtCoordinates));

      // districtCoordinates에서 좌표 가져오기
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
      }).filter(Boolean); // null 제거

      console.log("🗺️ 최종 지도 데이터:", mapData);
      
      if (mapData.length > 0) {
        console.log("🚀 지도로 데이터 전송 시작");
        
        // 약간의 지연을 두고 전송 (지도 초기화 완료 대기)
        setTimeout(() => {
          webviewRef.current?.postMessage(JSON.stringify({ mapData }));
          console.log("✅ 지도로 데이터 전송 완료");
        }, 1000);
      } else {
        console.log("❌ 표시할 지도 데이터가 없음");
      }
    } else {
      console.log("📍 게시글이 없어서 지도 데이터 업데이트 안함");
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
          exp.description.toLowerCase().includes(q) ||
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

  // ✅ 개선된 게시글 카드 렌더링 (크기 축소 및 레이아웃 개선)
  const renderExperienceCard = ({ item }: { item: Experience }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onExperienceClick(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <View style={styles.emotionBadge}>
            <Text style={styles.emotionIcon}>{emotionIcons[item.emotion]}</Text>
          </View>
        </View>
        
        {/* ✅ 설명 텍스트 표시 확실히 하기 */}
        {item.description && item.description.trim() && (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description.trim()}
          </Text>
        )}
        
        <View style={styles.cardMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={12} color="#6B7280" />
            <Text style={styles.metaText}>{item.location}</Text>
            <Ionicons name="calendar-outline" size={12} color="#6B7280" style={{ marginLeft: 8 }} />
            <Text style={styles.metaText}>
              {new Date(item.date).toLocaleDateString("ko-KR", { 
                year: "numeric", 
                month: "short", 
                day: "numeric" 
              })}
            </Text>
          </View>
        </View>

        {/* ✅ 간소화된 태그 (최대 2개) */}
        {item.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {item.tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
            {item.tags.length > 2 && (
              <Text style={styles.moreTagsText}>+{item.tags.length - 2}</Text>
            )}
          </View>
        )}

        <View style={styles.cardFooter}>
          <View style={styles.trendInfo}>
            <Ionicons name="trending-up" size={12} color="#7C3AED" />
            <Text style={styles.trendText}>{item.trendScore}</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                onEditExperience(item);
              }}
              style={styles.actionButton}
            >
              <Ionicons name="create-outline" size={16} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                onDeleteExperience(item.id);
              }}
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={16} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

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
            {/* 헤더 */}
            <View style={styles.header}>
              <View>
                <Text style={styles.title}>내 게시글</Text>
                <Text style={styles.subtitle}>
                  총 {filteredExperiences.length}개 경험
                  {districtFilter && ` • ${districtFilter} 필터링 중`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.filterButton}
                onPress={() => setShowFilterModal(true)}
              >
                <Ionicons name="options" size={16} color="#7C3AED" />
              </TouchableOpacity>
            </View>

            {/* ✅ 개선된 지도 */}
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=34bb066fa35861f283d741758f61344f"></script>
    <style>
      html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
      #map { width: 100%; height: 100%; background-color: #f0f0f0; }
      .custom-overlay {
        background: #7C3AED;
        color: white;
        padding: 6px 10px;
        border-radius: 16px;
        font-size: 11px;
        font-weight: bold;
        border: 2px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;
        pointer-events: auto;
      }
      .custom-overlay:hover {
        background: #5B21B6;
        transform: scale(1.05);
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      console.log('🗺️ 지도 스크립트 로드됨');
      
      let map = null;
      let overlays = [];
      
      function initMap() {
        if (!window.kakao || !window.kakao.maps) {
          console.error('❌ 카카오 맵 API 로드 실패');
          document.getElementById('map').innerHTML = 
            '<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;font-size:14px;color:#666;">🗺️ 지도 로드 실패</div>';
          return;
        }
        
        console.log('✅ 카카오 맵 API 로드 성공');
        
        try {
          const container = document.getElementById('map');
          const options = {
            center: new kakao.maps.LatLng(37.5665, 126.9780),
            level: 8
          };
          
          map = new kakao.maps.Map(container, options);
          console.log('✅ 지도 초기화 완료');
          
          // 테스트용 마커 추가
          const testMarker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(37.5665, 126.9780)
          });
          testMarker.setMap(map);
          console.log('✅ 테스트 마커 추가 완료');
          
        } catch (error) {
          console.error('❌ 지도 초기화 오류:', error);
        }
      }
      
      function updateMapData(data) {
        if (!map) {
          console.error('❌ 지도가 초기화되지 않음');
          return;
        }
        
        console.log('📍 지도 데이터 업데이트:', data);
        
        // 기존 오버레이 제거
        overlays.forEach(overlay => {
          overlay.setMap(null);
        });
        overlays = [];
        
        if (data.mapData && data.mapData.length > 0) {
          data.mapData.forEach((item, index) => {
                          console.log('오버레이 ' + (index + 1) + ' 생성:', item);
            
            try {
              const position = new kakao.maps.LatLng(item.lat, item.lng);
              
              const overlayContent = document.createElement('div');
              overlayContent.className = 'custom-overlay';
              overlayContent.innerHTML = item.district + ' (' + item.count + ')';
              overlayContent.onclick = function() {
                console.log('🖱️ 오버레이 클릭:', item.district);
                if (window.ReactNativeWebView) {
                  window.ReactNativeWebView.postMessage(JSON.stringify({ 
                    district: item.district 
                  }));
                }
              };
              
              const customOverlay = new kakao.maps.CustomOverlay({
                position: position,
                content: overlayContent,
                yAnchor: 1
              });
              
              customOverlay.setMap(map);
              overlays.push(customOverlay);
              
              console.log('✅ 오버레이 ' + (index + 1) + ' 추가 완료');
              
            } catch (error) {
              console.error('❌ 오버레이 ' + (index + 1) + ' 생성 오류:', error);
            }
          });
          
          // 첫 번째 위치로 지도 중심 이동
          if (data.mapData[0]) {
            const centerPos = new kakao.maps.LatLng(data.mapData[0].lat, data.mapData[0].lng);
            map.setCenter(centerPos);
            console.log('🎯 지도 중심 이동 완료');
          }
          
          console.log('✅ 총 ' + overlays.length + '개 오버레이 생성 완료');
        } else {
          console.log('📍 표시할 데이터가 없음');
        }
      }
      
      // 카카오 맵 로드 후 초기화
      if (window.kakao && window.kakao.maps) {
        initMap();
      } else {
        // 스크립트 로드 대기
        const checkKakao = setInterval(() => {
          if (window.kakao && window.kakao.maps) {
            clearInterval(checkKakao);
            initMap();
          }
        }, 100);
        
        // 10초 후 타임아웃
        setTimeout(() => {
          clearInterval(checkKakao);
          if (!map) {
            console.error('❌ 카카오 맵 로드 타임아웃');
            document.getElementById('map').innerHTML = 
              '<div style="display:flex;justify-content:center;align-items:center;width:100%;height:100%;font-size:14px;color:#666;">🗺️ 지도 로드 타임아웃</div>';
          }
        }, 10000);
      }
      
      // 메시지 리스너
      window.addEventListener('message', function(e) {
        try {
          console.log('📨 메시지 수신:', e.data);
          const data = JSON.parse(e.data);
          updateMapData(data);
        } catch (error) {
          console.error('❌ 메시지 처리 오류:', error);
        }
      });
      
    </script>
  </body>
</html>`,
                }}
                javaScriptEnabled
                domStorageEnabled
                mixedContentMode="compatibility"
                allowsInlineMediaPlayback
                startInLoadingState
                onMessage={handleMessage}
              />
            </View>

            {/* 검색창 */}
            <View style={styles.searchContainer}>
              <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                placeholder="내 경험 검색..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                </TouchableOpacity>
              )}
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

      {/* 필터 모달 */}
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
                { label: "전체", value: "전체" },
                ...Object.values(emotionLabels).map(lbl => ({ label: lbl, value: lbl })),
              ]}
              style={styles.dropdown}
              zIndex={2000}
            />

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowFilterModal(false)}
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
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 12, color: "#6B7280", fontSize: 14 },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 16,
    backgroundColor: "#FFFFFF"
  },
  title: { fontSize: 22, fontWeight: "bold", color: "#1F2937" },
  subtitle: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  filterButton: { 
    borderWidth: 1, 
    borderColor: "#7C3AED", 
    padding: 8, 
    borderRadius: 8, 
    backgroundColor: "#F3F4F6" 
  },
  mapWrapper: {
    height: screenHeight * 0.25,
    borderRadius: 0,
    overflow: "hidden",
    marginBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 16,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    elevation: 1,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { 
    flex: 1, 
    paddingVertical: 14, 
    fontSize: 14, 
    color: "#374151" 
  },
  clearButton: { padding: 4 },
  
  // ✅ 컴팩트한 카드 스타일
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 8,  // 줄임
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardContent: {
    padding: 12,  // 줄임
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",  // 변경
    marginBottom: 6,  // 줄임
  },
  cardTitle: { 
    flex: 1,
    fontWeight: "600",  // 줄임
    fontSize: 16,  // 줄임
    color: "#1F2937",
    marginRight: 8,
    lineHeight: 20,  // 줄임
  },
  emotionBadge: {
    backgroundColor: "#F3F4F6",
    borderRadius: 12,  // 줄임
    paddingHorizontal: 6,  // 줄임
    paddingVertical: 2,  // 줄임
  },
  emotionIcon: { fontSize: 16 },  // 줄임
  cardDescription: { 
    color: "#4B5563", 
    lineHeight: 18,  // 줄임
    marginBottom: 8,  // 줄임
    fontSize: 13,  // 줄임
  },
  cardMeta: {
    marginBottom: 8,  // 줄임
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: { 
    fontSize: 11,  // 줄임
    color: "#6B7280", 
    marginLeft: 4,  // 줄임
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,  // 줄임
  },
  tag: {
    backgroundColor: "#EEF2FF",
    borderRadius: 8,  // 줄임
    paddingHorizontal: 6,  // 줄임
    paddingVertical: 2,  // 줄임
    marginRight: 4,  // 줄임
    marginBottom: 2,  // 줄임
  },
  tagText: {
    fontSize: 10,  // 줄임
    color: "#6366F1",
    fontWeight: "500",
  },
  moreTagsText: {
    fontSize: 10,  // 줄임
    color: "#9CA3AF",
    alignSelf: "center",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 6,  // 줄임
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  trendInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendText: { 
    fontWeight: "600",  // 줄임
    color: "#7C3AED", 
    marginLeft: 3,  // 줄임
    fontSize: 12,  // 줄임
  },
  actions: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  actionButton: {
    padding: 6,  // 줄임
    marginLeft: 2,  // 줄임
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
  
  // 모달 스타일
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