import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
  Text,
  TouchableOpacity,
  Modal
} from 'react-native';
import Video from 'react-native-video';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import convertToProxyURL from 'react-native-video-cache';
import Icon from '../../helper/icon';
import { checkUserPaymentDetailsApi } from '../../services/apiService';
import { Alert } from 'react-native';
import PaymentOptionsModal from '../Quiz/PaymentOptionsModal';
import { saveUserUpiDetailsApi, saveUserBankDetailsApi } from '../../services/apiService';
import {
  getProfile
} from '../../services/apiService';
import axiosInstance from '../../services/axiosinstance';

import RazorpayCheckout from 'react-native-razorpay';

const VideoPostPlayer = ({
  videoUrl,
  thumbnail,
  isVisible,
  onProgress,
  onEnd,
  style,
  videoDimensions,
  globalMuted, // New prop
  premiumData = null,
  onPreviewEnd = null,
}) => {
  const videoRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const controlsTimeout = useRef(null);

  const [paused, setPaused] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [scrubbing, setScrubbing] = useState(false);
  const [muted, setMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [resizeMode, setResizeMode] = useState('cover');
  const [showControls1, setShowControls] = useState(true);

  const [showPremiumOverlay, setShowPremiumOverlay] = useState(false);
const [previewEnded, setPreviewEnded] = useState(false);
const [isRefundModalVisible, setIsRefundModalVisible] = useState(false);
const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
const [pendingPremiumUnlock, setPendingPremiumUnlock] = useState(null);

const [isProcessingPayment, setIsProcessingPayment] = useState(false);
const [razorpayOrderId, setRazorpayOrderId] = useState(null);
const [isContentUnlocked, setIsContentUnlocked] = useState(false);


const [profileData, setProfileData] = useState(null);
  
const [showRefundButton, setShowRefundButton] = useState(false);
const [isRefunding, setIsRefunding] = useState(false);


useEffect(() => {
  if (premiumData && isContentUnlocked && !previewEnded) {
    setShowRefundButton(true);
  } else {
    setShowRefundButton(false);
  }
}, [premiumData, isContentUnlocked, previewEnded]);

const handleRefund = async () => {
  try {
    const watchedPercentage = (currentTime / duration) * 100;
    console.log('Watched percentage:', watchedPercentage);
    
    if (watchedPercentage > 50) {
      Alert.alert(
        'Refund Not Available',
        'You have watched more than 50% of the video. Refund is not available.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Request Refund',
      `You have watched ${watchedPercentage.toFixed(1)}% of the video. Do you want to request a refund?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Refund',
          style: 'destructive',
          onPress: () => processRefund(),
        },
      ]
    );
  } catch (error) {
    console.error('Refund check error:', error);
    Alert.alert('Error', 'Unable to process refund request');
  }
};

const processRefund = async () => {
  setIsRefunding(true);
  try {
    const contentId = premiumData?.contentId || premiumData?.id;
    const response = await axiosInstance.post(
      'http://192.168.1.8:3000/api/content/request-refund',
      { 
        contentId,
        reason: 'User requested refund via video player'
      }
    );

    if (response.data.success) {
      // Check if refund was automatically processed or just requested
      const isAutoProcessed = response.data.status === 'approved';
      
      const alertTitle = isAutoProcessed ? 'Refund Processed' : 'Refund Requested';
      const alertMessage = isAutoProcessed 
        ? `Your refund has been processed successfully. You will receive the refund in ${response.data.estimatedProcessingTime}.`
        : `Your refund request has been submitted successfully. It will be processed within ${response.data.estimatedProcessingTime}.`;
      
      Alert.alert(
        alertTitle,
        alertMessage,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset video state after refund
              setIsContentUnlocked(false);
              setShowPremiumOverlay(true);
              setShowRefundButton(false);
              setPaused(true);
              
              // Reset video to beginning
              if (videoRef.current) {
                videoRef.current.seek(0);
                setCurrentTime(0);
                progressAnim.setValue(0);
              }
            },
          },
        ]
      );
    } else {
      Alert.alert('Refund Failed', response.data.message || 'Unable to process refund');
    }
  } catch (error) {
    console.error('Refund processing error:', error);
    
    let errorMessage = 'Unable to process refund request';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Alert.alert('Refund Failed', errorMessage);
  } finally {
    setIsRefunding(false);
  }
};




  useEffect(() => {
      getProfileData();
    }, []);
  
    // Function to get user profile data from AsyncStorage and API
    const getProfileData = async () => {
      try {
        // Fetch profile information using the API
        let res = await getProfile('');
        // console.log('fddddddddddd🚀 ~ getProfileData ~ res:', res?.data?.userProfileInfo);
        setProfileData(res?.data?.userProfileInfo);
      } catch (error) {
        console.log('Profile data fetch error:', error?.response?.data?.message);
      }
    };





const handleSaveUPI = async upiId => {
  try {
    await saveUserUpiDetailsApi(upiId);
    setIsPaymentModalVisible(false);

    if (pendingPremiumUnlock) {
      Alert.alert(
        'Payment Details Saved',
        'Your UPI details have been saved. Would you like to proceed with unlocking premium content?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Continue Unlock',
            onPress: () => handleProceedUnlock(),
          },
        ],
      );
      setPendingPremiumUnlock(null);
    }
  } catch (error) {
    console.error('Error saving UPI details:', error);
    Alert.alert('Error', 'Failed to save UPI details. Please try again.');
  }
};

const handleSaveBankDetails = async bankDetails => {
  try {
    await saveUserBankDetailsApi(bankDetails);
    setIsPaymentModalVisible(false);

    if (pendingPremiumUnlock) {
      Alert.alert(
        'Payment Details Saved',
        'Your bank details have been saved. Would you like to proceed with unlocking premium content?',
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Continue Unlock',
            onPress: () => handleProceedUnlock(),
          },
        ],
      );
      setPendingPremiumUnlock(null);
    }
  } catch (error) {
    console.error('Error saving bank details:', error);
    Alert.alert('Error', 'Failed to save bank details. Please try again.');
  }
};


  // Function to hide controls
  const hideControls = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setShowControls(false);
    });
  };

  // Function to show controls
  const showControls = () => {
    setShowControls(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  // Reset and start the control hide timer
  const resetControlsTimer = () => {
    if (controlsTimeout.current) {
      clearTimeout(controlsTimeout.current);
    }

    if (!paused) {
      controlsTimeout.current = setTimeout(() => {
        hideControls();
      }, 1000);
    }
  };




// 4. Add this function for handling the refund modal proceed action


const handleUnlockNow = async () => {
  console.log('=== Payment Flow Started ===');
  console.log('premiumData received:', premiumData);
  console.log('profileData:', profileData);
  console.log('Current video state - paused:', paused);
  console.log('Current video state - currentTime:', currentTime);
  console.log('Preview ended:', previewEnded);
  console.log('Show premium overlay:', showPremiumOverlay);
  
  try {
    // Check if user has payment details
    console.log('Checking user payment details...');
    const response = await checkUserPaymentDetailsApi();
    console.log('Payment details response:', response);
    console.log('Has payment details:', response.data.hasPaymentDetails);
    
    if (!response.data.hasPaymentDetails) {
      console.log('No payment details found - showing payment modal');
      setPendingPremiumUnlock(true);
      setIsPaymentModalVisible(true);
      return;
    }
    
    console.log('Payment details exist - showing refund confirmation modal');
    setIsRefundModalVisible(true);
    
  } catch (error) {
    console.error('Error checking payment details:', error);
    console.log('Error response:', error?.response?.data);
    Alert.alert(
      'Error',
      'Could not check payment details. Please try again.'
    );
  }
};

const handleProceedUnlock = async () => {
  console.log('=== Proceeding with Payment Unlock ===');
  
  setIsRefundModalVisible(false);
  setIsProcessingPayment(true);
  
  try {
    const contentId = premiumData?.contentId || premiumData?.id;
    console.log('Content ID extracted:', contentId);

    if (!contentId) {
      console.error('Content ID is missing from premiumData');
      throw new Error('Content ID is missing');
    }

    console.log('Creating payment order for contentId:', contentId);
    
    // Step 1: Create Razorpay order
    const orderPayload = {
      contentId: contentId, 
      currency: 'INR',
      type: 'Premium Content Unlock',
    };
    console.log('Order payload:', orderPayload);
    
    const orderResponse = await axiosInstance.post(
      'http://192.168.1.8:3000/api/content/create-payment-order',
      orderPayload
    );

    const orderData = orderResponse.data;
    console.log('Order response data:', orderData);
    
    if (!orderData.success) {
      console.error('Order creation failed:', orderData.message);
      throw new Error(orderData.message || 'Failed to create payment order');
    }

    // CRITICAL FIX: Store orderId in a variable instead of relying on state
    const currentOrderId = orderData.orderId;
    console.log('Using orderId for payment:', currentOrderId);
    
    // Set state for UI purposes but don't rely on it for verification
    setRazorpayOrderId(currentOrderId);

    // Step 2: Prepare Razorpay checkout options
    const options = {
      description: `Unlock Premium Content: ${premiumData.contentTitle || 'Premium Video'}`,
      currency: orderData.currency,
      key: 'rzp_live_KjPiUmsHYaExDg',
      amount: orderData.amount,
      order_id: currentOrderId, // Use the variable, not state
      name: 'ScaleUp',
      prefill: {
        email: profileData?.email,
        contact: profileData?.phoneNumber,
        name: profileData?.name || 'USER_NAME'
      },
      theme: {color: COLORS.primary || '#3399cc'}
    };
    
    console.log('Razorpay options:', options);
    console.log('Opening Razorpay checkout...');

    const data = await RazorpayCheckout.open(options);
    console.log('Razorpay checkout response:', data);
    
    // Step 3: Verify payment on success - pass the orderId directly
    await handlePaymentSuccess(data, currentOrderId, contentId);
    
  } catch (error) {
    console.error('Payment error details:', error);
    
    let errorMessage = 'Something went wrong with the payment.';
    
    if (error.code === 'payment_cancelled') {
      console.log('Payment was cancelled by user');
      Alert.alert('Payment Cancelled', 'You cancelled the payment process.');
      return;
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response) {
      errorMessage = error.response.data.error || 'Server error occurred';
    } else if (error.request) {
      errorMessage = 'No response received from server';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.log('Final error message shown to user:', errorMessage);
    Alert.alert('Payment Failed', errorMessage);
  } finally {
    console.log('Setting processing payment to false');
    setIsProcessingPayment(false);
  }
};

// UPDATED: Modified to accept orderId and contentId as parameters
const handlePaymentSuccess = async (paymentData, orderId, contentId) => {
  console.log('=== Payment Success Handler ===');
  console.log('Payment data received:', paymentData);
  console.log('Order ID for verification:', orderId);
  console.log('Content ID for verification:', contentId);
  
  try {
    const verificationPayload = {
      orderId: orderId, // Use the passed parameter
      paymentId: paymentData.razorpay_payment_id,
      signature: paymentData.razorpay_signature,
      contentId: contentId // Use the passed parameter
    };
    
    console.log('Verification payload:', verificationPayload);
    console.log('Sending verification request...');
    
    const verificationResponse = await axiosInstance.post(
      'http://192.168.1.8:3000/api/content/verify-payment',
      verificationPayload
    );

    const verificationResult = verificationResponse.data;
    console.log('Verification response:', verificationResult);
    
    if (verificationResult.success) {
      console.log('Payment verified successfully!');
      console.log('Updating video states...');
      setIsContentUnlocked(true);
      setShowPremiumOverlay(false);
      setPreviewEnded(false);
      setPaused(false);
      
      // Reset video to beginning if needed
      if (videoRef.current) {
        console.log('Seeking video to beginning...');
        videoRef.current.seek(0);
        setCurrentTime(0);
        progressAnim.setValue(0);
      }
      
      console.log('Video unlocked successfully!');
      Alert.alert('Success!', 'Premium content unlocked successfully!');
    } else {
      console.error('Payment verification failed:', verificationResult.message);
      throw new Error(verificationResult.message || 'Payment verification failed');
    }
    
  } catch (error) {
    console.error('Payment verification error details:', error);
    console.log('Verification error response:', error.response?.data);
    
    let errorMessage = 'Payment completed but verification failed. Please contact support.';
    
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response) {
      errorMessage = error.response.data.error || 'Server error occurred';
    } else if (error.request) {
      errorMessage = 'No response received from server';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    console.log('Verification error message:', errorMessage);
    Alert.alert('Verification Failed', errorMessage);
  }
};

  // Handle video press
  const handleVideoPress = () => {
    if (showControls) {
      setPaused(!paused);
      resetControlsTimer();
    } else {
      showControls();
      resetControlsTimer();
    }
  };

  // Effect to manage controls visibility
  useEffect(() => {
    if (!isVisible) {
      if (videoRef.current) {
        videoRef.current.seek(0);
        setCurrentTime(0);
        setPaused(true);
        progressAnim.setValue(0);
      }
      setShowPremiumOverlay(false);
    setPreviewEnded(false);
    } else {
      setPaused(true);
      resetControlsTimer();
    }

    return () => {
      if (controlsTimeout.current) {
        clearTimeout(controlsTimeout.current);
      }
    };
  }, [isVisible]);

  // Effect to handle control visibility when pausing
  useEffect(() => {
    if (paused) {
      showControls();
    } else {
      resetControlsTimer();
    }
  }, [paused]);

  // Effect for fullscreen mode
  useEffect(() => {
    setResizeMode(isFullscreen ? 'contain' : 'cover');
  }, [isFullscreen]);

  const formatTime = seconds => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    const remaining = duration - currentTime;
    return `-${formatTime(remaining)}`;
  };

  const handleProgress = progress => {
    if (!scrubbing) {
      setCurrentTime(progress.currentTime);
      Animated.timing(progressAnim, {
        toValue: (progress.currentTime / duration) * 100,
        duration: 250,
        useNativeDriver: false,
      }).start();
    if (premiumData && premiumData.isPreviewMode && !previewEnded && !isContentUnlocked) {
      if (progress.currentTime >= premiumData.previewDuration) {
        setPaused(true);
        setShowPremiumOverlay(true);
        setPreviewEnded(true);
        onPreviewEnd?.();
      }
    }

    }
    
    onProgress?.(progress);
  };

  const handleLoad = meta => {
    setDuration(meta.duration);
  };

  const handleEnd = () => {
    setPaused(true);
    videoRef.current?.seek(0);
    setCurrentTime(0);
    progressAnim.setValue(0);
    showControls();
    onEnd?.();
  };

  const toggleMute = () => {
    setMuted(!muted);
    resetControlsTimer();
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!isFullscreen) {
        videoRef.current.presentFullscreenPlayer();
      } else {
        videoRef.current.dismissFullscreenPlayer();
      }
      setIsFullscreen(!isFullscreen);
      resetControlsTimer();
    }
  };

const PremiumOverlay = () => (
  <View style={styles.premiumOverlay}>
    <View style={styles.premiumCard}>
      <Icon
        type="ionicon"
        name="lock-closed"
        size={40}
        color={COLORS.whiteFFFFFF}
        style={styles.lockIcon}
      />
      <Text style={styles.premiumTitle}>Premium Content</Text>
      <Text style={styles.premiumText}>
        Unlock full video for ₹{premiumData?.price}
      </Text>
      <TouchableOpacity 
        style={[styles.unlockButton, isProcessingPayment && styles.disabledButton]}
        onPress={handleUnlockNow}
        disabled={isProcessingPayment}>
        <Text style={styles.unlockButtonText}>
          {isProcessingPayment ? 'Processing...' : 'Unlock Now'}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);


const RefundConfirmationModal = () => (
  <Modal
    visible={isRefundModalVisible}
    transparent={true}
    animationType="fade"
    onRequestClose={() => setIsRefundModalVisible(false)}>
    <View style={styles.modalOverlay}>
      <View style={styles.refundModalContent}>
        <Text style={styles.refundModalTitle}>Unlock Premium Content</Text>
        <Text style={styles.refundModalText}>
          The refund will be processed if you have not watched the video.
        </Text>
        <View style={styles.refundModalButtons}>
          <TouchableOpacity 
            style={[styles.refundModalButton, styles.cancelButton]}
            onPress={() => setIsRefundModalVisible(false)}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.refundModalButton, styles.proceedButton]}
            onPress={handleProceedUnlock}>
            <Text style={styles.proceedButtonText}>Proceed</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);


  return (
    <View style={[styles.container, style]}>
      <Pressable onPress={handleVideoPress}>
        <Video
          ref={videoRef}
          source={{uri: convertToProxyURL(videoUrl)}}
          style={[
            styles.video,
            videoDimensions?.height
              ? {
                  aspectRatio: Number(
                    videoDimensions.width / videoDimensions.height,
                  ),
                  width: DEVICE_WIDTH - nw(32),
                }
              : {
                  height: nh(250),
                  width: DEVICE_WIDTH - nw(32),
                },
          ]}
          paused={paused}
          muted={muted}
          onProgress={handleProgress}
          onLoad={handleLoad}
          onEnd={handleEnd}
          resizeMode={resizeMode}
          repeat={false}
          poster={thumbnail}
          posterResizeMode="cover"
          playInBackground={false}
          playWhenInactive={false}
          onFullscreenPlayerWillDismiss={() => {
            setIsFullscreen(false);
            setResizeMode('cover');
          }}
          onFullscreenPlayerDidPresent={() => {
            setIsFullscreen(true);
            setResizeMode('contain');
          }}
          fullscreenAutorotate={true}
          fullscreenOrientation="all"
        />

        {/* Play/Pause Button */}
        <Animated.View style={[styles.centerButton, {opacity: fadeAnim}]}>
          <TouchableOpacity
            onPress={handleVideoPress}
            style={styles.playPauseButton}>
            <Icon
              type="ionicon"
              name={paused ? 'play' : 'pause'}
              size={40}
              color={COLORS.whiteFFFFFF}
            />
          </TouchableOpacity>
        </Animated.View>

        {/* Control overlay */}
        {showControls && (
          <Animated.View style={[styles.controlsOverlay, {opacity: fadeAnim}]}>
            <TouchableOpacity onPress={toggleMute} style={styles.controlButton}>
              <Icon
                type="ionicon"
                name={muted ? 'volume-mute' : 'volume-medium'}
                size={24}
                color={COLORS.whiteFFFFFF}
              />
            </TouchableOpacity>

            {showRefundButton && (
      <TouchableOpacity 
        onPress={handleRefund} 
        style={[styles.controlButton, isRefunding && styles.disabledButton]}
        disabled={isRefunding}>
        <Icon
          type="ionicon"
          name="receipt-outline"
          size={24}
          color={isRefunding ? COLORS.gray : COLORS.whiteFFFFFF}
        />
      </TouchableOpacity>
    )}



            <TouchableOpacity
              onPress={toggleFullscreen}
              style={styles.controlButton}>
              <Icon
                type="ionicon"
                name={isFullscreen ? 'contract' : 'expand'}
                size={24}
                color={COLORS.whiteFFFFFF}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Timer display */}
        {showControls && (
          <Animated.View style={[styles.timerContainer, {opacity: fadeAnim}]}>
            <Text style={styles.timerText}>{getRemainingTime()}</Text>
          </Animated.View>
        )}

        {/* Progress bar */}
        {showControls && (
          <Animated.View
            style={[styles.progressContainer, {opacity: fadeAnim}]}>
            <View style={styles.progressBackground} />
            <Animated.View
              style={[
                styles.progressBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.progressIndicator,
                {
                  left: progressAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                  }),
                  transform: [{translateX: -6}],
                },
              ]}
            />
          </Animated.View>
        )}

        {/* Premium Content Overlay */}
{showPremiumOverlay && premiumData && !isContentUnlocked && (
  <PremiumOverlay />
)}

<RefundConfirmationModal />


<PaymentOptionsModal
  visible={isPaymentModalVisible}
  onClose={() => {
    setIsPaymentModalVisible(false);
    setPendingPremiumUnlock(null);
  }}
  onSaveUPI={handleSaveUPI}
  onSaveBankDetails={handleSaveBankDetails}
/>


      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: nh(12),
    overflow: 'hidden',
    backgroundColor: COLORS.whiteFFFFFF,
    marginVertical: nh(10),
  },
  disabledButton: {
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refundModalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 12,
    padding: 24,
    marginHorizontal: 32,
    alignItems: 'center',
  },
  refundModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.blue043142,
    marginBottom: 16,
    textAlign: 'center',
  },
  refundModalText: {
    fontSize: 14,
    color: COLORS.grey333333,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  refundModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  refundModalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: COLORS.greyEEEEEE,
    marginRight: 8,
  },
  proceedButton: {
    backgroundColor: COLORS.blue043142,
    marginLeft: 8,
  },
  cancelButtonText: {
    color: COLORS.grey333333,
    fontWeight: '500',
  },
  proceedButtonText: {
    color: COLORS.whiteFFFFFF,
    fontWeight: '500',
  },
  premiumOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  premiumCard: {
    backgroundColor: COLORS.blue043142,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  lockIcon: {
    marginBottom: 10,
  },
  premiumTitle: {
    color: COLORS.whiteFFFFFF,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  premiumText: {
    color: COLORS.whiteFFFFFF,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  unlockButton: {
    backgroundColor: COLORS.yellowF5BE00,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  unlockButtonText: {
    color: COLORS.blue043142,
    fontWeight: 'bold',
    fontSize: 16,
  },
  video: {
    backgroundColor: COLORS.whiteFFFFFF,
  },
  centerButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{translateX: -25}, {translateY: -25}],
  },
  playPauseButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlsOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    gap: 10,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    height: 3,
    width: '100%',
    backgroundColor: 'transparent',
    position: 'absolute',
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#FF0000',
    position: 'absolute',
  },
  progressIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF0000',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  timerContainer: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  timerText: {
    color: 'white',
    fontSize: 12,
  },
});

export default VideoPostPlayer;
