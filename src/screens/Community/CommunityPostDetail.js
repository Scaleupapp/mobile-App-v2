// src/screens/Community/CommunityPostDetail.js
/**
 * Community Post Detail Screen - Reddit Thread × Discord Channel Message Hybrid
 * Full post view with comments, interactions, and rich media support
 * Production-ready with comprehensive API integration and error handling
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
  SlideOutRight,
  ZoomIn,
  BounceIn,
  useAnimatedScrollHandler,
  useAnimatedRef,
} from 'react-native-reanimated';
import {PanGestureHandler, State} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';

import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {
  getCommunityPostDetailsApi,
  voteOnPostApi,
  addCommentApi,
  votePollApi,
  rsvpEventApi,
  sharePostApi,
  bookmarkPostApi,
  reportPostApi,
  updatePostApi,
  deletePostApi,
  pinPostApi,
  featurePostApi,
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
// UNIFIED COLOR SYSTEM
// ===============================
const POST_COLORS = {
  // Primary Reddit × Discord Theme
  primary: '#FF4500', // Reddit Orange
  primaryLight: '#FF5700',
  primaryDark: '#C44569',
  
  accent: '#5865F2', // Discord Blurple
  accentLight: '#7289DA',
  accentDark: '#4752C4',
  
  // Interaction Colors
  upvote: '#FF4500',
  downvote: '#7193FF',
  comment: '#5865F2',
  share: '#1DA1F2',
  bookmark: '#FFB800',
  report: '#ED4245',
  
  // Post Type Colors
  text: '#B9BBBE',
  poll: '#3BA55D',
  event: '#FAA61A',
  announcement: '#ED4245',
  
  // Background Hierarchy
  background: '#0F0F23', // Deep purple black
  surface: '#1A1A2E', // Surface
  elevated: '#252538', // Elevated surface
  overlay: 'rgba(0, 0, 0, 0.7)',
  
  // Text Colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B9BBBE',
  textMuted: '#72767D',
  textLink: '#00B0F4',
  
  // Status Colors
  success: '#3BA55D',
  warning: '#FAA61A',
  danger: '#ED4245',
  info: '#5865F2',
  
  // Role Colors
  owner: '#FFB800',
  moderator: '#5865F2',
  admin: '#ED4245',
  verified: '#3BA55D',
};

// ===============================
// POST TYPE CONFIGURATIONS
// ===============================
const POST_TYPES = {
  text: {
    icon: 'text-fields',
    color: POST_COLORS.text,
    label: 'Discussion',
  },
  poll: {
    icon: 'poll',
    color: POST_COLORS.poll,
    label: 'Poll',
  },
  event: {
    icon: 'event',
    color: POST_COLORS.event,
    label: 'Event',
  },
  announcement: {
    icon: 'campaign',
    color: POST_COLORS.announcement,
    label: 'Announcement',
  },
};

// ===============================
// MAIN COMPONENT
// ===============================
const CommunityPostDetail = ({navigation, route}) => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);
  const {postId, communityId} = route.params;
  
  // State Management
  const [postData, setPostData] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [selectedPollOption, setSelectedPollOption] = useState(null);
  const [userVote, setUserVote] = useState(null); // 'up', 'down', or null
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Animation Values
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(0);
  const fabScale = useSharedValue(1);
  const voteAnimation = useSharedValue(1);
  const commentInputHeight = useSharedValue(60);
  
  // Refs
  const scrollViewRef = useAnimatedRef();
  const commentInputRef = useRef(null);
  
  // ===============================
  // API CALLS
  // ===============================
  
  const fetchPostDetails = useCallback(async () => {
    try {
      console.log('🔄 Fetching post details:', {postId, communityId});
      
      // Fetch post details
      const response = await getCommunityPostDetailsApi(communityId, postId);
      if (response?.data?.success) {
        const post = response.data.data.post;
        setPostData(post);
        
        // Set user interaction states from the response
        if (post.userInteractions) {
          setUserVote(post.userInteractions.upvoted ? 'up' : 
                     post.userInteractions.downvoted ? 'down' : null);
          setIsBookmarked(post.userInteractions.bookmarked || false);
        }
        
        // Set comments if they exist
        setComments(response.data.data.comments || []);
        
        console.log('✅ Post details loaded:', post);
        
        // Track view
        mixpanel.track('Community_Post_Viewed', {
          postId,
          communityId,
          postType: post.postType,
        });
      }
      
    } catch (error) {
      console.error('❌ Error fetching post details:', error);
      Alert.alert('Error', 'Failed to load post details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, communityId]);
  
  useEffect(() => {
    fetchPostDetails();
  }, []); // Empty dependency array to prevent infinite loops
  
  // ===============================
  // INTERACTION HANDLERS
  // ===============================
  
  const handleVote = useCallback(async (voteType) => {
    try {
      // Optimistic update with haptic feedback
      Vibration.vibrate(10);
      const newVote = userVote === voteType ? null : voteType;
      setUserVote(newVote);
      
      // Animate vote button
      voteAnimation.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
      
      const response = await voteOnPostApi(communityId, postId, {
        voteType: newVote,
      });
      
      if (response?.data?.success) {
        // Update metrics
        if (response.data.data.metrics) {
          setPostData(prev => ({
            ...prev,
            metrics: response.data.data.metrics,
          }));
        }
        
        mixpanel.track('Community_Post_Voted', {
          postId,
          communityId,
          voteType: newVote,
        });
      }
    } catch (error) {
      // Revert on error
      setUserVote(userVote);
      console.error('❌ Vote error:', error);
    }
  }, [userVote, communityId, postId, voteAnimation]);
  
  const handleComment = useCallback(async () => {
    if (!commentText.trim()) return;
    
    try {
      Keyboard.dismiss();
      const tempComment = {
        id: Date.now().toString(),
        content: commentText,
        author: userData,
        createdAt: new Date().toISOString(),
        isTemporary: true,
      };
      
      // Optimistic update
      setComments(prev => [tempComment, ...prev]);
      setCommentText('');
      
      const response = await addCommentApi(communityId, postId, {
        content: commentText,
        parentId: replyingTo?.id,
      });
      
      if (response?.data?.success) {
        // Replace temporary comment with real one
        setComments(prev => 
          prev.map(c => c.id === tempComment.id ? response.data.data : c)
        );
        
        // Update comment count
        setPostData(prev => ({
          ...prev,
          metrics: {
            ...prev.metrics,
            comments: (prev.metrics?.comments || 0) + 1,
          },
        }));
        
        mixpanel.track('Community_Comment_Added', {
          postId,
          communityId,
          isReply: !!replyingTo,
        });
      }
      
      setReplyingTo(null);
    } catch (error) {
      // Remove temporary comment on error
      setComments(prev => prev.filter(c => !c.isTemporary));
      console.error('❌ Comment error:', error);
      Alert.alert('Error', 'Failed to post comment');
    }
  }, [commentText, userData, communityId, postId, replyingTo]);
  
  const handleShare = useCallback(async () => {
    try {
      Vibration.vibrate(10);
      
      const shareMessage = postData?.title 
        ? `Check out this post: ${postData.title}\n\nhttps://app.yourplatform.com/post/${postId}`
        : `Check out this post in ${postData?.community?.name}\n\nhttps://app.yourplatform.com/post/${postId}`;
      
      await Share.share({
        message: shareMessage,
        title: postData?.title || 'Community Post',
      });
      
      // Track share
      await sharePostApi(communityId, postId);
      mixpanel.track('Community_Post_Shared', {postId, communityId});
      
    } catch (error) {
      console.error('❌ Share error:', error);
    }
  }, [postData, postId, communityId]);
  
  const handleBookmark = useCallback(async () => {
    try {
      Vibration.vibrate(10);
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);
      
      await bookmarkPostApi(communityId, postId);
      
      mixpanel.track('Community_Post_Bookmarked', {
        postId,
        communityId,
        bookmarked: newBookmarkState,
      });
    } catch (error) {
      setIsBookmarked(!isBookmarked);
      console.error('❌ Bookmark error:', error);
    }
  }, [isBookmarked, communityId, postId]);
  
  const handleRSVP = useCallback(async () => {
    try {
      const response = await rsvpEventApi(communityId, postId, {
        status: postData?.userInteractions?.rsvp ? 'cancel' : 'going',
      });
      
      if (response?.data?.success) {
        setPostData(prev => ({
          ...prev,
          userInteractions: {
            ...prev.userInteractions,
            rsvp: prev.userInteractions?.rsvp ? null : 'going',
          },
        }));
        
        mixpanel.track('Community_Event_RSVP', {
          postId,
          communityId,
          status: postData?.userInteractions?.rsvp ? 'cancelled' : 'going',
        });
      }
    } catch (error) {
      console.error('❌ RSVP error:', error);
    }
  }, [communityId, postId, postData]);
  
  const handlePollVote = useCallback(async (optionId) => {
    try {
      setSelectedPollOption(optionId);
      
      const response = await votePollApi(communityId, postId, {
        optionId,
      });
      
      if (response?.data?.success) {
        setPostData(prev => ({
          ...prev,
          poll: response.data.data.poll,
          userInteractions: {
            ...prev.userInteractions,
            voted: optionId,
          },
        }));
        
        mixpanel.track('Community_Poll_Voted', {
          postId,
          communityId,
          optionId,
        });
      }
    } catch (error) {
      setSelectedPollOption(null);
      console.error('❌ Poll vote error:', error);
    }
  }, [communityId, postId]);
  
  const handleDelete = useCallback(async () => {
    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await deletePostApi(communityId, postId);
              if (response?.data?.success) {
                mixpanel.track('Community_Post_Deleted', {postId, communityId});
                navigation.goBack();
              }
            } catch (error) {
              console.error('❌ Delete error:', error);
              Alert.alert('Error', 'Failed to delete post');
            }
          },
        },
      ]
    );
  }, [communityId, postId, navigation]);
  
  const handlePin = useCallback(async () => {
    try {
      const response = await pinPostApi(communityId, postId);
      if (response?.data?.success) {
        setPostData(prev => ({...prev, isPinned: !prev.isPinned}));
        mixpanel.track('Community_Post_Pinned', {postId, communityId});
      }
    } catch (error) {
      console.error('❌ Pin error:', error);
    }
  }, [communityId, postId]);
  
  const handleFeature = useCallback(async () => {
    try {
      const response = await featurePostApi(communityId, postId);
      if (response?.data?.success) {
        setPostData(prev => ({...prev, isFeatured: !prev.isFeatured}));
        mixpanel.track('Community_Post_Featured', {postId, communityId});
      }
    } catch (error) {
      console.error('❌ Feature error:', error);
    }
  }, [communityId, postId]);
  
  const handleReport = useCallback(async () => {
    Alert.alert(
      'Report Post',
      'Why are you reporting this post?',
      [
        {text: 'Spam', onPress: () => submitReport('spam')},
        {text: 'Inappropriate Content', onPress: () => submitReport('inappropriate')},
        {text: 'Harassment', onPress: () => submitReport('harassment')},
        {text: 'Cancel', style: 'cancel'},
      ]
    );
  }, []);
  
  const submitReport = useCallback(async (reason) => {
    try {
      await reportPostApi(communityId, postId, {reason});
      Alert.alert('Success', 'Post has been reported');
      mixpanel.track('Community_Post_Reported', {postId, communityId, reason});
    } catch (error) {
      console.error('❌ Report error:', error);
    }
  }, [communityId, postId]);
  
  // ===============================
  // ANIMATED STYLES
  // ===============================
  
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
      headerOpacity.value = interpolate(
        event.contentOffset.y,
        [0, 100],
        [0, 1],
        'clamp'
      );
      fabScale.value = interpolate(
        event.contentOffset.y,
        [0, 50],
        [1, 0.8],
        'clamp'
      );
    },
  });
  
  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  
  const animatedFabStyle = useAnimatedStyle(() => ({
    transform: [{scale: fabScale.value}],
  }));
  
  const animatedVoteStyle = useAnimatedStyle(() => ({
    transform: [{scale: voteAnimation.value}],
  }));
  
  // ===============================
  // RENDER FUNCTIONS
  // ===============================
  
  const renderPostContent = () => {
    if (!postData) return null;
    
    const postConfig = POST_TYPES[postData.postType] || POST_TYPES.text;
    
    return (
      <Animated.View 
        entering={FadeInDown.delay(200)}
        style={styles.postContent}
      >
        {/* Post Header */}
        <View style={styles.postHeader}>
          <View style={styles.postAuthorSection}>
            <Image
              source={{uri: postData.community?.avatar || 'https://via.placeholder.com/50'}}
              style={styles.communityAvatar}
            />
            <View style={styles.postMeta}>
              <TouchableOpacity
                onPress={() => navigation.navigate(Routes.CommunityProfile, {
                  communityId: postData.community?._id
                })}
              >
                <Text style={styles.communityName}>{postData.community?.name}</Text>
              </TouchableOpacity>
              <View style={styles.postMetaRow}>
                <Text style={styles.authorName}>
                  {postData.author?.username}
                </Text>
                {postData.author?.role && (
                  <View style={[styles.roleBadge, {
                    backgroundColor: POST_COLORS[postData.author.role] + '20'
                  }]}>
                    <Text style={[styles.roleText, {
                      color: POST_COLORS[postData.author.role]
                    }]}>
                      {postData.author.role.toUpperCase()}
                    </Text>
                  </View>
                )}
                <Text style={styles.postTime}>
                  • {moment(postData.publishedAt || postData.updatedAt).fromNow()}
                </Text>
              </View>
            </View>
          </View>
          
          {/* Post Type Badge */}
          <View style={[styles.typeBadge, {backgroundColor: postConfig.color + '20'}]}>
            <MaterialIcons 
              name={postConfig.icon} 
              size={16} 
              color={postConfig.color}
            />
            <Text style={[styles.typeText, {color: postConfig.color}]}>
              {postConfig.label}
            </Text>
          </View>
        </View>
        
        {/* Post Title */}
        {postData.title && (
          <Text style={styles.postTitle}>{postData.title}</Text>
        )}
        
        {/* Post Body */}
        {postData.content?.text && (
          <Text style={styles.postBody}>{postData.content.text}</Text>
        )}
        
        {/* Media Content */}
        {postData.media?.images && postData.media.images.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.mediaContainer}
          >
            {postData.media.images.map((item, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                style={styles.mediaItem}
              >
                <Image source={{uri: item.url || item}} style={styles.mediaImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
        
        {/* Poll Content */}
        {postData.postType === 'poll' && postData.poll?.options && (
          <View style={styles.pollContainer}>
            {postData.poll.options.map((option) => {
              const totalVotes = postData.poll.totalVotes || 0;
              const percentage = totalVotes > 0 
                ? (option.votes / totalVotes) * 100 
                : 0;
              const isSelected = selectedPollOption === option.id || 
                               postData.userInteractions?.voted === option.id;
              
              return (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.pollOption, isSelected && styles.pollOptionSelected]}
                  onPress={() => handlePollVote(option.id)}
                  disabled={!!postData.userInteractions?.voted}
                >
                  <View style={styles.pollOptionContent}>
                    <Text style={styles.pollOptionText}>{option.text}</Text>
                    {postData.userInteractions?.voted && (
                      <Text style={styles.pollPercentage}>{percentage.toFixed(1)}%</Text>
                    )}
                  </View>
                  {postData.userInteractions?.voted && (
                    <View 
                      style={[styles.pollProgress, {width: `${percentage}%`}]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
            <Text style={styles.pollVotes}>
              {postData.poll.totalVotes} {postData.poll.totalVotes === 1 ? 'vote' : 'votes'}
            </Text>
          </View>
        )}
        
        {/* Event Content */}
        {postData.postType === 'event' && postData.event && (
          <View style={styles.eventContainer}>
            <Text style={styles.eventTitle}>{postData.event.title}</Text>
            {postData.event.description && (
              <Text style={styles.eventDescription}>{postData.event.description}</Text>
            )}
            <View style={styles.eventRow}>
              <Icon name="calendar-outline" size={20} color={POST_COLORS.event} />
              <Text style={styles.eventText}>
                {moment(postData.event.startDate).format('MMM DD, YYYY at h:mm A')}
              </Text>
            </View>
            {postData.event.endDate && (
              <View style={styles.eventRow}>
                <Icon name="time-outline" size={20} color={POST_COLORS.event} />
                <Text style={styles.eventText}>
                  Ends: {moment(postData.event.endDate).format('MMM DD, YYYY at h:mm A')}
                </Text>
              </View>
            )}
            {postData.event.location?.name && (
              <View style={styles.eventRow}>
                <Icon name="location-outline" size={20} color={POST_COLORS.event} />
                <Text style={styles.eventText}>{postData.event.location.name}</Text>
              </View>
            )}
            <TouchableOpacity
              style={[styles.rsvpButton, postData.userInteractions?.rsvp && styles.rsvpButtonActive]}
              onPress={handleRSVP}
            >
              <Text style={styles.rsvpButtonText}>
                {postData.userInteractions?.rsvp ? 'Going ✓' : 'RSVP'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Tags */}
        {postData.tags && postData.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {postData.tags.map((tag, index) => (
              <TouchableOpacity key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };
  
  const renderInteractionBar = () => (
    <Animated.View 
      entering={FadeInUp.delay(300)}
      style={styles.interactionBar}
    >
      {/* Vote Section */}
      <View style={styles.voteSection}>
        <TouchableOpacity
          onPress={() => handleVote('up')}
          style={styles.voteButton}
        >
          <Animated.View style={animatedVoteStyle}>
            <Icon 
              name="arrow-up" 
              size={24} 
              color={userVote === 'up' ? POST_COLORS.upvote : POST_COLORS.textMuted}
            />
          </Animated.View>
        </TouchableOpacity>
        
        <Text style={[styles.voteCount, userVote && {color: POST_COLORS[userVote === 'up' ? 'upvote' : 'downvote']}]}>
          {(postData?.metrics?.upvotes || 0) - (postData?.metrics?.downvotes || 0)}
        </Text>
        
        <TouchableOpacity
          onPress={() => handleVote('down')}
          style={styles.voteButton}
        >
          <Animated.View style={animatedVoteStyle}>
            <Icon 
              name="arrow-down" 
              size={24} 
              color={userVote === 'down' ? POST_COLORS.downvote : POST_COLORS.textMuted}
            />
          </Animated.View>
        </TouchableOpacity>
      </View>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => commentInputRef.current?.focus()}>
          <Icon name="chatbubble-outline" size={20} color={POST_COLORS.comment} />
          <Text style={styles.actionText}>{postData?.metrics?.comments || 0}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Icon name="share-social-outline" size={20} color={POST_COLORS.share} />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleBookmark}>
          <Icon 
            name={isBookmarked ? "bookmark" : "bookmark-outline"} 
            size={20} 
            color={isBookmarked ? POST_COLORS.bookmark : POST_COLORS.textMuted}
          />
        </TouchableOpacity>
        
        {(postData?.isOwner || postData?.isModerator) && (
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => setShowMoreOptions(true)}
          >
            <Icon name="ellipsis-horizontal" size={20} color={POST_COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
  
  const renderComment = ({item, index}) => (
    <Animated.View 
      entering={FadeInDown.delay(index * 50)}
      style={[styles.commentItem, item.isTemporary && styles.commentTemporary]}
    >
      <Image 
        source={{uri: item.author?.avatar || 'https://via.placeholder.com/40'}}
        style={styles.commentAvatar}
      />
      <View style={styles.commentContent}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.author?.username}</Text>
          {item.author?.role && (
            <View style={[styles.commentRoleBadge, {
              backgroundColor: POST_COLORS[item.author.role] + '15'
            }]}>
              <Text style={[styles.commentRoleText, {
                color: POST_COLORS[item.author.role]
              }]}>
                {item.author.role}
              </Text>
            </View>
          )}
          <Text style={styles.commentTime}>
            {moment(item.createdAt).fromNow()}
          </Text>
        </View>
        <Text style={styles.commentText}>{item.content}</Text>
        <View style={styles.commentActions}>
          <TouchableOpacity style={styles.commentAction}>
            <Icon name="arrow-up" size={16} color={POST_COLORS.textMuted} />
            <Text style={styles.commentActionText}>{item.votes || 0}</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.commentAction}
            onPress={() => setReplyingTo(item)}
          >
            <Icon name="arrow-undo" size={16} color={POST_COLORS.textMuted} />
            <Text style={styles.commentActionText}>Reply</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
  
  const renderMoreOptionsModal = () => (
    <Modal
      visible={showMoreOptions}
      transparent
      animationType="slide"
      onRequestClose={() => setShowMoreOptions(false)}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={() => setShowMoreOptions(false)}
      >
        <Animated.View 
          entering={FadeInUp}
          style={styles.moreOptionsContainer}
        >
          {postData?.isOwner && (
            <>
              <TouchableOpacity style={styles.optionItem} onPress={() => {
                setShowMoreOptions(false);
                navigation.navigate(Routes.EditCommunityPost, {postId, communityId});
              }}>
                <Icon name="create-outline" size={24} color={POST_COLORS.textPrimary} />
                <Text style={styles.optionText}>Edit Post</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionItem} onPress={() => {
                setShowMoreOptions(false);
                handleDelete();
              }}>
                <Icon name="trash-outline" size={24} color={POST_COLORS.danger} />
                <Text style={[styles.optionText, {color: POST_COLORS.danger}]}>
                  Delete Post
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          {postData?.isModerator && (
            <>
              <TouchableOpacity style={styles.optionItem} onPress={() => {
                setShowMoreOptions(false);
                handlePin();
              }}>
                <Icon 
                  name={postData?.isPinned ? "pin" : "pin-outline"} 
                  size={24} 
                  color={POST_COLORS.textPrimary} 
                />
                <Text style={styles.optionText}>
                  {postData?.isPinned ? 'Unpin Post' : 'Pin Post'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.optionItem} onPress={() => {
                setShowMoreOptions(false);
                handleFeature();
              }}>
                <Icon 
                  name={postData?.isFeatured ? "star" : "star-outline"} 
                  size={24} 
                  color={POST_COLORS.bookmark} 
                />
                <Text style={styles.optionText}>
                  {postData?.isFeatured ? 'Unfeature Post' : 'Feature Post'}
                </Text>
              </TouchableOpacity>
            </>
          )}
          
          <TouchableOpacity style={styles.optionItem} onPress={() => {
            setShowMoreOptions(false);
            handleReport();
          }}>
            <Icon name="flag-outline" size={24} color={POST_COLORS.report} />
            <Text style={[styles.optionText, {color: POST_COLORS.report}]}>
              Report Post
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </Pressable>
    </Modal>
  );
  
  // ===============================
  // LOADING & ERROR STATES
  // ===============================
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={POST_COLORS.background} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={POST_COLORS.accent} />
          <Text style={styles.loadingText}>Loading post...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (!postData) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={POST_COLORS.background} />
        <MainHeader
          title="Post Not Found"
          showBackButton
          onBackPress={() => navigation.goBack()}
          backgroundColor={POST_COLORS.background}
        />
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color={POST_COLORS.danger} />
          <Text style={styles.errorText}>This post could not be found</Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.errorButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  // ===============================
  // MAIN RENDER
  // ===============================
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={POST_COLORS.background} />
      
      {/* Floating Header */}
      <View style={styles.header}>
        <BlurView
          style={StyleSheet.absoluteFillObject}
          blurType="dark"
          blurAmount={10}
        />
        <Animated.View style={[styles.headerContent, animatedHeaderStyle]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" size={24} color={POST_COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {postData?.title || postData?.community?.name || 'Post'}
          </Text>
          <View style={styles.headerSpacer} />
        </Animated.View>
      </View>
      
      {/* Main Content */}
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Animated.ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchPostDetails}
              tintColor={POST_COLORS.accent}
            />
          }
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          {/* Post Content */}
          {renderPostContent()}
          
          {/* Interaction Bar */}
          {renderInteractionBar()}
          
          {/* Stats Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Icon name="eye-outline" size={16} color={POST_COLORS.textMuted} />
              <Text style={styles.statText}>{postData?.metrics?.views || 0} views</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="trending-up" size={16} color={POST_COLORS.textMuted} />
              <Text style={styles.statText}>
                {postData?.metrics?.engagementScore || 0}% engagement
              </Text>
            </View>
          </View>
          
          {/* Comments Section */}
          <View style={styles.commentsSection}>
            <Text style={styles.commentsTitle}>
              Comments ({comments.length})
            </Text>
            
            {comments.length === 0 ? (
              <View style={styles.noComments}>
                <Icon name="chatbubbles-outline" size={48} color={POST_COLORS.textMuted} />
                <Text style={styles.noCommentsText}>
                  No comments yet. Be the first!
                </Text>
              </View>
            ) : (
              comments.map((comment, index) => (
                <View key={comment.id}>
                  {renderComment({item: comment, index})}
                </View>
              ))
            )}
          </View>
          
          {/* Bottom Spacer for Input */}
          <View style={{height: 100}} />
        </Animated.ScrollView>
        
        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
          <BlurView
            style={StyleSheet.absoluteFillObject}
            blurType="dark"
            blurAmount={10}
          />
          {replyingTo && (
            <View style={styles.replyingToBar}>
              <Text style={styles.replyingToText}>
                Replying to {replyingTo.author?.username}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Icon name="close" size={20} color={POST_COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.commentInputRow}>
            <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder="Add a comment..."
              placeholderTextColor={POST_COLORS.textMuted}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
              onPress={handleComment}
              disabled={!commentText.trim()}
            >
              <Icon 
                name="send" 
                size={20} 
                color={commentText.trim() ? POST_COLORS.accent : POST_COLORS.textMuted}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
      
      {/* Floating Action Button */}
      <Animated.View style={[styles.fab, animatedFabStyle]}>
        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => commentInputRef.current?.focus()}
        >
          <LinearGradient
            colors={[POST_COLORS.accent, POST_COLORS.accentDark]}
            style={styles.fabGradient}
          >
            <Icon name="chatbubble" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
      
      {/* More Options Modal */}
      {renderMoreOptionsModal()}
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
  flex: {
    flex: 1,
  },
  
  // Header Styles
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: nh(80),
    zIndex: 100,
    overflow: 'hidden',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(20),
    paddingTop: nh(Platform.OS === 'ios' ? 45 : 25),
    height: '100%',
  },
  backButton: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    backgroundColor: POST_COLORS.surface + '80',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: nw(18),
    fontWeight: '700',
    color: POST_COLORS.textPrimary,
    marginHorizontal: nw(15),
    textAlign: 'center',
  },
  headerSpacer: {
    width: nw(40),
  },
  
  // ScrollView
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: nh(90),
  },
  
  // Post Content
  postContent: {
    backgroundColor: POST_COLORS.surface,
    marginHorizontal: nw(15),
    borderRadius: nw(12),
    padding: nw(15),
    marginBottom: nh(10),
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(12),
  },
  postAuthorSection: {
    flexDirection: 'row',
    flex: 1,
  },
  communityAvatar: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    marginRight: nw(10),
  },
  postMeta: {
    flex: 1,
  },
  communityName: {
    fontSize: nw(14),
    fontWeight: '600',
    color: POST_COLORS.textPrimary,
  },
  postMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(2),
  },
  authorName: {
    fontSize: nw(12),
    color: POST_COLORS.textSecondary,
  },
  postTime: {
    fontSize: nw(11),
    color: POST_COLORS.textMuted,
    marginLeft: nw(4),
  },
  roleBadge: {
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    borderRadius: nw(4),
    marginLeft: nw(6),
  },
  roleText: {
    fontSize: nw(10),
    fontWeight: '700',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nw(6),
  },
  typeText: {
    fontSize: nw(11),
    fontWeight: '600',
    marginLeft: nw(4),
  },
  postTitle: {
    fontSize: nw(20),
    fontWeight: '700',
    color: POST_COLORS.textPrimary,
    marginBottom: nh(10),
  },
  postBody: {
    fontSize: nw(14),
    color: POST_COLORS.textSecondary,
    lineHeight: nw(22),
    marginBottom: nh(12),
  },
  
  // Media
  mediaContainer: {
    marginBottom: nh(12),
  },
  mediaItem: {
    marginRight: nw(10),
  },
  mediaImage: {
    width: SCREEN_WIDTH - nw(60),
    height: nh(200),
    borderRadius: nw(8),
  },
  
  // Poll
  pollContainer: {
    marginTop: nh(12),
  },
  pollOption: {
    backgroundColor: POST_COLORS.elevated,
    borderRadius: nw(8),
    marginBottom: nh(8),
    overflow: 'hidden',
  },
  pollOptionSelected: {
    borderWidth: 2,
    borderColor: POST_COLORS.poll,
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: nw(12),
  },
  pollOptionText: {
    fontSize: nw(14),
    color: POST_COLORS.textPrimary,
    flex: 1,
  },
  pollPercentage: {
    fontSize: nw(14),
    fontWeight: '600',
    color: POST_COLORS.poll,
    marginLeft: nw(10),
  },
  pollProgress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: POST_COLORS.poll + '30',
  },
  pollVotes: {
    fontSize: nw(12),
    color: POST_COLORS.textMuted,
    marginTop: nh(8),
  },
  
  // Event
  eventContainer: {
    backgroundColor: POST_COLORS.elevated,
    borderRadius: nw(8),
    padding: nw(12),
    marginTop: nh(12),
  },
  eventTitle: {
    fontSize: nw(16),
    fontWeight: '600',
    color: POST_COLORS.textPrimary,
    marginBottom: nh(6),
  },
  eventDescription: {
    fontSize: nw(14),
    color: POST_COLORS.textSecondary,
    marginBottom: nh(10),
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(8),
  },
  eventText: {
    fontSize: nw(14),
    color: POST_COLORS.textSecondary,
    marginLeft: nw(10),
  },
  rsvpButton: {
    backgroundColor: POST_COLORS.event,
    borderRadius: nw(6),
    paddingVertical: nh(8),
    alignItems: 'center',
    marginTop: nh(8),
  },
  rsvpButtonActive: {
    backgroundColor: POST_COLORS.success,
  },
  rsvpButtonText: {
    fontSize: nw(14),
    fontWeight: '600',
    color: '#FFF',
  },
  
  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: nh(8),
  },
  tag: {
    backgroundColor: POST_COLORS.accent + '20',
    paddingHorizontal: nw(10),
    paddingVertical: nh(4),
    borderRadius: nw(12),
    marginRight: nw(8),
    marginBottom: nh(6),
  },
  tagText: {
    fontSize: nw(12),
    color: POST_COLORS.accent,
  },
  
  // Interaction Bar
  interactionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: POST_COLORS.surface,
    marginHorizontal: nw(15),
    borderRadius: nw(12),
    padding: nw(12),
    marginBottom: nh(10),
  },
  voteSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: POST_COLORS.elevated,
    borderRadius: nw(20),
    paddingHorizontal: nw(8),
  },
  voteButton: {
    padding: nw(8),
  },
  voteCount: {
    fontSize: nw(14),
    fontWeight: '700',
    color: POST_COLORS.textPrimary,
    marginHorizontal: nw(8),
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: nw(15),
  },
  actionText: {
    fontSize: nw(12),
    color: POST_COLORS.textSecondary,
    marginLeft: nw(4),
  },
  
  // Stats Bar
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: POST_COLORS.surface,
    marginHorizontal: nw(15),
    borderRadius: nw(12),
    padding: nw(12),
    marginBottom: nh(15),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: nw(12),
    color: POST_COLORS.textMuted,
    marginLeft: nw(6),
  },
  
  // Comments
  commentsSection: {
    paddingHorizontal: nw(15),
  },
  commentsTitle: {
    fontSize: nw(18),
    fontWeight: '700',
    color: POST_COLORS.textPrimary,
    marginBottom: nh(15),
  },
  commentItem: {
    flexDirection: 'row',
    backgroundColor: POST_COLORS.surface,
    borderRadius: nw(12),
    padding: nw(12),
    marginBottom: nh(10),
  },
  commentTemporary: {
    opacity: 0.7,
  },
  commentAvatar: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    marginRight: nw(10),
  },
  commentContent: {
    flex: 1,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(6),
  },
  commentAuthor: {
    fontSize: nw(13),
    fontWeight: '600',
    color: POST_COLORS.textPrimary,
  },
  commentRoleBadge: {
    paddingHorizontal: nw(6),
    paddingVertical: nh(1),
    borderRadius: nw(3),
    marginLeft: nw(6),
  },
  commentRoleText: {
    fontSize: nw(10),
    fontWeight: '600',
  },
  commentTime: {
    fontSize: nw(11),
    color: POST_COLORS.textMuted,
    marginLeft: nw(6),
  },
  commentText: {
    fontSize: nw(13),
    color: POST_COLORS.textSecondary,
    lineHeight: nw(19),
    marginBottom: nh(8),
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: nw(15),
  },
  commentActionText: {
    fontSize: nw(11),
    color: POST_COLORS.textMuted,
    marginLeft: nw(4),
  },
  
  // No Comments
  noComments: {
    alignItems: 'center',
    paddingVertical: nh(40),
  },
  noCommentsText: {
    fontSize: nw(14),
    color: POST_COLORS.textMuted,
    marginTop: nh(12),
  },
  
  // Comment Input
  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: POST_COLORS.elevated,
    overflow: 'hidden',
  },
  replyingToBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: POST_COLORS.accent + '20',
    paddingHorizontal: nw(15),
    paddingVertical: nh(8),
  },
  replyingToText: {
    fontSize: nw(12),
    color: POST_COLORS.accent,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: nw(15),
    paddingVertical: nh(10),
  },
  commentInput: {
    flex: 1,
    backgroundColor: POST_COLORS.elevated,
    borderRadius: nw(20),
    paddingHorizontal: nw(15),
    paddingVertical: nh(10),
    fontSize: nw(14),
    color: POST_COLORS.textPrimary,
    maxHeight: nh(100),
  },
  sendButton: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    backgroundColor: POST_COLORS.elevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: nw(10),
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  
  // FAB
  fab: {
    position: 'absolute',
    bottom: nh(100),
    right: nw(20),
  },
  fabButton: {
    width: nw(56),
    height: nw(56),
    borderRadius: nw(28),
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: POST_COLORS.overlay,
    justifyContent: 'flex-end',
  },
  moreOptionsContainer: {
    backgroundColor: POST_COLORS.surface,
    borderTopLeftRadius: nw(20),
    borderTopRightRadius: nw(20),
    paddingTop: nh(20),
    paddingBottom: nh(Platform.OS === 'ios' ? 30 : 20),
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(15),
    paddingHorizontal: nw(20),
  },
  optionText: {
    fontSize: nw(16),
    color: POST_COLORS.textPrimary,
    marginLeft: nw(15),
  },
  
  // Loading & Error States
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: nw(14),
    color: POST_COLORS.textSecondary,
    marginTop: nh(12),
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nw(40),
  },
  errorText: {
    fontSize: nw(16),
    color: POST_COLORS.textSecondary,
    textAlign: 'center',
    marginTop: nh(20),
    marginBottom: nh(30),
  },
  errorButton: {
    backgroundColor: POST_COLORS.accent,
    paddingHorizontal: nw(30),
    paddingVertical: nh(12),
    borderRadius: nw(8),
  },
  errorButtonText: {
    fontSize: nw(14),
    fontWeight: '600',
    color: '#FFF',
  },
});

export default CommunityPostDetail;