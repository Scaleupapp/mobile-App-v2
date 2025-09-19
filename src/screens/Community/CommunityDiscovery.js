// src/screens/Community/CommunityDiscovery.js
/**
 * Community Discovery Screen - Reddit x Discord Design
 * Matches the hybrid design language from CommunityHome
 * Enhanced with comprehensive API logging
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
  Vibration,
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
  Layout,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import Slider from '@react-native-community/slider';
// import Voice from '@react-native-voice/voice';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {
  searchCommunitiesApi,
  getCommunitiesApi,
  getCommunityTypesApi,
  getCommunityCategoriesApi,
  getCommunityDetailsApi,
  getCommunityLocationApi,
  getInstitutionalSuggestionsApi,
  bookmarkCommunityApi,
  removeBookmarkCommunityApi,
  joinCommunityApi,
  getTrendingCommunitiesApi,
  getFeaturedCommunitiesApi,
  getCommunityPreviewApi,
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
// REDDIT + DISCORD COLOR SYSTEM (Matching Homepage)
// ===============================
const REDDIT_DISCORD_COLORS = {
  // Reddit Colors
  redditOrange: '#FF4500',
  redditOrangeLight: '#FF5700',
  upvote: '#FF4500',
  downvote: '#7193FF',
  
  // Discord Colors
  blurple: '#5865F2',
  blurpleLight: '#7289DA',
  discordGreen: '#3BA55C',
  discordYellow: '#FAA61A',
  discordRed: '#ED4245',
  
  // Hybrid Dark Theme
  background: '#0E0E10',
  backgroundSecondary: '#1A1A1B',
  surface: '#272729',
  surfaceHover: '#343536',
  elevated: '#2F3136',
  
  // Text Hierarchy
  text: '#D7DADC',
  textBright: '#FFFFFF',
  textMuted: '#818384',
  textDim: '#565758',
  
  // Borders
  border: '#343536',
  borderLight: '#474748',
  divider: '#343536',
  
  // Status Colors
  online: '#3BA55C',
  idle: '#FAA61A',
  dnd: '#ED4245',
  offline: '#747F8D',
  
  // Interaction States
  hover: 'rgba(255, 255, 255, 0.08)',
  pressed: 'rgba(255, 255, 255, 0.04)',
  selected: 'rgba(88, 101, 242, 0.15)',
};

// ===============================
// COMPREHENSIVE API LOGGER
// ===============================
const APILogger = {
  log: (apiName, phase, data) => {
    const timestamp = new Date().toISOString();
    const logColor = phase === 'SUCCESS' ? '\x1b[32m' : phase === 'ERROR' ? '\x1b[31m' : '\x1b[33m';
    const resetColor = '\x1b[0m';
    
    console.log(`${logColor}[${timestamp}] DISCOVERY API: ${apiName} - ${phase}${resetColor}`);
    
    if (data) {
      console.log('📦 Data:', JSON.stringify(data, null, 2));
    }
    
    if (__DEV__) {
      console.log('=====================================');
    }
  },
  
  logRequest: (apiName, params) => {
    console.log(`\n🔍 DISCOVERY REQUEST: ${apiName}`);
    console.log('📤 Parameters:', params);
    console.log('🕐 Time:', new Date().toLocaleTimeString());
  },
  
  logResponse: (apiName, response) => {
    console.log(`\n✅ DISCOVERY RESPONSE: ${apiName}`);
    console.log('📥 Status:', response?.status);
    console.log('📊 Success:', response?.data?.success);
    
    if (response?.data?.data) {
      const data = response.data.data;
      if (Array.isArray(data)) {
        console.log('📋 Array Length:', data.length);
        console.log('🔍 First Item:', data[0]);
      } else if (data.communities) {
        console.log('🏘️ Communities Count:', data.communities.length);
        data.communities.forEach((comm, idx) => {
          if (idx < 5) { // Log first 5
            console.log(`  ${idx + 1}. ${comm.name} (ID: ${comm.id}, Members: ${comm.stats?.totalMembers})`);
          }
        });
      } else {
        console.log('📦 Data Structure:', Object.keys(data));
      }
    }
    
    console.log('🕐 Response Time:', new Date().toLocaleTimeString());
  },
  
  logError: (apiName, error) => {
    console.log(`\n❌ DISCOVERY ERROR: ${apiName}`);
    console.log('💥 Error Message:', error?.message);
    console.log('📛 Error Code:', error?.code);
    console.log('🔍 Error Response:', error?.response?.data);
    console.log('📚 Stack Trace:', error?.stack);
  },
  
  logUserAction: (action, data) => {
    console.log(`\n👤 USER ACTION: ${action}`);
    console.log('🎯 Action Data:', data);
    console.log('🕐 Time:', new Date().toLocaleTimeString());
    
    // Track with Mixpanel
    mixpanel.track(action, {
      ...data,
      timestamp: new Date().toISOString(),
      screen: 'CommunityDiscovery',
    });
  }
};

// ===============================
// UTILITY FUNCTIONS
// ===============================
const formatNumber = (num) => {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
};

const getRelativeTime = (date) => {
  if (!date) return 'Never';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return past.toLocaleDateString();
};

const getActivityStatus = (lastActive) => {
  if (!lastActive) return 'offline';
  const now = new Date();
  const lastActiveDate = new Date(lastActive);
  const diffMinutes = Math.floor((now - lastActiveDate) / 60000);
  
  if (diffMinutes < 5) return 'online';
  if (diffMinutes < 30) return 'idle';
  return 'offline';
};

// ===============================
// REDDIT-STYLE DISCOVERY CARD
// ===============================
// Update the RedditDiscoveryCard component (replace the existing one)
const RedditDiscoveryCard = ({community, onPress, onJoin, onBookmark, isBookmarked, index = 0, currentUserId}) => {
    const [isJoining, setIsJoining] = useState(false);
    const [voteStatus, setVoteStatus] = useState(null);
    const scaleAnim = useSharedValue(1);
    
    // Check membership status
    const isMember = community.isMember || community.userRole;
    const isOwner = community.isOwner || (community.owner === currentUserId || community.createdBy === currentUserId);
    const isAdmin = community.isAdmin;
    const isModerator = community.isModerator;
    
    // Determine button text and action based on privacy
    const getJoinButtonConfig = () => {
      if (isMember) {
        return null; // Don't show join button if already a member
      }
      
      switch (community.privacy) {
        case 'public':
        case 'open':
          return { text: 'Join', action: 'join' };
        case 'protected':
        case 'approval_required':
          return { text: 'Request', action: 'request' };
        case 'private':
        case 'invite_only':
          return { text: 'Private', action: 'private', disabled: true };
        case 'domain_restricted':
          return { text: 'Join', action: 'join' }; // If user can see it, they likely have access
        default:
          return { text: 'Join', action: 'join' };
      }
    };
    
    const joinButtonConfig = getJoinButtonConfig();
    
    const handleJoin = async (e) => {
      e?.stopPropagation();
      if (isJoining || !joinButtonConfig || joinButtonConfig.disabled) return;
      
      setIsJoining(true);
      scaleAnim.value = withSequence(
        withTiming(0.95, {duration: 100}),
        withSpring(1)
      );
      
      try {
        await onJoin?.(community, joinButtonConfig.action);
      } finally {
        setIsJoining(false);
      }
    };
    
    const handleVote = (type) => {
      setVoteStatus(voteStatus === type ? null : type);
      Vibration.vibrate(10);
    };
    
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{scale: scaleAnim.value}],
    }));
    
    // Fix: Use correct field names from API
    const karmaCount = community.stats?.postCount || 0;
    const memberCount = formatNumber(community.stats?.memberCount || 0);
    const isVerified = community.isVerified || community.verificationStatus === 'verified';
    const activityStatus = getActivityStatus(community.stats?.lastActivity);
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(index * 50).springify()}
        style={[styles.redditCard, animatedStyle]}
      >
        <Pressable 
          onPress={() => onPress?.(community)} 
          style={styles.redditCardPressable}
          onPressIn={() => {scaleAnim.value = withTiming(0.98, {duration: 100})}}
          onPressOut={() => {scaleAnim.value = withSpring(1)}}
        >
          {/* Upvote Section */}
          <View style={styles.voteSection}>
            <TouchableOpacity 
              onPress={() => handleVote('up')}
              style={styles.voteButton}
            >
              <Icon 
                name="arrow-up" 
                size={20} 
                color={voteStatus === 'up' ? REDDIT_DISCORD_COLORS.upvote : REDDIT_DISCORD_COLORS.textDim} 
              />
            </TouchableOpacity>
            <Text style={[
              styles.karmaCount,
              voteStatus === 'up' && styles.karmaUp,
              voteStatus === 'down' && styles.karmaDown
            ]}>
              {formatNumber(karmaCount)}
            </Text>
            <TouchableOpacity 
              onPress={() => handleVote('down')}
              style={styles.voteButton}
            >
              <Icon 
                name="arrow-down" 
                size={20} 
                color={voteStatus === 'down' ? REDDIT_DISCORD_COLORS.downvote : REDDIT_DISCORD_COLORS.textDim} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Content Section */}
          <View style={styles.redditContent}>
            {/* Header with Community Info */}
            <View style={styles.redditHeader}>
              <View style={styles.communityAvatarContainer}>
                {community.coverImage ? (
                  <Image source={{uri: community.coverImage}} style={styles.communityAvatar} />
                ) : (
                  <LinearGradient
                    colors={[REDDIT_DISCORD_COLORS.blurple, REDDIT_DISCORD_COLORS.blurpleLight]}
                    style={styles.communityAvatarPlaceholder}
                  >
                    <Text style={styles.avatarText}>
                      {community.name.charAt(0).toUpperCase()}
                    </Text>
                  </LinearGradient>
                )}
                <View style={[styles.activityDot, styles[`${activityStatus}Status`]]} />
              </View>
              
              <View style={styles.headerInfo}>
                <View style={styles.headerTop}>
                  <Text style={styles.subredditName}>r/{community.name.toLowerCase().replace(/\s+/g, '')}</Text>
                  {isVerified && (
                    <MaterialIcons name="verified" size={14} color={REDDIT_DISCORD_COLORS.blurple} />
                  )}
                  {/* Show ownership/role badges */}
                  {isOwner && (
                    <View style={styles.ownerBadge}>
                      <Text style={styles.ownerBadgeText}>OWNER</Text>
                    </View>
                  )}
                  {!isOwner && isAdmin && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminBadgeText}>ADMIN</Text>
                    </View>
                  )}
                  {!isOwner && !isAdmin && isModerator && (
                    <View style={styles.modBadge}>
                      <Text style={styles.modBadgeText}>MOD</Text>
                    </View>
                  )}
                </View>
                <View style={styles.headerMeta}>
                  <Text style={styles.memberCount}>{memberCount} members</Text>
                  <Text style={styles.dotSeparator}>•</Text>
                  <Text style={styles.postTime}>{getRelativeTime(community.createdAt)}</Text>
                  {isMember && (
                    <>
                      <Text style={styles.dotSeparator}>•</Text>
                      <Text style={styles.joinedText}>Joined</Text>
                    </>
                  )}
                </View>
              </View>
              
              {/* Action Buttons */}
              <View style={styles.headerActions}>
                <TouchableOpacity 
                  style={styles.bookmarkButton}
                  onPress={() => onBookmark?.(community)}
                >
                  <Icon 
                    name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                    size={18} 
                    color={isBookmarked ? REDDIT_DISCORD_COLORS.discordYellow : REDDIT_DISCORD_COLORS.textMuted} 
                  />
                </TouchableOpacity>
                
                {joinButtonConfig && (
                  <TouchableOpacity 
                    style={[
                      styles.joinChip,
                      joinButtonConfig.action === 'request' && styles.requestChip,
                      joinButtonConfig.disabled && styles.disabledChip
                    ]}
                    onPress={handleJoin}
                    disabled={isJoining || joinButtonConfig.disabled}
                  >
                    {isJoining ? (
                      <ActivityIndicator size="small" color={REDDIT_DISCORD_COLORS.textBright} />
                    ) : (
                      <>
                        {joinButtonConfig.action !== 'private' && (
                          <Icon 
                            name={joinButtonConfig.action === 'request' ? "mail-outline" : "add"} 
                            size={14} 
                            color={REDDIT_DISCORD_COLORS.textBright} 
                          />
                        )}
                        <Text style={styles.joinChipText}>{joinButtonConfig.text}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
                
                {isMember && (
                  <View style={styles.memberChip}>
                    <Icon name="checkmark-circle" size={14} color={REDDIT_DISCORD_COLORS.discordGreen} />
                    <Text style={styles.memberChipText}>Member</Text>
                  </View>
                )}
              </View>
            </View>
            
            {/* Title */}
            <Text style={styles.communityTitle} numberOfLines={2}>
              {community.name}
            </Text>
            
            {/* Description */}
            {community.description && (
              <Text style={styles.communityDescription} numberOfLines={3}>
                {community.description}
              </Text>
            )}
            
            {/* Tags */}
            <View style={styles.tagContainer}>
              {community.category && (
                <View style={[styles.categoryTag, {backgroundColor: REDDIT_DISCORD_COLORS.blurple + '20'}]}>
                  <Text style={styles.tagText}>{community.category}</Text>
                </View>
              )}
              {community.type && (
                <View style={[styles.typeTag, {backgroundColor: REDDIT_DISCORD_COLORS.elevated}]}>
                  <Text style={styles.tagText}>{community.type}</Text>
                </View>
              )}
              {community.stats?.activeWeeklyUsers > 10 && (
                <View style={[styles.activityTag, {backgroundColor: REDDIT_DISCORD_COLORS.discordGreen + '20'}]}>
                  <Text style={styles.tagText}>🔥 Active</Text>
                </View>
              )}
              {community.privacy === 'private' && (
                <View style={[styles.privacyTag, {backgroundColor: REDDIT_DISCORD_COLORS.discordRed + '20'}]}>
                  <Icon name="lock-closed" size={10} color={REDDIT_DISCORD_COLORS.discordRed} />
                  <Text style={[styles.tagText, {color: REDDIT_DISCORD_COLORS.discordRed}]}>Private</Text>
                </View>
              )}
            </View>
            
            {/* Footer Actions */}
            <View style={styles.redditFooter}>
              <TouchableOpacity style={styles.footerAction}>
                <Icon name="chatbubble-outline" size={16} color={REDDIT_DISCORD_COLORS.textMuted} />
                <Text style={styles.footerText}>{formatNumber(community.stats?.postCount || 0)} posts</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.footerAction}>
                <Icon name="people-outline" size={16} color={REDDIT_DISCORD_COLORS.textMuted} />
                <Text style={styles.footerText}>{formatNumber(community.stats?.activeWeeklyUsers || 0)} active</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.footerAction}>
                <Icon name="share-outline" size={16} color={REDDIT_DISCORD_COLORS.textMuted} />
                <Text style={styles.footerText}>Share</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.footerAction}>
                <Feather name="more-horizontal" size={16} color={REDDIT_DISCORD_COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

// ===============================
// FILTER CHIP COMPONENT
// ===============================
const FilterChip = ({label, icon, isActive, onPress, count}) => {
  const scaleAnim = useSharedValue(1);
  
  const handlePress = () => {
    scaleAnim.value = withSequence(
      withTiming(0.9, {duration: 100}),
      withSpring(1)
    );
    onPress();
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scaleAnim.value}],
  }));
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.filterChip, isActive && styles.filterChipActive]}
        onPress={handlePress}
      >
        {icon && (
          <Icon 
            name={icon} 
            size={14} 
            color={isActive ? REDDIT_DISCORD_COLORS.textBright : REDDIT_DISCORD_COLORS.textMuted} 
          />
        )}
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View style={styles.filterChipBadge}>
            <Text style={styles.filterChipBadgeText}>{count}</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

