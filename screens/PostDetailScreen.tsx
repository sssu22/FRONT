// PostDetailScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput, KeyboardAvoidingView, Platform, SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { postsApi, commentsApi } from "../utils/apiUtils";
import { Experience, Comment } from "../types";
import { useGlobalContext } from "../GlobalContext";

const emotionIcons: Record<string, string> = {
  joy: "😊", excitement: "🔥", nostalgia: "💭", surprise: "😲", love: "💖",
  regret: "😞", sadness: "😢", irritation: "😒", anger: "😡", embarrassment: "😳",
};

interface PostDetailScreenProps {
  postId: number;
  onClose: () => void;
  onTrendPress: (trendId: number) => void;
}

const normalizeComment = (comment: any): Comment => {
  return {
    id: comment.id || comment.commentId,
    content: comment.content,
    createdAt: comment.createdAt || comment.time,
    likeCount: comment.likeCount,
    liked: comment.liked ?? false,
    username: comment.username || comment.authorName || "사용자",
    userId: comment.userId,
    imageUrl: comment.imageUrl || comment.authorProfileImageUrl,
  };
};

// ✅ 1. CommentItem 컴포넌트 수정
const CommentItem = ({
                       comment,
                       isMyComment,
                       onLikePress, // 부모로부터 좋아요 처리 함수를 받음
                       onDeletePress, // 부모로부터 삭제 처리 함수를 받음
                     }: {
  comment: Comment;
  isMyComment: boolean;
  onLikePress: () => void;
  onDeletePress: () => void;
}) => {
  return (
      <View style={styles.commentItem}>
        <Image
            source={comment.imageUrl ? { uri: comment.imageUrl } : { uri: 'https://placehold.co/64x64/E0E0E0/FFFFFF?text=?' }}
            style={styles.commentAvatar}
        />
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{comment.username}</Text>
            <Text style={styles.commentTime}>{comment.createdAt}</Text>
            {isMyComment && (
                <TouchableOpacity style={styles.commentActionButton} onPress={onDeletePress}>
                  <Ionicons name="trash-outline" size={14} color="#E91E63" />
                </TouchableOpacity>
            )}
          </View>
          <Text style={styles.commentContent}>{comment.content}</Text>
          <TouchableOpacity style={styles.commentFooter} onPress={onLikePress}>
            <Ionicons
                name={comment.liked ? "heart" : "heart-outline"} // ✅ 이제 props의 liked 상태를 직접 사용
                size={16}
                color={comment.liked ? "#E91E63" : "#999"}
            />
            {comment.likeCount > 0 && (
                <Text style={[styles.commentLikes, { color: comment.liked ? "#E91E63" : "#999" }]}>
                  {comment.likeCount}
                </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
  );
};


export default function PostDetailScreen({
                                           postId,
                                           onClose,
                                           onTrendPress,
                                         }: PostDetailScreenProps) {
  const { user, togglePostLike, togglePostScrap } = useGlobalContext();
  const [post, setPost] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  const fetchPostDetail = useCallback(async () => {
    try {
      const postData = await postsApi.getById(postId);
      const normalizedComments = (postData.comments || []).map(normalizeComment);
      setPost({ ...postData, comments: normalizedComments });
    } catch (err: any) {
      Alert.alert("오류", "게시글을 불러오는 데 실패했습니다.");
      onClose();
    }
  }, [postId, onClose]);

  useEffect(() => {
    setLoading(true);
    fetchPostDetail().finally(() => setLoading(false));
  }, [fetchPostDetail]);


  // 게시글 좋아요/스크랩 핸들러 (이전과 동일)
  const handleLike = async () => {
    if (!post) return;
    const originalPost = { ...post };
    const newLikedStatus = !post.liked;
    const newLikeCount = post.liked ? (post.likeCount ?? 1) - 1 : (post.likeCount ?? 0) + 1;
    setPost({ ...post, liked: newLikedStatus, likeCount: newLikeCount });
    try {
      await togglePostLike(post.id);
    } catch (e) {
      setPost(originalPost);
      Alert.alert("오류", "좋아요 처리에 실패했습니다.");
    }
  };

  const handleScrap = async () => {
    if (!post) return;
    const originalPost = { ...post };
    const newScrappedStatus = !post.scrapped;
    setPost({ ...post, scrapped: newScrappedStatus });
    try {
      await togglePostScrap(post.id);
    } catch (e) {
      setPost(originalPost);
      Alert.alert("오류", "스크랩 처리에 실패했습니다.");
    }
  };

  // ✅ 2. 댓글 좋아요 핸들러를 PostDetailScreen으로 이동
  const handleCommentLikeToggle = async (commentId: number) => {
    if (!post || !post.comments) return;

    // 원본 상태 저장
    const originalComments = [...post.comments];

    // 화면 먼저 업데이트
    const updatedComments = post.comments.map(c => {
      if (c.id === commentId) {
        const newLiked = !c.liked;
        const newLikeCount = c.liked ? c.likeCount - 1 : c.likeCount + 1;
        return { ...c, liked: newLiked, likeCount: newLikeCount };
      }
      return c;
    });
    setPost({ ...post, comments: updatedComments });

    // API 호출
    try {
      await commentsApi.like(postId, commentId);
    } catch (error) {
      // 에러 발생 시 원래 상태로 복구
      setPost({ ...post, comments: originalComments });
      Alert.alert("오류", "댓글 좋아요 처리에 실패했습니다.");
    }
  };

  // ✅ 3. 댓글 삭제 핸들러를 PostDetailScreen으로 이동
  const handleCommentDelete = (commentId: number) => {
    Alert.alert("댓글 삭제", "정말 이 댓글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: async () => {
          try {
            await commentsApi.delete(postId, commentId);
            await fetchPostDetail(); // 삭제 후에는 목록을 새로고침
          } catch (error) {
            Alert.alert("오류", "댓글 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  const handleCommentSubmit = async () => {
    if (newComment.trim() === "" || !post) return;
    try {
      await commentsApi.create(post.id, newComment.trim());
      setNewComment("");
      await fetchPostDetail();
    } catch (error) {
      Alert.alert("오류", "댓글 등록에 실패했습니다.");
    }
  };

  if (loading) {
    return <View style={styles.centerContainer}><ActivityIndicator size="large" color="#581c87" /></View>;
  }

  if (!post) {
    return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>게시글이 없습니다.</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeButtonText}>닫기</Text>
          </TouchableOpacity>
        </View>
    );
  }

  return (
      <SafeAreaView style={styles.safeAreaContainer}>
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
          {/* ... (네비게이션, 헤더, 본문 등 다른 UI는 모두 동일) ... */}
          <View style={styles.navBar}>
            <TouchableOpacity onPress={onClose} style={styles.navButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>
            <View style={styles.navBarTitleContainer}>
              <Text style={styles.navTitle} numberOfLines={1}>경험 상세</Text>
            </View>
            <TouchableOpacity style={styles.navButton}>
              <Ionicons name="share-social-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Text style={styles.emotion}>
                {emotionIcons[post.emotion.toLowerCase()] || "🤔"}
              </Text>
              <Text style={styles.title}>{post.title}</Text>
              <View style={styles.metaContainer}>
                <Text style={styles.metaText}>
                  {new Date(post.date).toLocaleDateString("ko-KR", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </Text>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.metaText}>{post.location}</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItem} onPress={handleLike}>
                <Ionicons name={post.liked ? "heart" : "heart-outline"} size={16} color={post.liked ? "#E91E63" : "#666"} />
                <Text style={[styles.statText, { color: post.liked ? "#E91E63" : "#333" }]}>
                  {(post.likeCount ?? 0).toLocaleString()}
                </Text>
              </TouchableOpacity>
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={16} color="#666" />
                <Text style={styles.statText}>{(post.comments?.length || 0).toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="eye-outline" size={16} color="#666" />
                <Text style={styles.statText}>{(post.viewCount || 0).toLocaleString()}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <TouchableOpacity onPress={handleScrap}>
                <Ionicons name={post.scrapped ? "bookmark" : "bookmark-outline"} size={20} color={post.scrapped ? "#FFC107" : "#666"} />
              </TouchableOpacity>
            </View>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>경험 이야기</Text>
              <Text style={styles.description}>{post.description}</Text>
            </View>

            {post.tags && post.tags.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>태그</Text>
                  <View style={styles.tagsContainer}>
                    {post.tags.map((tag, index) => (
                        <View key={index} style={styles.tag}>
                          <Text style={styles.tagText}>#{tag}</Text>
                        </View>
                    ))}
                  </View>
                </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>연관 트렌드</Text>
              <TouchableOpacity
                  style={styles.trendContainer}
                  onPress={() => onTrendPress(post.trendId)}
              >
                <Text style={styles.trendName}>{post.trendName}</Text>
                <Text style={styles.trendScore}>{post.trendScore}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>댓글 ({(post.comments?.length || 0)})</Text>
              {post.comments && post.comments.length > 0 ? (
                  post.comments.map((c) => (
                      // ✅ 4. CommentItem에 수정된 props를 전달합니다.
                      <CommentItem
                          key={c.id}
                          comment={c}
                          isMyComment={String(c.userId) === String(user?.id)}
                          onLikePress={() => handleCommentLikeToggle(c.id)}
                          onDeletePress={() => handleCommentDelete(c.id)}
                      />
                  ))
              ) : (
                  <View style={styles.commentPlaceholder}>
                    <Text style={styles.commentPlaceholderText}>작성된 댓글이 없습니다.</Text>
                  </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.commentInputContainer}>
            <TextInput
                style={styles.commentInput}
                placeholder="댓글을 입력하세요..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
            />
            <TouchableOpacity
                style={styles.commentSubmitButton}
                onPress={handleCommentSubmit}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

// ... (styles는 기존과 동일)
const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { fontSize: 16, color: "#333", textAlign: "center" },
  closeButton: { marginTop: 20, backgroundColor: "#581c87", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  closeButtonText: { color: "white", fontWeight: "bold" },
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
  header: { backgroundColor: "#00C2FF", padding: 24, alignItems: "center" },
  emotion: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", textAlign: "center", marginBottom: 8 },
  metaContainer: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 14, color: "#FFFFFF", opacity: 0.9 },
  metaSeparator: { marginHorizontal: 8, color: "#FFFFFF", opacity: 0.9 },
  statsContainer: { flexDirection: "row", padding: 16, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F0F0F0", backgroundColor: '#FAFAFA' },
  statItem: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  statText: { marginLeft: 6, fontSize: 14, color: "#333" },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#1F2937", marginBottom: 16 },
  description: { fontSize: 15, lineHeight: 24, color: "#4B5563" },
  tagsContainer: { flexDirection: "row", flexWrap: "wrap" },
  tag: { backgroundColor: "#F3F4F6", borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  tagText: { color: "#4B5563", fontSize: 13, fontWeight: "500" },
  trendContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: '#F3F4F6', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  trendName: { fontSize: 16, fontWeight: "600", color: "#4B5563" },
  trendScore: { fontSize: 22, fontWeight: "bold", color: "#7C3AED" },
  commentPlaceholder: { padding: 20, backgroundColor: "#F9FAFB", borderRadius: 8, alignItems: "center" },
  commentPlaceholderText: { color: "#9CA3AF" },
  commentItem: { flexDirection: "row", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: "#E5E7EB" },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  commentUsername: { fontWeight: "bold", fontSize: 14, color: "#374151" },
  commentTime: { marginLeft: 8, fontSize: 12, color: "#9CA3AF", flex: 1 },
  commentContent: { fontSize: 14, lineHeight: 20, color: "#4B5563" },
  commentFooter: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  commentLikes: { marginLeft: 4, fontSize: 12, color: "#6B7280" },
  commentActionButton: { padding: 4, marginLeft: "auto" },
  commentInputContainer: { flexDirection: "row", alignItems: "center", padding: 8, borderTopWidth: 1, borderTopColor: "#E5E7EB", backgroundColor: "#FFFFFF" },
  commentInput: { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: "#F3F4F6", borderRadius: 20, fontSize: 15 },
  commentSubmitButton: { marginLeft: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: "#7C3AED", justifyContent: "center", alignItems: "center" },
});