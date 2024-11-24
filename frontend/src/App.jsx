import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminEditTask from "./pages/Admin/AdminEditTask";
import AdminSignin from "./pages/Admin/AdminSignin";
import AdminSignup from "./pages/Admin/AdminSignup";
import CreateNewTask from "./pages/Admin/CreateNewTask";
import SingleUser from "./pages/Admin/SingleUser";
import User from "./pages/Admin/User";
import AllUser from "./pages/User/AllUser";
import MyTask from "./pages/User/MyTask";
import UserEditTask from "./pages/User/UserEditTask";
import UserSignin from "./pages/User/UserSignin";
import Welcome from "./pages/Welcome";
import appStore from "./redux/appStore";

function App() {
  const location = useLocation();
  const noHeaderRoutes = [
    "/admin-signin",
    "/admin-signup",
    "/user-signin",
    "/",
  ];

  return (
    <Provider store={appStore}>
      {!noHeaderRoutes.includes(location.pathname) && <Header />}
      <Routes>
        <Route path="/" element={<Welcome />} />

        <Route path="/admin-signin" element={<AdminSignin />} />
        <Route path="/admin-signup" element={<AdminSignup />} />
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <User />
            </ProtectedRoute>
          }
        />
        <Route
          path="/task/:id"
          element={
            <ProtectedRoute>
              <CreateNewTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-edittask/:id"
          element={
            <ProtectedRoute>
              <AdminEditTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/:userId"
          element={
            <ProtectedRoute>
              <SingleUser />
            </ProtectedRoute>
          }
        />

        <Route path="/user-signin" element={<UserSignin />} />
        <Route
          path="/mytasks"
          element={
            <ProtectedRoute>
              <MyTask />
            </ProtectedRoute>
          }
        />
        <Route
          path="/usertasks"
          element={
            <ProtectedRoute>
              <AllUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-edittask/:id"
          element={
            <ProtectedRoute>
              <UserEditTask />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Provider>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

export default AppWrapper;
