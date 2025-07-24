// TrendSelector.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  Platform,
  Dimensions,
} from "react-native";
import { Feather, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { dummyTrendDetails } from "../screens/data/dummyTrends"; // 경로 맞게 수정

interface Trend {
  id: string;
  name: string;
  description: string;
  category: string;
  popularity: number;
  createdAt: string;
}

interface TrendSelectorProps {
  selectedTrend: Trend | null;
  onTrendSelect: (trend: Trend | null) => void;
  onClose: () => void;
}

const mappedTrends: Trend[] = dummyTrendDetails.map((item) => ({
  id: item.trendId.toString(),
  name: item.title,
  description: item.description,
  category: item.category,
  popularity: item.score,
  createdAt: item.peakPeriod + "-01",
}));

const CATEGORIES = [
  "전체", "음식", "라이프스타일", "문화", "건강", "투자", "소셜", "기타", "환경"
];

const MAX_POPUP_WIDTH = Math.min(Dimensions.get("window").width - 32, 560);

export default function TrendSelector({
  selectedTrend,
  onTrendSelect,
  onClose,
}: TrendSelectorProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("전체");
  const [trends, setTrends] = useState<Trend[]>(mappedTrends);
  const [showCreate, setShowCreate] = useState(false);
  const [newTrend, setNewTrend] = useState({ name: "", description: "", category: "기타" });

  const filtered = trends.filter((v) => {
    const q = search.trim().toLowerCase();
    const matchSearch =
      v.name.toLowerCase().includes(q) || v.description.toLowerCase().includes(q);
    const matchCat = category === "전체" || v.category === category;
    return matchSearch && matchCat;
  });
  const sortedTrends = [...filtered].sort((a, b) => b.popularity - a.popularity);

  const handleCreate = () => {
    if (!newTrend.name.trim() || !newTrend.description.trim()) return;
    const trend: Trend = {
      id: Date.now().toString(),
      name: newTrend.name.trim(),
      description: newTrend.description.trim(),
      category: newTrend.category,
      popularity: Math.floor(Math.random() * 30) + 60,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setTrends([trend, ...trends]);
    onTrendSelect(trend);
    setShowCreate(false);
    setNewTrend({ name: "", description: "", category: "기타" });
  };

  function highlight(text: string, q: string) {
    if (!q) return <Text>{text}</Text>;
    const reg = new RegExp(`(${q})`, "gi");
    const parts = text.split(reg);
    return (
      <Text>
        {parts.map((part, i) =>
          reg.test(part)
            ? <Text key={i} style={styles.highlight}>{part}</Text>
            : <Text key={i}>{part}</Text>
        )}
      </Text>
    );
  }

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.dimmed}>
        <View style={[styles.popup, { maxWidth: MAX_POPUP_WIDTH }]}>
          <View style={styles.popupHeader}>
            <View style={{ flexDirection:"row", alignItems:"center" }}>
              <MaterialIcons name="trending-up" size={20} color="#7C3AED"/>
              <Text style={styles.popupTitle}>트렌드 선택</Text>
            </View>
            <TouchableOpacity hitSlop={14} onPress={onClose}>
              <Ionicons name="close" size={20} color="#6B7280"/>
            </TouchableOpacity>
          </View>
          <Text style={styles.popupSubtitle}>경험과 관련된 트렌드를 선택하거나 새로 만드세요</Text>
          
          {selectedTrend && (
            <View style={styles.selectedCard}>
              <View style={{ flexDirection:"row", alignItems:"center" }}>
                <Feather name="hash" size={14} color="#7C3AED" />
                <Text style={{marginLeft:5,fontWeight:"600",color:"#5B21B6"}}>선택된 트렌드:</Text>
                <Text style={styles.selectedName}>{selectedTrend.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => onTrendSelect(null)}
                accessibilityRole="button"
              >
                <Text style={{ color:"#985fff", marginLeft:10, fontWeight:"bold" }}>변경</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.searchRow}>
            <Feather name="search" size={17} color="#a3a3b7" style={styles.searchIcon}/>
            <TextInput
              style={styles.searchInput}
              placeholder="트렌드 검색..."
              value={search}
              onChangeText={setSearch}
              placeholderTextColor="#b1a7d6"
              returnKeyType="search"
            />
          </View>
          
          <View style={styles.categoryRow}>
            {CATEGORIES.map((v) => (
              <TouchableOpacity
                key={v} onPress={() => setCategory(v)}
                style={[
                  styles.categoryBadge,
                  v === category ? styles.categoryBadgeActive : null,
                ]}>
                <Text style={v===category ? styles.catActiveText : styles.catText}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => setShowCreate(!showCreate)}
            activeOpacity={.85}
          >
            <Feather name="plus" size={16} color="#7C3AED"/>
            <Text style={{ color:"#7C3AED", fontWeight:"bold", marginLeft:7 }}>새 트렌드 만들기</Text>
          </TouchableOpacity>

          {showCreate && (
            <View style={styles.createForm}>
              <Text style={styles.formLabel}>이름</Text>
              <TextInput
                style={styles.formInput}
                placeholder="예: 제로웨이스트"
                value={newTrend.name}
                onChangeText={name => setNewTrend({...newTrend, name})}
              />
              <Text style={styles.formLabel}>설명</Text>
              <TextInput
                style={[styles.formInput, {height:50}]}
                placeholder="설명을 입력하세요"
                multiline
                value={newTrend.description}
                onChangeText={description => setNewTrend({...newTrend, description})}
              />
              <Text style={styles.formLabel}>카테고리</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {CATEGORIES.filter(c=>c!=="전체").map((c)=>(
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.categoryBadge,
                      newTrend.category===c ? styles.categoryBadgeActive : null,
                      {marginBottom:8, marginRight:7}
                    ]}
                    onPress={()=>setNewTrend({...newTrend, category:c})}
                  >
                    <Text style={newTrend.category===c?styles.catActiveText:styles.catText}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={{ flexDirection:"row", marginTop:8 }}>
                <TouchableOpacity
                  style={[
                    styles.formBtn,
                    (!newTrend.name.trim() || !newTrend.description.trim()) && styles.formBtnDisabled
                  ]}
                  disabled={!newTrend.name.trim() || !newTrend.description.trim()}
                  onPress={handleCreate}
                >
                  <Text style={styles.formBtnText}>트렌드 생성</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={()=>setShowCreate(false)}>
                  <Text style={styles.cancelBtnText}>취소</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <View style={{marginTop:12, flex:1}}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>
                {search
                  ? "검색 결과"
                  : category === "전체"
                  ? "인기 트렌드"
                  : `${category} 트렌드`}
              </Text>
              <Text style={styles.listCount}>{sortedTrends.length}개</Text>
            </View>
            <ScrollView
              style={{ maxHeight:300,marginTop:6}}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={true}
            >
              {sortedTrends.length === 0 ? (
                <View style={styles.noResultBox}>
                  <Text style={{ fontSize:36, marginBottom:6, color:"#c4b5fd" }}>🔍</Text>
                  <Text style={styles.noResultTitle}>검색 결과가 없습니다</Text>
                  <Text style={styles.noResultSubtitle}>다른 키워드로 검색하거나 새 트렌드를 만들어보세요</Text>
                  <TouchableOpacity
                    style={styles.noResultBtn}
                    onPress={()=>setShowCreate(true)}
                  >
                    <Feather name="plus" size={16} color="#7C3AED"/>
                    <Text style={{color:"#7C3AED", fontWeight:"bold", marginLeft:7 }}>새 트렌드 만들기</Text>
                  </TouchableOpacity>
                </View>
              ): (
                sortedTrends.map((trend, idx) => {
                  const selected = selectedTrend?.id === trend.id;
                  return (
                    <TouchableOpacity
                      key={trend.id}
                      style={[
                        styles.trendItem,
                        selected && styles.trendItemActive,
                      ]}
                      onPress={()=>onTrendSelect(trend)}
                      activeOpacity={.85}
                    >
                      <View style={[
                        styles.rankCircle,
                        idx < 3 ? styles.rankCircleTop : styles.rankCircleBasic
                      ]}>
                        <Text style={styles.rankNum}>{idx+1}</Text>
                      </View>
                      <View style={{ flex:1, marginLeft:8 }}>
                        <View style={styles.itemRow}>
                          <Text style={styles.trendItemName}>{ highlight(trend.name, search) }</Text>
                          <View style={styles.trendCatBadge}>
                            <Text style={styles.trendCatBadgeText}>{trend.category}</Text>
                          </View>
                          <Text style={styles.trendPop}>{trend.popularity}</Text>
                        </View>
                        <Text style={styles.trendItemDesc}>{ highlight(trend.description, search)}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dimmed: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
    justifyContent: "center",
    alignItems: "center",
  },
  popup: {
    width: "100%",
    maxWidth: 540,
    minWidth: 320,
    backgroundColor: "#fff",
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 18,
    elevation: 7,
    shadowColor: "#000",
    shadowOffset: { width:0, height:3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    maxHeight: 570,
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  popupTitle: {
    fontSize: 19,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#7C3AED",
  },
  popupSubtitle: {
    color: "#6B7280",
    fontSize: 13,
    marginBottom: 10,
    marginTop: 3,
    marginLeft:2
  },
  selectedCard: {
    flexDirection: "row",
    justifyContent:"space-between",
    alignItems:"center",
    backgroundColor: "#f5f3ff",
    borderColor:"#e9e7fb",
    borderWidth:1,
    borderRadius:9,
    padding:9,
    marginBottom:14,
  },
  selectedName:{ marginLeft:6, fontWeight:"bold", color:"#7C3AED", fontSize:15 },

  searchRow: {
    flexDirection:"row",
    alignItems:"center",
    backgroundColor:"#f3f2fa",
    borderRadius: 8,
    borderWidth:1,
    borderColor:"#ece5fc",
    paddingHorizontal:8,
    marginBottom:10,
    marginTop:2,
  },
  searchIcon: { marginRight: 4 },
  searchInput: {
    flex: 1,
    height: 32,
    fontSize: 15,
    color: "#513499",
    paddingLeft: 6,
    backgroundColor:"transparent",
  },

  categoryRow: {
    flexDirection:"row",
    flexWrap:"wrap",
    marginBottom:10,
    gap:6,
  },
  categoryBadge: {
    paddingVertical: 5, paddingHorizontal: 14,
    marginRight:5, marginTop:4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e3e4fa",
    backgroundColor: "#f6f5ff",
  },
  categoryBadgeActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  catText: { fontWeight:"600", fontSize:13, color:"#7C3AED" },
  catActiveText: { fontWeight:"700", fontSize:13, color:"#fff" },

  createBtn: {
    flexDirection:"row",
    justifyContent:"center",
    alignItems:"center",
    borderColor:"#e7d6fd",
    borderWidth:1,
    borderStyle:"dashed",
    paddingVertical:10,
    borderRadius:8,
    marginBottom:12,
    backgroundColor:"#faf8ff"
  },
  createForm: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    padding: 13,
    marginBottom: 12,
  },
  formLabel: { fontWeight:"700", color:"#514194", marginBottom:4, fontSize:13 },
  formInput: {
    borderWidth: 1, borderColor: "#d1c6f4", borderRadius: 7,
    paddingHorizontal: 9, height: 36, fontSize: 15,
    marginBottom: 7, color: "#18173c", backgroundColor: "#fff"
  },
  btnRow: { flexDirection:"row",marginTop:4 },
  formBtn: {
    backgroundColor: "#7C3AED",
    borderRadius: 7,
    paddingVertical: 10, paddingHorizontal: 19,
    marginRight:10,
  },
  formBtnDisabled:{ backgroundColor:"#e9ddfa" },
  formBtnText: { color:"#fff", fontWeight:"bold", fontSize:15 },
  cancelBtn: {
    borderWidth:1, borderColor: "#a78bfa", borderRadius:7,
    paddingVertical:10, paddingHorizontal:19,
  },
  cancelBtnText: { color:"#7C3AED", fontWeight:"bold", fontSize:15 },

  listHeader: { flexDirection:"row", justifyContent:"space-between", marginBottom:6 },
  listTitle: { fontWeight:"700", fontSize:16, color:"#111827" },
  listCount: { fontSize: 13, color: "#a89af2", marginTop:2 },

  noResultBox: { alignItems:"center", paddingVertical:30 },
  noResultTitle: { fontWeight:"bold", color:"#7c3aed", fontSize:16 },
  noResultSubtitle: { fontSize:13, color:"#8988b7", marginVertical:6 },
  noResultBtn: {
    flexDirection:"row",
    alignItems:"center",
    borderColor:"#e7d6fd",
    borderWidth:1,
    borderRadius:8,
    paddingVertical:8,
    paddingHorizontal:16,
    marginTop:8,
    backgroundColor:"#f6f1ff"
  },

  trendItem: {
    flexDirection: "row",
    alignItems:"flex-start",
    paddingVertical: 12, paddingHorizontal: 6,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#e8e3f8",
    marginBottom: 8,
    backgroundColor: "#fff",
    gap: 7,
  },
  trendItemActive: {
    borderColor:"#bcaafe", backgroundColor:"#ede9fe"
  },
  rankCircle: {
    width:30, height:30,
    borderRadius:15,
    justifyContent:"center", alignItems:"center",
    marginRight:6
  },
  rankCircleTop: { backgroundColor:"#7C3AED" },
  rankCircleBasic: { backgroundColor:"#c7b7f6" },
  rankNum:{ color:"#fff", fontWeight:"bold", fontSize:15 },
  itemRow: {
    flexDirection:"row", alignItems:"center", gap:7, marginBottom: 2,
  },
  trendItemName: {
    fontWeight:"700",fontSize:15, color:"#513499",maxWidth:120,marginRight:7
  },
  trendCatBadge: { backgroundColor:"#e1d7fb",borderRadius:7,paddingHorizontal:6, marginRight:7, paddingVertical:2 },
  trendCatBadgeText: {color:"#7C3AED", fontWeight:"700", fontSize:12 },
  trendPop:{marginLeft:5,fontWeight:"bold",fontSize:13,color:"#7C3AED"},
  trendItemDesc: { color:"#6B7280", fontSize:13,marginTop:2 },
  highlight: {
    backgroundColor: "#FEF3C7",
    borderRadius: 3,
  },
});
