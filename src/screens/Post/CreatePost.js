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
  Switch,
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
import Video from 'react-native-video';

import {compressImage, compressVideo} from '../../helper/commonFunctions';
import mixpanel from '../../helper/mixpanelClient';

import {getVideoDuration} from 'react-native-video-duration';

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

  // Premium content state
  const [isPremium, setIsPremium] = useState(false);
  const [price, setPrice] = useState('');
  // const [previewDuration, setPreviewDuration] = useState('');

  // Modal for selecting media
  const [modalVisible, setModalVisible] = useState(false);

  // User data state
  const [profileData, setProfileData] = useState(null);

  // Determine if editing an existing draft
  const isEditingDraft = Boolean(draftData?.id);

  const [contentMetrics, setContentMetrics] = useState(null);

  const fetchContentMetrics = async () => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      const {token} = JSON.parse(userData);

      const response = await axios.get(
        'https://api.scaleupapp.club/api/content/fetch-upload-metrics',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      setContentMetrics(response.data.userContentMetrics);
    } catch (error) {
      console.log(
        'Content metrics fetch error:',
        error?.response?.data?.message || error.message,
      );
      // Only show toast if user has creator badge (otherwise they can't see metrics anyway)
      if (profileData?.creatorBadgeUnlocked) {
        showToast({
          title: 'Failed to load content metrics',
          type: 'error',
        });
      }
    }
  };

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
      setIsPremium(draftData.isPremium || false);
      setPrice(draftData.price ? draftData.price.toString() : '');
      // setPreviewDuration(draftData.previewDuration ? draftData.previewDuration.toString() : '');

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
    mixpanel.track('Landed Create Post');
    getProfileData();
  }, []);

  useEffect(() => {
    if (profileData?.creatorBadgeUnlocked) {
      fetchContentMetrics();
    }
  }, [profileData]);

  // console.log("vkhbsksdvkbdsvbkvdskbvsd",profileData?.creatorBadgeUnlocked);

  const PremiumContentCounter = () => {
    if (!profileData?.creatorBadgeUnlocked || !contentMetrics) {
      return null;
    }

    const {premiumContent} = contentMetrics;
    console.log('ppppppppppppppppp', premiumContent);
    const remainingCount =
      premiumContent.permittedUploadCount - premiumContent.uploadCount;

    return (
      <View style={styles.premiumCounterContainer}>
        <View style={styles.premiumCounterHeader}>
          <Icon
            name="diamond-outline"
            size={nw(18)}
            color={COLORS.yellowF5BE00}
          />
          <Text variant="medium14" color={COLORS.greyBBBBBB}>
            Premium Content Quota
          </Text>
        </View>

        <View style={styles.premiumCounterStats}>
          <View style={styles.statItem}>
            <Text variant="bold16" color={COLORS.blue043142}>
              {remainingCount}
            </Text>
            <Text variant="regular12" color={COLORS.grey999999}>
              Remaining
            </Text>
          </View>

          <View style={styles.statDivider} />

          <View style={styles.statItem}>
            <Text variant="regular14" color={COLORS.greyBBBBBB}>
              {premiumContent.uploadCount}/{premiumContent.permittedUploadCount}
            </Text>
            <Text variant="regular12" color={COLORS.grey999999}>
              Used this month
            </Text>
          </View>
        </View>

        {remainingCount === 0 && (
          <View style={styles.quotaExhaustedWarning}>
            <Icon name="warning-outline" size={nw(16)} color={COLORS.red} />
            <Text variant="regular12" color={COLORS.red}>
              Upload more free videos to increase your premium quota
            </Text>
          </View>
        )}
      </View>
    );
  };

  const ContentRequirementsChecker = () => {
    if (!contentMetrics) {
      return null;
    }

    const {freeContent, overallFreeContentCount} = contentMetrics;
    const hasUploadedTenOverall = overallFreeContentCount >= 10;
    const hasUploadedThreeThisMonth = freeContent.currentMonthCount >= 3;

    return (
      <View style={styles.requirementsContainer}>
        <Text
          variant="medium14"
          color={COLORS.greyBBBBBB}
          style={styles.requirementsTitle}>
          Premium Content Requirements
        </Text>

        <View style={styles.requirementRow}>
          <Icon
            name={hasUploadedTenOverall ? 'checkmark-circle' : 'close-circle'}
            size={nw(18)}
            color={hasUploadedTenOverall ? COLORS.green : COLORS.red}
          />
          <Text variant="regular12" color={COLORS.greyBBBBBB}>
            Upload 10+ free content overall ({overallFreeContentCount}/10)
          </Text>
        </View>

        <View style={styles.requirementRow}>
          <Icon
            name={
              hasUploadedThreeThisMonth ? 'checkmark-circle' : 'close-circle'
            }
            size={nw(18)}
            color={hasUploadedThreeThisMonth ? COLORS.green : COLORS.red}
          />
          <Text variant="regular12" color={COLORS.greyBBBBBB}>
            Upload 3+ free content this month ({freeContent.currentMonthCount}
            /3)
          </Text>
        </View>
      </View>
    );
  };

  const resetForm = () => {
    setHeading('');
    setTopics('');
    setCaptions('');
    setHashtags('');
    setFile(null);
    setContentType('Image');
    setUploadProgress(0);
    setIsPremium(false);
    setPrice('');
    // setPreviewDuration('');
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

      console.log('gggggggggggggggggggg', parsedUser);
    } catch (error) {
      console.log(
        'Profile data fetch error:',
        error?.response?.data?.message || error.message,
      );
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

    const selectedContentType =
      asset.type && asset.type.toLowerCase().includes('video')
        ? 'Video'
        : 'Image';
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
      let videoDuration = null;

      if (selectedContentType === 'Video') {
        compressedUri = await compressVideo(asset.uri);
        videoDuration = asset.duration || asset.playableDuration || 60; // Default 60 seconds
        console.log('Video duration from asset:', videoDuration);
      } else {
        compressedUri = await compressImage(asset.uri);
      }
      setFile({
        ...tempFile,
        uri: compressedUri,
        duration: videoDuration, // Store duration in file object
      }); // Update with compressed URI
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
        showToast({
          title: result.errorMessage || 'Failed to select file',
          type: 'error',
        });
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

  const handlePremiumToggle = value => {
    mixpanel.track(`Click on Premium Toggle`);
    if (value && contentMetrics) {
      const hasUploadedTenOverall =
        contentMetrics.overallFreeContentCount >= 10;
      const hasUploadedThreeThisMonth =
        contentMetrics.freeContent.uploadCount >= 3;

      if (!hasUploadedTenOverall || !hasUploadedThreeThisMonth) {
        showToast({
          title: 'Requirements not met for premium content',
          type: 'error',
        });
        return;
      }
    }

    setIsPremium(value);
    if (!value) {
      setPrice('');
    }
  };

  const validatePremiumFields = () => {
    if (isPremium) {
      if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
        showToast({
          title: 'Please enter a valid price for premium content.',
          type: 'error',
        });
        return false;
      }
      // if (!previewDuration || isNaN(parseInt(previewDuration)) || parseInt(previewDuration) <= 0) {
      //   showToast({title: 'Please enter a valid preview duration in seconds.', type: 'error'});
      //   return false;
      // }
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

    // Validate premium fields if premium is enabled
    if (!validatePremiumFields()) {
      return;
    }

    // Check if user has creator badge for premium content
    if (isPremium && !profileData?.creatorBadgeUnlocked) {
      showToast({
        title:
          'You need to unlock the Content Creator badge to create premium content.',
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

      const formData = new FormData();
      formData.append('heading', heading);
      const topicsArray = topics
        .split(',')
        .map(t => t.trim())
        .filter(t => t);
      const hashtagsArray = hashtags
        .split(' ')
        .filter(h => h.startsWith('#') && h.length > 1);

      formData.append('relatedTopics', JSON.stringify(topicsArray));
      formData.append('hashtags', JSON.stringify(hashtagsArray));
      formData.append('verify', 'Yes'); // Assuming this is constant
      formData.append('captions', captions);
      formData.append('contentType', contentType);
      formData.append('isDraft', isDraft ? 'true' : 'false');

      // Add premium content fields
      if (isPremium) {
        formData.append('isPremium', 'true');
        formData.append('price', price);
        // Calculate preview duration as 10% of video duration
        if (contentType === 'Video' && file?.duration) {
          const calculatedPreviewDuration = Math.max(
            2,
            Math.floor(file.duration * 0.1),
          ); // Minimum 5 seconds
          formData.append(
            'previewDuration',
            calculatedPreviewDuration.toString(),
          );
        } else {
          formData.append('previewDuration', '10'); // Default for images or if duration unavailable
        }
      } else {
        formData.append('isPremium', 'false');
      }

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
          title: isDraft
            ? 'Draft updated successfully!'
            : response.data?.message || 'Post published successfully!',
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
          title: isDraft
            ? 'Draft saved successfully!'
            : 'Post published successfully!',
          type: 'success',
        });
      }

      console.log('Post/Draft Operation Success:', response.data);

      // Show achievement message if creator badge was unlocked
      if (response.data?.acheivement) {
        setTimeout(() => {
          showToast({
            title: response.data.acheivement,
            type: 'success',
          });
        }, 1000);
      }

      setTimeout(() => {
        resetForm();
        navigation.goBack();
      }, 500);
    } catch (error) {
      console.error('Upload Error:', error.response?.data || error.message);
      const errorMessage =
        error.response?.data?.message || 'Failed to process post.';
      showToast({title: errorMessage, type: 'error'});
    } finally {
      setIsUploading(false);
      // setUploadProgress(0); // Progress bar will hide or reset based on isUploading
    }
  };

  const headerTitle = isEditingDraft ? 'Edit Draft' : 'New Post';
  const publishButtonText = isEditingDraft ? 'Publish Draft' : 'Publish';
  const saveDraftButtonText = isEditingDraft ? 'Update Draft' : 'Save Draft';
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
            {profileData?.creatorBadgeUnlocked && <PremiumContentCounter />}
            {<ContentRequirementsChecker />}

            {/* Premium Content Section */}
            <View style={styles.premiumSection}>
              <View style={styles.premiumToggleContainer}>
                <Text variant="medium14" color={COLORS.greyBBBBBB}>
                  Premium Content
                </Text>
                <Switch
                  value={isPremium}
                  onValueChange={handlePremiumToggle}
                  disabled={
                    disableActions || !profileData?.creatorBadgeUnlocked
                  }
                  trackColor={{
                    false: COLORS.greyBBBBBB,
                    true: COLORS.yellowF5BE00,
                  }}
                  thumbColor={
                    isPremium ? COLORS.whiteFFFFFF : COLORS.greyBBBBBB
                  }
                />
              </View>

              {/* <ContentRequirementsChecker /> */}

              {isPremium && (
                <View style={styles.premiumFieldsContainer}>
                  <CustomTextInput
                    label="Price (Rs. 99 - Rs. 499)"
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="e.g., Rs. 99"
                    disabled={disableActions}
                  />
                  {/* <CustomTextInput
                    label="Preview Duration (seconds)"
                    value={previewDuration}
                    onChangeText={setPreviewDuration}
                    keyboardType="numeric"
                    placeholder="e.g., 30"
                    disabled={disableActions}
                  /> */}
                  {/* <Text variant="regular12" color={COLORS.grey999999} style={styles.premiumHelpText}>
                    Users will see a preview of your content for the specified duration before being prompted to purchase.
                  </Text> */}
                </View>
              )}
            </View>

            {/* Upload Section */}
            <Text
              variant="medium14"
              color={COLORS.greyBBBBBB}
              style={styles.uploadLabel}>
              Upload Image/Video
            </Text>
            <View style={styles.mediaUploadArea}>
              {!file && !isCompressing && (
                <TouchableOpacity
                  style={styles.uploadPlaceholder}
                  onPress={() => setModalVisible(true)}
                  disabled={disableActions}>
                  <Icon
                    name="cloud-upload-outline"
                    size={nw(50)}
                    color={COLORS.greyBBBBBB}
                  />
                  <Text style={styles.uploadPlaceholderText}>
                    Tap to select Image/Video
                  </Text>
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
                      <Icon
                        name="videocam-outline"
                        size={nw(40)}
                        color={COLORS.grey999999}
                      />
                      <Text style={styles.videoPreviewText}>
                        Video Selected
                      </Text>
                    </View>
                  )}

                  {isCompressing && (
                    <View style={styles.compressionOverlayOnPreview}>
                      <ActivityIndicator
                        size="small"
                        color={COLORS.whiteFFFFFF}
                      />
                      <Text style={styles.compressionTextOnPreview}>
                        Compressing...
                      </Text>
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
                      <Icon
                        name="close-circle"
                        size={nw(26)}
                        color={COLORS.red}
                      />
                    </TouchableOpacity>
                  )}

                  {isPremium && (
                    <View style={styles.premiumBadge}>
                      <Icon
                        name="diamond-outline"
                        size={nw(16)}
                        color={COLORS.yellowF5BE00}
                      />
                      <Text style={styles.premiumBadgeText}>Premium</Text>
                    </View>
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
              <Icon
                name="images-outline"
                size={nw(24)}
                color={COLORS.blue043142}
              />
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

  premiumCounterContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(8),
    padding: nw(16),
    marginBottom: nh(16),
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },

  premiumCounterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(12),
  },

  requirementsContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(16),
    marginVertical: nh(8),
    borderRadius: nw(8),
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  requirementsTitle: {
    marginBottom: nh(12),
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(8),
    gap: nw(8),
  },

  premiumCounterStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statItem: {
    flex: 1,
    alignItems: 'center',
  },

  statDivider: {
    width: 1,
    height: nh(30),
    backgroundColor: COLORS.greyEEEEEE,
    marginHorizontal: nw(16),
  },

  quotaExhaustedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(12),
    padding: nw(8),
    backgroundColor: '#FEF2F2',
    borderRadius: nw(6),
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
