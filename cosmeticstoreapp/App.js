import React, { useReducer } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './components/User/Login';
import HomeScreen from './components/Home/Home';
import ProductDetailScreen from './components/Home/ProductDetail';
import CategoryProductsScreen from './components/Home/CategoryProducts';
import CartScreen from './components/Home/Cart';
import RegisterScreen from './components/User/Register';
import ProfileScreen from './components/User/Profile';
import EditProfileScreen from './components/User/EditProfile';
import AllProductsScreen from './components/Home/AllProducts';
import AllCategoriesScreen from './components/Home/AllCategories';
import UserReducer from './reducers/UserReducer';
import { UserContext, UserDispatchContext } from './configs/Contexts';

const Stack = createStackNavigator();

export default function App() {
  const [user, dispatch] = useReducer(UserReducer, null);
  return (
    <UserContext.Provider value={user}>
      <UserDispatchContext.Provider value={dispatch}>
        <NavigationContainer>
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
          </Stack.Navigator>
        </NavigationContainer>
      </UserDispatchContext.Provider>
    </UserContext.Provider>
  );
}
