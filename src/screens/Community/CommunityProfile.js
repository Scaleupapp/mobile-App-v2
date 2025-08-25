// src/screens/Community/CommunityProfile.js
/**
 * Community Profile/Feed Screen - Discord Server x Reddit Subreddit Hybrid
 * Individual community view with posts feed and comprehensive interactions
 * Aligned with CommunityHome and CommunityDiscovery design patterns
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
  SlideInRight,
  SlideOutRight,
} from 'react-native-reanimated';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {
  getCommunityDetailsApi,
  getCommunityPostsApi,
  searchCommunityPostsApi,
  getCommunityPublicStatsApi,
  getCommunityActivityApi,
  getSimilarCommunitiesApi,
  joinCommunityApi,
  leaveCommunityApi,
  bookmarkCommunityApi,
  removeBookmarkCommunityApi,
  followCommunityApi,
  unfollowCommunityApi,
  reportCommunityApi,
  getCommunityFeedConfigApi,
  updateCommunityFeedConfigApi,
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
// ALIGNED COMMUNITY COLOR SYSTEM
// ===============================
const COMMUNITY_COLORS = {
  // Primary theme aligned with Discovery and Home
  primary: '#FF4500', // Reddit Orange
  primaryLight: '#FF5700',
  primaryDark: '#C44569',
  
  // Secondary accents
  accent: '#5865F2', // Discord Blurple
  accentLight: '#7289DA',
  accentDark: '#4752C4',
  
  // Status colors
  success: '#3BA55C', // Discord Green
  warning: '#FAA61A', // Discord Yellow
  error: '#ED4245', // Discord Red
  info: '#1DA1F2', // Twitter Blue
  
  // Engagement colors
  upvote: '#FF4500',
  downvote: '#7193FF',
  bookmark: '#FFD700',
  follow: '#3BA55C',
  
  // Role colors
  owner: '#FFD700', // Gold
  admin: '#FF4500', // Orange
  moderator: '#5865F2', // Blurple
  
  // Dark theme foundation
  background: '#0A0A0A',
  backgroundSecondary: '#1A1A1B',
  surface: '#272729',
  surfaceLight: '#2F3136',
  surfaceHover: '#343536',
  elevated: '#2F3136',
  
  // Text hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#D7DADC',
  textMuted: '#818384',
  textDim: '#565758',
  
  // Interactive states
  hover: 'rgba(255, 255, 255, 0.08)',
  pressed: 'rgba(255, 255, 255, 0.04)',
  selected: 'rgba(88, 101, 242, 0.15)',
  overlay: 'rgba(0, 0, 0, 0.8)',
  
  // Borders and dividers
  border: '#343536',
  borderLight: '#474748',
  divider: 'rgba(255, 255, 255, 0.08)',
  
  // Online indicators
  online: '#3BA55C',
  idle: '#FAA61A',
  dnd: '#ED4245',
  offline: '#747F8D',
};

// ===============================
// COMPREHENSIVE API LOGGER
// ===============================
const CommunityProfileLogger = {
  log: (phase, apiName, data = null) => {
    const timestamp = new Date().toLocaleTimeString();
    const logColor = phase === 'REQUEST' ? '\x1b[34m' : 
                    phase === 'SUCCESS' ? '\x1b[32m' : 
                    phase === 'ERROR' ? '\x1b[31m' : '\x1b[33m';
    const resetColor = '\x1b[0m';
    
    console.log(`${logColor}[${timestamp}] COMMUNITY PROFILE: ${apiName} - ${phase}${resetColor}`);
    
    if (data) {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
    
    if (__DEV__) {
      console.log('=====================================');
    }
  },
  
  logRequest: (apiName, params) => {
    console.log(`\n🏘️ COMMUNITY REQUEST: ${apiName}`);
    console.log('Parameters:', params);
  },
  
  logResponse: (apiName, response) => {
    console.log(`\n✅ COMMUNITY RESPONSE: ${apiName}`);
    console.log('Status:', response?.status);
    if (response?.data?.data) {
      if (Array.isArray(response.data.data)) {
        console.log('Results Count:', response.data.data.length);
      } else {
        console.log('Data Keys:', Object.keys(response.data.data));
      }
    }
  },
  
  logError: (apiName, error) => {
    console.log(`\n❌ COMMUNITY ERROR: ${apiName}`);
    console.log('Error Message:', error?.message);
    console.log('Error Response:', error?.response?.data);
  },
  
  logUserAction: (action, data) => {
    console.log(`\n👤 COMMUNITY ACTION: ${action}`);
    console.log('Action Data:', data);
    
    // Track with Mixpanel
    mixpanel.track(action, {
      ...data,
      timestamp: new Date().toISOString(),
      screen: 'CommunityProfile',
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

const getActivityLevel = (stats) => {
  if (!stats) return 'Unknown';
  const {activeThisWeek, totalMembers} = stats;
  const ratio = activeThisWeek / totalMembers;
  
  if (ratio > 0.3) return 'Very Active';
  if (ratio > 0.15) return 'Active';
  if (ratio > 0.05) return 'Growing';
  return 'New';
};

const getCommunityBadge = (community) => {
  if (community?.verification?.isVerified || community?.isVerified) return 'verified';
  if (community?.stats?.totalMembers > 10000) return 'popular';
  if (community?.createdAt && new Date() - new Date(community.createdAt) < 30 * 24 * 60 * 60 * 1000) return 'new';
  return null;
};

// ===============================
// POST CARD COMPONENT - FIXED VERSION
// ===============================
const CommunityPostCard = ({post, onPress, onVote, onShare, onBookmark, index = 0}) => {
  // Extract proper values from backend structure
  const postMetrics = post.metrics || {};
  const postContent = typeof post.content === 'object' ? post.content?.text : post.content;
  const postType = post.postType || post.type;
  const postDate = post.publishedAt || post.createdAt;
  const postImages = post.preview?.images || post.media?.images || post.media || [];
  const commentCount = postMetrics.comments || post.commentCount || 0;
  const initialUpvotes = postMetrics.upvotes || post.upvotes || 0;
  const initialDownvotes = postMetrics.downvotes || post.downvotes || 0;

  const [voteStatus, setVoteStatus] = useState(post.userVote || null);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked || false);
  const [voteCounts, setVoteCounts] = useState({
    upvotes: initialUpvotes,
    downvotes: initialDownvotes,
  });

  const handleVote = async (type) => {
    const newVoteStatus = voteStatus === type ? null : type;
    const oldVoteStatus = voteStatus;
    
    // Optimistic update
    setVoteStatus(newVoteStatus);
    
    // Update vote counts
    let newUpvotes = voteCounts.upvotes;
    let newDownvotes = voteCounts.downvotes;
    
    if (oldVoteStatus === 'up') newUpvotes--;
    if (oldVoteStatus === 'down') newDownvotes--;
    if (newVoteStatus === 'up') newUpvotes++;
    if (newVoteStatus === 'down') newDownvotes++;
    
    setVoteCounts({upvotes: newUpvotes, downvotes: newDownvotes});
    
    try {
      await onVote?.(post, type);
      CommunityProfileLogger.logUserAction('Community Post Voted', {
        post_id: post.id || post._id,
        vote_type: newVoteStatus,
        post_title: post.title,
      });
    } catch (error) {
      // Revert on error
      setVoteStatus(oldVoteStatus);
      setVoteCounts({upvotes: initialUpvotes, downvotes: initialDownvotes});
    }
  };

  const handleBookmark = async () => {
    const newBookmarkStatus = !isBookmarked;
    setIsBookmarked(newBookmarkStatus);
    
    try {
      await onBookmark?.(post);
    } catch (error) {
      setIsBookmarked(!newBookmarkStatus);
    }
  };

  const totalScore = voteCounts.upvotes - voteCounts.downvotes;

  // Helper function to get the first image URL
  const getFirstImageUrl = () => {
    if (postImages.length > 0) {
      // Handle different image structures
      if (typeof postImages[0] === 'string') {
        return postImages[0];
      } else if (postImages[0]?.url) {
        return postImages[0].url;
      } else if (postImages[0]?.thumbnailUrl) {
        return postImages[0].thumbnailUrl;
      }
    }
    
    // Check for link preview image
    if (post.preview?.linkPreview?.image) {
      return post.preview.linkPreview.image;
    }
    if (post.linkPreview?.image) {
      return post.linkPreview.image;
    }
    
    return null;
  };

  const firstImageUrl = getFirstImageUrl();
  const hasMultipleImages = postImages.length > 1;

  // Check for special post type content
  const pollQuestion = post.preview?.pollQuestion || post.poll?.question;
  const eventTitle = post.preview?.eventTitle || post.event?.title;
  const eventDate = post.preview?.eventDate || post.event?.startDate;
  const announcementPriority = post.preview?.announcementPriority || post.announcement?.priority;

  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).springify()}
      layout={Layout.springify()}
      style={styles.postCard}
    >
      <Pressable onPress={() => onPress?.(post)} style={styles.postCardPressable}>
        {/* Vote Section */}
        <View style={styles.voteSection}>
          <TouchableOpacity 
            onPress={() => handleVote('up')}
            style={[styles.voteButton, voteStatus === 'up' && styles.voteButtonActive]}
          >
            <Icon 
              name="arrow-up" 
              size={20} 
              color={voteStatus === 'up' ? COMMUNITY_COLORS.upvote : COMMUNITY_COLORS.textMuted} 
            />
          </TouchableOpacity>
          
          <Text style={[
            styles.voteScore,
            voteStatus === 'up' && styles.voteScoreUp,
            voteStatus === 'down' && styles.voteScoreDown
          ]}>
            {formatNumber(totalScore)}
          </Text>
          
          <TouchableOpacity 
            onPress={() => handleVote('down')}
            style={[styles.voteButton, voteStatus === 'down' && styles.voteButtonActive]}
          >
            <Icon 
              name="arrow-down" 
              size={20} 
              color={voteStatus === 'down' ? COMMUNITY_COLORS.downvote : COMMUNITY_COLORS.textMuted} 
            />
          </TouchableOpacity>
        </View>

        {/* Content Section */}
        <View style={styles.postContent}>
          {/* Post Header */}
          <View style={styles.postHeader}>
            <Image 
              source={{uri: post.author?.profilePicture || 'https://via.placeholder.com/32'}} 
              style={styles.authorAvatar} 
            />
            <Text style={styles.authorName}>
              u/{post.author?.username || 'anonymous'}
            </Text>
            {(post.author?.isVerified || post.author?.isInstitutionalUser) && (
              <MaterialIcons name="verified" size={14} color={COMMUNITY_COLORS.accent} />
            )}
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.postTime}>{getRelativeTime(postDate)}</Text>
            
            {post.isPinned && (
              <View style={styles.pinnedBadge}>
                <Icon name="pin" size={12} color={COMMUNITY_COLORS.success} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
            
            {post.isFeatured && (
              <View style={[styles.pinnedBadge, {backgroundColor: COMMUNITY_COLORS.warning + '20'}]}>
                <Icon name="star" size={12} color={COMMUNITY_COLORS.warning} />
                <Text style={[styles.pinnedText, {color: COMMUNITY_COLORS.warning}]}>Featured</Text>
              </View>
            )}
          </View>

          {/* Post Title */}
          {post.title && (
            <Text style={styles.postTitle} numberOfLines={3}>
              {post.title}
            </Text>
          )}

          {/* Post Content */}
          {postContent && (
            <Text style={styles.postDescription} numberOfLines={4}>
              {postContent}
            </Text>
          )}

          {/* Poll Preview */}
          {pollQuestion && (
            <View style={styles.pollPreview}>
              <Icon name="bar-chart" size={16} color={COMMUNITY_COLORS.info} />
              <Text style={styles.pollQuestion} numberOfLines={2}>
                {pollQuestion}
              </Text>
            </View>
          )}

          {/* Event Preview */}
          {eventTitle && (
            <View style={styles.eventPreview}>
              <Icon name="calendar" size={16} color={COMMUNITY_COLORS.warning} />
              <View style={styles.eventDetails}>
                <Text style={styles.eventTitle} numberOfLines={1}>
                  {eventTitle}
                </Text>
                {eventDate && (
                  <Text style={styles.eventDate}>
                    {new Date(eventDate).toLocaleDateString()}
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Announcement Badge */}
          {announcementPriority && (
            <View style={[
              styles.announcementBadge,
              announcementPriority === 'urgent' && styles.urgentAnnouncement,
              announcementPriority === 'high' && styles.highAnnouncement
            ]}>
              <Icon 
                name="megaphone" 
                size={14} 
                color={announcementPriority === 'urgent' ? COMMUNITY_COLORS.error : COMMUNITY_COLORS.warning} 
              />
              <Text style={styles.announcementText}>
                {announcementPriority.charAt(0).toUpperCase() + announcementPriority.slice(1)} Announcement
              </Text>
            </View>
          )}

          {/* Post Media */}
          {firstImageUrl && (
            <View style={styles.mediaContainer}>
              <Image 
                source={{uri: firstImageUrl}} 
                style={styles.postImage}
                resizeMode="cover"
              />
              {hasMultipleImages && (
                <View style={styles.mediaOverlay}>
                  <Text style={styles.mediaCount}>+{postImages.length - 1}</Text>
                </View>
              )}
            </View>
          )}

          {/* Link Preview */}
          {post.linkPreview && !firstImageUrl && (
            <View style={styles.linkPreviewContainer}>
              {post.linkPreview.image && (
                <Image 
                  source={{uri: post.linkPreview.image}} 
                  style={styles.linkPreviewImage}
                />
              )}
              <View style={styles.linkPreviewContent}>
                <Text style={styles.linkPreviewTitle} numberOfLines={2}>
                  {post.linkPreview.title}
                </Text>
                <Text style={styles.linkPreviewUrl} numberOfLines={1}>
                  {post.linkPreview.siteName || post.linkPreview.url}
                </Text>
              </View>
            </View>
          )}

          {/* Post Type Indicators */}
          <View style={styles.postMetadata}>
            {postType && postType !== 'text' && (
              <View style={[styles.typeChip, styles[`type_${postType}`]]}>
                <Icon 
                  name={
                    postType === 'poll' ? 'bar-chart' :
                    postType === 'event' ? 'calendar' :
                    postType === 'announcement' ? 'megaphone' :
                    postType === 'link' ? 'link' :
                    postType === 'image' ? 'image' :
                    postType === 'file' ? 'document' :
                    'chatbubble'
                  } 
                  size={12} 
                  color={COMMUNITY_COLORS.textPrimary} 
                />
                <Text style={styles.typeText}>{postType.toUpperCase()}</Text>
              </View>
            )}
            
            {post.tags && post.tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {post.tags.slice(0, 3).map((tag, index) => (
                  <Text key={index} style={styles.tagText}>#{tag}</Text>
                ))}
                {post.tags.length > 3 && (
                  <Text style={styles.tagText}>+{post.tags.length - 3}</Text>
                )}
              </View>
            )}
          </View>

          {/* Post Actions */}
          <View style={styles.postActions}>
            <TouchableOpacity style={styles.actionButton}>
              <Icon name="chatbubble-outline" size={16} color={COMMUNITY_COLORS.textMuted} />
              <Text style={styles.actionText}>{formatNumber(commentCount)}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onShare?.(post)}
            >
              <Icon name="share-outline" size={16} color={COMMUNITY_COLORS.textMuted} />
              <Text style={styles.actionText}>
                {formatNumber(postMetrics.shares || 0) || 'Share'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionButton, isBookmarked && styles.actionButtonActive]}
              onPress={handleBookmark}
            >
              <Icon 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={16} 
                color={isBookmarked ? COMMUNITY_COLORS.bookmark : COMMUNITY_COLORS.textMuted} 
              />
              <Text style={[styles.actionText, isBookmarked && styles.actionTextActive]}>
                {isBookmarked ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <Icon name="ellipsis-horizontal" size={16} color={COMMUNITY_COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Encryption Indicator (if encrypted) */}
          {post.isEncrypted && (
            <View style={styles.encryptionIndicator}>
              <Icon name="lock-closed" size={12} color={COMMUNITY_COLORS.success} />
              <Text style={styles.encryptionText}>End-to-end encrypted</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ===============================
// COMMUNITY HEADER COMPONENT
// ===============================
const CommunityHeader = ({
  community,
  stats,
  isJoined,
  isBookmarked,
  isFollowing,
  userRole,
  onJoin,
  onLeave,
  onBookmark,
  onFollow,
  onShare,
  onReport
}) => {
  const [headerExpanded, setHeaderExpanded] = useState(true);
  const badge = getCommunityBadge(community);
  
  // Determine if user can leave (owners typically can't leave their own community)
  const canLeave = userRole !== 'owner';
  
  // Get role display color
  const getRoleColor = () => {
    switch(userRole) {
      case 'owner': return COMMUNITY_COLORS.owner;
      case 'admin': return COMMUNITY_COLORS.admin;
      case 'moderator': return COMMUNITY_COLORS.moderator;
      default: return COMMUNITY_COLORS.success;
    }
  };
  
  return (
    <View style={styles.communityHeader}>
      {/* Cover Image */}
      <View style={styles.coverImageContainer}>
        {community.coverImage ? (
          <Image source={{uri: community.coverImage}} style={styles.coverImage} />
        ) : (
          <LinearGradient
            colors={[COMMUNITY_COLORS.primary, COMMUNITY_COLORS.accent]}
            style={styles.coverImagePlaceholder}
          />
        )}
        
        {/* Cover Overlay */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.coverOverlay}
        />
        
        {/* Header Actions */}
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionButton} onPress={onShare}>
            <Icon name="share-outline" size={20} color={COMMUNITY_COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton} onPress={onBookmark}>
            <Icon 
              name={isBookmarked ? "bookmark" : "bookmark-outline"} 
              size={20} 
              color={isBookmarked ? COMMUNITY_COLORS.bookmark : COMMUNITY_COLORS.textPrimary} 
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionButton}>
            <Icon name="ellipsis-vertical" size={20} color={COMMUNITY_COLORS.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Community Info */}
      <View style={styles.communityInfo}>
        {/* Avatar and Basic Info */}
        <View style={styles.communityBasicInfo}>
          <View style={styles.avatarContainer}>
            {community.avatar ? (
              <Image source={{uri: community.avatar}} style={styles.communityAvatar} />
            ) : (
              <View style={[styles.communityAvatarPlaceholder, {backgroundColor: COMMUNITY_COLORS.accent}]}>
                <Text style={styles.communityAvatarText}>
                  {community.name?.charAt(0)?.toUpperCase()}
                </Text>
              </View>
            )}
            
            {badge && (
              <View style={[styles.communityBadge, styles[`badge_${badge}`]]}>
                <Icon 
                  name={badge === 'verified' ? 'checkmark-circle' : badge === 'popular' ? 'star' : 'flash'} 
                  size={14} 
                  color={COMMUNITY_COLORS.textPrimary} 
                />
              </View>
            )}
          </View>

          <View style={styles.communityNameContainer}>
            <Text style={styles.communityName}>{community.name}</Text>
            <Text style={styles.communitySubtitle}>
              r/{community.name?.toLowerCase()?.replace(/\s+/g, '')} • {formatNumber(stats?.totalMembers || stats?.memberCount)} members
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.communityActions}>
          <TouchableOpacity
            style={[
              styles.primaryActionButton,
              isJoined ? styles.joinedButton : styles.joinButton,
              userRole && styles[`${userRole}Button`]
            ]}
            onPress={canLeave && isJoined ? onLeave : !isJoined ? onJoin : null}
            disabled={userRole === 'owner'}
          >
            {userRole && isJoined ? (
              <>
                {userRole === 'owner' && <Icon name="shield" size={16} color={COMMUNITY_COLORS.textPrimary} />}
                {userRole === 'admin' && <Icon name="shield-checkmark" size={16} color={COMMUNITY_COLORS.textPrimary} />}
                {userRole === 'moderator' && <Icon name="shield-half" size={16} color={COMMUNITY_COLORS.textPrimary} />}
                {!['owner', 'admin', 'moderator'].includes(userRole) && <Icon name="checkmark" size={16} color={COMMUNITY_COLORS.textPrimary} />}
                <Text style={styles.primaryActionText}>
                  {userRole === 'owner' ? 'Owner' :
                   userRole === 'admin' ? 'Admin' :
                   userRole === 'moderator' ? 'Moderator' :
                   'Joined'}
                </Text>
              </>
            ) : (
              <>
                <Icon name="add" size={16} color={COMMUNITY_COLORS.textPrimary} />
                <Text style={styles.primaryActionText}>Join</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryActionButton,
              isFollowing && styles.followingButton
            ]}
            onPress={onFollow}
          >
            <Icon 
              name={isFollowing ? "notifications" : "notifications-outline"} 
              size={16} 
              color={isFollowing ? COMMUNITY_COLORS.follow : COMMUNITY_COLORS.textSecondary} 
            />
          </TouchableOpacity>

          {/* Management button for Owner/Admin/Moderator */}
{(['owner', 'admin', 'moderator'].includes(userRole)) && (
  <TouchableOpacity
    style={[styles.secondaryActionButton, styles.managementButton]}
    onPress={() => navigation.navigate(Routes.CommunityManagement, {
      communityId: community.id || community._id,
      communityData: community,
      userRole: userRole
    })}
    activeOpacity={0.7}
  >
    <Icon name="settings" size={16} color={COMMUNITY_COLORS.accent} />
  </TouchableOpacity>
)}
        </View>

        {/* Description */}
        {community.description && (
          <Text style={styles.communityDescription} numberOfLines={headerExpanded ? undefined : 2}>
            {community.description}
          </Text>
        )}

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(stats?.totalMembers || stats?.memberCount)}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(stats?.totalPosts || stats?.postCount)}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.onlineIndicator} />
            <Text style={styles.statValue}>{formatNumber(stats?.activeThisWeek || stats?.activeWeeklyUsers)}</Text>
            <Text style={styles.statLabel}>Online</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{getActivityLevel(stats)}</Text>
            <Text style={styles.statLabel}>Activity</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

// ===============================
// MAIN COMPONENT
// ===============================
const CommunityProfile = ({navigation, route}) => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);
  const {communityId, community: initialCommunity} = route.params;

  // Use a ref to prevent multiple initializations
  const isInitialized = useRef(false);

  console.log('\n🏘️ COMMUNITY PROFILE MOUNTED');
  console.log('Community ID:', communityId);
  console.log('Initial Community:', initialCommunity);

  // ===============================
  // STATE MANAGEMENT
  // ===============================
  
  // Core states
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Community data
  const [community, setCommunity] = useState(initialCommunity || null);
  const [communityStats, setCommunityStats] = useState(null);
  const [communityActivity, setCommunityActivity] = useState([]);
  const [similarCommunities, setSimilarCommunities] = useState([]);
  const [feedConfig, setFeedConfig] = useState(null);

  // Posts data
  const [posts, setPosts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sortBy, setSortBy] = useState('hot');
  const [filterType, setFilterType] = useState('all');

  // FIXED: User interaction states - properly check all membership fields
  const [isJoined, setIsJoined] = useState(() => {
    // Check all possible membership indicators
    return !!(
      initialCommunity?.isMember ||
      initialCommunity?.userRole ||
      initialCommunity?.isOwner ||
      initialCommunity?.isAdmin ||
      initialCommunity?.isModerator ||
      initialCommunity?.joinedAt
    );
  });

  // FIXED: Initialize userRole from initial data
  const [userRole, setUserRole] = useState(() => {
    if (initialCommunity?.userRole) return initialCommunity.userRole;
    if (initialCommunity?.isOwner) return 'owner';
    if (initialCommunity?.isAdmin) return 'admin';
    if (initialCommunity?.isModerator) return 'moderator';
    return null;
  });

  const [isBookmarked, setIsBookmarked] = useState(initialCommunity?.isFavorite || false);
  const [isFollowing, setIsFollowing] = useState(false);

  // UI states
  const [activeTab, setActiveTab] = useState('posts');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Animation values
  const headerHeight = useSharedValue(200);
  const searchScale = useSharedValue(1);
  const tabsTranslateX = useSharedValue(0);

  // Refs
  const flatListRef = useRef(null);
  const searchInputRef = useRef(null);

  // ===============================
  // LIFECYCLE & EFFECTS
  // ===============================

  useEffect(() => {
    // Prevent multiple initializations
    if (isInitialized.current) return;
    isInitialized.current = true;

    console.log('\n🏘️ COMMUNITY PROFILE INITIALIZED');
    console.log('Initial isJoined:', isJoined);
    console.log('Initial userRole:', userRole);
    
    CommunityProfileLogger.logUserAction('Community Profile Viewed', {
      community_id: communityId,
      community_name: community?.name,
      source: route?.params?.source || 'navigation',
      user_id: userData?.id,
      is_member: isJoined,
      user_role: userRole,
    });

    initializeProfile();

    // Cleanup
    return () => {
      isInitialized.current = false;
    };
  }, []); // Remove communityId dependency to prevent re-runs

  useEffect(() => {
    if (sortBy || filterType !== 'all') {
      handleSortOrFilterChange();
    }
  }, [sortBy, filterType]);

  useEffect(() => {
    if (searchQuery) {
      handleSearchPosts();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Debug logging to track state
  useEffect(() => {
    console.log('📊 State Update:', {
      isJoined,
      userRole,
      communityName: community?.name,
      communityIsOwner: community?.isOwner,
      communityUserRole: community?.userRole,
    });
  }, [isJoined, userRole, community]);

  // ===============================
  // INITIALIZATION
  // ===============================

  const initializeProfile = async () => {
    console.log('\n📊 STARTING COMMUNITY PROFILE INITIALIZATION...');
    setInitialLoading(true);

    try {
      const promises = [
        // Only fetch details if we don't have complete data
        initialCommunity ? Promise.resolve() : fetchCommunityDetails(),
        fetchCommunityStats(),
        fetchCommunityPosts(),
        fetchCommunityActivity(),
        fetchSimilarCommunities(),
        fetchFeedConfig(),
        loadUserPreferences(),
      ];

      await Promise.all(promises);
      console.log('\n✅ COMMUNITY PROFILE INITIALIZATION COMPLETE');
    } catch (error) {
      console.error('\n❌ COMMUNITY PROFILE INITIALIZATION ERROR:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const prefs = await AsyncStorage.getItem(`community_${communityId}_prefs`);
      if (prefs) {
        const {bookmarked, following, sortBy: savedSort} = JSON.parse(prefs);
        if (bookmarked !== undefined) setIsBookmarked(bookmarked);
        if (following !== undefined) setIsFollowing(following);
        if (savedSort) setSortBy(savedSort);
      }
    } catch (error) {
      console.log('Preferences error:', error);
    }
  };

  // ===============================
  // API FUNCTIONS
  // ===============================

  const fetchCommunityDetails = async () => {
    const apiName = 'getCommunityDetailsApi';
    CommunityProfileLogger.logRequest(apiName, {communityId});
  
    try {
      const response = await getCommunityDetailsApi(communityId);
      CommunityProfileLogger.logResponse(apiName, response);
  
      if (response?.data?.success) {
        const communityData = response.data.data?.community;
        
        // FIXED: Merge with existing data to preserve fields from Discovery
        setCommunity(prevCommunity => ({
          ...prevCommunity,
          ...communityData,
          // Preserve these fields from initial data if they exist
          isOwner: prevCommunity?.isOwner || communityData?.isOwner,
          isAdmin: prevCommunity?.isAdmin || communityData?.isAdmin,
          isModerator: prevCommunity?.isModerator || communityData?.isModerator,
          isMember: prevCommunity?.isMember || communityData?.isMember,
          userRole: prevCommunity?.userRole || communityData?.userRole,
        }));
        
        // Only update if we get new membership info
        if (communityData?.userMembership !== undefined || communityData?.userRole) {
          const isMember = !!(
            communityData?.userRole || 
            communityData?.userMembership || 
            communityData?.joinedAt ||
            communityData?.isMember ||
            communityData?.isOwner ||
            communityData?.isAdmin ||
            communityData?.isModerator
          );
          
          setIsJoined(isMember);
          
          if (communityData?.userRole) {
            setUserRole(communityData.userRole);
          } else if (communityData?.isOwner) {
            setUserRole('owner');
          } else if (communityData?.isAdmin) {
            setUserRole('admin');
          } else if (communityData?.isModerator) {
            setUserRole('moderator');
          }
        }
        
        // Update bookmarked status
        if (communityData?.isFavorite !== undefined) {
          setIsBookmarked(communityData.isFavorite);
        }
        
        console.log(`🏘️ Loaded community: ${communityData.name}`);
        console.log(`👤 Current role: ${userRole}`);
        console.log(`✅ Is joined: ${isJoined}`);
      }
    } catch (error) {
      CommunityProfileLogger.logError(apiName, error);
    }
  };

  const fetchCommunityStats = async () => {
    const apiName = 'getCommunityPublicStatsApi';
    CommunityProfileLogger.logRequest(apiName, {communityId});

    try {
      const response = await getCommunityPublicStatsApi(communityId);
      CommunityProfileLogger.logResponse(apiName, response);

      if (response?.data?.success) {
        const stats = response.data.data?.stats;
        setCommunityStats(stats);
        console.log('📊 Community stats loaded:', stats);
      }
    } catch (error) {
      CommunityProfileLogger.logError(apiName, error);
    }
  };

  const fetchCommunityPosts = async (resetPage = true) => {
    const apiName = 'getCommunityPostsApi';
    const params = {
      page: resetPage ? 1 : page + 1,
      limit: 20,
      sort: sortBy,
      postType: filterType === 'all' ? undefined : filterType,
    };

    CommunityProfileLogger.logRequest(apiName, params);

    try {
      const response = await getCommunityPostsApi(communityId, params);
      CommunityProfileLogger.logResponse(apiName, response);

      if (response?.data?.success) {
        const postsData = response.data.data?.posts || [];
        
        if (resetPage) {
          setPosts(postsData);
          setPage(1);
        } else {
          setPosts(prev => [...prev, ...postsData]);
          setPage(prev => prev + 1);
        }

        setHasMore(response.data.data?.hasMore || false);
        console.log(`📝 Loaded ${postsData.length} posts`);
      }
    } catch (error) {
      CommunityProfileLogger.logError(apiName, error);
    }
  };

  const fetchCommunityActivity = async () => {
    const apiName = 'getCommunityActivityApi';
    const params = {
      limit: 10,
      timeframe: '24h',
    };

    CommunityProfileLogger.logRequest(apiName, params);

    try {
      const response = await getCommunityActivityApi(communityId, params);
      CommunityProfileLogger.logResponse(apiName, response);

      if (response?.data?.success) {
        const activities = response.data.data?.activities || [];
        setCommunityActivity(activities);
        console.log(`📈 Loaded ${activities.length} activities`);
      }
    } catch (error) {
      CommunityProfileLogger.logError(apiName, error);
    }
  };

  const fetchSimilarCommunities = async () => {
    const apiName = 'getSimilarCommunitiesApi';
    CommunityProfileLogger.logRequest(apiName, {communityId, limit: 6});

    try {
      const response = await getSimilarCommunitiesApi(communityId, 6);
      CommunityProfileLogger.logResponse(apiName, response);

      if (response?.data?.success) {
        const similar = response.data.data?.similarCommunities || [];
        setSimilarCommunities(similar);
        console.log(`🔗 Loaded ${similar.length} similar communities`);
      }
    } catch (error) {
      CommunityProfileLogger.logError(apiName, error);
    }
  };

  const fetchFeedConfig = async () => {
    const apiName = 'getCommunityFeedConfigApi';
    CommunityProfileLogger.logRequest(apiName, {communityId});

    try {
      const response = await getCommunityFeedConfigApi(communityId);
      CommunityProfileLogger.logResponse(apiName, response);

      if (response?.data?.success) {
        const config = response.data.data?.configuration;
        setFeedConfig(config);
        console.log('⚙️ Feed config loaded:', config);
      }
    } catch (error) {
      CommunityProfileLogger.logError(apiName, error);
    }
  };

  const handleSearchPosts = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const apiName = 'searchCommunityPostsApi';
    const params = {
      query: searchQuery.trim(),
      page: 1,
      limit: 20,
      sort: sortBy,
    };

    CommunityProfileLogger.logRequest(apiName, params);

    try {
      const response = await searchCommunityPostsApi(communityId, params);
      CommunityProfileLogger.logResponse(apiName, response);

      if (response?.data?.success) {
        const results = response.data.data?.posts || [];
        setSearchResults(results);
        
        CommunityProfileLogger.logUserAction('Community Search Used', {
          community_id: communityId,
          query: searchQuery,
          results_count: results.length,
        });
        
        console.log(`🔍 Search completed: ${results.length} results`);
      }
    } catch (error) {
      CommunityProfileLogger.logError(apiName, error);
    }
  };

  // ===============================
  // EVENT HANDLERS
  // ===============================

  const handleJoinCommunity = useCallback(async () => {
    console.log(`\n🤝 Attempting to join community: ${community?.name}`);
    
    const apiName = 'joinCommunityApi';
    CommunityProfileLogger.logRequest(apiName, {
      communityId,
      autoJoin: community?.joinMethod === 'open' || !community?.requiresApproval,
    });

    try {
      const response = await joinCommunityApi(communityId, {
        autoJoin: community?.joinMethod === 'open' || !community?.requiresApproval,
      });
      CommunityProfileLogger.logResponse(apiName, response);

      if (response?.data?.success) {
        setIsJoined(true);
        setUserRole(response.data.data?.userRole || 'member');
        
        // Update community stats
        setCommunityStats(prev => ({
          ...prev,
          totalMembers: (prev?.totalMembers || prev?.memberCount || 0) + 1,
        }));

        CommunityProfileLogger.logUserAction('Community Joined', {
          community_id: communityId,
          community_name: community?.name,
          join_method: community?.joinMethod,
        });

        Alert.alert(
          'Welcome!',
          `You've successfully joined ${community?.name}!`,
          [
            {text: 'Great!', style: 'default'},
          ]
        );
      }
    } catch (error) {
      CommunityProfileLogger.logError(apiName, error);
      Alert.alert('Error', 'Failed to join community. Please try again.');
    }
  }, [community, communityId]);

  const handleLeaveCommunity = useCallback(async () => {
    // Don't allow owners to leave their own community
    if (userRole === 'owner') {
      Alert.alert(
        'Cannot Leave',
        'As the owner, you cannot leave your own community. You can transfer ownership to another member first.',
        [{text: 'OK', style: 'default'}]
      );
      return;
    }

    Alert.alert(
      'Leave Community',
      `Are you sure you want to leave ${community?.name}?${userRole ? `\n\nYou will lose your ${userRole} privileges.` : ''}`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            console.log(`\n👋 Leaving community: ${community?.name}`);
            
            const apiName = 'leaveCommunityApi';
            CommunityProfileLogger.logRequest(apiName, {communityId});

            try {
              const response = await leaveCommunityApi(communityId);
              CommunityProfileLogger.logResponse(apiName, response);

              if (response?.data?.success) {
                setIsJoined(false);
                setUserRole(null);
                
                // Update community stats
                setCommunityStats(prev => ({
                  ...prev,
                  totalMembers: Math.max((prev?.totalMembers || prev?.memberCount || 0) - 1, 0),
                }));

                CommunityProfileLogger.logUserAction('Community Left', {
                  community_id: communityId,
                  community_name: community?.name,
                  previous_role: userRole,
                });
              }
            } catch (error) {
              CommunityProfileLogger.logError(apiName, error);
              Alert.alert('Error', 'Failed to leave community. Please try again.');
            }
          }
        },
      ]
    );
  }, [community, communityId, userRole]);

  const handleBookmarkToggle = useCallback(async () => {
    const newBookmarkStatus = !isBookmarked;
    setIsBookmarked(newBookmarkStatus);

    try {
      if (newBookmarkStatus) {
        await bookmarkCommunityApi(communityId);
        CommunityProfileLogger.logUserAction('Community Bookmarked', {
          community_id: communityId,
          community_name: community?.name,
        });
      } else {
        await removeBookmarkCommunityApi(communityId);
        CommunityProfileLogger.logUserAction('Community Unbookmarked', {
          community_id: communityId,
          community_name: community?.name,
        });
      }

      await saveUserPreferences();
    } catch (error) {
      setIsBookmarked(!newBookmarkStatus);
      CommunityProfileLogger.logError('bookmark_toggle', error);
    }
  }, [isBookmarked, communityId, community]);

  const handleFollowToggle = useCallback(async () => {
    const newFollowStatus = !isFollowing;
    setIsFollowing(newFollowStatus);

    try {
      if (newFollowStatus) {
        await followCommunityApi(communityId);
        CommunityProfileLogger.logUserAction('Community Followed', {
          community_id: communityId,
          community_name: community?.name,
        });
      } else {
        await unfollowCommunityApi(communityId);
        CommunityProfileLogger.logUserAction('Community Unfollowed', {
          community_id: communityId,
          community_name: community?.name,
        });
      }

      await saveUserPreferences();
    } catch (error) {
      setIsFollowing(!newFollowStatus);
      CommunityProfileLogger.logError('follow_toggle', error);
    }
  }, [isFollowing, communityId, community]);

  const handleShareCommunity = useCallback(async () => {
    try {
      const shareContent = {
        title: community?.name,
        message: `Check out ${community?.name} on our app!`,
        url: `https://app.example.com/community/${communityId}`, // Replace with your deep link
      };

      await Share.share(shareContent);
      
      CommunityProfileLogger.logUserAction('Community Shared', {
        community_id: communityId,
        community_name: community?.name,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  }, [community, communityId]);

  const handleSortOrFilterChange = useCallback(() => {
    CommunityProfileLogger.logUserAction('Community Feed Sorted', {
      community_id: communityId,
      sort_by: sortBy,
      filter_type: filterType,
    });

    fetchCommunityPosts(true);
  }, [sortBy, filterType, communityId]);

  const handlePostPress = useCallback((post) => {
    console.log(`\n📝 Post pressed: ${post.title}`);
    navigation.navigate(Routes.CommunityPostDetail, {
      postId: post.id,
      communityId,
      post,
    });
  }, [navigation, communityId]);

  const handlePostVote = useCallback(async (post, voteType) => {
    // This would be implemented in the post voting API
    console.log(`🗳️ Vote on post: ${post.title}, type: ${voteType}`);
  }, []);

  const handlePostShare = useCallback(async (post) => {
    try {
      const shareContent = {
        title: post.title,
        message: `Check out this post: ${post.title}`,
        url: `https://app.example.com/post/${post.id}`,
      };

      await Share.share(shareContent);
      
      CommunityProfileLogger.logUserAction('Community Post Shared', {
        post_id: post.id,
        post_title: post.title,
        community_id: communityId,
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  }, [communityId]);

  const handlePostBookmark = useCallback(async (post) => {
    console.log(`🔖 Bookmark post: ${post.title}`);
    // This would call the post bookmark API
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      initialCommunity ? Promise.resolve() : fetchCommunityDetails(),
      fetchCommunityStats(),
      fetchCommunityPosts(true),
      fetchCommunityActivity(),
    ]);
    setRefreshing(false);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true);
      fetchCommunityPosts(false);
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  const saveUserPreferences = async () => {
    try {
      const prefs = {
        bookmarked: isBookmarked,
        following: isFollowing,
        sortBy,
      };
      await AsyncStorage.setItem(`community_${communityId}_prefs`, JSON.stringify(prefs));
    } catch (error) {
      console.log('Save preferences error:', error);
    }
  };

  // ===============================
  // RENDER FUNCTIONS
  // ===============================

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {[
        {id: 'posts', label: 'Posts', icon: 'chatbubbles'},
        {id: 'about', label: 'About', icon: 'information-circle'},
        {id: 'members', label: 'Members', icon: 'people'},
        {id: 'events', label: 'Events', icon: 'calendar'},
      ].map((tab) => (
        <TouchableOpacity
          key={tab.id}
          style={[styles.tabButton, activeTab === tab.id && styles.tabButtonActive]}
          onPress={() => setActiveTab(tab.id)}
        >
          <Icon 
            name={tab.icon} 
            size={18} 
            color={activeTab === tab.id ? COMMUNITY_COLORS.accent : COMMUNITY_COLORS.textMuted} 
          />
          <Text style={[
            styles.tabText,
            activeTab === tab.id && styles.tabTextActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderSortAndFilters = () => (
    <View style={styles.controlsContainer}>
      {/* Search Bar */}
      {showSearchBar && (
        <Animated.View 
          entering={FadeInDown} 
          exiting={FadeInUp}
          style={styles.searchContainer}
        >
          <View style={styles.searchBar}>
            <Icon name="search" size={18} color={COMMUNITY_COLORS.textMuted} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search posts in this community..."
              placeholderTextColor={COMMUNITY_COLORS.textDim}
              returnKeyType="search"
            />
            <TouchableOpacity 
              style={styles.searchCloseButton}
              onPress={() => {
                setShowSearchBar(false);
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <Icon name="close" size={18} color={COMMUNITY_COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}

      {/* Sort and Filter Controls */}
      <View style={styles.sortFilterContainer}>
        {/* Sort Options */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortContainer}>
          {[
            {id: 'hot', label: 'Hot', icon: 'flame'},
            {id: 'new', label: 'New', icon: 'time'},
            {id: 'top', label: 'Top', icon: 'trending-up'},
            {id: 'rising', label: 'Rising', icon: 'rocket'},
          ].map((sort) => (
            <TouchableOpacity
              key={sort.id}
              style={[styles.sortChip, sortBy === sort.id && styles.sortChipActive]}
              onPress={() => setSortBy(sort.id)}
            >
              <Icon 
                name={sort.icon} 
                size={14} 
                color={sortBy === sort.id ? COMMUNITY_COLORS.textPrimary : COMMUNITY_COLORS.textMuted} 
              />
              <Text style={[
                styles.sortChipText,
                sortBy === sort.id && styles.sortChipTextActive
              ]}>
                {sort.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowSearchBar(!showSearchBar)}
          >
            <Icon name="search" size={18} color={COMMUNITY_COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setFiltersVisible(!filtersVisible)}
          >
            <Icon name="filter" size={18} color={COMMUNITY_COLORS.textMuted} />
            {filterType !== 'all' && (
              <View style={styles.filterIndicator} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Options */}
      {filtersVisible && (
        <Animated.View 
          entering={FadeInDown} 
          exiting={FadeInUp}
          style={styles.filterContainer}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              {id: 'all', label: 'All Posts'},
              {id: 'text', label: 'Text'},
              {id: 'image', label: 'Images'},
              {id: 'poll', label: 'Polls'},
              {id: 'event', label: 'Events'},
              {id: 'announcement', label: 'Announcements'},
            ].map((filter) => (
              <TouchableOpacity
                key={filter.id}
                style={[styles.filterChip, filterType === filter.id && styles.filterChipActive]}
                onPress={() => setFilterType(filter.id)}
              >
                <Text style={[
                  styles.filterChipText,
                  filterType === filter.id && styles.filterChipTextActive
                ]}>
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );

  const renderCreatePostFAB = () => {
    if (!isJoined) return null;

    return (
      <TouchableOpacity 
        style={styles.createPostFAB}
        onPress={() => navigation.navigate(Routes.CreateCommunityPost, {
          communityId: community.id,
          communityName: community.name,
        })}
      >
        <LinearGradient
          colors={[COMMUNITY_COLORS.accent, COMMUNITY_COLORS.accentLight]}
          style={styles.createPostFABGradient}
        >
          <Icon name="add" size={24} color={COMMUNITY_COLORS.textPrimary} />
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderPostsList = () => {
    const dataToRender = searchQuery ? searchResults : posts;

    if (dataToRender.length === 0 && !loading) {
      return (
        <View style={styles.emptyState}>
          <Icon name="chatbubbles-outline" size={64} color={COMMUNITY_COLORS.textDim} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No posts found' : 'No posts yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchQuery 
              ? 'Try a different search term'
              : isJoined 
                ? 'Be the first to post in this community!'
                : 'Join the community to see posts'
            }
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        ref={flatListRef}
        data={dataToRender}
        renderItem={({item, index}) => (
          <CommunityPostCard
            post={item}
            onPress={handlePostPress}
            onVote={handlePostVote}
            onShare={handlePostShare}
            onBookmark={handlePostBookmark}
            index={index}
          />
        )}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListFooterComponent={() => {
          if (!loadingMore) return null;
          return (
            <View style={styles.loadMoreContainer}>
              <ActivityIndicator size="small" color={COMMUNITY_COLORS.accent} />
            </View>
          );
        }}
        contentContainerStyle={styles.postsContainer}
      />
    );
  };

  // ===============================
  // MAIN RENDER
  // ===============================

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COMMUNITY_COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COMMUNITY_COLORS.accent} />
          <Text style={styles.loadingText}>Loading community...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!community) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COMMUNITY_COLORS.background} />
        <MainHeader
          title="Community Not Found"
          showBackButton
          onBackPress={() => navigation.goBack()}
          backgroundColor={COMMUNITY_COLORS.background}
          titleColor={COMMUNITY_COLORS.textPrimary}
        />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle-outline" size={64} color={COMMUNITY_COLORS.error} />
          <Text style={styles.errorTitle}>Community Not Found</Text>
          <Text style={styles.errorSubtitle}>This community may have been deleted or you don't have access to it.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COMMUNITY_COLORS.background} />
      
      <MainHeader
        title={community.name}
        showBackButton
        onBackPress={() => navigation.goBack()}
        backgroundColor={COMMUNITY_COLORS.background}
        titleColor={COMMUNITY_COLORS.textPrimary}
      />

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COMMUNITY_COLORS.accent}
            colors={[COMMUNITY_COLORS.accent]}
          />
        }
      >
        {/* Community Header */}
        <CommunityHeader
          community={community}
          stats={communityStats}
          isJoined={isJoined}
          isBookmarked={isBookmarked}
          isFollowing={isFollowing}
          userRole={userRole}
          onJoin={handleJoinCommunity}
          onLeave={handleLeaveCommunity}
          onBookmark={handleBookmarkToggle}
          onFollow={handleFollowToggle}
          onShare={handleShareCommunity}
        />

        {/* Management Section for Owner/Admin/Moderator */}
{(['owner', 'admin', 'moderator'].includes(userRole)) && (
  <View style={styles.managementSection}>
    <TouchableOpacity
      style={styles.managementButton}
      onPress={() => {
        console.log('🏢 Opening Community Management for:', community?.name);
        navigation.navigate(Routes.CommunityManagement, {
          communityId: community.id || community._id,
          communityData: community,
          userRole: userRole
        });
      }}
      activeOpacity={0.7}
    >
      <Icon name="settings" size={20} color={COMMUNITY_COLORS.accent} />
      <Text style={styles.managementButtonText}>Manage Community</Text>
      <Icon name="chevron-forward" size={16} color={COMMUNITY_COLORS.textMuted} />
    </TouchableOpacity>
  </View>
)}
        {/* Tab Bar */}
        {renderTabBar()}

        {/* Content based on active tab */}
        {activeTab === 'posts' && (
          <>
            {renderSortAndFilters()}
            {renderPostsList()}
          </>
        )}

        {activeTab === 'about' && (
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutText}>About section coming soon...</Text>
          </View>
        )}

{activeTab === 'members' && (
  <TouchableOpacity 
    style={styles.membersContainer}
    onPress={() => navigation.navigate(Routes.CommunityMembers, {
      communityId: community.id || community._id,
      communityName: community.name,
    })}
  >
    <View style={styles.memberPreview}>
      <Icon name="people" size={32} color={COMMUNITY_COLORS.accent} />
      <Text style={styles.memberPreviewText}>
        View all {formatNumber(communityStats?.totalMembers || 0)} members
      </Text>
      <Icon name="chevron-forward" size={20} color={COMMUNITY_COLORS.textMuted} />
    </View>
  </TouchableOpacity>
)}

        {activeTab === 'events' && (
          <View style={styles.eventsContainer}>
            <Text style={styles.eventsText}>Events section coming soon...</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Post FAB */}
      {renderCreatePostFAB()}
    </SafeAreaView>
  );
};

// ===============================
// STYLES
// ===============================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COMMUNITY_COLORS.background,
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: nh(16),
    fontSize: nw(16),
    color: COMMUNITY_COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(32),
  },
  errorTitle: {
    fontSize: nw(20),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textPrimary,
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  errorSubtitle: {
    fontSize: nw(16),
    color: COMMUNITY_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: nh(24),
  },

  // Community Header Styles
  communityHeader: {
    backgroundColor: COMMUNITY_COLORS.surface,
  },
  coverImageContainer: {
    height: nh(150),
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  coverImagePlaceholder: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: nh(80),
  },
  headerActions: {
    position: 'absolute',
    top: nh(12),
    right: nw(16),
    flexDirection: 'row',
    gap: nw(8),
  },
  headerActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: nw(20),
    padding: nw(8),
  },
  communityInfo: {
    padding: nw(16),
  },
  communityBasicInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(16),
  },
  avatarContainer: {
    position: 'relative',
    marginRight: nw(12),
  },
  communityAvatar: {
    width: nw(60),
    height: nw(60),
    borderRadius: nw(30),
    borderWidth: nw(3),
    borderColor: COMMUNITY_COLORS.surface,
  },
  communityAvatarPlaceholder: {
    width: nw(60),
    height: nw(60),
    borderRadius: nw(30),
    borderWidth: nw(3),
    borderColor: COMMUNITY_COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityAvatarText: {
    fontSize: nw(24),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textPrimary,
  },
  communityBadge: {
    position: 'absolute',
    bottom: -nh(2),
    right: -nw(2),
    borderRadius: nw(12),
    padding: nw(4),
  },
  badge_verified: {
    backgroundColor: COMMUNITY_COLORS.success,
  },
  badge_popular: {
    backgroundColor: COMMUNITY_COLORS.warning,
  },
  badge_new: {
    backgroundColor: COMMUNITY_COLORS.info,
  },
  communityNameContainer: {
    flex: 1,
  },
  communityName: {
    fontSize: nw(22),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textPrimary,
    marginBottom: nh(4),
  },
  communitySubtitle: {
    fontSize: nw(14),
    color: COMMUNITY_COLORS.textSecondary,
  },
  communityActions: {
    flexDirection: 'row',
    gap: nw(8),
    marginBottom: nh(16),
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(20),
    paddingVertical: nh(10),
    borderRadius: nw(20),
    gap: nw(6),
  },
  joinButton: {
    backgroundColor: COMMUNITY_COLORS.accent,
  },
  joinedButton: {
    backgroundColor: COMMUNITY_COLORS.success,
  },
  ownerButton: {
    backgroundColor: COMMUNITY_COLORS.owner,
  },
  adminButton: {
    backgroundColor: COMMUNITY_COLORS.admin,
  },
  moderatorButton: {
    backgroundColor: COMMUNITY_COLORS.moderator,
  },
  primaryActionText: {
    fontSize: nw(14),
    fontWeight: '600',
    color: COMMUNITY_COLORS.textPrimary,
  },
  secondaryActionButton: {
    padding: nw(10),
    borderRadius: nw(20),
    backgroundColor: COMMUNITY_COLORS.surfaceLight,
  },
  followingButton: {
    backgroundColor: COMMUNITY_COLORS.follow + '20',
  },
  communityDescription: {
    fontSize: nw(14),
    color: COMMUNITY_COLORS.textSecondary,
    lineHeight: nh(20),
    marginBottom: nh(16),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: nh(12),
    backgroundColor: COMMUNITY_COLORS.surfaceLight,
    borderRadius: nw(8),
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: nw(4),
  },
  statValue: {
    fontSize: nw(16),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textPrimary,
  },
  statLabel: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.textMuted,
  },
  statDivider: {
    width: nw(1),
    height: nh(24),
    backgroundColor: COMMUNITY_COLORS.border,
  },
  onlineIndicator: {
    width: nw(8),
    height: nw(8),
    borderRadius: nw(4),
    backgroundColor: COMMUNITY_COLORS.online,
  },

  // Tab Bar Styles
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COMMUNITY_COLORS.surface,
    borderBottomWidth: nw(1),
    borderBottomColor: COMMUNITY_COLORS.border,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(12),
    gap: nw(6),
  },
  tabButtonActive: {
    borderBottomWidth: nw(2),
    borderBottomColor: COMMUNITY_COLORS.accent,
  },
  tabText: {
    fontSize: nw(14),
    color: COMMUNITY_COLORS.textMuted,
  },
  tabTextActive: {
    color: COMMUNITY_COLORS.accent,
    fontWeight: '600',
  },

  // Controls Styles
  controlsContainer: {
    backgroundColor: COMMUNITY_COLORS.surface,
  },
  searchContainer: {
    padding: nw(16),
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COMMUNITY_COLORS.surfaceLight,
    borderRadius: nw(20),
    paddingHorizontal: nw(16),
    paddingVertical: nh(10),
    gap: nw(8),
  },
  searchInput: {
    flex: 1,
    fontSize: nw(14),
    color: COMMUNITY_COLORS.textPrimary,
  },
  searchCloseButton: {
    padding: nw(4),
  },
  sortFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    paddingBottom: nh(12),
  },
  sortContainer: {
    flex: 1,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(16),
    backgroundColor: COMMUNITY_COLORS.surfaceLight,
    marginRight: nw(8),
    gap: nw(4),
  },
  sortChipActive: {
    backgroundColor: COMMUNITY_COLORS.accent,
  },
  sortChipText: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.textMuted,
  },
  sortChipTextActive: {
    color: COMMUNITY_COLORS.textPrimary,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: nw(8),
  },
  actionButton: {
    padding: nw(8),
    borderRadius: nw(8),
    backgroundColor: COMMUNITY_COLORS.surfaceLight,
    position: 'relative',
  },
  filterIndicator: {
    position: 'absolute',
    top: nw(2),
    right: nw(2),
    width: nw(8),
    height: nw(8),
    borderRadius: nw(4),
    backgroundColor: COMMUNITY_COLORS.accent,
  },
  filterContainer: {
    paddingHorizontal: nw(16),
    paddingBottom: nh(12),
  },
  filterChip: {
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(16),
    backgroundColor: COMMUNITY_COLORS.surfaceLight,
    marginRight: nw(8),
  },
  filterChipActive: {
    backgroundColor: COMMUNITY_COLORS.accent,
  },
  filterChipText: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.textMuted,
  },
  filterChipTextActive: {
    color: COMMUNITY_COLORS.textPrimary,
    fontWeight: '600',
  },

  // Post Card Styles
  postsContainer: {
    paddingBottom: nh(100),
  },
  postCard: {
    backgroundColor: COMMUNITY_COLORS.surface,
    marginHorizontal: nw(16),
    marginVertical: nh(4),
    borderRadius: nw(8),
    borderWidth: nw(1),
    borderColor: COMMUNITY_COLORS.border,
  },
  postCardPressable: {
    flexDirection: 'row',
    padding: nw(12),
  },
  voteSection: {
    alignItems: 'center',
    marginRight: nw(12),
    minWidth: nw(40),
  },
  voteButton: {
    padding: nw(4),
    borderRadius: nw(4),
  },
  voteButtonActive: {
    backgroundColor: COMMUNITY_COLORS.surfaceLight,
  },
  voteScore: {
    fontSize: nw(12),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textSecondary,
    marginVertical: nh(4),
    textAlign: 'center',
  },
  voteScoreUp: {
    color: COMMUNITY_COLORS.upvote,
  },
  voteScoreDown: {
    color: COMMUNITY_COLORS.downvote,
  },
  postContent: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  authorAvatar: {
    width: nw(20),
    height: nw(20),
    borderRadius: nw(10),
    marginRight: nw(6),
  },
  authorName: {
    fontSize: nw(12),
    fontWeight: '600',
    color: COMMUNITY_COLORS.textSecondary,
  },
  dotSeparator: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.textDim,
    marginHorizontal: nw(4),
  },
  postTime: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.textMuted,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    backgroundColor: COMMUNITY_COLORS.success + '20',
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    borderRadius: nw(8),
    gap: nw(2),
  },
  pinnedText: {
    fontSize: nw(10),
    color: COMMUNITY_COLORS.success,
    fontWeight: '600',
  },
  postTitle: {
    fontSize: nw(16),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textPrimary,
    marginBottom: nh(8),
    lineHeight: nh(22),
  },
  postDescription: {
    fontSize: nw(14),
    color: COMMUNITY_COLORS.textSecondary,
    lineHeight: nh(20),
    marginBottom: nh(8),
  },
  mediaContainer: {
    position: 'relative',
    marginBottom: nh(8),
  },
  postImage: {
    width: '100%',
    height: nh(200),
    borderRadius: nw(8),
  },
  mediaOverlay: {
    position: 'absolute',
    bottom: nw(8),
    right: nw(8),
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: nw(12),
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
  },
  mediaCount: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.textPrimary,
    fontWeight: 'bold',
  },
  postMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(8),
    gap: nw(8),
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    borderRadius: nw(8),
    gap: nw(2),
  },
  type_poll: {
    backgroundColor: COMMUNITY_COLORS.info + '30',
  },
  type_event: {
    backgroundColor: COMMUNITY_COLORS.warning + '30',
  },
  type_announcement: {
    backgroundColor: COMMUNITY_COLORS.error + '30',
  },
  typeText: {
    fontSize: nw(10),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textPrimary,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: nw(4),
  },
  tagText: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.accent,
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(16),
  },
  actionText: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.textMuted,
    marginLeft: nw(4),
  },
  actionTextActive: {
    color: COMMUNITY_COLORS.bookmark,
    fontWeight: '600',
  },

  // FAB Styles
  createPostFAB: {
    position: 'absolute',
    bottom: nh(20),
    right: nw(20),
    width: nw(56),
    height: nw(56),
    borderRadius: nw(28),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  createPostFABGradient: {
    width: '100%',
    height: '100%',
    borderRadius: nw(28),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Empty States
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(60),
    paddingHorizontal: nw(32),
  },
  emptyTitle: {
    fontSize: nw(18),
    fontWeight: 'bold',
    color: COMMUNITY_COLORS.textPrimary,
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  emptySubtitle: {
    fontSize: nw(14),
    color: COMMUNITY_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: nh(20),
  },
  loadMoreContainer: {
    padding: nh(20),
    alignItems: 'center',
  },

  // Tab Content Styles
  aboutContainer: {
    padding: nw(16),
  },
  aboutText: {
    fontSize: nw(16),
    color: COMMUNITY_COLORS.textSecondary,
    textAlign: 'center',
  },
  membersContainer: {
    padding: nw(16),
  },
  membersText: {
    fontSize: nw(16),
    color: COMMUNITY_COLORS.textSecondary,
    textAlign: 'center',
  },
  eventsContainer: {
    padding: nw(16),
  },
  eventsText: {
    fontSize: nw(16),
    color: COMMUNITY_COLORS.textSecondary,
    textAlign: 'center',
  },

  // Additional styles for new elements
  pollPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COMMUNITY_COLORS.info + '10',
    padding: nw(8),
    borderRadius: nw(8),
    marginBottom: nh(8),
    gap: nw(8),
  },
  pollQuestion: {
    flex: 1,
    fontSize: nw(14),
    color: COMMUNITY_COLORS.textSecondary,
  },
  eventPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COMMUNITY_COLORS.warning + '10',
    padding: nw(8),
    borderRadius: nw(8),
    marginBottom: nh(8),
    gap: nw(8),
  },
  eventDetails: {
    flex: 1,
  },
  eventTitle: {
    fontSize: nw(14),
    fontWeight: '600',
    color: COMMUNITY_COLORS.textPrimary,
  },
  eventDate: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.textMuted,
    marginTop: nh(2),
  },
  announcementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COMMUNITY_COLORS.warning + '10',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nw(8),
    marginBottom: nh(8),
    gap: nw(4),
  },
  urgentAnnouncement: {
    backgroundColor: COMMUNITY_COLORS.error + '10',
  },
  highAnnouncement: {
    backgroundColor: COMMUNITY_COLORS.warning + '20',
  },
  announcementText: {
    fontSize: nw(12),
    fontWeight: '600',
    color: COMMUNITY_COLORS.textPrimary,
  },
  linkPreviewContainer: {
    borderWidth: nw(1),
    borderColor: COMMUNITY_COLORS.border,
    borderRadius: nw(8),
    overflow: 'hidden',
    marginBottom: nh(8),
  },
  linkPreviewImage: {
    width: '100%',
    height: nh(120),
    resizeMode: 'cover',
  },
  linkPreviewContent: {
    padding: nw(8),
  },
  linkPreviewTitle: {
    fontSize: nw(14),
    fontWeight: '600',
    color: COMMUNITY_COLORS.textPrimary,
    marginBottom: nh(4),
  },
  linkPreviewUrl: {
    fontSize: nw(12),
    color: COMMUNITY_COLORS.textMuted,
  },
  encryptionIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
    marginTop: nh(8),
    paddingTop: nh(8),
    borderTopWidth: nw(1),
    borderTopColor: COMMUNITY_COLORS.border,
  },
  encryptionText: {
    fontSize: nw(11),
    color: COMMUNITY_COLORS.success,
  },
  type_link: {
    backgroundColor: COMMUNITY_COLORS.info + '30',
  },
  type_image: {
    backgroundColor: COMMUNITY_COLORS.accent + '30',
  },
  type_file: {
    backgroundColor: COMMUNITY_COLORS.textMuted + '30',
  },

  // Management Section Styles
managementSection: {
  backgroundColor: COMMUNITY_COLORS.surface,
  marginHorizontal: nw(16),
  marginTop: nh(8),
  borderRadius: nw(12),
  borderWidth: nw(1),
  borderColor: COMMUNITY_COLORS.border,
},
managementButton: {
  flexDirection: 'row',
  alignItems: 'center',
  padding: nw(16),
  gap: nw(12),
},
managementButtonText: {
  flex: 1,
  fontSize: nw(16),
  fontWeight: '600',
  color: COMMUNITY_COLORS.textPrimary,
},
});

export default CommunityProfile;