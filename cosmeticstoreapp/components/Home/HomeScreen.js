import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [username, setUsername] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const user = await AsyncStorage.getItem('username');
      if (user) setUsername(user);
    };
    fetchUser();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chào mừng {username ? username : 'bạn'} đến với HoangPhuc Shop!</Text>
      <Text style={styles.subtitle}>Đây là trang chủ của ứng dụng.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
  },
});
