import React, {useState} from 'react';
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

const Education = ({navigation, route}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [education, setEducation] = useState([]);
  console.log(education);
  const [state, setState] = useState({
    degree: '',
    university: '',
    startDate: '',
    endDate: '',
  });
  const [errors, setErrors] = useState({});

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

  const saveEducation = () => {
    if (validateFields()) {
      console.log(
        'Education details:',
        state,
        'Currently pursuing:',
        isChecked,
      );

      setEducation([...education, state]);
      setSaved(true);
      // Perform your API call or other actions here
    }
  };
  const [saved, setSaved] = useState(false);
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
          {!saved ? (
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
                  label="University"
                  placeholder="Enter University"
                  value={state.university}
                  onChangeText={value => handleInputChange('university', value)}
                  errorMessage={errors.university}
                />
              </View>
              <View style={styles.input}>
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="Start Date"
                  placeholder="Enter Start Date"
                  value={state.startDate}
                  onChangeText={value => handleInputChange('startDate', value)}
                  errorMessage={errors.startDate}
                />
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="End Date"
                  placeholder="Enter End Date"
                  value={state.endDate}
                  onChangeText={value => handleInputChange('endDate', value)}
                  errorMessage={errors.endDate}
                  disabled={isChecked} // Disable if currently pursuing
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
                  onPress={saveEducation}
                />
              </View>
            </>
          ) : (
            <FlatList data={education} renderItem={() => <Card />} />
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
