import { createSlice } from "@reduxjs/toolkit";

const createUserSlice = createSlice({
  name: "createUser",
  initialState: false,
  reducers: {
    toggleCreateUser: (state) => !state,
  },
});

export const { toggleCreateUser } = createUserSlice.actions;
export default createUserSlice.reducer;
