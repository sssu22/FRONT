// screens/TrendsTab.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Card, IconButton } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import { Trend } from "../types"; // 👈 types.ts에서 올바른 Trend 타입을 가져옵니다.

interface TrendsTabProps {
  trends: Trend[]; // 👈 이제 올바른 Trend[] 타입을 사용합니다.
  onTrendView?: (trendId: number, category: string) => void;
  scrappedTrends?: number[];
  onToggleTrendScrap?: (trendId: number) => void;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 14 },
  sectionTitle: { fontWeight: "bold", fontSize: 17, marginVertical: 14, color: "#7C3AED" },
  trendCard: {
    marginBottom: 11,
    borderRadius: 14,
    backgroundColor: "#f6f6fc",
    padding: 14,
    elevation: 1,
  },
  trendRow: { flexDirection: "row", alignItems: "center" },
  trendInfo: { flex: 1, minWidth: 0 },
  trendTitle: { fontWeight: "bold", fontSize: 16, color: "#8633fc", marginBottom: 1 },
  trendCategory: { color: "#a78bfa", fontSize: 12, marginBottom: 2 },
  trendDesc: { color: "#555", fontSize: 13, marginBottom: 4 },
  predictionChip: { flexDirection: "row", alignItems: "center" },
  predictionText: { fontWeight: "bold", fontSize: 12, marginLeft: 4 },
  sectionPad: { marginBottom: 26 },
  scoreBox: {
    minWidth: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ede9fe",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 11,
  },
  medal: { fontSize: 21, marginRight: 7 },
  recentScore: { color: "#7C3AED", fontWeight: "bold", fontSize: 15, marginLeft: 3 },
  emptyText: { textAlign: "center", color: "#888", marginTop: 32, fontSize: 15 },
});

const getPredictionIcon = (dir?: string) => {
  if (dir === "up") return <Ionicons name="arrow-up" size={15} color="#16a34a" />;
  if (dir === "down") return <Ionicons name="arrow-down" size={15} color="#e11d48" />;
  return <Ionicons name="remove" size={15} color="#888" />;
};

function getRankingMedal(idx: number) {
  if (idx === 0) return <Text style={styles.medal}>🥇</Text>;
  if (idx === 1) return <Text style={styles.medal}>🥈</Text>;
  if (idx === 2) return <Text style={styles.medal}>🥉</Text>;
  return <Text style={styles.medal}>{idx + 1}</Text>;
}

export default function TrendsTab({
  trends,
  onTrendView = () => {},
  scrappedTrends = [],
  onToggleTrendScrap = () => {},
}: TrendsTabProps) {
  const recentTrends = useMemo(
    () =>
      [...trends]
        .filter((t) => !!t.createdAt)
        .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
        .slice(0, 3),
    [trends]
  );

  const predictedTrends = useMemo(
    () =>
      trends
        .filter((t) => !!t.prediction && t.prediction.nextMonthGrowth > 0)
        .sort((a, b) => b.prediction!.nextMonthGrowth - a.prediction!.nextMonthGrowth)
        .slice(0, 3),
    [trends]
  );

  const rankedTrends = useMemo(
    () =>
      [...trends]
        .filter((t) => typeof t.score === "number")
        .sort((a, b) => b.score! - a.score!)
        .slice(0, 3),
    [trends]
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.sectionTitle}>🔥 최근 트렌드</Text>
      {recentTrends.length === 0 && <Text style={styles.emptyText}>신규 트렌드가 없습니다.</Text>}
      {recentTrends.map((t) => (
        <Card key={t.id} style={styles.trendCard}>
          <TouchableOpacity onPress={() => onTrendView(t.id, t.category)}>
            <View style={styles.trendRow}>
              <View style={styles.trendInfo}>
                <Text style={styles.trendTitle}>{t.name}</Text>
                <Text style={styles.trendCategory}># {t.category}</Text>
                <Text style={styles.trendDesc}>{t.description}</Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginTop: 1 }}>
                  <Ionicons name="trending-up" color="#7C3AED" size={14} />
                  <Text style={styles.recentScore}>{t.score ?? "-"}</Text>
                  <Text style={{ color: "#aaa", marginLeft: 4, fontSize: 12 }}>
                    {t.createdAt ? new Date(t.createdAt).toLocaleDateString("ko-KR") : ""}
                  </Text>
                </View>
              </View>
              <IconButton
                icon={scrappedTrends.includes(t.id) ? "bookmark" : "bookmark-outline"}
                size={24}
                iconColor={scrappedTrends.includes(t.id) ? "#f59e42" : "#aaa"}
                onPress={() => onToggleTrendScrap(t.id)}
              />
            </View>
          </TouchableOpacity>
        </Card>
      ))}

      <Text style={[styles.sectionTitle, styles.sectionPad]}>📈 트렌드 예측</Text>
      {predictedTrends.length === 0 && <Text style={styles.emptyText}>예측 트렌드가 없습니다.</Text>}
      {predictedTrends.map((t) => (
        <Card key={t.id} style={styles.trendCard}>
          <TouchableOpacity onPress={() => onTrendView(t.id, t.category)}>
            <View style={styles.trendRow}>
              <View style={styles.trendInfo}>
                <View style={styles.predictionChip}>
                  {getPredictionIcon(t.prediction?.direction!)}
                  <Text style={styles.predictionText}>
                    {t.prediction?.nextMonthGrowth !== undefined
                      ? (t.prediction?.nextMonthGrowth > 0 ? "+" : "") + t.prediction?.nextMonthGrowth
                      : ""}
                    % · 신뢰도 {t.prediction?.confidence ?? "-"}%
                  </Text>
                </View>
                <Text style={styles.trendTitle}>{t.name}</Text>
                <Text style={styles.trendCategory}># {t.category}</Text>
                <Text style={styles.trendDesc}>{t.description}</Text>
              </View>
              <IconButton
                icon={scrappedTrends.includes(t.id) ? "bookmark" : "bookmark-outline"}
                size={24}
                iconColor={scrappedTrends.includes(t.id) ? "#f59e42" : "#aaa"}
                onPress={() => onToggleTrendScrap(t.id)}
              />
            </View>
          </TouchableOpacity>
        </Card>
      ))}

      <Text style={[styles.sectionTitle, styles.sectionPad]}>🏆 최고 트렌드 경험</Text>
      {rankedTrends.length === 0 && <Text style={styles.emptyText}>랭킹 데이터가 없습니다.</Text>}
      {rankedTrends.map((t, idx) => (
        <Card key={t.id} style={[styles.trendCard, idx === 0 ? { backgroundColor: "#f7fafc" } : {}]}>
          <TouchableOpacity onPress={() => onTrendView(t.id, t.category)}>
            <View style={styles.trendRow}>
              <View style={styles.scoreBox}>{getRankingMedal(idx)}</View>
              <View style={styles.trendInfo}>
                <Text style={styles.trendTitle}>{t.name}</Text>
                <Text style={styles.trendCategory}># {t.category}</Text>
                <Text style={{ color: "#888", fontWeight: "bold", fontSize: 16 }}>{t.score ?? "-"}</Text>
                <Text style={styles.trendDesc} numberOfLines={1}>
                  {t.description}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </Card>
      ))}
    </ScrollView>
  );
}