// components/KYCModal.js
import React, { useState } from 'react';
import {
  Modal,
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Text from '../../components/Text';
import CustomTextInput from '../../components/TextInput';
import { COLORS } from '../../helper/colors';
import { DEVICE_WIDTH, nh, nw } from '../../helper/scales';
import * as ImagePicker from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const KYCModal = ({ visible, onClose, onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    personalInfo: {
      fullName: '',
      email: '',
      phone: '',
    },
    address: {
      street: '',
      city: '',
      state: '',
      pincode: '',
    },
    bankDetails: {
      accountNumber: '',
      ifscCode: '',
      accountHolderName: '',
    },
    panNumber: '',
    aadhaarNumber: '',
  });

  const [documents, setDocuments] = useState({
    panCard: null,
    aadhaarFront: null,
    aadhaarBack: null,
  });

  const pickDocument = async (type) => {
    try {
      const result = await ImagePicker.launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
      });

      if (!result.didCancel && result.assets[0]) {
        setDocuments(prev => ({
          ...prev,
          [type]: {
            uri: result.assets[0].uri,
            type: result.assets[0].type,
            name: result.assets[0].fileName,
          }
        }));
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const validateStep = () => {
    switch (step) {
      case 1:
        return (
          formData.personalInfo.fullName &&
          formData.personalInfo.email &&
          formData.personalInfo.phone
        );
      case 2:
        return (
          formData.address.street &&
          formData.address.city &&
          formData.address.state &&
          formData.address.pincode
        );
      case 3:
        return (
          formData.bankDetails.accountNumber &&
          formData.bankDetails.ifscCode &&
          formData.bankDetails.accountHolderName
        );
      case 4:
        return (
          formData.panNumber &&
          formData.aadhaarNumber &&
          documents.panCard &&
          documents.aadhaarFront &&
          documents.aadhaarBack
        );
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      console.log("tokennnnnn",token);
      
      const formDataObj = new FormData();

      // Append all form data
      Object.keys(formData.personalInfo).forEach(key => {
        formDataObj.append(`personalInfo[${key}]`, formData.personalInfo[key]);
      });

      Object.keys(formData.address).forEach(key => {
        formDataObj.append(`address[${key}]`, formData.address[key]);
      });

      Object.keys(formData.bankDetails).forEach(key => {
        formDataObj.append(`bankDetails[${key}]`, formData.bankDetails[key]);
      });

      formDataObj.append('panNumber', formData.panNumber);
      formDataObj.append('aadhaarNumber', formData.aadhaarNumber);

      // Append documents
      if (documents.panCard) {
        formDataObj.append('panCard', documents.panCard);
      }
      if (documents.aadhaarFront) {
        formDataObj.append('aadhaarFront', documents.aadhaarFront);
      }
      if (documents.aadhaarBack) {
        formDataObj.append('aadhaarBack', documents.aadhaarBack);
      }

      const response = await axios.post(
        'http://192.168.68.240:3000/api/rapidfire-quiz/kyc/submit',
        formDataObj,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      Alert.alert(
        'Success',
        'KYC submitted successfully. We will review your documents.',
        [{ text: 'OK', onPress: () => {
          onComplete();
          onClose();
        }}]
      );
    } catch (error) {
      console.error('KYC Submit Error:', error);
      Alert.alert('Error', 'Failed to submit KYC. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Personal Information</Text>
            <CustomTextInput
              placeholder="Full Name"
              value={formData.personalInfo.fullName}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, fullName: text }
              }))}
            />
            <CustomTextInput
              placeholder="Email"
              value={formData.personalInfo.email}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, email: text }
              }))}
              keyboardType="email-address"
            />
            <CustomTextInput
              placeholder="Phone Number"
              value={formData.personalInfo.phone}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                personalInfo: { ...prev.personalInfo, phone: text }
              }))}
              keyboardType="phone-pad"
            />
          </View>
        );
  
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Address Details</Text>
            <CustomTextInput
              placeholder="Street Address"
              value={formData.address.street}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                address: { ...prev.address, street: text }
              }))}
            />
            <CustomTextInput
              placeholder="City"
              value={formData.address.city}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                address: { ...prev.address, city: text }
              }))}
            />
            <CustomTextInput
              placeholder="State"
              value={formData.address.state}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                address: { ...prev.address, state: text }
              }))}
            />
            <CustomTextInput
              placeholder="Pin Code"
              value={formData.address.pincode}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                address: { ...prev.address, pincode: text }
              }))}
              keyboardType="numeric"
            />
          </View>
        );
  
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Bank Details</Text>
            <CustomTextInput
              placeholder="Account Number"
              value={formData.bankDetails.accountNumber}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                bankDetails: { ...prev.bankDetails, accountNumber: text }
              }))}
              keyboardType="numeric"
            />
            <CustomTextInput
              placeholder="IFSC Code"
              value={formData.bankDetails.ifscCode}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                bankDetails: { ...prev.bankDetails, ifscCode: text }
              }))}
              autoCapitalize="characters"
            />
            <CustomTextInput
              placeholder="Account Holder Name"
              value={formData.bankDetails.accountHolderName}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                bankDetails: { ...prev.bankDetails, accountHolderName: text }
              }))}
            />
          </View>
        );
  
      case 4:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>ID Verification</Text>
            
            <CustomTextInput
              placeholder="PAN Card Number"
              value={formData.panNumber}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                panNumber: text
              }))}
              autoCapitalize="characters"
            />
            
            <View style={styles.documentUpload}>
              <Text style={styles.documentLabel}>PAN Card Upload</Text>
              <TouchableOpacity 
                style={[styles.uploadButton, documents.panCard && styles.uploadComplete]} 
                onPress={() => pickDocument('panCard')}
              >
                <Text style={styles.uploadButtonText}>
                  {documents.panCard ? 'Document Uploaded' : 'Select File'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <CustomTextInput
              placeholder="Aadhaar Number"
              value={formData.aadhaarNumber}
              onChangeText={(text) => setFormData(prev => ({
                ...prev,
                aadhaarNumber: text
              }))}
              keyboardType="numeric"
            />
            
            <View style={styles.documentUpload}>
              <Text style={styles.documentLabel}>Aadhaar Front</Text>
              <TouchableOpacity 
                style={[styles.uploadButton, documents.aadhaarFront && styles.uploadComplete]} 
                onPress={() => pickDocument('aadhaarFront')}
              >
                <Text style={styles.uploadButtonText}>
                  {documents.aadhaarFront ? 'Document Uploaded' : 'Select File'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.documentUpload}>
              <Text style={styles.documentLabel}>Aadhaar Back</Text>
              <TouchableOpacity 
                style={[styles.uploadButton, documents.aadhaarBack && styles.uploadComplete]} 
                onPress={() => pickDocument('aadhaarBack')}
              >
                <Text style={styles.uploadButtonText}>
                  {documents.aadhaarBack ? 'Document Uploaded' : 'Select File'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        );
  
      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>KYC Verification</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((item) => (
              <View 
                key={item} 
                style={[
                  styles.progressDot,
                  step >= item && styles.progressDotActive
                ]} 
              />
            ))}
          </View>

          <ScrollView style={styles.scrollView}>
            {renderStep()}
          </ScrollView>

          <View style={styles.buttonContainer}>
            {step > 1 && (
              <TouchableOpacity
                style={styles.button}
                onPress={() => setStep(prev => prev - 1)}>
                <Text style={styles.buttonText}>Previous</Text>
              </TouchableOpacity>
            )}

            {step < 4 ? (
              <TouchableOpacity
                style={[styles.button, !validateStep() && styles.buttonDisabled]}
                disabled={!validateStep()}
                onPress={() => setStep(prev => prev + 1)}>
                <Text style={styles.buttonText}>Next</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, !validateStep() && styles.buttonDisabled]}
                disabled={!validateStep() || loading}
                onPress={handleSubmit}>
                {loading ? (
                  <ActivityIndicator color={COLORS.whiteFFFFFF} />
                ) : (
                  <Text style={styles.buttonText}>Submit</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.whiteFFFFFF,
    width: DEVICE_WIDTH - 32,
    maxHeight: '80%',
    borderRadius: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.blue043142,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.grey999999,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.greyD3D3D3,
    marginHorizontal: 5,
  },
  progressDotActive: {
    backgroundColor: COLORS.yellowF5BE00,
  },
  scrollView: {
    maxHeight: '60%',
  },
  stepContainer: {
    padding: 16,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.blue043142,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    backgroundColor: COLORS.yellowF5BE00,
    padding: 12,
    borderRadius: 8,
    flex: 0.48,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.greyD3D3D3,
  },
  buttonText: {
    color: COLORS.whiteFFFFFF,
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Add these to your existing styles StyleSheet
documentUpload: {
    marginVertical: 10,
  },
  documentLabel: {
    fontSize: 14,
    marginBottom: 6,
    color: COLORS.blue043142,
  },
  uploadButton: {
    backgroundColor: COLORS.greyD3D3D3,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4,
  },
  uploadComplete: {
    backgroundColor: COLORS.green00AA00,
  },
  uploadButtonText: {
    color: COLORS.whiteFFFFFF,
    fontWeight: '500',
  },
});

export default KYCModal;