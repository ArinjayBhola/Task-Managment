import { Provider } from "react-redux";
import { BrowserRouter, Route, Routes } from "react-router-dom";
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
  return (
    <>
      <BrowserRouter>
        <Provider store={appStore}>
          <Routes>
            <Route path="/" element={<Welcome />} />

            {/* Admin routes */}
            <Route path="admin-signin" element={<AdminSignin />} />
            <Route path="/admin-signup" element={<AdminSignup />} />
            <Route path="/users" element={<User />} />
            <Route path="/task/:id" element={<CreateNewTask />} />
            <Route path="/admin-edittask/:id" element={<AdminEditTask />} />
            <Route path="/user/:userId" element={<SingleUser />} />

            {/* User routes */}
            <Route path="/user-signin" element={<UserSignin />} />
            <Route path="/mytasks" element={<MyTask />} />
            <Route path="/usertasks" element={<AllUser />} />
            <Route path="/user-edittask/:id" element={<UserEditTask />} />
          </Routes>
        </Provider>
      </BrowserRouter>
    </>
  );
}

export default App;
