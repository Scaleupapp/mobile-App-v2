import React, {useRef, useState} from 'react';
import {
  Image,
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
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
import {deleteStudyGroup} from '../../services/apiService';
import Text from '../../components/Text';
import Button from '../../components/Button';
import Routes from '../../helper/routes';
import CustomTextInput from '../../components/TextInput';
import Header from '../../components/Header';
import ImagePicker from 'react-native-image-crop-picker';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import SquareToggle from '../../components/ToggleButton';
import {useDispatch, useSelector} from 'react-redux';
import axios from 'axios';
import {API} from '../../services/apiConstent';
import {actions} from '../../redux/reducers';
import ChatModal from './ChatModal';
const options = ['Public', 'Private'];

const EditGroupProfile = ({route, navigation}) => {
  const {groupMembersDetails = [], groupData = {}, edit = false} = route.params;
  const userData = useSelector(state => state?.userData);
  const dispatch = useDispatch();
  const chatmodelRef = useRef(null);
  const [selectedMembers, setSelectedMembers] = useState(
    edit ? groupData?.admins : [],
  );
  const [input, setInput] = useState('');
  const [words, setWords] = useState(groupData?.topics || []);
  const [groupName, setGroupName] = useState(groupData?.name || '');
  const [groupNameErr, setGroupNameErr] = useState('');
  const [groupDesc, setGroupDesc] = useState(groupData?.description || '');
  const [selected, setSelected] = useState(
    groupData?.privacy ? (groupData?.privacy == 'public' ? 0 : 1) : 0,
  );
  const [memberDetails, setMemberDetails] = useState(
    edit ? groupData?.members : groupMembersDetails,
  );
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(groupData?.profilePicture || null);

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
        setImageUrl('file://' + image?.path);
        setImage({
          uri: 'file://' + image?.path,
          name: image?.filename || 'media', // fallback
          type: image?.mime || 'image/jpeg',
        });
      })
      .catch(e => console.log('errrrrrr ', e));
  };

  const handleSave = async () => {
    const name = groupName.trim();
    if (!name || name?.length == 0) {
      setGroupNameErr('Please enter group name');
      return;
    }
    console.log('anskansknaksnkansknkasnkansknaks');
    setLoading(true);
    const getMemberIds = memberDetails?.map(
      member => member?._id || member?.userId,
    );
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', groupDesc.trim());
    formData.append('members', JSON.stringify(getMemberIds));
    formData.append('admins', JSON.stringify(selectedMembers));
    formData.append('topics', JSON.stringify(words));
    formData.append('privacy', options[selected]?.toLocaleLowerCase());

    // Append the profile picture only if a new image was selected
    if (image?.uri) {
      formData.append('profilePicture', {
        uri: image.uri,
        name: image.name,
        type: image.type,
      });
    }
    if (edit) editGroupApi(formData);
    else createGroupApi(formData);
  };

  const createGroupApi = async formData => {
    try {
      const {data} = await axios.post(
        `${API.BASE_URL}${API.CREATE_GROUP}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${userData?.token}`,
          },
        },
      );
      navigation.goBack();
    } catch (error) {
      console.log('🚀 ~ createGroupApi ~ error:', error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const editGroupApi = async formData => {
    try {
      const {data} = await axios.put(
        `${API.BASE_URL}${API.CHAT}/${groupData?._id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${userData?.token}`,
          },
        },
      );
      const newdata = {
        ...data,
        members: memberDetails,
        admins: selectedMembers,
      };
      dispatch(actions.setGroupData(newdata));
      navigation.replace(Routes.GroupProfile, {
        canGoBack: false,
      });
    } catch (error) {
      console.log('🚀 ~ editGroupApi ~ error:', error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const ondelete = () => {
    Alert.alert(
      'Delete Group',
      'Are you sure you want to delete study group?',
      [
        {
          text: 'Cancel',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => deleteStudyGroupApi(),
        },
      ],
      {cancelable: true},
    );
  };

  const deleteStudyGroupApi = async () => {
    try {
      await deleteStudyGroup(groupData?._id);
      navigation.pop(3);
    } catch (error) {}
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* StatusBar */}
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.yellowF5BE00}
      />
      <Header title={edit ? 'Edit Group' : 'Create Group'} />

      <View style={styles.layer1}>
        <View style={styles.layer2}>
          <KeyboardAwareScrollView
            keyboardShouldPersistTaps="handled" // Dismisses keyboard on tapping outside
            enableResetScrollToCoords={false} // Prevents scroll reset
            showsVerticalScrollIndicator={false}>
            <View>
              {imageUrl ? (
                <Image
                  source={{
                    uri: imageUrl,
                  }}
                  style={styles.image}
                  resizeMode="cover"
                  onError={e => console.log('snkdnskdnk errrrv', e)}
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
                  <Icon
                    type="material-community"
                    name="account-group"
                    style={{marginLeft: 0.5}}
                    size={nh(60)}
                    onPress={openGallery}
                  />
                </View>
              )}
              <SquareToggle
                options={options}
                selected={selected}
                onToggle={val => setSelected(val)}
              />
              <View style={styles.circle}>
                <Icon
                  type="antdesign"
                  name="edit"
                  style={{marginLeft: 0.5}}
                  size={16}
                  onPress={openGallery}
                />
              </View>
              {edit ? (
                <TouchableOpacity style={styles.editButton} onPress={ondelete}>
                  <Icon
                    type={'antdesign'}
                    color={COLORS.whiteFFFFFF}
                    name={'delete'}
                    size={nw(15)}
                  />
                  <Text style={styles.editButtonText}> Delete</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <CustomTextInput
              label="Group Name"
              placeholder="Enter group name"
              value={groupName}
              onChangeText={val => {
                setGroupName(val);
                if (val?.length > 0) setGroupNameErr('');
              }}
              errorMessage={groupNameErr}
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
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
              <Text
                variant="medium12"
                color={COLORS.greyBBBBBB}
                style={{marginBottom: words?.length > 0 ? 5 : -5}}>
                {'Members (' + memberDetails?.length + ')'}
              </Text>
              {/* <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginRight: nw(28),
                }}>
                <Button
                  onPress={() => chatmodelRef.current?.present()}
                  text={'Add Members'}
                  variant="outline"
                  width={nw(90)}
                  height={nh(30)}
                  textStyle={{fontSize: 14}}
                />
                <Icon
                  type="entypo"
                  name="add-user"
                  color={COLORS.blue043142}
                  style={{marginLeft: 5}}
                  size={nh(20)}
                  onPress={() => chatmodelRef.current?.present()}
                />
              </View> */}
            </View>
            <FlatList
              scrollEnabled={false}
              data={memberDetails || []}
              contentContainerStyle={{paddingBottom: 50}}
              renderItem={({item, index}) => {
                const userId = item?._id || item?.userId;
                return (
                  <View key={index} style={styles.card}>
                    <Image
                      source={{uri: item?.profilePicture}}
                      style={styles.image1}
                    />
                    <View style={{width: nw(150)}}>
                      <Text variant="medium14" color={COLORS.blue043142}>
                        {item?.username}
                      </Text>
                    </View>
                    {userData?.id !== userId ? (
                      <>
                        <Button
                          onPress={() => toggleSelection(userId)}
                          text={
                            selectedMembers.includes(userId)
                              ? 'Make Member'
                              : 'Make Admin'
                          }
                          variant="outline"
                          width={nw(90)}
                          height={nh(30)}
                          textStyle={{fontSize: 14}}
                        />
                        <Icon
                          type="entypo"
                          name="remove-user"
                          color={COLORS.blue043142}
                          style={{marginLeft: 5}}
                          size={nh(20)}
                          onPress={() =>
                            setMemberDetails(prev =>
                              prev.includes(item)
                                ? prev.filter(member => member !== item)
                                : [...prev, item],
                            )
                          }
                        />
                      </>
                    ) : (
                      <Button
                        disabled
                        text={'Admin'}
                        variant="outline"
                        width={nw(90)}
                        height={nh(30)}
                        textStyle={{fontSize: 14}}
                      />
                    )}
                  </View>
                );
              }}
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
          text={edit ? 'Edit Group' : 'Create Group'}
          onPress={handleSave}
          buttonStyle={{
            borderRadius: 0,
          }}
          width={DEVICE_WIDTH}
          textStyle={{fontSize: 20}}
        />
      </View>
      <ChatModal
        group={true}
        ref={chatmodelRef}
        selectedMembers={memberDetails}
        setSelectedMembers={setMemberDetails}
      />
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
  editButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.blue043142,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    right: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default EditGroupProfile;
