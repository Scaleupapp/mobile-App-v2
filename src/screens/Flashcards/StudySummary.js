// =====================================================
// STUDY SUMMARY SCREEN - Complete AI-Powered Implementation
// File: screens/Flashcards/StudySummary.js
// =====================================================

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  Share,
  Dimensions,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {
  generateFlashcardStudySummaryApi,
  getFlashcardQuickReviewApi,
  getFlashcardFormulaSheetApi,
  getFlashcardComprehensiveSummaryApi,
  getFlashcardDeckDetailsApi,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';

const {width: screenWidth} = Dimensions.get('window');

const StudySummary = ({navigation, route}) => {
  const {deckId, deckTitle, summaryType = 'quick', timeAvailable = 15} = route.params;
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState(summaryType);
  const [deck, setDeck] = useState(null);
  const [summaryData, setSummaryData] = useState({
    quickReview: null,
    formulaSheet: null,
    comprehensiveSummary: null,
    generatedSummary: null,
  });
  const [timeSettings, setTimeSettings] = useState({
    quickReview: timeAvailable,
    studyTime: 30,
    examMode: false,
  });
  const [generating, setGenerating] = useState({
    quickReview: false,
    formulaSheet: false,
    comprehensive: false,
    generated: false,
  });

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // Tab configuration
  const tabs = [
    {
      id: 'quick',
      label: 'Quick Review',
      icon: 'flash-on',
      color: COLORS.yellowF5BE00,
      description: 'Fast review for limited time'
    },
    {
      id: 'formula',
      label: 'Formula Sheet',
      icon: 'functions',
      color: COLORS.blue043142,
      description: 'Key formulas and concepts'
    },
    {
      id: 'comprehensive',
      label: 'Complete Study',
      icon: 'menu-book',
      color: COLORS.green34A853,
      description: 'Thorough study material'
    },
    {
      id: 'generated',
      label: 'AI Summary',
      icon: 'auto-awesome',
      color: COLORS.redEA4335,
      description: 'Custom AI-generated summary'
    },
  ];

  // Fetch deck details
  const fetchDeckDetails = useCallback(async () => {
    try {
      const response = await getFlashcardDeckDetailsApi(deckId);
      if (response?.data?.success) {
        setDeck(response.data.deck);
      }
    } catch (error) {
      console.error('Error fetching deck details:', error);
      showToast('Failed to load deck details', 'error');
    }
  }, [deckId]);

  // Generate Quick Review
  const generateQuickReview = useCallback(async (timeAvail = timeSettings.quickReview) => {
    if (summaryData.quickReview && !refreshing) return summaryData.quickReview;
    
    try {
      setGenerating(prev => ({...prev, quickReview: true}));
      
      const response = await getFlashcardQuickReviewApi(deckId, timeAvail);
      
      if (response?.data?.success) {
        const quickReview = response.data.quickReview;
        setSummaryData(prev => ({...prev, quickReview}));
        
        if (!refreshing) {
          showToast('Quick review generated successfully!', 'success');
        }
        
        return quickReview;
      } else {
        throw new Error(response?.data?.message || 'Failed to generate quick review');
      }
    } catch (error) {
      console.error('Error generating quick review:', error);
      showToast('Failed to generate quick review', 'error');
      return null;
    } finally {
      setGenerating(prev => ({...prev, quickReview: false}));
    }
  }, [deckId, timeSettings.quickReview, summaryData.quickReview, refreshing]);

  // Generate Formula Sheet
  const generateFormulaSheet = useCallback(async () => {
    if (summaryData.formulaSheet && !refreshing) return summaryData.formulaSheet;
    
    try {
      setGenerating(prev => ({...prev, formulaSheet: true}));
      
      const response = await getFlashcardFormulaSheetApi(deckId);
      
      if (response?.data?.success) {
        const formulaSheet = response.data.formulaSheet;
        setSummaryData(prev => ({...prev, formulaSheet}));
        
        if (!refreshing) {
          showToast('Formula sheet generated successfully!', 'success');
        }
        
        return formulaSheet;
      } else {
        throw new Error(response?.data?.message || 'Failed to generate formula sheet');
      }
    } catch (error) {
      console.error('Error generating formula sheet:', error);
      showToast('Failed to generate formula sheet', 'error');
      return null;
    } finally {
      setGenerating(prev => ({...prev, formulaSheet: false}));
    }
  }, [deckId, summaryData.formulaSheet, refreshing]);

  // Generate Comprehensive Summary
  const generateComprehensiveSummary = useCallback(async () => {
    if (summaryData.comprehensiveSummary && !refreshing) return summaryData.comprehensiveSummary;
    
    try {
      setGenerating(prev => ({...prev, comprehensive: true}));
      
      const response = await getFlashcardComprehensiveSummaryApi(deckId);
      
      if (response?.data?.success) {
        const comprehensiveSummary = response.data.summary;
        setSummaryData(prev => ({...prev, comprehensiveSummary}));
        
        if (!refreshing) {
          showToast('Comprehensive summary generated successfully!', 'success');
        }
        
        return comprehensiveSummary;
      } else {
        throw new Error(response?.data?.message || 'Failed to generate comprehensive summary');
      }
    } catch (error) {
      console.error('Error generating comprehensive summary:', error);
      showToast('Failed to generate comprehensive summary', 'error');
      return null;
    } finally {
      setGenerating(prev => ({...prev, comprehensive: false}));
    }
  }, [deckId, summaryData.comprehensiveSummary, refreshing]);

  // Generate Custom AI Summary
  const generateAISummary = useCallback(async () => {
    if (summaryData.generatedSummary && !refreshing) return summaryData.generatedSummary;
    
    try {
      setGenerating(prev => ({...prev, generated: true}));
      
      const response = await generateFlashcardStudySummaryApi(deckId);
      
      if (response?.data?.success) {
        const generatedSummary = response.data.summary;
        setSummaryData(prev => ({...prev, generatedSummary}));
        
        if (!refreshing) {
          showToast('AI summary generated successfully!', 'success');
        }
        
        return generatedSummary;
      } else {
        throw new Error(response?.data?.message || 'Failed to generate AI summary');
      }
    } catch (error) {
      console.error('Error generating AI summary:', error);
      showToast('Failed to generate AI summary', 'error');
      return null;
    } finally {
      setGenerating(prev => ({...prev, generated: false}));
    }
  }, [deckId, summaryData.generatedSummary, refreshing]);

  // Load content based on selected tab
  const loadContentForTab = useCallback(async (tabId) => {
    switch (tabId) {
      case 'quick':
        return await generateQuickReview();
      case 'formula':
        return await generateFormulaSheet();
      case 'comprehensive':
        return await generateComprehensiveSummary();
      case 'generated':
        return await generateAISummary();
      default:
        return null;
    }
  }, [generateQuickReview, generateFormulaSheet, generateComprehensiveSummary, generateAISummary]);

  // Handle tab change
  const handleTabChange = useCallback(async (tabId) => {
    setSelectedTab(tabId);
    
    // Animate content change
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(async () => {
      // Load content for new tab
      await loadContentForTab(tabId);
      
      // Animate content in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, slideAnim, loadContentForTab]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Clear current data for selected tab
    setSummaryData(prev => ({
      ...prev,
      [selectedTab === 'quick' ? 'quickReview' : 
       selectedTab === 'formula' ? 'formulaSheet' :
       selectedTab === 'comprehensive' ? 'comprehensiveSummary' : 'generatedSummary']: null
    }));
    
    // Regenerate content
    await loadContentForTab(selectedTab);
    setRefreshing(false);
  }, [selectedTab, loadContentForTab]);

  // Handle time change for quick review
  const handleTimeChange = useCallback((newTime) => {
    setTimeSettings(prev => ({...prev, quickReview: newTime}));
    
    // If quick review is currently selected and loaded, regenerate with new time
    if (selectedTab === 'quick' && summaryData.quickReview) {
      setSummaryData(prev => ({...prev, quickReview: null}));
      generateQuickReview(newTime);
    }
  }, [selectedTab, summaryData.quickReview, generateQuickReview]);

  // Share summary
  const handleShare = useCallback(async () => {
    const currentData = getCurrentTabData();
    if (!currentData) {
      showToast('No content to share', 'error');
      return;
    }

    const currentTab = tabs.find(tab => tab.id === selectedTab);
    const shareContent = formatContentForShare(currentData, currentTab.label);

    try {
      await Share.share({
        message: shareContent,
        title: `${currentTab.label} - ${deck?.title || deckTitle}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
      showToast('Failed to share content', 'error');
    }
  }, [selectedTab, deck, deckTitle, summaryData]);

  // Get current tab data
  const getCurrentTabData = useCallback(() => {
    switch (selectedTab) {
      case 'quick':
        return summaryData.quickReview;
      case 'formula':
        return summaryData.formulaSheet;
      case 'comprehensive':
        return summaryData.comprehensiveSummary;
      case 'generated':
        return summaryData.generatedSummary;
      default:
        return null;
    }
  }, [selectedTab, summaryData]);

  // Format content for sharing
  const formatContentForShare = (data, tabLabel) => {
    let content = `${tabLabel} - ${deck?.title || deckTitle}\n\n`;
    
    if (selectedTab === 'quick' && data) {
      content += `📚 Quick Facts:\n${data.quickFacts?.join('\n') || 'No quick facts available'}\n\n`;
      content += `📝 Must Remember:\n${data.mustRemember?.join('\n') || 'No key points available'}\n\n`;
      content += `💡 Study Tips:\n${data.examTips?.join('\n') || 'No tips available'}\n`;
    } else if (selectedTab === 'formula' && data) {
      content += `📐 Formulas:\n${data.formulas?.map(f => `${f.formula}: ${f.description}`).join('\n') || 'No formulas available'}\n`;
    } else if (data && typeof data === 'object') {
      content += JSON.stringify(data, null, 2);
    } else if (data) {
      content += data.toString();
    }

    content += `\n\nGenerated with ScaleUp App`;
    return content;
  };

  // Initial load
  useFocusEffect(
    useCallback(() => {
      const initializeScreen = async () => {
        setLoading(true);
        
        try {
          // Load deck details
          await fetchDeckDetails();
          
          // Load initial content
          await loadContentForTab(selectedTab);
          
          // Animate content in
          Animated.parallel([
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
              toValue: 0,
              duration: 500,
              useNativeDriver: true,
            }),
          ]).start();
          
        } catch (error) {
          console.error('Error initializing screen:', error);
          showToast('Failed to load summary', 'error');
        } finally {
          setLoading(false);
        }
      };

      initializeScreen();
    }, [])
  );

  // Render time selector for quick review
  const renderTimeSelector = () => {
    if (selectedTab !== 'quick') return null;

    const timeOptions = [5, 10, 15, 20, 30, 45];

    return (
      <View style={styles.timeSelector}>
        <Text variant="medium12" color={COLORS.grey777777} style={styles.timeSelectorLabel}>
          Study Time Available:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeOptionsContainer}>
          {timeOptions.map((time) => (
            <Pressable
              key={time}
              style={[
                styles.timeOption,
                timeSettings.quickReview === time && styles.timeOptionSelected
              ]}
              onPress={() => handleTimeChange(time)}>
              <Text
                variant="medium12"
                color={timeSettings.quickReview === time ? COLORS.whiteFFFFFF : COLORS.grey777777}>
                {time}m
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  };

  // Render tabs
  const renderTabs = () => (
    <View style={styles.tabContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            style={[
              styles.tab,
              selectedTab === tab.id && [styles.tabSelected, {borderBottomColor: tab.color}]
            ]}
            onPress={() => handleTabChange(tab.id)}>
            <Icon
              name={tab.icon}
              size={20}
              color={selectedTab === tab.id ? tab.color : COLORS.grey777777}
            />
            <Text
              variant="medium12"
              color={selectedTab === tab.id ? tab.color : COLORS.grey777777}
              style={styles.tabLabel}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  // Render content based on selected tab
  const renderContent = () => {
    const currentData = getCurrentTabData();
    const isGenerating = generating[selectedTab] || generating[selectedTab === 'quick' ? 'quickReview' : selectedTab === 'formula' ? 'formulaSheet' : selectedTab === 'comprehensive' ? 'comprehensive' : 'generated'];

    if (isGenerating) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.grey777777} style={styles.loadingText}>
            Generating {tabs.find(tab => tab.id === selectedTab)?.label.toLowerCase()}...
          </Text>
          <Text variant="regular12" color={COLORS.grey999999} style={styles.loadingSubText}>
            This may take a few moments
          </Text>
        </View>
      );
    }

    if (!currentData) {
      return (
        <View style={styles.emptyContainer}>
          <Icon name="auto-awesome" size={48} color={COLORS.greyDDDDDD} />
          <Text variant="medium16" color={COLORS.grey777777} style={styles.emptyTitle}>
            No summary generated yet
          </Text>
          <Text variant="regular12" color={COLORS.grey999999} style={styles.emptySubtitle}>
            Pull down to refresh and generate a new summary
          </Text>
        </View>
      );
    }

    return (
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}]
          }
        ]}>
        {selectedTab === 'quick' && renderQuickReview(currentData)}
        {selectedTab === 'formula' && renderFormulaSheet(currentData)}
        {selectedTab === 'comprehensive' && renderComprehensiveSummary(currentData)}
        {selectedTab === 'generated' && renderGeneratedSummary(currentData)}
      </Animated.View>
    );
  };

  // Render Quick Review
  const renderQuickReview = (data) => (
    <View style={styles.quickReviewContainer}>
      {/* Time Estimate */}
      <View style={styles.timeEstimateCard}>
        <Icon name="access-time" size={20} color={COLORS.yellowF5BE00} />
        <Text variant="medium14" color={COLORS.blue043142}>
          Estimated time: {data.timeEstimate || timeSettings.quickReview} minutes
        </Text>
      </View>

      {/* Quick Facts */}
      {data.quickFacts && data.quickFacts.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="flash-on" size={20} color={COLORS.yellowF5BE00} />
            <Text variant="semibold16" color={COLORS.blue043142}>
              Quick Facts
            </Text>
          </View>
          {data.quickFacts.map((fact, index) => (
            <View key={index} style={styles.factItem}>
              <View style={styles.factBullet} />
              <Text variant="medium14" color={COLORS.grey333333} style={styles.factText}>
                {fact}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Key Formulas */}
      {data.keyFormulas && data.keyFormulas.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="functions" size={20} color={COLORS.blue043142} />
            <Text variant="semibold16" color={COLORS.blue043142}>
              Key Formulas
            </Text>
          </View>
          {data.keyFormulas.map((formula, index) => (
            <View key={index} style={styles.formulaItem}>
              <Text variant="medium14" color={COLORS.grey333333}>
                {formula}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Must Remember */}
      {data.mustRemember && data.mustRemember.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="star" size={20} color={COLORS.redEA4335} />
            <Text variant="semibold16" color={COLORS.blue043142}>
              Must Remember
            </Text>
          </View>
          {data.mustRemember.map((item, index) => (
            <View key={index} style={styles.rememberItem}>
              <Icon name="bookmark" size={16} color={COLORS.redEA4335} />
              <Text variant="medium14" color={COLORS.grey333333} style={styles.rememberText}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Exam Tips */}
      {data.examTips && data.examTips.length > 0 && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="lightbulb" size={20} color={COLORS.green34A853} />
            <Text variant="semibold16" color={COLORS.blue043142}>
              Study Tips
            </Text>
          </View>
          {data.examTips.map((tip, index) => (
            <View key={index} style={styles.tipItem}>
              <Icon name="check-circle" size={16} color={COLORS.green34A853} />
              <Text variant="medium14" color={COLORS.grey333333} style={styles.tipText}>
                {tip}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  // Render Formula Sheet
  const renderFormulaSheet = (data) => (
    <View style={styles.formulaSheetContainer}>
      {data.formulas && data.formulas.length > 0 ? (
        data.formulas.map((formula, index) => (
          <View key={index} style={styles.formulaCard}>
            <View style={styles.formulaHeader}>
              <Text variant="semibold16" color={COLORS.blue043142}>
                {formula.formula}
              </Text>
              {formula.category && (
                <View style={styles.formulaCategory}>
                  <Text variant="medium10" color={COLORS.whiteFFFFFF}>
                    {formula.category}
                  </Text>
                </View>
              )}
            </View>
            <Text variant="medium14" color={COLORS.grey555555} style={styles.formulaDescription}>
              {formula.description}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyFormulaContainer}>
          <Icon name="functions" size={48} color={COLORS.greyDDDDDD} />
          <Text variant="medium16" color={COLORS.grey777777}>
            No formulas found in this deck
          </Text>
        </View>
      )}
    </View>
  );

  // Render Comprehensive Summary
  const renderComprehensiveSummary = (data) => (
    <View style={styles.comprehensiveContainer}>
      {/* Study Summary */}
      {data.studySummary && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="menu-book" size={20} color={COLORS.green34A853} />
            <Text variant="semibold16" color={COLORS.blue043142}>
              Study Summary
            </Text>
          </View>
          
          {data.studySummary.keyPoints && data.studySummary.keyPoints.map((point, index) => (
            <View key={index} style={styles.keyPointCard}>
              <Text variant="semibold14" color={COLORS.blue043142}>
                {point.topic}
              </Text>
              <Text variant="medium12" color={COLORS.grey555555} style={styles.keyPointSummary}>
                {point.summary}
              </Text>
              <View style={styles.importanceBar}>
                <View 
                  style={[
                    styles.importanceFill,
                    {width: `${(point.importance || 3) * 20}%`}
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Exam Prep */}
      {data.examPrep && (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Icon name="school" size={20} color={COLORS.redEA4335} />
            <Text variant="semibold16" color={COLORS.blue043142}>
              Exam Preparation
            </Text>
          </View>
          
          {data.examPrep.studyTips && (
            <View style={styles.examSection}>
              <Text variant="medium14" color={COLORS.grey777777} style={styles.examSectionTitle}>
                Study Tips:
              </Text>
              {data.examPrep.studyTips.map((tip, index) => (
                <Text key={index} variant="medium12" color={COLORS.grey555555} style={styles.examItem}>
                  • {tip}
                </Text>
              ))}
            </View>
          )}

          {data.examPrep.commonMistakes && (
            <View style={styles.examSection}>
              <Text variant="medium14" color={COLORS.grey777777} style={styles.examSectionTitle}>
                Common Mistakes:
              </Text>
              {data.examPrep.commonMistakes.map((mistake, index) => (
                <Text key={index} variant="medium12" color={COLORS.redEA4335} style={styles.examItem}>
                  ⚠️ {mistake}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Time Estimates */}
      {data.timeEstimates && (
        <View style={styles.timeEstimatesCard}>
          <Text variant="semibold14" color={COLORS.blue043142} style={styles.timeEstimatesTitle}>
            Recommended Study Times
          </Text>
          <View style={styles.timeEstimateRow}>
            <Text variant="medium12" color={COLORS.grey555555}>Quick Review:</Text>
            <Text variant="medium12" color={COLORS.blue043142}>{data.timeEstimates.quickReview}m</Text>
          </View>
          <View style={styles.timeEstimateRow}>
            <Text variant="medium12" color={COLORS.grey555555}>Thorough Study:</Text>
            <Text variant="medium12" color={COLORS.blue043142}>{data.timeEstimates.thoroughStudy}m</Text>
          </View>
          <View style={styles.timeEstimateRow}>
            <Text variant="medium12" color={COLORS.grey555555}>Exam Prep:</Text>
            <Text variant="medium12" color={COLORS.blue043142}>{data.timeEstimates.examPrep}m</Text>
          </View>
        </View>
      )}
    </View>
  );

  // Render Generated Summary
  const renderGeneratedSummary = (data) => (
    <View style={styles.generatedContainer}>
      <Text variant="medium14" color={COLORS.grey333333} style={styles.generatedText}>
        {typeof data === 'string' ? data : JSON.stringify(data, null, 2)}
      </Text>
    </View>
  );

  // Action buttons
  const renderActionButtons = () => {
    const currentData = getCurrentTabData();
    
    return (
      <View style={styles.actionButtons}>
        <Button
          title="Share Summary"
          variant="outline"
          onPress={handleShare}
          disabled={!currentData}
          style={[styles.actionButton, styles.shareButton]}
          textStyle={styles.shareButtonText}
          icon="share"
        />
        <Button
          title="Start Studying"
          onPress={() => navigation.navigate(Routes.FlashcardViewer, {
            deckId,
            studyMode: true,
            fromSummary: true
          })}
          style={[styles.actionButton, styles.studyButton]}
          textStyle={styles.studyButtonText}
        />
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <Header 
          title="Study Summary" 
          onBackPress={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.grey777777} style={styles.loadingText}>
            Loading study materials...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header 
        title="Study Summary"
        subtitle={deck?.title || deckTitle}
        onBackPress={() => navigation.goBack()}
        rightIcon
        rightIconName="refresh"
        onRightIconPress={handleRefresh}
      />

      <View style={styles.content}>
        {renderTabs()}
        {renderTimeSelector()}
        
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[COLORS.blue043142]}
              tintColor={COLORS.blue043142}
            />
          }>
          {renderContent()}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {renderActionButtons()}
      </View>
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
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  
  // Tabs
  tabContainer: {
    paddingVertical: nh(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    marginRight: nw(8),
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabSelected: {
    borderBottomWidth: 2,
  },
  tabLabel: {
    marginLeft: nw(6),
  },

  // Time Selector
  timeSelector: {
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  timeSelectorLabel: {
    marginBottom: nh(8),
  },
  timeOptionsContainer: {
    flexDirection: 'row',
  },
  timeOption: {
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    borderRadius: nw(12),
    backgroundColor: COLORS.greyF8F8F8,
    marginRight: nw(8),
  },
  timeOptionSelected: {
    backgroundColor: COLORS.blue043142,
  },

  // Content
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: nw(20),
  },
  
  // Loading & Empty States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: nw(40),
  },
  loadingText: {
    marginTop: nh(16),
    textAlign: 'center',
  },
  loadingSubText: {
    marginTop: nh(4),
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: nh(60),
  },
  emptyTitle: {
    marginTop: nh(16),
    marginBottom: nh(8),
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    paddingHorizontal: nw(40),
  },

  // Quick Review
  quickReviewContainer: {
    gap: nh(16),
  },
  timeEstimateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.yellowF5BE00 + '20',
    padding: nw(16),
    borderRadius: nw(12),
    gap: nw(12),
  },
  sectionCard: {
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(12),
    padding: nw(16),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(12),
    gap: nw(8),
  },
  factItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: nh(8),
    gap: nw(8),
  },
  factBullet: {
    width: nw(6),
    height: nw(6),
    borderRadius: nw(3),
    backgroundColor: COLORS.yellowF5BE00,
    marginTop: nh(6),
  },
  factText: {
    flex: 1,
    lineHeight: nh(20),
  },
  formulaItem: {
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(12),
    borderRadius: nw(8),
    marginBottom: nh(8),
  },
  rememberItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: nh(8),
    gap: nw(8),
  },
  rememberText: {
    flex: 1,
    lineHeight: nh(20),
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: nh(8),
    gap: nw(8),
  },
  tipText: {
    flex: 1,
    lineHeight: nh(20),
  },

  // Formula Sheet
  formulaSheetContainer: {
    gap: nh(12),
  },
  formulaCard: {
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(12),
    padding: nw(16),
  },
  formulaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nh(8),
  },
  formulaCategory: {
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nw(4),
  },
  formulaDescription: {
    lineHeight: nh(20),
  },
  emptyFormulaContainer: {
    alignItems: 'center',
    paddingVertical: nh(40),
  },

  // Comprehensive Summary
  comprehensiveContainer: {
    gap: nh(16),
  },
  keyPointCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(12),
    borderRadius: nw(8),
    marginBottom: nh(8),
  },
  keyPointSummary: {
    marginVertical: nh(6),
    lineHeight: nh(18),
  },
  importanceBar: {
    height: nh(3),
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: nh(2),
    marginTop: nh(4),
  },
  importanceFill: {
    height: '100%',
    backgroundColor: COLORS.green34A853,
    borderRadius: nh(2),
  },
  examSection: {
    marginBottom: nh(12),
  },
  examSectionTitle: {
    marginBottom: nh(6),
  },
  examItem: {
    marginBottom: nh(4),
    paddingLeft: nw(8),
    lineHeight: nh(18),
  },
  timeEstimatesCard: {
    backgroundColor: COLORS.blue043142 + '10',
    padding: nw(16),
    borderRadius: nw(12),
  },
  timeEstimatesTitle: {
    marginBottom: nh(12),
  },
  timeEstimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: nh(6),
  },

  // Generated Summary
  generatedContainer: {
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(12),
    padding: nw(16),
  },
  generatedText: {
    lineHeight: nh(22),
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    padding: nw(20),
    paddingTop: nh(12),
    gap: nw(12),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },
  actionButton: {
    flex: 1,
  },
  shareButton: {
    backgroundColor: 'transparent',
    borderColor: COLORS.blue043142,
  },
  shareButtonText: {
    color: COLORS.blue043142,
  },
  studyButton: {
    backgroundColor: COLORS.blue043142,
  },
  studyButtonText: {
    color: COLORS.whiteFFFFFF,
  },

  // Bottom spacing
  bottomSpacing: {
    height: nh(20),
  },
});

export default StudySummary;