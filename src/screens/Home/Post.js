import React, {useEffect, useMemo, useRef, useState} from 'react';
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
import {DEVICE_WIDTH, guidelineBaseWidth, nh, nw} from '../../helper/scales';
import Icon from '../../helper/icon';
import {COLORS} from '../../helper/colors';
import ReadMore from '@fawazahmed/react-native-read-more';
import {APP_FONTS} from '../../assets/fonts';
import Video from 'react-native-video';
import {
  likePostApi,
  savePostAPI,
  unlikePostApi,
  unsavePostAPI,
  getProfile,
} from '../../services/apiService';
import Routes from '../../helper/routes';
import {navigationRef} from '../../../App';
import ImageModal from '../Post/ImageModal';
import CommentBottomSheetModal from '../Post/CustomBottomSheet';
import axios from 'axios';
import PlaylistSelectionModal from './PlaylistSelectionModal';
import {useToast} from '../../components/CustomToast';
import {getTimeAgo} from '../../helper/commonFunctions';
import convertToProxyURL from 'react-native-video-cache';

const PostView = ({
  item,
  index,
  selectedIndex,
  setSelectedIndex,
  myProfile = false,
}) => {
  console.log('🚀 ~ PostView ~ item:', item);
  const [imageHeight, setImageHeight] = useState(0);
  const [videoDimensions, setVideoDimensions] = useState({width: 0, height: 0});
  const imageModalRef = useRef(null);
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [likeCount, setLikeCount] = useState(item?.likes?.length);
  const [comments, setComments] = useState(item?.comments);
  const commentRef = useRef(null);
  const [isBookmarked, setIsBookmarked] = useState(item?.isSaved);
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const {showToast} = useToast();
  const postId = item?._id || item?.contentId;

  useEffect(() => {
    getProfileData();
  }, []);

  const getProfileData = async () => {
    try {
      let res = await getProfile('');
      // console.log('🚀 ~ getProfileData ~ res:', res?.data?.userProfileInfo);
      setProfileData(res?.data?.userProfileInfo);
    } catch (error) {
      console.log('Profile data fetch error:', error?.response?.data?.message);
    }
  };

  const onLoad = data => {
    const {width, height} = data.naturalSize;
    setVideoDimensions({width, height});
  };

  const likeHandler = async () => {
    if (!profileData?.id) return;

    try {
      setIsLiked(!isLiked);
      const res = isLiked
        ? await unlikePostApi(postId)
        : await likePostApi(postId);

      setLikeCount(res?.data?.likeCount);
    } catch (error) {
      console.log(error, 'eeee');
    }
  };
  const onImageLoad = data => {
    const {
      nativeEvent: {
        source: {height, width},
      },
    } = data;
    const aspectRatio = nh(height) / nw(width);
    const calculatedHeight = guidelineBaseWidth * aspectRatio;
    setImageHeight(calculatedHeight || 300);
  };

  const saveHandler = async () => {
    try {
      const token = profileData?.id;

      if (!token) {
        showToast({
          text: 'Please login to save posts',
          type: 'error',
        });
        return;
      }

      // Toggle bookmark state immediately for better UX
      setIsBookmarked(!isBookmarked);

      // Make API call based on current state
      if (isBookmarked) {
        await unsavePostAPI(postId);
      } else {
        const res = await savePostAPI(postId);

        if (res.data.error) {
          // Revert state if API call fails
          setIsBookmarked(isBookmarked);
          showToast({
            title: res.data.error,
            type: 'error',
          });
        }
      }
    } catch (error) {
      // Revert state if API call fails
      setIsBookmarked(isBookmarked);
      showToast({
        title: error?.response?.data?.error || 'Failed to save post',
        type: 'error',
      });
    }
  };

  const handleBookmarkPress = () => {
    if (!profileData?.id) {
      showToast({
        title: 'Please log in to bookmark posts',
        type: 'error',
      });
      return;
    }

    // Check if the post belongs to the logged-in user
    if (item?.userId?._id !== profileData?.id) {
      showToast({
        title: 'You can only bookmark your own video posts',
        type: 'error',
      });
      return;
    }

    // Check if it's a video post
    if (item?.contentType !== 'Video') {
      showToast({
        title: 'Cannot add image to the playlist',
        type: 'error',
      });
      return;
    }

    setIsPlaylistModalVisible(true);
  };

  const handleBookmark = async (userId, postId) => {
    try {
      // First, check if the post is already in the playlist
      const checkResponse = await axios.get(
        `http://192.168.1.6:3000/api/playlists/check?userId=${userId}&postId=${postId}`,
      );

      if (checkResponse.data.exists) {
        // If already bookmarked, show "Already in playlist" message
        Alert.alert(
          '',
          'Already in your playlist',
          [{title: 'OK', style: 'default'}],
          {
            cancelable: true,
            onDismiss: () => {},
          },
        );
        return;
      }

      // If not bookmarked, proceed with bookmarking
      await axios.post('http://192.168.1.6:3000/api/playlists', {
        userId, // Send userId in the body
        playlistName: 'My Playlist', // Optional: Customize the playlist name
        items: [{postId}], // Only send the postId, not the entire object
      });

      // Show added to playlist message
      Alert.alert(
        '',
        'Added to your playlist',
        [{title: 'OK', style: 'default'}],
        {
          cancelable: true,
          onDismiss: () => {},
        },
      );

      console.log('Post successfully bookmarked');
      setIsBookmarked(true); // Update the UI state
    } catch (error) {
      console.error(
        'Failed to bookmark post:',
        error.response?.data || error.message,
      );

      // Show error message if something goes wrong
      Alert.alert('Error', 'Failed to bookmark post', [
        {title: 'OK', style: 'default'},
      ]);
    }
  };
  console.log({profileData});
  const profilePicture = myProfile
    ? profileData?.profilePicture
    : item?.userId?.profilePicture;
  const usernameIcon = myProfile
    ? `${profileData?.firstname?.charAt(0).toUpperCase()}${profileData?.lastname
        ?.charAt(0)
        .toUpperCase()}`
    : `${item?.userId?.username?.charAt(0).toUpperCase()}`;
  const username = myProfile ? profileData?.username : item?.userId?.username;

  return (
    <View
      key={index}
      style={{
        paddingHorizontal: nw(16),
        backgroundColor: COLORS.whiteFFFFFF,
        paddingBottom: nh(30),
      }}>
      <View style={styles.view}>
        <Pressable
          style={{flexDirection: 'row', alignItems: 'center'}}
          onPress={() =>
            navigationRef.navigate(Routes.OtherProfile, {
              type: 'other',
              id: item?.userId?._id,
            })
          }>
          {profilePicture ? (
            <Image source={{uri: profilePicture}} style={styles.image} />
          ) : (
            <View
              style={[
                styles.image,
                {
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: COLORS.greyD6D6D6,
                },
              ]}>
              <Text variant="semibold16" color={COLORS.black333333}>
                {usernameIcon}
              </Text>
            </View>
          )}
          <Text variant="medium14" color={COLORS.blue043142}>
            {username}
          </Text>
        </Pressable>
        <Pressable onPress={handleBookmarkPress}>
          <Icon
            type="entypo"
            name="dots-three-vertical"
            size={21}
            color={COLORS.blue043142}
          />
        </Pressable>
      </View>

      {item?.contentType == 'Image' && item?.contentURL ? (
        <Pressable
          onPress={() => {
            setSelectedIndex(index);
            imageModalRef.current?.present();
          }}
          style={{marginVertical: nh(10)}}>
          <Image
            source={{uri: item?.contentURL}}
            style={[styles.postimage, {height: imageHeight}]}
            onLoad={onImageLoad}
            resizeMode="cover"
            // resizeMode="contain"
          />
        </Pressable>
      ) : null}
      {item?.contentType == 'Video' && item?.contentURL ? (
        <Pressable
          onPress={() => {
            setSelectedIndex(index);
            imageModalRef.current?.present();
          }}
          style={{
            marginTop: nh(10),
            borderRadius: nh(12),
            marginBottom: nh(15),
            overflow: 'hidden',
          }}>
          {item?.isVerified && (
            <View
              style={{
                height: nh(30),
                width: nw(30),
                borderRadius: nh(15),
                backgroundColor: COLORS.blue043142,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                right: 10,
                top: 10,
                zIndex: 1,
                // Centers vertically
              }}>
              <Icon
                type="material-community"
                name="check-decagram"
                color={COLORS.yellowF5BE00}
                size={20} // Ensure the icon size is appropriate
              />
            </View>
          )}
          <Video
            paused={true}
            controls={false}
            onLoad={onLoad}
            source={{uri: convertToProxyURL(item?.contentURL)}}
            style={
              videoDimensions?.height
                ? {
                    aspectRatio: Number(
                      videoDimensions.width / videoDimensions.height,
                    ),
                    width: DEVICE_WIDTH - nw(32),
                    backgroundColor: COLORS.whiteFFFFFF,
                  }
                : {
                    height: nh(250),
                    width: DEVICE_WIDTH - nw(32),
                    backgroundColor: COLORS.whiteFFFFFF,
                  }
            }
            resizeMode="contain"
            onBuffer={e => console.log('bufeer ', e)}
            onError={e => console.log('sdsds ', e)}
          />
          <View style={styles.playButtonContainer}>
            <Icon
              type="antdesign"
              name="playcircleo"
              size={nh(40)}
              color={COLORS.blue043142}
              style={{
                opacity: 0.8,
              }}
            />
          </View>
        </Pressable>
      ) : null}

      <View style={styles.view}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Icon
            type="antdesign"
            name={isLiked ? 'like1' : 'like2'}
            size={24}
            color={COLORS.blue043142}
            onPress={() => likeHandler()}
            style={{marginRight: nw(3)}}
          />
          <Text
            variant="medium12"
            color={COLORS.black333333}
            style={{marginRight: nw(10), marginTop: 5}}>
            {likeCount}
          </Text>
          <Icon
            type="ionicon"
            name={'chatbubble-outline'}
            size={24}
            color={COLORS.blue043142}
            style={{marginRight: nw(10)}}
            onPress={() => commentRef?.current?.present()}
          />
          {/* commented */}
          {/* <Icon
            type="feather"
            name="share-2"
            size={24}
            color={COLORS.blue043142}
          /> */}
          {item?.contentType === 'Video' && (
            <>
              <Icon
                type="feather"
                name="eye"
                size={24}
                color={COLORS.blue043142}
                style={{marginRight: nw(3)}}
              />
              <Text
                variant="medium12"
                color={COLORS.black333333}
                style={{marginRight: nw(10), marginTop: 5}}>
                {item?.viewCount || 0}
              </Text>
            </>
          )}
          <Text
            variant="medium12"
            color={COLORS.grey333333}
            style={{marginTop: 5}}>
            • {getTimeAgo(item?.postdate)}
          </Text>
        </View>
        <Pressable onPress={saveHandler}>
          <Icon
            type="ionicon"
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={COLORS.blue043142}
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
      <Text
        color={COLORS.blue043142}
        style={{
          marginTop: 10,
          backgroundColor: COLORS.blue043142 + 10,
          alignSelf: 'flex-start', // Shrinks the background to fit text content
          paddingHorizontal: 10, // Adds padding around the text for spacing
          paddingVertical: 2, // Adjust vertical padding if needed
          borderRadius: 5,
        }}
        variant="semibold14">
        {item.heading}
      </Text>
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
      <CommentBottomSheetModal
        ref={commentRef}
        postId={postId}
        comments={comments}
        setComments={setComments}
      />
      {index == selectedIndex && item?.contentURL ? (
        <ImageModal
          ref={imageModalRef}
          type={item?.contentType}
          URL={item?.contentURL}
        />
      ) : null}

      {/* <SavedPostsModal
        // visible={isSavedModalVisible}
        //onClose={() => setIsSavedModalVisible(false)}
        currentPost={item}
      /> */}
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
    width: nh(30),
    borderRadius: nh(15),
    marginRight: nw(7),
  },
  postimage: {
    width: '100%',
    backgroundColor: COLORS.whiteFFFFFF,
    marginBottom: nh(6),
    borderRadius: nh(12),
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
  playButtonContainer: {
    position: 'absolute',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  },
  verifiedBadge: {
    height: nh(30),
    width: nw(30),
    borderRadius: nh(15),
    backgroundColor: COLORS.blue043142,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
  },
});

export default PostView;
