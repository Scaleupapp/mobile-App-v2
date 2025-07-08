//@ts-nocheck
import React, {useCallback, useEffect, useState, useRef} from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  FlatList,
  SafeAreaView,
  ImageBackground,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Keyboard,
} from 'react-native';
import {useDispatch} from 'react-redux'; // Assuming still needed for other parts of your app
import {
  followUser,
  globalSearch,
  unlfollowUser,
} from '../../services/apiService';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header'; // Assuming this is your custom Header
import {icons} from '../../assets/icons'; // Assuming icons.search and icons.close are available
import Text from '../../components/Text'; // Assuming this is your custom Text component
import {navigationRef} from '../../../App';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';
import {debounce} from '../../helper/commonFunctions';
import mixpanel from '../../helper/mixpanelClient';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Simple Search Icon (relies on icons.search from assets/icons)
const SearchIcon = ({size = nw(20), color = COLORS.grey777777}) => (
  <Image
    source={icons.search}
    style={{width: size, height: size, tintColor: color, marginRight: nw(10)}}
    resizeMode="contain"
  />
);
// Simple Clear Icon (relies on icons.close from assets/icons)
const ClearIcon = ({size = nw(18), color = COLORS.grey777777, onPress}) => (
  <TouchableOpacity onPress={onPress} style={{padding: nw(5)}}>
    <Image
      source={icons.close}
      style={{width: size, height: size, tintColor: color}}
      resizeMode="contain"
    />
  </TouchableOpacity>
);

