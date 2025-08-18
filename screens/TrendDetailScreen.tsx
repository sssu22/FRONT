// TrendDetailScreen.tsx
import React, {
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { trendsApi, commentsApi } from "../utils/apiUtils";
import { useGlobalContext } from "../GlobalContext";
import { Trend, Comment } from "../types";

// --- 컴포넌트 및 프롭 정의 (기존과 동일) ---

interface TrendDetailScreenProps {
  trendId: number;
  onClose: () => void;
  onNavigateToTrend: (trendId: number) => void;
}

const CommentItem = ({ comment, trendId, currentUserId, onDeleteSuccess}: {
  comment: Comment,
  trendId: number,
  currentUserId: string | undefined,
  onDeleteSuccess: () => void,
}) => {
  const [isLiked, setIsLiked] = useState(comment.liked || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount || 0);

  const commentId = comment.id || comment.commentId || comment._id;

  const isMyComment = comment.userId === currentUserId || String(comment.userId) === String(currentUserId);

  const handleDeleteComment = () => {
    if (!commentId) {
      Alert.alert("오류", "댓글 ID를 찾을 수 없습니다.");
      return;
    }

    Alert.alert("댓글 삭제", "정말 이 댓글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제", style: "destructive",
        onPress: async () => {
          try {
            await commentsApi.deleteForTrend(trendId, commentId);
            onDeleteSuccess();
          } catch (error) {
            console.error('댓글 삭제 오류:', error);
            Alert.alert("오류", "댓글 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const handleLikeComment = async () => {
    if (!commentId) {
      Alert.alert("오류", "댓글 ID를 찾을 수 없습니다.");
      return;
    }

    const originalLiked = isLiked;
    const originalLikeCount = likeCount;

    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      const response = await commentsApi.likeForTrend(commentId);
      if (response?.data) {
        setIsLiked(response.data.liked || response.data.isLiked || !originalLiked);
        setLikeCount(response.data.likeCount || (isLiked ? likeCount - 1 : likeCount + 1));
      }
    } catch (error) {
      console.error('댓글 좋아요 처리 오류:', error);
      setIsLiked(originalLiked);
      setLikeCount(originalLikeCount);
      Alert.alert("오류", "좋아요 처리에 실패했습니다.");
    }
  };

  const formatTime = (timeString: string) => {
    return timeString || "시간 정보 없음";
  };

  return (
      <View style={styles.commentItem}>
        <Image
            source={comment.authorProfileImageUrl
                ? { uri: comment.authorProfileImageUrl }
                : { uri: 'https://placehold.co/64x64/E0E0E0/FFFFFF?text=?' }
            }
            style={styles.commentAvatar}
        />
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>
              {comment.username || comment.authorName || '사용자'}
            </Text>
            <Text style={styles.commentTime}>
              {formatTime(comment.createAt || comment.createdAt || new Date().toISOString())}
            </Text>
            {isMyComment && (
                <TouchableOpacity style={styles.commentActionButton} onPress={handleDeleteComment}>
                  <Ionicons name="trash-outline" size={14} color="#E91E63" />
                </TouchableOpacity>
            )}
          </View>
          <Text style={styles.commentContent}>{comment.content}</Text>

          <View style={styles.commentFooter}>
            <TouchableOpacity style={styles.commentLikeButton} onPress={handleLikeComment}>
              <Ionicons name={isLiked ? "heart" : "heart-outline"} size={16} color={isLiked ? "#E91E63" : "#999"} />
              {likeCount > 0 && (
                  <Text style={[styles.commentLikeCount, { color: isLiked ? "#E91E63" : "#999" }]}>
                    {likeCount}
                  </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
  );
};

// --- 메인 트렌드 상세 화면 컴포넌트 ---

export default function TrendDetailScreen({ trendId, onClose, onNavigateToTrend }: TrendDetailScreenProps) {
  // ✨ 1. GlobalContext에서 스크랩 관련 상태와 함수 가져오기
  const { user, scrappedTrends, toggleTrendScrap, setTrendScrapStatus } = useGlobalContext();

  const [trend, setTrend] = useState<Trend | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  // ✨ 2. 로컬 isScrapped 상태 제거
  // const [isScrapped, setIsScrapped] = useState(false);

  // ✨ 3. GlobalContext의 scrappedTrends를 사용하여 스크랩 상태 결정
  const isScrapped = scrappedTrends.has(trendId);

  const generateTrendColor = useCallback((id: number) => {
    const colors = [
      '#7C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444',
      '#8B5CF6', '#06B6D4', '#84CC16', '#F97316', '#EC4899',
      '#6366F1', '#14B8A6',
    ];
    return colors[id % colors.length];
  }, []);

  const fetchTrendDetail = useCallback(async () => {
    try {
      setLoading(true);
      const trendData = await trendsApi.getById(trendId);
      setTrend(trendData);
      setLikeCount(trendData.likeCount || 0);
      setIsLiked(trendData.liked || trendData.isLiked || trendData.userLiked || false);

      // ✨ 4. API 응답으로 받은 스크랩 상태를 GlobalContext에 동기화
      const initialScrapStatus = trendData.scrapped || trendData.isScrapped || trendData.userScrapped || false;
      setTrendScrapStatus(trendId, initialScrapStatus);

    } catch (err: any) {
      Alert.alert("오류", "트렌드 정보를 불러오는 데 실패했습니다.");
      console.error('트렌드 상세 조회 오류:', err);
    } finally {
      setLoading(false);
    }
  }, [trendId, setTrendScrapStatus]);

  useEffect(() => {
    fetchTrendDetail();
  }, [fetchTrendDetail]);

  const handleLikeTrend = async () => {
    if (!trend || !user) {
      Alert.alert("알림", "로그인이 필요한 기능입니다.");
      return;
    }
    const originalLiked = isLiked;
    const originalLikeCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      await trendsApi.like(trend.id);
    } catch (error) {
      setIsLiked(originalLiked);
      setLikeCount(originalLikeCount);
      Alert.alert("오류", "좋아요 처리에 실패했습니다.");
    }
  };

  // ✨ 5. 스크랩 핸들러를 GlobalContext의 함수 호출로 변경
  const handleScrapTrend = async () => {
    if (!trend || !user) {
      Alert.alert("알림", "로그인이 필요한 기능입니다.");
      return;
    }
    await toggleTrendScrap(trend.id);
  };

  const handleCommentSubmit = async () => {
    if (newComment.trim() === "" || !trend || !user) {
      Alert.alert("알림", "로그인이 필요하거나 댓글 내용이 없습니다.");
      return;
    }
    try {
      await commentsApi.createForTrend(trend.id, newComment.trim());
      setNewComment("");
      await fetchTrendDetail();
    } catch (error) {
      Alert.alert("오류", "댓글 등록에 실패했습니다.");
    }
  };

  // --- 렌더링 부분 (기존과 거의 동일) ---
  if (loading) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#581c87" /></View>;
  }

  if (!trend) {
    return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>트렌드 정보를 찾을 수 없습니다.</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
    );
  }

  const displayTags = [
    ...(trend.category ? [trend.category] : []),
    ...(Array.isArray(trend.tags) ? trend.tags : []),
  ];

  const peakPeriodText = trend.peakPeriod && !trend.peakPeriod.includes('없음') ? trend.peakPeriod : '아직 피크 시기가 오지 않았어요';

  const trendColor = generateTrendColor(trendId);

  return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
          <View style={styles.navBar}>
            <TouchableOpacity onPress={onClose} style={styles.navButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.navBarTitleContainer}>
              <Text style={styles.navTitle} numberOfLines={1}>트렌드 상세</Text>
            </View>
            <TouchableOpacity style={styles.navButton}>
              <Ionicons name="share-social-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={[styles.header, { backgroundColor: trendColor }]}>
              <Text style={styles.title}>{trend.title}</Text>
            </View>

            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItem} onPress={handleLikeTrend}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={16} color={isLiked ? "#E91E63" : "#666"} />
                <Text style={[styles.statText, { color: isLiked ? "#E91E63" : "#333" }]}>{likeCount.toLocaleString()}</Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={16} color="#666" />
                <Text style={styles.statText}>{(trend.comments || []).length.toString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={16} color="#666" />
                <Text style={styles.statText}>{(trend.viewCount || 0).toLocaleString()}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={handleScrapTrend}>
                <Ionicons name={isScrapped ? "bookmark" : "bookmark-outline"} size={20} color={isScrapped ? "#FFC107" : "#666"} />
              </TouchableOpacity>
            </View>

            {trend.description && (
                <View style={styles.section}>
                  <Text style={styles.descriptionText}>{trend.description}</Text>
                </View>
            )}

            {displayTags.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>태그</Text>
                  <View style={styles.tagsContainer}>
                    {displayTags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                    ))}
                  </View>
                </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>트렌드 분석</Text>
              <View style={styles.analysisGrid}>
                <View style={styles.mainMetric}>
                  <Text style={styles.mainMetricValue}>
                    {trend.score !== null && trend.score !== undefined ? trend.score.toString() : 'N/A'}
                  </Text>
                  <Text style={styles.mainMetricLabel}>트렌드 점수</Text>
                </View>
                <View style={styles.subMetricsContainer}>
                  <View style={styles.subMetric}>
                    <Ionicons name="at-outline" size={24} color="#8B5CF6" />
                   <Text style={styles.subMetricValue}>{(trend.snsMentions || 0) >= 50  ? '50+' : (trend.snsMentions || 0).toLocaleString()} </Text>
                    <Text style={styles.subMetricLabel}>SNS 언급량</Text>
                  </View>
                  <View style={styles.subMetric}>
                    <Ionicons name="logo-youtube" size={24} color="#FF0000" />
                    <Text style={styles.subMetricValue}>{(trend.youtubeTopView || 0).toLocaleString()}</Text>
                    <Text style={styles.subMetricLabel}>최고 조회수</Text>
                  </View>
                  <View style={styles.subMetric}>
                    <Ionicons name="trending-up-outline" size={24} color="#10B981" />
                    <Text style={styles.subMetricValueWide}>{peakPeriodText}</Text>
                    <Text style={styles.subMetricLabel}>피크 시기</Text>
                  </View>
                </View>
              </View>
            </View>

            {trend.recommendedNews && trend.recommendedNews.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>관련 뉴스</Text>
                  {trend.recommendedNews.slice(0, 3).map((news, index) => (
                      <TouchableOpacity key={index} style={styles.newsItem} onPress={() => Linking.openURL(news.link)}>
                        <Text style={styles.newsTitle} numberOfLines={1}>{news.title}</Text>
                        <Ionicons name="open-outline" size={16} color="#666" />
                      </TouchableOpacity>
                  ))}
                </View>
            )}

            {trend.similarTrends && trend.similarTrends.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>비슷한 트렌드</Text>
                  {trend.similarTrends.slice(0, 3).map(similar => (
                      <TouchableOpacity
                          key={similar.trendId}
                          style={styles.similarTrendItem}
                          onPress={() => onNavigateToTrend(similar.trendId)}
                      >
                        <Text style={styles.trendName}>{similar.title}</Text>
                        <Text style={styles.trendScore}>
                          {similar.score !== null && similar.score !== undefined ? similar.score.toString() : 'N/A'}
                        </Text>
                      </TouchableOpacity>
                  ))}
                </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>댓글 ({(trend.comments || []).length.toString()})</Text>
              {trend.comments && trend.comments.length > 0 ? (
                  trend.comments.map((comment) => (
                      <CommentItem
                          key={`comment-${comment.commentId || comment.id}`}
                          comment={comment}
                          trendId={trend.id}
                          currentUserId={user?.id}
                          onDeleteSuccess={fetchTrendDetail}
                      />
                  ))
              ) : (
                  <View style={styles.commentPlaceholder}>
                    <Text style={styles.commentPlaceholderText}>첫 번째 댓글을 남겨보세요!</Text>
                  </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.commentInputContainer}>
            <TextInput style={styles.commentInput} placeholder="댓글을 입력하세요..." value={newComment} onChangeText={setNewComment} multiline />
            <TouchableOpacity style={styles.commentSubmitButton} onPress={handleCommentSubmit}><Ionicons name="send" size={20} color="#FFFFFF" /></TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

// --- Stylesheet (기존과 동일) ---
const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { fontSize: 16, color: '#333', textAlign: 'center' },
  closeButton: { marginTop: 20, backgroundColor: '#581c87', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  closeButtonText: { color: 'white', fontWeight: 'bold' },
  navBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    paddingHorizontal: 16,
  },
  navBarTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  navButton: {
    padding: 8,
  },
  header: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: 'center',
  },
  title: { fontSize: 26, fontWeight: "bold", color: "#FFFFFF", textAlign: 'center' },
  statsContainer: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    backgroundColor: '#FAFAFA'
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  statText: { marginLeft: 6, fontSize: 13, color: "#333" },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 16 },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4B5563',
  },
  analysisGrid: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
  },
  mainMetric: {
    flex: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2, },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 5,
  },
  mainMetricValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#7C3AED',
  },
  mainMetricLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  subMetricsContainer: {
    flex: 1.8,
    justifyContent: 'space-between',
  },
  subMetric: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  subMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
  },
  subMetricValueWide: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
  },
  subMetricLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: '#F3F4F6', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  tagText: { color: '#4B5563', fontSize: 13, fontWeight: '500' },
  newsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  newsTitle: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    marginRight: 8,
  },
  similarTrendItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 8,
  },
  trendName: { fontSize: 16, fontWeight: '600', color: '#4B5563' },
  trendScore: { fontSize: 22, fontWeight: 'bold', color: '#7C3AED' },
  commentPlaceholder: { padding: 20, backgroundColor: '#F9FAFB', borderRadius: 8, alignItems: 'center' },
  commentPlaceholderText: { color: '#9CA3AF' },
  commentItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#E5E7EB' },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  commentUsername: { fontWeight: 'bold', fontSize: 14, color: '#374151', marginRight: 8 },
  commentTime: { fontSize: 12, color: '#9CA3AF', flex: 1 },
  commentContent: { fontSize: 14, lineHeight: 20, color: '#4B5563', marginBottom: 8 },
  commentFooter: { flexDirection: 'row', alignItems: 'center' },
  commentLikeButton: { flexDirection: 'row', alignItems: 'center', padding: 4 },
  commentLikeCount: { fontSize: 12, marginLeft: 4 },
  commentActionButton: { padding: 4, marginLeft: 8 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  commentInput: { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 20, fontSize: 15 },
  commentSubmitButton: { marginLeft: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
});