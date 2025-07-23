// components/TrendSelector.tsx
import React, { useState, useMemo } from 'react'
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

export interface Trend {
  id: string
  name: string
  description: string
  category: string
  popularity: number
}

export interface TrendSelectorProps {
  visible: boolean
  trends: Trend[]
  onClose: () => void
  onSelect: (trend: Trend) => void
  onCreate?: (trend: Omit<Trend, 'id' | 'popularity'>) => void
}

export default function TrendSelector({
  visible,
  trends,
  onClose,
  onSelect,
  onCreate,
}: TrendSelectorProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(
    () =>
      trends.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase())
      ),
    [search, trends]
  )

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* 헤더 */}
          <View style={styles.header}>
            <Text style={styles.title}>트렌드 선택</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} />
            </TouchableOpacity>
          </View>

          {/* 검색 입력 */}
          <TextInput
            style={styles.searchInput}
            placeholder="트렌드 검색..."
            value={search}
            onChangeText={setSearch}
          />

          {/* 새 트렌드 만들기 */}
          <TouchableOpacity
            style={styles.createLine}
            disabled={!onCreate}
            onPress={() =>
              onCreate?.({
                name: search || '새 트렌드',
                description: '',
                category: '기타',
              })
            }
          >
            <Text style={styles.createLineText}>+ 새 트렌드 만들기</Text>
          </TouchableOpacity>

          {/* 결과 리스트 */}
          <FlatList
            data={filtered}
            keyExtractor={(t) => t.id}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="search" size={32} color="#ccc" />
                <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
              </View>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.item}
                onPress={() => {
                  onSelect(item)
                  onClose()
                }}
              >
                <Text style={styles.itemName}># {item.name}</Text>
                <Text style={styles.itemDesc}>{item.description}</Text>
                <View style={styles.itemTag}>
                  <Text style={styles.itemTagText}>{item.category}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 16,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  title: { fontSize: 18, fontWeight: '600' },
  searchInput: {
    margin: 16,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  createLine: {
    marginHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#C084FC',
    borderRadius: 6,
    alignItems: 'center',
  },
  createLineText: { color: '#8B5CF6', fontWeight: '500' },
  empty: { alignItems: 'center', padding: 32 },
  emptyText: { marginTop: 8, color: '#666' },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  itemName: { fontSize: 16, fontWeight: '500' },
  itemDesc: { fontSize: 12, color: '#666', marginTop: 4 },
  itemTag: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f3f3f3',
    borderRadius: 4,
  },
  itemTagText: { fontSize: 10, color: '#444' },
})
