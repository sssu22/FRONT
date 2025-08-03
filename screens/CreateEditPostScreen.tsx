import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Button, Chip, Card, Provider, IconButton } from "react-native-paper";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import TrendSelector, { Trend } from "./TrendSelector";
import districtCoordinates from "../constants/districtCoordinates";
import { trendsApi } from "../utils/apiUtils";

export type EmotionType =
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

export interface SubmitPayload {
  title: string;
  experienceDate: string;  // ✅ 서버 스펙에 맞게 수정
  location: string;
  emotion: string;         // ✅ 대문자로 변환될 예정
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

// ✅ 서버가 요구하는 감정 값으로 매핑
const emotionItems = [
  { label: "😊 기쁨", value: "joy", serverValue: "JOY" },
  { label: "🔥 흥분", value: "excitement", serverValue: "EXCITEMENT" },
  { label: "💭 향수", value: "nostalgia", serverValue: "NOSTALGIA" },
  { label: "😲 놀라움", value: "surprise", serverValue: "SURPRISE" },
  { label: "💖 사랑", value: "love", serverValue: "LOVE" },
  { label: "😞 아쉬움", value: "regret", serverValue: "REGRET" },
  { label: "😢 슬픔", value: "sadness", serverValue: "SADNESS" },
  { label: "😒 짜증", value: "irritation", serverValue: "IRRITATION" },
  { label: "😡 화남", value: "anger", serverValue: "ANGER" },
  { label: "😳 당황", value: "embarrassment", serverValue: "EMBARRASSMENT" },
];

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
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(
    initialData
      ? {
          id: initialData.trendId,
          name: "",
          description: "",
          category: "",
          popularity: 0,
          createdAt: "",
        }
      : null
  );
  const [showTrendSelector, setShowTrendSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [trends, setTrends] = useState<Trend[]>([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [trendsError, setTrendsError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrends = async () => {
      setLoadingTrends(true);
      setTrendsError(null);
      try {
        const list = await trendsApi.getAll();
        setTrends(list);

        if (initialData) {
          const found = list.find((t) => t.id === initialData.trendId);
          if (found) setSelectedTrend(found);
          else
            setSelectedTrend({
              id: initialData.trendId,
              name: `트렌드 #${initialData.trendId}`,
              description: "",
              category: "",
              popularity: 0,
              createdAt: "",
            });
        }

        if (list.length === 0) {
          setTrendsError("사용 가능한 트렌드가 없습니다. Swagger에서 생성해주세요.");
        }
      } catch {
        setTrendsError("트렌드를 불러올 수 없습니다.");
      } finally {
        setLoadingTrends(false);
      }
    };
    fetchTrends();
  }, [initialData]);

  const handleAddTag = () => {
    const t = currentTag.trim();
    if (t && !tags.includes(t)) {
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
      const coords = districtCoordinates[formData.location] || { lat: 0, lng: 0 };
      
      // ✅ 서버 감정 값 찾기
      const emotionItem = emotionItems.find(item => item.value === formData.emotion);
      const serverEmotion = emotionItem?.serverValue || "JOY"; // 기본값 설정
      
      // ✅ 서버 스펙에 맞는 페이로드 구성
      const payload: SubmitPayload = {
        title: formData.title.trim(),
        experienceDate: formData.date, // ✅ experienceDate로 변경
        location: formData.location.trim(),
        emotion: serverEmotion, // ✅ 대문자 감정값 사용
        tags: tags.filter(tag => tag.trim() !== ""), // ✅ 빈 태그 제거
        description: formData.description.trim(),
        trendId: selectedTrend.id,
        latitude: coords.lat,
        longitude: coords.lng,
      };
      
      // ✅ 전송 전 데이터 검증 로그
      console.log("📤 전송할 페이로드:", JSON.stringify(payload, null, 2));
      console.log("✅ 필수 필드 체크:");
      console.log("  - title:", payload.title ? "✓" : "✗");
      console.log("  - experienceDate:", payload.experienceDate ? "✓" : "✗");
      console.log("  - location:", payload.location ? "✓" : "✗");
      console.log("  - emotion:", payload.emotion ? "✓" : "✗");
      console.log("  - trendId:", payload.trendId ? "✓" : "✗");
      console.log("  - description:", payload.description ? "✓" : "✗");
      
      await onSubmit(payload);
    } catch (error) {
      console.error("❌ 폼 제출 오류:", error);
      setError("게시글 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const retryLoadTrends = async () => {
    setTrendsError(null);
    setLoadingTrends(true);
    try {
      const list = await trendsApi.getAll();
      setTrends(list);
      if (list.length === 0) setTrendsError("사용 가능한 트렌드가 없습니다.");
    } catch {
      setTrendsError("트렌드를 불러올 수 없습니다.");
    } finally {
      setLoadingTrends(false);
    }
  };

  return (
    <Provider>
      <SafeAreaView style={styles.root}>
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
                <Text style={styles.loadingText}>로딩 중...</Text>
              </View>
            ) : trendsError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{trendsError}</Text>
                <Button mode="text" compact onPress={retryLoadTrends}>
                  다시 시도
                </Button>
              </View>
            ) : selectedTrend ? (
              <View style={styles.selectedTrendBox}>
                <Text style={styles.selectedTrendTitle}>{selectedTrend.name}</Text>
                <Chip style={styles.chip}>{selectedTrend.category}</Chip>
                <Button
                  mode="text"
                  compact
                  onPress={() => setShowTrendSelector(true)}
                >
                  변경
                </Button>
              </View>
            ) : (
              <Button
                mode="outlined"
                compact
                onPress={() => setShowTrendSelector(true)}
              >
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
            <TouchableOpacity onPress={() => setShowDatePicker(true)}>
              <Text style={[styles.input, { paddingVertical: 12 }]}>
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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {emotionItems.map((opt) => (
                <Chip
                  key={opt.value}
                  style={formData.emotion === opt.value ? [styles.chip, styles.chipSelected] : styles.chip}
                  selected={formData.emotion === opt.value}
                  onPress={() => !isSubmitting && setFormData((f) => ({ ...f, emotion: opt.value as EmotionType }))}
                  disabled={isSubmitting}
                >
                  {opt.label}
                </Chip>
              ))}
            </ScrollView>

            <Text style={styles.label}>추가 태그</Text>
            <View style={styles.tagRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="태그 입력 후 추가"
                value={currentTag}
                onChangeText={setCurrentTag}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
                editable={!isSubmitting}
              />
              <Button mode="contained" compact onPress={handleAddTag} disabled={isSubmitting}>
                추가
              </Button>
            </View>
            <View style={styles.tagsList}>
              {tags.map((tag) => (
                <Chip key={tag} style={styles.tagChip} onClose={() => handleRemoveTag(tag)}>
                  #{tag}
                </Chip>
              ))}
            </View>

            <Text style={styles.label}>상세 설명 *</Text>
            <TextInput
              style={[styles.input, { height: 90 }]}
              multiline
              placeholder="상세 경험을 적어주세요"
              value={formData.description}
              onChangeText={(v) => setFormData((f) => ({ ...f, description: v }))}
              editable={!isSubmitting}
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
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

          {showTrendSelector && (
            <TrendSelector
              trends={trends}
              selectedTrend={selectedTrend}
              onTrendSelect={(t) => {
                setSelectedTrend(t);
                setShowTrendSelector(false);
              }}
              onClose={() => setShowTrendSelector(false)}
            />
          )}
        </ScrollView>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fafaff" },
  scrollView: { flex: 1 },
  scrollContainer: { padding: 16, paddingBottom: 32 },
  card: { borderRadius: 12, padding: 16, backgroundColor: "#fff", elevation: 3 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  title: { flex: 1, fontSize: 18, fontWeight: "bold", color: "#8B5CF6" },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 4, color: "#333" },
  input: {
    backgroundColor: "#f2f2fb",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#ece5fc",
    padding: 9,
    fontSize: 15,
    marginBottom: 9,
    color: "#191939",
  },
  chip: { marginRight: 8, marginBottom: 6, backgroundColor: "#f5f3ff" },
  chipSelected: { backgroundColor: "#a78bfa" },
  tagRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  tagsList: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  tagChip: { backgroundColor: "#fef3c7", marginRight: 6, marginBottom: 6 },
  saveBtn: { marginTop: 16, borderRadius: 7, backgroundColor: "#8B5CF6" },
  saveBtnDisabled: { backgroundColor: "#D1D5DB" },
  errorText: { color: "#D946EF", marginBottom: 8, fontSize: 13, textAlign: "center" },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f3f1ff",
    borderRadius: 7,
    marginBottom: 14,
  },
  loadingText: { marginLeft: 8, color: "#6b21a8", fontSize: 13 },
  errorContainer: {
    backgroundColor: "#fee2e2",
    borderRadius: 7,
    padding: 12,
    marginBottom: 14,
    alignItems: "center",
  },
  selectedTrendBox: {
    backgroundColor: "#f3f1ff",
    borderRadius: 7,
    padding: 12,
    marginBottom: 14,
  },
  selectedTrendTitle: { fontSize: 15, fontWeight: "bold", color: "#6b21a8" },
});