import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Modal,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { Card, Button } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

// 프로필 데이터 타입
type ThemeType = "light" | "dark" | "auto";
interface ProfileData {
  username: string;
  email: string;
  bio: string;
  birthDate: string;
  location: string;
  profileImage: string;
  isPublic: boolean;
  allowNotifications: boolean;
  allowLocationTracking: boolean;
  theme: ThemeType;
}

interface ProfileEditProps {
  onClose: () => void;
  onSave: (profileData: ProfileData) => void;
  initialProfileData?: ProfileData;
}

const defaultProfileData: ProfileData = {
  username: "사용자",
  email: "user@example.com",
  bio: "트렌드를 탐험하는 것을 좋아합니다!",
  birthDate: "1995-06-15",
  location: "서울특별시",
  profileImage: "",
  isPublic: true,
  allowNotifications: true,
  allowLocationTracking: false,
  theme: "light",
};

const themeOptions = {
  light: "🌞 라이트 모드",
  dark: "🌙 다크 모드",
  auto: "🔄 시스템 설정",
} as const;

export default function ProfileEdit({
  onClose,
  onSave,
  initialProfileData,
}: ProfileEditProps) {
  const [profileData, setProfileData] = useState<ProfileData>(
    initialProfileData || defaultProfileData
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);

  // 프로필 저장
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await new Promise((res) => setTimeout(res, 1000));
      onSave(profileData);
      onClose();
    } catch (error) {
      Alert.alert("오류", "저장 중 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  // 이미지 업로드(실제 앱에서는 이미지 선택 API 연동 필요)
  const handleImageUpload = () => {
    Alert.alert("업로드 안내", "이미지 업로드 기능은 실제 구현 시 추가됩니다.");
  };

  // 프로필 데이터 업데이트 헬퍼
  const updateProfileData = (updates: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...updates }));
  };

  // 테마 선택 핸들러
  const handleThemeSelect = (theme: ThemeType) => {
    updateProfileData({ theme });
    setShowThemeModal(false);
  };

  // 모달 방식 테마 선택
  const renderThemeModal = () => (
    <Modal
      visible={showThemeModal}
      animationType="slide"
      transparent
      onRequestClose={() => setShowThemeModal(false)}
    >
      <View style={styles.themeModalOverlay}>
        <View style={styles.themeModalSheet}>
          <Text style={styles.modalTitle}>테마 선택</Text>
          {Object.entries(themeOptions).map(([value, label]) => (
            <TouchableOpacity
              key={value}
              style={[
                styles.themeOption,
                profileData.theme === value && styles.themeOptionSelected,
              ]}
              onPress={() => handleThemeSelect(value as ThemeType)}
            >
              <Text style={styles.themeOptionText}>{label}</Text>
              {profileData.theme === value && (
                <Ionicons name="checkmark" size={20} color="#8B5CF6" />
              )}
            </TouchableOpacity>
          ))}
          <Button mode="outlined" onPress={() => setShowThemeModal(false)} style={styles.modalCloseBtn}>
            닫기
          </Button>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView contentContainerStyle={styles.root} keyboardShouldPersistTaps="handled">
      <Card style={styles.card}>
        {/* 상단 헤더 */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#8B5CF6" />
          </TouchableOpacity>
          <Text style={styles.title}>프로필 수정</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        {isLoading && (
          <ActivityIndicator color="#8B5CF6" style={styles.loadingIndicator} />
        )}

        {/* 프로필 사진 */}
        <TouchableOpacity style={styles.avatarWrap} onPress={handleImageUpload}>
          {profileData.profileImage ? (
            <Image
              source={{ uri: profileData.profileImage }}
              style={styles.avatarImg}
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {profileData.username.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.cameraBtn}>
            <MaterialIcons name="camera-alt" size={20} color="#fff" />
          </View>
        </TouchableOpacity>
        <Text style={styles.imgHint}>프로필 사진을 변경하려면 사진을 누르세요</Text>

        {/* 기본 정보 */}
        <Text style={styles.sectionTitle}>기본 정보</Text>
        
        <Text style={styles.label}>사용자명</Text>
        <TextInput
          style={styles.input}
          placeholder="사용자명을 입력하세요"
          value={profileData.username}
          onChangeText={(v) => updateProfileData({ username: v })}
        />
        
        <Text style={styles.label}>이메일</Text>
        <TextInput
          style={styles.input}
          placeholder="이메일을 입력하세요"
          value={profileData.email}
          onChangeText={(v) => updateProfileData({ email: v })}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <Text style={styles.label}>자기소개</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="자신을 소개해주세요"
          value={profileData.bio}
          onChangeText={(v) => updateProfileData({ bio: v })}
          multiline
          numberOfLines={3}
        />
        
        <Text style={styles.label}>생년월일</Text>
        <TextInput
          style={styles.input}
          placeholder="YYYY-MM-DD"
          value={profileData.birthDate}
          onChangeText={(v) => updateProfileData({ birthDate: v })}
        />
        
        <Text style={styles.label}>거주지</Text>
        <TextInput
          style={styles.input}
          placeholder="거주지를 입력하세요"
          value={profileData.location}
          onChangeText={(v) => updateProfileData({ location: v })}
        />

        {/* 프라이버시 · 알림 설정 */}
        <Text style={styles.sectionTitle}>프라이버시/알림 설정</Text>
        <ItemSwitch
          label="공개 프로필"
          description="다른 사용자가 내 프로필을 볼 수 있습니다"
          value={profileData.isPublic}
          onValueChange={(val) => updateProfileData({ isPublic: val })}
        />
        <ItemSwitch
          label="위치 추적 허용"
          description="경험 위치를 자동으로 기록합니다"
          value={profileData.allowLocationTracking}
          onValueChange={(val) => updateProfileData({ allowLocationTracking: val })}
        />
        <ItemSwitch
          label="푸시 알림"
          description="새로운 트렌드, 댓글, 좋아요 알림을 받습니다"
          value={profileData.allowNotifications}
          onValueChange={(val) => updateProfileData({ allowNotifications: val })}
        />

        {/* 테마 설정 */}
        <Text style={styles.sectionTitle}>앱 설정</Text>
        <TouchableOpacity
          style={styles.themeRow}
          onPress={() => setShowThemeModal(true)}
        >
          <Ionicons name="color-palette-outline" size={22} color="#8B5CF6" style={styles.themeIcon} />
          <View style={styles.themeContent}>
            <Text style={styles.themeLabel}>테마</Text>
            <Text style={styles.themeValue}>{themeOptions[profileData.theme]}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
        {renderThemeModal()}

        {/* 계정 관리 */}
        <Text style={styles.sectionTitle}>계정 관리</Text>
        <AccountLink label="비밀번호 변경" />
        <AccountLink label="데이터 내보내기" />
        <AccountLink label="계정 삭제" danger />

        {/* 하단 저장 버튼 */}
        <Button
          mode="contained"
          style={styles.saveBtn}
          onPress={handleSave}
          loading={isLoading}
          disabled={isLoading}
        >
          변경사항 저장
        </Button>
      </Card>
    </ScrollView>
  );
}

function ItemSwitch({
  label,
  description,
  value,
  onValueChange,
}: {
  label: string;
  description: string;
  value: boolean;
  onValueChange: (val: boolean) => void;
}) {
  return (
    <View style={styles.switchRow}>
      <View style={styles.switchContent}>
        <Text style={styles.itemSwitchLabel}>{label}</Text>
        <Text style={styles.itemSwitchDesc}>{description}</Text>
      </View>
      <Switch
        trackColor={{ false: "#ddd", true: "#8B5CF6" }}
        thumbColor={value ? "#A78BFA" : "#fafafa"}
        value={value}
        onValueChange={onValueChange}
      />
    </View>
  );
}

function AccountLink({ label, danger = false }: { label: string; danger?: boolean }) {
  const handlePress = () => {
    Alert.alert("안내", `${label} 기능은 추후 지원될 예정입니다.`);
  };

  return (
    <TouchableOpacity style={styles.accountLink} onPress={handlePress}>
      <Text style={[styles.accountLinkLabel, danger && styles.dangerText]}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#aaa" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: "#F6F6FF", paddingBottom: 40 },
  card: { margin: 14, borderRadius: 14, padding: 17, backgroundColor: "#fff" },
  headerRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between",
    marginBottom: 12 
  },
  backButton: {
    padding: 4,
  },
  title: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#8B5CF6",
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: { width: 32 },
  loadingIndicator: { marginBottom: 16 },
  avatarWrap: {
    alignSelf: "center",
    marginBottom: 7,
    marginTop: 6,
    position: "relative",
  },
  avatarImg: { 
    width: 80, 
    height: 80, 
    borderRadius: 40 
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#fff",
  },
  cameraBtn: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#8B5CF6",
    borderRadius: 16,
    padding: 5,
    borderWidth: 3,
    borderColor: "#fff",
  },
  imgHint: { 
    textAlign: "center", 
    color: "#AAA", 
    fontSize: 12, 
    marginBottom: 16 
  },
  sectionTitle: {
    fontWeight: "bold",
    fontSize: 15,
    color: "#7c3aed",
    marginBottom: 7,
    marginTop: 20,
  },
  label: { 
    fontWeight: "600", 
    color: "#555", 
    marginBottom: 4, 
    marginLeft: 2, 
    fontSize: 13 
  },
  input: {
    backgroundColor: "#f4f2fa",
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#e7e2f7",
    padding: 12,
    fontSize: 15,
    marginBottom: 12,
    color: "#1a1a2c",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F3FF",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 13,
    marginBottom: 8,
  },
  switchContent: { flex: 1 },
  itemSwitchLabel: { 
    fontWeight: "bold", 
    fontSize: 14, 
    color: "#4B2992" 
  },
  itemSwitchDesc: { 
    color: "#777", 
    fontSize: 12, 
    marginTop: 2 
  },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e9e1ff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 7,
    marginTop: 2,
  },
  themeIcon: { marginRight: 12 },
  themeContent: { flex: 1 },
  themeLabel: { 
    fontWeight: "bold", 
    fontSize: 15, 
    color: "#7c3aed" 
  },
  themeValue: { 
    fontSize: 13, 
    color: "#666", 
    marginTop: 2 
  },
  themeModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  themeModalSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    padding: 24,
    minHeight: 200,
  },
  modalTitle: { 
    fontWeight: "bold", 
    fontSize: 18, 
    marginBottom: 16, 
    color: "#7C3AED",
    textAlign: "center",
  },
  themeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  themeOptionSelected: { 
    backgroundColor: "#f4f2fa" 
  },
  themeOptionText: {
    fontSize: 16,
    color: "#374151",
  },
  modalCloseBtn: {
    marginTop: 16,
  },
  accountLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f0f0fa",
    borderRadius: 7,
    marginBottom: 8,
  },
  accountLinkLabel: { 
    fontWeight: "500", 
    color: "#4B2992",
    fontSize: 15,
  },
  dangerText: {
    color: "#dc2626",
  },
  saveBtn: {
    marginTop: 24,
    borderRadius: 8,
    backgroundColor: "#8B5CF6",
    height: 48,
    justifyContent: "center",
  },
});