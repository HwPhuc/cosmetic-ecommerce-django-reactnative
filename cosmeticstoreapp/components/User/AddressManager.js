import React, { useEffect, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';

export default function AddressManagerScreen({ navigation, route }) {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const selectedAddress = route?.params?.selectedAddress || '';
  const onSelect = route?.params?.onSelect;

  const fetchAddresses = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError('Bạn chưa đăng nhập.');
        setLoading(false);
        return;
      }
      const res = await authAxios(token).get(endpoints.userAddresses);
      setAddresses(Array.isArray(res.data) ? res.data : res.data.results || []);
      setError('');
    } catch (err) {
      setError('Không thể tải địa chỉ.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      fetchAddresses();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAddresses();
    setRefreshing(false);
  };

  const handleSetDefault = async (id) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await authAxios(token).post(`${endpoints.userAddresses}${id}/set_default/`);
      fetchAddresses();
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể đặt làm mặc định.');
    }
  };

  const handleDelete = async (id) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa địa chỉ này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('access_token');
            await authAxios(token).delete(`${endpoints.userAddresses}${id}/`);
            fetchAddresses();
          } catch (err) {
            Alert.alert('Lỗi', 'Không thể xóa địa chỉ.');
          }
        },
      },
    ]);
  };

  const renderAddress = ({ item }) => (
    <TouchableOpacity
      style={[styles.addressBox, item.is_default && styles.defaultBox, selectedAddress === item.address && { borderColor: '#1976d2' }]}
      onPress={() => {
        if (onSelect) {
          onSelect(item);
          navigation.goBack();
        }
      }}
    >
      <View style={styles.rowBetween}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.iconRow}>
          {item.is_default && (
            <View style={styles.defaultTag}><Text style={styles.defaultText}>Mặc định</Text></View>
          )}
          <TouchableOpacity onPress={() => handleSetDefault(item.id)} disabled={item.is_default}>
            <MaterialCommunityIcons name="star" size={22} color={item.is_default ? '#ffcdd2' : '#1976d2'} style={styles.iconBtn} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('EditAddress', { addressId: item.id })}>
            <MaterialCommunityIcons name="pencil" size={22} color="#ffa726" style={styles.iconBtn} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <MaterialCommunityIcons name="delete" size={22} color="#f44336" style={styles.iconBtn} />
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.phone}>{item.phone}</Text>
      <Text style={styles.address}>{item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Địa chỉ giao hàng</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={28} color="transparent" />
        </TouchableOpacity>
      </View>
      {/* Address List */}
      <View style={{flex:1}}>
        {loading ? (
          <ActivityIndicator style={{marginTop:32}} color="#1976d2" />
        ) : error ? (
          <Text style={{color:'#f44336', textAlign:'center', marginTop:32}}>{error}</Text>
        ) : (
          <FlatList
            data={addresses}
            keyExtractor={item => item.id.toString()}
            renderItem={renderAddress}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={{paddingBottom:24}}
          />
        )}
      </View>
      {/* Add new address button */}
      <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('AddAddress')}>
        <MaterialCommunityIcons name="plus" size={22} color="#fff" style={{marginRight:8}} />
        <Text style={styles.addText}>Thêm địa chỉ mới</Text>
      </TouchableOpacity>
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
  addressBox: {
    borderWidth: 1,
    borderColor: '#e3f2fd',
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 10,
    marginTop: 10,
    backgroundColor: '#f9f9f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 1,
    minHeight: 90,
    justifyContent: 'center',
  },
  defaultBox: {
    borderColor: '#1976d2',
    backgroundColor: '#e3f2fd',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  iconBtn: {
    marginLeft: 6,
    padding: 2,
    borderRadius: 5,
    backgroundColor: '#e3f2fd',
  },
  defaultTag: {
    backgroundColor: '#1976d2',
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginRight: 5,
  },
  defaultText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 1,
  },
  phone: {
    fontSize: 13,
    color: '#333',
    marginBottom: 1,
  },
  address: {
    fontSize: 13,
    color: '#222',
    marginTop: 1,
    fontWeight: '500',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1976d2',
    borderRadius: 10,
    marginHorizontal: 24,
    marginVertical: 18,
    paddingVertical: 16,
    justifyContent: 'center',
    shadowColor: '#1976d2',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 2,
  },
  addText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
