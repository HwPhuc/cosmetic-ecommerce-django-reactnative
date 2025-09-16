import React, { useReducer } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './components/User/Login';
import EmployeeDashboard from './components/Employee/Dashboard';
import EmployeeOrders from './components/Employee/OrderManagement';
import EditAddressScreen from './components/User/EditAddress';
import MyOrdersScreen from './components/User/MyOrders';
import HomeScreen from './components/Home/Home';
import ProductDetailScreen from './components/Home/ProductDetail';
import CategoryProductsScreen from './components/Home/CategoryProducts';
import CartScreen from './components/Home/Cart';
import RegisterScreen from './components/User/Register';
import ProfileScreen from './components/User/Profile';
import EditProfileScreen from './components/User/EditProfile';
import FavoriteProductsScreen from './components/User/FavoriteProducts';
import AllProductsScreen from './components/Home/AllProducts';
import AllCategoriesScreen from './components/Home/AllCategories';
import AddressManagerScreen from './components/User/AddressManager';
import OrderDetailScreen from './components/User/OrderDetail';
import MyVouchersScreen from './components/User/MyVouchers';
import AddAddressScreen from './components/User/AddAddress';
import UserReducer from './reducers/UserReducer';
import { UserContext, UserDispatchContext } from './configs/Contexts';

const Stack = createStackNavigator();

export default function App() {
  const [user, dispatch] = useReducer(UserReducer, null);
  return (
    <UserContext.Provider value={user}>
      <UserDispatchContext.Provider value={dispatch}>
        <NavigationContainer>
          {user && user.role === 'staff' ? (
            <Stack.Navigator initialRouteName="EmployeeHome" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="EmployeeHome" component={EmployeeDashboard} />
              <Stack.Screen name="EmployeeOrders" component={EmployeeOrders} />
            </Stack.Navigator>
          ) : (
            <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="Login" component={LoginScreen} />
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
              <Stack.Screen name="CategoryProducts" component={CategoryProductsScreen} />
              <Stack.Screen name="Cart" component={CartScreen} />
              <Stack.Screen name="Register" component={RegisterScreen} />
              <Stack.Screen name="Profile" component={ProfileScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="AllCategories" component={AllCategoriesScreen} />
              <Stack.Screen name="AllProducts" component={AllProductsScreen} />
              <Stack.Screen name="AddressManager" component={AddressManagerScreen} />
              <Stack.Screen name="AddAddress" component={AddAddressScreen} />
              <Stack.Screen name="EditAddress" component={EditAddressScreen} />
              <Stack.Screen name="MyOrders" component={MyOrdersScreen} />
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
              <Stack.Screen name="MyVouchers" component={MyVouchersScreen} />
              <Stack.Screen name="FavoriteProducts" component={FavoriteProductsScreen} />
            </Stack.Navigator>
          )}
        </NavigationContainer>
      </UserDispatchContext.Provider>
    </UserContext.Provider>
  );
}
