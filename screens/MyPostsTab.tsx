import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Button, Chip, Card } from "react-native-paper";

interface Experience {
  id: string;
  title: string;
  description: string;
  location: string;
  date: string;
  emotion:
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
  tags: string[];
  trendScore: number;
}

const emotionIcons: Record<Experience["emotion"], string> = {
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

interface MyPostsTabProps {
  experiences: Experience[];
  onExperienceClick: (experience: Experience) => void;
  onEditExperience: (experience: Experience) => void;
  onDeleteExperience: (experienceId: string) => void;
}

export default function MyPostsTab({
  experiences,
  onExperienceClick,
  onEditExperience,
  onDeleteExperience,
}: MyPostsTabProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("");

  const locations = Array.from(new Set(experiences.map((exp) => exp.location)));

  const filteredExperiences = experiences.filter(
    (exp) =>
      (!searchQuery ||
        exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exp.location.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (!selectedLocation || exp.location === selectedLocation)
  );

  const highlightText = (text: string, keyword: string) => {
    if (!keyword) return text;
    const idx = text.toLowerCase().indexOf(keyword.toLowerCase());
    if (idx === -1) return text;
    return (
      <>
        {text.substring(0, idx)}
        <Text style={{ color: "#c026d3", fontWeight: "bold" }}>
          {text.substring(idx, idx + keyword.length)}
        </Text>
        {text.substring(idx + keyword.length)}
      </>
    );
  };

  return (
    <FlatList
      data={filteredExperiences}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={
        <View>
          <TextInput
            style={styles.input}
            placeholder="경험 제목, 내용, 위치 등 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          <ScrollView horizontal style={styles.locationRow} showsHorizontalScrollIndicator={false}>
            <Chip
              selected={!selectedLocation}
              onPress={() => setSelectedLocation("")}
              style={!selectedLocation ? styles.chipSelected : styles.chip}
            >
              전체
            </Chip>
            {locations.map((loc) => (
              <Chip
                key={loc}
                selected={selectedLocation === loc}
                onPress={() => setSelectedLocation(loc)}
                style={selectedLocation === loc ? styles.chipSelected : styles.chip}
              >
                {loc}
              </Chip>
            ))}
          </ScrollView>

          <Text style={styles.countText}>
            총 {filteredExperiences.length}개 경험
            {selectedLocation ? ` • ${selectedLocation}` : ""}
          </Text>
        </View>
      }
      ListEmptyComponent={
        <Text style={styles.emptyText}>
          {searchQuery || selectedLocation
            ? "다른 조건으로 검색해보세요"
            : "첫 경험을 기록해보세요"}
        </Text>
      }
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.expCard} onPress={() => onExperienceClick(item)}>
          <View style={styles.expRow}>
            <Text style={styles.expEmoji}>{emotionIcons[item.emotion]}</Text>
            <View style={styles.expInfo}>
              <Text style={styles.expTitle}>{item.title}</Text>
              <Text style={styles.expDesc}>
                {searchQuery
                  ? highlightText(item.description, searchQuery)
                  : item.description}
              </Text>
              <Text style={styles.expMeta}>
                {item.location} | {new Date(item.date).toLocaleDateString("ko-KR")}
              </Text>
            </View>
            <View style={styles.expActions}>
              <Text style={styles.expScore}>{item.trendScore}</Text>
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onEditExperience(item);
                  }}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>편집</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onDeleteExperience(item.id);
                  }}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      )}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  input: {
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    padding: 10,
    marginBottom: 8,
    fontSize: 15,
    backgroundColor: "#fafaff",
  },
  locationRow: {
    flexDirection: "row",
    marginBottom: 10,
    minHeight: 40,
  },
  chip: {
    marginRight: 6,
    backgroundColor: "#e9e5fa",
    color: "#333",
  },
  chipSelected: {
    marginRight: 6,
    backgroundColor: "#a78bfa",
    color: "#fff",
  },
  countText: {
    marginBottom: 8,
    fontWeight: "bold",
    color: "#5b21b6",
    fontSize: 14,
  },
  expCard: {
    padding: 14,
    backgroundColor: "#f4f9fd",
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  expRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  expEmoji: {
    fontSize: 22,
    marginRight: 12,
  },
  expInfo: {
    flex: 1,
    minWidth: 0,
  },
  expTitle: {
    fontWeight: "bold",
    fontSize: 16,
    color: "#1e293b",
  },
  expDesc: {
    color: "#444",
    marginTop: 3,
    fontSize: 13,
  },
  expMeta: {
    marginTop: 2,
    color: "#7c3aed",
    fontSize: 12,
  },
  expActions: {
    alignItems: "flex-end",
    marginLeft: 7,
  },
  expScore: {
    fontWeight: "bold",
    color: "#9333ea",
    fontSize: 15,
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 8,
    gap: 4,
  },
  actionButton: {
    backgroundColor: "#7C3AED",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  deleteButton: {
    backgroundColor: "#EF4444",
  },
  actionButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  deleteButtonText: {
    color: "white",
  },
  emptyText: {
    textAlign: "center",
    color: "#C42D7D",
    marginTop: 30,
    fontSize: 15,
  },
});
