import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  SafeAreaView,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {getTimeAgo} from '../../helper/commonFunctions';
import {COLORS} from '../../helper/colors';
import Header from '../../components/Header'; // Assuming this is a custom component
import {nh, nw} from '../../helper/scales';
import Text from '../../components/Text'; // Assuming this is a custom Text component
import {navigationRef} from '../../../App'; // Assuming global navigationRef
import Routes from '../../helper/routes';
import {UserAnalytics} from '../../services/apiService';

// Enable LayoutAnimation for Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Icon component (simple example, replace with your preferred icon library if available)
const Icon = ({name, size = 20, color = COLORS.blue043142}) => {
  // In a real app, you'd use an icon library like react-native-vector-icons
  let iconSymbol = '';
  if (name === 'chevron-down') iconSymbol = '▼';
  if (name === 'chevron-right') iconSymbol = '▶';
  if (name === 'users') iconSymbol = '👥'; // Example icon
  if (name === 'tags') iconSymbol = '🏷️'; // Example icon
  if (name === 'trending-up') iconSymbol = '📈'; // Example icon
  if (name === 'alert-circle') iconSymbol = '⚠️'; // Example icon


  return <Text style={{fontSize: size, color: color, marginRight: nw(8)}}>{iconSymbol}</Text>;
};


