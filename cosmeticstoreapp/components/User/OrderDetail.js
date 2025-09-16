import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';

export default function OrderDetailScreen({ route, navigation }) {
  const [refreshing, setRefreshing] = useState(false);
  function getStatusColor(status) {
    switch (status?.toLowerCase()) {
      case 'pending': return '#ffa726';
      case 'paid':
      case 'completed': return '#43a047';
      case 'cancelled': return '#f44336';
      case 'shipped': return '#1976d2';
      default: return '#888';
    }
  }
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = await AsyncStorage.getItem('access_token');
        const res = await authAxios(token).get(endpoints.orders + orderId + '/');
        setOrder(res.data);
        setError('');
      } catch (err) {
        setError('Không thể tải chi tiết đơn hàng.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const res = await authAxios(token).get(endpoints.orders + orderId + '/');
      setOrder(res.data);
      setError('');
    } catch (err) {
      setError('Không thể tải chi tiết đơn hàng.');
    }
    setRefreshing(false);
  };

  if (loading) {
    return <ActivityIndicator style={{marginTop:32}} color="#1976d2" />;
  }

  if (error) {
    return <Text style={{color:'#f44336', textAlign:'center', marginTop:32}}>{error}</Text>;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn hàng</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={28} color="transparent" />
        </TouchableOpacity>
      </View>
      <View style={styles.detailBox}>
        {/* Thông tin đơn hàng */}
        <View style={styles.infoGroup}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="barcode" size={20} color="#1976d2" style={{marginRight:6}} />
            <Text style={styles.orderId}>Mã đơn: {order.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="progress-clock" size={20} color={getStatusColor(order.status)} style={{marginRight:6}} />
            <Text style={[styles.status, {color: getStatusColor(order.status)}]}>Trạng thái: {order.status_display || order.status}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={20} color="#1976d2" style={{marginRight:6}} />
            <Text style={styles.date}>Ngày đặt: {order.created_at ? order.created_at.substring(0, 10) : ''}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="cash-multiple" size={20} color="#43a047" style={{marginRight:6}} />
            <Text style={styles.total}>Tổng tiền: {(order.total_price || order.total_amount) ? Number(order.total_price || order.total_amount).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }) : ''}</Text>
          </View>
          {order.discount_code ? (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="ticket-percent" size={20} color="#d32f2f" style={{marginRight:6}} />
              <Text style={styles.discount}>
                Mã giảm giá: <Text style={{fontWeight:'bold', color:'#d32f2f'}}>{order.discount_code.code}</Text> ({order.discount_code.discount_percentage}%)
              </Text>
            </View>
          ) : null}
          {order.shipping_fee ? (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="truck-delivery" size={20} color="#1976d2" style={{marginRight:6}} />
              <Text style={styles.shippingFee}>Phí vận chuyển: {Number(order.shipping_fee).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 })}</Text>
            </View>
          ) : null}
          {order.address ? (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="home-map-marker" size={20} color="#1976d2" style={{marginRight:6}} />
              <Text style={styles.address}>Địa chỉ: {order.address}</Text>
            </View>
          ) : null}
          {order.receiver_phone ? (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="phone" size={20} color="#1976d2" style={{marginRight:6}} />
              <Text style={styles.address}>SĐT: {order.receiver_phone}</Text>
            </View>
          ) : null}
        </View>
        {/* Danh sách sản phẩm */}
        <Text style={styles.sectionTitle}>Sản phẩm</Text>
        <FlatList
          data={order.items || []}
          keyExtractor={item => item.id?.toString()}
          renderItem={({ item }) => {
            const imageUrl = item.product?.image || (item.product?.images && item.product.images.length > 0 ? item.product.images[0].image : null);
            return (
              <View style={styles.itemBoxRow}>
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.productImageRow} resizeMode="cover" />
                ) : (
                  <View style={styles.productImageRow} />
                )}
                <View style={styles.itemInfoCol}>
                  <Text style={styles.itemNameRow}>{item.product_name || item.product?.name}</Text>
                  <Text style={styles.itemQty}>Số lượng: {item.quantity}</Text>
                  <Text style={styles.itemPrice}>Giá: {item.price ? Number(item.price).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }) : ''}</Text>
                </View>
              </View>
            );
          }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  discount: {
    fontSize: 14,
    color: '#d32f2f',
    marginBottom: 4,
  },
  shippingFee: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
  },
  itemBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e3f2fd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  productImageRow: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  itemInfoCol: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
  },
  itemNameRow: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 4,
    backgroundColor: '#eee',
  },
  infoGroup: {
    marginBottom: 16,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e3f2fd',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
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
  detailBox: {
    padding: 16,
  },
  orderId: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 4,
  },
  status: {
    fontSize: 15,
    color: '#ffa726',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  total: {
    fontSize: 15,
    color: '#222',
    marginBottom: 4,
    fontWeight: '500',
  },
  address: {
    fontSize: 14,
    color: '#222',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
    color: '#1976d2',
  },
  itemBox: {
    borderWidth: 1,
    borderColor: '#e3f2fd',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
    backgroundColor: '#fafafa',
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  itemQty: {
    fontSize: 13,
    color: '#333',
  },
  itemPrice: {
    fontSize: 13,
    color: '#222',
    fontWeight: '500',
  },
});
