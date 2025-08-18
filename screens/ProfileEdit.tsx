// sssu22/front/FRONT-feature-UI-API2-/screens/ProfileEdit.tsx

import React, { useState, useCallback } from "react";
import {
    View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Switch, Modal, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
} from "react-native";
import { Button, Avatar } from "react-native-paper";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as ImagePicker from 'expo-image-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker"; // DatePicker 임포트
import * as apiUtils from "../utils/apiUtils";
import { useGlobalContext } from "../GlobalContext";

interface ProfileEditProps {
    onClose: () => void;
}

export default function ProfileEdit({ onClose }: ProfileEditProps) {
    const { user, setUser, handleLogout } = useGlobalContext();

    const [isSaving, setIsSaving] = useState(false);

    // 로컬 상태
    const [username, setUsername] = useState(user?.name || "");
    const [email] = useState(user?.email || "");
    const [bio, setBio] = useState(user?.stateMessage || "");
    const [birthday, setBirthday] = useState(user?.birth || "");
    const [location, setLocation] = useState(user?.address || "");
    const [allowLocation, setAllowLocation] = useState(user?.locationTracing || false);
    const [profileImageSource, setProfileImageSource] = useState<string | ImagePicker.ImagePickerAsset | null>(user?.profileImageUrl || null);

    // DatePicker 상태 추가
    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

    // 모달 관련 상태
    const [pwModalVisible, setPwModalVisible] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [newPassword2, setNewPassword2] = useState("");
    const [pwLoading, setPwLoading] = useState(false);
    const [delModalVisible, setDelModalVisible] = useState(false);
    const [confirmText, setConfirmText] = useState("");
    const [delLoading, setDelLoading] = useState(false);

    // --- DatePicker 핸들러 함수 ---
    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const handleConfirmDate = (date: Date) => {
        // Timezone 문제를 피하기 위해 수동으로 날짜 포맷팅
        const year = date.getFullYear();
        const month = ('0' + (date.getMonth() + 1)).slice(-2);
        const day = ('0' + date.getDate()).slice(-2);
        const formattedDate = `${year}-${month}-${day}`;

        setBirthday(formattedDate);
        hideDatePicker();
    };


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
            setProfileImageSource(result.assets[0]);
        }
    }, []);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);
        try {
            let finalImageUrl = user.profileImageUrl;

            if (profileImageSource && typeof profileImageSource === 'object' && 'uri' in profileImageSource) {
                finalImageUrl = await apiUtils.usersApi.updateProfileImage(profileImageSource);
            }

            const updatedProfileData = {
                name: username,
                address: location,
                stateMessage: bio,
                locationTracing: allowLocation,
                birth: birthday,
                profileImageUrl: finalImageUrl,
            };

            await apiUtils.usersApi.updateMe(updatedProfileData);
            const refreshedUser = await apiUtils.authApi.validateToken();
            setUser(refreshedUser);

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

    const renderAvatar = () => {
        let sourceUri: string | undefined;

        if (profileImageSource && typeof profileImageSource === 'object' && 'uri' in profileImageSource) {
            sourceUri = profileImageSource.uri;
        } else if (typeof profileImageSource === 'string' && profileImageSource) {
            sourceUri = profileImageSource;
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

                    {/* --- 💡 생년월일 TextInput을 TouchableOpacity로 변경 --- */}
                    <TouchableOpacity onPress={showDatePicker}>
                        <Text style={[styles.input, { paddingVertical: 12, color: birthday ? '#333' : '#999' }]}>
                            {birthday || "생년월일 (YYYY-MM-DD)"}
                        </Text>
                    </TouchableOpacity>

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

            {/* --- 💡 DateTimePickerModal 추가 --- */}
            <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirmDate}
                onCancel={hideDatePicker}
                // 생일 선택이므로 미래 날짜는 선택할 수 없도록 설정
                maximumDate={new Date()}
            />

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