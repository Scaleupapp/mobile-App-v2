import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import Text from '../../components/Text';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import {images} from '../../assets/images';
import Icon from '../../helper/icon';
import {COLORS} from '../../helper/colors';
import Video from 'react-native-video';
import {
  likePostApi,
  savePostAPI,
  unlikePostApi,
  unsavePostAPI,
  getProfile,
} from '../../services/apiService';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CommentBottomSheetModal from '../Post/CustomBottomSheet';
import PlaylistSelectionModal from '../Home/PlaylistSelectionModal';
import {APP_FONTS} from '../../assets/fonts';
import ReadMore from '@fawazahmed/react-native-read-more';
import {navigationRef} from '../../../App';
import Routes from '../../helper/routes';
import Header from '../../components/Header';
import SavedPostsModal from '../Home/SavedPostsModal';
import Toast from '../../components/CustomToast/Toast';
import { useToast } from '../../components/CustomToast';
// Add this helper function at the top of the file after the imports
const getTimeAgo = (date) => {
  // Create dates in Asia/Kolkata timezone by adding 5 hours 30 minutes offset
  const now = new Date();
  const utcOffset = now.getTime() + (now.getTimezoneOffset() * 60000); // Convert to UTC
  const indiaTime = new Date(utcOffset + (5.5 * 60 * 60000)); // Add India offset (5.5 hours)
  
  // Convert post date to India time
  const postDate = new Date(date);
  const postIndiaTime = new Date(postDate.getTime());
  
  const diffTime = Math.abs(indiaTime - postIndiaTime);
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  
  // Handle cases less than a day
  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
  if (diffMinutes < 120) return '1 hour ago';
  if (diffMinutes < 1440) return `${Math.floor(diffMinutes/60)} hours ago`;
  
  // Handle longer time periods
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays/7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  if (diffDays < 365) return `${Math.floor(diffDays/30)} months ago`;
  return `${Math.floor(diffDays/365)} years ago`;
};

const VideoItem = ({
  item,
  index,
  currentlyPlaying,
  setCurrentlyPlaying,
  onDimensionsLoad,
  videoDimensions,
}) => {
  const [isLiked, setIsLiked] = useState(item.isLiked);
  const [likeCount, setLikeCount] = useState(item?.likes?.length);
  const [comments, setComments] = useState(item?.comments);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);
    const [isSavedModalVisible, setIsSavedModalVisible] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { showToast } = useToast();



  
  const [profileData, setProfileData] = useState(null);

  const commentRef = useRef(null);
  const dimensions = videoDimensions[item._id];
  const aspectRatio = dimensions
    ? dimensions.width / dimensions.height
    : 16 / 9;

  useEffect(() => {
    getProfileData();
  }, []);

  const getProfileData = async () => {
    try {
      const user = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(user);

      let res = await getProfile('');
      // console.log('🚀 ~ getProfileData ~ res:', res?.data?.userProfileInfo);
      setProfileData(res?.data?.userProfileInfo);
    } catch (error) {
      console.log('Profile data fetch error:', error?.response?.data?.message);
    }
  };

  const likeHandler = async () => {
    if (!profileData?.id) return;

    try {
      setIsLiked(!isLiked);
      const res = isLiked
        ? await unlikePostApi(item?._id)
        : await likePostApi(item?._id);
      console.log('🚀 ~ likeHandler ~ res:', res?.data);

      setLikeCount(res?.data?.likeCount);
    } catch (error) {
      console.log(error, 'eeee');
    }
  };
