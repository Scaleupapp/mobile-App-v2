import {reducer} from './reducers';
import {configureStore} from '@reduxjs/toolkit';

const reduxStore = configureStore({
  reducer: reducer,
});
export default reduxStore;
