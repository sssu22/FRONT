import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Switch,
} from "react-native";
import { Button, Avatar } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function ProfileEdit({ navigation }: any) {
  const [username, setUsername] = useState("사용자");
  const [email] = useState("user@example.com"); // 변경 불가
  const [bio, setBio] = useState("트렌드를 탐험하는 것을 좋아합니다!");
  const [birthday, setBirthday] = useState("1995-06-15");
  const [location, setLocation] = useState("서울특별시");

  const [allowLocation, setAllowLocation] = useState(false);

  const handleSave = () => {
    alert("변경사항이 저장되었습니다!");
    navigation.goBack();
  };

  return (
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>프로필 수정</Text>
        </View>

        {/* 프로필 이미지 */}
        <View style={styles.profileImageSection}>
          <Avatar.Text size={80} label={username.charAt(0)} />
          <TouchableOpacity style={styles.cameraIcon}>
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.photoText}>프로필 사진을 변경하려면 카메라 아이콘을 클릭하세요</Text>
        </View>

        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <TextInput
              style={styles.input}
              placeholder="사용자명"
              value={username}
              onChangeText={setUsername}
          />
          <TextInput
              style={[styles.input, { backgroundColor: "#f3f4f6", color: "#888" }]}
              value={email}
              editable={false} // 이메일 변경 불가
          />
          <TextInput
              style={[styles.input, { height: 70 }]}
              placeholder="자기소개"
              value={bio}
              onChangeText={setBio}
              multiline
          />
          <TextInput
              style={styles.input}
              placeholder="생년월일"
              value={birthday}
              onChangeText={setBirthday}
          />
          <TextInput
              style={styles.input}
              placeholder="거주지"
              value={location}
              onChangeText={setLocation}
          />
        </View>

        {/* 프라이버시 설정 (공개 프로필 제거) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>프라이버시 설정</Text>
          <View style={styles.switchRow}>
            <Text>위치 추적 허용</Text>
            <Switch value={allowLocation} onValueChange={setAllowLocation} />
          </View>
        </View>

        {/* 계정 관리 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "red" }]}>계정 관리</Text>
          <TouchableOpacity style={styles.accountButton}>
            <Text>비밀번호 변경</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.accountButton}>
            <Text>데이터 내보내기</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.accountButton, { color: "red" }]}>
            <Text style={{ color: "red" }}>계정 삭제</Text>
          </TouchableOpacity>
        </View>

        <Button mode="contained" style={styles.saveButton} onPress={handleSave}>
          변경사항 저장
        </Button>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
  header: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
  headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 12 },
  profileImageSection: { alignItems: "center", marginVertical: 16 },
  cameraIcon: {
    position: "absolute",
    right: "40%",
    bottom: 20,
    backgroundColor: "#7c3aed",
    padding: 6,
    borderRadius: 20,
  },
  photoText: { fontSize: 12, color: "#555", marginTop: 8, textAlign: "center" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    fontSize: 14,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  accountButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  saveButton: {
    backgroundColor: "#7c3aed",
    paddingVertical: 12,
    marginBottom: 20,
    borderRadius: 8,
  },
});