// Replace the existing saveHandler function with this:
const saveHandler = async () => {

  try {
    const token = profileData?.id;

    if (!token) {
      showToast({
        title: 'Please login to save posts',
        type: 'error',
      });
      return;
    }

    setIsSaving(true);
    setIsBookmarked(!isBookmarked);

    if (isBookmarked) {
      await unsavePostAPI(item?._id);
    } else {
      const res = await savePostAPI(item?._id);
      if (res.data.error) {
        setIsBookmarked(false);
        showToast({
          title: res.data.error,
          type: 'error',
        });
      } else {
        showToast({
          title: 'Post saved successfully',
          type: 'success',
        });
      }
    }
  } catch (error) {
    setIsBookmarked(isBookmarked); // Revert on error
    showToast({
      title: error?.response?.data?.error || 'Failed to save post',
      type: 'error',
    });
  } finally {
    setIsSaving(false);
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

  setIsPlaylistModalVisible(true);
};


  return (
    <View style={styles.videoContainer}>
      <View style={styles.headerContainer}>
        <Pressable
          style={styles.userInfo}
          onPress={() =>
            navigationRef.navigate(Routes.OtherProfile, {
              id: item?.userId?._id,
            })
          }>
          <Image
            source={
              item?.userId?.profilePicture
                ? {uri: item?.userId?.profilePicture}
                : images.ciclelogo
            }
            style={styles.profileImage}
          />
          <Text variant="medium14" color={COLORS.blue043142}>
            {item?.userId?.username}
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

      <Pressable
        onPress={() =>
          setCurrentlyPlaying(currentlyPlaying === index ? null : index)
        }
        style={styles.videoWrapper}>
        {item?.isVerified && (
          <View style={styles.verifiedBadge}>
            <Icon
              type="material-community"
              name="check-decagram"
              color={COLORS.yellowF5BE00}
              size={20}
            />
          </View>
        )}
        <Video
          paused={currentlyPlaying !== index}
          controls
          onLoad={data => onDimensionsLoad(data, item._id)}
          source={{uri: item.contentURL}}
          style={[
            styles.video,
            {
              aspectRatio: aspectRatio,
              width: DEVICE_WIDTH - nw(32),
            },
          ]}
          resizeMode="cover"
        />
        <View
          style={{
            position: 'absolute',
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
          }}>
          <Icon
            type="antdesign"
            name="playcircleo"
            size={nh(40)}
            color={COLORS.blue043142}
            style={{
              marginRight: nw(10),
              opacity: 0.8,
            }}
          />
        </View>
      </Pressable>

      <View style={styles.interactionBar}>
        <View style={styles.leftInteractions}>
          <View style={styles.iconContainer}>
            <Icon
              type="antdesign"
              name={isLiked ? 'like1' : 'like2'}
              size={24}
              color={COLORS.blue043142}
              onPress={likeHandler}
            />
            <Text variant="medium12" style={styles.countText}>
              {likeCount}
            </Text>
          </View>
          <Pressable
            onPress={() => commentRef?.current?.present()}
            style={styles.iconContainer}>
            <Icon
              type="ionicon"
              name="chatbubble-outline"
              size={24}
              color={COLORS.blue043142}
            />
          </Pressable>
          <View style={styles.iconContainer}>
            <Icon
              type="feather"
              name="eye"
              size={24}
              color={COLORS.blue043142}
            />
            <Text variant="medium12" style={styles.countText}>
              {item?.viewCount || 0}
            </Text>
          </View>
          <Text
            variant="medium12"
            style={[styles.countText, { color: COLORS.grey333333 }]}>
            • {getTimeAgo(item?.postdate)}
          </Text>
        </View>
        <Pressable onPress={saveHandler} disabled={isSaving}>
          <Icon
            type="ionicon"
            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={24}
            color={COLORS.blue043142}
          />
        </Pressable>
      </View>
      <Text
        color={COLORS.blue043142}
        style={{
          marginVertical: 10,
          backgroundColor: COLORS.blue043142 + 10,
          alignSelf: 'flex-start', // Shrinks the background to fit text content
          paddingHorizontal: 10, // Adds padding around the text for spacing
          paddingVertical: 2, // Adjust vertical padding if needed
          borderRadius: 5,
        }}
        variant="semibold14">
        {item?.heading}
      </Text>
      <ReadMore
        numberOfLines={2}
        style={styles.captionText}
        expandOnly
        seeMoreText="more"
        seeMoreStyle={styles.seeMoreStyle}>
        {item?.captions}
      </ReadMore>

      {item?.hashtags && (
        <Text color={COLORS.blue043142} style={styles.hashtags}>
          {item.hashtags}
        </Text>
      )}

      {item?.relatedTopics?.length > 0 && (
        <View style={styles.topicsContainer}>
          {item.relatedTopics.map((topic, i) => (
            <View key={i} style={styles.topicTag}>
              <Text variant="medium12" color={COLORS.blue043142}>
                {topic}
              </Text>
            </View>
          ))}
        </View>
      )}

      <CommentBottomSheetModal
        ref={commentRef}
        postId={item._id}
        comments={comments}
        setComments={setComments}
      />

      <PlaylistSelectionModal
        visible={isPlaylistModalVisible}
        onClose={() => setIsPlaylistModalVisible(false)}
        postId={item._id}
        onPostAdded={() => {
          setIsBookmarked(true);
          setIsPlaylistModalVisible(false);
        }}
      />
          
    </View>
  );
};

