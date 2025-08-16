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

const normalizeComment = (comment: Comment): Comment => {
  const c: any = comment;
  return {
    ...comment,
    id: c.id || c.commentId || c._id,
    createdAt: c.time || c.createdAt || c.timestamp || "",
    username: c.userName || c.authorName || c.username || "",
    imageUrl: c.imageUrl || c.profileImageUrl || "",
  };
};

const CommentItem = ({
                       comment: rawComment,
                       postId,
                       currentUserId,
                       onActionSuccess,
                     }: {
  comment: Comment;
  postId: number;
  currentUserId: string | undefined;
  onActionSuccess: () => void;
}) => {
  const comment = normalizeComment(rawComment);
  const [isLiking, setIsLiking] = useState(false);

  const commentId = comment.id || comment.commentId;
  const isMyComment = String(comment.userId) === String(currentUserId);

  const handleLikeComment = async () => {
    if (isLiking || !commentId) return;
    setIsLiking(true);
    try {
      await commentsApi.like(postId, commentId);
      onActionSuccess();
    } catch (error) {
      Alert.alert("오류", "댓글 좋아요 처리에 실패했습니다.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDeleteComment = () => {
    if (!commentId) return;
    Alert.alert("댓글 삭제", "정말 이 댓글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      { text: "삭제", style: "destructive", onPress: async () => {
          try {
            await commentsApi.delete(postId, commentId);
            onActionSuccess();
          } catch (error) {
            Alert.alert("오류", "댓글 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };

  return (
      <View style={styles.commentItem}>
        <Image
            source={comment.imageUrl ? { uri: comment.imageUrl } : { uri: 'https://placehold.co/64x64/E0E0E0/FFFFFF?text=?' }}
            style={styles.commentAvatar}
        />
        <View style={styles.commentBody}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentUsername}>{comment.username || "사용자"}</Text>
            <Text style={styles.commentTime}>{comment.createdAt}</Text>
            {isMyComment && (
                <TouchableOpacity style={styles.commentActionButton} onPress={handleDeleteComment}>
                  <Ionicons name="trash-outline" size={14} color="#E91E63" />
                </TouchableOpacity>
            )}
          </View>
          <Text style={styles.commentContent}>{comment.content || ""}</Text>
          <TouchableOpacity style={styles.commentFooter} onPress={handleLikeComment} disabled={isLiking}>
            <Ionicons
                name={comment.liked ? "heart" : "heart-outline"}
                size={16}
                color={comment.liked ? "#E91E63" : "#999"}
            />
            {(comment.likeCount || 0) > 0 && (
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
  const { user } = useGlobalContext();

  const [post, setPost] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");

  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [isScrapped, setIsScrapped] = useState(false);

  const fetchPostDetail = useCallback(async () => {
    try {
      const postData = await postsApi.getById(postId);
      const normalizedComments = (postData.comments || []).map(normalizeComment);

      setPost({ ...postData, comments: normalizedComments });
      setLikeCount(postData.likeCount || 0);
      setIsLiked(postData.liked ?? false);
      setIsScrapped(postData.scrapped ?? false);
    } catch (err: any) {
      Alert.alert("오류", "게시글을 불러오는 데 실패했습니다.");
      onClose();
    } finally {
      if (loading) setLoading(false);
    }
  }, [postId, onClose, loading]);

  useEffect(() => {
    fetchPostDetail();
  }, [postId]);

  const handleLike = async () => {
    if (!post) return;

    const originalLiked = isLiked;
    const originalLikeCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    try {
      await postsApi.likePost(post.id);
    } catch (error) {
      setIsLiked(originalLiked);
      setLikeCount(originalLikeCount);
      Alert.alert("오류", "좋아요 처리에 실패했습니다.");
    }
  };

  const handleScrap = async () => {
    if (!post) return;

    const originalScrapped = isScrapped;
    setIsScrapped(!isScrapped);

    try {
      await postsApi.scrapPost(post.id);
    } catch (error) {
      setIsScrapped(originalScrapped);
      Alert.alert("오류", "스크랩 처리에 실패했습니다.");
    }
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
    return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#581c87" />
        </View>
    );
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

  const dateToDisplay = post.experienceDate || post.date;

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
                  {new Date(dateToDisplay).toLocaleDateString("ko-KR", {
                    year: "numeric", month: "long", day: "numeric",
                  })}
                </Text>
                <Text style={styles.metaSeparator}>•</Text>
                <Text style={styles.metaText}>{post.location}</Text>
              </View>
            </View>

            <View style={styles.statsContainer}>
              <TouchableOpacity style={styles.statItem} onPress={handleLike}>
                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={16} color={isLiked ? "#E91E63" : "#666"} />
                <Text style={[styles.statText, { color: isLiked ? "#E91E63" : "#333" }]}>
                  {likeCount.toLocaleString()}
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
                <Ionicons name={isScrapped ? "bookmark" : "bookmark-outline"} size={20} color={isScrapped ? "#FFC107" : "#666"} />
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
                      <CommentItem
                          key={String(c.id || c.commentId)}
                          comment={c}
                          postId={post.id}
                          currentUserId={user?.id}
                          onActionSuccess={fetchPostDetail}
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