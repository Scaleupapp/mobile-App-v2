import React, {useCallback, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import DatePicker from 'react-native-date-picker';

import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import {createCommunityPostApi, uploadFileApi} from '../../services/apiService';

const PAGE_VARIANTS = ['post', 'poll', 'event'];

const PALETTE = {
  background: COLORS.greyF7F7F7,
  surface: COLORS.whiteFFFFFF,
  primary: COLORS.blue043142,
  accent: COLORS.yellowF5BE00,
  muted: COLORS.grey777777,
  subtle: COLORS.grey999999,
  border: COLORS.greyEEEEEE,
  danger: COLORS.redEA4335,
};

const getCommunityId = (route) => route?.params?.communityId || route?.params?.id;
const getCommunityName = (route) => route?.params?.communityName || 'Community';

const formatDateTime = (value) => value.toLocaleString(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

const PostTypeSelector = ({value, onChange}) => (
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
);

const MediaPreview = ({asset, onRemove}) => (
  <View style={styles.mediaPreviewCard}>
    <Image source={{uri: asset?.uri}} style={styles.mediaPreviewImage} />
    <TouchableOpacity style={styles.mediaRemoveButton} onPress={onRemove}>
      <Icon name="close-circle" size={nw(22)} color={COLORS.whiteFFFFFF} />
    </TouchableOpacity>
  </View>
);

const CreateCommunityPost = ({route, navigation}) => {
  const communityId = getCommunityId(route);
  const communityName = getCommunityName(route);

  const [postType, setPostType] = useState('post');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaAsset, setMediaAsset] = useState(null);

  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollSettings, setPollSettings] = useState({
    multipleChoice: false,
    anonymous: false,
    changeVote: true,
    showResults: 'after_vote'
  });

  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventDate, setEventDate] = useState(new Date());
  const [eventLocation, setEventLocation] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);

  const [submitting, setSubmitting] = useState(false);

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

  const postCharacterLimit = 1000;
  const eventCharacterLimit = 500;

  const canSubmit = useMemo(() => {
    if (submitting) {
      return false;
    }
    if (postType === 'post') {
      return Boolean(content.trim() || mediaAsset);
    }
    if (postType === 'poll') {
      const validOptions = pollOptions.filter((option) => option.trim());
      return Boolean(pollQuestion.trim() && validOptions.length >= 2);
    }
    if (postType === 'event') {
      return Boolean(eventTitle.trim() && eventDescription.trim());
    }
    return false;
  }, [content, mediaAsset, pollOptions, pollQuestion, postType, eventTitle, eventDescription, submitting]);

  const handleSelectMedia = useCallback(() => {
    launchImageLibrary({mediaType: 'mixed', quality: 0.85}, (response) => {
      if (response.didCancel) {
        return;
      }
      if (response.errorCode) {
        Alert.alert('Error', 'Unable to select media right now.');
        return;
      }
      if (response.assets && response.assets[0]) {
        setMediaAsset(response.assets[0]);
      }
    });
  }, []);

  const handleAddPollOption = useCallback(() => {
    if (pollOptions.length >= 5) {
      Alert.alert('Limit reached', 'You can add up to 5 options only');
      return;
    }
    setPollOptions((prev) => [...prev, '']);
  }, [pollOptions.length]);

  const handlePollOptionChange = useCallback((text, index) => {
    setPollOptions((prev) => prev.map((value, idx) => (idx === index ? text : value)));
  }, []);

  const handleRemovePollOption = useCallback((index) => {
    setPollOptions((prev) => prev.filter((_, idx) => idx !== index));
  }, []);

  const uploadMediaIfNeeded = useCallback(async () => {
    if (!mediaAsset) {
      return null;
    }
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: mediaAsset.uri,
        type: mediaAsset.type || 'image/jpeg',
        name: mediaAsset.fileName || `media-${Date.now()}`,
      });
      const response = await uploadFileApi(formData);
      return response?.data?.file?.url || null;
    } catch (error) {
      console.log('Upload error:', error);
      return null;
    }
  }, [mediaAsset]);

  const buildPayload = useCallback(
    async () => {
      try {
        const mediaUrl = await uploadMediaIfNeeded();
        
        if (postType === 'post') {
          // For regular posts, backend expects postType: 'text'
          const payload = {
            postType: 'text',
            title: title.trim() || undefined,
            content: {
              text: content.trim(),
            },
          };
          
          // Add media if available
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
        
        if (postType === 'poll') {
          const filteredOptions = pollOptions.filter((option) => option.trim());
          return {
            postType: 'poll',
            pollQuestion: pollQuestion.trim(),
            pollOptions: filteredOptions,
            pollSettings: pollSettings,
          };
        }
        
        if (postType === 'event') {
          const payload = {
            postType: 'event',
            title: eventTitle.trim(),
            content: {
              text: eventDescription.trim()
            },
            eventData: {
              title: eventTitle.trim(),
              description: eventDescription.trim(),
              startDate: eventDate.toISOString(),
              location: {
                type: 'physical',
                venue: eventLocation.trim() || undefined
              }
            }
          };
          
          // Add media if available
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
    },
    [content, title, eventDate, eventTitle, eventDescription, eventLocation, 
     pollOptions, pollQuestion, pollSettings, postType, uploadMediaIfNeeded],
  );

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) {
      return;
    }
    setSubmitting(true);
    try {
      const payload = await buildPayload();
      if (!payload) {
        throw new Error('Could not prepare post data.');
      }
      
      console.log('Submitting payload:', JSON.stringify(payload, null, 2));
      
      const response = await createCommunityPostApi(communityId, payload);
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
  }, [buildPayload, canSubmit, communityId, navigation]);

  const renderContextualTips = () => {
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
  };

  const keyboardBehavior = Platform.OS === 'ios' ? 'padding' : undefined;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
      <KeyboardAvoidingView behavior={keyboardBehavior} style={styles.flex}>
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

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <PostTypeSelector value={postType} onChange={setPostType} />

          <View style={styles.tipCard}>
            <Icon name="bulb" size={nw(18)} color={PALETTE.accent} />
            <Text style={styles.tipText}>{renderContextualTips()}</Text>
          </View>

          {postType === 'post' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Write your post</Text>
              
              <TextInput
                style={styles.singleLineInput}
                placeholder="Title (optional)"
                placeholderTextColor={PALETTE.subtle}
                value={title}
                onChangeText={setTitle}
                maxLength={300}
              />
              
              <TextInput
                style={styles.multiLineInput}
                placeholder="Share an update with your community"
                placeholderTextColor={PALETTE.subtle}
                multiline
                value={content}
                onChangeText={setContent}
                maxLength={postCharacterLimit}
              />
              
              <View style={styles.cardFooter}>
                <Text style={styles.charCounter}>{content.length}/{postCharacterLimit}</Text>
                <TouchableOpacity style={styles.mediaButton} onPress={handleSelectMedia}>
                  <Icon name="image" size={nw(18)} color={PALETTE.primary} />
                  <Text style={styles.mediaButtonText}>Add media</Text>
                </TouchableOpacity>
              </View>
              
              {mediaAsset ? <MediaPreview asset={mediaAsset} onRemove={() => setMediaAsset(null)} /> : null}
            </View>
          ) : null}

          {postType === 'poll' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Create a poll</Text>
              
              <TextInput
                style={styles.pollQuestionInput}
                placeholder="Ask your community a question"
                placeholderTextColor={PALETTE.subtle}
                value={pollQuestion}
                onChangeText={setPollQuestion}
                maxLength={200}
              />
              
              <Text style={styles.optionsLabel}>Options</Text>
              
              {pollOptions.map((option, index) => (
                <View key={index} style={styles.pollOptionRow}>
                  <TextInput
                    style={styles.pollOptionInput}
                    placeholder={`Option ${index + 1}`}
                    placeholderTextColor={PALETTE.subtle}
                    value={option}
                    onChangeText={(text) => handlePollOptionChange(text, index)}
                    maxLength={100}
                  />
                  {pollOptions.length > 2 ? (
                    <TouchableOpacity onPress={() => handleRemovePollOption(index)}>
                      <Icon name="close-circle" size={nw(20)} color={PALETTE.danger + 'CC'} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ))}
              
              {pollOptions.length < 5 ? (
                <TouchableOpacity style={styles.addOptionButton} onPress={handleAddPollOption}>
                  <Icon name="add-circle" size={nw(18)} color={PALETTE.primary} />
                  <Text style={styles.addOptionText}>Add option</Text>
                </TouchableOpacity>
              ) : null}
              
              <View style={styles.pollSettingsContainer}>
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => setPollSettings({...pollSettings, multipleChoice: !pollSettings.multipleChoice})}>
                  <Icon 
                    name={pollSettings.multipleChoice ? "checkbox" : "square-outline"} 
                    size={nw(20)} 
                    color={PALETTE.primary} 
                  />
                  <Text style={styles.checkboxLabel}>Allow multiple choices</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.checkboxRow}
                  onPress={() => setPollSettings({...pollSettings, anonymous: !pollSettings.anonymous})}>
                  <Icon 
                    name={pollSettings.anonymous ? "checkbox" : "square-outline"} 
                    size={nw(20)} 
                    color={PALETTE.primary} 
                  />
                  <Text style={styles.checkboxLabel}>Anonymous voting</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {postType === 'event' ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Event details</Text>
              
              <TextInput
                style={styles.singleLineInput}
                placeholder="Event title"
                placeholderTextColor={PALETTE.subtle}
                value={eventTitle}
                onChangeText={setEventTitle}
                maxLength={150}
              />
              
              <TouchableOpacity style={styles.dateButton} onPress={() => setDatePickerVisible(true)}>
                <Icon name="calendar" size={nw(18)} color={PALETTE.primary} />
                <Text style={styles.dateButtonText}>{formatDateTime(eventDate)}</Text>
              </TouchableOpacity>
              
              <DatePicker
                modal
                open={datePickerVisible}
                mode="datetime"
                minimumDate={new Date()}
                date={eventDate}
                onConfirm={(date) => {
                  setDatePickerVisible(false);
                  setEventDate(date);
                }}
                onCancel={() => setDatePickerVisible(false)}
              />
              
              <TextInput
                style={styles.singleLineInput}
                placeholder="Location (optional)"
                placeholderTextColor={PALETTE.subtle}
                value={eventLocation}
                onChangeText={setEventLocation}
                maxLength={200}
              />
              
              <TextInput
                style={styles.multiLineInput}
                placeholder="Describe the event agenda, venue, or logistics"
                placeholderTextColor={PALETTE.subtle}
                multiline
                value={eventDescription}
                onChangeText={setEventDescription}
                maxLength={eventCharacterLimit}
              />
              
              <View style={styles.cardFooter}>
                <Text style={styles.charCounter}>{eventDescription.length}/{eventCharacterLimit}</Text>
                <TouchableOpacity style={styles.mediaButton} onPress={handleSelectMedia}>
                  <Icon name="image" size={nw(18)} color={PALETTE.primary} />
                  <Text style={styles.mediaButtonText}>Add banner</Text>
                </TouchableOpacity>
              </View>
              
              {mediaAsset ? <MediaPreview asset={mediaAsset} onRemove={() => setMediaAsset(null)} /> : null}
            </View>
          ) : null}

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
            
            {!canSubmit && !submitting ? (
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
    paddingBottom: nh(),
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
  card: {
    borderRadius: nw(20),
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: nw(18),
    paddingVertical: nh(16),
    gap: nh(14),
  },
  cardTitle: {
    color: PALETTE.primary,
    fontSize: nw(14),
    fontWeight: '700',
  },
  multiLineInput: {
    minHeight: nh(120),
    color: PALETTE.primary,
    fontSize: nw(14),
    textAlignVertical: 'top',
  },
  singleLineInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(12),
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
    fontSize: nw(14),
    color: PALETTE.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCounter: {
    color: PALETTE.subtle,
    fontSize: nw(11),
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
  },
  mediaButtonText: {
    color: PALETTE.primary,
    fontSize: nw(12),
    fontWeight: '600',
  },
  mediaPreviewCard: {
    borderRadius: nw(16),
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPreviewImage: {
    width: '100%',
    height: nh(200),
  },
  mediaRemoveButton: {
    position: 'absolute',
    right: nw(10),
    top: nh(10),
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: nw(14),
    padding: nw(4),
  },
  pollQuestionInput: {
    borderBottomWidth: 1,
    borderColor: PALETTE.border,
    fontSize: nw(16),
    fontWeight: '600',
    paddingBottom: nh(10),
    color: PALETTE.primary,
  },
  optionsLabel: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  pollOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(10),
  },
  pollOptionInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(12),
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
    fontSize: nw(13),
    color: PALETTE.primary,
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  addOptionText: {
    color: PALETTE.primary,
    fontSize: nw(12),
    fontWeight: '600',
  },
  pollSettingsContainer: {
    gap: nh(10),
    marginTop: nh(8),
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  checkboxLabel: {
    color: PALETTE.primary,
    fontSize: nw(13),
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(12),
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
  },
  dateButtonText: {
    color: PALETTE.primary,
    fontSize: nw(13),
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