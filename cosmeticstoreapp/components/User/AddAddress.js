import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';


export default function AddAddressScreen({ navigation }) {
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleAdd = async () => {
    if (!form.name || !form.phone || !form.address) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('access_token');
      await authAxios(token).post(endpoints.userAddresses, form);
      navigation.goBack();
    } catch (err) {
      setError('Không thể thêm địa chỉ.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm địa chỉ mới</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={28} color="transparent" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <View style={styles.formBox}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={v => handleChange('name', v)}
            placeholder="Họ tên người nhận"
          />
          <TextInput
            style={styles.input}
            value={form.phone}
            onChangeText={v => handleChange('phone', v)}
            placeholder="Số điện thoại"
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.input, { height: 60 }]}
            value={form.address}
            onChangeText={v => handleChange('address', v)}
            placeholder="Địa chỉ giao hàng"
            multiline
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleAdd} disabled={loading}>
            <Text style={styles.saveText}>{loading ? 'Đang thêm...' : 'Thêm địa chỉ'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196f3',
    paddingTop: 40,
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  formBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 0,
    marginTop: 24,
    marginBottom: 24,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 24,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e3f2fd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    width: '100%',
  },
  saveBtn: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
