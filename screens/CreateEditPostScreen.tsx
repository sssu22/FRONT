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
  // KeyboardAvoidingView와 Platform을 추가합니다.
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Button, Chip, Card, Provider, IconButton } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import TrendSelector, { Trend } from "./TrendSelector";
import districtCoordinates from "../constants/districtCoordinates";
import { trendsApi } from "../utils/apiUtils";

// ★ 추가: 기기 위치 얻기용
import * as Location from "expo-location";

// ▼ 타입 정의
import { EmotionType, emotionLabels } from "../types";

export interface SubmitPayload {
  title: string;
  experienceDate: string;
  location: string;
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
  emotion: EmotionType;
  tags: string[];
  description: string;
  trendId: number;
  latitude: number;
  longitude: number;
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
    const d = date.toISOString().split("T")[0];
    setFormData((prev) => ({ ...prev, date: d }));
    setShowDatePicker(false);
  };

  const resolveCoordinates = async (districtName: string) => {
    const dc = (districtCoordinates as any)[districtName];
    if (dc?.lat && dc?.lng) {
      return { lat: dc.lat, lng: dc.lng };
    }
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return { lat: 0, lng: 0 };
      }
      const pos = await Location.getCurrentPositionAsync({});
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return { lat: 0, lng: 0 };
    }
  };

  const handleSubmit = async () => {
    if (
      !formData.title.trim() ||
      !formData.date.trim() ||
      !formData.location.trim() ||
      !selectedTrend
    ) {
      setError("필수 입력값(*)을 모두 입력해주세요.");
      return;
    }
    setError(null);
    setIsSubmitting(true);

    try {
      const coords = await resolveCoordinates(formData.location);
      const emotionItem = emotionItems.find(
        (item) => item.value === formData.emotion
      );
      const serverEmotion = emotionItem?.serverValue || "JOY";

      const payload: SubmitPayload = {
        title: formData.title.trim(),
        experienceDate: formData.date,
        location: formData.location.trim(),
        emotion: serverEmotion,
        tags: tags.filter((tag) => tag.trim() !== ""),
        description: formData.description.trim(),
        trendId: selectedTrend.id,
        latitude: coords.lat,
        longitude: coords.lng,
      };

      await onSubmit(payload);
    } catch (error) {
      setError("게시글 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Provider>
      <SafeAreaView style={styles.root}>
        {/* KeyboardAvoidingView로 ScrollView를 감쌉니다. */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Card style={styles.card}>
              <View style={styles.headerRow}>
                <Text style={styles.title}>
                  {initialData ? "게시글 수정하기" : "새 게시글 작성"}
                </Text>
                <IconButton icon="close" onPress={onClose} />
              </View>
              {error && <Text style={styles.errorText}>{error}</Text>}

              <Text style={styles.label}>트렌드 *</Text>
              {loadingTrends ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#8B5CF6" />
                  <Text style={styles.loadingText}>트렌드 로딩 중...</Text>
                </View>
              ) : trendsError ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{trendsError}</Text>
                  <Button mode="text" compact onPress={() => fetchTrends()}>
                    다시 시도
                  </Button>
                </View>
              ) : selectedTrend ? (
                <TouchableOpacity
                  style={styles.selectedTrendBox}
                  onPress={() => setShowTrendSelector(true)}
                >
                  <View>
                    <Text style={styles.selectedTrendTitle}>
                      {selectedTrend.name || selectedTrend.title}
                    </Text>
                    <Text style={styles.selectedTrendDesc} numberOfLines={1}>
                      {selectedTrend.description}
                    </Text>
                  </View>
                  <Chip style={styles.chip}>{selectedTrend.category}</Chip>
                </TouchableOpacity>
              ) : (
                <Button mode="outlined" onPress={() => setShowTrendSelector(true)}>
                  트렌드를 선택하세요
                </Button>
              )}

              <Text style={styles.label}>제목 *</Text>
              <TextInput
                style={styles.input}
                placeholder="제목을 입력하세요"
                value={formData.title}
                onChangeText={(v) => setFormData((f) => ({ ...f, title: v }))}
                editable={!isSubmitting}
              />

              <Text style={styles.label}>날짜 *</Text>
              <TouchableOpacity
                onPress={() => !isSubmitting && setShowDatePicker(true)}
              >
                <Text
                  style={[styles.input, { paddingVertical: 12, color: "#191939" }]}
                >
                  {formData.date}
                </Text>
              </TouchableOpacity>
              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                date={new Date(formData.date + "T00:00:00")}
                onConfirm={handleConfirmDate}
                onCancel={() => setShowDatePicker(false)}
              />

              <Text style={styles.label}>장소 *</Text>
              <TextInput
                style={styles.input}
                placeholder="장소 입력 (예: 강남구)"
                value={formData.location}
                onChangeText={(v) => setFormData((f) => ({ ...f, location: v }))}
                editable={!isSubmitting}
              />

              <Text style={styles.label}>감정 *</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginBottom: 10 }}
              >
                {emotionItems.map((opt) => (
                  <Chip
                    key={opt.value}
                    style={[
                      styles.emotionChip,
                      formData.emotion === opt.value && styles.emotionChipSelected,
                    ]}
                    textStyle={[
                      styles.emotionChipText,
                      formData.emotion === opt.value &&
                        styles.emotionChipTextSelected,
                    ]}
                    onPress={() =>
                      !isSubmitting &&
                      setFormData((f) => ({
                        ...f,
                        emotion: opt.value as EmotionType,
                      }))
                    }
                    disabled={isSubmitting}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </ScrollView>

              <Text style={styles.label}>추가 태그 (최대 5개)</Text>
              <View style={styles.tagRow}>
                <TextInput
                  style={[styles.input, { flex: 1, marginRight: 8 }]}
                  placeholder="태그 입력 후 추가"
                  value={currentTag}
                  onChangeText={setCurrentTag}
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                  editable={!isSubmitting}
                />
                <Button
                  mode="contained"
                  compact
                  onPress={handleAddTag}
                  disabled={isSubmitting || tags.length >= 5}
                >
                  추가
                </Button>
              </View>
              <View style={styles.tagsList}>
                {tags.map((tag) => (
                  <Chip
                    key={tag}
                    style={styles.tagChip}
                    onClose={() => !isSubmitting && handleRemoveTag(tag)}
                  >
                    #{tag}
                  </Chip>
                ))}
              </View>

              <Text style={styles.label}>상세 설명</Text>
              <TextInput
                style={[styles.input, { height: 120, textAlignVertical: "top" }]}
                multiline
                placeholder="상세 경험을 적어주세요"
                value={formData.description}
                onChangeText={(v) =>
                  setFormData((f) => ({ ...f, description: v }))
                }
                editable={!isSubmitting}
              />

              <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.saveBtn}
                disabled={isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting
                  ? "저장 중..."
                  : initialData
                  ? "게시글 수정하기"
                  : "게시글 저장하기"}
              </Button>
            </Card>
          </ScrollView>
        </KeyboardAvoidingView>

        {showTrendSelector && (
          <TrendSelector
            trends={trends}
            selectedTrend={selectedTrend}
            onTrendSelect={(t) => {
              setSelectedTrend(t);
              setShowTrendSelector(false);
            }}
            onClose={() => setShowTrendSelector(false)}
            onTrendCreated={() => fetchTrends(true)}
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
  selectedTrendBox: {
    backgroundColor: "#f3f0ff",
    borderColor: "#d8cfff",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectedTrendTitle: { fontSize: 16, fontWeight: "bold", color: "#5f3dc4" },
  selectedTrendDesc: { fontSize: 13, color: "#7950f2", marginTop: 2 },
  chip: {
    backgroundColor: "#FFFFFF",
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
});