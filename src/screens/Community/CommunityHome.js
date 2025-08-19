// src/screens/Community/CommunityHome.js
/**
 * Community Hub - Reddit x Discord Hybrid Design
 * Shows feed of posts from all user's communities
 * Enhanced with comprehensive API logging for debugging
 * FULLY FIXED VERSION WITH PROPER NAVIGATION AND API CALLS
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
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
  Share,
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
  Layout,
  interpolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {BlurView} from '@react-native-community/blur';
import {COLORS} from '../../helper/colors';
import {DEVICE_HEIGHT, DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import MainHeader from '../../components/MainHeader';
import Text from '../../components/Text';
import {
  getCommunitiesApi,
  getMyCommunitiesApi,
  getMyCommunitySmammarayApi,
  getTrendingCommunitiesApi,
  getFeaturedCommunitiesApi,
  getPersonalizedRecommendationsApi,
  getCommunityPlatformStatsApi,
  getCommunityCategoriesApi,
  getInstitutionalSuggestionsApi,
  joinCommunityApi,
  getCommunityPostsApi,
  voteCommunityPostApi,
  bookmarkCommunityPostApi,
  shareCommunityPostApi,
  getCommunityDetailsApi,
  addCommunityPostCommentApi,
} from '../../services/apiService';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import Feather from 'react-native-vector-icons/Feather';
import mixpanel from '../../helper/mixpanelClient';
import Routes from '../../helper/routes';

const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = Dimensions.get('window');

// ===============================
// REDDIT + DISCORD COLOR SYSTEM
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
// API LOGGER UTILITY
// ===============================
const APILogger = {
  log: (apiName, phase, data) => {
    const timestamp = new Date().toISOString();
    const logColor = phase === 'SUCCESS' ? '\x1b[32m' : phase === 'ERROR' ? '\x1b[31m' : '\x1b[33m';
    const resetColor = '\x1b[0m';
    
    console.log(`${logColor}[${timestamp}] API: ${apiName} - ${phase}${resetColor}`);
    
    if (data) {
      console.log('Data:', JSON.stringify(data, null, 2));
    }
    
    if (__DEV__) {
      console.log('=====================================');
    }
  },
  
  logRequest: (apiName, params) => {
    console.log(`\n📡 REQUEST: ${apiName}`);
    console.log('Parameters:', params);
  },
  
  logResponse: (apiName, response) => {
    console.log(`\n✅ RESPONSE: ${apiName}`);
    console.log('Status:', response?.status);
    console.log('Data:', response?.data);
    if (response?.data?.data) {
      console.log('Actual Data:', response.data.data);
      if (Array.isArray(response.data.data)) {
        console.log('Array Length:', response.data.data.length);
      }
    }
  },
  
  logError: (apiName, error) => {
    console.log(`\n❌ ERROR: ${apiName}`);
    console.log('Error Message:', error?.message);
    console.log('Error Response:', error?.response?.data);
    console.log('Error Stack:', error?.stack);
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

// ===============================
// DISCORD-STYLE SERVER LIST SIDEBAR
// ===============================
const DiscordServerList = ({communities, onSelect, selectedId, navigation}) => {
  return (
    <View style={styles.serverList}>
      <TouchableOpacity style={styles.homeServer} onPress={() => onSelect(null)}>
        <Icon name="home" size={20} color={REDDIT_DISCORD_COLORS.textBright} />
      </TouchableOpacity>
      
      <View style={styles.serverDivider} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {communities.map((community, index) => (
          <TouchableOpacity
            key={community.id || community._id || index}
            style={[
              styles.serverIcon,
              selectedId === (community.id || community._id) && styles.serverIconActive
            ]}
            onPress={() => onSelect(community.id || community._id)}
            onLongPress={() => {
              // Long press to navigate directly to community profile
              navigation.navigate(Routes.CommunityProfile, {
                communityId: community.id || community._id,
                community: community
              });
            }}
          >
            {community.coverImage ? (
              <Image source={{uri: community.coverImage}} style={styles.serverImage} />
            ) : (
              <View style={[styles.serverPlaceholder, {backgroundColor: `hsl(${index * 30}, 70%, 50%)`}]}>
                <Text style={styles.serverInitial}>
                  {community.name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            {community.stats?.unreadPosts > 0 && (
              <View style={styles.serverBadge}>
                <Text style={styles.serverBadgeText}>{community.stats.unreadPosts}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.addServerButton}
        onPress={() => navigation.navigate(Routes.CommunityDiscovery)}
      >
        <Icon name="add" size={24} color={REDDIT_DISCORD_COLORS.discordGreen} />
      </TouchableOpacity>
    </View>
  );
};

// ===============================
// POST FEED CARD COMPONENT
// ===============================
const PostFeedCard = ({post, onPress, index = 0, navigation}) => {
  const [voteStatus, setVoteStatus] = useState(post.userInteractions?.voteType || null);
  const [isBookmarked, setIsBookmarked] = useState(post.userInteractions?.bookmarked || false);
  const [voteCount, setVoteCount] = useState((post.metrics?.upvotes || 0) - (post.metrics?.downvotes || 0));
  
  // Get community ID and info properly
  const communityId = post.community?.id || post.community?._id || post.communityId;
  const communityInfo = post.community || post.communityInfo;
  
  const handleVote = async (type) => {
    if (!communityId) {
      Alert.alert('Error', 'Community information not available');
      return;
    }
    
    const newStatus = voteStatus === type ? null : type;
    const prevStatus = voteStatus;
    const prevCount = voteCount;
    
    // Optimistic update
    setVoteStatus(newStatus);
    
    // Update vote count optimistically
    if (prevStatus === 'upvote') {
      setVoteCount(prevCount - 1);
    } else if (prevStatus === 'downvote') {
      setVoteCount(prevCount + 1);
    }
    
    if (newStatus === 'upvote') {
      setVoteCount(prevCount + (prevStatus === 'downvote' ? 2 : 1));
    } else if (newStatus === 'downvote') {
      setVoteCount(prevCount - (prevStatus === 'upvote' ? 2 : 1));
    }
    
    try {
      // Call vote API with proper parameters
      await voteCommunityPostApi(communityId, post.id || post._id, {
        voteType: newStatus || 'none'
      });
      
      APILogger.log('voteCommunityPostApi', 'SUCCESS', { 
        communityId, 
        postId: post.id || post._id, 
        voteType: newStatus 
      });
    } catch (error) {
      console.error('Vote error:', error);
      // Revert on error
      setVoteStatus(prevStatus);
      setVoteCount(prevCount);
      Alert.alert('Error', 'Failed to update vote. Please try again.');
    }
  };
  
  const handleBookmark = async () => {
    if (!communityId) {
      Alert.alert('Error', 'Community information not available');
      return;
    }
    
    try {
      setIsBookmarked(!isBookmarked);
      await bookmarkCommunityPostApi(communityId, post.id || post._id);
      
      APILogger.log('bookmarkCommunityPostApi', 'SUCCESS', { 
        communityId, 
        postId: post.id || post._id 
      });
    } catch (error) {
      console.error('Bookmark error:', error);
      setIsBookmarked(isBookmarked); // Revert on error
      Alert.alert('Error', 'Failed to bookmark post. Please try again.');
    }
  };
  
  const handleShare = async () => {
    if (!communityId) {
      Alert.alert('Error', 'Community information not available');
      return;
    }
    
    try {
      // Try native share first
      const shareMessage = `Check out this post: ${post.title || 'Untitled Post'}\n\nFrom r/${communityInfo?.name || 'community'}`;
      
      await Share.share({
        message: shareMessage,
        title: post.title || 'Share Post',
      });
      
      // Track share in backend
      await shareCommunityPostApi(communityId, post.id || post._id, {
        platform: 'native'
      });
      
      APILogger.log('shareCommunityPostApi', 'SUCCESS', { 
        communityId, 
        postId: post.id || post._id 
      });
    } catch (error) {
      if (error.message !== 'Share cancelled') {
        console.error('Share error:', error);
        Alert.alert('Error', 'Failed to share post. Please try again.');
      }
    }
  };
  
  const navigateToCommunity = () => {
    if (communityInfo && communityId) {
      navigation.navigate(Routes.CommunityProfile, {
        communityId: communityId,
        community: communityInfo,
      });
    }
  };
  
  const handleCommentPress = () => {
    if (onPress) {
      onPress(post);
    } else {
      // Navigate to post detail
      navigation.navigate(Routes.CommunityPostDetail, {
        postId: post.id || post._id,
        communityId: communityId,
        post: post,
      });
    }
  };
  
  return (
    <Animated.View 
      entering={FadeInDown.delay(index * 50).springify()}
      style={styles.redditCard}
    >
      <Pressable onPress={handleCommentPress} style={styles.redditCardPressable}>
        {/* Upvote Section */}
        <View style={styles.voteSection}>
          <TouchableOpacity 
            onPress={() => handleVote('upvote')}
            style={styles.voteButton}
          >
            <Icon 
              name="arrow-up" 
              size={20} 
              color={voteStatus === 'upvote' ? REDDIT_DISCORD_COLORS.upvote : REDDIT_DISCORD_COLORS.textDim} 
            />
          </TouchableOpacity>
          <Text style={[
            styles.karmaCount,
            voteStatus === 'upvote' && styles.karmaUp,
            voteStatus === 'downvote' && styles.karmaDown
          ]}>
            {formatNumber(voteCount)}
          </Text>
          <TouchableOpacity 
            onPress={() => handleVote('downvote')}
            style={styles.voteButton}
          >
            <Icon 
              name="arrow-down" 
              size={20} 
              color={voteStatus === 'downvote' ? REDDIT_DISCORD_COLORS.downvote : REDDIT_DISCORD_COLORS.textDim} 
            />
          </TouchableOpacity>
        </View>
        
        {/* Content Section */}
        <View style={styles.redditContent}>
          {/* Header with Community Info */}
          <View style={styles.redditHeader}>
            <TouchableOpacity onPress={navigateToCommunity} style={styles.communityInfo}>
              {communityInfo?.coverImage ? (
                <Image source={{uri: communityInfo.coverImage}} style={styles.subredditIcon} />
              ) : (
                <View style={[styles.subredditIconPlaceholder, {backgroundColor: REDDIT_DISCORD_COLORS.blurple}]}>
                  <Text style={styles.subredditInitial}>
                    {(communityInfo?.name || 'C').charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              
              <Text style={styles.subredditName}>
                r/{(communityInfo?.name || 'community').toLowerCase().replace(/\s+/g, '')}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.dotSeparator}>•</Text>
            
            <Text style={styles.postTime}>
              u/{post.author?.username || 'anonymous'} • {getRelativeTime(post.publishedAt || post.createdAt)}
            </Text>
          </View>
          
          {/* Post Title */}
          <Text style={styles.redditTitle} numberOfLines={2}>
            {post.title || 'Untitled Post'}
          </Text>
          
          {/* Post Content */}
          {post.content?.text && (
            <Text style={styles.redditDescription} numberOfLines={3}>
              {post.content.text}
            </Text>
          )}
          
          {/* Post Images if any */}
          {post.media?.images?.length > 0 && (
            <TouchableOpacity onPress={handleCommentPress}>
              <Image 
                source={{uri: post.media.images[0].url || post.media.images[0].thumbnailUrl}} 
                style={styles.postImage}
                resizeMode="cover"
              />
              {post.media.images.length > 1 && (
                <View style={styles.moreImagesOverlay}>
                  <Text style={styles.moreImagesText}>+{post.media.images.length - 1}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          
          {/* Poll Indicator */}
          {post.postType === 'poll' && post.poll && (
            <View style={styles.pollContainer}>
              <Icon name="bar-chart" size={16} color={REDDIT_DISCORD_COLORS.blurple} />
              <Text style={styles.pollText}>Poll: {post.poll.question}</Text>
            </View>
          )}
          
          {/* Event Indicator */}
          {post.postType === 'event' && post.event && (
            <View style={styles.eventContainer}>
              <Icon name="calendar" size={16} color={REDDIT_DISCORD_COLORS.discordGreen} />
              <Text style={styles.eventText}>
                Event: {post.event.title} • {new Date(post.event.startDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {/* Post Type & Tags */}
          <View style={styles.tagContainer}>
            {post.postType && post.postType !== 'text' && (
              <View style={[styles.typeTag, {backgroundColor: REDDIT_DISCORD_COLORS.elevated}]}>
                <Text style={styles.tagText}>{post.postType}</Text>
              </View>
            )}
            {post.tags?.slice(0, 2).map((tag, idx) => (
              <View key={idx} style={styles.categoryTag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
          
          {/* Footer Actions */}
          <View style={styles.redditFooter}>
            <TouchableOpacity style={styles.footerAction} onPress={handleCommentPress}>
              <Icon name="chatbubble-outline" size={16} color={REDDIT_DISCORD_COLORS.textMuted} />
              <Text style={styles.footerText}>
                {formatNumber(post.metrics?.comments || 0)}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.footerAction} onPress={handleShare}>
              <Icon name="share-outline" size={16} color={REDDIT_DISCORD_COLORS.textMuted} />
              <Text style={styles.footerText}>Share</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.footerAction} onPress={handleBookmark}>
              <Icon 
                name={isBookmarked ? "bookmark" : "bookmark-outline"} 
                size={16} 
                color={isBookmarked ? REDDIT_DISCORD_COLORS.blurple : REDDIT_DISCORD_COLORS.textMuted} 
              />
              <Text style={styles.footerText}>Save</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.footerAction}>
              <Icon name="ellipsis-horizontal" size={16} color={REDDIT_DISCORD_COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

// ===============================
// REDDIT-STYLE SORT BAR
// ===============================
const RedditSortBar = ({activeSort, onSortChange}) => {
  const sorts = [
    {id: 'hot', label: 'Hot', icon: 'flame'},
    {id: 'new', label: 'New', icon: 'sparkles'},
    {id: 'top', label: 'Top', icon: 'trending-up'},
    {id: 'rising', label: 'Rising', icon: 'rocket'},
  ];
  
  return (
    <View style={styles.sortBar}>
      {sorts.map(sort => (
        <TouchableOpacity
          key={sort.id}
          style={[styles.sortButton, activeSort === sort.id && styles.sortButtonActive]}
          onPress={() => onSortChange(sort.id)}
        >
          <Icon 
            name={sort.icon} 
            size={16} 
            color={activeSort === sort.id ? REDDIT_DISCORD_COLORS.textBright : REDDIT_DISCORD_COLORS.textMuted} 
          />
          <Text style={[styles.sortText, activeSort === sort.id && styles.sortTextActive]}>
            {sort.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// ===============================
// SKELETON LOADER
// ===============================
const RedditCardSkeleton = () => {
  const shimmerAnim = useSharedValue(0);
  
  useEffect(() => {
    shimmerAnim.value = withRepeat(
      withTiming(1, {duration: 1500, easing: Easing.linear}),
      -1
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmerAnim.value, [0, 0.5, 1], [0.3, 0.6, 0.3]),
  }));
  
  return (
    <Animated.View style={[styles.skeletonCard, animatedStyle]}>
      <View style={styles.skeletonVote}>
        <View style={styles.skeletonVoteButton} />
        <View style={styles.skeletonKarma} />
        <View style={styles.skeletonVoteButton} />
      </View>
      <View style={styles.skeletonContent}>
        <View style={styles.skeletonHeader} />
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonDescription} />
        <View style={styles.skeletonFooter} />
      </View>
    </Animated.View>
  );
};

// ===============================
// MAIN COMPONENT
// ===============================
const CommunityHome = ({navigation, route}) => {
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);
  
  console.log('\n🚀 COMMUNITY HOME MOUNTED');
  console.log('User Data:', userData);
  
  // State Management
  const [refreshing, setRefreshing] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState('hot');
  const [showServerList, setShowServerList] = useState(false);
  const [selectedServerId, setSelectedServerId] = useState(null);
  
  // Community Data
  const [myCommunities, setMyCommunities] = useState([]);
  const [myCommunitiesStats, setMyCommunitiesStats] = useState(null);
  const [platformStats, setPlatformStats] = useState(null);
  
  // Posts Feed Data
  const [communityFeedPosts, setCommunityFeedPosts] = useState([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  
  // Loading States
  const [loadingMyCommunities, setLoadingMyCommunities] = useState(false);
  
  // ===============================
  // LIFECYCLE & DATA FETCHING
  // ===============================
  useEffect(() => {
    console.log('\n🔄 INITIAL DATA FETCH TRIGGERED');
    mixpanel.track('Community Hub Viewed', {
      user_id: userData?.id,
      timestamp: new Date().toISOString(),
    });
    handleInitialDataFetch();
  }, []);
  
  useEffect(() => {
    // When sort changes, refresh the feed
    if (!initialLoading) {
      fetchCommunityPosts(true);
    }
  }, [activeSort]);
  
  useEffect(() => {
    // When a specific server is selected, filter posts
    if (selectedServerId) {
      fetchCommunityPosts(true, selectedServerId);
    } else {
      fetchCommunityPosts(true);
    }
  }, [selectedServerId]);
  
  const handleInitialDataFetch = async () => {
    console.log('\n📊 STARTING INITIAL DATA FETCH...');
    setInitialLoading(true);
    
    try {
      // First fetch user's communities
      await fetchMyCommunities();
      await fetchMyCommunitiesStats();
      
      // Then fetch posts from those communities
      await fetchCommunityPosts(true);
      
      // Fetch platform stats
      await fetchPlatformStats();
      
      console.log('\n✅ ALL INITIAL DATA FETCHED SUCCESSFULLY');
    } catch (error) {
      console.error('\n❌ ERROR IN INITIAL DATA FETCH:', error);
    } finally {
      setInitialLoading(false);
    }
  };
  
  // ===============================
  // API FUNCTIONS
  // ===============================
  const fetchMyCommunities = async () => {
    if (loadingMyCommunities) {
      console.log('⚠️ Already loading my communities, skipping...');
      return;
    }
    
    setLoadingMyCommunities(true);
    const apiName = 'getMyCommunitiesApi';
    const params = {
      page: 1,
      limit: 50,
      includeStats: true,
      sortBy: 'lastActivity',
    };
    
    APILogger.logRequest(apiName, params);
    
    try {
      const response = await getMyCommunitiesApi(params);
      APILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        const communities = response.data.data?.communities || response.data.data || [];
        console.log(`✅ Fetched ${communities.length} communities for user`);
        setMyCommunities(communities);
        
        // Log each community
        communities.forEach((comm, index) => {
          console.log(`  ${index + 1}. ${comm.name} (ID: ${comm.id || comm._id})`);
        });
        
        return communities;
      } else {
        console.log('⚠️ Response not successful:', response?.data);
        return [];
      }
    } catch (error) {
      APILogger.logError(apiName, error);
      return [];
    } finally {
      setLoadingMyCommunities(false);
    }
  };
  
  const fetchMyCommunitiesStats = async () => {
    const apiName = 'getMyCommunitySmammarayApi';
    APILogger.logRequest(apiName, {});
    
    try {
      const response = await getMyCommunitySmammarayApi();
      APILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        const stats = response.data.data;
        console.log('📊 Community Stats:', stats);
        setMyCommunitiesStats(stats);
      }
    } catch (error) {
      APILogger.logError(apiName, error);
    }
  };
  
  const fetchCommunityPosts = async (reset = false, specificCommunityId = null) => {
    const apiName = 'fetchCommunityPosts';
    console.log('\n📰 FETCHING COMMUNITY POSTS FEED...');
    
    if (reset) {
      setFeedPage(1);
      setCommunityFeedPosts([]);
    }
    
    if (loadingFeed && !reset) {
      console.log('⚠️ Already loading feed, skipping...');
      return;
    }
    
    setLoadingFeed(true);
    
    try {
      let communities = myCommunities;
      
      // If no communities loaded yet, fetch them first
      if (communities.length === 0) {
        communities = await fetchMyCommunities();
      }
      
      if (communities.length === 0) {
        console.log('⚠️ User has no communities');
        setLoadingFeed(false);
        return;
      }
      
      // Determine which communities to fetch from
      const communitiesToFetch = specificCommunityId 
        ? communities.filter(c => (c.id || c._id) === specificCommunityId)
        : communities;
      
      // Map sort type to API parameter
      const sortMap = {
        'hot': 'trending',
        'new': 'latest',
        'top': 'top',
        'rising': 'trending'
      };
      
      // Fetch posts from each community
      const postPromises = communitiesToFetch.slice(0, 20).map(community => 
        getCommunityPostsApi(community.id || community._id, {
          page: reset ? 1 : feedPage,
          limit: 10,
          sort: sortMap[activeSort] || 'latest'
        }).catch(error => {
          console.error(`Error fetching posts from ${community.name}:`, error);
          return null;
        })
      );
      
      const responses = await Promise.all(postPromises);
      
      // Combine all posts
      const allPosts = [];
      responses.forEach((response, index) => {
        if (response?.data?.success && response.data.data?.posts) {
          const posts = response.data.data.posts.map(post => ({
            ...post,
            community: communitiesToFetch[index],
            communityId: communitiesToFetch[index].id || communitiesToFetch[index]._id
          }));
          allPosts.push(...posts);
        }
      });
      
      // Sort by date (newest first) or by engagement based on sort type
      if (activeSort === 'new') {
        allPosts.sort((a, b) => new Date(b.publishedAt || b.createdAt) - new Date(a.publishedAt || a.createdAt));
      } else if (activeSort === 'top') {
        allPosts.sort((a, b) => (b.metrics?.upvotes || 0) - (a.metrics?.upvotes || 0));
      } else {
        // For 'hot' and 'rising', use engagement score
        allPosts.sort((a, b) => {
          const scoreA = (a.metrics?.upvotes || 0) + (a.metrics?.comments || 0) * 2;
          const scoreB = (b.metrics?.upvotes || 0) + (b.metrics?.comments || 0) * 2;
          return scoreB - scoreA;
        });
      }
      
      console.log(`✅ Fetched ${allPosts.length} posts from ${communitiesToFetch.length} communities`);
      
      if (reset) {
        setCommunityFeedPosts(allPosts);
      } else {
        setCommunityFeedPosts(prev => [...prev, ...allPosts]);
      }
      
      setHasMorePosts(allPosts.length >= 10);
      
    } catch (error) {
      console.error('❌ Error fetching community posts:', error);
      APILogger.logError(apiName, error);
    } finally {
      setLoadingFeed(false);
    }
  };
  
  const fetchPlatformStats = async () => {
    const apiName = 'getCommunityPlatformStatsApi';
    APILogger.logRequest(apiName, {});
    
    try {
      const response = await getCommunityPlatformStatsApi();
      APILogger.logResponse(apiName, response);
      
      if (response?.data?.success) {
        const stats = response.data.data;
        console.log('🌐 Platform Stats:', stats);
        setPlatformStats(stats);
      }
    } catch (error) {
      APILogger.logError(apiName, error);
    }
  };
  
  // ===============================
  // EVENT HANDLERS
  // ===============================
  const handleRefresh = useCallback(async () => {
    console.log('\n🔄 MANUAL REFRESH TRIGGERED');
    setRefreshing(true);
    await fetchMyCommunities();
    await fetchMyCommunitiesStats();
    await fetchCommunityPosts(true);
    setRefreshing(false);
  }, [activeSort]);
  
  const handlePostPress = useCallback((post) => {
    console.log(`\n👆 Post Pressed: ${post.title} (ID: ${post.id || post._id})`);
    
    const communityId = post.community?.id || post.community?._id || post.communityId;
    
    if (!communityId) {
      Alert.alert('Error', 'Community information not available for this post');
      return;
    }
    
    mixpanel.track('Post Selected', {
      post_id: post.id || post._id,
      post_title: post.title,
      community_id: communityId,
    });
    
    // Navigate to CommunityPostDetail (correct route)
    navigation.navigate(Routes.CommunityPostDetail, {
      postId: post.id || post._id,
      communityId: communityId,
      post: post,
    });
  }, [navigation]);
  
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      console.log(`\n🔍 Search initiated: "${searchQuery}"`);
      // Navigate to Search screen with community search parameters
      navigation.navigate(Routes.Search, {
        initialQuery: searchQuery,
        searchType: 'communities',
        fromScreen: 'CommunityHome'
      });
    }
  }, [navigation, searchQuery]);
  
  const handleLoadMore = () => {
    if (!loadingFeed && hasMorePosts) {
      setFeedPage(prev => prev + 1);
      fetchCommunityPosts(false);
    }
  };
  
  const handleSortChange = (newSort) => {
    console.log(`📊 Sort changed to: ${newSort}`);
    setActiveSort(newSort);
  };
  
  const handleCreatePost = () => {
    if (selectedServerId) {
      const selectedCommunity = myCommunities.find(c => (c.id || c._id) === selectedServerId);
      navigation.navigate(Routes.CreateCommunityPost, {
        communityId: selectedServerId,
        community: selectedCommunity
      });
    } else {
      // Navigate to community selection for post creation
      navigation.navigate(Routes.CreateCommunityPost);
    }
  };
  
  // ===============================
  // RENDER FUNCTIONS
  // ===============================
  const renderHeader = () => (
    <View style={styles.feedHeader}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={REDDIT_DISCORD_COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            placeholder="Search communities..."
            placeholderTextColor={REDDIT_DISCORD_COLORS.textDim}
            returnKeyType="search"
          />
        </View>
        
        <TouchableOpacity 
          style={styles.createButton}
          onPress={handleCreatePost}
        >
          <LinearGradient
            colors={[REDDIT_DISCORD_COLORS.blurple, REDDIT_DISCORD_COLORS.blurpleLight]}
            style={styles.createButtonGradient}
          >
            <Icon name="add" size={20} color={REDDIT_DISCORD_COLORS.textBright} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
      
      {/* Sort Bar */}
      <RedditSortBar activeSort={activeSort} onSortChange={handleSortChange} />
      
      {/* Platform Stats Banner */}
      {platformStats && (
        <View style={styles.statsBanner}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(platformStats.overview?.totalMembers || 0)}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(platformStats.overview?.totalCommunities || 0)}</Text>
            <Text style={styles.statLabel}>Communities</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <View style={styles.onlineIndicator} />
            <Text style={styles.statValue}>{formatNumber(platformStats.overview?.activeCommunities || 0)}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
        </View>
      )}
    </View>
  );
  
  const renderFooter = () => {
    if (!loadingFeed) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={REDDIT_DISCORD_COLORS.blurple} />
      </View>
    );
  };
  
  if (initialLoading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={REDDIT_DISCORD_COLORS.background} />
        <SafeAreaView style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={REDDIT_DISCORD_COLORS.blurple} />
          <Text style={styles.loadingText}>Loading your feed...</Text>
        </SafeAreaView>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={REDDIT_DISCORD_COLORS.background} />
      
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.mainLayout}>
          {/* Discord-style Server List */}
          {showServerList && (
            <DiscordServerList
              communities={myCommunities}
              onSelect={setSelectedServerId}
              selectedId={selectedServerId}
              navigation={navigation}
            />
          )}
          
          {/* Main Content Area */}
          <View style={styles.contentArea}>
            {/* Header Bar */}
            <View style={styles.topBar}>
              <TouchableOpacity 
                style={styles.menuButton}
                onPress={() => setShowServerList(!showServerList)}
              >
                <Icon name="menu" size={24} color={REDDIT_DISCORD_COLORS.textBright} />
              </TouchableOpacity>
              
              <Text style={styles.topBarTitle}>
                {selectedServerId 
                  ? myCommunities.find(c => (c.id || c._id) === selectedServerId)?.name || 'Community Feed'
                  : 'All Communities Feed'}
              </Text>
              
              <View style={styles.topBarActions}>
                <TouchableOpacity 
                  style={styles.topBarButton}
                  onPress={() => navigation.navigate(Routes.MyCommunities)}
                >
                  <MaterialCommunityIcons name="account-group" size={20} color={REDDIT_DISCORD_COLORS.textBright} />
                  {myCommunitiesStats?.summary?.totalCommunities > 0 && (
                    <View style={styles.notificationBadge}>
                      <Text style={styles.notificationBadgeText}>
                        {myCommunitiesStats.summary.totalCommunities}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.topBarButton}
                  onPress={() => navigation.navigate(Routes.CommunityDiscovery)}
                >
                  <Icon name="compass" size={20} color={REDDIT_DISCORD_COLORS.textBright} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.topBarButton}
                  onPress={() => navigation.navigate(Routes.Notifications)}
                >
                  <Feather name="bell" size={20} color={REDDIT_DISCORD_COLORS.textBright} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.topBarButton}
                  onPress={() => navigation.navigate(Routes.Conversation)}
                >
                  <Feather name="message-square" size={20} color={REDDIT_DISCORD_COLORS.textBright} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Reddit-style Feed */}
            <FlatList
              data={communityFeedPosts}
              renderItem={({item, index}) => (
                <PostFeedCard
                  post={item}
                  onPress={handlePostPress}
                  index={index}
                  navigation={navigation}
                />
              )}
              keyExtractor={(item, index) => `post-${item.id || item._id}-${index}`}
              ListHeaderComponent={renderHeader}
              ListFooterComponent={renderFooter}
              ListEmptyComponent={
                loadingFeed ? (
                  <View style={styles.skeletonContainer}>
                    {[1, 2, 3].map(i => <RedditCardSkeleton key={i} />)}
                  </View>
                ) : (
                  <View style={styles.emptyState}>
                    <Icon name="newspaper-outline" size={64} color={REDDIT_DISCORD_COLORS.textDim} />
                    <Text style={styles.emptyTitle}>No posts yet</Text>
                    <Text style={styles.emptySubtitle}>
                      {myCommunities.length === 0 
                        ? 'Join communities to see posts in your feed'
                        : 'No posts available from your communities'}
                    </Text>
                    {myCommunities.length === 0 && (
                      <TouchableOpacity 
                        style={styles.discoverButton}
                        onPress={() => navigation.navigate(Routes.CommunityDiscovery)}
                      >
                        <Text style={styles.discoverButtonText}>Discover Communities</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )
              }
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  tintColor={REDDIT_DISCORD_COLORS.blurple}
                  colors={[REDDIT_DISCORD_COLORS.blurple]}
                />
              }
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.5}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.feedContent}
            />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

// ===============================
// STYLES
// ===============================
const styles = StyleSheet.create({
  // Main Layout
  container: {
    flex: 1,
    backgroundColor: REDDIT_DISCORD_COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  contentArea: {
    flex: 1,
    backgroundColor: REDDIT_DISCORD_COLORS.backgroundSecondary,
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
  menuButton: {
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
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: REDDIT_DISCORD_COLORS.discordRed,
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  
  // Discord Server List
  serverList: {
    width: 72,
    backgroundColor: REDDIT_DISCORD_COLORS.background,
    paddingVertical: 12,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: REDDIT_DISCORD_COLORS.border,
  },
  homeServer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serverDivider: {
    width: 32,
    height: 2,
    backgroundColor: REDDIT_DISCORD_COLORS.border,
    marginVertical: 8,
    borderRadius: 1,
  },
  serverIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginVertical: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  serverIconActive: {
    borderRadius: 16,
  },
  serverImage: {
    width: '100%',
    height: '100%',
  },
  serverPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  serverInitial: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  serverBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: REDDIT_DISCORD_COLORS.discordRed,
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: REDDIT_DISCORD_COLORS.background,
  },
  serverBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  addServerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 2,
    borderColor: REDDIT_DISCORD_COLORS.border,
    borderStyle: 'dashed',
  },
  
  // Feed Header
  feedHeader: {
    backgroundColor: REDDIT_DISCORD_COLORS.backgroundSecondary,
  },
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
  createButton: {
    width: 44,
    height: 44,
  },
  createButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
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
  
  // Stats Banner
  statsBanner: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: REDDIT_DISCORD_COLORS.surface,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  statValue: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: REDDIT_DISCORD_COLORS.textMuted,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: REDDIT_DISCORD_COLORS.border,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: REDDIT_DISCORD_COLORS.online,
  },
  
  // Reddit Style Card
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
    flexWrap: 'wrap',
  },
  communityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subredditIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
  },
  subredditIconPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subredditInitial: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  subredditName: {
    fontSize: 12,
    fontFamily: 'Inter-Semibold',
    color: REDDIT_DISCORD_COLORS.text,
  },
  dotSeparator: {
    fontSize: 12,
    color: REDDIT_DISCORD_COLORS.textDim,
    marginHorizontal: 4,
  },
  postTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: REDDIT_DISCORD_COLORS.textMuted,
  },
  redditTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Semibold',
    color: REDDIT_DISCORD_COLORS.text,
    marginBottom: 8,
  },
  redditDescription: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: REDDIT_DISCORD_COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 8,
  },
  
  // Post Images
  postImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 8,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
  },
  moreImagesOverlay: {
    position: 'absolute',
    right: 8,
    bottom: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  moreImagesText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  
  // Poll & Event
  pollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    borderRadius: 8,
    marginBottom: 8,
  },
  pollText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.text,
    flex: 1,
  },
  eventContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventText: {
    fontSize: 13,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.text,
    flex: 1,
  },
  
  // Tags
  tagContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: REDDIT_DISCORD_COLORS.blurple + '20',
    borderRadius: 12,
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 11,
    fontFamily: 'Inter-Medium',
    color: REDDIT_DISCORD_COLORS.text,
  },
  
  // Footer
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
  
  // Skeleton
  skeletonContainer: {
    paddingVertical: 8,
  },
  skeletonCard: {
    flexDirection: 'row',
    backgroundColor: REDDIT_DISCORD_COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: REDDIT_DISCORD_COLORS.border,
  },
  skeletonVote: {
    alignItems: 'center',
    marginRight: 12,
  },
  skeletonVoteButton: {
    width: 24,
    height: 24,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    borderRadius: 4,
  },
  skeletonKarma: {
    width: 32,
    height: 16,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    borderRadius: 4,
    marginVertical: 4,
  },
  skeletonContent: {
    flex: 1,
  },
  skeletonHeader: {
    width: '60%',
    height: 16,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonTitle: {
    width: '90%',
    height: 20,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonDescription: {
    width: '100%',
    height: 40,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonFooter: {
    width: '50%',
    height: 16,
    backgroundColor: REDDIT_DISCORD_COLORS.elevated,
    borderRadius: 4,
  },
  
  // Empty State
  emptyState: {
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
    marginBottom: 16,
  },
  discoverButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: REDDIT_DISCORD_COLORS.blurple,
    borderRadius: 24,
    marginTop: 8,
  },
  discoverButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-Semibold',
    color: REDDIT_DISCORD_COLORS.textBright,
  },
  
  // Loading
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
  
  feedContent: {
    paddingBottom: 100,
  },
  
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

export default CommunityHome;