import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  Switch,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {
  getHomePageData,
  getRecommendedContent,
  getProfile,
} from '../../services/apiService';
import PostView from './Post';
import {Story} from './Story';
import {throttle} from '../../helper/commonFunctions';
import {useDispatch, useSelector} from 'react-redux';
import {actions} from '../../redux/reducers';
import UpdatePopup from '../../components/UpdatePopup';

// ----------------------
// Data transformation functions
// ----------------------

// For normal homepage content, the data is already in the expected format.
const transformNormalContent = content => {
  return content;
};

// For recommended content, ensure that fields required by PostView exist.
const transformRecommendedContent = content => {
  console.log('Transforming recommended content:', content);
  return {
    ...content,
    userId: content.userDetails, // Map userDetails to userId so PostView gets expected user info
    contentURL: content.contentURL || content.media || '', // Ensure contentURL is present
    contentType: content.contentType || 'Video', // Provide a default if missing
    captions: content.captions || '',
    heading: content.heading || '',
    // Add more fields as needed based on what PostView expects
  };
};

// Helper to transform an entire list of content based on content type.
const processContentList = (contentList, isRecommended = false) => {
  return contentList.map(item =>
    isRecommended
      ? transformRecommendedContent(item)
      : transformNormalContent(item),
  );
};

const Home = ({navigation, route}) => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);

  // Home feed state variables
  const [home, setHome] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Toggle state: if true, show recommended posts; otherwise, show normal homepage posts
  const [showRecommended, setShowRecommended] = useState(false);
  const [visibleItems, setVisibleItems] = useState([]);

  // Configure viewability for FlatList
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  }).current;

  const onViewableItemsChanged = useRef(({viewableItems}) => {
    setVisibleItems(viewableItems.map(item => item.key));
  }).current;

  // On mount or when the toggle changes, refresh data and reset hasMore
  useEffect(() => {
    refreshData();
    setHasMore(true);
  }, [showRecommended]);

  // On mount, fetch user profile
  useEffect(() => {
    getProfileData();
  }, []);

  const getProfileData = async () => {
    try {
      const res = await getProfile('');
      const newdata = {...userData, ...res?.data?.userProfileInfo};
      dispatch(actions.setUserData(newdata));
    } catch (error) {
      console.log(error?.response?.data?.message, 'errormsg');
    }
  };

  // Refresh data on pull-to-refresh or toggle change
  const refreshData = async () => {
    setPage(1);
    setRefreshing(true);
    if (showRecommended) {
      console.log('Fetching recommended content, page 1');
      try {
        const {data} = await getRecommendedContent(1, 10);
        console.log('Recommended content data:', data);
        // Transform recommended content to match expected structure
        const processedData = processContentList(
          data?.recommendations || [],
          true,
        );
        setHome(processedData);
        setHasMore(processedData.length > 0);
      } catch (error) {
        console.log('Error fetching recommended content:', error);
      }
    } else {
      console.log('Fetching homepage content, page 1');
      await loadHomePageData(1, true);
    }
    setRefreshing(false);
  };

  // Normal homepage data fetching (with pagination)
  const loadHomePageData = async (pageNum, refresh = false) => {
    try {
      const {data} = await getHomePageData(pageNum, 10);
      // console.log("Homepage data for page", pageNum, data);
      if (data?.content.length > 0) {
        setPage(prevPage => prevPage + 1);
        const processedContent = processContentList(data.content, false);
        if (refresh) {
          setHome(processedContent);
        } else {
          setHome(prev => [...prev, ...processedContent]);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.log('homePageData error:', {refresh}, error);
    } finally {
      setLoading(false);
    }
  };

  // Load more data when the end is reached
  const loadMoreData = async () => {
    if (showRecommended) {
      try {
        const {data} = await getRecommendedContent(page, 10);
        console.log('Load more recommended content:', data);
        if (data?.recommendations?.length > 0) {
          setPage(prev => prev + 1);
          const processedData = processContentList(data.recommendations, true);
          setHome(prev => [...prev, ...processedData]);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        console.log('Error fetching recommended content:', error);
      }
    } else {
      await loadHomePageData(page);
    }
  };

  // Throttle onEndReached to avoid multiple calls
  const handleOnReachEnd = useCallback(
    throttle(() => {
      if (hasMore) {
        setLoading(true);
        loadMoreData();
      }
      console.log('handleOnReachEnd triggered');
    }, 1000),
    [hasMore, page, showRecommended],
  );

  // Callback when a user taps a profile picture
  const onProfilePress = profileUserId => {
    console.log('Navigating to profile of:', profileUserId);
    navigation.navigate('Profile', {userId: profileUserId});
  };

  // Render each post item
  const renderItem = ({item, index}) => {
    const isVisible = visibleItems.includes(index.toString());
    return (
      <PostView
        item={item}
        index={index}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        isVideoVisible={isVisible}
        onProfilePress={onProfilePress} // Pass the callback to PostView
      />
    );
  };

  // ListHeader with Story component and a right-aligned small toggle for Recommended Posts.
  const ListHeader = () => (
    <View style={styles.listHeaderContainer}>
      <Story />
      <View style={styles.headerRow}>
        <View style={styles.rightAlignedToggle}>
          <Text variant="semibold12" color={COLORS.blue043142}>
            Recommended Posts
          </Text>
          <Switch
            value={showRecommended}
            onValueChange={value => {
              console.log('Toggle set to:', value);
              setShowRecommended(value);
            }}
            trackColor={{false: '#ccc', true: COLORS.blue043142}}
            thumbColor={showRecommended ? COLORS.whiteFFFFFF : '#f4f3f4'}
            style={styles.smallSwitch}
          />
        </View>
      </View>
      <Text
        variant="semibold12"
        style={styles.feedHeading}
        color={COLORS.blue043142}>
        {/* Optionally add a heading here */}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <MainHeader />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <FlatList
            data={home}
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            removeClippedSubviews={true}
            maxToRenderPerBatch={3}
            windowSize={5}
            initialNumToRender={2}
            updateCellsBatchingPeriod={100}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setPage(1);
                  refreshData();
                }}
                tintColor={COLORS.blue043142}
              />
            }
            ListHeaderComponent={ListHeader}
            renderItem={renderItem}
            ListFooterComponent={() =>
              loading && (
                <View
                  style={{
                    height: page > 1 ? nh(40) : DEVICE_HEIGHT,
                    paddingVertical: nh(20),
                    backgroundColor: COLORS.whiteFFFFFF,
                  }}>
                  <ActivityIndicator size={'small'} color={COLORS.blue043142} />
                </View>
              )
            }
            ListEmptyComponent={
              !loading && (
                <View style={styles.emptyList}>
                  <Text
                    variant="semibold16"
                    style={{width: '100%', textAlign: 'center'}}>
                    Your Home Feed is empty right now. Start exploring and
                    following users from the search page to see their content
                    here!
                  </Text>
                </View>
              )
            }
            onEndReached={handleOnReachEnd}
            onEndReachedThreshold={0.5}
          />
        </View>
      </View>
      <UpdatePopup />
    </SafeAreaView>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(26),
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
    paddingTop: nh(20),
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: nh(28),
    backgroundColor: COLORS.whiteFFFFFF,
  },
  listHeaderContainer: {
    paddingHorizontal: nw(16),
    paddingTop: nh(10),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  rightAlignedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallSwitch: {
    transform: [{scaleX: 0.8}, {scaleY: 0.8}],
    marginLeft: nw(4),
  },
  feedHeading: {
    paddingVertical: nh(4),
    marginHorizontal: nw(16),
    fontSize: 12,
  },
});
