
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const mockRevenue = 12500000;
const mockNewOrders = 24;
const mockRecentOrders = [
  { id: 12345, customer: 'Nguyễn Văn A', time: '15 phút trước', price: 2500000, status: 'Chờ xác nhận' },
  { id: 12344, customer: 'Trịnh Thị B', time: '30 phút trước', price: 1800000, status: 'Chờ xác nhận' },
  { id: 12343, customer: 'Lê Văn C', time: '1 giờ trước', price: 3200000, status: 'Đang giao' },
];
const mockBestSellers = [
  { id: 1, name: 'Kem dưỡng da ban đêm', price: 850000, sold: 60 },
  { id: 2, name: 'Serum vitamin C', price: 1200000, sold: 45 },
];

const quickActions = [
  { label: 'Đơn hàng', icon: '📦' },
  { label: 'Khách hàng', icon: '👤' },
  { label: 'Tồn kho', icon: '📦' },
  { label: 'Báo cáo', icon: '📊' },
];

function getStatusColor(status) {
  switch (status) {
    case 'Chờ xác nhận': return '#ffe082';
    case 'Đang giao': return '#90caf9';
    case 'Đã giao': return '#a5d6a7';
    case 'Đã hủy': return '#ef9a9a';
    default: return '#e0e0e0';
  }
}


export default function EmployeeDashboard({ navigation }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerLogo}>HOANGPHUC SHOP</Text>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeOrders')} style={{ position: 'relative' }}>
          <MaterialCommunityIcons name="clipboard-list-outline" size={28} color="#1976d2" />
        </TouchableOpacity>
      </View>

  <ScrollView style={{ flex: 1, marginBottom: 70 }} showsVerticalScrollIndicator={false}>
        {/* Thống kê nhanh */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Doanh thu hôm nay</Text>
            <Text style={styles.statValue}>{mockRevenue.toLocaleString()}đ</Text>
            <Text style={styles.statSub}>Cập nhật 1h trước</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Đơn hàng mới</Text>
            <Text style={[styles.statValue, { color: '#388e3c' }]}>{mockNewOrders}</Text>
            <Text style={[styles.statSub, { color: '#388e3c' }]}>+5 từ hôm qua</Text>
          </View>
        </View>

        {/* Thao tác nhanh */}
        <View style={styles.quickActionRow}>
          <TouchableOpacity style={styles.quickActionBtn} onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeOrders')}>
            <MaterialCommunityIcons name="clipboard-list-outline" size={28} color="#1976d2" />
            <Text style={styles.quickActionLabel}>Đơn hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}><MaterialCommunityIcons name="account-group-outline" size={28} color="#1976d2" /><Text style={styles.quickActionLabel}>Khách hàng</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}><MaterialCommunityIcons name="warehouse" size={28} color="#1976d2" /><Text style={styles.quickActionLabel}>Tồn kho</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickActionBtn}><MaterialCommunityIcons name="chart-bar" size={28} color="#1976d2" /><Text style={styles.quickActionLabel}>Báo cáo</Text></TouchableOpacity>
        </View>

        {/* Đơn hàng gần đây */}
        <Text style={styles.sectionTitle}>Đơn hàng gần đây</Text>
        <View style={styles.recentOrdersBox}>
          {mockRecentOrders.map(order => (
            <View key={order.id} style={styles.recentOrderRow}>
              <View style={styles.orderImage} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.orderId}>Đơn hàng #{order.id}</Text>
                <Text style={styles.orderCustomer}>{order.customer}</Text>
                <Text style={styles.orderTime}>{order.time}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderPrice}>{order.price.toLocaleString()}đ</Text>
                <View style={[styles.statusBox, { backgroundColor: getStatusColor(order.status) }] }>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Sản phẩm bán chạy */}
        <Text style={styles.sectionTitle}>Sản phẩm bán chạy</Text>
        <View style={styles.bestSellerRow}>
          {mockBestSellers.map(p => (
            <View key={p.id} style={styles.bestSellerBox}>
              <View style={styles.productImage} />
              <Text style={styles.productName}>{p.name}</Text>
              <Text style={styles.productPrice}>{p.price.toLocaleString()}đ</Text>
              <Text style={styles.productSold}>Đã bán {p.sold}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom nav */}
  <View style={styles.bottomNav}>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeDashboard')}>
          <MaterialCommunityIcons name="home-variant" style={styles.navIcon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation && navigation.navigate && navigation.navigate('EmployeeOrders')}>
          <MaterialCommunityIcons name="clipboard-list-outline" style={styles.navIcon} />
        </TouchableOpacity>
        <MaterialCommunityIcons name="account-group-outline" style={styles.navIcon} />
        <MaterialCommunityIcons name="warehouse" style={styles.navIcon} />
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
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
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
    justifyContent: 'space-between',
    marginHorizontal: 10,
    marginBottom: 16,
  },
  bestSellerBox: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 5,
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
