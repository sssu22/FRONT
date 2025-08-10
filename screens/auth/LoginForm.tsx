// screens/auth/LoginForm.tsx - 키보드 문제 해결 버전
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
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
} from "react-native";
import { Button } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

interface LoginFormProps {
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
  onShowSignup: () => void;
  onBack: () => void;
}

export default function LoginForm({ onLogin, onShowSignup, onBack }: LoginFormProps) {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    // 키보드 숨기기
    Keyboard.dismiss();
    
    setIsLoading(true);
    setError("");
    
    if (!formData.email || !formData.password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      setIsLoading(false);
      return;
    }
    
    try {
      await onLogin({
        email: formData.email,
        password: formData.password
      });
    } catch (error: any) { 
      console.error("로그인 실패:", error);
      setError("로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    Keyboard.dismiss();
    setFormData({ email: "demo@trendlog.com", password: "demo123" });
    setIsLoading(true);
    setError("");
    
    try {
      await onLogin({
        email: "demo@trendlog.com",
        password: "demo123"
      });
    } catch (error: any) {
      console.error("데모 로그인 실패:", error);
      setError("데모 로그인에 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Keyboard.dismiss();
    setError("구글 로그인은 아직 구현되지 않았습니다.");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={20} color="#8B5CF6" />
              </TouchableOpacity>
              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={styles.title}>TrendLog</Text>
              </View>
              <View style={{ width: 32 }} />
            </View>
            <Text style={styles.subtitle}>계정에 로그인하세요</Text>

            {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={{ marginTop: 10 }}>
              <Text style={styles.label}>이메일</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="mail-outline" size={20} color="#bbb" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={formData.email}
                  onChangeText={(v) => setFormData({ ...formData, email: v })}
                  editable={!isLoading}
                  returnKeyType="next"
                  blurOnSubmit={false}
                  // 추가: 포커스 관련 속성
                  autoFocus={false}
                  selectTextOnFocus={true}
                />
              </View>

              <Text style={[styles.label, { marginTop: 12 }]}>비밀번호</Text>
              <View style={styles.inputContainer}>
                <MaterialIcons name="lock-outline" size={20} color="#bbb" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 45 }]}
                  placeholder="비밀번호를 입력하세요"
                  secureTextEntry={!showPassword}
                  autoCorrect={false}
                  value={formData.password}
                  onChangeText={(v) => setFormData({ ...formData, password: v })}
                  editable={!isLoading}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  selectTextOnFocus={true}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
                  style={styles.eyeBtn}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility-off" : "visibility"}
                    size={18}
                    color="#aaa"
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                onPress={handleSubmit}
                style={[
                  styles.loginBtn,
                  { backgroundColor: isLoading ? "#ccc" : "#8B5CF6" }
                ]}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.loginBtnText}>로그인</Text>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.separatorRow}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>또는</Text>
              <View style={styles.separatorLine} />
            </View>

            <TouchableOpacity
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={styles.googleBtn}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-google" size={18} color="#EA4335" />
              <Text style={styles.googleBtnText}>Google로 로그인</Text>
            </TouchableOpacity>

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

            {/* 데모 계정 섹션 */}
            <View style={styles.demoBox}>
              <Text style={styles.demoLabel}>데모 계정으로 체험하기</Text>
              <Text style={styles.demoHint}>이메일: demo@trendlog.com</Text>
              <Text style={styles.demoHint}>비밀번호: demo123</Text>
              <TouchableOpacity
                onPress={handleDemoLogin}
                style={[
                  styles.demoButton,
                  { backgroundColor: isLoading ? "#ccc" : "#8B5CF6" }
                ]}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.demoButtonText}>
                  {isLoading ? "로그인 중..." : "데모 계정으로 로그인"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: { 
    flex: 1, 
    backgroundColor: "#F8F4FF" 
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 22,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 22,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  headerRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginBottom: 10 
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    backgroundColor: "#8B5CF6",
    color: "#fff",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  subtitle: { 
    textAlign: "center", 
    color: "#666", 
    fontSize: 15, 
    marginBottom: 8 
  },
  errorBox: {
    backgroundColor: "#fff1f1",
    borderColor: "#ef9f9f",
    borderWidth: 1,
    borderRadius: 7,
    padding: 8,
    marginVertical: 6,
  },
  errorText: { 
    color: "#C42D7D", 
    fontSize: 13, 
    textAlign: "center" 
  },
  label: { 
    fontWeight: "bold", 
    marginBottom: 6, 
    color: "#222", 
    marginLeft: 2, 
    fontSize: 13 
  },
  inputContainer: { 
    position: "relative",
    marginBottom: 8,
  },
  input: {
    height: 48,
    fontSize: 16,
    backgroundColor: "#F6F6F9",
    borderRadius: 8,
    borderColor: "#ddd",
    borderWidth: 1,
    paddingLeft: 45,
    paddingRight: 16,
    color: "#222",
    // 추가: 키보드 관련 스타일
    textAlignVertical: "center",
  },
  inputIcon: { 
    position: "absolute", 
    left: 12, 
    top: 14,
    zIndex: 10 
  },
  eyeBtn: { 
    position: "absolute", 
    right: 12, 
    top: 15,
    zIndex: 10, 
    padding: 4,
  },
  loginBtn: {
    marginTop: 20,
    borderRadius: 8,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  loginBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  separatorRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    marginVertical: 20 
  },
  separatorLine: { 
    flex: 1, 
    height: 1, 
    backgroundColor: "#eee" 
  },
  separatorText: { 
    marginHorizontal: 12, 
    color: "#AAA", 
    fontSize: 12 
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#F9F9F9",
  },
  googleBtnText: {
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  demoBox: { 
    marginTop: 16, 
    backgroundColor: "#e8f2ff", 
    borderRadius: 8, 
    padding: 16, 
    alignItems: "center" 
  },
  demoLabel: { 
    color: "#1e40af", 
    fontWeight: "bold", 
    marginBottom: 8, 
    fontSize: 14 
  },
  demoHint: { 
    color: "#3b82f6", 
    fontSize: 12, 
    marginBottom: 2 
  },
  demoButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  demoButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
});