import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function EmployeeProfile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tài khoản cá nhân</Text>
      <Text>Thông tin cá nhân, đổi mật khẩu.</Text>
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
