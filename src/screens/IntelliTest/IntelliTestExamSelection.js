// =====================================================
// INTELLITEST EXAM SELECTION SCREEN
// File: screens/IntelliTest/IntelliTestExamSelection.js
// =====================================================

import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  TextInput,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TouchableOpacity,
  Animated,
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
import {useToast} from '../../components/CustomToast';

// Import IntelliTest API services
import {
  getIntelliTestAvailableExamsApi,
  getIntelliTestSessionHistoryApi,
  createIntelliTestSessionApi,
  formatIntelliTestError,
} from '../../services/apiService';

const {width: screenWidth} = Dimensions.get('window');

const IntelliTestExamSelection = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // Route params
  const {preSelectedExam} = route.params || {};
  
  // State management
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [availableExams, setAvailableExams] = useState([]);
  const [filteredExams, setFilteredExams] = useState([]);
  const [recentExams, setRecentExams] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [showExamDetails, setShowExamDetails] = useState(false);
  const [startingAssessment, setStartingAssessment] = useState(false);
  
  // Search timeout ref
  const searchTimeoutRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Enhanced exam metadata with detailed information
  const examMetadata = {
    'JEE_MAIN': {
      name: 'JEE Main',
      fullName: 'Joint Entrance Examination Main',
      icon: 'engineering',
      bgColor: COLORS.blue043142,
      category: 'engineering',
      description: 'Engineering entrance exam for admission to NITs, IIITs, and CFTIs',
      subjects: ['Physics', 'Chemistry', 'Mathematics'],
      difficulty: 'High',
      duration: '3 hours',
      totalQuestions: 75,
      maxMarks: 300,
      negativeMarking: true,
      targetStudents: 'Engineering Aspirants',
      examPattern: 'Multiple Choice + Numerical',
      popularity: 95,
      attempts: '2 times per year',
      sampleTopics: [
        'Mechanics, Thermodynamics, Electromagnetism',
        'Organic, Inorganic, Physical Chemistry',
        'Calculus, Algebra, Coordinate Geometry'
      ]
    },
    'NEET': {
      name: 'NEET',
      fullName: 'National Eligibility Entrance Test',
      icon: 'local-hospital',
      bgColor: '#e74c3c',
      category: 'medical',
      description: 'Medical entrance exam for MBBS, BDS admissions',
      subjects: ['Physics', 'Chemistry', 'Biology'],
      difficulty: 'High',
      duration: '3h 20m',
      totalQuestions: 180,
      maxMarks: 720,
      negativeMarking: true,
      targetStudents: 'Medical Aspirants',
      examPattern: 'Multiple Choice Questions',
      popularity: 92,
      attempts: '1 time per year',
      sampleTopics: [
        'Mechanics, Optics, Modern Physics',
        'Organic, Inorganic Chemistry',
        'Cell Biology, Genetics, Human Physiology'
      ]
    },
    'CAT': {
      name: 'CAT',
      fullName: 'Common Admission Test',
      icon: 'business',
      bgColor: '#9b59b6',
      category: 'management',
      description: 'MBA entrance exam for IIMs and top B-schools',
      subjects: ['Verbal Ability', 'Data Interpretation', 'Quantitative Ability'],
      difficulty: 'High',
      duration: '2 hours',
      totalQuestions: 76,
      maxMarks: 300,
      negativeMarking: true,
      targetStudents: 'MBA Aspirants',
      examPattern: 'MCQ + Non-MCQ',
      popularity: 88,
      attempts: '1 time per year',
      sampleTopics: [
        'Reading Comprehension, Verbal Reasoning',
        'Data Sufficiency, Logical Reasoning',
        'Arithmetic, Algebra, Geometry'
      ]
    },
    'GATE': {
      name: 'GATE',
      fullName: 'Graduate Aptitude Test in Engineering',
      icon: 'memory',
      bgColor: '#f39c12',
      category: 'engineering',
      description: 'Postgraduate entrance exam for M.Tech, PSU jobs',
      subjects: ['Technical Subject', 'General Aptitude'],
      difficulty: 'Medium',
      duration: '3 hours',
      totalQuestions: 65,
      maxMarks: 100,
      negativeMarking: true,
      targetStudents: 'Engineering Graduates',
      examPattern: 'MCQ + Numerical',
      popularity: 78,
      attempts: '1 time per year',
      sampleTopics: [
        'Core Engineering Subjects',
        'Mathematics, General Aptitude',
        'Subject-specific Technical Topics'
      ]
    },
    'GMAT': {
      name: 'GMAT',
      fullName: 'Graduate Management Admission Test',
      icon: 'school',
      bgColor: '#27ae60',
      category: 'management',
      description: 'Global MBA entrance exam for international universities',
      subjects: ['Verbal', 'Quantitative', 'AWA', 'Integrated Reasoning'],
      difficulty: 'High',
      duration: '3h 7m',
      totalQuestions: 80,
      maxMarks: 800,
      negativeMarking: false,
      targetStudents: 'International MBA Aspirants',
      examPattern: 'Computer Adaptive',
      popularity: 65,
      attempts: '5 times per year',
      sampleTopics: [
        'Critical Reasoning, Sentence Correction',
        'Problem Solving, Data Sufficiency',
        'Analytical Writing Assessment'
      ]
    },
    'UPSC': {
      name: 'UPSC',
      fullName: 'Union Public Service Commission',
      icon: 'account-balance',
      bgColor: '#34495e',
      category: 'government',
      description: 'Civil services examination for IAS, IPS, IFS',
      subjects: ['General Studies', 'Aptitude', 'Optional Subject'],
      difficulty: 'Very High',
      duration: 'Variable',
      totalQuestions: 200,
      maxMarks: 400,
      negativeMarking: true,
      targetStudents: 'Civil Services Aspirants',
      examPattern: 'Multi-stage Selection',
      popularity: 85,
      attempts: '1 time per year',
      sampleTopics: [
        'History, Geography, Polity',
        'Current Affairs, Science & Technology',
        'Ethics, Essay Writing'
      ]
    },
    'BANK_PO': {
      name: 'Bank PO',
      fullName: 'Banking Probationary Officer',
      icon: 'account-balance-wallet',
      bgColor: '#16a085',
      category: 'banking',
      description: 'Banking sector recruitment for Probationary Officer positions',
      subjects: ['Reasoning Ability', 'Quantitative Aptitude', 'English Language', 'General Awareness'],
      difficulty: 'Medium',
      duration: '2h 30m',
      totalQuestions: 155,
      maxMarks: 200,
      negativeMarking: true,
      targetStudents: 'Banking Job Aspirants',
      examPattern: 'Multiple Choice Questions',
      popularity: 82,
      attempts: 'Multiple times per year',
      sampleTopics: [
        'Logical Reasoning, Verbal Reasoning, Seating Arrangement',
        'Arithmetic, Data Interpretation, Number System',
        'Reading Comprehension, Grammar, Vocabulary',
        'Banking Awareness, Current Affairs, Computer Knowledge'
      ]
    },
    'SSC': {
      name: 'SSC',
      fullName: 'Staff Selection Commission',
      icon: 'work',
      bgColor: '#8e44ad',
      category: 'government',
      description: 'Government job recruitment through Staff Selection Commission',
      subjects: ['General Intelligence', 'General Awareness', 'Quantitative Aptitude', 'English Comprehension'],
      difficulty: 'Medium',
      duration: '2 hours',
      totalQuestions: 100,
      maxMarks: 200,
      negativeMarking: true,
      targetStudents: 'Government Job Aspirants',
      examPattern: 'Multiple Choice Questions',
      popularity: 88,
      attempts: 'Multiple times per year',
      sampleTopics: [
        'Reasoning, Verbal & Non-verbal, Analogies, Classification',
        'History, Geography, Economics, General Science',
        'Arithmetic, Algebra, Geometry, Trigonometry',
        'Grammar, Vocabulary, Comprehension, Synonyms & Antonyms'
      ]
    }
  };

  // Categories with enhanced metadata
  const categories = [
    {id: 'all', name: 'All Exams', icon: 'apps', count: 0},
    {id: 'engineering', name: 'Engineering', icon: 'engineering', count: 0},
    {id: 'medical', name: 'Medical', icon: 'local-hospital', count: 0},
    {id: 'management', name: 'Management', icon: 'business', count: 0},
    {id: 'government', name: 'Government', icon: 'account-balance', count: 0},
    {id: 'banking', name: 'Banking', icon: 'account-balance-wallet', count: 0},
  ];

  // Difficulty levels
  const difficultyLevels = [
    {id: 'all', name: 'All Levels', color: COLORS.grey777777},
    {id: 'Medium', name: 'Medium', color: '#f39c12'},
    {id: 'High', name: 'High', color: '#e74c3c'},
    {id: 'Very High', name: 'Very High', color: '#8e44ad'},
  ];

  // Sort options
  const sortOptions = [
    {id: 'popular', name: 'Most Popular', icon: 'trending-up'},
    {id: 'alphabetical', name: 'A-Z', icon: 'sort-by-alpha'},
    {id: 'difficulty', name: 'Difficulty', icon: 'show-chart'},
    {id: 'recent', name: 'Recently Taken', icon: 'access-time'},
  ];

  // Fetch data
  const fetchExamsData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch available exams
      try {
        const examsResponse = await getIntelliTestAvailableExamsApi();
        console.log('Exams API Response:', examsResponse.data);
        
        if (examsResponse.data?.success) {
          const examsData = examsResponse.data.data?.allExams || examsResponse.data.data?.exams || [];
          
          // Enhance exams with metadata
          const enhancedExams = examsData.map(exam => {
            const metadata = examMetadata[exam.examId] || {
              name: exam.examName || 'Unknown Exam',
              fullName: exam.examFullName || exam.examName || 'Unknown Exam',
              icon: 'school',
              bgColor: COLORS.blue043142,
              category: exam.category || 'general',
              description: exam.examDescription || 'Competitive examination',
              subjects: exam.subjects?.map(s => s.subjectName) || ['General'],
              difficulty: exam.difficultyLevel === 'advanced' ? 'High' : 
                         exam.difficultyLevel === 'intermediate' ? 'Medium' : 'Easy',
              duration: exam.timeConfiguration?.totalDuration ? 
                       `${Math.floor(exam.timeConfiguration.totalDuration / 60)}h ${exam.timeConfiguration.totalDuration % 60}m` : 
                       '2 hours',
              totalQuestions: exam.totalQuestions || 100,
              maxMarks: exam.maximumMarks || 200,
              negativeMarking: exam.markingScheme?.some(m => m.incorrectMarks < 0) || false,
              targetStudents: exam.targetAudience?.join(', ') || 'Students',
              examPattern: 'Multiple Choice Questions',
              popularity: examMetadata[exam.examId]?.popularity || 50,
              attempts: exam.examFrequency === 'yearly' ? '1 time per year' : 
                       exam.examFrequency === 'bi_yearly' ? '2 times per year' : 
                       'Multiple times per year',
              sampleTopics: exam.subjects?.map(s => 
                s.topics?.map(t => t.topicName).join(', ')
              ).filter(Boolean) || ['General Topics']
            };
            
            return {
              ...exam,
              ...metadata
            };
          });
          
          setAvailableExams(enhancedExams);
          setFilteredExams(enhancedExams);
          console.log('Enhanced exams set:', enhancedExams);
        } else {
          // Fallback to metadata when API fails
          const fallbackExams = Object.keys(examMetadata).map(examId => ({
            examId,
            examName: examMetadata[examId].name,
            examFullName: examMetadata[examId].fullName,
            category: examMetadata[examId].category,
            ...examMetadata[examId]
          }));
          setAvailableExams(fallbackExams);
          setFilteredExams(fallbackExams);
        }
      } catch (examError) {
        console.error('Error fetching exams:', examError);
        // Set fallback data with all metadata exams
        const fallbackExams = Object.keys(examMetadata).map(examId => ({
          examId,
          examName: examMetadata[examId].name,
          examFullName: examMetadata[examId].fullName,
          category: examMetadata[examId].category,
          ...examMetadata[examId]
        }));
        setAvailableExams(fallbackExams);
        setFilteredExams(fallbackExams);
      }

      // Fetch recent exam sessions
      try {
        const sessionsResponse = await getIntelliTestSessionHistoryApi({
          limit: 5,
          page: 1
        });
        if (sessionsResponse.data?.success) {
          const sessions = sessionsResponse.data.data?.sessions || [];
          const recentExamIds = [...new Set(sessions.map(s => s.examId))];
          setRecentExams(recentExamIds);
        }
      } catch (sessionError) {
        console.error('Error fetching recent sessions:', sessionError);
      }

    } catch (error) {
      console.error('Error fetching exams data:', error);
      showToast({
        message: 'Unable to load exams. Please try refreshing.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Search and filter logic
  const applyFiltersAndSearch = useCallback(() => {
    let filtered = [...availableExams];

    // Apply search
    if (searchQuery.trim()) {
      filtered = filtered.filter(exam => 
        exam.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exam => exam.category === selectedCategory);
    }

    // Apply difficulty filter
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(exam => exam.difficulty === selectedDifficulty);
    }

    // Apply sorting
    switch (sortBy) {
      case 'popular':
        filtered.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'difficulty':
        const difficultyOrder = {'Medium': 1, 'High': 2, 'Very High': 3};
        filtered.sort((a, b) => (difficultyOrder[a.difficulty] || 0) - (difficultyOrder[b.difficulty] || 0));
        break;
      case 'recent':
        filtered.sort((a, b) => {
          const aRecent = recentExams.includes(a.examId);
          const bRecent = recentExams.includes(b.examId);
          if (aRecent && !bRecent) return -1;
          if (!aRecent && bRecent) return 1;
          return (b.popularity || 0) - (a.popularity || 0);
        });
        break;
    }

    setFilteredExams(filtered);
  }, [availableExams, searchQuery, selectedCategory, selectedDifficulty, sortBy, recentExams]);

  // Handle search with debounce
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(() => {
      applyFiltersAndSearch();
    }, 300);
  }, [applyFiltersAndSearch]);

  // Refresh data
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchExamsData();
    setRefreshing(false);
  }, [fetchExamsData]);

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      fetchExamsData();
      
      // Animate fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }, [fetchExamsData])
  );

  // Apply filters when dependencies change
  useEffect(() => {
    applyFiltersAndSearch();
  }, [selectedCategory, selectedDifficulty, sortBy, applyFiltersAndSearch]);

  // Handle exam selection
  const handleExamSelect = useCallback((exam) => {
    setSelectedExam(exam);
    setShowExamDetails(true);
  }, []);

  // Handle start assessment
  const handleStartAssessment = useCallback(async (exam, assessmentType = 'initial_assessment') => {
    try {
      setStartingAssessment(true);
      
      // Navigate to assessment configuration
      navigation.navigate(Routes.IntelliTestCreateSession, {
        examId: exam.examId,
        examName: exam.name,
        assessmentType,
        examMetadata: exam
      });
      
    } catch (error) {
      console.error('Error starting assessment:', error);
      showToast({
        message: 'Unable to start assessment. Please try again.',
        type: 'error',
      });
    } finally {
      setStartingAssessment(false);
    }
  }, [navigation, showToast]);

  // Render search and filters section
  const renderSearchAndFilters = () => (
    <View style={styles.searchSection}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={nw(20)} color={COLORS.grey777777} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search exams..."
          placeholderTextColor={COLORS.grey777777}
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Icon name="close" size={nw(20)} color={COLORS.grey777777} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Toggles */}
      <View style={styles.filterToggles}>
        <TouchableOpacity
          style={[styles.filterButton, showFilters && styles.filterButtonActive]}
          onPress={() => setShowFilters(!showFilters)}>
          <Icon name="tune" size={nw(16)} color={showFilters ? COLORS.yellowF5BE00 : COLORS.grey777777} />
          <Text variant="medium12" color={showFilters ? COLORS.yellowF5BE00 : COLORS.grey777777}>
            Filters
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => {
            const currentIndex = sortOptions.findIndex(option => option.id === sortBy);
            const nextIndex = (currentIndex + 1) % sortOptions.length;
            setSortBy(sortOptions[nextIndex].id);
          }}>
          <Icon name="sort" size={nw(16)} color={COLORS.grey777777} />
          <Text variant="medium12" color={COLORS.grey777777}>
            {sortOptions.find(option => option.id === sortBy)?.name}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expandable Filters */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          {/* Category Filter */}
          <View style={styles.filterGroup}>
            <Text variant="medium12" color={COLORS.blue043142} style={styles.filterLabel}>
              Category
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptionsRow}>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.filterChip,
                      selectedCategory === category.id && styles.filterChipActive
                    ]}
                    onPress={() => setSelectedCategory(category.id)}>
                    <Icon 
                      name={category.icon} 
                      size={nw(14)} 
                      color={selectedCategory === category.id ? COLORS.whiteFFFFFF : COLORS.grey777777} 
                    />
                    <Text 
                      variant="medium10" 
                      color={selectedCategory === category.id ? COLORS.whiteFFFFFF : COLORS.grey777777}
                      style={{marginLeft: nw(4)}}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Difficulty Filter */}
          <View style={styles.filterGroup}>
            <Text variant="medium12" color={COLORS.blue043142} style={styles.filterLabel}>
              Difficulty
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.filterOptionsRow}>
                {difficultyLevels.map(level => (
                  <TouchableOpacity
                    key={level.id}
                    style={[
                      styles.filterChip,
                      selectedDifficulty === level.id && styles.filterChipActive,
                      selectedDifficulty === level.id && {backgroundColor: level.color}
                    ]}
                    onPress={() => setSelectedDifficulty(level.id)}>
                    <Text 
                      variant="medium10" 
                      color={selectedDifficulty === level.id ? COLORS.whiteFFFFFF : level.color}>
                      {level.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );

  // Render recent exams section
  const renderRecentExams = () => {
    if (recentExams.length === 0) return null;

    const recentExamData = availableExams.filter(exam => recentExams.includes(exam.examId));
    
    return (
      <View style={styles.section}>
        <Text variant="bold16" color={COLORS.blue043142} style={styles.sectionTitle}>
          Continue Your Journey
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.recentExamsRow}>
            {recentExamData.map(exam => (
              <TouchableOpacity
                key={exam.examId}
                style={styles.recentExamCard}
                onPress={() => handleStartAssessment(exam, 'practice')}>
                <View style={[styles.recentExamIcon, {backgroundColor: exam.bgColor}]}>
                  <Icon name={exam.icon} size={nw(20)} color={COLORS.whiteFFFFFF} />
                </View>
                <Text variant="medium12" color={COLORS.blue043142}>
                  {exam.name}
                </Text>
                <Text variant="medium10" color={COLORS.grey777777}>
                  Continue Practice
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Render exam grid
  const renderExamGrid = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text variant="bold16" color={COLORS.blue043142}>
          {selectedCategory === 'all' ? 'All Exams' : categories.find(c => c.id === selectedCategory)?.name} 
          ({filteredExams.length})
        </Text>
      </View>
      
      {filteredExams.length > 0 ? (
        <FlatList
          data={filteredExams}
          numColumns={2}
          scrollEnabled={false}
          keyExtractor={(item) => item.examId}
          renderItem={({item}) => (
            <TouchableOpacity
              style={styles.examCard}
              onPress={() => handleExamSelect(item)}
              activeOpacity={0.8}>
              
              {/* Recent indicator */}
              {recentExams.includes(item.examId) && (
                <View style={styles.recentBadge}>
                  <Text variant="medium8" color={COLORS.whiteFFFFFF}>RECENT</Text>
                </View>
              )}
              
              {/* Exam Header */}
              <View style={[styles.examCardHeader, {backgroundColor: item.bgColor}]}>
                <Icon name={item.icon} size={nw(28)} color={COLORS.whiteFFFFFF} />
                <Text variant="bold14" color={COLORS.whiteFFFFFF} style={{marginTop: nh(4)}}>
                  {item.name}
                </Text>
              </View>
              
              {/* Exam Body */}
              <View style={styles.examCardBody}>
                <Text variant="medium12" color={COLORS.grey777777} numberOfLines={2}>
                  {item.description}
                </Text>
                
                {/* Stats Row */}
                <View style={styles.examStats}>
                  <View style={styles.statItem}>
                    <Icon name="quiz" size={nw(12)} color={COLORS.grey999999} />
                    <Text variant="medium10" color={COLORS.grey999999}>
                      {item.totalQuestions} Qs
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Icon name="schedule" size={nw(12)} color={COLORS.grey999999} />
                    <Text variant="medium10" color={COLORS.grey999999}>
                      {item.duration}
                    </Text>
                  </View>
                </View>
                
                {/* Difficulty Badge */}
                <View style={[styles.difficultyBadge, {
                  backgroundColor: item.difficulty === 'Very High' ? '#8e44ad15' :
                                 item.difficulty === 'High' ? '#e74c3c15' : '#f39c1215'
                }]}>
                  <Text variant="medium10" color={
                    item.difficulty === 'Very High' ? '#8e44ad' :
                    item.difficulty === 'High' ? '#e74c3c' : '#f39c12'
                  }>
                    {item.difficulty}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          columnWrapperStyle={styles.examRow}
        />
      ) : (
        <View style={styles.emptyState}>
          <Icon name="search-off" size={nw(48)} color={COLORS.greyBBBBBB} />
          <Text variant="medium14" color={COLORS.grey777777} style={{marginTop: nh(8)}}>
            No exams found
          </Text>
          <Text variant="medium12" color={COLORS.grey999999}>
            Try adjusting your search or filters
          </Text>
        </View>
      )}
    </View>
  );

  // Render exam details modal
  const renderExamDetailsModal = () => (
    <Modal
      visible={showExamDetails}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowExamDetails(false)}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {selectedExam && (
            <>
              {/* Modal Header */}
              <View style={[styles.modalHeader, {backgroundColor: selectedExam.bgColor}]}>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setShowExamDetails(false)}>
                  <Icon name="close" size={nw(24)} color={COLORS.whiteFFFFFF} />
                </TouchableOpacity>
                
                <View style={styles.modalHeaderContent}>
                  <Icon name={selectedExam.icon} size={nw(40)} color={COLORS.whiteFFFFFF} />
                  <Text variant="bold18" color={COLORS.whiteFFFFFF} style={{marginTop: nh(8)}}>
                    {selectedExam.name}
                  </Text>
                  <Text variant="medium12" color={COLORS.whiteFFFFFF} style={{opacity: 0.9}}>
                    {selectedExam.fullName}
                  </Text>
                </View>
              </View>

              {/* Modal Body */}
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Quick Stats */}
                <View style={styles.quickStatsGrid}>
                  <View style={styles.quickStat}>
                    <Text variant="bold16" color={COLORS.blue043142}>{selectedExam.totalQuestions}</Text>
                    <Text variant="medium10" color={COLORS.grey777777}>Questions</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Text variant="bold16" color={COLORS.blue043142}>{selectedExam.duration}</Text>
                    <Text variant="medium10" color={COLORS.grey777777}>Duration</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Text variant="bold16" color={COLORS.blue043142}>{selectedExam.maxMarks}</Text>
                    <Text variant="medium10" color={COLORS.grey777777}>Max Marks</Text>
                  </View>
                  <View style={styles.quickStat}>
                    <Text variant="bold16" color={selectedExam.negativeMarking ? COLORS.redError : COLORS.greenSuccess}>
                      {selectedExam.negativeMarking ? 'Yes' : 'No'}
                    </Text>
                    <Text variant="medium10" color={COLORS.grey777777}>Negative</Text>
                  </View>
                </View>

                {/* Description */}
                <View style={styles.detailSection}>
                  <Text variant="bold14" color={COLORS.blue043142}>About This Exam</Text>
                  <Text variant="medium12" color={COLORS.grey777777} style={styles.descriptionText}>
                    {selectedExam.description}
                  </Text>
                </View>

                {/* Subjects */}
                <View style={styles.detailSection}>
                  <Text variant="bold14" color={COLORS.blue043142}>Subjects</Text>
                  <View style={styles.subjectsContainer}>
                    {selectedExam.subjects?.map((subject, index) => (
                      <View key={index} style={styles.subjectTag}>
                        <Text variant="medium12" color={COLORS.blue043142}>{subject}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Sample Topics */}
                {selectedExam.sampleTopics && (
                  <View style={styles.detailSection}>
                    <Text variant="bold14" color={COLORS.blue043142}>Sample Topics</Text>
                    {selectedExam.sampleTopics.map((topic, index) => (
                      <View key={index} style={styles.topicItem}>
                        <Icon name="circle" size={nw(6)} color={COLORS.yellowF5BE00} />
                        <Text variant="medium12" color={COLORS.grey777777} style={{flex: 1, marginLeft: nw(8)}}>
                          {topic}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Exam Info */}
                <View style={styles.detailSection}>
                  <Text variant="bold14" color={COLORS.blue043142}>Exam Information</Text>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoItem}>
                      <Text variant="medium12" color={COLORS.grey777777}>Target Students</Text>
                      <Text variant="medium12" color={COLORS.blue043142}>{selectedExam.targetStudents}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text variant="medium12" color={COLORS.grey777777}>Exam Pattern</Text>
                      <Text variant="medium12" color={COLORS.blue043142}>{selectedExam.examPattern}</Text>
                    </View>
                    <View style={styles.infoItem}>
                      <Text variant="medium12" color={COLORS.grey777777}>Frequency</Text>
                      <Text variant="medium12" color={COLORS.blue043142}>{selectedExam.attempts}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
               
                
                <TouchableOpacity
                  style={styles.assessmentButton}
                  onPress={() => {
                    setShowExamDetails(false);
                    handleStartAssessment(selectedExam, 'initial_assessment');
                  }}>
                  <Text variant="bold14" color={COLORS.whiteFFFFFF}>Start Assessment</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  // Main render
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.blue043142} style={{marginTop: nh(16)}}>
            Loading exams...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header 
        title="Select Exam" 
        onBackPress={() => navigation.goBack()}
        backgroundColor={COLORS.yellowF5BE00}
      />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <Animated.View style={[styles.content, {opacity: fadeAnim}]}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }>
              
              {renderSearchAndFilters()}
              {renderRecentExams()}
              {renderExamGrid()}
              
              <View style={{height: nh(20)}} />
            </ScrollView>
          </Animated.View>
        </View>
      </View>

      {renderExamDetailsModal()}

      {/* Loading Overlay */}
      {startingAssessment && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
            <Text variant="medium14" color={COLORS.blue043142} style={{marginTop: nh(16)}}>
              Preparing your assessment...
            </Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
    marginHorizontal: nw(16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
  },
  layer2: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(15),
    marginHorizontal: nw(-16),
    borderTopLeftRadius: nh(25),
    borderTopRightRadius: nh(25),
    paddingHorizontal: nw(16),
    paddingTop: nh(20),
  },
  content: {
    flex: 1,
  },
  
  // Search and Filters
  searchSection: {
    marginBottom: nh(20),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    paddingHorizontal: nw(12),
    paddingVertical: nh(12),
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    marginBottom: nh(12),
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.blue043142,
    marginLeft: nw(8),
  },
  filterToggles: {
    flexDirection: 'row',
    gap: nw(8),
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(8),
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    gap: nw(4),
  },
  filterButtonActive: {
    borderColor: COLORS.yellowF5BE00,
    backgroundColor: COLORS.yellowF5BE00 + '15',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(8),
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    gap: nw(4),
  },
  filtersContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
    marginTop: nh(12),
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
  },
  filterGroup: {
    marginBottom: nh(16),
  },
  filterLabel: {
    marginBottom: nh(8),
  },
  filterOptionsRow: {
    flexDirection: 'row',
    gap: nw(8),
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyD6D6D6 + '50',
    borderRadius: nw(16),
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
  },
  filterChipActive: {
    backgroundColor: COLORS.yellowF5BE00,
  },

  // Sections
  section: {
    marginBottom: nh(24),
  },
  sectionTitle: {
    marginBottom: nh(12),
  },
  sectionHeader: {
    marginBottom: nh(16),
  },

  // Recent Exams
  recentExamsRow: {
    flexDirection: 'row',
    gap: nw(12),
    paddingRight: nw(16),
  },
  recentExamCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(12),
    alignItems: 'center',
    minWidth: nw(80),
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
  },
  recentExamIcon: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(8),
  },

  // Exam Grid
  examRow: {
    justifyContent: 'space-between',
    marginBottom: nh(16),
  },
  examCard: {
    flex: 0.48,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    shadowColor: COLORS.blue043142,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  recentBadge: {
    position: 'absolute',
    top: nw(8),
    right: nw(8),
    backgroundColor: COLORS.yellowF5BE00,
    borderRadius: nw(4),
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    zIndex: 1,
  },
  examCardHeader: {
    padding: nw(16),
    alignItems: 'center',
    minHeight: nh(80),
    justifyContent: 'center',
  },
  examCardBody: {
    padding: nw(12),
    minHeight: nh(100),
  },
  examStats: {
    flexDirection: 'row',
    gap: nw(12),
    marginTop: nh(8),
    marginBottom: nh(8),
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(4),
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: nw(4),
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: nh(40),
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: nw(20),
    borderTopRightRadius: nw(20),
    maxHeight: '90%',
  },
  modalHeader: {
    padding: nw(20),
    alignItems: 'center',
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: nw(20),
    right: nw(20),
    zIndex: 1,
  },
  modalHeaderContent: {
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: nw(20),
    maxHeight: nh(400),
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: nh(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyD6D6D6,
    marginBottom: nh(16),
  },
  quickStat: {
    alignItems: 'center',
  },
  detailSection: {
    marginBottom: nh(20),
  },
  descriptionText: {
    marginTop: nh(8),
    lineHeight: 18,
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
    marginTop: nh(8),
  },
  subjectTag: {
    backgroundColor: COLORS.blue043142 + '15',
    borderRadius: nw(6),
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
  },
  topicItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: nh(8),
  },
  infoGrid: {
    gap: nh(8),
    marginTop: nh(8),
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: nw(20),
    gap: nw(12),
  },
  practiceButton: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    borderWidth: 1,
    borderColor: COLORS.blue043142,
    borderRadius: nw(8),
    paddingVertical: nh(12),
    alignItems: 'center',
  },
  assessmentButton: {
    flex: 1,
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(8),
    paddingVertical: nh(12),
    alignItems: 'center',
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(24),
    alignItems: 'center',
    marginHorizontal: nw(40),
  },
});

export default IntelliTestExamSelection;