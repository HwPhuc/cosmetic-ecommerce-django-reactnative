import React, { useEffect, useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios } from '../../configs/Apis';
import { UserContext } from '../../configs/Contexts';
import { SafeAreaView } from 'react-native';

export default function CartScreen({ navigation }) {
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountError, setDiscountError] = useState('');
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
    setDiscountError('');
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

  // Hàm format giá tiền
  const formatCurrency = (value) => {
    if (!value) return '';
    return Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 });
  };

  // Tính tổng giá tiền của giỏ hàng
  const getSubtotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((sum, item) => {
      if (item.product_detail && item.product_detail.price) {
        return sum + item.product_detail.price * item.quantity;
      }
      return sum;
    }, 0);
  };

  // Phí vận chuyển và dịch vụ (data tạm)
  const shippingFee = 30000;
  const serviceFee = 10000;

  // Tổng tiền sau giảm giá theo phần trăm
  const getTotalPrice = () => {
    const subtotal = getSubtotal();
    const discountAmount = subtotal * (discountPercent / 100);
    return subtotal - discountAmount + shippingFee + serviceFee;
  };

  // Xử lý mã giảm giá
  const handleApplyDiscount = async () => {
    // Đóng bàn phím khi nhấn Áp dụng
    if (typeof global !== 'undefined' && global?.Keyboard) {
      global.Keyboard.dismiss();
    } else {
      try {
        const { Keyboard } = require('react-native');
        Keyboard.dismiss();
      } catch (e) {}
    }
    if (!discountCode) {
      setDiscountError('Vui lòng nhập mã giảm giá');
      setDiscountPercent(0);
      return;
    }
    if (!token) {
      setDiscountError('Bạn chưa đăng nhập');
      setDiscountPercent(0);
      return;
    }
    try {
      const axios = authAxios(token);
      const res = await axios.get(`/discounts/validate/?code=${encodeURIComponent(discountCode.trim())}`);
      if (res.data.valid) {
        setDiscountPercent(res.data.value || 0);
        setDiscountError('');
      } else {
        setDiscountPercent(0);
        setDiscountError(res.data.message || 'Mã giảm giá không hợp lệ');
      }
    } catch (err) {
      setDiscountPercent(0);
      setDiscountError('Mã giảm giá không hợp lệ hoặc có lỗi kết nối');
    }
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
        {/* Mã giảm giá */}
        <View style={styles.discountRow}>
          <MaterialCommunityIcons name="ticket-percent" size={22} color="#d32f2f" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.discountInput}
            value={discountCode}
            onChangeText={setDiscountCode}
            placeholder="Mã giảm giá"
          />
          <TouchableOpacity style={styles.discountBtn} onPress={handleApplyDiscount}>
            <Text style={{ color: '#d32f2f', fontWeight: 'bold' }}>Áp dụng</Text>
          </TouchableOpacity>
        </View>
        {discountError ? <Text style={styles.discountError}>{discountError}</Text> : null}
        {loading ? (
          <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
        ) : cart && cart.items && cart.items.length > 0 ? (
          <>
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
                    <Text style={styles.itemDesc} numberOfLines={1} ellipsizeMode="tail">{item.product_detail?.description || ''}</Text>
                    <Text style={styles.itemPrice}>
                      {item.product_detail && item.product_detail.price ? formatCurrency(item.product_detail.price) : ''}
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
            />
            {/* Tóm tắt đơn */}
            <View style={styles.summaryBox}>
              <Text style={styles.summaryTitle}>Tóm Tắt Đơn</Text>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Tạm tính</Text><Text style={styles.summaryValue}>{formatCurrency(getSubtotal())}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Giảm</Text><Text style={[styles.summaryValue, { color: '#d32f2f' }]}>- {discountPercent}%</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Phí vận chuyển</Text><Text style={styles.summaryValue}>{formatCurrency(shippingFee)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Phí dịch vụ</Text><Text style={styles.summaryValue}>{formatCurrency(serviceFee)}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabelBold}>Tổng</Text><Text style={[styles.summaryValue, { color: '#d32f2f', fontWeight: 'bold' }]}>{formatCurrency(getTotalPrice())}</Text></View>
            </View>
            {/* Nút thanh toán */}
            <TouchableOpacity style={styles.checkoutBtnBig} onPress={() => Alert.alert('Thông báo', 'Chức năng thanh toán sẽ được cập nhật!')}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>THANH TOÁN</Text>
            </TouchableOpacity>
          </>
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
    paddingTop: 8,
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
  itemDesc: {
    fontSize: 13,
    color: '#888',
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
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 8,
    marginTop: 6,
    marginBottom: 6,
  },
  discountInput: {
    flex: 1,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 8,
  },
  discountBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d32f2f',
  },
  discountError: {
    color: '#d32f2f',
    fontSize: 13,
    marginLeft: 16,
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    margin: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#eee',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#222',
  },
  summaryLabelBold: {
    fontSize: 16,
    color: '#222',
    fontWeight: 'bold',
  },
  summaryValue: {
    fontSize: 15,
    color: '#222',
  },
  checkoutBtnBig: {
    backgroundColor: '#d32f2f',
    borderRadius: 8,
    paddingVertical: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
