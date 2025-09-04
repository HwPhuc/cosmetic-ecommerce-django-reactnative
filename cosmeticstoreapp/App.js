import React, { useReducer } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './components/User/LoginScreen';
import HomeScreen from './components/Home/HomeScreen';
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
          </Stack.Navigator>
        </NavigationContainer>
      </UserDispatchContext.Provider>
    </UserContext.Provider>
  );
}
