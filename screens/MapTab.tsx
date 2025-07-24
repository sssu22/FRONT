import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Card, Badge } from "react-native-paper";
import { MapPin } from "react-native-feather";

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
  { label: "전체", value: "all" },
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

// 이모지 매핑
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

interface Experience {
  id: string;
  title: string;
  date: string;
  location: string;
  emotion: EmotionType;
  tags: string[];
  description: string;
  trendScore: number;
}

interface MapTabProps {
  experiences: Experience[];
  onExperienceClick: (experience: Experience) => void;
}

export default function MapTab({ experiences, onExperienceClick }: MapTabProps) {
  // 위치별로 경험 그룹화
  const locationGroups = experiences.reduce<Record<string, Experience[]>>((acc, exp) => {
    if (!acc[exp.location]) acc[exp.location] = [];
    acc[exp.location].push(exp);
    return acc;
  }, {});

  // 핀 위치(웹에서는 절대 위치 CSS, React Native는 임의 배치 or 지도 연동 필요)
  // 여기서는 단순 리스트 형태로 대체
  const locationPositions = [
    { top: "20%", left: "25%" }, // 예시, 실제론 커스텀 좌표 또는 지도 위에 표시 가능
    { top: "35%", left: "15%" },
    { top: "45%", left: "70%" },
    { top: "60%", left: "40%" },
    { top: "25%", left: "60%" },
  ];

  // 방문 지역 수 및 최다 경험 지역 계산
  const locationCount = Object.keys(locationGroups).length;
  const maxExperiences = Math.max(
    ...Object.values(locationGroups).map((group) => group.length)
  );

  // 지역별 경험 정렬
  const sortedLocations = Object.entries(locationGroups).sort(
    ([, a], [, b]) => b.length - a.length
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 16 }}>
      {/* 지도 대신 배경 영역 + 위치 그룹 */}
      <Card style={styles.mapCard}>
        <View style={styles.mapBackground}>
          {/* 핀들은 스크롤뷰나 지도로 대체가능. 여기선 대표 위치와 개수만 표시 */}
          {sortedLocations.map(([location, locationExps], idx) => (
            <TouchableOpacity
              key={location}
              style={styles.pinContainer}
              onPress={() => {
                // 실제 지도 핀 클릭 시 행동
                // 여기서는 첫번째 경험 클릭 예시
                onExperienceClick(locationExps[0]);
              }}
            >
              <View style={styles.pinCircle}>
                <Text style={styles.pinCount}>{locationExps.length}</Text>
              </View>
              <Text style={styles.pinLabel}>{location}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* 지역 통계 */}
      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: "#7c3aed" }]}>
              {locationCount}
            </Text>
            <Text style={styles.statLabel}>방문 지역</Text>
          </View>
        </Card>
        <Card style={styles.statCard}>
          <View style={styles.statContent}>
            <Text style={[styles.statNumber, { color: "#2563eb" }]}>
              {maxExperiences}
            </Text>
            <Text style={styles.statLabel}>최다 경험 지역</Text>
          </View>
        </Card>
      </View>

      {/* 지역별 경험 리스트 */}
      <View style={styles.locationList}>
        <Text style={styles.sectionTitle}>지역별 경험</Text>
        {sortedLocations.map(([location, locationExps]) => (
          <Card key={location} style={styles.locationCard}>
            <View style={styles.locationHeader}>
              <View style={styles.locationTitleWrapper}>
                <MapPin stroke="#22c55e" width={18} height={18} />
                <Text style={styles.locationTitle}>{location}</Text>
              </View>
              <Badge style={styles.badge}>{locationExps.length + "개"}</Badge>
            </View>
            <View style={styles.experienceList}>
              {locationExps.map((exp) => (
                <TouchableOpacity
                  key={exp.id}
                  style={styles.experienceItem}
                  onPress={() => onExperienceClick(exp)}
                >
                  <Text style={styles.experienceEmotion}>{emotionIcons[exp.emotion]}</Text>
                  <View style={styles.expTextContainer}>
                    <Text numberOfLines={1} style={styles.expTitle}>
                      {exp.title}
                    </Text>
                    <Text style={styles.expDate}>
                      {new Date(exp.date).toLocaleDateString("ko-KR")}
                    </Text>
                  </View>
                  <View style={styles.expTrendScoreContainer}>
                    <Text style={styles.expTrendScore}>{exp.trendScore}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12, backgroundColor: "#fff" },
  mapCard: { marginBottom: 12, overflow: "hidden", borderRadius: 12 },
  mapBackground: {
    height: 250,
    backgroundColor: "#dbeafe",
    borderRadius: 12,
    padding: 16,
    justifyContent: "center",
    alignItems: "center",
    flexWrap: "wrap",
    flexDirection: "row",
  },
  pinContainer: {
    backgroundColor: "#ef4444",
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 8,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  pinCircle: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 4,
    borderWidth: 2,
    borderColor: "#fff",
  },
  pinCount: { color: "#fff", fontWeight: "bold", fontSize: 14 },
  pinLabel: { color: "#fff", fontWeight: "600" },

  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 6,
  },
  statContent: {
    paddingVertical: 12,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 28,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#666",
    fontSize: 12,
  },

  locationList: { marginBottom: 12 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
    color: "#111",
  },
  locationCard: {
    marginBottom: 10,
    borderRadius: 10,
  },
  locationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  locationTitleWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationTitle: {
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 6,
    color: "#111",
  },

  badge: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#999",
    fontSize: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  experienceList: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  experienceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },
  experienceEmotion: {
    fontSize: 20,
    marginRight: 12,
  },
  expTextContainer: {
    flex: 1,
  },
  expTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111",
  },
  expDate: {
    fontSize: 11,
    color: "#888",
  },
  expTrendScoreContainer: {
    width: 40,
    alignItems: "flex-end",
  },
  expTrendScore: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#7c3aed",
  },
});
