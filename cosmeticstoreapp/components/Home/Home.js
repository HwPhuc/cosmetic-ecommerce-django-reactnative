import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image, ActivityIndicator, FlatList } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';
import { useFocusEffect } from '@react-navigation/native';
  

export default function HomeScreen(props) {
  const { navigation } = props;
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);

  const fetchAllPages = async (token, endpoint, params = "") => {
    let url = endpoint + params;
    let allResults = [];
    while (url) {
      const res = await authAxios(token).get(url);
      const data = res.data;
      const results = data.results || data;
      allResults = allResults.concat(results);
      url = data.next ? data.next : null;
    }
    return allResults;
  };
  const fetchFeaturedProducts = async (token) => {
    try {
      const allProducts = await fetchAllPages(token, endpoints["products"], "?sold_gte=100");
      setProducts(allProducts);
    } catch (err) {
      console.error("Lỗi khi load sản phẩm nổi bật:", err);
    }
  };
  const fetchCategories = async (token) => {
    try {
      const allCategories = await fetchAllPages(token, endpoints["categories"]);
      setCategories(allCategories);
    } catch (err) {
      console.error("Lỗi khi load danh mục:", err);
    }
  };
  const fetchAll = async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) {
      setLoading(false);
      throw new Error('Chưa đăng nhập hoặc chưa có token');
    }
    await Promise.all([
      fetchFeaturedProducts(token),
      fetchCategories(token)
    ]);
    setLoading(false);
  };
  // Hàm lấy số lượng sản phẩm trong giỏ hàng
  const fetchCartQuantity = async () => {
    const token = await AsyncStorage.getItem('access_token');
    if (!token) return setCartQuantity(0);
    try {
      const axios = authAxios(token);
      const res = await axios.get('/carts/');
      const cartData = Array.isArray(res.data.results) ? res.data.results[0] : res.data;
      setCartQuantity(cartData?.total_quantity || 0);
    } catch {
      setCartQuantity(0);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchCartQuantity();
    }, [])
  );

  useEffect(() => {
    fetchAll();
  }, []);

  // Hàm làm mới khi kéo xuống
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.headerLogo}>HOANGPHUC SHOP</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={{ position: 'relative' }}>
          <MaterialCommunityIcons name="cart-outline" size={28} color="#1976d2" />
          {cartQuantity > 0 && (
            <View style={{
              position: 'absolute',
              top: -6,
              right: -6,
              backgroundColor: '#d32f2f',
              borderRadius: 10,
              minWidth: 18,
              height: 18,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 4,
            }}>
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: 'bold' }}>{cartQuantity}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      {/* Search */}
      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search"
        />
      </View>
      {loading ? (
        <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={item => item.id?.toString()}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.featuredBox} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
              {item.image ? (
                <Image source={{ uri: item.image }} style={styles.featuredImage} resizeMode="cover" />
              ) : (
                <View style={styles.featuredImage} />
              )}
              <Text style={styles.featuredName}>{item.name}</Text>
              <Text style={styles.featuredDesc} numberOfLines={1} ellipsizeMode="tail">{item.description || ''}</Text>
              <Text style={styles.featuredPrice}>{item.price ? `${item.price.toLocaleString()}đ` : ''}</Text>
              <Text style={{fontSize:12, color:'#888'}}>Đã bán: {item.sold || 0}</Text>
            </TouchableOpacity>
          )}
          showsVerticalScrollIndicator={true}
          ListHeaderComponent={
            <>
              {/* Ưu đãi đặc biệt */}
              <View style={styles.specialOffer}>
                <Text style={styles.specialTitle}>Ưu đãi đặc biệt</Text>
                <Text style={styles.specialDesc}>Giảm giá 30% cho tất cả sản phẩm</Text>
              </View>
              {/* Danh mục */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Danh mục</Text>
                <TouchableOpacity><Text style={styles.sectionLink}>Xem tất cả</Text></TouchableOpacity>
              </View>
              <View style={styles.categoryRow}>
                {categories.map((cat, idx) => (
                  <View key={cat.id || cat.name || idx} style={styles.categoryItem}>
                    {cat.image ? (
                      <Image source={{ uri: cat.image }} style={styles.categoryImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.categoryImage} />
                    )}
                    <Text style={styles.categoryText}>{cat.name}</Text>
                  </View>
                ))}
              </View>
              {/* Sản phẩm nổi bật */}
              <View style={styles.sectionRow}>
                <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
                <TouchableOpacity><Text style={styles.sectionLink}>Xem tất cả</Text></TouchableOpacity>
              </View>
            </>
          }
          style={styles.featuredList}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
      )}
      {/* Bottom navigation */}
      <View style={styles.bottomNav}>
        <MaterialCommunityIcons name="home-variant" style={styles.navIcon} />
        <MaterialCommunityIcons name="chat-outline" style={styles.navIcon} />
        <MaterialCommunityIcons name="apps" style={styles.navIcon} />
        <MaterialCommunityIcons name="bell-outline" style={styles.navIcon} />
        <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
          <MaterialCommunityIcons name="account-circle-outline" style={styles.navIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  featuredList: {
    width: '100%',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 40,
    paddingHorizontal: 0,
    position: 'relative',
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  headerLogo: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  headerCart: {
    fontSize: 22,
    color: '#1976d2',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#222',
    borderRadius: 5,
    width: '90%',
    height: 40,
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#222',
  },
  specialOffer: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    marginBottom: 18,
  },
  specialTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  specialDesc: {
    fontSize: 16,
    color: '#888',
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
    marginBottom: 8,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
  },
  sectionLink: {
    color: '#1976d2',
    fontSize: 15,
    fontWeight: 'bold',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    alignSelf: 'center',
  },
  categoryItem: {
    alignItems: 'center',
    flex: 1,
  },
  categoryImage: {
    width: 50,
    height: 50,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    marginBottom: 4,
  },
  categoryText: {
    fontSize: 13,
    color: '#222',
  },
  featuredBox: {
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    padding: 12,
    margin: 8,
    alignItems: 'flex-start',
    flex: 1,
    minWidth: 0,
    maxWidth: '48%',
    alignSelf: 'stretch',
  },
  featuredImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#e0e7ff',
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  featuredName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  featuredDesc: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  featuredPrice: {
    fontSize: 15,
    color: '#1976d2',
    fontWeight: 'bold',
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
});
