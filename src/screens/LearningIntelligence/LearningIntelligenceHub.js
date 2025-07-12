import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

// Components & Services
import Text from '../../components/Text';
import Header from '../../components/Header';
import {COLORS} from '../../helper/colors';

// Import existing tab components
import FocusAreasTab from './tabs/FocusAreasTab';
import KnowledgeVaultTab from './tabs/KnowledgeVaultTab';
import AnalyticsTab from './tabs/AnalyticsTab';
import mixpanel from '../../helper/mixpanelClient';

const {width, height} = Dimensions.get('window');
const nw = percentage => (width * percentage) / 100;
const nh = percentage => (height * percentage) / 100;

// Enhanced Skeleton Loading Component
const SkeletonLoader = ({type = 'focus'}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const renderFocusAreasSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Quota Card Skeleton */}
      <Animated.View
        style={[styles.skeletonCard, styles.quotaCardSkeleton, {opacity}]}>
        <View style={styles.skeletonRow}>
          <View style={styles.skeletonCircle} />
          <View style={styles.skeletonTextLong} />
        </View>
        <View style={styles.skeletonProgressBar} />
      </Animated.View>

      {/* Area Cards Skeleton */}
      {[1, 2, 3].map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.skeletonCard,
            styles.areaCardSkeleton,
            {opacity, marginTop: 12},
          ]}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonTextMedium} />
            <View style={styles.skeletonBadge} />
          </View>
          <View style={styles.skeletonTextShort} />
          <View style={styles.skeletonStatsRow}>
            <View style={styles.skeletonStat} />
            <View style={styles.skeletonStat} />
            <View style={styles.skeletonStat} />
          </View>
          <View style={styles.skeletonButton} />
        </Animated.View>
      ))}
    </View>
  );

  const renderKnowledgeVaultSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Stats Skeleton */}
      <Animated.View style={[styles.skeletonCard, {opacity}]}>
        <View style={styles.skeletonStatsGrid}>
          {[1, 2, 3, 4].map((_, index) => (
            <View key={index} style={styles.skeletonStatCard}>
              <View style={styles.skeletonCircle} />
              <View style={styles.skeletonTextShort} />
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Search Bar Skeleton */}
      <Animated.View style={[styles.skeletonSearchBar, {opacity}]} />

      {/* Explanation Cards Skeleton */}
      {[1, 2].map((_, index) => (
        <Animated.View
          key={index}
          style={[
            styles.skeletonCard,
            styles.explanationCardSkeleton,
            {opacity},
          ]}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonTextMedium} />
            <View style={styles.skeletonCircle} />
          </View>
          <View style={styles.skeletonTextLong} />
          <View style={styles.skeletonTextShort} />
        </Animated.View>
      ))}
    </View>
  );

  const renderAnalyticsSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Stats Overview Skeleton */}
      <Animated.View style={[styles.skeletonCard, {opacity}]}>
        <View style={styles.skeletonStatsGrid}>
          {[1, 2, 3, 4].map((_, index) => (
            <View key={index} style={styles.skeletonStatCard}>
              <View style={styles.skeletonCircle} />
              <View style={styles.skeletonTextShort} />
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Sections Skeleton */}
      {[1, 2, 3].map((_, index) => (
        <Animated.View
          key={index}
          style={[styles.skeletonCard, {opacity, marginTop: 12}]}>
          <View style={styles.skeletonRow}>
            <View style={styles.skeletonTextMedium} />
            <View style={styles.skeletonTextShort} />
          </View>
          {[1, 2, 3].map((_, itemIndex) => (
            <View key={itemIndex} style={styles.skeletonListItem}>
              <View style={styles.skeletonCircle} />
              <View style={styles.skeletonTextLong} />
            </View>
          ))}
        </Animated.View>
      ))}
    </View>
  );

  switch (type) {
    case 'focus':
      return renderFocusAreasSkeleton();
    case 'vault':
      return renderKnowledgeVaultSkeleton();
    case 'analytics':
      return renderAnalyticsSkeleton();
    default:
      return renderFocusAreasSkeleton();
  }
};

