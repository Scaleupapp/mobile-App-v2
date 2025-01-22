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
import {ImagePicker} from 'react-native-image-crop-picker';

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

const EditProfile = ({navigation}) => {
  const {showToast} = useToast();
  const [selected, setSelected] = useState(0);
  const dispatch = useDispatch();
  const userData = useSelector(state => state?.userData);

  // We store the "raw" image file data here
  const [image, setImage] = useState(null);

  // Boolean that controls DatePicker visibility
  const [showDOBPicker, setShowDOBPicker] = useState(false);

  // Single source of truth for form data, including Date of Birth
  const [form, setForm] = useState({
    firstname: userData?.firstname ?? '',
    lastname: userData?.lastname ?? '',
    email: userData?.email ?? '',
    mobile: userData?.phoneNumber ?? '',
    location: userData?.location ?? '',
    // If there's a dateOfBirth in userData, parse it into a JS Date; otherwise null
    dob: userData?.dateOfBirth ? new Date(userData?.dateOfBirth) : null,
    about: userData?.bio?.bioAbout ?? '',
    // Currently displayed profile pic (URL or local URI)
    profilePicture: userData?.profilePicture ?? '',
  });

  // Error State
  const [errors, setErrors] = useState({
    firstname: '',
    lastname: '',
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

    // First Name validation
    if (!form.firstname) {
      newErrors.firstname = 'First name is required';
      isValid = false;
    }

    // Last Name validation
    if (!form.lastname) {
      newErrors.lastname = 'Last name is required';
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
    } else {
      let phone = form.mobile;

      // If phone starts with +91, remove it for validation
      if (phone.startsWith('+91')) {
        phone = phone.replace('+91', '');
      }

      // Check if the remaining number has exactly 10 digits
      if (phone.length !== 10) {
        newErrors.mobile = 'Mobile number must be 10 digits';
        isValid = false;
      } else if (!isvalidMobileNumber(phone)) {
        newErrors.mobile = 'Enter a valid mobile number';
        isValid = false;
      }
    }

    // Location
    if (!form.location) {
      newErrors.location = 'Location is required';
      isValid = false;
    }

    // Date of Birth
    if (!form.dob) {
      newErrors.dob = 'Date of Birth is required';
      isValid = false;
    }

    // About
    if (!form.about) {
      newErrors.about = 'About section cannot be empty';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Fetch fresh user profile from backend & update Redux
  const getProfileData = async () => {
    try {
      const res = await getProfile('');
      dispatch(
        actions.setUserData({...userData, ...res?.data?.userProfileInfo}),
      );
    } catch (error) {
      console.log(error?.response?.data?.message, 'errormsg');
    }
  };

  // Perform API call to update user
  const handleSave = async () => {
    if (validateFields()) {
      // Prepare the formData
      const formData = new FormData();

      // Fields that match the backend variable names
      formData.append('firstname', form.firstname);
      formData.append('lastname', form.lastname);
      formData.append('email', form.email);
      formData.append('phoneNumber', form.mobile);
      formData.append('location', form.location);

      // Convert date object to string if it exists
      if (form.dob instanceof Date && !isNaN(form.dob)) {
        // You can store ISO (YYYY-MM-DD) or any parseable string
        formData.append('dateOfBirth', form.dob.toISOString());
      } else {
        formData.append('dateOfBirth', '');
      }

      formData.append('bioAbout', form.about);

      // Append the profile picture only if a new image was selected
      if (image?.uri) {
        formData.append('profilePicture', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        });
      }

      try {
        const {data} = await updateProfile(formData);
        showToast({type: 'success', title: data?.message});
        getProfileData();
        console.log('Profile Update Response:', data);
      } catch (error) {
        console.log('Profile Update Error:', error?.response?.data);
      }
    }
  };

  // Handle selected or captured media
  const handleMedia = result => {
    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];

      // Update the form's displayed profile picture
      setForm(prevForm => ({
        ...prevForm,
        profilePicture: asset.uri,
      }));

      // Prepare the media data for upload
      setImage({
        uri: asset.uri,
        name: asset.fileName || 'media', // fallback
        type: asset.type || 'image/jpeg',
      });
    }
  };

  const openGallery = async () => {
    // const result = await launchImageLibrary({
    //   mediaType: 'photo',
    //   quality: 0.3,
    // });
    // if (!result.didCancel && !result.errorCode) {
    //   handleMedia(result);
    // }
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
    }).then(image => {
      console.log('🚀 ~ openGallery ~ image:', image);
      // Update the form's displayed profile picture
      setForm(prevForm => ({
        ...prevForm,
        profilePicture: image?.sourceURL,
      }));

      // Prepare the media data for upload
      setImage({
        uri: image?.sourceURL,
        name: image?.filename || 'media', // fallback
        type: image?.mime || 'image/jpeg',
      });
    });
  };

  // Generic input change handler
  const handleInputChange = (field, value) => {
    setForm({...form, [field]: value});

    // Clear error for that field
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
            {selected === 0 && (
              <>
                {/* Profile Picture Section */}
                <View>
                  {form.profilePicture ? (
                    <Image
                      source={{
                        uri: `${
                          form.profilePicture
                        }?timestamp=${new Date().getTime()}`,
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
                        {`${
                          userData?.firstname?.charAt(0)?.toUpperCase() || ''
                        }${userData?.lastname?.charAt(0)?.toUpperCase() || ''}`}
                      </Text>
                    </View>
                  )}
                  <View style={styles.circle}>
                    <Icon
                      type="antdesign"
                      name="edit"
                      style={{marginLeft: 0.5}}
                      size={16}
                      onPress={openGallery}
                    />
                  </View>
                </View>

                {/* Form Fields */}
                <CustomTextInput
                  label="First Name"
                  placeholder="Enter First Name"
                  value={form.firstname}
                  onChangeText={value => handleInputChange('firstname', value)}
                  errorMessage={errors.firstname}
                />
                <CustomTextInput
                  label="Last Name"
                  placeholder="Enter Last Name"
                  value={form.lastname}
                  onChangeText={value => handleInputChange('lastname', value)}
                  errorMessage={errors.lastname}
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
                />
                <CustomTextInput
                  label="Location"
                  placeholder="Enter Location"
                  value={form.location}
                  onChangeText={value => handleInputChange('location', value)}
                  errorMessage={errors.location}
                />

                {/* Date of Birth */}
                <View>
                  <Pressable
                    style={{
                      position: 'absolute',
                      height: '100%',
                      width: '100%',
                      zIndex: 1,
                    }}
                    onPress={() => setShowDOBPicker(true)}
                  />
                  <CustomTextInput
                    label="Date of Birth"
                    placeholder="Enter Date of Birth"
                    // Show the date in a readable format if it exists
                    value={
                      form.dob
                        ? formatDate(form.dob, true) // e.g. "MM/DD/YYYY"
                        : ''
                    }
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
                  multiline
                />

                {/* Save Button */}
                <View
                  style={{
                    marginTop: 30,
                    alignSelf: 'flex-end',
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

                {/* Date Picker Modal */}
                <DatePicker
                  modal
                  open={showDOBPicker}
                  date={form.dob || new Date()} // fallback if null
                  mode="date"
                  minimumDate={new Date('1970-01-01')}
                  maximumDate={new Date()}
                  onConfirm={selectedDate => {
                    // Save the new date in form
                    handleInputChange('dob', selectedDate);
                    setShowDOBPicker(false);
                  }}
                  onCancel={() => setShowDOBPicker(false)}
                />
              </>
            )}

            {/* Professional Section */}
            {selected === 1 &&
              professionData.map((item, index) => (
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
    boxShadow: '2 2 5 0 rgba(0, 0, 0, 0.2)',
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
