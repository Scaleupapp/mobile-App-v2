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
import {getvideoPageData} from '../../services/apiService';
import {useFocusEffect} from '@react-navigation/native';
import {throttle} from '../../helper/commonFunctions';
import PostView from '../Home/Post';
import Header from '../../components/Header';

const LearningVideo = ({navigation, route}) => {
  const [video, setVideo] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [activeVideoId, setActiveVideoId] = useState(null);
  const flatListRef = useRef(null);
  const videoRefs = useRef({});

  // Cleanup and pause videos when screen loses focus
  useFocusEffect(
    useCallback(() => {
      const loadInitialData = async () => {
        await videoPageData(1, true);
        setHasMore(true);
      };
      
      loadInitialData();

      return () => {
        // Pause all videos when leaving screen
        Object.values(videoRefs.current).forEach(videoRef => {
          if (videoRef && videoRef.pause) {
            videoRef.pause();
          }
        });
        setActiveVideoId(null);
      };
    }, []),
  );

  const videoPageData = async (pageNum, refresh = false) => {
    try {
      const {data} = await getvideoPageData(pageNum);
      if (data?.content?.length > 0) {
        const processedContent = data.content.map(item => ({
          ...item,
          contentType: item.contentType || 'Video',
          contentURL: item.contentURL || '',
          isPlaying: false,
        }));

        setPage(prevPage => prevPage + 1);
        if (refresh) {
          setVideo(processedContent);
        } else {
          setVideo(prev => [...prev, ...processedContent]);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.log('videoPageData error:', {refresh}, error?.response?.data || error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleOnReachEnd = useCallback(
    throttle(() => {
      if (hasMore && !loading) {
        setLoading(true);
        videoPageData(page);
      }
    }, 1000),
    [hasMore, page, loading],
  );

  const onViewableItemsChanged = useCallback(({viewableItems, changed}) => {
    if (viewableItems.length > 0) {
      const visibleVideo = viewableItems[0];
      
      // Pause previously playing video
      if (activeVideoId && activeVideoId !== visibleVideo.item._id) {
        const prevVideoRef = videoRefs.current[activeVideoId];
        if (prevVideoRef && prevVideoRef.pause) {
          prevVideoRef.pause();
        }
      }
      
      // Update active video
      setActiveVideoId(visibleVideo.item._id);
    } else {
      // No videos visible, pause current video
      if (activeVideoId) {
        const currentVideoRef = videoRefs.current[activeVideoId];
        if (currentVideoRef && currentVideoRef.pause) {
          currentVideoRef.pause();
        }
        setActiveVideoId(null);
      }
    }
  }, [activeVideoId]);

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 50,
    minimumViewTime: 300,
  };

  const viewabilityConfigCallbackPairs = useRef([
    { viewabilityConfig, onViewableItemsChanged },
  ]);

  const handleVideoRef = (ref, videoId) => {
    if (ref) {
      videoRefs.current[videoId] = ref;
    }
  };

  const renderItem = ({item, index}) => {
    return (
      <PostView 
        item={item} 
        index={index}
        isVisible={activeVideoId === item._id}
        onVideoRef={(ref) => handleVideoRef(ref, item._id)}
        onVideoLoad={() => {
          // Optional: Handle video load success
          console.log('Video loaded successfully:', item._id);
        }}
        onVideoError={(error) => {
          console.log('Video error for ID:', item._id, error);
        }}
        onVideoProgress={(progress) => {
          // Optional: Handle video progress
          console.log('Video progress:', progress);
        }}
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
      <View style={{height: nh(10)}} />
      <FlatList
        ref={flatListRef}
        data={video}
        keyExtractor={(item) => item._id || String(Math.random())}
        showsVerticalScrollIndicator={false}
        viewabilityConfigCallbackPairs={viewabilityConfigCallbackPairs.current}
        ListHeaderComponent={() => (
          <View style={{height: nh(16), backgroundColor: COLORS.whiteFFFFFF}} />
        )}
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
            <View style={[styles.loadingContainer, 
              { height: page > 1 ? nh(40) : DEVICE_HEIGHT }]}>
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
                {'Your Learning Video Feed is empty right now. Start exploring and following users from the search page to see their content here!'}
              </Text>
            </View>
          )
        }
        onEndReached={handleOnReachEnd}
        onEndReachedThreshold={0.5}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={5}
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
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: nh(28),
    backgroundColor: COLORS.whiteFFFFFF,
  },
  loadingContainer: {
    paddingVertical: nh(20),
    backgroundColor: COLORS.whiteFFFFFF,
  },
});

export default LearningVideo;