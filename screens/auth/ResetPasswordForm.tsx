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
} from "react-native";
import { Button } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

interface ResetPasswordFormProps {
    onBack: () => void;
}

export default function ResetPasswordForm({ onBack }: ResetPasswordFormProps) {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleReset = async () => {
        if (!email) {
            setMessage("이메일을 입력하세요.");
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setMessage("비밀번호 재설정 링크가 이메일로 전송되었습니다.");
        } catch {
            setMessage("요청 중 오류가 발생했습니다. 다시 시도해주세요.");
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

                    {/* 상태 메시지 */}
                    {!!message && <Text style={styles.message}>{message}</Text>}

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
