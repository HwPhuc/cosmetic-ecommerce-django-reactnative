import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';

export default function MyOrdersScreen({ navigation }) {

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchOrders = async (reset = false, pageNum = 1) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError('Bạn chưa đăng nhập.');
        setLoading(false);
        return;
      }
      const res = await authAxios(token).get(endpoints.orders + `?page_size=10&page=${pageNum}`);
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
    } catch (err) {
      setError('Không thể tải đơn hàng.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchOrders(true, 1);
    setPage(1);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders(true, 1);
    setPage(1);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !next) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchOrders(false, nextPage);
    setPage(nextPage);
  };

  const renderOrder = ({ item }) => (
    <TouchableOpacity style={styles.orderBox} onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}>
      <View style={styles.rowBetween}>
        <Text style={styles.orderId}>Mã đơn: {item.id}</Text>
        <Text style={[styles.status, {color: getStatusColor(item.status)}]}>{item.status_display || item.status}</Text>
      </View>
      <Text style={styles.date}>Ngày đặt: {item.created_at ? item.created_at.substring(0, 10) : ''}</Text>
      <Text style={styles.total}>Tổng tiền: {(item.total_price || item.total_amount) ? Number(item.total_price || item.total_amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }) : ''}</Text>
      {item.address ? <Text style={styles.address}>Địa chỉ: {item.address}</Text> : null}
      {item.receiver_phone ? <Text style={styles.address}>SĐT: {item.receiver_phone}</Text> : null}
      {item.items && Array.isArray(item.items) ? <Text style={styles.address}>Số sản phẩm: {item.items.length}</Text> : null}
    </TouchableOpacity>
  );

  function getStatusColor(status) {
    switch (status) {
      case 'PENDING': return '#ffa726';
      case 'COMPLETED': return '#43a047';
      case 'CANCELLED': return '#f44336';
      default: return '#1976d2';
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={28} color="transparent" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator style={{marginTop:32}} color="#1976d2" />
      ) : error ? (
        <Text style={{color:'#f44336', textAlign:'center', marginTop:32}}>{error}</Text>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={item => item.id.toString()}
          renderItem={renderOrder}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{paddingBottom:24}}
          style={{flex:1}}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{marginVertical:16}} color="#1976d2" /> : null}
        />
      )}
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
  orderBox: {
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
    minHeight: 70,
    justifyContent: 'center',
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  orderId: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  status: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 13,
    color: '#333',
    marginBottom: 1,
  },
  total: {
    fontSize: 13,
    color: '#222',
    marginTop: 1,
    fontWeight: '500',
  },
});
