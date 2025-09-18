import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, TextInput, TouchableOpacity, FlatList, Text, StyleSheet, Image, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { db } from '../../configs/firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, setDoc, getDoc } from 'firebase/firestore';

const CHATROOMS_COLLECTION = 'chatRooms';

export default function Chat({ route, navigation }) {
  // Nhận params: userId, userName (khách), staffId, staffName (nhân viên). Nếu khách không truyền staffId/staffName sẽ tự động gán mặc định.
  const { userId, userName, staffId, staffName } = route.params || {};
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  const flatListRef = useRef();
  // Nếu thiếu thông tin khách (userId, userName) thì báo lỗi, không cho vào chat
  if (!userId || !userName) {
    return (
      <View style={styles.container}>
        <Text style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>Không có thông tin người dùng. Vui lòng đăng nhập lại.</Text>
      </View>
    );
  }

  // Nếu thiếu staffId/staffName (tức là phía khách), tự động gán mặc định: staffId = 4, staffName = 'staff1'
  const STAFF_ID = staffId || 4;
  const STAFF_USERNAME = staffName || 'staff1';
  const chatRoomId = `${userId}_${STAFF_ID}`;

  useEffect(() => {
    // Tạo phòng chat nếu chưa có (1 phòng duy nhất giữa mỗi khách và 1 nhân viên)
    const chatRoomRef = doc(db, CHATROOMS_COLLECTION, chatRoomId);
    getDoc(chatRoomRef).then((docSnap) => {
      if (!docSnap.exists()) {
        setDoc(chatRoomRef, {
          customerId: userId,
          customerName: userName,
          staffId: STAFF_ID,
          staffName: STAFF_USERNAME,
          createdAt: serverTimestamp(),
        });
      }
    });
    // Lắng nghe realtime các tin nhắn trong subcollection 'messages' của phòng chat này
    const messagesCol = collection(db, CHATROOMS_COLLECTION, chatRoomId, 'messages');
    const q = query(messagesCol, orderBy('createdAt', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      );
    });
    return unsubscribe;
  }, [userId, userName]);

  // Xác định vai trò gửi: nếu có staffId (tức là nhân viên đang chat), ngược lại là khách
  const isStaff = !!staffId;
  // Hàm gửi tin nhắn: nếu là nhân viên thì lưu role: 'staff', nếu là khách thì role: 'customer'
  const sendMessage = useCallback(async () => {
    if (input.trim() === '') return;
    const messagesCol = collection(db, CHATROOMS_COLLECTION, chatRoomId, 'messages');
    if (isStaff) {
      await addDoc(messagesCol, {
        text: input,
        createdAt: serverTimestamp(),
        userId: STAFF_ID,
        userName: STAFF_USERNAME,
        staffName: STAFF_USERNAME,
        role: 'staff',
      });
    } else {
      await addDoc(messagesCol, {
        text: input,
        createdAt: serverTimestamp(),
        userId,
        userName,
        role: 'customer',
      });
    }
    setInput('');
  }, [input, userId, userName, chatRoomId, isStaff, STAFF_ID, STAFF_USERNAME, staffId, staffName]);

  // Hàm render từng tin nhắn:
  // - Nếu là tin nhắn sản phẩm (có item.product) thì hiển thị thêm box sản phẩm
  // - isMe: xác định tin nhắn là của mình (user hiện tại) để căn phải, còn lại căn trái
  // - isStaff: xác định tin nhắn là của nhân viên để đổi màu nền và gắn nhãn "Nhân viên"
  // - displayName: nếu là staff thì ưu tiên staffName, còn lại userName
  const renderMessage = ({ item }) => {
    const isStaff = item.userId === STAFF_ID || item.userName === STAFF_USERNAME || item.role === 'staff';
    // Nếu là nhân viên đang chat, isMe = item.userId === STAFF_ID; nếu là khách, isMe = item.userId === userId
    const isMe = staffId ? item.userId === STAFF_ID : item.userId === userId;
    const displayName = item.role === 'staff' ? (item.staffName || item.userName) : item.userName;
    if (item.product) {
      return (
        <View style={isMe ? styles.myMessage : isStaff ? styles.staffMessage : styles.otherMessage}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.userName}>{displayName}</Text>
            {isStaff && <Text style={styles.staffLabel}>  Nhân viên</Text>}
          </View>
          <Text style={styles.text}>{item.text}</Text>
          <View style={styles.productBox}>
            {item.product.image && (
              <Image source={{ uri: item.product.image }} style={styles.productImage} />
            )}
            <Text style={styles.productName}>{item.product.name}</Text>
            {item.product.desc && <Text style={styles.productDesc}>{item.product.desc}</Text>}
          </View>
          <Text style={styles.time}>{item.createdAt && item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
        </View>
      );
    }
    // Tin nhắn thường
    return (
      <View style={isMe ? styles.myMessage : isStaff ? styles.staffMessage : styles.otherMessage}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.userName}>{displayName}</Text>
          {isStaff && <Text style={styles.staffLabel}>  Nhân viên</Text>}
        </View>
        <Text style={styles.text}>{item.text}</Text>
        <Text style={styles.time}>{item.createdAt && item.createdAt.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialCommunityIcons name="chevron-left" size={28} color="#222" />
          </TouchableOpacity>
          <Image source={require('../../assets/staff.png')} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>Nhân viên hỗ trợ</Text>
            <Text style={styles.headerStatus}>Đang hoạt động</Text>
          </View>
        </View>
      </SafeAreaView>
 
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#888', marginTop: 20 }}>Chưa có tin nhắn nào</Text>}
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 10, paddingHorizontal: 12 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      {/* Input */}
      <SafeAreaView style={styles.safeArea}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Nhập tin nhắn"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <MaterialCommunityIcons name="send" size={26} color="#1976d2" />
        </TouchableOpacity>
      </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f9f9f9' 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    marginBottom: 2
  },
  backBtn: { 
    marginRight: 8 
  },
  avatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginRight: 10, 
    backgroundColor: '#eee'
  },
  headerName: { 
    fontWeight: 'bold', 
    fontSize: 16, 
    color: '#222'
  },
  headerStatus: {
    color: '#4caf50', 
    fontSize: 13, 
    marginTop: 2 
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#e6f7d9',
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    marginLeft: 40,
    maxWidth: '80%',
    borderBottomRightRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    marginRight: 40,
    maxWidth: '80%',
    borderBottomLeftRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  userName: { 
    fontWeight: 'bold', 
    fontSize: 12, 
    marginBottom: 2, 
    color: '#1976d2' 
  },
  text: { 
    fontSize: 15, 
    color: '#222', 
    marginBottom: 2 
  },
  time: { 
    fontSize: 11, 
    color: '#888', 
    alignSelf: 'flex-end', 
    marginTop: 2 
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#eee',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
    fontSize: 15,
    marginRight: 8,
  },
  sendBtn: {
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 4,
  },
  productBox: {
    backgroundColor: '#f6f6f6',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
    marginBottom: 2,
    alignItems: 'flex-start',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#eee',
    marginBottom: 6,
  },
  productName: { 
    fontWeight: 'bold', 
    fontSize: 14, 
    color: '#1976d2' 
  },
  productDesc: { 
    fontSize: 13, 
    color: '#444', 
    marginTop: 2 
  },
  staffMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#e3f0ff',
    padding: 10,
    borderRadius: 10,
    marginVertical: 4,
    marginRight: 40,
    maxWidth: '80%',
    borderBottomLeftRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
  },
  staffLabel: {
    backgroundColor: '#1976d2',
    color: '#fff',
    fontSize: 11,
    borderRadius: 6,
    paddingHorizontal: 6,
    marginLeft: 4,
    overflow: 'hidden',
  },
   safeArea: {
    backgroundColor: '#fff',
  },
});