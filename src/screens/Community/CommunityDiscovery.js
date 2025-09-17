import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';

import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import {listAllCommunitiesApi, searchCommunitiesApi} from '../../services/apiService';
import {throttle} from '../../helper/commonFunctions';
import Routes from '../../helper/routes';

const PAGE_SIZE = 10;

const SORT_OPTIONS = [
  {key: 'recommended', label: 'Featured'},
  {key: 'popular', label: 'Most members'},
  {key: 'newest', label: 'Newest'},
  {key: 'alphabetical', label: 'A-Z'},
];

const PALETTE = {
  background: COLORS.greyF7F7F7,
  card: COLORS.whiteFFFFFF,
  primary: COLORS.blue043142,
  muted: COLORS.grey777777,
  subtle: COLORS.grey999999,
  border: COLORS.greyEEEEEE,
  accent: COLORS.yellowF5BE00,
};

const formatNumber = (value) => {
  const num = Number(value || 0);
  if (!num) {
    return '0';
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }
  return `${num}`;
};

const extractArray = (payload) => {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.communities)) {
    return payload.communities;
  }
  if (Array.isArray(payload.items)) {
    return payload.items;
  }
  if (Array.isArray(payload.results)) {
    return payload.results;
  }
  if (Array.isArray(payload.data)) {
    return payload.data;
  }
  return [];
};

const parseCommunityResponse = (response, pageParam) => {
  const root = response?.data ?? {};
  const dataSection = root?.data ?? root;
  const communities = extractArray(dataSection).length
    ? extractArray(dataSection)
    : extractArray(root);

  const pagination =
    dataSection?.pagination ||
    root?.pagination ||
    dataSection?.meta ||
    {};

  const explicitHasMore =
    pagination?.hasMore ??
    pagination?.has_more ??
    pagination?.hasNext ??
    pagination?.has_next;

  const nextPageValue =
    pagination?.nextPage ??
    pagination?.next_page ??
    (typeof pagination?.page === 'number' && typeof pagination?.totalPages === 'number'
      ? pagination.page < pagination.totalPages
        ? pagination.page + 1
        : null
      : null);

  const fallbackHasMore = communities.length >= PAGE_SIZE;

  return {
    communities,
    hasMore:
      typeof explicitHasMore === 'boolean' ? explicitHasMore : nextPageValue != null ? true : fallbackHasMore,
    nextPage: nextPageValue ?? (fallbackHasMore ? pageParam + 1 : null),
  };
};

const getCommunityId = (community) =>
  community?.id || community?._id || community?.communityId || community?.slug || null;

const mergeUniqueCommunities = (existing, incoming) => {
  if (!incoming?.length) {
    return existing;
  }
  const seen = new Set(existing.map((item) => getCommunityId(item) || `existing-${Math.random()}`));
  const merged = [...existing];
  incoming.forEach((item) => {
    const id = getCommunityId(item);
    if (id) {
      if (!seen.has(id)) {
        seen.add(id);
        merged.push(item);
      }
    } else {
      merged.push(item);
    }
  });
  return merged;
};

const getName = (community) =>
  community?.name || community?.title || community?.displayName || 'Community';

const getSummary = (community) =>
  community?.tagline ||
  community?.shortDescription ||
  community?.description ||
  community?.about ||
  'Stay tuned for updates from this community.';

const getMembersCount = (community) =>
  community?.stats?.memberCount ??
  community?.memberCount ??
  community?.membersCount ??
  community?.members ??
  0;

const getCategoryLabel = (community) => {
  const labels =
    community?.categories ||
    community?.topics ||
    community?.tags ||
    community?.labels;
  if (Array.isArray(labels) && labels.length > 0) {
    return labels[0];
  }
  return community?.category || community?.type || null;
};

