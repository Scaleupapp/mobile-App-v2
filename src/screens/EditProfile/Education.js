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
import {Card} from '../../components/Card';
import {
  deleteEducation,
  getEducation,
  saveEducation,
} from '../../services/apiService';
import {useToast} from '../../components/CustomToast';
import {formatDate} from '../../helper/commonFunctions';
import MonthPickerComponent from '../../components/MonthPickerComponent';

const Education = ({navigation, route}) => {
  const {showToast} = useToast();
  const [isChecked, setIsChecked] = useState(false);
  const [education, setEducation] = useState([]);
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

  // Fetch the user's education list
  const getEducationDetails = async () => {
    try {
      let res = await getEducation();
      setEducation(res?.data?.educationInfo || []);

      if (res?.data?.educationInfo?.length > 0) {
        setSaved(true);
      }
    } catch (error) {
      setSaved(false);
      console.log(error, 'error from getEducationDetails');
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setState({...state, [field]: value});

    // Clear existing error for this field
    if (errors[field]) {
      setErrors({...errors, [field]: ''});
    }
  };

  // Validate required fields
  const validateFields = () => {
    let isValid = true;
    const newErrors = {};

    if (!state.degree) {
      newErrors.degree = 'Degree is required';
      isValid = false;
    }
    if (!state.university) {
      newErrors.university = 'University is required';
      isValid = false;
    }
    if (!state.startDate) {
      newErrors.startDate = 'Start Date is required';
      isValid = false;
    }
    // If not currently pursuing, endDate is required
    if (!state.endDate && !isChecked) {
      newErrors.endDate = 'End Date is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Save new or update existing education
  const saveEducationAPI = async () => {
    if (validateFields()) {
      let payload = {
        degree: state.degree,
        university: state.university,
        startDate: state.startDate,
        endDate: state.endDate,
        currentltPursuing: isChecked,
      };
      if (edit) payload.id = edit;

      try {
        const {data} = await saveEducation(payload);
        getEducationDetails();
        setSaved(true);
        if (edit) setEdit(false);

        // Clear the form
        setState({degree: '', university: '', startDate: '', endDate: ''});
        showToast({type: 'success', title: data?.message});
      } catch (error) {
        console.log(error?.response?.data, 'error saving education');
      }
    }
  };

  // Edit an existing entry
  const onEdit = (item) => {
    setSaved(false);
    setEdit(item?._id);
    setState({
      degree: item?.degree,
      university: item?.university,
      startDate: item?.startDate,
      endDate: item?.endDate,
    });

    // Pre-fill date pickers
    if (item?.startDate) {
      const newDate = new Date(item.startDate);
      const formattedDate = formatDate(newDate);
      setStartDate({show: false, date: newDate, format: formattedDate});
    }
    if (item?.endDate) {
      const eDate = new Date(item.endDate);
      const formattedDate = formatDate(eDate);
      setEndDate({show: false, date: eDate, format: formattedDate});
    }
    setIsChecked(item?.currentltPursuing);
  };

  // Delete an entry
  const onDelete = async (item) => {
    try {
      const {data} = await deleteEducation(item?._id);
      showToast({type: 'success', title: data?.message});
      getEducationDetails();
    } catch (error) {
      console.log('🚀 ~ onDelete ~ error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.yellowF5BE00} />
      <Header title="Educational Info" onBackPress={() => navigation.goBack()} />
      <View style={styles.layer1}>
        <View style={styles.layer2}>
          {/* Show the form if not 'saved' */}
          {!saved && (
            <>
              <View style={styles.input}>
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="Degree"
                  placeholder="Enter Degree"
                  value={state.degree}
                  onChangeText={(value) => handleInputChange('degree', value)}
                  errorMessage={errors.degree}
                />
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="College"
                  placeholder="Enter College Name"
                  value={state.university}
                  onChangeText={(value) => handleInputChange('university', value)}
                  errorMessage={errors.university}
                />
              </View>

              <View style={styles.input}>
                <Pressable
                  style={{
                    position: 'absolute',
                    height: '100%',
                    width: '48%',
                    zIndex: 1,
                  }}
                  onPress={() => setStartDate({...startDate, show: true})}
                />
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="Start Year"
                  placeholder="Enter Start Year"
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
                  onPress={() => setEndDate({...endDate, show: true})}
                />
                <CustomTextInput
                  width={(DEVICE_WIDTH - 55) / 2}
                  label="End Year"
                  placeholder="Enter End Year"
                  editable={false}
                  value={endDate.format}
                  errorMessage={errors.endDate}
                />
              </View>

              {/* Month pickers for start/end date */}
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

              {/* Currently pursuing checkbox */}
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

              {/* Save button */}
              <View
                style={{
                  marginTop: 30,
                  marginLeft: DEVICE_WIDTH - 105,
                  marginBottom: nh(100),
                }}
              >
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

          {/* Show existing records if 'saved' is true */}
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
                renderItem={({item}) => {
                  // If 'endDate' is null => show 'Pursuing'
                  // Else => show the end year
                  let endDateLabel = 'Pursuing';
                  if (item?.endDate) {
                    // Possibly check if in the past vs future
                    const endYear = new Date(item.endDate).getFullYear();
                    endDateLabel = endYear.toString();
                  }

                  return (
                    <Card
                      title={item?.university}
                      subtitle={item?.degree}
                      // text1 => start year if present
                      text1={
                        item?.startDate
                          ? new Date(item.startDate).getFullYear().toString()
                          : ''
                      }
                      // text2 => show end date year if present, else 'Pursuing'
                      text2={endDateLabel}
                      // If you want to highlight 'Completed' in green vs 'Pursuing' in red,
                      // pass style or color props to the Card
                      checked={!item?.currentltPursuing} // or item.currentltPursuing
                      onEdit={() => onEdit(item)}
                      onDelete={() => onDelete(item)}
                      type={'education'}
                    />
                  );
                }}
                keyExtractor={(item, index) => `${item._id}-${index}`}
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
