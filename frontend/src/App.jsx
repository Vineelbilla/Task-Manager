import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";
import Dashboard from "./pages/Dashboard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import Signup from "./pages/Signup";
import Tasks from "./pages/Tasks";

const App = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/tasks" element={<Tasks />} />
      </Route>
      <Route path="/" element={user ? <Navigate replace to="/dashboard" /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate replace to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate replace to="/dashboard" /> : <Signup />} />
      <Route path="*" element={<Navigate replace to={user ? "/dashboard" : "/"} />} />
    </Routes>
  );
};

export default App;
