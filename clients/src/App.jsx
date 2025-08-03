import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTheme } from './contexts/ThemeContext';

// Components
import Header from './components/Layout/Header';
import Sidebar from './components/Layout/Sidebar';
import LoadingSpinner from './components/Common/LoadingSpinner';

// Pages
import Home from './pages/Home';
import Watch from './pages/Watch';
import Search from './pages/Search';
import Groups from './pages/Groups';
import GroupDetail from './pages/GroupDetail';
import GroupManagement from './pages/GroupManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

// Protected Route Component
import ProtectedRoute from './components/Common/ProtectedRoute';

function App() {
  const { loading: authLoading } = useAuth();
  const { loading: themeLoading } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (authLoading || themeLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header 
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        sidebarOpen={sidebarOpen}
      />
      
      <div className="flex">
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
        
        <main className="flex-1 lg:ml-64 transition-all duration-300">
          <div className="pt-14 sm:pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/watch/:videoId" element={<Watch />} />
              <Route path="/search" element={<Search />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route 
                path="/groups" 
                element={
                  <ProtectedRoute>
                    <Groups />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/groups/:groupId" 
                element={
                  <ProtectedRoute>
                    <GroupDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/groups/:groupId/manage" 
                element={
                  <ProtectedRoute>
                    <GroupManagement />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/:userId" 
                element={<Profile />} 
              />
            </Routes>
          </div>
        </main>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