// ===============================
// MAIN DISCOVERY COMPONENT
// ===============================
const CommunityDiscovery = ({navigation, route}) => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);
  // Add safe route params handling
  const params = route?.params || {};
  const { 
    communityId = null,
    searchQuery: initialSearchQuery = '',
    filter: initialFilter = null
  } = params;

   useEffect(() => {
  console.log('\n🚀 COMMUNITY DISCOVERY MOUNTED', {
    communityId,
    initialSearchQuery, 
    initialFilter,
    userData: userData?.id,
    routeParamsExists: !!route?.params
  });
}, []);
  
  
  console.log('\n🚀 COMMUNITY DISCOVERY MOUNTED');
  console.log('👤 User Data:', userData);
  console.log('🛣️ Route Params:', route?.params);
  
  // ===============================
  // STATE MANAGEMENT
  // ===============================
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [voiceSearchActive, setVoiceSearchActive] = useState(false);
  
  // Filter States
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [sortBy, setSortBy] = useState('hot'); // hot, new, top, rising
  const [showFilters, setShowFilters] = useState(false);
  
  // Data States
  const [communities, setCommunities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [communityTypes, setCommunityTypes] = useState([]);
  const [bookmarkedCommunities, setBookmarkedCommunities] = useState(new Set());
  
  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  
  // Animation Values
  const searchScale = useSharedValue(1);
  const filterHeight = useSharedValue(0);
  
  // Refs
  const searchTimeoutRef = useRef(null);
  const flatListRef = useRef(null);
  
  // ===============================
  // LIFECYCLE & INITIALIZATION
  // ===============================
  useEffect(() => {
    console.log('\n🔄 DISCOVERY INITIALIZATION STARTED');
    APILogger.logUserAction('Discovery Screen Opened', {
      source: route?.params?.source || 'direct',
      user_id: userData?.id,
    });
    
    initializeDiscovery();
    // setupVoiceSearch();
    loadUserPreferences();
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      // Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);
  
  useEffect(() => {
    if (searchQuery) {
      handleDebouncedSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);
  
  useEffect(() => {
    console.log(`\n🔄 Filters Changed - Categories: ${selectedCategories.length}, Types: ${selectedTypes.length}`);
    if (selectedCategories.length || selectedTypes.length) {
      performSearch(searchQuery || '', true);
    }
  }, [selectedCategories, selectedTypes]);
  
  useEffect(() => {
    console.log(`\n🔄 Sort Changed to: ${sortBy}`);
    performSearch(searchQuery || '', true);
  }, [sortBy]);
  
  const initializeDiscovery = async () => {
    console.log('\n📊 INITIALIZING DISCOVERY DATA...');
    setInitialLoading(true);
    
    try {
      const promises = [
        fetchCategories(),
        fetchCommunityTypes(),
        fetchInitialCommunities(),
      ];
      
      const results = await Promise.all(promises);
      console.log('\n✅ DISCOVERY INITIALIZATION COMPLETE');
      console.log('📊 Summary:', {
        categories: categories.length,
        types: communityTypes.length,
        communities: communities.length,
      });
    } catch (error) {
      console.error('\n❌ DISCOVERY INITIALIZATION FAILED:', error);
    } finally {
      setInitialLoading(false);
    }
  };
  
  // const setupVoiceSearch = async () => {
  //   try {
  //     Voice.onSpeechStart = () => {
  //       console.log('🎤 Voice search started');
  //       setVoiceSearchActive(true);
  //       searchScale.value = withSpring(1.1);
  //     };
      
  //     Voice.onSpeechEnd = () => {
  //       console.log('🎤 Voice search ended');
  //       setVoiceSearchActive(false);
  //       searchScale.value = withSpring(1);
  //     };
      
  //     Voice.onSpeechResults = (e) => {
  //       const spokenText = e.value[0];
  //       console.log('🎤 Voice result:', spokenText);
  //       setSearchQuery(spokenText);
  //     };
      
  //     Voice.onSpeechError = (e) => {
  //       console.log('🎤 Voice error:', e);
  //       setVoiceSearchActive(false);
  //       searchScale.value = withSpring(1);
  //     };
  //   } catch (error) {
  //     console.log('🎤 Voice setup error:', error);
  //   }
  // };
  
  const loadUserPreferences = async () => {
    try {
      const bookmarks = await AsyncStorage.getItem('discovery_bookmarks');
      if (bookmarks) {
        setBookmarkedCommunities(new Set(JSON.parse(bookmarks)));
        console.log('📚 Loaded bookmarks:', JSON.parse(bookmarks).length);
      }
    } catch (error) {
      console.log('📚 Preferences loading error:', error);
    }
  };
  
  // ===============================
  // API FUNCTIONS WITH LOGGING
  // ===============================
  const fetchCategories = async () => {
    const apiName = 'getCommunityCategories';
    const params = {includeCount: true, sortBy: 'popularity'};
    
    APILogger.logRequest(apiName, params);
    
    try {
      const response = await getCommunityTypesApi(params);
      APILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        const categoriesData = response.data.data?.categories || [];
        setCategories(categoriesData);
        console.log(`✅ Fetched ${categoriesData.length} categories`);
        return categoriesData;
      }
    } catch (error) {
      APILogger.logError(apiName, error);
    }
    return [];
  };
  
  const fetchCommunityTypes = async () => {
    const apiName = 'getCommunityTypes';
    const params = {};
    
    APILogger.logRequest(apiName, params);
    
    try {
      const response = await getCommunityTypesApi(params);
      APILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        const typesData = response.data.data?.types || [
          {id: 'public', name: 'Public', icon: 'globe-outline'},
          {id: 'private', name: 'Private', icon: 'lock-closed-outline'},
          {id: 'restricted', name: 'Restricted', icon: 'shield-outline'},
        ];
        setCommunityTypes(typesData);
        console.log(`✅ Fetched ${typesData.length} community types`);
        return typesData;
      }
    } catch (error) {
      APILogger.logError(apiName, error);
    }
    return [];
  };
  
  const fetchInitialCommunities = async () => {
    const apiName = 'getCommunitiesApi';
    const params = {
      page: 1,
      limit: 20,
      sortBy: sortBy === 'hot' ? 'trending' : sortBy,
      includeStats: true,
    };
    
    APILogger.logRequest(apiName, params);
    
    try {
      const response = await getCommunitiesApi(params);
      APILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        const communitiesData = response.data.data?.communities || [];
        setCommunities(communitiesData);
        setHasMore(response.data.data?.hasMore || false);
        console.log(`✅ Fetched ${communitiesData.length} initial communities`);
        return communitiesData;
      }
    } catch (error) {
      APILogger.logError(apiName, error);
    }
    return [];
  };
  
  const performSearch = async (query, reset = true) => {
    const apiName = 'searchCommunitiesApi';
    const params = {
      query: query.trim(),
      page: reset ? 1 : page + 1,
      limit: 20,
      categories: selectedCategories,
      types: selectedTypes,
      sortBy: sortBy === 'hot' ? 'trending' : sortBy,
    };
    
    APILogger.logRequest(apiName, params);
    setIsSearching(true);
    
    try {
      const response = await searchCommunitiesApi(params);
      APILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        const results = response.data.data?.communities || [];
        
        if (reset) {
          setSearchResults(results);
          setCommunities(results);
          setPage(1);
        } else {
          setSearchResults(prev => [...prev, ...results]);
          setCommunities(prev => [...prev, ...results]);
          setPage(prev => prev + 1);
        }
        
        setHasMore(response.data.data?.hasMore || false);
        
        APILogger.logUserAction('Search Performed', {
          query,
          results_count: results.length,
          filters: {categories: selectedCategories, types: selectedTypes},
        });
        
        console.log(`✅ Search completed: ${results.length} results`);
      }
    } catch (error) {
      APILogger.logError(apiName, error);
    } finally {
      setIsSearching(false);
    }
  };
  
  // ===============================
  // EVENT HANDLERS
  // ===============================
  const handleDebouncedSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
  }, [searchQuery, selectedCategories, selectedTypes, sortBy]);
  
  // const handleVoiceSearch = async () => {
  //   try {
  //     if (voiceSearchActive) {
  //       await Voice.stop();
  //     } else {
  //       await Voice.start('en-US');
  //     }
  //   } catch (error) {
  //     console.log('Voice search error:', error);
  //   }
  // };
  
  const handleCommunityPress = useCallback((community) => {
    APILogger.logUserAction('Community Selected', {
      community_id: community.id,
      community_name: community.name,
      source: 'discovery',
    });
    
    navigation.navigate(Routes.CommunityProfile, {
      communityId: community.id,
      community: community,
    });
  }, [navigation]);
  
  const handleJoinCommunity = useCallback(async (community, action = 'join') => {
    console.log(`\n🤝 ${action === 'request' ? 'Requesting to join' : 'Joining'} community: ${community.name}`);
    
    try {
      let response;
      
      if (action === 'request') {
        // For protected communities, create a join request
        response = await joinCommunityApi(community.id, {
          requestType: 'join_request',
          joinReason: 'Interested in joining this community',
        });
      } else {
        // For public communities, direct join
        response = await joinCommunityApi(community.id, {
          autoJoin: community.privacy === 'public' || community.privacy === 'open',
        });
      }
      
      APILogger.logResponse('joinCommunity', response);
      
      if (response?.data?.success) {
        // Update local state
        setCommunities(prev => 
          prev.map(c => c.id === community.id 
            ? {...c, isMember: true, userRole: 'member'}
            : c
          )
        );
        
        if (action === 'request') {
          Alert.alert(
            'Request Sent',
            `Your request to join ${community.name} has been sent. You'll be notified when it's approved.`,
            [{text: 'OK'}]
          );
        } else {
          Alert.alert(
            'Success',
            `Welcome to ${community.name}!`,
            [{text: 'OK'}]
          );
        }
        
        APILogger.logUserAction('Community Joined', {
          community_id: community.id,
          community_name: community.name,
          action_type: action,
        });
      }
    } catch (error) {
      APILogger.logError('joinCommunity', error);
      
      const errorMessage = error?.response?.data?.message || 
        (action === 'request' ? 'Failed to send join request' : 'Failed to join community');
      
      Alert.alert('Error', errorMessage);
    }
  }, []);
  
  const handleBookmarkToggle = useCallback(async (community) => {
    const isBookmarked = bookmarkedCommunities.has(community.id);
    
    try {
      if (isBookmarked) {
        await removeBookmarkCommunityApi(community.id);
        setBookmarkedCommunities(prev => {
          const newSet = new Set(prev);
          newSet.delete(community.id);
          AsyncStorage.setItem('discovery_bookmarks', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
      } else {
        await bookmarkCommunityApi(community.id);
        setBookmarkedCommunities(prev => {
          const newSet = new Set([...prev, community.id]);
          AsyncStorage.setItem('discovery_bookmarks', JSON.stringify(Array.from(newSet)));
          return newSet;
        });
      }
      
      APILogger.logUserAction('Bookmark Toggled', {
        community_id: community.id,
        action: isBookmarked ? 'removed' : 'added',
      });
    } catch (error) {
      APILogger.logError('bookmarkToggle', error);
    }
  }, [bookmarkedCommunities]);
  
  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      console.log('\n📄 Loading more communities...');
      setLoadingMore(true);
      performSearch(searchQuery, false);
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, searchQuery]);
  
  const handleRefresh = useCallback(async () => {
    console.log('\n🔄 Refreshing discovery...');
    setRefreshing(true);
    await performSearch(searchQuery || '', true);
    setRefreshing(false);
  }, [searchQuery]);
  
  const handleToggleFilters = () => {
    const newShowFilters = !showFilters;
    setShowFilters(newShowFilters);
    filterHeight.value = withSpring(newShowFilters ? 150 : 0);
  };
  
  // ===============================
  // ANIMATION STYLES
  // ===============================
  const searchAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: searchScale.value}],
  }));
  
  const filterAnimatedStyle = useAnimatedStyle(() => ({
    height: filterHeight.value,
    opacity: interpolate(filterHeight.value, [0, 150], [0, 1]),
  }));
  
  // ===============================
  // RENDER FUNCTIONS
  // ===============================
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Search Bar */}
      <Animated.View style={[styles.searchContainer, searchAnimatedStyle]}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={REDDIT_DISCORD_COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search communities..."
            placeholderTextColor={REDDIT_DISCORD_COLORS.textDim}
            returnKeyType="search"
            onSubmitEditing={() => performSearch(searchQuery)}
          />
          {isSearching && (
            <ActivityIndicator size="small" color={REDDIT_DISCORD_COLORS.blurple} />
          )}
          {/* <TouchableOpacity
            style={[styles.voiceButton, voiceSearchActive && styles.voiceButtonActive]}
            onPress={handleVoiceSearch}
          >
            <Icon 
              name={voiceSearchActive ? "mic" : "mic-outline"} 
              size={18} 
              color={voiceSearchActive ? REDDIT_DISCORD_COLORS.discordRed : REDDIT_DISCORD_COLORS.textMuted} 
            />
          </TouchableOpacity> */}
        </View>
        
        <TouchableOpacity
          style={styles.filterToggleButton}
          onPress={handleToggleFilters}
        >
          <Icon name="options" size={20} color={REDDIT_DISCORD_COLORS.textBright} />
          {(selectedCategories.length + selectedTypes.length) > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {selectedCategories.length + selectedTypes.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
      
      {/* Sort Bar (Reddit Style) */}
      <View style={styles.sortBar}>
        {[
          {id: 'hot', label: 'Hot', icon: 'flame'},
          {id: 'new', label: 'New', icon: 'sparkles'},
          {id: 'top', label: 'Top', icon: 'trending-up'},
          {id: 'rising', label: 'Rising', icon: 'rocket'},
        ].map(sort => (
          <TouchableOpacity
            key={sort.id}
            style={[styles.sortButton, sortBy === sort.id && styles.sortButtonActive]}
            onPress={() => setSortBy(sort.id)}
          >
            <Icon 
              name={sort.icon} 
              size={16} 
              color={sortBy === sort.id ? REDDIT_DISCORD_COLORS.textBright : REDDIT_DISCORD_COLORS.textMuted} 
            />
            <Text style={[styles.sortText, sortBy === sort.id && styles.sortTextActive]}>
              {sort.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Filters (Discord Style) */}
      <Animated.View style={[styles.filtersContainer, filterAnimatedStyle]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Categories</Text>
            <View style={styles.filterChips}>
              {categories.map(category => (
                <FilterChip
                  key={category.id}
                  label={category.name}
                  isActive={selectedCategories.includes(category.id)}
                  onPress={() => {
                    setSelectedCategories(prev =>
                      prev.includes(category.id)
                        ? prev.filter(id => id !== category.id)
                        : [...prev, category.id]
                    );
                  }}
                  count={category.count}
                />
              ))}
            </View>
          </View>
          
          <View style={styles.filterSection}>
            <Text style={styles.filterSectionTitle}>Types</Text>
            <View style={styles.filterChips}>
              {communityTypes.map(type => (
                <FilterChip
                  key={type.id}
                  label={type.name}
                  icon={type.icon}
                  isActive={selectedTypes.includes(type.id)}
                  onPress={() => {
                    setSelectedTypes(prev =>
                      prev.includes(type.id)
                        ? prev.filter(id => id !== type.id)
                        : [...prev, type.id]
                    );
                  }}
                />
              ))}
            </View>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
  
  const renderCommunity = ({item, index}) => (
    <RedditDiscoveryCard
      community={item}
      onPress={handleCommunityPress}
      onJoin={handleJoinCommunity}
      onBookmark={handleBookmarkToggle}
      isBookmarked={bookmarkedCommunities.has(item.id)}
      index={index}
      currentUserId={userData?.id || userData?.userId}
    />
  );
  
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Icon name="planet-outline" size={64} color={REDDIT_DISCORD_COLORS.textDim} />
      <Text style={styles.emptyTitle}>No communities found</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery 
          ? 'Try different search terms or filters'
          : 'Be the first to create a community!'
        }
      </Text>
    </View>
  );
  
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={REDDIT_DISCORD_COLORS.blurple} />
        <Text style={styles.loadingFooterText}>Loading more...</Text>
      </View>
    );
  };
  
  if (initialLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={REDDIT_DISCORD_COLORS.background} />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={REDDIT_DISCORD_COLORS.blurple} />
          <Text style={styles.loadingText}>Discovering communities...</Text>
        </SafeAreaView>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={REDDIT_DISCORD_COLORS.background} />
      
      <SafeAreaView style={styles.safeArea}>
        {/* Header Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={REDDIT_DISCORD_COLORS.textBright} />
          </TouchableOpacity>
          
          <Text style={styles.topBarTitle}>Discover Communities</Text>
          
          <View style={styles.topBarActions}>
            <TouchableOpacity style={styles.topBarButton}>
              <Feather name="bookmark" size={20} color={REDDIT_DISCORD_COLORS.textBright} />
              {bookmarkedCommunities.size > 0 && (
                <View style={styles.topBarBadge}>
                  <Text style={styles.topBarBadgeText}>{bookmarkedCommunities.size}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Main Content */}
        <FlatList
          ref={flatListRef}
          data={searchQuery ? searchResults : communities}
          renderItem={renderCommunity}
          keyExtractor={(item) => item.id.toString()}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={renderFooter}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={REDDIT_DISCORD_COLORS.blurple}
              colors={[REDDIT_DISCORD_COLORS.blurple]}
            />
          }
        />
      </SafeAreaView>
    </View>
  );
};

// ===============================
// STYLES
// ===============================
const styles = StyleSheet.create({
  // Container
  container: {
    flex: 1,
    backgroundColor: REDDIT_DISCORD_COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.textMuted,
  },
  listContent: {
    paddingBottom: 100,
  },
  
  // Top Bar (Discord Style)
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    borderBottomWidth: 1,
    borderBottomColor: REDDIT_DISCORD_COLORS.border,
  },
  backButton: {
    padding: 4,
  },
  topBarTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Semibold',
    color: REDDIT_DISCORD_COLORS.textBright,
    flex: 1,
    marginLeft: 16,
  },
  topBarActions: {
    flexDirection: 'row',
    gap: 16,
  },
  topBarButton: {
    position: 'relative',
    padding: 4,
  },
  topBarBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: REDDIT_DISCORD_COLORS.discordYellow,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBarBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.background,
  },
  
  // Header Container
  headerContainer: {
    backgroundColor: REDDIT_DISCORD_COLORS.backgroundSecondary,
    paddingBottom: 8,
  },
  
  // Search Container
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: REDDIT_DISCORD_COLORS.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: REDDIT_DISCORD_COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: REDDIT_DISCORD_COLORS.text,
    paddingVertical: 0,
  },
  voiceButton: {
    padding: 4,
    marginLeft: 8,
  },
  voiceButtonActive: {
    backgroundColor: REDDIT_DISCORD_COLORS.discordRed + '30',
    borderRadius: 12,
  },
  filterToggleButton: {
    width: 44,
    height: 44,
    backgroundColor: REDDIT_DISCORD_COLORS.surface,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: REDDIT_DISCORD_COLORS.border,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: REDDIT_DISCORD_COLORS.discordRed,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  
  // Sort Bar (Reddit Style)
  sortBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: REDDIT_DISCORD_COLORS.surface,
    gap: 6,
  },
  sortButtonActive: {
    backgroundColor: REDDIT_DISCORD_COLORS.blurple,
  },
  sortText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.textMuted,
  },
  sortTextActive: {
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  
  // Filters Container
  filtersContainer: {
    backgroundColor: REDDIT_DISCORD_COLORS.surface,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  filterSection: {
    padding: 12,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Semibold',
    color: REDDIT_DISCORD_COLORS.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  filterChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    gap: 4,
  },
  filterChipActive: {
    backgroundColor: REDDIT_DISCORD_COLORS.blurple,
  },
  filterChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.textMuted,
  },
  filterChipTextActive: {
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  filterChipBadge: {
    backgroundColor: REDDIT_DISCORD_COLORS.discordYellow,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    marginLeft: 4,
  },
  filterChipBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.background,
  },
  
  // Reddit Card Styles
  redditCard: {
    backgroundColor: REDDIT_DISCORD_COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: REDDIT_DISCORD_COLORS.border,
    overflow: 'hidden',
  },
  redditCardPressable: {
    flexDirection: 'row',
    padding: 12,
  },
  voteSection: {
    alignItems: 'center',
    marginRight: 12,
  },
  voteButton: {
    padding: 4,
  },
  karmaCount: {
    fontSize: 13,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.text,
    marginVertical: 2,
  },
  karmaUp: {
    color: REDDIT_DISCORD_COLORS.upvote,
  },
  karmaDown: {
    color: REDDIT_DISCORD_COLORS.downvote,
  },
  redditContent: {
    flex: 1,
  },
  redditHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  communityAvatarContainer: {
    position: 'relative',
    marginRight: 8,
  },
  communityAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  communityAvatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  activityDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: REDDIT_DISCORD_COLORS.surface,
  },
  onlineStatus: {
    backgroundColor: REDDIT_DISCORD_COLORS.online,
  },
  idleStatus: {
    backgroundColor: REDDIT_DISCORD_COLORS.idle,
  },
  offlineStatus: {
    backgroundColor: REDDIT_DISCORD_COLORS.offline,
  },
  headerInfo: {
    flex: 1,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  subredditName: {
    fontSize: 12,
    fontFamily: 'Inter-Semibold',
    color: REDDIT_DISCORD_COLORS.text,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  memberCount: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: REDDIT_DISCORD_COLORS.textMuted,
  },
  dotSeparator: {
    fontSize: 11,
    color: REDDIT_DISCORD_COLORS.textDim,
    marginHorizontal: 4,
  },
  postTime: {
    fontSize: 11,
    fontFamily: 'Inter-Regular',
    color: REDDIT_DISCORD_COLORS.textMuted,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookmarkButton: {
    padding: 4,
  },
  joinChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: REDDIT_DISCORD_COLORS.blurple,
    borderRadius: 12,
    gap: 4,
  },
  joinChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Semibold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  communityTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Semibold',
    color: REDDIT_DISCORD_COLORS.text,
    marginBottom: 8,
  },
  communityDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: REDDIT_DISCORD_COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.text,
  },
  redditFooter: {
    flexDirection: 'row',
    gap: 16,
  },
  footerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.textMuted,
  },
  
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Semibold',
    color: REDDIT_DISCORD_COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: REDDIT_DISCORD_COLORS.textMuted,
    textAlign: 'center',
  },
  
  // Loading Footer
  loadingFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },

  // Add these styles to the existing StyleSheet
ownerBadge: {
    backgroundColor: REDDIT_DISCORD_COLORS.discordYellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  ownerBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.background,
  },
  adminBadge: {
    backgroundColor: REDDIT_DISCORD_COLORS.blurple,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  adminBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  modBadge: {
    backgroundColor: REDDIT_DISCORD_COLORS.discordGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
  },
  modBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: REDDIT_DISCORD_COLORS.discordGreen + '20',
    borderRadius: 12,
    gap: 4,
  },
  memberChipText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.discordGreen,
  },
  requestChip: {
    backgroundColor: REDDIT_DISCORD_COLORS.discordYellow,
  },
  disabledChip: {
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    opacity: 0.6,
  },
  joinedText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.discordGreen,
  },
  privacyTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  loadingFooterText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.textMuted,
  },
});

export default CommunityDiscovery;