import { Asset } from 'expo-asset';
import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, TextInput, Alert, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { UserContext } from '../../configs/Contexts';
import { endpoints, authAxios } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_PRESET } from '@env';


export default function EmployeeProfile({ navigation }) {
  const userContext = useContext(UserContext);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '', image: '' });
  const [avatarPreview, setAvatarPreview] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);

  // Helper: kiểm tra link Cloudinary hợp lệ
  const isValidCloudinaryUrl = (url) => {
    if (!url) return false;
    // Có thể tùy chỉnh regex này nếu Cloudinary domain khác
    return /^https:\/\/res\.cloudinary\.com\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url);
  };

  // Fetch user info
  const fetchUser = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await authAxios(token).get(endpoints.currentUser);
      setUser(res.data);
      setForm({
        first_name: res.data.first_name || '',
        last_name: res.data.last_name || '',
        email: res.data.email || '',
        phone: res.data.phone || '',
        image: res.data.image || '',
      });
      setAvatarPreview(res.data.image || '');
    } catch (err) {
      setError('Không thể tải thông tin nhân viên.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // Khi chuyển sang chế độ edit, luôn đồng bộ form.image với user.image từ backend
  useEffect(() => {
    if (editing && user) {
      setForm(f => ({ ...f, image: user.image || '' }));
      setAvatarPreview(user.image || '');
    }
  }, [editing]);

  // Pull-to-refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  };

  // Upload avatar từ thư viện
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
          // Cập nhật avatar lên server ngay sau khi upload
          const token = await AsyncStorage.getItem('access_token');
          const payload = { image: file.secure_url };
          await authAxios(token).patch(endpoints.updateUser, payload);
          await fetchUser();
        } else {
          Alert.alert('Lỗi', 'Không upload được ảnh.');
        }
      } catch (err) {
        Alert.alert('Lỗi', 'Không upload được ảnh.');
      }
    }
  };

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
        const payload = { image: file.secure_url };
        await authAxios(token).patch(endpoints.updateUser, payload);
        await fetchUser();
      } else {
        Alert.alert('Lỗi', 'Không upload được ảnh.');
      }
    } catch (err) {
      Alert.alert('Lỗi', 'Không upload được ảnh.');
    }
  };

  const handleChange = (field, value) => {
    setForm({ ...form, [field]: value });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Chỉ gửi các trường có giá trị (không gửi undefined/null)
      const payload = {};
      Object.keys(form).forEach(key => {
        if (form[key] !== undefined && form[key] !== null && form[key] !== '') {
          // Chỉ gửi image nếu là link Cloudinary hợp lệ
          if (key === 'image') {
            if (isValidCloudinaryUrl(form[key])) {
              payload[key] = form[key];
            }
          } else {
            payload[key] = form[key];
          }
        }
      });
      const token = await AsyncStorage.getItem('access_token');
      await authAxios(token).patch(endpoints.updateUser, payload);
      Alert.alert('Thành công', 'Thông tin đã được cập nhật!');
      setEditing(false);
      await fetchUser();
    } catch (err) {
      let msg = 'Cập nhật thất bại.';
      if (err.response && err.response.data) {
        msg += '\n' + JSON.stringify(err.response.data);
      }
      setError(msg);
      console.log('Update user error:', err.response?.data || err.message || err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation && navigation.goBack && navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tài khoản cá nhân</Text>
        <View style={{ width: 32 }} />
      </View>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, alignItems: 'center', paddingTop: 8 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#1976d2"]} />
        }
      >
        <View style={styles.profileBox}>
          <View style={styles.avatarBox}>
            <TouchableOpacity onPress={editing ? handlePickAvatar : undefined} disabled={!editing}>
              {avatarPreview ? (
                <Image source={{ uri: avatarPreview }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarCircle}>
                  <MaterialCommunityIcons name="account" size={48} color="#1976d2" />
                </View>
              )}
            </TouchableOpacity>
            {editing && (
              <>
                <TouchableOpacity onPress={handlePickAvatar}>
                  <Text style={styles.avatarText}>Chọn ảnh đại diện</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ marginTop: 8 }} onPress={handleUploadDefaultAvatar}>
                  <Text style={{ color: '#1976d2', fontSize: 13 }}>Dùng avatar mặc định hệ thống</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {editing ? (
            <>
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
              <View style={styles.btnRow}>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
                  <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setEditing(false)}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.infoBoxGroup}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Họ tên</Text>
                <Text style={styles.infoValue}>{((user?.first_name || '') + ' ' + (user?.last_name || '')).trim() || 'Chưa có'}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{user?.email || 'Chưa có'}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{user?.phone || 'Chưa có'}</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Vai trò</Text>
                <Text style={styles.infoValue}>{user?.role || 'Nhân viên'}</Text>
              </View>
              <View style={{ alignItems: 'center', width: '100%' }}>
                <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                  <Text style={styles.editBtnText}>Chỉnh sửa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1976d2',
    paddingTop: 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 16,
  },
  refreshBtn: {
    padding: 4,
    marginLeft: 8,
  },
  refreshingText: {
    color: '#1976d2',
    fontSize: 14,
    marginBottom: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginRight: 28,
  },
  profileBox: {
    width: '90%',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignSelf: 'center',
  },
  avatarBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#e3f2fd',
    marginBottom: 6,
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  infoBoxGroup: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  infoLabel: {
    fontSize: 15,
    color: '#888',
    width: 110,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    flex: 1,
    textAlign: 'right',
  },
  editBtn: {
    marginTop: 16,
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  editBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  saveBtn: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  cancelBtn: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelBtnText: {
    color: '#333',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
