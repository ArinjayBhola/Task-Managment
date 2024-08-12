import { configureStore } from "@reduxjs/toolkit";
import createUserSlice from "./slice/createUserSlice";

const appStore = configureStore({
  reducer: {
    createUser: createUserSlice,
  },
});

export default appStore;
