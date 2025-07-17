import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function TrendsTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>트렌드 화면</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  text: { fontSize: 18 },
});
