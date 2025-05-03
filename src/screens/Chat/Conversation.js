import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {Image} from 'react-native';
import Text from '../../components/Text';
import Routes from '../../helper/routes';
import {
  getconversation,
  getGrouprequest,
  getStudyGroups,
} from '../../services/apiService';
import {useSelector} from 'react-redux';
import Button from '../../components/Button';
import {images} from '../../assets/images';
import ChatModal from './ChatModal';
import {formatDateforchat} from '../../helper/commonFunctions';
import {useFocusEffect} from '@react-navigation/native';
import ToggleWithUnderline from '../../components/TogglewithUnderline';
import Icon from '../../helper/icon';
import {io} from 'socket.io-client';

const Conversation = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const [loader, setLoader] = useState(true);
  const [selected, setSelected] = useState(0);
  const [conversation, setConversation] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const chatmodelRef = useRef(null);
  const DataArray = selected ? studyGroups : conversation;
  const [fetchconversation, setAllconversationfetched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [grouprequest, setgroupRequest] = useState([]);
  const page = useRef(1);

  useFocusEffect(
    useCallback(() => {
      fetchConversations(); // Function to fetch conversations
      fetchStudyGroups();
    }, []), // Add dependencies if needed
  );

  useEffect(() => {
    console.log(route?.params?.from, 'route?.params?.from ');
    if (route?.params?.from == 'innerCircle') {
      setSelected(1);
      setTimeout(() => {
        chatmodelRef.current?.present();
      }, 1000);
    }
  }, [route?.params?.from]);

  useEffect(() => {
    loadgroupRequest();
  }, []);

  const loadgroupRequest = async () => {
    try {
      let res = await getGrouprequest();

      setgroupRequest(res?.data?.requests);
    } catch (error) {
      console.log('🚀 ~ loadgroupRequest ~ error:', error);
    }
  };
  useEffect(() => {
    // Connect to the Socket.IO server when the component mounts
    const socketInstance = io('https://api.scaleupapp.club', {
      // Your server URL
      auth: {
        token: userData?.token, // If you have authentication
      },
    });
    socketInstance.on('conversationDetailUpdate', data => {
      console.log('🚀 ~ useEffect ~ data:', data);

      const index = conversation.filter(
        conv => conv.conversationId === data?.conversationId,
      );

      // console.log('jeyeeyeyeyeyyeey1', conversation);
      console.log('🚀 ~ useEffect ~ index:', index);
      if (index.length > 0) {
        // Update the existing object
        let updatedData = {
          lastMessage: data?.lastMessage,
          unreadMessageCount: data?.unreadMessageCount,
          updatedAt: data?.updatedAt,
        };
        console.log('🚀 ~ useEffect ~ index:1', index);
        const updatedMessages = conversation.map(
          msg =>
            msg.conversationId === data.conversationId
              ? {...msg, ...updatedData} // Update the matching object
              : msg, // Keep others unchanged
        );

        const index = updatedMessages.findIndex(
          conv => conv.conversationId === data?.conversationId,
        );

        if (index !== -1) {
          // Remove the matched conversation and insert it at index 0
          const [matchedConversation] = updatedMessages.splice(index, 1);
          updatedMessages.unshift(matchedConversation);
        }

        setConversation(updatedMessages);
      } else {
        console.log('jeyeeyeyeyeyyeey222');
        // Insert the new object at index 1
        let updatedData = [data, ...conversation];
        setConversation(updatedData);
      }
    });
    socketInstance.on('groupInfoUpdates', data => {
      console.log('🚀 groupInfoUpdates:', JSON.stringify(data));

      const filtered = studyGroups.filter(conv => conv._id === data?.groupId);

      if (filtered.length > 0) {
        // Update the existing object
        let updatedData = {
          lastMessage: data?.lastMessage,
          unreadMessageCount: data?.unreadMessageCount,
          timestamp: data?.createdDate,
        };
        const updatedMessages = studyGroups.map(
          msg =>
            msg?._id === data?.groupId
              ? {...msg, ...updatedData} // Update the matching object
              : msg, // Keep others unchanged
        );

        const index = updatedMessages.findIndex(
          conv => conv?._id === data?.groupId,
        );

        if (index !== -1) {
          // Remove the matched conversation and insert it at index 0
          const [matchedConversation] = updatedMessages.splice(index, 1);
          updatedMessages.unshift(matchedConversation);
        }
        setStudyGroups(updatedMessages);
      } else {
        let updatedData = [data, ...studyGroups];
        setStudyGroups(updatedData);
        fetchStudyGroups();
      }
    });
    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [conversation, studyGroups]);

  const fetchConversations = async () => {
    try {
      if (loading || fetchconversation) return;
      setLoading(true);
      const {data} = await getconversation(page?.current);
      setConversation(val => [...val, ...data?.conversations]);
      if (page?.current == data?.totalPages) {
        setAllconversationfetched(true);
      }
      page.current += 1;
      // console.log('🚀 ~ fetchConversations ~ data:', data);
    } catch (error) {
      console.log('🚀 ~ fetchConversations ~ error..:', error);
    } finally {
      setLoader(false);
      setLoading(false);
    }
  };
  const fetchStudyGroups = async () => {
    try {
      const {data} = await getStudyGroups();
      // console.log('🚀 ~ fetchStudyGroups ~ data:', JSON.stringify(data));
      setStudyGroups(data);
    } catch (error) {
      console.error('Error fetching study groups:', error);
    }
  };

  const truncateString = (str, maxLength = 130) => {
    return str?.length > maxLength ? str?.slice(0, maxLength) + '...' : str;
  };
  const GroupCard = ({item, index}) => {
    // console.log('item?.unreadMessageCount ', item?.unreadMessageCount);
    let lastMessage = item?.lastMessage;
    // console.log('🚀 ~ GroupCard ~ item:', JSON.stringify(item));
    return (
      <Pressable
        key={index}
        style={styles.card}
        onPress={() =>
          navigation.navigate(Routes.GroupChat, {
            groupId: item?._id,
            data: item,
          })
        }>
        {item?.profilePicture ? (
          <Image
            source={{
              uri: `${item?.profilePicture}?timestamp=${new Date().getTime()}`,
            }}
            // source={{uri: item?.profilePicture}}
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
        <View style={{flex: 9}}>
          <Text variant="medium12" color={COLORS.blue043142}>
            {item?.name}
          </Text>
          {lastMessage ? (
            <Text variant="medium12" color={COLORS.grey999999}>
              {lastMessage?.sender?.username +
                ': ' +
                truncateString(lastMessage?.content, 30)}
            </Text>
          ) : null}
        </View>
        <View style={{flex: 4, alignItems: 'center'}}>
          <Text variant="medium12" color={COLORS.blue043142}>
            {formatDateforchat(lastMessage?.timestamp || item?.createdDate)}
          </Text>
          {item?.unreadMessageCount > 0 && (
            <View
              style={{
                height: nh(20),
                minWidth: nh(20),
                borderRadius: nh(10),
                backgroundColor: '#34A853',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: nw(5),
              }}>
              <Text variant="medium12" color={COLORS.whiteFFFFFF}>
                {item?.unreadMessageCount}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };
  const Card = ({item, index}) => {
    return (
      <Pressable
        key={index}
        style={styles.card}
        onPress={() =>
          navigation.navigate(Routes.Chat, {
            chatId: item?.conversationId,
            data:
              item?.members[0]?.firstname + ' ' + item?.members[0]?.lastname,
          })
        }>
        {item?.members[0]?.profilePicture ? (
          <Image
            source={{uri: item?.members[0]?.profilePicture}}
            style={styles.image}
          />
        ) : (
          <View
            style={{
              ...styles.image,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: COLORS.greyD6D6D6,
            }}>
            <Text variant="semibold16" color={COLORS.black333333}>
              {`${item?.members[0]?.firstname
                ?.charAt(0)
                .toUpperCase()}${item?.members[0]?.lastname
                ?.charAt(0)
                .toUpperCase()}`}
            </Text>
          </View>
        )}

        <View style={{flex: 9}}>
          <Text variant="medium12" color={COLORS.blue043142}>
            {item?.members[0]?.firstname + ' ' + item?.members[0]?.lastname}
          </Text>
          <Text variant="medium12" color={COLORS.grey999999}>
            {truncateString(item?.lastMessage?.message, 30)}
          </Text>
        </View>
        <View style={{flex: 4, alignItems: 'center'}}>
          <Text variant="medium12" color={COLORS.blue043142}>
            {formatDateforchat(item?.lastMessage?.updatedAt)}
          </Text>
          {item?.unreadMessageCount > 0 && (
            <View
              style={{
                height: nh(20),
                minWidth: nh(20),
                borderRadius: nh(10),
                backgroundColor: '#34A853',
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: nw(5),
              }}>
              <Text variant="medium12" color={COLORS.whiteFFFFFF}>
                {item?.unreadMessageCount}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };
  return loader ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={30} />
      <Text variant="medium12" style={{marginTop: 10}}>
        Conversation Loading....
      </Text>
    </View>
  ) : (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header
        title="Chat"
        // backIcon={icons.backArrow} // Provide your back arrow icon
        // rightIcon={icons.menu} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ToggleWithUnderline
            options={['CHATS', 'STUDY GROUPS']}
            onToggle={setSelected}
            select={selected}
          />
          <ChatModal group={selected} ref={chatmodelRef} />
          {grouprequest?.length > 0 && selected ? (
            <TouchableOpacity
              style={{
                height: nh(40),
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-between',
                borderWidth: 1,
                borderColor: COLORS.grey777777,
                paddingLeft: 10,
                borderRadius: 10,
                marginBottom: 20,
              }}
              onPress={() =>
                navigation.navigate(Routes.groupRequest, {data: grouprequest})
              }>
              <Text variant="medium12" color={COLORS.grey999999}>
                You have study group request pending
              </Text>
              <Icon
                type="material"
                name="keyboard-arrow-right"
                color={COLORS.grey777777}
                style={{marginRight: nw(10)}}
              />
            </TouchableOpacity>
          ) : null}
          <FlatList
            data={DataArray}
            renderItem={({item, index}) =>
              selected ? (
                <GroupCard item={item} index={index} />
              ) : (
                <Card item={item} index={index} />
              )
            }
            onEndReached={fetchConversations}
            ListFooterComponent={
              loading && !fetchconversation ? (
                <ActivityIndicator size="small" color="#0000ff" />
              ) : null
            }
            extraData={conversation}
            ListEmptyComponent={() => {
              return (
                <View>
                  <Image
                    source={images.nochat}
                    resizeMode="contain"
                    style={styles.notimage}
                  />

                  <Text
                    variant="semibold20"
                    color={COLORS.blue043142}
                    style={{textAlign: 'center', marginTop: nh(30)}}>
                    {selected ? 'No Study Groups Yet' : 'No Chats Yet'}
                  </Text>
                  <Text
                    variant="medium14"
                    color={COLORS.grey999999}
                    style={{
                      textAlign: 'center',
                      marginTop: nh(5),
                      marginBottom: nh(20),
                    }}>
                    {selected
                      ? 'Join or create a study group to collaborate with others. Learning is better together!'
                      : 'Start a conversation and connect with fellow learners. It’s more fun learning together!'}
                  </Text>
                  <Button
                    text={
                      selected ? 'Create a Study Group' : 'Start a new chat'
                    }
                    onPress={() => chatmodelRef.current?.present()}
                  />
                </View>
              );
            }}
          />
          {DataArray?.length > 0 ? (
            <View style={{position: 'absolute', bottom: nh(16), right: nw(16)}}>
              <Icon
                type="antdesign"
                name="pluscircle"
                color={COLORS.blue043142}
                style={{marginLeft: 0.5}}
                size={nh(45)}
                onPress={() => chatmodelRef.current?.present()}
              />
            </View>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Conversation;

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
  image: {
    height: nh(50),
    width: nh(50),
    borderRadius: nh(25),
    marginRight: 10,
    borderColor: COLORS.grey777777,
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    marginBottom: nh(15),
    alignItems: 'center',
    flex: 1,
  },
  notimage: {
    height: nh(275),
    width: nw(300),
    alignSelf: 'center',
    marginTop: nh(30),
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
