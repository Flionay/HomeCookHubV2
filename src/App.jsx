import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Recipes from './pages/Recipes';
import AIChef from './pages/AIChef';
import Settings from './pages/Settings';
import Login from './pages/Login';

const AppRoutes = () => {
  const { session, loading } = useApp();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#faf9f6]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
      
      <Route path="/" element={session ? <Layout><Dashboard /></Layout> : <Navigate to="/login" />} />
      <Route path="/inventory" element={session ? <Layout><Inventory /></Layout> : <Navigate to="/login" />} />
      <Route path="/recipes" element={session ? <Layout><Recipes /></Layout> : <Navigate to="/login" />} />
      <Route path="/ai-chef" element={session ? <Layout><AIChef /></Layout> : <Navigate to="/login" />} />
      <Route path="/settings" element={session ? <Layout><Settings /></Layout> : <Navigate to="/login" />} />
    </Routes>
  );
};

function App() {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
}

export default App;
