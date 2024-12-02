import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {FlatList} from 'react-native-gesture-handler';
import {images} from '../../assets/images';
import {Image} from 'react-native';
import {getHomePageData} from '../../services/apiService';
import {useFocusEffect} from '@react-navigation/native';
import PostView from './Post';
import {Story} from './Story';
import {throttle} from '../../helper/commonFunctions';

const Home = ({navigation, route}) => {
  const [home, setHome] = useState([]);
  console.log('🚀 ~ Home ~ home:', home);
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(true);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const flatListRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      homePageData(1);
      setHasMore(true);
      return () => {
        // setPage(1);
        // setHome([]);
      };
    }, []),
  );

  const homePageData = async (page, refresh = false) => {
    try {
      const {data} = await getHomePageData(page);
      console.log('🚀 ~ homePageData ~ data:', data);
      if (data?.content.length > 0) {
        setPage(prevPage => prevPage + 1);
        if (refresh) setHome(data.content);
        else setHome(prev => [...prev, ...data.content]);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.log('🚀 ~ homePageData ~ error:', {refresh}, error);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  const handleOnReachEnd = useCallback(
    throttle(() => {
      if (hasMore) {
        setLoading(true);
        homePageData(page + 1);
      }
      console.log('handleOnReachEnd');
    }, 1000),
    [],
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <MainHeader />
      <FlatList
        ref={flatListRef}
        keyExtractor={(_, index) => index.toString()}
        data={home}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setPage(1);
              setRefreshing(true);
              homePageData(1, true);
            }}
            tintColor={COLORS.blue043142}
          />
        }
        ListHeaderComponent={() => {
          return (
            <View style={styles.layer1}>
              <View style={styles.layer2}>
                {/* story */}
                <Story />
                {/* Post */}
                <Text
                  variant="semibold16"
                  style={{paddingVertical: nh(16), marginHorizontal: nw(16)}}
                  color={COLORS.blue043142}>
                  Post
                </Text>
              </View>
            </View>
          );
        }}
        renderItem={({item, index}) => <PostView item={item} index={index} />}
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
          <>
            {!loading && (
              <View style={styles.emptyList}>
                <Text
                  variant="semibold16"
                  style={{
                    width: '100%',
                    textAlign: 'center',
                  }}>
                  {
                    'Your Home Feed is empty right now. Start exploring and following users from the search page to see their content here!'
                  }
                </Text>
              </View>
            )}
          </>
        }
        onEndReached={handleOnReachEnd}
        onEndReachedThreshold={0.5}
      />
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
    // paddingHorizontal: nw(16),
    paddingTop: nh(20),
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: nh(28),
    backgroundColor: COLORS.whiteFFFFFF,
  },
});