const LearningVideo = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({});

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsedData = JSON.parse(userData);
      const token = parsedData?.token;
  
      const response = await axios.get(
        `https://api.scaleupapp.club/api/content/allcontent`,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );
  
      const videoContent = response.data.content
        .filter(item => item.contentURL?.toLowerCase().includes('.mp4'))
        .map(video => ({
          ...video,
        }));
  
      setVideos(videoContent);
    } catch (error) {
      console.error('Error fetching videos:', error);
      showToast({
        text: 'Failed to load videos',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };
  

  const onDimensionsLoad = (data, videoId) => {
    const {width, height} = data.naturalSize;
    setVideoDimensions(prev => ({
      ...prev,
      [videoId]: {width, height},
    }));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.blue043142} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title={'Learning Videos'} />
      <FlatList
        data={videos}
        renderItem={({item, index}) => (
          <VideoItem
            item={item}
            index={index}
            currentlyPlaying={currentlyPlaying}
            setCurrentlyPlaying={setCurrentlyPlaying}
            onDimensionsLoad={onDimensionsLoad}
            videoDimensions={videoDimensions}
          />
        )}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: nh(20),
  },
  videoContainer: {
    paddingHorizontal: nw(16),
    backgroundColor: COLORS.whiteFFFFFF,
    paddingBottom: nh(30),
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: nh(10),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    marginRight: nw(10),
  },
  videoWrapper: {
    position: 'relative',
    marginVertical: nh(10),
    borderRadius: nh(12),
    overflow: 'hidden',
  },
  verifiedBadge: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 1,
    height: nh(30),
    width: nw(30),
    borderRadius: 15,
    backgroundColor: COLORS.blue043142,
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    backgroundColor: COLORS.whiteFFFFFF,
    // marginBottom: nh(6),
  },
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: nh(10),
  },
  leftInteractions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: nw(15),
  },
  countText: {
    marginLeft: nw(5),
    color: COLORS.black333333,

    marginTop: 5,
  },
  captionText: {
    fontFamily: APP_FONTS.PoppinsRegular,
    fontSize: 14,
    color: COLORS.grey333333,
    marginBottom: nh(5),
  },
  seeMoreStyle: {
    color: COLORS.grey333333,
    fontFamily: APP_FONTS.PoppinsMedium,
    fontWeight: '500',
  },
  hashtags: {
    marginVertical: nh(5),
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: nh(5),
  },
  topicTag: {
    backgroundColor: 'rgba(245, 190, 0, 0.15)',
    paddingHorizontal: nw(10),
    paddingVertical: nh(5),
    borderRadius: 15,
    marginRight: nw(10),
    marginBottom: nh(5),
  },
});

export default LearningVideo;
