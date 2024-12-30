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

const PlaylistModal = ({ visible, onClose, playlist, onCreate }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [description, setDescription] = useState('');
  const [topics, setTopics] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleCreate = () => {
    if (!playlistName.trim()) return;

    const topicsArray = topics
      .split(',')
      .map(topic => topic.trim())
      .filter(topic => topic.length > 0);

    const newPlaylist = {
      playlistName: playlistName.trim(),
      description: description.trim(),
      relatedTopics: topicsArray,
      visibility: isPrivate ? 'private' : 'public',
    };

    onCreate(newPlaylist);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setPlaylistName('');
    setDescription('');
    setTopics('');
    setIsPrivate(false);
    setIsCreating(false);
  };

  const renderInfoView = () => (
    <>
      <View style={styles.modalHeader}>
        <Text variant="semibold16" color={COLORS.blue043142}>
          Playlist Details
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
      
      <ScrollView style={styles.modalContent}>
        <View style={styles.section}>
          <Text variant="semibold14" color={COLORS.blue043142}>
            Name
          </Text>
          <Text variant="medium14" color={COLORS.grey999999}>
            {playlist?.playlistName || 'No name provided'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="semibold14" color={COLORS.blue043142}>
            Description
          </Text>
          <Text variant="medium14" color={COLORS.grey999999}>
            {playlist?.description || 'No description provided'}
          </Text>
        </View>

        <View style={styles.section}>
          <Text variant="semibold14" color={COLORS.blue043142}>
            Related Topics
          </Text>
          <View style={styles.topicsContainer}>
            {playlist?.relatedTopics && playlist.relatedTopics.length > 0 ? (
              playlist.relatedTopics.map((topic, index) => (
                <View key={index} style={styles.topicTag}>
                  <Text variant="medium12" color={COLORS.whiteFFFFFF}>
                    {topic}
                  </Text>
                </View>
              ))
            ) : (
              <Text variant="medium14" color={COLORS.grey999999}>
                No topics specified
              </Text>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text variant="semibold14" color={COLORS.blue043142}>
            Visibility
          </Text>
          <View style={styles.visibilityContainer}>
            <Icon
              type="ionicon"
              name={playlist?.visibility === 'private' ? 'lock-closed' : 'earth'}
              size={20}
              color={COLORS.blue043142}
            />
            <Text variant="medium14" color={COLORS.grey999999} style={styles.visibilityText}>
              {playlist?.visibility === 'private' ? 'Private' : 'Public'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );

  const renderCreateView = () => (
    <>
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
      
      <ScrollView style={styles.modalContent}>
        <View style={styles.inputSection}>
          <Text variant="semibold14" color={COLORS.blue043142}>
            Playlist Name *
          </Text>
          <TextInput
            style={styles.input}
            value={playlistName}
            onChangeText={setPlaylistName}
            placeholder="Enter playlist name"
            placeholderTextColor='black'
          />
        </View>

        <View style={styles.inputSection}>
          <Text variant="semibold14" color={COLORS.blue043142}>
            Description
          </Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description"
            placeholderTextColor='black'
            multiline={true}
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputSection}>
          <Text variant="semibold14" color={COLORS.blue043142}>
            Topics
          </Text>
          <TextInput
            style={styles.input}
            value={topics}
            onChangeText={setTopics}
            placeholder="Enter topics (comma-separated)"
            placeholderTextColor='black'
          />
        </View>

        <TouchableOpacity 
          style={styles.visibilityToggle}
          onPress={() => setIsPrivate(!isPrivate)}
        >
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

        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreate}
        >
          <Text variant="semibold16" color={COLORS.whiteFFFFFF}>
            Create Playlist
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );

  const renderInitialView = () => (
    <View style={styles.initialView}>
      <TouchableOpacity
        style={styles.optionButton}
        onPress={() => setIsCreating(true)}
      >
        <Icon
          type="feather"
          name="plus-circle"
          size={24}
          color={COLORS.blue043142}
        />
        <Text variant="semibold16" color={COLORS.blue043142} style={styles.optionText}>
          Create New Playlist
        </Text>
      </TouchableOpacity>

      {playlist && (
        <TouchableOpacity
          style={[styles.optionButton, styles.viewButton]}
          onPress={() => setIsCreating(false)}
        >
          <Icon
            type="feather"
            name="info"
            size={24}
            color={COLORS.blue043142}
          />
          <Text variant="semibold16" color={COLORS.blue043142} style={styles.optionText}>
            View Playlist Details
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={() => {
        resetForm();
        onClose();
      }}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {playlist && !isCreating ? renderInfoView() : 
           isCreating ? renderCreateView() : 
           renderInitialView()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
  section: {
    marginBottom: 20,
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
  visibilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  visibilityText: {
    marginLeft: 8,
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
    height: 40,

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
  },
  createButton: {
    backgroundColor: COLORS.blue043142,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  initialView: {
    padding: 20,
    alignItems: 'stretch',
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.blue043142,
    marginBottom: 16,
  },
  viewButton: {
    marginTop: 8,
  },
  optionText: {
    marginLeft: 12,
  },
});

export default PlaylistModal;