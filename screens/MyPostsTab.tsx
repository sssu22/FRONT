// MyPostsTab.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DropDownPicker from "react-native-dropdown-picker";

interface MyPostsTabProps {
  experiences: Experience[];
  onExperienceClick: (experience: Experience) => void;
  onEditExperience: (experience: Experience) => void;
  onDeleteExperience: (experienceId: string) => void;
}

interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  emotion:
    | "joy" | "excitement" | "nostalgia" | "surprise" | "love"
    | "regret" | "sadness" | "irritation" | "anger" | "embarrassment";
  tags: string[];
  trendScore: number;
}

const emotionIcons: Record<Experience["emotion"], string> = {
  joy: "😊", excitement: "🔥", nostalgia: "💭", surprise: "😲",
  love: "💖", regret: "😞", sadness: "😢", irritation: "😒",
  anger: "😡", embarrassment: "😳",
};

const emotionLabels: Record<Experience["emotion"], string> = {
  joy: "기쁨", excitement: "흥분", nostalgia: "향수", surprise: "놀람",
  love: "사랑", regret: "후회", sadness: "슬픔", irritation: "짜증",
  anger: "분노", embarrassment: "당황",
};

export default function MyPostsTab({
  experiences,
  onExperienceClick,
  onEditExperience,
  onDeleteExperience,
}: MyPostsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("최신순");
  const [emotionFilter, setEmotionFilter] = useState("전체");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [emotionOpen, setEmotionOpen] = useState(false);

  const sortOptions = ["최신순", "트렌드순", "제목순"];

  const filtered = experiences
    .filter((exp) =>
      exp.title.includes(searchQuery) ||
      exp.description.includes(searchQuery) ||
      exp.location.includes(searchQuery)
    )
    .filter((exp) =>
      emotionFilter === "전체" ? true : emotionLabels[exp.emotion] === emotionFilter
    )
    .sort((a, b) => {
      if (sortOption === "최신순") return new Date(b.date).getTime() - new Date(a.date).getTime();
      if (sortOption === "트렌드순") return b.trendScore - a.trendScore;
      if (sortOption === "제목순") return a.title.localeCompare(b.title);
      return 0;
    });

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <View>
            <Text style={[styles.title, { marginLeft: 16 }]}>내 게시글</Text>
            <Text style={[styles.subtitle, { marginLeft: 16 }]}>총 {experiences.length}개 경험</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.filterButton} onPress={() => setShowFilterModal(true)}>
          <Ionicons name="options" size={16} color="#000" />
        </TouchableOpacity>
      </View>

      {/* 검색창 */}
      <TextInput
        placeholder="내 경험 검색..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        style={styles.input}
      />

      {/* 경험 목록 */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity onPress={() => onExperienceClick(item)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.meta}>
                {emotionIcons[item.emotion]} {item.location} • {new Date(item.date).toLocaleDateString("ko-KR")}
              </Text>
              <Text style={styles.desc}>{item.description}</Text>
              <Text style={styles.trend}>🔥 트렌드 점수: {item.trendScore}</Text>
            </TouchableOpacity>
            <View style={styles.actions}>
              <TouchableOpacity onPress={() => onEditExperience(item)} style={styles.iconButton}>
                <Ionicons name="create-outline" size={18} color="#4B5563" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDeleteExperience(item.id)} style={styles.iconButton}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* 필터 모달 */}
      <Modal visible={showFilterModal} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>필터 설정</Text>

            <Text style={styles.label}>정렬 기준</Text>
            <DropDownPicker
              open={sortOpen}
              setOpen={setSortOpen}
              value={sortOption}
              setValue={setSortOption}
              items={sortOptions.map((s) => ({ label: s, value: s }))}
              style={styles.dropdown}
              zIndex={1000}
            />

            <Text style={styles.label}>감정 필터</Text>
            <DropDownPicker
              open={emotionOpen}
              setOpen={setEmotionOpen}
              value={emotionFilter}
              setValue={setEmotionFilter}
              items={[
                { label: "전체", value: "전체" },
                ...Object.entries(emotionLabels).map(([_, v]) => ({ label: v, value: v })),
              ]}
              style={styles.dropdown}
              zIndex={900}
            />

            <TouchableOpacity onPress={() => setShowFilterModal(false)} style={styles.closeButton}>
              <Text style={styles.closeText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 20, fontWeight: "bold" },
  subtitle: { fontSize: 13, color: "#6B7280" },
  filterButton: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  card: {
    backgroundColor: "#f1f5f9",
    padding: 12,
    marginBottom: 12,
    borderRadius: 10,
  },
  cardTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  meta: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
  },
  desc: {
    fontSize: 14,
    marginBottom: 4,
  },
  trend: {
    fontWeight: "bold",
    color: "#7c3aed",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
  },
  iconButton: {
    marginLeft: 12,
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  dropdown: {
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: "#4B5563",
    marginBottom: 6,
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: "#7C3AED",
    padding: 10,
    borderRadius: 8,
  },
  closeText: {
    textAlign: "center",
    color: "white",
    fontWeight: "600",
  },
});
