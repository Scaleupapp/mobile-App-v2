import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
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
        headerShown: false, // This removes all headers from the stack
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

export default QuizNavigator;