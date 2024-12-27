import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getProfile } from '../../services/apiService';

export const AddStory = ({ onStoryAdded }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Effect to fetch user profile data when component mounts
  useEffect(() => {
    getProfileData();
  }, []);

  // Function to get user profile data from AsyncStorage and API
  const getProfileData = async () => {
    try {
      const user = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(user);

      // Fetch profile information using the API
      let res = await getProfile('');
      console.log('🚀 ~ getProfileData ~ res:', res?.data?.userProfileInfo);
      setProfileData(res?.data?.userProfileInfo);
    } catch (error) {
      console.log('Profile data fetch error:', error?.response?.data?.message);
    }
  };

  // Open camera for capturing media
  const openCamera = async () => {
    if (!profileData?.id) {
      Alert.alert('Login Required', 'Please login to add stories');
      return;
    }

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
    if (!profileData?.id) {
      Alert.alert('Login Required', 'Please login to add stories');
      return;
    }

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

      try {
        // Get fresh user data from AsyncStorage
        const userData = await AsyncStorage.getItem('userData');
        const parsedUser = JSON.parse(userData);

        // Prepare the media data for upload
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: asset.fileName || 'media', // Fallback name
          type: asset.type || 'image/jpeg',
        });
        formData.append('userId', profileData.id); // Use profileData.id instead of userId from Redux
        formData.append('type', asset.type.includes('video') ? 'video' : 'image');

        // Make the API request with authentication header
        const response = await axios.post(
          'http://192.168.39.240:3000/api/stories',
          formData,
          {
            headers: { 
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${parsedUser?.token}` // Add authorization header
            },
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