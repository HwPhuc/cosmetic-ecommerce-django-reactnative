import React, { useEffect, useState, useContext, useRef } from 'react';
import { Alert, Dimensions } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, FlatList, SafeAreaView, RefreshControl } from 'react-native';
import { endpoints, authAxios } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserContext } from '../../configs/Contexts';

// Hàm format ngày giờ cho review
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getFullYear()} ${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
};

// Hàm format giá tiền
const formatCurrency = (value) => {
  if (!value) return '';
  return Number(value).toLocaleString('vi-VN', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 });
};

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
  const [currentImageIdx, setCurrentImageIdx] = useState(0);
  const flatListRef = useRef(null);
  const screenWidth = Dimensions.get('window').width;
  const [addingToCart, setAddingToCart] = useState(false);
  const [addCartMsg, setAddCartMsg] = useState("");

  const handleAddToCart = async () => {
    if (!token) {
      Alert.alert("Bạn cần đăng nhập để thêm vào giỏ hàng.");
      return;
    }
    setAddingToCart(true);
    try {
      const axios = authAxios(token);
      await axios.post("/cart-items/", {
        product: product.id,
        quantity: 1
      });
      Alert.alert("Đã thêm vào giỏ hàng!");
    } catch (err) {
      Alert.alert("Lỗi khi thêm vào giỏ hàng!");
    }
    setAddingToCart(false);
  };

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
    // Lấy sản phẩm liên quan (cùng category hoặc cùng brand, loại trừ sản phẩm hiện tại, loại trùng, lấy đủ các trang nếu có phân trang)
    const fetchAllPages = async (url, axios) => {
      let results = [];
      let nextUrl = url;
      while (nextUrl) {
        const res = await axios.get(nextUrl);
        if (Array.isArray(res.data.results)) {
          results = results.concat(res.data.results);
        }
        nextUrl = res.data.next;
        // Nếu next là full URL, chuyển về relative cho axios
        if (nextUrl && nextUrl.startsWith('http')) {
          const urlObj = new URL(nextUrl);
          nextUrl = urlObj.pathname + urlObj.search;
        }
      }
      return results;
    };
    const fetchRelatedProducts = async () => {
      let related = [];
      try {
        // Sản phẩm cùng danh mục
        if (product.category && product.category.id) {
          const catUrl = `${endpoints.products}?category=${product.category.id}`;
          const catProducts = await fetchAllPages(catUrl, axios);
          related = related.concat(catProducts);
        }
        // Sản phẩm cùng thương hiệu
        if (product.brand && product.brand.id) {
          const brandUrl = `${endpoints.products}?brand=${product.brand.id}`;
          const brandProducts = await fetchAllPages(brandUrl, axios);
          related = related.concat(brandProducts);
        }
        // Lọc lại: chỉ giữ sản phẩm cùng danh mục hoặc cùng thương hiệu
        const filtered = related.filter(p => {
          if (p.id === product.id) return false;
          const sameCategory = p.category && product.category && p.category.id === product.category.id;
          const sameBrand = p.brand && product.brand && p.brand.id === product.brand.id;
          return sameCategory || sameBrand;
        });
        // Loại trùng
        const unique = {};
        const uniqueFiltered = filtered.filter(p => {
          if (unique[p.id]) return false;
          unique[p.id] = true;
          return true;
        });
        setRelatedProducts(uniqueFiltered.slice(0, 10)); // Giới hạn 10 sản phẩm liên quan
      } catch {
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
    <>
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Images - chỉ hiển thị 1 ảnh lớn, kéo ngang để xem các ảnh phụ */}
        <View style={styles.imageSection}>
          <FlatList
            ref={flatListRef}
            horizontal
            pagingEnabled
            data={[{ image: product.image }, ...(product.images ? product.images.filter(imgObj => imgObj.image && imgObj.image !== product.image) : [])]}
            keyExtractor={(imgObj, idx) => imgObj.id?.toString() || `main-${idx}`}
            renderItem={({ item }) => (
              <Image source={{ uri: item.image }} style={{ width: screenWidth, height: 260, resizeMode: 'contain', backgroundColor: 'transparent' }} />
            )}
            showsHorizontalScrollIndicator={false}
            style={{ width: screenWidth, height: 260 }}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
              setCurrentImageIdx(idx);
            }}
          />
          {/* Chỉ số ảnh */}
          <View style={styles.imageIndexWrapper}>
            <Text style={styles.imageIndexText}>{currentImageIdx + 1}/{1 + (product.images ? product.images.filter(imgObj => imgObj.image && imgObj.image !== product.image).length : 0)}</Text>
          </View>
        </View>
        {/* Product Info */}
        <Text style={styles.productName}>{product.name}</Text>
        <View style={styles.ratingRow}>
          <Text>⭐⭐⭐⭐⭐ ({reviewCount} đánh giá)</Text>
        </View>
        <Text>Thương hiệu: {typeof product.brand === 'string' ? product.brand : (product.brand?.name || 'Đang cập nhật')}</Text>
        <Text>Danh mục: {typeof product.category === 'string' ? product.category : (product.category?.name || 'Đang cập nhật')}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatCurrency(product.price)}</Text>
          {product.old_price && (
            <Text style={styles.oldPrice}>{formatCurrency(product.old_price)}</Text>
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
        {reviews && reviews.length > 0 ? (
          <>
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
                  <Text style={styles.reviewTime}>{formatDate(r.created_at || r.time)}</Text>
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
          </>
        ) : (
          <Text style={{ color: '#888', marginBottom: 8 }}>Không có đánh giá</Text>
        )}
        {/* Related Products */}
        <Text style={styles.sectionTitle}>Sản phẩm liên quan</Text>
        {relatedProducts && relatedProducts.length > 0 ? (
          <FlatList
            horizontal
            data={relatedProducts}
            keyExtractor={item => item.id?.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.relatedProduct}
                onPress={() => navigation.push('ProductDetail', { product: item })}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.relatedImage} />
                ) : (
                  <View style={styles.relatedImage} />
                )}
                <Text numberOfLines={2} style={{ fontWeight: 'bold', fontSize: 13 }}>{item.name}</Text>
                <Text style={styles.price}>{formatCurrency(item.price)}</Text>
                {item.old_price && <Text style={styles.oldPrice}>{formatCurrency(item.old_price)}</Text>}
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        ) : (
          <Text style={{ color: '#888', marginBottom: 8 }}>Không có sản phẩm liên quan</Text>
        )}
        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.cartBtn} onPress={handleAddToCart} disabled={addingToCart}>
            <Text>Thêm vào giỏ</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.buyBtn}>
            <Text style={{ color: '#fff' }}>Mua ngay</Text>
          </TouchableOpacity>
        </View>
  {/* Không hiển thị thông báo chữ, đã dùng alert */}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#fff', padding: 16 },
  headerSafe: { backgroundColor: '#2196f3' },
  header: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2196f3', paddingHorizontal: 16, paddingBottom: 12, justifyContent: 'space-between', marginBottom: 8,},
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  imageSection: { alignItems: 'center', marginBottom: 12 },
  carouselList: { width: '100%', height: 260 },
  carouselImage: { width: '100%', height: 260, resizeMode: 'contain', backgroundColor: '#eee' },
  imageIndexWrapper: { position: 'absolute', left: 16, bottom: 12, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  imageIndexText: { color: '#fff', fontSize: 14 },
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
  actionRow: { flexDirection: 'row', gap: 12, marginVertical: 16, marginBottom: 60 },
  cartBtn: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 12, alignItems: 'center' },
  buyBtn: { flex: 1, backgroundColor: 'red', borderRadius: 6, padding: 12, alignItems: 'center' },
});