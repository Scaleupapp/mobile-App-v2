import React, {useEffect, useState} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Pressable,
  Alert,
} from 'react-native';
import Text from '../../components/Text';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import {images} from '../../assets/images';
import Icon from '../../helper/icon';
import {COLORS} from '../../helper/colors';
import ReadMore from '@fawazahmed/react-native-read-more';
import {APP_FONTS} from '../../assets/fonts';
import Video from 'react-native-video';

import { useSelector } from 'react-redux';
import axios from 'axios';
import {jwtDecode} from 'jwt-decode'; // Import jwtDecode
import PlaylistSelectionModal from './PlaylistSelectionModal'; // Import the new modal


// import convertToProxyURL from 'react-native-video-cache';

const PostView = ({item, index, isPlaying, setIsPlaying}) => {
  // console.log({item});
  const [imageHeight, setImageHeight] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({width: 0, height: 0});
  const [imageModal, setImageModal] = useState(false);

  const token = useSelector((state) => state.auth.userData.token);
  const userId = token ? jwtDecode(token)?.userId : null; // Extract userId from token
  console.log('hhhhbhhbk',userId);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);



  const onLoad = data => {
    const {width, height} = data.naturalSize;
    setVideoDimensions({width, height});
  };



  const handleBookmarkPress = () => {
    if (item?.contentType === 'Video') {
      if (userId) {
        // Show playlist modal for videos
        setIsPlaylistModalVisible(true);
      } else {
        console.error('User ID not available');
      }
    } else {
      // Show message if the content is not a video
      Alert.alert(
        'Action Not Allowed',
        'Cannot add image to the playlist',
        [{ text: 'OK', style: 'default' }]
      );
    }
  };
  

  const handleBookmark = async (userId, postId) => {
    try {
      // First, check if the post is already in the playlist
      const checkResponse = await axios.get(`http://192.168.0.187:5000/api/playlists/check?userId=${userId}&postId=${postId}`);
      
      if (checkResponse.data.exists) {
        // If already bookmarked, show "Already in playlist" message
        Alert.alert(
          '',
          'Already in your playlist', 
          [{text: 'OK', style: 'default'}],
          {
            cancelable: true,
            onDismiss: () => {}
          }
        );
        return;
      }

      // If not bookmarked, proceed with bookmarking
      await axios.post('http://192.168.0.187:5000/api/playlists', {
        userId, // Send userId in the body
        playlistName: 'My Playlist', // Optional: Customize the playlist name
        items: [{ postId }], // Only send the postId, not the entire object
      });
      
      // Show added to playlist message
      Alert.alert(
        '',
        'Added to your playlist', 
        [{text: 'OK', style: 'default'}],
        {
          cancelable: true,
          onDismiss: () => {}
        }
      );

      console.log('Post successfully bookmarked');
      setIsBookmarked(true); // Update the UI state
    } catch (error) {
      console.error('Failed to bookmark post:', error.response?.data || error.message);
      
      // Show error message if something goes wrong
      Alert.alert(
        'Error',
        'Failed to bookmark post', 
        [{text: 'OK', style: 'default'}]
      );
    }
  };
  
  

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

      {item?.contentType == 'Image' && item?.contentURL ? (
  <Pressable
    onPress={() => setImageModal(true)}
    style={{marginVertical: nh(10)}}>
    <Image
      source={{uri: item?.contentURL}}
      style={{
        height: nh(250), // Fixed height for the image
        width: DEVICE_WIDTH-nw(30), // Fixed width for the image (full width of the device)
        backgroundColor: COLORS.whiteFFFFFF,
        marginBottom: nh(6),
      }}
      resizeMode="contain" // Ensures the image fills the container while maintaining aspect ratio
    />
  </Pressable>
) : null}

{item?.contentType == 'Video' && item?.contentURL ? (
  <Pressable
    onPress={() => setIsPlaying(index)}
    style={{
      marginVertical: nh(10),
    }}>
    {item?.isVerified && (
      <View
        style={{
          height: nh(30),
          width: nw(30),
          borderRadius: 15,
          backgroundColor: COLORS.blue043142,
          alignItems: 'center',
          justifyContent: 'center',
          position: 'absolute',
          right: 10,
          top: 10,
          zIndex: 1,
        }}>
        <Icon
          type="material-community"
          name="check-decagram"
          color={COLORS.yellowF5BE00}
          size={20}
        />
      </View>
    )}
    <Video
      paused={isPlaying != index}
      controls
      onLoad={onLoad}
      source={{uri: item?.contentURL}}
      style={{
        width: DEVICE_WIDTH - nw(32),  // Fixed width
        height: nh(250),  // Fixed height
        backgroundColor: COLORS.whiteFFFFFF,
        marginBottom: nh(6),
      }}
      resizeMode="conatin"
      onBuffer={e => console.log('buffer ', e)}
      onError={e => console.log('error ', e)}
    />
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
        <Pressable onPress={handleBookmarkPress}>
        <Icon
          type="feather"
          name="bookmark"
          size={24}
          color={isBookmarked ? COLORS.yellowF5BE00 : COLORS.blue043142}
        />
      </Pressable>

      {/* Playlist Selection Modal */}
      <PlaylistSelectionModal
        visible={isPlaylistModalVisible}
        onClose={() => setIsPlaylistModalVisible(false)}
        postId={item._id}
        onPostAdded={() => {
          // Optional: Update UI state to show post is bookmarked
          setIsBookmarked(true);
        }}
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
      <Text color={COLORS.blue043142}>{item.hashtags}</Text>
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
