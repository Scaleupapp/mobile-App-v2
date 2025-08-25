// =====================================================
// FIXED INTELLITEST ANALYTICS DASHBOARD
// File: screens/IntelliTest/IntelliTestAnalyticsDashboard.js
// Fixes: examId missing error & fetchAnalyticsData dependency issues
// =====================================================

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Modal,
  Animated,
  FlatList,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';

// Import IntelliTest API services
import {
  getIntelliTestPerformanceAnalysisApi,
  generateIntelliTestInsightsApi,
  getIntelliTestSessionHistoryApi,
  formatIntelliTestError,
} from '../../services/apiService';

const {width: screenWidth} = Dimensions.get('window');

const IntelliTestAnalyticsDashboard = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // Extract params from route with fallbacks
  const {examId: routeExamId, examName: routeExamName} = route.params || {};
  
  // Fix: userData has 'id' field, not 'userId'
  const userId = userData?.id || userData?.userId;

  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showTimeRangeModal, setShowTimeRangeModal] = useState(false);
  const [showExamSelector, setShowExamSelector] = useState(!routeExamId); // Show if no examId
  const [selectedExamId, setSelectedExamId] = useState(routeExamId || null);
  const [selectedExamName, setSelectedExamName] = useState(routeExamName || null);
  
  // Core analytics data from PerformanceAnalysis model
  const [performanceAnalysis, setPerformanceAnalysis] = useState(null);
  const [examAnalysis, setExamAnalysis] = useState(null);
  const [aiInsights, setAiInsights] = useState([]);
  const [strengths, setStrengths] = useState([]);
  const [weaknesses, setWeaknesses] = useState([]);
  const [skillProgressions, setSkillProgressions] = useState([]);
  const [readinessAssessment, setReadinessAssessment] = useState(null);
  const [comparativeAnalysis, setComparativeAnalysis] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);

  // Available exams for selection
  const availableExams = [
    { id: 'JEE_MAIN', name: 'JEE Main', icon: 'engineering', color: '#1E40AF' },
    { id: 'NEET', name: 'NEET', icon: 'local-hospital', color: '#DC2626' },
    { id: 'CAT', name: 'CAT', icon: 'business', color: '#7C3AED' },
    { id: 'GATE', name: 'GATE', icon: 'memory', color: '#EA580C' },
    { id: 'UPSC', name: 'UPSC', icon: 'account-balance', color: '#059669' },
  ];

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Fetch comprehensive analytics data - FIXED FUNCTION
  const fetchAnalyticsData = useCallback(async () => {
    const currentExamId = selectedExamId;
    
    console.log('🔍 DEBUG: Starting fetchAnalyticsData');
    console.log('🔍 DEBUG: selectedExamId =', selectedExamId);
    console.log('🔍 DEBUG: selectedExamName =', selectedExamName);
    console.log('🔍 DEBUG: userId =', userId);

    // CRITICAL FIX: Check if we need to show exam selector first
    if (!currentExamId) {
      console.log('⚠️ No examId selected, showing exam selector');
      setError(null);
      setLoading(false);
      setShowExamSelector(true);
      return;
    }

    if (!userId) {
      console.error('❌ ERROR: userId is missing');
      setError('User authentication required. Please log in again.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('🔍 Fetching performance analysis for:', { examId: currentExamId, userId });

      // Create timeout promise for API call
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 15000)
      );

      // Fetch complete performance analysis from backend
      const apiPromise = getIntelliTestPerformanceAnalysisApi(currentExamId, {
        includeInsights: true,
        includeStrengths: true,
        includeWeaknesses: true,
        includeSkillProgressions: true,
        includeReadinessAssessment: true,
        includeComparativeAnalysis: true,
      });

      const response = await Promise.race([apiPromise, timeoutPromise]);

      console.log('🔍 DEBUG: API Response status:', response?.status);
      console.log('🔍 DEBUG: API Response data:', response?.data);

      if (response?.data?.success && response.data.data) {
        const data = response.data.data;
        console.log('✅ Performance analysis loaded:', data);

        setPerformanceAnalysis(data);
        
        // Extract exam-specific analysis
        const currentExamAnalysis = data.examAnalysis?.find(exam => exam.examId === currentExamId);
        console.log('🔍 DEBUG: Current exam analysis:', currentExamAnalysis);
        
        if (currentExamAnalysis) {
          setExamAnalysis(currentExamAnalysis);
          setStrengths(currentExamAnalysis.strengths || []);
          setWeaknesses(currentExamAnalysis.weaknesses || []);
          setSkillProgressions(currentExamAnalysis.skillProgressions || []);
          setReadinessAssessment(currentExamAnalysis.readinessAssessment || null);
          setComparativeAnalysis(currentExamAnalysis.comparativeAnalysis || null);
          
          console.log('📊 DEBUG: Data loaded:', {
            strengths: currentExamAnalysis.strengths?.length || 0,
            weaknesses: currentExamAnalysis.weaknesses?.length || 0,
            skills: currentExamAnalysis.skillProgressions?.length || 0,
          });
        } else {
          console.log('⚠️ No exam analysis found for examId:', currentExamId);
          setError(`No performance data found for ${selectedExamName || currentExamId}. Complete some assessments first.`);
          setLoading(false);
          return;
        }

        // Extract AI insights
        setAiInsights(data.aiInsights || []);
        console.log('🤖 AI Insights loaded:', data.aiInsights?.length || 0);

        // Animate entrance
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();

      } else {
        console.log('⚠️ No data in response or unsuccessful:', {
          success: response?.data?.success,
          hasData: !!response?.data?.data,
          response: response?.data
        });
        setError('No performance data available yet. Complete some assessments to see analytics.');
      }

    } catch (error) {
      console.error('❌ Analytics fetch error:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        stack: error.stack
      });
      
      // Better error messages based on error type
      if (error.message === 'Request timeout') {
        setError('Request timed out. Please check your internet connection and try again.');
      } else if (error.response?.status === 404) {
        setError('Analytics service not found. Please contact support.');
      } else if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(formatIntelliTestError ? formatIntelliTestError(error) : 'Failed to load analytics. Please try again.');
      }
    } finally {
      setLoading(false);
      console.log('🏁 fetchAnalyticsData completed');
    }
  }, [selectedExamId, selectedExamName, userId, fadeAnim, slideAnim]); // FIXED: Removed circular dependencies

  // Generate fresh AI insights
  const generateInsights = useCallback(async () => {
    const currentExamId = selectedExamId;
    if (!currentExamId || !examAnalysis) return;

    try {
      setLoadingInsights(true);
      
      const response = await generateIntelliTestInsightsApi({
        examId: currentExamId,
        includeWeakAreas: true,
        includePeerComparison: true,
        includeRecommendations: true,
      });

      if (response?.data?.success) {
        // Refresh the full analytics data to get updated insights
        await fetchAnalyticsData();
        showToast({
          message: 'Fresh insights generated successfully',
          type: 'success',
        });
      }
    } catch (error) {
      console.error('❌ AI Insights Error:', error);
      showToast({
        message: 'Failed to generate insights',
        type: 'error',
      });
    } finally {
      setLoadingInsights(false);
    }
  }, [selectedExamId, examAnalysis, fetchAnalyticsData, showToast]);

  // Handle exam selection - FIXED FUNCTION
  const handleExamSelection = useCallback((exam) => {
    console.log('🔄 Exam selected:', exam.name, 'ID:', exam.id);
    
    setSelectedExamId(exam.id);
    setSelectedExamName(exam.name);
    setShowExamSelector(false);
    setError(null);
    
    // Reset all analytics data
    setPerformanceAnalysis(null);
    setExamAnalysis(null);
    setStrengths([]);
    setWeaknesses([]);
    setSkillProgressions([]);
    setReadinessAssessment(null);
    setComparativeAnalysis(null);
    setAiInsights([]);
    
    // Don't call fetchAnalyticsData here - let useEffect handle it
  }, []);

  // FIXED: Load data when exam is selected
  useEffect(() => {
    console.log('🔍 useEffect triggered - selectedExamId:', selectedExamId, 'userId:', userId);
    if (selectedExamId && userId) {
      fetchAnalyticsData();
    }
  }, [selectedExamId, userId, fetchAnalyticsData]);

  // FIXED: Load data on focus - removed dependencies that cause circular calls
  useFocusEffect(
    useCallback(() => {
      console.log('🔍 DEBUG: useFocusEffect triggered');
      console.log('🔍 DEBUG: Route params:', route.params);
      console.log('🔍 DEBUG: routeExamId available:', !!routeExamId);
      console.log('🔍 DEBUG: userData available:', !!userData);
      
      // Only fetch if we have both examId and userId, and data isn't already loaded
      if (selectedExamId && userId && !performanceAnalysis) {
        fetchAnalyticsData();
      }
    }, [selectedExamId, userId, performanceAnalysis]) // FIXED: Safe dependencies
  );

  // Refresh data - FIXED FUNCTION
  const onRefresh = useCallback(async () => {
    if (!selectedExamId) {
      setRefreshing(false);
      return;
    }
    
    setRefreshing(true);
    try {
      await fetchAnalyticsData();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchAnalyticsData, selectedExamId]);

  // Render exam selector modal
  const renderExamSelectorModal = () => (
    <Modal
      visible={showExamSelector}
      transparent
      animationType="slide"
      onRequestClose={() => {
        // Only allow closing if an exam is selected
        if (selectedExamId) {
          setShowExamSelector(false);
        }
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.examSelectorModal}>
          <View style={styles.modalHeader}>
            <Text variant="bold20" color={COLORS.blue043142}>
              Select Exam for Analytics
            </Text>
            {selectedExamId && (
              <TouchableOpacity onPress={() => setShowExamSelector(false)}>
                <Icon name="close" size={nw(24)} color={COLORS.grey777777} />
              </TouchableOpacity>
            )}
          </View>
          
          <ScrollView style={styles.examList}>
            {availableExams.map(exam => (
              <TouchableOpacity
                key={exam.id}
                style={[
                  styles.examOption, 
                  selectedExamId === exam.id && styles.selectedExamOption
                ]}
                onPress={() => handleExamSelection(exam)}
              >
                <View style={[styles.examOptionIcon, {backgroundColor: exam.color + '15'}]}>
                  <Icon name={exam.icon} size={nw(24)} color={exam.color} />
                </View>
                <View style={styles.examOptionInfo}>
                  <Text variant="bold16" color={COLORS.blue043142}>
                    {exam.name}
                  </Text>
                  <Text variant="medium12" color={COLORS.grey777777}>
                    View performance analytics
                  </Text>
                </View>
                {selectedExamId === exam.id && (
                  <Icon name="check-circle" size={nw(24)} color={exam.color} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
          
          {!selectedExamId && (
            <View style={styles.modalFooter}>
              <Text variant="medium12" color={COLORS.grey777777} style={{textAlign: 'center'}}>
                Please select an exam to view your performance analytics
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  // Render header with exam info and readiness
  const renderAnalyticsHeader = () => (
    <View style={styles.analyticsHeader}>
      <LinearGradient
        colors={[COLORS.yellowF5BE00, COLORS.yellowF5BE00 + 'E6']}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.examSection}
            onPress={() => setShowExamSelector(true)}
          >
            <View style={styles.examSelectorHeader}>
              <Text variant="bold20" color={COLORS.blue043142}>
                {selectedExamName || 'Select Exam'}
              </Text>
              <Icon name="keyboard-arrow-down" size={nw(20)} color={COLORS.blue043142} />
            </View>
            {readinessAssessment && (
              <View style={styles.readinessIndicator}>
                <View style={[styles.readinessCircle, {
                  backgroundColor: getReadinessColor(readinessAssessment.currentReadiness)
                }]}>
                  <Text variant="bold14" color={COLORS.whiteFFFFFF}>
                    {Math.round(readinessAssessment.currentReadiness || 0)}%
                  </Text>
                </View>
                <View style={styles.readinessText}>
                  <Text variant="medium12" color={COLORS.blue043142}>
                    Exam Readiness
                  </Text>
                  <Text variant="medium10" color={COLORS.blue043142} style={{opacity: 0.7}}>
                    {readinessAssessment.confidenceLevel?.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>
            )}
          </TouchableOpacity>
          
          {examAnalysis?.overallMetrics && (
            <View style={styles.quickStats}>
              <View style={styles.quickStat}>
                <Text variant="bold16" color={COLORS.blue043142}>
                  {examAnalysis.overallMetrics.totalSessions || 0}
                </Text>
                <Text variant="medium10" color={COLORS.blue043142}>Tests</Text>
              </View>
              <View style={styles.quickStat}>
                <Text variant="bold16" color={COLORS.blue043142}>
                  {Math.round(examAnalysis.overallMetrics.averageScore || 0)}%
                </Text>
                <Text variant="medium10" color={COLORS.blue043142}>Avg Score</Text>
              </View>
              <View style={styles.quickStat}>
                <Text variant="bold16" color={getScoreColor(examAnalysis.overallMetrics.bestScore)}>
                  {Math.round(examAnalysis.overallMetrics.bestScore || 0)}%
                </Text>
                <Text variant="medium10" color={COLORS.blue043142}>Best</Text>
              </View>
            </View>
          )}
        </View>
      </LinearGradient>
    </View>
  );

  // Render modern tab navigation
  const renderTabNavigation = () => {
    const tabs = [
      { id: 'overview', label: 'Overview', icon: 'dashboard', badge: null },
      { id: 'strengths', label: 'Strengths', icon: 'trending-up', badge: strengths.length },
      { id: 'weaknesses', label: 'Weaknesses', icon: 'warning', badge: weaknesses.filter(w => w.status !== 'resolved').length },
      { id: 'insights', label: 'AI Insights', icon: 'psychology', badge: aiInsights.filter(i => i.priority === 'high' || i.priority === 'urgent').length },
    ];

    return (
      <View style={styles.tabNavigation}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.modernTab, activeTab === tab.id && styles.activeModernTab]}
              onPress={() => setActiveTab(tab.id)}
            >
              <View style={styles.tabIconContainer}>
                <Icon 
                  name={tab.icon} 
                  size={nw(20)} 
                  color={activeTab === tab.id ? COLORS.whiteFFFFFF : COLORS.grey777777} 
                />
                {tab.badge > 0 && (
                  <View style={styles.tabBadge}>
                    <Text variant="bold8" color={COLORS.whiteFFFFFF}>
                      {tab.badge > 99 ? '99+' : tab.badge}
                    </Text>
                  </View>
                )}
              </View>
              <Text 
                variant="medium12" 
                color={activeTab === tab.id ? COLORS.whiteFFFFFF : COLORS.grey777777}
                style={{marginTop: nh(4)}}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Helper functions for colors and styling
  const getReadinessColor = (readiness) => {
    if (readiness >= 80) return '#10B981';
    if (readiness >= 60) return COLORS.yellowF5BE00;
    if (readiness >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981';
    if (score >= 60) return COLORS.yellowF5BE00;
    return '#EF4444';
  };

  // Render tab content based on active tab
  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium16" color={COLORS.blue043142} style={{marginTop: nh(16)}}>
            Loading comprehensive analytics...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Icon name="analytics" size={nw(64)} color={COLORS.greyBBBBBB} />
          <Text variant="bold18" color={COLORS.red} style={{marginTop: nh(16), textAlign: 'center'}}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAnalyticsData}>
            <Icon name="refresh" size={nw(20)} color={COLORS.whiteFFFFFF} />
            <Text variant="medium14" color={COLORS.whiteFFFFFF} style={{marginLeft: nw(8)}}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    // For now, return a simple overview - you can add the other render functions
    return (
      <View style={styles.overviewContainer}>
        <Text variant="bold18" color={COLORS.blue043142}>
          Analytics Overview
        </Text>
        {examAnalysis ? (
          <View style={styles.simpleStats}>
            <Text variant="medium14" color={COLORS.grey777777}>
              Exam: {selectedExamName}
            </Text>
            <Text variant="medium14" color={COLORS.grey777777}>
              Sessions: {examAnalysis.overallMetrics?.totalSessions || 0}
            </Text>
            <Text variant="medium14" color={COLORS.grey777777}>
              Average Score: {Math.round(examAnalysis.overallMetrics?.averageScore || 0)}%
            </Text>
            <Text variant="medium14" color={COLORS.grey777777}>
              Strengths: {strengths.length}
            </Text>
            <Text variant="medium14" color={COLORS.grey777777}>
              Weaknesses: {weaknesses.length}
            </Text>
          </View>
        ) : (
          <Text variant="medium14" color={COLORS.grey777777}>
            No analytics data available yet.
          </Text>
        )}
      </View>
    );
  };

  // MAIN RENDER
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header 
        title="Performance Analytics" 
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        backgroundColor={COLORS.yellowF5BE00}
      />

      <View style={styles.content}>
        {renderAnalyticsHeader()}
        {renderTabNavigation()}
        
        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              colors={[COLORS.blue043142]}
              tintColor={COLORS.blue043142}
            />
          }
        >
          {renderTabContent()}
          <View style={{height: nh(40)}} />
        </ScrollView>
      </View>

      {renderExamSelectorModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(32),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },

  // Analytics Header
  analyticsHeader: {
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    overflow: 'hidden',
  },
  headerGradient: {
    paddingHorizontal: nw(20),
    paddingVertical: nh(20),
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  examSection: {
    flex: 1,
  },
  examSelectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(8),
  },
  readinessIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: nh(8),
  },
  readinessCircle: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(8),
  },
  readinessText: {
    flex: 1,
  },
  quickStats: {
    flexDirection: 'row',
    gap: nw(16),
  },
  quickStat: {
    alignItems: 'center',
  },

  // Tab Navigation
  tabNavigation: {
    backgroundColor: COLORS.whiteFFFFFF,
    paddingVertical: nh(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyD6D6D6,
  },
  tabScrollContainer: {
    paddingHorizontal: nw(20),
    gap: nw(12),
  },
  modernTab: {
    alignItems: 'center',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    borderRadius: nw(16),
    backgroundColor: COLORS.greyF5F5F5,
    minWidth: nw(80),
  },
  activeModernTab: {
    backgroundColor: COLORS.blue043142,
  },
  tabIconContainer: {
    position: 'relative',
  },
  tabBadge: {
    position: 'absolute',
    top: nh(-4),
    right: nw(-8),
    backgroundColor: '#EF4444',
    borderRadius: nw(8),
    paddingHorizontal: nw(4),
    paddingVertical: nh(1),
    minWidth: nw(16),
    alignItems: 'center',
  },

  // Scroll Content
  scrollContent: {
    flex: 1,
    paddingHorizontal: nw(20),
  },

  // Overview Container
  overviewContainer: {
    paddingTop: nh(20),
  },
  simpleStats: {
    marginTop: nh(16),
    padding: nw(16),
    backgroundColor: COLORS.greyF5F5F5,
    borderRadius: nw(12),
    gap: nh(8),
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: nh(100),
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: nh(100),
    paddingHorizontal: nw(40),
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    borderRadius: nw(8),
    marginTop: nh(20),
  },

  // Exam Selector Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  examSelectorModal: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: nw(24),
    borderTopRightRadius: nw(24),
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: nw(24),
    paddingVertical: nh(20),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyD6D6D6,
  },
  examList: {
    paddingHorizontal: nw(24),
    paddingBottom: nh(24),
  },
  examOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: nh(16),
    paddingHorizontal: nw(16),
    borderRadius: nw(12),
    marginVertical: nh(4),
    backgroundColor: COLORS.greyF5F5F5,
  },
  selectedExamOption: {
    backgroundColor: COLORS.blue043142 + '15',
    borderWidth: 2,
    borderColor: COLORS.blue043142,
  },
  examOptionIcon: {
    width: nw(48),
    height: nw(48),
    borderRadius: nw(24),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(16),
  },
  examOptionInfo: {
    flex: 1,
  },
  modalFooter: {
    padding: nw(24),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyD6D6D6,
  },
});

export default IntelliTestAnalyticsDashboard;