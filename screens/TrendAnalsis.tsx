import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card, Badge, ProgressBar } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

type Emotion =
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

interface Experience {
  id: string;
  title: string;
  date: string;
  location: string;
  emotion: Emotion;
  tags: string[];
  description: string;
  trendScore: number;
}

interface TrendAnalysisProps {
  experiences: Experience[];
  detailed?: boolean;
}

function generateTrendData(experience: Experience) {
  const baseScore = experience.trendScore;
  return {
    socialMediaMentions: Math.floor(baseScore * 1000 + Math.random() * 5000),
    economicImpact: Math.floor(baseScore * 100000 + Math.random() * 500000),
    userGrowth: Math.floor(baseScore * 10 + Math.random() * 50),
    peakPeriod: `${new Date(experience.date).getFullYear()}년 ${
      new Date(experience.date).getMonth() + 1
    }월`,
    relatedTrends: experience.tags.slice(0, 3),
    marketSize: Math.floor(baseScore * 1000000 + Math.random() * 10000000),
  };
}

const emotionIcons: Record<Emotion, string> = {
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

export default function TrendAnalysis({
  experiences,
  detailed = false,
}: TrendAnalysisProps) {
  if (detailed && experiences.length === 1) {
    const experience = experiences[0];
    const trendData = generateTrendData(experience);

    return (
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>트렌드 상세 분석</Text>
        <View style={styles.expHeader}>
          <Text style={styles.emoji}>{emotionIcons[experience.emotion]}</Text>
          <Text style={styles.expTitle}>{experience.title}</Text>
        </View>
        <Text style={styles.expDesc}>{experience.description}</Text>
        <View style={styles.infoRow}>
          <Badge style={styles.badge}>{experience.location}</Badge>
          <Text style={styles.infoText}>
            {new Date(experience.date).toLocaleDateString("ko-KR")}
          </Text>
        </View>

        <View style={styles.scoreRow}>
          <MaterialIcons name="trending-up" size={22} color="#7c3aed" />
          <Text style={styles.scoreLabel}>트렌드 점수</Text>
          <Text style={styles.scoreValue}>{experience.trendScore}</Text>
        </View>
        <ProgressBar
          progress={experience.trendScore / 100}
          color="#8b5cf6"
          style={{ marginTop: 6, height: 9, borderRadius: 5 }}
        />

        <View style={styles.statsGrid}>
          <StatItem
            icon={<Ionicons name="logo-twitter" color="#1da1f2" size={18} />}
            label="소셜 언급"
            value={trendData.socialMediaMentions + "회"}
          />
          <StatItem
            icon={<MaterialIcons name="attach-money" color="#0891b2" size={18} />}
            label="경제 효과"
            value={trendData.economicImpact.toLocaleString() + "원"}
          />
          <StatItem
            icon={<MaterialIcons name="group" color="#f59e42" size={18} />}
            label="사용자 증가"
            value={trendData.userGrowth + "%"}
          />
        </View>

        <View style={styles.relatedRow}>
          <Text style={styles.subTitle}>관련 키워드</Text>
          <View style={styles.tagRow}>
            {trendData.relatedTrends.length === 0 ? (
              <Text style={styles.grayText}>키워드 없음</Text>
            ) : (
              trendData.relatedTrends.map((tag) => (
                <view key={tag} style={styles.tagBadge}>
                  #{tag}
                </view>
              ))
            )}
          </View>
        </View>

        <View style={styles.marketRow}>
          <Text style={styles.marketText}>• 피크: {trendData.peakPeriod}</Text>
          <Text style={styles.marketText}>
            • 시장 규모: {trendData.marketSize.toLocaleString()}원
          </Text>
        </View>
      </Card>
    );
  }

  const avgTrendScore = experiences.length
    ? (
        experiences.reduce((acc, e) => acc + e.trendScore, 0) / experiences.length
      ).toFixed(1)
    : "-";
  const uniqueTags = Array.from(
    new Set(experiences.flatMap((e) => e.tags))
  ).slice(0, 4);

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>내 경험 기반 트렌드 분석</Text>
      <View style={styles.statsGrid}>
        <StatItem
          icon={<MaterialIcons name="trending-up" color="#6366f1" size={20} />}
          label="평균 트렌드 점수"
          value={avgTrendScore}
        />
        <StatItem
          icon={<MaterialIcons name="group" color="#f59e42" size={20} />}
          label="총 경험"
          value={experiences.length}
        />
        <StatItem
          icon={<Ionicons name="pricetag-outline" color="#a3e635" size={20} />}
          label="주요 키워드"
          value={uniqueTags.length ? uniqueTags.map((t) => "#" + t).join(", ") : "-"}
        />
      </View>
    </Card>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <View style={styles.statItem}>
      <View style={{ marginRight: 5 }}>{icon}</View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { margin: 14, borderRadius: 14, padding: 17, backgroundColor: "#fff" },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 13,
    marginLeft: 2,
    color: "#7c3aed",
  },
  expHeader: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  emoji: { fontSize: 34, marginRight: 8 },
  expTitle: { fontWeight: "bold", fontSize: 19, color: "#42206e" },
  expDesc: { color: "#444", fontSize: 14, marginBottom: 8, marginLeft: 3 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 13 },
  badge: {
    backgroundColor: "#f3e8ff",
    color: "#6366f1",
    marginRight: 7,
    fontSize: 12,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  infoText: { color: "#888", fontSize: 12, marginRight: 7 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
    marginTop: 7,
  },
  scoreLabel: { marginLeft: 7, marginRight: 10, color: "#7c3aed", fontWeight: "bold" },
  scoreValue: {
    fontWeight: "bold",
    fontSize: 18,
    color: "#a21caf",
    marginLeft: 2,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginVertical: 15,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flexBasis: "48%",
    marginBottom: 12,
    backgroundColor: "#f5f3ff",
    borderRadius: 12,
    padding: 10,
    minWidth: 130,
  },
  statLabel: { color: "#6b7280", fontSize: 12, marginRight: 5, fontWeight: "bold" },
  statValue: { color: "#18181b", fontSize: 15, fontWeight: "bold" },
  relatedRow: { marginBottom: 8 },
  subTitle: { fontWeight: "600", marginBottom: 5, fontSize: 14, color: "#8b5cf6" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5, marginLeft: 1 },
  tagBadge: {
    backgroundColor: "#d1fae5",
    color: "#14b8a6",
    marginRight: 7,
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  grayText: { color: "#aaa", fontSize: 13 },
  marketRow: { marginTop: 10, paddingLeft: 5 },
  marketText: { fontSize: 13, color: "#818181", marginBottom: 2 },
});
