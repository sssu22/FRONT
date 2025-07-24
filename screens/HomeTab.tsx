import React from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Card, Button, Chip } from "react-native-paper";

// 감정 이모지 10종 포함
const emotionIcons = {
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

interface Experience {
  id: string;
  title: string;
  date: string;
  location: string;
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
  description: string;
  trendScore: number;
}

interface HomeTabProps {
  experiences: Experience[];
  onExperienceClick: (experience: Experience) => void;
  onAddExperience: () => void;
  onSearch: (searchQuery: string) => void;
  searchQuery: string;
}

export default function HomeTab({
  experiences,
  onExperienceClick,
  onAddExperience,
  onSearch,
  searchQuery,
}: HomeTabProps) {
  // 검색어 하이라이트 함수
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

  const resultsLabel = searchQuery
    ? `"${searchQuery}"에 대한 ${experiences.length}개 결과`
    : `총 ${experiences.length}개 경험`;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.resultsLabel}>{resultsLabel}</Text>

      <Button
        mode="contained"
        style={styles.addBtn}
        onPress={onAddExperience}
        icon="plus"
      >
        내 첫 경험 기록하기
      </Button>

      {experiences.length === 0 ? (
        <Text style={styles.emptyText}>
          {searchQuery ? "다른 키워드로 검색해보세요" : "첫 경험을 추가해보세요"}
        </Text>
      ) : (
        <FlatList
          data={experiences}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => onExperienceClick(item)}>
              <Card style={styles.expCard}>
                <View style={styles.expRow}>
                  <Text style={styles.emoji}>{emotionIcons[item.emotion]}</Text>
                  <View style={styles.expMain}>
                    <Text style={styles.expTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.expDesc} numberOfLines={2}>
                      {searchQuery
                        ? highlightText(item.description, searchQuery)
                        : item.description}
                    </Text>
                    <Text style={styles.expMeta}>
                      {item.location} | {new Date(item.date).toLocaleDateString("ko-KR")}
                    </Text>
                  </View>
                  <View style={styles.trendBox}>
                    <Text style={styles.trendLabel}>트렌드</Text>
                    <Text style={styles.trendScore}>{item.trendScore}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}

      <Text style={styles.bottomHint}>
        당신의 특별한 순간이 어떤 트렌드였는지 알아보세요
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fafaff", padding: 16 },
  resultsLabel: { fontWeight: "bold", fontSize: 15, marginBottom: 8, color: "#6b21a8" },
  addBtn: {
    borderRadius: 8,
    backgroundColor: "#8b5cf6",
    marginBottom: 14,
    shadowOpacity: 0,
  },
  emptyText: {
    marginTop: 40,
    color: "#c026d3",
    textAlign: "center",
    fontSize: 15,
  },
  expCard: {
    marginBottom: 10,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 2,
    padding: 10,
  },
  expRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  emoji: {
    fontSize: 26,
    marginRight: 12,
    marginTop: 4,
  },
  expMain: {
    flex: 1,
    minWidth: 0,
  },
  expTitle: {
    fontWeight: "bold",
    fontSize: 17,
    color: "#1e293b",
    marginBottom: 2,
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
  trendBox: {
    alignItems: "center",
    marginLeft: 7,
    backgroundColor: "#ebe8ff",
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 7,
    minWidth: 52,
  },
  trendLabel: {
    fontSize: 12,
    color: "#7c3aed",
    fontWeight: "600",
    marginBottom: 2,
  },
  trendScore: {
    fontWeight: "bold",
    color: "#8b5cf6",
    fontSize: 17,
  },
  bottomHint: {
    marginTop: 25,
    textAlign: "center",
    color: "#7773a5",
    fontSize: 13,
  },
});
