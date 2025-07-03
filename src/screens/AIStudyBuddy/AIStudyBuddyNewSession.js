// screens/AIStudyBuddy/AIStudyBuddyNewSession.js
import React, {useState, useEffect, useRef} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';

// Import AI Study Buddy API services
import {
  aiStudyBuddyGetQuotaApi,
  aiStudyBuddyInitSessionApi,
  formatAiStudyBuddyError,
  isAiStudyBuddyQuotaExceeded,
} from '../../services/apiService';

const {width: screenWidth} = Dimensions.get('window');

const AIStudyBuddyNewSession = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // Route params
  const {preselectedSubject, preselectedSyllabus, comeFromQuiz} = route.params || {};

  // State management
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [selectedSubject, setSelectedSubject] = useState(preselectedSubject || '');
  const [selectedSyllabus, setSelectedSyllabus] = useState(preselectedSyllabus || '');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [initialQuery, setInitialQuery] = useState('');
  
  // Custom fields
  const [customSubject, setCustomSubject] = useState('');
  const [customSyllabus, setCustomSyllabus] = useState('');
  const [customTopics, setCustomTopics] = useState('');
  const [studyGoals, setStudyGoals] = useState('');

  // Enhanced subject data focused on higher education and competitive exams
  const subjectData = [
    { 
      id: 'mathematics', 
      name: 'Mathematics', 
      icon: 'calculate', 
      color: '#2563EB',
      description: 'Calculus, Linear Algebra, Differential Equations',
      syllabi: ['jee_main', 'jee_advanced', 'gate', 'undergraduate', 'postgraduate'],
      examTypes: ['JEE', 'GATE', 'Engineering']
    },
    { 
      id: 'physics', 
      name: 'Physics', 
      icon: 'science', 
      color: '#059669',
      description: 'Mechanics, Thermodynamics, Quantum Physics',
      syllabi: ['jee_main', 'jee_advanced', 'neet', 'gate', 'undergraduate'],
      examTypes: ['JEE', 'NEET', 'GATE']
    },
    { 
      id: 'chemistry', 
      name: 'Chemistry', 
      icon: 'biotech', 
      color: '#DC2626',
      description: 'Organic, Inorganic, Physical Chemistry',
      syllabi: ['jee_main', 'jee_advanced', 'neet', 'gate', 'undergraduate'],
      examTypes: ['JEE', 'NEET', 'GATE']
    },
    { 
      id: 'biology', 
      name: 'Biology', 
      icon: 'eco', 
      color: '#7C3AED',
      description: 'Molecular Biology, Genetics, Biotechnology',
      syllabi: ['neet', 'undergraduate', 'postgraduate'],
      examTypes: ['NEET', 'Medical', 'Research']
    },
    { 
      id: 'computer_science', 
      name: 'Computer Science', 
      icon: 'computer', 
      color: '#0891B2',
      description: 'Algorithms, Data Structures, System Design',
      syllabi: ['gate', 'undergraduate', 'postgraduate', 'tech_interviews'],
      examTypes: ['GATE', 'Tech Jobs', 'MS/PhD']
    },
    { 
      id: 'english', 
      name: 'English', 
      icon: 'menu-book', 
      color: '#EA580C',
      description: 'Literature, Writing, Communication Skills',
      syllabi: ['cat', 'upsc', 'undergraduate', 'gre_gmat'],
      examTypes: ['CAT', 'UPSC', 'GRE/GMAT']
    },
    {
      id: 'economics',
      name: 'Economics',
      icon: 'trending-up',
      color: '#BE185D',
      description: 'Microeconomics, Macroeconomics, Econometrics',
      syllabi: ['cat', 'upsc', 'undergraduate', 'postgraduate'],
      examTypes: ['CAT', 'UPSC', 'MBA']
    },
    {
      id: 'management',
      name: 'Management',
      icon: 'business',
      color: '#059669',
      description: 'Strategy, Operations, Marketing, Finance',
      syllabi: ['cat', 'mat', 'undergraduate', 'mba'],
      examTypes: ['CAT', 'MBA', 'Corporate']
    },
    {
      id: 'mechanical_engineering',
      name: 'Mechanical Engineering',
      icon: 'engineering',
      color: '#7C2D12',
      description: 'Thermodynamics, Mechanics, Manufacturing',
      syllabi: ['gate', 'undergraduate', 'postgraduate'],
      examTypes: ['GATE', 'PSU', 'Engineering']
    },
    {
      id: 'electrical_engineering',
      name: 'Electrical Engineering',
      icon: 'electrical-services',
      color: '#BE123C',
      description: 'Circuit Analysis, Power Systems, Electronics',
      syllabi: ['gate', 'undergraduate', 'postgraduate'],
      examTypes: ['GATE', 'PSU', 'Engineering']
    },
    {
      id: 'custom',
      name: 'Custom Subject',
      icon: 'tune',
      color: '#6366F1',
      description: 'Define your own subject and curriculum',
      syllabi: ['custom'],
      examTypes: ['Flexible', 'Any Topic']
    },
  ];

  // Enhanced syllabus data focused on higher education and competitive exams
  const syllabusData = {
    'jee_main': 'JEE Main',
    'jee_advanced': 'JEE Advanced',
    'neet': 'NEET UG',
    'gate': 'GATE',
    'cat': 'CAT',
    'mat': 'MAT',
    'gmat': 'GMAT',
    'gre': 'GRE',
    'gre_gmat': 'GRE/GMAT',
    'upsc': 'UPSC',
    'ssc': 'SSC',
    'bank_po': 'Bank PO',
    'undergraduate': 'Undergraduate',
    'postgraduate': 'Post Graduate',
    'mba': 'MBA',
    'tech_interviews': 'Tech Interviews',
    'ca_foundation': 'CA Foundation',
    'ca_intermediate': 'CA Intermediate',
    'cs_executive': 'CS Executive',
    'custom': 'Custom Curriculum'
  };

  // Level/Grade data focused on higher education
  const gradeData = [
    { id: 'undergraduate', name: 'Undergraduate', icon: 'school', description: 'Bachelor\'s degree level' },
    { id: 'postgraduate', name: 'Post Graduate', icon: 'account-balance', description: 'Master\'s degree level' },
    { id: 'entrance_prep', name: 'Entrance Prep', icon: 'emoji-events', description: 'Competitive exam preparation' },
    { id: 'professional', name: 'Professional', icon: 'work', description: 'Working professional' },
  ];

  // Step configuration
  const steps = [
    { id: 1, title: 'Subject', description: 'Choose your subject' },
    { id: 2, title: 'Curriculum', description: 'Select syllabus' },
    { id: 3, title: 'Ready', description: 'Start learning' },
  ];

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [quotaResponse] = await Promise.all([
        aiStudyBuddyGetQuotaApi(),
      ]);
      setQuotaInfo(quotaResponse.data.quota);
    } catch (error) {
      console.error('Load data error:', error);
      showToast({
        message: 'Failed to load data. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  // Get available syllabi for selected subject
  const getAvailableSyllabi = () => {
    const subject = subjectData.find(s => s.id === selectedSubject);
    return subject?.syllabi || [];
  };

  // Validate current step
  const isStepValid = (step) => {
    switch (step) {
      case 1: 
        if (selectedSubject === 'custom') {
          return customSubject.trim() !== '';
        }
        return selectedSubject !== '';
      case 2: 
        if (selectedSubject === 'custom') {
          return customSyllabus.trim() !== '';
        }
        return selectedSyllabus !== '';
      case 3: return true;
      default: return false;
    }
  };

  // Navigate to next step
  const nextStep = () => {
    if (currentStep < 3 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navigate to previous step
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Create session
  const createSession = async () => {
    const finalSubject = selectedSubject === 'custom' ? customSubject : selectedSubject;
    const finalSyllabus = selectedSyllabus === 'custom' ? customSyllabus : selectedSyllabus;
    
    if (!finalSubject || !finalSyllabus) {
      showToast({
        message: 'Please complete all required selections',
        type: 'error',
      });
      return;
    }

    try {
      setCreating(true);

      const payload = {
        subject: finalSubject,
        syllabus: finalSyllabus,
        grade: selectedGrade,
        initialQuery: initialQuery.trim(),
        customTopics: customTopics.trim(),
        studyGoals: studyGoals.trim(),
        learningGoals: [],
      };

      const response = await aiStudyBuddyInitSessionApi(payload);
      
      if (response.data.success) {
        navigation.replace(Routes.AIStudyBuddyChat, {
          sessionId: response.data.session.sessionId,
          subject: response.data.session.subject,
          syllabus: response.data.session.syllabus,
          isNewSession: true,
          initialQuery: initialQuery.trim() || undefined,
        });

        showToast({
          message: 'Study session started! Ask me anything.',
          type: 'success',
        });
      }
    } catch (error) {
      console.error('Create session error:', error);
      
      if (isAiStudyBuddyQuotaExceeded(error)) {
        Alert.alert(
          'Daily Limit Reached',
          'You\'ve used all your questions for today. Your quota will reset at midnight.',
          [
            { text: 'OK' },
            { 
              text: 'View Quota', 
              onPress: () => navigation.navigate(Routes.AIStudyBuddyQuotaStatus) 
            },
          ]
        );
      } else {
        showToast({
          message: formatAiStudyBuddyError(error),
          type: 'error',
        });
      }
    } finally {
      setCreating(false);
    }
  };

  // Render progress indicator
  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        {steps.map((step, index) => (
          <View key={step.id} style={styles.progressStep}>
            <View style={[
              styles.progressDot,
              {
                backgroundColor: currentStep >= step.id ? '#2563EB' : '#E5E7EB',
              }
            ]}>
              {currentStep > step.id ? (
                <Icon name="check" size={12} color="white" />
              ) : (
                <Text style={[
                  styles.progressNumber,
                  { color: currentStep >= step.id ? 'white' : '#9CA3AF' }
                ]}>
                  {step.id}
                </Text>
              )}
            </View>
            {index < steps.length - 1 && (
              <View style={[
                styles.progressLine,
                { backgroundColor: currentStep > step.id ? '#2563EB' : '#E5E7EB' }
              ]} />
            )}
          </View>
        ))}
      </View>
      <View style={styles.progressLabels}>
        {steps.map((step) => (
          <View key={step.id} style={styles.progressLabel}>
            <Text style={[
              styles.progressTitle,
              { color: currentStep >= step.id ? '#2563EB' : '#9CA3AF' }
            ]}>
              {step.title}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  // Render quota status
  const renderQuotaStatus = () => {
    if (!quotaInfo) return null;

    const remaining = quotaInfo.dailyQuota?.remaining || 0;
    const total = quotaInfo.dailyQuota?.limit || 0;

    return (
      <View style={styles.quotaContainer}>
      <Text style={styles.quotaTitle}>Questions Remaining Today</Text>
      <View style={styles.progressBarBackground}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${(remaining/total)*100}%`,
              backgroundColor:
                remaining > 5
                  ? '#10B981'
                  : remaining > 2
                  ? '#F59E0B'
                  : '#EF4444',
            },
          ]}
        />
      </View>
      <Text style={styles.quotaText}>
        {remaining} / {total}
      </Text>
    </View>
    );
  };

  // Render step 1: Subject selection
  const renderSubjectSelection = () => {
    if (currentStep !== 1) return null;

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Choose Your Subject</Text>
          <Text style={styles.stepSubtitle}>
            What would you like to study today?
          </Text>
        </View>

        <View style={styles.subjectsGrid}>
          {subjectData.map((subject) => {
            const isSelected = selectedSubject === subject.id;
            
            return (
              <Pressable
                key={subject.id}
                style={[
                  styles.subjectCard,
                  isSelected && styles.selectedSubjectCard,
                ]}
                onPress={() => {
                  setSelectedSubject(subject.id);
                  setSelectedSyllabus(''); // Reset syllabus when changing subject
                  // Reset custom fields when switching away from custom
                  if (subject.id !== 'custom') {
                    setCustomSubject('');
                    setCustomSyllabus('');
                    setCustomTopics('');
                  }
                }}
              >
                <LinearGradient
                  colors={isSelected ? [subject.color, subject.color + 'CC'] : ['#F8FAFC', '#F1F5F9']}
                  style={styles.subjectGradient}
                >
                  <Icon 
                    name={subject.icon} 
                    size={28} 
                    color={isSelected ? 'white' : subject.color} 
                  />
                </LinearGradient>
                
                <View style={styles.subjectInfo}>
                  <Text style={[
                    styles.subjectName,
                    { color: isSelected ? subject.color : '#111827' }
                  ]}>
                    {subject.name}
                  </Text>
                  <Text style={styles.subjectDescription}>
                    {subject.description}
                  </Text>
                  <View style={styles.examTags}>
                    {subject.examTypes.map((exam, index) => (
                      <View key={index} style={[styles.examTag, { backgroundColor: subject.color + '15' }]}>
                        <Text style={[styles.examTagText, { color: subject.color }]}>
                          {exam}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: subject.color }]}>
                    <Icon name="check" size={16} color="white" />
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Custom Subject Input */}
        {selectedSubject === 'custom' && (
          <View style={styles.customInputSection}>
            <Text style={styles.customInputLabel}>Enter Your Subject</Text>
            <TextInput
              style={styles.customInput}
              placeholder="e.g., Data Science, Psychology, Literature, etc."
              placeholderTextColor="#9CA3AF"
              value={customSubject}
              onChangeText={setCustomSubject}
              maxLength={50}
            />
            <Text style={styles.inputHint}>
              What subject would you like to study today?
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Render step 2: Syllabus selection
  const renderSyllabusSelection = () => {
    if (currentStep !== 2) return null;

    const availableSyllabi = getAvailableSyllabi();
    const selectedSubjectData = subjectData.find(s => s.id === selectedSubject);

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepTitle}>Select Your Curriculum</Text>
          <Text style={styles.stepSubtitle}>
            Choose the syllabus for {selectedSubject === 'custom' ? customSubject || 'your subject' : selectedSubjectData?.name}
          </Text>
        </View>

        <View style={styles.syllabusContainer}>
          {availableSyllabi.map((syllabusId, index) => {
            const isSelected = selectedSyllabus === syllabusId;
            const syllabusName = syllabusData[syllabusId] || syllabusId;
            
            return (
              <Pressable
                key={syllabusId}
                style={[
                  styles.syllabusCard,
                  isSelected && styles.selectedSyllabusCard,
                  { borderColor: isSelected ? selectedSubjectData?.color : '#E5E7EB' }
                ]}
                onPress={() => setSelectedSyllabus(syllabusId)}
              >
                <View style={styles.syllabusContent}>
                  <View style={[
                    styles.syllabusIcon,
                    { backgroundColor: isSelected ? selectedSubjectData?.color + '15' : '#F8FAFC' }
                  ]}>
                    <Icon 
                      name={syllabusId.includes('jee') ? 'engineering' : 
                            syllabusId.includes('neet') ? 'local-hospital' :
                            syllabusId.includes('gate') ? 'computer' :
                            syllabusId.includes('cat') || syllabusId.includes('mat') ? 'business' :
                            syllabusId.includes('gre') || syllabusId.includes('gmat') ? 'flight-takeoff' :
                            syllabusId.includes('upsc') || syllabusId.includes('ssc') ? 'account-balance' :
                            syllabusId.includes('undergraduate') ? 'school' :
                            syllabusId.includes('postgraduate') ? 'school' :
                            syllabusId.includes('mba') ? 'business-center' :
                            syllabusId.includes('tech') ? 'code' :
                            syllabusId.includes('custom') ? 'tune' :
                            'book'} 
                      size={20} 
                      color={isSelected ? selectedSubjectData?.color : '#64748B'} 
                    />
                  </View>
                  
                  <View style={styles.syllabusTextContainer}>
                    <Text style={[
                      styles.syllabusName,
                      { color: isSelected ? selectedSubjectData?.color : '#111827' }
                    ]}>
                      {syllabusName}
                    </Text>
                    <Text style={styles.syllabusDescription}>
                      {syllabusId.includes('jee') ? 'Engineering Entrance' :
                       syllabusId.includes('neet') ? 'Medical Entrance' :
                       syllabusId.includes('gate') ? 'Post Graduate Entrance' :
                       syllabusId.includes('cat') || syllabusId.includes('mat') ? 'Management Entrance' :
                       syllabusId.includes('gre') || syllabusId.includes('gmat') ? 'International Exam' :
                       syllabusId.includes('upsc') ? 'Civil Services' :
                       syllabusId.includes('ssc') ? 'Staff Selection' :
                       syllabusId.includes('bank') ? 'Banking Exam' :
                       syllabusId.includes('undergraduate') ? 'Bachelor\'s Level' :
                       syllabusId.includes('postgraduate') ? 'Master\'s Level' :
                       syllabusId.includes('mba') ? 'Business Administration' :
                       syllabusId.includes('tech') ? 'Technical Interview' :
                       syllabusId.includes('ca') ? 'Chartered Accountancy' :
                       syllabusId.includes('cs') ? 'Company Secretary' :
                       syllabusId.includes('custom') ? 'Custom Study' :
                       'Academic Course'}
                    </Text>
                  </View>

                  {isSelected && (
                    <View style={[styles.syllabusCheck, { backgroundColor: selectedSubjectData?.color }]}>
                      <Icon name="check" size={14} color="white" />
                    </View>
                  )}
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Custom Syllabus Input */}
        {selectedSubject === 'custom' && selectedSyllabus === 'custom' && (
          <View style={styles.customInputSection}>
            <Text style={styles.customInputLabel}>Enter Your Curriculum/Context</Text>
            <TextInput
              style={styles.customInput}
              placeholder="e.g., University course, Self-study, Research project, etc."
              placeholderTextColor="#9CA3AF"
              value={customSyllabus}
              onChangeText={setCustomSyllabus}
              maxLength={50}
            />
            <Text style={styles.inputHint}>
              What's the context or level of your study?
            </Text>
          </View>
        )}

        {/* Custom Topics Input */}
        {selectedSubject === 'custom' && selectedSyllabus === 'custom' && (
          <View style={styles.customInputSection}>
            <Text style={styles.customInputLabel}>Specific Topics (Optional)</Text>
            <TextInput
              style={[styles.customInput, styles.multilineInput]}
              placeholder="e.g., Machine Learning algorithms, Cognitive psychology theories, Victorian literature..."
              placeholderTextColor="#9CA3AF"
              value={customTopics}
              onChangeText={setCustomTopics}
              multiline
              maxLength={200}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{customTopics.length}/200</Text>
          </View>
        )}

        {/* Optional Grade Selection */}
        <View style={styles.gradeSection}>
          <Text style={styles.gradeSectionTitle}>Level (Optional)</Text>
          <View style={styles.gradeContainer}>
            {gradeData.map((grade) => {
              const isSelected = selectedGrade === grade.id;
              
              return (
                <Pressable
                  key={grade.id}
                  style={[
                    styles.gradeChip,
                    isSelected && styles.selectedGradeChip,
                    { 
                      backgroundColor: isSelected ? selectedSubjectData?.color : '#F8FAFC',
                      borderColor: isSelected ? selectedSubjectData?.color : '#E5E7EB'
                    }
                  ]}
                  onPress={() => setSelectedGrade(isSelected ? '' : grade.id)}
                >
                  <Icon 
                    name={grade.icon} 
                    size={16} 
                    color={isSelected ? 'white' : '#64748B'} 
                  />
                  <View style={styles.gradeTextContainer}>
                    <Text style={[
                      styles.gradeText,
                      { color: isSelected ? 'white' : '#64748B' }
                    ]}>
                      {grade.name}
                    </Text>
                    <Text style={[
                      styles.gradeDescription,
                      { color: isSelected ? 'rgba(255,255,255,0.8)' : '#9CA3AF' }
                    ]}>
                      {grade.description}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Render step 3: Ready to start
  const renderReadyStep = () => {
    if (currentStep !== 3) return null;

    const selectedSubjectData = subjectData.find(s => s.id === selectedSubject);

    return (
      <View style={styles.stepContainer}>
        <View style={styles.readyHeader}>
          <View style={[styles.readyIcon, { backgroundColor: selectedSubjectData?.color + '15' || '#6366F115' }]}>
            <Icon name="auto-awesome" size={32} color={selectedSubjectData?.color || '#6366F1'} />
          </View>
          <Text style={styles.readyTitle}>All Set!</Text>
          <Text style={styles.readySubtitle}>
            You're ready to start learning {selectedSubject === 'custom' ? customSubject || 'your subject' : selectedSubjectData?.name}
          </Text>
        </View>

        <View style={styles.selectionSummary}>
          <View style={styles.summaryItem}>
            <Icon name="subject" size={20} color="#64748B" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Subject</Text>
              <Text style={styles.summaryValue}>
                {selectedSubject === 'custom' ? customSubject || 'Custom Subject' : selectedSubjectData?.name}
              </Text>
            </View>
          </View>
          
          <View style={styles.summaryItem}>
            <Icon name="book" size={20} color="#64748B" />
            <View style={styles.summaryText}>
              <Text style={styles.summaryLabel}>Curriculum</Text>
              <Text style={styles.summaryValue}>
                {selectedSyllabus === 'custom' ? customSyllabus || 'Custom Curriculum' : syllabusData[selectedSyllabus]}
              </Text>
            </View>
          </View>

          {selectedGrade && (
            <View style={styles.summaryItem}>
              <Icon name="school" size={20} color="#64748B" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Level</Text>
                <Text style={styles.summaryValue}>
                  {gradeData.find(g => g.id === selectedGrade)?.name}
                </Text>
              </View>
            </View>
          )}

          {selectedSubject === 'custom' && customTopics && (
            <View style={styles.summaryItem}>
              <Icon name="list" size={20} color="#64748B" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Topics</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {customTopics}
                </Text>
              </View>
            </View>
          )}

          {selectedSubject === 'custom' && studyGoals && (
            <View style={styles.summaryItem}>
              <Icon name="flag" size={20} color="#64748B" />
              <View style={styles.summaryText}>
                <Text style={styles.summaryLabel}>Goals</Text>
                <Text style={styles.summaryValue} numberOfLines={2}>
                  {studyGoals}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Enhanced initial question section with study goals for custom */}
        <View style={styles.initialQuerySection}>
          <Text style={styles.initialQueryTitle}>Start with a question (Optional)</Text>
          <TextInput
            style={styles.initialQueryInput}
            placeholder="e.g., Explain quadratic equations, Help with organic chemistry..."
            placeholderTextColor="#9CA3AF"
            value={initialQuery}
            onChangeText={setInitialQuery}
            multiline
            maxLength={200}
          />
          <Text style={styles.charCount}>{initialQuery.length}/200</Text>
        </View>

        {/* Study Goals for Custom Subject */}
        {selectedSubject === 'custom' && (
          <View style={styles.studyGoalsSection}>
            <Text style={styles.studyGoalsTitle}>What do you want to achieve? (Optional)</Text>
            <TextInput
              style={[styles.customInput, styles.multilineInput]}
              placeholder="e.g., Prepare for exam, understand concepts, solve problems, research project..."
              placeholderTextColor="#9CA3AF"
              value={studyGoals}
              onChangeText={setStudyGoals}
              multiline
              maxLength={150}
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>{studyGoals.length}/150</Text>
          </View>
        )}

        {/* Quick suggestions - different for custom vs predefined */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>
            {selectedSubject === 'custom' ? 'General Suggestions:' : 'Popular Questions:'}
          </Text>
          <View style={styles.suggestionsGrid}>
            {selectedSubject === 'custom' ? [
              'Explain the fundamentals',
              'How do I get started?',
              'What are the key concepts?',
              'Give me an overview'
            ] : [
              'Explain step by step',
              'Give practice problems',
              'Key formulas',
              'Solve this type'
            ].map((suggestion, index) => (
              <Pressable
                key={index}
                style={[styles.suggestionChip, { borderColor: selectedSubjectData?.color + '40' || '#6366F140' }]}
                onPress={() => setInitialQuery(suggestion)}
              >
                <Text style={[styles.suggestionText, { color: selectedSubjectData?.color || '#6366F1' }]}>
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>Setting up your study session...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      <Header 
        title="New Study Session"
        showBackButton
        onBackPress={() => navigation.goBack()}
      />

      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress Indicator */}
        {renderProgressIndicator()}

        {/* Quota Status */}
        {renderQuotaStatus()}

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Step Content */}
          {renderSubjectSelection()}
          {renderSyllabusSelection()}
          {renderReadyStep()}
        </ScrollView>

        {/* Bottom Navigation */}
        <View style={styles.bottomContainer}>
          <View style={styles.navigationButtons}>
            {currentStep > 1 && (
              <Pressable
                style={styles.backButton}
                onPress={prevStep}
              >
                <Icon name="arrow-back" size={20} color="#64748B" />
                <Text style={styles.backButtonText}>Back</Text>
              </Pressable>
            )}

            {currentStep < 3 ? (
              <Pressable
                style={[
                  styles.nextButton,
                  { 
                    backgroundColor: isStepValid(currentStep) ? '#2563EB' : '#D1D5DB',
                    flex: currentStep === 1 ? 1 : 0,
                  }
                ]}
                onPress={nextStep}
                disabled={!isStepValid(currentStep)}
              >
                <Text style={[
                  styles.nextButtonText,
                  { color: isStepValid(currentStep) ? 'white' : '#9CA3AF' }
                ]}>
                  Continue
                </Text>
                <Icon 
                  name="arrow-forward" 
                  size={20} 
                  color={isStepValid(currentStep) ? 'white' : '#9CA3AF'} 
                />
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.startButton,
                  { backgroundColor: creating ? '#93C5FD' : '#2563EB' }
                ]}
                onPress={createSession}
                disabled={creating}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Icon name="rocket-launch" size={20} color="white" />
                )}
                <Text style={styles.startButtonText}>
                  {creating ? 'Starting...' : 'Start Learning'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: nh(16),
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  keyboardContainer: {
    flex: 1,
  },

  // Progress Indicator
  progressContainer: {
    paddingHorizontal: nw(20),
    paddingVertical: nh(20),
    backgroundColor: '#F8FAFC',
  },
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: nh(12),
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: nw(28),
    height: nw(28),
    borderRadius: nw(14),
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressNumber: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressLine: {
    width: nw(40),
    height: 2,
    marginHorizontal: nw(8),
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: nw(14),
  },
  progressLabel: {
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Quota Status
  quotaContainer: {
    padding: nw(20),
    marginBottom: nh(16),
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 12,
  },
  quotaTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: nh(8),
    color: COLORS.grey333333,
    textAlign: 'center',
  },
  progressBarBackground: {
    height: nh(8),
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: nh(4),
    overflow: 'hidden',
    marginBottom: nh(8),
  },
  progressBarFill: {
    height: '100%',
  },
  quotaText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.grey333333,
    textAlign: 'right',
  },

  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: nh(20),
  },

  // Step Container
  stepContainer: {
    flex: 1,
    paddingHorizontal: nw(20),
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: nh(32),
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: nh(8),
    textAlign: 'center',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 24,
  },

  // Subject Selection
  subjectsGrid: {
    gap: nh(16),
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: nw(16),
    borderWidth: 2,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedSubjectCard: {
    borderColor: '#2563EB',
    backgroundColor: '#FAFBFF',
    shadowOpacity: 0.1,
    elevation: 4,
  },
  subjectGradient: {
    width: nw(56),
    height: nw(56),
    borderRadius: nw(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(16),
  },
  subjectInfo: {
    flex: 1,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: nh(4),
  },
  subjectDescription: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: nh(8),
  },
  examTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(6),
  },
  examTag: {
    paddingHorizontal: nw(8),
    paddingVertical: nh(4),
    borderRadius: 12,
  },
  examTagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  selectedIndicator: {
    width: nw(24),
    height: nw(24),
    borderRadius: nw(12),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Custom Input Styles
  customInputSection: {
    marginTop: nh(24),
    marginBottom: nh(16),
  },
  customInputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: nh(8),
  },
  customInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: nw(16),
    fontSize: 14,
    color: '#111827',
    minHeight: nh(48),
  },
  multilineInput: {
    minHeight: nh(80),
    textAlignVertical: 'top',
  },
  inputHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: nh(6),
    fontStyle: 'italic',
  },

  // Syllabus Selection
  syllabusContainer: {
    gap: nh(12),
  },
  syllabusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: nw(16),
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  selectedSyllabusCard: {
    backgroundColor: '#FAFBFF',
    shadowOpacity: 0.08,
    elevation: 3,
  },
  syllabusContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  syllabusIcon: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  syllabusTextContainer: {
    flex: 1,
  },
  syllabusName: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: nh(2),
  },
  syllabusDescription: {
    fontSize: 12,
    color: '#64748B',
  },
  syllabusCheck: {
    width: nw(20),
    height: nw(20),
    borderRadius: nw(10),
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Grade Selection
  gradeSection: {
    marginTop: nh(24),
  },
  gradeSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: nh(12),
  },
  gradeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(12),
    justifyContent: 'space-between',
  },
  gradeChip: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    borderRadius: 12,
    borderWidth: 1,
    minWidth: (screenWidth - nw(64)) / 2,
    marginBottom: nh(12),
  },
  selectedGradeChip: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradeTextContainer: {
    marginLeft: nw(8),
    flex: 1,
  },
  gradeText: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: nh(2),
  },
  gradeDescription: {
    fontSize: 11,
    lineHeight: 14,
  },

  // Ready Step
  readyHeader: {
    alignItems: 'left',
    marginBottom: nh(32),
  },
  readyIcon: {
    width: nw(64),
    height: nw(64),
    borderRadius: nw(32),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: nh(16),
  },
  readyTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: nh(8),
  },
  readySubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },

  // Selection Summary
  selectionSummary: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: nw(16),
    marginBottom: nh(24),
    gap: nh(12),
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nw(12),
  },
  summaryText: {
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: nh(2),
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  // Initial Query
  initialQuerySection: {
    marginBottom: nh(24),
  },
  initialQueryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: nh(12),
  },
  initialQueryInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: nw(16),
    fontSize: 14,
    color: '#111827',
    minHeight: nh(80),
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: nh(6),
  },

  // Study Goals
  studyGoalsSection: {
    marginBottom: nh(24),
  },
  studyGoalsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: nh(12),
  },

  // Suggestions
  suggestionsSection: {
    marginBottom: nh(24),
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: nh(12),
  },
  suggestionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: nw(8),
  },
  suggestionChip: {
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: '#FAFBFF',
  },
  suggestionText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Bottom Navigation
  bottomContainer: {
    padding: nw(20),
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: nw(12),
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(20),
    paddingVertical: nh(12),
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: nw(8),
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(24),
    paddingVertical: nh(12),
    borderRadius: 12,
    gap: nw(8),
  },
  nextButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: nh(14),
    borderRadius: 12,
    gap: nw(8),
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default AIStudyBuddyNewSession;