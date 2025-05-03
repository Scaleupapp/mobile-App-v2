import React, { useState, useEffect } from 'react';
import { View, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import Text from '../../components/Text';
import Icon from '../../helper/icon';
import { COLORS } from '../../helper/colors';
import VideoPlayerModal from './VideoPlayerModal';
import PlaylistCommentsModal from './PlaylistCommentsModal';
import PlaylistInfoModal from './PlaylistInfoModal';
import { StyleSheet } from 'react-native';
import { nh, nw } from '../../helper/scales';

const UserPlaylists = () => {
  // State Management
  const [playlists, setPlaylists] = useState([]);
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null);

  const [isCommentsModalVisible, setIsCommentsModalVisible] = useState(false);
  const [selectedPlaylistForComments, setSelectedPlaylistForComments] = useState(null);
  const [isInfoModalVisible, setIsInfoModalVisible] = useState(false);
  const [selectedPlaylistForInfo, setSelectedPlaylistForInfo] = useState(null);

  // Initialize authentication on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          const parsedData = JSON.parse(userData);
          const decodedToken = jwtDecode(parsedData.token);
          setToken(parsedData.token);
          setUserId(decodedToken.userId);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();
  }, []);

  // Fetch playlists when userId is available
  useEffect(() => {
    if (userId) {
      fetchUserPlaylists();
    }
  }, [userId]);

  const fetchUserPlaylists = async () => {
    try {
      const response = await axios.get(
        `http://192.168.84.240:3000/api/playlists?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Fetch details for posts in each playlist
      const playlistsWithDetails = await Promise.all(
        response.data.map(async playlist => {
          const postDetailsPromises = playlist.items.map(async item => {
            const details = await fetchPostDetails(item.postId);
            return { postId: item.postId, details };
          });

          const resolvedPostDetails = await Promise.all(postDetailsPromises);
          const postDetailsMap = resolvedPostDetails.reduce((acc, item) => {
            if (item.details) {
              acc[item.postId] = item.details;
            }
            return acc;
          }, {});

          return {
            ...playlist,
            postDetailsMap,
          };
        })
      );

      setPlaylists(playlistsWithDetails);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
    }
  };

  const fetchPostDetails = async (postId) => {
    try {
      const response = await axios.get(
        `http://192.168.84.240:3000/api/content/post/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.contentDetails;
    } catch (error) {
      console.error(`Failed to fetch details for post ${postId}:`, error);
      return null;
    }
  };

  const handleVideoPress = (postDetail, playlistId) => {
    if (postDetail.contentType === 'Video') {
      setSelectedVideo({
        ...postDetail,
        playlistId,
      });
      setIsVideoModalVisible(true);
    }
  };

  const handleVideoEnd = async () => {
    if (!selectedVideo || !selectedVideo.playlistId) return;
    try {
      await markPostAsViewed(selectedVideo.playlistId, selectedVideo._id);
    } catch (error) {
      console.error('Failed to mark video as viewed:', error);
    }
  };

  const markPostAsViewed = async (playlistId, postId) => {
    try {
      await axios.post(
        'http://192.168.84.240:3000/api/playlists/mark-viewed',
        {
          userId,
          playlistId,
          postId,
        }
      );
    } catch (error) {
      console.error('Failed to mark post as viewed:', error);
    }
  };

  const togglePlaylistExpansion = playlistId => {
    setExpandedPlaylist(expandedPlaylist === playlistId ? null : playlistId);
  };

  const openCommentsModal = (playlist, e) => {
    e?.stopPropagation();
    setSelectedPlaylistForComments(playlist);
    setIsCommentsModalVisible(true);
  };

  const openInfoModal = (playlist, e) => {
    e?.stopPropagation();
    setSelectedPlaylistForInfo(playlist);
    setIsInfoModalVisible(true);
  };

  const closeInfoModal = () => {
    setIsInfoModalVisible(false);
    setSelectedPlaylistForInfo(null);
  };

  const renderPlaylistItem = ({ item: playlist }) => {
    const isExpanded = expandedPlaylist === playlist._id;

    return (
      <View style={styles.playlistContainer}>
        <TouchableOpacity
          style={styles.playlistHeader}
          onPress={() => togglePlaylistExpansion(playlist._id)}>
          <View style={styles.playlistHeaderContent}>
            <Text variant="semibold16" color={COLORS.blue043142}>
              {playlist.playlistName}
            </Text>
            <Text variant="medium12" color={COLORS.grey999999}>
              {playlist.items.length} posts
            </Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={(e) => openCommentsModal(playlist, e)}
              style={styles.headerIcon}>
              <Icon
                type="ionicon"
                name="chatbubble-ellipses-outline"
                size={24}
                color={COLORS.blue043142}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => openInfoModal(playlist, e)}
              style={styles.headerIcon}>
              <Icon
                type="ionicon"
                name="information-circle-outline"
                size={24}
                color={COLORS.blue043142}
              />
            </TouchableOpacity>
            <Icon
              type="ionicon"
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={COLORS.blue043142}
            />
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <FlatList
            data={playlist.items}
            keyExtractor={item => item.postId}
            renderItem={({ item }) => {
              const postDetail = playlist.postDetailsMap[item.postId];
              if (!postDetail) return null;

              const isViewed = item.viewedStatus?.some(
                status => status.userId === userId && status.isViewed
              );

              return (
                <TouchableOpacity
                  style={styles.videoItem}
                  onPress={() => handleVideoPress(postDetail, playlist._id)}>
                  <View style={styles.videoThumbnail}>
                    <Image
                      source={{ uri: postDetail.contentURL }}
                      style={styles.thumbnailImage}
                      resizeMode="cover"
                    />
                    {postDetail.contentType === 'Video' && (
                      <View style={styles.playOverlay}>
                        <Icon
                          type="ionicon"
                          name="play-circle"
                          size={50}
                          color={COLORS.whiteFFFFFF}
                        />
                      </View>
                    )}
                  </View>
                  <View style={styles.videoDetails}>
                    <Text variant="semibold14" color={COLORS.blue043142}>
                      {postDetail.heading || 'Untitled Post'}
                    </Text>
                    <Text variant="medium12" color={COLORS.grey999999}>
                      {postDetail.username || 'Unknown User'}
                    </Text>
                    {isViewed && (
                      <Icon
                        type="ionicon"
                        name="checkmark-circle"
                        size={24}
                        color="green"
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={playlists}
        renderItem={renderPlaylistItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.playlistsList}
      />

      {selectedVideo && (
        <VideoPlayerModal
          visible={isVideoModalVisible}
          videoUrl={selectedVideo.contentURL}
          onClose={() => setIsVideoModalVisible(false)}
          onVideoEnd={handleVideoEnd}
          playlistId={selectedVideo.playlistId}
          postId={selectedVideo._id}
        />
      )}

      <PlaylistCommentsModal
        visible={isCommentsModalVisible}
        playlistId={selectedPlaylistForComments?._id}
        userId={userId}
        username="democommentuser"
        isPlaylistOwner={true}
        onClose={() => {
          setIsCommentsModalVisible(false);
          setSelectedPlaylistForComments(null);
        }}
      />

      <PlaylistInfoModal 
        visible={isInfoModalVisible}
        onClose={closeInfoModal}
        playlist={selectedPlaylistForInfo}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: COLORS.whiteFFFFFF,
    },
    playlistsList: {
      padding: nw(16),
    },
    playlistContainer: {
      marginBottom: nh(16),
      backgroundColor: COLORS.whiteFFFFFF,
      borderRadius: 8,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    playlistHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: nw(16),
      borderBottomWidth: 1,
      borderBottomColor: COLORS.greyEEEEEE,
    },
    playlistHeaderContent: {
      flex: 1,
    },
    videoItem: {
      flexDirection: 'row',
      padding: nw(12),
      borderBottomWidth: 1,
      borderBottomColor: COLORS.greyEEEEEE,
    },
    videoThumbnail: {
      width: nw(120),
      height: nh(80),
      borderRadius: 8,
      overflow: 'hidden',
      position: 'relative',
    },
    thumbnailImage: {
      width: '100%',
      height: '100%',
    },
    playOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    videoDetails: {
      flex: 1,
      marginLeft: nw(12),
      justifyContent: 'center',
    },
    headerActions: {
        flexDirection: 'row',
        alignItems: 'center',
      },
      headerIcon: {
        marginRight: nw(12),
        padding: nw(4),
      },
      playlistHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: nw(16),
        borderBottomWidth: 1,
        borderBottomColor: COLORS.greyEEEEEE,
      },
      playlistHeaderContent: {
        flex: 1,
      },
  });

export default UserPlaylists;