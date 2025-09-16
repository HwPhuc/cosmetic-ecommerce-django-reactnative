import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmployeeInventory() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quản lý tồn kho</Text>
      <Text>Theo dõi số lượng sản phẩm, cảnh báo hết hàng.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
});
