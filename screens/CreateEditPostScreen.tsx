// sssu22/front/FRONT-feature-UI-API2-/screens/CreateEditPostScreen.tsx

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Button, Chip, Card, Provider, IconButton } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import TrendSelector from "./TrendSelector";
import { Trend } from "../types";
import { trendsApi } from "../utils/apiUtils";
import { EmotionType, emotionLabels } from "../types";

const KAKAO_API_KEY = "809ec7d50c5d6ec2cae5c56a851e111c";

export interface SubmitPayload {
  title: string;
  experienceDate: string;
  location: string;
  locationDetail: string;
  emotion: string;
  tags: string[];
  description: string;
  trendId: number;
  latitude: number;
  longitude: number;
}

export interface InitialData {
  id: number;
  title: string;
  date: string;
  location: string;
  locationDetail?: string;
  emotion: EmotionType;
  tags: string[];
  description: string;
  trendId: number;
  latitude: number;
  longitude: number;
}

interface LocationData {
  latitude: number;
  longitude: number;
  district: string;
}

const emotionItems = Object.entries(emotionLabels).map(([key, label]) => ({
  label: `${label}`,
  value: key as EmotionType,
  serverValue: key.toUpperCase(),
}));

interface Props {
  onSubmit: (payload: SubmitPayload) => void | Promise<void>;
  onClose: () => void;
  initialData?: InitialData | null;
}

const getGuFromAddress = (address: string): string | null => {
  if (!address) return null;
  const match = address.match(/([가-힣]+구)/);
  return match ? match[1] : null;
};

