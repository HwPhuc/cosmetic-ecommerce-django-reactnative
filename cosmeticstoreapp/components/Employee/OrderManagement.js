import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { endpoints, authAxios } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PullToRefreshWrapper from '../Common/PullToRefreshWrapper';

const ORDER_STATUS = [
  { key: '', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'shipped', label: 'Đang giao' },
  { key: 'completed', label: 'Đã giao' },
  { key: 'cancelled', label: 'Đã hủy' },
];

function getStatusColor(status) {
  switch (status) {
    case 'pending': return '#ffe082';
    case 'shipped': return '#90caf9';
    case 'completed': return '#a5d6a7';
    case 'cancelled': return '#ef9a9a';
    default: return '#e0e0e0';
  }
}

function getStatusLabel(status) {
  const found = ORDER_STATUS.find(s => s.key === status);
  return found ? found.label : status;
}

export default function EmployeeOrders({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('access_token');
      let url = endpoints.adminOrders + '?ordering=-created_at';
      if (status) url += `&status=${status}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await authAxios(token).get(url);
      setOrders(res.data.results || res.data);
    } catch (e) {
      setError('Không thể tải đơn hàng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [status]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const onSearch = () => {
    fetchOrders();
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.orderImage} />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.orderId}>#{item.id}</Text>
          <Text style={styles.orderProduct}>{item.items && item.items[0]?.product_name || 'Sản phẩm...'}</Text>
          <Text style={styles.orderCustomer}>{item.user || ''}</Text>
          <Text style={styles.orderPhone}>{item.receiver_phone || ''}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <View style={[styles.statusBox, { backgroundColor: getStatusColor(item.status) }] }>
            <Text style={styles.statusText}>{getStatusLabel(item.status)}</Text>
          </View>
          <Text style={styles.orderPrice}>{parseInt(item.total_price).toLocaleString()}đ</Text>
          <Text style={styles.orderCount}>{item.items ? item.items.length : 0} sản phẩm</Text>
        </View>
      </View>
      <View style={styles.orderActions}>
        <TouchableOpacity style={styles.detailBtn}><Text style={styles.detailBtnText}>Chi tiết</Text></TouchableOpacity>
        {item.status === 'pending' && <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Xác nhận</Text></TouchableOpacity>}
        {item.status === 'shipped' && <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Hoàn tất</Text></TouchableOpacity>}
        {item.status === 'completed' && <TouchableOpacity style={styles.actionBtn}><Text style={styles.actionBtnText}>Cập nhật</Text></TouchableOpacity>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation && navigation.goBack && navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Quản Lý Đơn Hàng</Text>
      </View>
      <View style={styles.bodyWrapper}>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm đơn hàng..."
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={onSearch}
          />
          <TouchableOpacity style={styles.searchBtn} onPress={onSearch}>
            <Text style={{ color: '#1976d2', fontWeight: 'bold' }}>Tìm</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.statusTabs}>
          {ORDER_STATUS.map(s => (
            <TouchableOpacity
              key={s.key}
              style={[styles.statusTab, status === s.key && styles.statusTabActive]}
              onPress={() => setStatus(s.key)}
            >
              <Text style={status === s.key ? styles.statusTabTextActive : styles.statusTabText}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {loading ? <ActivityIndicator style={{ marginTop: 30 }} /> : error ? <Text style={styles.error}>{error}</Text> : (
          <PullToRefreshWrapper refreshing={refreshing} onRefresh={onRefresh} style={{ flex: 1 }}>
            <FlatList
              data={orders}
              renderItem={renderOrder}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ paddingBottom: 80 }}
            />
          </PullToRefreshWrapper>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 0,
  },
  bodyWrapper: {
    flex: 1,
    paddingHorizontal: 14,
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
    marginRight: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginRight: 28,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    backgroundColor: '#f9f9f9',
    marginRight: 8,
  },
  searchBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#e3eafc',
    borderRadius: 5,
  },
  statusTabs: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  statusTab: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    marginRight: 5,
  },
  statusTabActive: {
    backgroundColor: '#1976d2',
  },
  statusTabText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  statusTabTextActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
  orderCard: {
    backgroundColor: '#fafbfc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  orderImage: {
    width: 48,
    height: 48,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  statusTabs: {
    flexDirection: 'row',
    marginBottom: 10,
    justifyContent: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  orderProduct: {
    fontSize: 14,
    color: '#333',
    marginBottom: 2,
  },
  orderCustomer: {
    fontSize: 13,
    color: '#888',
  },
  orderPhone: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  statusBox: {
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 4,
    alignSelf: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  orderPrice: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
    alignSelf: 'flex-end',
  },
  orderCount: {
    fontSize: 12,
    color: '#888',
    alignSelf: 'flex-end',
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  detailBtn: {
    backgroundColor: '#e3eafc',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 8,
  },
  detailBtnText: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  actionBtn: {
    backgroundColor: '#1976d2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 5,
    marginRight: 8,
  },
  actionBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  statusTabs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: 10,
      justifyContent: 'flex-start',
      paddingHorizontal: 2,
    },
    statusTab: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      backgroundColor: '#f5f5f5',
      borderRadius: 8,
      marginHorizontal: 3,
      marginBottom: 6,
    },
});
