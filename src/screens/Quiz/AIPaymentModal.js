import React, {useState} from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import LinearGradient from 'react-native-linear-gradient';
import {verifyAIPaymentApi} from '../../services/apiService';
import Ionicons from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

const {width: DEVICE_WIDTH, height: DEVICE_HEIGHT} = Dimensions.get('window');
const nw = percentage => (DEVICE_WIDTH * percentage) / 100;
const nh = percentage => (DEVICE_HEIGHT * percentage) / 100;

const COLORS = {
  yellowF5BE00: '#F5BE00',
  blue043142: '#043142',
  whiteFFFFFF: '#FFFFFF',
  grey999999: '#999999',
  greyEEEEEE: '#EEEEEE',
  greyF7F7F7: '#F7F7F7',
  greenSuccess: '#28A745',
  redError: '#DC3545',
  purpleCommunity: '#8B5CF6',
  purpleLightBg: '#F3E8FF',
};

const AIPaymentModal = ({navigation, route}) => {
  const {transactionId, pricing, payment, onSuccess} = route.params || {};
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handlePayment = async () => {
    try {
      setIsProcessing(true);
      
      const options = {
        description: 'AI Question Generation Credits',
        image: 'https://your-logo-url.com/logo.png', // Replace with your logo
        currency: payment.currency,
        key: payment.key,
        amount: payment.amount * 100, // Razorpay expects amount in paise
        name: 'ScaleUp Quiz AI',
        order_id: payment.orderId,
        prefill: {
          email: 'user@example.com', // Get from user data
          contact: '9999999999', // Get from user data
          name: 'User Name', // Get from user data
        },
        theme: {color: COLORS.yellowF5BE00},
      };
      
      RazorpayCheckout.open(options)
        .then(async (data) => {
          // Payment successful, verify with backend
          await verifyPayment(data);
        })
        .catch((error) => {
          setIsProcessing(false);
          Alert.alert('Payment Cancelled', 'You cancelled the payment.');
        });
    } catch (error) {
      setIsProcessing(false);
      console.error('Payment error:', error);
      Alert.alert('Error', 'Failed to process payment. Please try again.');
    }
  };
  
  const verifyPayment = async (paymentData) => {
    try {
      const response = await verifyAIPaymentApi({
        transactionId,
        razorpay_order_id: paymentData.razorpay_order_id,
        razorpay_payment_id: paymentData.razorpay_payment_id,
        razorpay_signature: paymentData.razorpay_signature,
      });
      
      if (response.data.success) {
        Alert.alert(
          'Payment Successful',
          'Your AI questions are being generated. This may take 10-30 seconds.',
          [
            {
              text: 'OK',
              onPress: () => {
                if (onSuccess) onSuccess();
                navigation.goBack();
              },
            },
          ]
        );
      }
    } catch (error) {
      setIsProcessing(false);
      Alert.alert('Error', 'Payment verification failed. Please contact support.');
    }
  };
  
  const handleClose = () => {
    if (!isProcessing) {
      navigation.goBack();
    }
  };
  
  return (
    <Modal
      visible={true}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}>
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            disabled={isProcessing}>
            <Ionicons name="close" size={24} color={COLORS.grey999999} />
          </TouchableOpacity>
          
          <LinearGradient
            colors={[COLORS.purpleLightBg, '#E9D5FF']}
            style={styles.header}>
            <MaterialCommunityIcons name="robot" size={48} color={COLORS.purpleCommunity} />
            <Text variant="bold20" color={COLORS.purpleCommunity} style={{marginTop: 12}}>
              AI Question Generation
            </Text>
          </LinearGradient>
          
          <View style={styles.body}>
            <Text variant="semibold16" color={COLORS.blue043142} style={styles.title}>
              Payment Summary
            </Text>
            
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text variant="regular14" color={COLORS.grey999999}>
                  Questions Requested:
                </Text>
                <Text variant="semibold14" color={COLORS.blue043142}>
                  {pricing.freeQuestions + pricing.paidQuestions}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text variant="regular14" color={COLORS.grey999999}>
                  Free Credits Used:
                </Text>
                <Text variant="semibold14" color={COLORS.greenSuccess}>
                  {pricing.freeQuestions}
                </Text>
              </View>
              
              <View style={styles.summaryRow}>
                <Text variant="regular14" color={COLORS.grey999999}>
                  Paid Questions:
                </Text>
                <Text variant="semibold14" color={COLORS.blue043142}>
                  {pricing.paidQuestions}
                </Text>
              </View>
              
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text variant="semibold16" color={COLORS.blue043142}>
                  Total Amount:
                </Text>
                <Text variant="bold20" color={COLORS.yellowF5BE00}>
                  ₹{pricing.amount}
                </Text>
              </View>
            </View>
            
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color={COLORS.blue043142} />
              <Text variant="regular12" color={COLORS.grey999999} style={{marginLeft: 8, flex: 1}}>
                After payment, your questions will be generated automatically and added to your quiz.
              </Text>
            </View>
            
            <TouchableOpacity
              style={[styles.payButton, isProcessing && styles.disabledButton]}
              onPress={handlePayment}
              disabled={isProcessing}>
              {isProcessing ? (
                <ActivityIndicator size="small" color={COLORS.whiteFFFFFF} />
              ) : (
                <>
                  <Ionicons name="card" size={20} color={COLORS.whiteFFFFFF} />
                  <Text variant="semibold16" color={COLORS.whiteFFFFFF} style={{marginLeft: 8}}>
                    Pay ₹{pricing.amount}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text variant="regular12" color={COLORS.grey999999} style={styles.secureText}>
              <Ionicons name="lock-closed" size={12} color={COLORS.grey999999} />
              {' '}Secure payment powered by Razorpay
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 20,
    width: nw(90),
    maxWidth: 400,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: nw(4),
    right: nw(4),
    zIndex: 1,
    padding: nw(2),
  },
  header: {
    alignItems: 'center',
    paddingVertical: nh(3),
  },
  body: {
    padding: nw(5),
  },
  title: {
    marginBottom: nh(2),
  },
  summaryCard: {
    backgroundColor: COLORS.greyF7F7F7,
    padding: nw(4),
    borderRadius: 12,
    marginBottom: nh(2),
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: nh(1),
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.greyEEEEEE,
    paddingTop: nh(1),
    marginTop: nh(1),
    marginBottom: 0,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.lightBlueE6F0FF,
    padding: nw(3),
    borderRadius: 8,
    marginBottom: nh(3),
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.yellowF5BE00,
    paddingVertical: nh(2),
    borderRadius: 12,
    marginBottom: nh(2),
  },
  disabledButton: {
    opacity: 0.7,
  },
  secureText: {
    textAlign: 'center',
  },
});

export default AIPaymentModal;