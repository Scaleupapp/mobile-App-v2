// src/screens/Community/CreateCommunity.js
/**
 * Create Community Screen - Complete Wizard Experience
 * Discord Server Creation + Reddit Subreddit + Notion Page Creation Hybrid
 * World-class UX with step-by-step wizard, templates, and celebration
 * Single file implementation with comprehensive API logging
 */

import React, {useCallback, useEffect, useRef, useState, useMemo} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  RefreshControl,
  ActivityIndicator,
  FlatList,
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
import {launchImageLibrary} from 'react-native-image-picker';

import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {
  getCommunityTypesApi,
  createCommunityApi,
  createCommunityFromTemplateApi,
  getCommunityCategoriesApi,
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
// WIZARD COLOR SYSTEM
// ===============================
const WIZARD_COLORS = {
  // Primary Brand
  primary: '#8B5CF6', // Purple
  primaryLight: '#A78BFA',
  primaryDark: '#7C3AED',
  
  // Success & Progress
  success: '#10B981', // Emerald
  warning: '#F59E0B', // Amber
  danger: '#EF4444', // Red
  info: '#3B82F6', // Blue
  
  // Step Colors
  stepActive: '#8B5CF6',
  stepCompleted: '#10B981',
  stepInactive: '#6B7280',
  
  // Backgrounds
  background: '#0F0F23', // Deep purple black
  surface: '#1E1B32', // Purple gray
  elevated: '#2D2A3F', // Medium purple
  overlay: '#3C3850', // Light purple
  
  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#D1D5DB', // Gray-300
  textTertiary: '#9CA3AF', // Gray-400
  textDisabled: '#6B7280', // Gray-500
  
  // Interactive
  hover: 'rgba(139, 92, 246, 0.1)',
  pressed: 'rgba(139, 92, 246, 0.05)',
  focus: 'rgba(139, 92, 246, 0.2)',
  
  // Special
  celebration: '#F59E0B',
  template: '#06B6D4', // Cyan
  
  // Borders
  border: '#374151', // Gray-700
  borderLight: '#4B5563', // Gray-600
  divider: '#1F2937', // Gray-800
};

// ===============================
// ENHANCED API LOGGER
// ===============================
const CreateCommunityAPILogger = {
  logRequest: (apiName, params, files = null) => {
    console.log(`\n🎨 CREATE_COMMUNITY REQUEST: ${apiName}`);
    console.log('🔧 Parameters:', params);
    if (files) {
      console.log('📁 Files:', Object.keys(files));
    }
    console.log('⏰ Timestamp:', new Date().toISOString());
  },
  
  logResponse: (apiName, response) => {
    console.log(`\n✨ CREATE_COMMUNITY RESPONSE: ${apiName}`);
    console.log('📈 Status:', response?.status);
    console.log('📦 Success:', response?.data?.success);
    
    if (response?.data?.data) {
      const data = response.data.data;
      
      if (data.types) {
        console.log('🏷️ Community Types Found:', data.types.length);
        data.types.forEach((type, index) => {
          console.log(`  ${index + 1}. ${type.name} (${type.id})`);
        });
      } else if (data.categories) {
        console.log('📂 Categories Found:', data.categories.length);
      } else if (data.community) {
        console.log('🎉 Community Created:', data.community.name);
        console.log('🆔 Community ID:', data.community.id);
        console.log('🔗 Community Slug:', data.community.slug);
      } else {
        console.log('📄 Data Keys:', Object.keys(data));
      }
    }
  },
  
  logError: (apiName, error) => {
    console.log(`\n💥 CREATE_COMMUNITY ERROR: ${apiName}`);
    console.log('🚨 Error Message:', error?.message);
    console.log('📡 Response Status:', error?.response?.status);
    console.log('📄 Response Data:', error?.response?.data);
    if (error?.response?.data?.message) {
      console.log('🔍 API Error Details:', error.response.data.message);
    }
  }
};

// ===============================
// UTILITY FUNCTIONS
// ===============================
const validateCommunityName = (name) => {
  if (!name) return 'Community name is required';
  if (name.length < 3) return 'Name must be at least 3 characters';
  if (name.length > 50) return 'Name must be less than 50 characters';
  if (!/^[a-zA-Z0-9\s-_]+$/.test(name)) return 'Name can only contain letters, numbers, spaces, hyphens, and underscores';
  return null;
};

const validateDescription = (description) => {
  if (!description) return 'Description is required';
  if (description.length < 10) return 'Description must be at least 10 characters';
  if (description.length > 500) return 'Description must be less than 500 characters';
  return null;
};

const generateSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

// ===============================
// STEP INDICATOR COMPONENT
// ===============================
const StepIndicator = ({currentStep, totalSteps, steps}) => {
  return (
    <View style={styles.stepIndicator}>
      <View style={styles.stepTracker}>
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const stepNumber = index + 1;
          
          return (
            <React.Fragment key={step.id}>
              <Animated.View
                entering={FadeIn.delay(index * 100)}
                style={[
                  styles.stepCircle,
                  isCompleted && styles.stepCompleted,
                  isActive && styles.stepActive,
                ]}
              >
                {isCompleted ? (
                  <Icon name="checkmark" size={16} color={WIZARD_COLORS.textPrimary} />
                ) : (
                  <Text style={[
                    styles.stepNumber,
                    isActive && styles.stepNumberActive
                  ]}>
                    {stepNumber}
                  </Text>
                )}
              </Animated.View>
              
              {index < steps.length - 1 && (
                <View style={[
                  styles.stepConnector,
                  isCompleted && styles.stepConnectorCompleted,
                ]} />
              )}
            </React.Fragment>
          );
        })}
      </View>
      
      <View style={styles.stepInfo}>
        <Text style={styles.stepTitle}>{steps[currentStep]?.title}</Text>
        <Text style={styles.stepSubtitle}>{steps[currentStep]?.subtitle}</Text>
      </View>
    </View>
  );
};

