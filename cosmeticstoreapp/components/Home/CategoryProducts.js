import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';

// Định dạng giá tiền
const formatCurrency = (value) => {
  if (!value) return '';
  return Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 });
};

export default function CategoryProductsScreen({ route, navigation }) {
  const { category } = route.params;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllProducts = async () => {
    try {
      const token = await AsyncStorage.getItem('access_token');
      const axios = authAxios(token);
      let url = endpoints["products"] + `?category=${category.id}`;
      let allProducts = [];
      while (url) {
        const res = await axios.get(url);
        const data = res.data;
        const results = data.results || data;
        allProducts = allProducts.concat(results);
        url = data.next;
      }
      setProducts(allProducts);
    } catch (err) {
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAllProducts();
  }, [category]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllProducts();
    setRefreshing(false);
  };

  return (
    <>
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sản phẩm theo danh mục</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>
      <View style={styles.container}>
        <View style={styles.categoryHeader}><Text style={styles.categoryName}>{category.name}</Text></View>
        {loading ? (
          <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
        ) : products.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>Không có sản phẩm nào trong danh mục này.</Text>
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={item => item.id?.toString()}
            numColumns={2}
            contentContainerStyle={[styles.listContent, { paddingHorizontal: 6 }]}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.productBox} onPress={() => navigation.navigate('ProductDetail', { product: item })}>
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="cover" />
                ) : (
                  <View style={styles.productImage} />
                )}
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>{item.price ? formatCurrency(item.price) : ''}</Text>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
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
  categoryHeader: {
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 16,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1976d2',
    marginTop: 2,
    marginBottom: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  productBox: {
    flex: 1,
    margin: 6,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  productImage: {
    width: 110,
    height: 110,
    borderRadius: 10,
    backgroundColor: '#eee',
    marginBottom: 8,
  },
  productName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
    color: '#333',
  },
  productPrice: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
  },
});
