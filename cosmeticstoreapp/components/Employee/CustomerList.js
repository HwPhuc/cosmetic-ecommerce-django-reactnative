import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../configs/firebaseConfig';
import { UserContext } from '../../configs/Contexts';


export default function CustomerList({ navigation }) {
  const user = useContext(UserContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lấy danh sách khách hàng từ Firestore (collection 'users' với role 'customer')
    const fetchCustomers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const list = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.role === 'customer') {
            list.push({ id: doc.id, ...data });
          }
        });
        setCustomers(list);
      } catch (err) {
        setCustomers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#1976d2" style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView style={styles.headerSafe}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chọn khách hàng để chat</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>
      <FlatList
        data={customers}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.item}
            onPress={() => {
              const params = {
                userId: item.id,
                userName: item.username || item.name,
                staffId: user?.id,
                staffName: user?.username,
              };
              navigation.navigate('Chat', params);
            }}
          >
            <MaterialCommunityIcons name="account-circle" size={32} color="#1976d2" style={{ marginRight: 12 }} />
            <Text style={styles.name}>{item.username || item.name}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>Không có khách hàng nào</Text>}
        contentContainerStyle={{ paddingTop: 8 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff', 
    paddingHorizontal: 0 
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
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    marginHorizontal: 12,
  },
  name: { 
    fontSize: 16, 
    color: '#1976d2', 
    fontWeight: '500' 
  },
});
