import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import TodayView from "./components/TodayView";
import UpcomingView from "./components/UpcomingView";
import ListsView from "./components/ListsView";
import TaskList from "./components/TaskList";
import Navbar from "./components/Navbar";

function App() {
  const isAuthenticated = !!localStorage.getItem("token");

  return (
    <Router>
      {isAuthenticated && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/today" element={isAuthenticated ? <TodayView /> : <Navigate to="/login" />} />
        <Route path="/upcoming" element={isAuthenticated ? <UpcomingView /> : <Navigate to="/login" />} />
        <Route path="/lists" element={isAuthenticated ? <ListsView /> : <Navigate to="/login" />} />
        <Route path="/tasks" element={isAuthenticated ? <TaskList /> : <Navigate to="/login" />} />
        <Route path="*" element={<Navigate to={isAuthenticated ? "/today" : "/login"} />} />
      </Routes>
    </Router>
  );
}

export default App;
