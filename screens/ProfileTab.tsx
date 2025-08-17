// sssu22/front/FRONT-feature-4/screens/ProfileTab.tsx

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
import { Card, Button, IconButton, Avatar } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import ProfileEdit from "./ProfileEdit";
import { Experience, User, EmotionType } from "../types";
import { useGlobalContext } from "../GlobalContext";

// ✅ **수정된 부분**: ImagePicker와 API 관련 import 제거
// import * as ImagePicker from 'expo-image-picker';
// import { usersApi, authApi } from "../utils/apiUtils";

const emotionIcons: Record<EmotionType, string> = {
  joy: "😊", excitement: "🔥", nostalgia: "💭", surprise: "😲", love: "💖",
  regret: "😞", sadness: "😢", irritation: "😒", anger: "😡", embarrassment: "😳",
};

interface ProfileTabProps {
  experiences: Experience[];
  onExperienceClick: (exp: Experience) => void;
  onLogout: () => void;
  onShowScraps: () => void;
  scrappedCount: number;
}

export default function ProfileTab({
                                     experiences,
                                     onExperienceClick,
                                     onLogout,
                                     onShowScraps,
                                     scrappedCount,
                                   }: ProfileTabProps) {
  const { user } = useGlobalContext(); // ✅ **수정된 부분**: setUser는 더 이상 필요 없음
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  // ✅ **수정된 부분**: isUploading 상태 제거
  // const [isUploading, setIsUploading] = useState(false);

  // ✅ **수정된 부분**: handleSelectImage 함수 전체 제거

  if (!user) {
    return null;
  }

  const totalTrendScore = experiences.reduce((sum, e) => sum + e.trendScore, 0);
  const avgTrendScore = experiences.length
      ? Math.round(totalTrendScore / experiences.length)
      : 0;
  const uniqueLocations = new Set(experiences.map((e) => e.location)).size;
  const userName = user.name || "";
  const userInitial = userName ? userName.charAt(0).toUpperCase() : "";

  return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          {/* ✅ **수정된 부분**: TouchableOpacity 및 로딩 오버레이 제거, 단순 이미지 표시 */}
          {user.profileImageUrl ? (
              <Avatar.Image size={72} source={{ uri: user.profileImageUrl }} />
          ) : (
              <Avatar.Text size={72} label={userInitial} style={styles.avatarTextContainer} />
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{userName}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>
          <IconButton
              icon={() => <Ionicons name="settings-outline" size={22} color="#7C3AED" />}
              onPress={() => setShowProfileEdit(true)}
              style={{ marginLeft: "auto" }}
          />
        </View>

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

        <View style={styles.buttonContainer}>
          <Button mode="outlined" onPress={onShowScraps} style={styles.actionButton}>
            스크랩 보기
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

        <Modal
            visible={showProfileEdit}
            onRequestClose={() => setShowProfileEdit(false)}
            animationType="slide"
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
            <ProfileEdit onClose={() => setShowProfileEdit(false)} />
          </SafeAreaView>
        </Modal>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16, },
  avatarTextContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#8b5cf6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: { flex: 1 },
  username: { fontSize: 20, fontWeight: "bold", marginBottom: 2, color: "#374151" },
  email: { fontSize: 14, color: "#6b7280" },
  sectionTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 12, color: "#6b21a8" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16, },
  statCard: { width: "48%", borderRadius: 12, paddingVertical: 20, marginBottom: 12, backgroundColor: "#f9f9ff", justifyContent: "center", alignItems: "center", },
  statValue: { fontSize: 20, fontWeight: "bold", color: "#7c3aed", textAlign: "center" },
  statLabel: { fontSize: 12, color: "#6b7280", marginTop: 6, textAlign: "center" },
  recentCard: { borderRadius: 12, padding: 16, marginBottom: 16 },
  emptyText: { color: "#999", textAlign: "center", marginVertical: 12 },
  activityItem: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f1f1", },
  emotionIcon: { fontSize: 24, marginRight: 12 },
  activityTitle: { fontWeight: "600", fontSize: 15, color: "#374151" },
  activityDate: { fontSize: 12, color: "#6b7280" },
  scoreText: { color: "#7c3aed", fontWeight: "600", fontSize: 13 },
  buttonContainer: { marginTop: 8 },
  actionButton: { marginBottom: 12 },
  logoutButton: { backgroundColor: "#dc2626" },
});