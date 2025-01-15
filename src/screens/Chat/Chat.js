import React, {useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import io from 'socket.io-client';
import axiosInstance from '../../services/axiosinstance';
import {FlatList} from 'react-native';
import {TextInput} from 'react-native';
import Button from '../../components/Button';
import {
  deleteChatMessage,
  editChatMessage,
  getconversation,
  getconversationbyID,
  sendChat,
} from '../../services/apiService';
import {useSelector} from 'react-redux';
import Text from '../../components/Text';
import {images} from '../../assets/images';
import {Image} from 'react-native';
import {MenuModal} from '../../components/MenuModal';
import {icons} from '../../assets/icons';
import {
  checkDate,
  checkIfTenMinutesPassed,
  formatAMPM,
  groupMessagesByDate,
} from '../../helper/commonFunctions';
import {useToast} from '../../components/CustomToast';

const Chat = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);
  const [selected, setSelected] = useState();
  const [visible, setVisible] = useState(false);
  const [edit, setEdit] = useState(false);
  const textInputRef = useRef(null);
  const [isEditable, setIsEditable] = useState(false);
  const {showToast} = useToast();
  //   const socket = io('https://api.scaleupapp.club'); // Replace with your server URL

  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to the Socket.IO server when the component mounts
    const socketInstance = io('https://api.scaleupapp.club'); // Replace with your server URL
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('joinRoom');
      socketInstance.emit('joinRoom', route?.params?.chatId);
    });

    socketInstance.on('receiveMessage', data => {
      console.log('🚀 ~ useEffect receiveMessage ~ data:', data);
      if (data.conversationId === route?.params?.chatId) {
        // console.log('INSIDE');
        setMessages(prevMessages => [...prevMessages, data]);
      }
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      if (socketInstance) {
        console.log('leaveRoom');
        socketInstance.emit('leaveRoom', route?.params?.chatId); // Ensure to leave the room on cleanup
        socketInstance.disconnect();
      }
    };
  }, [route?.params?.chatId]); // Ensure that the effect runs when the conversationId changes

  useEffect(() => {
    fetchMessages();
  }, []);

  useEffect(() => {
    if (flatListRef.current) {
      flatListRef.current.scrollToEnd({animated: true});
    }
  }, [messages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        flatListRef.current?.scrollToEnd({animated: true});
      },
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const fetchMessages = async () => {
    const {data} = await getconversationbyID(route?.params?.chatId);
    console.log('🚀 ~ Chat ~ data:', data);
    setMessages(data?.messages);
  };

  const sendMessage = async () => {
    // if (!newMessage.trim()) return;
    if (input.trim()) {
      const payload = {
        conversationId: route?.params?.chatId,
        message: input,
      };
      //   console.log('🚀 ~ sendMessage ~ payload:', payload);
      let conversationId = route?.params?.chatId;
      const {data} = await sendChat(payload);

      //   setMessages(prevMessages => [...prevMessages, data]);
      if (socket) {
        socket.emit('sendMessage', {
          conversationId,
          data,
        });
      }
      setInput('');
    }
  };

  const editMessage = async () => {
    if (input.trim()) {
      const payload = {
        content: input,
      };
      try {
        const {data} = await editChatMessage(
          selected?.conversationId,
          selected?._id,
          payload,
        );
        const updatedData = {
          _id: selected?._id,
          message: input,
          edited: true,
        };
        console.log('🚀 ~ editMessage ~ updatedData:', updatedData);

        const updatedMessages = messages.map(
          msg =>
            msg._id === updatedData._id
              ? {...msg, ...updatedData} // Update the matching object
              : msg, // Keep others unchanged
        );
        console.log('🚀 ~ editMessage ~ updatedMessages:', updatedMessages);

        setInput('');
        setMessages(updatedMessages);
        setEdit(false);
        setSelected(null);
        console.log('🚀 ~ editMessage ~ data:', data);
      } catch (error) {
        console.log('🚀 ~ editMessage ~ error:', error?.response?.data);
      }
    }
  };

  const deleteMessage = async () => {
    try {
      const {data} = await deleteChatMessage(
        selected?.conversationId,
        selected?._id,
      );

      const updatedData = {
        _id: selected?._id,
        deleted: true,
      };

      const updatedMessages = messages.map(
        msg =>
          msg._id === updatedData._id
            ? {...msg, ...updatedData} // Update the matching object
            : msg, // Keep others unchanged
      );
      setMessages(updatedMessages);
      setVisible(false);
      setSelected(null);
      showToast({type: 'success', title: data?.message});
    } catch (error) {
      console.log('🚀 ~ editMessage ~ error:', error?.response?.data);
    }
  };

  const onEditClick = () => {
    setEdit(true);
    setInput(selected?.message);
    setVisible(false);
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  const menuItems = [
    ...(isEditable
      ? [
          {
            name: 'Edit Message',
            image: icons.editsolid,
            onPress: () => onEditClick(), // Edit action
          },
        ]
      : []),
    ...(isEditable
      ? [
          {
            name: 'Delete Message',
            image: icons.delete,
            onPress: () => deleteMessage(), // Delete action (this should be onDeleteClick, not onEditClick)
          },
        ]
      : []),
  ];
  const formatGroupedMessages = () => {
    let groupedMessages = groupMessagesByDate(messages);
    // console.log(
    //   '🚀 ~ formatGroupedMessages ~ groupedMessages:',
    //   groupedMessages,
    // );
    return groupedMessages.flatMap(group => [
      {type: 'header', date: group.date},
      ...group.messages.map(msg => ({...msg, type: 'message'})),
    ]);
  };

  const renderMessage = ({item}) => {
    if (item.type === 'header') {
      return (
        <View style={styles.headerContainer}>
          <View style={styles.lineContainer}>
            <View style={styles.line} />
            <Text
              style={styles.headerText}
              variant="semibold14"
              color={COLORS.blue043142}>
              {checkDate(item.date)}
            </Text>
            <View style={styles.line} />
          </View>
        </View>
      );
    }
    if (item.type === 'message' && !item.deleted) {
      return (
        <View
          style={[
            {flexDirection: 'row'},
            item?.sender?._id === userData?.id || item?.sender == userData?.id
              ? styles.sent
              : styles.received,
          ]}>
          {item?.sender?._id === userData?.id ? null : (
            <Image
              source={{uri: item.sender?.profilePicture}}
              style={{
                height: nh(50),
                width: nh(50),
                borderWidth: 1,
                borderRadius: nh(25),
                borderColor: COLORS.blue043142,
              }}
            />
          )}
          <View style={{marginLeft: nw(10)}}>
            <Text
              style={[
                styles.messageText,
                {
                  alignSelf:
                    item?.sender?._id === userData?.id
                      ? 'flex-end'
                      : 'flex-start',
                  marginBottom: 11,
                },
              ]}>
              {item?.sender?._id === userData?.id
                ? 'You'
                : item.sender?.username}
            </Text>
            <TouchableOpacity
              onLongPress={() => {
                if (!checkIfTenMinutesPassed(item?.createdAt)) {
                  setIsEditable(true);
                }

                if (item?.sender?._id == userData?.id && isEditable) {
                  setSelected(item);
                }
              }}
              style={[
                styles.messageContainer,
                item?.sender?._id === userData?.id ||
                item?.sender == userData?.id
                  ? styles.sent
                  : styles.received,
                item?._id == selected?._id && {
                  backgroundColor: COLORS.blue043142 + 60,
                },
                item?.edited && {
                  paddingBottom: 18,
                },
              ]}>
              <View>
                <Text style={styles.messageText} variant="medium14">
                  {item.message}
                </Text>
                <Text
                  style={{
                    fontSize: 10,
                    alignSelf: 'flex-end',
                    color: COLORS.grey777777,
                  }}>
                  {formatAMPM(item?.updatedAt)}
                </Text>
                {item?.edited && (
                  <Text
                    style={{
                      position: 'absolute',
                      bottom: -15,
                      right: -5,
                      fontSize: 10,
                      backgroundColor: COLORS.whiteFFFFFF,
                      paddingHorizontal: nh(3),
                      borderRadius: 5,
                      color: COLORS.yellowF5BE00,
                    }}>
                    {'edited'}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          </View>
          {item?.sender?._id === userData?.id ? (
            <Image
              source={{uri: userData?.profilePicture}}
              style={{
                height: nh(50),
                width: nh(50),
                borderWidth: 1,
                borderRadius: nh(25),
                borderColor: COLORS.blue043142,
                marginLeft: 10,
              }}
            />
          ) : null}
        </View>
      );
    }
  };

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        setInput('');
        setSelected('');
      }}>
      <SafeAreaView style={styles.container}>
        {/* StatusBar */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardAvoidingView}>
          <StatusBar
            barStyle="dark-content"
            backgroundColor={COLORS.yellowF5BE00}
          />
          <Header
            title="My Screen"
            // backIcon={icons.backArrow} // Provide your back arrow icon
            rightIcon={selected ? true : false} // Provide your right icon
            // onBackPress={handleBackPress}
            onRightIconPress={() => setVisible(true)}
          />
          <View style={styles.layer1}>
            <View style={styles.layer2}>
              <View style={styles.container1}>
                <FlatList
                  ref={flatListRef}
                  data={formatGroupedMessages()}
                  renderItem={renderMessage}
                  keyExtractor={item => item.id || item?.date}
                  //   contentContainerStyle={styles.messagesList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  extraData={messages}
                />
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type a message..."
                    value={input}
                    onChangeText={setInput}
                    //   onSubmitEditing={sendMessage}
                    //   returnKeyType="send"
                    ref={textInputRef}
                  />
                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={selected?._id ? editMessage : sendMessage}>
                    <Text style={styles.sendButtonText}>
                      {selected?._id && edit ? 'Edit' : 'Send'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          <MenuModal
            visible={visible}
            setVisible={setVisible}
            menuItems={menuItems}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
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
  keyboardAvoidingView: {
    flex: 1,
  },
  container1: {
    flex: 1,
    // backgroundColor: '#f5f5f5',
  },
  messagesList: {
    // padding: 10,
    paddingBottom: nh(30),
  },
  messageContainer: {
    maxWidth: DEVICE_WIDTH - nw(100),
    padding: 10,
    borderRadius: 10,
    marginVertical: 5,
    backgroundColor: 'rgba(51, 51, 51, 0.08)',
  },
  sent: {
    alignSelf: 'flex-end',
    // backgroundColor: 'rgba(51, 51, 51, 0.08)',
  },
  received: {
    alignSelf: 'flex-start',
    // backgroundColor: 'rgba(51, 51, 51, 0.08)',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  textInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    paddingHorizontal: 10,
    marginRight: 10,
  },
  sendButton: {
    backgroundColor: COLORS.blue043142,
    borderRadius: 20,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  headerContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  lineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: '#ccc',
  },
  headerText: {
    marginHorizontal: 10,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#555',
  },
});
