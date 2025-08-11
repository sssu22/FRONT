// ProfileTab.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
} from "react-native";
import { Card, Button, IconButton } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import ProfileEdit from "./ProfileEdit";
import TrendAnalysis from "./TrendAnalsis";

type EmotionType =
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

interface UserType {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

interface UserActivity {
  views: string[];
  searches: string[];
  trendViews: string[];
  categoryInterests: Record<string, number>;
}

interface ProfileTabProps {
  experiences: Experience[];
  onExperienceClick: (exp: Experience) => void;
  onLogout: () => void;
  onShowScraps: () => void;
  user: UserType;
  scrappedCount: number;
  userActivity: UserActivity;
}

export default function ProfileTab({
                                     experiences,
                                     onExperienceClick,
                                     onLogout,
                                     onShowScraps,
                                     user,
                                     scrappedCount,
                                     userActivity,
                                   }: ProfileTabProps) {
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);

  const totalTrendScore = experiences.reduce((sum, e) => sum + e.trendScore, 0);
  const avgTrendScore = experiences.length
      ? Math.round(totalTrendScore / experiences.length)
      : 0;
  const uniqueLocations = new Set(experiences.map((e) => e.location)).size;
  const totalViews = userActivity.views.length;
  const interestCategories = Object.entries(userActivity.categoryInterests)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 2)
      .map(([cat]) => cat)
      .join(", ") || "없음";

  return (
      <ScrollView contentContainerStyle={styles.container}>
        {/* 프로필 헤더 */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.avatar ? "👤" : user.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{user.name}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          <IconButton
              icon={() => <Ionicons name="settings-outline" size={22} color="#7C3AED" />}
              onPress={() => setShowProfileEdit(true)}
              style={{ marginLeft: "auto" }}
          />
        </View>

        {/* 활동 요약 */}
        <Text style={styles.sectionTitle}>내 활동 요약</Text>
        <View style={styles.grid}>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{experiences.length}</Text>
            <Text style={styles.statLabel}>총 경험</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{avgTrendScore}</Text>
            <Text style={styles.statLabel}>평균 트렌드</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{uniqueLocations}</Text>
            <Text style={styles.statLabel}>방문 지역</Text>
          </Card>
          <Card style={styles.statCard}>
            <Text style={styles.statValue}>{scrappedCount}</Text>
            <Text style={styles.statLabel}>스크랩</Text>
          </Card>
        </View>

        {/* 분석 카드 */}
        <Card style={styles.analysisCard}>
          <Text style={styles.sectionTitle}>개인 분석 요약</Text>
          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>총 조회수</Text>
            <Text style={styles.analysisValue}>{totalViews}회</Text>
          </View>
          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>관심 카테고리</Text>
            <Text style={styles.analysisValue}>{interestCategories}</Text>
          </View>
          <View style={styles.analysisRow}>
            <Text style={styles.analysisLabel}>검색 횟수</Text>
            <Text style={styles.analysisValue}>{userActivity.searches.length}회</Text>
          </View>
          <Button
              mode="outlined"
              onPress={() => setShowAnalysisReport(true)}
              style={{ marginTop: 10 }}
          >
            상세 분석 보고서 보기
          </Button>
        </Card>

        {/* 최근 활동 */}
        <Card style={styles.recentCard}>
          <Text style={styles.sectionTitle}>최근 활동</Text>
          {experiences.length === 0 ? (
              <Text style={styles.emptyText}>아직 경험이 없습니다</Text>
          ) : (
              experiences.slice(0, 5).map((exp) => (
                  <TouchableOpacity
                      key={exp.id}
                      style={styles.activityItem}
                      onPress={() => onExperienceClick(exp)}
                  >
                    <Text style={styles.emotionIcon}>{emotionIcons[exp.emotion]}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.activityTitle}>{exp.title}</Text>
                      <Text style={styles.activityDate}>
                        {new Date(exp.date).toLocaleDateString("ko-KR")} • {exp.location}
                      </Text>
                    </View>
                    <Text style={styles.scoreText}>{exp.trendScore}점</Text>
                  </TouchableOpacity>
              ))
          )}
        </Card>

        {/* 하단 버튼 */}
        <View style={styles.buttonContainer}>
          <Button mode="outlined" onPress={onShowScraps} style={styles.actionButton}>
            스크랩 보기
          </Button>
          <Button
              mode="outlined"
              onPress={() => setShowAnalysisReport(true)}
              style={styles.actionButton}
          >
            개인 분석 보고서
          </Button>
          <Button
              mode="outlined"
              onPress={() => setShowProfileEdit(true)}
              style={styles.actionButton}
          >
            프로필 편집
          </Button>
          <Button mode="contained" onPress={onLogout} style={styles.logoutButton}>
            로그아웃
          </Button>
        </View>

        {/* 모달: 프로필 편집 */}
        <Modal
            visible={showProfileEdit}
            onRequestClose={() => setShowProfileEdit(false)}
            animationType="slide"
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <ProfileEdit onClose={() => setShowProfileEdit(false)} />
          </SafeAreaView>
        </Modal>

        {/* ✅ 상세 분석 보고서 모달 (첫 경험만 보여줌) */}
        <Modal
            visible={showAnalysisReport}
            animationType="slide"
            onRequestClose={() => setShowAnalysisReport(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <ScrollView contentContainerStyle={{ padding: 14 }}>
              {experiences.length > 0 && (
                  <TrendAnalysis experiences={[experiences[0]]} detailed />
              )}
              <Button
                  mode="contained"
                  onPress={() => setShowAnalysisReport(false)}
                  style={{ marginTop: 20 }}
              >
                닫기
              </Button>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "bold" },
  profileInfo: { flex: 1 },
  username: { fontSize: 20, fontWeight: "bold", marginBottom: 2, color: "#374151" },
  email: { fontSize: 14, color: "#6b7280" },
  sectionTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 12, color: "#6b21a8" },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    width: "48%",
    borderRadius: 12,
    paddingVertical: 20,
    marginBottom: 12,
    backgroundColor: "#f9f9ff",
    justifyContent: "center",
    alignItems: "center",
  },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#7c3aed", textAlign: "center" },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 6, textAlign: "center" },
  analysisCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  analysisRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 4 },
  analysisLabel: { fontSize: 14, color: "#374151" },
  analysisValue: { fontSize: 14, fontWeight: "bold", color: "#6b21a8" },
  recentCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  emptyText: { color: "#999", textAlign: "center", marginVertical: 12 },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f1f1",
  },
  emotionIcon: { fontSize: 24, marginRight: 12 },
  activityTitle: { fontWeight: "600", fontSize: 15, color: "#374151" },
  activityDate: { fontSize: 12, color: "#6b7280" },
  scoreText: { color: "#7c3aed", fontWeight: "600", fontSize: 13 },
  buttonContainer: { marginTop: 8 },
  actionButton: { marginBottom: 12 },
  logoutButton: { backgroundColor: "#dc2626" },
});
