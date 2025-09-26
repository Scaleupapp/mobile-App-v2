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
  Pressable,
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
  voteCommunityPostApi,
  voteOnPollApi,
  rsvpToEventApi,
  bookmarkCommunityPostApi,
  shareCommunityPostApi,
  commentOnCommunityPostApi,
  getPostInteractionsApi,
  getCommunityPostDetailsApi,
  deleteCommunityPostApi,
} from '../../services/apiService';
import Routes from '../../helper/routes';

// Header Constants
const HEADER_MAX_HEIGHT = nh(200);
const HEADER_MIN_HEIGHT = nh(Platform.OS === 'ios' ? 72 : 48 + (StatusBar.currentHeight || 0));
const HEADER_SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;
const FEED_PAGE_SIZE = 10;
const CACHE_TTL_MS = 60 * 1000; // reuse fresh data for a minute to speed up re-entry
const PREFETCH_LIMIT = 12;

const formatNumber = (value) => {
  const num = Number(value || 0);
  if (!num) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return `${num}`;
};

const POST_ID_CANDIDATES = ['id', '_id', 'postId', 'post_id', 'uuid'];

const resolvePostId = (post) => {
  if (!post || typeof post !== 'object') {
    return null;
  }

  for (const key of POST_ID_CANDIDATES) {
    if (post[key]) {
      return String(post[key]);
    }
  }

  if (post.metadata && typeof post.metadata === 'object') {
    for (const key of POST_ID_CANDIDATES) {
      if (post.metadata[key]) {
        return String(post.metadata[key]);
      }
    }
  }

  return null;
};

const ID_CANDIDATE_KEYS = [
  '_id',
  'id',
  'userId',
  'authorId',
  'ownerId',
  'createdBy',
  'createdById',
  'createdByUser',
  'author',
  'user',
  'member',
  'profile',
  'account',
  'data',
  'details',
  'userProfile',
  'userProfileInfo',
  'participant',
  'creator',
  'postedBy',
  'creatorId',
  'owner',
];

const normalizeIdentifier = (value, visited = new Set()) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const stringValue = value.toString().trim();
    if (stringValue && stringValue !== '[object Object]') {
      return stringValue;
    }
    return null;
  }

  if (typeof value !== 'object') {
    return null;
  }

  if (visited.has(value)) {
    return null;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeIdentifier(item, visited);
      if (normalized) {
        return normalized;
      }
    }
    return null;
  }

  for (const key of ID_CANDIDATE_KEYS) {
    if (key in value && value[key] !== undefined) {
      const normalized = normalizeIdentifier(value[key], visited);
      if (normalized) {
        return normalized;
      }
    }
  }

  if (typeof value.toString === 'function') {
    const objectString = value.toString();
    if (objectString && objectString !== '[object Object]') {
      return objectString;
    }
  }

  for (const key of Object.keys(value)) {
    if (ID_CANDIDATE_KEYS.includes(key)) {
      continue;
    }

    const nestedValue = value[key];
    if (nestedValue && typeof nestedValue === 'object') {
      const normalized = normalizeIdentifier(nestedValue, visited);
      if (normalized) {
        return normalized;
      }
    }
  }

  return null;
};

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

// Helper function to safely extract text from potentially encrypted data
const extractSafeText = (textData) => {
  if (!textData) return '';
  
  // If it's a string, return as-is
  if (typeof textData === 'string') {
    return textData;
  }
  
  // If it's an encrypted object (has 'encrypted' property)
  if (typeof textData === 'object' && textData.encrypted) {
    console.warn('Text is still encrypted:', textData);
    return '[Encrypted]';
  }
  
  // If it's an object with nested 'text' property
  if (typeof textData === 'object' && textData.text) {
    return String(textData.text);
  }
  
  // If it's an object with 'isEncrypted' false and has 'text' property
  if (typeof textData === 'object' && textData.isEncrypted === false && textData.text) {
    return String(textData.text);
  }
  
  // Fallback - try to convert to string
  try {
    return String(textData);
  } catch (error) {
    console.error('Failed to extract text:', error);
    return '';
  }
};

