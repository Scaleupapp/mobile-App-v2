import React, {useCallback, useEffect, useMemo, useState, Suspense, lazy} from 'react';
import {
  ActivityIndicator,
  Alert,
  InteractionManager,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance from '../../services/axiosinstance';

import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';

// Constants
export const PALETTE = {
  background: COLORS.greyF7F7F7,
  surface: COLORS.whiteFFFFFF,
  primary: COLORS.blue043142,
  accent: COLORS.yellowF5BE00,
  muted: COLORS.grey777777,
  subtle: COLORS.grey999999,
  border: COLORS.greyEEEEEE,
  danger: COLORS.redEA4335,
};

const PAGE_VARIANTS = ['post', 'poll', 'event'];

// Lazy load post type components
const PostContent = lazy(() => import('./PostContent'));
const PollContent = lazy(() => import('./PollContent'));
const EventContent = lazy(() => import('./EventContent'));

// Utility functions
const getCommunityId = (route) => route?.params?.communityId || route?.params?.id;
const getCommunityName = (route) => route?.params?.communityName || 'Community';

// Memoized components
const PostTypeSelector = React.memo(({value, onChange}) => (
  <View style={styles.selectorRow}>
    {PAGE_VARIANTS.map((variant) => {
      const isActive = value === variant;
      return (
        <TouchableOpacity
          key={variant}
          style={[styles.selectorChip, isActive && styles.selectorChipActive]}
          onPress={() => onChange(variant)}
          activeOpacity={0.85}>
          <Text style={[styles.selectorText, isActive && styles.selectorTextActive]}>
            {variant.toUpperCase()}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
));

const TipCard = React.memo(({postType}) => {
  const tipText = useMemo(() => {
    if (postType === 'post') {
      return 'Share an update, ask a question, or celebrate wins with your community.';
    }
    if (postType === 'poll') {
      return 'Polls help you gauge interest. Add at least two options to get started.';
    }
    if (postType === 'event') {
      return 'Events promote meetups or study sessions. Add a title, time, and description.';
    }
    return '';
  }, [postType]);

  return (
    <View style={styles.tipCard}>
      <Icon name="bulb" size={nw(18)} color={PALETTE.accent} />
      <Text style={styles.tipText}>{tipText}</Text>
    </View>
  );
});

const CreateCommunityPost = ({route, navigation}) => {
  const communityId = getCommunityId(route);
  const communityName = getCommunityName(route);

  // Core state
  const [postType, setPostType] = useState('post');
  const [submitting, setSubmitting] = useState(false);
  
  // Deferred UI state
  const [showNonCritical, setShowNonCritical] = useState(false);
  const [gradientLoaded, setGradientLoaded] = useState(false);
  
  // Lazy loaded modules - removed uploadModule as we now import directly
  
  // Post-specific state (lazy initialized)
  const [postState, setPostState] = useState(() => ({
    title: '',
    content: '',
    mediaAsset: null
  }));
  
  const [pollState, setPollState] = useState(null);
  const [eventState, setEventState] = useState(null);

  // Initialize state when switching post types
  useEffect(() => {
    if (postType === 'poll' && !pollState) {
      setPollState({
        pollQuestion: '',
        pollOptions: ['', ''],
        pollSettings: {
          multipleChoice: false,
          anonymous: false,
          changeVote: true,
          showResults: 'after_vote'
        }
      });
    } else if (postType === 'event' && !eventState) {
      setEventState({
        eventTitle: '',
        eventDescription: '',
        eventDate: new Date(),
        eventLocation: '',
        mediaAsset: null
      });
    }
  }, [postType, pollState, eventState]);

  // Defer non-critical UI elements
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      setShowNonCritical(true);
    });
    
    requestAnimationFrame(() => {
      setGradientLoaded(true);
    });
  }, []);

  // Lazy load API service when needed - removed getUploadModule as we import directly

  const canSubmit = useMemo(() => {
    if (submitting) return false;
    
    if (postType === 'post') {
      return Boolean(postState.content.trim() || postState.mediaAsset);
    }
    if (postType === 'poll' && pollState) {
      const validOptions = pollState.pollOptions.filter((option) => option.trim());
      return Boolean(pollState.pollQuestion.trim() && validOptions.length >= 2);
    }
    if (postType === 'event' && eventState) {
      return Boolean(eventState.eventTitle.trim() && eventState.eventDescription.trim());
    }
    return false;
  }, [postState, pollState, eventState, postType, submitting]);

  const uploadMediaIfNeeded = useCallback(async (mediaAsset) => {
    if (!mediaAsset) return null;
    
    try {
      console.log('Starting media upload for:', mediaAsset);
      const { uploadCommunityMediaApi } = await import('../../services/apiService');
      const formData = new FormData();
      formData.append('files', {
        uri: mediaAsset.uri,
        type: mediaAsset.type || 'image/jpeg',
        name: mediaAsset.fileName || `media-${Date.now()}`,
      });
      
      console.log('Uploading to community:', communityId);
      const response = await uploadCommunityMediaApi(communityId, formData);
      console.log('Upload response:', JSON.stringify(response?.data, null, 2));
      
      const mediaUrl = response?.data?.uploaded?.[0]?.url || null;
      if (mediaUrl) {
        console.log('Media uploaded successfully:', mediaUrl);
      } else {
        console.warn('No media URL found in response');
      }
      
      return mediaUrl;
    } catch (error) {
      console.error('Upload error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      return null;
    }
  }, [communityId]);

  const buildPayload = useCallback(async () => {
    try {
      if (postType === 'post') {
        const payload = {
          postType: 'text',
          title: postState.title.trim() || undefined,
          content: {
            text: postState.content.trim(),
          },
        };
        
        console.log('Post payload:', JSON.stringify(payload, null, 2));
        return payload;
      }
      
      if (postType === 'poll' && pollState) {
        const filteredOptions = pollState.pollOptions.filter((option) => option.trim());
        return {
          postType: 'poll',
          pollQuestion: pollState.pollQuestion.trim(),
          pollOptions: filteredOptions,
          pollSettings: pollState.pollSettings,
        };
      }
      
      if (postType === 'event' && eventState) {
        const mediaUrl = await uploadMediaIfNeeded(eventState.mediaAsset);
        const payload = {
          postType: 'event',
          title: eventState.eventTitle.trim(),
          content: {
            text: eventState.eventDescription.trim()
          },
          eventData: {
            title: eventState.eventTitle.trim(),
            description: eventState.eventDescription.trim(),
            startDate: eventState.eventDate.toISOString(),
            location: {
              type: 'physical',
              venue: eventState.eventLocation.trim() || undefined
            }
          }
        };
        
        if (mediaUrl) {
          payload.media = {
            images: [{
              url: mediaUrl,
              uploadedAt: new Date().toISOString()
            }]
          };
        }
        return payload;
      }
      
      return null;
    } catch (error) {
      console.log('Error building payload:', error);
      throw error;
    }
  }, [postState, pollState, eventState, postType, uploadMediaIfNeeded]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    
    setSubmitting(true);
    try {
      // For regular posts with media, we need to upload the media first
      let postMediaUrl = null;
      if (postType === 'post' && postState.mediaAsset) {
        console.log('Uploading media for post...');
        postMediaUrl = await uploadMediaIfNeeded(postState.mediaAsset);
      }
      
      // Build the payload (for events, this already handles media upload)
      const payload = await buildPayload();
      
      if (!payload) {
        throw new Error('Could not prepare post data.');
      }
      
      // Add media to post payload if it was uploaded
      if (postType === 'post' && postMediaUrl) {
        payload.media = {
          images: [{
            url: postMediaUrl,
            uploadedAt: new Date().toISOString()
          }]
        };
      }
      
      console.log('Submitting payload:', JSON.stringify(payload, null, 2));
      
      // Get auth token
      const userData = await AsyncStorage.getItem('userData');
      const { token } = JSON.parse(userData);
      
      // Send as JSON instead of FormData
      const response = await axiosInstance.post(
        `communities/${communityId}/posts`,
        payload,  // Send payload directly as JSON
        {
          headers: {
            'Content-Type': 'application/json',  // Changed from multipart/form-data
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      console.log('Post created successfully:', response?.data);
      
      Alert.alert('Success', 'Your post has been published!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.log('Create community post error', error?.response?.data || error?.message);
      Alert.alert(
        'Error', 
        error?.response?.data?.message || 'Unable to publish your post right now. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }, [buildPayload, canSubmit, communityId, navigation, postType, postState.mediaAsset, uploadMediaIfNeeded]);
  // Props for child components
  const commonProps = {
    navigation,
    submitting,
    uploadMediaIfNeeded
  };

  const postProps = {
    ...commonProps,
    state: postState,
    setState: setPostState,
  };

  const pollProps = {
    ...commonProps,
    state: pollState,
    setState: setPollState,
  };

  const eventProps = {
    ...commonProps,
    state: eventState,
    setState: setEventState,
  };

  if (!communityId) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
        <View style={styles.missingContainer}>
          <Icon name="alert-circle" size={nw(32)} color={PALETTE.muted} />
          <Text style={styles.missingTitle}>Community not found</Text>
          <Text style={styles.missingSubtitle}>Return to the previous screen and try again.</Text>
          <TouchableOpacity style={styles.missingButton} onPress={() => navigation.goBack()}>
            <Text style={styles.missingButtonText}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
      <KeyboardAvoidingView behavior={keyboardBehavior} style={styles.flex}>
        {gradientLoaded ? (
          <LinearGradient colors={[PALETTE.primary, '#0E4F62']} style={styles.headerGradient}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Icon name="chevron-back" size={nw(20)} color={COLORS.whiteFFFFFF} />
            </TouchableOpacity>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>Create Post</Text>
              <Text style={styles.headerSubtitle}>{communityName}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </LinearGradient>
        ) : (
          <View style={[styles.headerGradient, {backgroundColor: PALETTE.primary}]}>
            <TouchableOpacity style={styles.headerButton} onPress={() => navigation.goBack()}>
              <Icon name="chevron-back" size={nw(20)} color={COLORS.whiteFFFFFF} />
            </TouchableOpacity>
            <View style={styles.headerTextBlock}>
              <Text style={styles.headerTitle}>Create Post</Text>
              <Text style={styles.headerSubtitle}>{communityName}</Text>
            </View>
            <View style={styles.headerSpacer} />
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <PostTypeSelector value={postType} onChange={setPostType} />

          {showNonCritical && <TipCard postType={postType} />}

          <Suspense fallback={
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={PALETTE.primary} />
            </View>
          }>
            {postType === 'post' && <PostContent {...postProps} />}
            {postType === 'poll' && pollState && <PollContent {...pollProps} />}
            {postType === 'event' && eventState && <EventContent {...eventProps} />}
          </Suspense>

          <View style={styles.submitButtonContainer}>
            <TouchableOpacity
              style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
              ) : (
                <>
                  <Icon name="send" size={nw(18)} color={COLORS.whiteFFFFFF} />
                  <Text style={styles.submitButtonText}>Publish Post</Text>
                </>
              )}
            </TouchableOpacity>
            
            {!canSubmit && !submitting && showNonCritical ? (
              <Text style={styles.submitHint}>
                {postType === 'post' ? 'Add some content or media to post' :
                 postType === 'poll' ? 'Fill in your question and at least 2 options' :
                 postType === 'event' ? 'Add event title and description' : ''}
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  flex: {
    flex: 1,
  },
  headerGradient: {
    paddingHorizontal: nw(20),
    paddingTop: nh(26),
    paddingBottom: nh(20),
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
  },
  headerButton: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextBlock: {
    flex: 1,
  },
  headerTitle: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(18),
    fontWeight: '700',
  },
  headerSubtitle: {
    color: COLORS.whiteFFFFFF + 'CC',
    fontSize: nw(12),
    marginTop: nh(2),
  },
  headerSpacer: {
    width: nw(36),
  },
  scrollContent: {
    paddingHorizontal: nw(20),
    paddingVertical: nh(20),
    paddingBottom: nh(100),
    gap: nh(20),
  },
  selectorRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(18),
    borderWidth: 1,
    borderColor: PALETTE.border,
    padding: nw(4),
    gap: nw(6),
  },
  selectorChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(8),
    borderRadius: nw(14),
  },
  selectorChipActive: {
    backgroundColor: PALETTE.primary,
  },
  selectorText: {
    color: PALETTE.muted,
    fontSize: nw(12),
    fontWeight: '500',
  },
  selectorTextActive: {
    color: COLORS.whiteFFFFFF,
    fontWeight: '600',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(10),
    borderRadius: nw(16),
    backgroundColor: PALETTE.accent + '22',
    paddingHorizontal: nw(14),
    paddingVertical: nh(12),
  },
  tipText: {
    color: PALETTE.primary,
    fontSize: nw(12),
    flex: 1,
    lineHeight: nh(18),
  },
  loadingContainer: {
    height: nh(200),
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonContainer: {
    gap: nh(8),
    marginTop: nh(10),
  },
  submitButton: {
    backgroundColor: PALETTE.primary,
    borderRadius: nw(20),
    paddingVertical: nh(14),
    paddingHorizontal: nw(24),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: nw(8),
    shadowColor: PALETTE.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: PALETTE.muted + '66',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(14),
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  submitHint: {
    color: PALETTE.muted,
    fontSize: nw(11),
    textAlign: 'center',
    marginTop: nh(4),
  },
  missingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: nh(12),
    paddingHorizontal: nw(24),
  },
  missingTitle: {
    color: PALETTE.primary,
    fontSize: nw(16),
    fontWeight: '700',
  },
  missingSubtitle: {
    color: PALETTE.muted,
    fontSize: nw(12),
    textAlign: 'center',
  },
  missingButton: {
    marginTop: nh(10),
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    borderRadius: nw(16),
    backgroundColor: PALETTE.primary,
  },
  missingButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(12),
    fontWeight: '600',
  },
});

export default CreateCommunityPost;