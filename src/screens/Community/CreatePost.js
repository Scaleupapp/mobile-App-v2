// src/screens/Community/CreatePost.js
/**
 * Create Post Screen - Rich Content Creation Platform
 * Instagram Stories + Discord Message + Twitter Compose + Reddit Submit Hybrid
 * Production-grade implementation with all 6 API integrations
 * Complete single-file implementation with comprehensive logging
 */

import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Platform,
  TextInput,
  Alert,
  Image,
  ScrollView,
  Pressable,
  Modal,
  KeyboardAvoidingView,
  Keyboard,
  PermissionsAndroid,
  Switch,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  Layout,
  interpolate,
  runOnJS,
  SlideInRight,
  SlideOutLeft,
  ZoomIn,
  BounceIn,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DatePicker from 'react-native-date-picker';

import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {
  createCommunityPostApi,
  uploadCommunityPostMediaApi,
  createCommunityPollApi,
  createCommunityEventApi,
  createCommunityAnnouncementApi,
  scheduleCommunityPostApi,
} from '../../services/apiService';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import mixpanel from '../../helper/mixpanelClient';
import Routes from '../../helper/routes';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// ===============================
// POST CREATION COLOR SYSTEM
// ===============================
const POST_COLORS = {
  // Primary Brand Colors
  primary: '#FF4500', // Reddit Orange
  primaryLight: '#FF5722',
  primaryDark: '#E64100',
  
  // Accent Colors
  accent: '#5865F2', // Discord Blurple
  accentLight: '#7289DA',
  accentDark: '#4752C4',
  
  // Post Type Colors
  text: '#4ECDC4',
  image: '#FFB6C1',
  poll: '#98D8C8',
  event: '#F7DC6F',
  announcement: '#F1948A',
  
  // UI Elements
  background: '#0F0F1A',
  surface: '#1A1A2E',
  elevated: '#252538',
  overlay: '#2E2E3E',
  border: '#3A3A4A',
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0C0',
  textTertiary: '#808090',
  textMuted: '#606070',
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FFC107',
  error: '#F44336',
  info: '#2196F3',
  
  // Special Effects
  gradient1: ['#667eea', '#764ba2'],
  gradient2: ['#f093fb', '#f5576c'],
  gradient3: ['#4facfe', '#00f2fe'],
};

// ===============================
// CONSTANTS
// ===============================
const POST_TYPES = [
  {
    id: 'text',
    name: 'Text',
    icon: 'text',
    iconType: 'Feather',
    color: POST_COLORS.text,
    description: 'Share your thoughts'
  },
  {
    id: 'image',
    name: 'Image',
    icon: 'image',
    iconType: 'Feather',
    color: POST_COLORS.image,
    description: 'Upload photos'
  },
  {
    id: 'poll',
    name: 'Poll',
    icon: 'poll',
    iconType: 'MaterialIcons',
    color: POST_COLORS.poll,
    description: 'Create a poll'
  },
  {
    id: 'event',
    name: 'Event',
    icon: 'calendar',
    iconType: 'Feather',
    color: POST_COLORS.event,
    description: 'Host an event'
  },
  {
    id: 'announcement',
    name: 'Announcement',
    icon: 'megaphone',
    iconType: 'MaterialCommunityIcons',
    color: POST_COLORS.announcement,
    description: 'Important update'
  },
];

const CHARACTER_LIMITS = {
  title: 300,
  content: 10000,
  pollQuestion: 500,
  pollOption: 200,
  eventTitle: 200,
  eventDescription: 2000,
};

