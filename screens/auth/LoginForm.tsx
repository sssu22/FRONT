import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Button } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface LoginFormProps {
  onLogin: (user: { id: string; email: string; name: string; avatar?: string }) => void;
  onShowSignup: () => void;
  onBack: () => void;
}

export default function LoginForm({ onLogin, onShowSignup, onBack }: LoginFormProps) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");
    if (!formData.email || !formData.password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      if (formData.email === "demo@dejatrend.com" && formData.password === "demo123") {
        onLogin({
          id: "demo-user",
          email: formData.email,
          name: "데모 사용자",
          avatar: "",
        });
      } else {
        onLogin({
          id: Date.now().toString(),
          email: formData.email,
          name: formData.email.split("@")[0],
          avatar: "",
        });
      }
    } catch {
      setError("로그인에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onLogin({
        id: "google-" + Date.now(),
        email: "user@gmail.com",
        name: "구글 사용자",
        avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      });
    } catch {
      setError("구글 로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        {/* 상단 헤더 */}
        <View style={styles.headerRow}>
          <Button mode="text" onPress={onBack} compact style={{ marginRight: 4 }}>
            <Ionicons name="arrow-back" size={20} color="#8B5CF6" />
          </Button>
          <View style={{ flex: 1, alignItems: "center" }}>
            <Text style={styles.title}>DejaTrend</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>계정에 로그인하세요</Text>

        {/* 에러 메시지 */}
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* 폼 */}
        <View style={{ marginTop: 10 }}>
          {/* 이메일 */}
          <Text style={styles.label}>이메일</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="mail-outline" size={20} color="#bbb" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingLeft: 38 }]}
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(v) => setFormData({ ...formData, email: v })}
              editable={!isLoading}
              returnKeyType="next"
            />
          </View>

          {/* 비밀번호 */}
          <Text style={[styles.label, { marginTop: 12 }]}>비밀번호</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="lock-outline" size={20} color="#bbb" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingLeft: 38, paddingRight: 38 }]}
              placeholder="비밀번호를 입력하세요"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(v) => setFormData({ ...formData, password: v })}
              editable={!isLoading}
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.eyeBtn}
              disabled={isLoading}
            >
              <MaterialIcons
                name={showPassword ? "visibility-off" : "visibility"}
                size={18}
                color="#aaa"
              />
            </TouchableOpacity>
          </View>

          {/* 로그인 버튼 */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.loginBtn}
            disabled={isLoading}
            contentStyle={{ height: 45 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "bold" }}>로그인</Text>
            )}
          </Button>
        </View>

        {/* 구분선 */}
        <View style={styles.separatorRow}>
          <View style={styles.separatorLine} />
          <Text style={styles.separatorText}>또는</Text>
          <View style={styles.separatorLine} />
        </View>

        {/* Google 로그인 */}
        <Button
          mode="outlined"
          onPress={handleGoogleLogin}
          disabled={isLoading}
          style={styles.googleBtn}
          contentStyle={{ height: 44 }}
          icon={({ color }) => (
            <Ionicons name="logo-google" size={18} color={color || "#EA4335"} />
          )}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <Text style={{ color: "#222" }}>Google로 로그인</Text>
          )}
        </Button>

        {/* 회원가입 링크 */}
        <View style={{ alignItems: "center", marginVertical: 15 }}>
          <Text style={{ color: "#666", fontSize: 13 }}>
            계정이 없으신가요?{" "}
            <Text
              style={{ color: "#8B5CF6", fontWeight: "bold" }}
              onPress={onShowSignup}
            >
              회원가입
            </Text>
          </Text>
        </View>

        {/* 데모 계정 안내 */}
        <View style={styles.demoBox}>
          <Text style={styles.demoLabel}>데모 계정</Text>
          <Text style={styles.demoHint}>이메일: demo@dejatrend.com</Text>
          <Text style={styles.demoHint}>비밀번호: demo123</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F4FF", justifyContent: "center", alignItems: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    width: "100%",
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
    paddingHorizontal: 14,
    borderRadius: 8,
    overflow: "hidden",
  },
  subtitle: { textAlign: "center", color: "#666", fontSize: 15, marginBottom: 8 },
  errorBox: {
    backgroundColor: "#fff1f1",
    borderColor: "#ef9f9f",
    borderWidth: 1,
    borderRadius: 7,
    padding: 8,
    marginVertical: 6,
  },
  errorText: { color: "#C42D7D", fontSize: 13, textAlign: "center" },
  label: { fontWeight: "bold", marginBottom: 2, color: "#222", marginLeft: 2, fontSize: 13 },
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
    color: "#222"
  },
  inputIcon: { position: "absolute", left: 10, zIndex: 10 },
  eyeBtn: { position: "absolute", right: 8, zIndex: 10, padding: 5 },
  loginBtn: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
    shadowOpacity: 0,
  },
  separatorRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  separatorLine: { flex: 1, height: 1, backgroundColor: "#eee" },
  separatorText: { marginHorizontal: 8, color: "#AAA", fontSize: 12 },
  googleBtn: {
    borderColor: "#bbb",
    backgroundColor: "#F3F3F8",
    marginTop: 0,
  },
  demoBox: { marginTop: 8, backgroundColor: "#e6e6ff", borderRadius: 7, padding: 10, alignItems: "center" },
  demoLabel: { color: "#3A2C91", fontWeight: "bold", marginBottom: 3, fontSize: 12 },
  demoHint: { color: "#7b75c0", fontSize: 12, marginBottom: 1 },
});
