import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  useColorScheme,
  Image,
} from 'react-native';
import {useTheme} from '@react-navigation/native';
import {COLORS} from '../../helper/colors';
import {icons} from '../../assets/icons';
import {nh, nw} from '../../helper/scales';
import Icon from '../../helper/icon';
import {submitquery} from '../../services/apiService';
import {navigationRef} from '../../../App';
import Header from '../../components/Header';
import {APP_FONTS} from '../../assets/fonts';

const SupportQueryScreen = () => {
  const {colors} = useTheme();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const submitQuery = async () => {
    if (!query.trim()) {
      Alert.alert('Validation', 'Please enter your query.');
      return;
    }

    setLoading(true);
    try {
      // Replace with actual API call
      const response = await submitquery({query});
      setQuery('');
      navigationRef.navigate('MyQueriesScreen');
      console.log('🚀 ~ submitQuery ~ response:', response?.data);
    } catch (error) {
      //   Alert.alert('Network Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>
      <Header
        title="Help & Support"
        // backIcon={icons.backArrow} // Provide your back arrow icon
        rightIcon={false} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      <Text
        onPress={() => navigationRef.navigate('MyQueriesScreen')}
        style={{
          color: COLORS.blue043142,
          fontFamily: APP_FONTS.PoppinsBold,
          // alignItems: 'flex-end',
          // flex:1,
          marginTop: 20,
          textAlign: 'right',
          marginHorizontal: 20,
          textDecorationLine: 'underline',
          // justifyContent: 'flex-end',
        }}>
        My Queries
      </Text>

      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: isDarkMode ? '#1c1c1e' : '#f0f0f0',
            color: colors.text,
            borderColor: isDarkMode ? '#444' : '#ccc',
          },
        ]}
        placeholder="Write your query here..."
        placeholderTextColor={isDarkMode ? '#aaa' : '#666'}
        value={query}
        onChangeText={setQuery}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#007bff"
          style={{marginTop: 24}}
        />
      ) : (
        <TouchableOpacity
          style={[styles.button, {backgroundColor: COLORS.blue043142}]}
          onPress={submitQuery}>
          <Text style={styles.buttonText}>Submit</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    // textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    height: 150,
    marginHorizontal: 16,
    marginTop: 30,
  },
  button: {
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 16,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default SupportQueryScreen;
