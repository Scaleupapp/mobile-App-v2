//@ts-nocheck
import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  FlatList,
  ActivityIndicator,
  TouchableOpacity, // Added for touchable icons
  LayoutAnimation, // Added for animations
  UIManager, // Added for LayoutAnimation on Android
  Platform, // Added for Platform specific checks
  Alert, // Added for confirmation dialog
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header'; // Assuming this is your custom Header
import {images} from '../../assets/images'; // For empty state image
import Text from '../../components/Text'; // Assuming this is your custom Text component
import Button from '../../components/Button'; // Assuming this is your custom Button
import Icon from 'react-native-vector-icons/Ionicons'; // Using Ionicons
import {
  // acceptInnerCircleRequestAPI, // Not used on this page
  declineInnerCircleRequestAPI, // This is effectively "remove" from inner circle
  myInnerCircleAPI,
  // myInnerCircleRequestAPI, // Not used on this page
} from '../../services/apiService';
import Routes from '../../helper/routes';
import LinearGradient from 'react-native-linear-gradient'; // For beautiful backgrounds

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const InnerCircle = ({navigation, route}) => {
  const [innerCircleMembers, setInnerCircleMembers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchInnerCircleList = async () => {
    setIsLoading(true); // Ensure loader is shown during refetch
    try {
      const resp = await myInnerCircleAPI();
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInnerCircleMembers(resp?.data || []);
    } catch (error) {
      console.log('Error fetching inner circle list:', error.response?.data || error.message);
      // Optionally show a toast message for the error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
        fetchInnerCircleList(); // Refetch when screen comes into focus
    });
    return unsubscribe;
  }, [navigation]);


  const confirmRemoveUser = (userId, username) => {
    Alert.alert(
      "Remove User",
      `Are you sure you want to remove ${username} from your Inner Circle?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Remove", 
          onPress: () => handleRemoveUser(userId),
          style: "destructive"
        }
      ]
    );
  };

  const handleRemoveUser = async (userIdToRemove) => {
    try {
      // Optimistic UI update
      const previousMembers = [...innerCircleMembers];
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setInnerCircleMembers(prevMembers =>
        prevMembers.filter(user => user.userId !== userIdToRemove),
      );

      const payload = {
        targetUserId: userIdToRemove,
      };
      // API call to "decline" which acts as "remove" in this context
      await declineInnerCircleRequestAPI(payload); 
      // No need to refetch if optimistic update is successful and API confirms
      // showToast({ type: 'success', title: 'User removed' }); // If you have a toast component
    } catch (error) {
      console.log('Error removing user:', error.response?.data || error.message);
      // Revert UI update if API call fails
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      // setInnerCircleMembers(previousMembers); // Revert to previous state
      // Forcing a refetch might be safer to ensure data consistency after an error
      fetchInnerCircleList(); 
      // showToast({ type: 'error', title: 'Failed to remove user' });
    }
  };

  const renderMemberCard = ({item}) => {
    const initial = item?.username ? item.username[0].toUpperCase() : '?';
    return (
      <View style={styles.memberCard}>
        <View style={styles.memberInfoContainer}>
          {item?.profilePicture ? (
            <Image
              source={{uri: item.profilePicture}}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileInitial}>{initial}</Text>
            </View>
          )}
          <View style={styles.memberTextContainer}>
            <Text style={styles.memberName} numberOfLines={1}>
              {item?.username || 'Unknown User'}
            </Text>
            {/* Add designation or other info if available and desired */}
            {/* <Text style={styles.memberDetail} numberOfLines={1}>
              {item?.designation || 'Community Member'}
            </Text> */}
          </View>
        </View>
        <TouchableOpacity 
          style={styles.removeButton}
          onPress={() => confirmRemoveUser(item?.userId, item?.username)}
          activeOpacity={0.7}
        >
          <Icon name="person-remove-outline" size={nw(20)} color={COLORS.redEA4335} />
          <Text style={styles.removeButtonText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={[COLORS.yellowF5BE00_light, COLORS.yellowF5BE00]} style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color={COLORS.blue043142} />
        <Text style={styles.loadingText}>Loading Your Inner Circle...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.yellowF5BE00_light, COLORS.yellowF5BE00]} style={styles.safeAreaContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <Header
        title="Inner Circle"
        style={styles.header}
        titleStyle={styles.headerTitle}
        rightElement={ // Custom right element for the icon button
            <TouchableOpacity 
                onPress={() => navigation.navigate(Routes.InnerCircleRequest)}
                style={styles.headerIconButton}
            >
                <Icon name="people-circle-outline" size={nw(28)} color={COLORS.blue043142} />
            </TouchableOpacity>
        }
        // No back icon by default unless specified by onBackPress
      />

      {innerCircleMembers?.length > 0 ? (
        <FlatList
          data={innerCircleMembers}
          renderItem={renderMemberCard}
          keyExtractor={item => item.userId.toString()}
          contentContainerStyle={styles.listContentContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <Image
            source={images.norequest} // Ensure this image is appropriate or replace
            resizeMode="contain"
            style={styles.emptyStateImage}
          />
          <Text style={styles.emptyStateTitle}>Your Inner Circle is Quiet</Text>
          <Text style={styles.emptyStateSubtitle}>
            It looks like there's no one here yet. Add members or check for pending requests to grow your circle!
          </Text>
          <Button
            text="View Requests"
            onPress={() => navigation.navigate(Routes.InnerCircleRequest)}
            style={styles.emptyStateButton}
            textStyle={styles.emptyStateButtonText}
            width={DEVICE_WIDTH * 0.6} // Make button wider
          />
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: 'transparent', // Header on gradient
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + nh(10) : nh(50), // Adjust for status bar
    paddingBottom: nh(15),
    borderBottomWidth: 0, // No border for cleaner look on gradient
    elevation: 0,
  },
  headerTitle: {
    color: COLORS.blue043142, // Dark title for light gradient
    fontWeight: 'bold',
    fontSize: nw(20),
  },
  headerIconButton: {
    padding: nw(8), // Make icon more tappable
    marginRight: nw(8), // Align with typical header spacing
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: nh(15),
    fontSize: nw(16),
    color: COLORS.blue043142,
    fontWeight: '500',
  },
  listContentContainer: {
    paddingHorizontal: nw(16),
    paddingTop: nh(10), // Space below header
    paddingBottom: nh(20),
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(15),
    marginBottom: nh(12),
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08, // Softer shadow
    shadowRadius: 6,
    elevation: 4,
  },
  memberInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Allow this to take up space before the button
    marginRight: nw(10),
  },
  profileImage: {
    width: nw(50),
    height: nw(50),
    borderRadius: nw(25), // Circular image
    borderWidth: 1.5,
    borderColor: COLORS.blue043142_light, // Subtle border
  },
  profileImagePlaceholder: {
    width: nw(50),
    height: nw(50),
    borderRadius: nw(25),
    backgroundColor: COLORS.blue043142, // Use primary blue for placeholder
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: nw(20),
    color: COLORS.whiteFFFFFF,
    fontWeight: 'bold',
  },
  memberTextContainer: {
    marginLeft: nw(12),
    flex: 1, // Allow text to take available space
  },
  memberName: {
    fontSize: nw(16),
    fontWeight: '600', // Semi-bold
    color: COLORS.black333333,
  },
  memberDetail: { // Optional: for designation or other info
    fontSize: nw(13),
    color: COLORS.grey777777,
    marginTop: nh(2),
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.redEA4335_light, // Lighter red for button background
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderRadius: nw(8),
    borderWidth: 1,
    borderColor: COLORS.redEA4335, // Red border
  },
  removeButtonText: {
    marginLeft: nw(5),
    fontSize: nw(13),
    color: COLORS.redEA4335, // Red text
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(30),
    paddingBottom: nh(50), // Push content up a bit
  },
  emptyStateImage: {
    width: DEVICE_WIDTH * 0.6,
    height: DEVICE_WIDTH * 0.5,
    marginBottom: nh(30),
    opacity: 0.8,
  },
  emptyStateTitle: {
    fontSize: nw(20),
    fontWeight: 'bold',
    color: COLORS.blue043142,
    textAlign: 'center',
    marginBottom: nh(12),
  },
  emptyStateSubtitle: {
    fontSize: nw(14.5),
    color: COLORS.grey777777,
    textAlign: 'center',
    lineHeight: nw(22),
    marginBottom: nh(30),
  },
  emptyStateButton: {
    backgroundColor: COLORS.blue043142, // Primary action color
    borderRadius: nw(25), // Pill shape
    paddingVertical: nh(12), // Adjust padding for better button size
  },
  emptyStateButtonText: {
    color: COLORS.whiteFFFFFF,
    fontWeight: 'bold',
    fontSize: nw(15),
  },
});

// Add to helper/colors.js if not present:
// export const COLORS = {
//   ...
//   yellowF5BE00_light: '#FFF9E6', // Or a preferred light yellow
//   blue043142_light: '#E0E8F0',   // Or a preferred light blue
//   redEA4335_light: '#FCE8E6',     // Or a preferred light red
// };

export default InnerCircle;
