import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';

export default function MyVouchersScreen({ navigation }) {

  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [next, setNext] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchVouchers = async (reset = false, pageNum = 1) => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError('Bạn chưa đăng nhập.');
        setLoading(false);
        return;
      }
      const res = await authAxios(token).get(`/user-vouchers/?page_size=10&page=${pageNum}`);
      if (res.data && res.data.results) {
        if (reset) {
          setVouchers(res.data.results);
        } else {
          setVouchers(prev => [...prev, ...res.data.results]);
        }
        setNext(res.data.next);
      } else if (Array.isArray(res.data)) {
        setVouchers(res.data);
        setNext(null);
      } else {
        setVouchers([]);
        setNext(null);
      }
      setError('');
    } catch (err) {
      setError('Không thể tải voucher.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchVouchers(true, 1);
    setPage(1);
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVouchers(true, 1);
    setPage(1);
    setRefreshing(false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !next) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    await fetchVouchers(false, nextPage);
    setPage(nextPage);
  };

  const renderVoucher = ({ item }) => (
    <View style={styles.voucherBox}>
      <MaterialCommunityIcons name="ticket-percent" size={32} color="#d32f2f" style={{marginRight:12}} />
      <View style={{flex:1}}>
        <Text style={styles.code}>{item.discount_code?.code || 'Giảm %'}</Text>
        <Text style={styles.percent}>Giảm {item.discount_code?.discount_percentage || ''}%</Text>
        <Text style={styles.date}>HSD: {(item.expired_at || item.discount_code?.valid_to)?.substring(0,10)}</Text>
        {(() => {
          const now = new Date();
          const expiredAt = item.expired_at ? new Date(item.expired_at) : (item.discount_code?.valid_to ? new Date(item.discount_code.valid_to) : null);
          if (item.used) {
            return <Text style={styles.inactive}>Đã sử dụng</Text>;
          } else if (expiredAt && expiredAt < now) {
            return <Text style={styles.inactive}>Đã hết hạn</Text>;
          } else if (item.discount_code?.is_active === false) {
            return <Text style={styles.inactive}>Đã hết hạn</Text>;
          } else {
            return <Text style={styles.active}>Đang hoạt động</Text>;
          }
        })()}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Voucher của tôi</Text>
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
          data={vouchers}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderVoucher}
          refreshing={refreshing}
          onRefresh={onRefresh}
          contentContainerStyle={{padding:16}}
          ListEmptyComponent={<Text style={{textAlign:'center', marginTop:32}}>Không có voucher nào.</Text>}
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
  voucherBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e3f2fd',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#fafafa',
  },
  code: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 2,
  },
  percent: {
    fontSize: 15,
    color: '#d32f2f',
    marginBottom: 2,
  },
  date: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  active: {
    fontSize: 13,
    color: '#43a047',
    fontWeight: 'bold',
  },
  inactive: {
    fontSize: 13,
    color: '#f44336',
    fontWeight: 'bold',
  },
});
