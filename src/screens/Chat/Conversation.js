import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image as PlatformImage, // Using Platform Image
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import Text from '../../components/Text'; // Your custom Text component
import Routes from '../../helper/routes';
import {
  getconversation,
  getGrouprequest,
  getStudyGroups,
} from '../../services/apiService';
import {useSelector} from 'react-redux';
import Button from '../../components/Button'; // Your custom Button component
import {images} from '../../assets/images'; // Ensure images.nochat, images.defaultUser exists
import ChatModal from './ChatModal'; // Assuming this is the enhanced ChatModal
import {formatDateforchat} from '../../helper/commonFunctions';
import {useFocusEffect} from '@react-navigation/native';
import ToggleWithUnderline from '../../components/TogglewithUnderline';
import Icon from '../../helper/icon';
import {io} from 'socket.io-client';

// --- Theme Colors (adjust to your actual COLORS object) ---
const THEME = {
  screenBackground: COLORS.greyF8F9FA || '#F8F9FA',
  headerBackground: COLORS.yellowF5BE00 || '#FFCC00',
  cardBackground: COLORS.whiteFFFFFF || '#FFFFFF',
  textColorPrimary: COLORS.blue043142 || '#003366',
  textColorSecondary: COLORS.grey777777 || '#666666',
  textColorTertiary: COLORS.grey999999 || '#999999',
  unreadBadgeBackground: COLORS.green34A853 || '#34A853',
  unreadBadgeText: COLORS.whiteFFFFFF || '#FFFFFF',
  separatorLine: COLORS.greyEDEDED || '#EDEDED',
  fabColor: COLORS.blue043142 || '#007AFF',
  avatarPlaceholderBg: COLORS.greyD6D6D6,
  avatarPlaceholderText: COLORS.blue043142,
  pendingRequestBannerBg: `${COLORS.blue043142}1A` || 'rgba(0,51,102,0.1)',
  pendingRequestBannerBorder: COLORS.blue043142 || '#003366',
};

