import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, ActivityIndicator, SafeAreaView, Image, TouchableOpacity, Modal, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAxios, endpoints } from '../../configs/Apis';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function InventoryScreen({ navigation }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [stockChange, setStockChange] = useState('');
  const [note, setNote] = useState('');
  const [updating, setUpdating] = useState(false);

  const fetchInventory = async (searchValue = '') => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const axios = authAxios(token);
      let url = endpoints["inventory"];
      if (searchValue) url += `?search=${encodeURIComponent(searchValue)}`;
      const res = await axios.get(url);
      setProducts(res.data.results || res.data);
    } catch (err) {
      setError('Không thể tải dữ liệu tồn kho.');
      setProducts([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInventory(search);
    setRefreshing(false);
  };

  const onSearch = (text) => {
    setSearch(text);
    fetchInventory(text);
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setStockChange('');
    setNote('');
    setModalVisible(true);
  };
  const closeEditModal = () => {
    setModalVisible(false);
    setSelectedProduct(null);
    setStockChange('');
    setNote('');
  };
  const handleUpdateStock = async () => {
    if (!stockChange || isNaN(Number(stockChange))) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng hợp lệ!');
      return;
    }
    setUpdating(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      const axios = authAxios(token);
      await axios.post(endpoints["updateStock"], {
        product_id: selectedProduct.id,
        change: Number(stockChange),
        note: note,
      });
      closeEditModal();
      fetchInventory(search);
    } catch (err) {
      Alert.alert('Lỗi', 'Không thể cập nhật tồn kho!');
    }
    setUpdating(false);
  };

  return (
    <>
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          {navigation && navigation.goBack && (
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
            </TouchableOpacity>
          )}
          <Text style={styles.headerTitle}>Quản lý tồn kho</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>
      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          value={search}
          onChangeText={onSearch}
        />
        {loading ? (
          <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : products.length === 0 ? (
          <Text style={styles.emptyText}>Không có sản phẩm nào.</Text>
        ) : (
          <FlatList
            data={products}
            keyExtractor={item => item.id?.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.itemBox}>
                {item.image ? (
                  <View style={styles.row}>
                    <Image source={{ uri: item.image }} style={styles.productImage} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.name}>{item.name}</Text>
                      <Text style={styles.info}>Mã vạch: {item.barcode || '---'}</Text>
                      <Text style={styles.info}>Tồn kho: <Text style={{color: item.stock === 0 ? 'red' : '#555'}}>{item.stock}</Text></Text>
                      <Text style={styles.info}>Đã bán: {item.sold}</Text>
                      <Text style={styles.info}>Giá: {item.price?.toLocaleString('vi-VN')}₫</Text>
                     <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                       <MaterialCommunityIcons name="pencil" size={20} color="#1976d2" />
                       <Text style={styles.editBtnText}>Nhập/Xuất kho</Text>
                     </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.info}>Mã vạch: {item.barcode || '---'}</Text>
                    <Text style={styles.info}>Tồn kho: <Text style={{color: item.stock === 0 ? 'red' : '#555'}}>{item.stock}</Text></Text>
                    <Text style={styles.info}>Đã bán: {item.sold}</Text>
                    <Text style={styles.info}>Giá: {item.price?.toLocaleString('vi-VN')}₫</Text>
                   <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                     <MaterialCommunityIcons name="pencil" size={20} color="#1976d2" />
                     <Text style={styles.editBtnText}>Nhập/Xuất kho</Text>
                   </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeEditModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập/Xuất kho: {selectedProduct?.name}</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Số lượng (+ nhập, - xuất)"
              placeholderTextColor="#888"
              keyboardType="default"
              value={stockChange}
              onChangeText={setStockChange}
              autoFocus
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Ghi chú (tuỳ chọn)"
              placeholderTextColor="#888"
              value={note}
              onChangeText={setNote}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#1976d2' }]} onPress={handleUpdateStock} disabled={updating}>
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>{updating ? 'Đang lưu...' : 'Lưu'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#ccc' }]} onPress={closeEditModal}>
                <Text style={{ color: '#333' }}>Huỷ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  itemBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  info: {
    fontSize: 14,
    color: '#555',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#e3f2fd',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  editBtnText: {
    color: '#1976d2',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '85%',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1976d2',
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
});
