import React, {useState} from 'react';
import {View, StyleSheet} from 'react-native';
import {logoutUser} from '../../helper/commonFunctions';
import Text from '../../components/Text';
import {COLORS} from '../../helper/colors';
import {deleteAccont} from '../../services/apiService';
import CustomTextInput from '../../components/TextInput';
import Button from '../../components/Button';
import {nh, nw} from '../../helper/scales';
import Modal from 'react-native-modal';

const ConfirmDelete = ({isVisible, setvisibleModal}) => {
  const [password, setPassword] = useState('');

  const deleteAcc = () => {
    const data = {password: password};
    deleteAccont(data).then(res => {
      if (res?.data?.message === 'Account deleted successfully') {
        setvisibleModal(false);
        setPassword('');
        setTimeout(() => {
          logoutUser();
        }, 500);
      }
    });
  };

  return (
    <Modal
      isVisible={isVisible}
      useNativeDriver={true}
      animationIn={'fadeIn'}
      animationOut={'fadeOut'}
      animationInTiming={500}
      animationOutTiming={500}
      onBackButtonPress={() => setvisibleModal(false)}
      onBackdropPress={() => setvisibleModal(false)}
      backdropOpacity={0.5}>
      <View style={styles.main}>
        <View style={styles.inner}>
          <Text variant="semibold16" style={styles.boldStyle}>
            Please enter your password to delete account.
          </Text>
          <CustomTextInput
            placeholder="Enter Password"
            value={password}
            onChangeText={t => {
              setPassword(t);
            }}
            style={{width: '100%'}}
          />
          <View style={{marginTop: nh(20)}}>
            <Button text={'Delete'} width={nw(310)} onPress={deleteAcc} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  main: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    height: nh(260),
    paddingHorizontal: nw(16),
    backgroundColor: 'white',
    borderRadius: nh(10),
    alignItems: 'center',
  },
  boldStyle: {
    color: COLORS.black333333,
    textAlign: 'center',
    marginTop: nh(20),
    marginBottom: nh(30),
  },
});

export default ConfirmDelete;
