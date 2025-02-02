import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Linking,
  StyleSheet,
  Image,
} from 'react-native';
import Modal from 'react-native-modal';
import {checkVersion} from 'react-native-check-version';
import DeviceInfo from 'react-native-device-info';
import packageDetail from '../../package.json';
import {isAndroid} from '../helper/scales';

const UpdatePopup = () => {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [updateUrl, setUpdateUrl] = useState('');

  useEffect(() => {
    checkForUpdate();
  }, []);

  const checkForUpdate = async () => {
    try {
      const versionInfo = await checkVersion({
        country: 'IN',
      });
      const latest = versionInfo?.version;
      const current = isAndroid
        ? DeviceInfo.getVersion() || packageDetail.version
        : packageDetail?.['IOS-version'];
      console.log(latest, ' nkdnsk', current);
      if (latest && latest != current) {
        setLatestVersion(latest);
        setUpdateUrl(versionInfo?.url);
        setUpdateAvailable(true);
      } else if (updateAvailable) {
        setUpdateAvailable(false);
      }
    } catch (error) {
      console.error('Error checking version:', error);
    }
  };

  const handleUpdate = () => {
    console.log('🚀 ~ handleUpdate ~ updateUrl:', updateUrl);

    if (updateUrl) {
      try {
        Linking.openURL(updateUrl);
      } catch (error) {
        console.log('🚀 ~ handleUpdate ~ error:', error);
      }
    }
  };

  return (
    <Modal
      isVisible={updateAvailable}
      animationIn="bounceIn"
      animationOut="fadeOut">
      <View style={styles.modalContainer}>
        <Image
          source={{
            uri: 'https://cdn-icons-png.flaticon.com/512/7111/7111965.png',
          }}
          style={styles.updateImage}
        />
        <Text style={styles.title}>Update Available!</Text>
        <Text style={styles.message}>
          A new version ({latestVersion}) of the app is available. Please update
          for the best experience.
        </Text>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
            <Text style={styles.updateText}>Update Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => setUpdateAvailable(false)}>
            <Text style={styles.cancelText}>Later</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  updateImage: {
    width: 80,
    height: 80,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    marginVertical: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  updateButton: {
    backgroundColor: '#4CAF50',
    padding: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  updateText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ddd',
    padding: 10,
    borderRadius: 10,
  },
  cancelText: {
    color: '#333',
    fontWeight: 'bold',
  },
});

export default UpdatePopup;
