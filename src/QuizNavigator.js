import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { useNavigation } from '@react-navigation/native';
import QuizList from './screens/Quiz/QuizList';
import QuizDetails from './screens/Quiz/QuizDetails';
import QuizWaitingRoom from './screens/Quiz/QuizWaitingRoom';
import QuizGame from './screens/Quiz/QuizGame';
import QuizResults from './screens/Quiz/QuizResults';

const Stack = createStackNavigator();

// Custom header component that matches the design in the image
const CustomHeader = ({ title, showBack = true, disableBack = false }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerContent}>
        {showBack && !disableBack && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.rightPlaceholder} />
      </View>
    </View>
  );
};

const QuizNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: ({ route, navigation }) => {
          // Determine if we should disable the back button
          const disableBack = route.name === 'QuizWaitingRoom' || 
                            route.name === 'QuizGame' || 
                            route.name === 'QuizResults';

          // Set the header title based on the route
          let title = 'Upcoming Quizzes';
          switch (route.name) {
            case 'QuizDetails':
              title = 'Quiz Details';
              break;
            case 'QuizWaitingRoom':
              title = 'Waiting Room';
              break;
            case 'QuizGame':
              title = 'Quiz';
              break;
            case 'QuizResults':
              title = 'Results';
              break;
          }

          return (
            <CustomHeader 
              title={title}
              showBack={route.name !== 'QuizList'}
              disableBack={disableBack}
            />
          );
        },
        headerStyle: {
          elevation: 0, // Remove shadow on Android
          shadowOpacity: 0, // Remove shadow on iOS
        },
        gestureEnabled: false, // Disable gesture-based navigation globally
      }}
    >
      <Stack.Screen 
        name="QuizList" 
        component={QuizList}
      />
      <Stack.Screen 
        name="QuizDetails" 
        component={QuizDetails}
      />
      <Stack.Screen 
        name="QuizWaitingRoom" 
        component={QuizWaitingRoom}
      />
      <Stack.Screen 
        name="QuizGame" 
        component={QuizGame}
      />
      <Stack.Screen 
        name="QuizResults" 
        component={QuizResults}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#F5BE00', // Yellow background color as shown in the image
    paddingTop: 10, // Space for status bar
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 56,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backArrow: {
    fontSize: 24,
    color: '#000000',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    flex: 1,
    textAlign: 'center',
    marginLeft: 8,
  },
  rightPlaceholder: {
    width: 40, // Same width as back button for balance
  }
});

export default QuizNavigator;