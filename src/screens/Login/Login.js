import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  TouchableOpacity,
  Text as RNText,
  Alert,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import CustomTextInput from '../../components/TextInput';
import {icons} from '../../assets/icons';
import {CheckBox} from 'react-native-elements';
import Button from '../../components/Button';
import SocialLogin from '../../components/socialauth';
import {APP_FONTS} from '../../assets/fonts';
import {images} from '../../assets/images';
import SquareToggle from '../../components/ToggleButton';
import {useToast} from '../../components/CustomToast';
import {getOtp, loginApi, verifyOtp} from '../../services/apiService';
import Routes from '../../helper/routes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useDispatch} from 'react-redux';
import {actions} from '../../redux/reducers';
import {isvalidMobileNumber} from '../../helper/commonFunctions';

const Login = ({navigation}) => {
  const {showToast} = useToast();
  const dispatch = useDispatch();

  const [state, setState] = useState({
    selected: 0,
    username: '',
    password: '',
    mobileNumber: '',
    otp: '',
    isChecked: false,
    requestedOtp: false,
    secureTextEntry: true,
  });

  const [errors, setErrors] = useState({
    username: '',
    password: '',
    mobileNumber: '',
    otp: '',
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

  const handleInputChange = (field, value) => {
    setState(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: ''}));
    }
  };

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
  };

  const toggleSecureEntry = () => {
    setState(prev => ({...prev, secureTextEntry: !prev.secureTextEntry}));
  };

  const onSelect = number => {
    setState({
      ...state,
      selected: number,
      requestedOtp: false,
      username: '',
      password: '',
      mobileNumber: '',
      otp: '',
    });
    setErrors({
      username: '',
      password: '',
      mobileNumber: '',
      otp: '',
    });
  };

  const validateFields = () => {
    const newErrors = {};
    let isValid = true;

    if (state.selected === 0) {
      if (!state.username) {
        newErrors.username = 'Username/Email is required';
        isValid = false;
      }
      if (!state.password) {
        newErrors.password = 'Password is required';
        isValid = false;
      }
    } else {
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
    }

    setErrors(newErrors);
    return isValid;
  };

  const loginUser = async () => {
    if (!validateFields()) return;

    if (state.selected === 0) {
      // Login with Username/Password
      try {
        const {data} = await loginApi({
          loginIdentifier: state.username,
          password: state.password,
        });
        showToast({type: 'success', title: data?.message});
        const stringifiedUserData = JSON.stringify(data);
        await AsyncStorage.setItem('userData', stringifiedUserData);
        dispatch(actions.setUserData(stringifiedUserData));
        navigation.reset({
          index: 0,
          routes: [{name: Routes.Home}],
        });
      } catch (error) {
        console.log('Login Error:', error);
      }
    } else {
      // Login with Mobile Number and OTP
      if (state.requestedOtp) {
        try {
          const {data} = await verifyOtp({
            phoneNumber: state.mobileNumber,
            userOTP: state.otp,
          });
          showToast({type: 'success', title: data?.message});
          const stringifiedUserData = JSON.stringify(data);
          await AsyncStorage.setItem('userData', stringifiedUserData);
          dispatch(actions.setUserData(stringifiedUserData));
          if (phoneNumberData?.isPhoneNumberVerified) {
            navigation.reset({
              index: 0,
              routes: [{name: Routes.Home}],
            });
          } else {
            navigation.navigate(Routes.BasicDetails);
          }
        } catch (error) {
          console.log('Verify OTP Error:', error);
        }
      } else {
        try {
          const {data} = await getOtp({phoneNumber: state.mobileNumber});
          setphoneNumberData(data);
          showToast({type: 'success', title: data?.message});
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
            Welcome Back..!
          </Text>
          <Text variant="medium14" color={COLORS.grey999999}>
            Unlock Focused, Distraction-free Learning
          </Text>
          <Text
            variant="semibold14"
            color={COLORS.grey999999}
            style={{marginBottom: nh(30)}}>
            Login now
          </Text>

          <SquareToggle
            options={['Username', 'Mobile No']}
            selected={state.selected}
            onToggle={onSelect}
          />

          {state.selected === 0 && (
            <>
              <CustomTextInput
                placeholder="Username/Email"
                value={state.username}
                onChangeText={value => handleInputChange('username', value)}
                errorMessage={errors.username}
              />
              <CustomTextInput
                placeholder="Password"
                value={state.password}
                onChangeText={value => handleInputChange('password', value)}
                secureTextEntry={state.secureTextEntry}
                rightIcon={state.secureTextEntry ? icons.hide : icons.unhide}
                onRightIconPress={toggleSecureEntry}
                errorMessage={errors.password}
              />
              <View style={styles.rememberContainer}>
                <View style={styles.checkboxContainer}>
                  {/* <CheckBox
                    checkedIcon="check-box"
                    uncheckedIcon="check-box-outline-blank"
                    iconType="material"
                    checked={state.isChecked}
                    onPress={() =>
                      setState(prev => ({...prev, isChecked: !prev.isChecked}))
                    }
                    containerStyle={styles.checkboxStyle}
                    checkedColor={COLORS.grey999999}
                    uncheckedColor={COLORS.grey999999}
                  />
                  <Text variant="medium12" color={COLORS.grey999999}>
                    Remember me
                  </Text> */}
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate(Routes.ForgotPassword)}>
                  <Text
                    variant="medium12"
                    color={COLORS.grey999999}
                    style={{textDecorationLine: 'underline'}}>
                    Forgot Password?
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {state.selected === 1 && (
            <>
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
                  <View style={styles.resendContainer}>
                    <Text style={styles.resendText}>Didn’t receive OTP? </Text>
                    {isResendDisabled ? (
                      <Text style={styles.timerText}>
                        Resend in {resendTimer}s
                      </Text>
                    ) : (
                      <RNText
                        onPress={handleResendClick}
                        style={styles.resendLink}>
                        Click to resend
                      </RNText>
                    )}
                  </View>
                </>
              )}
            </>
          )}

          <Button
            text={
              state.selected === 0 || state.requestedOtp
                ? 'Login'
                : 'Request OTP'
            }
            onPress={loginUser}
          />
          <SocialLogin navigation={navigation} />
          {phoneNumberData?.loginOtp ? (
            <View
              style={{position: 'absolute', bottom: 40, alignSelf: 'center'}}>
              <Text style={{color: 'red', fontSize: 20}}>
                test otp: {phoneNumberData?.loginOtp}
              </Text>
            </View>
          ) : null}
          <View style={styles.signupContainer}>
            <Text style={styles.signupText}>Don’t have an account! </Text>
            <RNText
              onPress={() => navigation.navigate('SignUp')}
              style={styles.signupLink}>
              Sign up
            </RNText>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Login;

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
  logo: {
    height: nh(75),
    width: nh(75),
    alignSelf: 'center',
    marginBottom: nh(30),
  },
  rememberContainer: {
    marginBottom: nh(50),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxStyle: {
    padding: 0,
    margin: 0,
    marginRight: nw(5),
  },
  signupContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    color: COLORS.grey999999,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
  },
  signupLink: {
    color: COLORS.yellowF5BE00,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
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
