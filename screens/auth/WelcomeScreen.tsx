import React from "react";
import { View, Text, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { Card, Button } from "react-native-paper";

interface WelcomeScreenProps {
  onShowLogin: () => void;
  onShowSignup: () => void;
}

export default function WelcomeScreen({ onShowLogin, onShowSignup }: WelcomeScreenProps) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Card style={styles.card}>
          <View style={styles.content}>
            {/* Logo & Title */}
            <View style={styles.logoWrapper}>
              <View style={styles.logoCircle}>
                <Text style={styles.logoText}>D</Text>
              </View>
              <View style={{ marginTop: 8, alignItems: "center" }}>
                <Text style={styles.title}>TrendLog</Text>
                <Text style={styles.subtitle}>나의 첫 경험, 세상의 첫 트렌드</Text>
              </View>
            </View>

            {/* Features */}
            <View style={styles.features}>
              <FeatureItem
                emoji="📝"
                title="첫 경험 기록"
                description="특별한 순간들을 기록하고 공유하세요"
                bgColor="#EDE9FE"
                textColor="#7C3AED"
              />
              <FeatureItem
                emoji="📊"
                title="트렌드 분석"
                description="당신의 경험이 어떤 트렌드였는지 확인하세요"
                bgColor="#FCE7F3"
                textColor="#DB2777"
              />
              <FeatureItem
                emoji="🗺️"
                title="경험 지도"
                description="지도에서 경험들을 시각적으로 탐색하세요"
                bgColor="#DBEAFE"
                textColor="#2563EB"
              />
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                mode="contained"
                onPress={onShowSignup}
                contentStyle={styles.buttonContent}
                style={styles.signupBtn}
                uppercase={false}
              >
                시작하기
              </Button>
              <Button
                mode="outlined"
                onPress={onShowLogin}
                contentStyle={styles.buttonContent}
                style={styles.loginBtn}
                uppercase={false}
              >
                이미 계정이 있어요
              </Button>
            </View>

            {/* Footer */}
            <Text style={styles.footerText}>
              가입하면{" "}
              <Text style={styles.highlight}>이용약관</Text> 및{" "}
              <Text style={styles.highlight}>개인정보처리방침</Text>에 동의하는 것으로 간주됩니다.
            </Text>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

interface FeatureItemProps {
  emoji: string;
  title: string;
  description: string;
  bgColor: string;
  textColor: string;
}

function FeatureItem({ emoji, title, description, bgColor, textColor }: FeatureItemProps) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureIconCircle, { backgroundColor: bgColor }]}>
        <Text style={[styles.featureEmoji, { color: textColor }]}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "rgba(240, 238, 255, 1)",
  },
  scrollView: {
    flex: 1,
  },
  container: {
    paddingVertical: 40,
    paddingHorizontal: 16,
    minHeight: '100%',
    justifyContent: "center",
  },
  card: {
    maxWidth: 400,
    alignSelf: "center",
    borderRadius: 16,
    elevation: 6,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  content: {
    padding: 24,
    alignItems: "center",
  },

  logoWrapper: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    color: "#fff",
    fontSize: 36,
    fontWeight: "bold",
  },

  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#7C3AED",
  },
  subtitle: {
    marginTop: 6,
    color: "#555",
    fontSize: 14,
    textAlign: "center",
  },

  features: {
    width: "100%",
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  featureIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureTitle: {
    fontWeight: "600",
    color: "#111",
    marginBottom: 2,
  },
  featureDescription: {
    fontSize: 13,
    color: "#666",
  },

  actions: {
    width: "100%",
    marginBottom: 20,
  },
  signupBtn: {
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
  },
  loginBtn: {
    borderRadius: 8,
    borderColor: "#7C3AED",
    borderWidth: 1,
  },
  buttonContent: {
    height: 48,
  },

  footerText: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    paddingHorizontal: 12,
  },
  highlight: {
    color: "#7C3AED",
    fontWeight: "600",
  },
});