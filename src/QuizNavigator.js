// navigation/QuizNavigator.js
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
// import QuizList from '../screens/Quiz/QuizList';
import QuizList from './screens/Quiz/QuizList';
import QuizDetails from './screens/Quiz/QuizDetails';
import QuizWaitingRoom from './screens/Quiz/QuizWaitingRoom';
import QuizGame from './screens/Quiz/QuizGame';
import QuizResults from './screens/Quiz/QuizResults';

const Stack = createStackNavigator();

const QuizNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: '#2196F3',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '500',
        },
      }}
    >
      <Stack.Screen 
        name="QuizList" 
        component={QuizList} 
        options={{ title: 'Available Quizzes' }}
      />
      <Stack.Screen 
        name="QuizDetails" 
        component={QuizDetails}
        options={{ title: 'Quiz Details' }}
      />
      <Stack.Screen 
        name="QuizWaitingRoom" 
        component={QuizWaitingRoom}
        options={{ 
          title: 'Waiting Room',
          headerLeft: null // Prevent going back once in waiting room
        }}
      />
      <Stack.Screen 
        name="QuizGame" 
        component={QuizGame}
        options={{ 
          title: 'Quiz',
          headerLeft: null, // Prevent going back during quiz
          gestureEnabled: false // Disable gesture-based navigation
        }}
      />
      <Stack.Screen 
        name="QuizResults" 
        component={QuizResults}
        options={{ 
          title: 'Results',
          headerLeft: null // Prevent going back from results
        }}
      />
    </Stack.Navigator>
  );
};

export default QuizNavigator;