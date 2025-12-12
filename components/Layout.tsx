import React from 'react';
import { UserRole } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  userRole?: UserRole;
  onLogout: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, userRole, onLogout, darkMode, toggleDarkMode }) => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <header className="bg-white dark:bg-gray-800 shadow-md border-b border-gray-300 dark:border-gray-700 sticky top-0 z-10 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-indigo-800 dark:bg-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <span className="font-extrabold text-2xl text-gray-900 dark:text-white tracking-tight">CUÉNTAME</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Dark Mode Switch */}
            <button
              onClick={toggleDarkMode}
              className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                darkMode ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span className="sr-only">Toggle Dark Mode</span>
              <span
                className={`${
                  darkMode ? 'translate-x-8' : 'translate-x-1'
                } inline-block h-5 w-5 transform rounded-full bg-white transition-transform flex items-center justify-center`}
              >
                {darkMode ? (
                  <svg className="w-3 h-3 text-indigo-600" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" /></svg>
                ) : (
                  <svg className="w-3 h-3 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" /></svg>
                )}
              </span>
            </button>

            {userRole && (
              <>
                <span className="hidden sm:inline-block text-sm text-white font-bold px-4 py-1.5 bg-gray-800 dark:bg-gray-600 rounded-full shadow-sm">
                  {userRole === UserRole.ADMIN || userRole === UserRole.STAFF ? 'Panel Institucional' : 'Espacio Seguro'}
                </span>
                <button 
                  onClick={onLogout}
                  className="text-sm text-red-700 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-bold border border-red-200 dark:border-red-800 px-3 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                >
                  Salir
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;