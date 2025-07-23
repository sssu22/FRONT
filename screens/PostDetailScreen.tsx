// screens/PostDetailScreen.tsx
import React, { useEffect } from "react";
import { View, Text } from "react-native";

export default function PostDetailScreen({ route, navigation }: any) {
  const { experience } = route.params ?? {};

  useEffect(() => {
    if (!experience) navigation.goBack();
  }, []);

  if (!experience) return null;

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: "600" }}>{experience.title}</Text>
      <Text>{new Date(experience.date).toLocaleDateString("ko-KR")}</Text>
      <Text>{experience.location}</Text>
      <Text>{experience.description}</Text>
      {/* … */}
    </View>
  );
}
