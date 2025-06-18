import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Keyboard,
} from 'react-native';
import {launchImageLibrary} from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import Slider from '@react-native-community/slider';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';
import {useSelector} from 'react-redux';

// Text component
const Text = ({children, style, variant, color, ...props}) => {
  let fontWeight = 'normal';
  let fontSize = 14;
  if (variant) {
    if (variant.includes('semibold')) fontWeight = '600';
    if (variant.includes('bold')) fontWeight = 'bold';
    if (variant.includes('10')) fontSize = 10;
    if (variant.includes('12')) fontSize = 12;
    if (variant.includes('14')) fontSize = 14;
    if (variant.includes('16')) fontSize = 16;
    if (variant.includes('18')) fontSize = 18;
    if (variant.includes('20')) fontSize = 20;
    if (variant.includes('24')) fontSize = 24;
  }
  return (
    <RNText style={[{fontSize, fontWeight, color}, style]} {...props}>
      {children}
    </RNText>
  );
};
import {Text as RNText} from 'react-native';

// Header component
const Header = ({title, onBack}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={COLORS.whiteFFFFFF} />
    </TouchableOpacity>
    <Text variant="bold18" color={COLORS.whiteFFFFFF}>
      {title}
    </Text>
    <View style={{width: 40}} />
  </View>
);

// Custom Input Component
const CustomInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  maxLength,
  error,
  keyboardType,
  editable = true,
}) => (
  <View style={styles.inputContainer}>
    <Text
      variant="semibold14"
      color={COLORS.blue043142}
      style={styles.inputLabel}>
      {label}
    </Text>
    <View style={[styles.inputWrapper, error && styles.inputWrapperError]}>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          !editable && styles.disabledInput,
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.grey999999}
        multiline={multiline}
        maxLength={maxLength}
        keyboardType={keyboardType}
        editable={editable}
      />
      {maxLength && (
        <Text
          variant="regular12"
          color={COLORS.grey999999}
          style={styles.charCount}>
          {value.length}/{maxLength}
        </Text>
      )}
    </View>
    {error && (
      <Text
        variant="regular12"
        color={COLORS.redError}
        style={styles.errorText}>
        {error}
      </Text>
    )}
  </View>
);

