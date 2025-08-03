import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Menu, User, Moon, Sun, LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const Header = ({ onToggleSidebar, sidebarOpen }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, autoTheme, toggleTheme, resetToAutoTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const themeMenuRef = useRef(null);

  // Debug: Log authentication state changes
  useEffect(() => {
    console.log('Header - Auth state changed:', { isAuthenticated, user: user?.username });
  }, [isAuthenticated, user]);

  // Close theme menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target)) {
        setShowThemeMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false); // Hide mobile search after searching
    }
  };

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 z-30">
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 h-14 sm:h-16">
          {/* Left section */}
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-youtube-red rounded flex items-center justify-center">
                <span className="text-white font-bold text-xs sm:text-sm">YT</span>
              </div>
              <span className="font-bold text-lg sm:text-xl hidden xs:block">YouTube</span>
            </Link>
          </div>

          {/* Center section - Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-4">
            <form onSubmit={handleSearch} className="flex w-full">
              <div className="flex flex-1">
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-full focus:outline-none focus:border-youtube-red bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-1 sm:space-x-2">
            {/* Mobile search button */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Theme toggle with dropdown */}
            <div className="relative" ref={themeMenuRef}>
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center space-x-1"
                title="Theme options"
                aria-label="Theme options"
              >
                {theme === 'light' ? (
                  <Sun className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Moon className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
                {autoTheme && autoTheme !== theme && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>

              {showThemeMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                  <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Theme Settings</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Current: {theme}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowThemeMenu(false);
                    }}
                    className="flex items-center space-x-2 w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    <span>Switch to {theme === 'light' ? 'Dark' : 'Light'}</span>
                  </button>

                  {autoTheme && resetToAutoTheme && (
                    <button
                      onClick={() => {
                        resetToAutoTheme();
                        setShowThemeMenu(false);
                      }}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-blue-600 dark:text-blue-400"
                    >
                      <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500"></div>
                      <span>Auto (Location & Time)</span>
                    </button>
                  )}
                  
                  <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      🌍 Auto theme: Light for 10 AM-12 PM or South India
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      ⏰ Dark theme for other times/locations
                    </p>
                  </div>
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="User menu"
                >
                  {user?.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.username}
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-400 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  )}
                  <span className="hidden lg:block font-medium text-sm sm:text-base max-w-[100px] truncate">
                    {user?.username}
                  </span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2">
                    <Link
                      to={`/profile/${user?.id}`}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-red-600 dark:text-red-400"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-1 sm:space-x-2">
                <Link
                  to="/login"
                  className="px-2 py-1 sm:px-4 sm:py-2 text-xs sm:text-sm text-youtube-red border border-youtube-red rounded-lg hover:bg-youtube-red hover:text-white transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Search Overlay */}
      {showMobileSearch && (
        <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 md:hidden">
          <div className="flex items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setShowMobileSearch(false)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors mr-4"
              aria-label="Close search"
            >
              <X className="w-6 h-6" />
            </button>
            
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search YouTube"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-l-full focus:outline-none focus:border-youtube-red bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-100 dark:bg-gray-700 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  aria-label="Search"
                >
                  <Search className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
