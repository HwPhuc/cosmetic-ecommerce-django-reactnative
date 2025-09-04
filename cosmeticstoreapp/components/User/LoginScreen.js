import React, { useState, useContext } from 'react';
import { UserDispatchContext } from '../../configs/Contexts';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { CLIENT_ID, CLIENT_SECRET, TOKEN_URL, axiosInstance, authAxios, endpoints } from '../../configs/Apis';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secure, setSecure] = useState(true);
  const [error, setError] = useState('');
  const dispatch = useContext(UserDispatchContext);

  const handleLogin = async () => {
    setError('');
    try {
      const data = {
        grant_type: 'password',
        username: email,
        password: password,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET
      };
      const res = await axiosInstance.post(TOKEN_URL, data, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Access Token:', res.data.access_token);
      await AsyncStorage.setItem('token', res.data.access_token);
      // Gọi API lấy thông tin user
      const userRes = await authAxios(res.data.access_token).get(endpoints.currentUser);
      // Lưu username vào AsyncStorage để HomeScreen hiển thị đúng
      await AsyncStorage.setItem('username', userRes.data.username);
      // Dispatch user vào context
      dispatch({ type: 'login', payload: userRes.data });
      navigation.replace('Home');
    } catch (err) {
      if (err.response) {
        console.log('Status:', err.response.status);
        console.log('Data:', err.response.data);
        setError(err.response.data.error_description || 'Đăng nhập thất bại!');
      } else {
        setError('Lỗi kết nối hoặc cấu hình!');
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../assets/logo.png')} style={styles.avatar} />
        <Text style={styles.title}>HoangPhuc Shop</Text>
        <Text style={styles.subtitle}>Đăng nhập tài khoản</Text>
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Địa chỉ Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <Text style={styles.label}>Mật khẩu</Text>
        <View style={styles.passwordWrapper}>
          <TextInput
            style={styles.inputPassword}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={secure}
            placeholder=""
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={() => setSecure(!secure)}>
            <Text style={styles.eye}>{secure ? '👁️' : '🙈'}</Text>
          </TouchableOpacity>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Đăng nhập</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.footerText}>Bạn chưa có tài khoản?</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.register}>Đăng ký</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: 'transparent',
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 2,
  },
  subtitle: {
    color: '#1976d2',
    marginBottom: 10,
    fontSize: 16,
  },
  form: {
    width: '100%',
    marginBottom: 10,
    alignItems: 'center',
  },
  label: {
    marginTop: 10,
    marginBottom: 2,
    fontSize: 15,
    marginLeft: 0,
    alignSelf: 'flex-start',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    height: 44,
    backgroundColor: '#fff',
    width: '100%',
    minWidth: 250,
    maxWidth: 400,
  },
  passwordWrapper: {
    position: 'relative',
    width: '100%',
    justifyContent: 'center',
  },
  inputPassword: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
    height: 44,
    backgroundColor: '#fff',
    paddingRight: 40,
    width: '100%',
    minWidth: 250,
    maxWidth: 400,
  },
  eyeIcon: {
    position: 'absolute',
    right: 10,
    top: 12,
    zIndex: 1,
  },
  eye: {
    marginLeft: 10,
    fontSize: 20,
  },
  button: {
    backgroundColor: '#1976d2',
    paddingVertical: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
    minWidth: 250,
    maxWidth: 400,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 10,
    width: '100%',
  },
  footerText: {
    fontSize: 15,
  },
  register: {
    color: '#e91e63',
    marginLeft: 5,
    fontSize: 15,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});
