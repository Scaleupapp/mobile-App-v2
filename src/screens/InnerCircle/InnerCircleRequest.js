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
  myInnerCirclerecievedAPI,
  myInnerCirclesentAPI,
  // widrawInnerCircleRequestAPI,
} from '../../services/apiService';
import Routes from '../../helper/routes';
import {formatDateforchat, getTimeAgo} from '../../helper/commonFunctions';
import {navigationRef} from '../../../App';
import ChatModal from '../Chat/ChatModal';

const InnerCircleRequest = ({navigation, route}) => {
  const [innerCircle, setInnerCircle] = useState([]);
  const [myinnerCircle, setMyInnerCircle] = useState([]);
  const [sent, setSentRequest] = useState([]);
  const [loader, setloader] = useState(true);
  const [loading, setLoading] = useState(false);
  const [allFetched, setAllFetched] = useState(false);
  const [allsentFetched, setAllsentFetched] = useState(false);
  const [allrecivedFetched, setAllrecievedFetched] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);

  const page = useRef(1);
  const page1 = useRef(1); // Sent page
  const page2 = useRef(1); // Received page
  const chatmodelRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      setloader(true);
      await Promise.all([
        getmyInnerCircleList(true),
        getInnerCircleList(true), // Sent requests
        getInnerCirclerecivedList(true), // Received requests
        fetchStudyGroups(),
      ]);
      setloader(false);
    };
    fetchData();
  }, []);

  const resetAndFetchMyCircle = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    page.current = 1;
    setMyInnerCircle([]);
    setFilteredUsers([]);
    setAllFetched(false);
    await getmyInnerCircleList();
    if (showLoader) setLoading(false);
  };

  const resetAndFetchReceived = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    page2.current = 1;
    setInnerCircle([]);
    setAllrecievedFetched(false);
    await getInnerCirclerecivedList();
    if (showLoader) setLoading(false);
  };

  const resetAndFetchSent = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    page1.current = 1;
    setSentRequest([]);
    setAllsentFetched(false);
    await getInnerCircleList();
    if (showLoader) setLoading(false);
  };

  let getmyInnerCircleList = async (initialLoad = false) => {
    if (loading && !initialLoad) return;
    if (!initialLoad && allFetched) return;

    if (!initialLoad) setLoading(true);
    try {
      const resp = await myInnerCircleAPI(page?.current);
      const newUsers = resp?.data?.users || [];

      setMyInnerCircle(prev => {
        if (page.current === 1) return newUsers;
        const existingIds = new Set(prev.map(u => u.userId)); // Assuming userId is unique for My Circle
        const uniqueNewUsers = newUsers.filter(u => !existingIds.has(u.userId));
        return [...prev, ...uniqueNewUsers];
      });

      if (page?.current >= resp?.data?.totalPages || newUsers.length === 0) {
        setAllFetched(true);
      }
      // Only increment page if API indicates more pages OR if new unique users were actually added
      // This condition might need refinement based on API behavior regarding totalPages
      if (
        newUsers.length > 0 &&
        (page?.current < resp?.data?.totalPages ||
          resp?.data?.totalPages === undefined)
      ) {
        page.current += 1;
      } else if (
        newUsers.length === 0 ||
        page?.current >= resp?.data?.totalPages
      ) {
        setAllFetched(true);
      }
    } catch (error) {
      console.log('Error fetching my inner circle:', error);
      if (!initialLoad) setAllFetched(true);
    } finally {
      if (!initialLoad) setLoading(false);
    }
  };

  let getInnerCircleList = async (initialLoad = false) => {
    // Sent requests
    if (loading && !initialLoad) return;
    if (!initialLoad && allsentFetched) return;

    if (!initialLoad) setLoading(true);
    try {
      const resp = await myInnerCirclesentAPI(page1?.current);
      const newRequests = resp?.data?.users || [];

      // **FIX FOR DUPLICATE KEYS IN SENT TAB**
      setSentRequest(prev => {
        if (page1.current === 1) {
          return newRequests; // For initial load, just set the new requests
        }
        // For subsequent loads (pagination):
        // Create a Set of existing request IDs for efficient lookup
        const existingRequestIds = new Set(prev.map(pItem => pItem.id)); // Assuming 'item.id' is the unique ID for a sent request
        // Filter out new requests that are already in the previous list
        const uniqueNewRequests = newRequests.filter(
          nItem => !existingRequestIds.has(nItem.id),
        );
        return [...prev, ...uniqueNewRequests];
      });

      if (
        page1?.current >= resp?.data?.totalPages ||
        newRequests.length === 0
      ) {
        setAllsentFetched(true);
      }
      // Only increment page if API indicates more pages OR if new unique requests were actually added
      if (
        newRequests.length > 0 &&
        (page1?.current < resp?.data?.totalPages ||
          resp?.data?.totalPages === undefined)
      ) {
        page1.current += 1;
      } else if (
        newRequests.length === 0 ||
        page1?.current >= resp?.data?.totalPages
      ) {
        setAllsentFetched(true);
      }
    } catch (error) {
      console.log('Error fetching sent requests:', error);
      if (!initialLoad) setAllsentFetched(true);
    } finally {
      if (!initialLoad) setLoading(false);
    }
  };

  const fetchStudyGroups = async () => {
    try {
      const {data} = await getStudyGroups();
      setStudyGroups(data || []);
    } catch (error) {
      console.error('Error fetching study groups:', error);
    }
  };

  let getInnerCirclerecivedList = async (initialLoad = false) => {
    // Received requests
    if (loading && !initialLoad) return;
    if (!initialLoad && allrecivedFetched) return;

    if (!initialLoad) setLoading(true);
    try {
      const resp = await myInnerCirclerecievedAPI(page2.current);
      const newReceived = resp?.data?.users || [];

      setInnerCircle(prev => {
        if (page2.current === 1) return newReceived;
        const existingIds = new Set(prev.map(r => r.id)); // Assuming 'id' is unique for received requests
        const uniqueNewReceived = newReceived.filter(
          r => !existingIds.has(r.id),
        );
        return [...prev, ...uniqueNewReceived];
      });

      if (
        page2?.current >= resp?.data?.totalPages ||
        newReceived.length === 0
      ) {
        setAllrecievedFetched(true);
      }
      // Only increment page if API indicates more pages OR if new unique requests were actually added
      if (
        newReceived.length > 0 &&
        (page2?.current < resp?.data?.totalPages ||
          resp?.data?.totalPages === undefined)
      ) {
        page2.current += 1;
      } else if (
        newReceived.length === 0 ||
        page2?.current >= resp?.data?.totalPages
      ) {
        setAllrecievedFetched(true);
      }
    } catch (error) {
      console.log('Error fetching received requests:', error);
      if (!initialLoad) setAllrecivedFetched(true);
    } finally {
      if (!initialLoad) setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    if (selected === 0) {
      if (debouncedTerm === '') {
        setFilteredUsers(myinnerCircle);
      } else {
        const lowerSearchTerm = debouncedTerm.toLowerCase();
        const results = myinnerCircle?.filter(
          user =>
            user.firstname?.toLowerCase().includes(lowerSearchTerm) ||
            user.lastname?.toLowerCase().includes(lowerSearchTerm) ||
            user.username?.toLowerCase().includes(lowerSearchTerm),
        );
        setFilteredUsers(results);
      }
    }
  }, [debouncedTerm, myinnerCircle, selected]);

  let declineRequest = async targetUserId => {
    setLoading(true);
    try {
      await declineInnerCircleRequestAPI({targetUserId});
      setMyInnerCircle(prev =>
        prev.filter(user => user.userId !== targetUserId),
      );
    } catch (error) {
      console.error('Error removing user from circle:', error);
    } finally {
      setLoading(false);
    }
  };

  const [selected, setSelected] = useState(0);
  const onSelect = number => {
    setSelected(number);
    setSearchTerm('');
    setDebouncedTerm('');
    if (number === 0 && myinnerCircle.length === 0 && !allFetched && !loading)
      getmyInnerCircleList(true);
    if (
      number === 1 &&
      innerCircle.length === 0 &&
      !allrecivedFetched &&
      !loading
    )
      getInnerCirclerecivedList(true);
    if (number === 2 && sent.length === 0 && !allsentFetched && !loading)
      getInnerCircleList(true);
    if (number === 3 && studyGroups.length === 0 && !loading)
      fetchStudyGroups();
  };

  let acceptRequest = async (requestId, action) => {
    setLoading(true);
    try {
      await acceptInnerCircleRequestAPI({requestId, action});
      setInnerCircle(prev => prev.filter(user => user.id !== requestId));
      if (action === 'accept') {
        resetAndFetchMyCircle(true);
      }
    } catch (error) {
      console.error('Error responding to request:', error);
    } finally {
      setLoading(false);
    }
  };

  const Widraw = async requestId => {
    setLoading(true);
    try {
      // await widrawInnerCircleRequestAPI({ requestId });
      setSentRequest(prev => prev.filter(user => user.id !== requestId));
    } catch (error) {
      console.error('Error withdrawing request:', error);
    } finally {
      setLoading(false);
    }
  };

  let createConvo = async (recipientId, item) => {
    setLoading(true);
    try {
      const resp = await createConversation({recipientId});
      navigationRef.navigate(Routes.Chat, {
        chatId: resp?.data?._id,
        data: `${item?.firstname || ''} ${
          item?.lastname || item?.username || 'Chat'
        }`,
      });
    } catch (error) {
      console.log('Error creating conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const truncateString = (str, maxLength = 25) => {
    if (!str) return '';
    return str.length > maxLength ? str.slice(0, maxLength) + '...' : str;
  };

  const GroupCard = ({item}) => {
    let lastMessage = item?.lastMessage;
    return (
      <Pressable
        style={styles.cardBase}
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
            style={styles.profileImageLarge}
          />
        ) : (
          <View style={[styles.profileImageLarge, styles.avatarPlaceholder]}>
            <Icon
              type="material-community"
              name="account-group"
              size={nh(30)}
              color={COLORS.blue043142}
            />
          </View>
        )}
        <View style={styles.cardTextContent}>
          <Text
            variant="semibold15"
            color={COLORS.blue043142}
            numberOfLines={1}>
            {item?.name}
          </Text>
          {lastMessage ? (
            <Text
              variant="regular13"
              color={COLORS.grey777777}
              numberOfLines={1}
              style={styles.cardSubtitle}>
              {`${lastMessage?.sender?.username}: ${truncateString(
                lastMessage?.content,
              )}`}
            </Text>
          ) : (
            <Text
              variant="regular13"
              color={COLORS.grey999999}
              style={styles.cardSubtitleItalic}>
              No messages yet
            </Text>
          )}
        </View>
        <View style={styles.cardRightColumn}>
          <Text
            variant="regular10"
            color={COLORS.greyA0A0A0}
            style={{marginBottom: nh(5)}}>
            {formatDateforchat(lastMessage?.timestamp || item?.createdDate)}
          </Text>
          {item?.unreadMessageCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text variant="bold10" color={COLORS.whiteFFFFFF}>
                {item?.unreadMessageCount > 99
                  ? '99+'
                  : item?.unreadMessageCount}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  const RequestView = ({item}) => {
    return (
      <View style={styles.cardBase}>
        <Image
          source={{uri: item?.profilePicture || images.defaultUserProfile}}
          style={styles.profileImageLarge}
        />
        <View style={styles.cardTextContent}>
          <Text
            variant="semibold15"
            color={COLORS.blue043142}
            numberOfLines={1}>
            {item?.username}
          </Text>
          <Text
            variant="regular13"
            color={COLORS.grey777777}
            style={styles.cardSubtitle}>
            Wants to join your Inner Circle.
          </Text>
        </View>
        <View style={styles.cardActionsHorizontal}>
          <TouchableOpacity
            onPress={() => acceptRequest(item?.id, 'reject')}
            style={styles.iconButton}>
            <Icon
              type="antdesign"
              name="closecircleo"
              color={COLORS.redEA4335}
              size={nw(26)}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => acceptRequest(item?.id, 'accept')}
            style={[styles.iconButton, {marginLeft: nw(18)}]}>
            <Icon
              type="antdesign"
              name="checkcircleo"
              color={COLORS.green34A853}
              size={nw(26)}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loader) {
    return (
      <View style={styles.fullScreenLoaderContainer}>
        <ActivityIndicator size="large" color={COLORS.blue043142} />
      </View>
    );
  }

  const renderListFooter = (isLoadingPagination, hasMoreData) => {
    if (isLoadingPagination && hasMoreData) {
      return (
        <View style={styles.listLoader}>
          <ActivityIndicator size="small" color={COLORS.blue043142} />
        </View>
      );
    }
    return <View style={{height: nh(20)}} />;
  };

  const renderEmptyState = (
    image,
    title,
    subtitle,
    buttonText,
    onButtonPress,
  ) => (
    <View style={styles.emptyStateContainer}>
      <Image
        source={image}
        resizeMode="contain"
        style={styles.emptyStateImage}
      />
      <Text
        variant="semibold18"
        color={COLORS.blue043142}
        style={styles.emptyStateTitle}>
        {title}
      </Text>
      <Text
        variant="regular14"
        color={COLORS.grey777777}
        style={styles.emptyStateSubtitle}>
        {subtitle}
      </Text>
      {buttonText && onButtonPress && (
        <Button
          text={buttonText}
          onPress={onButtonPress}
          style={styles.emptyStateButton}
          textStyle={styles.emptyStateButtonText}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <ImageBackground
        source={images.ellipse}
        style={styles.headerBackground}
        resizeMode="stretch">
        <Header title="My Inner Circle" rightIcon={false} />
      </ImageBackground>

      <View style={styles.controlsContainer}>
        {selected === 0 && (
          <View style={styles.searchWrapper}>
            <CustomTextInput
              height={nh(48)}
              placeholder="Search in My Circle..."
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>
        )}
        <View style={styles.toggleWrapper}>
          <ToggleWithUnderline
            options={['MY CIRCLE', 'RECEIVED', 'SENT', 'GROUPS']}
            selected={selected}
            onToggle={onSelect}
          />
        </View>
      </View>

      <View style={styles.contentArea}>
        {selected === 0 && // MY CIRCLE
          (filteredUsers?.length > 0 ||
          (loading && myinnerCircle.length === 0 && !allFetched) ? ( // Show list or loader if initial loading for this tab
            <FlatList
              data={filteredUsers}
              onEndReached={() => {
                !allFetched && getmyInnerCircleList();
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() =>
                renderListFooter(
                  loading && myinnerCircle.length > 0,
                  !allFetched,
                )
              }
              renderItem={({item}) => {
                const userItemForChat = {
                  userId: item?.userId,
                  firstname: item?.firstname,
                  lastname: item?.lastname,
                  username: item?.username,
                };
                return (
                  <View style={styles.cardBase}>
                    <TouchableOpacity
                      onPress={() =>
                        navigationRef.navigate(Routes.OtherProfile, {
                          type: 'other',
                          id: item?.userId,
                        })
                      }>
                      <Image
                        source={{
                          uri:
                            item?.profilePicture || images.defaultUserProfile,
                        }}
                        style={styles.profileImageLarge}
                      />
                    </TouchableOpacity>
                    <View style={styles.cardTextContent}>
                      <TouchableOpacity
                        onPress={() =>
                          navigationRef.navigate(Routes.OtherProfile, {
                            type: 'other',
                            id: item?.userId,
                          })
                        }>
                        <Text
                          variant="semibold15"
                          color={COLORS.blue043142}
                          numberOfLines={1}>
                          {item?.username}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.cardActionsHorizontal}>
                      <TouchableOpacity
                        onPress={() =>
                          createConvo(item?.userId, userItemForChat)
                        }
                        style={styles.iconButton}>
                        <Icon
                          type="material-community"
                          name="chat-outline"
                          color={COLORS.blue043142}
                          size={nw(25)}
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => declineRequest(item?.userId)}
                        style={[styles.iconButton, {marginLeft: nw(18)}]}>
                        <Icon
                          type="material-community"
                          name="account-remove-outline"
                          color={COLORS.redEA4335}
                          size={nw(25)}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
              keyExtractor={item =>
                `mycircle-${item.userId?.toString() || Math.random()}`
              } // Ensure userId is unique
              contentContainerStyle={styles.listContentContainer}
            />
          ) : (
            renderEmptyState(
              images.norequest,
              'Your Circle is Empty',
              debouncedTerm
                ? `No results found for "${debouncedTerm}".`
                : 'Connect with others or check incoming requests.',
              !debouncedTerm ? 'View Requests' : null,
              !debouncedTerm ? () => onSelect(1) : null,
            )
          ))}

        {selected === 1 && // RECEIVED
          (innerCircle?.length > 0 ||
          (loading && innerCircle.length === 0 && !allrecivedFetched) ? (
            <FlatList
              data={innerCircle}
              onEndReached={() => {
                !allrecivedFetched && getInnerCirclerecivedList();
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() =>
                renderListFooter(
                  loading && innerCircle.length > 0,
                  !allrecivedFetched,
                )
              }
              renderItem={({item}) => <RequestView item={item} />}
              keyExtractor={item =>
                `received-${item.id?.toString() || Math.random()}`
              } // Ensure id is unique
              contentContainerStyle={styles.listContentContainer}
            />
          ) : (
            renderEmptyState(
              images.norequest,
              'No New Requests',
              'You have no pending inner circle requests at this time.',
              'Explore Community',
              () => navigation.navigate(Routes.Home),
            )
          ))}

        {selected === 2 && // SENT
          (sent?.length > 0 ||
          (loading && sent.length === 0 && !allsentFetched) ? (
            <FlatList
              data={sent}
              onEndReached={() => {
                !allsentFetched && getInnerCircleList();
              }}
              onEndReachedThreshold={0.5}
              ListFooterComponent={() =>
                renderListFooter(loading && sent.length > 0, !allsentFetched)
              }
              renderItem={({item}) => {
                const recipient =
                  item.recipient || item.targetUser || item.user || {};
                const recipientUsername = recipient.username || 'Unknown User';

                const recipientProfilePicture = recipient.profilePicture;
                const recipientDetailsForChat = {
                  userId: recipient.userId,
                  firstname: recipient.firstname,
                  lastname: recipient.lastname,
                  username: recipient.username,
                };

                return (
                  <View style={styles.cardBase}>
                    <Image
                      source={{
                        uri:
                          recipientProfilePicture || images.defaultUserProfile,
                      }}
                      style={styles.profileImageLarge}
                    />
                    <View style={styles.cardTextContent}>
                      <View style={styles.sentItemRow}>
                        <Text
                          variant="semibold15"
                          color={COLORS.blue043142}
                          numberOfLines={1}>
                          {recipientUsername}
                        </Text>
                        <Text variant="regular10" color={COLORS.greyA0A0A0}>
                          {getTimeAgo(item?.timestamp)}
                        </Text>
                      </View>
                      <View style={[styles.sentItemRow, {marginTop: nh(4)}]}>
                        <Text
                          variant="semibold12"
                          style={{
                            color:
                              item?.status?.toLowerCase() === 'pending'
                                ? COLORS.orangeFF8C00
                                : item?.status?.toLowerCase() === 'accepted'
                                ? COLORS.green34A853
                                : COLORS.grey777777,
                            textTransform: 'capitalize',
                          }}>
                          Status: {item?.status || 'N/A'}
                        </Text>
                        {item?.status?.toLowerCase() === 'pending' && (
                          <TouchableOpacity
                            onPress={() => Widraw(item.id)}
                            style={styles.withdrawButton}>
                            <Text variant="medium12" color={COLORS.blue043142}>
                              Withdraw
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                );
              }}
              keyExtractor={item => {
                // **IMPORTANT**: 'item.id' here MUST be the unique ID of the SENT REQUEST itself.
                // If 'item.id' is not unique for each request, this will cause warnings/bugs.
                // If your sent request objects have a different unique ID field (e.g., _id, requestId), use that.
                const key = item.id || item._id; // Prioritize item.id, fallback to item._id
                if (key) {
                  return `sent-${key.toString()}`;
                }
                // Fallback for items without a proper ID (should be avoided)
                console.warn('Sent item missing a reliable unique ID:', item);
                return `sent-random-${Math.random()
                  .toString(36)
                  .substring(2, 9)}`;
              }}
              contentContainerStyle={styles.listContentContainer}
            />
          ) : (
            renderEmptyState(
              images.norequest,
              'No Sent Requests',
              "You haven't sent any connection requests yet.",
              'Find People',
              () => {
                /* TODO: Navigate to User Discovery Screen */
              },
            )
          ))}

        {selected === 3 && // GROUPS
          (studyGroups?.length > 0 || (loading && studyGroups.length === 0) ? (
            <FlatList
              data={studyGroups}
              renderItem={({item}) => <GroupCard item={item} />}
              keyExtractor={item =>
                `group-${item._id?.toString() || Math.random()}`
              } // Ensure _id is unique
              contentContainerStyle={styles.listContentContainer}
              ListFooterComponent={() => <View style={{height: nh(20)}} />} // Groups not paginated
            />
          ) : (
            renderEmptyState(
              images.nochat,
              'No Study Groups Yet',
              'Join or create a study group to collaborate with others.',
              'Create a Study Group',
              () => chatmodelRef.current?.present(),
            )
          ))}
      </View>

      <ChatModal group={1} ref={chatmodelRef} />

      {selected === 3 && studyGroups?.length > 0 && !loading && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.8}
          onPress={() => chatmodelRef.current?.present()}>
          <Icon
            type="antdesign"
            name="plus"
            color={COLORS.whiteFFFFFF}
            size={nh(28)}
          />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.greyF8F9FA,
  },
  fullScreenLoaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.greyF8F9FA,
  },
  headerBackground: {
    width: DEVICE_WIDTH,
    height: nh(110),
  },
  controlsContainer: {
    paddingTop: nh(12),
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEDEDED,
  },
  searchWrapper: {
    paddingHorizontal: nw(16),
    marginBottom: nh(12),
  },
  toggleWrapper: {
    paddingHorizontal: nw(16),
    marginBottom: nh(12),
  },
  contentArea: {
    flex: 1,
  },
  listContentContainer: {
    paddingHorizontal: nw(16),
    paddingTop: nh(8),
    paddingBottom: nh(120),
  },
  cardBase: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
    marginBottom: nh(16),
    elevation: Platform.OS === 'android' ? 3 : 1,
    shadowColor: Platform.OS === 'ios' ? COLORS.greyA0A0A0 : COLORS.black000000,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.1,
    shadowRadius: Platform.OS === 'ios' ? 3 : 4,
  },
  profileImageLarge: {
    height: nw(54),
    width: nw(54),
    borderRadius: nw(27),
    marginRight: nw(16),
    backgroundColor: COLORS.greyEDEDED,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.greyD6D6D6,
  },
  cardTextContent: {
    flex: 1,
    justifyContent: 'center',
    marginRight: nw(10),
  },
  cardSubtitle: {
    marginTop: nh(3),
    fontSize: nw(13),
    color: COLORS.grey666666,
  },
  cardSubtitleItalic: {
    marginTop: nh(3),
    fontSize: nw(13),
    color: COLORS.grey999999,
    fontStyle: 'italic',
  },
  cardRightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    minWidth: nw(60),
    marginLeft: nw(5),
  },
  cardActionsHorizontal: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: nw(8),
    borderRadius: nw(20),
  },
  unreadBadge: {
    height: nh(22),
    minWidth: nh(22),
    borderRadius: nh(11),
    backgroundColor: COLORS.green34A853,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nw(7),
  },
  sentItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  withdrawButton: {
    paddingVertical: nh(5),
    paddingHorizontal: nw(10),
  },
  emptyStateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nw(30),
    paddingBottom: nh(60),
    backgroundColor: 'transparent',
  },
  emptyStateImage: {
    width: nw(170),
    height: nh(170),
    marginBottom: nh(30),
    opacity: 0.8,
  },
  emptyStateTitle: {
    textAlign: 'center',
    marginBottom: nh(12),
    fontSize: nw(19),
    fontWeight: '600',
    color: COLORS.blue043142,
  },
  emptyStateSubtitle: {
    textAlign: 'center',
    marginBottom: nh(30),
    lineHeight: nh(22),
    fontSize: nw(14.5),
    color: COLORS.grey555555,
  },
  emptyStateButton: {
    width: '90%',
    maxWidth: nw(320),
    height: nh(50),
    borderRadius: nw(10),
    backgroundColor: COLORS.blue043142,
  },
  emptyStateButtonText: {
    fontSize: nh(15),
    color: COLORS.whiteFFFFFF,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: nh(30),
    right: nw(20),
    width: nw(58),
    height: nw(58),
    borderRadius: nw(29),
    backgroundColor: COLORS.blue043142,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: COLORS.black000000,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  listLoader: {
    paddingVertical: nh(25),
    alignItems: 'center',
  },
});

export default InnerCircleRequest;
