import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Card, Button } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

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
  trend?: {
    id: string;
    name: string;
    description: string;
    category: string;
    popularity: number;
    createdAt: string;
  };
}

interface UserActivity {
  likes: string[];
  searches: string[];
  views: string[];
  viewCounts: Record<string, number>;
  trendViews: string[];
  categoryInterests: Record<string, number>;
}

interface UserType {
  id: string;
  email: string;
  name: string;
  avatar?: string;
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

// 성취 배지 데이터 예시
const achievements = [
  {
    id: "first_experience",
    title: "첫 걸음",
    description: "첫 경험을 기록했어요",
    earned: (experiences: Experience[]) => experiences.length >= 1,
    icon: "🌟",
  },
  {
    id: "trend_master",
    title: "트렌드 마스터",
    description: "평균 트렌드 점수 80점 달성",
    earned: (experiences: Experience[]) => {
      if (experiences.length === 0) return false;
      const avg = experiences.reduce((acc, e) => acc + e.trendScore, 0) / experiences.length;
      return avg >= 80;
    },
    icon: "🏆",
  },
  {
    id: "active_user",
    title: "활발한 사용자",
    description: "100회 이상 콘텐츠 조회",
    earned: (_experiences: Experience[], userActivity?: UserActivity) => {
      if (!userActivity) return false;
      return Object.values(userActivity.viewCounts).reduce((a, b) => a + b, 0) >= 100;
    },
    icon: "👀",
  },
];

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
  const avgTrendScore = experiences.length ? Math.round(totalTrendScore / experiences.length) : 0;
  const uniqueLocations = new Set(experiences.map((e) => e.location)).size;

  // 성취 배지 계산
  const earnedAchievements = achievements.filter((ach) => {
    // 함수 시그니처 확인하여 userActivity 매개변수 필요 여부 결정
    try {
      if (ach.earned.length > 1) {
        return ach.earned(experiences, userActivity);
      } else {
        return ach.earned(experiences);
      }
    } catch (error) {
      return false;
    }
  });

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
      </View>

      {/* 주요 통계 */}
      <View style={styles.statsGrid}>
        <StatCard label="총 경험" value={experiences.length.toString()} />
        <StatCard label="평균 트렌드 점수" value={avgTrendScore.toString()} />
        <StatCard label="방문 지역" value={uniqueLocations.toString()} />
        <StatCard label="나의 스크랩" value={scrappedCount.toString()} />
      </View>

      {/* 최근 활동 */}
      <Text style={styles.sectionTitle}>최근 활동</Text>
      {experiences.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>아직 경험이 없습니다</Text>
        </View>
      ) : (
        experiences.slice(0, 3).map((exp) => (
          <TouchableOpacity
            key={exp.id}
            style={styles.activityItem}
            onPress={() => onExperienceClick(exp)}
          >
            <Text style={styles.emotionIcon}>{emotionIcons[exp.emotion]}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.activityTitle}>{exp.title}</Text>
              <Text style={styles.activityDate}>
                {new Date(exp.date).toLocaleDateString("ko-KR")}
              </Text>
            </View>
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreBadgeText}>{exp.trendScore}점</Text>
            </View>
          </TouchableOpacity>
        ))
      )}

      {/* 성취 배지 */}
      <Text style={styles.sectionTitle}>성취 배지</Text>
      {earnedAchievements.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>아직 획득한 배지가 없습니다</Text>
        </View>
      ) : (
        <View style={styles.badgesContainer}>
          {earnedAchievements.map((ach) => (
            <View key={ach.id} style={styles.badgeItem}>
              <Text style={{ fontSize: 24 }}>{ach.icon}</Text>
              <Text style={styles.badgeTitle}>{ach.title}</Text>
              <Text style={styles.badgeDesc}>{ach.description}</Text>
            </View>
          ))}
        </View>
      )}

      {/* 액션 버튼 */}
      <View style={styles.buttonContainer}>
        <Button mode="outlined" onPress={onShowScraps} style={styles.actionButton}>
          나의 스크랩 ({scrappedCount})
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

      {/* 프로필 편집 모달 */}
      <Modal 
        visible={showProfileEdit} 
        onRequestClose={() => setShowProfileEdit(false)} 
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>프로필 편집</Text>
            <Text style={styles.modalContent}>프로필 편집 기능이 여기에 구현됩니다.</Text>
            <Button mode="contained" onPress={() => setShowProfileEdit(false)}>
              닫기
            </Button>
          </View>
        </View>
      </Modal>

      {/* 개인 분석 보고서 모달 */}
      <Modal 
        visible={showAnalysisReport} 
        onRequestClose={() => setShowAnalysisReport(false)} 
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>개인 분석 보고서</Text>
            <Text style={styles.modalContent}>개인 분석 보고서가 여기에 표시됩니다.</Text>
            <Button mode="contained" onPress={() => setShowAnalysisReport(false)}>
              닫기
            </Button>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// 통계 카드 컴포넌트
function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.statCard}>
      <View style={styles.statCardContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
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
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statCardContent: {
    alignItems: "center",
    padding: 16,
  },
  statValue: { fontSize: 28, fontWeight: "bold", color: "#6b21a8" },
  statLabel: { fontSize: 12, color: "#6b7280", textAlign: "center", marginTop: 4 },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 18,
    marginBottom: 12,
    color: "#6b21a8",
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  emotionIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  activityTitle: { 
    fontWeight: "600", 
    fontSize: 16, 
    flex: 1,
    color: "#374151",
  },
  activityDate: { 
    fontSize: 12, 
    color: "#6b7280", 
    marginTop: 4 
  },
  scoreBadge: {
    backgroundColor: "#ede9fe",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  scoreBadgeText: {
    color: "#7c3aed",
    fontSize: 12,
    fontWeight: "600",
  },
  badgesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  badgeItem: {
    width: "48%",
    backgroundColor: "#f3e8ff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9d5ff",
  },
  badgeTitle: { 
    fontWeight: "bold", 
    fontSize: 14, 
    marginTop: 8, 
    color: "#6b21a8",
    textAlign: "center",
  },
  badgeDesc: { 
    fontSize: 11, 
    textAlign: "center", 
    marginTop: 4, 
    color: "#6b7280" 
  },
  emptyState: {
    padding: 20,
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    marginBottom: 20,
  },
  emptyText: {
    color: "#6b7280",
    fontSize: 14,
  },
  buttonContainer: {
    marginTop: 8,
  },
  actionButton: {
    marginBottom: 12,
  },
  logoutButton: {
    marginBottom: 20,
    backgroundColor: "#dc2626",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#fff",
    padding: 24,
    borderRadius: 16,
    marginHorizontal: 30,
    minWidth: 300,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#374151",
    textAlign: "center",
  },
  modalContent: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 20,
  },
});