import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Modal,
  TextInput,
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
import {registerApi, applyReferralCodeApi} from '../../services/apiService';
import {isValidEmail, isvalidPassword} from '../../helper/commonFunctions';
import mixpanel from '../../helper/mixpanelClient';

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

  // [NEW] State for referral popup
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [referralCode, setReferralCode] = useState('');

  const handleInputChange = (field, value) => {
    setForm({...form, [field]: value});

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
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

  const registerUser = async () => {
    if (validateFields()) {
      mixpanel.track('Clicked_Submit_BasicDetails', {email: form.email});
      try {
        const params = {
          firstname: form.firstName,
          lastname: form.lastName,
          username: form.userName,
          email: form.email,
          password: form.password,
        };
        console.log({params});
        const {data} = await registerApi(params);
        showToast({type: 'success', title: data?.message});

        // Set user profile properties
        mixpanel.people.set({
          $first_name: params.firstname,
          $last_name: params.lastname,
          $email: params.email,
          username: params.username,
          signup_date: new Date().toISOString(),
        });
        // [NEW] Once registration succeeds, show the referral popup
        setShowReferralModal(true);

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
        // Optionally show toast or handle error messages
      }
    }
  };

  // [NEW] Function to call applyReferralCodeApi
  const handleApplyReferralCode = async () => {
    if (!referralCode.trim()) {
      showToast({type: 'error', title: 'Referral code cannot be empty'});
      return;
    }
    try {
      mixpanel.track('Attempted_Referral_Submit', {referralCode});

      const {data} = await applyReferralCodeApi({referralCode});
      // e.g. data.message => "Now following user X"
      showToast({type: 'success', title: data?.message});
      setShowReferralModal(false);
      // Move on to the next page after successful code application
      navigation.navigate(Routes.Preferences);
    } catch (err) {
      console.log('applyReferralCode error:', err);
      if (err?.response?.data?.message) {
        showToast({type: 'error', title: err.response.data.message});
      } else {
        showToast({type: 'error', title: 'Something went wrong'});
      }
    }
  };

  // [NEW] If user wants to skip/cancel referral code
  const handleSkipReferral = () => {
    mixpanel.track('Skipped_Referral');

    setShowReferralModal(false);
    // Move on to next page
    navigation.navigate(Routes.Preferences);
  };

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
            />
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

      {/* [NEW] Modal for referral code */}
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

            {/* Button Row */}
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
      </Modal>
      {/* [END NEW MODAL] */}
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
  container1: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: -10,
    marginBottom: nh(40),
  },
  checkboxContainer: {
    padding: 0,
    margin: 0,
    marginRight: nw(5),
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.whiteFFFFFF,
  },
  footerText: {
    color: COLORS.grey999999,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
  },
  footerLink: {
    color: COLORS.yellowF5BE00,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
  },
  // [NEW] Styles for referral modal
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
    flexDirection: 'column', // Arrange buttons vertically
    alignItems: 'center', // Center the buttons horizontally
    width: '100%', // Ensure full width for layout control
    marginTop: 20,
    gap: 15, // Increased top spacing
  },

  modalButton: {
    width: '50%', // Reduce button width to half the modal
    paddingVertical: nh(10), // Adjust padding for touch area
    borderRadius: 8, // Rounded edges for aesthetics
    alignSelf: 'center', // Ensure button stays centered
    marginVertical: 5, // Add spacing between buttons
  },
});
