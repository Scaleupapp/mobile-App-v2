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
  ActivityIndicator,
  Pressable,
  Platform,
  FlatList,
  TextInput,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import io from 'socket.io-client';
import {
  deleteGroupMsg,
  editGroupMsg,
  getStudyGroupMsg,
  markReadGrpMsg,
  reactGroupMsg,
} from '../../services/apiService';
import {useDispatch, useSelector} from 'react-redux';
import Text from '../../components/Text';
import {Image} from 'react-native';
import {icons} from '../../assets/icons';
import {
  checkDate,
  compressImage,
  compressVideo,
  formatAMPM,
  groupMessagesByDate,
} from '../../helper/commonFunctions';
import {useToast} from '../../components/CustomToast';
import Icon from '../../helper/icon';
import {launchImageLibrary} from 'react-native-image-picker';
import Video from 'react-native-video';
import ImageModal from '../Post/ImageModal';
import MediaModal from './ImageSendModal';
import MessageModal from './MessageactionsModal';
import Routes from '../../helper/routes';
import moment from 'moment';
import {actions} from '../../redux/reducers';

const GroupChat = ({navigation, route}) => {
  const {groupId, data} = route?.params;
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef(null);

  const [selected, setSelected] = useState();
  const [visible, setVisible] = useState(false);
  const [edit, setEdit] = useState(false);
  const textInputRef = useRef(null);
  const [isread, setIsread] = useState(false);
  const {showToast} = useToast();
  const imageModalRef = useRef(null);
  const [modalvisible, setModalVisible] = useState(false);
  const [itemclicked, setItemcliked] = useState({});
  const [file, setFile] = useState([]);
  const [loadingsmall, setLoadingsmal] = useState(false);
  const [reply, setReply] = useState(false);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state
  const [allMessagesFetched, setAllMessagesFetched] = useState(false); // Indicates if all messages are loaded
  const page = useRef(1); //
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const [mentionList, setMentionList] = useState([]); // List of users to show
  const [showMentions, setShowMentions] = useState(false);

  useEffect(() => {
    // Connect to the Socket.IO server when the component mounts
    const socketInstance = io('http://192.168.84.240:3000/api/', {
      // Your server URL
      auth: {
        token: userData?.token, // If you have authentication
      },
    }); // Replace with your server URL
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('group opened ', groupId);
      socketInstance.emit('joinGroup', groupId);
    });

    socketInstance.on('receiveMessage', data => {
      console.log('receiveMessage ', data);
      data = {...data, createdAt: moment()};

      // if (data.conversationId === groupId) {
      // markasRead(data?._id);
      setMessages(prevMessages => [...prevMessages, data]);
      // }
    });
    socketInstance.on('messageEdited', data => {
      const updatedData = {
        _id: data?.messageId,
        message: data?.content,
        edited: true,
      };

      const updatedMessages = messages.map(
        msg =>
          msg._id === updatedData._id
            ? {...msg, ...updatedData} // Update the matching object
            : msg, // Keep others unchanged
      );
      setMessages(updatedMessages);
      // will recieive messageId and content
    });

    socketInstance.on('messageDeleted', data => {
      const updatedData = {
        _id: data?.messageId,
        deleted: true,
      };

      const updatedMessages = messages.map(
        msg =>
          msg._id === updatedData._id
            ? {...msg, ...updatedData} // Update the matching object
            : msg, // Keep others unchanged
      );
      setMessages(updatedMessages);
      // will recieive messageId and content
    });

    socketInstance.on('reactionAdded', data => {
      const updatedMessages = messages.map(
        msg =>
          msg._id === data?.messageId
            ? {
                ...msg,
                ...{reactions: [...msg.reactions, ...[{emoji: data?.emoji}]]},
              } // Update the matching object
            : msg, // Keep others unchanged
      );
      setMessages(updatedMessages);
      // will recieive messageId and content
    });

    // Clean up the socket connection when the component unmounts
    return () => {
      if (socketInstance) {
        console.log('leaveRoom');
        socketInstance.emit('leaveRoom', groupId); // Ensure to leave the room on cleanup
        socketInstance.disconnect();
      }
    };
  }, [groupId, messages]); // Ensure that the effect runs when the conversationId changes
  useEffect(() => {
    dispatch(actions.setGroupData(data));
    loadMoreMessages();
  }, []);

  useEffect(() => {
    if (messages?.length > 0 && !userHasScrolled) {
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({animated: true});
        }
      }, 200);
    }
  }, [messages, flatListRef.current, userHasScrolled]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setUserHasScrolled(false);
        flatListRef.current?.scrollToEnd({animated: true});
      },
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const sendMessage = async () => {
    if (input.trim() || file?.fileName) {
      setLoadingsmal(true);
      const myHeaders = new Headers();
      myHeaders.append('Authorization', `Bearer ${userData?.token}`);

      const formdata = new FormData();
      formdata.append('groupId', groupId);
      formdata.append('message', input);
      if (file.length > 0) {
        file.forEach(f => {
          formdata.append('attachments', {
            uri: f.uri,
            name: f.fileName,
            type: f.type,
          });
        });
      }

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: formdata,
        redirect: 'follow',
      };

      fetch('http://192.168.84.240:3000/api/chat/group/send', requestOptions)
        .then(response => response.text())
        .then(data => {
          console.log('🚀 ~ sendMessage ~ data:', data);
          if (socket) {
            socket.emit('sendMessage', {
              groupId,
              message: data?.newMessage,
              sender: data?.newMessage?.sender,
            });
          }
        })
        .catch(error => console.error(error))
        .finally(() => {
          setUserHasScrolled(false);
          setIsread(true);
          setLoadingsmal(false);
          setModalVisible(false);
          setInput('');
          setFile({});
        });
    }
  };

  const editMessage = async () => {
    setLoadingsmal(true);
    if (input.trim()) {
      const payload = {
        content: input,
      };
      try {
        const {data} = await editGroupMsg(groupId, selected?._id, payload);
        const updatedData = {
          _id: selected?._id,
          content: input,
          edited: true,
        };
        // console.log('🚀 ~ editMessage ~ updatedData:', updatedData);

        const updatedMessages = messages.map(
          msg =>
            msg._id === updatedData._id
              ? {...msg, ...updatedData} // Update the matching object
              : msg, // Keep others unchanged
        );
        // console.log('🚀 ~ editMessage ~ updatedMessages:', updatedMessages);

        setInput('');
        setMessages(updatedMessages);
        setLoadingsmal(false);
        setEdit(false);

        setSelected(null);
        // console.log('🚀 ~ editMessage ~ data:', data);
      } catch (error) {
        console.log('🚀 ~ editMessage ~ error:', error?.response?.data);
      }
    }
  };

  const reactMessage = async emojis => {
    // console.log('🚀 ~ Chat ~ emoji:', emojis);
    const payload = {
      emoji: emojis,
    };
    // console.log('🚀 ~ Chat ~ payload:', payload);
    try {
      const {data} = await reactGroupMsg(groupId, selected?._id, payload);

      const updatedData = {
        _id: selected?._id,
        reactions: data?.reactions,
      };
      // console.log('🚀 ~ editMessage ~ updatedData:', updatedData);

      const updatedMessages = messages.map(
        msg =>
          msg._id === updatedData._id
            ? {...msg, ...updatedData} // Update the matching object
            : msg, // Keep others unchanged
      );
      // console.log('🚀 ~ editMessage ~ updatedMessages:', updatedMessages);

      setMessages(updatedMessages);
      setVisible(false);
      setSelected(null);
      // console.log('🚀 ~ editMessage ~ data:', JSON.stringify(data));
    } catch (error) {
      console.log('🚀 ~ editMessage ~ error:', error?.response?.data);
    }
  };

  const deleteMessage = async () => {
    try {
      const {data} = await deleteGroupMsg(groupId, selected?._id);
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
    } catch (error) {
      console.log('🚀 ~ deleteMessage ~ error:', error?.response?.data);
    }
  };

  const onEditClick = () => {
    setEdit(true);
    setInput(selected?.message || selected?.content);
    setVisible(false);
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };

  const onReplyClick = () => {
    setReply(true);
    setVisible(false);
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };
  const replyMessage = async () => {
    if (input.trim() || file?.fileName) {
      setLoadingsmal(true);
      const myHeaders = new Headers();
      myHeaders.append('Authorization', `Bearer ${userData?.token}`);

      const formdata = new FormData();
      formdata.append('groupId', groupId);
      formdata.append('message', input);
      if (file.length > 0) {
        file.forEach(f => {
          formdata.append('attachments', {
            uri: f.uri,
            name: f.fileName,
            type: f.type,
          });
        });
      }
      formdata.append('parentMessageId', selected?._id);

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: formdata,
        redirect: 'follow',
      };

      fetch('http://192.168.84.240:3000/api/chat/group/reply', requestOptions)
        .then(response => response.text())
        .then(data => {
          console.log('🚀 ~ replyMessage ~ data:', data);
          if (socket) {
            socket.emit('sendMessage', {
              groupId,
              message: data?.newMessage,
              sender: data?.newMessage?.sender,
            });
          }
        })
        .catch(error => console.error(error))
        .finally(() => {
          setUserHasScrolled(false);
          setReply(false);
          setSelected();
          setIsread(true);
          setLoadingsmal(false);
          setModalVisible(false);
          setInput('');
          setFile({});
        });
    }
  };
  const openGallery = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed', // Allows both image & video
        selectionLimit: 4,
      });

      if (result.assets && result.assets.length > 0) {
        await handleMultipleFileSelection(result.assets);
      }
    } catch (err) {
      console.error('Error selecting file:', err);
      showToast({
        title: 'Failed to select files',
        type: 'error',
      });
    }
  };

  const handleMultipleFileSelection = async assets => {
    try {
      const processedFiles = await Promise.all(
        assets.map(async asset => {
          if (asset.type && asset.type.toLowerCase().includes('gif')) {
            return {...asset};
          } else if (asset.type && asset.type.toLowerCase().includes('video')) {
            let compress_video = await compressVideo(asset?.uri);
            return {...asset, uri: compress_video};
          } else {
            let compress_image = await compressImage(asset?.uri);
            return {...asset, uri: compress_image};
          }
        }),
      );

      setFile(processedFiles); // Assuming you have a state like setFiles([])

      setTimeout(() => {
        setModalVisible(true);
      }, 500);
    } catch (error) {
      console.error('Error processing files:', error);
      showToast({
        title: 'Failed to process files',
        type: 'error',
      });
    }
  };

  const formatGroupedMessages = id => {
    // console.log(messages);
    let groupedMessages = groupMessagesByDate(messages);

    // return groupedMessages.flatMap(group => [
    //   {type: 'header', date: group.date},
    //   ...group.messages.map(msg => ({...msg, type: 'message'})),
    // ]);
    let unreadInserted = false;
    return groupedMessages.flatMap(group => {
      let section = [{type: 'header', date: group.date}];

      const messageSection = group.messages.flatMap(msg => {
        const isUnread = !msg.readAt && msg.sender?._id !== userData?.id; // Ensure message is unread & not sent by me

        if (isUnread && !unreadInserted) {
          unreadInserted = true;
          return [
            {type: 'unreadHeader', text: 'Unread Messages'},
            {...msg, type: 'message'},
          ];
        }

        return {...msg, type: 'message'};
      });

      return [...section, ...messageSection];
    });
  };

  const markasRead = async id => {
    try {
      let res = await markReadGrpMsg({
        messageId: id,
      });
      console.log('🚀 ~ markasRead ~ res:', res?.data);
    } catch (error) {
      console.log('🚀 ~ markasRead ~ error:', error);
    }
  };

  const fetchMessages = async page => {
    const {data} = await getStudyGroupMsg(groupId, page);
    return data?.messages;
  };
  const loadMoreMessages = async () => {
    if (loading || allMessagesFetched) return;

    setLoading(true);
    const newMessages = await fetchMessages(page.current);
    // console.log('🚀 ~ loadMoreMessages ~ newMessages:', newMessages);
    setLoading(false);
    if (page.current == 1) {
      const lastUnreadMessage = newMessages.reduce((lastUnread, msg) => {
        if (msg?.sender?._id !== userData?.id && !msg?.readAt) {
          return msg; // Keep updating with the latest unread message
        }
        return lastUnread;
      }, null);
      console.log({lastUnreadMessage});
      if (lastUnreadMessage) {
        markasRead(lastUnreadMessage?._id);
      }
    }
    if (newMessages.length === 0) {
      setAllMessagesFetched(true);
    } else {
      setMessages(prevMessages => [...newMessages, ...prevMessages]);
      page.current += 1;
    }
  };

  // Handle when the user scrolls to the top
  const handleScroll = event => {
    if (!userHasScrolled) {
      setUserHasScrolled(true); // Set the flag when user manually scrolls
    }
    const {contentOffset} = event.nativeEvent;
    if (contentOffset.y <= 0) {
      loadMoreMessages();
    }
  };

  const renderMessage = ({item}) => {
    // console.log('🚀 ~ renderMessage ~ item:', item);
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
    if (item.type === 'unreadHeader' && !isread) {
      return (
        <View style={styles.headerContainer}>
          <View style={styles.lineContainer}>
            <View style={styles.line} />
            <Text
              style={{marginHorizontal: 10}}
              variant="semibold12"
              color={COLORS.black333333}>
              Unread Messages
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
          {item?.sender?._id === userData?.id ? null : item.sender
              ?.profilePicture ? (
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
          ) : (
            <View
              style={{
                height: nh(50),
                width: nh(50),
                borderWidth: 1,
                borderRadius: nh(25),
                borderColor: COLORS.blue043142,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: COLORS.greyD6D6D6,
              }}>
              <Text variant="semibold16" color={COLORS.black333333}>
                {item.sender?.username?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
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
                // if (item?.sender?._id == userData?.id && isEditable) {
                setSelected(item);
                setVisible(true);
                // }
              }}
              style={[
                styles.messageContainer,
                item?.sender?._id === userData?.id ||
                item?.sender == userData?.id
                  ? styles.sent
                  : styles.received,
                // item?._id == selected?._id && {
                //   backgroundColor: COLORS.blue043142 + 60,
                // },
                item?.edited && {
                  paddingBottom: 18,
                },
              ]}>
              {item?.parentMessageId && (
                <View
                  style={{
                    backgroundColor: COLORS.whiteFFFFFF,
                    borderRadius: 8,
                    paddingHorizontal: 5,
                    borderLeftWidth: 2,
                    borderLeftColor: COLORS.yellowF5BE00,
                    paddingVertical: 5,
                    marginBottom: 3,
                  }}>
                  <Text variant="medium12" color={COLORS.yellowF5BE00}>
                    {item?.parentMessageId?.sender?._id == userData?.id
                      ? 'You'
                      : item?.parentMessageId?.sender?.username}
                  </Text>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                    {item?.parentMessageId?.content &&
                      !item?.parentMessageId?.attachments && (
                        <Text
                          variant="medium12"
                          color={COLORS.black333333}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {item?.parentMessageId?.content}
                        </Text>
                      )}

                    {item?.parentMessageId?.attachments?.length > 0 &&
                      (item?.parentMessageId?.attachments[0]?.mediaType ==
                        'Image' ||
                        item?.parentMessageId?.attachments[0]?.mediaType?.includes(
                          'image',
                        )) && (
                        <Pressable>
                          <Image
                            source={{
                              uri: item?.parentMessageId?.attachments[0]
                                ?.mediaUrl,
                            }}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 10,
                            }}
                            resizeMode="cover"
                          />
                        </Pressable>
                      )}

                    {item?.parentMessageId?.attachments?.length > 0 &&
                      item?.parentMessageId?.attachments[0]?.mediaType?.includes(
                        'video',
                      ) && (
                        <Pressable>
                          <Video
                            source={{
                              uri: item?.parentMessageId?.attachments[0]
                                ?.mediaUrl,
                            }}
                            style={{
                              width: 30,
                              height: 30,
                              borderRadius: 10,
                            }}
                            resizeMode="cover"
                            controls
                          />
                        </Pressable>
                      )}
                    {item?.parentMessageId?.content &&
                      item?.parentMessageId?.attachments && (
                        <Text
                          style={[styles.messageText, {marginLeft: 10}]}
                          variant="medium14"
                          color={COLORS.black333333}>
                          {item?.parentMessageId?.content}
                        </Text>
                      )}
                  </View>
                </View>
              )}
              <View>
                {(item?.content || item?.message) && !item?.attachments && (
                  <Text
                    // style={styles.messageText}
                    variant="medium14"
                    color={COLORS.black333333}>
                    {item?.content || item?.message}
                  </Text>
                )}

                {item?.attachments?.length > 0 &&
                  (item.attachments.length === 1 ? (
                    // Single attachment: Use View
                    <View style={{alignItems: 'center'}}>
                      <Pressable
                        onPress={() => {
                          setItemcliked(item.attachments[0]);
                          imageModalRef.current?.present();
                        }}
                        style={{margin: 5}}>
                        {item.attachments[0]?.mediaType?.includes('image') ? (
                          <Image
                            source={{uri: item.attachments[0]?.mediaUrl}}
                            style={{
                              width: 200,
                              height: 200,
                              borderRadius: 10,
                            }}
                            resizeMode="cover"
                          />
                        ) : item.attachments[0]?.mediaType?.includes(
                            'video',
                          ) ? (
                          <Video
                            source={{uri: item.attachments[0]?.mediaUrl}}
                            style={{
                              width: 200,
                              height: 200,
                              borderRadius: 10,
                            }}
                            resizeMode="cover"
                            controls
                          />
                        ) : null}
                      </Pressable>
                    </View>
                  ) : (
                    // Multiple attachments: Use FlatList with 2 columns
                    <FlatList
                      data={item.attachments}
                      keyExtractor={(attachment, index) => index.toString()}
                      numColumns={2} // Grid layout for multiple attachments
                      columnWrapperStyle={{justifyContent: 'space-between'}}
                      renderItem={({item: attachment, index}) => (
                        <Pressable
                          key={index}
                          onPress={() => {
                            setItemcliked(attachment);
                            imageModalRef.current?.present();
                          }}
                          style={{
                            margin: 5,
                            width: '48%', // Adjust width for grid layout
                          }}>
                          {attachment?.mediaType?.includes('image') ? (
                            <Image
                              source={{uri: attachment?.mediaUrl}}
                              style={{
                                width: '100%',
                                height: 160,
                                borderRadius: 10,
                              }}
                              resizeMode="cover"
                            />
                          ) : attachment?.mediaType?.includes('video') ? (
                            <Video
                              source={{uri: attachment?.mediaUrl}}
                              style={{
                                width: '100%',
                                height: 160,
                                borderRadius: 10,
                              }}
                              resizeMode="cover"
                              controls
                            />
                          ) : null}
                        </Pressable>
                      )}
                    />
                  ))}
                {(item?.content || item?.message) && item?.attachments && (
                  <Text
                    style={[styles.messageText, {marginTop: 10}]}
                    variant="medium14"
                    color={COLORS.black333333}>
                    {item?.content || item?.message}
                  </Text>
                )}
                {/* {item.contentType === 'gif' && (
                <Image
                  source={{uri: item.message}}
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: 10,
                  }}
                  resizeMode="cover"
                />
              )} */}
                <Text
                  style={{
                    fontSize: 10,
                    alignSelf: 'flex-end',
                    color: COLORS.grey777777,
                  }}>
                  {formatAMPM(item?.updatedAt || item?.timestamp)}
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
              {item?.reactions?.length > 0 && (
                <View
                  style={{
                    position: 'absolute',
                    right: -5,
                    bottom: -7,
                    backgroundColor: COLORS.black333333,
                    borderRadius: 10,
                    paddingHorizontal: 5,
                    paddingVertical: 3,
                    flexDirection: 'row',
                  }}>
                  {item?.reactions?.map(u => (
                    <Text style={{fontSize: nh(7)}}>{u?.emoji}</Text>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          </View>
          {item?.sender?._id === userData?.id ? (
            userData?.profilePicture ? (
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
            ) : (
              <View
                style={{
                  height: nh(50),
                  width: nh(50),
                  borderWidth: 1,
                  borderRadius: nh(25),
                  borderColor: COLORS.blue043142,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: COLORS.greyD6D6D6,
                }}>
                <Text variant="semibold16" color={COLORS.black333333}>
                  {`${userData?.firstname
                    ?.charAt(0)
                    .toUpperCase()}${userData?.lastname
                    ?.charAt(0)
                    .toUpperCase()}`}
                </Text>
              </View>
            )
          ) : null}
        </View>
      );
    }
  };

  // Function to detect '@' and filter user list
  const handleInputChange = text => {
    setInput(text);
    const lastWord = text.split(' ').pop(); // Get the last word being typed

    if (lastWord.startsWith('@')) {
      const query = lastWord.slice(1).toLowerCase();
      const filteredUsers = data?.members?.filter(user =>
        user.username.toLowerCase().includes(query),
      );
      setMentionList(filteredUsers);
      setShowMentions(true);
    } else {
      setShowMentions(false);
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
          <View
            style={{
              flexDirection: 'row',

              alignItems: 'center',

              justifyContent: 'space-between',

              paddingHorizontal: nw(16), // Add horizontal padding

              paddingTop: nh(2),

              backgroundColor: COLORS.yellowF5BE00, // Set background color

              backgroundColor: COLORS.yellowF5BE00,
            }}>
            <View
              style={{
                flexDirection: 'row',

                alignItems: 'center',
              }}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  width: 40, // Fixed width for icon touchable area

                  alignItems: 'center',

                  justifyContent: 'center',
                }}>
                <Image
                  source={icons.backarrow}
                  style={{
                    width: nw(30),

                    height: nh(30),

                    resizeMode: 'contain',

                    marginTop: 5,
                  }}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  navigation.navigate(Routes.GroupProfile, {canGoBack: true});
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginLeft: 10,
                }}>
                {data?.profilePicture ? (
                  <Image
                    // source={{uri: data?.profilePicture}}
                    source={{
                      uri: `${
                        data?.profilePicture
                      }?timestamp=${new Date().getTime()}`,
                    }}
                    style={styles.image}
                  />
                ) : (
                  <View
                    style={[
                      styles.image,
                      {
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: COLORS.greyD6D6D6,
                      },
                    ]}>
                    <Icon
                      type="material-community"
                      name="account-group"
                      style={{marginLeft: 0.5}}
                      size={nh(30)}
                    />
                  </View>
                )}

                {/* Title */}

                <Text
                  variant="semibold18"
                  style={styles.title}
                  color={COLORS.whiteFFFFFF}>
                  {data?.name}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Right Icon */}

            {/* <TouchableOpacity onPress={onRightIconPress} style={styles.iconContainer}>

{rightIcon && (

<Entypo

name="dots-three-vertical"

size={nh(20)}

color={COLORS.whiteFFFFFF}

style={styles.icon}

/>
)}

      </TouchableOpacity> */}
          </View>

          <View style={styles.layer1}>
            <View style={styles.layer2}>
              <View style={styles.container1}>
                <FlatList
                  ref={flatListRef}
                  data={formatGroupedMessages()}
                  renderItem={renderMessage}
                  initialNumToRender={100}
                  keyExtractor={(_, index) => index.toString()}
                  //   contentContainerStyle={styles.messagesList}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  extraData={messages}
                  onScroll={handleScroll} // Detect scroll position
                  scrollEventThrottle={16} // Adjust frequency of `onScroll` calls
                  ListFooterComponent={
                    loading && !allMessagesFetched ? (
                      <ActivityIndicator size="small" color="#0000ff" />
                    ) : null
                  } // Show loading spinner when fetching older messages
                  contentContainerStyle={{paddingBottom: 50}}
                />
                {reply && (
                  <View
                    style={{
                      height: nh(50),
                      backgroundColor: COLORS.grey333333 + 10,
                      borderColor: COLORS.grey777777 + 20,
                      borderWidth: 1,
                      borderRadius: 8,
                      borderLeftColor: COLORS.yellowF5BE00,
                      borderLeftWidth: 2,
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      marginBottom: 5,
                    }}>
                    <TouchableOpacity
                      onPress={() => {
                        console.log('hreee1111');
                        setSelected();
                        setReply(false);
                      }}
                      style={{
                        height: 20,
                        width: 20,
                        position: 'absolute',
                        right: 0,
                        top: 5,
                      }}>
                      <Icon type="entypo" name="cross" size={20} style={{}} />
                    </TouchableOpacity>
                    <Text variant="bold12" color={COLORS.blue043142}>
                      {selected?.sender?._id === userData?.id
                        ? 'You'
                        : selected?.sender?.username}
                    </Text>
                    <View style={{flexDirection: 'row'}}>
                      {selected?.attachments?.length > 0 && (
                        <Icon
                          type="material-community"
                          name={
                            selected?.attachments[0]?.mediaType?.includes(
                              'image',
                            )
                              ? 'image'
                              : 'video-outline'
                          }
                          size={20}
                          // style={{
                          //   alignSelf: 'center',
                          //   marginRight: 10,
                          //   marginLeft: -10,
                          // }}
                        />
                      )}
                      {selected?.attachments?.length > 0 && (
                        <Text variant="medium12" style={{marginLeft: 10}}>
                          {selected?.attachments[0]?.mediaType?.includes(
                            'image',
                          )
                            ? 'Image'
                            : 'Video'}
                        </Text>
                      )}
                      {(selected?.message || selected?.content) && (
                        <Text
                          variant="medium12"
                          style={{marginHorizontal: 10}}
                          numberOfLines={1}
                          ellipsizeMode="tail">
                          {selected?.message || selected?.content}
                        </Text>
                      )}
                    </View>
                  </View>
                )}
                <View style={styles.inputContainer}>
                  <Icon
                    type="material-community"
                    name="image-plus"
                    size={20}
                    style={{
                      alignSelf: 'center',
                      marginRight: 10,
                      marginLeft: -10,
                    }}
                    onPress={openGallery}
                  />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Type a message..."
                    value={input}
                    onChangeText={handleInputChange}
                    //   onSubmitEditing={sendMessage}
                    //   returnKeyType="send"
                    ref={textInputRef}
                  />
                  <ImageModal
                    ref={imageModalRef}
                    type={
                      itemclicked?.mediaType?.includes('video')
                        ? 'Video'
                        : 'Image'
                    }
                    URL={
                      Object.keys(itemclicked)?.length > 0
                        ? itemclicked?.mediaUrl
                        : ''
                    }
                  />

                  <MediaModal
                    isVisible={modalvisible}
                    onClose={() => {
                      setFile([]);
                      setInput('');
                      setModalVisible(false);
                    }}
                    multi={true}
                    file={file}
                    onSend={reply ? replyMessage : sendMessage}
                    input={input}
                    setInput={setInput}
                    loadingsmall={loadingsmall}
                    reply={reply}
                  />

                  <TouchableOpacity
                    style={styles.sendButton}
                    onPress={
                      selected?._id && edit
                        ? editMessage
                        : reply
                        ? replyMessage
                        : sendMessage
                    }>
                    {loadingsmall ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.sendButtonText}>
                        {selected?._id && edit
                          ? 'Edit'
                          : reply
                          ? 'Reply'
                          : 'Send'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
          {/* <MenuModal
            visible={visible}
            setVisible={setVisible}
            menuItems={menuItems}
          /> */}
          {showMentions && mentionList.length > 0 && (
            <View
              style={{
                position: 'absolute',
                bottom: 60,
                backgroundColor: 'white',
                borderRadius: 5,
                padding: 5,
              }}>
              {mentionList.map(user => (
                <TouchableOpacity
                  key={user.id}
                  onPress={() => {
                    const words = input.split(' ');
                    words[words.length - 1] = `@${user.username} `; // Replace with full username
                    setInput(words.join(' '));
                    setShowMentions(false);
                  }}
                  style={{
                    padding: 10,
                    borderBottomWidth: 1,
                    borderColor: '#ccc',
                  }}>
                  <Text variant="medium12" color={COLORS.grey999999}>
                    @{user.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <MessageModal
            isVisible={visible}
            onClose={() => {
              setSelected('');
              setVisible(false);
            }}
            item={selected}
            onEdit={onEditClick}
            onDelete={deleteMessage}
            onReact={reactMessage}
            onReply={onReplyClick}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    </TouchableWithoutFeedback>
  );
};

export default GroupChat;

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
    color: 'black',
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
  image: {
    height: nh(40),
    width: nh(40),
    borderRadius: nh(20),
    marginRight: 10,
    borderColor: COLORS.grey777777,
    borderWidth: 1,
  },
});
