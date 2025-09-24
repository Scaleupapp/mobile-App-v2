import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Modal,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {isAndroid, nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import CustomTextInput from '../../components/TextInput';
import {icons} from '../../assets/icons';
import Button from '../../components/Button';
import SocialLogin from '../../components/socialauth';
import {APP_FONTS} from '../../assets/fonts';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';
import {
  registerApi, 
  applyReferralCodeApi,
  checkDomainTypeApi,
  sendDomainVerificationApi,
  verifyDomainApi
} from '../../services/apiService';
import {isValidEmail, isvalidPassword} from '../../helper/commonFunctions';
import mixpanel from '../../helper/mixpanelClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BasicDetails = ({navigation, route}) => {
  const {showToast} = useToast();
  
  useEffect(() => {
    mixpanel.track('Landed_BasicDetails');
  }, []);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [secureText, setSecureText] = useState(true);
  const [secureText1, setSecureText1] = useState(true);

  // Referral popup state
  // const [showReferralModal, setShowReferralModal] = useState(false);
  // const [referralCode, setReferralCode] = useState('');

  // Domain verification state
  const [showDomainVerificationModal, setShowDomainVerificationModal] = useState(false);
  const [domainInfo, setDomainInfo] = useState({
    email: '',
    domainType: '',
    institutionName: '',
    requiresVerification: false
  });
  const [domainOtp, setDomainOtp] = useState('');
  const [isDomainVerified, setIsDomainVerified] = useState(false);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [resendDomainTimer, setResendDomainTimer] = useState(0);
  const [isResendDomainDisabled, setIsResendDomainDisabled] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false); // [NEW]

  // Timer for domain OTP resend
  useEffect(() => {
    let timer;
    if (resendDomainTimer > 0 && isResendDomainDisabled) {
      timer = setInterval(() => {
        setResendDomainTimer(prev => prev - 1);
      }, 1000);
    } else if (resendDomainTimer === 0) {
      setIsResendDomainDisabled(false);
    }

    return () => clearInterval(timer);
  }, [resendDomainTimer, isResendDomainDisabled]);

  const handleInputChange = (field, value) => {
    setForm({...form, [field]: value});

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }

    // Check domain type when email is complete
    if (field === 'email' && isValidEmail(value)) {
      checkEmailDomain(value);
    }
    
    // Reset verification if email changes
    if (field === 'email' && isDomainVerified) {
      setIsDomainVerified(false);
      setShowOtpInput(false);
      setDomainOtp('');
    }
  };

  // Check if email domain needs verification
  const checkEmailDomain = async (email) => {
    try {
      const {data} = await checkDomainTypeApi({email});
      
      if (data?.data?.requiresVerification) {
        setDomainInfo({
          email: email,
          domainType: data.data.domainType,
          institutionName: data.data.institutionName,
          requiresVerification: true
        });
      } else {
        setDomainInfo({
          email: email,
          domainType: 'public',
          institutionName: null,
          requiresVerification: false
        });
        setIsDomainVerified(false);
      }
    } catch (error) {
      console.log('Domain check error:', error);
    }
  };

  const validateFields = () => {
    let isValid = true;
    const newErrors = {};

    if (!form.firstName) {
      newErrors.firstName = 'First name is required';
      isValid = false;
    }

    if (!form.lastName) {
      newErrors.lastName = 'Last name is required';
      isValid = false;
    }

    if (!form.userName) {
      newErrors.userName = 'Username is required';
      isValid = false;
    }

    if (!form.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'Please Enter valid email address';
      isValid = false;
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (form.password?.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
      isValid = false;
    }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Password does not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

// Updated sendDomainOTP function in BasicDetails.js
const sendDomainOTP = async () => {
  try {
    setIsVerifyingDomain(true);
    
    // Get userId from AsyncStorage - it's stored after phone verification
    const userData = await AsyncStorage.getItem('userData');
    console.log('userData from storage:', userData); // Debug log
    
    if (!userData) {
      showToast({type: 'error', title: 'Session expired. Please restart registration.'});
      setIsVerifyingDomain(false);
      return;
    }
    
    const parsedData = JSON.parse(userData);
    console.log('parsedData:', parsedData); // Debug log
    
    // The userId might be under different keys depending on your backend response
    const userId = parsedData?.user?.id || 
                   parsedData?.user?._id || 
                   parsedData?.id || 
                   parsedData?._id ||
                   parsedData?.userId;
    
    console.log('Extracted userId:', userId); // Debug log
    console.log('Email being sent:', form.email); // Debug log
    
    if (!userId) {
      showToast({type: 'error', title: 'User session not found. Please restart registration.'});
      setIsVerifyingDomain(false);
      return;
    }

    const payload = {
      email: form.email,
      userId: userId
    };
    
    console.log('Sending payload:', payload); // Debug log

    const {data} = await sendDomainVerificationApi(payload);

    showToast({type: 'success', title: 'OTP sent to your email'});
    setIsResendDomainDisabled(true);
    setResendDomainTimer(300); // 5 minutes
    setShowOtpInput(true);
    setIsVerifyingDomain(false);
  } catch (error) {
    console.log('Send domain OTP error:', error);
    console.log('Error response:', error?.response?.data); // Debug log
    showToast({type: 'error', title: error?.response?.data?.message || 'Failed to send OTP'});
    setIsVerifyingDomain(false);
  }
};

// Also update the verifyDomainOTP function similarly
const verifyDomainOTP = async () => {
  if (!domainOtp || domainOtp.length !== 6) {
    showToast({type: 'error', title: 'Please enter 6-digit OTP'});
    return;
  }

  try {
    setIsVerifyingDomain(true);
    
    const userData = await AsyncStorage.getItem('userData');
    
    if (!userData) {
      showToast({type: 'error', title: 'Session expired. Please restart registration.'});
      setIsVerifyingDomain(false);
      return;
    }
    
    const parsedData = JSON.parse(userData);
    const userId = parsedData?.user?.id || 
                   parsedData?.user?._id || 
                   parsedData?.id || 
                   parsedData?._id ||
                   parsedData?.userId;
    
    if (!userId) {
      showToast({type: 'error', title: 'User session not found. Please restart registration.'});
      setIsVerifyingDomain(false);
      return;
    }

    const payload = {
      email: form.email,
      otp: domainOtp,
      userId: userId
    };
    
    console.log('Verifying with payload:', payload); // Debug log

    const {data} = await verifyDomainApi(payload);

    if (data?.success) {
      showToast({type: 'success', title: 'Email verified successfully!'});
      setIsDomainVerified(true);
      setShowOtpInput(false);
      setDomainOtp('');
    }
  } catch (error) {
    console.log('Verify domain OTP error:', error);
    showToast({type: 'error', title: error?.response?.data?.message || 'Invalid OTP'});
  } finally {
    setIsVerifyingDomain(false);
  }
};

  // Main registration function
  const registerUser = async () => {
    if (validateFields()) {
      // Check if domain needs verification and not yet verified
      if (domainInfo.requiresVerification && !isDomainVerified) {
        showToast({type: 'error', title: 'Please verify your institutional email first'});
        return;
      }
      proceedWithRegistration();
    }
  };

  // Proceed with actual registration
  const proceedWithRegistration = async () => {
    mixpanel.track('Clicked_Submit_BasicDetails', {email: form.email});
    try {
      const params = {
        firstname: form.firstName,
        lastname: form.lastName,
        username: form.userName,
        email: form.email,
        password: form.password,
      };
      
      const {data} = await registerApi(params);
      
      showToast({type: 'success', title: data?.message || 'Registration successful'});

      // Set user profile properties using track events
      mixpanel.track('User Registration Completed', {
        first_name: params.firstname,
        last_name: params.lastname,
        email: params.email,
        username: params.username,
        signup_date: new Date().toISOString(),
        isInstitutionalUser: data?.userInfo?.isInstitutionalUser || false,
        institutionName: data?.userInfo?.institutionName || null
      });

      // Show referral popup
      // setShowReferralModal(true);
      navigation.navigate(Routes.Preferences);

      // Clear the form
      setForm({
        firstName: '',
        lastName: '',
        userName: '',
        email: '',
        password: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.log('Registration Error:', error);
      showToast({type: 'error', title: error?.response?.data?.message || 'Registration failed'});
    }
  };

  // Referral code functions
  // const handleApplyReferralCode = async () => {
  //   if (!referralCode.trim()) {
  //     showToast({type: 'error', title: 'Referral code cannot be empty'});
  //     return;
  //   }
  //   try {
  //     mixpanel.track('Attempted_Referral_Submit', {referralCode});

  //     const {data} = await applyReferralCodeApi({referralCode});
  //     showToast({type: 'success', title: data?.message});
  //     setShowReferralModal(false);
  //     navigation.navigate(Routes.Preferences);
  //   } catch (err) {
  //     console.log('applyReferralCode error:', err);
  //     if (err?.response?.data?.message) {
  //       showToast({type: 'error', title: err.response.data.message});
  //     } else {
  //       showToast({type: 'error', title: 'Something went wrong'});
  //     }
  //   }
  // };

  // const handleSkipReferral = () => {
  //   mixpanel.track('Skipped_Referral');
  //   setShowReferralModal(false);
  //   navigation.navigate(Routes.Preferences);
  // };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <Text
            variant="semibold18"
            color={COLORS.blue043142}
            style={{marginBottom: 20}}>
            Basic Details
          </Text>

          <ScrollView
            style={{marginBottom: 20}}
            showsVerticalScrollIndicator={false}>
            <CustomTextInput
              placeholder="First Name"
              value={form.firstName}
              onChangeText={value => handleInputChange('firstName', value)}
              errorMessage={errors.firstName}
            />
            <CustomTextInput
              placeholder="Last Name"
              value={form.lastName}
              onChangeText={value => handleInputChange('lastName', value)}
              errorMessage={errors.lastName}
            />
            <CustomTextInput
              placeholder="Username"
              value={form.userName}
              onChangeText={value => handleInputChange('userName', value)}
              errorMessage={errors.userName}
            />
            <CustomTextInput
              placeholder="Email"
              value={form.email}
              onChangeText={value => handleInputChange('email', value)}
              errorMessage={errors.email}
              rightIcon={isDomainVerified ? icons.verified : null}
            />
            
            {/* [NEW] Domain verification section - appears inline */}
            {domainInfo.requiresVerification && !isDomainVerified && form.email && (
              <View style={styles.domainVerificationSection}>
                <View style={styles.domainInfoBox}>
                  <Text variant="medium12" color={COLORS.blue043142}>
                    🎓 {domainInfo.institutionName} email detected
                  </Text>
                  <Text variant="regular11" color={COLORS.grey999999}>
                    Verification required for institutional benefits
                  </Text>
                </View>
                
                {!showOtpInput ? (
                  <TouchableOpacity 
                    style={styles.verifyButton} 
                    onPress={sendDomainOTP}
                    disabled={isVerifyingDomain}>
                    <Text variant="semibold14" color={COLORS.whiteFFFFFF}>
                      {isVerifyingDomain ? 'Sending OTP...' : 'Send OTP'}
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.otpSection}>
                    <View style={styles.otpInputContainer}>
                      <TextInput
                        placeholder="Enter 6-digit OTP"
                        value={domainOtp}
                        onChangeText={setDomainOtp}
                        style={styles.otpInput}
                        keyboardType="number-pad"
                        maxLength={6}
                      />
                      <TouchableOpacity 
                        style={styles.verifyOtpButton}
                        onPress={verifyDomainOTP}
                        disabled={isVerifyingDomain || !domainOtp}>
                        <Text variant="semibold12" color={COLORS.whiteFFFFFF}>
                          Verify
                        </Text>
                      </TouchableOpacity>
                    </View>
                    
                    <View style={styles.resendContainer}>
                      <Text style={styles.resendText}>Didn't receive OTP? </Text>
                      {isResendDomainDisabled ? (
                        <Text style={styles.timerText}>
                          Resend in {Math.floor(resendDomainTimer / 60)}:{(resendDomainTimer % 60).toString().padStart(2, '0')}
                        </Text>
                      ) : (
                        <TouchableOpacity onPress={sendDomainOTP}>
                          <Text style={styles.resendLink}>Click to resend</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* [NEW] Verified badge */}
            {isDomainVerified && (
              <View style={styles.verifiedBadge}>
                <Text variant="semibold12" color={COLORS.green}>
                  ✅ {domainInfo.institutionName} email verified
                </Text>
              </View>
            )}

            <CustomTextInput
              placeholder="Password"
              value={form.password}
              onChangeText={value => handleInputChange('password', value)}
              onRightIconPress={() => setSecureText(!secureText)}
              rightIcon={secureText ? icons.hide : icons.unhide}
              secureTextEntry={secureText}
              errorMessage={errors.password}
            />
            <CustomTextInput
              placeholder="Confirm Password"
              value={form.confirmPassword}
              onChangeText={value =>
                handleInputChange('confirmPassword', value)
              }
              onRightIconPress={() => setSecureText1(!secureText1)}
              rightIcon={secureText1 ? icons.hide : icons.unhide}
              secureTextEntry={secureText1}
              errorMessage={errors.confirmPassword}
            />

            <Button text="Submit" onPress={registerUser} />

            {isAndroid ? <SocialLogin signup={true} /> : null}

            <View style={{height: nh(50)}} />
          </ScrollView>
        </View>
      </View>

      {/* Referral Modal
      <Modal
        transparent
        animationType="slide"
        visible={showReferralModal}
        onRequestClose={() => setShowReferralModal(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text variant="semibold16" style={{marginBottom: 10}}>
              Do you have a referral code?
            </Text>
            <TextInput
              placeholder="Enter referral code"
              value={referralCode}
              onChangeText={setReferralCode}
              style={styles.referralInput}
            />

            <View style={styles.buttonRow}>
              <Button
                text="Submit"
                onPress={handleApplyReferralCode}
                buttonStyle={styles.modalButton}
              />
              <Button
                text="Skip"
                onPress={handleSkipReferral}
                buttonStyle={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal> */}
    </SafeAreaView>
  );
};

export default BasicDetails;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(30),
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
    paddingHorizontal: nw(16),
    paddingTop: nh(30),
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: COLORS.whiteFFFFFF,
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  referralInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    width: '100%',
    padding: 10,
    borderRadius: 5,
    marginVertical: 10,
  },
  buttonRow: {
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    gap: 15,
  },
  modalButton: {
    width: '50%',
    paddingVertical: nh(10),
    borderRadius: 8,
    alignSelf: 'center',
    marginVertical: 5,
  },
  // [NEW] Domain verification styles
  domainVerificationSection: {
    marginBottom: 15,
  },
  domainInfoBox: {
    backgroundColor: '#f0f8ff',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.yellowF5BE00,
  },
  verifyButton: {
    backgroundColor: COLORS.yellowF5BE00,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  otpSection: {
    marginTop: 10,
  },
  otpInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  otpInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.blue043142,
    padding: 10,
    borderRadius: 5,
    fontSize: 16,
    letterSpacing: 5,
    textAlign: 'center',
    fontFamily: APP_FONTS.PoppinsSemiBold,
  },
  verifyOtpButton: {
    backgroundColor: COLORS.blue043142,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  resendText: {
    color: COLORS.grey999999,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
  },
  timerText: {
    color: COLORS.redFF0000,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
  },
  resendLink: {
    color: COLORS.yellowF5BE00,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
    textDecorationLine: 'underline',
  },
  verifiedBadge: {
    backgroundColor: '#e8f5e9',
    padding: 8,
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4caf50',
  },
});