// ===============================
// COMMUNITY TYPE CARD
// ===============================
const CommunityTypeCard = ({type, isSelected, onSelect}) => {
  const getTypeIcon = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case 'institutional': return 'school-outline';
      case 'skill': return 'build-outline';
      case 'interest': return 'heart-outline';
      case 'open': return 'globe-outline';
      default: return 'people-outline';
    }
  };
  
  const getTypeColor = (typeName) => {
    switch (typeName?.toLowerCase()) {
      case 'institutional': return '#3B82F6';
      case 'skill': return '#10B981';
      case 'interest': return '#F59E0B';
      case 'open': return '#8B5CF6';
      default: return WIZARD_COLORS.textSecondary;
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.typeCard, isSelected && styles.typeCardSelected]}
      onPress={() => onSelect(type)}
    >
      <View style={[styles.typeIcon, {backgroundColor: getTypeColor(type.name) + '20'}]}>
        <Icon 
          name={getTypeIcon(type.name)} 
          size={24} 
          color={getTypeColor(type.name)} 
        />
      </View>
      
      <Text style={styles.typeName}>{type.name}</Text>
      <Text style={styles.typeDescription} numberOfLines={3}>
        {type.description}
      </Text>
      
      {type.requiresVerification && (
        <View style={styles.verificationBadge}>
          <MaterialIcons name="verified" size={12} color={WIZARD_COLORS.info} />
          <Text style={styles.verificationText}>Verification Required</Text>
        </View>
      )}
      
      {isSelected && (
        <Animated.View entering={ZoomIn} style={styles.selectedIndicator}>
          <Icon name="checkmark-circle" size={24} color={WIZARD_COLORS.success} />
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

// ===============================
// IMAGE PICKER COMPONENT
// ===============================
const ImagePicker = ({label, currentImage, onImageSelected, placeholder}) => {
  const [uploading, setUploading] = useState(false);
  
  const handleImagePick = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };
    
    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.error) return;
      
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        onImageSelected({
          uri: asset.uri,
          type: asset.type,
          name: asset.fileName || 'image.jpg',
          size: asset.fileSize,
        });
      }
    });
  };
  
  return (
    <View style={styles.imagePicker}>
      <Text style={styles.imagePickerLabel}>{label}</Text>
      
      <TouchableOpacity
        style={styles.imagePickerContainer}
        onPress={handleImagePick}
        disabled={uploading}
      >
        {currentImage ? (
          <Image source={{uri: currentImage.uri}} style={styles.imagePreview} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Icon name="camera-outline" size={32} color={WIZARD_COLORS.textTertiary} />
            <Text style={styles.imagePlaceholderText}>{placeholder}</Text>
          </View>
        )}
        
        {uploading && (
          <View style={styles.imageUploadOverlay}>
            <ActivityIndicator size="small" color={WIZARD_COLORS.primary} />
          </View>
        )}
      </TouchableOpacity>
      
      {currentImage && (
        <TouchableOpacity
          style={styles.removeImageButton}
          onPress={() => onImageSelected(null)}
        >
          <Icon name="close-circle" size={20} color={WIZARD_COLORS.danger} />
        </TouchableOpacity>
      )}
    </View>
  );
};

