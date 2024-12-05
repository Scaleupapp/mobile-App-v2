import React, {useState} from 'react';
import {StyleSheet, SafeAreaView, StatusBar, View} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import {CheckBox} from 'react-native-elements';
import Text from '../../components/Text';
import Button from '../../components/Button';

const Certifications = ({navigation, route}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [state, setState] = useState({
    name: '',
    issuedBy: '',
    startDate: '',
    endDate: '',
    idCredentials: '',
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

    // Name validation
    if (!state.name) {
      newErrors.name = 'Name is required';
      isValid = false;
    }

    // Issued By validation
    if (!state.issuedBy) {
      newErrors.issuedBy = 'Issued by is required';
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

    // ID Credentials validation
    if (!state.idCredentials) {
      newErrors.idCredentials = 'ID Credentials are required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const saveCertification = () => {
    if (validateFields()) {
      console.log(
        'Certification details:',
        state,
        'Currently pursuing:',
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
      <Header title="Certifications" onBackPress={() => navigation.goBack()} />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <CustomTextInput
            label="Name"
            placeholder="Enter Certification Name"
            value={state.name}
            onChangeText={value => handleInputChange('name', value)}
            errorMessage={errors.name}
          />
          <CustomTextInput
            label="Issued by"
            placeholder="Enter Issuing Organization"
            value={state.issuedBy}
            onChangeText={value => handleInputChange('issuedBy', value)}
            errorMessage={errors.issuedBy}
          />

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
          <CustomTextInput
            label="ID Credentials"
            placeholder="Enter ID Credentials"
            value={state.idCredentials}
            onChangeText={value => handleInputChange('idCredentials', value)}
            errorMessage={errors.idCredentials}
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
              onPress={saveCertification}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Certifications;

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
