import React, {useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import SquareToggle from '../../components/ToggleButton';
import Text from '../../components/Text';
import {images} from '../../assets/images';
import Icon from '../../helper/icon';
import CustomTextInput from '../../components/TextInput';
import Button from '../../components/Button';
import {
  formatDate,
  isValidEmail,
  isvalidMobileNumber,
} from '../../helper/commonFunctions';
import {useDispatch, useSelector} from 'react-redux';
import {launchImageLibrary} from 'react-native-image-picker';
import {getProfile, updateProfile} from '../../services/apiService';
import {actions} from '../../redux/reducers';
import {useToast} from '../../components/CustomToast';
import DatePicker from 'react-native-date-picker';

const professionData = [
  {
    image: images.preference,
    title: 'Preferences',
    subtitle: 'Update choices for recommendations',
    nav: 'Preferences',
  },
  {
    image: images.education,
    title: 'Educational Information',
    subtitle: 'Add your academic details',
    nav: 'Education',
  },
  {
    image: images.work,
    title: 'Work Experience',
    subtitle: 'Add your past work details',
    nav: 'WorkExperience',
  },
  {
    image: images.certification,
    title: 'Certifications',
    subtitle: 'Add your certificates',
    nav: 'Certifications',
  },
  {
    image: images.project,
    title: 'Projects',
    subtitle: 'Add the projects details you worked on',
    nav: 'Projects',
  },
];

const EditProfile = ({navigation, route}) => {
  const {showToast} = useToast();
  const [selected, setSelected] = useState(0);
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);
  const [image, setImage] = useState();
  const [dob, setDob] = useState({
    show: false,
    date: new Date(),
    format: '',
  });
  // Form State
  const [form, setForm] = useState({
    profilePicture: userData?.profilePicture ?? '',
    name: userData?.firstname ?? '',
    email: userData?.email ?? '',
    mobile: userData?.phoneNumber ?? '',
    location: userData?.location ?? '',
    dob: userData?.dateOfBirth
      ? new Date(userData?.dateOfBirth).toLocaleDateString('en-US')
      : '',

    about: userData?.bio?.bioAbout ?? '',
  });

  // Error State
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    mobile: '',
    location: '',
    dob: '',
    about: '',
  });

  const onSelect = number => {
    setSelected(number);
  };

  // Validate fields
  const validateFields = () => {
    let isValid = true;
    const newErrors = {};

    // Name validation
    if (!form.name) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Email validation
    if (!form.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!isValidEmail(form.email)) {
      newErrors.email = 'Enter a valid email address';
      isValid = false;
    }

    // Mobile Number validation
    if (!form.mobile) {
      newErrors.mobile = 'Mobile number is required';
      isValid = false;
    } else if (form.mobile.length !== 10) {
      newErrors.mobile = 'Mobile number must be 10 digits';
      isValid = false;
    } else if (!isvalidMobileNumber(form.mobile)) {
      newErrors.mobile = 'Enter a valid mobile number';
      isValid = false;
    }

    if (!form.location) {
      newErrors.location = 'Location is required';
      isValid = false;
    }

    // Date of Birth validation
    if (!form.dob) {
      newErrors.dob = 'Date of Birth is required';
      isValid = false;
    }

    // About validation
    if (!form.about) {
      newErrors.about = 'About section cannot be empty';
      isValid = false;
    }

    // Update errors state
    setErrors(newErrors);
    return isValid;
  };

  const getProfileData = async () => {
    try {
      let res = await getProfile('');
      // console.log('🚀 ~ getProfileData ~ res:', res?.data);
      dispatch(
        actions.setUserData({...userData, ...res?.data?.userProfileInfo}),
      ); // Dispatch the updated data
    } catch (error) {
      console.log(error?.response?.data?.message, 'errormsg');
    }
  };

  // Register user or perform API call
  const handleSave = async () => {
    if (validateFields()) {
      const profilePicture = {
        uri: image?.uri, // The URI of the image
        name: image?.name, // File name
        type: image?.type, // MIME type
      };
      console.log('🚀 ~ handleSave ~ profilePicture:', profilePicture);
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('email', form.email);
      formData.append('phoneNumber', form.mobile);
      formData.append('location', form.location);
      formData.append('dateOfBirth', form.dob);
      formData.append('bioAbout', form.about);
      formData.append('profilePicture', profilePicture);
      6464;
      try {
        const {data} = await updateProfile(formData);
        showToast({type: 'success', title: data?.message});
        getProfileData();
        console.log('🚀 ~ handleSave ~ data:', data);
      } catch (error) {
        console.log('🚀 ~ handleSave ~ error:', error?.response?.data);
      }
    }
  };

  // Handle selected or captured media
  const handleMedia = async result => {
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      setForm(prevForm => ({
        ...prevForm, // Spread the existing state
        profilePicture: asset?.uri, // Update only the profilePicture field
      }));
      // Prepare the media data for upload
      setImage({
        uri: asset.uri,
        name: asset.fileName || 'media', // Fallback name
        type: asset.type || 'image/jpeg',
      });
    }
  };

  const openGallery = async () => {
    const result = await launchImageLibrary({
      mediaType: 'photo',
      quality: 0.3,
    });
    handleMedia(result);
  };

  const handleInputChange = (field, value) => {
    setForm({...form, [field]: value});

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title="Edit Profile" onBackPress={() => navigation.goBack()} />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <SquareToggle
            options={['Personal', 'Professional']}
            selected={selected}
            onToggle={onSelect}
          />
          <ScrollView showsVerticalScrollIndicator={false}>
            {selected == 0 && (
              <>
                {/* <Text variant="semibold16" color={COLORS.green34A853}>
                  You only need 20% more
                </Text>
                <Text variant="medium14" color={COLORS.grey999999}>
                  Complete your profile and get personalized recommendations now
                </Text>
                <View style={styles.progresbar}>
                  <View style={styles.greenbar}></View>
                </View> */}
                <View>
                  {form?.profilePicture ? (
                    <Image
                      source={{
                        uri: form?.profilePicture
                          ? `${
                              form.profilePicture
                            }?timestamp=${new Date().getTime()}`
                          : null,
                      }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.image,
                        {
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: COLORS.greyD6D6D6,
                        },
                      ]}>
                      <Text variant="semibold20" color={COLORS.black333333}>
                        {`${userData?.firstname
                          ?.charAt(0)
                          .toUpperCase()}${userData?.lastname
                          ?.charAt(0)
                          .toUpperCase()}`}
                      </Text>
                    </View>
                  )}
                  <View style={styles.circle}>
                    <Icon
                      type="antdesign"
                      name="edit"
                      style={{marginLeft: 0.5}}
                      size={16}
                      onPress={() => openGallery()}
                    />
                  </View>
                </View>

                {/* Form Fields */}
                <CustomTextInput
                  label="Name"
                  placeholder="Enter Name"
                  value={form.name}
                  onChangeText={value => handleInputChange('name', value)}
                  errorMessage={errors.name}
                />
                <CustomTextInput
                  label="Email"
                  placeholder="Enter Email"
                  value={form.email}
                  onChangeText={value => handleInputChange('email', value)}
                  errorMessage={errors.email}
                />
                <CustomTextInput
                  label="Mobile No"
                  placeholder="Enter Mobile No"
                  value={form.mobile}
                  onChangeText={value => handleInputChange('mobile', value)}
                  errorMessage={errors.mobile}
                  // editable={false}
                />
                <CustomTextInput
                  label="Location"
                  placeholder="Enter Location"
                  value={form.location}
                  onChangeText={value => handleInputChange('location', value)}
                  errorMessage={errors.location}
                />
                <View>
                  <Pressable
                    style={{
                      position: 'absolute',
                      height: '100%',
                      width: '100%',
                      zIndex: 1,
                    }}
                    onPress={() =>
                      setDob({
                        ...dob,
                        show: true,
                      })
                    }></Pressable>
                  <CustomTextInput
                    label="Date of Birth"
                    placeholder="Enter Date of Birth"
                    value={dob.format}
                    editable={false}
                    errorMessage={errors.dob}
                  />
                </View>

                <CustomTextInput
                  label="About"
                  placeholder="Enter About Yourself"
                  textinputType="L"
                  value={form.about}
                  onChangeText={value => handleInputChange('about', value)}
                  errorMessage={errors.about}
                />

                <View
                  style={{
                    marginTop: 30,
                    marginLeft: DEVICE_WIDTH - 105,
                    marginBottom: nh(100),
                  }}>
                  <Button
                    text="Save"
                    onPress={handleSave}
                    width={nw(63)}
                    height={nh(35)}
                    textStyle={{fontSize: 14}}
                  />
                </View>
                <DatePicker
                  modal
                  open={dob.show}
                  date={dob.date}
                  mode={'date'}
                  minimumDate={new Date('1970-01-01')}
                  maximumDate={new Date()}
                  onConfirm={date => {
                    handleInputChange('dob', date);
                    const formattedDate = formatDate(date, true);
                    setDob({
                      show: false,
                      date: date,
                      format: formattedDate,
                    });
                  }}
                />
              </>
            )}
            {selected == 1 &&
              professionData?.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.card}
                  onPress={() => navigation.navigate(item.nav)}>
                  <View style={styles.cardimage}>
                    <Image
                      source={item.image}
                      style={{height: nh(29), width: nw(29)}}
                      resizeMode="contain"
                    />
                  </View>
                  <View>
                    <Text variant="semibold14" color={COLORS.blue043142}>
                      {item.title}
                    </Text>
                    <Text variant="medium12" color={COLORS.grey999999}>
                      {item.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default EditProfile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.yellowF5BE00,
  },
  layer1: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginTop: nh(32),
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
  progresbar: {
    borderWidth: 1,
    borderColor: COLORS.greyD6D6D6,

    height: nh(12),
    borderRadius: 10,
    marginTop: nh(10),
    marginBottom: nh(30),
  },
  greenbar: {
    backgroundColor: COLORS.green34A853,
    width: nw(200),
    height: nh(12),
    borderRadius: 10,
  },
  image: {
    height: nh(100),
    width: nh(100),
    borderRadius: nh(50),
    alignSelf: 'center',
    marginBottom: 30,
    borderWidth: 1,
    borderColor: COLORS.grey999999,
  },
  circle: {
    height: nh(25),
    width: nh(25),
    borderRadius: nh(12),
    backgroundColor: COLORS.yellowF5BE00,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: nw(120),
    top: nh(65),
  },
  card: {
    height: nh(65),
    boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(214, 214, 214, 0.2)',
    borderRadius: 8,
    marginBottom: nh(15),
    padding: nh(10),
    flexDirection: 'row',
  },
  cardimage: {
    height: nh(45),
    width: nh(45),
    backgroundColor: 'rgba(245, 190, 0, 0.15)',
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: nw(10),
  },
});
