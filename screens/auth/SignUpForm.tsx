import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Button, Checkbox } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface SignupFormProps {
  onSignup: (user: { id: string; email: string; name: string; avatar?: string }) => void;
  onShowLogin: () => void;
  onBack: () => void;
}

export default function SignupForm({ onSignup, onShowLogin, onBack }: SignupFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("모든 필드를 입력해주세요.");
      setIsLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("비밀번호가 일치하지 않습니다.");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다.");
      setIsLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError("이용약관에 동의해주세요.");
      setIsLoading(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onSignup({
        id: Date.now().toString(),
        email: formData.email,
        name: formData.name,
        avatar: "",
      });
    } catch {
      setError("회원가입에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    setError("");
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      onSignup({
        id: "google-" + Date.now(),
        email: "newuser@gmail.com",
        name: "새로운 구글 사용자",
        avatar: "https://lh3.googleusercontent.com/a/default-user=s96-c",
      });
    } catch {
      setError("구글 회원가입에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollWrapper} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          {/* 헤더 */}
          <View style={styles.headerRow}>
            <Button mode="text" onPress={onBack} compact style={{ marginRight: 4 }}>
              <Ionicons name="arrow-back" size={20} color="#8B5CF6" />
            </Button>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.title}>DejaTrend</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>새 계정을 만드세요</Text>

          {error.length > 0 && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* 이름 */}
          <Text style={styles.label}>이름</Text>
          <View style={styles.inputRow}>
            <MaterialIcons name="person-outline" size={20} color="#bbb" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingLeft: 38 }]}
              placeholder="이름을 입력하세요"
              value={formData.name}
              onChangeText={(v) => setFormData({ ...formData, name: v })}
              editable={!isLoading}
              returnKeyType="next"
            />
          </View>

          {/* 이메일 */}
          <Text style={[styles.label, { marginTop: 12 }]}>이메일</Text>
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
              placeholder="비밀번호 (최소 6자)"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(v) => setFormData({ ...formData, password: v })}
              editable={!isLoading}
              returnKeyType="next"
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
            <MaterialIcons name="lock-outline" size={20} color="#bbb" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { paddingLeft: 38, paddingRight: 38 }]}
              placeholder="비밀번호를 다시 입력하세요"
              secureTextEntry={!showConfirmPassword}
              value={formData.confirmPassword}
              onChangeText={(v) => setFormData({ ...formData, confirmPassword: v })}
              editable={!isLoading}
              returnKeyType="done"
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

          {/* 약관 동의 */}
          <View style={styles.termsRow}>
            <Checkbox
              status={agreeTerms ? "checked" : "unchecked"}
              onPress={() => setAgreeTerms((prev) => !prev)}
              disabled={isLoading}
            />
            <Text style={styles.termsText}>
              <Text style={{ fontWeight: "bold" }}>이용약관</Text> 및{" "}
              <Text style={{ fontWeight: "bold" }}>개인정보처리방침</Text>에 동의합니다
            </Text>
          </View>

          {/* 회원가입 버튼 */}
          <Button
            mode="contained"
            onPress={handleSubmit}
            style={styles.signupBtn}
            disabled={isLoading}
            contentStyle={{ height: 45 }}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={{ color: "#fff", fontWeight: "bold" }}>계정 만들기</Text>
            )}
          </Button>

          {/* 구분선 */}
          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>또는</Text>
            <View style={styles.separatorLine} />
          </View>

          {/* Google 회원가입 */}
          <Button
            mode="outlined"
            onPress={handleGoogleSignup}
            disabled={isLoading}
            style={styles.googleBtn}
            contentStyle={{ height: 44 }}
            icon={({ color }) => <Ionicons name="logo-google" size={18} color={color || "#EA4335"} />}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <Text style={{ color: "#222" }}>Google로 회원가입</Text>
            )}
          </Button>

          {/* 로그인 링크 */}
          <View style={{ alignItems: "center", marginVertical: 15 }}>
            <Text style={{ color: "#666", fontSize: 13 }}>
              이미 계정이 있으신가요?{" "}
              <Text style={{ color: "#8B5CF6", fontWeight: "bold" }} onPress={onShowLogin}>
                로그인
              </Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#F8F4FF" },
  scrollWrapper: { padding: 22, flexGrow: 1, justifyContent: "center" },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
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
  subtitle: { textAlign: "center", color: "#666", fontSize: 15, marginBottom: 12 },
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
    color: "#222",
  },
  inputIcon: { position: "absolute", left: 10, zIndex: 10 },
  eyeBtn: { position: "absolute", right: 8, zIndex: 10, padding: 5 },
  termsRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  termsText: { color: "#555", fontSize: 14, marginLeft: 6, flex: 1 },
  signupBtn: {
    marginTop: 20,
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
  },
});
