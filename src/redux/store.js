import { reducer as authReducer } from './reducers';
import { configureStore } from '@reduxjs/toolkit';

const reduxStore = configureStore({
  reducer: {
    auth: authReducer, // Nest the reducer under 'auth'
  },
});

export default reduxStore;
