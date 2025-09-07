import React, { useEffect, useState } from 'react';
import { Asset } from 'expo-asset';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_PRESET } from '@env';
import * as ImagePicker from 'expo-image-picker';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import PullToRefreshWrapper from '../Common/PullToRefreshWrapper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function EditProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ username: '', email: '', phone: '', first_name: '', last_name: '', image: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  // Hàm reload khi kéo xuống
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  };

  // Fetch user info
  const fetchUser = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError('Bạn chưa đăng nhập.');
        setLoading(false);
        return;
      }
      const res = await authAxios(token).get(endpoints.currentUser);
      setUser(res.data);
      setForm({
        username: res.data.username || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        image: res.data.image || '',
      });
      setAvatarPreview(res.data.image || '');
    } catch (err) {
      setError('Không thể tải thông tin người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchUser);
    return unsubscribe;
  }, [navigation]);

  // Upload avatar mặc định từ asset
  const handleUploadDefaultAvatar = async () => {
    const asset = Asset.fromModule(require('../../assets/avatar.png'));
    await asset.downloadAsync();
    const uri = asset.localUri || asset.uri;
    setAvatarPreview(uri);
    const data = new FormData();
    data.append('file', {
      uri,
      type: 'image/png',
      name: 'avatar.png',
    });
    data.append('upload_preset', CLOUDINARY_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: data,
      });
      const file = await res.json();
      if (file.secure_url) {
        setForm(f => ({ ...f, image: file.secure_url }));
        setAvatarPreview(file.secure_url);
        const token = await AsyncStorage.getItem('access_token');
        await authAxios(token).patch(endpoints.updateUser, { ...form, image: file.secure_url });
        console.log('Thành công: Đã upload và lưu ảnh lên Cloudinary!');
        await fetchUser();
      } else {
        console.log('Lỗi', 'Không upload được ảnh.');
      }
    } catch (err) {
      console.log('Lỗi', 'Không upload được ảnh.');
    }
  };

  // Upload avatar từ thư viện của thiết bị
  const handlePickAvatar = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setAvatarPreview(asset.uri);
      // Lấy mime type và tên file từ asset
      let mimeType = asset.mimeType || 'image/jpeg';
      let fileName = asset.fileName || `avatar.${mimeType.split('/')[1] || 'jpg'}`;
      // Nếu asset không có mimeType, đoán theo phần mở rộng
      if (!mimeType && asset.uri) {
        if (asset.uri.endsWith('.png')) mimeType = 'image/png';
        else if (asset.uri.endsWith('.jpg') || asset.uri.endsWith('.jpeg')) mimeType = 'image/jpeg';
        else if (asset.uri.endsWith('.webp')) mimeType = 'image/webp';
        else mimeType = 'image/jpeg';
      }
      const data = new FormData();
      data.append('file', {
        uri: asset.uri,
        type: mimeType,
        name: fileName,
      });
      data.append('upload_preset', CLOUDINARY_PRESET);
      try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
          method: 'POST',
          body: data,
        });
        const file = await res.json();
        if (file.secure_url) {
          setForm(f => ({ ...f, image: file.secure_url }));
          setAvatarPreview(file.secure_url);
          const token = await AsyncStorage.getItem('access_token');
          await authAxios(token).patch(endpoints.updateUser, { ...form, image: file.secure_url });
          console.log('Thành công: Đã upload và lưu ảnh lên Cloudinary!');
          await fetchUser();
        } else {
          console.log('Lỗi', 'Không upload được ảnh.');
        }
      } catch (err) {
        console.log('Lỗi', 'Không upload được ảnh.');
      }
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('access_token');
      await authAxios(token).patch(endpoints.updateUser, form);
      Alert.alert('Thành công', 'Thông tin đã được cập nhật!');
      navigation.goBack();
    } catch (err) {
      setError('Cập nhật thất bại.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thay đổi thông tin cá nhân</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={28} color="transparent" />
        </TouchableOpacity>
      </View>
      <PullToRefreshWrapper refreshing={refreshing} onRefresh={onRefresh} style={styles.container}>
        {/* Avatar upload */}
        <View style={styles.avatarBox}>
          {avatarPreview ? (
            <TouchableOpacity onPress={handlePickAvatar}>
              <Image source={{ uri: avatarPreview }} style={styles.avatarIcon} />
            </TouchableOpacity>
          ) : (
              <TouchableOpacity onPress={handlePickAvatar}>
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons name="account" size={48} color="#1976d2" />
                </View>
              </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handlePickAvatar}>
            <Text style={styles.avatarText}>Chọn ảnh đại diện</Text>
          </TouchableOpacity>
          <TouchableOpacity style={{ marginTop: 8 }} onPress={handleUploadDefaultAvatar}>
            <Text style={{ color: '#1976d2', fontSize: 13 }}>Dùng avatar mặc định hệ thống</Text>
          </TouchableOpacity>
        </View>
        {/* Form nhập thông tin */}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TextInput
          style={styles.input}
          value={form.username}
          onChangeText={v => handleChange('username', v)}
          placeholder="Tên đăng nhập"
        />
        <TextInput
          style={styles.input}
          value={form.first_name}
          onChangeText={v => handleChange('first_name', v)}
          placeholder="Họ"
        />
        <TextInput
          style={styles.input}
          value={form.last_name}
          onChangeText={v => handleChange('last_name', v)}
          placeholder="Tên"
        />
        <TextInput
          style={styles.input}
          value={form.email}
          onChangeText={v => handleChange('email', v)}
          placeholder="Email"
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          value={form.phone}
          onChangeText={v => handleChange('phone', v)}
          placeholder="Số điện thoại"
          keyboardType="phone-pad"
        />
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
        </TouchableOpacity>
      </PullToRefreshWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  avatarBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatarIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e3f2fd',
    marginBottom: 6,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e3f2fd',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: {
    color: '#1976d2',
    fontSize: 13,
    marginBottom: 4,
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
