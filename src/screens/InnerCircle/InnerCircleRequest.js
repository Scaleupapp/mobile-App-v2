import React, {useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ImageBackground,
  FlatList,
  ActivityIndicator,
  Platform,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import {images} from '../../assets/images';
import CustomTextInput from '../../components/TextInput';
import ToggleWithUnderline from '../../components/TogglewithUnderline';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Icon from '../../helper/icon';
import {
  acceptInnerCircleRequestAPI,
  createConversation,
  declineInnerCircleRequestAPI,
  getStudyGroups,
  myInnerCircleAPI,
  myInnerCircleRequestAPI,
  myInnerCirclerecievedAPI,
  myInnerCirclesentAPI,
  widrawInnerCircleRequestAPI,
} from '../../services/apiService';
import Routes from '../../helper/routes';
import {formatDateforchat, getTimeAgo} from '../../helper/commonFunctions';
import moment from 'moment';
import {navigationRef} from '../../../App';
import ChatModal from '../Chat/ChatModal';

const InnerCircleRequest = ({navigation, route}) => {
  const [innerCircle, setInnerCircle] = useState([]);
  const [myinnerCircle, setMyInnerCircle] = useState([]);
  const [sent, setSentRequest] = useState([]);
  const [loader, setloader] = useState(true);
  const [loading, setLoading] = useState(false); // Loading state
  const [allFetched, setAllFetched] = useState(false); // Indicates if all messages are loaded
  const [allsentFetched, setAllsentFetched] = useState(false);
  const [allrecivedFetched, setAllrecievedFetched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const page = useRef(1);
  const page1 = useRef(1);
  const page2 = useRef(1);
  const chatmodelRef = useRef(null);
  useEffect(() => {
    getInnerCircleList();
    getmyInnerCircleList();
    getInnerCirclerecivedList();
    fetchStudyGroups();
  }, []);

  let getmyInnerCircleList = async () => {
    try {
      if (loading || allFetched) return;
      setLoading(true);
      let resp = await myInnerCircleAPI(page?.current);
      setMyInnerCircle(val => [...val, ...resp?.data?.users]);
      setFilteredUsers(val => [...val, ...resp?.data?.users]);
      if (page?.current == resp?.data?.totalPages) {
        setAllFetched(true);
      }
      page.current += 1;
    } catch (error) {
      console.log(error, 'rerrr');
    } finally {
      setloader(false);
      setLoading(false);
    }
  };

  let getInnerCircleList = async () => {
    try {
      if (loading || allsentFetched) return;
      setLoading(true);
      let resp = await myInnerCirclesentAPI(page1?.current);

      // setInnerCircle(resp?.data?.reqReceived);

      setSentRequest(val => [...val, ...resp?.data?.users]);
      if (page1?.current == resp?.data?.totalPages) {
        setAllsentFetched(true);
      }
      page1.current += 1;
    } catch (error) {
      console.log(error, 'rerrr');
    } finally {
      setloader(false);
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
  let getInnerCirclerecivedList = async () => {
    try {
      if (loading || allrecivedFetched) return;
      setLoading(true);
      let resp = await myInnerCirclerecievedAPI(page2.current);
      console.log(resp?.data, 'resp?.data11111');
      setInnerCircle(val => [...val, ...resp?.data?.users]);

      if (page2?.current == resp?.data?.totalPages) {
        setAllrecievedFetched(true);
      }
      page2.current += 1;
    } catch (error) {
      console.log(error, 'rerrr');
    } finally {
      setloader(false);
      setLoading(false);
    }
  };

  // Debounce logic: Update `debouncedTerm` after a delay
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300); // 300ms delay for debouncing

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Filter users whenever `debouncedTerm` changes
  useEffect(() => {
    const lowerSearchTerm = debouncedTerm.toLowerCase();
    const results = myinnerCircle?.filter(
      user =>
        user.firstname.toLowerCase().includes(lowerSearchTerm) ||
        user.lastname.toLowerCase().includes(lowerSearchTerm) ||
        user.username.toLowerCase().includes(lowerSearchTerm),
    );
    setFilteredUsers(results);
  }, [debouncedTerm]);

  let declineRequest = async id => {
    try {
      let payload = {
        targetUserId: id,
      };
      let resp = await declineInnerCircleRequestAPI(payload);
      // console.log('🚀 ~ acceptRequest ~ resp:', resp?.data);
      let data = innerCircle.filter(user => user.userId !== id);
      setInnerCircle(data);
    } catch (error) {}
  };

  const [selected, setSelected] = useState(0);
  const onSelect = number => {
    setSelected(number);
  };

  let acceptRequest = async (id, type) => {
    try {
      let payload = {
        requestId: id,
        action: type,
      };
      let resp = await acceptInnerCircleRequestAPI(payload);
      // console.log('🚀 ~ acceptRequest ~ resp:', resp?.data);
      let data = innerCircle.filter(user => user.id !== id);
      setInnerCircle(data);
    } catch (error) {}
  };

  const Widraw = async id => {
    try {
      let payload = {
        requestId: id,
      };
      // console.log('🚀 ~ InnerCircleRequest ~ payload:', payload);
      // let res = await widrawInnerCircleRequestAPI(payload);
      let data = sent?.filter(user => user.id !== id);
      setSentRequest(data);
      // console.log('🚀 ~ InnerCircleRequest ~ res:', res?.data);
    } catch (error) {}
  };

  let createConvo = async (id, item) => {
    // console.log('🚀 ~ createConvo ~ id:', id);
    try {
      let paylaod = {
        recipientId: id,
      };

      let resp = await createConversation(paylaod);
      // console.log(resp?.data);
      navigationRef.navigate(Routes.Chat, {
        chatId: resp?.data?._id,
        data: item?.firstname + ' ' + item?.lastname,
      });
    } catch (error) {
      console.log(error, 'rerrr');
    } finally {
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
  const RequestView = ({item}) => {
    return (
      <View>
        <View style={styles.card}>
          <Image source={{uri: item?.profilePicture}} style={styles.image} />
          <View>
            <Text variant="medium14" color={COLORS.blue043142}>
              {item?.username}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                width: '90%',
              }}>
              <Text
                variant="medium12"
                color={COLORS.grey999999}
                style={{width: nw(208)}}>
                wants to be a part of your Inner Circle
              </Text>

              <Icon
                type="antdesign"
                name="closecircle"
                color={COLORS.redEA4335}
                size={25}
                onPress={() => acceptRequest(item?.id, 'reject')}
              />
              <Icon
                type="antdesign"
                name="checkcircle"
                color={COLORS.green34A853}
                size={25}
                onPress={() => acceptRequest(item?.id, 'accept')}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  return loader ? (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size={30} />
    </View>
  ) : (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <ImageBackground
        source={images.ellipse}
        style={styles.semicirlce}
        resizeMode="stretch">
        <Header
          title="My Inner Circle"
          // backIcon={icons.backArrow} // Provide your back arrow icon
          rightIcon={false} // Provide your right icon
          // onBackPress={handleBackPress}
          // onRightIconPress={handleRightIconPress}
        />
      </ImageBackground>

      <View
        style={{
          position: 'absolute',
          left: nw(16),
          right: 0,
          top: Platform.OS == 'ios' ? nh(140) : nh(80),
        }}>
        <CustomTextInput
          width={DEVICE_WIDTH - 32}
          height={nh(40)}
          placeholder="Search Inner Circle"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      <View>
        <View style={{marginHorizontal: nw(16), marginBottom: nh(8)}}>
          <ToggleWithUnderline
            options={['MY CIRCLE', 'RECEIVED', 'SENT', 'GROUPS']}
            onToggle={number => onSelect(number)}
          />
        </View>
      </View>

      {selected == 0 && myinnerCircle?.length > 0 ? (
        <FlatList
          data={filteredUsers}
          onEndReached={getmyInnerCircleList}
          ListFooterComponent={
            loading && !allFetched ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : null
          }
          extraData={filteredUsers}
          renderItem={({item}) => {
            // console.log('🚀 ~ InnerCircleRequest ~ item:', item);
            return (
              <View>
                <View style={styles.card}>
                  <TouchableOpacity
                    onPress={() =>
                      navigationRef.navigate(Routes.OtherProfile, {
                        type: 'other',
                        id: item?.userId,
                      })
                    }>
                    <Image
                      source={{uri: item?.profilePicture}}
                      style={styles.image}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() =>
                      navigationRef.navigate(Routes.OtherProfile, {
                        type: 'other',
                        id: item?.userId,
                      })
                    }>
                    <View style={{width: nw(150)}}>
                      <Text variant="medium14" color={COLORS.blue043142}>
                        {item?.username}
                      </Text>

                      {/* <Text
                    variant="medium12"
                    color={COLORS.grey999999}
                    style={{width: nw(208)}}>
                    Designation
                  </Text> */}
                    </View>
                  </TouchableOpacity>
                  <View style={{marginRight: 10}}>
                    <Button
                      icontype="material-community"
                      justIcon={'chat-processing'}
                      width={nw(35)}
                      height={nh(35)}
                      variant="outline"
                      onPress={() => createConvo(item?.userId, item)}
                    />
                  </View>
                  <Button
                    text="Remove"
                    variant="outline"
                    width={nw(90)}
                    height={nh(35)}
                    textStyle={{fontSize: 14}}
                    onPress={() => declineRequest(item?.userId)}
                  />
                </View>
              </View>
            );
          }}
        />
      ) : (
        selected == 0 && (
          <View>
            <Image
              source={images.norequest}
              resizeMode="contain"
              style={styles.notimage}
            />

            <Text
              variant="semibold20"
              color={COLORS.blue043142}
              style={{textAlign: 'center', marginTop: nh(30)}}>
              No one added in Inner Circle
            </Text>
            <Text
              variant="medium14"
              color={COLORS.grey999999}
              style={{
                textAlign: 'center',
                marginTop: nh(5),
                marginBottom: nh(20),
              }}>
              It’s quiet here. Why not create your first post and share your
              thoughts with the community?
            </Text>
            <Button
              text="View Requests"
              onPress={() => navigation.navigate(Routes.InnerCircleRequest)}
            />
          </View>
        )
      )}
      {selected == 1 && innerCircle?.length > 0 ? (
        <FlatList
          data={innerCircle}
          onEndReached={getInnerCirclerecivedList}
          ListFooterComponent={
            loading && !allrecivedFetched ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : null
          }
          extraData={innerCircle}
          renderItem={({item}) => <RequestView item={item} />}
        />
      ) : (
        selected == 1 && (
          <View>
            <Image
              source={images.norequest}
              resizeMode="contain"
              style={styles.notimage}
            />

            <Text
              variant="semibold20"
              color={COLORS.blue043142}
              style={{textAlign: 'center', marginTop: nh(30)}}>
              No Inner Circle Requests Received
            </Text>
            <Text
              variant="medium14"
              color={COLORS.grey999999}
              style={{
                textAlign: 'center',
                marginTop: nh(5),
                marginBottom: nh(20),
              }}>
              It’s quiet here. Why not create your first post and share your
              thoughts with the community?
            </Text>
            <Button
              text="Explore Content"
              onPress={() => navigation.navigate(Routes.Home)}
            />
          </View>
        )
      )}
      {selected == 2 && sent?.length > 0 ? (
        <FlatList
          data={sent}
          onEndReached={getInnerCircleList}
          ListFooterComponent={
            loading && !allsentFetched ? (
              <ActivityIndicator size="small" color="#0000ff" />
            ) : null
          }
          extraData={sent}
          renderItem={({item}) => {
            // console.log('🚀 ~ InnerCircleRequest ~ item:', item);
            return (
              <View>
                <View style={styles.card}>
                  <Image
                    source={{uri: item?.profilePicture}}
                    style={styles.image}
                  />
                  <View>
                    <View
                      style={{
                        width: '90%',
                      }}>
                      <View
                        style={{
                          width: '100%',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <Text variant="medium14" color={COLORS.blue043142}>
                          {item?.username}
                        </Text>
                        <Text variant="medium12" color={COLORS.blue043142}>
                          {formatDateforchat(item?.timestamp)}
                        </Text>
                      </View>
                      <View
                        style={{
                          width: '100%',
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                        }}>
                        <Text
                          variant="medium12"
                          color={COLORS.grey999999}
                          style={{width: '70%'}}>
                          {item?.status}
                        </Text>
                        <Button
                          onPress={() => Widraw(item.id)}
                          height={25}
                          width={90}
                          variant="outline"
                          text="Withdraw"
                          textStyle={{fontSize: nh(12)}}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      ) : (
        selected == 2 && (
          <View>
            <Image
              source={images.norequest}
              resizeMode="contain"
              style={styles.notimage}
            />

            <Text
              variant="semibold20"
              color={COLORS.blue043142}
              style={{textAlign: 'center', marginTop: nh(30)}}>
              No Inner Circle Requests Sent
            </Text>
            <Text
              variant="medium14"
              color={COLORS.grey999999}
              style={{
                textAlign: 'center',
                marginTop: nh(5),
                marginBottom: nh(20),
              }}>
              It’s quiet here. Why not create your first post and share your
              thoughts with the community?
            </Text>
            <Button
              text="Send Requests"
              // onPress={() => navigation.navigate(Routes.Home)}
            />
          </View>
        )
      )}
      <ChatModal group={1} ref={chatmodelRef} />
      {selected == 3 && (
        <FlatList
          data={studyGroups}
          renderItem={({item, index}) => (
            <GroupCard item={item} index={index} />
          )}
          // onEndReached={fetchConversations}
          // ListFooterComponent={
          //   loading && !fetchconversation ? (
          //     <ActivityIndicator size="small" color="#0000ff" />
          //   ) : null
          // }
          // extraData={conversation}
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
                  {'No Study Groups Yet'}
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
                  text={'Create a Study Group'}
                  onPress={() => chatmodelRef.current?.present()}
                />
              </View>
            );
          }}
        />
      )}
      {studyGroups?.length > 0 && selected == 3 ? (
        <View style={{position: 'absolute', bottom: nh(40), right: nw(40)}}>
          <Icon
            type="antdesign"
            name="pluscircle"
            color={COLORS.blue043142}
            style={{marginLeft: 0.5}}
            size={nh(45)}
            onPress={() =>
              navigation.navigate(Routes.Conversation, {from: 'innerCircle'})
            }
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
};

export default InnerCircleRequest;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  semicirlce: {
    width: DEVICE_WIDTH,
    height: nh(120),
    marginBottom: nh(20),
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
    boxShadow: '0 2 5 0 #00000026',

    alignItems: 'center',
    paddingHorizontal: nw(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E9',
    // borderRadius: nh(10),
    paddingBottom: 15,
    // marginBottom: nh(22),
    paddingTop: nh(22),
  },
  notimage: {
    height: nh(275),
    width: nw(300),
    alignSelf: 'center',
    marginTop: nh(30),
  },
});
