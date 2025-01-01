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

  const handleScrollToIndexFailed = info => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: route?.params?.index,
        animated: true,
      });
    }, 500);
  };

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
            keyExtractor={(_, index) => index.toString()}
            showsVerticalScrollIndicator={false}
            renderItem={renderItem}
            onScrollToIndexFailed={handleScrollToIndexFailed}
            initialNumToRender={50}
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