// --- Reusable List Item Card for 1:1 Conversations ---
const ConversationItemCard = React.memo(({item, onPress}) => {
  const user = item?.members?.[0]; // Assuming the other member is always the first in the array for 1:1
  const lastMessage = item?.lastMessage;
  const initials = `${user?.firstname?.charAt(0)?.toUpperCase() || ''}${user?.lastname?.charAt(0)?.toUpperCase() || ''}`;

  return (
    <Pressable style={styles.listItemContainer} onPress={onPress}>
      {user?.profilePicture ? (
        <PlatformImage source={{uri: user.profilePicture}} style={styles.profileImage} />
      ) : (
        <View style={[styles.profileImage, styles.avatarPlaceholder]}>
          <Text variant="semibold16" color={THEME.avatarPlaceholderText}>
            {initials || '??'}
          </Text>
        </View>
      )}
      <View style={styles.itemTextContainer}>
        <Text variant="semibold14" color={THEME.textColorPrimary} numberOfLines={1}>
          {`${user?.firstname || ''} ${user?.lastname || user?.username || 'User'}`}
        </Text>
        {lastMessage?.message ? (
          <Text variant="regular13" color={THEME.textColorSecondary} numberOfLines={1}>
            {lastMessage.message}
          </Text>
        ) : lastMessage?.mediaType ? (
            <Text variant="regular13Italic" color={THEME.textColorSecondary} numberOfLines={1}>
                {lastMessage.mediaType.includes('image') ? 'Photo' : 'Video'}
            </Text>
        ) : (
          <Text variant="regular13Italic" color={THEME.textColorTertiary}>
            No messages yet
          </Text>
        )}
      </View>
      <View style={styles.itemTrailingContainer}>
        {lastMessage?.updatedAt && (
          <Text variant="regular10" color={THEME.textColorTertiary}>
            {formatDateforchat(lastMessage.updatedAt)}
          </Text>
        )}
        {item?.unreadMessageCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text variant="bold10" color={THEME.unreadBadgeText}>
              {item.unreadMessageCount > 99 ? '99+' : item.unreadMessageCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});

// --- Reusable List Item Card for Study Groups ---
const StudyGroupItemCard = React.memo(({item, onPress}) => {
  const lastMessage = item?.lastMessage;
  const groupName = item?.name || 'Study Group';

  return (
    <Pressable style={styles.listItemContainer} onPress={onPress}>
      {item?.profilePicture ? (
        <PlatformImage
          source={{uri: `${item.profilePicture}?timestamp=${new Date().getTime()}`}}
          style={styles.profileImage}
        />
      ) : (
        <View style={[styles.profileImage, styles.avatarPlaceholder]}>
          <Icon type="material-community" name="account-group" size={nw(24)} color={THEME.avatarPlaceholderText} />
        </View>
      )}
      <View style={styles.itemTextContainer}>
        <Text variant="semibold14" color={THEME.textColorPrimary} numberOfLines={1}>
          {groupName}
        </Text>
        {lastMessage?.content ? (
          <Text variant="regular13" color={THEME.textColorSecondary} numberOfLines={1}>
            {`${lastMessage.sender?.username || 'Someone'}: ${lastMessage.content}`}
          </Text>
        ) : (
          <Text variant="regular13Italic" color={THEME.textColorTertiary}>
            No messages yet
          </Text>
        )}
      </View>
      <View style={styles.itemTrailingContainer}>
        {(lastMessage?.timestamp || item?.createdDate) && (
            <Text variant="regular10" color={THEME.textColorTertiary}>
                {formatDateforchat(lastMessage?.timestamp || item.createdDate)}
            </Text>
        )}
        {item?.unreadMessageCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text variant="bold10" color={THEME.unreadBadgeText}>
              {item.unreadMessageCount > 99 ? '99+' : item.unreadMessageCount}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
});


const Conversation = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const [initialScreenLoader, setInitialScreenLoader] = useState(true);
  const [selectedTab, setSelectedTab] = useState(0); // 0 for Chats, 1 for Study Groups
  const [conversations, setConversations] = useState([]);
  const [studyGroups, setStudyGroups] = useState([]);
  const chatmodelRef = useRef(null);

  const [allConversationsFetched, setAllConversationsFetched] = useState(false);
  const [isLoadingMoreConversations, setIsLoadingMoreConversations] = useState(false);
  const [groupRequests, setGroupRequests] = useState([]);
  const conversationPage = useRef(1);
  const socketRef = useRef(null);

  // Fetch initial data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      conversationPage.current = 1; // Reset page for conversations
      setConversations([]); // Clear previous conversations
      setAllConversationsFetched(false);
      fetchInitialConversations();
      fetchStudyGroupsData(); // Fetch study groups (assuming not paginated for now)
      loadGroupRequestsData();
    }, []),
  );

  // Handle deep linking or navigation params to open chat modal
  useEffect(() => {
    if (route?.params?.from === 'innerCircle') {
      setSelectedTab(1); // Switch to Study Groups tab
      const timer = setTimeout(() => {
        chatmodelRef.current?.present();
      }, 500); // Delay to ensure tab switch UI updates
      return () => clearTimeout(timer);
    }
  }, [route?.params?.from]);


  // --- Socket.IO Setup and Event Handling ---
  useEffect(() => {
    if (!userData?.token) {
      console.warn("ConversationScreen: No user token, socket not connecting.");
      return;
    }

    // **IMPORTANT**: Verify this URL and namespace with your backend.
    const socketInstance = io('http://192.168.1.8:3000/api/', {
      auth: {token: userData.token},
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });
    socketRef.current = socketInstance;

    socketInstance.on('connect', () => {
      console.log('ConversationScreen: Socket connected.');
      // No specific room to join here, as this screen listens for updates to *any* relevant conversation/group
    });

    socketInstance.on('conversationDetailUpdate', (updatedConvData) => {
      // console.log('Socket: conversationDetailUpdate', updatedConvData);
      setConversations(prevConvs => {
        const index = prevConvs.findIndex(c => c.conversationId === updatedConvData.conversationId);
        let newConvs;
        if (index !== -1) { // Existing conversation updated
          const updatedItem = {...prevConvs[index], ...updatedConvData};
          newConvs = [...prevConvs];
          newConvs.splice(index, 1); // Remove old
          newConvs.unshift(updatedItem); // Add updated to top
        } else { // New conversation
          newConvs = [updatedConvData, ...prevConvs];
        }
        return newConvs;
      });
    });

    socketInstance.on('groupInfoUpdates', (updatedGroupData) => {
      // console.log('Socket: groupInfoUpdates', updatedGroupData);
      setStudyGroups(prevGroups => {
        const index = prevGroups.findIndex(g => g._id === updatedGroupData.groupId); // Assuming groupId is the ID
        let newGroups;
        if (index !== -1) { // Existing group updated
          const updatedItem = {...prevGroups[index], ...updatedGroupData, timestamp: updatedGroupData.createdDate}; // Map timestamp if needed
          newGroups = [...prevGroups];
          newGroups.splice(index, 1);
          newGroups.unshift(updatedItem);
        } else { // New group
          // If it's a new group not yet in the list, you might need to fetch its full details
          // or ensure the socket event provides enough info. For now, just adding it.
          // Consider fetching full group list if a new group appears that wasn't fetched initially.
          newGroups = [{...updatedGroupData, _id: updatedGroupData.groupId, timestamp: updatedGroupData.createdDate}, ...prevGroups];
        }
        return newGroups;
      });
    });
    
    socketInstance.on('disconnect', (reason) => console.log('ConversationScreen: Socket disconnected -', reason));
    socketInstance.on('connect_error', (err) => console.error('ConversationScreen: Socket connection error -', err.message));

    return () => {
      if (socketInstance) {
        console.log('ConversationScreen: Disconnecting socket.');
        socketInstance.disconnect();
        socketRef.current = null;
      }
    };
    // CRITICAL: Removed `conversations` and `studyGroups` from dependencies.
    // Socket connection should be stable, listeners handle updates.
  }, [userData?.token]);


  const fetchInitialConversations = async () => {
    conversationPage.current = 1; // Reset page for conversations
    setConversations([]);
    setAllConversationsFetched(false);
    await fetchConversationsData();
  };

  const fetchConversationsData = async () => {
    if (isLoadingMoreConversations || allConversationsFetched) return;
    setIsLoadingMoreConversations(true);
    if (conversationPage.current === 1) setInitialScreenLoader(true); // Show full loader only for first page

    try {
      const {data} = await getconversation(conversationPage.current);
      const newConversations = data?.conversations || [];

      setConversations(prev =>
        conversationPage.current === 1 ? newConversations : [...prev, ...newConversations],
      );
      if (conversationPage.current >= data?.totalPages || newConversations.length === 0) {
        setAllConversationsFetched(true);
      }
      if(newConversations.length > 0) {
        conversationPage.current += 1;
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      // showToast({ type: 'error', title: 'Failed to load chats' });
    } finally {
      setInitialScreenLoader(false);
      setIsLoadingMoreConversations(false);
    }
  };

  const fetchStudyGroupsData = async () => {
    // Assuming study groups are not paginated for now
    // If they are, implement similar logic to fetchConversationsData
    if (selectedTab === 1 && studyGroups.length === 0) setInitialScreenLoader(true);
    try {
      const {data} = await getStudyGroups();
      setStudyGroups(data || []);
    } catch (error) {
      console.error('Error fetching study groups:', error);
      // showToast({ type: 'error', title: 'Failed to load groups' });
    } finally {
       if (selectedTab === 1) setInitialScreenLoader(false);
    }
  };

  const loadGroupRequestsData = async () => {
    try {
      const res = await getGrouprequest();
      setGroupRequests(res?.data?.requests || []);
    } catch (error) {
      console.log('Error fetching group requests:', error);
    }
  };

  const handleTabSelect = useCallback((index) => {
    setSelectedTab(index);
    if (index === 0 && conversations.length === 0 && !allConversationsFetched) { // Chats tab
      fetchInitialConversations();
    } else if (index === 1 && studyGroups.length === 0) { // Study Groups tab
      fetchStudyGroupsData();
    }
  }, [conversations.length, studyGroups.length, allConversationsFetched]);


  const renderListItem = ({item}) => {
    if (selectedTab === 0) { // Chats
      return (
        <ConversationItemCard
          item={item}
          onPress={() =>
            navigation.navigate(Routes.Chat, {
              chatId: item?.conversationId,
              data: `${item?.members[0]?.firstname || ''} ${item?.members[0]?.lastname || item?.members[0]?.username || 'Chat'}`,
            })
          }
        />
      );
    } else { // Study Groups
      return (
        <StudyGroupItemCard
          item={item}
          onPress={() =>
            navigation.navigate(Routes.GroupChat, { // Assuming GroupChat route exists
              groupId: item?._id,
              data: item, // Pass group data for header, etc.
            })
          }
        />
      );
    }
  };

  const ListEmptyComponent = useMemo(() => (
    <View style={styles.emptyListContainer}>
      <PlatformImage source={images.nochat} resizeMode="contain" style={styles.emptyImage} />
      <Text variant="semibold18" color={THEME.textColorPrimary} style={styles.emptyTitle}>
        {selectedTab === 0 ? 'No Chats Yet' : 'No Study Groups Yet'}
      </Text>
      <Text variant="regular14" color={THEME.textColorSecondary} style={styles.emptySubtitle}>
        {selectedTab === 0
          ? 'Start a conversation and connect with fellow learners. It’s more fun learning together!'
          : 'Join or create a study group to collaborate with others. Learning is better together!'}
      </Text>
      <Button
        text={selectedTab === 0 ? 'Start a New Chat' : 'Create a Study Group'}
        onPress={() => chatmodelRef.current?.present()}
        style={styles.emptyButton}
        textStyle={styles.emptyButtonText}
      />
    </View>
  ), [selectedTab]);


  const dataToDisplay = selectedTab === 0 ? conversations : studyGroups;

  if (initialScreenLoader && dataToDisplay.length === 0) {
    return (
      <View style={styles.fullScreenLoaderContainer}>
        <ActivityIndicator size="large" color={THEME.fabColor} />
        <Text variant="medium14" style={{marginTop: nh(10), color: THEME.textColorSecondary}}>
          Loading {selectedTab === 0 ? 'Conversations' : 'Study Groups'}...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={THEME.headerBackground} />
      <Header title="Messages" /> {/* Changed title to Messages for clarity */}

      <View style={styles.contentWrapper}>
        {/* Removed layer1 & layer2 for flatter structure, apply bg to contentWrapper */}
        <ToggleWithUnderline
          options={['CHATS', 'STUDY GROUPS']}
          onToggle={handleTabSelect} // Use the new handler
          selected={selectedTab} // Control selection state
        />

        {selectedTab === 1 && groupRequests?.length > 0 && (
          <TouchableOpacity
            style={styles.pendingRequestBanner}
            onPress={() => navigation.navigate(Routes.groupRequest, {data: groupRequests})}>
            <Text variant="medium13" color={THEME.textColorPrimary}>
              You have {groupRequests.length} study group request{groupRequests.length > 1 ? 's' : ''} pending.
            </Text>
            <Icon type="material" name="keyboard-arrow-right" size={nw(22)} color={THEME.textColorPrimary} />
          </TouchableOpacity>
        )}

        <FlatList
          data={dataToDisplay}
          renderItem={renderListItem}
          keyExtractor={item => selectedTab === 0 ? item.conversationId : item._id}
          contentContainerStyle={styles.listContentContainer}
          onEndReached={() => {
            if (selectedTab === 0 && !isLoadingMoreConversations && !allConversationsFetched) {
              fetchConversationsData();
            }
            // Add pagination for study groups if needed
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isLoadingMoreConversations && selectedTab === 0 ? (
              <ActivityIndicator style={{marginVertical: nh(15)}} size="small" color={THEME.fabColor} />
            ) : null
          }
          ListEmptyComponent={!initialScreenLoader ? ListEmptyComponent : null} // Show empty only after initial load attempt
          extraData={selectedTab} // To re-render if tab changes and data source differs
        />

        {/* FAB to open ChatModal */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => chatmodelRef.current?.present()}>
          <Icon type="material-community" name="plus" size={nw(28)} color={COLORS.whiteFFFFFF} />
        </TouchableOpacity>
      </View>
      <ChatModal
        group={selectedTab === 1} // Pass true if "Study Groups" tab is active
        ref={chatmodelRef}
        // Pass other necessary props to ChatModal, e.g., for editing groups if applicable from here
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.headerBackground, // Match header for seamless top area
  },
  fullScreenLoaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.screenBackground,
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: THEME.screenBackground,
    // The layered look can be achieved by styling Header and contentWrapper distinctly
    // borderTopLeftRadius: nh(25), // If you want the content area to be rounded
    // borderTopRightRadius: nh(25),
    // marginTop: nh(-20), // Example to pull it under a custom header
    paddingTop: nh(10), // General padding for content below header/toggle
  },
  pendingRequestBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: THEME.pendingRequestBannerBg,
    paddingVertical: nh(10),
    paddingHorizontal: nw(12),
    borderRadius: nw(8),
    marginHorizontal: nw(16),
    marginBottom: nh(12),
    borderWidth: 1,
    borderColor: THEME.pendingRequestBannerBorder,
  },
  listContentContainer: {
    paddingHorizontal: nw(16),
    paddingBottom: nh(80), // Space for FAB and bottom nav
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(12),
    backgroundColor: THEME.cardBackground, // Individual card background
    // borderRadius: nw(10), // Optional: if you want rounded cards
    // marginBottom: nh(10), // Optional: if you want space between cards
    borderBottomWidth: 1, // Separator line
    borderBottomColor: THEME.separatorLine,
  },
  profileImage: {
    width: nw(52),
    height: nw(52),
    borderRadius: nw(26),
    marginRight: nw(12),
    borderWidth: 0.5,
    borderColor: THEME.separatorLine,
  },
  avatarPlaceholder: {
    backgroundColor: THEME.avatarPlaceholderBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextContainer: {
    flex: 1, // Takes available space for text
    justifyContent: 'center',
  },
  itemTrailingContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: nw(10),
    minWidth: nw(60), // Ensure some space for timestamp/badge
  },
  unreadBadge: {
    backgroundColor: THEME.unreadBadgeBackground,
    borderRadius: nw(10),
    paddingHorizontal: nw(7),
    paddingVertical: nh(2.5),
    marginTop: nh(4),
    minWidth: nw(20), // Ensure badge is circular for single digits
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyListContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nw(30),
    paddingBottom: nh(50), // Space from bottom if FAB is hidden
    marginTop: DEVICE_HEIGHT * 0.1, // Push it down a bit
  },
  emptyImage: {
    width: DEVICE_WIDTH * 0.5,
    height: DEVICE_WIDTH * 0.5,
    marginBottom: nh(25),
    opacity: 0.7,
  },
  emptyTitle: {
    textAlign: 'center',
    marginBottom: nh(10),
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: nh(25),
    lineHeight: nh(20),
  },
  emptyButton: {
    backgroundColor: THEME.fabColor,
    paddingHorizontal: nw(30), // Make button wider
    height: nh(48),
    borderRadius: nw(24),
  },
  emptyButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(15),
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: nh(25),
    right: nw(20),
    width: nw(58),
    height: nw(58),
    borderRadius: nw(29),
    backgroundColor: THEME.fabColor,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default Conversation;
