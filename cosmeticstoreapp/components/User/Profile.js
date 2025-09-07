import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import PullToRefreshWrapper from '../Common/PullToRefreshWrapper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

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
      setError('');
    } catch (err) {
      setError('Không thể tải thông tin người dùng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('access_token');
    navigation.replace('Login');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hồ Sơ Cá Nhân</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="close" size={28} color="transparent" />
        </TouchableOpacity>
      </View>
      {/* Profile info */}
      <View style={styles.profileBox}>
        <View style={styles.avatarBox}>
          {user?.image ? (
            <Image source={{ uri: user.image }} style={styles.avatarIcon} />
          ) : (
            <MaterialCommunityIcons name="account" size={48} color="#1976d2" style={styles.avatarIcon} />
          )}
        </View>
        <View style={styles.infoCol}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : error ? (
            <Text style={[styles.profileName, {color:'#ffcdd2'}]}>{error}</Text>
          ) : (
            <>
              <Text style={styles.profileName}>{user?.username || 'Không có tên'}</Text>
              <Text style={styles.profileRole}>{user?.role || ''}</Text>
              {user?.phone ? <Text style={styles.profileLink}>{user.phone}</Text> : null}
            </>
          )}
        </View>
      </View>
      <PullToRefreshWrapper
        refreshing={refreshing}
        onRefresh={onRefresh}
        style={{flex:1}}
      >
        {/* List options */}
        <View style={styles.section}>
          <ProfileItem icon="clipboard-list" label="Đơn hàng của tôi" />
          <ProfileItem icon="heart-outline" label="Yêu thích" />
          <ProfileItem icon="ticket-percent" label="Voucher của tôi" />
        </View>
        <Text style={styles.sectionTitle}>CÀI ĐẶT TÀI KHOẢN</Text>
        <View style={styles.section}>
          <ProfileItem icon="account-edit" label="Thông tin cá nhân" onPress={() => navigation.navigate('EditProfile')} />
          <ProfileItem icon="map-marker" label="Địa chỉ" />
          <ProfileItem icon="bell-outline" label="Thông báo" />
        </View>
        <Text style={styles.sectionTitle}>HỖ TRỢ</Text>
        <View style={styles.section}>
          <ProfileItem icon="lifebuoy" label="Trung tâm hỗ trợ" />
          <ProfileItem icon="information-outline" label="Về chúng tôi" />
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>
      </PullToRefreshWrapper>
    </View>
  );
}

function ProfileItem({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.itemRow} onPress={onPress}>
      <MaterialCommunityIcons name={icon} size={28} color="#222" style={styles.itemIcon} />
      <Text style={styles.itemLabel}>{label}</Text>
      <MaterialCommunityIcons name="chevron-right" size={24} color="#bbb" style={styles.itemArrow} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  profileRole: {
    color: '#e3f2fd',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
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
  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
  },
  avatarBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    alignSelf: 'center',
    width: 48,
    height: 48,
    borderRadius: 24,
    resizeMode: 'cover',
  },
  profileName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  profileLink: {
    color: '#e3f2fd',
    fontSize: 13,
  },
  section: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 4,
    color: '#bbb',
    fontSize: 13,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#f2f2f2',
  },
  itemIcon: {
    marginRight: 16,
  },
  itemLabel: {
    flex: 1,
    fontSize: 15,
    color: '#222',
  },
  itemArrow: {
    marginLeft: 8,
  },
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#f48fb1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: '#f48fb1',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCol: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    height: 56,
    alignItems: 'flex-start',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
});
