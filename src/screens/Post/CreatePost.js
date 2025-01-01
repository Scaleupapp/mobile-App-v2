import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Dimensions,
  Modal,
  TouchableOpacity,
  Image, // for image preview
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import Text from '../../components/Text';
import Button from '../../components/Button';
import axios from 'axios';
import {useToast} from '../../components/CustomToast';
import {getProfile} from '../../services/apiService';
import {launchImageLibrary} from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useRoute } from '@react-navigation/native';

import {compressImage, compressVideo} from '../../helper/commonFunctions';

const CreatePost = ({navigation}) => {
  const {showToast} = useToast();
  const route = useRoute();
  const draftData = route.params?.draftData;

  // Form state
  const [heading, setHeading] = useState('');
  const [topics, setTopics] = useState('');
  const [captions, setCaptions] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [file, setFile] = useState(null);
  const [contentType, setContentType] = useState('Image'); // default
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  // Modal for selecting media

  // Modal for selecting media
  const [modalVisible, setModalVisible] = useState(false);


  // User data state
  const [profileData, setProfileData] = useState(null);

  // Initialize form with draft data if available
  useEffect(() => {
    if (draftData) {
      setHeading(draftData.heading);
      // Map relatedTopics to topics field
      // Handle topics - ensure proper string format
    const topicsString = Array.isArray(draftData.relatedTopics)
    ? draftData.relatedTopics.join(', ')
    : draftData.relatedTopics || '';
  setTopics(topicsString);
  
  // Handle hashtags - ensure proper string format
  const hashtagsString = Array.isArray(draftData.hashtags)
    ? draftData.hashtags.join(' ')
    : draftData.hashtags || '';
  setHashtags(hashtagsString);
  
  setCaptions(draftData.captions);
      setContentType(draftData.contentType);
      // Ensure we have a proper file object
      if (draftData.file) {
        setFile({
          uri: draftData.file.uri,
          type: draftData.file.type,
          name: draftData.file.name
        });
      }
    }
  }, [draftData]);

  // Fetch profile data on component mount
  useEffect(() => {
    getProfileData();
  }, []);

  // Function to reset form fields
  const resetForm = () => {
    setHeading('');
    setTopics('');
    setCaptions('');
    setHashtags('');
    setFile(null);
    setContentType('Image');
    setUploadProgress(0);
  };

  // Function to remove the selected file
  const removeFile = () => {
    setFile(null);
    setContentType('Image');
  };

  // Function to fetch profile data using AsyncStorage and API
  const getProfileData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const parsedUser = JSON.parse(userData);

      const res = await getProfile('');
      console.log('Profile data fetched:', res?.data?.userProfileInfo);
      setProfileData(res?.data?.userProfileInfo);
    } catch (error) {
      console.log('Profile data fetch error:', error?.response?.data?.message);
      showToast({
        title: 'Failed to load profile data',
        type: 'error',
      });
    }
  };

  // Open gallery to pick media
  const openGallery = async () => {
    if (!profileData?.id) {
      showToast({
        title: 'Please log in to create a post',
        type: 'error',
      });
      return;
    }

    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed', // allows both image & video
      });

      // Always close modal so we can re-open it next time
      setModalVisible(false);

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];

        // Determine content type
        if (asset.type && asset.type.toLowerCase().includes('video')) {
          setContentType('Video');
          let compress_video = await compressVideo(asset?.uri);

          setFile({...asset, uri: compress_video});
        } else {
          let compress_image = await compressImage(asset?.uri);

          setFile({...asset, uri: compress_image});
          setContentType('Image');
        }
      }
    } catch (err) {
      console.error('Error selecting file:', err);
      showToast({
        title: 'Failed to select file',
        type: 'error',
      });
      // Close modal in case of error
      setModalVisible(false);
    }
  };

  const handlePost = async (isDraft = false) => {
    // Validate user authentication
    if (!profileData?.id) {
      showToast({
        title: 'Please log in to create a post',
        type: 'error',
      });
      return;
    }
  
    if (!heading || !topics || !hashtags || !file || !captions) {
      showToast({
        title: 'Please fill all fields and upload a file.',
        type: 'error',
      });
      return;
    }
  
    try {
      setIsUploading(true);
      setUploadProgress(0);
  
      const userData = await AsyncStorage.getItem('userData');
      const {token} = JSON.parse(userData);
  
      if (!token) {
        throw new Error('Authentication token not found');
      }
  
      // Create FormData for either update or create
      const formData = new FormData();
      formData.append('heading', heading);
       // Format topics and hashtags as arrays
    const topicsArray = topics.split(',').map(t => t.trim());
    const hashtagsArray = hashtags.split(' ').filter(h => h.startsWith('#'));
    
    formData.append('relatedTopics', JSON.stringify(topicsArray));
    formData.append('hashtags', JSON.stringify(hashtagsArray));
      formData.append('verify', 'Yes');
      formData.append('captions', captions);
      formData.append('contentType', contentType);
      formData.append('isDraft', isDraft ? 'true' : 'false');
  
      // Only append media if it's changed (new file selected)
      if (file && (!draftData?.file || file.uri !== draftData.file.uri)) {
        formData.append('media', {
          uri: file.uri,
          type: file.type,
          name: file.name || 'media'
        });
      }
  
      let response;
  
      // If we're editing an existing draft
      if (draftData?.id) {
        if (isDraft) {
          // Update the existing draft
          response = await axios.put(
            `https://api.scaleupapp.club/api/content/${draftData.id}`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
              },
              onUploadProgress: progressEvent => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / progressEvent.total,
                );
                setUploadProgress(percentCompleted);
              },
            }
          );
          
          console.log('Draft Updated:', response.data);
          showToast({
            title: 'Draft updated successfully!',
            type: 'success',
          });
        } else {
          // Publishing existing draft
          response = await axios.put(
            `https://api.scaleupapp.club/api/content/publish/${draftData.id}`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                Authorization: `Bearer ${token}`,
              },
            }
          );
  
          console.log('Draft Published:', response.data);
          showToast({
            title: response.data?.message || 'Post published successfully!',
            type: 'success',
          });
        }
      } else {
        // Creating a new post or draft
        response = await axios.post(
          'https://api.scaleupapp.club/api/content/create',
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              Authorization: `Bearer ${token}`,
            },
            onUploadProgress: progressEvent => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total,
              );
              setUploadProgress(percentCompleted);
            },
          },
        );
  
        console.log('Post Upload Success:', response.data);
        showToast({
          title: isDraft ? 'Draft saved successfully!' : 'Post published successfully!',
          type: 'success',
        });
      }
  
      resetForm();
      navigation.goBack();
    } catch (error) {
      console.error('Upload Error:', error.response?.data || error.message);
      showToast({title: 'Failed to upload post.', type: 'error'});
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      <Header title="New Post" />

      {/* ScrollView that fills screen, becomes scrollable if content > screen height */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          flexGrow: 1,
          minHeight: '100%',
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.layer1}>
          <View style={styles.layer2}>
            <CustomTextInput
              label="Heading"
              value={heading}
              onChangeText={setHeading}
            />
            <CustomTextInput
              label="Topics (Press comma after every category)"
              value={topics}
              onChangeText={setTopics}
            />
            <CustomTextInput
              label="Captions"
              value={captions}
              onChangeText={setCaptions}
            />
            <CustomTextInput
              label="Hashtags (Add # before each word)"
              value={hashtags}
              onChangeText={setHashtags}
            />

            {/* Upload Section */}
            <Text variant="medium14" color={COLORS.greyBBBBBB}>
              Upload Image/Video
            </Text>
            <View style={styles.uploadButtonContainer}>
              <Button
                leftIcon={'upload'}
                text="Upload"
                variant="outline"
                onPress={() => setModalVisible(true)}
                width={nw(96)}
                height={nh(35)}
                textStyle={{ fontSize: 14 }}
              />

              {/* Show filename if selected */}
              {file && (
                <Text style={styles.fileName} numberOfLines={1}>
                  {file.fileName || 'Selected media'}
                </Text>
              )}

              {/* Preview + remove button */}
              {file && (
                <View style={styles.previewContainer}>
                  {contentType === 'Image' ? (
                    <Image
                      source={{uri: file.uri}}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.videoPreviewBox}>
                      <Icon
                        name="videocam"
                        size={20}
                        color={COLORS.grey999999}
                      />
                      <Text style={styles.videoPreviewText}>
                        Video Selected
                      </Text>
                    </View>
                  )}

                  {/* Cross/Close button to remove file */}
                  <TouchableOpacity
                    style={styles.closeIconContainer}
                    onPress={removeFile}>
                    <Icon name="close-circle" size={24} color="red" />
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.progressContainer}>
                <View
                  style={[styles.progressBar, {width: `${uploadProgress}%`}]}
                />
                <Text style={styles.progressText}>{`${uploadProgress}%`}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionButtonContainer}>
              <Button
                variant="outline"
                text="Cancel"
                width={nw(85)}
                height={nh(40)}
                textStyle={{fontSize: 14}}
                onPress={() => navigation.goBack()}
                disabled={isUploading}
              />
              <Button
                text="Publish"
                width={nw(85)}
                height={nh(40)}
                textStyle={{fontSize: 14}}
                onPress={() => handlePost(false)}
                disabled={isUploading}
              />
              <Button
                text="Save Draft"
                width={nw(85)}
                height={nh(40)}
                textStyle={{fontSize: 14}}
                onPress={() => handlePost(true)}
                disabled={isUploading}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal for Media Selection */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choose Media</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={openGallery}
              disabled={isUploading}
            >
              <Icon name="image" size={24} color={COLORS.blue043142} />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelOption}
              onPress={() => setModalVisible(false)}
              disabled={isUploading}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default CreatePost;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    width: Dimensions.get('window').width,
    alignSelf: 'center',
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(16),
    paddingTop: nh(30),
  },
  uploadButtonContainer: {
    marginTop: nh(10),
    width: nw(96),
    marginBottom: nh(10),
  },
  fileName: {
    marginTop: nh(5),
    color: COLORS.greyBBBBBB,
  },
  previewContainer: {
    marginTop: nh(10),
    position: 'relative',
    alignItems: 'center',
  },
  previewImage: {
    width: nw(96),
    height: nh(140),
    borderRadius: 8,
  },
  videoPreviewBox: {
    width: nw(96),
    height: nh(140),
    borderRadius: 8,
    backgroundColor: '#EEE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewText: {
    marginTop: nh(5),
    color: COLORS.grey999999,
    fontStyle: 'italic',
  },
  closeIconContainer: {
    position: 'absolute',
    top: nh(2),
    right: nw(2),
  },
  progressContainer: {
    marginTop: nh(10),
    height: nh(20),
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.yellowF5BE00,
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: nh(20),
    color: '#000',
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: nh(30),
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
    marginBottom: nh(20),
    color: COLORS.blue043142,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: nh(15),
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    marginLeft: nw(15),
    fontSize: 16,
    color: COLORS.blue043142,
  },
  modalCancelOption: {
    width: '100%',
    paddingVertical: nh(15),
    alignItems: 'center',
    marginTop: nh(10),
  },
  modalCancelText: {
    color: 'red',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
