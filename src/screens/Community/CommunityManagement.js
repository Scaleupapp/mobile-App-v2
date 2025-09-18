// src/screens/Community/CommunityManagement.js
'use strict';

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';

import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import {
  getCommunityDetailsApi,
  getCommunityMembersApi,
  getCommunityFeedApi,
  getJoinRequestsApi,
  respondToJoinRequestApi,
  updateMemberRoleApi,
  createCommunityPostApi,
} from '../../services/apiService';
import { throttle } from '../../helper/commonFunctions';
import Routes from '../../helper/routes';

const FEED_PAGE_SIZE = 10;

const PALETTE = {
  background: COLORS.greyF7F7F7,
  surface: COLORS.whiteFFFFFF,
  primary: COLORS.blue043142,
  accent: COLORS.yellowF5BE00,
  muted: COLORS.grey777777,
  subtle: COLORS.grey999999,
  border: COLORS.greyEEEEEE,
};

const formatNumber = (value) => {
  const num = Number(value || 0);
  if (!num) return '0';
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return `${num}`;
};

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const parseFeedResponse = (response, page) => {
  const root = response?.data ?? {};
  
  const posts = Array.isArray(root.posts)
    ? root.posts
    : Array.isArray(root.data?.posts)
    ? root.data.posts
    : Array.isArray(root.feed)
    ? root.feed
    : Array.isArray(root.data?.feed)
    ? root.data.feed
    : Array.isArray(root.content)
    ? root.content
    : [];

  const pagination = root?.pagination || root?.data?.pagination || {};
  const hasMoreExplicit =
    pagination?.hasMore ?? pagination?.has_more ?? pagination?.hasNext ?? pagination?.has_next;
  const fallbackHasMore = posts.length >= FEED_PAGE_SIZE;
  const hasMore = typeof hasMoreExplicit === 'boolean' ? hasMoreExplicit : fallbackHasMore;
  const nextPage = hasMore ? page + 1 : page;

  return {posts, hasMore, nextPage};
};

const extractMembers = (payload) => {
  let members = [];
  if (!payload) {
    members = [];
  } else if (Array.isArray(payload.members)) {
    members = payload.members;
  } else if (Array.isArray(payload.data?.members)) {
    members = payload.data.members;
  } else if (Array.isArray(payload.data)) {
    members = payload.data;
  } else if (Array.isArray(payload)) {
    members = payload;
  }

  return members;
};

const getNestedValue = (obj, path) => {
  if (!obj) {
    return undefined;
  }

  return path.split('.').reduce((acc, segment) => {
    if (acc === undefined || acc === null) {
      return undefined;
    }
    return acc[segment];
  }, obj);
};

