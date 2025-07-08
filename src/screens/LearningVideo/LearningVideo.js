import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import {getHomePageData, getvideoPageData} from '../../services/apiService';
import {throttle} from '../../helper/commonFunctions';
import PostView from '../Home/Post';
import Header from '../../components/Header';
import mixpanel from '../../helper/mixpanelClient';

const LearningVideo = () => {
  const [video, setVideo] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const [visibleItems, setVisibleItems] = useState([]);

  // Configure viewability
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50, // Item is considered visible when 50% in view
    minimumViewTime: 300, // Must be visible for at least 300ms
  }).current;

  const onViewableItemsChanged = useRef(({viewableItems}) => {
    // Update the list of visible items
    setVisibleItems(viewableItems.map(item => item.key));
  }).current;

  useEffect(() => {
    mixpanel.track('Landed Learning Video Page');
    videoPageData(1);
    setHasMore(true);
  }, []);

  const videoPageData = async (pageNum, refresh = false) => {
    try {
      const {data} = await getHomePageData(pageNum, 15);
      if (data?.content?.length > 0) {
        const processedContent = data.content.map(item => ({
          ...item,
          contentType: item.contentType || 'Video',
          contentURL: item.contentURL || '',
          isPlaying: false,
        }));
        const videoFilter = processedContent?.filter(
          f => f.contentType === 'Video',
        );
        setPage(prevPage => prevPage + 1);
        if (refresh) {
          setVideo(videoFilter);
        } else {
          setVideo(prev => [...prev, ...videoFilter]);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.log(
        'videoPageData error:',
        {refresh},
        error?.response?.data || error,
      );
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleOnReachEnd = useCallback(
    throttle(() => {
      if (hasMore) {
        setLoading(true);
        videoPageData(page);
      }
    }, 1000),
    [hasMore, page],
  );

  const renderItem = ({item, index}) => {
    const isVisible = visibleItems.includes(index.toString());
    return (
      <PostView
        item={item}
        index={index}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        isVideoVisible={isVisible}
      />
    );
  };

  const handleRefresh = useCallback(() => {
    setPage(1);
    setRefreshing(true);
    videoPageData(1, true);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title={'Learning Videos'} />
      {/* <View style={{height: nh(10), backgroundColor: COLORS.whiteFFFFFF}} /> */}
      <FlatList
        data={video}
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        removeClippedSubviews={true}
        maxToRenderPerBatch={3}
        windowSize={5}
        initialNumToRender={2}
        updateCellsBatchingPeriod={100}
        contentContainerStyle={{
          backgroundColor: COLORS.whiteFFFFFF,
          paddingTop: nh(15),
        }}
        //removeClippedSubviews={true}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.blue043142}
          />
        }
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
                style={{width: '100%', textAlign: 'center', marginTop: nh(28)}}>
                {
                  'Your Learning Video Feed is empty right now. Start exploring and following users from the search page to see their content here!'
                }
              </Text>
            </View>
          )
        }
        onEndReached={handleOnReachEnd}
        // onEndReachedThreshold={0.5}
        // removeClippedSubviews={true}
        // maxToRenderPerBatch={5}
        // windowSize={5}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  emptyList: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    // marginTop: nh(28),
    height: DEVICE_HEIGHT,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  loadingContainer: {
    paddingVertical: nh(20),
    backgroundColor: COLORS.whiteFFFFFF,
  },
});

export default LearningVideo;
