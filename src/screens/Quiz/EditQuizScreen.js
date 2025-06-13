import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Modal,
  RefreshControl,
  Keyboard,
} from 'react-native';
import DraggableFlatList from 'react-native-draggable-flatlist';
import LinearGradient from 'react-native-linear-gradient';
import moment from 'moment';
import {useSelector} from 'react-redux';

// Text component
const Text = ({children, style, variant, color, ...props}) => {
  let fontWeight = 'normal';
  let fontSize = 14;
  if (variant) {
    if (variant.includes('semibold')) fontWeight = '600';
    if (variant.includes('bold')) fontWeight = 'bold';
    if (variant.includes('10')) fontSize = 10;
    if (variant.includes('12')) fontSize = 12;
    if (variant.includes('14')) fontSize = 14;
    if (variant.includes('16')) fontSize = 16;
    if (variant.includes('18')) fontSize = 18;
    if (variant.includes('20')) fontSize = 20;
    if (variant.includes('24')) fontSize = 24;
  }
  return (
    <RNText style={[{fontSize, fontWeight, color}, style]} {...props}>
      {children}
    </RNText>
  );
};
import {Text as RNText} from 'react-native';

// Header component
const Header = ({title, onBack, rightComponent}) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Ionicons name="arrow-back" size={24} color={COLORS.whiteFFFFFF} />
    </TouchableOpacity>
    <Text variant="bold18" color={COLORS.whiteFFFFFF} numberOfLines={1} style={styles.headerTitle}>
      {title}
    </Text>
    {rightComponent || <View style={{width: 40}} />}
  </View>
);

