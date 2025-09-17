import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { endpoints, authAxios } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function EmployeeOrderDetail({ route, navigation }) {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      setError('');
      try {
        const token = await AsyncStorage.getItem('access_token');
        const res = await authAxios(token).get(`${endpoints.adminOrders}${orderId}/`);
        setOrder(res.data);
      } catch (e) {
        setError('Không thể tải chi tiết đơn hàng.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (!order) return null;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đơn #{order.id}</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Khách hàng:</Text>
        <Text style={styles.value}>{order.user || '---'}</Text>
        <Text style={styles.label}>Số điện thoại:</Text>
        <Text style={styles.value}>{order.receiver_phone || '---'}</Text>
        <Text style={styles.label}>Địa chỉ:</Text>
        <Text style={styles.value}>{order.address || '---'}</Text>
        <Text style={styles.label}>Trạng thái:</Text>
        <Text style={styles.value}>{order.status || '---'}</Text>
        <Text style={styles.label}>Tổng tiền:</Text>
        <Text style={styles.value}>{parseInt(order.total_price).toLocaleString()}đ</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.label}>Danh sách sản phẩm:</Text>
        {order.items && order.items.length > 0 ? order.items.map((item, idx) => (
          <View key={idx} style={styles.productRow}>
            {item.product && item.product.image ? (
              <View style={styles.productImageWrapper}>
                <Image source={{ uri: item.product.image }} style={styles.productImage} />
              </View>
            ) : null}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.productName}>{item.product?.name || item.product_name || '---'}</Text>
              <Text style={styles.productPrice}>Giá: {item.product?.price ? parseInt(item.product.price).toLocaleString() : (item.price ? parseInt(item.price).toLocaleString() : '---')}đ</Text>
            </View>
            <Text style={styles.productQty}>x{item.quantity}</Text>
          </View>
        )) : <Text style={styles.value}>Không có sản phẩm</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginRight: 28,
  },
  section: {
    marginBottom: 18,
    paddingHorizontal: 16,
  },
  label: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginTop: 8,
  },
  value: {
    color: '#222',
    marginBottom: 4,
    fontSize: 15,
  },
  productImageWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#eee',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: 48,
    height: 48,
    resizeMode: 'cover',
    borderRadius: 8,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 8,
  },
  productName: {
    color: '#333',
    fontSize: 15,
    fontWeight: 'bold',
  },
  productPrice: {
    color: '#1976d2',
    fontSize: 14,
    marginTop: 2,
  },
  productQty: {
    color: '#888',
    fontSize: 15,
    marginLeft: 8,
    minWidth: 32,
    textAlign: 'right',
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 40,
  },
});
