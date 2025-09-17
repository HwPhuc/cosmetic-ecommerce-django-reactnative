import React, { useEffect, useState } from 'react';
import { ActionSheetIOS, Platform, Modal, Pressable } from 'react-native';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { endpoints, authAxios } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ORDER_STATUS = [
  { key: '', label: 'Tất cả' },
  { key: 'pending', label: 'Chờ xác nhận' },
  { key: 'paid', label: 'Đã thanh toán' },
  { key: 'shipped', label: 'Đang giao' },
  { key: 'completed', label: 'Đã giao' },
  { key: 'cancelled', label: 'Đã hủy' },
];

function getStatusColor(status) {
  switch (status) {
    case 'pending': return '#ffe082';
    case 'paid': return '#b2dfdb';
    case 'shipped': return '#90caf9';
    case 'completed': return '#a5d6a7';
    case 'cancelled': return '#ef9a9a';
    default: return '#e0e0e0';
  }
}

function getStatusLabel(status) {
  const found = ORDER_STATUS.find(s => s.key === status);
  if (found) return found.label;
  // fallback cho các trạng thái chưa có trong ORDER_STATUS
  switch (status) {
    case 'paid': return 'Đã thanh toán';
    default: return status;
  }
}

export default function EmployeeOrders({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [updateModal, setUpdateModal] = useState({ visible: false, order: null });

  const fetchOrders = async (reset = false, pageNum = 1) => {
    if (reset) setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('access_token');
      let url = endpoints.adminOrders + `?ordering=-created_at&page_size=10&page=${pageNum}`;
      if (status) url += `&status=${status}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;
      const res = await authAxios(token).get(url);
      if (res.data && res.data.results) {
        if (reset) {
          setOrders(res.data.results);
        } else {
          setOrders(prev => [...prev, ...res.data.results]);
        }
        setNext(res.data.next);
      } else if (Array.isArray(res.data)) {
        setOrders(res.data);
        setNext(null);
      } else {
        setOrders([]);
        setNext(null);
      }
      setError('');
    } catch (e) {
      setError('Không thể tải đơn hàng.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders(true, 1);
    setPage(1);
  }, [status]);


  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(true, 1);
    setPage(1);
    setRefreshing(false);
  };

  const onSearch = async () => {
    setLoading(true);
    await fetchOrders(true, 1);
    setPage(1);
    setLoading(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !next) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchOrders(false, nextPage);
    setPage(nextPage);
  };

  // Xử lý các nút hành động
  const handleDetail = (order) => {
    if (navigation && navigation.navigate) {
      navigation.navigate('OrderDetail', { orderId: order.id });
    }
  };

  const handleUpdateStatus = async (order, newStatus) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      await authAxios(token).patch(`${endpoints.adminOrders}${order.id}/`, { status: newStatus });
      await fetchOrders(true, 1);
      setPage(1);
    } catch (e) {
      setError('Cập nhật trạng thái thất bại.');
    }
  };

  // Trình tự trạng thái hợp lệ
  const getNextStatuses = (current) => {
    switch (current) {
      case 'pending':
        return ['paid', 'cancelled'];
      case 'paid':
        return ['shipped', 'cancelled'];
      case 'shipped':
        return ['completed', 'cancelled'];
      default:
        return [];
    }
  };

  const showUpdateStatusOptions = (order) => {
    const nextStatuses = getNextStatuses(order.status);
    if (nextStatuses.length === 0) return;
    const options = nextStatuses.concat('Hủy');
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions({
        options: nextStatuses.map(getStatusLabel).concat('Hủy'),
        cancelButtonIndex: nextStatuses.length,
        title: 'Chọn trạng thái mới',
      }, (buttonIndex) => {
        if (buttonIndex < nextStatuses.length) {
          handleUpdateStatus(order, nextStatuses[buttonIndex]);
        }
      });
    } else {
      setUpdateModal({ visible: true, order, nextStatuses });
    }
  };

  const renderOrder = ({ item }) => (
    <View style={styles.orderCard}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={styles.orderImage}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="package-variant" size={28} color="#bdbdbd" />
          </View>
        </View>
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={styles.orderId}>#{item.id}</Text>
          <Text style={styles.orderProduct}>
            {item.items && item.items.length > 0
              ? (item.items.length === 1
                  ? (item.items[0].product_name || item.items[0].product?.name || 'Sản phẩm')
                  : `${item.items[0].product_name || item.items[0].product?.name || 'Sản phẩm'} và ${item.items.length - 1} sản phẩm khác`)
              : 'Không có sản phẩm'}
          </Text>
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
        <TouchableOpacity style={styles.detailBtn} onPress={() => handleDetail(item)}>
          <Text style={styles.detailBtnText}>Chi tiết</Text>
        </TouchableOpacity>
        {item.status === 'pending' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus(item, 'paid')}>
            <Text style={styles.actionBtnText}>Xác nhận thanh toán</Text>
          </TouchableOpacity>
        )}
        {item.status === 'paid' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus(item, 'shipped')}>
            <Text style={styles.actionBtnText}>Xác nhận giao hàng</Text>
          </TouchableOpacity>
        )}
        {item.status === 'shipped' && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus(item, 'completed')}>
            <Text style={styles.actionBtnText}>Hoàn tất</Text>
          </TouchableOpacity>
        )}
        {['paid', 'shipped', 'completed'].includes(item.status) && getNextStatuses(item.status).length > 0 && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => showUpdateStatusOptions(item)}>
            <Text style={styles.actionBtnText}>Cập nhật</Text>
          </TouchableOpacity>
        )}
  {/* Modal chọn trạng thái cho Android */}
  {Platform.OS === 'android' && updateModal.visible && (
    <Modal
      transparent
      animationType="fade"
      visible={updateModal.visible}
      onRequestClose={() => setUpdateModal({ visible: false, order: null, nextStatuses: [] })}
    >
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' }} onPress={() => setUpdateModal({ visible: false, order: null, nextStatuses: [] })}>
        <View style={{ backgroundColor: '#fff', margin: 40, borderRadius: 8, padding: 20 }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 12 }}>Chọn trạng thái mới</Text>
          {updateModal.nextStatuses && updateModal.nextStatuses.map((st) => (
            <TouchableOpacity
              key={st}
              style={{ paddingVertical: 10 }}
              onPress={() => {
                setUpdateModal({ visible: false, order: null, nextStatuses: [] });
                handleUpdateStatus(updateModal.order, st);
              }}
            >
              <Text style={{ fontSize: 16 }}>{getStatusLabel(st)}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={{ paddingVertical: 10 }} onPress={() => setUpdateModal({ visible: false, order: null, nextStatuses: [] })}>
            <Text style={{ color: 'red', fontSize: 16 }}>Hủy</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  )}
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
        <MaterialCommunityIcons name="arrow-left" size={28} color="transparent"/>
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
          <FlatList
            data={orders}
            renderItem={renderOrder}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ paddingBottom: 80 }}
            refreshing={refreshing}
            onRefresh={onRefresh}
            style={{ flex: 1 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={loadingMore ? <ActivityIndicator style={{marginVertical:16}} color="#1976d2" /> : null}
          />
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
    marginRight: 16,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f3f3',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
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
