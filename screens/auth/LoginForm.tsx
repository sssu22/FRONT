// screens/auth/LoginForm.tsx - 실제 API 연동 버전
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
  onLogin: (credentials: { email: string; password: string }) => Promise<void>;
  onShowSignup: () => void;
  onBack: () => void;
  onShowResetPassword: () => void;
}

export default function LoginForm({ onLogin, onShowSignup, onBack, onShowResetPassword }: LoginFormProps) {
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

  return (
      <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Button mode="text" onPress={onBack} compact style={{ marginRight: 4 }}>
              <Ionicons name="arrow-back" size={20} color="#8B5CF6" />
            </Button>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={styles.title}>TrendLog</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>계정에 로그인하세요</Text>

          {!!error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
          )}

          <View style={{ marginTop: 10 }}>
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
                  onSubmitEditing={handleSubmit}
              />
              <TouchableOpacity
                  onPress={() => setShowPassword((p) => !p)}
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

            <Button
                mode="contained"
                onPress={handleSubmit}
                style={styles.loginBtn}
                disabled={isLoading}
                contentStyle={{ height: 45 }}
            >
              {isLoading ? <ActivityIndicator size="small" color="#fff" /> : "로그인"}
            </Button>

            <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={onShowResetPassword}
                disabled={isLoading}
            >
              <Text style={styles.forgotPasswordText}>
                비밀번호를 잊으셨나요?
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.separatorRow}>
            <View style={styles.separatorLine} />
            <Text style={styles.separatorText}>또는</Text>
            <View style={styles.separatorLine} />
          </View>

          <View style={{ alignItems: "center", marginVertical: 15 }}>
            <Text style={{ color: "#666", fontSize: 13 }}>
              계정이 없으신가요?{" "}
              <Text style={{ color: "#8B5CF6", fontWeight: "bold" }} onPress={onShowSignup}>
                회원가입
              </Text>
            </Text>
          </View>

          <View style={styles.demoBox}>
            <Text style={styles.demoLabel}>데모 계정으로 체험하기</Text>
            <Text style={styles.demoHint}>이메일: demo@trendlog.com</Text>
            <Text style={styles.demoHint}>비밀번호: demo123</Text>
            <TouchableOpacity
                onPress={handleDemoLogin}
                style={styles.demoButton}
                disabled={isLoading}
            >
              <Text style={styles.demoButtonText}>
                {isLoading ? "로그인 중..." : "데모 계정으로 로그인"}
              </Text>
            </TouchableOpacity>
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
    color: "#222",
  },
  inputIcon: { position: "absolute", left: 10, zIndex: 10 },
  eyeBtn: { position: "absolute", right: 8, zIndex: 10, padding: 5 },
  loginBtn: {
    marginTop: 16,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
  },
  forgotPasswordButton: {
    marginTop: 12,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#8B5CF6",
    fontSize: 13,
    fontWeight: "bold",
  },
  separatorRow: { flexDirection: "row", alignItems: "center", marginVertical: 16 },
  separatorLine: { flex: 1, height: 1, backgroundColor: "#eee" },
  separatorText: { marginHorizontal: 8, color: "#AAA", fontSize: 12 },
  demoBox: {
    marginTop: 8,
    backgroundColor: "#e6e6ff",
    borderRadius: 7,
    padding: 12,
    alignItems: "center"
  },
  demoLabel: {
    color: "#3A2C91",
    fontWeight: "bold",
    marginBottom: 6,
    fontSize: 13
  },
  demoHint: {
    color: "#7b75c0",
    fontSize: 11,
    marginBottom: 2
  },
  demoButton: {
    backgroundColor: "#8B5CF6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  demoButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});