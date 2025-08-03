// ProfileTab.tsx
import React, { useState } from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { Card, Button } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

// 경험 데이터 타입 (id를 number로 통일)
export interface Experience {
  id: number;
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

interface ProfileTabProps {
  experiences: Experience[];
  onExperienceClick: (exp: Experience) => void;
  onLogout: () => void;
}

export default function ProfileTab({
  experiences,
  onExperienceClick,
  onLogout,
}: ProfileTabProps) {
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [showAnalysisReport, setShowAnalysisReport] = useState(false);

  // 주요 통계 계산
  const totalTrendScore = experiences.reduce((sum, e) => sum + e.trendScore, 0);
  const avgTrendScore = experiences.length
    ? Math.round(totalTrendScore / experiences.length)
    : 0;
  const uniqueLocations = new Set(experiences.map((e) => e.location)).size;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* 주요 통계 */}
      <View style={styles.statsGrid}>
        <StatCard label="총 경험" value={experiences.length.toString()} />
        <StatCard label="평균 트렌드 점수" value={avgTrendScore.toString()} />
        <StatCard label="방문 지역" value={uniqueLocations.toString()} />
      </View>

      {/* 최근 경험 */}
      <Text style={styles.sectionTitle}>최근 경험</Text>
      {experiences.length === 0 ? (
        <Text style={styles.emptyText}>아직 경험이 없습니다.</Text>
      ) : (
        experiences.slice(0, 3).map((exp) => (
          <TouchableOpacity
            key={exp.id}
            style={styles.activityItem}
            onPress={() => onExperienceClick(exp)}
          >
            <Text style={styles.activityTitle}>{exp.title}</Text>
            <Text style={styles.activityDate}>
              {new Date(exp.date).toLocaleDateString("ko-KR")}
            </Text>
          </TouchableOpacity>
        ))
      )}

      {/* 액션 버튼 */}
      <View style={styles.buttonContainer}>
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
        <Button
          mode="contained"
          onPress={onLogout}
          style={[styles.actionButton, styles.logoutButton]}
        >
          로그아웃
        </Button>
      </View>

      {/* 프로필 편집 모달 (내용은 나중에 구현) */}
      <Modal
        visible={showProfileEdit}
        onRequestClose={() => setShowProfileEdit(false)}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>프로필 편집</Text>
            <Text style={styles.modalContent}>
              프로필 편집 기능은 추후 구현됩니다.
            </Text>
            <Button onPress={() => setShowProfileEdit(false)}>닫기</Button>
          </View>
        </View>
      </Modal>

      {/* 개인 분석 보고서 모달 (내용은 나중에 구현) */}
      <Modal
        visible={showAnalysisReport}
        onRequestClose={() => setShowAnalysisReport(false)}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>개인 분석 보고서</Text>
            <Text style={styles.modalContent}>
              분석 보고서 기능은 추후 구현됩니다.
            </Text>
            <Button onPress={() => setShowAnalysisReport(false)}>닫기</Button>
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
  container: { padding: 16, backgroundColor: "#FFFFFF" },
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
  },
  statCardContent: {
    alignItems: "center",
    padding: 16,
  },
  statValue: { fontSize: 28, fontWeight: "bold", color: "#6B21A8" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 4, textAlign: "center" },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#6B21A8",
  },
  emptyText: {
    textAlign: "center",
    color: "#6B7280",
    marginBottom: 20,
  },

  activityItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  activityTitle: { fontSize: 16, fontWeight: "600", color: "#374151" },
  activityDate: { fontSize: 12, color: "#6B7280", marginTop: 4 },

  buttonContainer: { marginTop: 16 },
  actionButton: { marginBottom: 12 },
  logoutButton: { backgroundColor: "#DC2626" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderRadius: 16,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 16 },
  modalContent: { fontSize: 14, color: "#6B7280", marginBottom: 20, textAlign: "center" },
});
