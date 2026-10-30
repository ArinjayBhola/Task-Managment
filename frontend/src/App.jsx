import { Provider } from "react-redux";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminSignin from "./pages/Admin/AdminSignin";
import AdminSignup from "./pages/Admin/AdminSignup";
import SingleUser from "./pages/Admin/SingleUser";
import User from "./pages/Admin/User";
import AllUser from "./pages/User/AllUser";
import MyTask from "./pages/User/MyTask";
import UserSignin from "./pages/User/UserSignin";
import Welcome from "./pages/Welcome";
import appStore from "./redux/appStore";
import DesignTheme from "./components/DesignTheme";
import AuthProvider from "./components/AuthProvider";
import TaskAssignments from "./pages/Admin/TaskAssignments";
import HomeShimmer from "./components/HomeShimmer";

const AdminEditTask = lazy(() => import("./pages/Admin/AdminEditTask"));
const CreateNewTask = lazy(() => import("./pages/Admin/CreateNewTask"));
const UserEditTask = lazy(() => import("./pages/User/UserEditTask"));

function App() {
  const location = useLocation();
  const noHeaderRoutes = [
    "/admin-signin",
    "/admin-signup",
    "/user-signin",
    "/",
  ];
  const Content = noHeaderRoutes.includes(location.pathname) ? "div" : "main";

  return (
    <Provider store={appStore}>
      <div
        className={
          noHeaderRoutes.includes(location.pathname)
            ? ""
            : "min-h-screen lg:pl-60"
        }
      >
        {!noHeaderRoutes.includes(location.pathname) && <Header />}
        <Content id="workspace-content">
          <Suspense
            fallback={
              <div className="page-wrap">
                <HomeShimmer />
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Welcome />} />

              <Route path="/admin-signin" element={<AdminSignin />} />
              <Route path="/admin-signup" element={<AdminSignup />} />
              <Route
                path="/users"
                element={
                  <ProtectedRoute role="Admin">
                    <User />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/tasks"
                element={
                  <ProtectedRoute role="Admin">
                    <TaskAssignments />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/task/:id"
                element={
                  <ProtectedRoute role="Admin">
                    <CreateNewTask />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-edittask/:id"
                element={
                  <ProtectedRoute role="Admin">
                    <AdminEditTask />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user/:userId"
                element={
                  <ProtectedRoute role="Admin">
                    <SingleUser />
                  </ProtectedRoute>
                }
              />

              <Route path="/user-signin" element={<UserSignin />} />
              <Route
                path="/mytasks"
                element={
                  <ProtectedRoute role="User">
                    <MyTask />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/usertasks"
                element={
                  <ProtectedRoute role="User">
                    <AllUser />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-edittask/:id"
                element={
                  <ProtectedRoute role="User">
                    <UserEditTask />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Suspense>
        </Content>
      </div>
    </Provider>
  );
}

function AppWrapper() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DesignTheme>
          <App />
        </DesignTheme>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default AppWrapper;
