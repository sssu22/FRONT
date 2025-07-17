import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, TouchableOpacity } from 'react-native';

import HomeTab from './HomeTab';
import PostsTab, { Experience } from './MyPostsTab';
import TrendsTab from './TrendsTab';
import ProfileTab from './ProfileTab';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// 더미 데이터
const dummyExperiences: Experience[] = [
  {
    id: '1',
    title: '첫 번째 경험',
    date: '2025-07-15T10:00:00Z',
    location: '홍대입구역',
    emotion: 'joy',
    tags: ['여행', '친구'],
    description: '친구들과 홍대에서 즐거운 시간을 보냈어요.',
    trendScore: 42,
  },
  {
    id: '2',
    title: '두 번째 경험',
    date: '2025-07-10T14:30:00Z',
    location: '강남구 신사동',
    emotion: 'excitement',
    tags: ['맛집', '데이트'],
    description: '연인과 함께 맛집 탐방을 즐겼습니다.',
    trendScore: 35,
  },
  {
    id: '3',
    title: '세 번째 경험',
    date: '2025-06-01T09:00:00Z',
    location: '잠실 올림픽공원',
    emotion: 'nostalgia',
    tags: ['산책', '회상'],
    description: '올림픽공원 산책하며 옛 추억을 떠올렸어요.',
    trendScore: 28,
  },
];

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            Home: 'home-outline',
            Posts: 'book-outline',
            Trends: 'trending-up-outline',
            Profile: 'person-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeTab} options={{ title: '홈' }} />
      <Tab.Screen
        name="Posts"
        children={() => (
          <PostsTab
            experiences={dummyExperiences}
            onExperienceClick={exp => console.log('상세보기', exp)}
            onEditExperience={exp => console.log('수정하기', exp)}
            onDeleteExperience={id => console.log('삭제하기', id)}
          />
        )}
        options={{ title: '내 게시글' }}
      />
      <Tab.Screen name="Trends" component={TrendsTab} options={{ title: '트렌드' }} />
      <Tab.Screen name="Profile" component={ProfileTab} options={{ title: '프로필' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
          headerTitleAlign: 'left',
          headerTitle: () => (
            <View style={{ marginRight: 200}}>
              <Text style={{ fontSize: 20, fontWeight: '600', color: '#6a83b4ff' }}>
                TrendLog
              </Text>
              <Text style={{ fontSize: 12, color: '#6a83b4ff' }}>
                안녕하세요, 종민님!
              </Text>
            </View>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={() => console.log('플러스 눌림')}
              style={{
                marginRight: 16,
                backgroundColor: '#6a83b4ff',
                borderRadius: 18,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          ),
        }}
      >
        <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: true }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
