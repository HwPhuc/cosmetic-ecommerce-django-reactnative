import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, SafeAreaView, TouchableOpacity, Dimensions, RefreshControl } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { endpoints, authAxios } from '../../configs/Apis';
import { useContext } from 'react';
import { UserContext } from '../../configs/Contexts';


export default function EmployeeReports({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const user = useContext(UserContext);
  const token = user?.access_token;

  const fetchReport = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await authAxios(token).get(endpoints.reportSummary);
      setReport(res.data);
    } catch (err) {
      setReport(null);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [token]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReport(false);
    setRefreshing(false);
  };

  if (loading) {
    return (
      <>
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.header}>
            {navigation && navigation.goBack && (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Báo cáo tổng hợp</Text>
            <View style={{ width: 28 }} />
          </View>
        </SafeAreaView>
        <View style={styles.container}><ActivityIndicator size="large" color="#1976d2" /></View>
      </>
    );
  }

  if (!report) {
    return (
      <>
        <SafeAreaView style={styles.headerSafe}>
          <View style={styles.header}>
            {navigation && navigation.goBack && (
              <TouchableOpacity onPress={() => navigation.goBack()}>
                <MaterialCommunityIcons name="arrow-left" size={28} color="#fff" />
              </TouchableOpacity>
            )}
            <Text style={styles.headerTitle}>Báo cáo tổng hợp</Text>
            <View style={{ width: 28 }} />
          </View>
        </SafeAreaView>
        <View style={styles.container}><Text>Không thể tải báo cáo.</Text></View>
      </>
    );
  }

  // Chuẩn bị dữ liệu cho biểu đồ top sản phẩm bán chạy
  const chartData = {
    labels: report.top_products.map((item, idx) => `${idx+1}`),
    datasets: [
      {
        data: report.top_products.map(item => item.sold),
      },
    ],
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
          <Text style={styles.headerTitle}>Báo cáo tổng hợp</Text>
          <View style={{ width: 28 }} />
        </View>
      </SafeAreaView>
      <ScrollView
        contentContainerStyle={styles.container}
        scrollIndicatorInsets={{ right: 1 }}
        showsVerticalScrollIndicator={true}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#2196f3"]} />
        }
      >
        <View style={styles.card}>
          <Text style={styles.label}>Tổng doanh thu:</Text>
          <Text style={styles.value}>{report.total_revenue.toLocaleString('vi-VN')} đ</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Tổng số đơn hàng:</Text>
          <Text style={styles.value}>{report.total_orders}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Tổng tồn kho:</Text>
          <Text style={styles.value}>{report.total_stock}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Tổng nhập kho:</Text>
          <Text style={styles.value}>{report.total_import}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Tổng xuất kho:</Text>
          <Text style={styles.value}>{report.total_export}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Top 5 sản phẩm bán chạy:</Text>
          {report.top_products.length === 0 ? (
            <Text style={styles.value}>Không có dữ liệu</Text>
          ) : (
            <>
              <BarChart
                data={chartData}
                width={Dimensions.get('window').width - 48}
                height={220}
                yAxisLabel=""
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(52, 73, 94, ${opacity})`,
                  style: { borderRadius: 8 },
                  propsForDots: { r: '6', strokeWidth: '2', stroke: '#1976d2' },
                }}
                style={{ marginVertical: 8, borderRadius: 8, alignSelf: 'center' }}
                fromZero
                showValuesOnTopOfBars
              />
              {report.top_products.map((item, idx) => (
                <Text key={item.id} style={styles.value}>{idx+1}. {item.name} (Đã bán: {item.sold}, Tồn: {item.stock})</Text>
              ))}
            </>
          )}
        </View>
      </ScrollView>
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
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  card: {
    width: '100%',
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
});
