import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  RefreshControl,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Dimensions,
  Platform,
  LayoutAnimation, // For simple list item animations
  UIManager, // For LayoutAnimation on Android
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolateColor,
  Extrapolate,
  interpolate,
  Easing,
  runOnJS, // To call JS functions from worklets
} from 'react-native-reanimated'; // Import Reanimated
import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {
  getHomePageData,
  getRecommendedContent,
  getProfile,
  getActiveQuiz,
} from '../../services/apiService';
import PostView from './Post';
import {Story} from './Story';
import {throttle} from '../../helper/commonFunctions';
import {useDispatch, useSelector} from 'react-redux';
import {actions} from '../../redux/reducers';
import UpdatePopup from '../../components/UpdatePopup';
import QuizstartedPopup from '../../components/QuizstartedPopup';
import Icon from 'react-native-vector-icons/Ionicons';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ---------------
// Data Transformation (No changes here)
// ---------------
const transformNormalContent = content => content;
const transformRecommendedContent = content => ({
  ...content,
  userId: content.userDetails,
  contentURL: content.contentURL || content.media || '',
  contentType: content.contentType || 'Video',
  captions: content.captions || '',
  heading: content.heading || '',
});
const processContentList = (contentList, isRecommended = false) =>
  contentList.map(item =>
    isRecommended
      ? transformRecommendedContent(item)
      : transformNormalContent(item),
  );

// ---------------
// Animated Skeleton Loader Component for Posts
// ---------------
const PostSkeleton = () => {
  const shimmerTranslateX = useSharedValue(-Dimensions.get('window').width);

  useEffect(() => {
    shimmerTranslateX.value = withRepeat(
      withTiming(Dimensions.get('window').width, {
        duration: 1200,
        easing: Easing.linear,
      }),
      -1, // Infinite repeat
      false, // Don't reverse
    );
  }, [shimmerTranslateX]);

  const animatedShimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: shimmerTranslateX.value}],
    };
  });

  return (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonUserInfo}>
          <View style={styles.skeletonLineShort} />
          <View style={styles.skeletonLineExtraShort} />
        </View>
      </View>
      <View style={styles.skeletonMedia} />
      <View style={styles.skeletonLineLong} />
      <View style={styles.skeletonLineMedium} />
      {/* Shimmer Overlay */}
      <Animated.View
        style={[
          styles.shimmerOverlay,
          animatedShimmerStyle,
        ]}
      />
    </View>
  );
};

// ---------------
// Animated Custom Segmented Control Component
// ---------------
const CustomSegmentedControl = ({
  segments,
  currentIndex,
  onChange,
  activeColor = COLORS.blue043142,
  inactiveColor = COLORS.greyF0F0F0, // Background of the whole control
  activeTextColor = COLORS.whiteFFFFFF,
  inactiveTextColor = COLORS.grey666666,
}) => {
  const itemWidth = Dimensions.get('window').width / segments.length - nw(16) / segments.length; // Adjust for margin/padding
  const translateX = useSharedValue(currentIndex * itemWidth);

  useEffect(() => {
    translateX.value = withTiming(currentIndex * itemWidth, {duration: 250});
  }, [currentIndex, itemWidth, translateX]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{translateX: translateX.value}],
    };
  });

  return (
    <View style={[styles.segmentedControlContainer, {backgroundColor: inactiveColor}]}>
      <Animated.View
        style={[
          styles.activeSegmentIndicator,
          {width: itemWidth, backgroundColor: activeColor},
          animatedIndicatorStyle,
        ]}
      />
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={segment}
          onPress={() => onChange(index)}
          style={[styles.segmentButton, {width: itemWidth}]}>
          <Text
            variant={currentIndex === index ? 'bold14' : 'medium14'}
            color={currentIndex === index ? activeTextColor : inactiveTextColor}>
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ---------------
// Animated Post Item Wrapper
// ---------------
const AnimatedPostItem = React.memo(({children, index}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20); // Start 20px below

  useEffect(() => {
    // Animate in with a delay based on index for a staggered effect
    const delay = index * 100; // Adjust delay as needed
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.quad), delay });
    translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.quad), delay });
  }, [opacity, translateY, index]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{translateY: translateY.value}],
    };
  });

  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
});


