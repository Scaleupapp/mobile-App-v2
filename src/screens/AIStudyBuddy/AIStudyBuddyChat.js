// screens/AIStudyBuddy/AIStudyBuddyChat.js
// ROBUST VERSION - Handles backend validation errors gracefully

import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
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
  aiStudyBuddySendMessageApi,
  aiStudyBuddyGetHistoryApi,
  aiStudyBuddyGetQuotaApi,
  aiStudyBuddyReactToMessageApi,
  aiStudyBuddyToggleBookmarkApi,
  formatAiStudyBuddyError,
  isAiStudyBuddyQuotaExceeded,
  validateAiStudyBuddyMessage,
  getAiStudyBuddyTimeUntilReset,
} from '../../services/apiService';

const {width: screenWidth, height: screenHeight} = Dimensions.get('window');

const AIStudyBuddyChat = ({navigation, route}) => {
  const userData = useSelector(state => state?.userData);
  const {showToast} = useToast();

  // Route params
  const {sessionId, subject, syllabus, isNewSession, initialQuery} =
    route.params;

  // Refs
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const typingAnimRef = useRef(new Animated.Value(0)).current;

  // State management
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [inputText, setInputText] = useState(initialQuery || '');
  const [quotaInfo, setQuotaInfo] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showQuotaModal, setShowQuotaModal] = useState(false);

  // Quick suggestions for new sessions
  const quickSuggestions = [
    'Explain this concept step by step',
    'Give me practice problems',
    'What are the key points to remember?',
    'How does this relate to real life?',
    'Create flashcards for this topic',
  ];

  // Create a simple AI response for demo purposes
  const createSimpleAIResponse = userMessage => {
    const responses = [
      `Great question about ${subject}! Let me help you understand this concept better.`,
      `That's an interesting point. In ${subject}, this topic is quite important because...`,
      `I'd be happy to explain that! This is a fundamental concept in ${subject}.`,
      `Excellent question! Let me break this down step by step for you.`,
      `That's a very thoughtful question. In the context of ${subject}, here's what you need to know...`,
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];

    return {
      messageId: 'ai_' + Date.now(),
      messageType: 'ai',
      content:
        randomResponse +
        ` 

I understand you're asking about: "${userMessage}"

While I'm working on getting the full AI response from the backend, I want to make sure you can continue learning. This appears to be related to ${subject} concepts.

Key points to consider:
• This topic builds on previous concepts
• Practice problems will help reinforce understanding  
• Real-world applications make it more memorable

Would you like me to help you with practice problems or explain any specific part in more detail?`,
      sentAt: new Date().toISOString(),
      contentAnalysis: {
        topics: [subject],
        integrationSuggestions: {
          flashcards: false,
          quiz: false,
          practiceProblems: true,
        },
      },
      userInteraction: {
        bookmarked: false,
        reaction: null,
        rating: null,
      },
    };
  };

  // Load conversation history
  const loadMessages = useCallback(
    async (pageNum = 1, showLoader = true) => {
      try {
        if (showLoader && pageNum === 1) setLoading(true);

        const [historyResponse, quotaResponse] = await Promise.all([
          aiStudyBuddyGetHistoryApi(sessionId, {page: pageNum, limit: 20}),
          aiStudyBuddyGetQuotaApi(),
        ]);

        const newMessages = historyResponse.data.messages || [];
        setQuotaInfo(quotaResponse.data.quota);

        if (pageNum === 1) {
          setMessages(newMessages.reverse());

          // Show welcome message for new sessions
          if (isNewSession && newMessages.length === 0) {
            addWelcomeMessage();
          }
        } else {
          setMessages(prev => [...newMessages.reverse(), ...prev]);
        }

        setHasMore(newMessages.length === 20);
        setPage(pageNum);
      } catch (error) {
        console.error('Load messages error:', error);
        showToast({
          title: 'Failed to load conversation. Please try again.',
          type: 'error',
        });
      } finally {
        if (showLoader && pageNum === 1) setLoading(false);
      }
    },
    [sessionId, isNewSession, showToast],
  );

  // Add welcome message for new sessions
  const addWelcomeMessage = () => {
    const welcomeMessage = {
      messageId: 'welcome_' + Date.now(),
      messageType: 'ai',
      content: `Hi! I'm your AI Study Buddy for ${subject}. I'm here to help you understand concepts, solve problems, and learn effectively. 

What would you like to explore today? You can ask me:
• Concept explanations
• Practice problems  
• Study tips
• Real-world applications
• Or any specific questions about ${subject}

Let's start learning! 🚀`,
      sentAt: new Date().toISOString(),
      contentAnalysis: {
        topics: [subject],
        integrationSuggestions: {
          flashcards: false,
          quiz: false,
          practiceProblems: false,
        },
      },
      userInteraction: {
        bookmarked: false,
        reaction: null,
        rating: null,
      },
    };

    setMessages([welcomeMessage]);
  };

  // Load data on mount
  useFocusEffect(
    useCallback(() => {
      loadMessages();
    }, [loadMessages]),
  );

  // Send initial query if provided
  useEffect(() => {
    if (initialQuery && !loading && messages.length <= 1) {
      setTimeout(() => {
        sendMessage(initialQuery);
        setInputText('');
      }, 1000);
    }
  }, [initialQuery, loading, messages.length]);

  // Start typing animation
  const startTypingAnimation = () => {
    setAiTyping(true);
    Animated.loop(
      Animated.sequence([
        Animated.timing(typingAnimRef, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(typingAnimRef, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  };

  // Stop typing animation
  const stopTypingAnimation = () => {
    setAiTyping(false);
    typingAnimRef.stopAnimation();
    typingAnimRef.setValue(0);
  };

  // Send message - ROBUST VERSION WITH GRACEFUL FALLBACK
  const sendMessage = async (messageText = inputText.trim()) => {
    console.log('🚀 ~ sendMessage ~ messageText:', messageText);

    if (!messageText) return;

    // Validate sessionId exists
    if (!sessionId) {
      showToast({
        title: 'Session ID is missing. Please start a new session.',
        type: 'error',
      });
      return;
    }

    // Validate message
    const validation = validateAiStudyBuddyMessage({message: messageText});
    if (!validation.isValid) {
      showToast({
        title: validation.errors[0],
        type: 'error',
      });
      return;
    }

    // Check quota
    if (
      quotaInfo?.dailyQuota?.remaining <= 0 &&
      quotaInfo?.subscriptionType !== 'pro'
    ) {
      setShowQuotaModal(true);
      return;
    }

    try {
      setSending(true);

      // Add user message to UI immediately
      const userMessage = {
        messageId: 'user_' + Date.now(),
        messageType: 'user',
        content: messageText,
        sentAt: new Date().toISOString(),
        contentAnalysis: {topics: []},
        userInteraction: {},
      };

      setMessages(prev => [...prev, userMessage]);
      setInputText('');

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);

      // Start AI typing animation
      startTypingAnimation();

      try {
        // Try to send to backend with workaround
        const payload = {
          sessionId: sessionId,
          message: messageText,
        };

        const response = await aiStudyBuddySendMessageApi(sessionId, payload);

        if (response.data && response.data.success) {
          // Handle successful backend response
          const responseData = response.data;

          if (responseData.quotaInfo) {
            setQuotaInfo(responseData.quotaInfo);
          }

          // Add AI response from backend
          if (responseData.aiResponse) {
            setMessages(prev => [...prev, responseData.aiResponse]);
          } else if (responseData.message) {
            // Fallback if different response format
            const aiMessage = {
              messageId: 'ai_' + Date.now(),
              messageType: 'ai',
              content: responseData.message,
              sentAt: new Date().toISOString(),
              contentAnalysis: {topics: [subject]},
              userInteraction: {bookmarked: false, reaction: null},
            };
            setMessages(prev => [...prev, aiMessage]);
          }
        } else {
          // throw new Error('Backend response indicates failure');
          showToast({
            title: 'error creating response',
            type: 'error',
          });
        }
      } catch (backendError) {
        console.warn(
          'Backend API failed, using fallback response:',
          backendError,
        );

        // GRACEFUL FALLBACK: Create a helpful AI response locally
        const fallbackAIResponse = createSimpleAIResponse(messageText);

        setMessages(prev => [...prev, fallbackAIResponse]);

        // Show a subtle warning to the user
        showToast({
          title:
            'Using offline mode. Full AI features temporarily unavailable.',
          type: 'warning',
        });

        // Update quota locally (decrease by 1)
        if (quotaInfo?.dailyQuota?.remaining > 0) {
          setQuotaInfo(prev => ({
            ...prev,
            dailyQuota: {
              ...prev.dailyQuota,
              remaining: prev.dailyQuota.remaining - 1,
              used: prev.dailyQuota.used + 1,
            },
          }));
        }
      }

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 200);
    } catch (error) {
      console.error('Send message error:', error);

      // Remove user message on complete failure
      setMessages(prev =>
        prev.filter(msg => msg.messageId !== userMessage.messageId),
      );
      setInputText(messageText); // Restore input text

      if (isAiStudyBuddyQuotaExceeded(error)) {
        setShowQuotaModal(true);
      } else {
        showToast({
          title: 'Failed to send message. Please try again.',
          type: 'error',
        });
      }
    } finally {
      setSending(false);
      stopTypingAnimation();
    }
  };

  // Handle message reaction
  const handleReaction = async (messageId, reaction) => {
    try {
      await aiStudyBuddyReactToMessageApi(messageId, {reaction});

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.messageId === messageId
            ? {...msg, userInteraction: {...msg.userInteraction, reaction}}
            : msg,
        ),
      );

      showToast({
        title: 'Feedback submitted!',
        type: 'success',
      });
    } catch (error) {
      // Update locally even if backend fails
      setMessages(prev =>
        prev.map(msg =>
          msg.messageId === messageId
            ? {...msg, userInteraction: {...msg.userInteraction, reaction}}
            : msg,
        ),
      );

      showToast({
        title: 'Feedback recorded locally',
        type: 'info',
      });
    }
  };

  // Toggle bookmark
  const toggleBookmark = async messageId => {
    try {
      const response = await aiStudyBuddyToggleBookmarkApi(messageId);

      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg.messageId === messageId
            ? {
                ...msg,
                userInteraction: {
                  ...msg.userInteraction,
                  bookmarked: response.data.bookmarked,
                },
              }
            : msg,
        ),
      );

      showToast({
        title: response.data.bookmarked
          ? 'Message bookmarked!'
          : 'Bookmark removed',
        type: 'success',
      });
    } catch (error) {
      // Toggle locally even if backend fails
      setMessages(prev =>
        prev.map(msg =>
          msg.messageId === messageId
            ? {
                ...msg,
                userInteraction: {
                  ...msg.userInteraction,
                  bookmarked: !msg.userInteraction?.bookmarked,
                },
              }
            : msg,
        ),
      );

      showToast({
        title: 'Bookmark updated locally',
        type: 'info',
      });
    }
  };

  // Render message item
  const renderMessage = ({item: message}) => {
    const isUser = message.messageType === 'user';
    const isAI = message.messageType === 'ai';

    return (
      <View
        style={[
          styles.messageContainer,
          isUser ? styles.userMessageContainer : styles.aiMessageContainer,
        ]}>
        {isAI && (
          <View style={styles.aiAvatar}>
            <Icon name="smart-toy" size={18} color="white" />
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.aiBubble,
          ]}>
          <Text
            style={[styles.messageText, {color: isUser ? 'white' : '#111827'}]}>
            {message.content}
          </Text>

          <Text
            style={[
              styles.messageTime,
              {color: isUser ? 'rgba(255,255,255,0.7)' : '#9CA3AF'},
            ]}>
            {new Date(message.sentAt).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {userData?.firstname?.charAt(0) || 'U'}
            </Text>
          </View>
        )}

        {/* AI Message Actions */}
        {isAI && (
          <View style={styles.messageActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => handleReaction(message.messageId, 'helpful')}>
              <Icon
                name="thumb-up"
                size={14}
                color={
                  message.userInteraction?.reaction === 'helpful'
                    ? '#10B981'
                    : '#9CA3AF'
                }
              />
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={() => handleReaction(message.messageId, 'not_helpful')}>
              <Icon
                name="thumb-down"
                size={14}
                color={
                  message.userInteraction?.reaction === 'not_helpful'
                    ? '#EF4444'
                    : '#9CA3AF'
                }
              />
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={() => toggleBookmark(message.messageId)}>
              <Icon
                name={
                  message.userInteraction?.bookmarked
                    ? 'bookmark'
                    : 'bookmark-border'
                }
                size={14}
                color={
                  message.userInteraction?.bookmarked ? '#3B82F6' : '#9CA3AF'
                }
              />
            </Pressable>
          </View>
        )}
      </View>
    );
  };

  // Render typing indicator
  const renderTypingIndicator = () => {
    if (!aiTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.aiAvatar}>
          <Icon name="smart-toy" size={18} color="white" />
        </View>
        <View style={styles.typingBubble}>
          <Animated.View style={[styles.typingDots, {opacity: typingAnimRef}]}>
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
            <View style={styles.typingDot} />
          </Animated.View>
        </View>
      </View>
    );
  };

  // Render quick suggestions
  const renderQuickSuggestions = () => {
    if (messages.length > 1) return null;

    return (
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Quick suggestions:</Text>
        <View style={styles.suggestionsWrapper}>
          {quickSuggestions.map((suggestion, index) => (
            <Pressable
              key={index}
              style={styles.suggestionChip}
              onPress={() => sendMessage(suggestion)}>
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  };

  // Render quota modal
  const renderQuotaModal = () => (
    <Modal visible={showQuotaModal} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <Icon name="schedule" size={48} color="#F59E0B" />
          <Text style={styles.modalTitle}>Daily Limit Reached</Text>
          <Text style={styles.modalMessage}>
            You've used all your questions for today. Your quota resets at
            midnight.
          </Text>
          <Text style={styles.modalTime}>
            Resets in {getAiStudyBuddyTimeUntilReset() || '24 hours'}
          </Text>

          <View style={styles.modalActions}>
            <Button
              title="OK"
              onPress={() => setShowQuotaModal(false)}
              style={styles.modalButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <Header title={subject} showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <Header
        title={subject}
        showBackButton
        subtitle={
          quotaInfo
            ? `${quotaInfo.dailyQuota?.remaining || 0}/${
                quotaInfo.dailyQuota?.limit || 5
              } questions left`
            : ''
        }
      />

      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.messageId}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (hasMore && !loading) {
              loadMessages(page + 1, false);
            }
          }}
          onEndReachedThreshold={0.1}
          ListHeaderComponent={
            hasMore ? (
              <ActivityIndicator
                size="small"
                color="#3B82F6"
                style={styles.loadMoreIndicator}
              />
            ) : null
          }
          ListFooterComponent={
            <View>
              {renderQuickSuggestions()}
              {renderTypingIndicator()}
            </View>
          }
        />

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              ref={inputRef}
              style={styles.textInput}
              placeholder="Ask me anything..."
              placeholderTextColor="#9CA3AF"
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
              textAlignVertical="top"
            />
            <Pressable
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || sending}>
              {sending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Icon name="send" size={18} color="white" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Modals */}
      {renderQuotaModal()}
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
  },
  loadingText: {
    marginTop: nh(16),
    fontSize: 16,
    color: '#6B7280',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  messagesContent: {
    paddingVertical: nh(16),
  },
  loadMoreIndicator: {
    padding: nh(16),
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: nh(6),
    paddingHorizontal: nw(16),
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: nw(28),
    height: nw(28),
    borderRadius: nw(14),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: nw(8),
  },
  userAvatar: {
    width: nw(28),
    height: nw(28),
    borderRadius: nw(14),
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: nw(8),
  },
  userAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'white',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
    borderRadius: 18,
    marginBottom: nh(2),
  },
  userBubble: {
    backgroundColor: '#3B82F6',
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageTime: {
    fontSize: 11,
    marginTop: nh(4),
    textAlign: 'right',
  },
  messageActions: {
    flexDirection: 'column',
    marginLeft: nw(6),
    alignItems: 'center',
  },
  actionButton: {
    padding: nw(4),
    marginVertical: nh(2),
  },
  typingContainer: {
    flexDirection: 'row',
    paddingHorizontal: nw(16),
    paddingVertical: nh(8),
    alignItems: 'flex-end',
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: nw(14),
    paddingVertical: nh(10),
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    marginLeft: nw(8),
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 1,
  },
  suggestionsContainer: {
    paddingHorizontal: nw(16),
    paddingVertical: nh(16),
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: nh(12),
    fontWeight: '500',
  },
  suggestionsWrapper: {
    gap: nh(8),
  },
  suggestionChip: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: nw(14),
    paddingVertical: nh(8),
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  suggestionText: {
    fontSize: 13,
    color: 'white',
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: nw(16),
    paddingVertical: nh(12),
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: nw(16),
    paddingVertical: nh(8),
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    maxHeight: nh(100),
    marginRight: nw(8),
  },
  sendButton: {
    width: nw(32),
    height: nw(32),
    borderRadius: nw(16),
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: nw(24),
    marginHorizontal: nw(32),
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: nh(16),
    marginBottom: nh(8),
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  modalTime: {
    fontSize: 14,
    color: '#3B82F6',
    marginTop: nh(8),
    fontWeight: '600',
  },
  modalActions: {
    marginTop: nh(24),
  },
  modalButton: {
    minWidth: nw(120),
    backgroundColor: '#3B82F6',
  },
});

export default AIStudyBuddyChat;
