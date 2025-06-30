import React, {useState, useEffect, useRef} from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  Pressable,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {COLORS} from '../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../helper/scales';
import {Image} from 'react-native';
import Video from 'react-native-video';
import Icons from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';
import PlaylistSelectionModal from '../screens/Home/PlaylistSelectionModal';
import {useToast} from './CustomToast';
import {deleteContent, getProfile} from '../services/apiService';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Routes from '../helper/routes';
import convertToProxyURL from 'react-native-video-cache';
import Icon from '../helper/icon';
import {MenuModal} from './MenuModal';
import DeleteConfirmationModal from '../screens/Post/DeleteConfirmationModal';

const Postcard = ({
  item,
  index,
  setVisible,
  data,
  navigation,
  myProfile,
  isDrafts,
  handlePublish,
  setPosition,
}) => {
  const componentRef = useRef(null);

  const getmeasure = () => {
    if (componentRef.current) {
      componentRef.current.measure((x, y, width, height, pageX, pageY) => {
        console.log('🚀 ~ componentRef.current.measure ~ pageY:', pageY);
        console.log('🚀 ~ componentRef.current.measure ~ pageX:', pageX);
        setPosition({pageX: pageX, pageY: pageY, item: item});
      });
    }
  };
  return (
    <View style={styles.postContainer}>
      <View>
        {myProfile ? (
          <View style={styles.headerContainer} ref={componentRef}>
            <TouchableOpacity
              style={styles.dotsButton}
              onPress={() => {
                getmeasure();
                setVisible(true);
                // console.log('Dots button pressed for item:', item?.contentId);
                // handleBookmarkPress(item);
              }}>
              <Icons
                name="ellipsis-vertical"
                size={20}
                color={COLORS.blue043142}
              />
            </TouchableOpacity>
          </View>
        ) : null}
        {item?.smeVerify && (
          <View
            style={{
              height: nh(25),
              width: nw(25),
              borderRadius: nh(15),
              backgroundColor: COLORS.blue043142,
              alignItems: 'center',
              justifyContent: 'center',
              position: 'absolute',
              right: nw(12),
              top: nh(35),
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
        {(item?.contentType === 'Image' || item?.contentType === 'Document') &&
        item?.contentURL ? (
          <Pressable
            style={styles.imageContainer}
            onPress={() => {
              const content = data?.content;
              const stories1 = content?.filter(f => f === item);
              const stories2 = content?.filter(f => f !== item);
              const newData = {
                ...data,
                content: [...stories1, ...stories2],
              };
              navigation.navigate(Routes.UserPost, {
                data: newData,
                myProfile: myProfile,
              });
            }}>
            <Image
              source={{uri: item?.contentURL}}
              style={styles.mediaContent}
              resizeMode="cover"
            />
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Icons name="heart" size={16} color={COLORS.whiteFFFFFF} />
                <Text style={styles.metricText}>{item?.likeCount || 0}</Text>
              </View>
              {item?.rating && item?.rating > 0 ? (
                <View style={styles.metricItem}>
                  <Icons name="star" size={16} color={COLORS.whiteFFFFFF} />
                  <Text style={styles.metricText}>{item?.rating}</Text>
                </View>
              ) : null}
              <View style={styles.metricItem}></View>
            </View>
          </Pressable>
        ) : null}

        {item?.contentType === 'Video' && item?.contentURL ? (
          <Pressable
            style={styles.videoContainer}
            onPress={() => {
              const content = data?.content;
              const stories1 = content?.filter(f => f === item);
              const stories2 = content?.filter(f => f !== item);
              const newData = {
                ...data,
                content: [...stories1, ...stories2],
              };
              navigation.navigate(Routes.UserPost, {
                data: newData,
                item: item,
                index: index,
              });
            }}>
            <Video
              paused={true}
              controls={false}
              source={{uri: convertToProxyURL(item?.contentURL)}}
              style={styles.mediaContent}
              resizeMode="cover"
              onBuffer={e => console.log('buffer ', e)}
              onError={e => console.log('video error ', e)}
            />
            <View style={styles.metricsContainer}>
              <View style={styles.metricItem}>
                <Icons name="heart" size={16} color={COLORS.whiteFFFFFF} />
                <Text style={styles.metricText}>{item?.likeCount || 0}</Text>
              </View>
              <View style={styles.metricItem}>
                <Icons name="eye" size={16} color={COLORS.whiteFFFFFF} />
                <Text style={styles.metricText}>{item?.viewCount || 0}</Text>
              </View>
              {item?.rating && item?.rating > 0 ? (
                <View style={styles.metricItem}>
                  <Icons name="star" size={16} color={COLORS.whiteFFFFFF} />
                  <Text style={styles.metricText}>{item?.rating}</Text>
                </View>
              ) : null}
            </View>
          </Pressable>
        ) : null}
      </View>

      {isDrafts && (
        <View style={styles.draftControls}>
          {/* <Text style={styles.draftLabel}>DRAFT</Text> */}
          <TouchableOpacity
            style={styles.publishButton}
            onPress={() => handlePublish(item)}>
            <Icon name="cloud-upload" size={20} color={COLORS.blue043142} />
            <Text style={styles.publishText}>Publish</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export const AllPost = ({
  data,
  isDrafts = false,
  myProfile = true,
  apicall,
}) => {
  // console.log('AllPost Component Rendered with data:', data);

  const navigation = useNavigation();
  const {showToast} = useToast();
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [postDetails, setPostDetails] = useState({});
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({pageX: 0, pageY: 0, item: {}});
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  const menuItems1 = [
    {
      name: 'Add to playlist',
      // image: icons.block,
      onPress: () => {
        setVisible(false);
        handleBookmarkPress(position.item);
      },
    },
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
  ];

  // apicall

  const handleDelete = async () => {
    setDeleteModalVisible(false);
    try {
      const {data} = await deleteContent(position.item?.contentId);
      showToast({type: 'success', title: data?.message});
      apicall();
    } catch (error) {
      console.log('🚀 ~ handleDelete ~ error:', error);
    }
  };

  useEffect(() => {
    // console.log('Initial useEffect running - fetching profile data');

    getProfileData();
  }, []);

  useEffect(() => {
    //console.log('Modal visibility changed:', isPlaylistModalVisible);
    // console.log('Selected post:', selectedPost);
  }, [isPlaylistModalVisible, selectedPost]);

  const getProfileData = async () => {
    try {
      const res = await getProfile('');
      //console.log('Profile data response:', res?.data?.userProfileInfo);

      setProfileData(res?.data?.userProfileInfo);
    } catch (error) {
      // console.log('Profile data fetch error:', error?.response?.data?.message);
    }
  };

  const checkPostInPlaylists = async postId => {
    //console.log('Checking post in playlists. PostId:', postId);
    //console.log('Current profileData:', profileData);

    if (!profileData?.id) {
      //console.log('No profile ID available');
      return false;
    } //console.log('sddsfdsf',profileData)

    try {
      // Updated to use the correct endpoint
      const response = await axios.get(
        `http://192.168.1.8:3000/api/playlists/check?userId=${profileData.id}&postId=${postId}`,
      );

      //console.log('Check playlist response:', response.data);

      // Handle the response based on the backend's structure
      if (response.data.exists) {
        showToast({
          title: response.data.message || 'This post is already in a playlist',
          type: 'info',
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        'Error checking post in playlists:',
        error?.response?.data?.message || error.message,
      );
      showToast({
        title: 'Error checking playlist status',
        type: 'error',
      });
      return false;
    }
  };

  const handlePublish = item => {
    const fileExtension = item.contentURL.split('.').pop();
    const fileName = `draft_media.${fileExtension}`;

    let mimeType = 'image/jpeg';
    if (item.contentType === 'Video') {
      mimeType = 'video/mp4';
    } else if (fileExtension === 'png') {
      mimeType = 'image/png';
    }

    const formattedTopics = Array.isArray(item.relatedTopics)
      ? item.relatedTopics.join(', ')
      : item.relatedTopics;

    const formattedHashtags = Array.isArray(item.hashtags)
      ? item.hashtags.join(' ')
      : item.hashtags;

    navigation.navigate('CreatePost', {
      draftData: {
        id: item._id,
        heading: item.heading,
        relatedTopics: formattedTopics,
        captions: item.captions,
        hashtags: formattedHashtags,
        contentType: item.contentType,
        file: {
          uri: item.contentURL,
          type: mimeType,
          name: fileName,
        },
      },
    });
  };

  // Add the fetchPostDetails function
  const fetchPostDetails = async postId => {
    try {
      // Get the latest token from AsyncStorage
      const userData = await AsyncStorage.getItem('userData');
      const currentToken = userData ? JSON.parse(userData).token : null;

      let response;
      try {
        // First attempt without token
        response = await axios.get(
          `http://192.168.1.8:3000/api/content/post/${postId}`,
        );
      } catch (err) {
        // If that fails and we have a token, try with authentication
        if (currentToken) {
          response = await axios.get(
            `http://192.168.1.8:3000/api/content/post/${postId}`,
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

      // Store the post details in state
      setPostDetails(prevDetails => ({
        ...prevDetails,
        [postId]: response.data.contentDetails,
      }));

      return response.data.contentDetails;
    } catch (err) {
      if (err?.response?.status !== 403) {
        console.error(`Failed to fetch details for post ${postId}:`, err);
      }
      return null;
    }
  };

  const handleBookmarkPress = async item => {
    // console.log('handleBookmarkPress called with item:', item);
    //console.log('Current profileData:', profileData);

    if (!profileData?.id) {
      showToast({
        title: 'Please login to bookmark posts',
        type: 'error',
      });
      return;
    }

    // Fetch post details if we don't have them yet
    let currentPostDetails = postDetails[item?.contentId];
    // console.log(currentPostDetails);
    if (!currentPostDetails) {
      currentPostDetails = await fetchPostDetails(item?.contentId);
      if (!currentPostDetails) {
        showToast({
          title: 'Unable to fetch post details',
          type: 'error',
        });
        return;
      }
    }

    // Check if the post belongs to the logged-in user
    if (currentPostDetails?.username !== profileData?.username) {
      showToast({
        title: 'You can only bookmark your own video posts',
        type: 'error',
      });
      return;
    }

    if (item?.contentType !== 'Video') {
      showToast({
        title: 'Cannot add image to the playlist',
        type: 'error',
      });
      return;
    }

    // Check if post is already in any playlist
    //console.log('Checking if post is in playlist...');
    const isInPlaylist = await checkPostInPlaylists(item._id);
    //console.log('isInPlaylist result:', isInPlaylist);

    if (!isInPlaylist) {
      //console.log('Setting selected post:', item);
      setSelectedPost(item);
      //console.log('Setting modal visible to true');
      setIsPlaylistModalVisible(true);
    }
  };

  const handlePlaylistSuccess = () => {
    showToast({
      title: 'Post added to playlist successfully',
      type: 'success',
    });
    setIsPlaylistModalVisible(false);
    setSelectedPost(null);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={data?.content}
        renderItem={({item, index}) => (
          <Postcard
            item={item}
            index={index}
            setVisible={setVisible}
            data={data}
            navigation={navigation}
            myProfile={myProfile}
            isDrafts={isDrafts}
            handlePublish={handlePublish}
            setPosition={setPosition}
          />
        )}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isDrafts ? 'No draft posts yet' : 'No posts available'}
            </Text>
          </View>
        )}
      />

      {/* {console.log('Rendering PlaylistSelectionModal with:', {
        visible: isPlaylistModalVisible,
        postId: selectedPost?.contentId
      })} */}

      <PlaylistSelectionModal
        visible={isPlaylistModalVisible}
        onClose={() => {
          //console.log('Modal onClose called');

          setIsPlaylistModalVisible(false);
          setSelectedPost(null);
        }}
        postId={selectedPost?.contentId}
        onPostAdded={handlePlaylistSuccess}
      />
      {visible ? (
        <MenuModal
          visible={visible}
          setVisible={setVisible}
          menuItems={menuItems1}
          style={{
            maxHeight: '80%',
            position: 'absolute',
            // bottom: 0,
            // bottom: nh(400),
            top: position.pageY,
            left: position.pageX,
            // right: DEVICE_WIDTH / 2 - 70,
            margin: 0,
            width: nw(140),
          }}
        />
      ) : null}

      <DeleteConfirmationModal
        visible={deleteModalVisible}
        onConfirm={handleDelete}
        onCancel={() => setDeleteModalVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: nw(10),
  },
  postContainer: {
    marginVertical: nh(2),
  },
  headerContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 1,
  },
  dotsButton: {
    padding: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
  },
  imageContainer: {
    marginVertical: nh(2),
    position: 'relative',
  },
  videoContainer: {
    borderRadius: nh(10),
    marginRight: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.grey333333 + '10',
    position: 'relative',
  },
  mediaContent: {
    height: 200,
    width: (DEVICE_WIDTH - nw(48)) / 2,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(12),
    borderWidth: 1,
    borderColor: COLORS.grey333333 + '10',
  },
  metricsContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 16,
    padding: 6,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 4,
  },
  metricText: {
    color: COLORS.whiteFFFFFF,
    marginLeft: 4,
    fontSize: 12,
  },
  draftControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nh(6),
    marginTop: nh(4),
  },
  draftLabel: {
    color: COLORS.grey999999,
    fontSize: 12,
    fontWeight: 'bold',
  },
  publishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: nh(4),
  },
  publishText: {
    alignItems: 'center',
    justifyContent: 'center',
    color: COLORS.blue043142,
    marginLeft: nw(4),
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: nh(40),
  },
  emptyText: {
    color: COLORS.grey999999,
    fontSize: 16,
  },
});
