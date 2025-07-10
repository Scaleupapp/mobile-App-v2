// =====================================================
// CREATE DECK SCREEN - Enhanced with Edit Mode Support
// File: screens/Flashcards/CreateDeck.js
// =====================================================

import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Switch,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {
  createFlashcardDeckApi,
  updateFlashcardDeckApi,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';

const CreateDeck = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // Get edit mode parameters from navigation
  const isEdit = route.params?.isEdit || false;
  const deckId = route.params?.deckId;
  const deckData = route.params?.deckData;

  // Form state with proper initialization
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    tags: [],
    isPublic: false,
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Refs for input focus management
  const titleRef = useRef(null);
  const descriptionRef = useRef(null);
  const tagRef = useRef(null);

  // **ENHANCED: Populate form data in edit mode**
  useEffect(() => {
    if (isEdit && deckData) {
      console.log('Populating edit form with:', deckData);

      setFormData({
        title: deckData.title || '',
        description: deckData.description || '',
        subject: deckData.subject || '',
        tags: deckData.tags || [],
        isPublic: deckData.isPublic || false,
      });
    }
  }, [isEdit, deckData]);

  // Subject options
  const subjects = [
    {value: 'engineering', label: 'Engineering', icon: 'engineering'},
    {value: 'medical', label: 'Medical', icon: 'medical-services'},
    {value: 'science', label: 'Science', icon: 'science'},
    {value: 'mathematics', label: 'Mathematics', icon: 'calculate'},
    {value: 'business', label: 'Business', icon: 'business'},
    {value: 'languages', label: 'Languages', icon: 'translate'},
    {value: 'competitive_exams', label: 'Competitive Exams', icon: 'quiz'},
    {value: 'history', label: 'History', icon: 'history-edu'},
    {value: 'general', label: 'General', icon: 'school'},
    {value: 'other', label: 'Other', icon: 'more-horiz'},
  ];

  // **ENHANCED: Form validation**
  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Deck title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 100) {
      newErrors.title = 'Title must be less than 100 characters';
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: null}));
    }
  };

  // Handle subject selection
  const handleSubjectSelect = subject => {
    handleInputChange('subject', subject);
  };

  // **ENHANCED: Handle tag management**
  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag) && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagInput('');
    }
  };

  const removeTag = tagToRemove => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove),
    }));
  };

  // **ENHANCED: Handle form submission for both create and update**
  const handleSubmit = async () => {
    let btn = isEdit ? 'Update Deck' : 'Create Deck';
    mixpanel.track(`Click on final ${btn} Button`);
    if (!validateForm()) {
      showToast({
        type: 'error',
        title: 'Please fix the errors and try again',
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        subject: formData.subject,
        tags: formData.tags,
        isPublic: formData.isPublic,
        subjectDetails: {
          level: 'intermediate', // Default level
        },
      };

      let response;

      if (isEdit) {
        // Update existing deck
        response = await updateFlashcardDeckApi(deckId, payload);
      } else {
        // Create new deck
        response = await createFlashcardDeckApi(payload);
      }

      if (response?.data?.success) {
        showToast({
          type: 'success',
          title: isEdit
            ? 'Deck updated successfully!'
            : 'Deck created successfully!',
          message: isEdit
            ? 'Your changes have been saved'
            : 'You can now add flashcards to your deck',
        });

        if (isEdit) {
          // Go back to deck details
          navigation.goBack();
        } else {
          // Navigate to the newly created deck
          navigation.navigate(Routes.DeckDetails, {
            deckId: response.data.deck._id,
            isNewDeck: true,
          });
        }
      }
    } catch (error) {
      console.error('Deck submission error:', error);
      showToast({
        type: 'error',
        title: isEdit ? 'Failed to update deck' : 'Failed to create deck',
        message: error?.response?.data?.message || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  };

  // Render subject selection
  const renderSubjectGrid = () => (
    <View style={styles.subjectGrid}>
      {subjects.map(subject => (
        <Pressable
          key={subject.value}
          style={[
            styles.subjectCard,
            formData.subject === subject.value && styles.subjectCardSelected,
          ]}
          onPress={() => handleSubjectSelect(subject.value)}>
          <Icon
            name={subject.icon}
            size={24}
            color={
              formData.subject === subject.value
                ? COLORS.whiteFFFFFF
                : COLORS.blue043142
            }
          />
          <Text
            variant="medium12"
            color={
              formData.subject === subject.value
                ? COLORS.whiteFFFFFF
                : COLORS.blue043142
            }
            style={styles.subjectLabel}>
            {subject.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  // Render tags section
  const renderTagsSection = () => (
    <View style={styles.tagsSection}>
      <Text variant="semibold14" color={COLORS.blue043142} style={styles.label}>
        Tags (Optional)
      </Text>
      <Text
        variant="medium12"
        color={COLORS.grey777777}
        style={styles.labelDescription}>
        Add up to 5 tags to help organize your deck
      </Text>

      <View style={styles.tagInputContainer}>
        <TextInput
          ref={tagRef}
          style={styles.tagInput}
          placeholder="Enter a tag"
          placeholderTextColor={COLORS.grey999999}
          value={tagInput}
          onChangeText={setTagInput}
          maxLength={20}
          returnKeyType="done"
          onSubmitEditing={addTag}
        />
        <Pressable
          style={[
            styles.addTagButton,
            !tagInput.trim() && styles.addTagButtonDisabled,
          ]}
          onPress={addTag}
          disabled={!tagInput.trim() || formData.tags.length >= 5}>
          <Icon name="add" size={20} color={COLORS.whiteFFFFFF} />
        </Pressable>
      </View>

      {formData.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {formData.tags.map(tag => (
            <View key={tag} style={styles.tagChip}>
              <Text variant="medium12" color={COLORS.blue043142}>
                {tag}
              </Text>
              <Pressable
                onPress={() => removeTag(tag)}
                style={styles.removeTagButton}>
                <Icon name="close" size={16} color={COLORS.blue043142} />
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Text
        variant="regular12"
        color={COLORS.grey777777}
        style={styles.helperText}>
        {formData.tags.length}/5 tags added
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <Header
        title={isEdit ? 'Edit Deck' : 'Create New Deck'}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
        rightComponent={
          <Pressable onPress={handleSubmit} disabled={loading}>
            <Text variant="semibold16" color={COLORS.blue043142}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </Text>
          </Pressable>
        }
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={styles.layer1}>
          <View style={styles.layer2}>
            <ScrollView
              style={styles.scrollView}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              {/* Form Header */}
              <View style={styles.formHeader}>
                <Icon name="style" size={48} color={COLORS.blue043142} />
                <Text
                  variant="semibold18"
                  color={COLORS.blue043142}
                  style={styles.formTitle}>
                  {isEdit
                    ? 'Edit Your Flashcard Deck'
                    : 'Create Your Flashcard Deck'}
                </Text>
                <Text
                  variant="medium14"
                  color={COLORS.grey777777}
                  style={styles.formDescription}>
                  {isEdit
                    ? 'Update your deck details and settings'
                    : 'Start by giving your deck a name and selecting the subject'}
                </Text>
              </View>

              {/* Deck Title */}
              <View style={styles.inputSection}>
                <Text
                  variant="semibold14"
                  color={COLORS.blue043142}
                  style={styles.label}>
                  Deck Title *
                </Text>
                <TextInput
                  ref={titleRef}
                  style={[styles.textInput, errors.title && styles.inputError]}
                  placeholder="Enter deck title (e.g., React.js Fundamentals)"
                  placeholderTextColor={COLORS.grey999999}
                  value={formData.title}
                  onChangeText={value => handleInputChange('title', value)}
                  maxLength={100}
                  returnKeyType="next"
                  onSubmitEditing={() => descriptionRef.current?.focus()}
                />
                {errors.title && (
                  <Text
                    variant="medium12"
                    color={COLORS.redEA4335}
                    style={styles.errorText}>
                    {errors.title}
                  </Text>
                )}
                <Text
                  variant="regular12"
                  color={COLORS.grey777777}
                  style={styles.helperText}>
                  {formData.title.length}/100 characters
                </Text>
              </View>

              {/* Description */}
              <View style={styles.inputSection}>
                <Text
                  variant="semibold14"
                  color={COLORS.blue043142}
                  style={styles.label}>
                  Description (Optional)
                </Text>
                <TextInput
                  ref={descriptionRef}
                  style={[
                    styles.textArea,
                    errors.description && styles.inputError,
                  ]}
                  placeholder="Describe what this deck covers..."
                  placeholderTextColor={COLORS.grey999999}
                  value={formData.description}
                  onChangeText={value =>
                    handleInputChange('description', value)
                  }
                  maxLength={500}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {errors.description && (
                  <Text
                    variant="medium12"
                    color={COLORS.redEA4335}
                    style={styles.errorText}>
                    {errors.description}
                  </Text>
                )}
                <Text
                  variant="regular12"
                  color={COLORS.grey777777}
                  style={styles.helperText}>
                  {formData.description.length}/500 characters
                </Text>
              </View>

              {/* Subject Selection */}
              <View style={styles.inputSection}>
                <Text
                  variant="semibold14"
                  color={COLORS.blue043142}
                  style={styles.label}>
                  Subject *
                </Text>
                <Text
                  variant="medium12"
                  color={COLORS.grey777777}
                  style={styles.labelDescription}>
                  Choose the subject that best fits your deck
                </Text>
                {renderSubjectGrid()}
                {errors.subject && (
                  <Text
                    variant="medium12"
                    color={COLORS.redEA4335}
                    style={styles.errorText}>
                    {errors.subject}
                  </Text>
                )}
              </View>

              {/* Tags */}
              {renderTagsSection()}

              {/* Privacy Settings */}
              <View style={styles.inputSection}>
                <Text
                  variant="semibold14"
                  color={COLORS.blue043142}
                  style={styles.label}>
                  Privacy Settings
                </Text>
                <View style={styles.privacyOption}>
                  <View style={styles.privacyContent}>
                    <Icon
                      name={formData.isPublic ? 'public' : 'lock'}
                      size={20}
                      color={COLORS.blue043142}
                    />
                    <View style={styles.privacyText}>
                      <Text variant="medium14" color={COLORS.blue043142}>
                        {formData.isPublic ? 'Public Deck' : 'Private Deck'}
                      </Text>
                      <Text variant="medium12" color={COLORS.grey777777}>
                        {formData.isPublic
                          ? 'Others can discover and study your deck'
                          : 'Only you can access this deck'}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={formData.isPublic}
                    onValueChange={value =>
                      handleInputChange('isPublic', value)
                    }
                    trackColor={{
                      false: COLORS.greyE5E5E5,
                      true: COLORS.blue043142 + '30',
                    }}
                    thumbColor={
                      formData.isPublic ? COLORS.blue043142 : COLORS.whiteFFFFFF
                    }
                  />
                </View>
              </View>

              {/* Bottom Spacing */}
              <View style={styles.bottomSpacing} />
            </ScrollView>

            {/* Create/Update Button */}
            <View style={styles.buttonContainer}>
              <Button
                text={
                  loading
                    ? isEdit
                      ? 'Updating Deck...'
                      : 'Creating Deck...'
                    : isEdit
                    ? 'Update Deck'
                    : 'Create Deck'
                }
                onPress={handleSubmit}
                disabled={loading}
                style={styles.createButton}
                icon={loading ? null : 'style'}
                iconColor={COLORS.whiteFFFFFF}
              />
              {loading && (
                <ActivityIndicator
                  size="small"
                  color={COLORS.whiteFFFFFF}
                  style={styles.loadingIndicator}
                />
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  keyboardView: {
    flex: 1,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: nw(20),
  },
  formHeader: {
    alignItems: 'center',
    paddingVertical: nh(30),
  },
  formTitle: {
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  formDescription: {
    textAlign: 'center',
    paddingHorizontal: nw(20),
  },
  inputSection: {
    marginBottom: nh(24),
  },
  label: {
    marginBottom: nh(8),
  },
  labelDescription: {
    marginBottom: nh(12),
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    borderRadius: nw(12),
    paddingHorizontal: nw(16),
    paddingVertical: nh(14),
    fontSize: 16,
    color: COLORS.blue043142,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    borderRadius: nw(12),
    paddingHorizontal: nw(16),
    paddingVertical: nh(14),
    fontSize: 16,
    color: COLORS.blue043142,
    backgroundColor: COLORS.whiteFFFFFF,
    minHeight: nh(100),
  },
  inputError: {
    borderColor: COLORS.redEA4335,
  },
  errorText: {
    marginTop: nh(6),
  },
  helperText: {
    marginTop: nh(4),
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: nh(8),
  },
  subjectCard: {
    width: (DEVICE_WIDTH - nw(80)) / 3,
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: nw(12),
    padding: nw(12),
    alignItems: 'center',
    marginBottom: nh(12),
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subjectCardSelected: {
    backgroundColor: COLORS.blue043142,
    borderColor: COLORS.yellowF5BE00,
  },
  subjectLabel: {
    marginTop: nh(8),
    textAlign: 'center',
  },
  tagsSection: {
    marginBottom: nh(24),
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(12),
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    borderRadius: nw(12),
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    fontSize: 14,
    color: COLORS.blue043142,
    backgroundColor: COLORS.whiteFFFFFF,
    marginRight: nw(12),
  },
  addTagButton: {
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(12),
    padding: nw(12),
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTagButtonDisabled: {
    backgroundColor: COLORS.greyBBBBBB,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue043142 + '15',
    borderRadius: nw(20),
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    marginRight: nw(8),
    marginBottom: nh(8),
  },
  removeTagButton: {
    marginLeft: nw(8),
    padding: nw(2),
  },
  privacyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: nw(12),
    padding: nw(16),
  },
  privacyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  privacyText: {
    marginLeft: nw(12),
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: nw(20),
    paddingVertical: nh(20),
    backgroundColor: COLORS.whiteFFFFFF,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingIndicator: {
    position: 'absolute',
    right: nw(40),
    top: nh(35),
  },
  bottomSpacing: {
    height: nh(20),
  },
});

export default CreateDeck;
