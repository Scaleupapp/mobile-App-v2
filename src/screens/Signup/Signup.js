import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Text as RNText,
  Image,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import CustomTextInput from '../../components/TextInput';
import {CheckBox} from 'react-native-elements';
import Button from '../../components/Button';
import {APP_FONTS} from '../../assets/fonts';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';
import {getOtp, verifyOtp} from '../../services/apiService';
import {isvalidMobileNumber} from '../../helper/commonFunctions';
import {images} from '../../assets/images';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {actions} from '../../redux/reducers';
import {useDispatch} from 'react-redux';

const SignUp = ({navigation, route}) => {
  const {showToast} = useToast();
  const dispatch = useDispatch();
  const [state, setState] = useState({
    mobileNumber: '',
    otp: '',
    isChecked: false,
    requestedOtp: false,
  });

  const [errors, setErrors] = useState({
    mobileNumber: '',
    otp: '',
    isChecked: '',
  });

  const [resendTimer, setResendTimer] = useState(60);
  const [isResendDisabled, setIsResendDisabled] = useState(false);
  const [phoneNumberData, setphoneNumberData] = useState(false);

  useEffect(() => {
    let timer;
    if (resendTimer > 0 && isResendDisabled) {
      timer = setInterval(() => {
        setResendTimer(prev => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setIsResendDisabled(false);
      setResendTimer(59); // Reset timer
    }

    return () => clearInterval(timer);
  }, [resendTimer, isResendDisabled]);

  const handleResendClick = async () => {
    const newErrors = {};
    if (!state.mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required';
      setErrors(newErrors);
    } else if (state.mobileNumber.length !== 10) {
      newErrors.mobileNumber = 'Mobile number must be 10 digits';
      setErrors(newErrors);
    } else if (!isvalidMobileNumber(state.mobileNumber)) {
      newErrors.mobileNumber = 'Enter valid Mobile number';
      setErrors(newErrors);
    } else {
      try {
        const {data} = await getOtp({phoneNumber: state.mobileNumber});
        showToast({type: 'success', title: data?.message});
        setphoneNumberData(data);
        setIsResendDisabled(true);
        setResendTimer(59);
      } catch (error) {
        console.log('Get OTP Error:', error);
      }
    }
    console.log('Resend email logic triggered');
    // Add resend email API call logic here
  };

  const handleInputChange = (field, value) => {
    setState({...state, [field]: value});

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  const validateFields = () => {
    let isValid = true;
    const newErrors = {};

    if (!state.mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required';
      isValid = false;
    } else if (state.mobileNumber.length !== 10) {
      newErrors.mobileNumber = 'Mobile number must be 10 digits';
      isValid = false;
    } else if (!isvalidMobileNumber(state.mobileNumber)) {
      newErrors.mobileNumber = 'Enter valid Mobile number';
      isValid = false;
    }

    if (state.requestedOtp && !state.otp) {
      newErrors.otp = 'OTP is required';
      isValid = false;
    }

    if (state.requestedOtp && !state.isChecked) {
      showToast({title: 'Please agree to the terms'});
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const registerUser = async () => {
    if (validateFields()) {
      if (state.requestedOtp) {
        try {
          const {data} = await verifyOtp({
            phoneNumber: state.mobileNumber,
            userOTP: state.otp,
          });
          showToast({type: 'success', title: data?.message});
          const stringifiedUserData = JSON.stringify(data);
          AsyncStorage.setItem('userData', stringifiedUserData);
          dispatch(actions.setUserData(stringifiedUserData));
          if (phoneNumberData?.isPhoneNumberVerified) {
            navigation.navigate(Routes.Home);
          } else {
            navigation.navigate(Routes.BasicDetails);
          }
        } catch (error) {
          console.log('Verify OTP Error:', error);
        }
      } else {
        try {
          const {data} = await getOtp({phoneNumber: state.mobileNumber});
          showToast({type: 'success', title: data?.message});
          setphoneNumberData(data);
          setIsResendDisabled(true);
          setResendTimer(59);
          setState(prev => ({...prev, requestedOtp: true}));
        } catch (error) {
          console.log('Get OTP Error:', error);
        }
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <Image source={images.ciclelogo} style={styles.logo} />
          <Text variant="semibold18" color={COLORS.blue043142}>
            Create Account
          </Text>
          <Text variant="medium14" color={COLORS.grey999999}>
            Take a step towards focused learning..
          </Text>
          <Text
            variant="semibold14"
            color={COLORS.grey999999}
            style={{marginBottom: nh(30)}}>
            Sign-up now
          </Text>
          <CustomTextInput
            placeholder="Mobile No"
            value={state.mobileNumber}
            onChangeText={value => handleInputChange('mobileNumber', value)}
            keyboardType="number-pad"
            errorMessage={errors.mobileNumber}
            maxLength={10}
          />
          {state.requestedOtp && (
            <>
              <CustomTextInput
                placeholder="OTP"
                value={state.otp}
                onChangeText={value => handleInputChange('otp', value)}
                errorMessage={errors.otp}
                maxLength={6}
              />
              {/* <View style={styles.otpResendContainer}>
                <Text style={styles.otpText}>Didn’t receive OTP? </Text>
                <Text style={styles.resendText}>Resend Code</Text>
              </View> */}
              <View style={styles.resendContainer}>
                <Text style={styles.resendText}>Didn’t receive OTP? </Text>
                {isResendDisabled ? (
                  <Text style={styles.timerText}>Resend in {resendTimer}s</Text>
                ) : (
                  <RNText onPress={handleResendClick} style={styles.resendLink}>
                    Click to resend
                  </RNText>
                )}
              </View>
              <View style={styles.container1}>
                <CheckBox
                  checkedIcon="check-box"
                  uncheckedIcon="check-box-outline-blank"
                  iconType="material"
                  checked={state.isChecked}
                  onPress={() =>
                    setState(prev => ({...prev, isChecked: !prev.isChecked}))
                  }
                  containerStyle={styles.checkboxContainer}
                  checkedColor={COLORS.blue043142}
                  uncheckedColor={COLORS.blue043142}
                />
                <Text variant="medium12" color={COLORS.blue043142}>
                  I agree to{' '}
                </Text>
                <Text variant="bold12" color={COLORS.yellowF5BE00}>
                  Terms of Service{' '}
                </Text>
                <Text variant="medium12" color={COLORS.blue043142}>
                  and{' '}
                </Text>
                <Text variant="bold12" color={COLORS.yellowF5BE00}>
                  Privacy Policy
                </Text>
              </View>
            </>
          )}

          <Button
            text={state.requestedOtp ? 'Login' : 'Request OTP'}
            onPress={registerUser}
          />
          {phoneNumberData?.loginOtp ? (
            <View
              style={{position: 'absolute', bottom: 40, alignSelf: 'center'}}>
              <Text style={{color: 'red', fontSize: 20}}>
                test otp: {phoneNumberData?.loginOtp}
              </Text>
            </View>
          ) : null}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account! </Text>
            <RNText
              onPress={() => navigation.navigate(Routes.Login)}
              style={styles.footerLink}>
              Login
            </RNText>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default SignUp;

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
    marginBottom: nh(50),
  },
  checkboxContainer: {
    padding: 0,
    margin: 0,
    marginRight: nw(5),
  },
  footer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
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
  logo: {
    height: nh(75),
    width: nh(75),
    alignSelf: 'center',
    marginBottom: nh(30),
  },
  otpResendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: nh(20),
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: nh(10),
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
});
