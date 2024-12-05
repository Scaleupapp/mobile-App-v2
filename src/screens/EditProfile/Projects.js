import React, {useState} from 'react';
import {StyleSheet, SafeAreaView, StatusBar, View} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import {CheckBox} from 'react-native-elements';
import Text from '../../components/Text';
import Button from '../../components/Button';

const Projects = ({navigation, route}) => {
  const [isChecked, setIsChecked] = useState(false);
  const [state, setState] = useState({
    name: '',
    startDate: '',
    endDate: '',
    projectLink: '',
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

    // Project Link validation
    if (!state.projectLink) {
      newErrors.projectLink = 'Project Link is required';
      isValid = false;
    } else if (
      !/^https?:\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])?$/.test(
        state.projectLink,
      )
    ) {
      newErrors.projectLink = 'Enter a valid URL';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const saveProject = () => {
    if (validateFields()) {
      console.log('Project details:', state, 'Currently working:', isChecked);
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
      <Header title="Projects" onBackPress={() => navigation.goBack()} />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <CustomTextInput
            label="Name"
            placeholder="Enter Project Name"
            value={state.name}
            onChangeText={value => handleInputChange('name', value)}
            errorMessage={errors.name}
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
              disabled={isChecked} // Disable if currently working
            />
          </View>
          <CustomTextInput
            label="Project Link"
            placeholder="Enter Project Link"
            value={state.projectLink}
            onChangeText={value => handleInputChange('projectLink', value)}
            errorMessage={errors.projectLink}
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
              Currently working
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
              onPress={saveProject}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default Projects;

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
