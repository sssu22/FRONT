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
    TouchableOpacity,
} from "react-native";
import { Button } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

interface ResetConfirmFormProps {
    onBack: () => void;       // 뒤로가기 → ResetPasswordForm으로
    onComplete: () => void;   // 완료 후 → 로그인 화면으로
}

export default function ResetConfirmForm({ onBack, onComplete }: ResetConfirmFormProps) {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState("");

    const handleResetConfirm = async () => {
        if (!password || !confirmPassword) {
            setMessage("모든 필드를 입력하세요.");
            return;
        }
        if (password.length < 8) {
            setMessage("비밀번호는 8자 이상이어야 합니다.");
            return;
        }
        if (password !== confirmPassword) {
            setMessage("비밀번호가 일치하지 않습니다.");
            return;
        }

        setIsLoading(true);
        setMessage("");

        try {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            setMessage("비밀번호가 성공적으로 변경되었습니다!");
            setTimeout(() => {
                onComplete(); // 로그인 화면으로 이동
            }, 1500);
        } catch {
            setMessage("비밀번호 변경 중 오류가 발생했습니다.");
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
                    <Text style={styles.subtitle}>새 비밀번호 설정</Text>
                    <Text style={styles.description}>비밀번호를 새로 설정하세요.</Text>

                    {/* 새 비밀번호 */}
                    <Text style={styles.label}>새 비밀번호</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, { paddingRight: 38 }]}
                            placeholder="8자 이상 입력"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowPassword((prev) => !prev)}
                            style={styles.eyeBtn}
                            disabled={isLoading}
                        >
                            <Ionicons
                                name={showPassword ? "eye-off" : "eye"}
                                size={18}
                                color="#aaa"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* 비밀번호 확인 */}
                    <Text style={[styles.label, { marginTop: 12 }]}>비밀번호 확인</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={[styles.input, { paddingRight: 38 }]}
                            placeholder="비밀번호를 다시 입력하세요"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            editable={!isLoading}
                        />
                        <TouchableOpacity
                            onPress={() => setShowConfirmPassword((prev) => !prev)}
                            style={styles.eyeBtn}
                            disabled={isLoading}
                        >
                            <Ionicons
                                name={showConfirmPassword ? "eye-off" : "eye"}
                                size={18}
                                color="#aaa"
                            />
                        </TouchableOpacity>
                    </View>

                    {/* 상태 메시지 */}
                    {!!message && <Text style={styles.message}>{message}</Text>}

                    {/* 완료 버튼 */}
                    <Button
                        mode="contained"
                        onPress={handleResetConfirm}
                        style={styles.resetBtn}
                        disabled={isLoading}
                        contentStyle={{ height: 45 }}
                    >
                        {isLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <Text style={{ color: "#fff", fontWeight: "bold" }}>비밀번호 변경</Text>
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
    inputRow: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
    input: {
        flex: 1,
        height: 44,
        fontSize: 15,
        backgroundColor: "#F6F6F9",
        borderRadius: 8,
        borderColor: "#eee",
        borderWidth: 1,
        paddingHorizontal: 12,
        color: "#222",
    },
    eyeBtn: { position: "absolute", right: 8, zIndex: 10, padding: 5 },
    message: { color: "#6B21A8", fontSize: 13, marginBottom: 8, textAlign: "center" },
    resetBtn: {
        marginTop: 14,
        borderRadius: 8,
        backgroundColor: "#8B5CF6",
        shadowOpacity: 0,
    },
});