// ===============================
// API LOGGER UTILITY
// ===============================
const CreatePostAPILogger = {
  logRequest: (apiName, data, files = null) => {
    console.log('\n📤 ==================== API REQUEST ====================');
    console.log(`🎯 API: ${apiName}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log('📦 Payload:', JSON.stringify(data, null, 2));
    if (files) {
      console.log('📎 Files:', files);
    }
    console.log('========================================================\n');
  },
  
  logResponse: (apiName, response) => {
    console.log('\n📥 ==================== API RESPONSE ====================');
    console.log(`✅ API: ${apiName}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log('📦 Response:', JSON.stringify(response?.data, null, 2));
    console.log('=========================================================\n');
  },
  
  logError: (apiName, error) => {
    console.log('\n❌ ==================== API ERROR ====================');
    console.log(`🚨 API: ${apiName}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log('💥 Error:', error?.response?.data || error?.message);
    console.log('======================================================\n');
  },
  
  logDraft: (action, data) => {
    console.log('\n💾 ==================== DRAFT ACTION ====================');
    console.log(`📝 Action: ${action}`);
    console.log(`⏰ Time: ${new Date().toISOString()}`);
    console.log('📦 Data:', JSON.stringify(data, null, 2));
    console.log('=========================================================\n');
  }
};

// ===============================
// POST TYPE SELECTOR COMPONENT
// ===============================
const PostTypeSelector = ({selectedType, onSelectType}) => {
  console.log('🎨 Rendering PostTypeSelector, selected:', selectedType);
  
  return (
    <View style={styles.postTypeContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.postTypeScroll}
      >
        {POST_TYPES.map((type) => {
          const isSelected = selectedType === type.id;
          const IconComponent = 
            type.iconType === 'MaterialIcons' ? MaterialIcons :
            type.iconType === 'MaterialCommunityIcons' ? MaterialCommunityIcons :
            type.iconType === 'FontAwesome5' ? FontAwesome5 :
            Feather;
          
          return (
            <Animated.View
              key={type.id}
              entering={FadeInUp.delay(POST_TYPES.indexOf(type) * 50)}
            >
              <TouchableOpacity
                style={[
                  styles.postTypeButton,
                  isSelected && {
                    backgroundColor: type.color + '20',
                    borderColor: type.color,
                  }
                ]}
                onPress={() => {
                  console.log(`📌 Post type selected: ${type.id}`);
                  onSelectType(type.id);
                }}
                activeOpacity={0.7}
              >
                <IconComponent
                  name={type.icon}
                  size={24}
                  color={isSelected ? type.color : POST_COLORS.textSecondary}
                />
                <Text style={[
                  styles.postTypeText,
                  isSelected && {color: type.color}
                ]}>
                  {type.name}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ===============================
// RICH TEXT EDITOR COMPONENT
// ===============================
const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  maxLength,
  showToolbar = true,
  autoFocus = false
}) => {
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const inputRef = useRef(null);
  
  const remainingChars = maxLength - (value?.length || 0);
  const progress = (value?.length || 0) / maxLength;
  
  console.log(`📝 RichTextEditor: ${value?.length || 0}/${maxLength} chars`);
  
  // Extract mentions and hashtags
  const processText = useCallback((text) => {
    const mentions = text.match(/@\w+/g) || [];
    const hashtags = text.match(/#\w+/g) || [];
    
    if (mentions.length > 0) {
      console.log('👥 Mentions found:', mentions);
    }
    if (hashtags.length > 0) {
      console.log('#️⃣ Hashtags found:', hashtags);
    }
    
    return { mentions, hashtags };
  }, []);
  
  const handleTextChange = (text) => {
    processText(text);
    onChange(text);
  };
  
  return (
    <View style={styles.richTextContainer}>
      {showToolbar && (
        <Animated.View 
          style={styles.richTextToolbar}
          entering={FadeInDown}
        >
          <TouchableOpacity
            style={[styles.toolbarButton, isBold && styles.toolbarButtonActive]}
            onPress={() => setIsBold(!isBold)}
          >
            <MaterialIcons name="format-bold" size={20} color={POST_COLORS.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.toolbarButton, isItalic && styles.toolbarButtonActive]}
            onPress={() => setIsItalic(!isItalic)}
          >
            <MaterialIcons name="format-italic" size={20} color={POST_COLORS.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton}>
            <MaterialIcons name="format-list-bulleted" size={20} color={POST_COLORS.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton}>
            <MaterialIcons name="link" size={20} color={POST_COLORS.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.toolbarButton}
            onPress={() => setShowMentions(!showMentions)}
          >
            <MaterialIcons name="alternate-email" size={20} color={POST_COLORS.textPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.toolbarButton}>
            <MaterialIcons name="tag" size={20} color={POST_COLORS.textPrimary} />
          </TouchableOpacity>
        </Animated.View>
      )}
      
      <TextInput
        ref={inputRef}
        style={[
          styles.richTextInput,
          isBold && {fontWeight: 'bold'},
          isItalic && {fontStyle: 'italic'},
        ]}
        value={value}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor={POST_COLORS.textMuted}
        multiline
        autoFocus={autoFocus}
        maxLength={maxLength}
      />
      
      {maxLength && (
        <View style={styles.characterCount}>
          <View style={styles.characterProgress}>
            <View 
              style={[
                styles.characterProgressBar,
                {
                  width: `${Math.min(100, progress * 100)}%`,
                  backgroundColor: progress > 0.9 ? POST_COLORS.warning : POST_COLORS.success
                }
              ]}
            />
          </View>
          <Text style={[
            styles.characterText,
            progress > 0.9 && {color: POST_COLORS.warning}
          ]}>
            {remainingChars}
          </Text>
        </View>
      )}
    </View>
  );
};

// ===============================
// MEDIA UPLOAD COMPONENT
// ===============================
const MediaUpload = ({media, onAddMedia, onRemoveMedia, maxFiles = 10}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  
  console.log(`📸 MediaUpload: ${media.length}/${maxFiles} files`);
  
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'App needs camera permission to take photos',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };
  
  const handleImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose from where you want to select an image',
      [
        {text: 'Camera', onPress: handleCamera},
        {text: 'Gallery', onPress: handleGallery},
        {text: 'Cancel', style: 'cancel'},
      ],
    );
  };
  
  const handleCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;
    
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
    };
    
    launchCamera(options, handleImageResponse);
  };
  
  const handleGallery = () => {
    const options = {
      mediaType: 'photo',
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      selectionLimit: maxFiles - media.length,
    };
    
    launchImageLibrary(options, handleImageResponse);
  };
  
  const handleImageResponse = (response) => {
    console.log('📸 Image picker response:', response);
    
    if (response.didCancel || response.error) {
      console.log('❌ Image picker cancelled or error');
      return;
    }
    
    if (response.assets) {
      const newMedia = response.assets.map(asset => ({
        uri: asset.uri,
        type: asset.type,
        name: asset.fileName || `image_${Date.now()}.jpg`,
        size: asset.fileSize,
        width: asset.width,
        height: asset.height,
        isImage: true,
      }));
      
      console.log(`✅ Added ${newMedia.length} images`);
      onAddMedia(newMedia);
    }
  };
  
  const handleDocumentPicker = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.doc,
          DocumentPicker.types.docx,
          DocumentPicker.types.xls,
          DocumentPicker.types.xlsx,
          DocumentPicker.types.ppt,
          DocumentPicker.types.pptx,
        ],
        allowMultiSelection: true,
      });
      
      const newMedia = results.map(doc => ({
        uri: doc.uri,
        type: doc.type,
        name: doc.name,
        size: doc.size,
        isDocument: true,
      }));
      
      console.log(`📄 Added ${newMedia.length} documents`);
      onAddMedia(newMedia);
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('❌ Document picker cancelled');
      } else {
        console.error('Document picker error:', err);
      }
    }
  };
  
  return (
    <View style={styles.mediaContainer}>
      <View style={styles.mediaHeader}>
        <Text style={styles.mediaTitle}>Media & Files</Text>
        <Text style={styles.mediaCount}>
          {media.length}/{maxFiles}
        </Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.mediaScroll}
      >
        {media.map((item, index) => (
          <Animated.View
            key={index}
            entering={ZoomIn}
            style={styles.mediaItem}
          >
            {item.isImage ? (
              <Image source={{uri: item.uri}} style={styles.mediaImage} />
            ) : (
              <View style={styles.documentPreview}>
                <MaterialIcons name="insert-drive-file" size={32} color={POST_COLORS.primary} />
                <Text style={styles.documentName} numberOfLines={2}>
                  {item.name}
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={styles.mediaRemove}
              onPress={() => {
                console.log(`🗑️ Removing media at index ${index}`);
                onRemoveMedia(index);
              }}
            >
              <Icon name="close-circle" size={24} color={POST_COLORS.error} />
            </TouchableOpacity>
            
            {uploadProgress[index] !== undefined && (
              <View style={styles.uploadProgressOverlay}>
                <ActivityIndicator size="small" color={POST_COLORS.textPrimary} />
                <Text style={styles.uploadProgressText}>
                  {Math.round(uploadProgress[index])}%
                </Text>
              </View>
            )}
          </Animated.View>
        ))}
        
        {media.length < maxFiles && (
          <View style={styles.addMediaButtons}>
            <TouchableOpacity
              style={styles.addMediaButton}
              onPress={handleImagePicker}
            >
              <Icon name="camera" size={24} color={POST_COLORS.primary} />
              <Text style={styles.addMediaText}>Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.addMediaButton}
              onPress={handleDocumentPicker}
            >
              <Icon name="document" size={24} color={POST_COLORS.primary} />
              <Text style={styles.addMediaText}>File</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// ===============================
// POLL CREATOR COMPONENT
// ===============================
const PollCreator = ({pollData, onChange}) => {
  console.log('📊 PollCreator rendering with', pollData.options.length, 'options');
  
  const addOption = () => {
    if (pollData.options.length < 10) {
      const newOptions = [...pollData.options, ''];
      onChange({...pollData, options: newOptions});
      console.log('➕ Added poll option');
    }
  };
  
  const removeOption = (index) => {
    if (pollData.options.length > 2) {
      const newOptions = pollData.options.filter((_, i) => i !== index);
      onChange({...pollData, options: newOptions});
      console.log(`🗑️ Removed poll option at index ${index}`);
    }
  };
  
  const updateOption = (index, value) => {
    const newOptions = [...pollData.options];
    newOptions[index] = value;
    onChange({...pollData, options: newOptions});
  };
  
  return (
    <Animated.View 
      style={styles.pollContainer}
      entering={FadeInUp}
    >
      <Text style={styles.sectionTitle}>Poll Question</Text>
      <TextInput
        style={styles.pollQuestion}
        value={pollData.question}
        onChangeText={(text) => onChange({...pollData, question: text})}
        placeholder="What would you like to ask?"
        placeholderTextColor={POST_COLORS.textMuted}
        maxLength={CHARACTER_LIMITS.pollQuestion}
      />
      
      <Text style={styles.sectionTitle}>Options</Text>
      {pollData.options.map((option, index) => (
        <View key={index} style={styles.pollOption}>
          <TextInput
            style={styles.pollOptionInput}
            value={option}
            onChangeText={(text) => updateOption(index, text)}
            placeholder={`Option ${index + 1}`}
            placeholderTextColor={POST_COLORS.textMuted}
            maxLength={CHARACTER_LIMITS.pollOption}
          />
          {pollData.options.length > 2 && (
            <TouchableOpacity
              onPress={() => removeOption(index)}
              style={styles.pollOptionRemove}
            >
              <Icon name="close-circle" size={20} color={POST_COLORS.error} />
            </TouchableOpacity>
          )}
        </View>
      ))}
      
      {pollData.options.length < 10 && (
        <TouchableOpacity
          style={styles.addOptionButton}
          onPress={addOption}
        >
          <Icon name="add-circle-outline" size={20} color={POST_COLORS.primary} />
          <Text style={styles.addOptionText}>Add Option</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.pollSettings}>
        <View style={styles.pollSettingRow}>
          <Text style={styles.pollSettingLabel}>Multiple Choice</Text>
          <Switch
            value={pollData.settings.multipleChoice}
            onValueChange={(value) => 
              onChange({
                ...pollData, 
                settings: {...pollData.settings, multipleChoice: value}
              })
            }
            trackColor={{false: POST_COLORS.border, true: POST_COLORS.primaryLight}}
            thumbColor={pollData.settings.multipleChoice ? POST_COLORS.primary : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.pollSettingRow}>
          <Text style={styles.pollSettingLabel}>Anonymous Voting</Text>
          <Switch
            value={pollData.settings.anonymous}
            onValueChange={(value) => 
              onChange({
                ...pollData, 
                settings: {...pollData.settings, anonymous: value}
              })
            }
            trackColor={{false: POST_COLORS.border, true: POST_COLORS.primaryLight}}
            thumbColor={pollData.settings.anonymous ? POST_COLORS.primary : '#f4f3f4'}
          />
        </View>
        
        <View style={styles.pollSettingRow}>
          <Text style={styles.pollSettingLabel}>Allow Vote Changes</Text>
          <Switch
            value={pollData.settings.changeVote}
            onValueChange={(value) => 
              onChange({
                ...pollData, 
                settings: {...pollData.settings, changeVote: value}
              })
            }
            trackColor={{false: POST_COLORS.border, true: POST_COLORS.primaryLight}}
            thumbColor={pollData.settings.changeVote ? POST_COLORS.primary : '#f4f3f4'}
          />
        </View>
      </View>
    </Animated.View>
  );
};

// ===============================
// EVENT CREATOR COMPONENT
// ===============================
const EventCreator = ({eventData, onChange}) => {
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  
  console.log('📅 EventCreator rendering:', eventData.title);
  
  return (
    <Animated.View 
      style={styles.eventContainer}
      entering={FadeInUp}
    >
      <Text style={styles.sectionTitle}>Event Details</Text>
      
      <TextInput
        style={styles.input}
        value={eventData.title}
        onChangeText={(text) => onChange({...eventData, title: text})}
        placeholder="Event Title"
        placeholderTextColor={POST_COLORS.textMuted}
        maxLength={CHARACTER_LIMITS.eventTitle}
      />
      
      <TextInput
        style={[styles.input, styles.textArea]}
        value={eventData.description}
        onChangeText={(text) => onChange({...eventData, description: text})}
        placeholder="Event Description"
        placeholderTextColor={POST_COLORS.textMuted}
        multiline
        numberOfLines={4}
        maxLength={CHARACTER_LIMITS.eventDescription}
      />
      
      <View style={styles.eventDateRow}>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowStartPicker(true)}
        >
          <Icon name="calendar" size={20} color={POST_COLORS.primary} />
          <Text style={styles.dateButtonText}>
            {eventData.startDate ? 
              new Date(eventData.startDate).toLocaleDateString() : 
              'Start Date'
            }
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowEndPicker(true)}
        >
          <Icon name="calendar" size={20} color={POST_COLORS.primary} />
          <Text style={styles.dateButtonText}>
            {eventData.endDate ? 
              new Date(eventData.endDate).toLocaleDateString() : 
              'End Date'
            }
          </Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Location</Text>
      
      <View style={styles.locationTypeRow}>
        {['physical', 'virtual', 'hybrid'].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.locationTypeButton,
              eventData.location.type === type && styles.locationTypeButtonActive
            ]}
            onPress={() => 
              onChange({
                ...eventData, 
                location: {...eventData.location, type}
              })
            }
          >
            <Text style={[
              styles.locationTypeText,
              eventData.location.type === type && styles.locationTypeTextActive
            ]}>
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {(eventData.location.type === 'physical' || eventData.location.type === 'hybrid') && (
        <>
          <TextInput
            style={styles.input}
            value={eventData.location.venue}
            onChangeText={(text) => 
              onChange({
                ...eventData, 
                location: {...eventData.location, venue: text}
              })
            }
            placeholder="Venue Name"
            placeholderTextColor={POST_COLORS.textMuted}
          />
          
          <TextInput
            style={styles.input}
            value={eventData.location.address}
            onChangeText={(text) => 
              onChange({
                ...eventData, 
                location: {...eventData.location, address: text}
              })
            }
            placeholder="Address"
            placeholderTextColor={POST_COLORS.textMuted}
          />
        </>
      )}
      
      {(eventData.location.type === 'virtual' || eventData.location.type === 'hybrid') && (
        <TextInput
          style={styles.input}
          value={eventData.location.virtualLink}
          onChangeText={(text) => 
            onChange({
              ...eventData, 
              location: {...eventData.location, virtualLink: text}
            })
          }
          placeholder="Virtual Meeting Link"
          placeholderTextColor={POST_COLORS.textMuted}
        />
      )}
      
      <DatePicker
        modal
        open={showStartPicker}
        date={eventData.startDate || new Date()}
        onConfirm={(date) => {
          onChange({...eventData, startDate: date});
          setShowStartPicker(false);
          console.log('📅 Start date selected:', date);
        }}
        onCancel={() => setShowStartPicker(false)}
        mode="datetime"
      />
      
      <DatePicker
        modal
        open={showEndPicker}
        date={eventData.endDate || new Date()}
        onConfirm={(date) => {
          onChange({...eventData, endDate: date});
          setShowEndPicker(false);
          console.log('📅 End date selected:', date);
        }}
        onCancel={() => setShowEndPicker(false)}
        mode="datetime"
      />
    </Animated.View>
  );
};

// ===============================
// MAIN CREATE POST COMPONENT
// ===============================
const CreatePost = ({navigation, route}) => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);
  const {communityId, communityName} = route.params;
  
  console.log('\n🎨 ==================== CREATE POST SCREEN MOUNTED ====================');
  console.log('👤 User:', userData?.username);
  console.log('🏘️ Community:', communityName, `(${communityId})`);
  console.log('=======================================================================\n');
  
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState('text');
  const [draftSaving, setDraftSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Form Data
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState([]);
  const [tags, setTags] = useState([]);
  const [visibility, setVisibility] = useState('members');
  
  // Poll Data
  const [pollData, setPollData] = useState({
    question: '',
    options: ['', ''],
    settings: {
      multipleChoice: false,
      anonymous: false,
      changeVote: true,
      showResults: 'after_vote',
    },
    endsAt: null,
  });
  
  // Event Data
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    startDate: null,
    endDate: null,
    location: {
      type: 'physical',
      venue: '',
      address: '',
      city: '',
      virtualLink: '',
      instructions: '',
    },
    capacity: {
      max: null,
      waitlist: false,
    },
    rsvp: {
      required: true,
      deadline: null,
    },
  });
  
  // Announcement Data
  const [announcementData, setAnnouncementData] = useState({
    priority: 'normal',
    requireReadReceipt: false,
    expiresAt: null,
    targetAudience: {
      allMembers: true,
      roles: [],
      specificUsers: [],
    },
  });
  
  // Schedule Data
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState(null);
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  
  // Refs
  const draftTimerRef = useRef(null);
  
  // ===============================
  // DRAFT SYSTEM
  // ===============================
  const saveDraft = useCallback(async () => {
    try {
      setDraftSaving(true);
      const draftData = {
        communityId,
        postType,
        title,
        content,
        media,
        tags,
        visibility,
        pollData,
        eventData,
        announcementData,
        isScheduled,
        scheduledFor,
        savedAt: new Date().toISOString(),
      };
      
      const draftKey = `post_draft_${communityId}`;
      await AsyncStorage.setItem(draftKey, JSON.stringify(draftData));
      
      setLastSaved(new Date());
      CreatePostAPILogger.logDraft('SAVED', {
        key: draftKey,
        postType,
        hasContent: content.length > 0,
        hasMedia: media.length > 0,
      });
      
      console.log('✅ Draft saved successfully');
    } catch (error) {
      console.error('❌ Error saving draft:', error);
    } finally {
      setDraftSaving(false);
    }
  }, [communityId, postType, title, content, media, tags, visibility, pollData, eventData, announcementData, isScheduled, scheduledFor]);
  
  const loadDraft = useCallback(async () => {
    try {
      const draftKey = `post_draft_${communityId}`;
      const draftString = await AsyncStorage.getItem(draftKey);
      
      if (draftString) {
        const draftData = JSON.parse(draftString);
        CreatePostAPILogger.logDraft('LOADED', {
          key: draftKey,
          savedAt: draftData.savedAt,
        });
        
        // Restore draft data
        setPostType(draftData.postType || 'text');
        setTitle(draftData.title || '');
        setContent(draftData.content || '');
        setMedia(draftData.media || []);
        setTags(draftData.tags || []);
        setVisibility(draftData.visibility || 'members');
        
        if (draftData.pollData) setPollData(draftData.pollData);
        if (draftData.eventData) setEventData(draftData.eventData);
        if (draftData.announcementData) setAnnouncementData(draftData.announcementData);
        if (draftData.isScheduled) setIsScheduled(draftData.isScheduled);
        if (draftData.scheduledFor) setScheduledFor(new Date(draftData.scheduledFor));
        
        console.log('✅ Draft loaded successfully');
        Alert.alert('Draft Restored', 'Your previous draft has been restored');
      }
    } catch (error) {
      console.error('❌ Error loading draft:', error);
    }
  }, [communityId]);
  
  const clearDraft = useCallback(async () => {
    try {
      const draftKey = `post_draft_${communityId}`;
      await AsyncStorage.removeItem(draftKey);
      CreatePostAPILogger.logDraft('CLEARED', {key: draftKey});
      console.log('🗑️ Draft cleared');
    } catch (error) {
      console.error('❌ Error clearing draft:', error);
    }
  }, [communityId]);
  
  // Auto-save draft
  useEffect(() => {
    // Clear existing timer
    if (draftTimerRef.current) {
      clearTimeout(draftTimerRef.current);
    }
    
    // Set new timer for auto-save (3 seconds after last change)
    if (content.length > 0 || title.length > 0 || media.length > 0) {
      draftTimerRef.current = setTimeout(() => {
        saveDraft();
      }, 3000);
    }
    
    return () => {
      if (draftTimerRef.current) {
        clearTimeout(draftTimerRef.current);
      }
    };
  }, [content, title, media, saveDraft]);
  
  // Load draft on mount
  useEffect(() => {
    loadDraft();
  }, [loadDraft]);
  
  // ===============================
  // VALIDATION
  // ===============================
  const validatePost = () => {
    console.log('🔍 Validating post...');
    
    if (postType === 'text' && !content && !title) {
      Alert.alert('Error', 'Please add some content or a title');
      return false;
    }
    
    if (postType === 'poll') {
      if (!pollData.question) {
        Alert.alert('Error', 'Please enter a poll question');
        return false;
      }
      if (pollData.options.filter(o => o.trim()).length < 2) {
        Alert.alert('Error', 'Please provide at least 2 poll options');
        return false;
      }
    }
    
    if (postType === 'event') {
      if (!eventData.title) {
        Alert.alert('Error', 'Please enter an event title');
        return false;
      }
      if (!eventData.startDate) {
        Alert.alert('Error', 'Please select a start date for the event');
        return false;
      }
    }
    
    if (postType === 'announcement' && !title && !content) {
      Alert.alert('Error', 'Announcements require a title or content');
      return false;
    }
    
    console.log('✅ Validation passed');
    return true;
  };
  
  // ===============================
  // API CALLS
  // ===============================
  const uploadMedia = async () => {
    if (media.length === 0) return [];
    
    console.log(`📤 Uploading ${media.length} media files...`);
    const uploadedMedia = [];
    
    for (const file of media) {
      try {
        const formData = new FormData();
        formData.append('files', {
          uri: file.uri,
          type: file.type,
          name: file.name,
        });
        
        CreatePostAPILogger.logRequest('uploadCommunityPostMedia', null, {
          name: file.name,
          type: file.type,
          size: file.size,
        });
        
        const response = await uploadCommunityPostMediaApi(communityId, formData);
        CreatePostAPILogger.logResponse('uploadCommunityPostMedia', response);
        
        if (response?.data?.success) {
          uploadedMedia.push(...response.data.data.uploaded);
        }
      } catch (error) {
        CreatePostAPILogger.logError('uploadCommunityPostMedia', error);
        console.error('Failed to upload file:', file.name);
      }
    }
    
    return uploadedMedia;
  };
  
  const handleCreatePost = async () => {
    console.log('\n🚀 ==================== CREATING POST ====================');
    
    if (!validatePost()) return;
    
    setLoading(true);
    
    try {
      // Upload media first if any
      let uploadedMedia = [];
      if (media.length > 0) {
        uploadedMedia = await uploadMedia();
        console.log(`✅ Uploaded ${uploadedMedia.length} media files`);
      }
      
      // Prepare base post data
      const postData = {
        postType,
        title: title.trim(),
        content: {
          text: content.trim(),
        },
        visibility,
        tags,
      };
      
      // Add type-specific data
      if (postType === 'poll') {
        postData.pollQuestion = pollData.question;
        postData.pollOptions = pollData.options.filter(o => o.trim());
        postData.pollSettings = pollData.settings;
        postData.pollEndsAt = pollData.endsAt;
      }
      
      if (postType === 'event') {
        postData.eventData = eventData;
      }
      
      if (postType === 'announcement') {
        postData.announcementData = announcementData;
      }
      
      // Handle scheduling
      if (isScheduled && scheduledFor) {
        postData.scheduledFor = scheduledFor.toISOString();
      }
      
      // Add uploaded media references
      if (uploadedMedia.length > 0) {
        postData.media = uploadedMedia;
      }
      
      // Determine which API to call
      let apiCall;
      let apiName;
      
      if (postType === 'poll') {
        apiCall = createCommunityPollApi;
        apiName = 'createCommunityPoll';
      } else if (postType === 'event') {
        apiCall = createCommunityEventApi;
        apiName = 'createCommunityEvent';
      } else if (postType === 'announcement') {
        apiCall = createCommunityAnnouncementApi;
        apiName = 'createCommunityAnnouncement';
      } else if (isScheduled) {
        apiCall = scheduleCommunityPostApi;
        apiName = 'scheduleCommunityPost';
      } else {
        apiCall = createCommunityPostApi;
        apiName = 'createCommunityPost';
      }
      
      CreatePostAPILogger.logRequest(apiName, postData);
      const response = await apiCall(communityId, postData);
      CreatePostAPILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        console.log('🎉 POST CREATED SUCCESSFULLY!');
        
        // Clear draft
        await clearDraft();
        
        // Track analytics
        mixpanel.track('Post Created', {
          community_id: communityId,
          post_type: postType,
          has_media: uploadedMedia.length > 0,
          is_scheduled: isScheduled,
        });
        
        // Show success and navigate
        Alert.alert(
          'Success',
          isScheduled ? 'Post scheduled successfully!' : 'Post created successfully!',
          [
            {
              text: 'View Post',
              onPress: () => {
                navigation.navigate(Routes.PostDetail, {
                  postId: response.data.data.post.id,
                  communityId,
                });
              },
            },
            {
              text: 'Create Another',
              onPress: () => {
                // Reset form
                setTitle('');
                setContent('');
                setMedia([]);
                setTags([]);
                setPostType('text');
              },
            },
          ],
        );
      }
    } catch (error) {
      CreatePostAPILogger.logError('createPost', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };
  
  // ===============================
  // UI RENDER
  // ===============================
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={POST_COLORS.background} />
      
      <MainHeader
        title="Create Post"
        onBackPress={() => navigation.goBack()}
        rightComponent={
          <View style={styles.headerRight}>
            {draftSaving && (
              <ActivityIndicator size="small" color={POST_COLORS.textSecondary} />
            )}
            {lastSaved && (
              <Text style={styles.lastSavedText}>
                Saved {new Date(lastSaved).toLocaleTimeString()}
              </Text>
            )}
          </View>
        }
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Community Info */}
          <View style={styles.communityInfo}>
            <Text style={styles.communityLabel}>Posting to</Text>
            <Text style={styles.communityName}>{communityName}</Text>
          </View>
          
          {/* Post Type Selector */}
          <PostTypeSelector
            selectedType={postType}
            onSelectType={setPostType}
          />
          
          {/* Title Input */}
          {(postType === 'text' || postType === 'announcement') && (
            <View style={styles.titleContainer}>
              <TextInput
                style={styles.titleInput}
                value={title}
                onChangeText={setTitle}
                placeholder="Add a title (optional)"
                placeholderTextColor={POST_COLORS.textMuted}
                maxLength={CHARACTER_LIMITS.title}
              />
            </View>
          )}
          
          {/* Content Editor */}
          {(postType === 'text' || postType === 'announcement') && (
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="What's on your mind?"
              maxLength={CHARACTER_LIMITS.content}
              showToolbar={true}
            />
          )}
          
          {/* Poll Creator */}
          {postType === 'poll' && (
            <PollCreator
              pollData={pollData}
              onChange={setPollData}
            />
          )}
          
          {/* Event Creator */}
          {postType === 'event' && (
            <EventCreator
              eventData={eventData}
              onChange={setEventData}
            />
          )}
          
          {/* Media Upload */}
          {(postType === 'text' || postType === 'image') && (
            <MediaUpload
              media={media}
              onAddMedia={(newMedia) => setMedia([...media, ...newMedia])}
              onRemoveMedia={(index) => {
                const newMedia = media.filter((_, i) => i !== index);
                setMedia(newMedia);
              }}
              maxFiles={10}
            />
          )}
          
          {/* Tags Input */}
          <View style={styles.tagsContainer}>
            <Text style={styles.sectionTitle}>Tags</Text>
            <TextInput
              style={styles.tagsInput}
              value={tags.join(', ')}
              onChangeText={(text) => {
                const newTags = text.split(',').map(t => t.trim()).filter(t => t);
                setTags(newTags);
              }}
              placeholder="Add tags separated by commas"
              placeholderTextColor={POST_COLORS.textMuted}
            />
          </View>
          
          {/* Post Settings */}
          <View style={styles.settingsContainer}>
            <Text style={styles.sectionTitle}>Post Settings</Text>
            
            {/* Visibility */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Visibility</Text>
              <View style={styles.visibilityOptions}>
                {['public', 'members', 'private'].map((vis) => (
                  <TouchableOpacity
                    key={vis}
                    style={[
                      styles.visibilityButton,
                      visibility === vis && styles.visibilityButtonActive
                    ]}
                    onPress={() => setVisibility(vis)}
                  >
                    <Text style={[
                      styles.visibilityText,
                      visibility === vis && styles.visibilityTextActive
                    ]}>
                      {vis.charAt(0).toUpperCase() + vis.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Schedule Post */}
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Schedule Post</Text>
              <Switch
                value={isScheduled}
                onValueChange={setIsScheduled}
                trackColor={{false: POST_COLORS.border, true: POST_COLORS.primaryLight}}
                thumbColor={isScheduled ? POST_COLORS.primary : '#f4f3f4'}
              />
            </View>
            
            {isScheduled && (
              <TouchableOpacity
                style={styles.scheduleDateButton}
                onPress={() => setShowSchedulePicker(true)}
              >
                <Icon name="calendar" size={20} color={POST_COLORS.primary} />
                <Text style={styles.scheduleDateText}>
                  {scheduledFor ? 
                    scheduledFor.toLocaleString() : 
                    'Select Date & Time'
                  }
                </Text>
              </TouchableOpacity>
            )}
          </View>
          
          {/* Announcement Settings */}
          {postType === 'announcement' && (
            <View style={styles.announcementSettings}>
              <Text style={styles.sectionTitle}>Announcement Settings</Text>
              
              <View style={styles.priorityRow}>
                {['low', 'normal', 'high', 'urgent'].map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    style={[
                      styles.priorityButton,
                      announcementData.priority === priority && styles.priorityButtonActive
                    ]}
                    onPress={() => 
                      setAnnouncementData({...announcementData, priority})
                    }
                  >
                    <Text style={[
                      styles.priorityText,
                      announcementData.priority === priority && styles.priorityTextActive
                    ]}>
                      {priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Require Read Receipt</Text>
                <Switch
                  value={announcementData.requireReadReceipt}
                  onValueChange={(value) => 
                    setAnnouncementData({...announcementData, requireReadReceipt: value})
                  }
                  trackColor={{false: POST_COLORS.border, true: POST_COLORS.primaryLight}}
                  thumbColor={announcementData.requireReadReceipt ? POST_COLORS.primary : '#f4f3f4'}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.saveDraftButton}
          onPress={saveDraft}
          disabled={draftSaving}
        >
          <Icon name="save" size={20} color={POST_COLORS.textSecondary} />
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.publishButton, loading && styles.publishButtonDisabled]}
          onPress={handleCreatePost}
          disabled={loading}
        >
          <LinearGradient
            colors={POST_COLORS.gradient1}
            style={styles.publishGradient}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
          >
            {loading ? (
              <ActivityIndicator size="small" color={POST_COLORS.textPrimary} />
            ) : (
              <>
                <Text style={styles.publishText}>
                  {isScheduled ? 'Schedule' : 'Publish'}
                </Text>
                <Icon name="send" size={18} color={POST_COLORS.textPrimary} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Schedule Date Picker */}
      <DatePicker
        modal
        open={showSchedulePicker}
        date={scheduledFor || new Date()}
        onConfirm={(date) => {
          setScheduledFor(date);
          setShowSchedulePicker(false);
          console.log('📅 Scheduled for:', date);
        }}
        onCancel={() => setShowSchedulePicker(false)}
        mode="datetime"
        minimumDate={new Date()}
      />
    </SafeAreaView>
  );
};

// ===============================
// STYLES
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: POST_COLORS.background,
  },
  
  content: {
    flex: 1,
  },
  
  scrollContent: {
    paddingBottom: 100,
  },
  
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  
  lastSavedText: {
    fontSize: 12,
    color: POST_COLORS.textTertiary,
  },
  
  // Community Info
  communityInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: POST_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
  },
  
  communityLabel: {
    fontSize: 12,
    color: POST_COLORS.textTertiary,
    marginBottom: 4,
  },
  
  communityName: {
    fontSize: 16,
    fontWeight: '600',
    color: POST_COLORS.textPrimary,
  },
  
  // Post Type Selector
  postTypeContainer: {
    backgroundColor: POST_COLORS.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
  },
  
  postTypeScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  
  postTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    backgroundColor: POST_COLORS.elevated,
    gap: 8,
    marginRight: 8,
  },
  
  postTypeText: {
    fontSize: 14,
    color: POST_COLORS.textSecondary,
    fontWeight: '500',
  },
  
  // Title Input
  titleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: POST_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
  },
  
  titleInput: {
    fontSize: 18,
    fontWeight: '600',
    color: POST_COLORS.textPrimary,
    padding: 0,
  },
  
  // Rich Text Editor
  richTextContainer: {
    backgroundColor: POST_COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
  },
  
  richTextToolbar: {
    flexDirection: 'row',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
    gap: 8,
  },
  
  toolbarButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: POST_COLORS.elevated,
  },
  
  toolbarButtonActive: {
    backgroundColor: POST_COLORS.primary + '30',
  },
  
  richTextInput: {
    minHeight: 150,
    fontSize: 16,
    color: POST_COLORS.textPrimary,
    textAlignVertical: 'top',
  },
  
  characterCount: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 12,
  },
  
  characterProgress: {
    flex: 1,
    height: 4,
    backgroundColor: POST_COLORS.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  
  characterProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  
  characterText: {
    fontSize: 12,
    color: POST_COLORS.textTertiary,
  },
  
  // Media Upload
  mediaContainer: {
    backgroundColor: POST_COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
  },
  
  mediaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  mediaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: POST_COLORS.textPrimary,
  },
  
  mediaCount: {
    fontSize: 14,
    color: POST_COLORS.textTertiary,
  },
  
  mediaScroll: {
    flexDirection: 'row',
    gap: 12,
  },
  
  mediaItem: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: POST_COLORS.elevated,
  },
  
  mediaImage: {
    width: '100%',
    height: '100%',
  },
  
  documentPreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  
  documentName: {
    fontSize: 10,
    color: POST_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  
  mediaRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  
  uploadProgressOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  uploadProgressText: {
    fontSize: 12,
    color: POST_COLORS.textPrimary,
    marginTop: 4,
  },
  
  addMediaButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  addMediaButton: {
    width: 100,
    height: 100,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: POST_COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: POST_COLORS.elevated,
  },
  
  addMediaText: {
    fontSize: 12,
    color: POST_COLORS.textSecondary,
    marginTop: 4,
  },
  
  // Poll Creator
  pollContainer: {
    backgroundColor: POST_COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
  },
  
  pollQuestion: {
    fontSize: 16,
    color: POST_COLORS.textPrimary,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  
  pollOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  
  pollOptionInput: {
    flex: 1,
    fontSize: 14,
    color: POST_COLORS.textPrimary,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  
  pollOptionRemove: {
    padding: 4,
  },
  
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 12,
    borderStyle: 'dashed',
    gap: 8,
    marginTop: 8,
  },
  
  addOptionText: {
    fontSize: 14,
    color: POST_COLORS.primary,
    fontWeight: '500',
  },
  
  pollSettings: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: POST_COLORS.border,
  },
  
  pollSettingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  pollSettingLabel: {
    fontSize: 14,
    color: POST_COLORS.textSecondary,
  },
  
  // Event Creator
  eventContainer: {
    backgroundColor: POST_COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
  },
  
  input: {
    fontSize: 14,
    color: POST_COLORS.textPrimary,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  eventDateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 12,
    gap: 8,
  },
  
  dateButtonText: {
    fontSize: 14,
    color: POST_COLORS.textPrimary,
  },
  
  locationTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  
  locationTypeButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 12,
    alignItems: 'center',
  },
  
  locationTypeButtonActive: {
    backgroundColor: POST_COLORS.primary + '20',
    borderColor: POST_COLORS.primary,
  },
  
  locationTypeText: {
    fontSize: 14,
    color: POST_COLORS.textSecondary,
  },
  
  locationTypeTextActive: {
    color: POST_COLORS.primary,
    fontWeight: '600',
  },
  
  // Tags
  tagsContainer: {
    backgroundColor: POST_COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
  },
  
  tagsInput: {
    fontSize: 14,
    color: POST_COLORS.textPrimary,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  
  // Settings
  settingsContainer: {
    backgroundColor: POST_COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
  },
  
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: POST_COLORS.textPrimary,
    marginBottom: 12,
  },
  
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  
  settingLabel: {
    fontSize: 14,
    color: POST_COLORS.textSecondary,
  },
  
  visibilityOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  
  visibilityButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 16,
  },
  
  visibilityButtonActive: {
    backgroundColor: POST_COLORS.primary + '20',
    borderColor: POST_COLORS.primary,
  },
  
  visibilityText: {
    fontSize: 12,
    color: POST_COLORS.textSecondary,
  },
  
  visibilityTextActive: {
    color: POST_COLORS.primary,
    fontWeight: '600',
  },
  
  scheduleDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 12,
    gap: 8,
  },
  
  scheduleDateText: {
    fontSize: 14,
    color: POST_COLORS.textPrimary,
  },
  
  // Announcement Settings
  announcementSettings: {
    backgroundColor: POST_COLORS.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: POST_COLORS.border,
  },
  
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  
  priorityButton: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 8,
    alignItems: 'center',
  },
  
  priorityButtonActive: {
    backgroundColor: POST_COLORS.primary + '20',
    borderColor: POST_COLORS.primary,
  },
  
  priorityText: {
    fontSize: 12,
    color: POST_COLORS.textSecondary,
  },
  
  priorityTextActive: {
    color: POST_COLORS.primary,
    fontWeight: '600',
  },
  
  // Action Container
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: POST_COLORS.background,
    borderTopWidth: 1,
    borderTopColor: POST_COLORS.border,
    gap: 12,
  },
  
  saveDraftButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: POST_COLORS.border,
    borderRadius: 25,
    gap: 8,
  },
  
  saveDraftText: {
    fontSize: 14,
    color: POST_COLORS.textSecondary,
    fontWeight: '600',
  },
  
  publishButton: {
    flex: 1,
    borderRadius: 25,
    overflow: 'hidden',
  },
  
  publishButtonDisabled: {
    opacity: 0.6,
  },
  
  publishGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  
  publishText: {
    fontSize: 16,
    fontWeight: '600',
    color: POST_COLORS.textPrimary,
  },
});

export default CreatePost;