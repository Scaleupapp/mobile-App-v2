import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  FlatList,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import {CheckBox} from 'react-native-elements';
import Text from '../../components/Text';
import Button from '../../components/Button';
import {Card} from '../../components/Card';
import {getEducation, saveEducation} from '../../services/apiService';

const Education = ({navigation, route}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [education, setEducation] = useState([]);
  const [saved, setSaved] = useState(true);
  console.log(education);
  const [state, setState] = useState({
    degree: '',
    university: '',
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    getEducationDetails();
  }, []);
  const getEducationDetails = async () => {
    try {
      let res = await getEducation();

      setEducation(res?.data?.educationInfo);
      if (res?.data?.educationInfo?.length > 0) {
        setSaved(true);
      }
    } catch (error) {
      setSaved(false);
      console.log(error, 'error from getEducationDetails');
    } finally {
    }
  };

  const handleInputChange = (field, value) => {
    setState({...state, [field]: value});

    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  const validateFields = () => {
    let isValid = true;
    const newErrors = {};

    // Degree validation
    if (!state.degree) {
      newErrors.degree = 'Degree is required';
      isValid = false;
    }

    // University validation
    if (!state.university) {
      newErrors.university = 'University is required';
      isValid = false;
    }

    // Start Date validation
    if (!state.startDate) {
      newErrors.startDate = 'Start Date is required';
      isValid = false;
    }

    // End Date validation
    if (!state.endDate && !isChecked) {
      newErrors.endDate = 'End Date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const saveEducationAPI = async () => {
    if (validateFields()) {
      //   setSaved(true);
      let payload = {
        degree: state?.degree,
        university: state?.university,
        startDate: state?.startDate,
        endDate: state?.endDate,
        currentltPursuing: isChecked,
      };
      try {
        let res = await saveEducation(payload);
        console.log(res?.data, 'saved');
        setEducation([payload, ...education]);
        setSaved(true);
        setState({
          degree: '',
          university: '',
          startDate: '',
          endDate: '',
        });
      } catch (error) {
        console.log(error?.response?.data, 'errror');
      }

      // Perform your API call or other actions here
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header
        title="Educational Info"
        onBackPress={() => navigation.goBack()}
      />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          {!saved && (
            <>
              <View style={styles.input}>
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="Degree"
                  placeholder="Enter Degree"
                  value={state.degree}
                  onChangeText={value => handleInputChange('degree', value)}
                  errorMessage={errors.degree}
                />
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="College"
                  placeholder="Enter College Name"
                  value={state.university}
                  onChangeText={value => handleInputChange('university', value)}
                  errorMessage={errors.university}
                />
              </View>
              <View style={styles.input}>
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="Start Year"
                  placeholder="Enter Start Year"
                  value={state.startYear}
                  onChangeText={value => handleInputChange('startDate', value)}
                  errorMessage={errors.startDate}
                  keyboardType="numeric"
                />
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="End Year"
                  placeholder="Enter End Year"
                  value={state.endDate}
                  onChangeText={value => handleInputChange('endDate', value)}
                  errorMessage={errors.endDate}
                  disabled={isChecked} // Disable if currently pursuing
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.checkboxContainer}>
                <CheckBox
                  checkedIcon="check-box"
                  uncheckedIcon="check-box-outline-blank"
                  iconType="material"
                  checked={isChecked}
                  onPress={() => setIsChecked(!isChecked)}
                  containerStyle={styles.checkboxStyle}
                  checkedColor={COLORS.grey999999}
                  uncheckedColor={COLORS.grey999999}
                />
                <Text variant="medium12" color={COLORS.grey999999}>
                  Currently pursuing
                </Text>
              </View>
              <View
                style={{
                  marginTop: 30,
                  marginLeft: DEVICE_WIDTH - 105,
                  marginBottom: nh(100),
                }}>
                <Button
                  text="Save"
                  width={nw(63)}
                  height={nh(35)}
                  textStyle={{fontSize: 14}}
                  onPress={saveEducationAPI}
                />
              </View>
            </>
          )}
          {education.length > 0 && saved && (
            <>
              <View style={{marginBottom: nh(10), width: nw(96)}}>
                <Button
                  leftIcon={'plus-circle'}
                  text="Add more"
                  variant="outline"
                  width={nw(96)}
                  height={nh(35)}
                  textStyle={{fontSize: 14}}
                  onPress={() => setSaved(false)}
                />
              </View>
              <FlatList
                data={education}
                renderItem={({item}) => (
                  <Card
                    title={item?.university}
                    subtitle={item?.degree}
                    text1={new Date(item?.startDate).getFullYear()}
                    text2={new Date(item?.endDate).getFullYear()}
                    checked={item?.currentltPursuing}
                  />
                )}
              />
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Education;

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
  input: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: nh(15),
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
});
