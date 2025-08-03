import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  TrendingUp, 
  Users, 
  Music, 
  Film, 
  Gamepad2, 
  Newspaper, 
  Trophy, 
  Lightbulb,
  Settings,
  Clock,
  ThumbsUp,
  PlaySquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (path) => location.pathname === path;

  const sidebarItems = [
    // Main
    { icon: Home, label: 'Home', path: '/' },
    { icon: TrendingUp, label: 'Trending', path: '/trending' },
    
    // Authenticated user items
    ...(isAuthenticated ? [
      { icon: Users, label: 'Groups', path: '/groups' },
      { icon: Clock, label: 'Watch Later', path: '/watch-later' },
      { icon: ThumbsUp, label: 'Liked Videos', path: '/liked' },
    ] : []),
    
    // Categories
    { type: 'divider' },
    { type: 'title', label: 'Explore' },
    { icon: Music, label: 'Music', path: '/category/music' },
    { icon: Film, label: 'Movies', path: '/category/movies' },
    { icon: Gamepad2, label: 'Gaming', path: '/category/gaming' },
    { icon: Newspaper, label: 'News', path: '/category/news' },
    { icon: Trophy, label: 'Sports', path: '/category/sports' },
    { icon: Lightbulb, label: 'Learning', path: '/category/education' },
    
    // Footer items
    { type: 'divider' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const SidebarItem = ({ item }) => {
    if (item.type === 'divider') {
      return <div className="border-t border-gray-200 dark:border-gray-700 my-3" />;
    }

    if (item.type === 'title') {
      return (
        <div className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {item.label}
        </div>
      );
    }

    const Icon = item.icon;
    const active = isActive(item.path);

    return (
      <Link
        to={item.path}
        onClick={onClose}
        className={`sidebar-item ${active ? 'active' : ''}`}
      >
        <Icon className="w-6 h-6 flex-shrink-0" />
        <span className="truncate">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 overflow-y-auto">
        <nav className="p-3 space-y-1">
          {sidebarItems.map((item, index) => (
            <SidebarItem key={index} item={item} />
          ))}
        </nav>
      </aside>

      {/* Mobile Sidebar */}
      <aside 
        className={`lg:hidden fixed left-0 top-14 sm:top-16 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 z-40 overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="p-3 space-y-1">
          {sidebarItems.map((item, index) => (
            <SidebarItem key={index} item={item} />
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
