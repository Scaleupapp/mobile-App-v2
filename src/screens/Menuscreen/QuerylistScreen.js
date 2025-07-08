import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {useAppSelector} from '../../redux/store';
import axios from 'axios';
import axiosInstance from '../../services/axiosinstance';
import Header from '../../components/Header';

const MyQueriesScreen = () => {
  const [query, setQuery] = useState('');
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQueries();
  }, []);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        'https://api.scaleupapp.club/api/users/get-query',
      );
      setQueries(res.data.queries.reverse());
      console.log(res.data, 'dbdhhdhdhdhh');
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const submitQuery = async () => {
    if (!query.trim()) return;
    setSubmitting(true);
    try {
      await axios.post(
        'https://api.scaleupapp.club/api/users/get-query',
        {query},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      setQuery('');
      fetchQueries();
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Image
          source={{uri: item.user?.profilePicture}}
          style={styles.avatar}
        />
        <View>
          <Text style={styles.username}>
            {item.user?.firstname} {item.user?.lastname}
          </Text>
          <Text style={styles.badge}>{item.user?.badges?.[0]}</Text>
        </View>
      </View>
      <Text style={styles.queryText}>{item.query}</Text>
      <Text
        style={[
          styles.status,
          {
            color: item.status === 'resolved' ? 'green' : 'orange',
          },
        ]}>
        Status: {item.status}
      </Text>
      {item.response && (
        <Text style={styles.response}>Response: {item.response}</Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* <Text style={[styles.title, {marginTop: 20}]}>Your Previous Queries</Text> */}
      <Header
        title="Your Queries"
        // backIcon={icons.backArrow} // Provide your back arrow icon
        rightIcon={false} // Provide your right icon
        // onBackPress={handleBackPress}
        // onRightIconPress={handleRightIconPress}
      />
      <FlatList
        data={queries}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{paddingBottom: 50, marginTop: 20}}
      />
    </KeyboardAvoidingView>
  );
};

export default MyQueriesScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#222',
  },
  input: {
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4a90e2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  card: {
    padding: 16,
    borderRadius: 10,
    backgroundColor: 'white',

    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    marginHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  badge: {
    fontSize: 14,
    color: '#888',
  },
  queryText: {
    fontSize: 15,
    marginVertical: 8,
    color: '#333',
  },
  status: {
    fontWeight: 'bold',
  },
  response: {
    marginTop: 5,
    color: 'green',
    fontStyle: 'italic',
  },
});
