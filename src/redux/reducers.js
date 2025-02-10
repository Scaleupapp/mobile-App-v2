import {createSlice} from '@reduxjs/toolkit';

const initialState = {
  // Initial state properties
  userData: {},
  groupData: {},
};

const mySlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Reducer functions here
    setUserData(state, action) {
      state.userData = action.payload;
    },
    setGroupData(state, action) {
      state.groupData = action.payload;
    },
    logout(state) {
      return initialState;
    },
  },
});

export const {actions, reducer} = mySlice;
