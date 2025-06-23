// =====================================================
// ADD/EDIT CARD SCREEN - Individual Flashcard Management
// File: screens/Flashcards/AddEditCard.js
// =====================================================

import React, {useState, useRef, useEffect} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {
  createFlashcardApi,
  updateFlashcardApi,
  getFlashcardDeckDetailsApi,
    deleteFlashcardApi,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';

const AddEditCard = ({navigation, route}) => {
  const {deckId, cardId, cardData, isEdit = false} = route.params;
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // Form state
  const [formData, setFormData] = useState({
    question: cardData?.question || '',
    answer: cardData?.answer || '',
    explanation: cardData?.explanation || '',
    hints: cardData?.hints || [],
    difficulty: cardData?.difficulty || 'medium',
    tags: cardData?.tags || [],
    cardType: cardData?.cardType || 'text',
  });
  
  const [deckInfo, setDeckInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingDeck, setLoadingDeck] = useState(true);
  const [errors, setErrors] = useState({});
  const [hintInput, setHintInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  
  // Refs for input focus management
  const questionRef = useRef(null);
  const answerRef = useRef(null);
  const explanationRef = useRef(null);
  const hintRef = useRef(null);
  const tagRef = useRef(null);

  // Difficulty options
  const difficultyOptions = [
    {value: 'easy', label: 'Easy', color: COLORS.green34A853, icon: 'sentiment-satisfied'},
    {value: 'medium', label: 'Medium', color: COLORS.yellowF5BE00, icon: 'sentiment-neutral'},
    {value: 'hard', label: 'Hard', color: COLORS.redEA4335, icon: 'sentiment-dissatisfied'},
  ];

  const cardTypeOptions = [
    { value: 'text', label: 'Text Question', icon: 'text-fields' },
    { value: 'image', label: 'Image Based', icon: 'image' },
    { value: 'diagram', label: 'Diagram', icon: 'account-tree' },
    { value: 'formula', label: 'Formula/Math', icon: 'functions' },
    { value: 'code', label: 'Code Snippet', icon: 'code' },
  ];

  // Fetch deck information
  useEffect(() => {
    const fetchDeckInfo = async () => {
      try {
        setLoadingDeck(true);
        const response = await getFlashcardDeckDetailsApi(deckId, {page: 1, limit: 1});
        
        if (response?.data?.success) {
          setDeckInfo(response.data.deck);
        }
      } catch (error) {
        console.error('Error fetching deck info:', error);
        showToast({
          type: 'error',
          title: 'Failed to load deck information'
        });
      } finally {
        setLoadingDeck(false);
      }
    };

    fetchDeckInfo();
  }, [deckId]);

  // Form validation
  const validateForm = () => {
    const newErrors = {};
  
    if (!formData.question.trim()) {
      newErrors.question = 'Question is required';
    } else if (formData.question.length < 5) {
      newErrors.question = 'Question must be at least 5 characters';
    }
  
    if (!formData.answer.trim()) {
      newErrors.answer = 'Answer is required';
    } else if (formData.answer.length < 1) {
      newErrors.answer = 'Answer cannot be empty';
    }
    
    // Custom validation based on cardType
    if (formData.cardType === 'formula') {
      // Could add specific formula validation here
      if (formData.answer.length < 2) {
        newErrors.answer = 'Formula answer should be more detailed';
      }
    }
    
    if (formData.cardType === 'code') {
      // Could add code validation here
      if (!formData.answer.includes('\n') && formData.answer.length < 10) {
        newErrors.answer = 'Code snippets should be more detailed';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: null}));
    }
  };

  // Handle hints management
  const addHint = () => {
    if (hintInput.trim()) {
      setFormData(prev => ({
        ...prev,
        hints: [...prev.hints, hintInput.trim()]
      }));
      setHintInput('');
    }
  };

  const removeHint = (index) => {
    setFormData(prev => ({
      ...prev,
      hints: prev.hints.filter((_, i) => i !== index)
    }));
  };

  // Handle tags management
  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim().toLowerCase()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (index) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast({
        type: 'error',
        title: 'Please fix the errors before saving'
      });
      return;
    }
  
    try {
      setLoading(true);
      
      const cardPayload = {
        deckId,
        question: formData.question.trim(),
        answer: formData.answer.trim(),
        explanation: formData.explanation.trim() || undefined,
        hints: formData.hints.length > 0 ? formData.hints : undefined,
        difficulty: formData.difficulty,
        tags: formData.tags.length > 0 ? formData.tags : undefined,
        cardType: formData.cardType, // This will now be a valid enum value
      };
  
      console.log('✅ Sending card payload:', cardPayload);
  
      let response;
      if (isEdit) {
        response = await updateFlashcardApi(cardId, cardPayload);
      } else {
        response = await createFlashcardApi(cardPayload);
      }
  
      if (response?.data?.success) {
        showToast({
          type: 'success',
          title: isEdit ? 'Card updated successfully!' : 'Card created successfully!',
          message: 'Your flashcard has been saved'
        });
        
        // Navigate back to deck details
        navigation.goBack();
      }
      
    } catch (error) {
      console.error('❌ Error saving card:', error);
      console.error('❌ Error response:', error.response?.data);
      showToast({
        type: 'error',
        title: isEdit ? 'Failed to update card' : 'Failed to create card',
        message: error.response?.data?.message || 'Please try again'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete card (edit mode only)
  const handleDelete = () => {
    Alert.alert(
      'Delete Card',
      'Are you sure you want to delete this flashcard? This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await deleteFlashcardApi(cardId);
              
              showToast({
                type: 'success',
                title: 'Card deleted successfully'
              });
              
              navigation.goBack();
            } catch (error) {
              showToast({
                type: 'error',
                title: 'Failed to delete card'
              });
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render card type selector
  const renderCardTypeSelector = () => (
    <View style={styles.sectionContainer}>
      <Text variant="semibold14" color={COLORS.blue043142} style={styles.sectionTitle}>
        Card Type
      </Text>
      <View style={styles.optionsGrid}>
        {cardTypeOptions.map((type) => (
          <Pressable
            key={type.value}
            style={[
              styles.optionCard,
              formData.cardType === type.value && styles.optionCardSelected
            ]}
            onPress={() => handleInputChange('cardType', type.value)}>
            <Icon 
              name={type.icon} 
              size={20} 
              color={formData.cardType === type.value ? COLORS.whiteFFFFFF : COLORS.blue043142} 
            />
            <Text 
              variant="medium12" 
              color={formData.cardType === type.value ? COLORS.whiteFFFFFF : COLORS.blue043142}
              style={styles.optionText}>
              {type.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Render difficulty selector
  const renderDifficultySelector = () => (
    <View style={styles.sectionContainer}>
      <Text variant="semibold14" color={COLORS.blue043142} style={styles.sectionTitle}>
        Difficulty Level
      </Text>
      <View style={styles.difficultyContainer}>
        {difficultyOptions.map((difficulty) => (
          <Pressable
            key={difficulty.value}
            style={[
              styles.difficultyOption,
              {borderColor: difficulty.color},
              formData.difficulty === difficulty.value && {backgroundColor: difficulty.color}
            ]}
            onPress={() => handleInputChange('difficulty', difficulty.value)}>
            <Icon 
              name={difficulty.icon} 
              size={18} 
              color={formData.difficulty === difficulty.value ? COLORS.whiteFFFFFF : difficulty.color} 
            />
            <Text 
              variant="medium12" 
              color={formData.difficulty === difficulty.value ? COLORS.whiteFFFFFF : difficulty.color}
              style={styles.difficultyText}>
              {difficulty.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Render hints section
  const renderHintsSection = () => (
    <View style={styles.sectionContainer}>
      <Text variant="semibold14" color={COLORS.blue043142} style={styles.sectionTitle}>
        Hints (Optional)
      </Text>
      
      {formData.hints.length > 0 && (
        <View style={styles.hintsContainer}>
          {formData.hints.map((hint, index) => (
            <View key={index} style={styles.hintItem}>
              <Text variant="medium12" color={COLORS.blue043142} style={styles.hintText}>
                💡 {hint}
              </Text>
              <Pressable onPress={() => removeHint(index)} style={styles.removeButton}>
                <Icon name="close" size={16} color={COLORS.redEA4335} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.addInputContainer}>
        <TextInput
          ref={hintRef}
          style={styles.addInput}
          placeholder="Add a helpful hint..."
          placeholderTextColor={COLORS.grey999999}
          value={hintInput}
          onChangeText={setHintInput}
          multiline
          onSubmitEditing={addHint}
        />
        <Pressable onPress={addHint} style={styles.addButton}>
          <Icon name="add" size={20} color={COLORS.blue043142} />
        </Pressable>
      </View>
    </View>
  );

  // Render tags section
  const renderTagsSection = () => (
    <View style={styles.sectionContainer}>
      <Text variant="semibold14" color={COLORS.blue043142} style={styles.sectionTitle}>
        Tags (Optional)
      </Text>
      
      {formData.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {formData.tags.map((tag, index) => (
            <View key={index} style={styles.tagItem}>
              <Text variant="medium11" color={COLORS.blue043142}>
                #{tag}
              </Text>
              <Pressable onPress={() => removeTag(index)} style={styles.removeTagButton}>
                <Icon name="close" size={12} color={COLORS.redEA4335} />
              </Pressable>
            </View>
          ))}
        </View>
      )}
      
      <View style={styles.addInputContainer}>
        <TextInput
          ref={tagRef}
          style={styles.addInput}
          placeholder="Add tags (e.g., physics, equations)..."
          placeholderTextColor={COLORS.grey999999}
          value={tagInput}
          onChangeText={setTagInput}
          onSubmitEditing={addTag}
        />
        <Pressable onPress={addTag} style={styles.addButton}>
          <Icon name="add" size={20} color={COLORS.blue043142} />
        </Pressable>
      </View>
    </View>
  );

  const renderAnswerInput = () => {
    let placeholder = 'Enter the answer';
    let helperText = '';
    
    switch (formData.cardType) {
      case 'text':
        placeholder = 'Enter the answer or explanation';
        helperText = 'Provide a clear, concise answer';
        break;
      case 'image':
        placeholder = 'Describe what the image shows or represents';
        helperText = 'Describe the key elements or concept shown';
        break;
      case 'diagram':
        placeholder = 'Explain the diagram or process shown';
        helperText = 'Describe the flow, relationships, or components';
        break;
      case 'formula':
        placeholder = 'Enter the formula and/or explanation\nExample: E = mc²\nThis represents energy-mass equivalence';
        helperText = 'Include the formula and brief explanation';
        break;
      case 'code':
        placeholder = 'Enter the code snippet\nExample:\nfunction hello() {\n  console.log("Hello World");\n}';
        helperText = 'Include proper code formatting and comments if needed';
        break;
    }
  
    const isMultiline = ['formula', 'code', 'diagram'].includes(formData.cardType);
  
    return (
      <View style={styles.inputSection}>
        <Text variant="semibold14" color={COLORS.blue043142} style={styles.label}>
          Answer *
        </Text>
        <TextInput
          style={[
            isMultiline ? styles.textArea : styles.textInput,
            errors.answer && styles.inputError
          ]}
          value={formData.answer}
          onChangeText={(text) => handleInputChange('answer', text)}
          placeholder={placeholder}
          placeholderTextColor={COLORS.grey777777}
          multiline={isMultiline}
          numberOfLines={isMultiline ? 6 : 1}
        />
        {errors.answer && (
          <Text variant="regular12" color={COLORS.redEA4335} style={styles.errorText}>
            {errors.answer}
          </Text>
        )}
        {helperText && (
          <Text variant="regular12" color={COLORS.grey777777} style={styles.helperText}>
            {helperText}
          </Text>
        )}
      </View>
    );
  };

  // Loading state
  if (loadingDeck) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
        <Header 
          title={isEdit ? 'Edit Card' : 'Add Card'}
          onBackPress={() => navigation.goBack()}
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.grey777777} style={styles.loadingText}>
            Loading deck information...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header 
        title={isEdit ? 'Edit Card' : 'Add Card'}
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
        rightIcon={isEdit}
        rightIconName={isEdit ? 'delete' : undefined}
        rightIconColor={isEdit ? COLORS.redEA4335 : undefined}
        onRightIconPress={isEdit ? handleDelete : undefined}
      />

      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        
        <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollContainer}>
          {/* Deck Info */}
          {deckInfo && (
            <View style={styles.deckInfoContainer}>
              <Text variant="medium12" color={COLORS.grey777777}>
                Adding card to:
              </Text>
              <Text variant="semibold14" color={COLORS.blue043142}>
                {deckInfo.title}
              </Text>
            </View>
          )}

          {/* Card Type Selector */}
          {renderCardTypeSelector()}

          {/* Question Input */}
          <View style={styles.inputContainer}>
            <Text variant="semibold14" color={COLORS.blue043142} style={styles.inputLabel}>
              Question *
            </Text>
            <TextInput
              ref={questionRef}
              style={[styles.textInput, styles.multilineInput, errors.question && styles.errorInput]}
              placeholder="Enter your question here..."
              placeholderTextColor={COLORS.grey999999}
              value={formData.question}
              onChangeText={(value) => handleInputChange('question', value)}
              multiline
              textAlignVertical="top"
              returnKeyType="next"
              onSubmitEditing={() => answerRef.current?.focus()}
            />
            {errors.question && (
              <Text variant="medium11" color={COLORS.redEA4335} style={styles.errorText}>
                {errors.question}
              </Text>
            )}
          </View>

          {/* Answer Input */}
          <View style={styles.inputContainer}>
            <Text variant="semibold14" color={COLORS.blue043142} style={styles.inputLabel}>
              Answer *
              {formData.cardType === 'multiple_choice' && (
                <Text variant="medium11" color={COLORS.grey777777}>
                  {' '}(One option per line)
                </Text>
              )}
            </Text>
            <TextInput
              ref={answerRef}
              style={[styles.textInput, styles.multilineInput, errors.answer && styles.errorInput]}
              placeholder={
                formData.cardType === 'multiple_choice' 
                  ? "Option 1\nOption 2\nOption 3\nCorrect answer"
                  : formData.cardType === 'true_false'
                  ? "True or False"
                  : "Enter the answer here..."
              }
              placeholderTextColor={COLORS.grey999999}
              value={formData.answer}
              onChangeText={(value) => handleInputChange('answer', value)}
              multiline
              textAlignVertical="top"
              returnKeyType="next"
              onSubmitEditing={() => explanationRef.current?.focus()}
            />
            {errors.answer && (
              <Text variant="medium11" color={COLORS.redEA4335} style={styles.errorText}>
                {errors.answer}
              </Text>
            )}
          </View>

          {/* Explanation Input */}
          <View style={styles.inputContainer}>
            <Text variant="semibold14" color={COLORS.blue043142} style={styles.inputLabel}>
              Explanation (Optional)
            </Text>
            <TextInput
              ref={explanationRef}
              style={[styles.textInput, styles.multilineInput]}
              placeholder="Provide additional explanation or context..."
              placeholderTextColor={COLORS.grey999999}
              value={formData.explanation}
              onChangeText={(value) => handleInputChange('explanation', value)}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Difficulty Selector */}
          {renderDifficultySelector()}

          {/* Hints Section */}
          {renderHintsSection()}

          {/* Tags Section */}
          {renderTagsSection()}

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Button
              text="Cancel"
              width={nw(120)}
              height={nh(44)}
              backgroundColor={COLORS.whiteFFFFFF}
              textColor={COLORS.grey777777}
              borderWidth={1}
              borderColor={COLORS.greyEEEEEE}
              onPress={() => navigation.goBack()}
            />
            
            <Button
              text={isEdit ? 'Update Card' : 'Save Card'}
              width={nw(160)}
              height={nh(44)}
              loading={loading}
              onPress={handleSubmit}
              icon={isEdit ? 'edit' : 'save'}
              iconColor={COLORS.whiteFFFFFF}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  loadingText: {
    marginTop: nh(16),
  },
  content: {
    flex: 1,
    backgroundColor: COLORS.greyF8F8F8,
  },
  scrollContainer: {
    flex: 1,
  },
  
  // Deck Info
  deckInfoContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    padding: nw(16),
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  
  // Section Containers
  sectionContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(8),
    paddingHorizontal: nw(16),
    paddingVertical: nh(16),
  },
  sectionTitle: {
    marginBottom: nh(12),
  },
  
  // Input Styles
  inputContainer: {
    backgroundColor: COLORS.whiteFFFFFF,
    marginTop: nh(8),
    paddingHorizontal: nw(16),
    paddingVertical: nh(16),
  },
  inputLabel: {
    marginBottom: nh(8),
  },
  textInput: {
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    borderRadius: nw(8),
    paddingHorizontal: nw(12),
    paddingVertical: nh(10),
    fontSize: 14,
    color: COLORS.blue043142,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  multilineInput: {
    minHeight: nh(80),
    textAlignVertical: 'top',
  },
  errorInput: {
    borderColor: COLORS.redEA4335,
  },
  errorText: {
    marginTop: nh(4),
  },
  
  // Card Type Options
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -nw(4),
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    margin: nw(4),
    padding: nw(12),
    borderRadius: nw(8),
    borderWidth: 1,
    borderColor: COLORS.blue043142,
    backgroundColor: COLORS.whiteFFFFFF,
  },
  optionCardSelected: {
    backgroundColor: COLORS.blue043142,
  },
  optionText: {
    marginLeft: nw(8),
    flex: 1,
  },
  
  // Difficulty Options
  difficultyContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  difficultyOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: nh(12),
    marginHorizontal: nw(4),
    borderRadius: nw(8),
    borderWidth: 1,
  },
  difficultyText: {
    marginLeft: nw(6),
  },
  
  // Hints Section
  hintsContainer: {
    marginBottom: nh(12),
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greyF8F8F8,
    borderRadius: nw(8),
    paddingVertical: nh(8),
    paddingHorizontal: nw(12),
    marginBottom: nh(8),
  },
  hintText: {
    flex: 1,
  },
  removeButton: {
    padding: nw(4),
  },
  
  // Tags Section
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: nh(12),
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.blue043142 + '15',
    borderRadius: nw(16),
    paddingVertical: nh(4),
    paddingHorizontal: nw(8),
    marginRight: nw(6),
    marginBottom: nh(6),
  },
  removeTagButton: {
    marginLeft: nw(6),
    padding: nw(2),
  },
  
  // Add Input
  addInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  addInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.greyEEEEEE,
    borderRadius: nw(8),
    paddingHorizontal: nw(12),
    paddingVertical: nh(8),
    fontSize: 14,
    color: COLORS.blue043142,
    marginRight: nw(8),
    minHeight: nh(40),
  },
  addButton: {
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(8),
    padding: nw(10),
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Action Buttons
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(16),
    paddingVertical: nh(20),
    marginTop: nh(8),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },
});

export default AddEditCard;