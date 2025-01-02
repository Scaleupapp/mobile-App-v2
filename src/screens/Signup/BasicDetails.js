import React, {useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import Text from '../../components/Text';
import CustomTextInput from '../../components/TextInput';
import {icons} from '../../assets/icons';
import Button from '../../components/Button';
import SocialLogin from '../../components/socialauth';
import {APP_FONTS} from '../../assets/fonts';
import Routes from '../../helper/routes';
import {useToast} from '../../components/CustomToast';
import {registerApi} from '../../services/apiService';
import {isValidEmail, isvalidPassword} from '../../helper/commonFunctions';

const BasicDetails = ({navigation, route}) => {
  const {showToast} = useToast();
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
    // else if (!isvalidPassword(form.password)) {
    //   newErrors.password =
    //     'Password must be at least 8 characters, include one letter, one number, and one special character';
    //   isValid = false;
    // }

    if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = 'Password does not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const registerUser = async () => {
    if (validateFields()) {
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
        navigation.navigate(Routes.Preferences);
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
          <Text
            variant="semibold18"
            color={COLORS.blue043142}
            style={{marginBottom: 20}}>
            Basic Details
            {/* Create Account */}
          </Text>
          {/* <Text variant="medium14" color={COLORS.grey999999}>
            Take a step towards focused learning..
          </Text>
          <Text
            variant="semibold14"
            color={COLORS.grey999999}
            style={{marginBottom: nh(30)}}>
            Sign-up now
          </Text> */}
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
            {Platform.OS === 'android' ? <SocialLogin signup={true} /> : null}
            <View style={{height: nh(50)}} />
          </ScrollView>
        </View>
      </View>
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
});
