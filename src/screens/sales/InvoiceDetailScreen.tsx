import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function InvoiceDetailScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>InvoiceDetailScreen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F4EF' },
  text: { fontSize: 16, color: '#1A1A1A' },
});
