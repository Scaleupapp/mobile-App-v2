// PaymentOptionsModal.js
import React, { useState } from 'react';
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
// Use your existing Text component
import Text from '../../components/Text';
const PaymentOptionsModal = ({ visible, onClose, onSaveUPI, onSaveBankDetails }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountName, setAccountName] = useState('');

  const handleSave = () => {
    if (selectedOption === 'upi') {
      onSaveUPI(upiId);
    } else if (selectedOption === 'bank') {
      onSaveBankDetails({ accountNumber, ifscCode, accountName });
    }
  };

  const renderUPIForm = () => (
    <View style={styles.formContainer}>
      <Text>UPI ID</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your UPI ID"
        placeholderTextColor="#000"
        value={upiId}
        onChangeText={setUpiId}
      />
    </View>
  );

  const renderBankForm = () => (
    <View style={styles.formContainer}>
      <Text>Account Number</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your account number"
        placeholderTextColor="#000"
        value={accountNumber}
        onChangeText={setAccountNumber}
        keyboardType="number-pad"
      />
      
      <Text style={styles.inputLabel}>IFSC Code</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter IFSC code"
        placeholderTextColor="#000"
        value={ifscCode}
        onChangeText={setIfscCode}
        autoCapitalize="characters"
      />
      
      <Text style={styles.inputLabel}>Account Holder Name</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter account holder name"
        placeholderTextColor="#000"
        value={accountName}
        onChangeText={setAccountName}
      />
    </View>
  );

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Payment Information Required</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.modalSubtitle}>
            Please provide your payment details to register for this Prized quiz.
          </Text>
          
          <View style={styles.optionsContainer}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === 'upi' && styles.selectedOption
              ]}
              onPress={() => setSelectedOption('upi')}
            >
              <Ionicons 
                name="phone-portrait-outline" 
                size={24} 
                color={selectedOption === 'upi' ? "#fff" : "#333"} 
              />
              <Text style={[
                styles.optionText,
                selectedOption === 'upi' && styles.selectedOptionText
              ]}>
                UPI ID
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.optionButton,
                selectedOption === 'bank' && styles.selectedOption
              ]}
              onPress={() => setSelectedOption('bank')}
            >
              <Ionicons 
                name="card-outline" 
                size={24} 
                color={selectedOption === 'bank' ? "#fff" : "#333"} 
              />
              <Text style={[
                styles.optionText,
                selectedOption === 'bank' && styles.selectedOptionText
              ]}>
                Bank Account
              </Text>
            </TouchableOpacity>
          </View>
          
          {selectedOption === 'upi' && renderUPIForm()}
          {selectedOption === 'bank' && renderBankForm()}
          
          {selectedOption && (
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={
                (selectedOption === 'upi' && !upiId) ||
                (selectedOption === 'bank' && (!accountNumber || !ifscCode || !accountName))
              }
            >
              <Text style={styles.saveButtonText}>Save & Continue</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    marginBottom: 20,
    color: '#666',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  optionButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  selectedOption: {
    backgroundColor: '#043142',
    borderColor: '#043142',
  },
  optionText: {
    marginLeft: 10,
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#fff',
  },
  formContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginTop: 5,
    color: 'black', // Explicitly setting text color to black

  },
  saveButton: {
    backgroundColor: '#F5BE00',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: 'bold',
    color: '#043142',
  },
});

export default PaymentOptionsModal;