import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  SafeAreaView,
  StatusBar,
  View,
  FlatList,
  Pressable,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import {DEVICE_WIDTH, nh, nw} from '../../helper/scales';
import Header from '../../components/Header';
import CustomTextInput from '../../components/TextInput';
import {CheckBox} from 'react-native-elements';
import Text from '../../components/Text';
import Button from '../../components/Button';
import {
  deleteProjects,
  getProjects,
  saveProjects,
} from '../../services/apiService';
import {Card} from '../../components/Card';
import {useToast} from '../../components/CustomToast';
import {formatDate} from '../../helper/commonFunctions';
import MonthPickerComponent from '../../components/MonthPickerComponent';

const Projects = ({navigation, route}) => {
  const {showToast} = useToast();
  const [isChecked, setIsChecked] = useState(false);
  const [state, setState] = useState({
    name: '',
    startDate: '',
    endDate: '',
    projectLink: '',
  });
  const [errors, setErrors] = useState({});
  const [projects, setProjects] = useState([]);
  const [saved, setSaved] = useState(true);
  const [edit, setEdit] = useState(false);
  const [startDate, setStartDate] = useState({
    show: false,
    date: new Date(),
    format: '',
  });
  const [endDate, setEndDate] = useState({
    show: false,
    date: new Date(),
    format: '',
  });

  useEffect(() => {
    getProjectsAPI();
  }, []);
  const getProjectsAPI = async () => {
    try {
      let res = await getProjects();

      setProjects(res?.data?.projectInfo);
      if (res?.data?.projectInfo?.length > 0) {
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

  const saveProjectAPI = async () => {
    if (validateFields()) {
      console.log('Project details:', state, 'Currently working:', isChecked);
      // Perform your API call or other actions here

      let payload = {
        name: state?.name,
        startDate: state?.startDate,
        endDate: state?.endDate,
        projectLink: state?.projectLink,
        currentlyWorking: isChecked,
      };
      if (edit) payload.id = edit;
      try {
        console.log(payload, 'payload');
        const {data} = await saveProjects(payload);
        console.log(data, payload, 'saved');
        getProjectsAPI();
        setSaved(true);
        if (edit) setEdit(false);
        setState({
          name: '',
          startDate: '',
          endDate: '',
          projectLink: '',
        });
        showToast({type: 'success', title: data?.message});
      } catch (error) {
        console.log(error?.response?.data, 'errror');
      }
    }
  };

  const onEdit = item => {
    setSaved(false);
    setEdit(item?._id);
    setState({
      name: item?.name,
      startDate: item?.startDate,
      endDate: item?.endDate,
      projectLink: item?.projectLink,
    });
    if (item?.startDate) {
      const newDate = new Date(item?.startDate);
      const formattedDate = formatDate(newDate);
      setStartDate({show: false, date: newDate, format: formattedDate});
    }
    if (item?.endDate) {
      const endDate = new Date(item?.endDate);
      const formattedDate = formatDate(endDate);
      setEndDate({show: false, date: endDate, format: formattedDate});
    }
    setIsChecked(item?.currentlyWorking);
  };

  const onDelete = async item => {
    try {
      const {data} = await deleteProjects(item?._id);
      showToast({type: 'success', title: data?.message});
      getProjectsAPI();
    } catch (error) {
      console.log('🚀 ~ onDelete ~ error:', error);
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
          {!saved && (
            <>
              <CustomTextInput
                label="Name"
                placeholder="Enter Project Name"
                value={state.name}
                onChangeText={value => handleInputChange('name', value)}
                errorMessage={errors.name}
              />

              <View style={styles.input}>
                <Pressable
                  style={{
                    position: 'absolute',
                    height: '100%',
                    width: '48%',
                    zIndex: 1,
                  }}
                  onPress={() =>
                    setStartDate({
                      ...startDate,
                      show: true,
                    })
                  }></Pressable>
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="Start Date"
                  placeholder="Enter Start Date"
                  editable={false}
                  value={startDate.format}
                  errorMessage={errors.startDate}
                />
                <Pressable
                  disabled={isChecked}
                  style={{
                    position: 'absolute',
                    height: '100%',
                    right: 0,
                    width: '48%',
                    zIndex: 1,
                  }}
                  onPress={() =>
                    setEndDate({...endDate, show: true})
                  }></Pressable>
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="End Date"
                  placeholder="Enter End Date"
                  editable={false}
                  value={endDate.format}
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
              <MonthPickerComponent
                pickerState={startDate}
                onPickerStateChange={setStartDate}
                field="startDate"
                handleInputChange={handleInputChange}
              />
              <MonthPickerComponent
                pickerState={endDate}
                onPickerStateChange={setEndDate}
                field="endDate"
                handleInputChange={handleInputChange}
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
                  onPress={saveProjectAPI}
                />
              </View>
            </>
          )}
          {projects.length > 0 && saved && (
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
                data={projects}
                renderItem={({item}) => (
                  <Card
                    title={item?.name}
                    subtitle={item?.projectLink}
                    text1={new Date(item?.endDate).getFullYear()}
                    checked={item?.currentlyWorking}
                    onEdit={() => onEdit(item)}
                    onDelete={() => onDelete(item)}
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
