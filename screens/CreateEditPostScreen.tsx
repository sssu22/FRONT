import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
} from "react-native";
import { Button, Chip, Card, Provider } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// TrendDetail과 dummyTrendDetails을 import 하세요
import { dummyTrendDetails } from "../screens/data/dummyTrends"; // 경로는 실제 위치에 따라 조절

// UI에서 사용할 Trend 타입
interface Trend {
  id: string;
  name: string;
  description: string;
  category: string;
  popularity: number;
  createdAt: string;
}

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

export const emotionItems = [
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
];

const emotionIcons: Record<EmotionType, string> = {
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

interface ExperienceFormProps {
  onSubmit: (experience: {
    title: string;
    date: string;
    location: string;
    emotion: EmotionType;
    tags: string[];
    description: string;
    trend: Trend;
  }) => void;
  onClose: () => void;
  initialData?: {
    title: string;
    date: string;
    location: string;
    emotion: EmotionType;
    tags: string[];
    description: string;
    trend?: Trend | null;
  } | null;
}

// TrendDetail을 Trend 타입으로 변환
const mappedTrends: Trend[] = dummyTrendDetails.map((item) => ({
  id: item.trendId.toString(),
  name: item.title,
  description: item.description,
  category: item.category,
  popularity: item.score,
  createdAt: item.peakPeriod + "-01", // YYYY-MM → YYYY-MM-01
}));

// TrendSelector Modal 컴포넌트
function TrendSelectorModal({ visible, onSelect, onClose }: { visible: boolean, onSelect: (trend: Trend) => void, onClose: () => void }) {
  const [search, setSearch] = useState("");
  const filteredTrends = mappedTrends.filter(
    (trend) =>
      trend.name.includes(search) || trend.description.includes(search)
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.trendModalBackdrop}>
        <View style={styles.trendModalSheet}>
          <Text style={styles.sectionTitle}>트렌드 선택</Text>
          <TextInput
            placeholder="트렌드명/설명 검색"
            style={[styles.input, { marginBottom: 8, backgroundColor: "#fff" }]}
            value={search}
            onChangeText={setSearch}
            clearButtonMode="while-editing"
          />
          <ScrollView style={{ maxHeight: 340 }} showsVerticalScrollIndicator={false}>
            {filteredTrends.length === 0 && (
              <Text style={{ textAlign: "center", color: "#aaa", margin: 12 }}>검색 결과가 없습니다</Text>
            )}
            {filteredTrends.map(trend => (
              <TouchableOpacity
                key={trend.id}
                style={styles.trendOption}
                onPress={() => onSelect(trend)}
              >
                <Text style={styles.trendOptionTitle}>{trend.name}</Text>
                <Text style={styles.trendOptionSubtitle}>{trend.description}</Text>
                <Chip style={{ alignSelf: "flex-start", marginTop: 2 }}>{trend.category}</Chip>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Button onPress={onClose} style={{ marginTop: 10 }}>닫기</Button>
        </View>
      </View>
    </Modal>
  );
}

export default function ExperienceForm({ onSubmit, onClose, initialData }: ExperienceFormProps) {
  const [formData, setFormData] = useState({
    title: initialData?.title || "",
    date: initialData?.date || "",
    location: initialData?.location || "",
    emotion: (initialData?.emotion as EmotionType) || "joy",
    description: initialData?.description || "",
  });
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [currentTag, setCurrentTag] = useState("");
  const [selectedTrend, setSelectedTrend] = useState<Trend | null>(initialData?.trend || null);
  const [showTrendSelector, setShowTrendSelector] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 태그 추가/삭제
  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };
  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  // 제출 버튼
  const handleSubmit = () => {
    if (
      !formData.title.trim() ||
      !formData.date.trim() ||
      !formData.location.trim() ||
      !formData.emotion ||
      !selectedTrend
    ) {
      setError("필수 입력값을 모두 입력해주세요.");
      return;
    }
    setError(null);
    onSubmit({
      ...formData,
      tags,
      trend: selectedTrend,
    });
  };

  return (
    <Provider>
      <SafeAreaView style={styles.root}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Card style={styles.card}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>
                {initialData ? "경험 수정하기" : "새로운 첫 경험 추가"}
              </Text>
              <Button icon="close" onPress={onClose} compact style={{ marginLeft: 10 }}>닫기</Button>
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}

            {/* 트렌드 선택 */}
            <Text style={styles.label}>트렌드 *</Text>
            {selectedTrend ? (
              <View style={styles.selectedTrendBox}>
                <Text style={styles.selectedTrendTitle}>{selectedTrend.name}</Text>
                <Text style={styles.selectedTrendDesc}>{selectedTrend.description}</Text>
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
                icon="chevron-down"
                style={{ marginBottom: 12 }}
                onPress={() => setShowTrendSelector(true)}
              >
                트렌드를 선택하세요
              </Button>
            )}

            {/* 제목 */}
            <Text style={styles.label}>경험 제목 *</Text>
            <TextInput
              style={styles.input}
              placeholder="제목을 입력하세요"
              value={formData.title}
              onChangeText={v => setFormData({ ...formData, title: v })}
            />

            {/* 날짜 */}
            <Text style={styles.label}>날짜 *</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-MM-DD"
              value={formData.date}
              onChangeText={v => setFormData({ ...formData, date: v })}
            />

            {/* 장소 */}
            <Text style={styles.label}>장소 *</Text>
            <TextInput
              style={styles.input}
              placeholder="위치를 입력하세요"
              value={formData.location}
              onChangeText={v => setFormData({ ...formData, location: v })}
            />

            {/* 감정 */}
            <Text style={styles.label}>감정 *</Text>
            <ScrollView horizontal style={{ marginBottom: 10 }} showsHorizontalScrollIndicator={false}>
              {emotionItems.map((opt) => (
                <Chip
                  key={opt.value}
                  style={
                    formData.emotion === opt.value
                      ? [styles.chip, styles.chipSelected]
                      : styles.chip
                  }
                  selected={formData.emotion === opt.value}
                  onPress={() =>
                    setFormData({ ...formData, emotion: opt.value as EmotionType })
                  }
                >
                  {opt.label}
                </Chip>
              ))}
            </ScrollView>

            {/* 태그 입력 */}
            <Text style={styles.label}>추가 태그</Text>
            <View style={styles.tagRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="태그 입력 후 추가"
                value={currentTag}
                onChangeText={setCurrentTag}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <Button mode="contained" onPress={handleAddTag} compact style={{ marginLeft: 8, backgroundColor: "#ddd" }}>추가</Button>
            </View>
            <View style={styles.tagsList}>
              {tags.map((tag) => (
                <Chip
                  key={tag}
                  style={styles.tagChip}
                  onClose={() => handleRemoveTag(tag)}
                  closeIcon="close"
                >
                  #{tag}
                </Chip>
              ))}
            </View>

            {/* 상세설명 */}
            <Text style={styles.label}>상세 설명</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: "top" }]}
              multiline
              placeholder="상세 경험을 적어주세요"
              value={formData.description}
              onChangeText={(v) => setFormData({ ...formData, description: v })}
            />

            <Button mode="contained" onPress={handleSubmit} style={styles.saveBtn}>
              {initialData ? "경험 수정하기" : "경험 저장하기"}
            </Button>
          </Card>

          {/* 트렌드 선택 모달 (실제 데이터 기반) */}
          <TrendSelectorModal
            visible={showTrendSelector}
            onSelect={(trend: Trend) => {
              setSelectedTrend(trend);
              setShowTrendSelector(false);
            }}
            onClose={() => setShowTrendSelector(false)}
          />
        </ScrollView>
      </SafeAreaView>
    </Provider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#fafaff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContainer: {
    paddingBottom: 26,
  },
  card: {
    margin: 18,
    borderRadius: 14,
    padding: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  title: { fontSize: 18, fontWeight: "bold", flex: 1, color: "#8B5CF6" },
  label: { fontWeight: "bold", marginBottom: 2, color: "#333", fontSize: 13 },
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
  selectedTrendBox: {
    backgroundColor: "#f3f1ff",
    borderRadius: 7,
    padding: 12,
    marginBottom: 14,
  },
  selectedTrendTitle: { fontSize: 15, fontWeight: "bold", color: "#6b21a8" },
  selectedTrendDesc: { color: "#666", fontSize: 12, marginBottom: 3 },
  chip: { marginRight: 8, marginBottom: 3, backgroundColor: "#f5f3ff" },
  chipSelected: { backgroundColor: "#a78bfa" },
  tagRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  tagChip: {
    marginRight: 6,
    backgroundColor: "#fef3c7",
    borderRadius: 5,
    marginBottom: 5,
  },
  tagsList: { flexDirection: "row", flexWrap: "wrap", marginBottom: 4 },
  saveBtn: {
    marginTop: 12,
    borderRadius: 7,
    backgroundColor: "#8B5CF6",
    shadowOpacity: 0,
  },
  errorText: { color: "#D946EF", marginBottom: 8, fontSize: 13, textAlign: "center" },
  sectionTitle: { fontWeight: "bold", fontSize: 17, color: "#8B5CF6", marginBottom: 10 },
  trendModalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.37)", justifyContent: "flex-end" },
  trendModalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 18,
    paddingBottom: 20,
    minHeight: 300,
    maxHeight: '80%',
  },
  trendOption: {
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 0.6,
    borderColor: "#eee",
    marginBottom: 3,
  },
  trendOptionTitle: { fontWeight: "bold", fontSize: 15, color: "#7c3aed" },
  trendOptionSubtitle: { fontSize: 12, color: "#555", marginBottom: 3 },
});
