import React, {useEffect, useState} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Pressable,
} from 'react-native';
import Text from '../../components/Text';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import {images} from '../../assets/images';
import Icon from '../../helper/icon';
import {COLORS} from '../../helper/colors';
import ReadMore from '@fawazahmed/react-native-read-more';
import {APP_FONTS} from '../../assets/fonts';
import Video from 'react-native-video';
// import convertToProxyURL from 'react-native-video-cache';

const PostView = ({item, index, isPlaying, setIsPlaying}) => {
  console.log({item});
  const [imageHeight, setImageHeight] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({width: 0, height: 0});
  const [imageModal, setImageModal] = useState(false);

  const onLoad = data => {
    const {width, height} = data.naturalSize;
    setVideoDimensions({width, height});
  };

  useEffect(() => {
    if (item?.contentType == 'image' && item?.contentURL) {
      Image.getSize(item?.media, (width, height) => {
        setImageHeight(height / 3);
      });
    }
  }, [item?.contentURL]);

  return (
    <View
      key={index}
      style={{
        paddingHorizontal: nw(16),
        backgroundColor: COLORS.whiteFFFFFF,
        paddingBottom: nh(30),
      }}>
      <View style={styles.view}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Image
            source={
              item?.userId?.profilePicture
                ? {uri: item?.userId?.profilePicture}
                : images.ciclelogo
            }
            style={styles.image}
          />
          <Text variant="medium14" color={COLORS.blue043142}>
            {item?.userId?.username}
          </Text>
        </View>

        <Icon
          type="entypo"
          name="dots-three-vertical"
          size={21}
          color={COLORS.blue043142}
        />
      </View>

      {/* <Image style={styles.postimage} /> */}
      {item?.contentType == 'image' && item?.contentURL ? (
        <Pressable
          onPress={() => setImageModal(true)}
          style={{marginVertical: nh(10)}}>
          <Image
            source={{uri: item?.contentURL}}
            style={{
              height: imageHeight,
              width: DEVICE_WIDTH,
              backgroundColor: COLORS.whiteFFFFFF,
              marginBottom: nh(6),
            }}
            resizeMode="cover"
          />
        </Pressable>
      ) : null}
      {item?.contentType == 'Video' && item?.contentURL ? (
        <Pressable
          onPress={() => setIsPlaying(index)}
          style={{
            marginVertical: nh(10),
            // alignContent: 'center',
            // justifyContent: 'center',
          }}>
          <Video
            paused={isPlaying != index}
            controls
            onLoad={onLoad}
            // source={{uri: convertToProxyURL(item?.contentURL)}}
            source={{uri: item?.contentURL}}
            style={
              videoDimensions?.height
                ? {
                    aspectRatio: Number(
                      videoDimensions.width / videoDimensions.height,
                    ),
                    width: DEVICE_WIDTH - nw(32),
                    backgroundColor: COLORS.whiteFFFFFF,
                    marginBottom: nh(6),
                  }
                : {
                    height: nh(250),
                    width: DEVICE_WIDTH - nw(32),
                    backgroundColor: COLORS.whiteFFFFFF,
                    marginBottom: nh(6),
                  }
            }
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

      <View style={styles.view}>
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
          <Icon
            type="antdesign"
            name="like2"
            size={24}
            color={COLORS.blue043142}
            style={{marginRight: nw(10)}}
          />
          <Icon
            type="ionicon"
            name="chatbubble-outline"
            size={24}
            color={COLORS.blue043142}
            style={{marginRight: nw(10)}}
          />
          <Icon
            type="feather"
            name="share-2"
            size={24}
            color={COLORS.blue043142}
          />
        </View>
        <Icon
          type="feather"
          name="bookmark"
          size={24}
          color={COLORS.blue043142}
        />
      </View>
      <ReadMore
        numberOfLines={2}
        style={styles.textStyle}
        expandOnly
        seeMoreText="more"
        seeMoreStyle={{
          color: COLORS.grey333333,
          fontFamily: APP_FONTS.PoppinsMedium,
          fontWeight: '500',
        }}>
        {item?.captions}
      </ReadMore>
      {/* <Text
        variant="medium12"
        color={COLORS.grey333333}
        numberOfLines={2}
        ellipsizeMode="tail"
        style={{marginTop: nh(10)}}>
        {item?.captions}
      </Text> */}
      <View style={{flexDirection: 'row', width: '100%'}}>
        {item?.relatedTopics.map((u, i) => (
          <View key={i} style={styles.yellowview}>
            <Text variant="medium12" color={COLORS.blue043142}>
              {u}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  view: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  image: {
    height: nh(30),
    width: nw(30),
    borderRadius: nh(15),
    marginRight: nw(7),
  },
  postimage: {
    height: nh(175),
    backgroundColor: COLORS.grey999999,
    borderRadius: 10,
    marginTop: nh(10),
    marginBottom: nh(15),
  },
  yellowview: {
    backgroundColor: 'rgba(245, 190, 0, 0.15)',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: nh(10),
    borderRadius: 8,
    marginRight: 10,
    marginTop: nh(10),
  },
  textStyle: {
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
    lineHeight: nh(18),
    letterSpacing: nw(0.3),
    fontWeight: '400',
    marginTop: nh(10),
    color: COLORS.grey333333,
  },
});

export default PostView;