// ===============================
// PRIVACY OPTION COMPONENT
// ===============================
const PrivacyOption = ({option, isSelected, onSelect}) => {
  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'public': return 'globe-outline';
      case 'protected': return 'lock-open-outline';
      case 'private': return 'lock-closed-outline';
      case 'domain_restricted': return 'business-outline';
      default: return 'people-outline';
    }
  };
  
  return (
    <TouchableOpacity
      style={[styles.privacyOption, isSelected && styles.privacyOptionSelected]}
      onPress={() => onSelect(option.value)}
    >
      <View style={styles.privacyHeader}>
        <Icon 
          name={getPrivacyIcon(option.value)} 
          size={20} 
          color={isSelected ? WIZARD_COLORS.primary : WIZARD_COLORS.textSecondary} 
        />
        <Text style={[
          styles.privacyTitle,
          isSelected && styles.privacyTitleSelected
        ]}>
          {option.label}
        </Text>
        {isSelected && (
          <Icon name="checkmark-circle" size={16} color={WIZARD_COLORS.success} />
        )}
      </View>
      <Text style={styles.privacyDescription}>{option.description}</Text>
    </TouchableOpacity>
  );
};

// ===============================
// SUCCESS MODAL COMPONENT
// ===============================
const SuccessModal = ({visible, community, onClose, onViewCommunity}) => {
  const confettiAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0);
  
  useEffect(() => {
    if (visible) {
      confettiAnim.value = withSequence(
        withTiming(1, {duration: 1000}),
        withTiming(0, {duration: 500})
      );
      scaleAnim.value = withSpring(1, {damping: 15});
    } else {
      scaleAnim.value = 0;
    }
  }, [visible]);
  
  const confettiStyle = useAnimatedStyle(() => ({
    opacity: confettiAnim.value,
    transform: [{scale: confettiAnim.value}],
  }));
  
  const modalStyle = useAnimatedStyle(() => ({
    transform: [{scale: scaleAnim.value}],
  }));
  
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.successOverlay}>
        <BlurView style={styles.successBlur} blurType="dark" blurAmount={10} />
        
        {/* Confetti Animation */}
        <Animated.View style={[styles.confetti, confettiStyle]}>
          {[...Array(20)].map((_, i) => (
            <Animated.View
              key={i}
              entering={BounceIn.delay(i * 100)}
              style={[
                styles.confettiPiece,
                {
                  left: `${Math.random() * 100}%`,
                  backgroundColor: [
                    WIZARD_COLORS.success,
                    WIZARD_COLORS.primary,
                    WIZARD_COLORS.celebration,
                    WIZARD_COLORS.info,
                  ][i % 4],
                }
              ]}
            />
          ))}
        </Animated.View>
        
        <Animated.View style={[styles.successModal, modalStyle]}>
          <LinearGradient
            colors={[WIZARD_COLORS.success, '#059669']}
            style={styles.successIcon}
          >
            <Icon name="checkmark" size={40} color={WIZARD_COLORS.textPrimary} />
          </LinearGradient>
          
          <Text style={styles.successTitle}>Community Created!</Text>
          <Text style={styles.successMessage}>
            🎉 Welcome to <Text style={styles.communityName}>{community?.name}</Text>! 
            Your community is now live and ready for members.
          </Text>
          
          <View style={styles.successStats}>
            <View style={styles.successStat}>
              <Text style={styles.successStatValue}>1</Text>
              <Text style={styles.successStatLabel}>Member (You!)</Text>
            </View>
            <View style={styles.successStat}>
              <Text style={styles.successStatValue}>∞</Text>
              <Text style={styles.successStatLabel}>Possibilities</Text>
            </View>
          </View>
          
          <View style={styles.successActions}>
            <TouchableOpacity
              style={styles.viewCommunityButton}
              onPress={onViewCommunity}
            >
              <LinearGradient
                colors={[WIZARD_COLORS.primary, WIZARD_COLORS.primaryLight]}
                style={styles.viewCommunityGradient}
              >
                <Text style={styles.viewCommunityText}>View Community</Text>
                <Icon name="arrow-forward" size={16} color={WIZARD_COLORS.textPrimary} />
              </LinearGradient>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Create Another</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

