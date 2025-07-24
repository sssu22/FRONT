import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Card, Chip, ProgressBar, Button, Badge, Avatar } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// 감정 이모지 및 색 (10종)
const emotionIcons = {
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
const emotionColors = {
  joy: "#FDE68A",
  excitement: "#FCA5A5",
  nostalgia: "#DDD6FE",
  surprise: "#BAE6FD",
  love: "#FBCFE8",
  regret: "#F1F5F9",
  sadness: "#DBEAFE",
  irritation: "#FED7AA",
  anger: "#FECACA",
  embarrassment: "#E0E7FF",
};

// 경험 타입
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

interface ExperienceDetailProps {
  experience: Experience;
  allExperiences: Experience[];
  onClose: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  isLiked?: boolean;
  onToggleLike?: () => void;
}

// 트렌드 데이터, 댓글 mock 생성 함수
function generateTrendData(baseScore: number, date: string) {
  return {
    socialMediaMentions: Math.floor(baseScore * 1000 + Math.random() * 5000),
    economicImpact: Math.floor(baseScore * 100000 + Math.random() * 500000),
    userGrowth: Math.floor(baseScore * 10 + Math.random() * 50),
    peakPeriod: `${new Date(date).getFullYear()}년 ${new Date(date).getMonth() + 1}월`,
    marketSize: Math.floor(baseScore * 1000000 + Math.random() * 10000000),
    views: Math.floor(Math.random() * 10000) + 1000,
    likes: Math.floor(Math.random() * 500) + 50,
    comments: Math.floor(Math.random() * 100) + 10,
  };
}
const initialComments = [
  {
    id: "1",
    user: "트렌드헌터",
    avatar: "🌟",
    content: "저도 비슷한 경험 있어요! 정말 신선한 충격이었죠",
    time: "2시간 전",
    likes: 12,
  },
  {
    id: "2",
    user: "경험수집가",
    avatar: "🎯",
    content: "이 트렌드 점수 정말 높네요. 당시 얼마나 핫했는지 알 수 있어요",
    time: "5시간 전",
    likes: 8,
  },
  {
    id: "3",
    user: "첫경험러",
    avatar: "✨",
    content: "저는 아직 안 해봤는데 꼭 해보고 싶어졌어요!",
    time: "1일 전",
    likes: 15,
  },
];

export default function ExperienceDetail({
  experience,
  allExperiences,
  onClose,
  isBookmarked = false,
  onToggleBookmark,
  isLiked = false,
  onToggleLike,
}: ExperienceDetailProps) {
  const [newComment, setNewComment] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [likedComments, setLikedComments] = useState<{ [id: string]: boolean }>({});
  const trendData = generateTrendData(experience.trendScore, experience.date);

  // 추천 경험
  const relatedExperiences = allExperiences
    .filter(
      (exp) =>
        exp.id !== experience.id &&
        (exp.tags.some((tag) => experience.tags.includes(tag)) ||
          exp.emotion === experience.emotion)
    )
    .slice(0, 3);

  // 댓글 추가
  const handleAddComment = () => {
    if (!newComment.trim()) return;
    setComments([
      {
        id: Date.now().toString(),
        user: "나",
        avatar: "👤",
        content: newComment,
        time: "방금 전",
        likes: 0,
      },
      ...comments,
    ]);
    setNewComment("");
  };

  // 공유
  const handleShare = () => {
    Alert.alert("링크 복사됨", "경험 상세 링크가 복사되었습니다!");
  };

  // 댓글 좋아요
  const handleLikeComment = (id: string) => {
    setLikedComments((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <ScrollView style={styles.container}>
      {/* 상단 네비 */}
      <View style={styles.row}>
        <Button onPress={onClose} compact mode="text" icon="arrow-left">
          돌아가기
        </Button>
        <View style={{ flex: 1 }} />
        {onToggleBookmark && (
          <Button
            onPress={onToggleBookmark}
            icon={isBookmarked ? "bookmark" : "bookmark-outline"}
            compact
            mode={isBookmarked ? "contained" : "text"}
            style={isBookmarked && { backgroundColor: "#fbe2c7" }}
          >
            스크랩
          </Button>
        )}
        {onToggleLike && (
          <Button
            onPress={onToggleLike}
            icon={isLiked ? "heart" : "heart-outline"}
            compact
            mode={isLiked ? "contained" : "text"}
            style={isLiked && { backgroundColor: "#fbcfe8" }}
          >
            좋아요
          </Button>
        )}
        <Button onPress={handleShare} icon="share-variant" compact mode="text">
          공유
        </Button>
      </View>

      {/* 경험 헤더 */}
      <Text style={styles.title}>{experience.title}</Text>
      <View style={styles.infoRow}>
        <Text style={styles.emotion}>
          {emotionIcons[experience.emotion]} {experience.emotion}
        </Text>
        <Text style={styles.infoText}>• {experience.location}</Text>
        <Text style={styles.infoText}>• {experience.date}</Text>
      </View>
      <View style={styles.tagsRow}>
        {experience.tags.map((tag) => (
          <Chip key={tag} style={styles.chip}>
            #{tag}
          </Chip>
        ))}
      </View>

      {/* 내용 */}
      <Card style={styles.descCard}>
        <Card.Content>
          <Text style={styles.desc}>{experience.description}</Text>
        </Card.Content>
      </Card>

      {/* 트렌드 데이터 */}
      <View style={styles.trendBox}>
        <Text style={styles.sectionTitle}>트렌드 데이터</Text>
        <View style={styles.statRow}>
          <Text>인기도</Text>
          <ProgressBar
            progress={experience.trendScore / 100}
            color={emotionColors[experience.emotion]}
            style={styles.progressBar}
          />
          <Text style={styles.statVal}>{experience.trendScore}</Text>
        </View>
        <View style={styles.statsGroup}>
          <Text>소셜 언급 {trendData.socialMediaMentions}회</Text>
          <Text>경제 영향 {trendData.economicImpact}원</Text>
          <Text>사용자 증가 {trendData.userGrowth}%</Text>
        </View>
        <Text style={{ fontSize: 13 }}>
          최고점 {trendData.peakPeriod} (시장 규모 {trendData.marketSize}원)
        </Text>
        <Text style={styles.statEtc}>
          조회수 {trendData.views} · 좋아요 {trendData.likes} · 댓글 {trendData.comments}
        </Text>
      </View>

      {/* 댓글 */}
      <Text style={styles.sectionTitle}>댓글</Text>
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="댓글을 입력하세요"
          value={newComment}
          onChangeText={setNewComment}
        />
        <Button onPress={handleAddComment} compact mode="contained" style={styles.sendBtn}>
          등록
        </Button>
      </View>
      <FlatList
        data={comments}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <Text style={styles.avatar}>{item.avatar}</Text>
            <View style={styles.commentBody}>
              <Text style={{ fontWeight: "bold" }}>{item.user}</Text>
              <Text>{item.content}</Text>
              <View style={styles.commentMeta}>
                <Text style={{ fontSize: 12, color: "#AAA" }}>{item.time}</Text>
                <TouchableOpacity
                  onPress={() => handleLikeComment(item.id)}
                  style={{ marginLeft: 10 }}
                >
                  <Text style={{ color: likedComments[item.id] ? "#d33" : "#666" }}>
                    ♥ {item.likes + (likedComments[item.id] ? 1 : 0)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        style={{ marginBottom: 16 }}
        scrollEnabled={false}
      />

      {/* 유사 경험 */}
      {relatedExperiences.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>유사 경험</Text>
          {relatedExperiences.map((exp) => (
            <TouchableOpacity
              key={exp.id}
              style={styles.relatedCard}
              onPress={() => {
                onClose();
                setTimeout(() => {
                  // 부모에서 onExperienceClick(exp)를 직접 연결
                }, 300);
              }}
            >
              <Text style={{ fontWeight: "bold" }}>{exp.title}</Text>
              <Text style={{ color: "#666" }}>{exp.description}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", padding: 14 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 5 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 4, color: "#6D28D9" },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  emotion: { marginRight: 7, fontSize: 15 },
  infoText: { fontSize: 12, color: "#545" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6, gap: 4 },
  chip: { marginRight: 6, marginBottom: 4, backgroundColor: "#EFEFEF" },
  descCard: { marginBottom: 13, backgroundColor: "#FAF5FF" },
  desc: { fontSize: 16, color: "#333" },
  trendBox: { padding: 13, borderRadius: 8, marginBottom: 13, backgroundColor: "#f0f1fa" },
  sectionTitle: { fontWeight: "bold", fontSize: 17, marginTop: 8, marginBottom: 4 },
  statRow: { flexDirection: "row", alignItems: "center", marginVertical: 2 },
  progressBar: { flex: 1, height: 8, marginHorizontal: 8, borderRadius: 4, backgroundColor: "#eee" },
  statVal: { width: 36, textAlign: "right" },
  statsGroup: { flexDirection: "row", justifyContent: "space-between", marginBottom: 7 },
  statEtc: { fontSize: 12, color: "#888", marginTop: 2 },
  commentInputRow: { flexDirection: "row", alignItems: "center", marginBottom: 7 },
  commentInput: { flex: 1, borderColor: "#ececec", borderWidth: 1, borderRadius: 4, padding: 8, backgroundColor: "#fafafa" },
  sendBtn: { marginLeft: 8 },
  commentItem: { flexDirection: "row", alignItems: "flex-start", marginBottom: 10 },
  avatar: { fontSize: 18, marginRight: 9, marginTop: 2 },
  commentBody: { marginLeft: 2, flex: 1 },
  commentMeta: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  relatedCard: { backgroundColor: "#e0e7ff", padding: 10, borderRadius: 8, marginBottom: 8 },
});
