import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios } from '../../configs/Apis';
import { UserContext } from '../../configs/Contexts';
import { SafeAreaView } from 'react-native';

export default function CartScreen({ navigation }) {
  const user = useContext(UserContext);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(user?.access_token || null);

  useEffect(() => {
    if (!token) {
      AsyncStorage.getItem('access_token').then(storedToken => {
        if (storedToken) setToken(storedToken);
      });
    }
  }, [user]);

  const fetchCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const axios = authAxios(token);
      const res = await axios.get('/carts/');
      const cartData = Array.isArray(res.data.results) ? res.data.results[0] : res.data;
      setCart(cartData);
    } catch (err) {
      setCart(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCart();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCart();
    setRefreshing(false);
  };

  const handleRemoveItem = async (itemId) => {
    if (!token) return;
    try {
      const axios = authAxios(token);
      await axios.delete(`/cart-items/${itemId}/`);
      fetchCart();
    } catch (err) {
      Alert.alert('Thông báo', 'Lỗi khi xóa sản phẩm khỏi giỏ hàng!');
    }
  };

  const handleChangeQuantity = async (itemId, newQuantity) => {
    if (!token || newQuantity < 1) return;
    try {
      const axios = authAxios(token);
      await axios.patch(`/cart-items/${itemId}/`, { quantity: newQuantity });
      fetchCart();
    } catch (err) {
      Alert.alert('Thông báo', 'Lỗi khi cập nhật số lượng!');
    }
  };

  // Hàm format giá tiền giống ProductDetail.js
  const formatCurrency = (value) => {
    if (!value) return '';
    return Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 });
  };

  // Tính tổng giá tiền của giỏ hàng
  const getTotalPrice = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => {
      if (item.product_detail && item.product_detail.price) {
        return sum + item.product_detail.price * item.quantity;
      }
      return sum;
    }, 0);
  };

  return (
    <>
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Giỏ hàng</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>
      <View style={styles.container}>
        {loading ? (
          <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
        ) : cart && cart.items && cart.items.length > 0 ? (
          <FlatList
            data={cart.items}
            keyExtractor={item => item.id?.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <View style={styles.itemImageWrapper}>
                  {item.product_detail && item.product_detail.image ? (
                    <Image source={{ uri: item.product_detail.image }} style={styles.itemImage} />
                  ) : (
                    <View style={styles.itemImage} />
                  )}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemPrice}>
                    {item.product_detail && item.product_detail.price ? formatCurrency(item.product_detail.price * item.quantity) : ''}
                  </Text>
                  <View style={styles.quantityRow}>
                    <TouchableOpacity onPress={() => handleChangeQuantity(item.id, item.quantity - 1)} style={styles.qtyBtn}><Text>-</Text></TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => handleChangeQuantity(item.id, item.quantity + 1)} style={styles.qtyBtn}><Text>+</Text></TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.removeBtn}>
                  <MaterialCommunityIcons name="delete" size={22} color="#d32f2f" />
                </TouchableOpacity>
              </View>
            )}
            ListFooterComponent={
              <View style={styles.footerRow}>
                <View>
                  <Text style={styles.totalText}>Tổng số lượng: {cart.total_quantity}</Text>
                  <Text style={styles.totalText}>Tổng giá: {formatCurrency(getTotalPrice())}</Text>
                </View>
                <TouchableOpacity style={styles.checkoutBtn} onPress={() => Alert.alert('Thông báo', 'Chức năng thanh toán sẽ được cập nhật!')}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Thanh toán</Text>
                </TouchableOpacity>
              </View>
            }
          />
        ) : (
          <Text style={{ color: '#888', marginTop: 40, textAlign: 'center' }}>Giỏ hàng của bạn đang trống.</Text>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 0,
    position: 'relative',
  },
    headerSafe: {
  backgroundColor: '#2196f3',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196f3',
    paddingHorizontal: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    margin: 8,
  },
  itemImageWrapper: {
    width: 60,
    height: 60,
    marginRight: 12,
  },
  itemImage: {
    width: 60,
    height: 60,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  itemPrice: {
    fontSize: 14,
    color: '#1976d2',
    marginBottom: 4,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
  },
  qtyText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    minWidth: 24,
    textAlign: 'center',
  },
  removeBtn: {
    marginLeft: 8,
    padding: 4,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderColor: '#eee',
    marginTop: 12,
  },
  totalText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  checkoutBtn: {
    backgroundColor: '#1976d2',
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
});
