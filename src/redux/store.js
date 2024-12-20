import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { reducer as authReducer } from './reducers';

const rootReducer = combineReducers({
  auth: authReducer,
});

const reduxStore = configureStore({
  reducer: rootReducer,
});

export default reduxStore;
