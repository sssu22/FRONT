// sssu22/front/FRONT-feature-UI-API2-/screens/ProfileTab.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Card, Button, IconButton, Avatar } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import ProfileEdit from "./ProfileEdit";
import { Experience, User, EmotionType } from "../types";
import { useGlobalContext } from "../GlobalContext";
import { usersApi, UserStats } from "../utils/apiUtils";
import { useIsFocused } from '@react-navigation/native';

const emotionIcons: Record<EmotionType, string> = {
  joy: "😊", excitement: "🔥", nostalgia: "💭", surprise: "😲", love: "💖",
  disappointment: "😞", sadness: "😢", annoyance: "😒", anger: "😡", embarrassment: "😳",
};

interface ProfileTabProps {
  onExperienceClick: (exp: Experience) => void;
  onLogout: () => void;
  onShowScraps: () => void;
}

export default function ProfileTab({
                                     onExperienceClick,
                                     onLogout,
                                     onShowScraps,
                                   }: ProfileTabProps) {
  const { user } = useGlobalContext();
  const isFocused = useIsFocused();
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [profileData, setProfileData] = useState<Partial<User> | null>(null);
  const [recentPosts, setRecentPosts] = useState<Experience[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (user && isFocused) {
        setLoading(true);
        try {
          const [statsData, recentData, profileInfo] = await Promise.all([
            usersApi.getMyStats(),
            usersApi.getMyRecentPosts(),
            usersApi.getMyProfile(),
          ]);
          setStats(statsData);
          setRecentPosts(recentData);
          setProfileData(profileInfo);
        } catch (error) {
          console.error("프로필 데이터 로딩 실패:", error);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [user, isFocused]);


  if (!user) {
    return null;
  }

  const userInitial = profileData?.name ? profileData.name.charAt(0).toUpperCase() : (user.name ? user.name.charAt(0).toUpperCase() : "");

  const StatItem = ({ label, value }: { label: string, value: number | undefined }) => (
      <Card style={styles.statCard}>
        {loading ? (
            <ActivityIndicator color="#7c3aed" />
        ) : (
            <Text style={styles.statValue}>{value ?? 0}</Text>
        )}
        <Text style={styles.statLabel}>{label}</Text>
      </Card>
  );

  const formatDate = (dateString?: string) => {
    if (!dateString) return '가입일 정보 없음';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return '가입일 정보 없음';
    }
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일에 가입`;
  };

  return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          {profileData?.profileImageUrl ? (
              <Avatar.Image size={72} source={{ uri: profileData.profileImageUrl }} />
          ) : (
              <Avatar.Text size={72} label={userInitial} />
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.username}>{profileData?.name || user.name}</Text>
            <Text style={styles.stateMessage} numberOfLines={1}>{profileData?.stateMessage || '자기소개를 입력해주세요.'}</Text>
            <Text style={styles.signupDate}>{formatDate(profileData?.signUpDate)}</Text>
          </View>
          <IconButton
              icon={() => <Ionicons name="settings-outline" size={22} color="#7C3AED" />}
              onPress={() => setShowProfileEdit(true)}
              style={{ marginLeft: "auto" }}
          />
        </View>

        <Text style={styles.sectionTitle}>내 활동 요약</Text>
        <View style={styles.grid}>
          <StatItem label="총 경험" value={stats?.postCount} />
          <StatItem label="평균 트렌드" value={stats?.averageScore} />
          <StatItem label="방문 지역" value={stats?.visitPlaceCount} />
          <StatItem label="스크랩" value={stats?.scrapCount} />
        </View>

        <Card style={styles.recentCard}>
          <Text style={styles.sectionTitle}>최근 활동</Text>
          {loading ? (
              <ActivityIndicator style={{ marginVertical: 20 }} />
          ) : recentPosts.length === 0 ? (
              <Text style={styles.emptyText}>아직 경험이 없습니다</Text>
          ) : (
              recentPosts.map((exp) => (
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
  profileInfo: { flex: 1, marginLeft: 16 },
  username: { fontSize: 20, fontWeight: "bold", marginBottom: 4, color: "#374151" },
  stateMessage: { fontSize: 14, color: "#4b5563", marginBottom: 6 },
  signupDate: { fontSize: 12, color: "#6b7280" },
  sectionTitle: { fontWeight: "bold", fontSize: 18, marginBottom: 12, color: "#6b21a8" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 16, },
  statCard: { width: "48%", borderRadius: 12, paddingVertical: 20, marginBottom: 12, backgroundColor: "#f9f9ff", justifyContent: "center", alignItems: "center", minHeight: 90 },
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