// Content Type Filter Component
const ContentTypeFilter = React.memo(({ selectedTypes, onTypeToggle }) => {
  const types = [
    { key: 'all', label: 'All', icon: 'apps' },
    { key: 'text', label: 'Posts', icon: 'document-text' },
    { key: 'poll', label: 'Polls', icon: 'stats-chart' },
    { key: 'event', label: 'Events', icon: 'calendar' },
  ];

  return (
    <View style={styles.filterContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
      >
        {types.map((type) => {
          const isSelected = type.key === 'all' 
            ? selectedTypes.length === 0 || selectedTypes.length === 3
            : selectedTypes.includes(type.key);
            
          return (
            <TouchableOpacity
              key={type.key}
              style={[styles.filterChip, isSelected && styles.filterChipActive]}
              onPress={() => onTypeToggle(type.key)}
            >
              <Icon 
                name={type.icon} 
                size={nw(14)} 
                color={isSelected ? COLORS.whiteFFFFFF : COLORS.grey666666} 
              />
              <Text style={[
                styles.filterChipText,
                isSelected && styles.filterChipTextActive
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

// Custom Post Card Component with Enhanced RSVP
const PostCard = React.memo(({ post, communityId, navigation, isMember, currentUserId, onPostDeleted }) => {
  const [expanded, setExpanded] = useState(false);
  const [userVote, setUserVote] = useState(null);
  const [upvoteCount, setUpvoteCount] = useState(0);
  const [downvoteCount, setDownvoteCount] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [votedOptionIds, setVotedOptionIds] = useState([]);
  const [pollVotes, setPollVotes] = useState({});
  const [selectedRSVP, setSelectedRSVP] = useState(null);
  const [pollOptions, setPollOptions] = useState([]);
  const [loadingPollDetails, setLoadingPollDetails] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  
  // Debug logging for RSVP state
  useEffect(() => {
    if (post?.postType === 'event') {
      console.log('Event post detected:', post?.title || post?.preview?.eventTitle);
      console.log('Current selectedRSVP state:', selectedRSVP);
      console.log('User RSVP from post data:', post?.event?.userRsvp || post?.preview?.userRsvp);
    }
  }, [post, selectedRSVP]);

  // Fetch poll details if encrypted
  useEffect(() => {
    const fetchPollDetails = async () => {
      if (post?.postType === 'poll' && post?.isEncrypted && !pollOptions.length && !loadingPollDetails) {
        setLoadingPollDetails(true);
        try {
          if (getCommunityPostDetailsApi) {
            const response = await getCommunityPostDetailsApi(communityId, post.id || post._id);
            console.log('Full poll details response:', response?.data);
            
            const fullPost = response?.data?.data || response?.data || {};
            const options = fullPost.poll?.options || 
                          fullPost.preview?.pollOptions || 
                          [];
            
            if (Array.isArray(options) && options.length > 0) {
              setPollOptions(options);
              
              const votes = {};
              options.forEach((option, index) => {
                const optionId = option._id || option.id || `option_${index}`;
                const optionVotes = option.votes || option.voteCount || 0;
                votes[optionId] = optionVotes;
              });
              setPollVotes(votes);
            }
          }
        } catch (error) {
          console.error('Error fetching poll details:', error);
        } finally {
          setLoadingPollDetails(false);
        }
      }
    };
    
    if (isMember) {
      fetchPollDetails();
    }
  }, [post, communityId, isMember, pollOptions.length, loadingPollDetails]);

  useEffect(() => {
    // Initialize interaction states
    const metrics = post?.metrics || {};
    setUpvoteCount(metrics.upvotes || 0);
    setDownvoteCount(metrics.downvotes || 0);
    setCommentCount(metrics.comments || 0);
    setShareCount(metrics.shares || 0);
    setBookmarked(post?.userBookmarked || false);
    
    // Initialize user vote state
    if (post?.userVote) {
      setUserVote(post.userVote);
    }
    
    // Initialize poll data
    if (post?.postType === 'poll') {
      const votes = {};
      const options = post?.poll?.options || 
                     post?.preview?.pollOptions || 
                     post?.preview?.options || 
                     [];
      
      if (Array.isArray(options) && options.length > 0) {
        setPollOptions(options);
        options.forEach((option, index) => {
          const optionId = option._id || option.id || `option_${index}`;
          const optionVotes = option.votes || option.voteCount || 0;
          votes[optionId] = optionVotes;
        });
      } else if (!post?.isEncrypted) {
        const defaultOptions = [
          { id: 'yes', text: 'Yes', votes: 0 },
          { id: 'no', text: 'No', votes: 0 }
        ];
        setPollOptions(defaultOptions);
        defaultOptions.forEach(option => {
          votes[option.id] = 0;
        });
      }
      
      setPollVotes(votes);
      
      const userVotes = post?.poll?.userVotes || 
                       post?.preview?.userVotes || 
                       post?.userVotedOption || 
                       [];
      setVotedOptionIds(Array.isArray(userVotes) ? userVotes : [userVotes].filter(Boolean));
    }
    
    // Initialize RSVP for events with better state extraction
    if (post?.postType === 'event') {
      const userRsvp = post?.event?.userRsvp || 
                      post?.preview?.userRsvp || 
                      post?.userRsvp ||
                      post?.rsvpStatus;
      
      if (userRsvp) {
        const rsvpStatus = typeof userRsvp === 'string' ? userRsvp : userRsvp.status;
        console.log('Setting initial RSVP status to:', rsvpStatus);
        setSelectedRSVP(rsvpStatus);
      }
    }
    
  }, [post]);
  
  if (!post || typeof post !== 'object') {
    console.log('Invalid post object:', post);
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
    preview,
    announcement,
    metrics = {},
    publishedAt,
    createdAt,
    isPinned,
    tags = [],
    isEncrypted,
  } = post;

  const postId = id || _id;

  const normalizedCurrentUserId = normalizeIdentifier(currentUserId);
  const candidateAuthorIds = [
    author,
    author?._id,
    author?.id,
    author?.userId,
    post?.authorId,
    post?.author?.id,
    post?.author?._id,
    post?.author?.userId,
    post?.createdBy,
    post?.createdBy?._id,
    post?.createdBy?.id,
    post?.createdBy?.userId,
    post?.createdBy?.user,
    post?.createdBy?.member,
    post?.createdById,
    post?.userId,
    post?.user?.id,
    post?.user?._id,
    post?.creatorId,
    post?.ownerId,
    post?.postedBy,
  ]
    .map((candidate) => normalizeIdentifier(candidate))
    .filter(Boolean);

  const isOwnPost = normalizedCurrentUserId
    ? candidateAuthorIds.includes(normalizedCurrentUserId)
    : false;
  
  let contentText = '';
  if (typeof content === 'string') {
    contentText = content;
  } else if (content?.text) {
    contentText = content.text;
  } else if (content?.html) {
    contentText = content.html.replace(/<[^>]*>/g, '');
  }
  
  const truncatedContent = contentText.length > 200 && !expanded 
    ? contentText.substring(0, 200) + '...' 
    : contentText;

  const handleVote = async (voteType) => {
    if (!isMember) {
      Alert.alert('Join Community', 'You need to be a member to vote on posts');
      return;
    }
    
    if (isOwnPost) {
      Alert.alert('Cannot Vote', 'You cannot vote on your own post');
      return;
    }
    
    try {
      const prevVote = userVote;
      const prevUpvotes = upvoteCount;
      const prevDownvotes = downvoteCount;
      
      if (userVote === voteType) {
        setUserVote(null);
        if (voteType === 'upvote') {
          setUpvoteCount(prev => Math.max(0, prev - 1));
        } else {
          setDownvoteCount(prev => Math.max(0, prev - 1));
        }
      } else {
        if (userVote === 'upvote') {
          setUpvoteCount(prev => Math.max(0, prev - 1));
        } else if (userVote === 'downvote') {
          setDownvoteCount(prev => Math.max(0, prev - 1));
        }
        
        setUserVote(voteType);
        if (voteType === 'upvote') {
          setUpvoteCount(prev => prev + 1);
        } else {
          setDownvoteCount(prev => prev + 1);
        }
      }
      
      const response = await voteCommunityPostApi(communityId, postId, { 
        voteType: voteType
      });
      
      if (response.data?.data?.metrics) {
        setUpvoteCount(response.data.data.metrics.upvotes || 0);
        setDownvoteCount(response.data.data.metrics.downvotes || 0);
      }
      if (response.data?.data?.voteType !== undefined) {
        setUserVote(response.data.data.voteType);
      }
    } catch (error) {
      console.error('Error voting:', error);
      setUserVote(userVote);
      setUpvoteCount(upvoteCount);
      setDownvoteCount(downvoteCount);
      
      const errorMessage = error.response?.data?.message || 'Could not update vote';
      if (!errorMessage.includes('cannot vote on your own post')) {
        Alert.alert('Error', errorMessage);
      }
    }
  };

  const handlePollVote = async (optionId) => {
    if (!isMember) {
      Alert.alert('Join Community', 'You need to be a member to vote');
      return;
    }
    
    const pollSettings = poll?.settings || preview?.pollSettings || {};
    
    if (votedOptionIds.length > 0 && !pollSettings.changeVote) {
      Alert.alert('Already Voted', 'You have already voted on this poll and changes are not allowed');
      return;
    }
    
    try {
      let newVotedIds;
      if (pollSettings.multipleChoice) {
        if (votedOptionIds.includes(optionId)) {
          newVotedIds = votedOptionIds.filter(id => id !== optionId);
        } else {
          newVotedIds = [...votedOptionIds, optionId];
        }
      } else {
        newVotedIds = [optionId];
      }
      
      setVotedOptionIds(newVotedIds);
      
      const newVotes = { ...pollVotes };
      votedOptionIds.forEach(id => {
        if (!newVotedIds.includes(id)) {
          newVotes[id] = Math.max(0, (newVotes[id] || 0) - 1);
        }
      });
      newVotedIds.forEach(id => {
        if (!votedOptionIds.includes(id)) {
          newVotes[id] = (newVotes[id] || 0) + 1;
        }
      });
      setPollVotes(newVotes);
      
      const response = await voteOnPollApi(communityId, postId, { 
        optionIds: newVotedIds 
      });
      
      // Handle response with encryption safety
      if (response.data?.data?.poll?.options || response.data?.data?.preview?.pollOptions) {
        const updatedOptions = response.data?.data?.poll?.options || response.data?.data?.preview?.pollOptions;
        
        // Sanitize options before setting state
        const sanitizedOptions = updatedOptions.map(opt => {
          let safeText = extractSafeText(opt.text);
          return {
            ...opt,
            text: safeText,
            _id: opt._id || opt.id,
            votes: opt.votes || opt.voteCount || 0
          };
        });
        
        setPollOptions(sanitizedOptions);
        
        const updatedVotes = {};
        sanitizedOptions.forEach(option => {
          updatedVotes[option._id || option.id] = option.votes || 0;
        });
        setPollVotes(updatedVotes);
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
      Alert.alert('Error', error.response?.data?.message || 'Could not submit vote');
    }
  };

  const handleRSVP = async (status) => {
    if (!isMember) {
      Alert.alert('Join Community', 'You need to be a member to RSVP');
      return;
    }
    
    console.log('RSVP button clicked - Status:', status);
    console.log('Previous RSVP status:', selectedRSVP);
    
    // Toggle if clicking the same status, otherwise set new status
    const newStatus = selectedRSVP === status ? null : status;
    
    try {
      setSelectedRSVP(newStatus);
      
      const response = await rsvpToEventApi(communityId, postId, {
        status: newStatus || 'cancel',
        seats: 1
      });
      
      console.log('RSVP API response:', response.data);
      
      if (response.data?.data?.event?.userRsvp || response.data?.data?.preview?.userRsvp) {
        const rsvpData = response.data?.data?.event?.userRsvp || response.data?.data?.preview?.userRsvp;
        const responseStatus = typeof rsvpData === 'string' ? rsvpData : rsvpData.status;
        setSelectedRSVP(responseStatus === 'cancel' ? null : responseStatus);
        console.log('RSVP status updated to:', responseStatus);
      }
      
      if (newStatus) {
        Alert.alert('Success', `You're ${newStatus === 'going' ? 'attending' : newStatus === 'interested' ? 'interested in' : 'not attending'} this event`);
      } else {
        Alert.alert('Success', 'RSVP cancelled');
      }
    } catch (error) {
      console.error('Error updating RSVP:', error);
      setSelectedRSVP(selectedRSVP);
      Alert.alert('Error', error.response?.data?.message || 'Could not update RSVP');
    }
  };

  const handleBookmark = async () => {
    if (!isMember) {
      Alert.alert('Join Community', 'You need to be a member to bookmark posts');
      return;
    }

    try {
      const newBookmarkState = !bookmarked;
      setBookmarked(newBookmarkState);
      
      await bookmarkCommunityPostApi(communityId, postId);
      
    } catch (error) {
      console.error('Error bookmarking:', error);
      setBookmarked(!bookmarked);
      Alert.alert('Error', 'Could not update bookmark');
    }
  };

  const handleDeletePost = useCallback(async () => {
    if (deleteLoading) {
      return;
    }

    try {
      setDeleteLoading(true);
      await deleteCommunityPostApi(communityId, postId);
      onPostDeleted?.(postId);
      Alert.alert('Post Deleted', 'Your post has been removed successfully.');
    } catch (error) {
      console.error('Error deleting post:', error);
      const message = error?.response?.data?.message || 'Could not delete the post';
      Alert.alert('Error', message);
    } finally {
      setDeleteLoading(false);
    }
  }, [communityId, deleteLoading, onPostDeleted, postId]);

  const confirmDeletePost = useCallback(() => {
    if (deleteLoading) {
      return;
    }

    Alert.alert(
      'Delete Post',
      'Are you sure you want to delete this post? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: handleDeletePost },
      ]
    );
  }, [deleteLoading, handleDeletePost]);

  const handleShare = async () => {
    try {
      setShareCount(prev => prev + 1);
      
      await shareCommunityPostApi(communityId, postId, {
        platform: 'internal',
        message: 'Check out this post!'
      });
      
      Alert.alert('Success', 'Post shared successfully');
    } catch (error) {
      console.error('Error sharing:', error);
      setShareCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleComment = () => {
    Alert.alert(
      'Comments', 
      `This post has ${commentCount} comment${commentCount !== 1 ? 's' : ''}`,
      [{ text: 'OK' }]
    );
  };

  const renderPostContent = () => {
    switch (postType) {
      case 'text':
      case 'link':
        return (
          <>
            {title && <Text style={styles.postTitle}>{extractSafeText(title)}</Text>}
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
        const pollData = poll || preview;
        const pollQuestion = extractSafeText(pollData?.pollQuestion || pollData?.question || title || 'Poll');
        const pollSettings = pollData?.pollSettings || pollData?.settings || {};
        const pollEndsAt = pollData?.pollEndsAt || pollData?.endsAt;
        
        if (isEncrypted && loadingPollDetails) {
          return (
            <View style={styles.pollContainer}>
              <Text style={styles.pollQuestion}>{pollQuestion}</Text>
              <View style={styles.pollLoadingContainer}>
                <ActivityIndicator color={COLORS.blue043142} />
                <Text style={styles.pollLoadingText}>Loading poll options...</Text>
              </View>
            </View>
          );
        }
        
        if (isEncrypted && !isMember) {
          return (
            <View style={styles.pollContainer}>
              <Text style={styles.pollQuestion}>{pollQuestion}</Text>
              <View style={styles.pollLockedContainer}>
                <Icon name="lock-closed" size={nw(24)} color={COLORS.grey999999} />
                <Text style={styles.pollLockedText}>Join the community to participate in this poll</Text>
              </View>
            </View>
          );
        }
        
        const totalVotes = Object.values(pollVotes).reduce((sum, votes) => sum + votes, 0) || 
                          pollData?.totalVotes || 0;
        
        return (
          <View style={styles.pollContainer}>
            <Text style={styles.pollQuestion}>{pollQuestion}</Text>
            {contentText && <Text style={styles.pollDescription}>{contentText}</Text>}
            
            {pollOptions.length > 0 ? (
              <>
                {pollOptions.map((option, index) => {
                  let optionId, optionText, optionVotes;
                  
                  if (typeof option === 'string') {
                    optionId = `option_${index}`;
                    optionText = option;
                    optionVotes = pollVotes[optionId] || 0;
                  } else {
                    optionId = option._id || option.id || `option_${index}`;
                    
                    // Use the safe text extraction function
                    optionText = extractSafeText(option.text || option.option || option.label || '');
                    
                    optionVotes = pollVotes[optionId] || option.votes || option.voteCount || 0;
                  }
                  
                  const votePercentage = totalVotes > 0 
                    ? Math.round((optionVotes / totalVotes) * 100) 
                    : 0;
                  const isVoted = votedOptionIds.includes(optionId);
                  
                  return (
                    <TouchableOpacity
                      key={optionId}
                      style={[styles.pollOption, isVoted && styles.pollOptionVoted]}
                      onPress={() => handlePollVote(optionId)}
                      disabled={(!pollSettings.changeVote && votedOptionIds.length > 0) || !isMember}
                    >
                      <View style={styles.pollOptionContent}>
                        <Text style={[styles.pollOptionText, isVoted && styles.pollOptionTextVoted]}>
                          {optionText}
                        </Text>
                        {(votedOptionIds.length > 0 || pollSettings.showResults === 'always') && (
                          <Text style={[styles.pollVotes, isVoted && styles.pollVotesVoted]}>
                            {votePercentage}%
                          </Text>
                        )}
                      </View>
                      {(votedOptionIds.length > 0 || pollSettings.showResults === 'always') && (
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
                
                {(totalVotes > 0 || pollEndsAt) && (
                  <Text style={styles.pollTotalVotes}>
                    {totalVotes > 0 && `${totalVotes} ${totalVotes === 1 ? 'vote' : 'votes'}`}
                    {totalVotes > 0 && pollEndsAt && ' • '}
                    {pollEndsAt && `Ends ${formatDate(pollEndsAt)}`}
                  </Text>
                )}
              </>
            ) : (
              <View style={styles.pollEmptyContainer}>
                <Text style={styles.pollEmptyText}>Poll options are being loaded...</Text>
              </View>
            )}
          </View>
        );

      case 'event':
        const eventData = event || preview || {};
        const eventTitle = extractSafeText(eventData.eventTitle || eventData.title || eventData.name || title);
        const eventDate = eventData.eventDate || eventData.startDate || eventData.date;
        const eventEndDate = eventData.eventEndDate || eventData.endDate;
        const eventLocation = eventData.eventLocation || eventData.location;
        const eventDescription = extractSafeText(eventData.eventDescription || eventData.description || contentText);
        const eventVenue = extractSafeText(eventData.eventVenue || eventData.venue || eventLocation?.venue);
        
        console.log('Rendering event RSVP buttons - Current selection:', selectedRSVP);
        
        if (!eventTitle && !eventDate && !contentText) {
          return <Text style={styles.postContent}>Event details not available</Text>;
        }
        
        return (
          <View style={styles.eventContainer}>
            <Text style={styles.eventTitle}>{eventTitle}</Text>
            
            {eventDescription && (
              <Text style={styles.eventDescription}>{eventDescription}</Text>
            )}
            
            {eventDate && (
              <View style={styles.eventDetail}>
                <Icon name="calendar-outline" size={nw(16)} color={COLORS.grey666666} />
                <Text style={styles.eventDetailText}>
                  {formatEventDate(eventDate)}
                </Text>
              </View>
            )}
            
            {eventEndDate && (
              <View style={styles.eventDetail}>
                <Icon name="time-outline" size={nw(16)} color={COLORS.grey666666} />
                <Text style={styles.eventDetailText}>
                  Ends: {formatEventDate(eventEndDate)}
                </Text>
              </View>
            )}
            
            {eventVenue && (
              <View style={styles.eventDetail}>
                <Icon name="location-outline" size={nw(16)} color={COLORS.grey666666} />
                <Text style={styles.eventDetailText}>{eventVenue}</Text>
              </View>
            )}
            
            {eventLocation?.type === 'virtual' && (
              <View style={styles.eventDetail}>
                <Icon name="videocam-outline" size={nw(16)} color={COLORS.grey666666} />
                <Text style={styles.eventDetailText}>Online Event</Text>
              </View>
            )}
            
            {/* Enhanced RSVP Section */}
            {isMember && (
              <View style={styles.rsvpContainer}>
                <Text style={styles.rsvpTitle}>RSVP</Text>
                <View style={styles.rsvpButtons}>
                  <TouchableOpacity
                    style={[
                      styles.rsvpButton,
                      selectedRSVP === 'going' && styles.rsvpButtonGoing
                    ]}
                    onPress={() => handleRSVP('going')}
                    disabled={!isMember}
                  >
                    <Icon 
                      name={selectedRSVP === 'going' ? "checkmark-circle" : "checkmark-circle-outline"} 
                      size={nw(20)} 
                      color={selectedRSVP === 'going' ? '#00C853' : COLORS.grey666666}
                    />
                    <Text style={[
                      styles.rsvpButtonText, 
                      selectedRSVP === 'going' && styles.rsvpButtonTextActive
                    ]}>
                      Going
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.rsvpButton,
                      selectedRSVP === 'interested' && styles.rsvpButtonInterested
                    ]}
                    onPress={() => handleRSVP('interested')}
                    disabled={!isMember}
                  >
                    <Icon 
                      name={selectedRSVP === 'interested' ? "star" : "star-outline"} 
                      size={nw(20)} 
                      color={selectedRSVP === 'interested' ? '#FFA000' : COLORS.grey666666}
                    />
                    <Text style={[
                      styles.rsvpButtonText, 
                      selectedRSVP === 'interested' && styles.rsvpButtonTextActive
                    ]}>
                      Interested
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.rsvpButton,
                      selectedRSVP === 'not_going' && styles.rsvpButtonNotGoing
                    ]}
                    onPress={() => handleRSVP('not_going')}
                    disabled={!isMember}
                  >
                    <Icon 
                      name={selectedRSVP === 'not_going' ? "close-circle" : "close-circle-outline"} 
                      size={nw(20)} 
                      color={selectedRSVP === 'not_going' ? '#F44336' : COLORS.grey666666}
                    />
                    <Text style={[
                      styles.rsvpButtonText, 
                      selectedRSVP === 'not_going' && styles.rsvpButtonTextActive
                    ]}>
                      Can't Go
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {eventData.attendees && Array.isArray(eventData.attendees) && (
                  <Text style={styles.rsvpSummary}>
                    {eventData.attendees.filter(a => a.status === 'going').length || 0} going • 
                    {' '}{eventData.attendees.filter(a => a.status === 'interested').length || 0} interested
                  </Text>
                )}
              </View>
            )}
          </View>
        );

      case 'announcement':
        const announcementData = announcement || preview || {};
        const announcementPriority = announcementData.announcementPriority || 
                                     announcementData.priority || 
                                     'normal';
        
        return (
          <View style={styles.announcementContainer}>
            <View style={styles.announcementHeader}>
              <Icon name="megaphone" size={nw(18)} color={COLORS.yellowF5BE00} />
              <Text style={styles.announcementBadge}>
                {announcementPriority.toUpperCase()}
              </Text>
            </View>
            {title && <Text style={styles.announcementTitle}>{extractSafeText(title)}</Text>}
            <Text style={styles.announcementContent}>{contentText}</Text>
          </View>
        );

      default:
        return (
          <>
            {title && <Text style={styles.postTitle}>{extractSafeText(title)}</Text>}
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
        
        {(media?.images?.length > 0 || preview?.images?.length > 0) && (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.mediaContainer}
          >
            {(media?.images || preview?.images || []).map((image, index) => (
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
        <TouchableOpacity 
          style={styles.postAction} 
          onPress={() => handleVote('upvote')}
          disabled={isOwnPost}
        >
          <Icon 
            name={userVote === 'upvote' ? "arrow-up-circle" : "arrow-up-circle-outline"} 
            size={nw(20)} 
            color={isOwnPost ? COLORS.greyC4C4C4 : userVote === 'upvote' ? COLORS.blue043142 : COLORS.grey666666} 
          />
          <Text style={[
            styles.postActionText, 
            userVote === 'upvote' && styles.postActionTextActive,
            isOwnPost && styles.postActionTextDisabled
          ]}>
            {upvoteCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.postAction} 
          onPress={() => handleVote('downvote')}
          disabled={isOwnPost}
        >
          <Icon 
            name={userVote === 'downvote' ? "arrow-down-circle" : "arrow-down-circle-outline"} 
            size={nw(20)} 
            color={isOwnPost ? COLORS.greyC4C4C4 : userVote === 'downvote' ? COLORS.redFF0000 : COLORS.grey666666} 
          />
          <Text style={[
            styles.postActionText, 
            userVote === 'downvote' && styles.postActionTextDownvoted,
            isOwnPost && styles.postActionTextDisabled
          ]}>
            {downvoteCount}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.postAction} onPress={handleComment}>
          <Icon name="chatbubble-outline" size={nw(18)} color={COLORS.grey666666} />
          <Text style={styles.postActionText}>{commentCount}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.postAction} onPress={handleShare}>
          <Icon name="share-outline" size={nw(18)} color={COLORS.grey666666} />
          <Text style={styles.postActionText}>{shareCount}</Text>
        </TouchableOpacity>

        {isOwnPost && (
          <TouchableOpacity
            style={styles.postAction}
            onPress={confirmDeletePost}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <ActivityIndicator size="small" color={COLORS.redFF0000} />
            ) : (
              <Icon name="trash-outline" size={nw(18)} color={COLORS.redFF0000} />
            )}
            <Text style={[styles.postActionText, styles.postActionTextDelete]}>Delete</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.postAction} onPress={handleBookmark}>
          <Icon 
            name={bookmarked ? "bookmark" : "bookmark-outline"} 
            size={nw(18)} 
            color={bookmarked ? COLORS.yellowF5BE00 : COLORS.grey666666} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Simplified Announcement Strip
const AnnouncementStrip = React.memo(({ announcements, onPressAnnouncement }) => {
  const formattedAnnouncements = useMemo(() => {
    const priorityWeight = (value) => {
      const normalized = String(value || '').toLowerCase();
      if (normalized === 'urgent') return 3;
      if (normalized === 'high') return 2;
      if (normalized === 'normal') return 1;
      return 0;
    };

    const mapped = (announcements || []).map((post) => {
      const data = post?.announcement || post?.preview || {};
      const priority = data?.announcementPriority || data?.priority || post?.priority || 'normal';
      const timestamp = post?.publishedAt || post?.createdAt;
      const rawTime = timestamp ? new Date(timestamp).getTime() : 0;
      const timeValue = Number.isNaN(rawTime) ? 0 : rawTime;

      return {
        id: resolvePostId(post),
        title: extractSafeText(
          post?.title ||
          data?.title ||
          data?.headline ||
          data?.announcementTitle
        ),
        content: extractSafeText(
          post?.content?.text ||
          post?.content ||
          data?.content ||
          data?.body
        ),
        timestamp,
        timeValue,
        priority,
        weight: priorityWeight(priority),
        raw: post,
      };
    });

    const sorted = mapped.sort((a, b) => {
      if (b.weight !== a.weight) {
        return b.weight - a.weight;
      }
      return (b.timeValue || 0) - (a.timeValue || 0);
    });

    return sorted.map(({ weight, timeValue, ...rest }) => rest);
  }, [announcements]);

  if (!formattedAnnouncements.length) {
    return null;
  }

  // Get the most recent/highest priority announcement
  const topAnnouncement = formattedAnnouncements[0];
  const priority = topAnnouncement.priority?.toLowerCase();

  return (
    <TouchableOpacity 
      style={[
        styles.announcementStrip,
        priority === 'urgent' && styles.announcementStripUrgent,
        priority === 'high' && styles.announcementStripHigh,
      ]}
      onPress={() => onPressAnnouncement(topAnnouncement)}
      activeOpacity={0.8}
    >
      <View style={styles.announcementStripContent}>
        <View style={styles.announcementStripLeft}>
          <Icon 
            name="megaphone" 
            size={nw(16)} 
            color={priority === 'high' ? COLORS.grey222222 : COLORS.whiteFFFFFF} 
          />
          <Text 
            style={[
              styles.announcementStripText,
              priority === 'high' && styles.announcementStripTextDark
            ]} 
            numberOfLines={1}
          >
            {topAnnouncement.title || 'Announcement'}
          </Text>
        </View>
        <Icon 
          name="chevron-forward" 
          size={nw(16)} 
          color={priority === 'high' ? COLORS.grey222222 : COLORS.whiteFFFFFF}
        />
      </View>
    </TouchableOpacity>
  );
});

// Join Modal Component
const JoinModal = ({ visible, community, onClose, onJoinSuccess }) => {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const handleJoin = async () => {
    setBusy(true);
    try {
      const response = await joinCommunityApi(community?.id || community?._id, { 
        joinReason: reason 
      });
      
      console.log('Join community response:', response?.data);
      
      if (response?.data?.success) {
        const data = response.data.data;
        
        if (data?.membership?.status === 'active') {
          // Direct join successful
          Alert.alert(
            'Success!', 
            `You've successfully joined ${community?.name}!`,
            [{ text: 'OK', onPress: onJoinSuccess }]
          );
        } else if (data?.status === 'pending') {
          // Join request submitted
          Alert.alert(
            'Request Submitted', 
            `Your join request for ${community?.name} has been submitted. You'll be notified when it's reviewed.`,
            [{ text: 'OK', onPress: onJoinSuccess }]
          );
        } else {
          // Generic success
          Alert.alert('Success', 'Your request has been processed successfully.');
          onJoinSuccess?.();
        }
      } else {
        throw new Error(response?.data?.message || 'Join request failed');
      }
    } catch (err) {
      console.error('Error joining community:', err);
      
      // Handle specific error cases
      let errorMessage = 'Could not process join request.';
      
      if (err?.response?.status === 400) {
        if (err?.response?.data?.message?.includes('already a member')) {
          errorMessage = 'You are already a member of this community.';
        } else if (err?.response?.data?.message?.includes('pending join request')) {
          errorMessage = 'You already have a pending join request for this community.';
        } else {
          errorMessage = err?.response?.data?.message || errorMessage;
        }
      } else if (err?.response?.status === 403) {
        if (err?.response?.data?.message?.includes('private community')) {
          errorMessage = 'This is a private community. You need an invitation to join.';
        } else if (err?.response?.data?.message?.includes('banned')) {
          errorMessage = 'You are banned from this community.';
        } else {
          errorMessage = err?.response?.data?.message || errorMessage;
        }
      } else if (err?.response?.status === 404) {
        errorMessage = 'Community not found or inactive.';
      } else {
        errorMessage = err?.response?.data?.message || errorMessage;
      }
      
      Alert.alert('Error', errorMessage);
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
              ? 'This is a private community. You need an invitation to join.'
              : community?.privacy === 'protected' || community?.joinMethod === 'approval_required'
              ? 'This community requires approval. Tell the admins why you want to join.'
              : 'Welcome! You can join this community right away.'}
          </Text>
          
          {(community?.privacy === 'private' || 
            community?.privacy === 'protected' || 
            community?.joinMethod === 'approval_required') && (
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
                  {community?.privacy === 'private' 
                    ? 'Request Invitation' 
                    : community?.privacy === 'protected' || community?.joinMethod === 'approval_required'
                    ? 'Request to Join'
                    : 'Join'}
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
  const rawUserData = useSelector((state) => state?.userData);

  // Validate communityId
  if (!communityId) {
    console.error('No community ID provided to CommunityDetail');
    Alert.alert('Error', 'Invalid community link', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
    return null;
  }

  // Validate MongoDB ObjectId format (24 hex characters)
  if (!/^[0-9a-fA-F]{24}$/.test(communityId)) {
    console.error('Invalid community ID format:', communityId);
    Alert.alert('Error', 'Invalid community link', [
      { text: 'OK', onPress: () => navigation.goBack() }
    ]);
    return null;
  }

  const parsedUserData = useMemo(() => {
    if (!rawUserData) {
      return null;
    }

    if (typeof rawUserData === 'string') {
      try {
        return JSON.parse(rawUserData);
      } catch (error) {
        console.warn('Failed to parse user data from store:', error);
        return null;
      }
    }

    return rawUserData;
  }, [rawUserData]);

  const currentUserId = useMemo(() => {
    if (!parsedUserData) {
      return null;
    }

    const candidateSources = [
      parsedUserData,
      parsedUserData?.user,
      parsedUserData?.user?.user,
      parsedUserData?.data,
      parsedUserData?.data?.user,
      parsedUserData?.profile,
      parsedUserData?.userProfile,
      parsedUserData?.userProfileInfo,
      parsedUserData?.account,
      parsedUserData?.details,
      parsedUserData?.metadata?.user,
    ];

    for (const candidate of candidateSources) {
      const normalized = normalizeIdentifier(candidate);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }, [parsedUserData]);

  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
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
  const [selectedContentTypes, setSelectedContentTypes] = useState([]);

  const isInitialMount = useRef(true);
  const fetchingPosts = useRef(false);
  const fetchingMembers = useRef(false);
  const detailCacheRef = useRef(new Map());
  const imagePrefetchCacheRef = useRef(new Set());
  const lastLoadMoreCall = useRef(0);

  const scrollY = useSharedValue(0);

  const applyCacheToState = useCallback((cache) => {
    if (!cache) {
      return;
    }

    setCommunity(cache.community ?? null);
    setPosts(cache.posts ?? []);
    setAnnouncements(cache.announcements ?? []);
    setMembers(cache.members ?? []);
    setMembersLoaded(Boolean(cache.membersLoaded));
    setIsMember(Boolean(cache.isMember));
    setIsAdmin(Boolean(cache.isAdmin));
    setMembershipStatus(cache.membershipStatus ?? null);
    setFeedPage(cache.feedPage ?? 1);
    setHasMoreFeed(cache.hasMoreFeed ?? true);
    setHasError(false);
  }, []);

  const updateCache = useCallback(
    (updates, {touchTimestamp = false} = {}) => {
      if (!communityId) {
        return;
      }

      const existing = detailCacheRef.current.get(communityId) || {};
      const nextCache = {
        ...existing,
        ...updates,
      };

      if (touchTimestamp) {
        nextCache.timestamp = Date.now();
      }

      detailCacheRef.current.set(communityId, nextCache);
    },
    [communityId],
  );

  const handleTypeToggle = useCallback((type) => {
    if (type === 'all') {
      setSelectedContentTypes([]);
    } else {
      setSelectedContentTypes(prev => {
        if (prev.includes(type)) {
          return prev.filter(t => t !== type);
        }
        return [...prev, type];
      });
    }
  }, []);

  const filteredPosts = useMemo(() => {
    if (selectedContentTypes.length === 0) {
      return posts;
    }
    return posts.filter(post => {
      const postType = post?.postType || post?.type || 'text';
      return selectedContentTypes.includes(postType);
    });
  }, [posts, selectedContentTypes]);

  const handlePostDeleted = useCallback((deletedPostId) => {
    if (!deletedPostId) {
      return;
    }

    setPosts((prevPosts) => prevPosts.filter((item) => {
      const itemId = resolvePostId(item) || item?.id || item?._id;
      return itemId !== deletedPostId;
    }));
    setAnnouncements((prevAnnouncements) => prevAnnouncements.filter((item) => {
      const itemId = resolvePostId(item) || item?.id || item?._id;
      return itemId !== deletedPostId;
    }));
    setSelectedAnnouncement((prev) => {
      if (!prev) {
        return prev;
      }
      const itemId = resolvePostId(prev.raw) || prev.id;
      return itemId === deletedPostId ? null : prev;
    });
    if (resolvePostId(selectedAnnouncement?.raw) === deletedPostId) {
      setAnnouncementModalVisible(false);
    }
  }, [selectedAnnouncement?.raw]);

  const handleOpenAnnouncement = useCallback((announcementItem) => {
    if (!announcementItem) {
      return;
    }
    setSelectedAnnouncement(announcementItem);
    setAnnouncementModalVisible(true);
  }, []);

  const handleCloseAnnouncement = useCallback(() => {
    setAnnouncementModalVisible(false);
    setSelectedAnnouncement(null);
  }, []);

  const announcementModalTitle = useMemo(() => {
    if (!selectedAnnouncement) {
      return 'Announcement';
    }
    if (selectedAnnouncement.title) {
      return selectedAnnouncement.title;
    }
    const raw = selectedAnnouncement.raw;
    const data = raw?.announcement || raw?.preview || {};
    return (
      extractSafeText(
        raw?.title ||
        data?.title ||
        data?.headline ||
        data?.announcementTitle
      ) || 'Announcement'
    );
  }, [selectedAnnouncement]);

  const announcementModalContent = useMemo(() => {
    if (!selectedAnnouncement) {
      return '';
    }
    if (selectedAnnouncement.content) {
      return selectedAnnouncement.content;
    }
    const raw = selectedAnnouncement.raw;
    const data = raw?.announcement || raw?.preview || {};
    return extractSafeText(
      raw?.content?.text ||
      raw?.content ||
      data?.content ||
      data?.body
    );
  }, [selectedAnnouncement]);

  const announcementModalTimestamp = useMemo(() => {
    if (!selectedAnnouncement) {
      return null;
    }
    return (
      selectedAnnouncement.timestamp ||
      selectedAnnouncement?.raw?.publishedAt ||
      selectedAnnouncement?.raw?.createdAt ||
      null
    );
  }, [selectedAnnouncement]);

  const announcementModalPriority = useMemo(() => {
    if (!selectedAnnouncement) {
      return null;
    }
    if (!selectedAnnouncement?.priority) {
      const rawPriority = selectedAnnouncement?.raw?.announcement?.announcementPriority ||
        selectedAnnouncement?.raw?.announcement?.priority ||
        selectedAnnouncement?.raw?.preview?.priority;
      if (!rawPriority) {
        return null;
      }
      const value = String(rawPriority).toLowerCase();
      return {
        value,
        label: value === 'urgent' ? 'Urgent' : value === 'high' ? 'High Priority' : 'Announcement',
      };
    }
    const value = String(selectedAnnouncement.priority).toLowerCase();
    return {
      value,
      label: value === 'urgent' ? 'Urgent' : value === 'high' ? 'High Priority' : 'Announcement',
    };
  }, [selectedAnnouncement]);

  // FIXED: Removed feedLoading, hasMoreFeed, and posts.length from dependency array
  const fetchPosts = useCallback(async (page = 1, isRefresh = false) => {
    if (fetchingPosts.current || (!isRefresh && (feedLoading || !hasMoreFeed))) {
      return;
    }

    const cache = detailCacheRef.current.get(communityId);
    const now = Date.now();
    const hasValidCache =
      !isRefresh &&
      cache?.feedTimestamp &&
      now - cache.feedTimestamp < CACHE_TTL_MS;

    if (hasValidCache) {
      setPosts(cache.posts ?? []);
      setAnnouncements(cache.announcements ?? []);
      setHasMoreFeed(cache.hasMoreFeed ?? true);
      setFeedPage(cache.feedPage ?? page);
    }

    fetchingPosts.current = true;
    if (isRefresh) {
      setFeedLoading(true);
    } else {
      setFeedLoading(!hasValidCache);
    }

    try {
      console.log('Fetching posts for community:', communityId, 'page:', page);
      const response = await getCommunityFeedApi(communityId, {
        page,
        limit: FEED_PAGE_SIZE,
      });

      console.log('Feed API raw response:', response?.data);

      const feedData = response?.data?.data || response?.data || {};
      const newPosts = feedData.posts || feedData.feed || feedData.content || [];
      const announcementPosts = newPosts.filter(
        item => (item?.postType || item?.type) === 'announcement',
      );
      const regularPosts = newPosts.filter(
        item => (item?.postType || item?.type) !== 'announcement',
      );
      const pagination = feedData.pagination || {};

      console.log('Parsed feed data:', {
        postsCount: newPosts.length,
        pagination,
        hasMoreFromPagination: pagination.hasNext,
        hasMoreFromLength: newPosts.length >= FEED_PAGE_SIZE,
        firstPost: newPosts[0],
      });

      const mergeUniqueById = (base, additions) => {
        const combined = [...base, ...additions];
        const seen = new Set();
        return combined.filter(item => {
          const id = resolvePostId(item) || JSON.stringify(item);
          if (seen.has(id)) {
            return false;
          }
          seen.add(id);
          return true;
        });
      };

      let updatedPosts = [];
      let updatedAnnouncements = [];

      setPosts(prev => {
        const base = isRefresh ? [] : prev;
        updatedPosts = mergeUniqueById(base, regularPosts);
        return updatedPosts;
      });

      setAnnouncements(prev => {
        const base = isRefresh ? [] : prev;
        updatedAnnouncements = mergeUniqueById(base, announcementPosts);
        return updatedAnnouncements;
      });

      // Fix pagination logic - only set hasMore to true if we actually got a full page
      const nextHasMore = pagination.hasNext || (newPosts.length >= FEED_PAGE_SIZE);
      const nextFeedPage = nextHasMore ? page + 1 : page;

      console.log('Pagination decision:', {
        nextHasMore,
        nextFeedPage,
        currentPage: page,
        postsReceived: newPosts.length,
        pageSize: FEED_PAGE_SIZE
      });

      setHasMoreFeed(nextHasMore);
      setFeedPage(nextFeedPage);

      updateCache(
        {
          posts: updatedPosts,
          announcements: updatedAnnouncements,
          hasMoreFeed: nextHasMore,
          feedPage: nextFeedPage,
          feedTimestamp: Date.now(),
        },
      );
    } catch (error) {
      console.error('Error fetching posts:', error);
      
      // FIXED: Always set hasMoreFeed to false on error
      setHasMoreFeed(false);
      
      if (!hasValidCache) {
        if (isRefresh) {
          setPosts([]);
          setAnnouncements([]);
        } else if (posts.length === 0) {
          setPosts([]);
        }
        
        // Handle 404 error specifically for posts
        if (error.response?.status === 404) {
          console.log('Community not found when fetching posts - this is expected if community was deleted');
        }
      }
    } finally {
      setFeedLoading(false);
      fetchingPosts.current = false;
    }
  }, [communityId, updateCache]); // FIXED: Only stable dependencies

  const fetchMembers = useCallback(async () => {
    if (fetchingMembers.current) {
      return;
    }

    const cache = detailCacheRef.current.get(communityId);
    const now = Date.now();
    const cachedMembers = Array.isArray(cache?.members) ? cache.members : [];
    const cacheTimestamp = cache?.membersTimestamp || 0;
    const hasFreshCache = cachedMembers.length > 0 && now - cacheTimestamp < CACHE_TTL_MS;

    if (hasFreshCache) {
      setMembers(cachedMembers);
      setMembersLoaded(Boolean(cache.membersLoaded));
      return;
    }

    if (cachedMembers.length && !membersLoaded) {
      setMembers(cachedMembers);
      setMembersLoaded(Boolean(cache.membersLoaded));
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
      const normalizedMembers = Array.isArray(membersData) ? membersData : [];
      setMembers(normalizedMembers);
      setMembersLoaded(true);
      updateCache(
        {
          members: normalizedMembers,
          membersLoaded: true,
          membersTimestamp: Date.now(),
        },
      );
    } catch (error) {
      console.error('Error fetching members:', error);
      if (!cachedMembers.length) {
        setMembers([]);
      }
    } finally {
      setMembersLoading(false);
      fetchingMembers.current = false;
    }
  }, [communityId, membersLoaded, updateCache]);

  const fetchInitialData = useCallback(
    async (isRefresh = false) => {
      const cache = detailCacheRef.current.get(communityId);
      const now = Date.now();
      const hasValidCache =
        !isRefresh &&
        cache?.timestamp &&
        now - cache.timestamp < CACHE_TTL_MS &&
        (cache.community || cache.posts?.length || cache.announcements?.length);

      if (hasValidCache) {
        applyCacheToState(cache);
      }

      if (!isRefresh) {
        setLoading(!hasValidCache);
      }
      if (isRefresh) {
        setRefreshing(true);
      }

      try {
        console.log('Fetching community details for:', communityId);
        const response = await getCommunityDetailsApi(communityId);
        console.log('Community details API response:', response?.data);

        const data = response?.data?.data || response?.data || {};

        if (!data.community && !data.name) {
          if (!hasValidCache) {
            setHasError(true);
            Alert.alert('Error', 'Community not found');
            navigation.goBack();
          }
          return;
        }

        const communityData = data.community || data;
        setCommunity(communityData);
        setHasError(false);

        const membership = data.userMembership || data.membership;
        const userRole = membership?.role;

        console.log('User membership data:', {
          membership,
          userRole,
          userId: currentUserId,
        });

        const isUserAdmin = userRole && ['owner', 'admin', 'moderator'].includes(userRole.toLowerCase());
        const isUserMember = isUserAdmin || (membership && membership.status === 'active');
        const membershipStatusValue = membership?.status || null;

        console.log('User status:', {
          isAdmin: isUserAdmin,
          isMember: isUserMember,
          membershipStatus: membershipStatusValue,
          userRole,
          membership,
        });

        const nextMembershipStatus = membershipStatusValue;

        setIsAdmin(isUserAdmin);
        setIsMember(isUserMember);
        setMembershipStatus(nextMembershipStatus);

        updateCache(
          {
            community: communityData,
            isAdmin: isUserAdmin,
            isMember: isUserMember,
            membershipStatus: nextMembershipStatus,
          },
          {touchTimestamp: true},
        );

        if (communityData?.privacy === 'public' || isUserMember) {
          await fetchPosts(1, true);
        } else {
          console.log('Not fetching posts - private community and not a member');
          setPosts([]);
          setAnnouncements([]);
          setHasMoreFeed(false);
          updateCache(
            {
              posts: [],
              announcements: [],
              hasMoreFeed: false,
              feedPage: 1,
              feedTimestamp: Date.now(),
            },
          );
        }

        if (isUserMember) {
          fetchMembers();
        }
      } catch (error) {
        console.error('Error fetching community:', error);
        if (!hasValidCache) {
          setHasError(true);
          if (!isRefresh) {
            // Handle specific error cases
            if (error.response?.status === 404) {
              Alert.alert('Community Not Found', 'This community does not exist or has been removed.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } else {
              Alert.alert('Error', 'Could not load community details');
            }
          }
        }
      } finally {
        if (!isRefresh) {
          setLoading(false);
        }
        setRefreshing(false);
      }
    },
    [
      applyCacheToState,
      communityId,
      currentUserId,
      fetchMembers,
      fetchPosts,
      navigation,
      updateCache,
    ],
  );

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      console.log('Initial mount - fetching data for community:', communityId);
    } else {
      console.log('Community changed - reloading data for:', communityId);
    }
    fetchInitialData();
  }, [communityId, fetchInitialData]);

  const onRefresh = useCallback(() => {
    console.log('Refreshing community data');
    setRefreshing(true);
    setMembersLoaded(false);
    fetchInitialData(true);
  }, [fetchInitialData]);

  const onTabChange = useCallback((tab) => {
    console.log('Tab changed to:', tab);
    setActiveTab(tab);
    if (tab === 'Members' && !membersLoaded && !membersLoading) {
      fetchMembers();
    }
  }, [membersLoaded, membersLoading, fetchMembers]);

  const navigateToCommunityManagement = useCallback(() => {
    console.log('Navigating to Community Management');
    navigation.navigate(Routes.CommunityManagement, { 
      communityId,
      communityName: community?.name 
    });
  }, [navigation, communityId, community?.name]);

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

  const renderPost = useCallback(({ item }) => (
    <PostCard 
      post={item} 
      communityId={communityId}
      navigation={navigation}
      isMember={isMember}
      currentUserId={currentUserId}
      onPostDeleted={handlePostDeleted}
    />
  ), [communityId, navigation, isMember, currentUserId, handlePostDeleted]);

  const keyExtractor = useCallback(
    (item, index) => resolvePostId(item) || item?.id || item?._id || `post-${index}`,
    [],
  );

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
              membershipStatus === 'pending' && styles.joinButtonPending,
              membershipStatus === 'banned' && styles.joinButtonBanned
            ]} 
            onPress={() => {
              if (membershipStatus === 'banned') {
                Alert.alert('Access Denied', 'You are banned from this community.');
                return;
              }
              setJoinModalVisible(true);
            }}
            disabled={membershipStatus === 'pending' || membershipStatus === 'banned'}
          >
            <Icon 
              name={
                membershipStatus === 'pending' ? "time-outline" : 
                membershipStatus === 'banned' ? "ban-outline" :
                "add-circle-outline"
              } 
              size={nw(20)} 
              color={COLORS.whiteFFFFFF} 
            />
            <Text style={styles.joinButtonText}>
              {membershipStatus === 'pending' ? 'Request Pending' : 
               membershipStatus === 'banned' ? 'Access Denied' :
               'Join Community'}
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

      {activeTab === 'Feed' && (
        <>
          {announcements.length > 0 && (
            <AnnouncementStrip
              announcements={announcements}
              onPressAnnouncement={handleOpenAnnouncement}
            />
          )}
          <ContentTypeFilter
            selectedTypes={selectedContentTypes}
            onTypeToggle={handleTypeToggle}
          />
        </>
      )}
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
    announcements,
    handleOpenAnnouncement,
    onTabChange,
    navigateToCommunityManagement,
    selectedContentTypes,
    handleTypeToggle,
  ]);

  const ListFooterComponent = useMemo(() => (
    <View style={styles.footerContainer}>
      {activeTab === 'Feed' && (
        <>
          {feedLoading && filteredPosts.length > 0 && (
            <ActivityIndicator 
              style={styles.loadingMore} 
              color={COLORS.blue043142} 
            />
          )}
          {!feedLoading && filteredPosts.length === 0 && (
            <View style={styles.emptyState}>
              <Icon name="newspaper-outline" size={nw(48)} color={COLORS.greyC4C4C4} />
              <Text style={styles.emptyTitle}>
                {selectedContentTypes.length > 0 ? 'No matching content' : 'No posts yet'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {selectedContentTypes.length > 0 
                  ? 'Try selecting different content types'
                  : isMember 
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
          <View style={styles.aboutHeroCard}>
            <Text style={styles.aboutHeroTitle}>
              Why join {community?.name || 'this community'}?
            </Text>
            <Text style={styles.aboutHeroSubtitle}>
              {community?.tagline || community?.description || 'Discover peers, resources, and conversations curated for members who care about the same topics you do.'}
            </Text>
            {!isMember && (
              <TouchableOpacity
                style={[
                  styles.aboutJoinButton, 
                  membershipStatus === 'pending' && styles.aboutJoinButtonPending,
                  membershipStatus === 'banned' && styles.aboutJoinButtonBanned
                ]}
                onPress={() => {
                  if (membershipStatus === 'banned') {
                    Alert.alert('Access Denied', 'You are banned from this community.');
                    return;
                  }
                  setJoinModalVisible(true);
                }}
                disabled={membershipStatus === 'pending' || membershipStatus === 'banned'}
              >
                <Icon
                  name={
                    membershipStatus === 'pending' ? 'time-outline' : 
                    membershipStatus === 'banned' ? 'ban-outline' :
                    'enter-outline'
                  }
                  size={nw(16)}
                  color={COLORS.whiteFFFFFF}
                />
                <Text style={styles.aboutJoinButtonText}>
                  {membershipStatus === 'pending' ? 'Request Pending' : 
                   membershipStatus === 'banned' ? 'Access Denied' :
                   'Request to Join'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.aboutFactsCard}>
            {[
              {
                icon: 'people-outline',
                label: 'Members',
                value: formatNumber(community?.stats?.memberCount || community?.memberCount),
              },
              {
                icon: 'chatbubbles-outline',
                label: 'Posts',
                value: formatNumber(community?.stats?.postCount || community?.postCount),
              },
              {
                icon: community?.privacy === 'public' ? 'globe-outline' : 'lock-closed-outline',
                label: 'Privacy',
                value: community?.privacy ? community?.privacy.charAt(0).toUpperCase() + community?.privacy.slice(1) : '—',
              },
              {
                icon: 'log-in-outline',
                label: 'Join Method',
                value: (() => {
                  const joinMethod = community?.joinMethod || community?.privacySettings?.joinMethod;
                  if (!joinMethod) return 'Approval required';
                  const normalized = joinMethod.toLowerCase();
                  if (normalized.includes('instant')) return 'Instant access';
                  if (normalized.includes('invite')) return 'Invite only';
                  if (normalized.includes('approval')) return 'Approval required';
                  return joinMethod;
                })(),
              },
            ].map((fact, index) => (
              <View key={index} style={styles.aboutFactRow}>
                <View style={styles.aboutFactIcon}>
                  <Icon name={fact.icon} size={nw(16)} color={COLORS.blue043142} />
                </View>
                <View style={styles.aboutFactTextBlock}>
                  <Text style={styles.aboutFactLabel}>{fact.label}</Text>
                  <Text style={styles.aboutFactValue}>{fact.value || '—'}</Text>
                </View>
              </View>
            ))}
          </View>

          {Array.isArray(community?.tags) && community.tags.length > 0 && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Topics you'll find here</Text>
              <View style={styles.aboutTagList}>
                {community.tags.slice(0, 8).map((tag, index) => (
                  <View key={index} style={styles.aboutTagChip}>
                    <Text style={styles.aboutTagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {community?.guidelines?.content && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>What to expect</Text>
              <Text style={styles.aboutText} numberOfLines={6}>
                {extractSafeText(community.guidelines.content)}
              </Text>
            </View>
          )}

          {community?.createdAt && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>Community since</Text>
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
  ), [activeTab, feedLoading, filteredPosts.length, isMember, community, members, membersLoading, selectedContentTypes]);

  // FIXED: Removed posts.length from dependency array
  const handleLoadMore = useCallback(() => {
    const now = Date.now();
    const timeSinceLastCall = now - lastLoadMoreCall.current;
    
    console.log('handleLoadMore called:', {
      activeTab,
      hasMoreFeed,
      feedLoading,
      fetchingPosts: fetchingPosts.current,
      feedPage,
      postsCount: posts.length,
      timeSinceLastCall
    });
    
    // Debounce rapid calls (minimum 1 second between calls)
    if (timeSinceLastCall < 1000) {
      console.log('Skipping load more - too soon since last call');
      return;
    }
    
    if (activeTab === 'Feed' && hasMoreFeed && !feedLoading && !fetchingPosts.current) {
      console.log('Loading more posts, page:', feedPage);
      lastLoadMoreCall.current = now;
      fetchPosts(feedPage);
    } else {
      console.log('Skipping load more due to conditions not met');
    }
  }, [activeTab, hasMoreFeed, feedLoading, feedPage, fetchPosts]); // FIXED: Removed posts.length

  useEffect(() => {
    const coverUri = community?.coverImage?.url || community?.coverImage;
    if (coverUri && !imagePrefetchCacheRef.current.has(coverUri)) {
      imagePrefetchCacheRef.current.add(coverUri);
      Image.prefetch(coverUri).catch(() => {});
    }
  }, [community]);

  useEffect(() => {
    if (activeTab !== 'Feed' || !filteredPosts.length) {
      return;
    }

    const cache = imagePrefetchCacheRef.current;

    filteredPosts
      .slice(0, PREFETCH_LIMIT)
      .forEach(post => {
        const mediaCandidates = [];

        if (Array.isArray(post?.media) && post.media.length > 0) {
          const firstMedia = post.media[0];
          mediaCandidates.push(firstMedia?.url || firstMedia?.uri || firstMedia);
        } else if (post?.media?.url) {
          mediaCandidates.push(post.media.url);
        }

        if (post?.preview?.coverImage) {
          mediaCandidates.push(post.preview.coverImage?.url || post.preview.coverImage);
        }

        if (post?.preview?.image) {
          mediaCandidates.push(post.preview.image?.url || post.preview.image);
        }

        const uri = mediaCandidates.find(candidate => typeof candidate === 'string' && candidate.startsWith('http'));
        if (uri && !cache.has(uri)) {
          cache.add(uri);
          Image.prefetch(uri).catch(() => {});
        }
      });
  }, [activeTab, filteredPosts]);

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
        data={activeTab === 'Feed' ? filteredPosts : []}
        renderItem={renderPost}
        keyExtractor={keyExtractor}
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
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={10}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews
        keyboardShouldPersistTaps="handled"
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

      <Modal
        visible={announcementModalVisible && !!selectedAnnouncement}
        transparent
        animationType="fade"
        onRequestClose={handleCloseAnnouncement}
      >
        <View style={styles.announcementModalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseAnnouncement} />
          <View style={styles.announcementModalContent}>
            <View style={styles.announcementModalHeader}>
              <Text style={styles.announcementModalTitle} numberOfLines={2}>
                {announcementModalTitle}
              </Text>
              <TouchableOpacity
                style={styles.announcementModalCloseButton}
                onPress={handleCloseAnnouncement}
              >
                <Icon name="close" size={nw(18)} color={COLORS.grey666666} />
              </TouchableOpacity>
            </View>
            {announcementModalPriority ? (
              <View style={[
                styles.announcementModalPriorityChip,
                announcementModalPriority.value === 'urgent' && styles.announcementModalPriorityChipUrgent,
                announcementModalPriority.value === 'high' && styles.announcementModalPriorityChipHigh,
              ]}>
                <Icon
                  name="alert-circle-outline"
                  size={nw(13)}
                  color={announcementModalPriority.value === 'high' ? COLORS.grey222222 : COLORS.whiteFFFFFF}
                />
                <Text
                  style={[
                    styles.announcementModalPriorityText,
                    announcementModalPriority.value === 'high' && styles.announcementModalPriorityTextDark,
                  ]}
                >
                  {announcementModalPriority.label}
                </Text>
              </View>
            ) : null}
            {announcementModalTimestamp ? (
              <View style={styles.announcementModalTimeRow}>
                <Icon name="time-outline" size={nw(14)} color={COLORS.grey666666} />
                <Text style={styles.announcementModalTimeText}>
                  {formatDate(announcementModalTimestamp)}
                </Text>
              </View>
            ) : null}
            <ScrollView
              style={styles.announcementModalBody}
              contentContainerStyle={styles.announcementModalBodyContent}
            >
              <Text style={styles.announcementModalBodyText}>
                {announcementModalContent || 'No additional details available.'}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <JoinModal
        visible={joinModalVisible}
        community={community}
        onClose={() => setJoinModalVisible(false)}
        onJoinSuccess={() => {
          setJoinModalVisible(false);
          setMembersLoaded(false);
          // Update membership status immediately
          setIsMember(true);
          setMembershipStatus('active');
          // Refresh all data
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
    fontSize: nw(24),
    fontWeight: '700',
    color: COLORS.whiteFFFFFF,
    marginBottom: nh(6),
  },
  communityStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
    marginBottom: nh(6),
  },
  communityStat: {
    fontSize: nw(13),
    color: COLORS.whiteFFFFFF,
    opacity: 0.9,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: nw(8),
    paddingVertical: nh(3),
    borderRadius: nw(12),
    alignSelf: 'flex-start',
  },
  privacyText: {
    fontSize: nw(11),
    color: COLORS.whiteFFFFFF,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    backgroundColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: nw(10),
    paddingVertical: nh(6),
    borderRadius: nw(14),
    alignSelf: 'flex-start',
    marginTop: nh(10),
  },
  manageButtonText: {
    fontSize: nw(12),
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
    color: COLORS.blue043142, // Already using primary blue - should be visible
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
  joinButtonBanned: {
    backgroundColor: COLORS.redFF0000,
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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
  
  // Filter Styles
  filterContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingVertical: nh(10),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  filterContent: {
    paddingHorizontal: nw(16),
    gap: nw(8),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    paddingHorizontal: nw(14),
    paddingVertical: nh(8),
    borderRadius: nw(16),
    backgroundColor: COLORS.greyF0F0F0,
    borderWidth: 1,
    borderColor: COLORS.greyE0E0E0,
  },
  filterChipActive: {
    backgroundColor: COLORS.blue043142,
    borderColor: COLORS.blue043142,
  },
  filterChipText: {
    fontSize: nw(13),
    fontWeight: '500',
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
  },
  filterChipTextActive: {
    color: COLORS.whiteFFFFFF,
  },
  
  // Announcement Strip
  announcementStrip: {
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.blue043142 + '40',
  },
  announcementStripHigh: {
    backgroundColor: COLORS.yellowF5BE00,
  },
  announcementStripUrgent: {
    backgroundColor: COLORS.redFF0000,
  },
  announcementStripContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  announcementStripLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
    flex: 1,
  },
  announcementStripText: {
    fontSize: nw(14),
    fontWeight: '600',
    color: COLORS.whiteFFFFFF,
    flex: 1,
  },
  announcementStripTextDark: {
    color: COLORS.grey222222,
  },
  
  announcementModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(20),
  },
  announcementModalContent: {
    width: '100%',
    maxWidth: nw(340),
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(18),
    padding: nw(18),
  },
  announcementModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: nw(12),
    marginBottom: nh(10),
  },
  announcementModalTitle: {
    flex: 1,
    fontSize: nw(18),
    fontWeight: '700',
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
  },
  announcementModalCloseButton: {
    padding: nw(4),
  },
  announcementModalPriorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    alignSelf: 'flex-start',
    paddingHorizontal: nw(10),
    paddingVertical: nh(4),
    borderRadius: nw(12),
    backgroundColor: COLORS.blue043142,
    marginBottom: nh(10),
  },
  announcementModalPriorityChipHigh: {
    backgroundColor: COLORS.yellowF5BE00,
  },
  announcementModalPriorityChipUrgent: {
    backgroundColor: COLORS.redFF0000,
  },
  announcementModalPriorityText: {
    fontSize: nw(11),
    fontWeight: '700',
    color: COLORS.whiteFFFFFF,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  announcementModalPriorityTextDark: {
    color: COLORS.grey222222,
  },
  announcementModalTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    marginBottom: nh(12),
  },
  announcementModalTimeText: {
    fontSize: nw(12),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
  },
  announcementModalBody: {
    maxHeight: nh(240),
  },
  announcementModalBodyContent: {
    paddingBottom: nh(4),
  },
  announcementModalBodyText: {
    fontSize: nw(13),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    lineHeight: nh(20),
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
  },
  postTime: {
    fontSize: nw(12),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginTop: nh(2),
  },
  postBody: {
    paddingHorizontal: nw(12),
    paddingBottom: nw(12),
  },
  postTitle: {
    fontSize: nw(16),
    fontWeight: '600',
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginBottom: nh(8),
  },
  postContent: {
    fontSize: nw(14),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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
    justifyContent: 'space-between',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
    paddingHorizontal: nw(8),
  },
  postActionText: {
    fontSize: nw(12),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    fontWeight: '500',
  },
  postActionTextDelete: {
    color: COLORS.redFF0000,
    fontWeight: '600',
  },
  postActionTextActive: {
    color: COLORS.blue043142,
  },
  postActionTextDownvoted: {
    color: COLORS.redFF0000,
  },
  postActionTextDisabled: {
    color: COLORS.greyC4C4C4,
  },
  
  // Poll Styles
  pollContainer: {
    marginTop: nh(8),
  },
  pollQuestion: {
    fontSize: nw(15),
    fontWeight: '600',
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginBottom: nh(12),
  },
  pollDescription: {
    fontSize: nw(13),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginTop: nh(8),
    textAlign: 'center',
  },
  pollLoadingContainer: {
    alignItems: 'center',
    paddingVertical: nh(20),
  },
  pollLoadingText: {
    fontSize: nw(13),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginTop: nh(8),
  },
  pollLockedContainer: {
    alignItems: 'center',
    paddingVertical: nh(30),
    backgroundColor: COLORS.greyF0F0F0,
    borderRadius: nw(10),
  },
  pollLockedText: {
    fontSize: nw(13),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginTop: nh(8),
    textAlign: 'center',
  },
  pollEmptyContainer: {
    alignItems: 'center',
    paddingVertical: nh(20),
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: nw(10),
  },
  pollEmptyText: {
    fontSize: nw(13),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
  },
  
  // Event Styles
  eventContainer: {
    marginTop: nh(8),
  },
  eventTitle: {
    fontSize: nw(16),
    fontWeight: '600',
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
  },
  eventDescription: {
    fontSize: nw(14),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    lineHeight: nh(20),
    marginTop: nh(4),
    marginBottom: nh(10),
  },
  
  // Enhanced RSVP styles
  rsvpContainer: {
    marginTop: nh(12),
    paddingTop: nh(12),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyF0F0F0,
  },
  rsvpTitle: {
    fontSize: nw(13),
    fontWeight: '600',
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginBottom: nh(8),
  },
  rsvpButtons: {
    flexDirection: 'row',
    gap: nw(8),
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: nw(4),
    paddingVertical: nh(10),
    borderWidth: 1.5,
    borderColor: COLORS.greyE0E0E0,
    borderRadius: nw(8),
    backgroundColor: COLORS.whiteFFFFFF,
  },
  rsvpButtonGoing: {
    backgroundColor: '#00C853' + '15',
    borderColor: '#00C853',
    borderWidth: 2,
    shadowColor: '#00C853',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  rsvpButtonInterested: {
    backgroundColor: '#FFA000' + '15',
    borderColor: '#FFA000',
    borderWidth: 2,
    shadowColor: '#FFA000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  rsvpButtonNotGoing: {
    backgroundColor: '#F44336' + '15',
    borderColor: '#F44336',
    borderWidth: 2,
    shadowColor: '#F44336',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  rsvpButtonText: {
    fontSize: nw(12),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    fontWeight: '500',
  },
  rsvpButtonTextActive: {
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    fontWeight: '700',
  },
  rsvpSummary: {
    fontSize: nw(12),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginTop: nh(8),
    textAlign: 'center',
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginBottom:nh(8),
  },
  announcementContent: {
    fontSize: nw(14),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginTop: nh(16),
  },
  emptySubtitle: {
    fontSize: nw(14),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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
    gap: nh(20),
  },
  aboutHeroCard: {
    backgroundColor: COLORS.blue043142 + '08',
    borderWidth: 1,
    borderColor: COLORS.blue043142 + '20',
    borderRadius: nw(16),
    padding: nw(18),
    gap: nh(12),
  },
  aboutHeroTitle: {
    fontSize: nw(18),
    fontWeight: '700',
    color: COLORS.blue043142,
  },
  aboutHeroSubtitle: {
    fontSize: nw(14),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    lineHeight: nh(22),
  },
  aboutJoinButton: {
    marginTop: nh(6),
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(6),
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(16),
    paddingVertical: nh(10),
    borderRadius: nw(12),
  },
  aboutJoinButtonPending: {
    backgroundColor: COLORS.grey999999,
  },
  aboutJoinButtonBanned: {
    backgroundColor: COLORS.redFF0000,
  },
  aboutJoinButtonText: {
    fontSize: nw(13),
    fontWeight: '600',
    color: COLORS.whiteFFFFFF,
  },
  aboutFactsCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    paddingHorizontal: nw(16),
    paddingVertical: nh(14),
    gap: nh(14),
  },
  aboutFactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
  },
  aboutFactIcon: {
    width: nw(34),
    height: nw(34),
    borderRadius: nw(17),
    backgroundColor: COLORS.blue043142 + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutFactTextBlock: {
    flex: 1,
  },
  aboutFactLabel: {
    fontSize: nw(12),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
  },
  aboutFactValue: {
    fontSize: nw(14),
    fontWeight: '600',
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
  },
  aboutSection: {
    marginBottom: nh(8),
  },
  aboutTitle: {
    fontSize: nw(15),
    fontWeight: '600',
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginBottom: nh(10),
  },
  aboutText: {
    fontSize: nw(14),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    lineHeight: nh(22),
  },
  aboutTagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(10),
  },
  aboutTagChip: {
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(14),
    backgroundColor: COLORS.blue043142 + '12',
  },
  aboutTagText: {
    fontSize: nw(12),
    color: COLORS.blue043142,
    fontWeight: '600',
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
  },
  memberRole: {
    fontSize: nw(12),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
    marginBottom: nh(8),
  },
  modalSubtitle: {
    fontSize: nw(14),
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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
    color: COLORS.blue043142, // Hardcoded to primary blue for better visibility
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