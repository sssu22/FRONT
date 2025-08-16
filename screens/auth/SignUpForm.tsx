// screens/auth/SignUpForm.tsx - 실제 API 연동 버전 (권장 UX 적용)
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
  SafeAreaView,
} from "react-native";
import { Button, Checkbox } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface SignupFormProps {
  // ✅ 실제 credentials를 받도록 수정
  onSignup: (userData: { email: string; password: string; name: string }) => Promise<void>;
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

  // ✅ 실제 서버 API 호출
  const handleSubmit = async () => {
    setIsLoading(true);
    setError("");

    // 유효성 검사
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

    if (formData.password.length < 8) {
      setError("비밀번호는 최소 8자 이상이어야 합니다.");
      setIsLoading(false);
      return;
    }

    if (!agreeTerms) {
      setError("이용약관에 동의해주세요.");
      setIsLoading(false);
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("올바른 이메일 형식이 아닙니다.");
      setIsLoading(false);
      return;
    }

    try {
      // 실제 서버 API 호출
      await onSignup({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      });
    } catch (error: any) {
      console.error("회원가입 실패:", error);
      setError("회원가입에 실패했습니다. 다시 시도해주세요.");
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
          <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollWrapper}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
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
                    placeholder="이름"
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
                    style={[styles.input, styles.inputWithTrailingIcon, { paddingLeft: 38 }]}
                    placeholder="비밀번호"
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
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                      name={showPassword ? "eye-off" : "eye"}
                      size={18}
                      color="#aaa"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>영문+숫자+특수문자 포함, 8~20자</Text>

              {/* 비밀번호 확인 */}
              <Text style={[styles.label, { marginTop: 12 }]}>비밀번호 확인</Text>
              <View style={styles.inputRow}>
                <MaterialIcons name="lock-outline" size={20} color="#bbb" style={styles.inputIcon} />
                <TextInput
                    style={[styles.input, styles.inputWithTrailingIcon, { paddingLeft: 38 }]}
                    placeholder="비밀번호 확인"
                    secureTextEntry={!showConfirmPassword}
                    value={formData.confirmPassword}
                    onChangeText={(v) => setFormData({ ...formData, confirmPassword: v })}
                    editable={!isLoading}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                />
                <TouchableOpacity
                    onPress={() => setShowConfirmPassword((prev) => !prev)}
                    style={styles.eyeBtn}
                    disabled={isLoading}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                      name={showConfirmPassword ? "eye-off" : "eye"}
                      size={18}
                      color="#aaa"
                  />
                </TouchableOpacity>
              </View>
              <Text style={styles.helperText}>비밀번호와 동일하게 입력</Text>

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



              {/* 로그인 링크 */}
              <View style={{ alignItems: "center", marginVertical: 15 }}>
                <Text style={{ color: "#666", fontSize: 13 }}>
                  이미 계정이 있으신가요?{" "}
                  <Text style={{ color: "#8B5CF6", fontWeight: "bold" }} onPress={onShowLogin}>
                    로그인
                  </Text>
                </Text>
              </View>

              {/* ✅ 개발자를 위한 빠른 테스트 */}
              <View style={styles.devBox}>
                <Text style={styles.devLabel}>개발자 테스트</Text>
                <TouchableOpacity
                    onPress={() => {
                      setFormData({
                        name: "테스트 사용자",
                        email: "test@example.com",
                        password: "test123",
                        confirmPassword: "test123",
                      });
                      setAgreeTerms(true);
                    }}
                    style={styles.devButton}
                    disabled={isLoading}
                >
                  <Text style={styles.devButtonText}>테스트 데이터 자동 입력</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8F4FF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollWrapper: {
    padding: 22,
    minHeight: "100%",
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 2 },
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
  // ✅ 아이콘이 오른쪽에 겹치지 않도록 여유로운 패딩
  inputWithTrailingIcon: {
    paddingRight: 56, // 아이콘(18) + 여백 + 터치영역 고려 (52~64 권장)
  },
  inputIcon: { position: "absolute", left: 10, zIndex: 10 },
  // ✅ 터치 영역을 명확히 하고, 입력 텍스트와 겹치지 않게 함
  eyeBtn: {
    position: "absolute",
    right: 6,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  // ✅ 규칙/가이드용 헬퍼 텍스트
  helperText: {
    marginTop: 4,
    marginLeft: 2,
    color: "#6B7280",
    fontSize: 12,
  },
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

  devBox: {
    marginTop: 12,
    backgroundColor: "#f0f9ff",
    borderRadius: 7,
    padding: 10,
    alignItems: "center",
  },
  devLabel: {
    color: "#0369a1",
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 12,
  },
  devButton: {
    backgroundColor: "#0ea5e9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
  },
  devButtonText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
});
