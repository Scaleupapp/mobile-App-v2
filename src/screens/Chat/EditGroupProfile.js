import React, {useState} from 'react';
import {
  Image,
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {COLORS} from '../../helper/colors';
import Icon from '../../helper/icon';
import {
  DEVICE_HEIGHT,
  DEVICE_WIDTH,
  isAndroid,
  nh,
  nw,
} from '../../helper/scales';
import {createStudyGroups} from '../../services/apiService';
import Text from '../../components/Text';
import Button from '../../components/Button';
import {navigationRef} from '../../../App';
import Routes from '../../helper/routes';
import CustomTextInput from '../../components/TextInput';
import Header from '../../components/Header';
import ImagePicker from 'react-native-image-crop-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import SquareToggle from '../../components/ToggleButton';
const options = ['Public', 'Private'];

const EditGroupProfile = ({route}) => {
  const {groupMembers, groupMembersDetails} = route.params;
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [input, setInput] = useState('');
  const [words, setWords] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selected, setSelected] = useState(0);

  const handleAddWord = () => {
    if (input.trim()) {
      setWords([...words, input.trim()]);
      setInput(''); // Clear the input
    }
  };
  const handleRemoveWord = index => {
    const updatedWords = words.filter((_, i) => i !== index);
    setWords(updatedWords);
  };

  const toggleSelection = id => {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(member => member !== id) : [...prev, id],
    );
  };

  const openGallery = async () => {
    ImagePicker.openPicker({
      width: 300,
      height: 300,
      cropping: true,
      cropperCircleOverlay: true,
      compressImageQuality: 0.8,
    })
      .then(image => {
        console.log('🚀 ~ openGallery ~ image:', image);
        // Update the form's displayed profile picture
        // setForm(prevForm => ({
        //   ...prevForm,
        //   profilePicture: 'file://' + image?.path,
        // }));

        // Prepare the media data for upload
        setImage({
          uri: 'file://' + image?.path,
          name: image?.filename || 'media', // fallback
          type: image?.mime || 'image/jpeg',
        });
      })
      .catch(e => console.log('errrrrrr ', e));
  };

  const createGroupApi = async () => {
    const paylaod = {
      name: groupName.trim(),
      description: groupDesc.trim(),
      members: groupMembers,
      admins: selectedMembers,
      topics: words,
      privacy: options[selected]?.toLocaleLowerCase(),
    };
    try {
      const {data} = await createStudyGroups(paylaod);
      navigationRef.goBack();
    } catch (error) {
      console.log('🚀 ~ createGroupApi ~ error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title="Create Group" />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled" // Dismisses keyboard on tapping outside
            enableResetScrollToCoords={false} // Prevents scroll reset
            showsVerticalScrollIndicator={false}>
            <View>
              {/* {form?.profilePicture ? (
                <Image
                  source={{
                    uri: form?.profilePicture,
                  }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={e => console.log('snkdnskdnk errrrv', e)}
                />
              ) : ( */}
              <View
                style={[
                  styles.image,
                  {
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: COLORS.greyD6D6D6,
                  },
                ]}>
                <Icon
                  type="material-community"
                  name="account-group"
                  style={{marginLeft: 0.5}}
                  size={nh(60)}
                  onPress={openGallery}
                />
              </View>
              {/* <View style={{width: 200, backgroundColor: COLORS.blue043142}}> */}
              <SquareToggle
                options={options}
                selected={selected}
                onToggle={val => setSelected(val)}
              />
              {/* </View> */}
              {/* )} */}
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
            <CustomTextInput
              label="Group Name"
              placeholder="Enter group name"
              value={groupName}
              onChangeText={setGroupName}
            />
            <CustomTextInput
              label="Group Description"
              placeholder="Enter description"
              value={groupDesc}
              onChangeText={setGroupDesc}
            />
            <Text
              variant="medium12"
              color={COLORS.greyBBBBBB}
              style={{marginBottom: words?.length > 0 ? 5 : -5}}>
              {'Topics'}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginBottom: 10,
              }}>
              {words.map((item, index) => (
                <View
                  key={index.toString()}
                  style={{
                    padding: 10,
                    margin: 4,
                    borderRadius: 8,
                    borderWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}>
                  <Text color={COLORS.grey999999} variant="semibold12">
                    {item}
                  </Text>
                  <TouchableOpacity
                    style={styles.crossButton}
                    onPress={() => handleRemoveWord(index)}>
                    <Text color={COLORS.grey999999}>✕</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <CustomTextInput
              placeholder="Please specify"
              errorMessage=""
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleAddWord}
            />
            <Text
              variant="medium12"
              color={COLORS.greyBBBBBB}
              style={{marginBottom: words?.length > 0 ? 5 : -5}}>
              {'Members (' + groupMembers?.length + ')'}
            </Text>
            <FlatList
              data={groupMembersDetails}
              renderItem={({item, index}) => (
                <View key={index} style={styles.card}>
                  <Image
                    source={{uri: item?.profilePicture}}
                    style={styles.image1}
                  />
                  <View style={{width: nw(175)}}>
                    <Text variant="medium14" color={COLORS.blue043142}>
                      {item?.username}
                    </Text>
                  </View>
                  <Button
                    onPress={() => toggleSelection(item.userId)}
                    text={
                      selectedMembers.includes(item.userId)
                        ? 'Make Member'
                        : 'Make Admin'
                    }
                    variant="outline"
                    width={nw(90)}
                    height={nh(35)}
                    textStyle={{fontSize: 14}}
                  />
                </View>
              )}
            />
          </KeyboardAwareScrollView>
        </View>
      </View>

      <View
        style={{
          position: 'absolute',
          bottom: 0,
          alignSelf: 'center',
        }}>
        <Button
          text="Create Group"
          onPress={createGroupApi}
          buttonStyle={{
            borderRadius: 0,
          }}
          width={DEVICE_WIDTH}
          textStyle={{fontSize: 20}}
        />
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
  modalContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderColor: COLORS.grey999999 + '80',
    borderWidth: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetView: {
    flex: 1,
    backgroundColor: COLORS.whiteFFFFFF,
    alignItems: 'center',
    justifyContent: 'center',
    height: DEVICE_HEIGHT,
    width: DEVICE_WIDTH,
  },
  closeIcon: {
    position: 'absolute',
    top: nh(isAndroid ? 10 : 10),
    right: nw(10),
    zIndex: 3,
  },
  loadingContainer: {
    position: 'absolute',
    zIndex: 2,
    height: DEVICE_HEIGHT,
    width: DEVICE_WIDTH,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image1: {
    height: nh(50),
    width: nh(50),
    borderRadius: nh(25),
    marginRight: 10,
    borderColor: COLORS.grey777777,
    borderWidth: 1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: nw(16),
    borderBottomWidth: 1,
    borderBottomColor: '#E9E9E9',
    paddingBottom: 15,
    paddingTop: nh(22),
  },
});

export default EditGroupProfile;