export const UserAnalyticsPerf = ({navigation}) => {
  const [data, setData] = useState(null); // Initialize with null to better distinguish from empty data
  const [expandedSections, setExpandedSections] = useState({
    activity: true,
    interests: true,
    areas: true,
  });
  const [showMore, setShowMore] = useState({
    activity: false,
    interests: false,
    areas: false, // Renamed from 'moreImp' for consistency
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    UserAnalytics()
      .then(res => {
        if (res && res.data) {
          setData(res.data);
        } else {
          setData({}); // Set to empty object if API returns unexpected structure
        }
        setIsLoading(false);
      })
      .catch(e => {
        console.log('🚀 ~ UserAnalyticsPerf ~ err:', e?.response?.data || e.message);
        setData({}); // Set to empty object on error to show "No data"
        setIsLoading(false);
        // Optionally show a toast message for the error
      });
  }, []);

  const toggleSection = useCallback((sectionKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections(prev => ({...prev, [sectionKey]: !prev[sectionKey]}));
    // Reset 'showMore' when collapsing a section
    if (expandedSections[sectionKey]) {
        setShowMore(prev => ({...prev, [sectionKey]: false}));
    }
  }, [expandedSections]);

  const toggleShowMore = useCallback((sectionKey) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShowMore(prev => ({...prev, [sectionKey]: !prev[sectionKey]}));
  }, []);


  const renderActivityItem = ({item}) => (
    <TouchableOpacity // Changed to TouchableOpacity for better feedback control
      style={styles.activityCard}
      activeOpacity={0.7}
      onPress={() =>
        navigationRef.navigate(Routes.OtherProfile, {
          id: item?.userId,
        })
      }>
      {item.profilePicture ? (
        <Image
          source={{uri: item.profilePicture}}
          style={styles.profilePicture}
          onError={() => console.log("Failed to load profile picture")} // Basic error handling
        />
      ) : (
        <View style={styles.placeholderPicture}>
          <Text style={styles.initial}>
            {item.username ? item.username[0].toUpperCase() : '?'}
          </Text>
        </View>
      )}
      <View style={styles.activityInfo}>
        <Text style={styles.username} numberOfLines={1}>{item.username || 'Unknown User'}</Text>
        <View style={styles.activityDetailRow}>
          <Text style={styles.activityLabel}>Last viewed: </Text>
          <Text style={styles.activityValue}>{getTimeAgo(item.timestamp)}</Text>
        </View>
        <View style={styles.activityDetailRow}>
          <Text style={styles.activityLabel}>Profile views: </Text>
          <Text style={styles.activityValue}>{item.count ?? 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderInterestTag = (interest, index, type = 'interest') => { // Added type for potential style variations
    const topic = interest?.interest || interest?.topic || 'N/A';
    const count = interest?.count;

    const calculateFontSize = (tagCount) => {
      const minFontSize = 14; // Base size
      const maxFontSize = 28; // Max size
      if (typeof tagCount !== 'number' || tagCount <= 0) {
        return minFontSize;
      }
      // Scale font size based on count, e.g., more views = larger font
      // This is a simple scaling, can be adjusted
      const scaledSize = minFontSize + Math.log2(tagCount + 1) * 2; // Logarithmic scaling for less extreme differences
      return Math.min(Math.max(scaledSize, minFontSize), maxFontSize);
    };

    const fontSize = calculateFontSize(count);

    return (
      <View key={index} style={[styles.interestTagChip, type === 'area' && styles.areaTagChip]}>
        <Text style={[styles.interestTagText, {fontSize: nh(fontSize)}]}>
          {topic}
        </Text>
        {count !== undefined && (
             <Text style={styles.interestTagCount}>{count}</Text>
        )}
      </View>
    );
  };

  const renderCollapsibleSection = (title, sectionKey, dataArray, renderItemFunction, iconName, itemLimit = 2) => {
    if (!dataArray || !Array.isArray(dataArray)) {
      // console.warn(`Data for section ${sectionKey} is not an array or is undefined.`);
      // return null; // Or render a specific message for this section
        if (sectionKey === 'areas' && (!dataArray || dataArray.length === 0)) {
            // Handled by the specific quiz prompt logic below
        } else {
            return (
                <View style={styles.sectionCard}>
                    <TouchableOpacity
                        style={styles.sectionHeader}
                        onPress={() => toggleSection(sectionKey)}
                        activeOpacity={0.8}>
                        <Icon name={iconName} size={nw(20)} color={COLORS.blue043142} />
                        <Text style={styles.heading}>{title}</Text>
                        <Icon name={expandedSections[sectionKey] ? 'chevron-down' : 'chevron-right'} size={nw(18)} color={COLORS.grey777777} />
                    </TouchableOpacity>
                    {expandedSections[sectionKey] && (
                        <Text style={styles.noDataInSectionText}>No data available for this section.</Text>
                    )}
                </View>
            );
        }
    }


    const displayData = showMore[sectionKey] ? dataArray : dataArray.slice(0, itemLimit);

    return (
      <View style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(sectionKey)}
          activeOpacity={0.8}>
          <Icon name={iconName} size={nw(20)} color={COLORS.blue043142} />
          <Text style={styles.heading}>{title}</Text>
          <Icon name={expandedSections[sectionKey] ? 'chevron-down' : 'chevron-right'} size={nw(18)} color={COLORS.grey777777} />
        </TouchableOpacity>

        {expandedSections[sectionKey] && (
          <>
            {sectionKey === 'activity' ? (
              <FlatList
                data={displayData}
                renderItem={renderActivityItem}
                keyExtractor={(_, index) => `${sectionKey}-${index}`}
                contentContainerStyle={styles.activityListContainer}
                scrollEnabled={false}
                ListEmptyComponent={<Text style={styles.noDataInSectionText}>No profile view activity yet.</Text>}
              />
            ) : (
              <View style={styles.tagsContainer}>
                {displayData.length > 0 ? 
                    displayData.map((item, index) => renderItemFunction(item, index, sectionKey === 'areas' ? 'area' : 'interest'))
                    : <Text style={styles.noDataInSectionText}>{sectionKey === 'interests' ? 'No interests data found.' : ''}</Text>
                }
              </View>
            )}
            {dataArray.length > itemLimit && (
              <TouchableOpacity
                onPress={() => toggleShowMore(sectionKey)}
                style={styles.showMoreButton}>
                <Text style={styles.showMoreButtonText}>
                  {showMore[sectionKey] ? 'Show Less' : `Show More (${dataArray.length - itemLimit} more)`}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };


  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeAreaLoading}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00}/>
        <Header title="Analytics & Performance" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text style={styles.loadingText}>Loading Analytics...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!data || Object.keys(data).length === 0) {
    return (
      <SafeAreaView style={styles.safeAreaEmpty}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <Header title="Analytics & Performance" />
        <View style={styles.emptyContainer}>
          <Icon name="alert-circle" size={nw(50)} color={COLORS.greyBBBBBB} />
          <Text style={styles.emptyText}>No Analytics Data Available</Text>
          <Text style={styles.emptySubText}>Check back later or ensure you have recent activity.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeAreaMain}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      <Header title="Analytics & Performance" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}>

        {renderCollapsibleSection('Profile Views', 'activity', data.activity, renderActivityItem, 'users', 2)}
        {renderCollapsibleSection('Interests', 'interests', data.interests, renderInterestTag, 'tags', 7)}

        {/* Areas of Improvement Section - Special Handling for Quiz Prompt */}
        <View style={styles.sectionCard}>
            <TouchableOpacity
            style={styles.sectionHeader}
            onPress={() => toggleSection('areas')}
            activeOpacity={0.8}>
            <Icon name="trending-up" size={nw(20)} color={COLORS.blue043142} />
            <Text style={styles.heading}>Areas of Improvement</Text>
            <Icon name={expandedSections['areas'] ? 'chevron-down' : 'chevron-right'} size={nw(18)} color={COLORS.grey777777} />
            </TouchableOpacity>

            {expandedSections['areas'] && (
            (!data.areasOfImprovement || data.areasOfImprovement.length === 0) ? (
                <View style={styles.quizPromptCard}>
                <Text style={styles.quizPromptMessage}>
                    No specific areas of improvement identified yet.
                </Text>
                <Text style={styles.quizPromptSubMessage}>
                    Participate in quizzes to evaluate your performance and get personalized feedback!
                </Text>
                <TouchableOpacity
                    style={styles.quizPromptButton}
                    onPress={() => navigation.navigate(Routes.QuizList)}>
                    <Text style={styles.quizPromptButtonText}>Explore Quizzes</Text>
                </TouchableOpacity>
                </View>
            ) : (
                <>
                <View style={styles.tagsContainer}>
                    {(showMore['areas']
                    ? data.areasOfImprovement
                    : data.areasOfImprovement.slice(0, 7)
                    ).map((item, index) => renderInterestTag(item, index, 'area'))}
                </View>
                {data.areasOfImprovement.length > 7 && (
                    <TouchableOpacity
                    onPress={() => toggleShowMore('areas')}
                    style={styles.showMoreButton}>
                    <Text style={styles.showMoreButtonText}>
                        {showMore['areas'] ? 'Show Less' : `Show More (${data.areasOfImprovement.length - 7} more)`}
                    </Text>
                    </TouchableOpacity>
                )}
                </>
            )
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaLoading: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  safeAreaEmpty: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  safeAreaMain: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00, // Theme color for status bar area
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF, // White background for loading content area
  },
  loadingText: {
    marginTop: nh(15),
    fontSize: nw(16),
    color: COLORS.grey777777,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: nw(20),
    backgroundColor: COLORS.whiteFFFFFF,
  },
  emptyText: {
    fontSize: nw(20),
    fontWeight: 'bold',
    color: COLORS.blue043142,
    marginTop: nh(15),
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: nw(14),
    color: COLORS.grey777777,
    marginTop: nh(8),
    textAlign: 'center',
    lineHeight: nw(20),
  },
  scrollView: {
    flex: 1,
    backgroundColor: COLORS.greyD6D6D6, // A very light grey for the scroll background
  },
  scrollViewContent: {
    padding: nw(16),
    paddingBottom: nh(30), // Ensure space at the bottom
  },
  sectionCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    marginBottom: nh(20),
    padding: nw(15),
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: nh(10), // Add padding if content is present
    borderBottomWidth: 0, // Remove border if section is collapsed initially, or add dynamically
  },
  heading: {
    flex: 1, // Allow heading to take available space
    fontSize: nw(18),
    fontWeight: 'bold',
    color: COLORS.blue043142, // Dark blue for headings
    marginLeft: nw(8), // Space after icon
  },
  activityListContainer: {
    paddingTop: nh(10),
  },
  activityCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF, // Card background
    borderRadius: nw(10),
    padding: nw(12),
    marginVertical: nh(6),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6, // Subtle border
  },
  profilePicture: {
    width: nw(50),
    height: nw(50),
    borderRadius: nw(25),
    marginRight: nw(12),
  },
  placeholderPicture: {
    width: nw(50),
    height: nw(50),
    borderRadius: nw(25),
    backgroundColor: COLORS.greyBBBBBB,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(12),
  },
  initial: {
    fontSize: nw(22),
    color: COLORS.whiteFFFFFF,
    fontWeight: 'bold',
  },
  activityInfo: {
    flex: 1, // Take remaining space
  },
  username: {
    fontSize: nw(16),
    fontWeight: '600', // Semi-bold
    color: COLORS.black333333,
    marginBottom: nh(3),
  },
  activityDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(2),
  },
  activityLabel: {
    fontSize: nw(12.5),
    color: COLORS.grey777777,
  },
  activityValue: {
    fontSize: nw(12.5),
    color: COLORS.black333333,
    fontWeight: '500',
  },
  showMoreButton: {
    alignSelf: 'center',
    backgroundColor: 'transparent', // Make it look like a link
    paddingVertical: nh(10),
    paddingHorizontal: nw(16),
    marginTop: nh(10),
  },
  showMoreButtonText: {
    color: COLORS.blue043142, // Use a prominent color for the link
    fontSize: nw(14),
    fontWeight: 'bold',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingTop: nh(10),
    justifyContent: 'center', // Center tags if they don't fill the row
  },
  interestTagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: nw(5),
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    backgroundColor: COLORS.yellowF5BE00_light, // A lighter shade of yellow
    borderRadius: nw(16), // Pill shape
    borderWidth: 1,
    borderColor: COLORS.yellowF5BE00,
  },
  areaTagChip: { // Slightly different style for areas of improvement
    backgroundColor: COLORS.blue043142_light, // A lighter shade of blue
    borderColor: COLORS.blue043142,
  },
  interestTagText: {
    // fontSize is dynamic
    color: COLORS.blue043142, // Dark text on light background
    fontWeight: '500',
  },
  interestTagCount: {
    marginLeft: nw(6),
    fontSize: nh(10),
    color: COLORS.blue043142,
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(4),
    paddingVertical: nw(1),
    borderRadius: nw(6),
    fontWeight: '600',
    opacity: 0.8,
  },
  quizPromptCard: {
    backgroundColor: COLORS.blue043142_light, // Light blue background
    borderRadius: nw(10),
    padding: nw(20),
    alignItems: 'center',
    marginTop: nh(10),
    borderWidth: 1,
    borderColor: COLORS.blue043142,
  },
  quizPromptMessage: {
    fontSize: nw(15),
    color: COLORS.blue043142, // Dark blue text
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: nh(8),
  },
  quizPromptSubMessage: {
    fontSize: nw(13),
    color: COLORS.grey333333, // Darker grey text
    textAlign: 'center',
    marginBottom: nh(20),
    lineHeight: nw(18),
  },
  quizPromptButton: {
    backgroundColor: COLORS.yellowF5BE00, // Yellow button
    paddingVertical: nh(12),
    paddingHorizontal: nw(30),
    borderRadius: nw(25), // Pill shape button
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  quizPromptButtonText: {
    color: COLORS.blue043142, // Dark blue text on yellow button
    fontSize: nw(15),
    fontWeight: 'bold',
  },
  noDataInSectionText: {
    textAlign: 'center',
    color: COLORS.grey777777,
    fontSize: nw(13),
    paddingVertical: nh(20),
    fontStyle: 'italic',
  },
  // Add light variants to your COLORS object if they don't exist:
  // COLORS.yellowF5BE00_light: '#FFF9E6',
  // COLORS.blue043142_light: '#E6F0F3',
});