const ManagementHero = ({community, membership}) => {
  const cover = community?.coverImage?.url || community?.coverImage;
  const avatar = community?.avatar?.url || community?.avatar;
  const visibility = community?.privacy?.visibility || community?.privacy;
  const joinMethod = community?.privacy?.joinMethod || community?.joinMethod;
  const createdAt = community?.createdAt;
  const creator = community?.createdBy || community?.owner;

  return (
    <View style={styles.heroWrapper}>
      <LinearGradient colors={[PALETTE.primary + 'E6', PALETTE.primary + 'AA']} style={styles.heroGradient}>
        <View style={styles.heroHeaderRow}>
          <View style={styles.heroAvatarShell}>
            {avatar ? (
              <Image source={{uri: avatar}} style={styles.heroAvatar} />
            ) : (
              <View style={styles.heroAvatarFallback}>
                <Text style={styles.heroAvatarInitial}>{community?.name?.[0] || '?'}</Text>
              </View>
            )}
          </View>
          <View style={styles.heroHeaderText}>
            <Text style={styles.heroTitle} numberOfLines={1}>
              {community?.name || 'Community'}
            </Text>
            <Text style={styles.heroSubtitle} numberOfLines={2}>
              {community?.tagline || community?.description || 'Keep your members engaged, informed, and growing.'}
            </Text>
            <View style={styles.heroChipsRow}>
              {visibility ? (
                <View style={styles.heroChip}>
                  <Icon name={visibility === 'public' ? 'earth' : 'lock-closed'} size={nw(12)} color={COLORS.whiteFFFFFF} />
                  <Text style={styles.heroChipText}>{visibility}</Text>
                </View>
              ) : null}
              {joinMethod ? (
                <View style={styles.heroChip}>
                  <Icon name="people" size={nw(12)} color={COLORS.whiteFFFFFF} />
                  <Text style={styles.heroChipText}>
                    {joinMethod === 'approval'
                      ? 'Approvals on'
                      : joinMethod === 'invite_only'
                      ? 'Invite only'
                      : 'Instant join'}
                  </Text>
                </View>
              ) : null}
              {community?.verificationStatus === 'verified' ? (
                <View style={styles.heroChip}>
                  <Icon name="shield-checkmark" size={nw(12)} color={COLORS.whiteFFFFFF} />
                  <Text style={styles.heroChipText}>Verified</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.heroMetaRow}>
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Created</Text>
            <Text style={styles.heroMetaValue}>{formatDate(createdAt)}</Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Owner</Text>
            <Text style={styles.heroMetaValue} numberOfLines={1}>
              {creator ? `${creator.firstname || ''} ${creator.lastname || ''}`.trim() || creator.username : '—'}
            </Text>
          </View>
          <View style={styles.heroDivider} />
          <View style={styles.heroMetaItem}>
            <Text style={styles.heroMetaLabel}>Role</Text>
            <Text style={styles.heroMetaValue}>{membership?.role || 'member'}</Text>
          </View>
        </View>

      </LinearGradient>

      {cover ? <Image source={{uri: cover}} style={styles.heroCoverImage} /> : null}
    </View>
  );
};

const InsightCard = ({icon, value, label, trend}) => (
  <View style={styles.insightCard}>
    <View style={styles.insightIconWrap}>
      <Icon name={icon} size={nw(18)} color={PALETTE.primary} />
    </View>
    <View style={styles.insightTextBlock}>
      <Text style={styles.insightValue}>{value}</Text>
      <Text style={styles.insightLabel}>{label}</Text>
      {trend ? <Text style={styles.insightTrend}>{trend}</Text> : null}
    </View>
  </View>
);

const QuickActionCard = ({icon, title, subtitle, onPress}) => (
  <TouchableOpacity style={styles.quickActionCard} onPress={onPress} activeOpacity={0.85}>
    <View style={styles.quickActionIcon}>
      <Icon name={icon} size={nw(20)} color={PALETTE.primary} />
    </View>
    <View style={styles.quickActionText}>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </View>
    <Icon name="chevron-forward" size={nw(18)} color={PALETTE.subtle} />
  </TouchableOpacity>
);

const FeedCard = ({post}) => {
  if (!post) return null;

  const extractText = (data) => {
    if (!data) return '';
    if (typeof data === 'string') return data;
    if (data.text) return data.text;
    if (data.content) return data.content;
    return '';
  };

  const postId = post?.id || post?._id;
  const postType = post?.postType || 'text';
  const authorName = post?.author?.username || 
                      post?.author?.name || 
                      `${post?.author?.firstname || ''} ${post?.author?.lastname || ''}`.trim() ||
                      'Anonymous';
  const authorAvatar = post?.author?.profilePicture || post?.author?.avatar;
  const postTitle = extractText(post?.title);
  const postContent = extractText(post?.content);
  const truncatedContent = postContent.length > 150 
    ? postContent.substring(0, 150) + '...' 
    : postContent;
  
  const metrics = post?.metrics || {};
  const upvotes = metrics.upvotes || 0;
  const downvotes = metrics.downvotes || 0;
  const comments = metrics.comments || 0;
  const shares = metrics.shares || 0;
  
  const createdAt = post?.publishedAt || post?.createdAt;
  const formattedDate = formatDate(createdAt);

  const renderTypeSpecificContent = () => {
    switch (postType) {
      case 'poll':
        const pollQuestion = extractText(post?.poll?.question || post?.preview?.pollQuestion || postTitle);
        const options = post?.poll?.options || post?.preview?.pollOptions || [];
        return (
          <View style={styles.feedCardPoll}>
            <Text style={styles.feedCardPollLabel}>📊 Poll</Text>
            <Text style={styles.feedCardPollQuestion}>{pollQuestion}</Text>
            <Text style={styles.feedCardPollOptions}>{options.length} options</Text>
          </View>
        );
      
      case 'event':
        const eventTitle = extractText(post?.event?.title || post?.preview?.eventTitle || postTitle);
        const eventDate = post?.event?.startDate || post?.preview?.eventDate;
        const eventVenue = post?.event?.location?.venue || post?.preview?.eventLocation?.venue;
        return (
          <View style={styles.feedCardEvent}>
            <Text style={styles.feedCardEventLabel}>📅 Event</Text>
            <Text style={styles.feedCardEventTitle}>{eventTitle}</Text>
            {eventDate && <Text style={styles.feedCardEventDate}>{formatDate(eventDate)}</Text>}
            {eventVenue && <Text style={styles.feedCardEventVenue}>📍 {eventVenue}</Text>}
          </View>
        );
      
      case 'announcement':
        return (
          <View style={styles.feedCardAnnouncement}>
            <Text style={styles.feedCardAnnouncementLabel}>📢 Announcement</Text>
            {postTitle && <Text style={styles.feedCardTitle}>{postTitle}</Text>}
            {truncatedContent && <Text style={styles.feedCardContent}>{truncatedContent}</Text>}
          </View>
        );
      
      default:
        return (
          <>
            {postTitle && <Text style={styles.feedCardTitle}>{postTitle}</Text>}
            {truncatedContent && <Text style={styles.feedCardContent}>{truncatedContent}</Text>}
          </>
        );
    }
  };

  return (
    <View style={styles.feedCardContainer}>
      <View style={styles.feedCardHeader}>
        <View style={styles.feedCardAuthorInfo}>
          {authorAvatar ? (
            <Image source={{uri: authorAvatar}} style={styles.feedCardAvatar} />
          ) : (
            <View style={styles.feedCardAvatarFallback}>
              <Text style={styles.feedCardAvatarText}>{authorName[0]?.toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.feedCardAuthor}>{authorName}</Text>
            <Text style={styles.feedCardDate}>{formattedDate}</Text>
          </View>
        </View>
        <View style={styles.feedCardTypeBadge}>
          <Text style={styles.feedCardType}>{postType}</Text>
        </View>
      </View>
      
      <View style={styles.feedCardBody}>
        {renderTypeSpecificContent()}
      </View>
      
      <View style={styles.feedCardStats}>
        <Text style={styles.feedCardStat}>👍 {upvotes}</Text>
        <Text style={styles.feedCardStat}>👎 {downvotes}</Text>
        <Text style={styles.feedCardStat}>💬 {comments}</Text>
        <Text style={styles.feedCardStat}>📤 {shares}</Text>
      </View>
    </View>
  );
};

const MemberRow = ({member, onManage, showActions}) => {
  const name = member?.user
    ? `${member.user.firstname || ''} ${member.user.lastname || ''}`.trim() || member.user.username
    : member?.name || 'Member';
  const role = member?.role || 'member';
  const avatar = member?.user?.profilePicture || member?.user?.avatar;

  return (
    <View style={styles.memberRow}>
      {avatar ? (
        <Image source={{uri: avatar}} style={styles.memberAvatar} />
      ) : (
        <View style={styles.memberAvatarFallback}>
          <Text style={styles.memberAvatarText}>{name?.[0] || '?'}</Text>
        </View>
      )}
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{name}</Text>
        <Text style={styles.memberRoleText}>{role}</Text>
      </View>
      {showActions ? (
        <TouchableOpacity style={styles.memberManageButton} onPress={onManage}>
          <Text style={styles.memberManageText}>Manage</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const EmptyState = ({title, subtitle}) => (
  <View style={styles.emptyState}>
    <Icon name="compass-outline" size={nw(36)} color={PALETTE.subtle} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
  </View>
);

const JoinRequestRow = ({request, onApprove, onReject, processing}) => {
  if (!request) {
    return null;
  }

  const applicant = request.user || request.applicant || {};
  const fullName =
    applicant.username ||
    [applicant.firstname, applicant.lastname].filter(Boolean).join(' ').trim() ||
    applicant.email ||
    'Applicant';
  const submittedAt = request.createdAt || request.submittedAt;
  const formattedDate = submittedAt ? formatDate(submittedAt) : null;

  return (
    <View style={styles.joinRequestRow}>
      <View style={styles.joinRequestInfo}>
        <View style={styles.joinRequestAvatar}>
          <Text style={styles.joinRequestAvatarText}>
            {(fullName?.[0] || '?').toUpperCase()}
          </Text>
        </View>
        <View style={{flex: 1}}>
          <Text style={styles.joinRequestName}>{fullName}</Text>
          {applicant.email ? (
            <Text style={styles.joinRequestEmail}>{applicant.email}</Text>
          ) : null}
          {formattedDate ? (
            <Text style={styles.joinRequestDate}>Requested {formattedDate}</Text>
          ) : null}
        </View>
      </View>
      <View style={styles.joinRequestActions}>
        <TouchableOpacity
          style={[styles.requestButton, styles.requestRejectButton]}
          onPress={onReject}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.whiteFFFFFF} size="small" />
          ) : (
            <Text style={styles.requestButtonText}>Reject</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.requestButton, styles.requestApproveButton]}
          onPress={onApprove}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={COLORS.whiteFFFFFF} size="small" />
          ) : (
            <Text style={styles.requestButtonText}>Approve</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const Skeleton = () => (
  <SafeAreaView style={styles.safeArea}>
    <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
    <View style={styles.heroSkeleton}>
      <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
    </View>
    <View style={styles.sectionCard}>
      <View style={[styles.skeletonLine, {width: '40%', marginBottom: nh(12)}]} />
      <View style={[styles.skeletonLine, {width: '90%', marginBottom: nh(8)}]} />
      <View style={[styles.skeletonLine, {width: '75%'}]} />
    </View>
    <View style={styles.sectionCard}>
      <View style={[styles.skeletonLine, {width: '30%', marginBottom: nh(12)}]} />
      <View style={[styles.skeletonLine, {width: '100%', marginBottom: nh(8)}]} />
      <View style={[styles.skeletonLine, {width: '95%'}]} />
    </View>
  </SafeAreaView>
);

const CommunityManagement = ({route, navigation}) => {
  const {communityId} = route.params;

  const [community, setCommunity] = useState(null);
  const [membership, setMembership] = useState(null);
  const [feed, setFeed] = useState([]);
  const [feedPage, setFeedPage] = useState(1);
  const [hasMoreFeed, setHasMoreFeed] = useState(true);
  const [feedLoading, setFeedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [engagementModalVisible, setEngagementModalVisible] = useState(false);
  const [joinRequests, setJoinRequests] = useState([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = useState(false);
  const [requestProcessing, setRequestProcessing] = useState({});
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [roleUpdating, setRoleUpdating] = useState(false);
  const membersFetchedRef = useRef(false);
  const membersLoadingRef = useRef(false);
  const scrollRef = useRef(null);
  const [membershipSectionY, setMembershipSectionY] = useState(0);

  // Announcement modal state
  const [announcementModalVisible, setAnnouncementModalVisible] = useState(false);
  const [announcementData, setAnnouncementData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    requireReadReceipt: false,
    targetAllMembers: true,
  });
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] = useState(false);

  const fetchCommunityDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCommunityDetailsApi(communityId);
      
      const responseData = response?.data?.data || {};
      
      setCommunity(responseData.community || null);
      setMembership(responseData.userMembership || null);
    } catch (error) {
      console.log('Community management detail error', error?.response?.data || error?.message);
      Alert.alert('Error', 'Unable to load community details right now.');
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  const fetchFeed = useCallback(
    async ({pageParam = 1, replace = false} = {}) => {
      if (replace) setFeedLoading(true);
      else setLoadingMore(true);

      try {
        const response = await getCommunityFeedApi(communityId, {page: pageParam, limit: FEED_PAGE_SIZE});
        const {posts, hasMore, nextPage} = parseFeedResponse(response, pageParam);
        
        setFeed((prev) => (replace ? posts : [...prev, ...posts]));
        setHasMoreFeed(hasMore);
        setFeedPage(nextPage);
      } catch (error) {
        console.log('Community management feed error', error?.response?.data || error?.message);
      } finally {
        if (replace) {
          setFeedLoading(false);
          setRefreshing(false);
        } else {
          setLoadingMore(false);
        }
      }
    },
    [communityId],
  );

  const fetchMembers = useCallback(
    async (force = false) => {
      if (force) {
        membersFetchedRef.current = false;
      }

      if (membersLoadingRef.current) {
        return;
      }

      if (!force && membersFetchedRef.current) {
        return;
      }

      membersLoadingRef.current = true;
      setMembersLoading(true);
      try {
        const response = await getCommunityMembersApi(communityId);
        const parsedMembers = extractMembers(response?.data);
        setMembers(parsedMembers);
        membersFetchedRef.current = true;
      } catch (error) {
        console.log('Community management members error', error?.response?.data || error?.message);
      } finally {
        membersLoadingRef.current = false;
        setMembersLoading(false);
      }
    },
    [communityId],
  );

  const userRole = useMemo(() => (membership?.role || '').toLowerCase(), [membership?.role]);
  const canModerateMembers = useMemo(
    () => ['owner', 'admin', 'moderator'].includes(userRole),
    [userRole],
  );

  const fetchJoinRequests = useCallback(async () => {
    if (!canModerateMembers) {
      return;
    }

    setJoinRequestsLoading(true);
    try {
      const response = await getJoinRequestsApi(communityId, {status: 'pending', page: 1, limit: 10});
      const payload = response?.data?.data || response?.data || {};
      const requests =
        Array.isArray(payload.requests)
          ? payload.requests
          : Array.isArray(payload.items)
          ? payload.items
          : Array.isArray(payload)
          ? payload
          : [];
      setJoinRequests(requests);
    } catch (error) {
      console.log('Community management join requests error', error?.response?.data || error?.message);
      setJoinRequests([]);
    } finally {
      setJoinRequestsLoading(false);
    }
  }, [communityId, canModerateMembers]);

  useEffect(() => {
    membersFetchedRef.current = false;
  }, [communityId]);

  useEffect(() => {
    fetchCommunityDetails().then(() => {
      fetchFeed({pageParam: 1, replace: true});
      fetchMembers(true);
    });
  }, [fetchCommunityDetails, fetchFeed, fetchMembers]);
  
  useEffect(() => {
    if (canModerateMembers) {
      fetchJoinRequests();
    } else {
      setJoinRequests([]);
    }
  }, [canModerateMembers, fetchJoinRequests]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMoreFeed(true);
    fetchCommunityDetails().then(() => {
      fetchFeed({pageParam: 1, replace: true});
      fetchMembers(true);
      if (canModerateMembers) {
        fetchJoinRequests();
      } else {
        setJoinRequests([]);
      }
    });
  }, [fetchCommunityDetails, fetchFeed, fetchMembers, fetchJoinRequests, canModerateMembers]);

  const handleLoadMore = useCallback(
    throttle(() => {
      if (hasMoreFeed && !feedLoading && !loadingMore) {
        fetchFeed({pageParam: feedPage, replace: false});
      }
    }, 900),
    [fetchFeed, feedLoading, feedPage, hasMoreFeed, loadingMore],
  );

  const resolveRequestId = useCallback((request) => {
    return (
      request?.id ||
      request?._id ||
      request?.requestId ||
      request?.uuid ||
      request?.request_id ||
      request?.joinRequestId ||
      null
    );
  }, []);

  const resolveMemberId = useCallback((member) => {
    return (
      member?.id ||
      member?._id ||
      member?.user?.id ||
      member?.user?._id ||
      member?.memberId ||
      null
    );
  }, []);

  const handleJoinRequestAction = useCallback(
    async (request, action) => {
      const requestId = resolveRequestId(request);
      if (!requestId) {
        Alert.alert('Error', 'Could not identify this request. Please refresh and try again.');
        return;
      }

      setRequestProcessing((prev) => ({...prev, [requestId]: true}));
      try {
        await respondToJoinRequestApi(communityId, requestId, {action});
        setJoinRequests((prev) => prev.filter((item) => resolveRequestId(item) !== requestId));
        if (action === 'approve') {
          fetchMembers(true);
        }
        Alert.alert('Success', action === 'approve' ? 'Member approved successfully.' : 'Request rejected.');
      } catch (error) {
        console.log('Join request action error', error?.response?.data || error?.message);
        Alert.alert('Error', error?.response?.data?.message || 'Unable to update the request right now.');
      } finally {
        setRequestProcessing((prev) => {
          const next = {...prev};
          delete next[requestId];
          return next;
        });
      }
    },
    [communityId, fetchMembers, resolveRequestId],
  );

  const handleApproveRequest = useCallback(
    (request) => {
      handleJoinRequestAction(request, 'approve');
    },
    [handleJoinRequestAction],
  );

  const handleRejectRequest = useCallback(
    (request) => {
      Alert.alert(
        'Reject request',
        'Are you sure you want to reject this join request?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Reject',
            style: 'destructive',
            onPress: () => handleJoinRequestAction(request, 'reject'),
          },
        ],
      );
    },
    [handleJoinRequestAction],
  );

  const handleOpenRoleModal = useCallback((member) => {
    setSelectedMember(member);
    setRoleModalVisible(true);
  }, []);

  const handleCloseRoleModal = useCallback(() => {
    if (roleUpdating) {
      return;
    }
    setRoleModalVisible(false);
    setSelectedMember(null);
  }, [roleUpdating]);

  const handleRoleSelection = useCallback(
    async (role) => {
      if (!selectedMember) {
        return;
      }

      const memberId = resolveMemberId(selectedMember);
      if (!memberId) {
        Alert.alert('Error', 'Could not identify this member. Please refresh and try again.');
        return;
      }

      const currentRole = (selectedMember?.role || '').toLowerCase();
      if (currentRole === role) {
        handleCloseRoleModal();
        return;
      }

      setRoleUpdating(true);
      try {
        await updateMemberRoleApi(communityId, memberId, {role});
        setMembers((prev) =>
          prev.map((member) =>
            resolveMemberId(member) === memberId ? {...member, role} : member,
          ),
        );
        setSelectedMember((prev) => (prev ? {...prev, role} : prev));
        Alert.alert('Success', `Member role updated to ${role}.`);
        setRoleModalVisible(false);
        setSelectedMember(null);
      } catch (error) {
        console.log('Update member role error', error?.response?.data || error?.message);
        Alert.alert('Error', error?.response?.data?.message || 'Unable to update the member role right now.');
      } finally {
        setRoleUpdating(false);
      }
    },
    [communityId, resolveMemberId, selectedMember, handleCloseRoleModal],
  );

  const handleTrackEngagement = useCallback(() => {
    setEngagementModalVisible(true);
  }, []);

  const handleCloseEngagement = useCallback(() => {
    setEngagementModalVisible(false);
  }, []);

  const handleScrollToMembers = useCallback(() => {
    if (scrollRef.current) {
      const targetY = membershipSectionY > 0 ? Math.max(membershipSectionY - nh(40), 0) : 0;
      scrollRef.current.scrollTo({y: targetY, animated: true});
    }
  }, [membershipSectionY]);

  // Announcement modal handlers
  const handleOpenAnnouncementModal = useCallback(() => {
    setAnnouncementModalVisible(true);
    setAnnouncementData({
      title: '',
      content: '',
      priority: 'normal',
      requireReadReceipt: false,
      targetAllMembers: true,
    });
  }, []);

  const handleCloseAnnouncementModal = useCallback(() => {
    if (isSubmittingAnnouncement) return;
    setAnnouncementModalVisible(false);
  }, [isSubmittingAnnouncement]);

  const handleSubmitAnnouncement = useCallback(async () => {
    if (!announcementData.title.trim()) {
      Alert.alert('Error', 'Please enter an announcement title');
      return;
    }
    
    if (!announcementData.content.trim()) {
      Alert.alert('Error', 'Please enter announcement content');
      return;
    }
    
    setIsSubmittingAnnouncement(true);
    
    try {
      const payload = {
        postType: 'announcement',
        title: announcementData.title.trim(),
        content: {
          text: announcementData.content.trim(),
        },
        visibility: 'members',
        announcement: {
          priority: announcementData.priority,
          readReceipts: {
            required: announcementData.requireReadReceipt,
          },
          targetAudience: {
            allMembers: announcementData.targetAllMembers,
          },
        },
      };
      
      await createCommunityPostApi(communityId, payload);
      
      Alert.alert(
        'Success',
        'Announcement shared successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setAnnouncementModalVisible(false);
              handleRefresh();
            },
          },
        ]
      );
      
    } catch (error) {
      console.error('Error creating announcement:', error?.response?.data || error?.message);
      
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'Failed to create announcement. Please try again.',
      );
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  }, [announcementData, communityId, handleRefresh]);

  const metrics = useMemo(() => {
    const stats = community?.stats || {};
    return {
      members: formatNumber(stats.memberCount || stats.totalMembers),
      weekly: formatNumber(stats.weeklyActivity || stats.activeWeeklyUsers || stats.activeThisWeek),
      engagement: stats.engagementRate ? `${Math.round(stats.engagementRate)}%` : '—',
      growth: stats.monthlyGrowth || stats.memberGrowthRate || '—',
    };
  }, [community?.stats]);

  const feedBreakdown = useMemo(() => {
    return feed.reduce(
      (acc, item) => {
        const type = (item?.postType || '').toLowerCase();

        if (type === 'poll') {
          acc.polls += 1;
        } else if (type === 'event') {
          acc.events += 1;
        } else {
          acc.posts += 1;
        }

        return acc;
      },
      {posts: 0, polls: 0, events: 0},
    );
  }, [feed]);

  const resolveStatValue = useCallback(
    (paths, fallback) => {
      const stats = community?.stats;
      if (!stats) {
        return fallback;
      }

      for (const path of paths) {
        const value = getNestedValue(stats, path);
        if (value !== undefined && value !== null) {
          return value;
        }
      }

      return fallback;
    },
    [community?.stats],
  );

  const engagementStats = useMemo(() => {
    const membersValue = resolveStatValue(
      ['memberCount', 'totalMembers', 'members.total'],
      members.length,
    );
    const postsValue = resolveStatValue(
      ['postCount', 'posts.total', 'posts.count', 'totalPosts'],
      feedBreakdown.posts,
    );
    const pollsValue = resolveStatValue(
      ['pollCount', 'polls.total', 'polls.count', 'posts.poll', 'contentBreakdown.polls'],
      feedBreakdown.polls,
    );
    const eventsValue = resolveStatValue(
      ['eventCount', 'events.total', 'events.count', 'posts.event', 'contentBreakdown.events'],
      feedBreakdown.events,
    );
    const weeklyFallback =
      community?.stats?.weeklyActivity ||
      community?.stats?.activeWeeklyUsers ||
      community?.stats?.activeThisWeek ||
      0;
    const weeklyValue = resolveStatValue(
      ['weeklyActivity', 'activeWeeklyUsers', 'activeThisWeek'],
      weeklyFallback,
    );

    return [
      {
        key: 'members',
        label: 'Members',
        value: formatNumber(membersValue),
      },
      {
        key: 'posts',
        label: 'Posts',
        value: formatNumber(postsValue),
      },
      {
        key: 'polls',
        label: 'Polls',
        value: formatNumber(pollsValue),
      },
      {
        key: 'events',
        label: 'Events',
        value: formatNumber(eventsValue),
      },
      {
        key: 'weekly',
        label: 'Active this week',
        value: formatNumber(weeklyValue),
      },
    ];
  }, [resolveStatValue, feedBreakdown, members.length, community?.stats]);

  const membersPreview = useMemo(() => members.slice(0, 6), [members]);
  const moderationFeed = useMemo(() => feed.slice(0, 5), [feed]);
  const visibleJoinRequests = useMemo(() => joinRequests.slice(0, 5), [joinRequests]);
  const selectedMemberRole = useMemo(
    () => (selectedMember?.role || '').toLowerCase(),
    [selectedMember?.role],
  );
  const selectedMemberName = useMemo(() => {
    if (!selectedMember) {
      return '';
    }
    const member = selectedMember.user || selectedMember;
    return (
      member.username ||
      [member.firstname, member.lastname].filter(Boolean).join(' ').trim() ||
      member.email ||
      'Member'
    );
  }, [selectedMember]);

  const roleOptions = useMemo(
    () => [
      {
        key: 'admin',
        label: 'Admin',
        description: 'Can manage settings and other members.',
      },
      {
        key: 'moderator',
        label: 'Moderator',
        description: 'Can moderate content and approve requests.',
      },
      {
        key: 'member',
        label: 'Member',
        description: 'Standard access to community content.',
      },
    ],
    [],
  );

  if (loading && !community) {
    return <Skeleton />;
  }

  const managementHeader = (
    <ManagementHero
      community={community}
      membership={membership}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={PALETTE.primary}
          />
        }>
        {managementHeader}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Key health metrics</Text>
          <View style={styles.insightRow}>
            <InsightCard icon="people" value={metrics.members} label="Total members" />
            <InsightCard icon="pulse" value={metrics.weekly} label="Weekly activity" />
          </View>
          <View style={styles.insightRow}>
            <InsightCard icon="stats-chart" value={metrics.engagement} label="Engagement rate" />
            <InsightCard icon="trending-up" value={metrics.growth} label="Growth rate" />
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <QuickActionCard
            icon="paper-plane"
            title="Share announcement"
            subtitle="Create a post to reach everyone"
            onPress={handleOpenAnnouncementModal}
          />
          {canModerateMembers ? (
            <QuickActionCard
              icon="people"
              title="Manage members"
              subtitle="Review requests and roles"
              onPress={handleScrollToMembers}
            />
          ) : null}
          <QuickActionCard
            icon="settings"
            title="Review settings"
            subtitle="Update privacy, features, or branding"
            onPress={() =>
              navigation.navigate(Routes.CommunitySettings, {
                communityId,
                communityName: community?.name,
              })
            }
          />
          <QuickActionCard
            icon="analytics"
            title="Track engagement"
            subtitle="Check growth and activity trends"
            onPress={handleTrackEngagement}
          />
        </View>

        {canModerateMembers ? (
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Pending join requests</Text>
            {joinRequestsLoading ? (
              <ActivityIndicator color={PALETTE.primary} style={{marginTop: nh(12)}} />
            ) : visibleJoinRequests.length ? (
              <View style={styles.joinRequestList}>
                {visibleJoinRequests.map((request) => {
                  const requestId = resolveRequestId(request);
                  const processing = !!requestProcessing[requestId];
                  return (
                    <JoinRequestRow
                      key={requestId || JSON.stringify(request)}
                      request={request}
                      processing={processing}
                      onApprove={() => handleApproveRequest(request)}
                      onReject={() => handleRejectRequest(request)}
                    />
                  );
                })}
              </View>
            ) : (
              <EmptyState
                title="No pending requests"
                subtitle="You're all caught up on membership approvals."
              />
            )}
          </View>
        ) : null}

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Moderate recent posts</Text>
          {feedLoading && !feed.length ? (
            <ActivityIndicator color={PALETTE.primary} style={{marginTop: nh(12)}} />
          ) : moderationFeed.length ? (
            moderationFeed.map((post) => <FeedCard key={post.id || post._id} post={post} />)
          ) : (
            <EmptyState title="No posts yet" subtitle="Once members post, you can moderate from here." />
          )}
          {hasMoreFeed && feed.length > 0 ? (
            <TouchableOpacity style={styles.moreButton} onPress={handleLoadMore}>
              <Text style={styles.moreButtonText}>Load more posts</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View
          style={styles.sectionCard}
          onLayout={(event) => {
            const {y} = event.nativeEvent.layout;
            setMembershipSectionY((prev) => (Math.abs(prev - y) > 1 ? y : prev));
          }}
        >
          <Text style={styles.sectionTitle}>Membership snapshot</Text>
          {membersLoading && !members.length ? (
            <ActivityIndicator color={PALETTE.primary} style={{marginTop: nh(12)}} />
          ) : membersPreview.length ? (
            <View style={styles.membersGrid}>
              {membersPreview.map((member) => (
                <MemberRow
                  key={member.id || member.user?.id || member.user?._id || member._id}
                  member={member}
                  showActions={canModerateMembers && (member?.role || '').toLowerCase() !== 'owner'}
                  onManage={() => handleOpenRoleModal(member)}
                />
              ))}
            </View>
          ) : (
            <EmptyState title="No members yet" subtitle="Invite a few peers to get things started." />
          )}
          {members.length > membersPreview.length ? (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => navigation.navigate(Routes.CommunityDetail, { communityId })}
            >
              <Text style={styles.moreButtonText}>View all members</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Setup checklist</Text>
          <View style={styles.comingSoonContainer}>
            <Icon name="time-outline" size={nw(18)} color={PALETTE.subtle} />
            <Text style={styles.comingSoonText}>Coming soon</Text>
          </View>
          <Text style={styles.comingSoonSubtext}>
            We'll surface guided setup tasks here to help you launch faster.
          </Text>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Community notes</Text>
          <TextInput
            style={styles.notesInput}
            multiline
            editable={false}
            placeholder="Keep notes for your mod team (coming soon)."
            placeholderTextColor={PALETTE.subtle}
          />
        </View>
      </ScrollView>

      <Modal
        visible={engagementModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseEngagement}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseEngagement} />
          <View style={styles.engagementCard}>
            <Text style={styles.engagementTitle}>Engagement snapshot</Text>
            <View style={styles.engagementStatsList}>
              {engagementStats.map((stat) => (
                <View key={stat.key} style={styles.engagementStatRow}>
                  <Text style={styles.engagementStatLabel}>{stat.label}</Text>
                  <Text style={styles.engagementStatValue}>{stat.value}</Text>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.modalCloseButton} onPress={handleCloseEngagement}>
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseRoleModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={roleUpdating ? undefined : handleCloseRoleModal}
          />
          <View style={styles.roleModalCard}>
            <Text style={styles.roleModalTitle}>Manage member</Text>
            <Text style={styles.roleModalSubtitle}>{selectedMemberName}</Text>
            <View style={styles.roleOptionsContainer}>
              {roleOptions.map((option) => {
                const isActive = selectedMemberRole === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[styles.roleOption, isActive && styles.roleOptionActive]}
                    disabled={roleUpdating || isActive}
                    onPress={() => handleRoleSelection(option.key)}
                  >
                    <View style={styles.roleOptionTextBlock}>
                      <Text
                        style={[styles.roleOptionLabel, isActive && styles.roleOptionLabelActive]}
                      >
                        {option.label}
                      </Text>
                      <Text style={styles.roleOptionDescription}>{option.description}</Text>
                    </View>
                    {isActive ? (
                      <Icon name="checkmark-circle" size={nw(20)} color={PALETTE.primary} />
                    ) : (
                      <Icon name="chevron-forward" size={nw(18)} color={PALETTE.subtle} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity
              style={[styles.modalCloseButton, roleUpdating && styles.modalCloseButtonDisabled]}
              onPress={handleCloseRoleModal}
              disabled={roleUpdating}
            >
              <Text style={styles.modalCloseText}>{roleUpdating ? 'Processing…' : 'Close'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      
      {/* IMPROVED Announcement Creation Modal */}
      <Modal
        visible={announcementModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseAnnouncementModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalKeyboardAvoidingView}
        >
          <Pressable
            style={[StyleSheet.absoluteFill, styles.modalBackdrop]}
            onPress={isSubmittingAnnouncement ? undefined : handleCloseAnnouncementModal}
          />
          <View style={styles.announcementModalContainer}>
            <View style={styles.modalDragHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Announcement</Text>
              <TouchableOpacity
                onPress={handleCloseAnnouncementModal}
                disabled={isSubmittingAnnouncement}
                style={styles.modalCloseIcon}
              >
                <Icon name="close" size={nw(24)} color={PALETTE.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g., Q3 All-Hands Meeting"
                  placeholderTextColor={PALETTE.subtle}
                  value={announcementData.title}
                  onChangeText={(text) => setAnnouncementData(prev => ({ ...prev, title: text }))}
                  maxLength={200}
                  editable={!isSubmittingAnnouncement}
                />
                <Text style={styles.charCount}>
                  {announcementData.title.length}/200
                </Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Content *</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Share details, updates, or news here..."
                  placeholderTextColor={PALETTE.subtle}
                  value={announcementData.content}
                  onChangeText={(text) => setAnnouncementData(prev => ({ ...prev, content: text }))}
                  multiline
                  numberOfLines={6}
                  maxLength={2000}
                  textAlignVertical="top"
                  editable={!isSubmittingAnnouncement}
                />
                <Text style={styles.charCount}>
                  {announcementData.content.length}/2000
                </Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Priority</Text>
                <View style={styles.priorityOptions}>
                  {['low', 'normal', 'high', 'urgent'].map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        announcementData.priority === priority && styles.priorityButtonActive,
                      ]}
                      onPress={() => setAnnouncementData(prev => ({ ...prev, priority }))}
                      disabled={isSubmittingAnnouncement}
                    >
                      <Icon
                        name={
                          priority === 'urgent' ? 'alert-circle' :
                          priority === 'high' ? 'warning' :
                          priority === 'normal' ? 'information-circle' :
                          'flag'
                        }
                        size={nw(16)}
                        color={
                          announcementData.priority === priority 
                            ? COLORS.whiteFFFFFF 
                            : PALETTE.primary
                        }
                      />
                      <Text
                        style={[
                          styles.priorityText,
                          announcementData.priority === priority && styles.priorityTextActive,
                        ]}
                      >
                        {priority.charAt(0).toUpperCase() + priority.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              <View style={styles.toggleGroup}>
                <View style={styles.toggleInfo}>
                  <Icon name="checkmark-circle" size={nw(20)} color={PALETTE.primary} />
                  <View style={styles.toggleTextContainer}>
                    <Text style={styles.toggleLabel}>Require Read Receipt</Text>
                    <Text style={styles.toggleDescription}>
                      Track when members have read this announcement
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.toggle,
                    announcementData.requireReadReceipt && styles.toggleActive,
                  ]}
                  onPress={() => setAnnouncementData(prev => ({
                    ...prev,
                    requireReadReceipt: !prev.requireReadReceipt,
                  }))}
                  disabled={isSubmittingAnnouncement}
                >
                  <View
                    style={[
                      styles.toggleThumb,
                      announcementData.requireReadReceipt && styles.toggleThumbActive,
                    ]}
                  />
                </TouchableOpacity>
              </View>
              
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSubmitButton]}
                onPress={handleSubmitAnnouncement}
                disabled={isSubmittingAnnouncement}
              >
                {isSubmittingAnnouncement ? (
                  <ActivityIndicator color={COLORS.whiteFFFFFF} size="small" />
                ) : (
                  <>
                    <Icon name="send" size={nw(16)} color={COLORS.whiteFFFFFF} />
                    <Text style={styles.modalSubmitText}>Share Announcement</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  scrollContent: {
    paddingBottom: nh(32),
  },
  heroWrapper: {
    marginHorizontal: nw(16),
    marginTop: nh(18),
    borderRadius: nw(28),
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#0D1E2F',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 6},
  },
  heroGradient: {
    paddingHorizontal: nw(20),
    paddingVertical: nh(22),
    backgroundColor: PALETTE.primary,
  },
  heroCoverImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroAvatarShell: {
    width: nw(64),
    height: nw(64),
    borderRadius: nw(20),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(16),
  },
  heroAvatar: {
    width: '100%',
    height: '100%',
    borderRadius: nw(20),
  },
  heroAvatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: nw(20),
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroAvatarInitial: {
    color: PALETTE.primary,
    fontSize: nw(24),
    fontWeight: '700',
  },
  heroHeaderText: {
    flex: 1,
  },
  heroTitle: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(22),
    fontWeight: '700',
    marginBottom: nh(6),
  },
  heroSubtitle: {
    color: COLORS.whiteFFFFFF + 'CC',
    fontSize: nw(12),
    lineHeight: nh(18),
  },
  heroChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
    marginTop: nh(12),
  },
  heroChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
    paddingHorizontal: nw(10),
    paddingVertical: nh(4),
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: nw(14),
  },
  heroChipText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(11),
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(20),
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: nw(18),
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
  },
  heroMetaItem: {
    flex: 1,
  },
  heroMetaLabel: {
    color: COLORS.whiteFFFFFF + 'AA',
    fontSize: nw(11),
  },
  heroMetaValue: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(13),
    fontWeight: '600',
    marginTop: nh(2),
  },
  heroDivider: {
    width: 1,
    height: '100%',
    backgroundColor: COLORS.whiteFFFFFF + '22',
    marginHorizontal: nw(12),
  },
  sectionCard: {
    marginHorizontal: nw(20),
    marginTop: nh(18),
    borderRadius: nw(20),
    backgroundColor: PALETTE.surface,
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: nw(18),
    paddingVertical: nh(16),
  },
  sectionTitle: {
    color: PALETTE.primary,
    fontSize: nw(14),
    fontWeight: '700',
    marginBottom: nh(12),
  },
  insightRow: {
    flexDirection: 'row',
    gap: nw(12),
    marginBottom: nh(12),
  },
  insightCard: {
    flex: 1,
    backgroundColor: PALETTE.background,
    borderRadius: nw(16),
    paddingHorizontal: nw(14),
    paddingVertical: nh(14),
    borderWidth: 1,
    borderColor: PALETTE.border,
    gap: nh(6),
  },
  insightIconWrap: {
    width: nw(28),
    height: nw(28),
    borderRadius: nw(14),
    backgroundColor: PALETTE.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightTextBlock: {},
  insightValue: {
    color: PALETTE.primary,
    fontSize: nw(16),
    fontWeight: '700',
  },
  insightLabel: {
    color: PALETTE.muted,
    fontSize: nw(11),
  },
  insightTrend: {
    color: PALETTE.accent,
    fontSize: nw(11),
    marginTop: nh(4),
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
    paddingVertical: nh(14),
    borderBottomWidth: 1,
    borderColor: PALETTE.border,
  },
  quickActionIcon: {
    width: nw(36),
    height: nw(36),
    borderRadius: nw(18),
    backgroundColor: PALETTE.primary + '12',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  quickActionSubtitle: {
    color: PALETTE.muted,
    fontSize: nw(11),
    marginTop: nh(4),
  },
  feedCardContainer: {
    backgroundColor: PALETTE.background,
    borderRadius: nw(12),
    padding: nw(12),
    marginBottom: nh(10),
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  feedCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(10),
  },
  feedCardAuthorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  feedCardAvatar: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    marginRight: nw(8),
  },
  feedCardAvatarFallback: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    backgroundColor: PALETTE.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(8),
  },
  feedCardAvatarText: {
    color: PALETTE.primary,
    fontSize: nw(14),
    fontWeight: '600',
  },
  feedCardAuthor: {
    fontSize: nw(13),
    color: PALETTE.primary,
    fontWeight: '600',
  },
  feedCardDate: {
    fontSize: nw(11),
    color: PALETTE.subtle,
    marginTop: nh(2),
  },
  feedCardTypeBadge: {
    backgroundColor: PALETTE.primary + '10',
    paddingHorizontal: nw(8),
    paddingVertical: nh(3),
    borderRadius: nw(8),
  },
  feedCardType: {
    fontSize: nw(10),
    color: PALETTE.primary,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  feedCardBody: {
    marginBottom: nh(10),
  },
  feedCardTitle: {
    fontSize: nw(14),
    fontWeight: '600',
    color: PALETTE.primary,
    marginBottom: nh(6),
  },
  feedCardContent: {
    fontSize: nw(12),
    color: PALETTE.muted,
    lineHeight: nh(18),
  },
  feedCardStats: {
    flexDirection: 'row',
    gap: nw(16),
    paddingTop: nh(8),
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  feedCardStat: {
    fontSize: nw(11),
    color: PALETTE.subtle,
  },
  feedCardPoll: {
    backgroundColor: PALETTE.primary + '08',
    padding: nw(10),
    borderRadius: nw(8),
  },
  feedCardPollLabel: {
    fontSize: nw(11),
    color: PALETTE.primary,
    fontWeight: '600',
    marginBottom: nh(4),
  },
  feedCardPollQuestion: {
    fontSize: nw(13),
    color: PALETTE.primary,
    fontWeight: '500',
    marginBottom: nh(4),
  },
  feedCardPollOptions: {
    fontSize: nw(11),
    color: PALETTE.muted,
  },
  feedCardEvent: {
    backgroundColor: PALETTE.accent + '15',
    padding: nw(10),
    borderRadius: nw(8),
  },
  feedCardEventLabel: {
    fontSize: nw(11),
    color: PALETTE.primary,
    fontWeight: '600',
    marginBottom: nh(4),
  },
  feedCardEventTitle: {
    fontSize: nw(13),
    color: PALETTE.primary,
    fontWeight: '500',
    marginBottom: nh(4),
  },
  feedCardEventDate: {
    fontSize: nw(11),
    color: PALETTE.muted,
  },
  feedCardEventVenue: {
    fontSize: nw(11),
    color: PALETTE.muted,
    marginTop: nh(2),
  },
  feedCardAnnouncement: {
    backgroundColor: PALETTE.accent + '10',
    padding: nw(10),
    borderRadius: nw(8),
  },
  feedCardAnnouncementLabel: {
    fontSize: nw(11),
    color: PALETTE.accent,
    fontWeight: '700',
    marginBottom: nh(6),
  },
  moreButton: {
    marginTop: nh(10),
    alignSelf: 'flex-start',
    paddingHorizontal: nw(14),
    paddingVertical: nh(8),
    borderRadius: nw(14),
    backgroundColor: PALETTE.primary + '12',
  },
  moreButtonText: {
    color: PALETTE.primary,
    fontSize: nw(12),
    fontWeight: '600',
  },
  joinRequestList: {
    gap: nh(12),
    marginTop: nh(12),
  },
  joinRequestRow: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(14),
    paddingHorizontal: nw(14),
    paddingVertical: nh(12),
  },
  joinRequestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(10),
  },
  joinRequestAvatar: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(12),
    backgroundColor: PALETTE.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  joinRequestAvatarText: {
    color: PALETTE.primary,
    fontSize: nw(16),
    fontWeight: '700',
  },
  joinRequestName: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  joinRequestEmail: {
    color: PALETTE.muted,
    fontSize: nw(11),
    marginTop: nh(2),
  },
  joinRequestDate: {
    color: PALETTE.subtle,
    fontSize: nw(10),
    marginTop: nh(2),
  },
  joinRequestActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: nw(10),
  },
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: nw(90),
    paddingVertical: nh(8),
    borderRadius: nw(12),
  },
  requestApproveButton: {
    backgroundColor: '#2E7D32',
  },
  requestRejectButton: {
    backgroundColor: '#C62828',
  },
  requestButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(12),
    fontWeight: '600',
  },
  membersGrid: {
    gap: nh(12),
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberAvatar: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(12),
    marginRight: nw(12),
  },
  memberAvatarFallback: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(12),
    backgroundColor: PALETTE.primary + '18',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  memberAvatarText: {
    color: PALETTE.primary,
    fontSize: nw(16),
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: PALETTE.primary,
    fontSize: nw(13),
    fontWeight: '600',
  },
  memberRoleText: {
    color: PALETTE.muted,
    fontSize: nw(11),
    marginTop: nh(2),
  },
  memberManageButton: {
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(12),
    backgroundColor: PALETTE.primary + '12',
  },
  memberManageText: {
    color: PALETTE.primary,
    fontSize: nw(11),
    fontWeight: '600',
  },
  comingSoonContainer: {
    marginTop: nh(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  comingSoonText: {
    color: PALETTE.muted,
    fontSize: nw(13),
    fontWeight: '600',
  },
  comingSoonSubtext: {
    marginTop: nh(6),
    color: PALETTE.subtle,
    fontSize: nw(12),
    lineHeight: nh(18),
  },
  notesInput: {
    marginTop: nh(10),
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(16),
    padding: nw(14),
    color: PALETTE.subtle,
    minHeight: nh(100),
    textAlignVertical: 'top',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: nw(20),
  },
  engagementCard: {
    width: '100%',
    maxWidth: nw(320),
    borderRadius: nw(20),
    backgroundColor: PALETTE.surface,
    paddingHorizontal: nw(20),
    paddingVertical: nh(20),
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  engagementTitle: {
    fontSize: nw(16),
    fontWeight: '700',
    color: PALETTE.primary,
    marginBottom: nh(12),
    textAlign: 'center',
  },
  engagementStatsList: {
    gap: nh(10),
  },
  engagementStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: nh(4),
  },
  engagementStatLabel: {
    fontSize: nw(13),
    color: PALETTE.muted,
  },
  engagementStatValue: {
    fontSize: nw(14),
    fontWeight: '600',
    color: PALETTE.primary,
  },
  modalCloseButton: {
    marginTop: nh(18),
    alignSelf: 'center',
    paddingHorizontal: nw(20),
    paddingVertical: nh(10),
    borderRadius: nw(14),
    backgroundColor: PALETTE.primary,
  },
  modalCloseButtonDisabled: {
    opacity: 0.6,
  },
  modalCloseText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(12),
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  roleModalCard: {
    width: '100%',
    maxWidth: nw(340),
    borderRadius: nw(20),
    backgroundColor: PALETTE.surface,
    paddingHorizontal: nw(24),
    paddingVertical: nh(24),
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  roleModalTitle: {
    fontSize: nw(16),
    fontWeight: '700',
    color: PALETTE.primary,
    marginBottom: nh(6),
  },
  roleModalSubtitle: {
    fontSize: nw(13),
    color: PALETTE.muted,
    marginBottom: nh(18),
  },
  roleOptionsContainer: {
    gap: nh(12),
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(16),
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
  },
  roleOptionActive: {
    borderColor: PALETTE.primary,
    backgroundColor: PALETTE.primary + '12',
  },
  roleOptionTextBlock: {
    flex: 1,
    marginRight: nw(12),
  },
  roleOptionLabel: {
    fontSize: nw(13),
    fontWeight: '600',
    color: PALETTE.primary,
    marginBottom: nh(4),
  },
  roleOptionLabelActive: {
    color: PALETTE.primary,
  },
  roleOptionDescription: {
    fontSize: nw(11),
    color: PALETTE.muted,
    lineHeight: nh(16),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(40),
    paddingHorizontal: nw(18),
  },
  emptyTitle: {
    color: PALETTE.primary,
    fontSize: nw(15),
    fontWeight: '700',
    marginTop: nh(12),
  },
  emptySubtitle: {
    color: PALETTE.muted,
    fontSize: nw(12),
    textAlign: 'center',
    marginTop: nh(6),
    lineHeight: nh(18),
  },
  heroSkeleton: {
    marginHorizontal: nw(20),
    marginTop: nh(18),
    borderRadius: nw(28),
    paddingVertical: nh(60),
    backgroundColor: PALETTE.primary + '0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  skeletonLine: {
    height: nh(14),
    backgroundColor: PALETTE.border,
    borderRadius: nw(10),
  },
  // IMPROVED ANNOUNCEMENT MODAL STYLES
  modalKeyboardAvoidingView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  announcementModalContainer: {
    backgroundColor: PALETTE.surface,
    borderTopLeftRadius: nw(24),
    borderTopRightRadius: nw(24),
    maxHeight: '90%',
    paddingBottom: Platform.OS === 'ios' ? nh(20) : 0,
  },
  modalDragHandle: {
    width: nw(40),
    height: nh(5),
    backgroundColor: PALETTE.border,
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: nh(12),
    marginBottom: nh(8),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(24),
    paddingVertical: nh(16),
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  modalTitle: {
    fontSize: nw(18),
    fontWeight: '700',
    color: PALETTE.primary,
  },
  modalCloseIcon: {
    padding: nw(4),
  },
  modalBody: {
    paddingHorizontal: nw(24),
  },
  modalFooter: {
    paddingHorizontal: nw(24),
    paddingTop: nh(16),
    paddingBottom: nh(Platform.OS === 'ios' ? 16 : 24),
    borderTopWidth: 1,
    borderTopColor: PALETTE.border,
  },
  inputGroup: {
    marginBottom: nh(20),
  },
  inputLabel: {
    fontSize: nw(13),
    fontWeight: '600',
    color: PALETTE.primary,
    marginBottom: nh(8),
  },
  textInput: {
    borderWidth: 1,
    borderColor: PALETTE.border,
    borderRadius: nw(12),
    paddingHorizontal: nw(14),
    paddingVertical: nh(12),
    fontSize: nw(14),
    color: PALETTE.primary,
    backgroundColor: PALETTE.background,
  },
  textArea: {
    minHeight: nh(120),
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: nw(11),
    color: PALETTE.subtle,
    textAlign: 'right',
    marginTop: nh(4),
  },
  priorityOptions: {
    flexDirection: 'row',
    gap: nw(8),
  },
  priorityButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: nw(4),
    paddingVertical: nh(10),
    borderRadius: nw(10),
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.background,
  },
  priorityButtonActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  priorityText: {
    fontSize: nw(11),
    fontWeight: '600',
    color: PALETTE.primary,
  },
  priorityTextActive: {
    color: COLORS.whiteFFFFFF,
  },
  toggleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: nh(12),
    paddingHorizontal: nw(14),
    backgroundColor: PALETTE.background,
    borderRadius: nw(12),
    marginBottom: nh(16),
  },
  toggleInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleLabel: {
    fontSize: nw(13),
    fontWeight: '600',
    color: PALETTE.primary,
  },
  toggleDescription: {
    fontSize: nw(11),
    color: PALETTE.muted,
    marginTop: nh(2),
  },
  toggle: {
    width: nw(44),
    height: nh(24),
    borderRadius: nw(12),
    backgroundColor: PALETTE.border,
    padding: nw(2),
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: PALETTE.accent,
  },
  toggleThumb: {
    width: nh(20),
    height: nh(20),
    borderRadius: nw(10),
    backgroundColor: COLORS.whiteFFFFFF,
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: nw(8),
    paddingVertical: nh(14),
    borderRadius: nw(14),
  },
  modalSubmitButton: {
    backgroundColor: PALETTE.primary,
  },
  modalButtonDisabled: {
    opacity: 0.6,
  },
  modalSubmitText: {
    fontSize: nw(14),
    fontWeight: '600',
    color: COLORS.whiteFFFFFF,
  },
});

export default CommunityManagement;