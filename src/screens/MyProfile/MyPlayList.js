import React, { useEffect, useState, useRef } from 'react';
import {
  View, 
  FlatList, 
  StyleSheet, 
  Image, 
  TouchableOpacity,
  Modal,
  Dimensions,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Alert,
  TextInput
} from 'react-native';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import { COLORS } from '../../helper/colors';
import { DEVICE_WIDTH, nh, nw } from '../../helper/scales';
import { APP_FONTS } from '../../assets/fonts';
import Video from 'react-native-video';
import Icon from '../../helper/icon';
import Header from '../../components/Header';
import { images } from '../../assets/images';
import Text from '../../components/Text';
import Button from '../../components/Button';
import { navigationRef } from '../../../App';

// Video Player Modal Component (Kept from original code)
const VideoPlayerModal = ({ 
  visible, 
  videoUrl, 
  onClose 
}) => {
  const videoRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [videoError, setVideoError] = useState(null);

  const handleRotate = () => {
    setRotation((prevRotation) => {
      const newRotation = (prevRotation + 90) % 360;
      return newRotation;
    });
  };

  const togglePlayPause = () => {
    setIsPaused(!isPaused);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <TouchableOpacity 
          style={styles.closeButton} 
          onPress={onClose}
        >
          <Icon 
            type="ionicon" 
            name="close" 
            size={30} 
            color={COLORS.whiteFFFFFF} 
          />
        </TouchableOpacity>

        <View style={styles.videoContainer}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={[
              styles.videoPlayer,
              { 
                transform: [{ rotate: `${rotation}deg` }],
                aspectRatio: 16/9,
                width: '100%',
                height: '100%'
              }
            ]}
            paused={isPaused}
            muted={isMuted}
            controls={false}
            fullscreen={true}
            resizeMode="contain"
            onLoadStart={() => console.log('Video loading started:', videoUrl)}
            onLoad={() => console.log('Video loaded successfully')}
            onError={(error) => {
              console.error('Video Error:', error);
              setVideoError(error);
            }}
            pictureInPicture={true}
          />

          {videoError && (
            <View style={styles.errorOverlay}>
              <Text style={styles.errorText}>
                Unable to load video: {videoError.toString()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.controlOverlay}>
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={togglePlayPause}
          >
            <Icon 
              type="ionicon" 
              name={isPaused ? "play" : "pause"} 
              size={30} 
              color={COLORS.whiteFFFFFF} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={toggleMute}
          >
            <Icon 
              type="ionicon" 
              name={isMuted ? "volume-mute" : "volume-high"} 
              size={30} 
              color={COLORS.whiteFFFFFF} 
            />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.controlButton}
            onPress={handleRotate}
          >
            <Icon 
              type="ionicon" 
              name="refresh" 
              size={30} 
              color={COLORS.whiteFFFFFF} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const MyPlaylists = ({ navigation }) => {
  const [playlists, setPlaylists] = useState([]);
  const [expandedPlaylist, setExpandedPlaylist] = useState(null);
  const [postDetails, setPostDetails] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isVideoModalVisible, setIsVideoModalVisible] = useState(false);
  const [isCreatePlaylistModalVisible, setIsCreatePlaylistModalVisible] = useState(false);
  const [isEditPlaylistModalVisible, setIsEditPlaylistModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [playlistToEdit, setPlaylistToEdit] = useState(null);

  // Get the user token from the Redux store
  const token = useSelector((state) => state.auth.userData.token);
  const userId = token ? jwtDecode(token)?.userId : null;

  // Fetch post details for a single post
  const fetchPostDetails = async (postId) => {
    try {
      const response = await axios.get(
        `http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/content/post/${postId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.contentDetails;
    } catch (err) {
      console.error(`Failed to fetch details for post ${postId}:`, err);
      return null;
    }
  };

  useEffect(() => {
    const fetchUserPlaylists = async () => {
      try {
        // Fetch playlists for the specific user
        const response = await axios.get(`http://192.168.48.240:5000/api/playlists?userId=${userId}`);
        
        // Fetch details for posts in each playlist
        const playlistsWithDetails = await Promise.all(
          response.data.map(async (playlist) => {
            const postDetailsPromises = playlist.items.map(async (item) => {
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
              postDetailsMap
            };
          })
        );

        setPlaylists(playlistsWithDetails);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch playlists:', err);
        setLoading(false);
        Alert.alert('Error', 'Failed to load playlists');
      }
    };

    if (userId) {
      fetchUserPlaylists();
    }
  }, [userId]);

  const handleVideoPress = (postDetail) => {
    if (postDetail.contentType === 'Video') {
      setSelectedVideo(postDetail);
      setIsVideoModalVisible(true);
    }
  };




   // Create a new playlist
   const createPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      const response = await axios.post('http://192.168.48.240:5000/api/playlists/create', {
        userId,
        playlistName: newPlaylistName
      });

      // Update local state to include new playlist
      setPlaylists([...playlists, response.data]);
      
      // Reset and close modal
      setNewPlaylistName('');
      setIsCreatePlaylistModalVisible(false);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create playlist');
    }
  };

  // Rename a playlist
  const renamePlaylist = async () => {
    if (!newPlaylistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    try {
      const response = await axios.put('http://192.168.48.240:5000/api/playlists/rename', {
        userId,
        playlistId: playlistToEdit._id,
        newPlaylistName
      });

      // Update local state with renamed playlist
      const updatedPlaylists = playlists.map(playlist => 
        playlist._id === playlistToEdit._id 
          ? { ...playlist, playlistName: newPlaylistName } 
          : playlist
      );
      setPlaylists(updatedPlaylists);
      
      // Reset and close modal
      setNewPlaylistName('');
      setIsEditPlaylistModalVisible(false);
      setPlaylistToEdit(null);
    } catch (error) {
      console.error('Failed to rename playlist:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to rename playlist');
    }
  };

  // Delete a playlist
  const deletePlaylist = async (playlistId) => {
    try {
      await axios.delete('http://192.168.48.240:5000/api/playlists/delete', {
        data: { userId, playlistId }
      });

      // Update local state to remove deleted playlist
      const updatedPlaylists = playlists.filter(playlist => playlist._id !== playlistId);
      setPlaylists(updatedPlaylists);
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to delete playlist');
    }
  };

  // Create Playlist Modal
  const CreatePlaylistModal = React.memo(() => {
    return (
      <Modal
        visible={isCreatePlaylistModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCreatePlaylistModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text variant="semibold16" color={COLORS.blue043142}>
              Create New Playlist
            </Text>
            <TextInput
              placeholder="Enter playlist name"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              style={styles.playlistInput}
              autoFocus={true} // This helps with focus
              clearButtonMode="while-editing" // Adds clear button on iOS
              returnKeyType="done"
              onSubmitEditing={createPlaylist}
            />
            <View style={styles.modalButtons}>
              <Button
                text="Cancel"
                width={nw(120)}
                backgroundColor={COLORS.grey999999}
                onPress={() => {
                  setIsCreatePlaylistModalVisible(false);
                  setNewPlaylistName(''); // Reset name when canceling
                }}
              />
              <Button
                text="Done"
                width={nw(120)}
                onPress={createPlaylist}
                disabled={!newPlaylistName.trim()} // Disable when empty
              />
            </View>
          </View>
        </View>
      </Modal>
    );
  });
  

  // Edit Playlists Modal
  const EditPlaylistsModal = () => (
    <Modal
      visible={isEditPlaylistModalVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setIsEditPlaylistModalVisible(false)}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text variant="semibold16" color={COLORS.blue043142}>
            Edit Playlists
          </Text>
          <ScrollView style={{maxHeight: nh(300)}}>
            {playlists.map((playlist) => (
              <View key={playlist._id} style={styles.editPlaylistItem}>
                <Text variant="medium14" color={COLORS.blue043142} style={{flex: 1}}>
                  {playlist.playlistName}
                </Text>
                <TouchableOpacity 
                  onPress={() => {
                    setPlaylistToEdit(playlist);
                    setNewPlaylistName(playlist.playlistName);
                    setIsEditPlaylistModalVisible(false);
                    // Slight delay to ensure modal is fully closed
                    setTimeout(() => {
                      setIsEditPlaylistModalVisible(true);
                    }, 100);
                  }}
                >
                  <Icon type="ionicon" name="pencil" size={20} color={COLORS.blue043142} />
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    Alert.alert(
                      'Delete Playlist', 
                      `Are you sure you want to delete "${playlist.playlistName}"?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Delete', 
                          style: 'destructive', 
                          onPress: () => deletePlaylist(playlist._id) 
                        }
                      ]
                    );
                  }}
                >
                  <Icon type="ionicon" name="trash" size={20} color={COLORS.red} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
          <View style={styles.modalButtons}>
            <Button
              text="Close"
              width={nw(250)}
              onPress={() => setIsEditPlaylistModalVisible(false)}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  // Rename Playlist Modal (when editing a specific playlist)
  const RenamePlaylistModal = () => (
    <Modal
      visible={playlistToEdit !== null}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setPlaylistToEdit(null)}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text variant="semibold16" color={COLORS.blue043142}>
            Rename Playlist
          </Text>
          <TextInput
            placeholder="Enter new playlist name"
            value={newPlaylistName}
            onChangeText={setNewPlaylistName}
            style={styles.playlistInput}
          />
          <View style={styles.modalButtons}>
            <Button
              text="Cancel"
              width={nw(120)}
              backgroundColor={COLORS.grey999999}
              onPress={() => setPlaylistToEdit(null)}
            />
            <Button
              text="Rename"
              width={nw(120)}
              onPress={renamePlaylist}
            />
          </View>
        </View>
      </View>
    </Modal>
  );





  const showDeleteConfirmation = (playlistId, postId) => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to remove this post from the playlist?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          style: 'destructive',
          onPress: () => removePostFromPlaylist(playlistId, postId),
        },
      ]
    );
  };
  
  // Add the removePostFromPlaylist method
  const removePostFromPlaylist = async (playlistId, postId) => {
    try {
      const response = await axios.delete('http://192.168.48.240:5000/api/playlists/remove-from-playlist', {
        data: { 
          userId, 
          playlistId, 
          postId 
        }
      });
  
      // Update the local state to reflect the deletion
      const updatedPlaylists = playlists.map(playlist => {
        if (playlist._id === playlistId) {
          return {
            ...playlist,
            items: playlist.items.filter(item => item.postId !== postId),
            postDetailsMap: {
              ...playlist.postDetailsMap,
              [postId]: undefined
            }
          };
        }
        return playlist;
      });
  
      setPlaylists(updatedPlaylists);
  
      Alert.alert('Success', 'Post removed from playlist');
    } catch (error) {
      console.error('Failed to remove post from playlist:', error);
      Alert.alert('Error', 'Failed to remove post from playlist');
    }
  };


  const togglePlaylistExpansion = (playlistId) => {
    setExpandedPlaylist(expandedPlaylist === playlistId ? null : playlistId);
  };

  const renderPlaylistItem = (playlist) => {
    const isExpanded = expandedPlaylist === playlist._id;
    
    return (
      <View style={styles.playlistContainer}>
        <TouchableOpacity 
          style={styles.playlistHeader}
          onPress={() => togglePlaylistExpansion(playlist._id)}
        >
          <View style={styles.playlistHeaderContent}>
            <Text variant="semibold16" color={COLORS.blue043142}>
              {playlist.playlistName}
            </Text>
            <Text variant="medium12" color={COLORS.grey999999}>
              {playlist.items.length} posts
            </Text>
          </View>
          <Icon 
            type="ionicon" 
            name={isExpanded ? "chevron-up" : "chevron-down"} 
            size={24} 
            color={COLORS.blue043142} 
          />
        </TouchableOpacity>
  
        {isExpanded && (
          <View style={styles.expandedPlaylistContent}>
            {playlist.items.map((item) => {
              const postDetail = playlist.postDetailsMap[item.postId];
              if (!postDetail) return null;
  
              return (
                <View 
                  key={item.postId} 
                  style={styles.videoItemContainer}
                >
                  <TouchableOpacity 
                    style={styles.videoItem}
                    onPress={() => handleVideoPress(postDetail)}
                  >
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
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.deleteButton}
                    onPress={() => showDeleteConfirmation(playlist._id, item.postId)}
                  >
                    <Icon 
                      type="ionicon" 
                      name="trash" 
                      size={24} 
                      color={COLORS.red} 
                    />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return <Text style={styles.loadingText}>Loading...</Text>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header
        title="My Playlists"
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView>
          <Image source={images.profilebaground} style={styles.images} />
            <Text variant="semibold16" color={COLORS.blue043142}>
              UI/UX Design
            </Text>
            <Text
              variant="medium12"
              color={COLORS.grey999999}
              style={{marginBottom: nh(20)}}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
              eiusmod tempor incididunt
            </Text>
            <View
              style={{
                flexDirection: 'row',
                marginBottom: nh(30),
                justifyContent: 'space-between',
              }}>
              <Button text="Play All" width={nw(163)}                 textStyle={{ fontSize: 14 }} // Adjusted the text size
 />
              <Button
                justIcon={'settings-sharp'}
                width={nw(50)}
                onPress={() => navigationRef.navigate('EditPlayList')}
              />
              <Button
                justIcon={'settings-sharp'}
                width={nw(50)}
                onPress={() => navigationRef.navigate('NewPlayList')}
              />
              <Button justIcon={'settings-sharp'} width={nw(50)} />
            </View>
            <View style={styles.headerActions}>
              <Button 
                text="Create Playlist" 
                width={nw(163)} 
                textStyle={{ fontSize: 14 }} // Adjusted the text size

                onPress={() => setIsCreatePlaylistModalVisible(true)}
              />
              <Button
                text="Edit Playlists"
                width={nw(163)}
                textStyle={{ fontSize: 14 }} // Adjusted the text size

                onPress={() => setIsEditPlaylistModalVisible(true)}
              />
            </View>
            
            {playlists.length > 0 ? (
              <View style={styles.playlistsContainer}>
                {playlists.map(renderPlaylistItem)}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text variant="medium16" color={COLORS.grey999999}>
                  No playlists created yet
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {selectedVideo && (
        <VideoPlayerModal 
          visible={isVideoModalVisible}
          videoUrl={selectedVideo.contentURL}
          onClose={() => setIsVideoModalVisible(false)}
        />
      )}
      <CreatePlaylistModal />
      <EditPlaylistsModal />
      <RenamePlaylistModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Combine styles from both original implementations
  container: { 
    flex: 1, 
    backgroundColor: COLORS.yellowF5BE00 
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: 25,
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(16),
    paddingTop: nh(30),
  },
  videoItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(15),
    justifyContent: 'space-between',
  },
  images: {
    height: nh(175),
    width: DEVICE_WIDTH - 32,
    alignSelf: 'center',
    marginBottom: nh(10),
  },
  videoListContainer: {
    marginTop: nh(20),
  },
  videoItem: {
    flexDirection: 'row',
    marginBottom: nh(15),
    alignItems: 'center',
    flex: 1,

  },
  videoThumbnail: {
    width: nw(100),
    height: nh(80),
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: nw(15),
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  videoDetails: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: nh(50),
  },
  loadingText: {
    textAlign: 'center', 
    marginTop: 20,
    color: COLORS.blue043142
  },
  errorText: {
    textAlign: 'center', 
    marginTop: 20,
    color: 'red'
  },
  // Original video player modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  videoContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  videoPlayer: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10
  },
  controlOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10
  },
  controlButton: {
    marginHorizontal: 20,
    padding: 10
  },
  errorOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)'
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: nh(20),
  },
  playlistContainer: {
    marginBottom: nh(15),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  playlistHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: nw(15),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey999999,
  },
  playlistHeaderContent: {
    flex: 1,
    marginRight: nw(10),
  },
  expandedPlaylistContent: {
    padding: nw(10),
  },
  deleteButton: {
    padding: nw(10),
    marginLeft: nw(10),
  },
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: nw(300),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 10,
    padding: nw(20),
    alignItems: 'center',
  },
  playlistInput: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey999999,
    marginVertical: nh(20),
    paddingBottom: nh(10),
    color: 'black', // Added to set the text color to black

  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  editPlaylistItem: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    marginVertical: nh(10),
    paddingHorizontal: nw(10),
        color: 'black', // Added to set the text color to black
        width: '100%', // Ensure each item uses the full width of the container


  }
});

export default MyPlaylists;