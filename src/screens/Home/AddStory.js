import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Text from '../../components/Text';
import axios from 'axios';
import { COLORS } from '../../helper/colors';
import { nw } from '../../helper/scales';
import Icon from 'react-native-vector-icons/Ionicons';

export const AddStory = ({ onStoryAdded }) => {
  const [modalVisible, setModalVisible] = useState(false);

  // Open camera for capturing media
  const openCamera = async () => {
    setModalVisible(false);
    const result = await launchCamera({
      mediaType: 'mixed',
      videoQuality: 'high',
      durationLimit: 60,
    });
    handleMedia(result);
  };

  // Open gallery for selecting media
  const openGallery = async () => {
    setModalVisible(false);
    const result = await launchImageLibrary({
      mediaType: 'mixed',
    });
    handleMedia(result);
  };

  // Handle selected or captured media
  const handleMedia = async (result) => {
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      // Prepare the media data for upload
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: asset.fileName || 'media', // Fallback name
        type: asset.type || 'image/jpeg',
      });
      formData.append('userId', '6639f2882693d884adf47072'); // Replace with your actual user ID
      formData.append('type', asset.type.includes('video') ? 'video' : 'image');

      try {
        const response = await axios.post(
          'http://scaleup-backend-1-env.eba-58bcz4ix.ap-south-1.elasticbeanstalk.com/api/stories',
          formData,
          {
            headers: { 'Content-Type': 'multipart/form-data' },
          }
        );
        Alert.alert('Success', 'Story added successfully');
        if (onStoryAdded) onStoryAdded(); // Trigger a refresh in the parent component
      } catch (error) {
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        console.error('Error Response:', error.response?.data);
        console.error('Error Status:', error.response?.status);
        Alert.alert('Error', `Failed to upload story: ${error.message}`);
      }
    } else {
      Alert.alert('Error', 'No media selected');
    }
  };

  return (
    <View>
      {/* Add Story Button */}
      <TouchableOpacity 
        style={styles.addStoryButton} 
        onPress={() => setModalVisible(true)}
      >
        <Icon name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Modal for Media Selection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add to Story</Text>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={openCamera}
            >
              <Icon name="camera" size={24} color={COLORS.blue043142} />
              <Text style={styles.modalOptionText}>Take Photo or Video</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalOption} 
              onPress={openGallery}
            >
              <Icon name="image" size={24} color={COLORS.blue043142} />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancelOption} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Text style={styles.modalTitle2}>Add to Story</Text>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  addStoryButton: {
    width: nw(80),
    height: nw(80),
    borderRadius: nw(40),
    backgroundColor: COLORS.blue043142,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: nw(5),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    alignItems: 'center',
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: COLORS.blue043142,
  },
  modalTitle2: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    marginTop:6,
    color: COLORS.blue043142,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    marginLeft: 15,
    fontSize: 16,
    color: COLORS.blue043142,
  },
  modalCancelOption: {
    width: '100%',
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  modalCancelText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AddStory;