import React, {useState, useEffect} from 'react';
import {
  View,
  TouchableOpacity,
  Modal,
  Alert,
  StyleSheet,
  Dimensions,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import Text from '../../components/Text';
import axios from 'axios';
import {COLORS} from '../../helper/colors';
import {nw, nh} from '../../helper/scales';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getProfile} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';
import {compressImage, compressVideo} from '../../helper/commonFunctions';

export const AddStory = ({onStoryAdded}) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const {showToast} = useToast();

  // Effect to fetch user profile data when component mounts
  useEffect(() => {
    getProfileData();
  }, []);

  // Function to get user profile data from AsyncStorage and API
  const getProfileData = async () => {
    try {
      // Fetch profile information using the API
      let res = await getProfile('');
      // console.log('🚀 ~ getProfileData ~ res:', res?.data?.userProfileInfo);
      setProfileData(res?.data?.userProfileInfo);
    } catch (error) {
      console.log('Profile data fetch error:', error?.response?.data?.message);
    }
  };

  // Open camera for capturing media
  const openCamera = async () => {
    if (!profileData?.id) {
      showToast({
        text: 'Please login to add stories',
        type: 'error',
      });
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
      showToast({
        text: 'Please log in to create a post',
        type: 'error',
      });
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed', // allows both image & video
      });
      await handleMedia(result);
      // Always close modal so we can re-open it next time
      setModalVisible(false);

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // setFile(asset);

        // Determine content type
        if (asset.type && asset.type.toLowerCase().includes('video')) {
          // setContentType('Video');
        } else {
          // setContentType('Image');
        }
      }
    } catch (err) {
      console.error('Error selecting file:', err);
      showToast({
        text: 'Failed to select file',
        type: 'error',
      });
      // Close modal in case of error
      setModalVisible(false);
    }

    // if (!profileData?.id) {
    //   showToast({
    //     text: 'Please login to add stories',
    //     type: 'error',
    //   });
    //   return;
    // }

    // setModalVisible(false);
    // const result = await launchImageLibrary({
    //   mediaType: 'mixed',
    // });
  };

  // Handle selected or captured media
  const handleMedia = async result => {
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      var uri = asset.uri;
      console.log('🚀 ~ handleMedia ~ uri:0', uri);
      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Get fresh user data from AsyncStorage
        const userData = await AsyncStorage.getItem('userData');
        const parsedUser = JSON.parse(userData);
        if (asset.type && asset.type.toLowerCase().includes('video')) {
          uri = await compressVideo(asset?.uri);
        } else {
          uri = await compressImage(asset?.uri);
        }
        // Prepare the media data for upload
        const formData = new FormData();
        formData.append('file', {
          uri: uri,
          name: asset.fileName || 'media', // Fallback name
          type: asset.type || 'image/jpeg',
        });
        formData.append('userId', profileData.id);
        formData.append(
          'type',
          asset.type.includes('video') ? 'video' : 'image',
        );

        // Make the API request with authentication header and progress tracking
        const response = await axios.post(
          'http://192.168.1.8:3000/api/stories',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${parsedUser?.token}`,
            },
            onUploadProgress: progressEvent => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress(percentCompleted);
            },
          },
        );

        showToast({
          text: 'Story added successfully',
          type: 'success',
        });

        if (onStoryAdded) onStoryAdded();
      } catch (error) {
        console.error('Full Error Object:', JSON.stringify(error, null, 2));
        console.error('Error Response:', error.response?.data);
        console.error('Error Status:', error.response?.status);

        showToast({
          text: `Failed to upload story: ${error.message}`,
          type: 'error',
        });
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    } else {
      showToast({
        text: 'No media selected',
        type: 'error',
      });
    }
  };

  return (
    <View>
      {/* Add Story Button */}
      <TouchableOpacity
        style={styles.addStoryButton}
        onPress={() => setModalVisible(true)}
        disabled={isUploading}>
        <Icon name="add" size={30} color="white" />
      </TouchableOpacity>

      {/* Upload Progress Bar */}
      {isUploading && (
        <View style={styles.progressContainer}>
          <View style={[styles.progressBar, {width: `${uploadProgress}%`}]} />
          <Text style={styles.progressText}>{`${uploadProgress}%`}</Text>
        </View>
      )}

      {/* Modal for Media Selection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Add to Story</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={openCamera}
              disabled={isUploading}>
              <Icon name="camera" size={24} color={COLORS.blue043142} />
              <Text style={styles.modalOptionText}>Take Photo or Video</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={openGallery}
              disabled={isUploading}>
              <Icon name="image" size={24} color={COLORS.blue043142} />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelOption}
              onPress={() => setModalVisible(false)}
              disabled={isUploading}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Text style={styles.modalTitle2}>Add to Story</Text>
    </View>
  );
};

const {width} = Dimensions.get('window');

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
    marginTop: 6,
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
  progressContainer: {
    position: 'absolute',
    top: nw(102),
    left: nw(5),
    right: nw(5),
    height: nh(18),
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.blue043142,
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: nh(20),
    color: '#fff',
    fontSize: 8,
  },
});

export default AddStory;
