import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    // Initial state properties
    userData: {},

};

const mySlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        // Reducer functions here
        setUserData(state, action) {
            state.userData = action.payload;
        },

        logout(state) {
            return initialState;
        }
    },
});

export const { actions, reducer } = mySlice;