import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';

export default function EditAddressScreen({ route, navigation }) {
  const { addressId } = route.params;
  const [form, setForm] = useState({ name: '', phone: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAddress = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const res = await authAxios(token).get(`${endpoints.userAddresses}${addressId}/`);
        setForm({
          name: res.data.name || '',
          phone: res.data.phone || '',
          address: res.data.address || '',
        });
      } catch (err) {
        setError('Không thể tải địa chỉ.');
      } finally {
        setLoading(false);
      }
    };
    fetchAddress();
  }, [addressId]);

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    if (!form.name || !form.phone || !form.address) {
      setError('Vui lòng nhập đầy đủ thông tin.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('access_token');
      await authAxios(token).put(`${endpoints.userAddresses}${addressId}/`, form);
      navigation.goBack();
    } catch (err) {
      setError('Không thể cập nhật địa chỉ.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <ActivityIndicator style={{marginTop:32}} color="#1976d2" />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa địa chỉ</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={28} color="transparent" />
        </TouchableOpacity>
      </View>
      <View style={styles.container}>
        <View style={styles.formBox}>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TextInput
            style={styles.input}
            placeholder="Tên người nhận"
            value={form.name}
            onChangeText={text => handleChange('name', text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại"
            value={form.phone}
            onChangeText={text => handleChange('phone', text)}
            keyboardType="phone-pad"
          />
          <TextInput
            style={[styles.input, {height: 80}]}
            placeholder="Địa chỉ giao hàng"
            value={form.address}
            onChangeText={text => handleChange('address', text)}
            multiline
          />
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  formBox: {
    marginTop: 24,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdbdbd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
    backgroundColor: '#fafafa',
  },
  saveBtn: {
    backgroundColor: '#1976d2',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: '#f44336',
    marginBottom: 12,
    textAlign: 'center',
  },
});
