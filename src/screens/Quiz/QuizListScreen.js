import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text as RNText, 
  FlatList, 
  Alert, 
  StyleSheet,
  TouchableOpacity 
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import moment from 'moment';
import { 
  listAllQuizEventsApi, 
  registerForQuizApi, 
  startQuizAttemptApi 
} from '../../services/apiService';
import { useToast } from '../../components/CustomToast';
import Icon from '../../helper/icon'; 
import { COLORS } from '../../helper/colors';
import { nh, nw } from '../../helper/scales';
import Routes from '../../helper/routes';

const QuizListScreen = ({ navigation }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [registeredQuizIds, setRegisteredQuizIds] = useState({});
  const [countdowns, setCountdowns] = useState({});
  const { showToast } = useToast();

  useEffect(() => {
    const loadRegistered = async () => {
      try {
        const stored = await AsyncStorage.getItem('registeredQuizIds');
        if (stored) setRegisteredQuizIds(JSON.parse(stored));
      } catch (err) {
        console.error('Error loading registered quizzes', err);
      }
    };
    loadRegistered();
    fetchQuizzes();
  }, []);

  useEffect(() => {
    const intervalId = setInterval(() => {
      updateCountdowns();
    }, 1000);
    return () => clearInterval(intervalId);
  }, [quizzes, registeredQuizIds]);

  const fetchQuizzes = async () => {
    try {
      const response = await listAllQuizEventsApi(1, 10);
      // Sort quizzes by startTime (earliest to latest)
      const sortedQuizzes = response.data.quizzes.sort(
        (a, b) => new Date(a.startTime) - new Date(b.startTime)
      );
      setQuizzes(sortedQuizzes);
    } catch (error) {
      showToast('Error fetching quizzes');
    }
  };

  const handleRegister = (quizId) => {
    Alert.alert(
      'Register',
      'Are you sure you want to register?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            try {
              await registerForQuizApi(quizId);
              setRegisteredQuizIds(prev => {
                const updated = { ...prev, [quizId]: true };
                AsyncStorage.setItem('registeredQuizIds', JSON.stringify(updated));
                return updated;
              });
              showToast('Registered successfully');
            } catch (error) {
              showToast('Registration failed');
            }
          } 
        },
      ],
      { cancelable: true }
    );
  };

  const updateCountdowns = () => {
    let updatedCountdowns = {};
    quizzes.forEach(quiz => {
      if (registeredQuizIds[quiz._id]) {
        let start = new Date(quiz.startTime).getTime();
        let now = new Date().getTime();
        let distance = start - now;
        console.log(`Quiz ID: ${quiz._id}, Start Time: ${quiz.startTime}, Distance: ${distance}`);
        if (distance > 0) {
          let days = Math.floor(distance / (1000 * 60 * 60 * 24));
          let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
          let seconds = Math.floor((distance % (1000 * 60)) / 1000);
          updatedCountdowns[quiz._id] = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        } else {
          updatedCountdowns[quiz._id] = 'Quiz started';
        }
      }
    });
    setCountdowns(updatedCountdowns);
  };

  const renderQuizItem = ({ item }) => {
    const isRegistered = registeredQuizIds[item._id];
    const countdown = countdowns[item._id] || 'Loading...';

    return (
      <View style={styles.card}>
        <View style={styles.header}>
          <Icon name="event" type="material" size={nw(24)} color={COLORS.blue043142} />
          <RNText style={styles.title}>{item.title}</RNText>
        </View>
        <RNText style={styles.description}>{item.description}</RNText>
        <RNText style={styles.info}>
          Start: {moment(item.startTime).format('LLL')}
        </RNText>
        <RNText style={styles.info}>
          End: {moment(item.endTime).format('LLL')}
        </RNText>
        {isRegistered ? (
          <>
            <RNText style={styles.registeredText}>
              Registered - Starts in: {countdown}
            </RNText>
            {countdown === 'Quiz started' && (
              <TouchableOpacity 
                style={[styles.registerButton, { marginTop: nh(4) }]} 
                onPress={async () => {
                  try {
                    const response = await startQuizAttemptApi(item._id);
                    const { attemptId } = response.data;
                    navigation.navigate(Routes.QuizScreen, { quizId: item._id, attemptId });
                  } catch (error) {
                    showToast('Error starting quiz');
                  }
                }}>
                <RNText style={styles.registerButtonText}>Start Quiz</RNText>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={() => handleRegister(item._id)}>
            <RNText style={styles.registerButtonText}>Register</RNText>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={quizzes}
        keyExtractor={(item) => item._id}
        renderItem={renderQuizItem}
      />
    </View>
  );
};

export default QuizListScreen;

const styles = StyleSheet.create({
  container: { flex: 1, padding: nw(16), backgroundColor: COLORS.whiteFFFFFF },
  card: { 
    padding: nw(12), 
    marginVertical: nh(4), 
    backgroundColor: '#fff', 
    borderRadius: nw(6), 
    shadowColor: '#000', 
    shadowOpacity: 0.1, 
    shadowRadius: nw(4),
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: nh(4),
  },
  title: { 
    fontSize: nw(16), 
    fontWeight: 'bold', 
    marginLeft: nw(6),
    color: COLORS.blue043142,
  },
  description: {
    fontSize: nw(12),
    color: COLORS.grey777777,
    marginBottom: nh(4),
  },
  info: {
    fontSize: nw(10),
    color: COLORS.grey777777,
  },
  registeredText: {
    marginTop: nh(4),
    color: COLORS.green00A000,
    fontSize: nw(12),
    fontWeight: 'bold',
  },
  registerButton: {
    marginTop: nh(4),
    backgroundColor: COLORS.blue043142,
    paddingVertical: nh(6),
    paddingHorizontal: nw(12),
    borderRadius: nw(4),
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#fff',
    fontSize: nw(12),
    fontWeight: 'bold',
  },
});
