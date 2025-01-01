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
  const [video, setvideo] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const flatListRef = useRef(null);

  // Refetch whenever we focus on this screen
  useFocusEffect(
    useCallback(() => {
      videoPageData(1);
      setHasMore(true);
      return () => {};
    }, []),
  );

  // Load video feed data (with pagination)
  const videoPageData = async (pageNum, refresh = false) => {
    try {
      const {data} = await getvideoPageData(pageNum);
      if (data?.content.length > 0) {
        setPage(prevPage => prevPage + 1);
        if (refresh) {
          setvideo(data.content);
        } else {
          setvideo(prev => [...prev, ...data.content]);
        }
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.log('videoPageData error:', {refresh}, error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  // Throttle the endReached to avoid multiple calls
  const handleOnReachEnd = useCallback(
    throttle(() => {
      if (hasMore) {
        setLoading(true);
        videoPageData(page + 1);
      }
      console.log('handleOnReachEnd triggered');
    }, 1000),
    [hasMore, page],
  );

  // Render each post
  const renderItem = ({item, index}) => {
    return <PostView item={item} index={index} />;
  };

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
        keyExtractor={(_, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={() => (
          <View style={{height: nh(16), backgroundColor: COLORS.whiteFFFFFF}} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setPage(1);
              setRefreshing(true);
              videoPageData(1, true);
            }}
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
                style={{width: '100%', textAlign: 'center'}}>
                {
                  'Your Learning Video Feed is empty right now. Start exploring and following users from the search page to see their content here!'
                }
              </Text>
            </View>
          )
        }
        onEndReached={handleOnReachEnd}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
};

export default LearningVideo;

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
});
