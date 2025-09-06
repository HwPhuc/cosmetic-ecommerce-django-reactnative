import React, { useEffect, useState, useContext } from 'react';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, RefreshControl } from 'react-native';
import { endpoints, authAxios } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../configs/Contexts';

export default function ProductDetailScreen({ route, navigation }) {
  const { product } = route.params;
  const user = useContext(UserContext);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [nextReviewPage, setNextReviewPage] = useState(null);
  const [reviewCount, setReviewCount] = useState(0);
  const [token, setToken] = useState(user?.access_token || null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Nếu chưa có token từ context, lấy từ AsyncStorage
    if (!token) {
      AsyncStorage.getItem('access_token').then(storedToken => {
        if (storedToken) setToken(storedToken);
      });
    }
  }, [user]);

  const fetchData = async () => {
    if (!token) return;
    const axios = authAxios(token);
    // Lấy sản phẩm liên quan (cùng category, loại trừ sản phẩm hiện tại)
    const fetchRelatedProducts = async () => {
      if (product.category && product.category.id) {
        try {
          const res = await axios.get(`${endpoints.products}?category=${product.category.id}`);
          const filtered = Array.isArray(res.data.results) ? res.data.results.filter(p => p.id !== product.id) : [];
          setRelatedProducts(filtered);
        } catch {
          setRelatedProducts([]);
        }
      } else {
        setRelatedProducts([]);
      }
    };
    // Lấy đánh giá theo product_id
    const fetchReviews = async () => {
      try {
        const res = await axios.get(`/reviews/?product=${product.id}&page_size=3`);
        setReviews(Array.isArray(res.data.results) ? res.data.results : []);
        setNextReviewPage(res.data.next);
        setReviewCount(res.data.count || 0);
      } catch {
        setReviews([]);
        setNextReviewPage(null);
        setReviewCount(0);
      }
    };
    await fetchRelatedProducts();
    await fetchReviews();
  };

  useEffect(() => {
    fetchData();
  }, [product.id, product.category, token]);

  const onRefresh = async () => {
  setRefreshing(true);
  setShowAllReviews(false);
  await fetchData();
  setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.headerSafe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Images */}
        <View style={styles.imageSection}>
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.mainImage} />
          ) : (
            <View style={styles.mainImage} />
          )}
          {product.images && product.images.length > 0 && (
            <View style={styles.imageList}>
              {product.images.map((img, idx) => (
                <Image key={idx} source={{ uri: img }} style={styles.subImage} />
              ))}
            </View>
          )}
        </View>
        {/* Product Info */}
        <Text style={styles.productName}>{product.name}</Text>
        <View style={styles.ratingRow}>
          <Text>⭐⭐⭐⭐⭐ ({reviewCount} đánh giá)</Text>
        </View>
        <Text>Thương hiệu: {typeof product.brand === 'string' ? product.brand : (product.brand?.name || 'Đang cập nhật')}</Text>
        <Text>Danh mục: {typeof product.category === 'string' ? product.category : (product.category?.name || 'Đang cập nhật')}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{product.price ? `${product.price.toLocaleString()}đ` : ''}</Text>
          {product.old_price && (
            <Text style={styles.oldPrice}>{`${product.old_price.toLocaleString()}đ`}</Text>
          )}
        </View>
        <Text style={styles.freeShip}>Miễn phí vận chuyển cho đơn hàng trên 500.000đ</Text>
        {/* Description */}
        <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
        <Text style={styles.description}>{typeof product.description === 'string' ? product.description : ''}</Text>
        {/* Detail Info */}
        <Text style={styles.sectionTitle}>Thông tin chi tiết</Text>
        <Text>Dung tích: {product.capacity || 'Đang cập nhật'}   Xuất xứ: {product.origin || 'Đang cập nhật'}</Text>
        <Text>Thành phần: {product.ingredients || 'Đang cập nhật'}</Text>
        <Text>Phù hợp: {product.skin_type || 'Đang cập nhật'}</Text>
        {/* Reviews */}
        <Text style={styles.sectionTitle}>Đánh giá ({reviewCount})</Text>
        {(showAllReviews ? reviews : reviews.slice(0, 3)).map(r => (
          <View key={r.id} style={styles.reviewRow}>
            {r.user?.image ? (
              <Image source={{ uri: r.user.image }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar} />
            )}
            <View style={{ flex: 1 }}>
              <Text>{r.user?.username || r.user || r.username} <Text style={{ color: 'red' }}>{r.rating}⭐</Text></Text>
              <Text>{r.comment}</Text>
              <Text style={styles.reviewTime}>{r.time || r.created_at}</Text>
            </View>
          </View>
        ))}
        {nextReviewPage && !showAllReviews && (
          <TouchableOpacity
            onPress={async () => {
              try {
                let nextUrl = nextReviewPage;
                if (nextUrl.startsWith('http')) {
                  const urlObj = new URL(nextUrl);
                  nextUrl = urlObj.pathname + urlObj.search;
                }
                const res = await authAxios(token).get(nextUrl);
                setReviews(prev => [...prev, ...(Array.isArray(res.data.results) ? res.data.results : [])]);
                setNextReviewPage(res.data.next);
                if (!res.data.next) setShowAllReviews(true);
              } catch (err) {
                console.log('Lỗi khi lấy thêm review:', err);
              }
            }}
            style={{ alignSelf: 'center', marginVertical: 8 }}
          >
            <Text style={{ color: '#1976d2' }}>Xem thêm đánh giá</Text>
          </TouchableOpacity>
        )}
        {showAllReviews && (
          <TouchableOpacity
            onPress={() => {
              setShowAllReviews(false);
              fetchData(); // reset lại về 3 review đầu tiên
            }}
            style={{ alignSelf: 'center', marginVertical: 8 }}
          >
            <Text style={{ color: '#1976d2' }}>Ẩn bớt đánh giá</Text>
          </TouchableOpacity>
        )}
        {/* Related Products */}
        <Text style={styles.sectionTitle}>Sản phẩm liên quan</Text>
        <FlatList
          horizontal
          data={relatedProducts}
          keyExtractor={item => item.id?.toString()}
          renderItem={({ item }) => (
            <View style={styles.relatedProduct}>
              <View style={styles.relatedImage} />
              <Text>{item.name}</Text>
              <Text style={styles.price}>{item.price ? `${item.price.toLocaleString()}đ` : ''}</Text>
              {item.old_price && <Text style={styles.oldPrice}>{`${item.old_price.toLocaleString()}đ`}</Text>}
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />
        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cartBtn}>
            <Text>Thêm vào giỏ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyBtn}>
            <Text style={{ color: '#fff' }}>Mua ngay</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 16 },
  headerSafe: { backgroundColor: '#2196f3' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2196f3', paddingHorizontal: 16, paddingBottom: 12, justifyContent: 'space-between', marginBottom: 8,},
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  imageSection: { alignItems: 'center', marginBottom: 12 },
  mainImage: { width: 160, height: 160, backgroundColor: '#eee', marginBottom: 8 },
  imageList: { flexDirection: 'row', gap: 8 },
  subImage: { width: 60, height: 60, backgroundColor: '#eee' },
  productName: { fontSize: 16, fontWeight: 'bold', marginVertical: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  price: { color: 'red', fontWeight: 'bold', fontSize: 16 },
  oldPrice: { color: '#aaa', textDecorationLine: 'line-through', fontSize: 14 },
  freeShip: { color: 'green', marginBottom: 8 },
  sectionTitle: { fontWeight: 'bold', marginTop: 16, marginBottom: 4 },
  description: { marginBottom: 8 },
  reviewRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  avatar: { width: 40, height: 40, backgroundColor: '#eee', borderRadius: 20 },
  reviewTime: { color: '#aaa', fontSize: 12 },
  relatedProduct: { width: 120, marginRight: 12 },
  relatedImage: { width: 120, height: 80, backgroundColor: '#eee', marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 12, marginVertical: 16 },
  cartBtn: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, alignItems: 'center' },
  buyBtn: { flex: 1, backgroundColor: 'red', borderRadius: 6, padding: 12, alignItems: 'center' },
});