const Search = () => {
  const {showToast} = useToast();
  const [searchResults, setSearchResults] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textInputRef = useRef(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async query => {
      if (query.length > 1) {
        setIsLoading(true);
        try {
          const res = await globalSearch({query});
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setSearchResults(res?.data || []);
        } catch (err) {
          console.log('Error during global search: ', err);
          setSearchResults([]);
          showToast({type: 'error', title: 'Search failed. Please try again.'});
        } finally {
          setIsLoading(false);
        }
      } else {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setSearchResults([]);
      }
    }, 500), // 500ms debounce delay
    [],
  );

  useEffect(() => {
    mixpanel.track('Landed on Search Page');
  }, []);

  useEffect(() => {
    debouncedSearch(searchText);
  }, [searchText, debouncedSearch]);

  const handleInputChange = text => {
    setSearchText(text);
  };

  const clearSearch = () => {
    setSearchText('');
    setSearchResults([]);
    if (textInputRef.current) {
      textInputRef.current.clear();
    }
    Keyboard.dismiss();
  };

  const navigateToUserProfile = userId => {
    navigationRef.navigate(Routes.OtherProfile, {
      id: userId,
    });
  };

  const handleFollowToggle = async userToToggle => {
    const originalUser = searchResults.find(
      u => u.userId === userToToggle.userId,
    );
    if (!originalUser) return;

    // Optimistic UI update
    const updatedResults = searchResults.map(user =>
      user.userId === userToToggle.userId
        ? {
            ...user,
            isFollowing: !user.isFollowing, // Toggle follow state
            followersCount: user.isFollowing
              ? Math.max(0, (user.followersCount || 0) - 1)
              : (user.followersCount || 0) + 1,
          } // Adjust follower count
        : user,
    );
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSearchResults(updatedResults);

    try {
      let response;
      if (originalUser.isFollowing) {
        response = await unlfollowUser(userToToggle.userId);
      } else {
        response = await followUser(userToToggle.userId);
      }
      showToast({
        type: 'success',
        title:
          response?.data?.message ||
          (originalUser.isFollowing ? 'Unfollowed' : 'Followed'),
      });
    } catch (error) {
      console.error('Follow/Unfollow error:', error);
      showToast({type: 'error', title: 'Action failed. Please try again.'});
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      debouncedSearch(searchText);
    }
  };

  const UserCard = ({item, index}) => {
    const isLastItem = index === searchResults.length - 1;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => navigateToUserProfile(item?.userId)}
        style={[styles.userCardContainer, isLastItem && styles.lastUserCard]}>
        <View style={styles.userCardLeft}>
          {item?.profilePicture ? (
            <Image
              resizeMode="cover"
              style={styles.profileImage}
              source={{uri: item?.profilePicture}}
              onError={e =>
                console.log('Failed to load image', e.nativeEvent.error)
              }
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileInitial}>
                {`${item?.firstname?.charAt(0) || ''}${
                  item?.lastname?.charAt(0) || ''
                }`.toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userInfo}>
            <View style={styles.usernameRow}>
              <Text style={styles.usernameText} numberOfLines={1}>
                {item?.username || 'Unknown User'}
              </Text>
              {item?.role === 'SME' && (
                <Image
                  resizeMode="contain"
                  tintColor={COLORS.yellowF5BE00}
                  source={require('../../assets/icons/medal-star.png')}
                  style={styles.smeMedal}
                />
              )}
            </View>
            <Text style={styles.fullNameText} numberOfLines={1}>
              {`${item?.firstname || ''} ${item?.lastname || ''}`.trim() ||
                'No name'}
            </Text>
            <View style={styles.statsRow}>
              <Text style={styles.statText}>{item?.totalPosts || 0} Posts</Text>
              <Text style={styles.statText}>·</Text>
              <Text style={styles.statText}>
                {item?.followersCount || 0} Followers
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.followButton,
            item?.isFollowing
              ? styles.unfollowButton
              : styles.followButtonActive,
          ]}
          onPress={() => handleFollowToggle(item)}>
          <Text
            style={[
              styles.followButtonText,
              item?.isFollowing
                ? styles.unfollowButtonText
                : styles.followButtonActiveText,
            ]}>
            {item?.isFollowing ? 'Unfollow' : 'Follow'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderListEmptyComponent = () => {
    if (isLoading && searchText.length > 1 && searchResults.length === 0)
      return null;

    if (searchText.length > 1 && searchResults.length === 0 && !isLoading) {
      return (
        <View style={styles.emptyStateContainer}>
          {/* <Image source={require('../../assets/icons/search-big.png')} style={styles.emptyStateIcon} /> Removed */}
          <Text
            style={[styles.emptyStateIconPlaceholder, {marginBottom: nh(20)}]}>
            🤔
          </Text>
          <Text style={styles.emptyStateTitle}>No Results Found</Text>
          <Text style={styles.emptyStateSubtitle}>
            No users matched "{searchText}". Try a different search.
          </Text>
        </View>
      );
    }
    if (searchText.length === 0 && !isLoading) {
      return (
        <View style={styles.emptyStateContainer}>
          {/* <Image source={require('../../assets/icons/search-users.png')} style={styles.emptyStateIcon} /> Removed */}
          <Text
            style={[styles.emptyStateIconPlaceholder, {marginBottom: nh(20)}]}>
            👥
          </Text>
          <Text style={styles.emptyStateTitle}>Search for People</Text>
          <Text style={styles.emptyStateSubtitle}>
            Find friends, creators, and interesting accounts.
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.whiteFFFFFF} />

      <View style={styles.searchContainer}>
        <View
          style={[
            styles.textInputContainer,
            isFocused && styles.textInputContainerFocused,
          ]}>
          <SearchIcon />
          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder="Search for users..."
            placeholderTextColor={COLORS.grey999999}
            value={searchText}
            onChangeText={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchText.length > 0 && <ClearIcon onPress={clearSearch} />}
        </View>
      </View>

      {isLoading && searchText.length > 1 && searchResults.length === 0 && (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      <FlatList
        data={searchResults}
        renderItem={UserCard}
        keyExtractor={item => item.userId.toString()}
        contentContainerStyle={styles.listContentContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderListEmptyComponent}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  searchContainer: {
    paddingHorizontal: nw(16),
    paddingTop: nh(15),
    paddingBottom: nh(10),
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyD6D6D6,
  },
  textInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyD6D6D6_light,
    borderRadius: nw(12),
    paddingHorizontal: nw(12),
    height: nh(48),
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6_light,
  },
  textInputContainerFocused: {
    borderColor: COLORS.blue043142,
  },
  textInput: {
    flex: 1,
    fontSize: nw(15),
    color: COLORS.black333333,
    marginLeft: nw(5),
    height: '100%',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: nh(20),
  },
  loadingText: {
    marginTop: nh(10),
    fontSize: nw(14),
    color: COLORS.grey777777,
  },
  listContentContainer: {
    paddingHorizontal: nw(16),
    paddingTop: nh(10),
    paddingBottom: nh(20),
    flexGrow: 1,
  },
  userCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: nh(12),
    backgroundColor: COLORS.whiteFFFFFF,
    marginBottom: nh(12),
    borderRadius: nw(10),
    paddingHorizontal: nw(12),
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  lastUserCard: {
    // No specific style needed if marginBottom handles spacing
  },
  userCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: nw(10),
  },
  profileImage: {
    width: nw(50),
    height: nw(50),
    borderRadius: nw(25),
    backgroundColor: COLORS.greyD6D6D6,
  },
  profileImagePlaceholder: {
    width: nw(50),
    height: nw(50),
    borderRadius: nw(25),
    backgroundColor: COLORS.greyBBBBBB,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: nw(18),
    color: COLORS.whiteFFFFFF,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: nw(12),
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameText: {
    fontSize: nw(15),
    fontWeight: 'bold',
    color: COLORS.black333333,
  },
  smeMedal: {
    width: nw(16),
    height: nw(16),
    marginLeft: nw(5),
  },
  fullNameText: {
    fontSize: nw(13),
    color: COLORS.grey777777,
    marginTop: nh(2),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(4),
  },
  statText: {
    fontSize: nw(11.5),
    color: COLORS.grey777777,
    marginRight: nw(6),
  },
  followButton: {
    paddingHorizontal: nw(15),
    paddingVertical: nh(8),
    borderRadius: nw(8),
    minWidth: nw(85),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  followButtonActive: {
    backgroundColor: COLORS.blue043142,
    borderColor: COLORS.blue043142,
  },
  unfollowButton: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderColor: COLORS.greyBBBBBB,
  },
  followButtonText: {
    fontSize: nw(13),
    fontWeight: 'bold',
  },
  followButtonActiveText: {
    color: COLORS.whiteFFFFFF,
  },
  unfollowButtonText: {
    color: COLORS.black333333,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: nw(20),
  },
  emptyStateIconPlaceholder: {
    // Style for the emoji placeholder
    fontSize: nw(50), // Adjust size as needed
    // No specific color needed for emoji unless you want to wrap it
  },
  emptyStateTitle: {
    fontSize: nw(18),
    fontWeight: 'bold',
    color: COLORS.black333333,
    textAlign: 'center',
    marginBottom: nh(8),
  },
  emptyStateSubtitle: {
    fontSize: nw(14),
    color: COLORS.grey777777,
    textAlign: 'center',
    lineHeight: nw(20),
  },
});

// Ensure you have these icons in your assets/icons folder or update paths:
// - icons.search (defined in your assets/icons.js or similar)
// - icons.close (defined in your assets/icons.js or similar)
// - medal-star.png (SME badge)
// Note: search-big.png and search-users.png have been removed from this list.

// Add to helper/colors.js if not already present:
// export const COLORS = {
//   ...
//   greyD6D6D6_light: '#F5F5F5', // A very light grey, suitable for input backgrounds
// };

export default Search;
