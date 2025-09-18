import React, { useContext, useEffect, useState } from 'react';
import { UserDispatchContext, UserContext } from '../../configs/Contexts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, RefreshControl, Dimensions, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { endpoints, authAxios } from '../../configs/Apis';

function getStatusText(status) {
  switch (status) {
    case 'Pending': return 'Chờ xác nhận';
    case 'Paid': return 'Đã thanh toán';
    case 'Shipped': return 'Đang giao';
    case 'Completed': return 'Đã giao';
    case 'Cancelled': return 'Đã hủy';
    default: return status;
  }
}

function getStatusColor(status) {
  switch (status) {
    case 'Chờ xác nhận':
    case 'Pending':
      return '#ffe082';
    case 'Đang giao':
    case 'Shipped':
      return '#90caf9';
    case 'Đã giao':
    case 'Completed':
      return '#a5d6a7';
    case 'Đã hủy':
    case 'Cancelled':
      return '#ef9a9a';
    case 'Paid':
      return '#b2dfdb';
    default:
      return '#e0e0e0';
  }
}

export default function EmployeeDashboard({ navigation }) {
  const dispatch = useContext(UserDispatchContext);
  const user = useContext(UserContext);
  const token = user?.access_token;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState({
    revenue_today: 0,
    new_orders: 0,
    recent_orders: [],
    best_sellers: [],
    revenue_updated: '',
    new_orders_delta: 0,
  });

  // Fetch dashboard data
  const fetchDashboard = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await authAxios(token).get(endpoints.dashboard);
      setDashboard(res.data);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể tải dữ liệu dashboard.');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    fetchDashboard();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard(false);
    setRefreshing(false);
  };

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('access_token');
      if (dispatch) dispatch({ type: 'logout' });
    } catch (err) {
      Alert.alert('Đăng xuất thất bại', 'Có lỗi xảy ra khi đăng xuất. Vui lòng thử lại!');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerLogo}>HOANGPHUC SHOP</Text>
        <TouchableOpacity onPress={handleLogout} style={{ position: 'relative' }}>
          <MaterialCommunityIcons name="logout" size={28} color="#1976d2" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1, marginBottom: 70 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2196f3"]} />
        }
      >
        {/* Thống kê nhanh */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Doanh thu hôm nay</Text>
            <Text style={styles.statValue}>{(dashboard.revenue_today ?? 0).toLocaleString()}đ</Text>
            <Text style={styles.statSub}>Cập nhật {dashboard.revenue_updated || 'gần đây'}</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Đơn hàng mới</Text>
            <Text style={[styles.statValue, { color: '#388e3c' }]}>{dashboard.new_orders ?? 0}</Text>
            <Text style={[styles.statSub, { color: '#388e3c' }]}>+{dashboard.new_orders_delta} từ hôm qua</Text>
          </View>
        </View>

        {/* Thao tác nhanh */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeOrders')}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={28} color="#1976d2" />
            <Text style={styles.quickActionLabel}>Đơn hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeInventory')}>
            <MaterialCommunityIcons name="warehouse" size={28} color="#1976d2" />
            <Text style={styles.quickActionLabel}>Tồn kho</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeReports')}>
            <MaterialCommunityIcons name="chart-bar" size={28} color="#1976d2" />
            <Text style={styles.quickActionLabel}>Báo cáo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation && navigation.navigate && navigation.navigate('CustomerList')}>
            <MaterialCommunityIcons name="chat-outline" size={28} color="#1976d2" />
            <Text style={styles.quickActionLabel}>Chat</Text>
          </TouchableOpacity>
        </View>

        {/* Đơn hàng gần đây */}
        <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
        <View style={styles.recentOrdersBox}>
          {dashboard.recent_orders && dashboard.recent_orders.length > 0 ? dashboard.recent_orders.map(order => (
            <View key={order.id} style={styles.recentOrderRow}>
              <View style={styles.orderImage}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={28} color="#1976d2" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.orderId}>Đơn hàng #{order.id}</Text>
                <Text style={styles.orderCustomer}>{order.customer}</Text>
                <Text style={styles.orderTime}>{order.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderPrice}>{(order.price ?? 0).toLocaleString()}đ</Text>
                <View style={[styles.statusBox, { backgroundColor: getStatusColor(order.status) }] }>
                  <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
                </View>
              </View>
            </View>
          )) : <Text style={{ color: '#888' }}>Không có đơn hàng gần đây.</Text>}
        </View>

        {/* Sản phẩm bán chạy */}
        <Text style={styles.sectionTitle}>Sản phẩm bán chạy</Text>
        <View style={styles.bestSellerRow}>
          {dashboard.best_sellers && dashboard.best_sellers.length > 0 ? dashboard.best_sellers.map(p => (
            <View key={p.id} style={styles.bestSellerBox}>
              {p.image ? (
                <Image source={{ uri: p.image }} style={styles.productImage} resizeMode="cover" />
              ) : (
                <View style={[styles.productImage, { justifyContent: 'center', alignItems: 'center' }]}> 
                  <MaterialCommunityIcons name="image-off-outline" size={32} color="#bdbdbd" />
                </View>
              )}
              <Text style={styles.productName} numberOfLines={2}>{p.name}</Text>
              <Text style={styles.productPrice}>{(p.price ?? 0).toLocaleString()}đ</Text>
              <Text style={styles.productSold}>Đã bán {p.sold ?? 0}</Text>
            </View>
          )) : <Text style={{ color: '#888' }}>Không có sản phẩm bán chạy.</Text>}
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeHome')}>
          <MaterialCommunityIcons name="home-variant" style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeOrders')}>
          <MaterialCommunityIcons name="clipboard-list-outline" style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeInventory')}>
          <MaterialCommunityIcons name="warehouse" style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeReports')}>
          <MaterialCommunityIcons name="chart-bar" style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('CustomerList')}>
          <MaterialCommunityIcons name="chat-outline" style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeProfile')}>
          <MaterialCommunityIcons name="account-circle-outline" style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f9fb',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 40,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 5,
    alignItems: 'center',
    elevation: 2,
  },
  statLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSub: {
    color: '#888',
    fontSize: 12,
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginBottom: 16,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 16,
    marginHorizontal: 5,
    elevation: 1,
  },
  quickActionIcon: {
    fontSize: 28,
    marginBottom: 6,
  },
  quickActionLabel: {
    fontSize: 13,
    color: '#333',
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 16,
    marginBottom: 6,
    marginTop: 10,
  },
  recentOrdersBox: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 10,
    marginBottom: 16,
    padding: 10,
  },
  recentOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderImage: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 2,
  },
  orderCustomer: {
    fontSize: 14,
    color: '#333',
  },
  orderTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  orderPrice: {
    fontWeight: 'bold',
    color: '#222',
    fontSize: 15,
    marginBottom: 2,
    alignSelf: 'flex-end',
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
  bestSellerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginHorizontal: 10,
    marginBottom: 16,
  },
  bestSellerBox: {
    width: (Dimensions.get('window').width - 40) / 2, // 2 sản phẩm 1 hàng
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    padding: 12,
    margin: 5,
    elevation: 1,
  },
  productImage: {
    width: 60,
    height: 60,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 8,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
    textAlign: 'center',
  },
  productPrice: {
    color: '#e91e63',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  productSold: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    height: 80,
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    paddingBottom: 28,
  },
  navIcon: {
    fontSize: 26,
    color: '#222',
    paddingTop: 8,
  },
  navBtn: {
    flex: 1,
    alignItems: 'center',
  },
  navLabel: {
    fontSize: 12,
    color: '#333',
  },
});
