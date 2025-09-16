import React, { useEffect, useState, useContext } from 'react';
import { AppState, View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, TextInput, SafeAreaView, Linking } from 'react-native';
// ...existing code...
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { authAxios } from '../../configs/Apis';
import { UserContext } from '../../configs/Contexts';

export default function CartScreen({ navigation }) {
  const [discountCode, setDiscountCode] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0); // Số tiền giảm giá thực tế
  const [discountError, setDiscountError] = useState('');
  const user = useContext(UserContext);
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [token, setToken] = useState(user?.access_token || null);
  const [shippingAddress, setShippingAddress] = useState('');
  const [userAddresses, setUserAddresses] = useState([]);
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [shippingFee, setShippingFee] = useState(null);
  const [serviceFee, setServiceFee] = useState(null);
  const [userVouchers, setUserVouchers] = useState([]);
  // Lấy danh sách voucher cá nhân của user
  useEffect(() => {
    const fetchUserVouchers = async () => {
      if (!token) return;
      try {
        const axios = authAxios(token);
        const res = await axios.get('/user-vouchers/?page_size=100');
        setUserVouchers(res.data.results || res.data || []);
      } catch (err) {
        setUserVouchers([]);
      }
    };
    fetchUserVouchers();
  }, [token]);

  useEffect(() => {
    if (!token) {
      AsyncStorage.getItem('access_token').then(storedToken => {
        if (storedToken) setToken(storedToken);
      });
    }
  }, [user]);

  // Lấy danh sách địa chỉ của user
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!token) return;
      try {
        const axios = authAxios(token);
        // Chỉ lấy địa chỉ của user đang đăng nhập
        const res = await axios.get('/user-addresses/?page_size=100');
        setUserAddresses(res.data.results || res.data || []);
      } catch (err) {
        setUserAddresses([]);
      }
    };
    fetchAddresses();
  }, [token]);

  // Gợi ý địa chỉ theo input
  const fetchAddressSuggestions = (text) => {
    if (!text) {
      setAddressSuggestions([]);
      setShowAddressSuggestions(false);
      return;
    }
    const filtered = userAddresses.filter(addr => addr.address && addr.address.toLowerCase().includes(text.toLowerCase()));
    setAddressSuggestions(filtered.slice(0, 6));
    setShowAddressSuggestions(true);
  };

  const fetchCart = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const axios = authAxios(token);
      const res = await axios.get('/carts/');
      const cartData = Array.isArray(res.data.results) ? res.data.results[0] : res.data;
      setCart(cartData);
      setShippingAddress(prev => {
        if (prev) return prev;
        if (cartData && cartData.address) return cartData.address;
        if (cartData && cartData.user_address) return cartData.user_address;
        return '';
      });
      // Cập nhật phí vận chuyển và dịch vụ từ backend
      if (cartData && typeof cartData.shipping_fee !== 'undefined') {
        setShippingFee(cartData.shipping_fee);
      }
      if (cartData && typeof cartData.service_fee !== 'undefined') {
        setServiceFee(cartData.service_fee);
      }
      // Cập nhật giảm giá từ backend nếu có
      if (cartData && cartData.discount_code) {
        setDiscountPercent(Number(cartData.discount_code.discount_percentage) || 0);
        setDiscountCode(cartData.discount_code.code || '');
        // Nếu backend trả về discount_amount hoặc discount_value
        if (typeof cartData.discount_amount !== 'undefined') {
          setDiscountAmount(Number(cartData.discount_amount) || 0);
        } else if (typeof cartData.discount_value !== 'undefined') {
          setDiscountAmount(Number(cartData.discount_value) || 0);
        } else {
          setDiscountAmount(0);
        }
      } else {
        setDiscountAmount(0);
      }
      // Reset state nếu giỏ hàng trống
      if (cartData && Array.isArray(cartData.items) && cartData.items.length === 0) {
        setShippingAddress('');
        setDiscountCode('');
        setDiscountPercent(0);
        setDiscountAmount(0);
      }
    } catch (err) {
      setCart(null);
    }
    setLoading(false);
  };

  // Khi vào trang giỏ hàng, tự động lấy địa chỉ mặc định từ danh sách địa chỉ
  useEffect(() => {
    const fetchCartAndDefaultAddress = async () => {
      await fetchCart();
      // Sau khi lấy cart, nếu chưa có shippingAddress thì lấy địa chỉ mặc định
      if (!shippingAddress && userAddresses && userAddresses.length > 0) {
        const defaultAddr = userAddresses.find(addr => addr.is_default) || userAddresses[0];
        if (defaultAddr && defaultAddr.address) {
          setShippingAddress(defaultAddr.address);
          updateShippingAddress(defaultAddr.address);
        }
      }
    };
    fetchCartAndDefaultAddress();
  }, [token, userAddresses]);

  useFocusEffect(
    React.useCallback(() => {
      fetchCart();
    }, [token])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        fetchCart();
      }
    });
    return () => {
      subscription.remove();
    };
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
      const price = Number(item.product_detail?.price) || 0;
      const quantity = Number(item.quantity) || 0;
      return sum + price * quantity;
    }, 0);
  };

  // Tổng tiền sau giảm giá theo phần trăm
  // Tổng tiền sau giảm giá (ưu tiên số tiền giảm giá từ backend nếu có)
  const getTotalPrice = () => {
    const subtotal = Number(getSubtotal()) || 0;
    const shipping = Number(shippingFee) || 0;
    const service = Number(serviceFee) || 0;
    // Nếu có discountAmount từ backend thì dùng, nếu không thì tính theo phần trăm
    let discount = Number(discountAmount) || 0;
    if (!discount && discountPercent) {
      discount = subtotal * (Number(discountPercent) / 100);
    }
    return subtotal - discount + shipping + service;
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
    // Kiểm tra mã giảm giá có trong danh sách voucher cá nhân
    const foundVoucher = userVouchers.find(v => v.discount_code?.code?.toLowerCase() === discountCode.trim().toLowerCase() && !v.used && (new Date(v.expired_at || v.discount_code?.valid_to) > new Date()));
    if (!foundVoucher) {
      setDiscountError('Bạn chỉ được sử dụng voucher của riêng mình, hoặc voucher đã hết hạn/đã dùng.');
      setDiscountPercent(0);
      return;
    }
    try {
      const axios = authAxios(token);
      // Gọi API PATCH để lưu discount_code vào cart
      if (cart && cart.id && foundVoucher.discount_code?.id) {
        try {
          await axios.patch(`/carts/${cart.id}/`, { discount_code: foundVoucher.discount_code.id });
          // Sau khi PATCH thành công, lấy lại cart từ backend để đồng bộ các giá trị
          const cartRes = await axios.get(`/carts/${cart.id}/`);
          const cartData = cartRes.data;
          setShippingFee(cartData.shipping_fee || 0);
          setServiceFee(cartData.service_fee || 0);
          setDiscountCode(cartData.discount_code?.code || '');
          setDiscountPercent(Number(cartData.discount_code?.discount_percentage) || 0);
          if (typeof cartData.discount_amount !== 'undefined') {
            setDiscountAmount(Number(cartData.discount_amount) || 0);
          } else if (typeof cartData.discount_value !== 'undefined') {
            setDiscountAmount(Number(cartData.discount_value) || 0);
          } else {
            setDiscountAmount(0);
          }
          // Luôn gọi lại fetchCart để cập nhật cart mới nhất từ backend
          await fetchCart();
        } catch (patchErr) {
          Alert.alert('Thông báo', 'Có lỗi khi áp dụng mã giảm giá. Vui lòng thử lại sau.');
        }
      } else {
        Alert.alert('Thông báo', 'Không thể áp dụng mã giảm giá. Vui lòng thử lại hoặc kiểm tra giỏ hàng.');
      }
    } catch (err) {
      setDiscountPercent(0);
      setDiscountError('Mã giảm giá không hợp lệ hoặc có lỗi kết nối');
    }
  };

  // Hàm cập nhật địa chỉ giao hàng và phí vận chuyển
  const updateShippingAddress = async (address) => {
    if (!cart || !cart.id || !token) return;
    try {
      const axios = authAxios(token);
  await axios.patch(`/carts/${cart.id}/`, { address: address });
      const res = await axios.get('/carts/');
      const cartData = Array.isArray(res.data.results) ? res.data.results[0] : res.data;
      if (cartData && typeof cartData.shipping_fee !== 'undefined') {
        setShippingFee(cartData.shipping_fee);
      }
    } catch (err) {
      // Xử lý lỗi nếu cần
    }
  };

  return (
    <View style={{ flex: 1 }}>
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
        {/* Địa chỉ giao hàng & Mã giảm giá */}
        <View style={{ marginHorizontal: 8, marginTop: 6, marginBottom: 6 }}>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="map-marker" size={22} color="#1976d2" style={{ marginRight: 8 }} />
            <TouchableOpacity
              style={[styles.inputBox, { flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => navigation.navigate('AddressManager', {
                addresses: userAddresses,
                selectedAddress: shippingAddress,
                onSelect: (address) => {
                  setShippingAddress(address.address);
                  updateShippingAddress(address.address);
                }
              })}
            >
              <Text style={{ flex: 1, color: shippingAddress ? '#222' : '#888' }}>
                {shippingAddress ? shippingAddress : 'Chọn địa chỉ giao hàng'}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={22} color="#1976d2" />
            </TouchableOpacity>
          </View>
          <View style={styles.inputRow}>
            <MaterialCommunityIcons name="ticket-percent" size={22} color="#d32f2f" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.inputBox}
              value={discountCode}
              onChangeText={setDiscountCode}
              placeholder="Mã giảm giá"
            />
            <TouchableOpacity style={styles.discountBtn} onPress={handleApplyDiscount}>
              <Text style={{ color: '#d32f2f', fontWeight: 'bold' }}>Áp dụng</Text>
            </TouchableOpacity>
          </View>
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
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Giảm</Text>
                {discountAmount ? (
                  <Text style={[styles.summaryValue, { color: '#d32f2f' }]}>- {formatCurrency(discountAmount)}</Text>
                ) : (
                  <Text style={[styles.summaryValue, { color: '#d32f2f' }]}>- {discountPercent}%</Text>
                )}
              </View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Phí vận chuyển</Text><Text style={styles.summaryValue}>{shippingFee !== null ? formatCurrency(shippingFee) : 'Đang tính...'}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Phí dịch vụ</Text><Text style={styles.summaryValue}>{serviceFee !== null ? formatCurrency(serviceFee) : 'Đang tính...'}</Text></View>
              <View style={styles.summaryRow}><Text style={styles.summaryLabelBold}>Tổng</Text><Text style={[styles.summaryValue, { color: '#d32f2f', fontWeight: 'bold' }]}>{formatCurrency(getTotalPrice())}</Text></View>
            </View>
            {/* Nút thanh toán */}
            <TouchableOpacity
              style={styles.checkoutBtnBig}
              onPress={async () => {
                if (!token) {
                  Alert.alert('Thông báo', 'Bạn chưa đăng nhập!');
                  return;
                }
                try {
                  const axios = authAxios(token);
                  // Nếu không có mã giảm giá, xóa discount_code khỏi cart trước khi thanh toán
                  if (!discountCode || !discountPercent) {
                    if (cart && cart.id) {
                      await axios.patch(`/carts/${cart.id}/`, { discount_code: null });
                    }
                  }
                  const res = await axios.post('/create-stripe-session/');
                  if (res.data.checkout_url) {
                    Linking.openURL(res.data.checkout_url);
                  } else {
                    Alert.alert('Thông báo', 'Không lấy được link thanh toán Stripe!');
                  }
                } catch (err) {
                  Alert.alert('Thông báo', 'Lỗi khi tạo phiên thanh toán Stripe!');
                }
              }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>THANH TOÁN</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={{ color: '#888', marginTop: 40, textAlign: 'center' }}>Giỏ hàng của bạn đang trống.</Text>
        )}
      </View>
    </View>
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
  },
  inputBox: {
    flex: 1,
    height: 36,
    backgroundColor: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#eee',
    marginRight: 8,
  },
  // ...existing code...
  suggestionBox: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#eee',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  suggestionText: {
    fontSize: 15,
    color: '#222',
    flex: 1,
    flexWrap: 'wrap',
  },
  addressManagerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#1976d2',
    justifyContent: 'center',
    alignItems: 'center',
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
    marginRight: 16,
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
