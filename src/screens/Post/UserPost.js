import React, {useEffect, useRef, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  FlatList,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import PostView from '../Home/Post';
import Header from '../../components/Header';

const UserPost = ({route}) => {
  const {index, data} = route?.params;
  const [isPlaying, setIsPlaying] = useState(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    // Automatically scroll to the selected index
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: index ?? 0,
        animated: true,
      });
    }, 500);
  }, [index]);

  const handleScrollToIndexFailed = info => {
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({
        index: index ?? 0,
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
      <Header title={data?.username} />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <FlatList
            ref={flatListRef}
            data={data?.content}
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
