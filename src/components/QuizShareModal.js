import React, { useState, useEffect } from 'react';
import {
  View,
  Modal,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Share,
  Platform,
  Alert,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Clipboard from '@react-native-clipboard/clipboard';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { generateQuizQRCodeApi, trackQuizShareApi } from '../services/apiService';
import { APP_CONFIG } from '../constants/appConfig';

const { width: DEVICE_WIDTH } = Dimensions.get('window');
const nw = percentage => (DEVICE_WIDTH * percentage) / 100;

const COLORS = {
  blue043142: '#043142',
  purpleCommunity: '#8B5CF6',
  grey666666: '#666666',
  greyEEEEEE: '#EEEEEE',
  whiteFFFFFF: '#FFFFFF',
  greenSuccess: '#28A745',
};

const QuizShareModal = ({ visible, onClose, quiz, showToast }) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTab, setSelectedTab] = useState('share'); // 'share' or 'qr'
  
  const shareUrl = `${APP_CONFIG.SHARE_URLS.QUIZ}${quiz.uniqueShareId || quiz.shareId}`;
  
  // Generate QR Code when modal opens and QR tab is selected
  useEffect(() => {
    if (visible && selectedTab === 'qr' && !qrCode) {
      generateQRCode();
    }
  }, [visible, selectedTab]);
  
  const generateQRCode = async () => {
    try {
      setLoading(true);
      const response = await generateQuizQRCodeApi(quiz.id, shareUrl);
      setQrCode(response.data.data.qrCode);
    } catch (error) {
      console.error('Error generating QR:', error);
      Alert.alert('Error', 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };
  
  const shareOnPlatform = async (platform) => {
    let message = `Check out this quiz: "${quiz.title}"\n\n${quiz.description}\n\nTake the quiz here: ${shareUrl}`;
    
    try {
      const result = await Share.share({
        title: `Quiz: ${quiz.title}`,
        message: Platform.OS === 'ios' ? message : `${message}\n${shareUrl}`,
        url: Platform.OS === 'ios' ? shareUrl : undefined,
      });
      
      if (result.action === Share.sharedAction) {
        // Track the share
        trackQuizShareApi(quiz.id, platform).catch(console.error);
        showToast({
          type: 'success',
          title: 'Quiz shared successfully!'
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share quiz');
    }
  };
  
  const copyLink = async () => {
    Clipboard.setString(shareUrl);
    showToast({
      type: 'success',
      title: 'Link copied to clipboard!'
    });
    trackQuizShareApi(quiz.id, 'link').catch(console.error);
  };
  
  const downloadQRCode = async () => {
    // Implement QR code download/save functionality
    Alert.alert('Save QR Code', 'QR code saving functionality to be implemented');
  };
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text variant="bold20" color={COLORS.blue043142}>
              Share Quiz
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.grey666666} />
            </TouchableOpacity>
          </View>
          
          {/* Quiz Info */}
          <View style={styles.quizInfo}>
            <Text variant="semibold16" color={COLORS.blue043142} numberOfLines={1}>
              {quiz.title}
            </Text>
            <Text variant="regular12" color={COLORS.grey666666} style={styles.shareCount}>
              Shared {quiz.statistics?.shares || 0} times
            </Text>
          </View>
          
          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'share' && styles.activeTab]}
              onPress={() => setSelectedTab('share')}>
              <Text 
                variant={selectedTab === 'share' ? "semibold14" : "regular14"} 
                color={selectedTab === 'share' ? COLORS.purpleCommunity : COLORS.grey666666}>
                Share Options
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, selectedTab === 'qr' && styles.activeTab]}
              onPress={() => setSelectedTab('qr')}>
              <Text 
                variant={selectedTab === 'qr' ? "semibold14" : "regular14"} 
                color={selectedTab === 'qr' ? COLORS.purpleCommunity : COLORS.grey666666}>
                QR Code
              </Text>
            </TouchableOpacity>
          </View>
          
          {/* Content */}
          {selectedTab === 'share' ? (
            <View style={styles.shareContent}>
              {/* Copy Link */}
              <TouchableOpacity style={styles.shareOption} onPress={copyLink}>
                <View style={[styles.iconContainer, { backgroundColor: COLORS.purpleCommunity + '15' }]}>
                  <Ionicons name="link" size={24} color={COLORS.purpleCommunity} />
                </View>
                <View style={styles.shareOptionText}>
                  <Text variant="semibold14" color={COLORS.blue043142}>Copy Link</Text>
                  <Text variant="regular12" color={COLORS.grey666666} numberOfLines={1}>
                    {shareUrl}
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Share via Apps */}
              <TouchableOpacity style={styles.shareOption} onPress={() => shareOnPlatform('native')}>
                <View style={[styles.iconContainer, { backgroundColor: '#25D366' + '15' }]}>
                  <Ionicons name="share-social" size={24} color="#25D366" />
                </View>
                <View style={styles.shareOptionText}>
                  <Text variant="semibold14" color={COLORS.blue043142}>Share via Apps</Text>
                  <Text variant="regular12" color={COLORS.grey666666}>
                    WhatsApp, Telegram, Email, etc.
                  </Text>
                </View>
              </TouchableOpacity>
              
              {/* Social Media Quick Links */}
              <View style={styles.socialButtons}>
                <TouchableOpacity style={styles.socialButton} onPress={() => shareOnPlatform('whatsapp')}>
                  <Ionicons name="logo-whatsapp" size={28} color="#25D366" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} onPress={() => shareOnPlatform('twitter')}>
                  <Ionicons name="logo-twitter" size={28} color="#1DA1F2" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} onPress={() => shareOnPlatform('linkedin')}>
                  <Ionicons name="logo-linkedin" size={28} color="#0077B5" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} onPress={() => shareOnPlatform('facebook')}>
                  <Ionicons name="logo-facebook" size={28} color="#1877F2" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.qrContent}>
              {loading ? (
                <View style={styles.qrLoading}>
                  <ActivityIndicator size="large" color={COLORS.purpleCommunity} />
                  <Text variant="regular14" color={COLORS.grey666666} style={{ marginTop: 10 }}>
                    Generating QR Code...
                  </Text>
                </View>
              ) : qrCode ? (
                <>
                  <View style={styles.qrCodeContainer}>
                    <Image source={{ uri: qrCode }} style={styles.qrCodeImage} />
                  </View>
                  <Text variant="regular12" color={COLORS.grey666666} style={styles.qrInstruction}>
                    Scan this QR code to access the quiz directly
                  </Text>
                  <TouchableOpacity style={styles.downloadButton} onPress={downloadQRCode}>
                    <Ionicons name="download-outline" size={20} color={COLORS.whiteFFFFFF} />
                    <Text variant="semibold14" color={COLORS.whiteFFFFFF} style={{ marginLeft: 8 }}>
                      Save QR Code
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={styles.generateButton} onPress={generateQRCode}>
                  <Text variant="semibold14" color={COLORS.purpleCommunity}>
                    Generate QR Code
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: nw(5),
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
  quizInfo: {
    paddingHorizontal: nw(5),
    marginBottom: 20,
  },
  shareCount: {
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  tab: {
    flex: 1,
    paddingVertical: 15,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.purpleCommunity,
  },
  shareContent: {
    padding: nw(5),
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.greyEEEEEE,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  shareOptionText: {
    flex: 1,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 30,
    marginBottom: 20,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.greyEEEEEE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrContent: {
    padding: nw(5),
    alignItems: 'center',
  },
  qrLoading: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  qrCodeContainer: {
    padding: 20,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  qrCodeImage: {
    width: nw(60),
    height: nw(60),
  },
  qrInstruction: {
    marginTop: 20,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.purpleCommunity,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  generateButton: {
    backgroundColor: COLORS.purpleCommunity + '15',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
});

// Text component placeholder
const Text = ({ children, variant, color, ...props }) => {
  return <RNText style={{ color }} {...props}>{children}</RNText>;
};

export default QuizShareModal;