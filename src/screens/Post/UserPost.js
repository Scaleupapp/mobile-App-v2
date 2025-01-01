import React, {useEffect, useRef, useState} from 'react';
import {StyleSheet, SafeAreaView, StatusBar, View} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, nh, nw} from '../../helper/scales';

import {FlatList} from 'react-native-gesture-handler';

import PostView from '../Home/Post';
import Header from '../../components/Header';

const UserPost = ({navigation, route}) => {
  const [isPlaying, setIsPlaying] = useState(null);
  const flatListRef = useRef(null);
  console.log(route?.params?.item);
  // Throttle the endReached to avoid multiple calls
  //   const handleOnReachEnd = useCallback(
  //     throttle(() => {
  //       if (hasMore) {
  //         setLoading(true);
  //         homePageData(page + 1);
  //       }
  //       console.log('handleOnReachEnd triggered');
  //     }, 1000),
  //     [hasMore, page],
  //   );
  console.log(route?.params?.index, 'route?.pams?.index');
  // Render each post
  const ITEM_HEIGHT = 400;
  const getItemLayout = (data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * route?.params?.index,
    index: route?.params?.index,
  });

  useEffect(() => {
    // Automatically scroll to the selected index
    if (route?.params?.index) console.log('herere');
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: route?.params?.index,
        animated: true,
      });
    }, 500);
  }, [route?.params?.index]);
  const renderItem = ({item, index}) => {
    return (
      <PostView
        item={item}
        index={index}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title={route?.params?.data?.username} />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <FlatList
            ref={flatListRef}
            data={route?.params?.data?.content}
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            // refreshControl={
            //   <RefreshControl
            //     refreshing={refreshing}
            //     onRefresh={() => {
            //       setPage(1);
            //       setRefreshing(true);
            //       homePageData(1, true);
            //     }}
            //     tintColor={COLORS.blue043142}
            //   />
            // }
            // ListHeaderComponent={() => (
            //   <>
            //     <Text
            //       variant="semibold16"
            //       style={{paddingVertical: nh(16), marginHorizontal: nw(16)}}
            //       color={COLORS.blue043142}>
            //       Post
            //     </Text>
            //   </>
            // )}
            renderItem={renderItem}
            getItemLayout={getItemLayout}
            // ListFooterComponent={() =>
            //   loading && (
            //     <View
            //       style={{
            //         height: page > 1 ? nh(40) : DEVICE_HEIGHT,
            //         paddingVertical: nh(20),
            //         backgroundColor: COLORS.whiteFFFFFF,
            //       }}>
            //       <ActivityIndicator size={'small'} color={COLORS.blue043142} />
            //     </View>
            //   )
            // }
            // ListEmptyComponent={
            //   !loading && (
            //     <View style={styles.emptyList}>
            //       <Text
            //         variant="semibold16"
            //         style={{width: '100%', textAlign: 'center'}}>
            //         {
            //           'Your Home Feed is empty right now. Start exploring and following users from the search page to see their content here!'
            //         }
            //       </Text>
            //     </View>
            //   )
            // }
            // onEndReached={handleOnReachEnd}
            onEndReachedThreshold={0.5}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default UserPost;

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
});