// Tab Component
const TabBar = ({tabs, activeTab, onTabChange}) => (
  <View style={styles.tabContainer}>
    {tabs.map((tab) => (
      <TouchableOpacity
        key={tab.id}
        style={[styles.tab, activeTab === tab.id && styles.activeTab]}
        onPress={() => onTabChange(tab.id)}>
        <Text
          variant={activeTab === tab.id ? 'semibold14' : 'regular14'}
          color={activeTab === tab.id ? COLORS.yellowF5BE00 : COLORS.grey999999}>
          {tab.label}
        </Text>
        {tab.count !== undefined && (
          <View style={[styles.tabBadge, activeTab === tab.id && styles.tabBadgeActive]}>
            <Text
              variant="semibold10"
              color={activeTab === tab.id ? COLORS.yellowF5BE00 : COLORS.grey999999}>
              {tab.count}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    ))}
  </View>
);

// Question Card Component
const QuestionCard = ({question, index, onEdit, onDelete, isEditing = false}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <View style={[styles.questionCard, question.isAIGenerated && styles.aiQuestionCard]}>
      <View style={styles.questionHeader}>
        <View style={styles.questionNumber}>
          <Text variant="semibold12" color={COLORS.whiteFFFFFF}>
            Q{index + 1}
          </Text>
        </View>
        <View style={styles.questionContent}>
          <Text variant="semibold14" color={COLORS.blue043142} numberOfLines={isExpanded ? null : 2}>
            {question.questionText}
          </Text>
        </View>
        <View style={styles.questionActions}>
          {question.isAIGenerated && (
            <View style={styles.aiBadge}>
              <MaterialCommunityIcons name="robot" size={12} color={COLORS.purpleCommunity} />
            </View>
          )}
          <TouchableOpacity onPress={() => setIsExpanded(!isExpanded)} style={styles.iconButton}>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={COLORS.grey999999} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {isExpanded && (
        <View style={styles.questionDetails}>
          <View style={styles.optionsContainer}>
            {question.options.map((option, idx) => (
              <View key={idx} style={styles.optionRow}>
                <View style={[
                  styles.optionBullet,
                  option === question.correctAnswer && styles.correctOptionBullet
                ]}>
                  <Text variant="semibold12" color={COLORS.whiteFFFFFF}>
                    {String.fromCharCode(65 + idx)}
                  </Text>
                </View>
                <Text 
                  variant={option === question.correctAnswer ? "semibold14" : "regular14"}
                  color={option === question.correctAnswer ? COLORS.greenSuccess : COLORS.darkGrey333333}
                  style={styles.optionText}>
                  {option}
                </Text>
                {option === question.correctAnswer && (
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.greenSuccess} />
                )}
              </View>
            ))}
          </View>
          
          <View style={styles.questionFooter}>
            <TouchableOpacity style={styles.editButton} onPress={() => onEdit(question, index)}>
              <Ionicons name="pencil" size={16} color={COLORS.blue043142} />
              <Text variant="semibold12" color={COLORS.blue043142} style={{marginLeft: 4}}>
                Edit
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(index)}>
              <Ionicons name="trash" size={16} color={COLORS.redError} />
              <Text variant="semibold12" color={COLORS.redError} style={{marginLeft: 4}}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

// Question Editor Modal
const QuestionEditorModal = ({visible, question, onSave, onClose}) => {
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [errors, setErrors] = useState({});
  
  useEffect(() => {
    if (question) {
      setQuestionText(question.questionText || '');
      setOptions(question.options || ['', '', '', '']);
      const correctIndex = question.options?.indexOf(question.correctAnswer) || 0;
      setCorrectAnswer(correctIndex >= 0 ? correctIndex : 0);
    } else {
      // Reset for new question
      setQuestionText('');
      setOptions(['', '', '', '']);
      setCorrectAnswer(0);
    }
    setErrors({});
  }, [question, visible]);
  
  const validateQuestion = () => {
    const newErrors = {};
    
    if (!questionText.trim() || questionText.length < 10) {
      newErrors.questionText = 'Question must be at least 10 characters';
    }
    
    const filledOptions = options.filter(opt => opt.trim());
    if (filledOptions.length < 4) {
      newErrors.options = 'All 4 options are required';
    }
    
    // Check for duplicate options
    const uniqueOptions = new Set(options.map(opt => opt.trim().toLowerCase()));
    if (uniqueOptions.size < 4) {
      newErrors.options = 'Options must be unique';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSave = () => {
    if (!validateQuestion()) {
      return;
    }
    
    const questionData = {
      questionText: questionText.trim(),
      options: options.map(opt => opt.trim()),
      correctAnswer: options[correctAnswer].trim(),
      isAIGenerated: question?.isAIGenerated || false,
    };
    
    onSave(questionData);
  };
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text variant="bold18" color={COLORS.blue043142}>
              {question ? 'Edit Question' : 'Add New Question'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.grey999999} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Question Text */}
            <View style={styles.inputGroup}>
              <Text variant="semibold14" color={COLORS.blue043142} style={styles.inputLabel}>
                Question Text *
              </Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput, errors.questionText && styles.inputError]}
                value={questionText}
                onChangeText={setQuestionText}
                placeholder="Enter your question here..."
                placeholderTextColor={COLORS.grey999999}
                multiline
                maxLength={500}
              />
              {errors.questionText && (
                <Text variant="regular12" color={COLORS.redError}>
                  {errors.questionText}
                </Text>
              )}
            </View>
            
            {/* Options */}
            <View style={styles.inputGroup}>
              <Text variant="semibold14" color={COLORS.blue043142} style={styles.inputLabel}>
                Options *
              </Text>
              {options.map((option, index) => (
                <View key={index} style={styles.optionInputContainer}>
                  <View style={styles.optionInputWrapper}>
                    <View style={styles.optionLabel}>
                      <Text variant="semibold14" color={COLORS.grey999999}>
                        {String.fromCharCode(65 + index)}
                      </Text>
                    </View>
                    <TextInput
                      style={[styles.textInput, styles.optionInput]}
                      value={option}
                      onChangeText={(value) => handleOptionChange(index, value)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      placeholderTextColor={COLORS.grey999999}
                      maxLength={200}
                    />
                    <TouchableOpacity
                      style={[
                        styles.correctAnswerRadio,
                        correctAnswer === index && styles.correctAnswerRadioSelected
                      ]}
                      onPress={() => setCorrectAnswer(index)}>
                      {correctAnswer === index && (
                        <View style={styles.correctAnswerDot} />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
              {errors.options && (
                <Text variant="regular12" color={COLORS.redError}>
                  {errors.options}
                </Text>
              )}
              <Text variant="regular12" color={COLORS.grey999999} style={{marginTop: 4}}>
                Select the radio button for the correct answer
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text variant="semibold14" color={COLORS.grey999999}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
                {question ? 'Update Question' : 'Add Question'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// AI Generation Modal
const AIGenerationModal = ({visible, onClose, onGenerate, currentQuestionCount}) => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(5);
  const [additionalContext, setAdditionalContext] = useState('');
  const [pricing, setPricing] = useState(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  
  const maxQuestions = Math.max(0, 50 - currentQuestionCount);
  
  useEffect(() => {
    if (visible && count > 0) {
      checkPricing();
    }
  }, [count, visible]);
  
  const checkPricing = async () => {
    setIsLoadingPrice(true);
    try {
      // This would call calculateAIPriceApi
      // Mock pricing for now
      const freeRemaining = Math.max(0, 15 - currentQuestionCount);
      const paidCount = Math.max(0, count - freeRemaining);
      const amount = paidCount * 5; // ₹5 per question
      
      setPricing({
        freeQuestions: Math.min(count, freeRemaining),
        paidQuestions: paidCount,
        amount,
      });
    } catch (error) {
      console.error('Error checking pricing:', error);
    } finally {
      setIsLoadingPrice(false);
    }
  };
  
  const handleGenerate = () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a topic for question generation');
      return;
    }
    
    onGenerate({
      topic: topic.trim(),
      difficulty,
      count,
      additionalContext: additionalContext.trim(),
    });
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={[styles.modalContent, {maxHeight: '80%'}]}>
          <View style={styles.modalHeader}>
            <Text variant="bold18" color={COLORS.blue043142}>
              Generate Questions with AI
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.grey999999} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* AI Credits Info */}
            <View style={styles.aiInfoBox}>
              <MaterialCommunityIcons name="robot" size={24} color={COLORS.purpleCommunity} />
              <View style={{flex: 1, marginLeft: 12}}>
                <Text variant="semibold14" color={COLORS.blue043142}>
                  AI Question Generation
                </Text>
                <Text variant="regular12" color={COLORS.grey999999}>
                  Hurray!! You have {15 - currentQuestionCount} free AI credits left.
                </Text>
              </View>
            </View>
            
            {/* Topic Input */}
            <View style={styles.inputGroup}>
              <Text variant="semibold14" color={COLORS.blue043142} style={styles.inputLabel}>
                Topic *
              </Text>
              <TextInput
                style={styles.textInput}
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g., Indian History, Machine Learning"
                placeholderTextColor={COLORS.grey999999}
                maxLength={100}
              />
            </View>
            
            {/* Difficulty Selection */}
            <View style={styles.inputGroup}>
              <Text variant="semibold14" color={COLORS.blue043142} style={styles.inputLabel}>
                Difficulty Level
              </Text>
              <View style={styles.difficultyContainer}>
                {['easy', 'medium', 'hard'].map((level) => (
                  <TouchableOpacity
                    key={level}
                    style={[
                      styles.difficultyButton,
                      difficulty === level && styles.difficultyButtonActive
                    ]}
                    onPress={() => setDifficulty(level)}>
                    <Text
                      variant={difficulty === level ? 'semibold14' : 'regular14'}
                      color={difficulty === level ? COLORS.whiteFFFFFF : COLORS.blue043142}>
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            {/* Question Count */}
<View style={styles.inputGroup}>
  <Text variant="semibold14" color={COLORS.blue043142} style={styles.inputLabel}>
    Number of Questions
  </Text>
  <View style={styles.countContainer}>
    <TouchableOpacity
      style={styles.countButton}
      onPress={() => setCount(Math.max(1, count - 1))}
      disabled={count <= 1}>
      <Ionicons name="remove" size={20} color={count <= 1 ? COLORS.grey999999 : COLORS.blue043142} />
    </TouchableOpacity>
    <Text variant="semibold16" color={COLORS.blue043142} style={styles.countText}>
      {count}
    </Text>
    <TouchableOpacity
      style={styles.countButton}
      onPress={() => setCount(Math.min(15, count + 1))} // Sets the upper limit
      disabled={count >= 15}>
      <Ionicons name="add" size={20} color={count >= 15 ? COLORS.grey999999 : COLORS.blue043142} />
    </TouchableOpacity>
  </View>
  {/* Conditional helper text */}
  {count < 15 ? (
    <Text variant="regular12" color={COLORS.grey999999} style={{ marginTop: 4 }}>
      You can add up to {15 - count} more questions.
    </Text>
  ) : (
    <Text variant="regular12" color={COLORS.blue043142} style={{ marginTop: 4 }}>
      You have reached the maximum of 15 questions.
    </Text>
  )}
</View>
            
            {/* Additional Context */}
            <View style={styles.inputGroup}>
              <Text variant="semibold14" color={COLORS.blue043142} style={styles.inputLabel}>
                Additional Context (Optional)
              </Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                value={additionalContext}
                onChangeText={setAdditionalContext}
                placeholder="Any specific focus areas or guidelines for the AI..."
                placeholderTextColor={COLORS.grey999999}
                multiline
                maxLength={500}
              />
            </View>
            
          
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text variant="semibold14" color={COLORS.grey999999}>
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.generateButton, (!topic.trim() || count === 0) && styles.disabledButton]}
              onPress={handleGenerate}
              disabled={!topic.trim() || count === 0}>
              <MaterialCommunityIcons name="robot" size={16} color={COLORS.whiteFFFFFF} />
              <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={{marginLeft: 6}}>
                Generate {count} Questions
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

import {
  getQuizByIdApi,
  updateQuizDraftApi,
  generateAIQuestionsApi,
  calculateAIPriceApi,
  submitForReviewApi,
  deleteQuizDraftApi,
  initiateAIPaymentApi,
  verifyAIPaymentApi,
} from '../../services/apiService';
import Routes from '../../helper/routes';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

// Helper for responsive scaling
const {width: DEVICE_WIDTH, height: DEVICE_HEIGHT} = Dimensions.get('window');
const nw = percentage => (DEVICE_WIDTH * percentage) / 100;
const nh = percentage => (DEVICE_HEIGHT * percentage) / 100;

// Colors
const COLORS = {
  yellowF5BE00: '#F5BE00',
  blue043142: '#043142',
  whiteFFFFFF: '#FFFFFF',
  grey999999: '#999999',
  greyEEEEEE: '#EEEEEE',
  greyF7F7F7: '#F7F7F7',
  greenSuccess: '#28A745',
  redError: '#DC3545',
  lightBlueE6F0FF: '#E6F0FF',
  darkGrey333333: '#333333',
  purpleCommunity: '#8B5CF6',
  purpleLightBg: '#F3E8FF',
};

const TABS = {
  DETAILS: 'details',
  QUESTIONS: 'questions',
  AI_GENERATE: 'ai_generate',
};

const EditQuizScreen = ({navigation, route}) => {
  const {quizId, isNewQuiz = false} = route.params;
  const userdata = useSelector(state => state?.userData);
  
  // State Management
  const [activeTab, setActiveTab] = useState(isNewQuiz ? TABS.QUESTIONS : TABS.DETAILS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Quiz Data
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Modals
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  const [showAIModal, setShowAIModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Load Quiz Data
  useEffect(() => {
    loadQuizData();
  }, [quizId]);
  
  // Handle unsaved changes warning
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!hasUnsavedChanges) {
        return;
      }
      
      e.preventDefault();
      
      Alert.alert(
        'Discard changes?',
        'You have unsaved changes. Are you sure you want to discard them?',
        [
          {text: "Don't leave", style: 'cancel', onPress: () => {}},
          {
            text: 'Discard',
            style: 'destructive',
            onPress: () => navigation.dispatch(e.data.action),
          },
        ]
      );
    });
    
    return unsubscribe;
  }, [navigation, hasUnsavedChanges]);
  
  const loadQuizData = async () => {
    try {
      setIsLoading(true);
      const response = await getQuizByIdApi(quizId);
      
      if (response.data.success) {
        const quiz = response.data.data.quiz;
        setQuizData(quiz);
        setQuestions(quiz.questions || []);
      }
    } catch (error) {
      console.error('Error loading quiz:', error);
      Alert.alert('Error', 'Failed to load quiz data');
      navigation.goBack();
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  
  const handleSaveChanges = async (showSuccessAlert = true) => {
    try {
      setIsSaving(true);
      
      const updateData = {
        questions: questions.map(q => ({
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      };
      
      const response = await updateQuizDraftApi(quizId, updateData);
      
      if (response.data.success) {
        setHasUnsavedChanges(false);
        if (showSuccessAlert) {
          Alert.alert('Success', 'Changes saved successfully');
        }
      }
    } catch (error) {
      console.error('Error saving changes:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setEditingQuestionIndex(null);
    setShowQuestionEditor(true);
  };
  
  const handleEditQuestion = (question, index) => {
    setEditingQuestion(question);
    setEditingQuestionIndex(index);
    setShowQuestionEditor(true);
  };
  
  const handleSaveQuestion = (questionData) => {
    if (editingQuestionIndex !== null) {
      // Update existing question
      const updatedQuestions = [...questions];
      updatedQuestions[editingQuestionIndex] = {
        ...updatedQuestions[editingQuestionIndex],
        ...questionData,
      };
      setQuestions(updatedQuestions);
    } else {
      // Add new question
      setQuestions([...questions, questionData]);
    }
    
    setHasUnsavedChanges(true);
    setShowQuestionEditor(false);
  };
  
  const handleDeleteQuestion = (index) => {
    Alert.alert(
      'Delete Question',
      'Are you sure you want to delete this question?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedQuestions = questions.filter((_, i) => i !== index);
            setQuestions(updatedQuestions);
            setHasUnsavedChanges(true);
          },
        },
      ]
    );
  };
  
  const handleReorderQuestions = ({data}) => {
    setQuestions(data);
    setHasUnsavedChanges(true);
  };
  
  const handleAIGenerate = async (params) => {
    try {
      setShowAIModal(false);
      setIsLoading(true);
      
      const response = await generateAIQuestionsApi({
        quizId,
        ...params,
      });
      
      if (response.data.requiresPayment) {
        // Handle payment flow
        navigation.navigate(Routes.AIPayment, {
          transactionId: response.data.data.transactionId,
          pricing: response.data.data.pricing,
          payment: response.data.data.payment,
          onSuccess: () => {
            loadQuizData(); // Reload quiz after successful payment
          },
        });
      } else {
        // Questions are being generated
        Alert.alert(
          'AI Generation Started',
          'Your questions are being generated. This may take 10-30 seconds.',
          [{text: 'OK', onPress: () => loadQuizData()}]
        );
      }
    } catch (error) {
      console.error('Error generating AI questions:', error);
      Alert.alert('Error', 'Failed to generate questions');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmitForReview = async () => {
    // Validate before submission
    if (questions.length < 10) {
      Alert.alert('Validation Error', 'Minimum 10 questions required to submit for review');
      return;
    }
    
    Alert.alert(
      'Submit for Review',
      'Once submitted, you cannot make changes to this quiz. Are you sure?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Submit',
          style: 'default',
          onPress: async () => {
            try {
              setIsLoading(true);
              
              // Save any pending changes first
              if (hasUnsavedChanges) {
                await handleSaveChanges(false);
              }
              
              const response = await submitForReviewApi(quizId);
              
              if (response.data.success) {
                Alert.alert(
                  'Success',
                  'Your quiz has been submitted for review. You will be notified once it is approved.',
                  [
                    {
                      text: 'OK',
                      onPress: () => navigation.navigate(Routes.CreatorDashboard),
                    },
                  ]
                );
              }
            } catch (error) {
              console.error('Error submitting for review:', error);
              const errorMessage = error.response?.data?.errors?.join('\n') || 
                                  'Failed to submit quiz for review';
              Alert.alert('Error', errorMessage);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };
  
  const handleDeleteDraft = async () => {
    Alert.alert(
      'Delete Draft',
      'Are you sure you want to delete this quiz draft? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              await deleteQuizDraftApi(quizId);
              Alert.alert('Success', 'Quiz draft deleted successfully');
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting draft:', error);
              Alert.alert('Error', 'Failed to delete quiz draft');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };
  
  // Render Tab Content
  const renderTabContent = () => {
    switch (activeTab) {
      case TABS.DETAILS:
        return renderDetailsTab();
      case TABS.QUESTIONS:
        return renderQuestionsTab();
      case TABS.AI_GENERATE:
        return renderAIGenerateTab();
      default:
        return null;
    }
  };
  
  const renderDetailsTab = () => {
    if (!quizData) return null;
    
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.detailsContainer}>
          <View style={styles.detailCard}>
            <Text variant="semibold14" color={COLORS.grey999999}>
              Title
            </Text>
            <Text variant="semibold16" color={COLORS.blue043142} style={{marginTop: 4}}>
              {quizData.title}
            </Text>
          </View>
          
          <View style={styles.detailCard}>
            <Text variant="semibold14" color={COLORS.grey999999}>
              Description
            </Text>
            <Text variant="regular14" color={COLORS.darkGrey333333} style={{marginTop: 4}}>
              {quizData.description}
            </Text>
          </View>
          
          <View style={styles.detailRow}>
            <View style={[styles.detailCard, {flex: 1, marginRight: 8}]}>
              <Text variant="semibold14" color={COLORS.grey999999}>
                Difficulty
              </Text>
              <View style={styles.difficultyBadge}>
                <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
                  {quizData.difficulty?.toUpperCase()}
                </Text>
              </View>
            </View>
            
            <View style={[styles.detailCard, {flex: 1, marginLeft: 8}]}>
              <Text variant="semibold14" color={COLORS.grey999999}>
                Visibility
              </Text>
              <View style={styles.visibilityBadge}>
                <Ionicons 
                  name={quizData.visibility === 'private' ? 'lock-closed' : 'globe'} 
                  size={16} 
                  color={COLORS.blue043142} 
                />
                <Text variant="semibold14" color={COLORS.blue043142} style={{marginLeft: 4}}>
                  {quizData.visibility?.charAt(0).toUpperCase() + quizData.visibility?.slice(1)}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.detailCard}>
            <Text variant="semibold14" color={COLORS.grey999999}>
              Topics
            </Text>
            <View style={styles.topicsContainer}>
              {quizData.topics?.map((topic, index) => (
                <View key={index} style={styles.topicChip}>
                  <Text variant="regular12" color={COLORS.blue043142}>
                    {topic}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          <View style={styles.detailCard}>
            <Text variant="semibold14" color={COLORS.grey999999}>
              Schedule
            </Text>
            <View style={styles.scheduleInfo}>
              <View style={styles.scheduleRow}>
                <Ionicons name="calendar" size={16} color={COLORS.blue043142} />
                <Text variant="regular14" color={COLORS.darkGrey333333} style={{marginLeft: 8}}>
                  {moment(quizData.startTime).format('MMM DD, YYYY')}
                </Text>
              </View>
              <View style={styles.scheduleRow}>
                <Ionicons name="time" size={16} color={COLORS.blue043142} />
                <Text variant="regular14" color={COLORS.darkGrey333333} style={{marginLeft: 8}}>
                  {moment(quizData.startTime).format('hh:mm A')} - {moment(quizData.endTime).format('hh:mm A')}
                </Text>
              </View>
            </View>
          </View>
          
          <View style={styles.statusCard}>
            <Ionicons name="information-circle" size={20} color={COLORS.yellowF5BE00} />
            <View style={{flex: 1, marginLeft: 12}}>
              <Text variant="semibold14" color={COLORS.blue043142}>
                Draft Status
              </Text>
              <Text variant="regular12" color={COLORS.grey999999}>
                Last saved: {moment(quizData.lastSavedAt).fromNow()}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };
  
  const renderQuestionsTab = () => {
    if (questions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MaterialIcons name="quiz" size={64} color={COLORS.grey999999} />
          <Text variant="semibold18" color={COLORS.blue043142} style={{marginTop: 16}}>
            No Questions Added Yet
          </Text>
          <Text variant="regular14" color={COLORS.grey999999} style={{marginTop: 8, textAlign: 'center'}}>
            Start building your quiz by adding questions manually or using AI generation
          </Text>
          <TouchableOpacity style={styles.addFirstQuestionButton} onPress={handleAddQuestion}>
            <Ionicons name="add-circle" size={20} color={COLORS.whiteFFFFFF} />
            <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={{marginLeft: 8}}>
              Add Your First Question
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    return (
      <View style={{flex: 1}}>
        <DraggableFlatList
          data={questions}
          renderItem={({item, index, drag, isActive}) => (
            <TouchableOpacity
              onLongPress={drag}
              disabled={isActive}
              style={[
                styles.draggableItem,
                isActive && styles.draggableItemActive,
              ]}>
              <QuestionCard
                question={item}
                index={index}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
              />
            </TouchableOpacity>
          )}
          keyExtractor={(item, index) => `question-${index}`}
          onDragEnd={handleReorderQuestions}
          ListFooterComponent={() => (
            <TouchableOpacity style={styles.addQuestionButton} onPress={handleAddQuestion}>
              <Ionicons name="add-circle-outline" size={24} color={COLORS.blue043142} />
              <Text variant="semibold14" color={COLORS.blue043142} style={{marginLeft: 8}}>
                Add Another Question
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.questionsList}
        />
        
        {/* Save Changes FAB */}
        {hasUnsavedChanges && (
          <TouchableOpacity 
            style={styles.saveFAB} 
            onPress={() => handleSaveChanges()}>
            <Ionicons name="save" size={24} color={COLORS.whiteFFFFFF} />
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  const renderAIGenerateTab = () => {
    return (
      <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
        <View style={styles.aiContainer}>
          <LinearGradient
            colors={[COLORS.purpleLightBg, '#E9D5FF']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.aiHeroCard}>
            <MaterialCommunityIcons name="robot" size={48} color={COLORS.purpleCommunity} />
            <Text variant="bold20" color={COLORS.purpleCommunity} style={{marginTop: 16}}>
              AI Question Generator
            </Text>
            <Text variant="regular14" color={COLORS.darkGrey333333} style={{marginTop: 8, textAlign: 'center'}}>
              
            </Text>
          </LinearGradient>
          
          <View style={styles.aiFeatures}>
            <View style={styles.aiFeatureCard}>
              <View style={styles.aiFeatureIcon}>
                <Ionicons name="flash" size={24} color={COLORS.yellowF5BE00} />
              </View>
              <Text variant="semibold14" color={COLORS.blue043142}>
                Lightning Fast
              </Text>
              <Text variant="regular12" color={COLORS.grey999999} style={{marginTop: 4, textAlign: 'center'}}>
                Generate questions in seconds
              </Text>
            </View>
            
            <View style={styles.aiFeatureCard}>
              <View style={styles.aiFeatureIcon}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.greenSuccess} />
              </View>
              <Text variant="semibold14" color={COLORS.blue043142}>
                High Quality
              </Text>
              <Text variant="regular12" color={COLORS.grey999999} style={{marginTop: 4, textAlign: 'center'}}>
                Accurate and relevant questions
              </Text>
            </View>
            
            <View style={styles.aiFeatureCard}>
              <View style={styles.aiFeatureIcon}>
                <Ionicons name="gift" size={24} color={COLORS.purpleCommunity} />
              </View>
              <Text variant="semibold14" color={COLORS.blue043142}>
                15 Free Credits
              </Text>
              <Text variant="regular12" color={COLORS.grey999999} style={{marginTop: 4, textAlign: 'center'}}>
                Per quiz for every creator
              </Text>
            </View>
          </View>
          
          <View style={styles.creditInfoCard}>
            <Text variant="semibold16" color={COLORS.blue043142}>
              Your AI Credits
            </Text>
            <View style={styles.creditStats}>
              <View style={styles.creditStatItem}>
                <Text variant="regular12" color={COLORS.grey999999}>
                  Used in this quiz
                </Text>
                <Text variant="bold20" color={COLORS.purpleCommunity}>
                  {questions.filter(q => q.isAIGenerated).length}
                </Text>
              </View>
              <View style={styles.creditDivider} />
              <View style={styles.creditStatItem}>
                <Text variant="regular12" color={COLORS.grey999999}>
                  Free remaining
                </Text>
                <Text variant="bold20" color={COLORS.greenSuccess}>
                  {Math.max(0, 15 - questions.filter(q => q.isAIGenerated).length)}
                </Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => setShowAIModal(true)}>
            <MaterialCommunityIcons name="robot" size={24} color={COLORS.whiteFFFFFF} />
            <Text variant="semibold16" color={COLORS.whiteFFFFFF} style={{marginLeft: 8}}>
              Generate Questions with AI
            </Text>
          </TouchableOpacity>
          
          
        </View>
      </ScrollView>
    );
  };
  
  if (isLoading && !isRefreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
        <Text variant="regular16" color={COLORS.blue043142} style={{marginTop: 16}}>
          Loading quiz...
        </Text>
      </View>
    );
  }
  
  const tabs = [
    {id: TABS.DETAILS, label: 'Details'},
    {id: TABS.QUESTIONS, label: 'Questions', count: questions.length},
    {id: TABS.AI_GENERATE, label: 'AI Generate'},
  ];
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.blue043142} />
      
      <LinearGradient
        colors={[COLORS.blue043142, '#02293A']}
        style={styles.headerGradient}>
        <Header
          title={quizData?.title || 'Edit Quiz'}
          onBack={() => navigation.goBack()}
          rightComponent={
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleDeleteDraft} style={styles.headerButton}>
                <Ionicons name="trash-outline" size={20} color={COLORS.whiteFFFFFF} />
              </TouchableOpacity>
            </View>
          }
        />
      </LinearGradient>
      
      <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <View style={styles.content}>
        {renderTabContent()}
      </View>
      
      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.previewButton, questions.length === 0 && styles.disabledButton]}
          onPress={() => setShowPreview(true)}
          disabled={questions.length === 0}>
          <Ionicons name="eye-outline" size={20} color={COLORS.blue043142} />
          <Text variant="semibold14" color={COLORS.blue043142} style={{marginLeft: 6}}>
            Preview
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.submitButton, questions.length < 10 && styles.disabledButton]}
          onPress={handleSubmitForReview}
          disabled={questions.length < 10 || isSaving}>
          {isSaving ? (
            <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
          ) : (
            <>
              <Ionicons name="send" size={20} color={COLORS.whiteFFFFFF} />
              <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={{marginLeft: 6}}>
                Submit for Review
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      {/* Modals */}
      <QuestionEditorModal
        visible={showQuestionEditor}
        question={editingQuestion}
        onSave={handleSaveQuestion}
        onClose={() => setShowQuestionEditor(false)}
      />
      
      <AIGenerationModal
        visible={showAIModal}
        onClose={() => setShowAIModal(false)}
        onGenerate={handleAIGenerate}
        currentQuestionCount={questions.length}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(4),
    paddingVertical: nh(2),
  },
  headerTitle: {
    flex: 1,
    marginHorizontal: nw(4),
    textAlign: 'center',
  },
  backButton: {
    padding: nw(2),
    marginLeft: -nw(2),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: nw(2),
    marginLeft: nw(2),
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  tab: {
    flex: 1,
    paddingVertical: nh(1.8),
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
    flexDirection: 'row',
  },
  activeTab: {
    borderBottomColor: COLORS.yellowF5BE00,
  },
  tabBadge: {
    backgroundColor: COLORS.greyEEEEEE,
    paddingHorizontal: nw(2),
    paddingVertical: nh(0.2),
    borderRadius: 10,
    marginLeft: nw(1),
  },
  tabBadgeActive: {
    backgroundColor: COLORS.yellowF5BE00 + '20',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: nw(4),
    paddingTop: nh(2),
  },
  
  // Details Tab Styles
  detailsContainer: {
    paddingBottom: nh(2),
  },
  detailCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(4),
    borderRadius: 12,
    marginBottom: nh(2),
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: nh(2),
  },
  difficultyBadge: {
    backgroundColor: COLORS.yellowF5BE00,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  visibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlueE6F0FF,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  topicChip: {
    backgroundColor: COLORS.purpleLightBg,
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.6),
    borderRadius: 16,
    marginRight: nw(2),
    marginBottom: nh(1),
  },
  scheduleInfo: {
    marginTop: 8,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(0.8),
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.yellowF5BE00 + '20',
    padding: nw(4),
    borderRadius: 12,
    marginBottom: nh(2),
  },
  
  // Questions Tab Styles
  questionsList: {
    paddingHorizontal: nw(4),
    paddingTop: nh(2),
    paddingBottom: nh(10),
  },
  draggableItem: {
    marginBottom: nh(1.5),
  },
  draggableItemActive: {
    opacity: 0.8,
  },
  questionCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: nw(3),
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  aiQuestionCard: {
    borderColor: COLORS.purpleCommunity + '40',
    borderWidth: 1.5,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionNumber: {
    backgroundColor: COLORS.blue043142,
    width: nw(8),
    height: nw(8),
    borderRadius: nw(4),
    alignItems: 'center',
    justifyContent: 'center',
  },
  questionContent: {
    flex: 1,
    marginHorizontal: nw(3),
  },
  questionActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBadge: {
    backgroundColor: COLORS.purpleLightBg,
    width: nw(6),
    height: nw(6),
    borderRadius: nw(3),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(2),
  },
  iconButton: {
    padding: nw(1),
  },
  questionDetails: {
    marginTop: nh(2),
  },
  optionsContainer: {
    marginBottom: nh(2),
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(1),
  },
  optionBullet: {
    backgroundColor: COLORS.greyEEEEEE,
    width: nw(7),
    height: nw(7),
    borderRadius: nw(3.5),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(3),
  },
  correctOptionBullet: {
    backgroundColor: COLORS.greenSuccess,
  },
  optionText: {
    flex: 1,
    marginRight: nw(2),
  },
  questionFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingTop: nh(1),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 20,
    backgroundColor: COLORS.lightBlueE6F0FF,
    marginRight: nw(2),
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(3),
    paddingVertical: nh(0.8),
    borderRadius: 20,
    backgroundColor: COLORS.redError + '20',
  },
  addQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(4),
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.blue043142,
    borderStyle: 'dashed',
    marginTop: nh(2),
  },
  addFirstQuestionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue043142,
    paddingHorizontal: nw(6),
    paddingVertical: nh(2),
    borderRadius: 25,
    marginTop: nh(3),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: nw(8),
  },
  saveFAB: {
    position: 'absolute',
    bottom: nh(2),
    right: nw(4),
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.greenSuccess,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  
  // AI Generate Tab Styles
  aiContainer: {
    paddingBottom: nh(2),
  },
  aiHeroCard: {
    padding: nw(6),
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: nh(3),
  },
  aiFeatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: nh(3),
  },
  aiFeatureCard: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(3),
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: nw(1),
  },
  aiFeatureIcon: {
    width: nw(12),
    height: nw(12),
    borderRadius: nw(6),
    backgroundColor: COLORS.greyF7F7F7,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: nh(1),
  },
  creditInfoCard: {
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(4),
    borderRadius: 12,
    marginBottom: nh(3),
  },
  creditStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: nh(2),
  },
  creditStatItem: {
    alignItems: 'center',
  },
  creditDivider: {
    width: 1,
    height: nh(5),
    backgroundColor: COLORS.greyEEEEEE,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.purpleCommunity,
    paddingVertical: nh(2),
    borderRadius: 12,
  },
  
  // Bottom Bar Styles
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(4),
    paddingVertical: nh(2),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingVertical: nh(1.5),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.blue043142,
    marginRight: nw(2),
  },
  submitButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.yellowF5BE00,
    paddingVertical: nh(1.5),
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: nh(2),
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: nw(4),
    paddingBottom: nh(2),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  modalBody: {
    paddingHorizontal: nw(4),
    paddingTop: nh(2),
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: nw(4),
    paddingVertical: nh(2),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },
  inputGroup: {
    marginBottom: nh(2.5),
  },
  inputLabel: {
    marginBottom: nh(0.8),
  },
  textInput: {
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: 8,
    paddingHorizontal: nw(3),
    paddingVertical: nh(1.5),
    fontSize: 14,
    color: COLORS.blue043142,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
  },
  multilineInput: {
    minHeight: nh(10),
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: COLORS.redError,
  },
  optionInputContainer: {
    marginBottom: nh(1.5),
  },
  optionInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    backgroundColor: COLORS.greyEEEEEE,
    width: nw(8),
    height: nw(8),
    borderRadius: nw(4),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(2),
  },
  optionInput: {
    flex: 1,
    marginRight: nw(2),
  },
  correctAnswerRadio: {
    width: nw(6),
    height: nw(6),
    borderRadius: nw(3),
    borderWidth: 2,
    borderColor: COLORS.grey999999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  correctAnswerRadioSelected: {
    borderColor: COLORS.greenSuccess,
  },
  correctAnswerDot: {
    width: nw(3),
    height: nw(3),
    borderRadius: nw(1.5),
    backgroundColor: COLORS.greenSuccess,
  },
  cancelButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(1.5),
    borderRadius: 8,
    backgroundColor: COLORS.greyF7F7F7,
    marginRight: nw(2),
  },
  saveButton: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(1.5),
    borderRadius: 8,
    backgroundColor: COLORS.blue043142,
  },
  
  // AI Modal Styles
  aiInfoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.purpleLightBg,
    padding: nw(4),
    borderRadius: 12,
    marginBottom: nh(2),
  },
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyButton: {
    flex: 1,
    paddingVertical: nh(1.2),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.greyF7F7F7,
    marginHorizontal: nw(1),
  },
  difficultyButtonActive: {
    backgroundColor: COLORS.blue043142,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(2),
  },
  countButton: {
    width: nw(10),
    height: nw(10),
    borderRadius: nw(5),
    backgroundColor: COLORS.greyF7F7F7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    marginHorizontal: nw(8),
  },
  pricingBox: {
    backgroundColor: COLORS.lightBlueE6F0FF,
    padding: nw(4),
    borderRadius: 12,
    marginTop: nh(2),
  },
  pricingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: nh(1),
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.blue043142 + '30',
    paddingTop: nh(1),
    marginTop: nh(1),
  },
});

export default EditQuizScreen;