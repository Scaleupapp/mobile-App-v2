import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { jwtDecode } from 'jwt-decode';
import Text from '../../components/Text';
import Button from '../../components/Button';
import { COLORS } from '../../helper/colors';
import { nh, nw } from '../../helper/scales';
import Icon from '../../helper/icon';

const PlaylistSelectionModal = ({ 
  visible, 
  onClose, 
  postId, 
  onPostAdded 
}) => {
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showNewPlaylistInput, setShowNewPlaylistInput] = useState(false);

  const userData = useSelector(state => state?.userData);
  const token = userData?.token;
  const userId = token ? jwtDecode(token)?.userId : null;

  useEffect(() => {
    if (visible && userId) {
      fetchUserPlaylists();
    }
  }, [visible, userId]);

  const fetchUserPlaylists = async () => {
    try {
      const response = await axios.get(`http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/playlists?userId=${userId}`);
      setPlaylists(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch playlists:', error);
      setLoading(false);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    try {
      const response = await axios.post('http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/playlists/create', {
        userId,
        playlistName: newPlaylistName
      });

      // Immediately add the post to the new playlist
      await addPostToPlaylist(response.data._id);

      // Reset states
      setNewPlaylistName('');
      setShowNewPlaylistInput(false);
    } catch (error) {
      console.error('Failed to create playlist:', error);
      // Handle error (show alert, etc.)
    }
  };

  const addPostToPlaylist = async (playlistId) => {
    try {
      await axios.post('http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/playlists/add-to-playlist', {
        userId,
        playlistId,
        postId
      });

      onPostAdded(); // Callback to update UI
      onClose(); // Close modal
    } catch (error) {
        if (error.response && error.response.status === 400) {
          // Show an alert if the post is already in the playlist
          Alert.alert(
            'Duplicate Post',
            'This post is already present in the playlist.',
            [{ text: 'OK', style: 'cancel' }]
          );
        } else {
          console.error('Failed to add post to playlist:', error);
          // Handle other types of errors
          Alert.alert(
            'Error',
            'An error occurred while adding the post to the playlist.',
            [{ text: 'OK', style: 'cancel' }]
          );
        }
      }
    };

  const renderContent = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />;
    }

    return (
      <>
        <ScrollView>
          {playlists.map((playlist) => (
            <TouchableOpacity
              key={playlist._id}
              style={styles.playlistItem}
              onPress={() => addPostToPlaylist(playlist._id)}
            >
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

        {showNewPlaylistInput ? (
          <View style={styles.newPlaylistContainer}>
            <TextInput
              placeholder="Enter playlist name"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              style={styles.input}
            />
            <Button 
              text="Create" 
              onPress={handleCreateNewPlaylist}
              width={nw(100)}
            />
          </View>
        ) : (
          <TouchableOpacity 
            style={styles.createPlaylistButton}
            onPress={() => setShowNewPlaylistInput(true)}
          >
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
      onRequestClose={onClose}
    >
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
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '70%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20
  },
  playlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grey999999
  },
  createPlaylistButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15
  },
  newPlaylistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.grey999999,
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    color: 'black', // Added to set the text color to black

  }
});

export default PlaylistSelectionModal;