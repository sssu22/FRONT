// screens/PostDetailScreen.tsx - 완전한 버전
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { postsApi } from "../utils/apiUtils";

interface PostDetailScreenProps {
  postId: number;
  onClose: () => void;
}

interface Experience {
  id: number;
  title: string;
  description: string;
  emotion: string;
  location: string;
  date: string;
  tags: string[];
  trendName?: string;
  trendScore?: number;
  latitude?: number;
  longitude?: number;
}

// 감정 아이콘 매핑
const emotionIcons: Record<string, string> = {
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
  JOY: "😊",
  EXCITEMENT: "🔥",
  NOSTALGIA: "💭", 
  SURPRISE: "😲",
  LOVE: "💖",
  REGRET: "😞",
  SADNESS: "😢",
  IRRITATION: "😒",
  ANGER: "😡",
  EMBARRASSMENT: "😳",
};

// 감정 라벨 매핑
const emotionLabels: Record<string, string> = {
  joy: "기쁨",
  excitement: "흥분",
  nostalgia: "향수", 
  surprise: "놀라움",
  love: "사랑",
  regret: "아쉬움",
  sadness: "슬픔",
  irritation: "짜증",
  anger: "화남",
  embarrassment: "당황",
  JOY: "기쁨",
  EXCITEMENT: "흥분",
  NOSTALGIA: "향수",
  SURPRISE: "놀라움", 
  LOVE: "사랑",
  REGRET: "아쉬움",
  SADNESS: "슬픔",
  IRRITATION: "짜증",
  ANGER: "화남",
  EMBARRASSMENT: "당황",
};

export default function PostDetailScreen({
  postId,
  onClose,
}: PostDetailScreenProps) {
  const [data, setData] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPost = async () => {
    try {
      setLoading(true);
      console.log("📖 게시글 상세 조회:", postId);
      const appData = await postsApi.getById(postId);
      console.log("✅ 게시글 상세 데이터:", appData);
      setData(appData);
    } catch (error) {
      console.error("❌ 게시글 상세 조회 실패:", error);
      Alert.alert("에러", "게시글 정보를 불러오지 못했습니다.");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (postId) {
      fetchPost();
    } else {
      setData(null);
      setLoading(false);
    }
  }, [postId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>게시글을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        <View style={styles.centered}>
          <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>게시글을 찾을 수 없습니다</Text>
          <Text style={styles.errorSubtitle}>삭제되었거나 접근할 수 없는 게시글입니다</Text>
        </View>
      </SafeAreaView>
    );
  }

  const emotionIcon = emotionIcons[data.emotion] || "😊";
  const emotionLabel = emotionLabels[data.emotion] || data.emotion;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#6B7280" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>게시글 상세</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* 제목과 감정 */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{data.title}</Text>
            <View style={styles.emotionBadge}>
              <Text style={styles.emotionIcon}>{emotionIcon}</Text>
              <Text style={styles.emotionText}>{emotionLabel}</Text>
            </View>
          </View>

          {/* 메타 정보 */}
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>{data.location}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={16} color="#6B7280" />
              <Text style={styles.metaText}>
                {new Date(data.date).toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "short"
                })}
              </Text>
            </View>
            {data.trendScore && (
              <View style={styles.metaRow}>
                <Ionicons name="trending-up" size={16} color="#7C3AED" />
                <Text style={[styles.metaText, { color: "#7C3AED", fontWeight: "600" }]}>
                  트렌드 점수: {data.trendScore}
                </Text>
              </View>
            )}
          </View>

          {/* 태그 */}
          {data.tags && data.tags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.sectionTitle}>태그</Text>
              <View style={styles.tagsContainer}>
                {data.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 내용 */}
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>경험 내용</Text>
            <View style={styles.descriptionBox}>
              <Text style={styles.description}>{data.description}</Text>
            </View>
          </View>

          {/* 트렌드 정보 */}
          {data.trendName && (
            <View style={styles.trendSection}>
              <Text style={styles.sectionTitle}>관련 트렌드</Text>
              <View style={styles.trendBox}>
                <Ionicons name="trending-up-outline" size={20} color="#7C3AED" />
                <Text style={styles.trendName}>{data.trendName}</Text>
              </View>
            </View>
          )}

          {/* 위치 정보 */}
          {data.latitude && data.longitude && (
            <View style={styles.locationSection}>
              <Text style={styles.sectionTitle}>위치 정보</Text>
              <View style={styles.coordinatesBox}>
                <Text style={styles.coordinatesText}>
                  위도: {data.latitude.toFixed(6)}
                </Text>
                <Text style={styles.coordinatesText}>
                  경도: {data.longitude.toFixed(6)}
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#6B7280",
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 16,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 8,
    textAlign: "center",
  },
  
  // 제목 섹션
  titleSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1F2937",
    lineHeight: 36,
    marginBottom: 12,
  },
  emotionBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  emotionIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  emotionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6366F1",
  },

  // 메타 정보
  metaSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: "#4B5563",
    marginLeft: 8,
    fontWeight: "500",
  },

  // 섹션 제목
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },

  // 태그 섹션
  tagsSection: {
    marginBottom: 24,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tagText: {
    fontSize: 13,
    color: "#6366F1",
    fontWeight: "500",
  },

  // 설명 섹션
  descriptionSection: {
    marginBottom: 24,
  },
  descriptionBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: "#374151",
  },

  // 트렌드 섹션
  trendSection: {
    marginBottom: 24,
  },
  trendBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#7C3AED",
  },
  trendName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7C3AED",
    marginLeft: 8,
  },

  // 위치 섹션
  locationSection: {
    marginBottom: 24,
  },
  coordinatesBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  coordinatesText: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
    fontFamily: "monospace",
  },
});