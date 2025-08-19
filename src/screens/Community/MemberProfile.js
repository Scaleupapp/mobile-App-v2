// src/screens/Community/MemberProfile.js
/**
 * Member Profile Screen - Community Member Detail View
 * Fixed version with proper API calls and imports
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
  Share,
  Vibration,
  SectionList,
  ImageBackground,
  Linking,
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
  useAnimatedScrollHandler,
  interpolateColor,
  Extrapolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {useToast} from '../../components/CustomToast';

// Import APIs from apiService - INCLUDING COMMUNITY APIS
import {
  // Profile APIs
  getProfile,
  getProfiledetails,
  updateProfile,
  
  // Follow/Unfollow APIs
  followUser,
  unlfollowUser,
  
  // Block/Unblock APIs
  bockUser,
  userUnBlock,
  blockUSerList,
  
  // Report API
  ReportPost,
  
  // Messaging APIs
  createConversation,
  sendChat,
  
  // Inner Circle APIs
  sendInnerCircle,
  myInnerCircleAPI,
  
  // Community Member APIs - THESE EXIST!
  getCommunityMemberDetailsApi,
  getCommunityMemberAnalyticsApi,
  updateCommunityMemberRoleApi,
  updateCommunityMemberImpactPointsApi,
  suspendCommunityMemberApi,
  banCommunityMemberApi,
  
  // Additional useful APIs
  getFollowerlist,
  getFollowinglist,
  UserAnalytics,
} from '../../services/apiService';

import {useDispatch, useSelector} from 'react-redux';
// FIXED IMPORTS - Import Ionicons as default
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import Entypo from 'react-native-vector-icons/Entypo';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Octicons from 'react-native-vector-icons/Octicons';
import mixpanel from '../../helper/mixpanelClient';
import Routes from '../../helper/routes';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// ===============================
// CONSTANTS & THEME
// ===============================
const HEADER_HEIGHT = nh(280);
const COLLAPSED_HEIGHT = nh(100);
const TAB_HEIGHT = nh(50);

const THEME = {
  // Primary colors (Reddit + Discord hybrid)
  primary: '#FF4500',
  primaryLight: '#FF5700',
  primaryDark: '#C44569',
  
  // Discord colors
  discord: '#5865F2',
  discordLight: '#7289DA',
  discordDark: '#4752C4',
  
  // Background colors
  bgPrimary: '#0A0E1A',
  bgSecondary: '#141B2D',
  bgTertiary: '#1C2333',
  bgCard: '#232937',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B8BEC8',
  textTertiary: '#6B7280',
  
  // Status colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Role colors
  owner: '#FFD700',
  admin: '#FF6B6B',
  moderator: '#4ECDC4',
  contributor: '#95E1D3',
  member: '#B8BEC8',
  
  // Special
  verified: '#1DA1F2',
  online: '#43B581',
  offline: '#747F8D',
  idle: '#FAA61A',
  dnd: '#F04747',
};

// Role hierarchy for permissions
const ROLE_HIERARCHY = {
  owner: 5,
  admin: 4,
  moderator: 3,
  contributor: 2,
  member: 1,
  none: 0,
};

// ===============================
// MAIN COMPONENT
// ===============================
const MemberProfile = ({navigation, route}) => {
  const {showToast} = useToast();
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state?.userData);
  
  // Extract params
  const {
    memberId,
    communityId,
    communityName = 'Community',
    fromScreen = 'CommunityMembers',
  } = route.params || {};

  // ===============================
  // STATE MANAGEMENT
  // ===============================
  const [memberData, setMemberData] = useState({
    // Community context
    communityMember: null,
    communityRole: null,
    impactPoints: 0,
    joinedAt: null,
    contributions: {},
    
    // Platform context
    profile: null,
    posts: [],
    followers: [],
    following: [],
    
    // Analytics (admin only)
    analytics: null,
    
    // Relationship states
    isFollowing: false,
    isBlocked: false,
    isInnerCircle: false,
    isPendingInnerCircle: false,
  });

  const [uiState, setUiState] = useState({
    loading: true,
    refreshing: false,
    activeTab: 'overview',
    hasAdminAccess: false,
    hasModAccess: false,
    error: null,
    
    // Sub-loading states
    loadingPosts: false,
    loadingAnalytics: false,
    loadingFollow: false,
    
    // Pagination
    postsPage: 1,
    hasMorePosts: true,
  });

  const [modalState, setModalState] = useState({
    showRoleModal: false,
    showPointsModal: false,
    showReportModal: false,
    showBlockModal: false,
    showMoreOptions: false,
  });

  const [roleChangeData, setRoleChangeData] = useState({
    newRole: '',
    reason: '',
  });

  const [pointsAdjustment, setPointsAdjustment] = useState({
    points: 0,
    reason: '',
    actionType: 'add',
  });

  // ===============================
  // ANIMATION VALUES
  // ===============================
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  // ===============================
  // DATA FETCHING
  // ===============================
  const fetchMemberData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setUiState(prev => ({...prev, loading: true, error: null}));
    }

    try {
      // Prepare all API calls
      const apiCalls = [];
      
      // 1. Try to get community member details if communityId exists
      if (communityId) {
        apiCalls.push(
          getCommunityMemberDetailsApi(communityId, memberId).catch(err => {
            console.log('Community member not found, continuing...', err.response?.data);
            return null;
          })
        );
      } else {
        apiCalls.push(Promise.resolve(null));
      }
      
      // 2. Get platform profile - FIXED: Don't pass memberId as parameter
      apiCalls.push(
        getProfile(memberId).catch(err => {
          console.log('Profile fetch error:', err);
          return null;
        })
      );
      
      // 3. Get blocked users list
      apiCalls.push(
        blockUSerList().catch(() => null)
      );
      
      // 4. Get inner circle list
      apiCalls.push(
        myInnerCircleAPI(1).catch(() => null)
      );

      // Execute all API calls in parallel
      const [
        communityMemberResponse,
        profileResponse,
        blockedUsersResponse,
        innerCircleResponse
      ] = await Promise.all(apiCalls);

      // Process community member data
      let communityMemberData = null;
      let communityRole = 'none';
      let hasAdminAccess = false;
      let hasModAccess = false;

      if (communityMemberResponse?.data?.success) {
        const {data} = communityMemberResponse.data;
        communityMemberData = data.member;
        communityRole = data.member?.role || 'none';
        
        // Check current user's permissions
        const currentUserRole = data.currentUserRole || 'member';
        hasAdminAccess = ROLE_HIERARCHY[currentUserRole] >= ROLE_HIERARCHY.admin;
        hasModAccess = ROLE_HIERARCHY[currentUserRole] >= ROLE_HIERARCHY.moderator;
      }

      // Process profile data - Handle the response structure properly
      let profileData = null;
      let isFollowing = false;
      
      if (profileResponse?.data) {
        // The API returns data in userProfileInfo field based on your backend
        profileData = profileResponse.data.userProfileInfo || profileResponse.data.data;
        
        // Check if current user is following this member
        // You might need to make a separate API call or check the response
        isFollowing = false; // Will be updated based on your API response structure
      }

      // If no profile data found, throw error
      if (!profileData) {
        throw new Error('User profile not found');
      }

      // Check if blocked
      let isBlocked = false;
      if (blockedUsersResponse?.data) {
        const blockedUsers = Array.isArray(blockedUsersResponse.data) 
          ? blockedUsersResponse.data 
          : blockedUsersResponse.data.data || [];
        isBlocked = blockedUsers.some(user => user._id === memberId);
      }

      // Check inner circle status
      let isInnerCircle = false;
      let isPendingInnerCircle = false;
      
      if (innerCircleResponse?.data) {
        const innerCircleData = innerCircleResponse.data.data || [];
        const innerCircleUser = innerCircleData.find(user => user._id === memberId);
        if (innerCircleUser) {
          isInnerCircle = innerCircleUser.status === 'accepted';
          isPendingInnerCircle = innerCircleUser.status === 'pending';
        }
      }

      // Update state
      setMemberData({
        communityMember: communityMemberData,
        communityRole,
        impactPoints: communityMemberData?.impactPoints || 0,
        joinedAt: communityMemberData?.joinedAt,
        contributions: communityMemberData?.contributions || {},
        profile: profileData,
        posts: [],
        followers: [],
        following: [],
        analytics: null,
        isFollowing,
        isBlocked,
        isInnerCircle,
        isPendingInnerCircle,
      });

      setUiState(prev => ({
        ...prev,
        loading: false,
        hasAdminAccess,
        hasModAccess,
        error: null,
      }));

      // Load additional data if admin
      if (hasAdminAccess && communityId) {
        fetchAnalytics();
      }

      // Load posts
      fetchUserPosts(1);

    } catch (error) {
      console.error('Error fetching member data:', error);
      setUiState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load member profile. Please try again.',
      }));
      showToast('Failed to load member profile', 'error');
    }
  }, [memberId, communityId, showToast]);

  const fetchUserPosts = useCallback(async (page = 1, append = false) => {
    if (uiState.loadingPosts) return;

    setUiState(prev => ({...prev, loadingPosts: true}));

    try {
      const response = await getProfiledetails(memberId, page);
      const posts = response.data?.data || [];
      
      setMemberData(prev => ({
        ...prev,
        posts: append ? [...prev.posts, ...posts] : posts,
      }));

      setUiState(prev => ({
        ...prev,
        loadingPosts: false,
        postsPage: page,
        hasMorePosts: posts.length === 10,
      }));
    } catch (error) {
      console.error('Error fetching posts:', error);
      setUiState(prev => ({...prev, loadingPosts: false}));
    }
  }, [memberId]);

  const fetchAnalytics = useCallback(async () => {
    if (!uiState.hasAdminAccess || !communityId) return;

    setUiState(prev => ({...prev, loadingAnalytics: true}));

    try {
      const response = await getCommunityMemberAnalyticsApi(communityId, memberId);
      
      setMemberData(prev => ({
        ...prev,
        analytics: response.data?.data,
      }));

      setUiState(prev => ({...prev, loadingAnalytics: false}));
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setUiState(prev => ({...prev, loadingAnalytics: false}));
    }
  }, [communityId, memberId, uiState.hasAdminAccess]);

  // ===============================
  // USER ACTIONS
  // ===============================
  const handleFollowToggle = useCallback(async () => {
    if (uiState.loadingFollow) return;

    setUiState(prev => ({...prev, loadingFollow: true}));
    const wasFollowing = memberData.isFollowing;

    // Optimistic update
    setMemberData(prev => ({...prev, isFollowing: !wasFollowing}));

    try {
      if (wasFollowing) {
        await unlfollowUser(memberId);
        showToast('Unfollowed successfully', 'success');
      } else {
        await followUser(memberId);
        showToast('Following user', 'success');
      }
      
      mixpanel.track(wasFollowing ? 'User_Unfollowed' : 'User_Followed', {
        targetUserId: memberId,
        fromScreen: 'MemberProfile',
        communityId,
      });
    } catch (error) {
      console.error('Follow toggle error:', error);
      // Revert on error
      setMemberData(prev => ({...prev, isFollowing: wasFollowing}));
      showToast('Failed to update follow status', 'error');
    } finally {
      setUiState(prev => ({...prev, loadingFollow: false}));
    }
  }, [memberId, memberData.isFollowing, communityId, showToast]);

  const handleMessage = useCallback(async () => {
    try {
      const response = await createConversation({
        participantId: memberId,
        initialMessage: `Hi! I found you in ${communityName}`,
      });
      
      navigation.navigate(Routes.Chat, {
        conversationId: response.data?.conversationId || response.data?.data?.conversationId,
        userName: memberData.profile?.username,
      });
      
      mixpanel.track('Message_Started', {
        targetUserId: memberId,
        fromScreen: 'MemberProfile',
        communityId,
      });
    } catch (error) {
      console.error('Message error:', error);
      showToast('Failed to start conversation', 'error');
    }
  }, [memberId, communityName, memberData.profile, navigation, communityId, showToast]);

  const handleInnerCircleRequest = useCallback(async () => {
    if (memberData.isInnerCircle || memberData.isPendingInnerCircle) {
      showToast('Already in inner circle or request pending', 'info');
      return;
    }

    try {
      await sendInnerCircle({userId: memberId});
      
      setMemberData(prev => ({...prev, isPendingInnerCircle: true}));
      showToast('Inner circle request sent', 'success');
      
      mixpanel.track('InnerCircle_Request_Sent', {
        targetUserId: memberId,
        fromScreen: 'MemberProfile',
        communityId,
      });
    } catch (error) {
      console.error('Inner circle error:', error);
      showToast('Failed to send inner circle request', 'error');
    }
  }, [memberId, memberData, communityId, showToast]);

  const handleBlock = useCallback(async () => {
    Alert.alert(
      memberData.isBlocked ? 'Unblock User' : 'Block User',
      memberData.isBlocked
        ? 'Are you sure you want to unblock this user?'
        : 'Are you sure you want to block this user? They will not be able to contact you.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: memberData.isBlocked ? 'Unblock' : 'Block',
          style: memberData.isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            try {
              if (memberData.isBlocked) {
                await userUnBlock(memberId);
                showToast('User unblocked', 'success');
              } else {
                await bockUser(memberId);
                showToast('User blocked', 'success');
              }
              
              setMemberData(prev => ({...prev, isBlocked: !prev.isBlocked}));
              
              mixpanel.track(memberData.isBlocked ? 'User_Unblocked' : 'User_Blocked', {
                targetUserId: memberId,
                fromScreen: 'MemberProfile',
                communityId,
              });
            } catch (error) {
              console.error('Block error:', error);
              showToast('Failed to update block status', 'error');
            }
          },
        },
      ]
    );
  }, [memberId, memberData.isBlocked, communityId, showToast]);

  const handleReport = useCallback(async () => {
    Alert.alert(
      'Report User',
      'Are you sure you want to report this user?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Report',
          style: 'destructive',
          onPress: async () => {
            try {
              await ReportPost(memberId, {
                type: 'user',
                reason: 'Inappropriate behavior',
                description: 'User reported from profile',
              });
              
              showToast('User reported successfully', 'success');
              
              mixpanel.track('User_Reported', {
                targetUserId: memberId,
                fromScreen: 'MemberProfile',
                communityId,
              });
            } catch (error) {
              console.error('Report error:', error);
              showToast('Failed to report user', 'error');
            }
          },
        },
      ]
    );
  }, [memberId, communityId, showToast]);

  // ===============================
  // ADMIN ACTIONS
  // ===============================
  const handleRoleChange = useCallback(async () => {
    if (!roleChangeData.newRole || !roleChangeData.reason) {
      showToast('Please select role and provide reason', 'error');
      return;
    }

    try {
      await updateCommunityMemberRoleApi(communityId, memberId, {
        newRole: roleChangeData.newRole,
        reason: roleChangeData.reason,
      });
      
      showToast('Role updated successfully', 'success');
      setModalState(prev => ({...prev, showRoleModal: false}));
      
      // Refresh member data
      fetchMemberData(false);
      
      mixpanel.track('Member_Role_Changed', {
        targetUserId: memberId,
        newRole: roleChangeData.newRole,
        communityId,
      });
    } catch (error) {
      console.error('Role change error:', error);
      showToast('Failed to update role', 'error');
    }
  }, [communityId, memberId, roleChangeData, fetchMemberData, showToast]);

  const handlePointsAdjustment = useCallback(async () => {
    if (!pointsAdjustment.points || !pointsAdjustment.reason) {
      showToast('Please enter points and reason', 'error');
      return;
    }

    try {
      const adjustedPoints = pointsAdjustment.actionType === 'add' 
        ? Math.abs(pointsAdjustment.points)
        : -Math.abs(pointsAdjustment.points);

      await updateCommunityMemberImpactPointsApi(communityId, memberId, {
        points: adjustedPoints,
        reason: pointsAdjustment.reason,
        actionType: pointsAdjustment.actionType,
      });
      
      showToast('Impact points updated', 'success');
      setModalState(prev => ({...prev, showPointsModal: false}));
      
      // Update local state
      setMemberData(prev => ({
        ...prev,
        impactPoints: prev.impactPoints + adjustedPoints,
      }));
      
      mixpanel.track('Member_Points_Adjusted', {
        targetUserId: memberId,
        points: adjustedPoints,
        communityId,
      });
    } catch (error) {
      console.error('Points adjustment error:', error);
      showToast('Failed to adjust points', 'error');
    }
  }, [communityId, memberId, pointsAdjustment, showToast]);

  const handleSuspend = useCallback(async (duration) => {
    Alert.alert(
      'Suspend Member',
      `Are you sure you want to suspend this member for ${duration} days?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              await suspendCommunityMemberApi(communityId, memberId, {
                duration,
                reason: 'Violation of community guidelines',
                notifyUser: true,
              });
              
              showToast('Member suspended', 'success');
              navigation.goBack();
              
              mixpanel.track('Member_Suspended', {
                targetUserId: memberId,
                duration,
                communityId,
              });
            } catch (error) {
              console.error('Suspend error:', error);
              showToast('Failed to suspend member', 'error');
            }
          },
        },
      ]
    );
  }, [communityId, memberId, navigation, showToast]);

  const handleBan = useCallback(async () => {
    Alert.alert(
      'Ban Member',
      'Are you sure you want to permanently ban this member? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            try {
              await banCommunityMemberApi(communityId, memberId, {
                reason: 'Severe violation of community guidelines',
                deleteContent: false,
                notifyUser: true,
              });
              
              showToast('Member banned', 'success');
              navigation.goBack();
              
              mixpanel.track('Member_Banned', {
                targetUserId: memberId,
                communityId,
              });
            } catch (error) {
              console.error('Ban error:', error);
              showToast('Failed to ban member', 'error');
            }
          },
        },
      ]
    );
  }, [communityId, memberId, navigation, showToast]);

  // ===============================
  // LIFECYCLE
  // ===============================
  useEffect(() => {
    if (memberId) {
      fetchMemberData();
      
      // Track screen view
      mixpanel.track('MemberProfile_Viewed', {
        memberId,
        communityId,
        fromScreen,
      });
    } else {
      setUiState(prev => ({
        ...prev,
        loading: false,
        error: 'Invalid user ID',
      }));
    }
  }, [memberId, communityId]);

  // ===============================
  // RENDER HELPERS
  // ===============================
  const getRoleBadgeColor = (role) => {
    return THEME[role] || THEME.member;
  };

  const getImpactLevel = (points) => {
    if (points >= 10000) return {level: 'Legend', color: THEME.owner};
    if (points >= 5000) return {level: 'Expert', color: THEME.admin};
    if (points >= 2500) return {level: 'Advanced', color: THEME.moderator};
    if (points >= 1000) return {level: 'Intermediate', color: THEME.contributor};
    if (points >= 500) return {level: 'Active', color: THEME.discord};
    return {level: 'Beginner', color: THEME.member};
  };

  const formatTimeAgo = (date) => {
    return moment(date).fromNow();
  };

  const formatJoinDate = (date) => {
    return moment(date).format('MMM DD, YYYY');
  };

  // ===============================
  // RENDER COMPONENTS
  // ===============================
  const renderHeader = () => {
    const {profile, communityMember} = memberData;
    const impactLevel = getImpactLevel(memberData.impactPoints);

    return (
      <View style={styles.headerContainer}>
        {/* Cover Image with Blur */}
        <ImageBackground
          source={{uri: profile?.coverImage || 'https://via.placeholder.com/400x200'}}
          style={styles.coverImage}
          blurRadius={10}>
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
            style={styles.coverGradient}>
            
            {/* Profile Section */}
            <View style={styles.profileSection}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                <Image
                  source={{uri: profile?.profilePicture || 'https://via.placeholder.com/100'}}
                  style={styles.avatar}
                />
                <View style={[
                  styles.onlineIndicator,
                  {backgroundColor: THEME.offline}
                ]} />
              </View>

              {/* Name & Username */}
              <View style={styles.nameSection}>
                <View style={styles.nameRow}>
                  <Text style={styles.displayName}>
                    {profile?.firstname && profile?.lastname 
                      ? `${profile.firstname} ${profile.lastname}`
                      : profile?.username || 'Unknown User'}
                  </Text>
                  {profile?.isVerified && (
                    <MaterialIcons name="verified" size={20} color={THEME.verified} />
                  )}
                </View>
                <Text style={styles.username}>@{profile?.username || 'unknown'}</Text>
                
                {/* Role Badge - Only show if in community context */}
                {memberData.communityRole && memberData.communityRole !== 'none' && (
                  <View style={[styles.roleBadge, {backgroundColor: getRoleBadgeColor(memberData.communityRole)}]}>
                    <Text style={styles.roleBadgeText}>
                      {memberData.communityRole?.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.contentCount || 0}</Text>
                <Text style={styles.statLabel}>Posts</Text>
              </TouchableOpacity>
              
              <View style={styles.statDivider} />
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.followersCount || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>
              
              <View style={styles.statDivider} />
              
              <TouchableOpacity style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.followingCount || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>
              
              {/* Only show impact points if in community context */}
              {communityMember && (
                <>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, {color: impactLevel.color}]}>
                      {memberData.impactPoints}
                    </Text>
                    <Text style={styles.statLabel}>Impact</Text>
                  </View>
                </>
              )}
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  const renderActionButtons = () => {
    const isOwnProfile = currentUser?.userId === memberId || currentUser?.userId === memberData.profile?.id;

    if (isOwnProfile) {
      return (
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate(Routes.EditProfile)}>
            <Feather name="edit" size={18} color={THEME.textPrimary} />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.actionButtonsContainer}>
        {/* Follow/Unfollow Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            memberData.isFollowing ? styles.secondaryButton : styles.primaryButton
          ]}
          onPress={handleFollowToggle}
          disabled={uiState.loadingFollow}>
          {uiState.loadingFollow ? (
            <ActivityIndicator size="small" color={THEME.textPrimary} />
          ) : (
            <>
              <Ionicons 
                name={memberData.isFollowing ? 'person-remove' : 'person-add'} 
                size={18} 
                color={memberData.isFollowing ? THEME.textSecondary : THEME.textPrimary} 
              />
              <Text style={[
                styles.actionButtonText,
                memberData.isFollowing && styles.secondaryButtonText
              ]}>
                {memberData.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Message Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleMessage}>
          <Ionicons name="chatbubble-outline" size={18} color={THEME.textSecondary} />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            Message
          </Text>
        </TouchableOpacity>

        {/* Inner Circle Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.secondaryButton]}
          onPress={handleInnerCircleRequest}
          disabled={memberData.isInnerCircle || memberData.isPendingInnerCircle}>
          <MaterialCommunityIcons 
            name="account-group" 
            size={18} 
            color={memberData.isInnerCircle ? THEME.success : THEME.textSecondary} 
          />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
            {memberData.isInnerCircle 
              ? 'Connected' 
              : memberData.isPendingInnerCircle 
                ? 'Pending' 
                : 'Connect'}
          </Text>
        </TouchableOpacity>

        {/* More Options */}
        <TouchableOpacity
          style={[styles.actionButton, styles.iconOnlyButton]}
          onPress={() => {
            Alert.alert(
              'Options',
              '',
              [
                {text: memberData.isBlocked ? 'Unblock User' : 'Block User', onPress: handleBlock},
                {text: 'Report User', onPress: handleReport, style: 'destructive'},
                {text: 'Cancel', style: 'cancel'},
              ]
            );
          }}>
          <Entypo name="dots-three-vertical" size={18} color={THEME.textSecondary} />
        </TouchableOpacity>
      </View>
    );
  };

  const renderTabs = () => {
    const tabs = ['overview', 'activity'];
    if (memberData.communityMember) {
      tabs.push('contributions');
    }
    if (uiState.hasAdminAccess) {
      tabs.push('analytics');
    }

    return (
      <View style={styles.tabContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tabButton,
                uiState.activeTab === tab && styles.activeTabButton
              ]}
              onPress={() => {
                setUiState(prev => ({...prev, activeTab: tab}));
              }}>
              <Text style={[
                styles.tabButtonText,
                uiState.activeTab === tab && styles.activeTabButtonText
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
              {uiState.activeTab === tab && (
                <View style={styles.tabIndicator} />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderOverviewTab = () => {
    const {profile, communityMember} = memberData;
    const impactLevel = getImpactLevel(memberData.impactPoints);

    return (
      <View style={styles.tabContent}>
        {/* Bio Section */}
        {profile?.bio?.bioAbout && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio.bioAbout}</Text>
          </View>
        )}

        {/* User Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Information</Text>
          
          {profile?.location && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={THEME.textSecondary} />
              <Text style={styles.infoText}>{profile.location}</Text>
            </View>
          )}
          
          {profile?.email && (
            <View style={styles.infoRow}>
              <Ionicons name="mail-outline" size={20} color={THEME.textSecondary} />
              <Text style={styles.infoText}>{profile.email}</Text>
            </View>
          )}
          
          {/* Community-specific info */}
          {communityMember && (
            <>
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="calendar-clock" size={20} color={THEME.textSecondary} />
                <Text style={styles.infoText}>
                  Joined {formatJoinDate(communityMember.joinedAt)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <MaterialCommunityIcons name="lightning-bolt" size={20} color={impactLevel.color} />
                <Text style={[styles.infoText, {color: impactLevel.color}]}>
                  {impactLevel.level} Level
                </Text>
              </View>
            </>
          )}
          
          {profile?.topicsOfInterest?.length > 0 && (
            <View style={styles.topicsContainer}>
              <Text style={styles.topicsTitle}>Interests</Text>
              <View style={styles.topicsWrapper}>
                {profile.topicsOfInterest.map((topic, index) => (
                  <View key={index} style={styles.topicBadge}>
                    <Text style={styles.topicText}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Admin Controls - Only show if has admin access and in community context */}
        {uiState.hasAdminAccess && communityId && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Admin Controls</Text>
            
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => setModalState(prev => ({...prev, showRoleModal: true}))}>
              <MaterialCommunityIcons name="account-edit" size={20} color={THEME.discord} />
              <Text style={styles.adminButtonText}>Change Role</Text>
              <Feather name="chevron-right" size={20} color={THEME.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => setModalState(prev => ({...prev, showPointsModal: true}))}>
              <MaterialCommunityIcons name="star-circle" size={20} color={THEME.warning} />
              <Text style={styles.adminButtonText}>Adjust Impact Points</Text>
              <Feather name="chevron-right" size={20} color={THEME.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => handleSuspend(7)}>
              <MaterialCommunityIcons name="clock-alert" size={20} color={THEME.warning} />
              <Text style={styles.adminButtonText}>Suspend Member</Text>
              <Feather name="chevron-right" size={20} color={THEME.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.adminButton, styles.dangerButton]}
              onPress={handleBan}>
              <MaterialCommunityIcons name="account-remove" size={20} color={THEME.error} />
              <Text style={[styles.adminButtonText, {color: THEME.error}]}>
                Ban Member
              </Text>
              <Feather name="chevron-right" size={20} color={THEME.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderActivityTab = () => {
    return (
      <View style={styles.tabContent}>
        {memberData.posts.length > 0 ? (
          <FlatList
            data={memberData.posts}
            keyExtractor={(item) => item._id}
            renderItem={({item}) => (
              <TouchableOpacity
                style={styles.postCard}
                onPress={() => {
                  // Navigate to post detail if needed
                }}>
                <View style={styles.postHeader}>
                  <Text style={styles.postDate}>{formatTimeAgo(item.createdAt)}</Text>
                </View>
                
                <Text style={styles.postTitle} numberOfLines={2}>
                  {item.title || item.content || 'Post'}
                </Text>
              </TouchableOpacity>
            )}
            onEndReached={() => {
              if (uiState.hasMorePosts && !uiState.loadingPosts) {
                fetchUserPosts(uiState.postsPage + 1, true);
              }
            }}
            onEndReachedThreshold={0.5}
            ListFooterComponent={() => 
              uiState.loadingPosts && (
                <ActivityIndicator 
                  size="small" 
                  color={THEME.primary} 
                  style={styles.loadingMore} 
                />
              )
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="post-outline" size={48} color={THEME.textTertiary} />
                <Text style={styles.emptyStateText}>No posts yet</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="post-outline" size={48} color={THEME.textTertiary} />
            <Text style={styles.emptyStateText}>No activity to show</Text>
          </View>
        )}
      </View>
    );
  };

  const renderContributionsTab = () => {
    const {communityMember} = memberData;
    
    if (!communityMember) return null;
    
    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contribution Breakdown</Text>
          
          <View style={styles.contributionItem}>
            <View style={styles.contributionLeft}>
              <MaterialCommunityIcons name="post" size={24} color={THEME.primary} />
              <Text style={styles.contributionLabel}>Posts Created</Text>
            </View>
            <Text style={styles.contributionValue}>
              {communityMember?.contributions?.posts || 0}
            </Text>
          </View>

          <View style={styles.contributionItem}>
            <View style={styles.contributionLeft}>
              <MaterialCommunityIcons name="comment-multiple" size={24} color={THEME.info} />
              <Text style={styles.contributionLabel}>Comments Made</Text>
            </View>
            <Text style={styles.contributionValue}>
              {communityMember?.contributions?.comments || 0}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAnalyticsTab = () => {
    if (!uiState.hasAdminAccess) return null;

    if (uiState.loadingAnalytics) {
      return (
        <View style={styles.tabContent}>
          <ActivityIndicator size="large" color={THEME.primary} />
        </View>
      );
    }

    const {analytics} = memberData;

    return (
      <View style={styles.tabContent}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Member Analytics</Text>
          
          <View style={styles.analyticsSection}>
            <Text style={styles.analyticsSectionTitle}>Activity Overview</Text>
            <Text style={styles.infoText}>
              Analytics data will be displayed here
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderTabContent = () => {
    switch (uiState.activeTab) {
      case 'overview':
        return renderOverviewTab();
      case 'activity':
        return renderActivityTab();
      case 'contributions':
        return renderContributionsTab();
      case 'analytics':
        return renderAnalyticsTab();
      default:
        return null;
    }
  };

  // ===============================
  // MAIN RENDER
  // ===============================
  if (uiState.loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.bgPrimary} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.primary} />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (uiState.error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={THEME.bgPrimary} />
        
        {/* Header */}
        <View style={styles.fixedHeader}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={THEME.textPrimary} />
          </TouchableOpacity>
          
          <Text style={styles.fixedHeaderTitle}>Member Profile</Text>
          
          <View style={{width: 40}} />
        </View>
        
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={48} color={THEME.error} />
          <Text style={styles.errorText}>{uiState.error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => fetchMemberData()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.bgPrimary} />
      
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={THEME.textPrimary} />
        </TouchableOpacity>
        
        <Text style={styles.fixedHeaderTitle}>Member Profile</Text>
        
        <View style={{width: 40}} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={uiState.refreshing}
            onRefresh={() => fetchMemberData(false)}
            tintColor={THEME.primary}
            colors={[THEME.primary]}
          />
        }>
        
        {/* Profile Header */}
        {renderHeader()}
        
        {/* Action Buttons */}
        {renderActionButtons()}
        
        {/* Tabs */}
        {renderTabs()}
        
        {/* Tab Content */}
        {renderTabContent()}
        
        {/* Extra padding for scroll */}
        <View style={{height: nh(100)}} />
      </ScrollView>
    </SafeAreaView>
  );
};

// ===============================
// STYLES - Keep existing styles
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.bgPrimary,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: nh(10),
    fontSize: 14,
    color: THEME.textSecondary,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(20),
  },
  
  errorText: {
    marginTop: nh(10),
    fontSize: 16,
    color: THEME.textSecondary,
    textAlign: 'center',
  },
  
  retryButton: {
    marginTop: nh(20),
    paddingHorizontal: nw(30),
    paddingVertical: nh(10),
    backgroundColor: THEME.primary,
    borderRadius: 8,
  },
  
  retryButtonText: {
    fontSize: 14,
    color: THEME.textPrimary,
    fontWeight: '600',
  },
  
  fixedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    backgroundColor: THEME.bgSecondary,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  
  backButton: {
    padding: nw(8),
  },
  
  fixedHeaderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  
  scrollContent: {
    paddingBottom: nh(20),
  },
  
  // Header Styles
  headerContainer: {
    height: HEADER_HEIGHT,
    overflow: 'hidden',
  },
  
  coverImage: {
    width: '100%',
    height: '100%',
  },
  
  coverGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: nw(20),
  },
  
  profileSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: nh(20),
  },
  
  avatarContainer: {
    position: 'relative',
  },
  
  avatar: {
    width: nw(80),
    height: nw(80),
    borderRadius: nw(40),
    borderWidth: 3,
    borderColor: THEME.textPrimary,
  },
  
  onlineIndicator: {
    position: 'absolute',
    bottom: nw(5),
    right: nw(5),
    width: nw(16),
    height: nw(16),
    borderRadius: nw(8),
    borderWidth: 2,
    borderColor: THEME.bgPrimary,
  },
  
  nameSection: {
    flex: 1,
    marginLeft: nw(15),
  },
  
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.textPrimary,
    marginRight: nw(8),
  },
  
  username: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: nh(2),
  },
  
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: nw(10),
    paddingVertical: nh(4),
    borderRadius: 12,
    marginTop: nh(8),
  },
  
  roleBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: THEME.textPrimary,
  },
  
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: nh(15),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: THEME.textPrimary,
  },
  
  statLabel: {
    fontSize: 12,
    color: THEME.textSecondary,
    marginTop: nh(2),
  },
  
  statDivider: {
    width: 1,
    height: nh(30),
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  
  // Action Buttons
  actionButtonsContainer: {
    flexDirection: 'row',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    gap: nw(8),
  },
  
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(10),
    borderRadius: 8,
    gap: nw(6),
  },
  
  primaryButton: {
    backgroundColor: THEME.primary,
  },
  
  secondaryButton: {
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  iconOnlyButton: {
    flex: 0,
    paddingHorizontal: nw(12),
    backgroundColor: THEME.bgCard,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  
  secondaryButtonText: {
    color: THEME.textSecondary,
  },
  
  // Tabs
  tabContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  
  tabScrollContent: {
    paddingHorizontal: nw(16),
  },
  
  tabButton: {
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    marginRight: nw(8),
    position: 'relative',
  },
  
  tabButtonText: {
    fontSize: 14,
    color: THEME.textSecondary,
    fontWeight: '500',
  },
  
  activeTabButtonText: {
    color: THEME.primary,
    fontWeight: '600',
  },
  
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: nw(20),
    right: nw(20),
    height: 2,
    backgroundColor: THEME.primary,
  },
  
  // Tab Content
  tabContent: {
    padding: nw(16),
  },
  
  // Cards
  card: {
    backgroundColor: THEME.bgCard,
    borderRadius: 12,
    padding: nw(16),
    marginBottom: nh(16),
  },
  
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.textPrimary,
    marginBottom: nh(12),
  },
  
  bioText: {
    fontSize: 14,
    color: THEME.textSecondary,
    lineHeight: 20,
  },
  
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(12),
  },
  
  infoText: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginLeft: nw(12),
  },
  
  topicsContainer: {
    marginTop: nh(12),
  },
  
  topicsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
    marginBottom: nh(8),
  },
  
  topicsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
  },
  
  topicBadge: {
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    backgroundColor: THEME.bgSecondary,
    borderRadius: 16,
  },
  
  topicText: {
    fontSize: 12,
    color: THEME.textSecondary,
  },
  
  // Admin Controls
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  
  adminButtonText: {
    flex: 1,
    fontSize: 14,
    color: THEME.textSecondary,
    marginLeft: nw(12),
  },
  
  dangerButton: {
    borderBottomWidth: 0,
  },
  
  // Posts
  postCard: {
    backgroundColor: THEME.bgCard,
    borderRadius: 8,
    padding: nw(12),
    marginBottom: nh(12),
  },
  
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  
  postDate: {
    fontSize: 12,
    color: THEME.textTertiary,
  },
  
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
    marginBottom: nh(4),
  },
  
  loadingMore: {
    paddingVertical: nh(20),
  },
  
  // Contributions
  contributionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  
  contributionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  
  contributionLabel: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginLeft: nw(12),
  },
  
  contributionValue: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.textPrimary,
  },
  
  // Analytics
  analyticsSection: {
    marginTop: nh(16),
    paddingTop: nh(16),
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  
  analyticsSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: THEME.textPrimary,
    marginBottom: nh(12),
  },
  
  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: nh(40),
  },
  
  emptyStateText: {
    fontSize: 14,
    color: THEME.textTertiary,
    marginTop: nh(12),
  },
});

export default MemberProfile;