// Segmented Control Component
const SegmentedControl = ({options, selectedValue, onValueChange, label}) => (
  <View style={styles.segmentedContainer}>
    <Text
      variant="semibold14"
      color={COLORS.blue043142}
      style={styles.inputLabel}>
      {label}
    </Text>
    <View style={styles.segmentedWrapper}>
      {options.map(option => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.segmentButton,
            selectedValue === option.value && styles.segmentButtonActive,
          ]}
          onPress={() => onValueChange(option.value)}>
          <Text
            variant={
              selectedValue === option.value ? 'semibold14' : 'regular14'
            }
            color={
              selectedValue === option.value
                ? COLORS.whiteFFFFFF
                : COLORS.blue043142
            }>
            {option.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
    {options.find(opt => opt.value === selectedValue)?.helperText && (
      <Text
        variant="regular12"
        color={COLORS.grey999999}
        style={styles.helperText}>
        {options.find(opt => opt.value === selectedValue).helperText}
      </Text>
    )}
  </View>
);

// Topic Tag Component
const TopicTag = ({topic, onRemove}) => (
  <View style={styles.topicTag}>
    <Text variant="regular12" color={COLORS.blue043142}>
      {topic}
    </Text>
    <TouchableOpacity onPress={onRemove} style={styles.removeTagButton}>
      <Ionicons name="close-circle" size={16} color={COLORS.blue043142} />
    </TouchableOpacity>
  </View>
);

import {createUserQuizApi} from '../../services/apiService';
import Routes from '../../helper/routes';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Helper for responsive scaling
const {width: DEVICE_WIDTH, height: DEVICE_HEIGHT} = Dimensions.get('window');
const nw = percentage => (DEVICE_WIDTH * percentage) / 100;
const nh = percentage => (DEVICE_HEIGHT * percentage) / 100;

// Colors
const COLORS = {
  yellowF5BE00: '#F5BE00',
  blue043142: '#043142',
  whiteFFFFFF: '#FFFFFF',
  grey999999: '#999999',
  greyEEEEEE: '#EEEEEE',
  greyF7F7F7: '#F7F7F7',
  greenSuccess: '#28A745',
  redError: '#DC3545',
  lightBlueE6F0FF: '#E6F0FF',
  darkGrey333333: '#333333',
  purpleCommunity: '#8B5CF6',
  purpleLightBg: '#F3E8FF',
};

const CreateQuizScreen = ({navigation}) => {
  const userdata = useSelector(state => state?.userData);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [topics, setTopics] = useState([]);
  const [currentTopic, setCurrentTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [visibility, setVisibility] = useState('public');
  const [startTime, setStartTime] = useState(
    new Date(Date.now() + 48 * 61 * 60 * 1000), // 48 hours from now
  );
  const [endTime, setEndTime] = useState(
    new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours from now
  );
  const [timePerQuestion, setTimePerQuestion] = useState(30);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Error State
  const [errors, setErrors] = useState({});

  // Refs
  const scrollViewRef = useRef(null);

  // Validation Functions
  const validateTitle = value => {
    if (!value || value.trim().length < 3) {
      return 'Title must be at least 3 characters';
    }
    if (value.length > 100) {
      return 'Title must not exceed 100 characters';
    }
    return null;
  };

  const validateDescription = value => {
    if (!value || value.trim().length < 10) {
      return 'Description must be at least 10 characters';
    }
    if (value.length > 500) {
      return 'Description must not exceed 500 characters';
    }
    return null;
  };

  const validateTopics = topicsList => {
    if (!topicsList || topicsList.length === 0) {
      return 'At least one topic is required';
    }
    if (topicsList.length > 5) {
      return 'Maximum 5 topics allowed';
    }
    return null;
  };

  const validateDates = () => {
    const now = new Date();
    const minStartTime = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    if (startTime < minStartTime) {
      return {
        startTime: 'Quiz must be scheduled at least 48 hours in advance',
      };
    }

    if (endTime <= startTime) {
      return {
        endTime: 'End time must be after start time',
      };
    }

    // Check if duration is at least 1 hour
    const duration = endTime - startTime;
    if (duration < 60 * 60 * 1000) {
      return {
        endTime: 'Quiz duration must be at least 1 hour',
      };
    }

    return null;
  };

  // Real-time validation
  useEffect(() => {
    const newErrors = {};

    if (title && validateTitle(title)) {
      newErrors.title = validateTitle(title);
    }

    if (description && validateDescription(description)) {
      newErrors.description = validateDescription(description);
    }

    const dateErrors = validateDates();
    if (dateErrors) {
      Object.assign(newErrors, dateErrors);
    }

    setErrors(newErrors);
  }, [title, description, startTime, endTime]);

  // Handle Image Picker
  const handleImagePicker = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };

    launchImageLibrary(options, response => {
      if (response.didCancel || response.error) {
        return;
      }

      if (response.assets && response.assets[0]) {
        setCoverImage(response.assets[0]);
      }
    });
  };

  // Handle Add Topic
  const handleAddTopic = () => {
    const trimmedTopic = currentTopic.trim();

    if (!trimmedTopic) {
      return;
    }

    if (trimmedTopic.length > 50) {
      Alert.alert('Error', 'Topic name must not exceed 50 characters');
      return;
    }

    if (topics.length >= 5) {
      Alert.alert('Error', 'Maximum 5 topics allowed');
      return;
    }

    if (topics.find(t => t.toLowerCase() === trimmedTopic.toLowerCase())) {
      Alert.alert('Error', 'This topic already exists');
      return;
    }

    setTopics([...topics, trimmedTopic]);
    setCurrentTopic('');
  };

  // Handle Remove Topic
  const handleRemoveTopic = index => {
    setTopics(topics.filter((_, i) => i !== index));
  };

  // Handle Date Change
  const handleStartDateChange = (event, selectedDate) => {
    setShowStartPicker(false);
    if (selectedDate) {
      setStartTime(selectedDate);

      // Auto-adjust end time if needed
      if (endTime <= selectedDate) {
        setEndTime(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };

  // Final Validation
  const performFinalValidation = () => {
    const validationErrors = {};

    const titleError = validateTitle(title);
    if (titleError) validationErrors.title = titleError;

    const descError = validateDescription(description);
    if (descError) validationErrors.description = descError;

    const topicsError = validateTopics(topics);
    if (topicsError) validationErrors.topics = topicsError;

    const dateErrors = validateDates();
    if (dateErrors) {
      Object.assign(validationErrors, dateErrors);
    }

    return validationErrors;
  };

  // Handle Submit
  const handleSubmit = async () => {
    Keyboard.dismiss();

    // Perform validation
    const validationErrors = performFinalValidation();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);

      // Scroll to first error
      scrollViewRef.current?.scrollTo({y: 0, animated: true});

      Alert.alert(
        'Validation Error',
        'Please fix all errors before proceeding',
        [{text: 'OK'}],
      );
      return;
    }

    // Prepare quiz data
    const quizData = {
      title: title.trim(),
      description: description.trim(),
      topics: topics.map(t => t.toLowerCase()),
      difficulty,
      visibility,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      timePerQuestion,
      coverImage: coverImage?.uri || null,
    };

    try {
      setIsLoading(true);

      const response = await createUserQuizApi(quizData);

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Quiz draft created successfully! Now add questions to complete your quiz.',
          [
            {
              text: 'Add Questions',
              onPress: () => {
                navigation.replace(Routes.EditQuiz, {
                  quizId: response.data.data.quizId,
                  isNewQuiz: true,
                });
              },
            },
          ],
          {cancelable: false},
        );
      }
    } catch (error) {
      console.error('Error creating quiz:', error);

      const errorMessage =
        error.response?.data?.message ||
        'Failed to create quiz. Please try again.';

      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      title.trim().length >= 3 &&
      description.trim().length >= 10 &&
      topics.length > 0 &&
      Object.keys(errors).length === 0
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue043142} />

      <LinearGradient
        colors={[COLORS.blue043142, '#02293A']}
        style={styles.headerGradient}>
        <Header title="Create a New Quiz" onBack={() => navigation.goBack()} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={{flex: 1}}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Title Input */}
          <CustomInput
            label="Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter quiz title"
            maxLength={100}
            error={errors.title}
          />

          {/* Description Input */}
          <CustomInput
            label="Description *"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what this quiz is about"
            multiline
            maxLength={500}
            error={errors.description}
          />

          {/* Cover Image */}
          <View style={styles.imageSection}>
            <Text
              variant="semibold14"
              color={COLORS.blue043142}
              style={styles.inputLabel}>
              Cover Image
            </Text>
            <TouchableOpacity
              style={styles.imageUploadButton}
              onPress={handleImagePicker}>
              {coverImage ? (
                <Image
                  source={{uri: coverImage.uri}}
                  style={styles.uploadedImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <MaterialIcons
                    name="add-photo-alternate"
                    size={48}
                    color={COLORS.grey999999}
                  />
                  <Text
                    variant="regular14"
                    color={COLORS.grey999999}
                    style={{marginTop: 8}}>
                    Upload Image
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Topics */}
          <View style={styles.topicsSection}>
            <Text
              variant="semibold14"
              color={COLORS.blue043142}
              style={styles.inputLabel}>
              Topics * (Max 5)
            </Text>
            <View style={styles.topicInputWrapper}>
              <TextInput
                style={styles.topicInput}
                value={currentTopic}
                onChangeText={setCurrentTopic}
                placeholder="Enter a topic"
                placeholderTextColor={COLORS.grey999999}
                maxLength={50}
                onSubmitEditing={handleAddTopic}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[
                  styles.addTopicButton,
                  (!currentTopic.trim() || topics.length >= 5) &&
                    styles.addTopicButtonDisabled,
                ]}
                onPress={handleAddTopic}
                disabled={!currentTopic.trim() || topics.length >= 5}>
                <Text
                  variant="semibold14"
                  color={
                    !currentTopic.trim() || topics.length >= 5
                      ? COLORS.grey999999
                      : COLORS.whiteFFFFFF
                  }>
                  Add
                </Text>
              </TouchableOpacity>
            </View>

            {topics.length > 0 && (
              <View style={styles.topicsList}>
                {topics.map((topic, index) => (
                  <TopicTag
                    key={index}
                    topic={topic}
                    onRemove={() => handleRemoveTopic(index)}
                  />
                ))}
              </View>
            )}

            {errors.topics && (
              <Text
                variant="regular12"
                color={COLORS.redError}
                style={styles.errorText}>
                {errors.topics}
              </Text>
            )}
          </View>

          {/* Difficulty */}
          <SegmentedControl
            label="Difficulty *"
            options={[
              {value: 'easy', label: 'Easy'},
              {value: 'medium', label: 'Medium'},
              {value: 'hard', label: 'Hard'},
            ]}
            selectedValue={difficulty}
            onValueChange={setDifficulty}
          />

          {/* Visibility */}
          <SegmentedControl
            label="Visibility *"
            options={[
              {
                value: 'public',
                label: 'Public',
                helperText: 'Anyone can find and take this quiz',
              },
              {
                value: 'private',
                label: 'Private',
                helperText: 'Only users you approve can take this quiz',
              },
            ]}
            selectedValue={visibility}
            onValueChange={setVisibility}
          />

          {/* Schedule Section */}
          <View style={styles.scheduleSection}>
            <Text
              variant="semibold16"
              color={COLORS.blue043142}
              style={styles.sectionTitle}>
              Schedule
            </Text>

            {/* Start Time */}
            <View style={styles.datePickerContainer}>
              <Text
                variant="semibold14"
                color={COLORS.blue043142}
                style={styles.inputLabel}>
                Start Time *
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  errors.startTime && styles.dateButtonError,
                ]}
                onPress={() => setShowStartPicker(true)}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.blue043142}
                />
                <Text
                  variant="regular14"
                  color={COLORS.blue043142}
                  style={{marginLeft: 8}}>
                  {moment(startTime).format('MMM DD, YYYY - hh:mm A')}
                </Text>
              </TouchableOpacity>
              {errors.startTime && (
                <Text
                  variant="regular12"
                  color={COLORS.redError}
                  style={styles.errorText}>
                  {errors.startTime}
                </Text>
              )}
            </View>

            {/* End Time */}
            <View style={styles.datePickerContainer}>
              <Text
                variant="semibold14"
                color={COLORS.blue043142}
                style={styles.inputLabel}>
                End Time *
              </Text>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  errors.endTime && styles.dateButtonError,
                ]}
                onPress={() => setShowEndPicker(true)}>
                <Ionicons
                  name="calendar-outline"
                  size={20}
                  color={COLORS.blue043142}
                />
                <Text
                  variant="regular14"
                  color={COLORS.blue043142}
                  style={{marginLeft: 8}}>
                  {moment(endTime).format('MMM DD, YYYY - hh:mm A')}
                </Text>
              </TouchableOpacity>
              {errors.endTime && (
                <Text
                  variant="regular12"
                  color={COLORS.redError}
                  style={styles.errorText}>
                  {errors.endTime}
                </Text>
              )}
            </View>

            {/* Quiz Duration Display */}
            <View style={styles.durationInfo}>
              <Ionicons
                name="time-outline"
                size={16}
                color={COLORS.grey999999}
              />
              <Text
                variant="regular12"
                color={COLORS.grey999999}
                style={{marginLeft: 6}}>
                Quiz Duration: {moment.duration(endTime - startTime).humanize()}
              </Text>
            </View>
          </View>

          {/* Time Per Question */}
          <View style={styles.sliderSection}>
            <Text
              variant="semibold14"
              color={COLORS.blue043142}
              style={styles.inputLabel}>
              Time Per Question *
            </Text>
            <View style={styles.sliderContainer}>
              <Text variant="regular14" color={COLORS.blue043142}>
                10s
              </Text>
              <Slider
                style={styles.slider}
                minimumValue={10}
                maximumValue={60}
                step={5}
                value={timePerQuestion}
                onValueChange={setTimePerQuestion}
                minimumTrackTintColor={COLORS.yellowF5BE00}
                maximumTrackTintColor={COLORS.greyEEEEEE}
                thumbTintColor={COLORS.yellowF5BE00}
              />
              <Text variant="regular14" color={COLORS.blue043142}>
                60s
              </Text>
            </View>
            <Text
              variant="semibold16"
              color={COLORS.yellowF5BE00}
              style={styles.sliderValue}>
              {timePerQuestion} seconds
            </Text>
          </View>

          {/* Bottom Spacing */}
          <View style={{height: nh(10)}} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Submit Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid() || isLoading) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid() || isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
          ) : (
            <>
              <Text variant="semibold16" color={COLORS.whiteFFFFFF}>
                Save and Add Questions
              </Text>
              <Ionicons
                name="arrow-forward"
                size={20}
                color={COLORS.whiteFFFFFF}
                style={{marginLeft: 8}}
              />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={startTime}
          mode="datetime"
          display="default"
          onChange={handleStartDateChange}
          minimumDate={new Date(Date.now() + 48 * 60 * 60 * 1000)}
        />
      )}

      {showEndPicker && (
        <DateTimePicker
          value={endTime}
          mode="datetime"
          display="default"
          onChange={handleEndDateChange}
          minimumDate={new Date(startTime.getTime() + 60 * 60 * 1000)}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(4),
    paddingVertical: nh(2),
  },
  backButton: {
    padding: nw(2),
    marginLeft: -nw(2),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: nw(4),
    paddingTop: nh(3),
  },
  inputContainer: {
    marginBottom: nh(2.5),
  },
  inputLabel: {
    marginBottom: nh(0.8),
  },
  inputWrapper: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  inputWrapperError: {
    borderColor: COLORS.redError,
  },
  input: {
    paddingHorizontal: nw(3.5),
    paddingVertical: nh(1.5),
    fontSize: 14,
    color: COLORS.blue043142,
  },
  multilineInput: {
    minHeight: nh(10),
    textAlignVertical: 'top',
  },
  disabledInput: {
    backgroundColor: COLORS.greyF7F7F7,
    color: COLORS.grey999999,
  },
  charCount: {
    position: 'absolute',
    bottom: nh(0.5),
    right: nw(2),
  },
  errorText: {
    marginTop: nh(0.5),
  },
  helperText: {
    marginTop: nh(0.5),
  },
  imageSection: {
    marginBottom: nh(2.5),
  },
  imageUploadButton: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.greyEEEEEE,
    borderStyle: 'dashed',
    height: nh(20),
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicsSection: {
    marginBottom: nh(2.5),
  },
  topicInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  topicInput: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    paddingHorizontal: nw(3.5),
    paddingVertical: nh(1.5),
    fontSize: 14,
    color: COLORS.blue043142,
    marginRight: nw(2),
  },
  addTopicButton: {
    backgroundColor: COLORS.yellowF5BE00,
    paddingHorizontal: nw(5),
    paddingVertical: nh(1.5),
    borderRadius: 8,
  },
  addTopicButtonDisabled: {
    backgroundColor: COLORS.greyEEEEEE,
  },
  topicsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: nh(1.5),
  },
  topicTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlueE6F0FF,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 20,
    marginRight: nw(2),
    marginBottom: nh(1),
  },
  removeTagButton: {
    marginLeft: nw(1.5),
  },
  segmentedContainer: {
    marginBottom: nh(2.5),
  },
  segmentedWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: nh(1.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: COLORS.blue043142,
  },
  scheduleSection: {
    marginBottom: nh(2.5),
  },
  sectionTitle: {
    marginBottom: nh(1.5),
  },
  datePickerContainer: {
    marginBottom: nh(2),
  },
  dateButton: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    paddingHorizontal: nw(3.5),
    paddingVertical: nh(1.5),
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateButtonError: {
    borderColor: COLORS.redError,
  },
  durationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(2),
    paddingVertical: nh(1),
    backgroundColor: COLORS.lightBlueE6F0FF,
    borderRadius: 8,
  },
  sliderSection: {
    marginBottom: nh(2.5),
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(1),
  },
  slider: {
    flex: 1,
    marginHorizontal: nw(3),
  },
  sliderValue: {
    textAlign: 'center',
    marginTop: nh(1),
  },
  bottomContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(4),
    paddingVertical: nh(2),
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButton: {
    backgroundColor: COLORS.yellowF5BE00,
    paddingVertical: nh(2),
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.grey999999,
  },
});

export default CreateQuizScreen;
