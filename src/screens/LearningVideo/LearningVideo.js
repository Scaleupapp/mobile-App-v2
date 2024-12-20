import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Text from '../../components/Text';
import { DEVICE_WIDTH, nh, nw } from '../../helper/scales';
import { images } from '../../assets/images';
import Icon from '../../helper/icon';
import { COLORS } from '../../helper/colors';
import Video from 'react-native-video';
import { 
  likePostApi, 
  savePostAPI, 
  unlikePostApi, 
  unsavePostAPI 
} from '../../services/apiService';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import CommentBottomSheetModal from '../Post/CustomBottomSheet';
import PlaylistSelectionModal from '../Home/PlaylistSelectionModal';
import { APP_FONTS } from '../../assets/fonts';
import ReadMore from '@fawazahmed/react-native-read-more';
import { navigationRef } from '../../../App';
import Routes from '../../helper/routes';

const LearningVideo = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const [videoDimensions, setVideoDimensions] = useState({});
  const [likes, setLikes] = useState({});
  const [bookmarks, setBookmarks] = useState({});
  const [playlistModal, setPlaylistModal] = useState({ visible: false, postId: null });
  
  const commentRefs = useRef({});

  const userData = useSelector(state => state?.userData);
  const token = userData?.token;
  const userId = token ? jwtDecode(token)?.userId : null;

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      const response = await axios.get('http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/content/allcontent');
      const videoContent = response.data.content.filter(item => item.contentURL?.toLowerCase().includes('.mp4'));
      setVideos(videoContent);
      
      // Initialize likes state
      const initialLikes = {};
      videoContent.forEach(video => {
        initialLikes[video._id] = {
          isLiked: video.isLiked || false,
          count: video.likes?.length || 0
        };
      });
      setLikes(initialLikes);
    } catch (error) {
      console.error('Error fetching videos:', error);
      Alert.alert('Error', 'Failed to load videos');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const isLiked = likes[postId]?.isLiked;
      const res = isLiked
        ? await unlikePostApi(postId)
        : await likePostApi(postId);

      setLikes(prev => ({
        ...prev,
        [postId]: {
          isLiked: !isLiked,
          count: res?.data?.likeCount
        }
      }));
    } catch (error) {
      console.error('Like error:', error);
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleBookmark = (postId) => {
    if (userId) {
      setPlaylistModal({ visible: true, postId });
    } else {
      Alert.alert('Login Required', 'Please login to save videos to playlists');
    }
  };

  const onVideoLoad = (data, videoId) => {
    const { width, height } = data.naturalSize;
    setVideoDimensions(prev => ({
      ...prev,
      [videoId]: { width, height }
    }));
  };

  const renderVideoItem = ({ item, index }) => {
    const dimensions = videoDimensions[item._id];
    const aspectRatio = dimensions ? dimensions.width / dimensions.height : 16/9;
    const likeState = likes[item._id] || { isLiked: false, count: 0 };
    const isBookmarked = bookmarks[item._id];

    if (!commentRefs.current[item._id]) {
      commentRefs.current[item._id] = React.createRef();
    }

    return (
      <View style={styles.videoContainer}>
        <View style={styles.headerContainer}>
          <Pressable 
            style={styles.userInfo}
            onPress={() => navigationRef.navigate(Routes.MyProfile, {
              type: 'other',
              id: item?.userId?._id,
            })}>
            <Image
              source={
                item?.userId?.profilePicture
                  ? { uri: item?.userId?.profilePicture }
                  : images.ciclelogo
              }
              style={styles.profileImage}
            />
            <Text variant="medium14" color={COLORS.blue043142}>
              {item?.userId?.username}
            </Text>
          </Pressable>
        </View>

        <Pressable
          onPress={() => setCurrentlyPlaying(currentlyPlaying === index ? null : index)}
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
            onLoad={(data) => onVideoLoad(data, item._id)}
            source={{ uri: item.contentURL }}
            style={[
              styles.video,
              {
                aspectRatio: aspectRatio,
                width: DEVICE_WIDTH - nw(32),
              }
            ]}
            resizeMode="cover"
          />
        </Pressable>

        <View style={styles.interactionBar}>
          <View style={styles.leftInteractions}>
            <Pressable onPress={() => handleLike(item._id)} style={styles.iconContainer}>
              <Icon
                type="antdesign"
                name={likeState.isLiked ? 'like1' : 'like2'}
                size={24}
                color={COLORS.blue043142}
              />
              <Text variant="medium12" style={styles.countText}>
                {likeState.count}
              </Text>
            </Pressable>
            <Pressable 
              onPress={() => commentRefs.current[item._id]?.current?.present()}
              style={styles.iconContainer}>
              <Icon
                type="ionicon"
                name="chatbubble-outline"
                size={24}
                color={COLORS.blue043142}
              />
            </Pressable>
          </View>
          <Pressable onPress={() => handleBookmark(item._id)}>
            <Icon
              type="feather"
              name="bookmark"
              size={24}
              color={isBookmarked ? COLORS.yellowF5BE00 : COLORS.blue043142}
            />
          </Pressable>
        </View>

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
          ref={commentRefs.current[item._id]}
          postId={item._id}
          comments={item.comments}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.blue043142} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={videos}
        renderItem={renderVideoItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
      
      <PlaylistSelectionModal
        visible={playlistModal.visible}
        onClose={() => setPlaylistModal({ visible: false, postId: null })}
        postId={playlistModal.postId}
        onPostAdded={(postId) => {
          setBookmarks(prev => ({
            ...prev,
            [postId]: true
          }));
          setPlaylistModal({ visible: false, postId: null });
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingBottom: nh(20),
  },
  videoContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(16),
    paddingVertical: nh(10),
    marginBottom: nh(10),
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: nh(10),
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    height: nh(30),
    width: nw(30),
    borderRadius: nh(15),
    marginRight: nw(7),
  },
  videoWrapper: {
    marginVertical: nh(10),
    alignItems: 'center',
    position: 'relative',
  },
  verifiedBadge: {
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
  },
  video: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 8,
  },
  interactionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: nh(10),
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
    marginLeft: nw(3),
    marginTop: 5,
  },
  captionText: {
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
    lineHeight: nh(18),
    letterSpacing: nw(0.3),
    fontWeight: '400',
    marginTop: nh(10),
    color: COLORS.grey333333,
  },
  seeMoreStyle: {
    color: COLORS.grey333333,
    fontFamily: APP_FONTS.PoppinsMedium,
    fontWeight: '500',
  },
  hashtags: {
    marginTop: nh(5),
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: nh(10),
  },
  topicTag: {
    backgroundColor: 'rgba(245, 190, 0, 0.15)',
    paddingVertical: 6,
    paddingHorizontal: nh(10),
    borderRadius: 8,
    marginRight: 10,
    marginBottom: 5,
  },
});

export default LearningVideo;