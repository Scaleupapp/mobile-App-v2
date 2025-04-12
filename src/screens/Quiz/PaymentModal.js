import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Text from '../../components/Text';
import { COLORS } from '../../helper/colors';
import { DEVICE_WIDTH, nh, nw } from '../../helper/scales';
import RazorpayCheckout from 'react-native-razorpay';
import axiosInstance from '../../services/axiosinstance';
import {
  getProfile
} from '../../services/apiService';

const PaymentModal = ({ visible, onClose, quiz, onPaymentSuccess }) => {

    //console.log('quizzzzzz',quiz)
  const [isLoading, setIsLoading] = useState(false);
    const [profileData, setProfileData] = useState(null);
  

  useEffect(() => {
      getProfileData();
    }, []);
  
    // Function to get user profile data from AsyncStorage and API
    const getProfileData = async () => {
      try {
        // Fetch profile information using the API
        let res = await getProfile('');
        console.log('🚀 ~ getProfileData ~ res:', res?.data?.userProfileInfo);
        setProfileData(res?.data?.userProfileInfo);
      } catch (error) {
        console.log('Profile data fetch error:', error?.response?.data?.message);
      }
    };


  const handlePayment = async () => {
    if (!quiz?._id) {
      Alert.alert('Error', 'Quiz information is missing');
      return;
    }
  
    setIsLoading(true);
    try {
      const kycResponse = await axiosInstance.get(
        'http://192.168.68.240:3000/api/quiz/kyc/status'
      );

      if (!kycResponse.data.isKycComplete) {
        setIsLoading(false);
        onClose(); // Close payment modal
        // Notify parent component to show KYC modal
        Alert.alert(
          'KYC Required',
          'You need to complete KYC verification before participating in paid quizzes.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Complete KYC', 
              onPress: () => onKycRequired() 
            }
          ]
        );
        return;
      }
      
      // Step 1: Create order
      const orderResponse = await axiosInstance.post(
        'http://192.168.68.240:3000/api/rapidfire-quiz/create-order',
        { 
          quizId: quiz._id,
          currency: 'INR',
          type: 'Quiz Entry Fee'
        }
      );
  
      const { orderId, amount, currency } = orderResponse.data;
  
      // Step 2: Initialize Razorpay payment
      const options = {
        key: 'rzp_live_nhqapP6BCrwzri', // Replace with your actual key
        amount: amount, // Amount from backend in paisa
        currency: currency,
        name: 'Quiz App',
        description: `Entry fee for ${quiz.title}`,
        order_id: orderId,
        prefill: {
          email: profileData?.email || 'gulshan.iitb@gmail.com', 
          contact: profileData?.phoneNumber || '6202712403', 
        },
        theme: { color: COLORS.yellowF5BE00 }
      };
  
      // Step 3: Open Razorpay and handle payment
      const paymentResponse = await RazorpayCheckout.open(options);
      
      // Step 4: Verify payment with backend
      const verificationResponse = await axiosInstance.post(
        'http://192.168.68.240:3000/api/rapidfire-quiz/verify-payment',
        {
          orderId: orderId,
          paymentId: paymentResponse.razorpay_payment_id,
          signature: paymentResponse.razorpay_signature,
          quizId: quiz._id
        }
      );
  
      if (verificationResponse?.data?.success) {
        Alert.alert(
          'Success',
          'Payment successful! You have been registered for the quiz.',
          [
            {
              text: 'OK',
              onPress: () => {
                onPaymentSuccess();
                onClose();
              }
            }
          ]
        );
      } else {
        throw new Error(verificationResponse.data.message || 'Payment verification failed');
      }
      
    } catch (error) {
      console.error('Payment process failed:', error);
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error.response?.data?.message === 'KYC_NOT_COMPLETE') {
        errorMessage = 'Please complete your KYC verification first.';
      } else if (error.response) {
        errorMessage = error.response.data.message || 
                      error.response.data.error || 
                      'Server error occurred';
      } else if (error.request) {
        errorMessage = 'No response received from server';
      } else if (error.message) {
        errorMessage = error.message;
      }
  
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text variant="semibold20" style={styles.title}>
            Quiz Entry Fee
          </Text>
          <Text variant="regular16" style={styles.amount}>
            ₹{quiz?.entryFee}
          </Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
          ) : (
            <TouchableOpacity
              style={styles.payButton}
              onPress={handlePayment}
              disabled={isLoading}
            >
              <Text variant="semibold16" color={COLORS.whiteFFFFFF}>
                Pay Now
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            disabled={isLoading}
          >
            <Text variant="regular14" color={COLORS.blue043142}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: DEVICE_WIDTH * 0.8,
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: nw(12),
    padding: nw(20),
    alignItems: 'center',
  },
  title: {
    marginBottom: nh(10),
  },
  amount: {
    marginBottom: nh(20),
  },
  payButton: {
    backgroundColor: COLORS.yellowF5BE00,
    paddingVertical: nh(12),
    paddingHorizontal: nw(24),
    borderRadius: nw(8),
    marginBottom: nh(12),
    width: '100%',
    alignItems: 'center',
  },
  cancelButton: {
    paddingVertical: nh(8),
  },
});

export default PaymentModal;