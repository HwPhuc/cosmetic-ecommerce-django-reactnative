import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios } from '../../configs/Apis';

export default function FavoriteProductsScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchFavorites = async () => {
    setLoading(true);
    setError('');
    try {
      const token = await AsyncStorage.getItem('access_token');
      if (!token) {
        setError('Bạn chưa đăng nhập.');
        setLoading(false);
        return;
      }
      const res = await authAxios(token).get('/favorite-products/');
      setFavorites(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setError('Không thể tải danh sách yêu thích.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchFavorites);
    return unsubscribe;
  }, [navigation]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  };

  // Hàm format giá tiền
  const formatCurrency = (value) => {
    if (!value) return '';
    return Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.productCard} onPress={() => navigation.navigate('ProductDetail', { product: item.product })}>
      {item.product?.image ? (
        <Image source={{ uri: item.product.image }} style={styles.productImage} />
      ) : (
        <View style={styles.productImage} />
      )}
      <Text style={styles.productName}>{item.product?.name || 'Không có tên'}</Text>
      <Text style={styles.productPrice}>{item.product?.price ? formatCurrency(item.product.price) : ''}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sản phẩm yêu thích</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="close" size={28} color="transparent" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" />
      ) : error ? (
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 20 }}>{error}</Text>
      ) : favorites.length === 0 ? (
        <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>Bạn chưa có sản phẩm yêu thích nào.</Text>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={item => item.id?.toString()}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 0 },
  headerBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1976d2', paddingHorizontal: 16, paddingBottom: 12, justifyContent: 'space-between', marginBottom: 8, paddingTop: 44 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  productCard: { flex: 1, margin: 8, backgroundColor: '#f9f9f9', borderRadius: 8, padding: 12, alignItems: 'center', elevation: 2 },
  productImage: { width: 100, height: 80, backgroundColor: '#eee', borderRadius: 6, marginBottom: 8 },
  productName: { fontWeight: 'bold', fontSize: 14, marginBottom: 4, textAlign: 'center' },
  productPrice: { color: 'red', fontWeight: 'bold', fontSize: 13 },
});
