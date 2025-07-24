import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Card, Badge } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

// 경험 데이터 타입 (더 많은 감정 타입 포함)
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

// 감정별 컬러 및 이모지 매핑 (모든 감정 타입 포함)
const emotionColors: Record<Experience["emotion"], { bg: string; text: string; border: string }> = {
  joy:          { bg: "#FEF9C3", text: "#CA8A04", border: "#FEF08A" },
  excitement:   { bg: "#FECACA", text: "#B91C1C", border: "#FCA5A5" },
  nostalgia:    { bg: "#EDE9FE", text: "#7C3AED", border: "#C4B5FD" },
  surprise:     { bg: "#DBEAFE", text: "#2563EB", border: "#BFDBFE" },
  love:         { bg: "#FBCFE8", text: "#BE185D", border: "#F9A8D4" },
  regret:       { bg: "#FEF3C7", text: "#D97706", border: "#FDE68A" },
  sadness:      { bg: "#E0E7FF", text: "#4338CA", border: "#C7D2FE" },
  irritation:   { bg: "#FEE2E2", text: "#DC2626", border: "#FECACA" },
  anger:        { bg: "#FECDD3", text: "#BE123C", border: "#FDA4AF" },
  embarrassment: { bg: "#FCE7F3", text: "#A21CAF", border: "#F8BBD9" },
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

interface ExperienceMapProps {
  experiences: Experience[];
}

export default function ExperienceMap({ experiences }: ExperienceMapProps) {
  // location별로 경험 분류
  const locationGroups = experiences.reduce<Record<string, Experience[]>>((acc, exp) => {
    if (!acc[exp.location]) acc[exp.location] = [];
    acc[exp.location].push(exp);
    return acc;
  }, {});

  return (
    <Card style={styles.card}>
      {/* 제목 */}
      <View style={styles.headerRow}>
        <Ionicons name="location-sharp" size={26} color="#22c55e" style={{ marginRight: 6 }} />
        <Text style={styles.headerTitle}>경험 지도</Text>
      </View>

      {/* 지도 모의 영역 */}
      <View style={styles.mapBox}>
        <Ionicons name="map" size={45} color="#bbb" style={{ marginBottom: 5 }} />
        <Text style={styles.mapText}>지도 시각화 영역</Text>
        <Text style={styles.mapDesc}>실제 구현시 react-native-maps 사용</Text>
      </View>

      {/* 지역별 요약 */}
      <ScrollView style={styles.scrollContainer}>
        <Text style={styles.sectionTitle}>지역별 경험 요약</Text>
        {Object.entries(locationGroups).map(([location, locationExperiences]) => (
          <View key={location} style={styles.locationBox}>
            <View style={styles.locationHeader}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Ionicons name="location-outline" size={16} color="#22c55e" style={{ marginRight: 5 }} />
                <Text style={styles.locationName}>{location}</Text>
              </View>
              <View style={styles.badgeOutline}>
                <Text style={styles.badgeText}>{locationExperiences.length}개 경험</Text>
              </View>
            </View>
            {/* 해당 지역의 경험 리스트 */}
            {locationExperiences.map(exp => (
              <View key={exp.id} style={styles.expCard}>
                <View style={styles.expHeader}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text style={{ fontSize: 18 }}>{emotionIcons[exp.emotion]}</Text>
                    <Text style={styles.expTitle}>{exp.title}</Text>
                  </View>
                  <Text style={styles.expDate}>
                    {new Date(exp.date).toLocaleDateString("ko-KR")}
                  </Text>
                </View>
                <View style={styles.tagsRow}>
                  <View style={[styles.emotionBadge, {
                    backgroundColor: emotionColors[exp.emotion].bg,
                    borderColor: emotionColors[exp.emotion].border,
                  }]}>
                    <Text style={[styles.emotionBadgeText, {
                      color: emotionColors[exp.emotion].text,
                    }]}>
                      {exp.emotion}
                    </Text>
                  </View>
                  {exp.tags.slice(0, 3).map(tag => (
                    <View key={tag} style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>#{tag}</Text>
                    </View>
                  ))}
                  {exp.tags.length > 3 && (
                    <View style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>+{exp.tags.length - 3}</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { margin: 14, borderRadius: 14, padding: 12, backgroundColor: "#fff" },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  headerTitle: { fontSize: 21, fontWeight: "bold", color: "#2f363e" },
  mapBox: {
    backgroundColor: "rgba(188,230,225,0.25)",
    borderRadius: 13,
    minHeight: 140,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 10,
    borderWidth: 1.5,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    padding: 18,
  },
  mapText: { fontSize: 16, color: "#71717a", fontWeight: "600" },
  mapDesc: { fontSize: 12, color: "#9ca3af" },
  scrollContainer: { flex: 1 },
  sectionTitle: { fontWeight: "bold", fontSize: 17, color: "#222", marginBottom: 11 },
  locationBox: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    marginBottom: 12,
    padding: 12,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  badgeOutline: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: "#6366f1",
    fontSize: 11,
    fontWeight: "500",
  },
  locationName: { fontWeight: "bold", fontSize: 15, color: "#2563eb" },
  expCard: {
    backgroundColor: "#fff",
    borderRadius: 7,
    padding: 12,
    marginBottom: 7,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  expHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    alignItems: "center",
  },
  expTitle: {
    fontWeight: "600",
    fontSize: 15,
    marginLeft: 5,
    color: "#374151",
  },
  expDate: {
    color: "#a3a3a3",
    fontSize: 12,
  },
  tagsRow: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    marginTop: 6,
    alignItems: "center",
  },
  emotionBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 6,
    marginBottom: 3,
  },
  emotionBadgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  tagBadge: {
    backgroundColor: "#eceff1",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 3,
  },
  tagBadgeText: {
    color: "#4b5563",
    fontSize: 11,
  },
});