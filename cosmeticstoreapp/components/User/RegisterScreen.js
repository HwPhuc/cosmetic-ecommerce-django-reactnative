import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Checkbox } from 'react-native-paper';
import { axiosInstance, endpoints } from '../../configs/Apis';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!agree) {
      setError('Bạn phải đồng ý với điều khoản sử dụng và dịch vụ!');
      return;
    }
    if (!name || !email || !phone || !password || !confirmPassword) {
      setError('Vui lòng điền đầy đủ thông tin!');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp!');
      return;
    }
    setError('');
    try {
      const data = {
        username: name,
        email: email,
        password: password,
        phone: phone,
      };
      const res = await axiosInstance.post(endpoints.register, data, {
        headers: { 'Content-Type': 'application/json' }
      });
      // Đăng ký thành công, chuyển về Login
      navigation.replace('Login');
    } catch (err) {
      if (err.response && err.response.data) {
        // Hiển thị lỗi từ backend
        const errors = err.response.data;
        let msg = '';
        if (typeof errors === 'string') msg = errors;
        else if (typeof errors === 'object') {
          msg = Object.values(errors).map(e => Array.isArray(e) ? e.join(', ') : e).join('\n');
        }
        setError(msg || 'Đăng ký thất bại!');
      } else {
        setError('Lỗi kết nối hoặc cấu hình!');
      }
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={{ position: 'absolute', top: 40, left: 20, zIndex: 10 }}>
        <Text style={{ fontSize: 28, color: '#1976d2' }}>{'←'}</Text>
      </TouchableOpacity>
      <View style={styles.header}>
        <Text style={styles.title}>Đăng Ký</Text>
        <Image source={require('../../assets/logo.png')} style={styles.avatar} />
      </View>
      <View style={styles.form}>
        <Text style={styles.label}>Tên người dùng</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} />
        <Text style={styles.label}>Email</Text>
        <TextInput style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
        <Text style={styles.label}>Số điện thoại</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <Text style={styles.label}>Mật khẩu</Text>
        <TextInput style={styles.input} value={password} onChangeText={setPassword} secureTextEntry />
        <Text style={styles.label}>Xác nhận mật khẩu</Text>
        <TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
        <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
          <TouchableOpacity onPress={() => setAgree(!agree)} style={{ marginRight: 8 }}>
            <View style={{
              width: 20,
              height: 20,
              borderWidth: 2,
              borderColor: '#1976d2',
              borderRadius: 4,
              backgroundColor: '#fff',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {agree ? (
                <View style={{ width: 12, height: 12, backgroundColor: '#1976d2', borderRadius: 2 }} />
              ) : null}
            </View>
          </TouchableOpacity>
          <Text style={{ fontSize: 15, color: '#1976d2' }}>
            Tôi đồng ý với <Text style={{ textDecorationLine: 'underline' }}>Điều khoản sử dụng và dịch vụ</Text>
          </Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>Đăng ký</Text>
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
    marginBottom: 10,
    textAlign: 'center',
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
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  }
});
