// screens/PostDetailScreen.tsx
import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image, TextInput, KeyboardAvoidingView, Platform
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

const CommentItem = ({ comment, postId, currentUserId, onDeleteSuccess }: { 
  comment: Comment, 
  postId: number,
  currentUserId: string | undefined,
  onDeleteSuccess: () => void,
}) => {
  const [isLiked, setIsLiked] = useState(comment.liked);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [isLiking, setIsLiking] = useState(false);

  const handleLikeComment = async () => {
    if (isLiking) return;
    setIsLiking(true);
    const originalLiked = isLiked;
    const originalLikeCount = likeCount;
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
    try {
      await commentsApi.like(postId, comment.id);
    } catch (error) {
      setIsLiked(originalLiked);
      setLikeCount(originalLikeCount);
      Alert.alert("오류", "댓글 좋아요 처리에 실패했습니다.");
    } finally {
      setIsLiking(false);
    }
  };

  const handleDeleteComment = () => {
    Alert.alert("댓글 삭제", "정말 이 댓글을 삭제하시겠습니까?", [
      { text: "취소", style: "cancel" },
      {
        text: "삭제", style: "destructive",
        onPress: async () => {
          try {
            await commentsApi.delete(postId, comment.id);
            onDeleteSuccess();
          } catch (error) {
            Alert.alert("오류", "댓글 삭제에 실패했습니다.");
          }
        },
      },
    ]);
  };
  
  const isMyComment = comment.userId === currentUserId;

  return (
    <View style={styles.commentItem}>
      <Image 
        source={comment.imageUrl ? { uri: comment.imageUrl } : undefined}
      />
      <View style={styles.commentBody}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentUsername}>{comment.username}</Text>
          <Text style={styles.commentTime}>{comment.time}</Text>
          {isMyComment && (
            <View style={styles.commentActions}>
              <TouchableOpacity style={styles.commentActionButton} onPress={handleDeleteComment}>
                <Ionicons name="trash" size={14} color="#E91E63" />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={styles.commentContent}>{comment.content}</Text>
        <TouchableOpacity style={styles.commentFooter} onPress={handleLikeComment}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={14} color={isLiked ? "#E91E63" : "#666"} />
          <Text style={[styles.commentLikes, { color: isLiked ? "#E91E63" : "#666" }]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function PostDetailScreen({ postId, onClose, onTrendPress }: PostDetailScreenProps) {
  const { user, likedPosts, scrappedPosts, toggleLike, toggleScrap } = useGlobalContext();
  const [post, setPost] = useState<Experience | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [likeCount, setLikeCount] = useState(0);

  const isLiked = post ? likedPosts.has(post.id) : false;
  const isScrapped = post ? scrappedPosts.has(post.id) : false;

  const fetchPostDetail = useCallback(async () => {
    try {
      setLoading(true);
      const postData = await postsApi.getById(postId);
      setPost(postData);
      setLikeCount(postData.likeCount || 0);
    } catch (err: any) {
      Alert.alert("오류", "게시글을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchPostDetail();
  }, [fetchPostDetail]);

  const handleLike = async () => {
    if (!post) return;
    // 1. UI를 전역 상태와 로컬 카운터를 이용해 먼저 변경 (낙관적 업데이트)
    toggleLike(post.id);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);

    // 2. 백그라운드에서 API 호출
    try {
      await postsApi.likePost(post.id);
    } catch (error) {
      // 3. 실패 시 롤백
      toggleLike(post.id);
      setLikeCount(isLiked ? likeCount + 1 : likeCount - 1);
      Alert.alert("오류", "좋아요 처리에 실패했습니다.");
    }
  };

  const handleScrap = async () => {
    if (!post) return;
    toggleScrap(post.id);
    try {
      await postsApi.scrapPost(post.id);
    } catch (error) {
      toggleScrap(post.id);
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
  
  const actualCommentCount = post.comments?.length || 0;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={styles.navBar}>
        <TouchableOpacity onPress={onClose} style={styles.navButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>경험 상세</Text>
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="share-social-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.emotion}>{emotionIcons[post.emotion.toLowerCase()] || '🤔'}</Text>
          <Text style={styles.title}>{post.title}</Text>
          <View style={styles.metaContainer}>
            <Text style={styles.metaText}>{new Date(post.date).toLocaleDateString("ko-KR", { year: 'numeric', month: 'long', day: 'numeric' })}</Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaText}>{post.location}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <TouchableOpacity style={styles.statItem} onPress={handleLike}>
            <Ionicons name={isLiked ? "heart" : "heart-outline"} size={16} color={isLiked ? "#E91E63" : "#666"} />
            <Text style={[styles.statText, { color: isLiked ? "#E91E63" : "#333" }]}>{likeCount.toLocaleString()}</Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={16} color="#666" />
            <Text style={styles.statText}>{actualCommentCount.toLocaleString()}</Text>
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
              {post.tags.map((tag, index) => (<View key={index} style={styles.tag}><Text style={styles.tagText}>#{tag}</Text></View>))}
            </View>
          </View>
        )}
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>연관 트렌드</Text>
          <TouchableOpacity style={styles.trendContainer} onPress={() => onTrendPress(post.trendId)}>
            <View><Text style={styles.trendName}>{post.trendName}</Text></View>
            <Text style={styles.trendScore}>{post.trendScore}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>댓글 ({actualCommentCount})</Text>
          {post.comments && post.comments.length > 0 ? (
            post.comments.map((comment) => (
              <CommentItem 
                key={comment.id} 
                comment={comment} 
                postId={post.id}
                currentUserId={user?.id}
                onDeleteSuccess={fetchPostDetail}
              />
            ))
          ) : (<View style={styles.commentPlaceholder}><Text style={styles.commentPlaceholderText}>작성된 댓글이 없습니다.</Text></View>)}
        </View>
      </ScrollView>
      
      <View style={styles.commentInputContainer}>
        <TextInput style={styles.commentInput} placeholder="댓글을 입력하세요..." value={newComment} onChangeText={setNewComment} multiline />
        <TouchableOpacity style={styles.commentSubmitButton} onPress={handleCommentSubmit}><Ionicons name="send" size={20} color="#FFFFFF" /></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  errorText: { fontSize: 16, color: '#333', textAlign: 'center' },
  closeButton: { marginTop: 20, backgroundColor: '#581c87', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  closeButtonText: { color: 'white', fontWeight: 'bold' },
  navBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 56, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  navButton: { padding: 8 },
  navTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  header: { backgroundColor: "#00C2FF", padding: 24, alignItems: "center" },
  emotion: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: "bold", color: "#FFFFFF", textAlign: 'center', marginBottom: 8 },
  metaContainer: { flexDirection: "row", alignItems: "center" },
  metaText: { fontSize: 14, color: "#FFFFFF", opacity: 0.9 },
  metaSeparator: { marginHorizontal: 8, color: "#FFFFFF", opacity: 0.9 },
  statsContainer: { flexDirection: "row", padding: 16, alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  statItem: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  statText: { marginLeft: 6, fontSize: 14, color: "#333" },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: "#F0F0F0" },
  sectionTitle: { fontSize: 16, fontWeight: "bold", color: "#333", marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 24, color: "#555" },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap' },
  tag: { backgroundColor: '#F0F0F0', borderRadius: 16, paddingVertical: 6, paddingHorizontal: 12, marginRight: 8, marginBottom: 8 },
  tagText: { color: '#555', fontSize: 13, fontWeight: '500' },
  trendContainer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#F3E5F5', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E1BEE7',
  },
  trendName: { fontSize: 16, fontWeight: 'bold', color: '#673AB7' },
  trendScore: { fontSize: 22, fontWeight: 'bold', color: '#673AB7' },
  commentPlaceholder: { padding: 20, backgroundColor: '#FAFAFA', borderRadius: 8, alignItems: 'center' },
  commentPlaceholderText: { color: '#999' },
  commentItem: { flexDirection: 'row', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: 12, backgroundColor: '#E0E0E0' },
  commentBody: { flex: 1 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  commentUsername: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  commentTime: { marginLeft: 8, fontSize: 12, color: '#999' },
  commentContent: { fontSize: 14, lineHeight: 20, color: '#555' },
  commentFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  commentLikes: { marginLeft: 4, fontSize: 12, color: '#666' },
  commentActions: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  commentActionButton: { marginLeft: 8, padding: 4 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', padding: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0', backgroundColor: '#FFFFFF' },
  commentInput: { flex: 1, minHeight: 40, maxHeight: 120, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#F5F5F5', borderRadius: 20, fontSize: 15 },
  commentSubmitButton: { marginLeft: 8, width: 40, height: 40, borderRadius: 20, backgroundColor: '#581c87', justifyContent: 'center', alignItems: 'center' },
});