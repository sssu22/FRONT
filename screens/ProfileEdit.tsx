// sssu22/front/FRONT-feature-4/screens/ProfileEdit.tsx

import React, { useState, useCallback, useEffect } from "react";
import {
    View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Switch, Modal, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { Button, Avatar } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from 'expo-image-picker';
import * as apiUtils from "../utils/apiUtils";
import { useGlobalContext } from "../GlobalContext";

interface ProfileEditProps {
    onClose: () => void;
}

export default function ProfileEdit({ onClose }: ProfileEditProps) {
    const { user, setUser, handleLogout } = useGlobalContext();

    const [isSaving, setIsSaving] = useState(false);

    // 로컬 상태는 GlobalContext의 user 상태로 명확히 초기화합니다.
    const [username, setUsername] = useState(user?.name || "");
    const [email] = useState(user?.email || "");
    const [bio, setBio] = useState(user?.stateMessage || "");
    const [birthday, setBirthday] = useState(user?.birth || "");
    const [location, setLocation] = useState(user?.address || "");
    const [allowLocation, setAllowLocation] = useState(user?.locationTracing || false);

    // 새로 선택한 이미지 파일(asset) 또는 기존/업데이트된 이미지 URL을 관리하는 상태
    const [profileImageSource, setProfileImageSource] = useState<string | ImagePicker.ImagePickerAsset | null>(user?.profileImageUrl || null);

    // 모달 관련 상태
    const [pwModalVisible, setPwModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPassword2, setNewPassword2] = useState("");
    const [pwLoading, setPwLoading] = useState(false);
    const [delModalVisible, setDelModalVisible] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [delLoading, setDelLoading] = useState(false);

    // --- � 1. 사진 선택 로직: 로컬 상태만 변경 ---
    // 사진을 선택하면 서버에 바로 업로드하지 않고, 로컬 상태에만 임시 저장하여 화면에 미리 보여줍니다.
    const handleSelectImage = useCallback(async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('권한 필요', '사진첩 접근 권한이 필요합니다.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            // 선택한 이미지 파일(asset) 자체를 상태에 저장합니다.
            setProfileImageSource(result.assets[0]);
        }
    }, []);

    // --- 💡 2. 저장 로직: 모든 변경사항을 한 번에 처리 ---
    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            let finalImageUrl = user.profileImageUrl;

            // 만약 새로 선택한 이미지가 있다면 (즉, profileImageSource가 파일 객체라면)
            if (profileImageSource && typeof profileImageSource === 'object' && 'uri' in profileImageSource) {
                // 이 시점에서만 이미지를 서버에 업로드하고 새 URL을 받습니다.
                finalImageUrl = await apiUtils.usersApi.updateProfileImage(profileImageSource);
            }

            // 텍스트 정보와 최종 이미지 URL을 합쳐서 서버에 전송합니다.
            const updatedProfileData = {
                name: username,
                address: location,
                stateMessage: bio,
                locationTracing: allowLocation,
                birth: birthday,
                profileImageUrl: finalImageUrl,
            };

            // 서버에 수정을 요청하고, 성공하면 서버가 반환하는 최신 정보로 전역 상태를 업데이트합니다.
            const fullyUpdatedUser = await apiUtils.usersApi.updateMe(updatedProfileData);
            setUser(fullyUpdatedUser);

            Alert.alert("성공", "프로필 정보가 성공적으로 업데이트되었습니다.");
            onClose();
        } catch (error) {
            console.error("프로필 업데이트 실패:", error);
            Alert.alert("오류", "프로필 업데이트에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => { if (!currentPassword.trim() || !newPassword.trim() || !newPassword2.trim()) { Alert.alert("입력 필요", "현재 비밀번호와 새 비밀번호를 모두 입력해주세요."); return; } if (newPassword.length < 8) { Alert.alert("비밀번호 규칙", "새 비밀번호는 8자 이상이어야 합니다."); return; } if (newPassword !== newPassword2) { Alert.alert("불일치", "새 비밀번호와 확인 비밀번호가 일치하지 않습니다."); return; } setPwLoading(true); try { await apiUtils.usersApi.changePassword({ currentPassword, newPassword }); Alert.alert("성공", "비밀번호가 변경되었습니다."); setPwModalVisible(false); } catch(e: any) { Alert.alert("오류", e.response?.data?.message || "비밀번호 변경에 실패했습니다."); } finally { setPwLoading(false); } };
    const actuallyDelete = async () => { setDelLoading(true); try { await apiUtils.usersApi.deleteAccount(); Alert.alert("성공", "계정이 삭제되었습니다. 이용해주셔서 감사합니다."); await handleLogout(); onClose(); } catch(e: any) { Alert.alert("오류", e.response?.data?.message || "계정 삭제에 실패했습니다."); } finally { setDelLoading(false); } };
    const handleDeleteAccount = () => { if (confirmText.trim().toUpperCase() !== "DELETE") { Alert.alert('오류', '"DELETE"를 정확히 입력해주세요.'); return; } Alert.alert( "정말 삭제할까요?", "계정을 삭제하면 모든 데이터가 영구적으로 삭제되며, 되돌릴 수 없습니다.", [ { text: "취소", style: "cancel" }, { text: "삭제", style: "destructive", onPress: actuallyDelete }, ] ); };

    // --- 💡 3. 아바타 렌더링 로직 개선 ---
    const renderAvatar = () => {
        let sourceUri: string | undefined;

        if (profileImageSource && typeof profileImageSource === 'object' && 'uri' in profileImageSource) {
            sourceUri = profileImageSource.uri; // 새로 선택한 로컬 이미지
        } else if (typeof profileImageSource === 'string' && profileImageSource) {
            sourceUri = profileImageSource; // 기존 서버 URL
        }

        if (sourceUri) {
            return <Avatar.Image size={80} source={{ uri: sourceUri }} />;
        }

        return <Avatar.Text size={80} label={(user?.name || "U").charAt(0)} />;
    };

    return (
        <>
            <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
                <View style={styles.header}>
                    <TouchableOpacity onPress={onClose}><Ionicons name="arrow-back" size={24} color="#333" /></TouchableOpacity>
                    <Text style={styles.headerTitle}>프로필 수정</Text>
                </View>

                <View style={styles.profileImageSection}>
                    <TouchableOpacity onPress={handleSelectImage} disabled={isSaving}>
                        {renderAvatar()}
                    </TouchableOpacity>
                    <Text style={styles.photoText}>사진을 눌러 프로필 이미지를 변경하세요.</Text>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>기본 정보</Text>
                    <TextInput style={styles.input} placeholder="사용자명" value={username} onChangeText={setUsername} />
                    <TextInput style={[styles.input, { backgroundColor: "#f3f4f6", color: "#888" }]} value={email} editable={false} />
                    <TextInput style={[styles.input, { height: 70, textAlignVertical: "top" }]} placeholder="자기소개" value={bio} onChangeText={setBio} multiline />
                    <TextInput style={styles.input} placeholder="생년월일 (YYYY-MM-DD)" value={birthday} onChangeText={setBirthday} />
                    <TextInput style={styles.input} placeholder="거주지" value={location} onChangeText={setLocation} />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>프라이버시 설정</Text>
                    <View style={styles.switchRow}>
                        <Text>위치 추적 허용</Text>
                        <Switch value={allowLocation} onValueChange={setAllowLocation} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: "red" }]}>계정 관리</Text>
                    <TouchableOpacity style={styles.accountButton} onPress={() => setPwModalVisible(true)}><Text>비밀번호 변경</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.accountButton]} onPress={() => setDelModalVisible(true)}><Text style={{ color: "red" }}>계정 삭제</Text></TouchableOpacity>
                </View>

                <Button mode="contained" style={styles.saveButton} onPress={handleSave} loading={isSaving} disabled={isSaving}>
                    변경사항 저장
                </Button>
            </ScrollView>

            <Modal visible={pwModalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalWrap}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>비밀번호 변경</Text>
                        <Text style={styles.label}>현재 비밀번호</Text>
                        <TextInput style={styles.input} placeholder="현재 비밀번호" secureTextEntry value={currentPassword} onChangeText={setCurrentPassword}/>
                        <Text style={styles.label}>새 비밀번호</Text>
                        <TextInput style={styles.input} placeholder="새 비밀번호 (8자 이상)" secureTextEntry value={newPassword} onChangeText={setNewPassword}/>
                        <Text style={styles.label}>새 비밀번호 확인</Text>
                        <TextInput style={styles.input} placeholder="새 비밀번호 확인" secureTextEntry value={newPassword2} onChangeText={setNewPassword2}/>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalBtn, styles.outlineBtn]} disabled={pwLoading} onPress={() => { setPwModalVisible(false); setCurrentPassword(""); setNewPassword(""); setNewPassword2(""); }}>
                                <Text style={styles.outlineText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.primaryBtn]} onPress={handleChangePassword} disabled={pwLoading}>
                                {pwLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>변경</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
            <Modal visible={delModalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalWrap}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>계정 삭제</Text>
                        <Text style={styles.warnText}>계정을 삭제하면 복구할 수 없습니다. 계속하려면 <Text style={{ fontWeight: "bold" }}>"DELETE"</Text> 를 입력하세요.</Text>
                        <TextInput style={styles.input} placeholder='DELETE 를 입력' autoCapitalize="characters" value={confirmText} onChangeText={setConfirmText}/>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={[styles.modalBtn, styles.outlineBtn]} onPress={() => { setDelModalVisible(false); setConfirmText(""); }} disabled={delLoading}>
                                <Text style={styles.outlineText}>취소</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalBtn, styles.dangerSolidBtn]} onPress={handleDeleteAccount} disabled={delLoading}>
                                {delLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.dangerSolidText}>영구 삭제</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff", paddingHorizontal: 16 },
    header: { flexDirection: "row", alignItems: "center", paddingVertical: 16 },
    headerTitle: { fontSize: 18, fontWeight: "bold", marginLeft: 12 },
    profileImageSection: { alignItems: "center", marginVertical: 16 },
    photoText: { fontSize: 12, color: "#555", marginTop: 8, textAlign: "center" },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
    input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 8, padding: 10, marginBottom: 10, fontSize: 14, },
    switchRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8, },
    accountButton: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#eee", },
    saveButton: { backgroundColor: "#7c3aed", paddingVertical: 12, marginBottom: 20, borderRadius: 8, },
    modalWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "center", padding: 20, },
    modalCard: { backgroundColor: "#fff", borderRadius: 16, padding: 18, },
    modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12, },
    label: { fontSize: 13, color: "#666", marginTop: 6, marginBottom: 6, },
    warnText: { fontSize: 14, color: "#444", marginBottom: 10, },
    modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 10, marginTop: 8, },
    modalBtn: { minWidth: 92, height: 42, borderRadius: 10, alignItems: "center", justifyContent: "center", paddingHorizontal: 14, },
    outlineBtn: { borderWidth: 1, borderColor: "#DDD", backgroundColor: "#FFF", },
    outlineText: { fontWeight: "600", color: "#333", },
    primaryBtn: { backgroundColor: "#2F6EF2" },
    primaryText: { color: "#fff", fontWeight: "700" },
    dangerSolidBtn: { backgroundColor: "#D32F2F" },
    dangerSolidText: { color: "#fff", fontWeight: "700" },
    uploadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', borderRadius: 40, },
});