export default function CreateEditPostScreen({
                                               onSubmit,
                                               onClose,
                                               initialData = null,
                                             }: Props) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    date: initialData?.date || new Date().toISOString().split("T")[0],
    location: initialData?.location || "",
    emotion: initialData?.emotion || ("joy" as EmotionType),
    description: initialData?.description || "",
  });
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [currentTag, setCurrentTag] = useState("");
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(null);
  const [showTrendSelector, setShowTrendSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(true);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  const fetchTrends = useCallback(
      async (selectLatest = false) => {
        setLoadingTrends(true);
        setTrendsError(null);
        try {
          const list = await trendsApi.getAll();
          setTrends(list);
          let trendToSelect: Trend | null = null;
          if (selectLatest && list.length > 0) {
            trendToSelect = list.reduce((a, b) => (a.id > b.id ? a : b));
          } else if (initialData) {
            trendToSelect = list.find((t) => t.id === initialData.trendId) || null;
          }
          if (trendToSelect) setSelectedTrend(trendToSelect);
          if (list.length === 0) {
            setTrendsError("사용 가능한 트렌드가 없습니다. 먼저 트렌드를 생성해주세요.");
          }
        } catch {
          setTrendsError("트렌드를 불러올 수 없습니다.");
        } finally {
          setLoadingTrends(false);
        }
      },
      [initialData]
  );

  useEffect(() => {
    fetchTrends();
  }, [fetchTrends]);

  const handleAddTag = () => {
    const t = currentTag.trim();
    if (t && !tags.includes(t) && tags.length < 5) {
      setTags((prev) => [...prev, t]);
      setCurrentTag("");
    }
  };
  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleConfirmDate = (date: Date) => {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2);
    const day = ('0' + date.getDate()).slice(-2);
    const d = `${year}-${month}-${day}`;

    setFormData((prev) => ({ ...prev, date: d }));
    setShowDatePicker(false);
  };

  const resolveLocationData = async (query: string): Promise<LocationData | null> => {
    if (!query.trim()) {
      Alert.alert("장소 오류", "장소 이름을 입력해주세요.");
      return null;
    }
    const url = `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}`;
    try {
      const response = await fetch(url, { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } });
      const data = await response.json();

      if (data.documents && data.documents.length > 0) {
        for (const doc of data.documents) {
          const district = doc.address?.region_2depth_name || getGuFromAddress(doc.address_name) || getGuFromAddress(doc.road_address_name);
          if (district && district.endsWith('구')) {
            return {
              latitude: parseFloat(doc.y),
              longitude: parseFloat(doc.x),
              district: district,
            };
          }
        }
      }

      Alert.alert("검색 실패", `"${query}"에 대한 서울시 내의 '구' 정보를 찾을 수 없습니다.\n더 구체적인 장소 이름으로 시도해보세요.`);
      return null;
    } catch (error) {
      console.error("Kakao API 호출 중 오류 발생:", error);
      Alert.alert("네트워크 오류", "위치 정보를 가져오는 데 실패했습니다. 인터넷 연결을 확인해주세요.");
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.date.trim() || !formData.location.trim() || !selectedTrend) {
      setError("필수 입력값(*)을 모두 입력해주세요.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const locationData = await resolveLocationData(formData.location);
      if (!locationData) {
        setIsSubmitting(false);
        return;
      }

      const emotionItem = emotionItems.find((item) => item.value === formData.emotion);
      const serverEmotion = emotionItem?.serverValue || "JOY";

      const payload: SubmitPayload = {
        title: formData.title.trim(),
        experienceDate: formData.date,
        location: formData.location.trim(),
        locationDetail: locationData.district,
        emotion: serverEmotion,
        tags: tags.filter((tag) => tag.trim() !== ""),
        description: formData.description.trim(),
        trendId: selectedTrend.id,
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      };

      await onSubmit(payload);
    } catch (error) {
      setError("게시글 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // DatePicker에 전달할 Date 객체를 생성하는 로직
  const getPickerDate = () => {
    try {
      const parts = formData.date.split('-').map(Number);
      // month는 0부터 시작하므로 1을 빼줍니다.
      return new Date(parts[0], parts[1] - 1, parts[2]);
    } catch (e) {
      // 파싱 실패 시 현재 날짜로 대체
      return new Date();
    }
  };

  return (
      <Provider>
        <SafeAreaView style={styles.root}>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
              <Card style={styles.card}>
                <View style={styles.headerRow}>
                  <Text style={styles.title}>{initialData ? "게시글 수정하기" : "새 게시글 작성"}</Text>
                  <IconButton icon="close" onPress={onClose} />
                </View>
                {error && <Text style={styles.errorText}>{error}</Text>}

                <Text style={styles.label}>트렌드 *</Text>
                {loadingTrends ? (
                    <View style={styles.loadingContainer}><ActivityIndicator /><Text style={styles.loadingText}>트렌드 로딩 중...</Text></View>
                ) : trendsError ? (
                    <View style={styles.errorContainer}><Text style={styles.errorText}>{trendsError}</Text><Button mode="text" compact onPress={() => fetchTrends()}>다시 시도</Button></View>

                ) : selectedTrend ? (
                    <View style={styles.selectedTrendContainer}>
                      <View style={styles.selectedTrendLeft}>
                        <Text style={styles.hash}>#</Text>
                        <View style={styles.infoContainer}>
                          <Text style={styles.selectedTrendTitle} numberOfLines={1}>{selectedTrend.title}</Text>
                          <Text style={styles.selectedTrendDesc} numberOfLines={1}>{selectedTrend.description}</Text>
                        </View>
                      </View>
                      <View style={styles.selectedTrendRight}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryText}>{selectedTrend.category}</Text>
                        </View>
                        <TouchableOpacity style={styles.changeButton} onPress={() => setShowTrendSelector(true)}>
                          <Text style={styles.changeButtonText}>변경</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                ) : (
                    <Button mode="outlined" onPress={() => setShowTrendSelector(true)} style={{paddingVertical: 8}}>트렌드를 선택하세요</Button>
                )}

                <Text style={styles.label}>제목 *</Text>
                <TextInput style={styles.input} placeholder="제목을 입력하세요" value={formData.title} onChangeText={(v) => setFormData((f) => ({ ...f, title: v }))} editable={!isSubmitting} />

                <Text style={styles.label}>날짜 *</Text>
                <TouchableOpacity onPress={() => !isSubmitting && setShowDatePicker(true)}>
                  <Text style={[styles.input, { paddingVertical: 12, color: "#191939" }]}>{formData.date}</Text>
                </TouchableOpacity>
                <DateTimePickerModal
                    isVisible={showDatePicker}
                    mode="date"
                    date={getPickerDate()} // 수정된 부분
                    onConfirm={handleConfirmDate}
                    onCancel={() => setShowDatePicker(false)}
                    display="spinner"
                    maximumDate={new Date()}
                />

                <Text style={styles.label}>장소 *</Text>
                <TextInput style={styles.input} placeholder="장소 입력 (예: 잠실, 숭실대)" value={formData.location} onChangeText={(v) => setFormData((f) => ({ ...f, location: v }))} editable={!isSubmitting} />

                <Text style={styles.label}>감정 *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  {emotionItems.map((opt) => (
                      <Chip key={opt.value} style={[styles.emotionChip, formData.emotion === opt.value && styles.emotionChipSelected,]} textStyle={[styles.emotionChipText, formData.emotion === opt.value && styles.emotionChipTextSelected,]} onPress={() => !isSubmitting && setFormData((f) => ({ ...f, emotion: opt.value as EmotionType, }))} disabled={isSubmitting}>
                        {opt.label}
                      </Chip>
                  ))}
                </ScrollView>

                <Text style={styles.label}>추가 태그 (최대 5개)</Text>
                <View style={styles.tagRow}>
                  <TextInput style={[styles.input, { flex: 1, marginRight: 8 }]} placeholder="태그 입력 후 추가" value={currentTag} onChangeText={setCurrentTag} onSubmitEditing={handleAddTag} returnKeyType="done" editable={!isSubmitting} />
                  <Button mode="contained" compact onPress={handleAddTag} disabled={isSubmitting || tags.length >= 5}>추가</Button>
                </View>
                <View style={styles.tagsList}>
                  {tags.map((tag) => (<Chip key={tag} style={styles.tagChip} onClose={() => !isSubmitting && handleRemoveTag(tag)}>#{tag}</Chip>))}
                </View>

                <Text style={styles.label}>상세 설명</Text>
                <TextInput style={[styles.input, { height: 120, textAlignVertical: "top" }]} multiline placeholder="상세 경험을 적어주세요" value={formData.description} onChangeText={(v) => setFormData((f) => ({ ...f, description: v }))} editable={!isSubmitting} />

                <Button mode="contained" onPress={handleSubmit} style={styles.saveBtn} disabled={isSubmitting} loading={isSubmitting}>
                  {isSubmitting ? "저장 중..." : initialData ? "게시글 수정하기" : "게시글 저장하기"}
                </Button>
              </Card>
            </ScrollView>
          </KeyboardAvoidingView>

          {showTrendSelector && (
              <TrendSelector
                  selectedTrend={selectedTrend}
                  onTrendSelect={(t) => { setSelectedTrend(t); setShowTrendSelector(false); }}
                  onClose={() => setShowTrendSelector(false)}
                  onTrendCreated={() => fetchTrends(true)}
                  onClear={() => setSelectedTrend(null)}
              />
          )}
        </SafeAreaView>
      </Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f8f9fa" },
  scrollView: { flex: 1 },
  scrollContainer: { padding: 16 },
  card: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: { flex: 1, fontSize: 20, fontWeight: "bold", color: "#343a40" },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    color: "#495057",
    marginTop: 8,
  },
  input: {
    backgroundColor: "#f1f3f5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#dee2e6",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
    color: "#212529",
  },
  emotionChip: {
    marginRight: 8,
    backgroundColor: "#f8f9fa",
    borderColor: "#dee2e6",
    borderWidth: 1,
  },
  emotionChipSelected: { backgroundColor: "#8B5CF6", borderColor: "#8B5CF6" },
  emotionChipText: { color: "#495057" },
  emotionChipTextSelected: { color: "#FFFFFF", fontWeight: "bold" },
  tagRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  tagsList: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  tagChip: { backgroundColor: "#e9ecef", marginRight: 6, marginBottom: 6 },
  saveBtn: {
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
    paddingVertical: 6,
  },
  errorText: { color: "#e03131", marginBottom: 12, fontSize: 13, textAlign: "center" },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    marginBottom: 12,
  },
  loadingText: { marginLeft: 8, color: "#495057", fontSize: 14 },
  errorContainer: {
    backgroundColor: "#fff5f5",
    borderColor: "#ffc9c9",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  selectedTrendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  selectedTrendLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  hash: {
    color: '#7C3AED',
    fontSize: 24,
    fontWeight: 'bold',
    marginRight: 10,
  },
  infoContainer: {
    flex: 1,
  },
  selectedTrendTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  selectedTrendDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  selectedTrendRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  categoryText: {
    fontSize: 12,
    color: '#4B5563',
    fontWeight: '500',
  },
  changeButton: {
    borderWidth: 1,
    borderColor: '#C4B5FD',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginLeft: 12,
    backgroundColor: '#FFFFFF',
  },
  changeButtonText: {
    color: '#7C3AED',
    fontWeight: 'bold',
    fontSize: 14,
  },
});