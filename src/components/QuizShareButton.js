import React from 'react';
import {
  TouchableOpacity,
  Alert,
  Share,
  Platform,
  View,
  Text,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import {trackQuizShareApi} from '../services/apiService';
import {APP_CONFIG} from '../constants/appConfig';

const QuizShareButton = ({quiz, style, variant = 'icon'}) => {
  // Create promotional share URL
  const shareUrl = `${APP_CONFIG.SHARE_URLS.QUIZ}${
    quiz.uniqueShareId || quiz.shareId
  }`;
  const QuizID = quiz.uniqueShareId || quiz.shareId;
  const handleShare = async () => {
    try {
      // Craft a compelling promotional message
      const shareMessage = `🎯 Challenge: "${quiz.title}"

${quiz.description}

📝 10 Questions
⏱️ ${quiz.timePerQuestion || 15} seconds per question
🏆 Test your knowledge now!

Search for "${QuizID}" on Search bar on the Quiz tab or click the link below to start:


#ScaleUpApp #Quiz #${quiz.topics?.join(' #') || 'Knowledge'}`;

      const shareOptions = {
        title: `Challenge: ${quiz.title}`,
        message: shareMessage,
        url: Platform.OS === 'ios' ? shareUrl : undefined,
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        // Track share for analytics
        trackQuizShareApi(quiz.id, 'creator_share').catch(console.error);

        // Optional: Show success message
        Alert.alert(
          'Shared Successfully! 🎉',
          'Your quiz has been shared. Track its performance in the analytics section.',
          [{text: 'OK'}],
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share quiz');
      console.error('Share error:', error);
    }
  };

  // Two variants: icon only or button with text
  if (variant === 'icon') {
    return (
      <TouchableOpacity onPress={handleShare} style={style}>
        <Ionicons name="share-social" size={22} color="#8B5CF6" />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity onPress={handleShare} style={[styles.shareButton, style]}>
      <Ionicons name="share-social" size={18} color="#FFFFFF" />
      <Text style={styles.shareButtonText}></Text>
    </TouchableOpacity>
  );
};

const styles = {
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
};

export default QuizShareButton;
