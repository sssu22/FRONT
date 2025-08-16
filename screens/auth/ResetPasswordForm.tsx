import React, { useState } from "react";
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    SafeAreaView,
    Alert, // Alert import 추가
} from "react-native";
import { Button } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import { authApi } from "../../utils/apiUtils"; // authApi import 경로 수정

// App.tsx에서 onShowConfirm이 제거되었으므로 props 타입도 수정합니다.
interface ResetPasswordFormProps {
    onBack: () => void;
}

export default function ResetPasswordForm({ onBack }: ResetPasswordFormProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleReset = async () => {
        if (!email.trim()) {
            Alert.alert("입력 오류", "이메일을 입력하세요.");
            return;
        }

        setIsLoading(true);
        try {
            // 실제 API를 호출하여 비밀번호 재설정 이메일 발송을 요청합니다.
            await authApi.requestPasswordReset(email);
            Alert.alert(
                "전송 완료",
                "비밀번호 재설정 링크가 이메일로 전송되었습니다. 이메일을 확인해주세요.",
                [{ text: "확인", onPress: onBack }] // 확인 버튼을 누르면 이전 화면(로그인)으로 돌아갑니다.
            );
        } catch (error: any) {
            const message = error.response?.data?.message || "요청 중 오류가 발생했습니다. 다시 시도해주세요.";
            Alert.alert("전송 실패", message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.root}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === "ios" ? "padding" : undefined}
            >
                <View style={styles.card}>
                    {/* 헤더 */}
                    <View style={styles.headerRow}>
                        <Button mode="text" onPress={onBack} compact style={{ marginRight: 4 }}>
                            <Ionicons name="arrow-back" size={20} color="#8B5CF6" />
                        </Button>
                        <View style={{ flex: 1, alignItems: "center" }}>
                            <Text style={styles.title}>TrendLog</Text>
                        </View>
                    </View>
                    <Text style={styles.subtitle}>비밀번호 재설정</Text>
                    <Text style={styles.description}>계정과 연결된 이메일 주소를 입력하세요.</Text>

                    {/* 이메일 입력 */}
                    <Text style={styles.label}>이메일</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="your@email.com"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        editable={!isLoading}
                    />

                    {/* 재설정 버튼 */}
                    <Button
                        mode="contained"
                        onPress={handleReset}
                        style={styles.resetBtn}
                        disabled={isLoading}
                        contentStyle={{ height: 45 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>재설정 메일 보내기</Text>
                        )}
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: "#F8F4FF",
        justifyContent: "center",
        alignItems: "center",
    },
    keyboardView: {
        flex: 1,
        width: "100%",
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        width: "90%",
        maxWidth: 380,
        padding: 22,
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 8,
    },
    headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    title: {
        fontSize: 24,
        fontWeight: "bold",
        backgroundColor: "#8B5CF6",
        color: "#fff",
        paddingVertical: 4,
        paddingHorizontal: 20,
        borderRadius: 8,
        overflow: "hidden",
    },
    subtitle: {
        textAlign: "center",
        color: "#333",
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 4,
    },
    description: { textAlign: "center", color: "#666", fontSize: 14, marginBottom: 14 },
    label: { fontWeight: "bold", marginBottom: 6, color: "#222", fontSize: 13 },
    input: {
        height: 44,
        fontSize: 15,
        backgroundColor: "#F6F6F9",
        borderRadius: 8,
        borderColor: "#eee",
        borderWidth: 1,
        paddingHorizontal: 12,
        color: "#222",
        marginBottom: 12,
    },
    message: { color: "#6B21A8", fontSize: 13, marginBottom: 8, textAlign: "center" },
    resetBtn: {
        marginTop: 10,
        borderRadius: 8,
        backgroundColor: "#8B5CF6",
        shadowOpacity: 0,
    },
});