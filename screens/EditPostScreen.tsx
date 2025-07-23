// screens/EditPostScreen.tsx
import React, { useState } from "react"
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native"
import { Ionicons } from "@expo/vector-icons"
import DateTimePicker from "@react-native-community/datetimepicker"
import { LinearGradient } from "expo-linear-gradient"
import TrendSelector, { Trend } from "./TrendSelector"

export default function EditPostScreen({ navigation, route }: any) {
  const { experience, onSave } = route.params

  const [selectedTrend, setSelectedTrend] = useState<Trend>({
    id: experience.trend.id,
    name: experience.trend.name,
    description: experience.trend.description,
    category: experience.trend.category,
    popularity: experience.trend.popularity,
  })
  const [showTrendSelector, setShowTrendSelector] = useState(false)

  const [title, setTitle] = useState(experience.title)
  const [date, setDate] = useState(new Date(experience.date))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [location, setLocation] = useState(experience.location)
  const [emotion, setEmotion] = useState(experience.emotion)
  const [tags, setTags] = useState<string[]>([...experience.tags])
  const [tagInput, setTagInput] = useState("")
  const [description, setDescription] = useState(experience.description)

  // (예시) TrendSelector 에 넘길 데모 데이터
  const allTrends: Trend[] = [
    { id: "1", name: "도넛 플렉스", description: "SNS에서 도넛 자랑", category: "음식" , popularity: 95,},
    { id: "2", name: "혼밥", description: "혼자 식사", category: "라이프스타일" , popularity: 85, },
    { id: "3", name: "K-POP 콘서트", description: "아이돌 공연", category: "문화", popularity: 92, },
    // ...
  ]

  const handleSave = () => {
    // validation...
    const updated = {
      ...experience,
      trend: selectedTrend,
      title,
      date: date.toISOString(),
      location,
      emotion,
      tags,
      description,
    }
    onSave(updated)
    navigation.goBack()
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>경험 수정하기</Text>

        {/* 트렌드 선택 */}
        <Text style={styles.label}>↗ 트렌드 선택 *</Text>
        <TouchableOpacity style={styles.trendBox} onPress={() => setShowTrendSelector(true)}>
          <Ionicons name="trending-up-outline" size={20} color="#8B5CF6" />
          <Text style={styles.trendText}># {selectedTrend.name}</Text>
          <View style={styles.changeBtn}>
            <Text style={styles.changeBtnText}>변경</Text>
          </View>
        </TouchableOpacity>

        {/* 나머지 inputs 생략… */}
        {/* 제목, 날짜, 장소, 감정, 태그, 설명, 저장/취소 버튼 등… */}

        <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>경험 수정하기</Text>
        </TouchableOpacity>
      </ScrollView>

      <TrendSelector
        visible={showTrendSelector}
        trends={allTrends}
        onClose={() => setShowTrendSelector(false)}
        onSelect={(t) => setSelectedTrend(t)}
      />
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#F9FAFB" },
  headerTitle: { fontSize: 24, fontWeight: "700", color: "#8B5CF6", marginBottom: 16 },

  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  trendBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C084FC",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 24,
  },
  trendText: { flex: 1, marginLeft: 8, fontSize: 16 },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#8B5CF6",
    borderRadius: 6,
  },
  changeBtnText: { color: "#8B5CF6" },

  saveButton: {
    marginTop: 32,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
  },
})
