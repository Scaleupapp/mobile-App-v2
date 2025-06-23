// =====================================================
// UPLOAD DOCUMENT SCREEN - Improved with Deck Selection
// File: screens/Flashcards/UploadDocument.js
// =====================================================

import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
  FlatList,
} from 'react-native';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import DocumentPicker from 'react-native-document-picker';
import {useSelector} from 'react-redux';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Header from '../../components/Header';
import Routes from '../../helper/routes';
import {
  uploadFlashcardDocumentApi,
  getFlashcardProcessingStatusApi,
  getUserFlashcardDecksApi,
  createFlashcardDeckApi,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';

const UploadDocument = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();
  
  // Route params - check if coming from specific deck
  const {deckId: preSelectedDeckId, deckTitle: preSelectedDeckTitle} = route.params || {};
  
  // State management
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentStep, setCurrentStep] = useState(preSelectedDeckId ? 'select_file' : 'select_deck');
  const [selectedDeck, setSelectedDeck] = useState(preSelectedDeckId ? {_id: preSelectedDeckId, title: preSelectedDeckTitle} : null);
  const [userDecks, setUserDecks] = useState([]);
  const [loadingDecks, setLoadingDecks] = useState(false);
  const [showCreateNew, setShowCreateNew] = useState(false);
  
  // New deck creation
  const [newDeckData, setNewDeckData] = useState({
    title: '',
    subject: 'general',
    description: '',
  });
  
  // Upload and processing
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Subjects for new deck creation
  const subjects = [
    {value: 'general', label: 'General', icon: 'school'},
    {value: 'engineering', label: 'Engineering', icon: 'engineering'},
    {value: 'medical', label: 'Medical', icon: 'medical-services'},
    {value: 'science', label: 'Science', icon: 'science'},
    {value: 'mathematics', label: 'Mathematics', icon: 'calculate'},
    {value: 'business', label: 'Business', icon: 'business'},
    {value: 'languages', label: 'Languages', icon: 'translate'},
    {value: 'competitive_exams', label: 'Competitive Exams', icon: 'quiz'},
  ];

  // Fetch user's decks
  const fetchUserDecks = useCallback(async () => {
    if (preSelectedDeckId) return; // Skip if deck is pre-selected
    
    setLoadingDecks(true);
    try {
      const response = await getUserFlashcardDecksApi({
        page: 1,
        limit: 50,
      });
      
      if (response?.data?.success) {
        setUserDecks(response.data.decks || []);
      }
    } catch (error) {
      console.error('Error fetching decks:', error);
      showToast({
        type: 'error',
        title: 'Failed to load your decks'
      });
    } finally {
      setLoadingDecks(false);
    }
  }, [preSelectedDeckId, showToast]);

  useFocusEffect(
    useCallback(() => {
      fetchUserDecks();
    }, [fetchUserDecks])
  );

  // File selection handlers
  const handleDocumentPicker = async () => {
    try {
      const res = await DocumentPicker.pickSingle({
        type: [
          DocumentPicker.types.pdf,
          DocumentPicker.types.docx,
          DocumentPicker.types.doc,
          DocumentPicker.types.plainText,
        ],
      });
      
      if (res.size > 10 * 1024 * 1024) {
        showToast({
          type: 'error',
          title: 'File too large. Please select a file under 10MB.'
        });
        return;
      }
      
      setSelectedFile(res);
      if (preSelectedDeckId) {
        setCurrentStep('upload');
      } else {
        setCurrentStep('review');
      }
    } catch (err) {
      if (!DocumentPicker.isCancel(err)) {
        showToast({
          type: 'error',
          title: 'Failed to select document'
        });
      }
    }
  };

  const handleImagePicker = () => {
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {text: 'Camera', onPress: openCamera},
        {text: 'Photo Library', onPress: openImageLibrary},
        {text: 'Cancel', style: 'cancel'},
      ]
    );
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 2000,
      maxHeight: 2000,
    };

    launchCamera(options, (response) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || 'camera-image.jpg',
          type: asset.type,
          size: asset.fileSize,
        });
        if (preSelectedDeckId) {
          setCurrentStep('upload');
        } else {
          setCurrentStep('review');
        }
      }
    });
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 2000,
      maxHeight: 2000,
    };

    launchImageLibrary(options, (response) => {
      if (response.assets && response.assets[0]) {
        const asset = response.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.fileName || 'selected-image.jpg',
          type: asset.type,
          size: asset.fileSize,
        });
        if (preSelectedDeckId) {
          setCurrentStep('upload');
        } else {
          setCurrentStep('review');
        }
      }
    });
  };

  // Deck selection handlers
  const handleDeckSelect = (deck) => {
    setSelectedDeck(deck);
    setCurrentStep('select_file');
  };

  const handleCreateNewDeck = async () => {
    if (!newDeckData.title.trim()) {
      showToast({
        type: 'error',
        title: 'Please enter a deck title'
      });
      return;
    }

    try {
      const response = await createFlashcardDeckApi({
        title: newDeckData.title.trim(),
        description: newDeckData.description.trim(),
        subject: newDeckData.subject,
        isPublic: false,
      });

      if (response?.data?.success) {
        const newDeck = response.data.deck;
        setSelectedDeck(newDeck);
        setUserDecks(prev => [newDeck, ...prev]);
        setShowCreateNew(false);
        setCurrentStep('select_file');
        
        showToast({
          type: 'success',
          title: 'Deck created successfully!'
        });
      }
    } catch (error) {
      console.error('Create deck error:', error);
      showToast({
        type: 'error',
        title: 'Failed to create deck'
      });
    }
  };

  // Upload handler
  const handleUpload = async () => {
    if (!selectedFile || !selectedDeck) return;

    setCurrentStep('upload');
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('document', {
        uri: selectedFile.uri,
        type: selectedFile.type,
        name: selectedFile.name,
      });
      formData.append('deckId', selectedDeck._id);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await uploadFlashcardDocumentApi(formData);
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response?.data?.success) {
        setProcessingId(response.data.processingId);
        setCurrentStep('process');
        startProcessingCheck(response.data.processingId);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setCurrentStep('review');
      showToast({
        type: 'error',
        title: error?.response?.data?.message || 'Upload failed'
      });
    }
  };

  // Processing status check
  const startProcessingCheck = (id) => {
    const checkStatus = async () => {
      try {
        const response = await getFlashcardProcessingStatusApi(id);
        
        if (response?.data?.success) {
          const status = response.data.processing;
          setProcessingStatus(status);
          
          if (status.status === 'completed') {
            setCurrentStep('complete');
            setTimeout(() => {
              navigation.navigate(Routes.DeckDetails, {
                deckId: selectedDeck._id,
                isNewDeck: false,
                fromUpload: true
              });
            }, 2000);
          } else if (status.status === 'failed') {
            setCurrentStep('review');
            showToast({
              type: 'error',
              title: 'Processing failed. Please try again.'
            });
          } else {
            setTimeout(checkStatus, 3000);
          }
        }
      } catch (error) {
        console.error('Status check error:', error);
      }
    };

    checkStatus();
  };

  // Render deck selection step
  const renderDeckSelection = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Icon name="folder" size={48} color={COLORS.blue043142} />
        <Text variant="semibold20" color={COLORS.blue043142} style={styles.stepTitle}>
          Select a Deck
        </Text>
        <Text variant="medium14" color={COLORS.grey777777} style={styles.stepDescription}>
          Choose which deck to add your flashcards to
        </Text>
      </View>

      {loadingDecks ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.blue043142} />
          <Text variant="medium14" color={COLORS.grey777777}>Loading your decks...</Text>
        </View>
      ) : (
        <View style={styles.decksContainer}>
          {/* Create New Deck Option */}
          <Pressable 
            style={styles.createNewDeckButton}
            onPress={() => setShowCreateNew(true)}>
            <Icon name="add-circle" size={24} color={COLORS.whiteFFFFFF} />
            <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
              Create New Deck
            </Text>
          </Pressable>

          {/* Existing Decks */}
          {userDecks.length > 0 ? (
            <FlatList
              data={userDecks}
              keyExtractor={(item) => item._id}
              renderItem={({item}) => (
                <Pressable 
                  style={styles.deckItem}
                  onPress={() => handleDeckSelect(item)}>
                  <View style={styles.deckIcon}>
                    <Icon name="style" size={20} color={COLORS.blue043142} />
                  </View>
                  <View style={styles.deckInfo}>
                    <Text variant="semibold14" color={COLORS.blue043142} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text variant="medium12" color={COLORS.grey777777}>
                      {item.subject} • {item.cardCount || 0} cards
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={20} color={COLORS.grey999999} />
                </Pressable>
              )}
              showsVerticalScrollIndicator={false}
              style={styles.decksList}
            />
          ) : (
            <View style={styles.emptyDecks}>
              <Icon name="folder-open" size={48} color={COLORS.greyBBBBBB} />
              <Text variant="medium16" color={COLORS.grey777777}>
                No decks found
              </Text>
              <Text variant="medium12" color={COLORS.grey999999}>
                Create your first deck to get started
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Create New Deck Modal */}
      {showCreateNew && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text variant="semibold18" color={COLORS.blue043142} style={styles.modalTitle}>
              Create New Deck
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Deck title"
              placeholderTextColor={COLORS.grey999999}
              value={newDeckData.title}
              onChangeText={(value) => setNewDeckData(prev => ({...prev, title: value}))}
            />
            
            <TextInput
              style={[styles.modalInput, styles.modalTextArea]}
              placeholder="Description (optional)"
              placeholderTextColor={COLORS.grey999999}
              value={newDeckData.description}
              onChangeText={(value) => setNewDeckData(prev => ({...prev, description: value}))}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.modalSubjects}>
              {subjects.slice(0, 4).map((subject) => (
                <Pressable
                  key={subject.value}
                  style={[
                    styles.modalSubjectItem,
                    newDeckData.subject === subject.value && styles.modalSubjectSelected
                  ]}
                  onPress={() => setNewDeckData(prev => ({...prev, subject: subject.value}))}>
                  <Text variant="medium12" color={
                    newDeckData.subject === subject.value ? COLORS.whiteFFFFFF : COLORS.blue043142
                  }>
                    {subject.label}
                  </Text>
                </Pressable>
              ))}
            </View>
            
            <View style={styles.modalActions}>
              <Button
                text="Cancel"
                onPress={() => setShowCreateNew(false)}
                style={[styles.modalButton, styles.modalCancelButton]}
                textColor={COLORS.blue043142}
              />
              <Button
                text="Create"
                onPress={handleCreateNewDeck}
                style={[styles.modalButton, styles.modalCreateButton]}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );

  // Render file selection step
  const renderFileSelection = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Icon name="cloud-upload" size={48} color={COLORS.blue043142} />
        <Text variant="semibold20" color={COLORS.blue043142} style={styles.stepTitle}>
          Upload Document
        </Text>
        <Text variant="medium14" color={COLORS.grey777777} style={styles.stepDescription}>
          Adding cards to: <Text variant="semibold14" color={COLORS.blue043142}>{selectedDeck?.title}</Text>
        </Text>
      </View>

      {!selectedFile ? (
        <View style={styles.uploadOptions}>
          <Pressable style={styles.uploadOption} onPress={handleDocumentPicker}>
            <Icon name="description" size={32} color={COLORS.blue043142} />
            <Text variant="semibold14" color={COLORS.blue043142}>
              Choose Document
            </Text>
            <Text variant="medium12" color={COLORS.grey777777}>
              PDF, Word, Text files
            </Text>
          </Pressable>

          <Pressable style={styles.uploadOption} onPress={handleImagePicker}>
            <Icon name="photo-camera" size={32} color={COLORS.green34A853} />
            <Text variant="semibold14" color={COLORS.blue043142}>
              Take Photo
            </Text>
            <Text variant="medium12" color={COLORS.grey777777}>
              Capture notes, books
            </Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.selectedFileContainer}>
          <View style={styles.filePreview}>
            <Icon 
              name={selectedFile.type?.includes('image') ? 'image' : 'description'} 
              size={48} 
              color={COLORS.blue043142} 
            />
            <View style={styles.fileInfo}>
              <Text variant="semibold14" color={COLORS.blue043142} numberOfLines={1}>
                {selectedFile.name}
              </Text>
              <Text variant="medium12" color={COLORS.grey777777}>
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
            <Pressable onPress={() => setSelectedFile(null)} style={styles.removeButton}>
              <Icon name="close" size={20} color={COLORS.redEA4335} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  // Render upload progress
  const renderUploadProgress = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <ActivityIndicator size="large" color={COLORS.blue043142} />
        <Text variant="semibold20" color={COLORS.blue043142} style={styles.stepTitle}>
          Uploading Document
        </Text>
      </View>
      
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {width: `${uploadProgress}%`}]} />
        </View>
        <Text variant="medium14" color={COLORS.blue043142}>
          {uploadProgress}%
        </Text>
      </View>
    </View>
  );

  // Render processing status
  const renderProcessing = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <ActivityIndicator size="large" color={COLORS.blue043142} />
        <Text variant="semibold20" color={COLORS.blue043142} style={styles.stepTitle}>
          Creating Flashcards
        </Text>
        <Text variant="medium14" color={COLORS.grey777777} style={styles.stepDescription}>
          Our AI is analyzing your document...
        </Text>
      </View>
    </View>
  );

  // Render success
  const renderSuccess = () => (
    <View style={styles.stepContainer}>
      <View style={styles.stepHeader}>
        <Icon name="check-circle" size={64} color={COLORS.green34A853} />
        <Text variant="semibold20" color={COLORS.blue043142} style={styles.stepTitle}>
          Success!
        </Text>
        <Text variant="medium14" color={COLORS.grey777777} style={styles.stepDescription}>
          Flashcards have been added to your deck
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      
      <Header
        title="Upload Document"
        onBackPress={() => navigation.goBack()}
        showBackButton={true}
      />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {currentStep === 'select_deck' && renderDeckSelection()}
            {currentStep === 'select_file' && renderFileSelection()}
            {currentStep === 'review' && renderFileSelection()}
            {currentStep === 'upload' && renderUploadProgress()}
            {currentStep === 'process' && renderProcessing()}
            {currentStep === 'complete' && renderSuccess()}
          </ScrollView>

          {/* Action Button */}
          {((currentStep === 'select_file' || currentStep === 'review') && selectedFile) && (
            <View style={styles.actionContainer}>
              <Button
                text="Generate Flashcards"
                onPress={handleUpload}
                icon="auto-awesome"
                iconColor={COLORS.whiteFFFFFF}
              />
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
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
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: nw(20),
    paddingBottom: nh(100),
  },
  stepContainer: {
    flex: 1,
    paddingTop: nh(40),
  },
  stepHeader: {
    alignItems: 'center',
    marginBottom: nh(32),
  },
  stepTitle: {
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  stepDescription: {
    textAlign: 'center',
    paddingHorizontal: nw(20),
  },
  // Deck Selection Styles
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: nh(40),
  },
  decksContainer: {
    flex: 1,
  },
  createNewDeckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.blue043142,
    borderRadius: nw(12),
    paddingVertical: nh(16),
    marginBottom: nh(20),
  },
  decksList: {
    flex: 1,
  },
  deckItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(16),
    marginBottom: nh(12),
    elevation: 1,
    shadowColor: COLORS.black333333,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  deckIcon: {
    width: nw(40),
    height: nw(40),
    borderRadius: nw(20),
    backgroundColor: COLORS.blue043142 + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(12),
  },
  deckInfo: {
    flex: 1,
  },
  emptyDecks: {
    alignItems: 'center',
    paddingVertical: nh(60),
  },
  // Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(16),
    padding: nw(24),
    width: DEVICE_WIDTH - nw(80),
    maxHeight: nh(500),
  },
  modalTitle: {
    marginBottom: nh(20),
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,
    borderRadius: nw(12),
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
    fontSize: 14,
    color: COLORS.blue043142,
    marginBottom: nh(16),
  },
  modalTextArea: {
    minHeight: nh(80),
    textAlignVertical: 'top',
  },
  modalSubjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: nh(24),
  },
  modalSubjectItem: {
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: nw(16),
    paddingHorizontal: nw(12),
    paddingVertical: nh(6),
    marginRight: nw(8),
    marginBottom: nh(8),
  },
  modalSubjectSelected: {
    backgroundColor: COLORS.blue043142,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    marginHorizontal: nw(6),
  },
  modalCancelButton: {
    backgroundColor: COLORS.greyF7F7F7,
  },
  modalCreateButton: {
    backgroundColor: COLORS.blue043142,
  },
  // File Selection Styles
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadOption: {
    flex: 1,
    backgroundColor: COLORS.greyF7F7F7,
    borderRadius: nw(16),
    padding: nw(20),
    alignItems: 'center',
    marginHorizontal: nw(6),
    borderWidth: 2,
    borderColor: 'transparent',
    borderStyle: 'dashed',
  },
  selectedFileContainer: {
    backgroundColor: COLORS.green34A853 + '10',
    borderRadius: nw(12),
    padding: nw(16),
    borderWidth: 2,
    borderColor: COLORS.green34A853,
  },
  filePreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileInfo: {
    flex: 1,
    marginLeft: nw(16),
  },
  removeButton: {
    padding: nw(8),
  },
  // Progress Styles
  progressContainer: {
    alignItems: 'center',
    paddingVertical: nh(20),
  },
  progressBar: {
    width: '100%',
    height: nh(8),
    backgroundColor: COLORS.greyEEEEEE,
    borderRadius: nh(4),
    marginBottom: nh(16),
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.blue043142,
    borderRadius: nh(4),
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.whiteFFFFFF,
    paddingHorizontal: nw(20),
    paddingVertical: nh(20),
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
  },
});

export default UploadDocument;