// ===============================
// MAIN COMPONENT
// ===============================
const CreateCommunity = ({navigation, route}) => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);
  
  console.log('\n🎨 CREATE COMMUNITY SCREEN MOUNTED');
  console.log('User Data:', userData);
  
  // ===============================
  // WIZARD CONFIGURATION
  // ===============================
  const WIZARD_STEPS = [
    {
      id: 'type',
      title: 'Choose Type',
      subtitle: 'What kind of community are you creating?'
    },
    {
      id: 'basic',
      title: 'Basic Details',
      subtitle: 'Name and describe your community'
    },
    {
      id: 'customization',
      title: 'Customize',
      subtitle: 'Set privacy, features, and appearance'
    },
    {
      id: 'preview',
      title: 'Preview',
      subtitle: 'Review and confirm your settings'
    },
  ];
  
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Data states
  const [communityTypes, setCommunityTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  
 // In CreateCommunity component, update the initial formData state:
const [formData, setFormData] = useState({
    type: null,
    name: '',
    description: '',
    category: '',
    privacy: 'public',
    features: {
      polls: true,
      events: true,
      resources: true,
      announcements: true,
      subCommunities: false,
    },
    contentSettings: {
      allowedPostTypes: ['text', 'image', 'file', 'poll', 'link'], // Remove 'video', add 'file'
      postingPermissions: {
        createPost: 'all_members',
        createPoll: 'contributors_up',
        createEvent: 'moderators_up'
      },
      moderationSettings: {
        autoModeration: true,
        requireApproval: false,
        bannedWords: []
      }
    },
    icon: null,
    coverImage: null,
  });
  
  // Validation states
  const [errors, setErrors] = useState({});
  const [createdCommunity, setCreatedCommunity] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  
  // Privacy options
  const privacyOptions = [
    {
      value: 'public',
      label: 'Public',
      description: 'Anyone can find and join your community'
    },
    {
      value: 'protected',
      label: 'Protected',
      description: 'Anyone can find it, but requests are needed to join'
    },
    {
      value: 'private',
      label: 'Private',
      description: 'Invite-only community, not publicly visible'
    },
    {
      value: 'domain_restricted',
      label: 'Domain Restricted',
      description: 'Only users from specific domains can join'
    },
  ];
  
  // ===============================
  // LIFECYCLE & DATA FETCHING
  // ===============================
  useEffect(() => {
    console.log('\n🚀 CREATE COMMUNITY INITIALIZATION');
    mixpanel.track('Create Community Started', {
      user_id: userData?.id,
      timestamp: new Date().toISOString(),
    });
    handleInitialDataFetch();
  }, []);
  
  const handleInitialDataFetch = async () => {
    console.log('\n📊 FETCHING CREATE COMMUNITY DATA...');
    setInitialLoading(true);
    
    try {
      await Promise.all([
        fetchCommunityTypes(),
        fetchCategories(),
      ]);
      console.log('\n✅ CREATE COMMUNITY DATA LOADED');
    } catch (error) {
      console.error('\n❌ CREATE COMMUNITY DATA ERROR:', error);
    } finally {
      setInitialLoading(false);
    }
  };
  
  // ===============================
  // API FUNCTIONS WITH LOGGING
  // ===============================
  const fetchCommunityTypes = async () => {
    const apiName = 'getCommunityTypesApi';
    CreateCommunityAPILogger.logRequest(apiName, {});
    
    try {
      const response = await getCommunityTypesApi();
      CreateCommunityAPILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        const types = response.data.data?.types || [];
        console.log(`🏷️ Community Types Loaded: ${types.length} types`);
        setCommunityTypes(types);
        return types;
      }
    } catch (error) {
      CreateCommunityAPILogger.logError(apiName, error);
      return [];
    }
  };
  
  const fetchCategories = async () => {
    const apiName = 'getCommunityCategoriesApi';
    CreateCommunityAPILogger.logRequest(apiName, {includeCount: false});
    
    try {
      const response = await getCommunityCategoriesApi({includeCount: false});
      CreateCommunityAPILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        const cats = response.data.data?.categories || [];
        console.log(`📂 Categories Loaded: ${cats.length} categories`);
        setCategories(cats);
        return cats;
      }
    } catch (error) {
      CreateCommunityAPILogger.logError(apiName, error);
      return [];
    }
  };
  
  const handleCreateCommunity = async () => {
    const apiName = 'createCommunityApi';
    setLoading(true);
    
    try {
      // Create FormData for multipart upload
      const formDataForAPI = new FormData();
      
      // Add basic fields
      formDataForAPI.append('name', formData.name);
      formDataForAPI.append('description', formData.description);
      formDataForAPI.append('type', formData.type.id);
      formDataForAPI.append('category', formData.category);
      formDataForAPI.append('privacy', formData.privacy);
      formDataForAPI.append('features', JSON.stringify(formData.features));
      formDataForAPI.append('contentSettings', JSON.stringify(formData.contentSettings));
      
      // Add image files
      if (formData.icon) {
        formDataForAPI.append('avatar', {
          uri: formData.icon.uri,
          type: formData.icon.type,
          name: formData.icon.name,
        });
      }
      
      if (formData.coverImage) {
        formDataForAPI.append('coverImage', {
          uri: formData.coverImage.uri,
          type: formData.coverImage.type,
          name: formData.coverImage.name,
        });
      }
      
      const logData = {
        name: formData.name,
        type: formData.type.id,
        privacy: formData.privacy,
        hasIcon: !!formData.icon,
        hasCoverImage: !!formData.coverImage,
      };
      
      CreateCommunityAPILogger.logRequest(apiName, logData, {
        avatar: formData.icon?.name,
        coverImage: formData.coverImage?.name,
      });
      
      const response = await createCommunityApi(formDataForAPI);
      CreateCommunityAPILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        const community = response.data.data.community;
        console.log(`🎉 COMMUNITY CREATED SUCCESSFULLY: ${community.name}`);
        
        setCreatedCommunity(community);
        setShowSuccessModal(true);
        
        mixpanel.track('Community Created', {
          community_id: community.id,
          community_name: community.name,
          community_type: formData.type.id,
          privacy: formData.privacy,
        });
        
        return community;
      }
    } catch (error) {
      CreateCommunityAPILogger.logError(apiName, error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to create community');
    } finally {
      setLoading(false);
    }
  };
  
  // ===============================
  // FORM VALIDATION
  // ===============================
  const validateCurrentStep = () => {
    const newErrors = {};
    
    switch (currentStep) {
      case 0: // Type selection
        if (!formData.type) {
          newErrors.type = 'Please select a community type';
        }
        break;
        
      case 1: // Basic details
        const nameError = validateCommunityName(formData.name);
        if (nameError) newErrors.name = nameError;
        
        const descError = validateDescription(formData.description);
        if (descError) newErrors.description = descError;
        
        if (!formData.category) {
          newErrors.category = 'Please select a category';
        }
        break;
        
      case 2: // Customization
        // No required validation for customization step
        break;
        
      case 3: // Preview
        // Final validation before creation
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // ===============================
  // NAVIGATION HANDLERS
  // ===============================
  const handleNextStep = () => {
    if (!validateCurrentStep()) return;
    
    if (currentStep < WIZARD_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      mixpanel.track('Create Community Step', {
        step: currentStep + 1,
        step_name: WIZARD_STEPS[currentStep + 1].id,
      });
    } else {
      handleCreateCommunity();
    }
  };
  
  const handlePreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const updateFormData = (updates) => {
    setFormData(prev => ({...prev, ...updates}));
    // Clear related errors
    const newErrors = {...errors};
    Object.keys(updates).forEach(key => {
      delete newErrors[key];
    });
    setErrors(newErrors);
  };
  
  // ===============================
  // RENDER STEP CONTENT
  // ===============================
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Type Selection
        return (
          <Animated.View entering={SlideInRight} style={styles.stepContent}>
            <Text style={styles.stepDescription}>
              Choose the type that best fits your community's purpose and goals.
            </Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.typesList}>
              {communityTypes.map((type, index) => (
                <Animated.View key={type.id} entering={FadeInDown.delay(index * 100)}>
                  <CommunityTypeCard
                    type={type}
                    isSelected={formData.type?.id === type.id}
                    onSelect={(selectedType) => updateFormData({type: selectedType})}
                  />
                </Animated.View>
              ))}
            </ScrollView>
            
            {errors.type && (
              <Text style={styles.errorText}>{errors.type}</Text>
            )}
          </Animated.View>
        );
        
      case 1: // Basic Details
        return (
          <Animated.View entering={SlideInRight} style={styles.stepContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Community Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Community Name *</Text>
                <TextInput
                  style={[styles.textInput, errors.name && styles.inputError]}
                  value={formData.name}
                  onChangeText={(name) => updateFormData({name})}
                  placeholder="Enter your community name"
                  placeholderTextColor={WIZARD_COLORS.textTertiary}
                  maxLength={50}
                />
                {formData.name && (
                  <Text style={styles.inputHint}>
                    URL: {generateSlug(formData.name)}
                  </Text>
                )}
                {errors.name && (
                  <Text style={styles.errorText}>{errors.name}</Text>
                )}
              </View>
              
              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={[styles.textArea, errors.description && styles.inputError]}
                  value={formData.description}
                  onChangeText={(description) => updateFormData({description})}
                  placeholder="Describe what your community is about..."
                  placeholderTextColor={WIZARD_COLORS.textTertiary}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
                <Text style={styles.characterCount}>
                  {formData.description.length}/500
                </Text>
                {errors.description && (
                  <Text style={styles.errorText}>{errors.description}</Text>
                )}
              </View>
              
              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryOptions}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={category.id}
                        style={[
                          styles.categoryChip,
                          formData.category === category.id && styles.categoryChipSelected
                        ]}
                        onPress={() => updateFormData({category: category.id})}
                      >
                        <Text style={[
                          styles.categoryChipText,
                          formData.category === category.id && styles.categoryChipTextSelected
                        ]}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
                {errors.category && (
                  <Text style={styles.errorText}>{errors.category}</Text>
                )}
              </View>
              
              {/* Icon */}
              <ImagePicker
                label="Community Icon"
                currentImage={formData.icon}
                onImageSelected={(icon) => updateFormData({icon})}
                placeholder="Add community icon"
              />
            </ScrollView>
          </Animated.View>
        );
        
      case 2: // Customization
        return (
          <Animated.View entering={SlideInRight} style={styles.stepContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Privacy Settings */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Privacy Settings</Text>
                <View style={styles.privacyOptions}>
                  {privacyOptions.map((option) => (
                    <PrivacyOption
                      key={option.value}
                      option={option}
                      isSelected={formData.privacy === option.value}
                      onSelect={(privacy) => updateFormData({privacy})}
                    />
                  ))}
                </View>
              </View>
              
              {/* Features */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Features</Text>
                <View style={styles.featuresList}>
                  {Object.entries(formData.features).map(([feature, enabled]) => (
                    <TouchableOpacity
                      key={feature}
                      style={styles.featureItem}
                      onPress={() => updateFormData({
                        features: {...formData.features, [feature]: !enabled}
                      })}
                    >
                      <View style={styles.featureInfo}>
                        <Text style={styles.featureName}>
                          {feature.charAt(0).toUpperCase() + feature.slice(1)}
                        </Text>
                        <Text style={styles.featureDescription}>
                          Enable {feature.toLowerCase()} in your community
                        </Text>
                      </View>
                      <View style={[styles.toggle, enabled && styles.toggleActive]}>
                        <Animated.View
                          style={[
                            styles.toggleThumb,
                            enabled && styles.toggleThumbActive
                          ]}
                        />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Cover Image */}
              <ImagePicker
                label="Cover Image"
                currentImage={formData.coverImage}
                onImageSelected={(coverImage) => updateFormData({coverImage})}
                placeholder="Add cover image"
              />
            </ScrollView>
          </Animated.View>
        );
        
      case 3: // Preview
        return (
          <Animated.View entering={SlideInRight} style={styles.stepContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.previewCard}>
                {/* Cover Image */}
                {formData.coverImage && (
                  <Image 
                    source={{uri: formData.coverImage.uri}} 
                    style={styles.previewCoverImage} 
                  />
                )}
                
                {/* Community Header */}
                <View style={styles.previewHeader}>
                  {formData.icon ? (
                    <Image 
                      source={{uri: formData.icon.uri}} 
                      style={styles.previewIcon} 
                    />
                  ) : (
                    <View style={styles.previewIconPlaceholder}>
                      <Text style={styles.previewIconText}>
                        {formData.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName}>{formData.name}</Text>
                    <Text style={styles.previewType}>
                      {formData.type?.name} • {privacyOptions.find(p => p.value === formData.privacy)?.label}
                    </Text>
                  </View>
                </View>
                
                {/* Description */}
                <Text style={styles.previewDescription}>{formData.description}</Text>
                
                {/* Features */}
                <View style={styles.previewFeatures}>
                  <Text style={styles.previewFeaturesTitle}>Enabled Features</Text>
                  <View style={styles.previewFeaturesList}>
                    {Object.entries(formData.features)
                      .filter(([_, enabled]) => enabled)
                      .map(([feature]) => (
                        <View key={feature} style={styles.previewFeatureChip}>
                          <Text style={styles.previewFeatureText}>
                            {feature.charAt(0).toUpperCase() + feature.slice(1)}
                          </Text>
                        </View>
                      ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        );
        
      default:
        return null;
    }
  };
  
  // ===============================
  // SUCCESS HANDLERS
  // ===============================
  const handleViewCommunity = () => {
    setShowSuccessModal(false);
    navigation.replace(Routes.CommunityProfile, {
      communityId: createdCommunity.id,
      community: createdCommunity,
    });
  };
  
  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    setCurrentStep(0);
    setFormData({
      type: null,
      name: '',
      description: '',
      category: '',
      privacy: 'public',
      features: {
        polls: true,
        events: true,
        resources: true,
        announcements: true,
        subCommunities: false,
      },
      contentSettings: {
        allowedPostTypes: ['text', 'image', 'video', 'link'],
        postingPermissions: 'member',
        moderationSettings: 'auto',
      },
      icon: null,
      coverImage: null,
    });
    setErrors({});
  };
  
  if (initialLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={WIZARD_COLORS.background} />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={WIZARD_COLORS.primary} />
          <Text style={styles.loadingText}>Loading creation wizard...</Text>
        </SafeAreaView>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={WIZARD_COLORS.background} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={WIZARD_COLORS.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Create Community</Text>
          
          <View style={styles.headerSpacer} />
        </View>
        
        {/* Step Indicator */}
        <StepIndicator
          currentStep={currentStep}
          totalSteps={WIZARD_STEPS.length}
          steps={WIZARD_STEPS}
        />
        
        {/* Step Content */}
        <KeyboardAvoidingView 
          style={styles.content} 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={100}
        >
          {renderStepContent()}
        </KeyboardAvoidingView>
        
        {/* Navigation Buttons */}
        <View style={styles.navigation}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={styles.backStepButton}
              onPress={handlePreviousStep}
            >
              <Icon name="chevron-back" size={16} color={WIZARD_COLORS.textSecondary} />
              <Text style={styles.backStepText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.nextButton,
              loading && styles.nextButtonDisabled
            ]}
            onPress={handleNextStep}
            disabled={loading}
          >
            <LinearGradient
              colors={[WIZARD_COLORS.primary, WIZARD_COLORS.primaryLight]}
              style={styles.nextButtonGradient}
            >
              {loading ? (
                <ActivityIndicator size="small" color={WIZARD_COLORS.textPrimary} />
              ) : (
                <>
                  <Text style={styles.nextButtonText}>
                    {currentStep === WIZARD_STEPS.length - 1 ? 'Create Community' : 'Continue'}
                  </Text>
                  <Icon name="chevron-forward" size={16} color={WIZARD_COLORS.textPrimary} />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Success Modal */}
        <SuccessModal
          visible={showSuccessModal}
          community={createdCommunity}
          onClose={handleCreateAnother}
          onViewCommunity={handleViewCommunity}
        />
      </SafeAreaView>
    </View>
  );
};

// ===============================
// PREMIUM STYLES
// ===============================
const styles = StyleSheet.create({
  // Layout
  container: {
    flex: 1,
    backgroundColor: WIZARD_COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: WIZARD_COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: WIZARD_COLORS.border,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: WIZARD_COLORS.elevated,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
  },
  headerSpacer: {
    width: 40,
  },
  
  // Step Indicator
  stepIndicator: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    backgroundColor: WIZARD_COLORS.surface,
  },
  stepTracker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: WIZARD_COLORS.stepInactive,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: WIZARD_COLORS.stepActive,
  },
  stepCompleted: {
    backgroundColor: WIZARD_COLORS.stepCompleted,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
  },
  stepNumberActive: {
    color: WIZARD_COLORS.textPrimary,
  },
  stepConnector: {
    width: 40,
    height: 2,
    backgroundColor: WIZARD_COLORS.stepInactive,
    marginHorizontal: 8,
  },
  stepConnectorCompleted: {
    backgroundColor: WIZARD_COLORS.stepCompleted,
  },
  stepInfo: {
    alignItems: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: WIZARD_COLORS.textSecondary,
    textAlign: 'center',
  },
  
  // Content
  content: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  stepDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: WIZARD_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  
  // Community Type Cards
  typesList: {
    flex: 1,
  },
  typeCard: {
    backgroundColor: WIZARD_COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: WIZARD_COLORS.border,
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: WIZARD_COLORS.primary,
    backgroundColor: WIZARD_COLORS.primary + '10',
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeName: {
    fontSize: 18,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  typeDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: WIZARD_COLORS.textSecondary,
    marginBottom: 12,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verificationText: {
    fontSize: 12,
    color: WIZARD_COLORS.info,
    fontWeight: '500',
  },
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  
  // Form Inputs
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: WIZARD_COLORS.elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: WIZARD_COLORS.textPrimary,
    borderWidth: 1,
    borderColor: WIZARD_COLORS.border,
  },
  textArea: {
    backgroundColor: WIZARD_COLORS.elevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: WIZARD_COLORS.textPrimary,
    borderWidth: 1,
    borderColor: WIZARD_COLORS.border,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: WIZARD_COLORS.danger,
  },
  inputHint: {
    fontSize: 12,
    color: WIZARD_COLORS.textTertiary,
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    color: WIZARD_COLORS.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  errorText: {
    fontSize: 12,
    color: WIZARD_COLORS.danger,
    marginTop: 4,
  },
  
  // Category Options
  categoryOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: WIZARD_COLORS.elevated,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: WIZARD_COLORS.border,
  },
  categoryChipSelected: {
    backgroundColor: WIZARD_COLORS.primary,
    borderColor: WIZARD_COLORS.primary,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: WIZARD_COLORS.textSecondary,
  },
  categoryChipTextSelected: {
    color: WIZARD_COLORS.textPrimary,
  },
  
  // Image Picker
  imagePicker: {
    marginBottom: 24,
  },
  imagePickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
    marginBottom: 8,
  },
  imagePickerContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: WIZARD_COLORS.elevated,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    backgroundColor: WIZARD_COLORS.elevated,
    borderWidth: 2,
    borderColor: WIZARD_COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: WIZARD_COLORS.textTertiary,
  },
  imageUploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: WIZARD_COLORS.elevated,
    borderRadius: 16,
    padding: 4,
  },
  
  // Privacy Options
  privacyOptions: {
    gap: 12,
  },
  privacyOption: {
    backgroundColor: WIZARD_COLORS.elevated,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: WIZARD_COLORS.border,
  },
  privacyOptionSelected: {
    borderColor: WIZARD_COLORS.primary,
    backgroundColor: WIZARD_COLORS.primary + '10',
  },
  privacyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  privacyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
    flex: 1,
  },
  privacyTitleSelected: {
    color: WIZARD_COLORS.primary,
  },
  privacyDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: WIZARD_COLORS.textSecondary,
  },
  
  // Features
  featuresList: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: WIZARD_COLORS.elevated,
    borderRadius: 12,
    padding: 16,
  },
  featureInfo: {
    flex: 1,
  },
  featureName: {
    fontSize: 16,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: WIZARD_COLORS.textSecondary,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: WIZARD_COLORS.border,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: WIZARD_COLORS.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: WIZARD_COLORS.textPrimary,
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  
  // Preview
  previewCard: {
    backgroundColor: WIZARD_COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: WIZARD_COLORS.border,
  },
  previewCoverImage: {
    width: '100%',
    height: 120,
    backgroundColor: WIZARD_COLORS.elevated,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
  },
  previewIconPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: WIZARD_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewIconText: {
    fontSize: 24,
    fontWeight: '700',
    color: WIZARD_COLORS.textPrimary,
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '700',
    color: WIZARD_COLORS.textPrimary,
    marginBottom: 4,
  },
  previewType: {
    fontSize: 14,
    color: WIZARD_COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  previewDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: WIZARD_COLORS.textSecondary,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  previewFeatures: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  previewFeaturesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
    marginBottom: 12,
  },
  previewFeaturesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewFeatureChip: {
    backgroundColor: WIZARD_COLORS.primary + '20',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  previewFeatureText: {
    fontSize: 12,
    color: WIZARD_COLORS.primary,
    fontWeight: '500',
  },
  
  // Navigation
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: WIZARD_COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: WIZARD_COLORS.border,
  },
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  backStepText: {
    fontSize: 16,
    color: WIZARD_COLORS.textSecondary,
  },
  nextButton: {
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
    maxWidth: 200,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
  },
  
  // Success Modal
  successOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  successBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confetti: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  confettiPiece: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: '20%',
  },
  successModal: {
    backgroundColor: WIZARD_COLORS.elevated,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    margin: 20,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: WIZARD_COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    lineHeight: 24,
    color: WIZARD_COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  communityName: {
    fontWeight: '600',
    color: WIZARD_COLORS.primary,
  },
  successStats: {
    flexDirection: 'row',
    gap: 32,
    marginBottom: 32,
  },
  successStat: {
    alignItems: 'center',
  },
  successStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: WIZARD_COLORS.success,
    marginBottom: 4,
  },
  successStatLabel: {
    fontSize: 12,
    color: WIZARD_COLORS.textTertiary,
    textAlign: 'center',
  },
  successActions: {
    width: '100%',
    gap: 12,
  },
  viewCommunityButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  viewCommunityGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  viewCommunityText: {
    fontSize: 16,
    fontWeight: '600',
    color: WIZARD_COLORS.textPrimary,
  },
  closeButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: WIZARD_COLORS.textSecondary,
  },
  
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: WIZARD_COLORS.textSecondary,
  },
});

export default CreateCommunity;