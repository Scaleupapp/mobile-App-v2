import React, { useState } from 'react';
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
import axiosInstance from '../../services/axiosinstance';

const RefundModal = ({ visible, onClose, quiz, onRefundSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefund = async () => {
    if (!quiz?._id) {
      Alert.alert('Error', 'Quiz information is missing');
      return;
    }

    setIsLoading(true);
    try {
      // Request refund from backend
      const refundResponse = await axiosInstance.post(
        'http://192.168.68.240:3000/api/rapidfire-quiz/process-refund',
        { quizId: quiz._id }
      );

      if (refundResponse?.data?.success) {
        Alert.alert(
          'Success',
          'Refund processed successfully! Your payment will be credited back to your original payment method.',
          [
            {
              text: 'OK',
              onPress: () => {
                onRefundSuccess();
                onClose();
              }
            }
          ]
        );
      } else {
        throw new Error(refundResponse?.data?.message || 'Refund processing failed');
      }
    } catch (error) {
      console.error('Refund process failed:', error);
      
      let errorMessage = 'Refund failed. Please try again.';
      
      if (error.response) {
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
            Request Refund
          </Text>
          <Text variant="regular16" style={styles.amount}>
            ₹{quiz?.entryFee}
          </Text>
          <Text variant="regular14" style={styles.disclaimer}>
            You can only request a refund before the quiz starts. Once the quiz begins, refunds are not possible.
          </Text>
          {isLoading ? (
            <ActivityIndicator size="large" color={COLORS.yellowF5BE00} />
          ) : (
            <TouchableOpacity
              style={styles.refundButton}
              onPress={handleRefund}
              disabled={isLoading}
            >
              <Text variant="semibold16" color={COLORS.whiteFFFFFF}>
                Confirm Refund
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
    marginBottom: nh(10),
  },
  disclaimer: {
    textAlign: 'center',
    marginBottom: nh(20),
    color: COLORS.grey999999,
  },
  refundButton: {
    backgroundColor: COLORS.red,
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

export default RefundModal;