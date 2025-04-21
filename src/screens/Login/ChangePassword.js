import React, {useState} from 'react';
import {StyleSheet, SafeAreaView, StatusBar, View, Image} from 'react-native';
import {COLORS} from '../../helper/colors';
import {nh, nw} from '../../helper/scales';
import CustomTextInput from '../../components/TextInput';
import Button from '../../components/Button';
import {APP_FONTS} from '../../assets/fonts';
import {images} from '../../assets/images';
import {icons} from '../../assets/icons';
import {changePassword} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';
import Header from '../../components/Header';

const ChangePassword = ({navigation}) => {
  const {showToast} = useToast();
  const [form, setForm] = useState({
    oldPassword: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({
    oldPassword: '',
    password: '',
    confirmPassword: '',
  });

  const [secureTextEntry, setsecureTextEntry] = useState(true);
  const [secureTextEntry1, setsecureTextEntry1] = useState(true);
  const [secureTextEntry2, setsecureTextEntry2] = useState(true);

  const handleInputChange = (field, value) => {
    setForm({...form, [field]: value});

    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  const validateFields = () => {
    let isValid = true;
    const newErrors = {};

    if (!form.oldPassword) {
      newErrors.code = 'Old Password is required';
      isValid = false;
    }

    if (!form.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (form.password.length < 6) {
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

  const handleSubmit = () => {
    if (validateFields()) {
      forgotPassword();
    }
  };

  const forgotPassword = async () => {
    const payload = {
      oldPassword: form.oldPassword,
      newPassword: form.password,
      confirmNewPassword: form.confirmPassword,
    };
    try {
      const {data} = await changePassword(payload);
      console.log('🚀 ~ forgotPassword ~ data:', data);
      showToast({type: 'success', title: data?.message});
      navigation.goBack();
    } catch (error) {
      console.log('🚀 ~ forgotPassword ~ error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title="Change Password" rightIcon={false} />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <Image source={images.set} style={styles.logo} />
          <CustomTextInput
            placeholder="Old Password"
            value={form.oldPassword}
            onChangeText={value => handleInputChange('oldPassword', value)}
            errorMessage={errors.password}
            secureTextEntry={secureTextEntry}
            rightIcon={secureTextEntry ? icons.hide : icons.unhide}
            onRightIconPress={() => setsecureTextEntry(!secureTextEntry)}
          />

          <CustomTextInput
            placeholder="Password"
            value={form.password}
            onChangeText={value => handleInputChange('password', value)}
            errorMessage={errors.password}
            secureTextEntry={secureTextEntry1}
            rightIcon={secureTextEntry1 ? icons.hide : icons.unhide}
            onRightIconPress={() => setsecureTextEntry1(!secureTextEntry1)}
          />

          <CustomTextInput
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChangeText={value => handleInputChange('confirmPassword', value)}
            errorMessage={errors.confirmPassword}
            secureTextEntry={secureTextEntry2}
            rightIcon={secureTextEntry2 ? icons.hide : icons.unhide}
            onRightIconPress={() => setsecureTextEntry2(!secureTextEntry2)}
          />
          <View style={{marginBottom: nh(20)}} />
          <Button text={'Change Password'} onPress={handleSubmit} />
        </View>
      </View>
    </SafeAreaView>
  );
};

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
    height: nh(150),
    width: nh(167),
    alignSelf: 'center',
    marginBottom: nh(30),
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
  backToLogin: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backToLoginText: {
    color: COLORS.grey999999,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
  },
  loginLink: {
    color: COLORS.yellowF5BE00,
    fontSize: nh(12),
    fontFamily: APP_FONTS.PoppinsMedium,
  },
});

export default ChangePassword;
