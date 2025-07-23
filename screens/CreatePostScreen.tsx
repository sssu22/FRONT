// screens/CreatePostScreen.tsx
import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { LinearGradient } from "expo-linear-gradient"
import TrendSelector, { Trend } from "./TrendSelector"

export default function CreatePostScreen({ navigation }: any) {
  // ─── State ─────────────────────────────────
  const [trend, setTrend] = useState<Trend | null>(null)
  const [showTrendModal, setShowTrendModal] = useState(false)

  const [title, setTitle] = useState("")
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [location, setLocation] = useState("")

  const emotionOptions = [
    { label: "기쁨", value: "joy" },
    { label: "향수", value: "nostalgia" },
    { label: "흥분", value: "excitement" },
    { label: "놀라움", value: "surprise" },
    { label: "사랑", value: "love" },
    { label: "아쉬움", value: "regret" },
    { label: "슬픔", value: "sadness" },
    { label: "짜증", value: "irritation" },
    { label: "화남", value: "anger" },
    { label: "당황", value: "embarrassment" },
  ]
  const [emotion, setEmotion] = useState<string>("")
  const [showEmotionModal, setShowEmotionModal] = useState(false)

  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")

  const [description, setDescription] = useState("")

  // ─── 더미 트렌드 (TrendSelector에 넘겨줄 데이터) ────────────────────
  const dummyTrends: Trend[] = [
    { id: "1", name: "도넛 플렉스", description: "SNS에서 도넛을 자랑하는 트렌드", category: "음식", popularity: 95 },
    { id: "2", name: "혼밥", description: "혼자 식사하는 문화", category: "라이프스타일", popularity: 88 },
    { id: "3", name: "K-POP 콘서트", description: "한국 아이돌 공연 관람", category: "문화", popularity: 92 },
    { id: "4", name: "비건 라이프", description: "식물성 식단과 친환경 생활", category: "건강", popularity: 76 },
    { id: "5", name: "NFT 투자", description: "디지털 자산 투자 트렌드", category: "투자", popularity: 82 },
  ]

  // ─── 핸들러 ─────────────────────────────────
  const handleAddTag = () => {
    if (!tagInput.trim()) return
    setTags((prev) => [...prev, tagInput.trim()])
    setTagInput("")
  }

  const handleSave = () => {
    if (!trend || !title || !location || !emotion) {
      alert("필수 항목을 모두 입력해주세요.")
      return
    }
    const newPost = {
      trend,
      title,
      date: date.toISOString().split("T")[0],
      location,
      emotion,
      tags,
      description,
    }
    console.log("작성된 경험:", newPost)
    navigation.goBack()
  }

  // ─── UI ─────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>새로운 첫 경험 추가</Text>

        {/* 1) 트렌드 선택 */}
        <Text style={styles.label}>↗ 트렌드 선택 *</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowTrendModal(true)}
        >
          {trend ? (
            <View style={styles.selectedRow}>
              <Text style={styles.selectedText}># {trend.name}</Text>
              <Text style={styles.changeText}>변경</Text>
            </View>
          ) : (
            <Text style={styles.placeholder}>트렌드를 선택하세요</Text>
          )}
        </TouchableOpacity>
        {!trend && <Text style={styles.error}>* 트렌드 선택은 필수입니다</Text>}

        {/* 2) 경험 제목 */}
        <Text style={styles.label}>경험 제목 *</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 첫 도넛 플렉스, 첫 혼밥 도전"
          value={title}
          onChangeText={setTitle}
        />

        {/* 3) 날짜 & 장소 */}
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>날짜 *</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text>{date.toISOString().split("T")[0]}</Text>
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#6B7280"
                style={styles.calendarIcon}
              />
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={(_, d) => {
                  if (d) setDate(d)
                  setShowDatePicker(false)
                }}
              />
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.label}>장소 *</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 강남구 신사동"
              value={location}
              onChangeText={setLocation}
            />
          </View>
        </View>

        {/* 4) 감정 선택 */}
        <Text style={styles.label}>감정 *</Text>
        <TouchableOpacity
          style={styles.selector}
          onPress={() => setShowEmotionModal(true)}
        >
          {emotion ? (
            <Text style={styles.selectedText}>
              {emotionOptions.find((e) => e.value === emotion)?.label}
            </Text>
          ) : (
            <Text style={styles.placeholder}>
              경험했던 주요 감정을 선택하세요
            </Text>
          )}
        </TouchableOpacity>

        {/* 감정 모달 */}
        {showEmotionModal && (
          <View style={styles.emotionModal}>
            {emotionOptions.map((e) => (
              <TouchableOpacity
                key={e.value}
                style={styles.emotionItem}
                onPress={() => {
                  setEmotion(e.value)
                  setShowEmotionModal(false)
                }}
              >
                <Text>{e.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* 5) 추가 태그 */}
        <Text style={styles.label}>추가 태그</Text>
        <View style={styles.row}>
          <TextInput
            style={[styles.input, { flex: 1, marginRight: 8 }]}
            placeholder="태그를 입력하고 Enter를 누르세요"
            value={tagInput}
            onChangeText={setTagInput}
            onSubmitEditing={handleAddTag}
          />
          <TouchableOpacity style={styles.tagBtn} onPress={handleAddTag}>
            <Text style={styles.tagBtnText}>추가</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={tags}
          horizontal
          keyExtractor={(item, i) => `${item}-${i}`}
          renderItem={({ item }) => (
            <View style={styles.tag}>
              <Text style={styles.tagText}>#{item}</Text>
            </View>
          )}
          style={{ marginTop: 8 }}
        />

        {/* 6) 상세 설명 */}
        <Text style={styles.label}>상세 설명</Text>
        <TextInput
          style={[styles.input, { height: 100, textAlignVertical: "top" }]}
          multiline
          placeholder="그때의 경험을 자세히 설명해주세요…"
          value={description}
          onChangeText={setDescription}
        />

        {/* 7) 저장 / 취소 버튼 */}
        <View style={[styles.row, { marginTop: 24 }]}>
          <TouchableOpacity
            style={{ flex: 1, marginRight: 8 }}
            onPress={handleSave}
          >
            <LinearGradient
              colors={["#8B5CF6", "#EC4899"]}
              style={styles.saveBtn}
            >
              <Text style={styles.saveText}>경험 저장하기</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { flex: 1, backgroundColor: "#fff", borderWidth: 1, borderColor: "#8B5CF6" },
            ]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.saveText, { color: "#8B5CF6" }]}>취소</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 트렌드 선택 모달 (TrendSelector) */}
      <TrendSelector
        visible={showTrendModal}
        onClose={() => setShowTrendModal(false)}
        onSelect={(t) => {
          setTrend(t)
          setShowTrendModal(false)
        }}
        trends={dummyTrends}
        onCreate={(t) => {
          const newT: Trend = {
            id: Date.now().toString(),
            popularity: 0,
            ...t,
          }
          setTrend(newT)
          setShowTrendModal(false)
        }}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F9FAFB" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#8B5CF6", marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  selector: {
    height: 48,
    borderWidth: 1,
    borderColor: "#C084FC",
    borderStyle: "dashed",
    borderRadius: 8,
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  placeholder: { color: "#9CA3AF" },
  selectedRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  selectedText: { fontSize: 16 },
  changeText: { color: "#8B5CF6" },
  error: { color: "#DC2626", fontSize: 12, marginTop: 4 },

  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", alignItems: "center" },
  calendarIcon: { marginLeft: 8 },

  emotionModal: {
    position: "absolute",
    top: 300,
    left: 16,
    right: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    zIndex: 10,
  },
  emotionItem: { padding: 12, borderBottomWidth: 1, borderColor: "#E5E7EB" },

  tagBtn: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
    height: 48,
  },
  tagBtnText: { color: "#fff", fontWeight: "600" },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7C3AED",
    marginRight: 8,
  },
  tagText: { color: "#7C3AED" },

  saveBtn: { height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  saveText: { color: "#fff", fontWeight: "700" },
})