// Tab Button Component with enhanced feedback
const TabButton = ({title, icon, isActive, onPress, index, isLoading}) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.95)).current;
  const fadeAnim = useRef(new Animated.Value(isActive ? 1 : 0.7)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isActive ? 1 : 0.95,
        tension: 150,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: isActive ? 1 : 0.7,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isActive]);

  useEffect(() => {
    if (isLoading && isActive) {
      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      spinAnim.setValue(0);
    }
  }, [isLoading, isActive]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getIconName = () => {
    switch (icon) {
      case 'focus':
        return 'locate';
      case 'vault':
        return 'library';
      case 'analytics':
        return 'analytics';
      default:
        return 'help-circle';
    }
  };

  return (
    <TouchableOpacity
      style={styles.tabButton}
      onPress={onPress}
      activeOpacity={0.8}
      disabled={isLoading}>
      <Animated.View
        style={[
          styles.tabButtonContent,
          {
            transform: [{scale: scaleAnim}],
            opacity: fadeAnim,
          },
        ]}>
        {isActive && (
          <LinearGradient
            colors={['rgba(4,49,66,0.1)', 'rgba(4,49,66,0.05)']}
            style={styles.activeTabBackground}
          />
        )}

        {isLoading && isActive ? (
          <Animated.View style={{transform: [{rotate: spin}]}}>
            <Ionicons name="refresh" size={20} color={COLORS.blue043142} />
          </Animated.View>
        ) : (
          <Ionicons
            name={getIconName()}
            size={20}
            color={isActive ? COLORS.blue043142 : COLORS.grey777777}
          />
        )}

        <Text
          variant={isActive ? 'semibold12' : 'regular12'}
          color={isActive ? COLORS.blue043142 : COLORS.grey777777}
          style={styles.tabButtonText}>
          {title}
        </Text>
        {isActive && <View style={styles.activeIndicator} />}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Enhanced Tab Content Container
const TabContentContainer = ({children, isLoading, tabType}) => {
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  return (
    <Animated.View
      style={[
        styles.tabContentContainer,
        {
          opacity: fadeAnim,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
      ]}
      pointerEvents={isVisible ? 'auto' : 'none'}>
      {isLoading ? (
        <SkeletonLoader type={tabType} />
      ) : (
        <Animated.View style={[{flex: 1}, {opacity: fadeAnim}]}>
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const LearningIntelligenceHub = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState(0);
  const [loadingStates, setLoadingStates] = useState({
    0: false, // Focus Areas
    1: false, // Knowledge Vault
    2: false, // Analytics
  });
  const [tabsInitialized, setTabsInitialized] = useState({
    0: false,
    1: false,
    2: false,
  });
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  const tabs = [
    {
      title: 'Focus Areas',
      icon: 'focus',
      component: FocusAreasTab,
      type: 'focus',
    },
    {
      title: 'Knowledge Vault',
      icon: 'vault',
      component: KnowledgeVaultTab,
      type: 'vault',
    },
    {
      title: 'Analytics',
      icon: 'analytics',
      component: AnalyticsTab,
      type: 'analytics',
    },
  ];

  // Entrance animation
  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Don't reset to first tab if user was already on this screen
      // Just ensure the current tab is properly initialized
      if (!tabsInitialized[activeTab]) {
        setLoadingStates(prev => ({...prev, [activeTab]: true}));

        // Simulate initialization delay for better UX
        const timer = setTimeout(() => {
          setLoadingStates(prev => ({...prev, [activeTab]: false}));
          setTabsInitialized(prev => ({...prev, [activeTab]: true}));
        }, 1000); // Reduced from potential longer loading

        return () => clearTimeout(timer);
      }
    }, [activeTab, tabsInitialized]),
  );

  const handleTabPress = index => {
    if (index === activeTab || loadingStates[index]) return;

    // Immediate tab switch
    setActiveTab(index);

    // Animate tab transition
    Animated.timing(slideAnim, {
      toValue: index,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Initialize tab if not already done
    if (!tabsInitialized[index]) {
      setLoadingStates(prev => ({...prev, [index]: true}));

      // Simulate loading time (you can adjust this based on actual API calls)
      const timer = setTimeout(() => {
        setLoadingStates(prev => ({...prev, [index]: false}));
        setTabsInitialized(prev => ({...prev, [index]: true}));
      }, 800);
    }
  };

  // Render all tabs but only show the active one
  const renderAllTabs = () => {
    return tabs.map((tab, index) => {
      const Component = tab.component;
      const isVisible = activeTab === index;
      const isLoading = loadingStates[index];
      const isInitialized = tabsInitialized[index];

      return (
        <TabContentContainer
          key={index}
          isVisible={isVisible}
          isLoading={isLoading}
          tabType={tab.type}
          tabIndex={index}>
          {isInitialized && <Component />}
        </TabContentContainer>
      );
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title="🧠 Learning Intelligence" />

      {/* Enhanced Tab Navigation */}
      <Animated.View
        style={[
          styles.tabContainer,
          {
            opacity: mountAnim,
            transform: [
              {
                translateY: mountAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0],
                }),
              },
            ],
          },
        ]}>
        <View style={styles.tabWrapper}>
          {tabs.map((tab, index) => (
            <TabButton
              key={index}
              title={tab.title}
              icon={tab.icon}
              isActive={activeTab === index}
              isLoading={loadingStates[index]}
              onPress={() => {
                mixpanel.track(`Click on tab ${tab?.title}`);
                handleTabPress(index);
              }}
              index={index}
            />
          ))}
        </View>

        {/* Loading Indicator */}
        {Object.values(loadingStates).some(loading => loading) && (
          <View style={styles.globalLoadingIndicator}>
            <View style={styles.loadingDot} />
            <Text
              variant="regular11"
              color={COLORS.blue043142}
              style={{marginLeft: 6}}>
              Loading insights...
            </Text>
          </View>
        )}
      </Animated.View>

      {/* Enhanced Tab Content */}
      <Animated.View
        style={[
          styles.tabContent,
          {
            opacity: mountAnim,
            transform: [
              {
                translateY: mountAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, 0],
                }),
              },
            ],
          },
        ]}>
        {renderAllTabs()}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  tabContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  tabWrapper: {
    flexDirection: 'row',
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
  },
  tabButtonContent: {
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    position: 'relative',
  },
  activeTabBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
  },
  tabButtonText: {
    marginTop: 4,
    textAlign: 'center',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -12,
    left: '50%',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.blue043142,
    transform: [{translateX: -2}],
  },
  globalLoadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  loadingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.blue043142,
  },
  tabContent: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
  },
  tabContentContainer: {
    flex: 1,
  },

  // Skeleton Styles
  skeletonContainer: {
    flex: 1,
    padding: 16,
  },
  skeletonCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  quotaCardSkeleton: {
    height: 120,
  },
  areaCardSkeleton: {
    height: 160,
  },
  explanationCardSkeleton: {
    height: 140,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  skeletonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.greyEEEEEE,
  },
  skeletonTextLong: {
    height: 16,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 8,
    flex: 1,
    marginLeft: 12,
  },
  skeletonTextMedium: {
    height: 16,
    width: '60%',
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 8,
  },
  skeletonTextShort: {
    height: 14,
    width: '40%',
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 7,
    marginBottom: 8,
  },
  skeletonBadge: {
    height: 24,
    width: 60,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 12,
  },
  skeletonProgressBar: {
    height: 6,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 3,
    marginTop: 16,
  },
  skeletonStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 12,
  },
  skeletonStat: {
    width: '28%',
    height: 40,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 8,
  },
  skeletonButton: {
    height: 36,
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: 8,
    marginTop: 8,
  },
  skeletonStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skeletonStatCard: {
    width: '48%',
    alignItems: 'center',
    padding: 12,
  },
  skeletonSearchBar: {
    height: 44,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  skeletonListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
});

export default LearningIntelligenceHub;
