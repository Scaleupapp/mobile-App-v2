import React, {useEffect, useState} from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  Pressable,
} from 'react-native';
import {COLORS} from '../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../helper/scales';
import {Image} from 'react-native';
import Icon from '../helper/icon';
import Video from 'react-native-video';

const CARD_WIDTH = nw(163); // Two columns with margins

export const AllPost = ({data}) => {
  // const leftColumnData = data?.filter((_, index) => index % 2 === 0); // Items for left column
  // const rightColumnData = data?.filter((_, index) => index % 2 !== 0); // Items for right column

  const Postcard = ({item}) => {
    return (
      <View>
        {(item?.contentType == 'Image' || item?.contentType == 'Document') &&
        item?.contentURL ? (
          <Pressable
            // onPress={() => imageModalRef.current?.present()}
            style={{marginVertical: nh(10)}}>
            <Image
              source={{uri: item?.contentURL}}
              style={{
                height: 200,
                width: (DEVICE_WIDTH - nw(48)) / 2,
                backgroundColor: COLORS.whiteFFFFFF,
                // marginBottom: nh(6),
                borderRadius: nh(12),
                backgroundColor: 'grey',
                borderWidth: 1,
                borderColor: COLORS.grey333333 + 10,
              }}
              resizeMode="cover"
            />
          </Pressable>
        ) : null}
        {item?.contentType == 'Video' && item?.contentURL ? (
          <Pressable
            // onPress={() => setIsPlaying(index)}
            style={{
              // marginTop: nh(10),
              borderRadius: nh(12),
              // marginBottom: nh(15),
              marginRight: 10,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: COLORS.grey333333 + 10,
            }}>
            <Video
              paused={true}
              controls
              // onLoad={onLoad}
              // source={{uri: convertToProxyURL(item?.contentURL)}}
              source={{uri: item?.contentURL}}
              style={{
                height: nh(250),
                width: (DEVICE_WIDTH - nw(48)) / 2,
                backgroundColor: COLORS.whiteFFFFFF,
                marginBottom: nh(6),
              }}
              resizeMode="cover"
              onBuffer={e => console.log('bufeer ', e)}
              onError={e => console.log('sdsds ', e)}
            />
            {/* <View
            style={{
              position: 'absolute',
              alignSelf: 'center',
            }}>
            <Icon
              type="antdesign"
              name="playcircleo"
              size={nh(40)}
              color={COLORS.blue043142}
              style={{marginRight: nw(10), opacity: 0.8}}
            />
          </View> */}
          </Pressable>
        ) : null}
      </View>
    );
  };

  const RenderColumn = ({columnData}) => {
    return (
      <View style={styles.column}>
        <FlatList
          data={columnData}
          renderItem={({item}) => <Postcard item={item} />}
          numColumns={2}
          columnWrapperStyle={{
            justifyContent: 'space-between',
            // marginBottom: 10,
          }} // Adds space between columns and rows
        />
      </View>
    );
  };
  return (
    <View style={styles.container}>
      <RenderColumn columnData={data} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    flex: 1,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.grey999999,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: nh(16),
  },
  cardText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});