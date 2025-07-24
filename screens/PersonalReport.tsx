import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card, Badge } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

// 경험 타입
interface Experience {
  id: string;
  title: string;
  date: string;
  location: string;
  emotion: "joy" | "excitement" | "nostalgia" | "surprise" | "love";
  tags: string[];
  description: string;
  trendScore: number;
}

interface EmotionTimelineProps {
  experiences: Experience[];
}

// 감정별 컬러, 이모지
const emotionColors: Record<Experience["emotion"], string> = {
  joy: "#FACC15",
  excitement: "#F87171",
  nostalgia: "#A78BFA",
  surprise: "#60A5FA",
  love: "#F472B6",
};
const emotionIcons: Record<Experience["emotion"], string> = {
  joy: "😊",
  excitement: "🔥",
  nostalgia: "💭",
  surprise: "😲",
  love: "💖",
};

export default function EmotionTimeline({ experiences }: EmotionTimelineProps) {
  const sortedExperiences = [...experiences].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="trending-up-outline" size={24} color="#a78bfa" style={{ marginRight: 7 }} />
        <Text style={styles.headerTitle}>감정 타임라인</Text>
      </View>
      <View style={{ position: "relative", flex: 1 }}>
        {/* 세로 타임라인 선 */}
        <View style={styles.timelineLine} />
        <ScrollView style={{ flex: 1 }}>
          {sortedExperiences.map((experience, idx) => (
            <View key={experience.id} style={styles.timelineRow}>
              {/* 타임라인 이모지 원 */}
              <View style={[styles.timelineDot, { backgroundColor: emotionColors[experience.emotion] }]}>
                <Text style={{ fontSize: 26 }}>{emotionIcons[experience.emotion]}</Text>
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.expCard}>
                  <View style={styles.expHeader}>
                    <Text style={styles.expTitle}>{experience.title}</Text>
                    <view style={styles.scoreBadge}>트렌드 {experience.trendScore}점</view>
                  </View>
                  <Text style={styles.expDate}>
                    {new Date(experience.date).toLocaleDateString("ko-KR")} • {experience.location}
                  </Text>
                  <Text style={styles.expDesc}>{experience.description}</Text>
                  <View style={styles.tagRow}>
                    {experience.tags.map((tag) => (
                      <view key={tag} style={styles.tagBadge}>#{tag}</view>
                    ))}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { margin: 16, borderRadius: 13, padding: 9, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 15, marginLeft: 6 },
  headerTitle: { fontSize: 19, fontWeight: "bold", color: "#6d28d9" },
  timelineLine: {
    position: "absolute",
    left: 38,
    top: 1,
    bottom: 10,
    width: 4,
    borderRadius: 2,
    backgroundColor: "#e9d5ff",
    zIndex: 0,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
    position: "relative",
    minHeight: 74,
  },
  timelineDot: {
    width: 54,
    height: 54,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 2,
  },
  timelineContent: { flex: 1, minWidth: 0 },
  expCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 13,
    borderWidth: 1,
    borderColor: "#efeff6",
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  expHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  expTitle: { fontWeight: "bold", fontSize: 16, color: "#222" },
  scoreBadge: {
    backgroundColor: "#ede9fe",
    color: "#7c3aed",
    fontSize: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginLeft: 8,
  },
  expDate: { color: "#64748b", fontSize: 13, marginBottom: 4 },
  expDesc: { color: "#444", fontSize: 14, marginBottom: 6 },
  tagRow: { flexDirection: "row", flexWrap: "wrap" },
  tagBadge: {
    backgroundColor: "#f3f4f6",
    color: "#8b5cf6",
    fontSize: 11,
    marginRight: 4,
    marginTop: 2,
    paddingHorizontal: 6,
  },
});