const getScheduleLabel = (community) =>
  community?.meeting ||
  community?.meetingTime ||
  community?.meetingSchedule ||
  community?.nextEvent ||
  community?.nextMeetup ||
  community?.schedule ||
  community?.upcomingEvent ||
  '';

const getCreatedAtValue = (community) => {
  const raw =
    community?.createdAt ||
    community?.created_at ||
    community?.createdOn ||
    community?.meta?.createdAt ||
    community?.updatedAt ||
    null;
  if (!raw) {
    return 0;
  }
  const timestamp = new Date(raw).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

// Floating Action Button Component
const FloatingActionButton = ({onPress}) => (
  <TouchableOpacity 
    style={styles.fab} 
    onPress={onPress}
    activeOpacity={0.9}
  >
    <LinearGradient 
      colors={['#0B3E56', '#0F6476']} 
      style={styles.fabGradient}
    >
      <Icon name="add" size={nw(24)} color={COLORS.whiteFFFFFF} />
    </LinearGradient>
  </TouchableOpacity>
);

const HeroBanner = ({community, onPress, loading}) => {
  if (loading) {
    return (
      <LinearGradient colors={['#0B3E56', '#0F6476']} style={styles.heroGradient}>
        <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
      </LinearGradient>
    );
  }

  if (!community) {
    return (
      <LinearGradient colors={['#0B3E56', '#0F6476']} style={styles.heroGradient}>
        <Icon name="sparkles" size={nw(18)} color={COLORS.whiteFFFFFF} />
        <Text style={styles.heroTitle}>No communities yet</Text>
        <Text style={styles.heroSubtitle}>
          New spaces will appear here as soon as students start creating them.
        </Text>
      </LinearGradient>
    );
  }

  const members = formatNumber(getMembersCount(community));
  const label = getCategoryLabel(community);
  const schedule = getScheduleLabel(community);

  return (
    <LinearGradient colors={['#0B3E56', '#0F6476']} style={styles.heroGradient}>
      {label ? (
        <View style={styles.heroPill}>
          <Text style={styles.heroPillText}>#{label}</Text>
        </View>
      ) : null}
      <Text style={styles.heroTitle}>{getName(community)}</Text>
      <Text style={styles.heroSubtitle}>{getSummary(community)}</Text>
      <View style={styles.heroStatsRow}>
        <View style={styles.heroStatBadge}>
          <Icon name="people" size={nw(16)} color={COLORS.whiteFFFFFF} />
          <Text style={styles.heroStatLabel}>{members} members</Text>
        </View>
        {schedule ? (
          <View style={styles.heroStatBadge}>
            <Icon name="time-outline" size={nw(16)} color={COLORS.whiteFFFFFF} />
            <Text style={styles.heroStatLabel} numberOfLines={1}>
              {schedule}
            </Text>
          </View>
        ) : null}
      </View>
      <TouchableOpacity style={styles.heroButton} onPress={() => onPress(community)} activeOpacity={0.85}>
        <Text style={styles.heroButtonText}>Open community</Text>
        <Icon name="arrow-forward" size={nw(16)} color={COLORS.whiteFFFFFF} />
      </TouchableOpacity>
    </LinearGradient>
  );
};

const StatsStrip = ({totalCommunities, totalMembers, categoryCount}) => (
  <View style={styles.statsStrip}>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{formatNumber(totalCommunities)}</Text>
      <Text style={styles.statLabel}>communities</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{formatNumber(totalMembers)}</Text>
      <Text style={styles.statLabel}>collective members</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{formatNumber(categoryCount)}</Text>
      <Text style={styles.statLabel}>unique tags</Text>
    </View>
  </View>
);

const SortSelector = ({selected, onChange}) => (
  <View style={styles.sortRow}>
    <Text style={styles.sortLabel}>Sort by</Text>
    <View style={styles.sortChipsContainer}>
      {SORT_OPTIONS.map((option) => {
        const isActive = option.key === selected;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.sortChip, isActive && styles.sortChipActive]}
            onPress={() => onChange(option.key)}
            activeOpacity={0.8}>
            <Text style={[styles.sortChipText, isActive && styles.sortChipTextActive]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

const CommunityCard = React.memo(({community, onPress}) => {
  const members = formatNumber(getMembersCount(community));
  const label = getCategoryLabel(community);
  const schedule = getScheduleLabel(community);

  return (
    <TouchableOpacity style={styles.communityCard} onPress={() => onPress(community)} activeOpacity={0.85}>
      <View style={styles.communityHeaderRow}>
        <View style={styles.communityAvatar}>
          <Icon name="people" size={nw(20)} color={PALETTE.primary} />
        </View>
        <View style={styles.communityHeaderText}>
          <Text style={styles.communityName} numberOfLines={1}>
            {getName(community)}
          </Text>
          {label ? (
            <Text style={styles.communityLabel}>#{label}</Text>
          ) : null}
        </View>
        <Icon name="chevron-forward" size={nw(18)} color={PALETTE.muted} />
      </View>
      <Text style={styles.communitySummary} numberOfLines={2}>
        {getSummary(community)}
      </Text>
      <View style={styles.communityMetaRow}>
        <Icon name="people-circle" size={nw(16)} color={PALETTE.primary} />
        <Text style={styles.communityMetaText}>{members} members</Text>
        {schedule ? (
          <>
            <View style={styles.metaSeparator} />
            <Icon name="time-outline" size={nw(16)} color={PALETTE.primary} />
            <Text style={styles.communityMetaText} numberOfLines={1}>
              {schedule}
            </Text>
          </>
        ) : null}
      </View>
    </TouchableOpacity>
  );
});

const SkeletonCard = () => (
  <View style={styles.skeletonCard}>
    <View style={styles.skeletonLineWide} />
    <View style={styles.skeletonLine} />
    <View style={styles.skeletonLine} />
  </View>
);

// Updated EmptyState component with optional create button
const EmptyState = ({icon = 'compass-outline', title, subtitle, showCreateButton, onCreatePress}) => (
  <View style={styles.emptyState}>
    <Icon name={icon} size={nw(36)} color={COLORS.greyBBBBBB} />
    <Text style={styles.emptyTitle}>{title}</Text>
    <Text style={styles.emptySubtitle}>{subtitle}</Text>
    {showCreateButton && (
      <TouchableOpacity 
        style={styles.emptyCreateButton} 
        onPress={onCreatePress}
        activeOpacity={0.85}
      >
        <Text style={styles.emptyCreateButtonText}>Create First Community</Text>
      </TouchableOpacity>
    )}
  </View>
);

const CommunityDiscovery = ({navigation}) => {
  const [communities, setCommunities] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchApplied, setSearchApplied] = useState('');
  const [sortOption, setSortOption] = useState('recommended');
  const [errorMessage, setErrorMessage] = useState('');

  const fetchCommunities = useCallback(
    async ({pageParam = 1, replace = false} = {}) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setErrorMessage('');

      try {
        const params = {page: pageParam, limit: PAGE_SIZE};
        if (searchApplied) {
          params.q = searchApplied;
        }

        const response = searchApplied
          ? await searchCommunitiesApi(params)
          : await listAllCommunitiesApi(params);

        const {communities: fetched, hasMore: more, nextPage} = parseCommunityResponse(response, pageParam);

        setCommunities((prev) =>
          replace ? fetched : mergeUniqueCommunities(prev, fetched),
        );
        setHasMore(more);
        setPage(nextPage ?? (more ? pageParam + 1 : pageParam));
      } catch (error) {
        console.log('Community discovery fetch error', error?.response?.data || error?.message);
        if (replace) {
          setCommunities([]);
        }
        setHasMore(false);
        setErrorMessage(
          error?.response?.data?.message ||
            error?.message ||
            'Unable to load communities right now. Please try again later.',
        );
      } finally {
        if (replace) {
          setLoading(false);
        } else {
          setLoadingMore(false);
        }
        setRefreshing(false);
      }
    },
    [searchApplied],
  );

  useEffect(() => {
    fetchCommunities({pageParam: 1, replace: true});
  }, [fetchCommunities]);

  const handleSearchSubmit = useCallback(() => {
    const nextQuery = searchText.trim();
    if (nextQuery === searchApplied) {
      fetchCommunities({pageParam: 1, replace: true});
      return;
    }
    setSearchApplied(nextQuery);
  }, [fetchCommunities, searchApplied, searchText]);

  const handleClearSearch = useCallback(() => {
    setSearchText('');
    if (searchApplied) {
      setSearchApplied('');
    } else {
      fetchCommunities({pageParam: 1, replace: true});
    }
  }, [fetchCommunities, searchApplied]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    setHasMore(true);
    fetchCommunities({pageParam: 1, replace: true});
  }, [fetchCommunities]);

  const handleLoadMore = useCallback(
    throttle(() => {
      if (hasMore && !loading && !loadingMore) {
        fetchCommunities({pageParam: page, replace: false});
      }
    }, 900),
    [fetchCommunities, hasMore, loading, loadingMore, page],
  );

  const sortedCommunities = useMemo(() => {
    if (!communities.length) {
      return [];
    }
    const list = [...communities];
    switch (sortOption) {
      case 'popular':
        return list.sort((a, b) => getMembersCount(b) - getMembersCount(a));
      case 'newest':
        return list.sort((a, b) => getCreatedAtValue(b) - getCreatedAtValue(a));
      case 'alphabetical':
        return list.sort((a, b) => getName(a).localeCompare(getName(b)));
      case 'recommended':
      default:
        return list;
    }
  }, [communities, sortOption]);

  const heroCommunity = sortedCommunities[0] || null;
  const listData = heroCommunity ? sortedCommunities.slice(1) : sortedCommunities;

  const metrics = useMemo(() => {
    const totalCommunities = sortedCommunities.length;
    const totalMembers = sortedCommunities.reduce((total, item) => total + getMembersCount(item), 0);
    const tags = new Set();
    sortedCommunities.forEach((item) => {
      const category = getCategoryLabel(item);
      if (category) {
        tags.add(category);
      }
      const itemTags = Array.isArray(item?.tags) ? item.tags : [];
      itemTags.forEach((tag) => tags.add(tag));
    });
    return {
      totalCommunities,
      totalMembers,
      categoryCount: tags.size,
    };
  }, [sortedCommunities]);

  const listHeader = useMemo(() => (
    <View>
      <HeroBanner
        community={heroCommunity}
        loading={loading && !communities.length}
        onPress={(community) => {
          const communityId = getCommunityId(community);
          if (communityId) {
            navigation.navigate(Routes.CommunityDetail, {communityId});
          }
        }}
      />
      <StatsStrip
        totalCommunities={metrics.totalCommunities}
        totalMembers={metrics.totalMembers}
        categoryCount={metrics.categoryCount}
      />
      <View style={styles.searchCard}>
        <Icon name="search" size={nw(18)} color={PALETTE.subtle} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Search communities, interests, or friends"
          placeholderTextColor={PALETTE.subtle}
          style={styles.searchInput}
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={handleSearchSubmit}
        />
        {searchText.length ? (
          <TouchableOpacity onPress={handleClearSearch}>
            <Icon name="close-circle" size={nw(18)} color={PALETTE.subtle} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSearchSubmit}>
            <Feather name="sliders" size={nw(18)} color={PALETTE.primary} />
          </TouchableOpacity>
        )}
      </View>
      <SortSelector selected={sortOption} onChange={setSortOption} />
      {errorMessage ? (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={nw(18)} color={COLORS.redEA4335} />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      ) : null}
    </View>
  ), [heroCommunity, loading, communities.length, metrics, searchText, sortOption, errorMessage, handleSearchSubmit, handleClearSearch, navigation]);

  if (loading && !communities.length) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
        <FlatList
          data={[1, 2, 3, 4]}
          keyExtractor={(item) => `skeleton-${item}`}
          renderItem={() => <SkeletonCard />}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={PALETTE.background} />
      <FlatList
        data={listData}
        keyExtractor={(item, index) => (getCommunityId(item) || `community-${index}`).toString()}
        renderItem={({item}) => (
          <CommunityCard
            community={item}
            onPress={(community) => {
              const communityId = getCommunityId(community);
              if (communityId) {
                navigation.navigate(Routes.CommunityDetail, {communityId});
              }
            }}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          !loading && !loadingMore ? (
            <EmptyState
              title={searchApplied ? 'No communities match this search' : 'No communities yet'}
              subtitle={
                searchApplied
                  ? 'Try a different keyword or clear the search to see all communities.'
                  : 'Be the first to create a community and bring students together!'
              }
              showCreateButton={!searchApplied}
              onCreatePress={() => navigation.navigate('CreateCommunity')}
            />
          ) : null
        }
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={PALETTE.primary} />}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.6}
        ListFooterComponent={loadingMore ? <ActivityIndicator size="small" color={PALETTE.primary} style={styles.footerLoader} /> : null}
        contentContainerStyle={styles.listContent}
      />
      
      {/* Floating Action Button */}
      <FloatingActionButton 
        onPress={() => navigation.navigate('CreateCommunity')}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: PALETTE.background,
  },
  listContent: {
    paddingBottom: nh(32),
  },
  heroGradient: {
    marginHorizontal: nw(20),
    marginTop: nh(16),
    borderRadius: nw(24),
    paddingHorizontal: nw(20),
    paddingVertical: nh(22),
  },
  heroPill: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.whiteFFFFFF + '1A',
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(14),
    marginBottom: nh(10),
  },
  heroPillText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(11),
    fontWeight: '600',
  },
  heroTitle: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(22),
    fontWeight: '700',
    marginBottom: nh(10),
  },
  heroSubtitle: {
    color: COLORS.whiteFFFFFF + 'CC',
    fontSize: nw(12),
    lineHeight: nh(18),
    marginBottom: nh(18),
  },
  heroStatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(10),
    marginBottom: nh(18),
  },
  heroStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF + '22',
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderRadius: nw(16),
  },
  heroStatLabel: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(12),
    marginLeft: nw(6),
  },
  heroButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: COLORS.whiteFFFFFF + '20',
    paddingHorizontal: nw(16),
    paddingVertical: nh(10),
    borderRadius: nw(16),
    gap: nw(6),
  },
  heroButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(12),
    fontWeight: '600',
  },
  statsStrip: {
    marginHorizontal: nw(20),
    marginTop: nh(18),
    marginBottom: nh(16),
    borderRadius: nw(18),
    backgroundColor: PALETTE.card,
    borderWidth: 1,
    borderColor: PALETTE.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: nh(14),
    paddingHorizontal: nw(16),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: PALETTE.primary,
    fontSize: nw(16),
    fontWeight: '700',
  },
  statLabel: {
    color: PALETTE.muted,
    fontSize: nw(11),
    marginTop: nh(4),
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: PALETTE.border,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.card,
    borderRadius: nw(18),
    borderWidth: 1,
    borderColor: PALETTE.border,
    marginHorizontal: nw(20),
    paddingHorizontal: nw(16),
    paddingVertical: nh(10),
    gap: nw(10),
  },
  searchInput: {
    flex: 1,
    fontSize: nw(13),
    color: PALETTE.primary,
  },
  sortRow: {
    marginHorizontal: nw(20),
    marginTop: nh(14),
    marginBottom: nh(4),
  },
  sortLabel: {
    color: PALETTE.muted,
    fontSize: nw(12),
    marginBottom: nh(8),
  },
  sortChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(10),
  },
  sortChip: {
    paddingHorizontal: nw(14),
    paddingVertical: nh(8),
    borderRadius: nw(16),
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.card,
  },
  sortChipActive: {
    backgroundColor: PALETTE.primary,
    borderColor: PALETTE.primary,
  },
  sortChipText: {
    fontSize: nw(12),
    color: PALETTE.primary,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: COLORS.whiteFFFFFF,
  },
  errorBanner: {
    marginHorizontal: nw(20),
    marginTop: nh(12),
    borderRadius: nw(16),
    backgroundColor: COLORS.redEA4335 + '12',
    borderWidth: 1,
    borderColor: COLORS.redEA4335 + '40',
    paddingHorizontal: nw(14),
    paddingVertical: nh(12),
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(10),
  },
  errorText: {
    color: COLORS.redEA4335,
    fontSize: nw(12),
    flex: 1,
  },
  communityCard: {
    marginHorizontal: nw(20),
    marginTop: nh(16),
    backgroundColor: PALETTE.card,
    borderRadius: nw(20),
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: nw(18),
    paddingVertical: nh(18),
    shadowColor: '#132E4D',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  communityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(12),
  },
  communityAvatar: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(12),
    backgroundColor: COLORS.blue043142_light,
    alignItems: 'center',
    justifyContent: 'center',
  },
  communityHeaderText: {
    flex: 1,
    marginLeft: nw(12),
  },
  communityName: {
    fontSize: nw(16),
    fontWeight: '700',
    color: PALETTE.primary,
  },
  communityLabel: {
    marginTop: nh(4),
    fontSize: nw(12),
    color: PALETTE.muted,
  },
  communitySummary: {
    fontSize: nw(12),
    color: PALETTE.muted,
    lineHeight: nh(18),
    marginBottom: nh(14),
  },
  communityMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: nw(6),
  },
  communityMetaText: {
    fontSize: nw(11),
    color: PALETTE.primary,
  },
  metaSeparator: {
    width: 1,
    height: nh(12),
    backgroundColor: PALETTE.border,
    marginHorizontal: nw(4),
  },
  skeletonCard: {
    marginHorizontal: nw(20),
    marginTop: nh(16),
    backgroundColor: PALETTE.card,
    borderRadius: nw(20),
    borderWidth: 1,
    borderColor: PALETTE.border,
    paddingHorizontal: nw(18),
    paddingVertical: nh(18),
  },
  skeletonLineWide: {
    height: nh(18),
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: nw(8),
    marginBottom: nh(12),
  },
  skeletonLine: {
    height: nh(14),
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: nw(8),
    marginBottom: nh(10),
  },
  emptyState: {
    marginHorizontal: nw(20),
    marginTop: nh(60),
    alignItems: 'center',
    gap: nh(12),
  },
  emptyTitle: {
    fontSize: nw(16),
    fontWeight: '700',
    color: PALETTE.primary,
  },
  emptySubtitle: {
    fontSize: nw(12),
    color: PALETTE.muted,
    textAlign: 'center',
    lineHeight: nh(18),
    paddingHorizontal: nw(20),
  },
  emptyCreateButton: {
    marginTop: nh(16),
    paddingHorizontal: nw(24),
    paddingVertical: nh(12),
    backgroundColor: PALETTE.primary,
    borderRadius: nw(18),
  },
  emptyCreateButtonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: nw(13),
    fontWeight: '600',
  },
  footerLoader: {
    marginTop: nh(12),
  },
  // Floating Action Button styles
  fab: {
    position: 'absolute',
    bottom: nh(24),
    right: nw(20),
    width: nw(56),
    height: nw(56),
    borderRadius: nw(28),
    shadowColor: '#132E4D',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: nw(28),
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CommunityDiscovery;