const Home = ({navigation, route}) => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);

  const [home, setHome] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showRecommended, setShowRecommended] = useState(false);
  const [visibleItems, setVisibleItems] = useState([]);
  const [activeQuiz, setActiveQuiz] = useState([]);

  const viewabilityConfig = useRef({itemVisiblePercentThreshold: 50, minimumViewTime: 300}).current;
  
  // onViewableItemsChanged to map item.id or item._id for visibleItems
   const onViewableItemsChanged = useRef(({viewableItems}) => {
    setVisibleItems(viewableItems.map(item => item.item._id || item.item.id || item.key));
  }).current;


  useEffect(() => {
    setInitialLoading(true);
    setHome([]);
    setPage(1);
    setHasMore(true);
    // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); // Animate list changes
    fetchData(1, true);
  }, [showRecommended]);

  useEffect(() => {
    getProfileData();
    getQuizData();
  }, []);

  const getQuizData = async () => {
    try {
      const res = await getActiveQuiz();
      setActiveQuiz(res?.data || []);
    } catch (error) {
      console.log(error?.response?.data?.message, 'getQuizData error');
    }
  };

  const getProfileData = async () => {
    try {
      const res = await getProfile('');
      if (res?.data?.userProfileInfo) {
        const newdata = {...userData, ...res.data.userProfileInfo};
        dispatch(actions.setUserData(newdata));
      }
    } catch (error) {
      console.log(error?.response?.data?.message, 'getProfileData error');
    }
  };

  const fetchData = async (pageNum, isInitialOrRefresh = false) => {
    if (!isInitialOrRefresh && (loadingMore || refreshing)) return; // Prevent multiple calls if already loading/refreshing
    
    if (isInitialOrRefresh) {
        if (pageNum === 1) { // Only set initialLoading true for the very first fetch or full refresh
            setInitialLoading(true);
        }
        setRefreshing(true);
    } else {
        setLoadingMore(true);
    }

    try {
      let responseData;
      if (showRecommended) {
        const {data} = await getRecommendedContent(pageNum, 10);
        responseData = data?.recommendations || [];
      } else {
        const {data} = await getHomePageData(pageNum, 10);
        responseData = data?.content || [];
      }

      const processedData = processContentList(responseData, showRecommended);
      
      // Configure LayoutAnimation before state update that changes list length
      // LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);


      if (processedData.length > 0) {
        setPage(prevPage => prevPage + 1);
        setHome(prevHome => isInitialOrRefresh ? processedData : [...prevHome, ...processedData]);
        setHasMore(true);
      } else {
        setHasMore(false);
        if (isInitialOrRefresh && pageNum === 1) setHome([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setHasMore(false);
    } finally {
      if (isInitialOrRefresh) {
        setRefreshing(false);
        setInitialLoading(false);
      }
      setLoadingMore(false);
    }
  };

  const handleRefresh = () => {
    setPage(1); // Reset page for refresh
    fetchData(1, true);
  };

  const handleLoadMore = useCallback(
    throttle(() => {
      if (hasMore && !loadingMore && !initialLoading && !refreshing) {
        fetchData(page, false);
      }
    }, 1000),
    [hasMore, loadingMore, initialLoading, refreshing, page, showRecommended],
  );

  const onProfilePress = useCallback(profileUserId => {
    navigation.navigate('Profile', {userId: profileUserId});
  }, [navigation]);

  const renderItem = useCallback(({item, index}) => {
    const itemKey = item._id || item.id || index.toString();
    const isVisible = visibleItems.includes(itemKey);
    
    return (
      <AnimatedPostItem index={index}>
        <PostView
          item={item}
          index={index}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          isVideoVisible={isVisible}
          onProfilePress={onProfilePress}
        />
      </AnimatedPostItem>
    );
  }, [visibleItems, selectedIndex, onProfilePress, setSelectedIndex]); // Added setSelectedIndex

  const ListHeaderComponent = () => (
    <View style={styles.listHeaderContainer}>
      <Story />
      <CustomSegmentedControl
        segments={['Home', 'Recommended']}
        currentIndex={showRecommended ? 1 : 0}
        onChange={index => {
          setShowRecommended(index === 1);
        }}
      />
      <Text variant="medium12" color={COLORS.grey666666} style={styles.feedTypeTitle}>
        {showRecommended ? 'Discover new content' : 'Latest from your network'}
      </Text>
    </View>
  );

  const keyExtractor = useCallback((item, index) => item._id || item.id || index.toString(), []);

  // Initial Skeleton Loading State
  if (initialLoading && page === 1 && home.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <MainHeader />
        <View style={styles.layer1}>
          <View style={styles.layer2}>
            <ListHeaderComponent />
            <FlatList
              data={[1, 2, 3]} // Dummy data for 3 skeleton items
              renderItem={() => <PostSkeleton />}
              keyExtractor={(item, idx) => `skeleton-${idx}`}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      <MainHeader />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <FlatList
            data={home}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
            // removeClippedSubviews={true} // Test carefully
            maxToRenderPerBatch={5}
            windowSize={11}
            initialNumToRender={5}
            updateCellsBatchingPeriod={50}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.blue043142}
                colors={[COLORS.blue043142]}
              />
            }
            ListHeaderComponent={ListHeaderComponent}
            renderItem={renderItem}
            ListFooterComponent={() =>
              loadingMore ? (
                <View style={styles.footerLoadingContainer}>
                  <PostSkeleton />
                </View>
              ) : null
            }
            ListEmptyComponent={
              !initialLoading && !refreshing && home.length === 0 ? (
                <View style={styles.emptyListContainer}>
                  <Icon name="compass-outline" size={nw(80)} color={COLORS.greyBBBBBB} />
                  <Text variant="bold18" color={COLORS.blue043142} style={styles.emptyTitle}>
                    Nothing to see here... yet!
                  </Text>
                  <Text variant="regular14" color={COLORS.grey666666} style={styles.emptySubtitle}>
                    {showRecommended
                      ? "We're looking for recommendations for you. Check back soon!"
                      : 'Follow creators or explore topics to fill your feed.'}
                  </Text>
                </View>
              ) : null
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.7}
          />
        </View>
      </View>
      <UpdatePopup activeQuiz={activeQuiz.length > 0} />
      {activeQuiz.length > 0 && activeQuiz[0] ? (
        <QuizstartedPopup activeQuiz={activeQuiz[0]} />
      ) : null}
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
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: nh(10),
    marginHorizontal: 0,
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    overflow: Platform.OS === 'android' ? 'hidden' : 'visible',
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteF9F9F9 || COLORS.whiteFFFFFF,
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingTop: nh(10),
  },
  // --- Skeleton Styles ---
  skeletonContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(16),
    marginBottom: nh(12),
    borderRadius: nh(12),
    marginHorizontal: nw(16),
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    overflow: 'hidden', // Important for shimmer effect
  },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: nh(12) },
  skeletonAvatar: { width: nw(44), height: nw(44), borderRadius: nw(22), backgroundColor: COLORS.greyE0E0E0 },
  skeletonUserInfo: { marginLeft: nw(10) },
  skeletonLineShort: { width: nw(120), height: nh(12), backgroundColor: COLORS.greyE0E0E0, borderRadius: nh(4), marginBottom: nh(6) },
  skeletonLineExtraShort: { width: nw(80), height: nh(10), backgroundColor: COLORS.greyE0E0E0, borderRadius: nh(4) },
  skeletonMedia: { width: '100%', height: nh(220), backgroundColor: COLORS.greyE0E0E0, borderRadius: nh(8), marginBottom: nh(12) },
  skeletonLineLong: { width: '90%', height: nh(10), backgroundColor: COLORS.greyE0E0E0, borderRadius: nh(4), marginBottom: nh(6) },
  skeletonLineMedium: { width: '70%', height: nh(10), backgroundColor: COLORS.greyE0E0E0, borderRadius: nh(4) },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    width: '50%', // Width of the shimmer gradient
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Light color for shimmer
    // For a more pronounced gradient shimmer:
    // You might need a linear gradient component here if you want a true gradient
    // For simplicity, a semi-transparent overlay is used.
    // A true gradient would require a library like react-native-linear-gradient
    // and applying it to this Animated.View.
  },
  // --- Segmented Control Styles ---
  segmentedControlContainer: {
    flexDirection: 'row',
    borderRadius: nh(10), // Slightly more rounded
    marginHorizontal: nw(16),
    marginVertical: nh(15),
    // Removed explicit backgroundColor, will be set by inactiveColor prop
    // borderWidth: 1, // Can be removed if activeIndicator provides enough visual separation
    // borderColor: COLORS.greyDDDDDD,
    position: 'relative', // For absolute positioning of the indicator
    height: nh(42), // Fixed height for consistency
  },
  activeSegmentIndicator: {
    position: 'absolute',
    top: nh(3), // Small margin from top
    bottom: nh(3), // Small margin from bottom
    // width is calculated dynamically
    borderRadius: nh(7), // Rounded indicator
    // backgroundColor is set by activeColor prop
    height: nh(36), // Height of the indicator
  },
  segmentButton: {
    flex: 1, // Each button takes equal space
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor: 'transparent', // Handled by indicator
    zIndex: 1, // Ensure text is above the indicator
    // borderRadius: nh(7), // Not needed on button itself if indicator is separate
    // margin:1, // Not needed with absolute positioned indicator
    height: '100%',
  },
  // --- List Header Styles ---
  listHeaderContainer: {
    paddingBottom: nh(5),
    backgroundColor: COLORS.whiteF9F9F9 || COLORS.whiteFFFFFF,
  },
  feedTypeTitle: {
    textAlign: 'center',
    paddingBottom: nh(10),
    fontSize: nw(13), // Slightly larger for clarity
    color: COLORS.grey888888, // Slightly lighter
  },
  // --- Empty List Styles ---
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: nw(30),
    minHeight: DEVICE_HEIGHT * 0.5,
  },
  emptyTitle: { marginTop: nh(20), marginBottom: nh(10), textAlign: 'center' },
  emptySubtitle: { textAlign: 'center', lineHeight: nh(20), marginBottom: nh(20) },
  exploreButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(12),
    paddingHorizontal: nw(30),
    borderRadius: nh(25),
    marginTop: nh(10),
  },
  // --- Footer Loading Styles ---
  footerLoadingContainer: {
    paddingVertical: nh(10),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

