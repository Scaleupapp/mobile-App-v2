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
  Image,
  ActivityIndicator,
  Platform,
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
  const [file, setFile] = useState(null);
  const [contentType, setContentType] = useState('Image');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  // Premium content state
  const [activeTab, setActiveTab] = useState('normal'); // 'normal' or 'premium'
  const [premiumPrice, setPremiumPrice] = useState('');
  const [premiumContentLeft, setPremiumContentLeft] = useState(3); // Demo value

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
      
      // Set premium data if exists
      if (draftData.isPremium) {
        setActiveTab('premium');
        setPremiumPrice(draftData.price?.toString() || '');
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
    setActiveTab('normal');
    setPremiumPrice('');
  };

  const removeFile = () => {
    setFile(null);
  };

  const getProfileData = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (!userData) {
        showToast({title: 'User not logged in.', type: 'error'});
        return;
      }
      const parsedUser = JSON.parse(userData);
      const res = await getProfile('');
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

    const tempFile = {
      uri: asset.uri,
      type: asset.type,
      name: asset.fileName || 'media',
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
      setFile({...tempFile, uri: compressedUri});
    } catch (error) {
      console.error('Error processing file:', error);
      showToast({
        title: 'Failed to process file',
        type: 'error',
      });
      setFile(null);
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
    setModalVisible(false);

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

  const validatePremiumContent = () => {
    if (activeTab === 'premium') {
      if (premiumContentLeft <= 0) {
        showToast({title: 'No premium content slots left for this month.', type: 'error'});
        return false;
      }
      
      if (!premiumPrice || isNaN(Number(premiumPrice))) {
        showToast({title: 'Please enter a valid price for premium content.', type: 'error'});
        return false;
      }
      
      const price = Number(premiumPrice);
      if (price < 100 || price > 500) {
        showToast({title: 'Price should be between ₹100 - ₹500', type: 'error'});
        return false;
      }
    }
    return true;
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

    if (!validatePremiumContent()) {
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
      formData.append('verify', 'Yes');
      formData.append('captions', captions);
      formData.append('contentType', contentType);
      formData.append('isDraft', isDraft ? 'true' : 'false');
      
      // Premium content fields
      formData.append('isPremium', activeTab === 'premium' ? 'true' : 'false');
      if (activeTab === 'premium') {
        formData.append('price', premiumPrice);
      }

      if (file && file.uri) {
        formData.append('media', {
          uri: file.uri,
          type: file.type,
          name: file.name || `${contentType.toLowerCase()}_${Date.now()}`,
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
        const endpoint = isDraft
          ? `http://192.168.1.8:3000/api/content/${draftData.id}`
          : `http://192.168.1.8:3000/api/content/publish/${draftData.id}`;

        response = await axios.put(endpoint, formData, config);

        showToast({
          title: isDraft ? 'Draft updated successfully!' : (response.data?.message || 'Post published successfully!'),
          type: 'success',
        });

      } else {
        response = await axios.post(
          'http://192.168.1.8:3000/api/content/create',
          formData,
          config,
        );
        showToast({
          title: isDraft ? 'Draft saved successfully!' : 'Post published successfully!',
          type: 'success',
        });
      }

      // Decrease premium content count if premium content was created
      if (activeTab === 'premium' && !isDraft) {
        setPremiumContentLeft(prev => prev - 1);
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
    }
  };

  const headerTitle = isEditingDraft ? "Edit Draft" : "New Post";
  const publishButtonText = isEditingDraft ? "Publish Draft" : "Publish";
  const saveDraftButtonText = isEditingDraft ? "Update Draft" : "Save Draft";
  const disableActions = isUploading || isCompressing;

  const renderTabHeader = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'normal' && styles.activeTab]}
        onPress={() => setActiveTab('normal')}
        disabled={disableActions}>
        <Text style={[styles.tabText, activeTab === 'normal' && styles.activeTabText]}>
          Normal
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'premium' && styles.activeTab]}
        onPress={() => setActiveTab('premium')}
        disabled={disableActions}>
        <Text style={[styles.tabText, activeTab === 'premium' && styles.activeTabText]}>
          Premium
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPremiumOptions = () => {
    if (activeTab !== 'premium') return null;

    return (
      <View style={styles.premiumOptionsContainer}>
        <View style={styles.premiumInfoContainer}>
          <View style={styles.premiumInfoItem}>
            <Icon name="star" size={nw(20)} color={COLORS.yellowF5BE00} />
            <Text style={styles.premiumInfoText}>
              Premium content left: {premiumContentLeft}
            </Text>
          </View>
        </View>
        
        <CustomTextInput
          label="Price (₹100 - ₹500)"
          value={premiumPrice}
          onChangeText={(text) => {
            // Only allow numbers
            const numericText = text.replace(/[^0-9]/g, '');
            if (Number(numericText) > 500) {
              showToast({title: 'Maximum price is ₹500', type: 'warning'});
              return;
            }
            setPremiumPrice(numericText);
          }}
          keyboardType="numeric"
          disabled={disableActions}
        />
        
        {premiumPrice && Number(premiumPrice) > 500 && (
          <Text style={styles.warningText}>
            ⚠️ Price cannot exceed ₹500
          </Text>
        )}
      </View>
    );
  };

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
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.layer1}>
          <View style={styles.layer2}>
            {renderTabHeader()}
            
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
              numberOfLines={4}
              textAlignVertical="top"
              disabled={disableActions}
            />
            <CustomTextInput
              label="Hashtags (Space-separated, e.g., #innovation #growth)"
              value={hashtags}
              onChangeText={setHashtags}
              disabled={disableActions}
            />

            {renderPremiumOptions()}

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

                  {!disableActions && (
                    <TouchableOpacity
                      style={styles.removeFileButton}
                      onPress={removeFile}
                      disabled={disableActions}>
                      <Icon name="close-circle" size={nw(26)} color={COLORS.red} />
                    </TouchableOpacity>
                  )}
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
                text={saveDraftButtonText}
                width={nw(100)}
                height={nh(40)}
                textStyle={{fontSize: 14}}
                onPress={() => handlePost(true)}
                disabled={disableActions}
                variant="outline"
              />
              <Button
                text={publishButtonText}
                width={nw(100)}
                height={nh(40)}
                textStyle={{fontSize: 14}}
                onPress={() => handlePost(false)}
                disabled={disableActions}
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
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(20),
    width: Dimensions.get('window').width,
    alignSelf: 'center',
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(18),
    paddingTop: nh(25),
    paddingBottom: nh(30),
  },
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    marginBottom: nh(20),
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 25,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: nh(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: COLORS.yellowF5BE00,
  },
  tabText: {
    fontSize: nw(14),
    fontWeight: '500',
    color: 'black',
  },
  activeTabText: {
    color: 'black',
    fontWeight: '600',
  },
  // Premium options styles
  premiumOptionsContainer: {
    marginBottom: nh(20),
  },
  premiumInfoContainer: {
    backgroundColor: COLORS.greyF7F7F7,
    padding: nw(15),
    borderRadius: 10,
    marginBottom: nh(15),
  },
  premiumInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  premiumInfoText: {
    marginLeft: nw(8),
    fontSize: nw(14),
    color: 'black',
    fontWeight: '300',
  },
  warningText: {
    color: 'red',
    fontSize: nw(12),
    marginTop: nh(5),
    fontStyle: 'italic',
  },
  uploadLabel: {
    marginBottom: nh(8),
    color: COLORS.grey666666,
  },
  mediaUploadArea: {
    marginBottom: nh(20),
    alignItems: 'center',
  },
  uploadPlaceholder: {
    width: '100%',
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
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    minHeight: nh(150),
    justifyContent: 'center',
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: nh(200),
    borderRadius: 10,
  },
  videoPreviewBox: {
    width: '100%',
    height: nh(200),
    borderRadius: 10,
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
    right: nw(40),
    color: COLORS.whiteFFFFFF,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: nw(8),
    paddingVertical: nh(3),
    borderRadius: 5,
    fontSize: nw(12),
    overflow: 'hidden',
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
    borderRadius: 10,
  },
  compressionTextOnPreview: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(14),
    marginTop: nh(5),
  },
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
    marginTop: nh(15),
    marginBottom: nh(10),
    height: nh(20),
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  progressBar: {
    height: '100%',
    backgroundColor: COLORS.green_A0D911,
  },
  progressText: {
    position: 'absolute',
    width: '100%',
    textAlign: 'center',
    lineHeight: nh(20),
    color: COLORS.black000000,
    fontWeight: 'bold',
    fontSize: nw(12),
  },
  actionButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: nh(25),
    paddingBottom: nh(10),
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
    alignItems: 'center',
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
  },
  modalOptionText: {
    marginLeft: nw(15),
    fontSize: nw(16),
    color: COLORS.blue043142,
  },
  modalCancelOption: {
    width: '100%',
    paddingVertical: nh(12),
    alignItems: 'center',
    marginTop: nh(10),
    backgroundColor: COLORS.greyF0F0F0,
    borderRadius: 10,
  },
  modalCancelText: {
    color: COLORS.red,
    fontSize: nw(16),
    fontWeight: 'bold',
  },
});















