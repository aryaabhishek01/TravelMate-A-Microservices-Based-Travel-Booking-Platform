import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  token: sessionStorage.getItem('token') || localStorage.getItem('token') || null,
  role: sessionStorage.getItem('role') || localStorage.getItem('role') || null,
  email: sessionStorage.getItem('email') || localStorage.getItem('email') || null,
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.role = action.payload.role;
      state.email = action.payload.email;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.role = null;
      state.email = null;
    },
  },
});

export const { setUser, setCredentials, logout } = userSlice.actions;

export default userSlice.reducer;
