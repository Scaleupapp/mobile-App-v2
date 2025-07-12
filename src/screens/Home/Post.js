import React, {useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Image,
  StatusBar,
  Pressable,
  Alert,
  Modal,
  ScrollView,
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
  ReportPost,
  deleteContent,
  getContentWithPremiumCheck
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
import {MenuModal} from '../../components/MenuModal';
import ReportPostModal from '../Post/ReportPostModal';
import VideoPostPlayer from './VideoPostPlayer';
import DeleteConfirmationModal from '../Post/DeleteConfirmationModal';
import AsyncStorage from '@react-native-async-storage/async-storage';


const PostView = ({
  item,
  index,
  selectedIndex,
  setSelectedIndex,
  isVideoVisible,

  myProfile = false,
}) => {
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
  const [visible, setVisible] = useState(false);
  const {showToast} = useToast();
  const postId = item?._id || item?.contentId;
  const componentRef = useRef(null);
  const [position, setPosition] = useState(0);
  const [isModalVisible, setModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [showPlaylistInfo, setShowPlaylistInfo] = useState(false);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [shouldRedirectToPlaylist, setShouldRedirectToPlaylist] =
    useState(false);

  const [expandedPlaylistId, setExpandedPlaylistId] = useState(null);
  const [playlistPosts, setPlaylistPosts] = useState([]);
  const [showInfoButton, setShowInfoButton] = useState(false);

  const [premiumData, setPremiumData] = useState(null);
const [showPremiumLock, setShowPremiumLock] = useState(false);
const [hasAccess, setHasAccess] = useState(true);



  const getmeasure = () => {
    if (componentRef.current) {
      componentRef.current.measure((x, y, width, height, pageX, pageY) => {
        setPosition(pageY);
      });
    }
  };

  useEffect(() => {
    // When playlist info is available and we should redirect, perform navigation
    if (playlistInfo && shouldRedirectToPlaylist) {
      // Reset the redirect flag
      setShouldRedirectToPlaylist(false);

      // Navigate to MyPlaylists screen with specific playlist info
      navigationRef.navigate('MyPlaylists', {
        initialView: 'public',
        playlistToExpand: playlistInfo[0]?._id, // Expand the first playlist containing this post
        scrollToPost: item._id,
      });
    }
  }, [playlistInfo, shouldRedirectToPlaylist]);

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

const checkPremiumAccess = async () => {
  if (item?.contentType === 'Video') {
    try {
      const response = await getContentWithPremiumCheck(postId);
      if (response.success) {
        setPremiumData({
          ...response,
          contentId: postId, // Ensure contentId is set
          contentTitle: item?.heading || item?.title
        });
        setHasAccess(response.hasAccess);
        if (response.isPreviewMode) {
          setShowPremiumLock(false);
        }
      }
    } catch (error) {
      console.log('Premium access check error:', error);
    }
  }
};



  const onLoad = data => {
    const {width, height} = data.naturalSize;
    setVideoDimensions({width, height});
  };

  const fetchPlaylistInfo = async () => {
    if (!item?._id) return;

    setIsLoadingPlaylists(true);

    try {
      // Retrieve the authentication token, just like in fetchPostDetails
      const userData = await AsyncStorage.getItem('userData');
      const currentToken = userData ? JSON.parse(userData).token : null;

      // Prepare headers object if we have a token
      const headers = currentToken
        ? {
            Authorization: `Bearer ${currentToken}`,
          }
        : {};

      // First attempt to get playlists, with auth token if available
      const playlistsResponse = await axios.get(
        'https://api.scaleupapp.club/api/playlists/public',
        {headers},
      );

      // Filter playlists containing the current post
      const containingPlaylists = playlistsResponse.data.filter(playlist =>
        playlist.items.some(playlistItem => playlistItem.postId === item._id),
      );
      // console.log('1sttt', containingPlaylists);

      setPlaylistInfo(containingPlaylists);

      // Fetch posts for the first playlist if any are found
      if (containingPlaylists.length > 0) {
        fetchPlaylistPosts(containingPlaylists[0]._id);
        setExpandedPlaylistId(containingPlaylists[0]._id);
      }
    } catch (error) {
      console.error('Error fetching playlist info:', error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // Add PlaylistInfoModal component
  const PlaylistInfoModal = () => (
    <Modal
      visible={showPlaylistInfo}
      transparent={true}
      animationType="fade"
      onRequestClose={() => setShowPlaylistInfo(false)}>
      <Pressable
        style={styles.modalOverlay}
        onPress={() => setShowPlaylistInfo(false)}>
        <View style={[styles.modalContent, {maxHeight: '80%'}]}>
          <View style={styles.modalHeader}>
            <Text variant="semibold16" color={COLORS.blue043142}>
              Included in Playlists
            </Text>
            <TouchableOpacity onPress={() => setShowPlaylistInfo(false)}>
              <Icon
                type="antdesign"
                name="close"
                size={24}
                color={COLORS.blue043142}
              />
            </TouchableOpacity>
          </View>

          <ScrollView>
            {playlistInfo && playlistInfo.length > 0 ? (
              playlistInfo.map((playlist, idx) => (
                <View key={idx}>
                  <TouchableOpacity
                    style={styles.playlistItem}
                    onPress={() => {
                      setExpandedPlaylistId(
                        expandedPlaylistId === playlist._id
                          ? null
                          : playlist._id,
                      );
                      fetchPlaylistPosts(playlist._id);
                    }}>
                    <Icon
                      type="material"
                      name="playlist-play"
                      size={24}
                      color={COLORS.blue043142}
                      style={styles.playlistIcon}
                    />
                    <View style={styles.playlistDetails}>
                      <Text variant="medium14" color={COLORS.blue043142}>
                        {playlist.playlistName}
                      </Text>
                      {/* {playlist.description && (
                        <Text variant="regular12" color={COLORS.grey333333}>
                          {playlist.description}
                        </Text>
                      )} */}
                    </View>
                    <Icon
                      type="material"
                      name={
                        expandedPlaylistId === playlist._id
                          ? 'expand-less'
                          : 'expand-more'
                      }
                      size={24}
                      color={COLORS.blue043142}
                    />
                  </TouchableOpacity>

                  {/* Expanded playlist content */}
                  {expandedPlaylistId === playlist._id && (
                    <View style={styles.expandedContent}>
                      {playlistPosts.map((post, postIdx) => (
                        <TouchableOpacity
                          key={postIdx}
                          style={[
                            styles.playlistPostItem,
                            post._id === item._id && styles.highlightedPost,
                          ]}
                          onPress={() => handlePlaylistVideoPress(post)}>
                          <View style={styles.postThumbnailContainer}>
                            {post.thumbnail ? (
                              <Image
                                source={{uri: post.thumbnail}}
                                style={styles.postThumbnail}
                              />
                            ) : (
                              <View style={styles.postThumbnailPlaceholder}>
                                <Icon
                                  type="feather"
                                  name="video"
                                  size={24}
                                  color={COLORS.whiteFFFFFF}
                                />
                              </View>
                            )}
                          </View>
                          <View style={styles.postDetails}>
                            <Text variant="medium14" color={COLORS.blue043142}>
                              {post.heading}
                            </Text>
                          </View>
                          {post._id === item._id}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text variant="regular14" color={COLORS.grey333333}>
                This video is not part of any playlist
              </Text>
            )}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  // Add new handler for playlist video selection
  const handlePlaylistVideoPress = post => {
    if (post._id === item._id) {
      // Currently playing video - do nothing or maybe restart
      return;
    }

    // Update the current video
    setSelectedIndex(post._id);
    // Additional video player logic here
  };

  const fetchPostDetails = async postId => {
    try {
      // Get the latest token from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const currentToken = userData ? JSON.parse(userData).token : null;

      // For public playlists, we'll try to fetch without token first
      let response;
      try {
        response = await axios.get(
          `https://api.scaleupapp.club/api/content/post/${postId}`,
        );
      } catch (err) {
        // If that fails and we have a token, try with authentication
        if (currentToken) {
          response = await axios.get(
            `https://api.scaleupapp.club/api/content/post/${postId}`,
            {
              headers: {
                Authorization: `Bearer ${currentToken}`,
              },
            },
          );
        } else {
          throw err;
        }
      }
      return response.data.contentDetails;
    } catch (err) {
      // Don't log 403 errors as they're expected for private posts
      if (err?.response?.status !== 403) {
        console.error(`Failed to fetch details for post ${postId}:`, err);
      }
      return null;
    }
  };

  // Function to fetch posts for a specific playlist
  const fetchPlaylistPosts = async playlistId => {
    setIsLoadingPlaylists(true);
    try {
      const userData = await AsyncStorage.getItem('userData');
      const currentToken = userData ? JSON.parse(userData).token : null;

      // Prepare headers object
      const headers = currentToken
        ? {
            Authorization: `Bearer ${currentToken}`,
          }
        : {};

      const response = await axios.get(
        `https://api.scaleupapp.club/api/playlists/public/${playlistId}`,
      );

      const posts = response.data.items.map(item => item.postId);
      // console.log('postssssssss', posts);
      const postDetails = await Promise.all(
        posts.map(postId => fetchPostDetails(postId)),
      );
      // console.log('postdetailsssssss', postDetails);

      setPlaylistPosts(postDetails.filter(post => post !== null));
    } catch (error) {
      console.error('Error fetching playlist posts:', error);
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  useEffect(() => {
    if (item?.contentType === 'Video') {
      fetchPlaylistInfo();
      checkPremiumAccess();
    }
  }, [item, profileData]);

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

  const menuItems = [
    {
      name: 'Report',
      // image: icons.innercircle,
      onPress: () => {
        setVisible(false);
        setTimeout(() => {
          setModalVisible(true);
        }, 500);
      },
    },
  ];

  const menuItems1 = [
    {
      name: 'Add to playlist',
      // image: icons.block,
      onPress: () => {
        setVisible(false);
        handleBookmarkPress();
      },
    },
    ...(myProfile
      ? [
          {
            name: 'Delete Post',
            // image: icons.block,
            onPress: () => {
              setVisible(false);
              setTimeout(() => {
                setDeleteModalVisible(true);
              }, 500);
            },
          },
        ]
      : []),
  ];

  const handleDelete = async () => {
    setDeleteModalVisible(false);
    try {
      const {data} = await deleteContent(postId);
      showToast({type: 'success', title: data?.message});
      // if (myProfile) {
      navigationRef.goBack();
      // } else {
      //   navigationRef.reset({
      //     index: 0,
      //     routes: [{name: Routes.Home}],
      //   });
      // }
    } catch (error) {
      console.log('🚀 ~ handleDelete ~ error:', error);
    }
  };

  const ReportHanlder = async reportType => {
    setModalVisible(false);
    const paylaod = {
      reportType: reportType,
    };
    try {
      const {data} = await ReportPost(postId, paylaod);
      showToast({type: 'success', title: data?.message});
    } catch (error) {}
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
    setTimeout(() => {
      setIsPlaylistModalVisible(true);
    }, 500);
  };

  const handleBookmark = async (userId, postId) => {
    try {
      // First, check if the post is already in the playlist
      const checkResponse = await axios.get(
        `https://api.scaleupapp.club/api/playlists/check?userId=${userId}&postId=${postId}`,
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
      await axios.post('https://api.scaleupapp.club/api/playlists', {
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

const renderVideoContainer = () => (
  <View style={styles.videoContainer}>
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
    {playlistInfo && playlistInfo.length > 0 && showInfoButton && (
      <TouchableOpacity
        style={styles.infoButton}
        onPress={() => {
          setShowPlaylistInfo(true);
        }}>
        <Icon
          type="feather"
          name="info"
          size={20}
          color={COLORS.whiteFFFFFF}
        />
      </TouchableOpacity>
    )}
    <VideoPostPlayer
      videoUrl={item?.contentURL}
      thumbnail={item?.thumbnail}
      isVisible={isVideoVisible}
      videoDimensions={videoDimensions}
      premiumData={{
              ...premiumData,
              contentId: postId,
              contentTitle: item?.heading || item?.title
            }}
      onPreviewEnd={() => setShowPremiumLock(true)}
      onProgress={progress => {
        if (progress.currentTime >= 5) {
          setShowInfoButton(true);
        }
      }}
      onEnd={() => {
        // Optional: Handle video completion
      }}
    />
  </View>
);

  // console.log({profileData});
  const profilePicture = myProfile
    ? profileData?.profilePicture
    : item?.userId?.profilePicture;
  const usernameIcon = myProfile
    ? `${profileData?.firstname?.charAt(0).toUpperCase()}${profileData?.lastname
        ?.charAt(0)
        .toUpperCase()}`
    : item?.userId?.firstname
    ? `${item?.userId?.firstname
        ?.charAt(0)
        .toUpperCase()}${item?.userId?.lastname?.charAt(0).toUpperCase()}`
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
      <View style={styles.view} ref={componentRef} collapsable={false}>
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
        <Pressable
          onPress={() => {
            getmeasure();
            setVisible(!visible);
          }}>
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
      {item?.contentType === 'Video' && item?.contentURL
        ? renderVideoContainer()
        : null}

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
      {visible ? (
        <MenuModal
          visible={visible}
          setVisible={setVisible}
          menuItems={
            item?.userId?._id !== profileData?.id ? menuItems : menuItems1
          }
          style={{
            position: 'absolute',
            top: position + nh(20),
            right: nw(16),
            margin: 0,
          }}
        />
      ) : null}

      {isModalVisible ? (
        <ReportPostModal
          isModalVisible={isModalVisible}
          setModalVisible={setModalVisible}
          handleReport={ReportHanlder}
        />
      ) : null}

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
      <PlaylistInfoModal />

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
  postThumbnailContainer: {
    marginRight: 12,
  },
  postThumbnailPlaceholder: {
    width: 80,
    height: 45,
    borderRadius: 8,
    backgroundColor: COLORS.black000000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postThumbnail: {
    width: 80,
    height: 45,
    borderRadius: 8,
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
  verifiedBadge: {
    height: nh(30),
    width: nh(30),
    borderRadius: nh(15),
    backgroundColor: COLORS.blue043142,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 10,
    top: 20,
    zIndex: 1,
  },
  infoButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Slightly darker overlay
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16, // More rounded corners
    shadowColor: COLORS.blue043142,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyD6D6D6,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyD6D6D6,
    backgroundColor: COLORS.whiteFFFFFF,
    transition: 'background-color 0.2s',
  },
  playlistItemPressed: {
    backgroundColor: COLORS.blue043142 + '10', // Slight background on press
  },
  playlistIcon: {
    marginLeft: 12,
    opacity: 0.7,
  },
  expandedContent: {
    backgroundColor: COLORS.greyF5F5F5,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  playlistPostItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyD6D6D6,
  },
  highlightedPost: {
    backgroundColor: 'rgba(245, 190, 0, 0.15)', // More subtle highlight
    borderRadius: 8,
  },
  postThumbnail: {
    width: 80,
    height: 45,
    borderRadius: 8, // More rounded
    marginRight: 12,
  },
});

export default PostView;
