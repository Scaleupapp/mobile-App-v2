import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  SafeAreaView,
  View,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Alert,
  RefreshControl,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import LinearGradient from 'react-native-linear-gradient';
import { COLORS } from '../../helper/colors';
import { nh, nw } from '../../helper/scales';
import Text from '../../components/Text';
import {
  getCommunityDetailsApi,
  getCommunityFeedApi,
  joinCommunityApi,
  getCommunityMembersApi,
  likeCommunityPostApi,
  voteOnPollApi,
} from '../../services/apiService';
import Routes from '../../helper/routes';

// Header Constants
const HEADER_MAX_HEIGHT = nh(260);
const HEADER_MIN_HEIGHT = nh(Platform.OS === 'ios' ? 88 : 56 + (StatusBar.currentHeight || 0));
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const FEED_PAGE_SIZE = 10;

// Helper Functions
const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatEventDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

// Custom Post Card Component
const PostCard = React.memo(({ post, communityId, navigation, isMember }) => {
  const [expanded, setExpanded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [votedOptionId, setVotedOptionId] = useState(null);
  const [pollVotes, setPollVotes] = useState({});
  
  useEffect(() => {
    // Initialize like state and count
    setLiked(post?.isLiked || false);
    setLikeCount(post?.metrics?.upvotes || post?.metrics?.likes || post?.likes || 0);
    
    // Initialize poll votes if it's a poll
    if (post?.postType === 'poll' && post?.poll) {
      const votes = {};
      post.poll.options?.forEach(option => {
        votes[option.id || option._id] = option.votes || 0;
      });
      setPollVotes(votes);
      setVotedOptionId(post?.poll?.userVotedOption);
    }
    
    console.log('PostCard initialized:', {
      postId: post?.id || post?._id,
      postType: post?.postType,
      liked: post?.isLiked,
      likeCount: post?.metrics?.upvotes || post?.metrics?.likes || 0,
      pollData: post?.poll,
      eventData: post?.event
    });
  }, [post]);
  
  if (!post || typeof post !== 'object') {
    console.log('PostCard: Invalid post object', post);
    return null;
  }

  const {
    id,
    _id,
    postType = 'text',
    title,
    content,
    author,
    media,
    poll,
    event,
    announcement,
    metrics = {},
    publishedAt,
    createdAt,
    isPinned,
    tags = [],
  } = post;

  const postId = id || _id;
  
  // Extract content text properly
  const contentText = typeof content === 'string' ? content : content?.text || '';
  const truncatedContent = contentText.length > 200 && !expanded 
    ? contentText.substring(0, 200) + '...' 
    : contentText;

  console.log('PostCard render:', {
    postId,
    postType,
    contentText: contentText.substring(0, 50) + '...',
    pollData: poll,
    eventData: event,
    hasTitle: !!title
  });

  const handleLike = async () => {
    if (!isMember) {
      Alert.alert('Join Community', 'You need to be a member to like posts');
      return;
    }
    
    try {
      console.log('Attempting to like post:', postId, 'in community:', communityId);
      
      // Toggle like state optimistically
      const newLikedState = !liked;
      setLiked(newLikedState);
      setLikeCount(prev => newLikedState ? prev + 1 : Math.max(0, prev - 1));
      
      // Call API
      const response = await likeCommunityPostApi(communityId, postId);
      console.log('Like API response:', response.data);
      
      // Update with server response if available
      if (response.data?.likes !== undefined) {
        setLikeCount(response.data.likes);
      }
    } catch (error) {
      console.error('Error liking post:', error);
      // Revert optimistic update
      setLiked(!liked);
      setLikeCount(prev => liked ? prev + 1 : Math.max(0, prev - 1));
      Alert.alert('Error', 'Could not update like status');
    }
  };

  const handleVote = async (optionId) => {
    if (!isMember) {
      Alert.alert('Join Community', 'You need to be a member to vote');
      return;
    }
    
    if (votedOptionId) {
      Alert.alert('Already Voted', 'You have already voted on this poll');
      return;
    }
    
    try {
      console.log('Voting on poll:', postId, 'option:', optionId);
      
      // Update UI optimistically
      setVotedOptionId(optionId);
      setPollVotes(prev => ({
        ...prev,
        [optionId]: (prev[optionId] || 0) + 1
      }));
      
      // Call API
      const response = await voteOnPollApi(communityId, postId, { optionId });
      console.log('Vote API response:', response.data);
      
      // Update with server data if available
      if (response.data?.poll?.options) {
        const newVotes = {};
        response.data.poll.options.forEach(option => {
          newVotes[option.id || option._id] = option.votes || 0;
        });
        setPollVotes(newVotes);
      }
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update
      setVotedOptionId(null);
      setPollVotes(prev => ({
        ...prev,
        [optionId]: Math.max(0, (prev[optionId] || 0) - 1)
      }));
      Alert.alert('Error', 'Could not submit vote');
    }
  };

  const renderPostContent = () => {
    switch (postType) {
      case 'text':
      case 'link':
        console.log('Rendering text/link post');
        return (
          <>
            {title && <Text style={styles.postTitle}>{title}</Text>}
            {contentText && (
              <TouchableOpacity onPress={() => setExpanded(!expanded)} disabled={contentText.length <= 200}>
                <Text style={styles.postContent}>{truncatedContent}</Text>
                {contentText.length > 200 && (
                  <Text style={styles.readMore}>
                    {expanded ? 'Show less' : 'Read more'}
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </>
        );

      case 'poll':
        console.log('Rendering poll post:', { poll, pollVotes, votedOptionId });
        
        if (!poll) {
          console.warn('Poll post without poll data');
          return (
            <>
              {title && <Text style={styles.postTitle}>{title}</Text>}
              <Text style={styles.postContent}>{contentText || 'Poll data not available'}</Text>
            </>
          );
        }
        
        const pollOptions = Array.isArray(poll.options) ? poll.options : [];
        const totalVotes = Object.values(pollVotes).reduce((sum, votes) => sum + votes, 0) || poll.totalVotes || 0;
        
        return (
          <View style={styles.pollContainer}>
            <Text style={styles.pollQuestion}>{poll.question || title || 'Poll'}</Text>
            {contentText && <Text style={styles.pollDescription}>{contentText}</Text>}
            
            {pollOptions.map((option, index) => {
              const optionId = option.id || option._id || index;
              const optionText = typeof option === 'string' ? option : (option.text || option.option || '');
              const optionVotes = pollVotes[optionId] || option.votes || 0;
              const votePercentage = totalVotes > 0 
                ? Math.round((optionVotes / totalVotes) * 100) 
                : 0;
              const isVoted = votedOptionId === optionId;
              
              return (
                <TouchableOpacity
                  key={optionId}
                  style={[styles.pollOption, isVoted && styles.pollOptionVoted]}
                  onPress={() => handleVote(optionId)}
                  disabled={!!votedOptionId || !isMember}
                >
                  <View style={styles.pollOptionContent}>
                    <Text style={[styles.pollOptionText, isVoted && styles.pollOptionTextVoted]}>
                      {optionText}
                    </Text>
                    <Text style={[styles.pollVotes, isVoted && styles.pollVotesVoted]}>
                      {votedOptionId ? `${votePercentage}%` : ''}
                    </Text>
                  </View>
                  {votedOptionId && (
                    <View 
                      style={[
                        styles.pollProgressBar,
                        { width: `${votePercentage}%` },
                        isVoted && styles.pollProgressBarVoted
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
            
            {totalVotes > 0 && (
              <Text style={styles.pollTotalVotes}>
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
                {poll.endsAt && ` • Ends ${formatDate(poll.endsAt)}`}
              </Text>
            )}
          </View>
        );

      case 'event':
        console.log('Rendering event post:', { event, title, contentText });
        
        if (!event && !title && !contentText) {
          console.warn('Event post without event data');
          return <Text style={styles.postContent}>Event details not available</Text>;
        }
        
        return (
          <View style={styles.eventContainer}>
            <Text style={styles.eventTitle}>{event?.name || event?.title || title || 'Event'}</Text>
            
            {(event?.description || contentText) && (
              <Text style={styles.eventDescription}>
                {event?.description || contentText}
              </Text>
            )}
            
            {(event?.startDate || event?.date) && (
              <View style={styles.eventDetail}>
                <Icon name="calendar-outline" size={nw(16)} color={COLORS.grey666666} />
                <Text style={styles.eventDetailText}>
                  {formatEventDate(event.startDate || event.date)}
                </Text>
              </View>
            )}
            
            {event?.endDate && (
              <View style={styles.eventDetail}>
                <Icon name="time-outline" size={nw(16)} color={COLORS.grey666666} />
                <Text style={styles.eventDetailText}>
                  Ends: {formatEventDate(event.endDate)}
                </Text>
              </View>
            )}
            
            {(event?.location?.venue || event?.location || event?.venue) && (
              <View style={styles.eventDetail}>
                <Icon name="location-outline" size={nw(16)} color={COLORS.grey666666} />
                <Text style={styles.eventDetailText}>
                  {event?.location?.venue || event?.location || event?.venue}
                </Text>
              </View>
            )}
            
            {(event?.location?.online || event?.meetingLink) && (
              <View style={styles.eventDetail}>
                <Icon name="videocam-outline" size={nw(16)} color={COLORS.grey666666} />
                <Text style={styles.eventDetailText}>Online Event</Text>
              </View>
            )}
            
            {event?.attendees && (
              <View style={styles.eventDetail}>
                <Icon name="people-outline" size={nw(16)} color={COLORS.grey666666} />
                <Text style={styles.eventDetailText}>
                  {event.attendees.going || 0} going • {event.attendees.interested || 0} interested
                </Text>
              </View>
            )}
          </View>
        );

      case 'announcement':
        console.log('Rendering announcement post');
        return (
          <View style={styles.announcementContainer}>
            <View style={styles.announcementHeader}>
              <Icon name="megaphone" size={nw(18)} color={COLORS.yellowF5BE00} />
              <Text style={styles.announcementBadge}>
                {announcement?.priority?.toUpperCase() || 'ANNOUNCEMENT'}
              </Text>
            </View>
            {title && <Text style={styles.announcementTitle}>{title}</Text>}
            <Text style={styles.announcementContent}>{contentText}</Text>
          </View>
        );

      default:
        console.log('Rendering default post type');
        return (
          <>
            {title && <Text style={styles.postTitle}>{title}</Text>}
            <Text style={styles.postContent}>{contentText}</Text>
          </>
        );
    }
  };

  return (
    <View style={[styles.postCard, isPinned && styles.pinnedPost]}>
      {isPinned && (
        <View style={styles.pinnedIndicator}>
          <Icon name="pin" size={nw(12)} color={COLORS.yellowF5BE00} />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}
      
      <View style={styles.postHeader}>
        <Image
          source={{ 
            uri: author?.profilePicture || author?.avatar ||
                 'https://ui-avatars.com/api/?name=' + (author?.username || author?.name || 'User')
          }}
          style={styles.authorAvatar}
        />
        <View style={styles.postHeaderText}>
          <Text style={styles.authorName}>
            {author?.username || author?.name || 'Anonymous'}
          </Text>
          <Text style={styles.postTime}>{formatDate(publishedAt || createdAt)}</Text>
        </View>
      </View>

      <View style={styles.postBody}>
        {renderPostContent()}
        
        {media?.images?.length > 0 && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.mediaContainer}
          >
            {media.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image.url || image }}
                style={styles.postImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        )}

        {tags.length > 0 && (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.postAction} onPress={handleLike}>
          <Icon 
            name={liked ? "heart" : "heart-outline"} 
            size={nw(20)} 
            color={liked ? COLORS.redFF0000 : COLORS.grey666666} 
          />
          <Text style={[styles.postActionText, liked && styles.postActionTextLiked]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Join Modal Component
const JoinModal = ({ visible, community, onClose, onJoinSuccess }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const handleJoin = async () => {
    setBusy(true);
    try {
      console.log('Joining community:', community?.id || community?._id);
      await joinCommunityApi(community?.id || community?._id, { 
        acceptRules: true, 
        joinReason: reason 
      });
      onJoinSuccess?.();
    } catch (err) {
      console.error('Error joining community:', err);
      Alert.alert('Error', err?.response?.data?.message || 'Could not send join request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal 
      visible={visible} 
      transparent 
      animationType="fade" 
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContainer}
        >
          <Text style={styles.modalTitle}>Join {community?.name}</Text>
          <Text style={styles.modalSubtitle}>
            {community?.privacy === 'private' 
              ? 'This is a private community. Tell the admins why you want to join.'
              : 'Welcome! You can join this community right away.'}
          </Text>
          
          {community?.privacy === 'private' && (
            <TextInput
              value={reason}
              onChangeText={setReason}
              style={styles.reasonInput}
              placeholder="Write a short note (optional)"
              placeholderTextColor={COLORS.grey999999}
              multiline
              maxLength={500}
            />
          )}
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.cancelButton]} 
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={handleJoin}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={COLORS.whiteFFFFFF} size="small" />
              ) : (
                <Text style={styles.confirmButtonText}>
                  {community?.privacy === 'private' ? 'Request to Join' : 'Join'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

// Main Component
const CommunityDetail = ({ route, navigation }) => {
  const communityId = route.params?.communityId || route.params?.id;
  const user = useSelector((state) => state?.userData?.user);

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('Feed');
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Refs to prevent multiple API calls
  const isInitialMount = useRef(true);
  const fetchingPosts = useRef(false);
  const fetchingMembers = useRef(false);

  const scrollY = useSharedValue(0);

  // Fetch posts with debouncing
  const fetchPosts = useCallback(async (page = 1, isRefresh = false) => {
    // Prevent multiple simultaneous calls
    if (fetchingPosts.current || (!isRefresh && (feedLoading || !hasMoreFeed))) {
      console.log('Skipping fetchPosts - already in progress or no more data');
      return;
    }
    
    fetchingPosts.current = true;
    setFeedLoading(true);
    
    try {
      console.log('Fetching posts for community:', communityId, 'page:', page);
      const response = await getCommunityFeedApi(communityId, { 
        page, 
        limit: FEED_PAGE_SIZE 
      });
      
      console.log('Feed API raw response:', response?.data);
      
      const feedData = response?.data?.data || response?.data || {};
      const newPosts = feedData.posts || feedData.feed || feedData.content || [];
      const pagination = feedData.pagination || {};
      
      console.log('Parsed feed data:', {
        postsCount: newPosts.length,
        pagination,
        samplePost: newPosts[0]
      });
      
      if (isRefresh) {
        setPosts(newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
      }
      
      setHasMoreFeed(pagination.hasNext || (newPosts.length >= FEED_PAGE_SIZE && newPosts.length > 0));
      setFeedPage(pagination.hasNext ? page + 1 : page);
    } catch (error) {
      console.error('Error fetching posts:', error);
      // Don't set empty posts on error if we already have data
      if (isRefresh || posts.length === 0) {
        setPosts([]);
      }
      setHasMoreFeed(false);
    } finally {
      setFeedLoading(false);
      fetchingPosts.current = false;
    }
  }, [communityId, feedLoading, hasMoreFeed, posts.length]);

  // Fetch members with debouncing
  const fetchMembers = useCallback(async () => {
    if (fetchingMembers.current || membersLoaded) {
      console.log('Skipping fetchMembers - already loaded or in progress');
      return;
    }
    
    fetchingMembers.current = true;
    setMembersLoading(true);
    
    try {
      console.log('Fetching members for community:', communityId);
      const response = await getCommunityMembersApi(communityId);
      console.log('Members API response:', response?.data);
      
      const membersData = response?.data?.data?.members || 
                         response?.data?.members || 
                         response?.data || [];
      setMembers(Array.isArray(membersData) ? membersData : []);
      setMembersLoaded(true);
    } catch (error) {
      console.error('Error fetching members:', error);
      setMembers([]);
    } finally {
      setMembersLoading(false);
      fetchingMembers.current = false;
    }
  }, [communityId, membersLoaded]);

  // Fetch initial data
  const fetchInitialData = useCallback(async (isRefresh = false) => {
    // Prevent infinite loop
    if (!isRefresh && hasError) {
      console.log('Skipping fetchInitialData - previous error state');
      return;
    }
    
    if (!isRefresh) {
      setLoading(true);
    }
    
    try {
      console.log('Fetching community details for:', communityId);
      const response = await getCommunityDetailsApi(communityId);
      console.log('Community details API response:', response?.data);
      
      const data = response?.data?.data || response?.data || {};
      
      // If no community data, set error state
      if (!data.community && !data.name) {
        console.error('No community data found');
        setHasError(true);
        setLoading(false);
        Alert.alert('Error', 'Community not found');
        navigation.goBack();
        return;
      }
      
      setCommunity(data.community || data);
      setHasError(false);
      
      // Check admin/owner status FIRST
      const membership = data.userMembership || data.membership;
      const userRole = membership?.role;
      
      console.log('User membership data:', {
        membership,
        userRole,
        userId: user?.id || user?._id
      });
      
      // Check if user is admin/owner/moderator
      const isUserAdmin = userRole && ['owner', 'admin', 'moderator'].includes(userRole.toLowerCase());
      
      // If user is admin, they are definitely a member
      const isUserMember = isUserAdmin || !!membership;
      
      console.log('User status:', {
        isAdmin: isUserAdmin,
        isMember: isUserMember,
        membershipStatus: membership?.status
      });
      
      // Set states
      setIsAdmin(isUserAdmin);
      setIsMember(isUserMember);
      setMembershipStatus(membership?.status || (isUserMember ? 'active' : null));
      
      // Fetch posts based on community privacy and membership
      const communityData = data.community || data;
      if (communityData?.privacy === 'public' || isUserMember) {
        await fetchPosts(1, true);
      } else {
        console.log('Not fetching posts - private community and not a member');
        setPosts([]);
        setHasMoreFeed(false);
      }
      
      // Fetch members if user is a member (but don't wait for it)
      if (isUserMember && !membersLoaded) {
        fetchMembers();
      }
      
    } catch (error) {
      console.error('Error fetching community:', error);
      setHasError(true);
      if (!isRefresh) {
        Alert.alert('Error', 'Could not load community details');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [communityId, navigation, fetchPosts, fetchMembers, hasError, membersLoaded, user]);

  // Initial mount effect
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log('Initial mount - fetching data for community:', communityId);
      fetchInitialData();
    }
  }, []); // Empty dependency array - only run once

  const onRefresh = useCallback(() => {
    console.log('Refreshing community data');
    setRefreshing(true);
    setMembersLoaded(false); // Reset members loaded state on refresh
    fetchInitialData(true);
  }, [fetchInitialData]);

  const onTabChange = useCallback((tab) => {
    console.log('Tab changed to:', tab);
    setActiveTab(tab);
    // Fetch members when switching to Members tab if not already loaded
    if (tab === 'Members' && !membersLoaded && !membersLoading) {
      fetchMembers();
    }
  }, [membersLoaded, membersLoading, fetchMembers]);

  // Navigate to Community Management (for admin/owner)
  const navigateToCommunityManagement = useCallback(() => {
    console.log('Navigating to Community Management');
    navigation.navigate(Routes.CommunityManagement, { 
      communityId,
      communityName: community?.name 
    });
  }, [navigation, communityId, community?.name]);

  // Animations
  const headerAnimatedStyle = useAnimatedStyle(() => ({
    height: interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE],
      [HEADER_MAX_HEIGHT, HEADER_MIN_HEIGHT],
      Extrapolate.CLAMP
    ),
  }));

  const headerContentOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, HEADER_SCROLL_DISTANCE / 2],
      [1, 0],
      Extrapolate.CLAMP
    ),
  }));

  const stickyTitleOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [HEADER_SCROLL_DISTANCE / 2, HEADER_SCROLL_DISTANCE],
      [0, 1],
      Extrapolate.CLAMP
    ),
  }));

  // Render functions
  const renderPost = useCallback(({ item }) => (
    <PostCard 
      post={item} 
      communityId={communityId}
      navigation={navigation}
      isMember={isMember}
    />
  ), [communityId, navigation, isMember]);

  const ListHeaderComponent = useMemo(() => (
    <>
      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <Image
          source={{ 
            uri: community?.coverImage?.url || community?.coverImage ||
                 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&q=80'
          }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)']}
          style={StyleSheet.absoluteFill}
        />
        
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Icon name="arrow-back" size={nw(24)} color={COLORS.whiteFFFFFF} />
          </TouchableOpacity>
          {isAdmin && (
            <View style={styles.headerRightButtons}>
              <TouchableOpacity
                onPress={navigateToCommunityManagement}
                style={styles.headerButton}
              >
                <Icon name="bar-chart-outline" size={nw(22)} color={COLORS.whiteFFFFFF} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => navigation.navigate(Routes.CommunitySettings, { communityId })}
                style={styles.headerButton}
              >
                <Icon name="settings-outline" size={nw(22)} color={COLORS.whiteFFFFFF} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <Animated.View style={[styles.headerContent, headerContentOpacity]}>
          <Text style={styles.communityTitle}>{community?.name}</Text>
          <View style={styles.communityStats}>
            <Text style={styles.communityStat}>
              {community?.stats?.memberCount || community?.memberCount || 0} Members
            </Text>
            <Text style={styles.communityStat}>•</Text>
            <Text style={styles.communityStat}>
              {community?.stats?.postCount || community?.postCount || 0} Posts
            </Text>
          </View>
          <View style={styles.privacyBadge}>
            <Icon 
              name={community?.privacy === 'public' ? "globe-outline" : "lock-closed-outline"} 
              size={nw(14)} 
              color={COLORS.whiteFFFFFF} 
            />
            <Text style={styles.privacyText}>
              {community?.privacy?.charAt(0).toUpperCase() + community?.privacy?.slice(1) || 'Public'}
            </Text>
          </View>
          {isAdmin && (
            <TouchableOpacity 
              style={styles.manageButton}
              onPress={navigateToCommunityManagement}
            >
              <Icon name="bar-chart-outline" size={nw(14)} color={COLORS.whiteFFFFFF} />
              <Text style={styles.manageButtonText}>Manage Community</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>

      <View style={styles.stickyHeaderContainer}>
        {!isMember && !isAdmin && (
          <TouchableOpacity 
            style={[
              styles.joinButtonLarge,
              membershipStatus === 'pending' && styles.joinButtonPending
            ]} 
            onPress={() => setJoinModalVisible(true)}
            disabled={membershipStatus === 'pending'}
          >
            <Icon 
              name={membershipStatus === 'pending' ? "time-outline" : "add-circle-outline"} 
              size={nw(20)} 
              color={COLORS.whiteFFFFFF} 
            />
            <Text style={styles.joinButtonText}>
              {membershipStatus === 'pending' ? 'Request Pending' : 'Join Community'}
            </Text>
          </TouchableOpacity>
        )}
        
        <View style={styles.tabContainer}>
          {['Feed', 'About', 'Members'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={styles.tab} 
              onPress={() => onTabChange(tab)}
            >
              <Text 
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText
                ]}
              >
                {tab}
              </Text>
              {activeTab === tab && <View style={styles.activeTabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </>
  ), [
    community, 
    isAdmin, 
    isMember, 
    membershipStatus,
    activeTab, 
    headerAnimatedStyle, 
    headerContentOpacity,
    navigation,
    communityId,
    onTabChange,
    navigateToCommunityManagement,
  ]);

  const ListFooterComponent = useMemo(() => (
    <View style={styles.footerContainer}>
      {activeTab === 'Feed' && (
        <>
          {feedLoading && posts.length > 0 && (
            <ActivityIndicator 
              style={styles.loadingMore} 
              color={COLORS.blue043142} 
            />
          )}
          {!feedLoading && posts.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="newspaper-outline" size={nw(48)} color={COLORS.greyC4C4C4} />
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySubtitle}>
                {isMember 
                  ? "Be the first to share something with the community!"
                  : community?.privacy === 'public'
                    ? "Join the community to start posting"
                    : "This is a private community. Join to see posts."}
              </Text>
            </View>
          )}
        </>
      )}
      
      {activeTab === 'About' && (
        <View style={styles.aboutContainer}>
          <View style={styles.aboutSection}>
            <Text style={styles.aboutTitle}>About</Text>
            <Text style={styles.aboutText}>
              {community?.description || 'No description available'}
            </Text>
          </View>
          
          {community?.guidelines?.content && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Community Guidelines</Text>
              <Text style={styles.aboutText}>{community.guidelines.content}</Text>
            </View>
          )}
          
          {community?.createdAt && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Created</Text>
              <Text style={styles.aboutText}>
                {new Date(community.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {activeTab === 'Members' && (
        <View style={styles.membersContainer}>
          {membersLoading ? (
            <ActivityIndicator style={styles.loadingMembers} color={COLORS.blue043142} />
          ) : members.length === 0 ? (
            !isMember && community?.privacy !== 'public' ? (
              <View style={styles.emptyState}>
                <Icon name="people-outline" size={nw(48)} color={COLORS.greyC4C4C4} />
                <Text style={styles.emptyTitle}>Members list is private</Text>
                <Text style={styles.emptySubtitle}>
                  Join the community to see who's here
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No members found</Text>
              </View>
            )
          ) : (
            members.map((member, index) => {
              const memberUser = member?.user || member;
              const memberRole = member?.role || 'member';
              
              return (
                <View key={member?.id || member?._id || `member-${index}`} style={styles.memberRow}>
                  <Image
                    source={{ 
                      uri: memberUser?.profilePicture || 
                           memberUser?.avatar ||
                           'https://ui-avatars.com/api/?name=' + 
                           (memberUser?.username || memberUser?.name || memberUser?.firstname || 'User')
                    }}
                    style={styles.memberAvatar}
                  />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>
                      {memberUser?.username || memberUser?.name || 
                       (memberUser?.firstname && memberUser?.lastname 
                         ? `${memberUser.firstname} ${memberUser.lastname}` 
                         : 'Anonymous')}
                    </Text>
                    <Text style={styles.memberRole}>
                      {memberRole.charAt(0).toUpperCase() + memberRole.slice(1)}
                    </Text>
                  </View>
                  {memberRole === 'owner' && (
                    <View style={styles.ownerBadge}>
                      <Icon name="shield-checkmark" size={nw(16)} color={COLORS.yellowF5BE00} />
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
      )}
    </View>
  ), [activeTab, feedLoading, posts.length, isMember, community, members, membersLoading]);

  const handleLoadMore = useCallback(() => {
    if (activeTab === 'Feed' && hasMoreFeed && !feedLoading && !fetchingPosts.current) {
      console.log('Loading more posts, page:', feedPage);
      fetchPosts(feedPage);
    }
  }, [activeTab, hasMoreFeed, feedLoading, feedPage, fetchPosts]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.FlatList
        data={activeTab === 'Feed' ? posts : []}
        renderItem={renderPost}
        keyExtractor={(item, index) => item?.id || item?._id || `post-${index}`}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        onScroll={(event) => {
          scrollY.value = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.blue043142}
          />
        }
        contentContainerStyle={styles.listContent}
      />
      
      <Animated.View 
        style={[
          styles.stickyTitle,
          { top: StatusBar.currentHeight || 0 },
          stickyTitleOpacity
        ]}
      >
        <Text style={styles.stickyTitleText} numberOfLines={1}>
          {community?.name}
        </Text>
      </Animated.View>

      {isMember && activeTab === 'Feed' && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate(Routes.CreateCommunityPost, { 
            communityId, 
            communityName: community?.name 
          })}
        >
          <Icon name="add" size={nw(28)} color={COLORS.whiteFFFFFF} />
        </TouchableOpacity>
      )}

      <JoinModal
        visible={joinModalVisible}
        community={community}
        onClose={() => setJoinModalVisible(false)}
        onJoinSuccess={() => {
          setJoinModalVisible(false);
          setMembersLoaded(false);
          fetchInitialData(true);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: nh(100),
  },
  
  // Header Styles
  header: {
    position: 'relative',
    justifyContent: 'flex-end',
    backgroundColor: COLORS.greyE0E0E0,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'absolute',
    top: (StatusBar.currentHeight || 0) + nh(10),
    left: nw(16),
    right: nw(16),
    zIndex: 10,
  },
  headerButton: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: nw(20),
    padding: nw(8),
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: nw(10),
  },
  headerContent: {
    padding: nw(20),
    paddingBottom: nh(24),
  },
  communityTitle: {
    fontSize: nw(28),
    fontWeight: '700',
    color: COLORS.whiteFFFFFF,
    marginBottom: nh(8),
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(10),
    marginBottom: nh(8),
  },
  communityStat: {
    fontSize: nw(14),
    color: COLORS.whiteFFFFFF,
    opacity: 0.9,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: nw(10),
    paddingVertical: nh(4),
    borderRadius: nw(12),
    alignSelf: 'flex-start',
  },
  privacyText: {
    fontSize: nw(12),
    color: COLORS.whiteFFFFFF,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderRadius: nw(14),
    alignSelf: 'flex-start',
    marginTop: nh(12),
  },
  manageButtonText: {
    fontSize: nw(13),
    fontWeight: '600',
    color: COLORS.whiteFFFFFF,
  },
  
  // Sticky Header
  stickyHeaderContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  stickyTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: HEADER_MIN_HEIGHT,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
    zIndex: 100,
    pointerEvents: 'none',
  },
  stickyTitleText: {
    fontSize: nw(18),
    fontWeight: '600',
    color: COLORS.blue043142,
  },
  
  // Join Button
  joinButtonLarge: {
    backgroundColor: COLORS.blue043142,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: nw(8),
    margin: nw(16),
    height: nh(48),
    borderRadius: nw(24),
  },
  joinButtonPending: {
    backgroundColor: COLORS.grey999999,
  },
  joinButtonText: {
    fontSize: nw(15),
    fontWeight: '600',
    color: COLORS.whiteFFFFFF,
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    paddingVertical: nh(14),
    alignItems: 'center',
    position: 'relative',
  },
  tabText: {
    fontSize: nw(14),
    fontWeight: '500',
    color: COLORS.grey666666,
  },
  activeTabText: {
    color: COLORS.blue043142,
    fontWeight: '600',
  },
  activeTabIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 3,
    backgroundColor: COLORS.blue043142,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  
  // Post Card Styles
  postCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    marginHorizontal: nw(16),
    marginBottom: nh(12),
    borderRadius: nw(16),
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pinnedPost: {
    borderWidth: 1,
    borderColor: COLORS.yellowF5BE00 + '40',
  },
  pinnedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
    backgroundColor: COLORS.yellowF5BE00 + '20',
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
  },
  pinnedText: {
    fontSize: nw(11),
    fontWeight: '600',
    color: COLORS.yellowF5BE00,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: nw(12),
  },
  authorAvatar: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    backgroundColor: COLORS.greyE0E0E0,
  },
  postHeaderText: {
    marginLeft: nw(12),
    flex: 1,
  },
  authorName: {
    fontSize: nw(14),
    fontWeight: '600',
    color: COLORS.grey222222,
  },
  postTime: {
    fontSize: nw(12),
    color: COLORS.grey999999,
    marginTop: nh(2),
  },
  postBody: {
    paddingHorizontal: nw(12),
    paddingBottom: nw(12),
  },
  postTitle: {
    fontSize: nw(16),
    fontWeight: '600',
    color: COLORS.grey222222,
    marginBottom: nh(8),
  },
  postContent: {
    fontSize: nw(14),
    color: COLORS.grey3A3A3A,
    lineHeight: nh(20),
  },
  readMore: {
    fontSize: nw(13),
    color: COLORS.blue043142,
    marginTop: nh(4),
    fontWeight: '500',
  },
  mediaContainer: {
    marginTop: nh(12),
    marginHorizontal: -nw(12),
  },
  postImage: {
    width: nw(280),
    height: nh(180),
    marginHorizontal: nw(6),
    borderRadius: nw(12),
    backgroundColor: COLORS.greyE0E0E0,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
    marginTop: nh(12),
  },
  tag: {
    backgroundColor: COLORS.blue043142 + '10',
    paddingHorizontal: nw(10),
    paddingVertical: nh(4),
    borderRadius: nw(12),
  },
  tagText: {
    fontSize: nw(12),
    color: COLORS.blue043142,
  },
  postFooter: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.greyF0F0F0,
    paddingTop: nh(10),
    paddingHorizontal: nw(12),
    paddingBottom: nh(10),
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    flex: 1,
    justifyContent: 'center',
  },
  postActionText: {
    fontSize: nw(13),
    color: COLORS.grey666666,
    fontWeight: '500',
  },
  postActionTextLiked: {
    color: COLORS.redFF0000,
  },
  
  // Poll Styles
  pollContainer: {
    marginTop: nh(8),
  },
  pollQuestion: {
    fontSize: nw(15),
    fontWeight: '600',
    color: COLORS.grey222222,
    marginBottom: nh(12),
  },
  pollDescription: {
    fontSize: nw(13),
    color: COLORS.grey666666,
    marginBottom: nh(12),
    lineHeight: nh(18),
  },
  pollOption: {
    borderWidth: 1,
    borderColor: COLORS.greyE0E0E0,
    borderRadius: nw(10),
    padding: nw(12),
    marginBottom: nh(8),
    position: 'relative',
    overflow: 'hidden',
  },
  pollOptionVoted: {
    borderColor: COLORS.blue043142 + '40',
  },
  pollOptionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  pollOptionText: {
    fontSize: nw(14),
    color: COLORS.grey3A3A3A,
    flex: 1,
  },
  pollOptionTextVoted: {
    color: COLORS.blue043142,
    fontWeight: '500',
  },
  pollVotes: {
    fontSize: nw(12),
    fontWeight: '600',
    color: COLORS.blue043142,
  },
  pollVotesVoted: {
    color: COLORS.blue043142,
  },
  pollProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: COLORS.blue043142 + '20',
    zIndex: 1,
  },
  pollProgressBarVoted: {
    backgroundColor: COLORS.blue043142 + '30',
  },
  pollTotalVotes: {
    fontSize: nw(12),
    color: COLORS.grey999999,
    marginTop: nh(8),
    textAlign: 'center',
  },
  
  // Event Styles
  eventContainer: {
    marginTop: nh(8),
  },
  eventTitle: {
    fontSize: nw(16),
    fontWeight: '600',
    color: COLORS.grey222222,
    marginBottom: nh(10),
  },
  eventDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
    marginBottom: nh(8),
  },
  eventDetailText: {
    fontSize: nw(13),
    color: COLORS.grey666666,
  },
  eventDescription: {
    fontSize: nw(14),
    color: COLORS.grey3A3A3A,
    lineHeight: nh(20),
    marginTop: nh(4),
    marginBottom: nh(10),
  },
  
  // Announcement Styles
  announcementContainer: {
    marginTop: nh(8),
  },
  announcementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
    marginBottom: nh(10),
  },
  announcementBadge: {
    fontSize: nw(11),
    fontWeight: '700',
    color: COLORS.yellowF5BE00,
    letterSpacing: 0.5,
  },
  announcementTitle: {
    fontSize: nw(15),
    fontWeight: '600',
    color: COLORS.grey222222,
    marginBottom: nh(8),
  },
  announcementContent: {
    fontSize: nw(14),
    color: COLORS.grey3A3A3A,
    lineHeight: nh(20),
  },
  
  // Footer Sections
  footerContainer: {
    minHeight: nh(200),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(60),
    paddingHorizontal: nw(40),
  },
  emptyTitle: {
    fontSize: nw(18),
    fontWeight: '600',
    color: COLORS.grey666666,
    marginTop: nh(16),
  },
  emptySubtitle: {
    fontSize: nw(14),
    color: COLORS.grey999999,
    textAlign: 'center',
    marginTop: nh(8),
    lineHeight: nh(20),
  },
  loadingMore: {
    paddingVertical: nh(20),
  },
  loadingMembers: {
    paddingVertical: nh(40),
  },
  
  // About Section
  aboutContainer: {
    padding: nw(20),
  },
  aboutSection: {
    marginBottom: nh(24),
  },
  aboutTitle: {
    fontSize: nw(16),
    fontWeight: '600',
    color: COLORS.grey222222,
    marginBottom: nh(8),
  },
  aboutText: {
    fontSize: nw(14),
    color: COLORS.grey3A3A3A,
    lineHeight: nh(22),
  },
  
  // Members Section
  membersContainer: {
    paddingTop: nh(8),
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyF0F0F0,
  },
  memberAvatar: {
    width: nw(44),
    height: nw(44),
    borderRadius: nw(22),
    backgroundColor: COLORS.greyE0E0E0,
  },
  memberInfo: {
    marginLeft: nw(12),
    flex: 1,
  },
  memberName: {
    fontSize: nw(14),
    fontWeight: '500',
    color: COLORS.grey222222,
  },
  memberRole: {
    fontSize: nw(12),
    color: COLORS.grey999999,
    marginTop: nh(2),
  },
  ownerBadge: {
    padding: nw(4),
  },
  
  // FAB
  fab: {
    position: 'absolute',
    right: nw(20),
    bottom: nh(30),
    width: nw(56),
    height: nw(56),
    borderRadius: nw(28),
    backgroundColor: COLORS.blue043142,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(20),
    padding: nw(24),
    maxWidth: nw(400),
  },
  modalTitle: {
    fontSize: nw(18),
    fontWeight: '700',
    color: COLORS.grey222222,
    marginBottom: nh(8),
  },
  modalSubtitle: {
    fontSize: nw(14),
    color: COLORS.grey666666,
    lineHeight: nh(20),
    marginBottom: nh(16),
  },
  reasonInput: {
    borderWidth: 1,
    borderColor: COLORS.greyE0E0E0,
    borderRadius: nw(12),
    padding: nw(12),
    height: nh(100),
    textAlignVertical: 'top',
    fontSize: nw(14),
    color: COLORS.grey3A3A3A,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: nw(12),
    marginTop: nh(20),
  },
  modalButton: {
    paddingVertical: nh(12),
    paddingHorizontal: nw(24),
    borderRadius: nw(20),
    minWidth: nw(90),
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.greyF0F0F0,
  },
  cancelButtonText: {
    fontSize: nw(14),
    fontWeight: '500',
    color: COLORS.grey666666,
  },
  confirmButton: {
    backgroundColor: COLORS.blue043142,
  },
  confirmButtonText: {
    fontSize: nw(14),
    fontWeight: '600',
    color: COLORS.whiteFFFFFF,
  },
});

export default CommunityDetail;