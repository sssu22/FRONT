// CreatePostScreen.tsx
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
  Modal,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { LinearGradient } from "expo-linear-gradient"

export default function CreatePostScreen({ navigation }: { navigation: any }) {
  const [selectedTrend, setSelectedTrend] = useState<string>("")
  const [showTrendModal, setShowTrendModal] = useState(false)
  const [title, setTitle] = useState("")
  const [date, setDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [location, setLocation] = useState("")
  const [emotion, setEmotion] = useState<string>("")
  const [showEmotionModal, setShowEmotionModal] = useState(false)
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const [description, setDescription] = useState("")

  const trendOptions = ["도넛 플렉스", "혼밥", "비건 라이프", "K-POP 콘서트", "NFT 투자"]
  const emotionOptions = ["joy", "excitement", "nostalgia", "surprise", "love"]

  const handleAddTag = () => {
    if (tagInput.trim()) {
      setTags(prev => [...prev, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleSave = () => {
    if (!selectedTrend || !title || !location || !emotion) {
      alert("필수 항목을 모두 입력해주세요.")
      return
    }
    const newPost = { trend: selectedTrend, title, date: date.toISOString().split("T")[0], location, emotion, tags, description }
    console.log("작성된 경험:", newPost)
    navigation.goBack()
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>새로운 첫 경험 추가</Text>

        {/* ───────── 트렌드 선택 ───────── */}
        <View style={styles.field}>
          <Text style={styles.label}>↗ 트렌드 선택 *</Text>
          <TouchableOpacity
            style={styles.trendBox}
            onPress={() => setShowTrendModal(true)}
          >
            <Ionicons name="trending-up-outline" size={20} color="#8B5CF6" style={{ marginRight: 8 }} />
            <Text style={[styles.pickerText, !selectedTrend && { color: "#9CA3AF" }]}>
              {selectedTrend || "트렌드를 선택하세요"}
            </Text>
          </TouchableOpacity>
          {!selectedTrend && <Text style={styles.errorText}>* 트렌드 선택은 필수입니다</Text>}
        </View>

        <Modal
          visible={showTrendModal}
          transparent
          animationType="fade"
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowTrendModal(false)}
          >
            <View style={styles.modalContent}>
              {trendOptions.map(t => (
                <TouchableOpacity
                  key={t}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedTrend(t)
                    setShowTrendModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ───────── 제목 ───────── */}
        <View style={styles.field}>
          <Text style={styles.label}>경험 제목 *</Text>
          <TextInput
            style={styles.input}
            placeholder="예: 첫 도넛 플렉스, 첫 혼밥 도전"
            value={title}
            onChangeText={setTitle}
          />
        </View>

        {/* ───────── 날짜 & 장소 ───────── */}
        <View style={[styles.field, styles.row]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.label}>날짜 *</Text>
            <TouchableOpacity
              style={styles.dateBox}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: "#374151" }}>{date.toISOString().split("T")[0]}</Text>
              <Ionicons name="calendar-outline" size={18} color="#6B7280" style={styles.dateIcon} />
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

        {/* ───────── 감정 선택 ───────── */}
        <View style={styles.field}>
          <Text style={styles.label}>감정 *</Text>
          <TouchableOpacity
            style={styles.trendBox}
            onPress={() => setShowEmotionModal(true)}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#8B5CF6" style={{ marginRight: 8 }} />
            <Text style={[styles.pickerText, !emotion && { color: "#9CA3AF" }]}>
              {emotion || "경험했던 주요 감정을 선택하세요"}
            </Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showEmotionModal}
          transparent
          animationType="fade"
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowEmotionModal(false)}
          >
            <View style={styles.modalContent}>
              {emotionOptions.map(e => (
                <TouchableOpacity
                  key={e}
                  style={styles.modalItem}
                  onPress={() => {
                    setEmotion(e)
                    setShowEmotionModal(false)
                  }}
                >
                  <Text style={styles.modalItemText}>{e}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* ───────── 태그 ───────── */}
        <View style={styles.field}>
          <Text style={styles.label}>추가 태그</Text>
          <View style={styles.row}>
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 8 }]}
              placeholder="태그를 입력하고 Enter를 누르세요"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={handleAddTag}>
              <Text style={{ color: "#fff", fontWeight: "600" }}>추가</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={tags}
            horizontal
            keyExtractor={(item, i) => `${item}-${i}`}
            renderItem={({ item }) => (
              <View style={styles.tag}>
                <Text style={{ color: "#7C3AED" }}>#{item}</Text>
              </View>
            )}
            style={{ marginTop: 8 }}
          />
        </View>

        {/* ───────── 상세 설명 ───────── */}
        <View style={styles.field}>
          <Text style={styles.label}>상세 설명</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: "top" }]}
            multiline
            placeholder="그때의 경험을 자세히 설명해주세요…"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* ───────── 버튼 ───────── */}
        <View style={[styles.row, { marginTop: 24 }]}>
          <TouchableOpacity style={{ flex: 1, marginRight: 8 }} onPress={handleSave}>
            <LinearGradient colors={["#8B5CF6", "#EC4899"]} style={styles.saveBtn}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>경험 저장하기</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: "#fff", borderWidth: 1, borderColor: "#8B5CF6" }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={{ color: "#8B5CF6", fontWeight: "700" }}>취소</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F9FAFB" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#8B5CF6", marginBottom: 16 },
  field: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 6 },
  trendBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C084FC",
    borderStyle: "dashed",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#fff",
  },
  pickerText: { flex: 1, fontSize: 16 },
  errorText: { color: "#DC2626", fontSize: 12, marginTop: 4 },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#fff",
  },
  row: { flexDirection: "row", alignItems: "center" },
  dateBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: "#fff",
  },
  dateIcon: { marginLeft: 8 },
  addTagBtn: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    justifyContent: "center",
    borderRadius: 8,
    height: 48,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#7C3AED",
    marginRight: 8,
  },
  saveBtn: { height: 48, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 32,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
  },
  modalItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalItemText: { fontSize: 16, color: "#374151" },
})
