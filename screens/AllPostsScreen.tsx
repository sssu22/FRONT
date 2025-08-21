// sssu22/front/FRONT-feature-UI-API2-/screens/AllPostsScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { Experience } from '../types';
import { Card } from 'react-native-paper';
import Ionicons from '@expo/vector-icons/Ionicons';
import { postsApi } from '../utils/apiUtils';

const emotionIcons: Record<string, string> = {
    joy: '😊', excitement: '🔥', nostalgia: '💭', surprise: '😲', love: '💖',
    disappointment: '😞', sadness: '😢', annoyance: '😒', anger: '😡', embarrassment: '😳',
};

const emotionColors: Record<string, string> = {
    joy: '#FFD700', excitement: '#FF4500', nostalgia: '#B0C4DE', surprise: '#9932CC',
    love: '#FF69B4', disappointment: '#778899', sadness: '#4682B4', annoyance: '#F0E68C',
    anger: '#DC143C', embarrassment: '#FFB6C1',
};

interface AllPostsScreenProps {
    onExperienceClick: (experience: Experience) => void;
    onClose: () => void;
}

const AllPostsScreen: React.FC<AllPostsScreenProps> = ({ onExperienceClick, onClose }) => {
    const [posts, setPosts] = useState<Experience[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    const fetchPostsForPage = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const response = await postsApi.getAll({ page: page, size: 10, sort: 'latest' });
            setPosts(response.list);
            setTotalPages(response.pageInfo.totalPages);
            setCurrentPage(response.pageInfo.page);
        } catch (error) {
            console.error("게시물 로딩 실패:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPostsForPage(1);
    }, [fetchPostsForPage]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            fetchPostsForPage(newPage);
        }
    };

    const renderExperienceCard = ({ item }: { item: Experience }) => {
        const emKey = item.emotion || "joy";
        const bg = emotionColors[emKey] ? `${emotionColors[emKey]}30` : "#EEEEEE";
        return (
            <TouchableOpacity style={styles.unifiedCard} onPress={() => onExperienceClick(item)} activeOpacity={0.8}>
                <View style={styles.unifiedCardHeader}>
                    <Text style={styles.unifiedCardTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.unifiedTrendInfo}>
                        <Text style={styles.unifiedTrendName}>{item.trendName || "트렌드"}</Text>
                        <Text style={styles.unifiedTrendScore}>{item.trendScore}</Text>
                    </View>
                </View>
                <View style={styles.unifiedCardMeta}>
                    <Ionicons name="calendar-outline" size={12} color="#9E9E9E" />
                    <Text style={styles.unifiedMetaText}>{new Date(item.date).toLocaleDateString("ko-KR", { year: "2-digit", month: "2-digit", day: "2-digit" })}</Text>
                    <Ionicons name="location-outline" size={12} color="#9E9E9E" style={{ marginLeft: 10 }} />
                    <Text style={styles.unifiedMetaText}>{item.location}</Text>
                </View>
                {(item.description || "").trim().length > 0 && (<Text style={styles.unifiedCardDescription} numberOfLines={2}>{item.description.trim()}</Text>)}
                <View style={styles.unifiedTagsAndActionsContainer}>
                    <View style={styles.unifiedTagsContainer}>
                        <View style={[styles.unifiedTag, styles.unifiedEmotionTag, { backgroundColor: bg }]}><Text style={styles.unifiedEmotionTagText}>{emotionIcons[emKey] ?? "🙂"}</Text></View>
                        {item.tags?.slice(0, 3).map((tag, index) => (<View key={index} style={styles.unifiedTag}><Text style={styles.unifiedTagText}>#{tag}</Text></View>))}
                        {item.tags?.length > 3 && <Text style={styles.unifiedMoreTagsText}>+{item.tags.length - 3}</Text>}
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const PaginationControls = () => (
        <View style={styles.paginationContainer}>
            <TouchableOpacity
                onPress={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1 || loading}
                style={[styles.pageButton, (currentPage <= 1 || loading) && styles.disabledButton]}
            >
                <Text style={styles.pageButtonText}>이전</Text>
            </TouchableOpacity>
            <Text style={styles.pageInfoText}>{`${currentPage} / ${totalPages}`}</Text>
            <TouchableOpacity
                onPress={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages || loading}
                style={[styles.pageButton, (currentPage >= totalPages || loading) && styles.disabledButton]}
            >
                <Text style={styles.pageButtonText}>다음</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="black" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>모든 게시물</Text>
                <View style={{ width: 24 }} />
            </View>
            {loading && posts.length === 0 ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" />
                </View>
            ) : (
                <FlatList
                    data={posts}
                    renderItem={renderExperienceCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContentContainer}
                    ListFooterComponent={<PaginationControls />}
                    ListEmptyComponent={
                        !loading ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>게시물이 없습니다.</Text>
                            </View>
                        ) : null
                    }
                />
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#fafaff' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee', backgroundColor: '#fff' },
    backButton: { padding: 4 },
    headerTitle: { fontSize: 18, fontWeight: 'bold' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    listContentContainer: { padding: 16, paddingBottom: 80 },
    unifiedCard: { backgroundColor: "#FFFFFF", borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#EEEEEE", padding: 16 },
    unifiedCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
    unifiedCardTitle: { fontSize: 16, fontWeight: "bold", color: "#212121", flex: 1, marginRight: 10, lineHeight: 24 },
    unifiedTrendInfo: { alignItems: "flex-end" },
    unifiedTrendName: { fontSize: 10, color: "#757575" },
    unifiedTrendScore: { fontSize: 18, fontWeight: "bold", color: "#673AB7", marginTop: 2 },
    unifiedCardMeta: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    unifiedMetaText: { fontSize: 12, color: "#757575", marginLeft: 4 },
    unifiedCardDescription: { fontSize: 14, color: "#4B5563", lineHeight: 22, marginBottom: 12, marginLeft: 4, fontStyle: "italic" },
    unifiedTagsAndActionsContainer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
    unifiedTagsContainer: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", flex: 1 },
    unifiedTag: { borderRadius: 16, paddingHorizontal: 10, paddingVertical: 5, marginRight: 6, marginBottom: 6, backgroundColor: "#EEEEEE" },
    unifiedEmotionTag: { paddingHorizontal: 8, paddingVertical: 4, minWidth: 30, height: 26, justifyContent: "center", alignItems: "center", borderRadius: 13 },
    unifiedTagText: { fontSize: 12, color: "#616161", fontWeight: "500" },
    unifiedEmotionTagText: { fontSize: 14, textAlign: "center" },
    unifiedMoreTagsText: { fontSize: 12, color: "#9E9E9E" },
    paginationContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 20, paddingHorizontal: 32 },
    pageButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#EBEBEB', borderRadius: 8 },
    pageButtonText: { fontWeight: 'bold' },
    disabledButton: { backgroundColor: '#F5F5F5', opacity: 0.6 },
    pageInfoText: { fontSize: 16, fontWeight: '600' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
    emptyText: { fontSize: 16, color: '#999' },
});

export default AllPostsScreen;