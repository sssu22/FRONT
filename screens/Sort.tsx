import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Card } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

// 경험 타입 (모든 감정 타입 포함)
interface Experience {
  id: string;
  title: string;
  date: string;
  location: string;
  emotion: "joy" | "excitement" | "nostalgia" | "surprise" | "love" | "regret" | "sadness" | "irritation" | "anger" | "embarrassment";
  tags: string[];
  description: string;
  trendScore: number;
}

interface EmotionTimelineProps {
  experiences: Experience[];
}

// 감정별 컬러, 이모지 (모든 감정 타입 포함)
const emotionColors: Record<Experience["emotion"], string> = {
  joy: "#FACC15",
  excitement: "#F87171",
  nostalgia: "#A78BFA",
  surprise: "#60A5FA",
  love: "#F472B6",
  regret: "#F59E0B",
  sadness: "#6366F1",
  irritation: "#EF4444",
  anger: "#DC2626",
  embarrassment: "#EC4899",
};

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

export default function EmotionTimeline({ experiences }: EmotionTimelineProps) {
  // 날짜 내림차순 정렬
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
        {/* (모의) 세로 타임라인 */}
        <View style={styles.timelineLine} />

        <ScrollView style={{ flex: 1 }}>
          {sortedExperiences.map((experience, idx) => (
            <View key={experience.id} style={styles.timelineRow}>
              {/* 타임라인 점(이모지 + 배경) */}
              <View style={[styles.timelineDot, { backgroundColor: emotionColors[experience.emotion] }]}>
                <Text style={{ fontSize: 26 }}>{emotionIcons[experience.emotion]}</Text>
              </View>
              {/* 경험 카드영역 */}
              <View style={styles.timelineContent}>
                <View style={styles.expCard}>
                  <View style={styles.expHeader}>
                    <Text style={styles.expTitle}>{experience.title}</Text>
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreBadgeText}>트렌드 {experience.trendScore}점</Text>
                    </View>
                  </View>
                  <Text style={styles.expDate}>
                    {new Date(experience.date).toLocaleDateString("ko-KR")} • {experience.location}
                  </Text>
                  <Text style={styles.expDesc}>{experience.description}</Text>
                  <View style={styles.tagRow}>
                    {experience.tags.map((tag) => (
                      <View key={tag} style={styles.tagBadge}>
                        <Text style={styles.tagBadgeText}>#{tag}</Text>
                      </View>
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
    shadowOffset: { width: 0, height: 1 },
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
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  expHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginBottom: 6 
  },
  expTitle: { 
    fontWeight: "bold", 
    fontSize: 16, 
    color: "#222",
    flex: 1,
    marginRight: 8,
  },
  scoreBadge: {
    backgroundColor: "#ede9fe",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreBadgeText: {
    color: "#7c3aed",
    fontSize: 11,
    fontWeight: "500",
  },
  expDate: { color: "#64748b", fontSize: 13, marginBottom: 4 },
  expDesc: { color: "#444", fontSize: 14, marginBottom: 8 },
  tagRow: { 
    flexDirection: "row", 
    flexWrap: "wrap",
    marginTop: 2,
  },
  tagBadge: {
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 3,
  },
  tagBadgeText: {
    color: "#8b5cf6",
    fontSize: 11,
    fontWeight: "400",
  },
});