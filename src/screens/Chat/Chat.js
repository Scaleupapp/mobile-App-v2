import React, {useEffect, useState} from 'react';
import {StyleSheet, SafeAreaView, StatusBar, View} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import io from 'socket.io-client';
import axiosInstance from '../../services/axiosinstance';
import {FlatList} from 'react-native';
import {TextInput} from 'react-native';
import Button from '../../components/Button';
import {getconversation} from '../../services/apiService';

const Chat = ({navigation, route}) => {
  //     const [messages, setMessages] = useState([]);
  //   const [message, setMessage] = useState('');
  const socket = io('https://api.scaleupapp.club'); // Replace with your server URL

  useEffect(() => {
    // Connect to the server
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    // Listen for incoming messages
    socket.on('message', newMessage => {
      setMessages(prevMessages => [...prevMessages, newMessage]);
    });

    // Cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, []);

  //   const fetchMessages = async (conversationId) => {
  //     const { data } = await API.get(`/chat/${conversationId}`);
  //     setMessages(data);
  //   };

  //   const sendMessage = async () => {
  //     if (!newMessage.trim()) return;
  //     const { data } = await API.post("/chat/send", {
  //       conversationId: currentConversation._id,
  //       message: newMessage,
  //     });
  //     socket.emit("sendMessage", data);
  //     setMessages((prev) => [...prev, data]);
  //     setNewMessage("");
  //   };
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (currentConversation) fetchMessages(currentConversation._id);

    socket.on('receiveMessage', message => {
      if (message.conversationId === currentConversation._id) {
        setMessages(prev => [...prev, message]);
      }
    });
  }, [currentConversation]);

  const fetchConversations = async () => {
    const res = await getconversation();
    console.log('🚀 ~ fetchConversations ~ data:', res);
    // setConversations(data);
  };

  const fetchMessages = async conversationId => {
    const {data} = await axiosInstance.get(`/chat/${conversationId}`);
    setMessages(data);
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const {data} = await axiosInstance.post('/chat/send', {
      conversationId: currentConversation._id,
      message: newMessage,
    });
    socket.emit('sendMessage', data);
    setMessages(prev => [...prev, data]);
    setNewMessage('');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header
        title="My Screen"
        // backIcon={icons.backArrow} // Provide your back arrow icon
        // rightIcon={icons.menu} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <FlatList
            data={messages}
            keyExtractor={(item, index) => index.toString()}
            renderItem={({item}) => <Text>{item}</Text>}
          />
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message"
            style={{
              borderWidth: 1,
              borderColor: 'gray',
              padding: 10,
              marginBottom: 10,
            }}
          />
          <Button onPress={sendMessage} />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(16),
    paddingTop: nh(30),
  },
});
