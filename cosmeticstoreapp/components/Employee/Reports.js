import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmployeeReports() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thống kê & báo cáo</Text>
      <Text>Xem báo cáo doanh thu, sản phẩm bán chạy, hiệu suất nhân viên.</Text>
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
