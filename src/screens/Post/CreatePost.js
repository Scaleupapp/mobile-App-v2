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
  ActivityIndicator,
  Platform, // Added for potential KeyboardAvoidingView if needed later
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
import {useRoute} from '@react-navigation/native';

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
  const [file, setFile] = useState(null); // Stores {uri, type, name}
  const [contentType, setContentType] = useState('Image'); // default
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Modal for selecting media
  const [modalVisible, setModalVisible] = useState(false);

  // User data state
  const [profileData, setProfileData] = useState(null);

  // Determine if editing an existing draft
  const isEditingDraft = Boolean(draftData?.id);

  useEffect(() => {
    if (draftData) {
      setHeading(draftData.heading || '');
      const topicsString = Array.isArray(draftData.relatedTopics)
        ? draftData.relatedTopics.join(', ')
        : draftData.relatedTopics || '';
      setTopics(topicsString);

      const hashtagsString = Array.isArray(draftData.hashtags)
        ? draftData.hashtags.join(' ')
        : draftData.hashtags || '';
      setHashtags(hashtagsString);

      setCaptions(draftData.captions || '');
      setContentType(draftData.contentType || 'Image');
      if (draftData.file && draftData.file.uri) {
        setFile({
          uri: draftData.file.uri,
          type: draftData.file.type,
          name: draftData.file.name,
        });
      }
    }
  }, [draftData]);

  useEffect(() => {
    getProfileData();
  }, []);

  const resetForm = () => {
    setHeading('');
    setTopics('');
    setCaptions('');
    setHashtags('');
    setFile(null);
    setContentType('Image');
    setUploadProgress(0);
    // Do not reset isUploading or isCompressing here, they are handled by their operations
  };

  const removeFile = () => {
    setFile(null);
    //setContentType('Image'); // Content type will be re-evaluated on next selection
  };

  const getProfileData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        // Handle case where user data is not found, perhaps prompt login
        showToast({title: 'User not logged in.', type: 'error'});
        // navigation.navigate('Login'); // Example redirect
        return;
      }
      const parsedUser = JSON.parse(userData);

      const res = await getProfile(''); // Assuming getProfile uses stored token or handles auth
      console.log('Profile data fetched:', res?.data?.userProfileInfo);
      setProfileData(res?.data?.userProfileInfo);
    } catch (error) {
      console.log('Profile data fetch error:', error?.response?.data?.message || error.message);
      showToast({
        title: 'Failed to load profile data',
        type: 'error',
      });
    }
  };

  const handleFileSelection = async asset => {
    if (!asset || !asset.uri) {
      showToast({title: 'Invalid file selected.', type: 'error'});
      return;
    }

    const selectedContentType = asset.type && asset.type.toLowerCase().includes('video') ? 'Video' : 'Image';
    setContentType(selectedContentType);

    // Set temporary file for immediate preview with original URI
    const tempFile = {
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName || 'media', // Use fileName from asset
    };
    setFile(tempFile);

    try {
      setIsCompressing(true);
      let compressedUri;

      if (selectedContentType === 'Video') {
        compressedUri = await compressVideo(asset.uri);
      } else {
        compressedUri = await compressImage(asset.uri);
      }
      setFile({...tempFile, uri: compressedUri}); // Update with compressed URI
    } catch (error) {
      console.error('Error processing file:', error);
      showToast({
        title: 'Failed to process file',
        type: 'error',
      });
      setFile(null); // Revert or clear file on compression error
    } finally {
      setIsCompressing(false);
    }
  };

  const openGallery = async () => {
    if (!profileData?.id) {
      showToast({
        title: 'Please log in to create a post',
        type: 'error',
      });
      return;
    }
    setModalVisible(false); // Close modal immediately

    try {
      const result = await launchImageLibrary({
        mediaType: 'mixed',
        selectionLimit: 1,
      });

      if (result.didCancel) {
        console.log('User cancelled image picker');
        return;
      }
      if (result.errorCode) {
        console.log('ImagePicker Error: ', result.errorMessage);
        showToast({title: result.errorMessage || 'Failed to select file', type: 'error'});
        return;
      }

      if (result.assets && result.assets.length > 0) {
        await handleFileSelection(result.assets[0]);
      }
    } catch (err) {
      console.error('Error selecting file:', err);
      showToast({
        title: 'Failed to select file',
        type: 'error',
      });
    }
  };

  const handlePost = async (isDraft = false) => {
    if (!profileData?.id) {
      showToast({title: 'Please log in to create a post', type: 'error'});
      return;
    }

    if (isCompressing) {
      showToast({title: 'File is currently processing.', type: 'info'});
      return;
    }

    if (!heading || !topics || !hashtags || !captions) {
      showToast({title: 'Please fill all text fields.', type: 'error'});
      return;
    }
    if (!file) {
        showToast({title: 'Please upload a file.', type: 'error'});
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

      const formData = new FormData();
      formData.append('heading', heading);
      const topicsArray = topics.split(',').map(t => t.trim()).filter(t => t);
      const hashtagsArray = hashtags.split(' ').filter(h => h.startsWith('#') && h.length > 1);

      formData.append('relatedTopics', JSON.stringify(topicsArray));
      formData.append('hashtags', JSON.stringify(hashtagsArray));
      formData.append('verify', 'Yes'); // Assuming this is constant
      formData.append('captions', captions);
      formData.append('contentType', contentType);
      formData.append('isDraft', isDraft ? 'true' : 'false');

      // Append media if it's a new file or if it's different from the draft's original file
      // This condition ensures we don't re-upload the same file if only text fields changed for a draft
      let shouldAppendMedia = true;
      if (isEditingDraft && draftData.file && file.uri === draftData.file.uri) {
          // If editing a draft AND the file URI is the same as the initial draft file URI,
          // We might not need to re-upload it unless the backend requires it for updates.
          // For simplicity, the current logic appends if file exists.
          // If your backend can update post text without new media, you might add more sophisticated logic here.
          // However, if URI is from compression, it might differ from a remote URI if draftData.file.uri is a remote URL.
          // The original condition `!draftData?.file || file.uri !== draftData.file.uri` is safer if draft file URIs are local/temp.
          // Let's assume for now we always send it if `file` is present.
      }


      if (file && file.uri) {
        formData.append('media', {
          uri: file.uri,
          type: file.type,
          name: file.name || `${contentType.toLowerCase()}_${Date.now()}`, // Ensure a name
        });
      }


      let response;
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
        onUploadProgress: progressEvent => {
          if (progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(percentCompleted);
          }
        },
      };

      if (isEditingDraft) {
        // If it's a draft, we decide to update or publish it.
        // The original code used PUT for both updating a draft and publishing an existing draft.
        // This seems fine if the backend differentiates via the endpoint or 'isDraft' flag.
        const endpoint = isDraft
          ? `https://api.scaleupapp.club/api/content/${draftData.id}` // Update draft
          : `https://api.scaleupapp.club/api/content/publish/${draftData.id}`; // Publish draft

        response = await axios.put(endpoint, formData, config);

        showToast({
          title: isDraft ? 'Draft updated successfully!' : (response.data?.message || 'Post published successfully!'),
          type: 'success',
        });

      } else {
        // Creating a new post or a new draft
        response = await axios.post(
          'https://api.scaleupapp.club/api/content/create',
          formData,
          config,
        );
        showToast({
          title: isDraft ? 'Draft saved successfully!' : 'Post published successfully!',
          type: 'success',
        });
      }

      console.log('Post/Draft Operation Success:', response.data);
      setTimeout(() => {
        resetForm();
        navigation.goBack();
      }, 500);

    } catch (error) {
      console.error('Upload Error:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || 'Failed to process post.';
      showToast({title: errorMessage, type: 'error'});
    } finally {
      setIsUploading(false);
      // setUploadProgress(0); // Progress bar will hide or reset based on isUploading
    }
  };

  const headerTitle = isEditingDraft ? "Edit Draft" : "New Post";
  const publishButtonText = isEditingDraft ? "Publish Draft" : "Publish";
  const saveDraftButtonText = isEditingDraft ? "Update Draft" : "Save Draft";
  const disableActions = isUploading || isCompressing;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title={headerTitle} />

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{
          flexGrow: 1,
          // Removed minHeight: '100%' as flexGrow: 1 on ScrollView and flex:1 on children should handle expansion
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Good for inputs in scrollview
        >
        <View style={styles.layer1}>
          <View style={styles.layer2}>
            <CustomTextInput
              label="Heading"
              value={heading}
              onChangeText={setHeading}
              disabled={disableActions}
            />
            <CustomTextInput
              label="Topics (Comma-separated, e.g., tech, startups)"
              value={topics}
              onChangeText={setTopics}
              disabled={disableActions}
            />
            <CustomTextInput
              label="Captions"
              value={captions}
              onChangeText={setCaptions}
              multiline={true}
              numberOfLines={4} // Adjust as needed
              textAlignVertical="top" // Good for multiline
              disabled={disableActions}
            />
            <CustomTextInput
              label="Hashtags (Space-separated, e.g., #innovation #growth)"
              value={hashtags}
              onChangeText={setHashtags}
              disabled={disableActions}
            />

            {/* Upload Section */}
            <Text variant="medium14" color={COLORS.greyBBBBBB} style={styles.uploadLabel}>
              Upload Image/Video
            </Text>
            <View style={styles.mediaUploadArea}>
              {!file && !isCompressing && (
                <TouchableOpacity
                  style={styles.uploadPlaceholder}
                  onPress={() => setModalVisible(true)}
                  disabled={disableActions}>
                  <Icon name="cloud-upload-outline" size={nw(50)} color={COLORS.greyBBBBBB} />
                  <Text style={styles.uploadPlaceholderText}>Tap to select Image/Video</Text>
                </TouchableOpacity>
              )}

              {file && (
                <View style={styles.previewWrapper}>
                  {contentType === 'Image' ? (
                    <Image
                      source={{uri: file.uri}}
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.videoPreviewBox}>
                      <Icon name="videocam-outline" size={nw(40)} color={COLORS.grey999999} />
                      <Text style={styles.videoPreviewText}>Video Selected</Text>
                    </View>
                  )}

                  {isCompressing && (
                    <View style={styles.compressionOverlayOnPreview}>
                      <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
                      <Text style={styles.compressionTextOnPreview}>Compressing...</Text>
                    </View>
                  )}

                  <Text style={styles.fileNamePreview} numberOfLines={1}>
                    {file.name || 'Selected media'}
                  </Text>

                  {!disableActions && ( // Show remove button only if not uploading/compressing
                    <TouchableOpacity
                      style={styles.removeFileButton}
                      onPress={removeFile}
                      disabled={disableActions} // Redundant but safe
                      >
                      <Icon name="close-circle" size={nw(26)} color={COLORS.red} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Upload Progress */}
            {isUploading && ( // Only show progress when actually uploading
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
                disabled={isUploading} // Cancel should ideally not be disabled by compression
              />
              <Button
                text={saveDraftButtonText}
                width={nw(100)} // Slightly wider for longer text
                height={nh(40)}
                textStyle={{fontSize: 14}}
                onPress={() => handlePost(true)}
                disabled={disableActions}
                variant="outline" // Making save draft secondary
              />
              <Button
                text={publishButtonText}
                width={nw(100)} // Slightly wider
                height={nh(40)}
                textStyle={{fontSize: 14}}
                onPress={() => handlePost(false)}
                disabled={disableActions}
                // Default variant (likely solid) to make it primary
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
        onRequestClose={() => {
            if (!disableActions) setModalVisible(false);
        }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Choose Media</Text>
            <TouchableOpacity
              style={styles.modalOption}
              onPress={openGallery}
              disabled={disableActions}>
              <Icon name="images-outline" size={nw(24)} color={COLORS.blue043142} />
              <Text style={styles.modalOptionText}>Choose from Gallery</Text>
            </TouchableOpacity>
            {/* Add more options like "Take Photo/Video" here if needed */}
            <TouchableOpacity
              style={styles.modalCancelOption}
              onPress={() => setModalVisible(false)}
              disabled={disableActions}>
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)', // Semi-transparent layer
    marginTop: nh(20), // Reduced margin slightly
    width: Dimensions.get('window').width,
    alignSelf: 'center',
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(18), // Slightly increased padding
    paddingTop: nh(25),      // Slightly reduced padding
    paddingBottom: nh(30), // Ensure space for buttons at the bottom
  },
  uploadLabel: {
    marginBottom: nh(8),
    color: COLORS.grey666666, // Darker grey for better readability
  },
  mediaUploadArea: {
    marginBottom: nh(20), // Space below the upload area
    alignItems: 'center', // Center the placeholder or preview
  },
  uploadPlaceholder: {
    width: '100%', // Take full width of padding
    height: nh(150),
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.greyDDDDDD,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.greyF7F7F7,
    padding: nw(10),
  },
  uploadPlaceholderText: {
    marginTop: nh(10),
    color: COLORS.grey888888,
    fontSize: nw(14),
    textAlign: 'center',
  },
  previewWrapper: {
    width: '100%', // Take full width
    position: 'relative',
    alignItems: 'center', // Center content like image/video box
    minHeight: nh(150), // Ensure it has some height even if image is small
    justifyContent: 'center', // Center content vertically
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 10,
    overflow: 'hidden', // Ensure overlay corners are clipped
  },
  previewImage: {
    width: '100%',
    height: nh(200), // Fixed height for image preview
    borderRadius: 10, // Match wrapper
  },
  videoPreviewBox: {
    width: '100%',
    height: nh(200), // Fixed height for video preview
    borderRadius: 10, // Match wrapper
    backgroundColor: COLORS.greyDDDDDD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPreviewText: {
    marginTop: nh(5),
    color: COLORS.grey555555,
    fontStyle: 'italic',
    fontSize: nw(14),
  },
  fileNamePreview: {
    position: 'absolute',
    bottom: nh(5),
    left: nw(10),
    right: nw(40), // Space for remove button
    color: COLORS.whiteFFFFFF,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: nw(8),
    paddingVertical: nh(3),
    borderRadius: 5,
    fontSize: nw(12),
    overflow: 'hidden', // for numberOfLines
  },
  removeFileButton: {
    position: 'absolute',
    top: nh(8),
    right: nw(8),
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: nw(13),
    padding: nw(2),
  },
  compressionOverlayOnPreview: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10, // Match wrapper
  },
  compressionTextOnPreview: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(14),
    marginTop: nh(5),
  },
  // Original compression styles if needed elsewhere, though overlay is preferred now
  compressionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(10),
    justifyContent: 'center',
  },
  compressionText: {
    marginLeft: nw(10),
    color: COLORS.grey999999,
    fontSize: 14,
  },
  progressContainer: {
    marginTop: nh(15), // Space above progress bar
    marginBottom: nh(10), // Space below progress bar
    height: nh(20),
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.green_A0D911, // Changed to a success-like green
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: nh(20), // Match height
    color: COLORS.black000000,
    fontWeight: 'bold',
    fontSize: nw(12),
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: nh(25), // Increased margin for better separation
    paddingBottom: nh(10), // Ensure buttons are not at the very edge
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: nh(20),
    paddingHorizontal: nw(15),
    alignItems: 'center', // Center title
    width: '100%',
  },
  modalTitle: {
    fontSize: nw(18),
    fontWeight: 'bold',
    marginBottom: nh(20),
    color: COLORS.blue043142,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: nh(15),
    paddingHorizontal: nw(10),
    // borderBottomWidth: 1, // Removed border for a cleaner look, spacing is enough
    // borderBottomColor: '#f0f0f0',
  },
  modalOptionText: {
    marginLeft: nw(15),
    fontSize: nw(16),
    color: COLORS.blue043142,
  },
  modalCancelOption: {
    width: '100%',
    paddingVertical: nh(12), // Adjusted padding
    alignItems: 'center',
    marginTop: nh(10),
    backgroundColor: COLORS.greyF0F0F0, // Subtle background for cancel
    borderRadius: 10,
  },
  modalCancelText: {
    color: COLORS.red,
    fontSize: nw(16),
    fontWeight: 'bold',
  },
  // Removed styles related to the old upload button and separate file name display
  // as they are now integrated into mediaUploadArea and previewWrapper
});