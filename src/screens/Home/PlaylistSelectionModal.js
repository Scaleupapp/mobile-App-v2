import React, {useState, useEffect} from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import axios from 'axios';
import Text from '../../components/Text';
import Button from '../../components/Button';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Icon from '../../helper/icon';
import {getProfile} from '../../services/apiService';
import { useToast } from '../../components/CustomToast';

const PlaylistSelectionModal = ({visible, onClose, postId, onPostAdded}) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylist, setNewPlaylist] = useState({
    playlistName: '',
    description: '',
    visibility: 'public',
    relatedTopics: '',
  });
  const [showNewPlaylistForm, setShowNewPlaylistForm] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    getProfileData();
  }, []);

  useEffect(() => {
    if (visible && profileData?.id) {
      fetchUserPlaylists();
    }
  }, [visible, profileData]);

  const getProfileData = async () => {
    try {
      let res = await getProfile('');
      setProfileData(res?.data?.userProfileInfo);
    } catch (error) {
      console.log('Profile data fetch error:', error?.response?.data?.message);
    }
  };

  const fetchUserPlaylists = async () => {
    try {
      const response = await axios.get(
        `http://192.168.28.240:3000/api/playlists?userId=${profileData.id}`,
      );
      setPlaylists(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      setLoading(false);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylist.playlistName.trim() || !profileData?.id) return;
  
    try {
      const response = await axios.post(
        'http://192.168.28.240:3000/api/playlists/create',
        {
          userId: profileData.id,
          playlistName: newPlaylist.playlistName,
          description: newPlaylist.description,
          visibility: newPlaylist.visibility,
          relatedTopics: newPlaylist.relatedTopics.split(',').map(topic => topic.trim()),
        },
      );
  
      // Immediately add the post to the new playlist
      await addPostToPlaylist(response.data._id);
  
      setNewPlaylist({
        playlistName: '',
        description: '',
        visibility: 'public',
        relatedTopics: '',
      });
      setShowNewPlaylistForm(false);
      showToast({
        title: 'Playlist created successfully!',
        type: 'success',
      });
    } catch (error) {
      console.error('Failed to create playlist:', error);
      showToast({
        title: 'Failed to create playlist. Please try again.',
        type: 'error',
      });
    }
  };
  
  const addPostToPlaylist = async (playlistId) => {
    if (!profileData?.id) return;
  
    try {
      await axios.post(
        'http://192.168.28.240:3000/api/playlists/add-to-playlist',
        {
          userId: profileData.id,
          playlistId,
          postId,
        },
      );
  
      showToast({
        title: 'Post added to playlist successfully!',
        type: 'success',
      });
  
      onPostAdded();
      onClose();
    } catch (error) {
      if (error.response && error.response.status === 400) {
        showToast({
        
          title: 'This post is already present in the playlist.',
          type: 'info',
        });
      } else {
        console.error('Failed to add post to playlist:', error);
        showToast({
          text: 'An error occurred while adding the post to the playlist.',
          type: 'error',
        });
      }
    }
  };
  
  const renderNewPlaylistForm = () => (
    <ScrollView style={styles.formScrollContainer}>
      <View style={styles.formContainer}>
        <Text variant="medium14" color={COLORS.blue043142} style={styles.inputLabel}>
          Playlist Name
        </Text>
        <TextInput
          placeholder="Enter playlist name"
          value={newPlaylist.playlistName}
          onChangeText={(text) => setNewPlaylist(prev => ({ ...prev, playlistName: text }))}
          style={styles.input}
          placeholderTextColor={COLORS.grey999999}
        />
        
        <Text variant="medium14" color={COLORS.blue043142} style={styles.inputLabel}>
          Description
        </Text>
        <TextInput
          placeholder="Enter playlist description"
          value={newPlaylist.description}
          onChangeText={(text) => setNewPlaylist(prev => ({ ...prev, description: text }))}
          style={[styles.input, styles.textArea]}
          multiline
          placeholderTextColor={COLORS.grey999999}
        />
        
        <Text variant="medium14" color={COLORS.blue043142} style={styles.inputLabel}>
          Related Topics
        </Text>
        <TextInput
          placeholder="Enter topics separated by commas"
          value={newPlaylist.relatedTopics}
          onChangeText={(text) => setNewPlaylist(prev => ({ ...prev, relatedTopics: text }))}
          style={styles.input}
          placeholderTextColor={COLORS.grey999999}
        />
        
        <View style={styles.visibilityContainer}>
          <Text variant="medium14" color={COLORS.blue043142}>Visibility:</Text>
          <TouchableOpacity 
            style={[
              styles.visibilityButton,
              newPlaylist.visibility === 'public' && styles.visibilityButtonActive
            ]}
            onPress={() => setNewPlaylist(prev => ({ ...prev, visibility: 'public' }))}>
            <Text variant="medium14" color={newPlaylist.visibility === 'public' ? 'white' : COLORS.blue043142}>
              Public
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[
              styles.visibilityButton,
              newPlaylist.visibility === 'private' && styles.visibilityButtonActive
            ]}
            onPress={() => setNewPlaylist(prev => ({ ...prev, visibility: 'private' }))}>
            <Text variant="medium14" color={newPlaylist.visibility === 'private' ? 'white' : COLORS.blue043142}>
              Private
            </Text>
          </TouchableOpacity>
        </View>
        
        <Button
          text="Create"
          onPress={handleCreateNewPlaylist}
          width={nw(100)}
          style={styles.createButton}
        />
      </View>
    </ScrollView>
  );

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />;
    }

    return (
      <>
        <ScrollView>
          {playlists.map(playlist => (
            <TouchableOpacity
              key={playlist._id}
              style={styles.playlistItem}
              onPress={() => addPostToPlaylist(playlist._id)}>
              <Text variant="medium14" color={COLORS.blue043142}>
                {playlist.playlistName}
              </Text>
              <Icon
                type="feather"
                name="plus"
                size={24}
                color={COLORS.blue043142}
              />
            </TouchableOpacity>
          ))}
        </ScrollView>

        {showNewPlaylistForm ? (
          renderNewPlaylistForm()
        ) : (
          <TouchableOpacity
            style={styles.createPlaylistButton}
            onPress={() => setShowNewPlaylistForm(true)}>
            <Icon
              type="feather"
              name="plus"
              size={24}
              color={COLORS.blue043142}
            />
            <Text variant="medium14" color={COLORS.blue043142}>
              Create New Playlist
            </Text>
          </TouchableOpacity>
        )}
      </>
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text variant="semibold16" color={COLORS.blue043142}>
              Add to Playlist
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon
                type="feather"
                name="x"
                size={24}
                color={COLORS.blue043142}
              />
            </TouchableOpacity>
          </View>
          {renderContent()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  playlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey999999,
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  formContainer: {
    padding: 15,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.grey999999,
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
    color: COLORS.blue043142,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  visibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    gap: 10,
  },
  visibilityButton: {
    padding: 8,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.grey999999,
    minWidth: 80,
    alignItems: 'center',
  },
  visibilityButtonActive: {
    backgroundColor: COLORS.blue043142,
    borderColor: COLORS.blue043142,
  },
});

export default PlaylistSelectionModal;