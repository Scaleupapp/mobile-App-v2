import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import Text from '../../components/Text';
import Icon from '../../helper/icon';
import { COLORS } from '../../helper/colors';
import { nh, nw } from '../../helper/scales';
import Button from '../../components/Button';

// A dedicated modal component for creating new playlists with enhanced features
const PlaylistCreateModal = ({ visible, onClose, onCreatePlaylist }) => {
  // State management for form fields
  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  // Reset form fields to initial state
  const resetForm = () => {
    setPlaylistName('');
    setDescription('');
    setTopics('');
    setIsPrivate(false);
  };

  // Handle playlist creation
  const handleCreate = () => {
    // Validate required fields
    if (!playlistName.trim()) {
      Alert.alert('Error', 'Please enter a playlist name');
      return;
    }

    // Convert topics string to array and clean up
    const topicsArray = topics
      .split(',')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);

    // Create playlist object
    const newPlaylist = {
      playlistName: playlistName.trim(),
      description: description.trim(),
      relatedTopics: topicsArray,
      visibility: isPrivate ? 'private' : 'public',
    };

    // Pass playlist data to parent component
    onCreatePlaylist(newPlaylist);
    
    // Reset and close modal
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        resetForm();
        onClose();
      }}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text variant="semibold16" color={COLORS.blue043142}>
              Create New Playlist
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

          {/* Form Content */}
          <ScrollView style={styles.modalContent}>
            {/* Playlist Name Input */}
            <View style={styles.inputSection}>
              <Text variant="semibold14" color={COLORS.blue043142}>
                Playlist Name *
              </Text>
              <TextInput
                style={styles.input}
                value={playlistName}
                onChangeText={setPlaylistName}
                placeholder="Enter playlist name"
                placeholderTextColor={COLORS.grey999999}
                maxLength={50}
              />
            </View>

            {/* Description Input */}
            <View style={styles.inputSection}>
              <Text variant="semibold14" color={COLORS.blue043142}>
                Description
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="What is this playlist about?"
                placeholderTextColor={COLORS.grey999999}
                multiline={true}
                numberOfLines={4}
                maxLength={500}
              />
              <Text variant="regular12" color={COLORS.grey999999}>
                {description.length}/500 characters
              </Text>
            </View>

            {/* Topics Input */}
            <View style={styles.inputSection}>
              <Text variant="semibold14" color={COLORS.blue043142}>
                Topics
              </Text>
              <TextInput
                style={styles.input}
                value={topics}
                onChangeText={setTopics}
                placeholder="Enter topics (separated by commas)"
                placeholderTextColor={COLORS.grey999999}
              />
              <Text variant="regular12" color={COLORS.grey999999}>
                Example: design, marketing, business
              </Text>
            </View>

            {/* Visibility Toggle */}
            <TouchableOpacity 
              style={styles.visibilityToggle}
              onPress={() => setIsPrivate(!isPrivate)}>
              <Icon
                type="ionicon"
                name={isPrivate ? 'lock-closed' : 'earth'}
                size={20}
                color={COLORS.blue043142}
              />
              <Text variant="medium14" color={COLORS.grey999999} style={styles.visibilityText}>
                {isPrivate ? 'Private' : 'Public'} Playlist
              </Text>
            </TouchableOpacity>

            {/* Preview Topics */}
            {topics.length > 0 && (
              <View style={styles.topicsPreview}>
                <Text variant="semibold14" color={COLORS.blue043142}>
                  Topics Preview
                </Text>
                <View style={styles.topicsContainer}>
                  {topics.split(',').map((topic, index) => (
                    topic.trim() && (
                      <View key={index} style={styles.topicTag}>
                        <Text variant="medium12" color={COLORS.whiteFFFFFF}>
                          {topic.trim()}
                        </Text>
                      </View>
                    )
                  ))}
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <Button
                text="Cancel"
                width={nw(150)}
                backgroundColor={COLORS.grey999999}
                onPress={() => {
                  resetForm();
                  onClose();
                }}
              />
              <Button
                text="Create Playlist"
                width={nw(150)}
                onPress={handleCreate}
                disabled={!playlistName.trim()}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalContent: {
    maxHeight: nh(500),
  },
  inputSection: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.grey999999,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    color: COLORS.blue043142,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  visibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.whiteFFFFFF,
    borderWidth: 1,
    borderColor: COLORS.grey999999,
  },
  visibilityText: {
    marginLeft: 8,
  },
  topicsPreview: {
    marginTop: 16,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  topicTag: {
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    marginBottom: 16,
  },
});

export default PlaylistCreateModal;