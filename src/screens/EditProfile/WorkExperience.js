import React, {useState} from 'react';
import {StyleSheet, SafeAreaView, StatusBar, View} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import {CheckBox} from 'react-native-elements';
import Text from '../../components/Text';
import Button from '../../components/Button';

const WorkExperience = ({navigation, route}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [state, setState] = useState({
    designation: '',
    companyName: '',
    startDate: '',
    endDate: '',
    rolesResponsibilities: '',
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

    // Designation validation
    if (!state.designation) {
      newErrors.designation = 'Designation is required';
      isValid = false;
    }

    // Company Name validation
    if (!state.companyName) {
      newErrors.companyName = 'Company Name is required';
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

    // Roles & Responsibilities validation
    if (!state.rolesResponsibilities) {
      newErrors.rolesResponsibilities = 'Roles & Responsibilities are required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const saveWorkExperience = () => {
    if (validateFields()) {
      console.log(
        'Work experience details:',
        state,
        'Currently working:',
        isChecked,
      );
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
      <Header title="Work Experience" onBackPress={() => navigation.goBack()} />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <View style={styles.input}>
            <CustomTextInput
              width={(DEVICE_WIDTH - 55) / 2}
              label="Designation"
              placeholder="Enter Designation"
              value={state.designation}
              onChangeText={value => handleInputChange('designation', value)}
              errorMessage={errors.designation}
            />
            <CustomTextInput
              width={(DEVICE_WIDTH - 55) / 2}
              label="Company Name"
              placeholder="Enter Company Name"
              value={state.companyName}
              onChangeText={value => handleInputChange('companyName', value)}
              errorMessage={errors.companyName}
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
              disabled={isChecked} // Disable if currently working
            />
          </View>
          <CustomTextInput
            label="Roles & Responsibilities"
            placeholder="Enter Roles & Responsibilities"
            textinputType="L"
            value={state.rolesResponsibilities}
            onChangeText={value =>
              handleInputChange('rolesResponsibilities', value)
            }
            errorMessage={errors.rolesResponsibilities}
          />
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
              I currently work here
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
              onPress={saveWorkExperience}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default WorkExperience;

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
