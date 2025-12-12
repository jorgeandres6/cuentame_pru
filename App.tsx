
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import ChatInterface from './components/ChatInterface';
import Dashboard from './components/Dashboard';
import CaseDetail from './components/CaseDetail';
import { UserRole, UserProfile, ConflictCase, RiskLevel } from './types';
import { saveUserProfile, getCases, loginUserByCredentials, replyToNotification } from './services/storageService';

// Updated Auth Screen: Code & Password only
const AuthScreen = ({ onLogin }: { onLogin: (u: UserProfile) => void }) => {
  const [formData, setFormData] = useState({ code: '', password: '' });
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const user = loginUserByCredentials(formData.code, formData.password);
    
    if (user) {
      onLogin(user);
    } else {
      setError('Credenciales inválidas. Verifica tu código único y contraseña.');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl mt-12 border border-gray-300 dark:border-gray-700 transition-colors duration-200">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-indigo-700 dark:bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-indigo-100 dark:border-indigo-900">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Acceso Seguro</h2>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">Ingresa con las credenciales anónimas proporcionadas por la institución.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Código Único de Identificación</label>
          <div className="relative rounded-md shadow-sm">
            <input 
              required 
              type="text" 
              placeholder="Ej. EST-2024-A"
              className="block w-full rounded-lg border-2 border-gray-600 dark:border-gray-600 bg-gray-800 dark:bg-gray-700 p-3.5 focus:border-indigo-500 focus:ring-0 text-white placeholder-gray-400 font-bold tracking-wider sm:text-sm uppercase"
              value={formData.code}
              onChange={e => setFormData({...formData, code: e.target.value})} 
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
          <div className="relative rounded-md shadow-sm">
            <input 
              required 
              type="password" 
              placeholder="••••••••"
              className="block w-full rounded-lg border-2 border-gray-600 dark:border-gray-600 bg-gray-800 dark:bg-gray-700 p-3.5 focus:border-indigo-500 focus:ring-0 text-white placeholder-gray-400 font-bold sm:text-sm"
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})} 
            />
          </div>
        </div>

        {error && (
          <div className="text-sm font-bold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 p-4 rounded-lg border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        <button type="submit" className="w-full bg-indigo-700 hover:bg-indigo-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white py-3.5 rounded-lg font-bold transition shadow-lg text-base tracking-wide border border-indigo-900 dark:border-indigo-800">
          Ingresar al Sistema
        </button>
      </form>

      <div className="mt-8 bg-gray-100 dark:bg-gray-700/50 p-5 rounded-lg text-xs text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600">
        <p className="font-bold mb-2 text-gray-800 dark:text-gray-200 uppercase tracking-wide">Usuarios de Prueba (Demo):</p>
        <ul className="list-disc list-inside space-y-1 font-medium">
          <li>Estudiante: <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-white font-bold">EST-2024-A</span> / <span className="font-mono text-gray-900 dark:text-white">123</span></li>
          <li>Padre: <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-white font-bold">FAM-2024-B</span> / <span className="font-mono text-gray-900 dark:text-white">123</span></li>
          <li>Docente: <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-white font-bold">DOC-2024-C</span> / <span className="font-mono text-gray-900 dark:text-white">123</span></li>
          <li>Admin: <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-white font-bold">ADM-MASTER</span> / <span className="font-mono text-gray-900 dark:text-white">admin</span></li>
          <li>DECE: <span className="font-mono bg-gray-200 dark:bg-gray-600 px-1 rounded text-gray-900 dark:text-white font-bold">STAFF-PSI</span> / <span className="font-mono text-gray-900 dark:text-white">staff</span></li>
        </ul>
      </div>
    </div>
  );
};

// Sub-component for individual notification card to handle reply state locally
const NotificationCard: React.FC<{ 
    note: any; 
    userCode: string; 
    onReplied: (updatedUser: UserProfile) => void 
}> = ({ note, userCode, onReplied }) => {
    const [replyText, setReplyText] = useState('');
    
    const handleReply = () => {
        if (!replyText.trim()) return;
        const updatedUser = replyToNotification(userCode, note.id, replyText);
        if (updatedUser) {
            onReplied(updatedUser);
        }
    };

    return (
        <div className="group bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all duration-200 relative overflow-hidden">
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${note.read ? 'bg-gray-300 dark:bg-gray-600' : 'bg-yellow-500'}`}></div>
            <div className="flex justify-between items-start mb-2 pl-2">
                <h4 className={`text-base ${note.read ? 'font-semibold text-gray-700 dark:text-gray-300' : 'font-bold text-gray-900 dark:text-white'}`}>{note.title}</h4>
                <span className="text-xs font-medium text-gray-400 whitespace-nowrap ml-2">{new Date(note.date).toLocaleDateString()} {new Date(note.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 pl-2 leading-relaxed mb-3">{note.message}</p>
            
            {/* Action Area */}
            {note.type === 'REQUEST' && (
                <div className="pl-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    {note.reply ? (
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-100 dark:border-green-800">
                            <p className="text-xs font-bold text-green-700 dark:text-green-400 mb-1">Respondiste el {new Date(note.replyDate).toLocaleDateString()}:</p>
                            <p className="text-sm text-gray-800 dark:text-gray-200">{note.reply}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase">Se requiere tu respuesta:</p>
                            <textarea 
                                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                placeholder="Escribe tu respuesta aquí..."
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                            />
                            <button 
                                onClick={handleReply}
                                disabled={!replyText.trim()}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Enviar Respuesta
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Componente para la vista del Usuario (Tabs)
const UserView: React.FC<{ 
    user: UserProfile; 
    viewState: 'HOME' | 'CHAT_SUCCESS'; 
    onCaseSubmitted: (c: ConflictCase) => void; 
    onReset: () => void 
}> = ({ user, viewState, onCaseSubmitted, onReset }) => {
    const [activeTab, setActiveTab] = useState<'CHAT' | 'NOTIFICATIONS'>('CHAT');
    // We need local state for the user to reflect updates (replies) immediately without full app reload
    const [localUser, setLocalUser] = useState<UserProfile>(user);

    useEffect(() => {
        setLocalUser(user);
    }, [user]);

    const handleUserUpdate = (updatedUser: UserProfile) => {
        setLocalUser(updatedUser);
    };
    
    // Count unread notifications (simple length check for demo)
    const notificationCount = localUser.notifications?.filter(n => !n.read).length || 0;

    if (viewState === 'CHAT_SUCCESS') {
         return (
          <div className="max-w-lg mx-auto text-center bg-white dark:bg-gray-800 p-12 rounded-2xl shadow-xl mt-12 border-2 border-emerald-500 transition-colors duration-200">
            <div className="w-24 h-24 bg-emerald-100 dark:bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
              <svg className="w-12 h-12 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">Reporte Registrado</h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 font-medium">
              El sistema ha encriptado tu reporte y activado el protocolo correspondiente. 
              El caso será analizado por las instancias apropiadas para su solución.
              <br/><br/>
              <strong>Por favor, revisa periódicamente tu "Buzón de Notificaciones" en la pestaña superior para dar seguimiento.</strong>
            </p>
            <button 
                onClick={() => {
                    onReset();
                    setActiveTab('NOTIFICATIONS');
                }} 
                className="text-indigo-700 dark:text-indigo-400 font-bold hover:underline hover:text-indigo-900 dark:hover:text-indigo-300 text-lg"
            >
                Ir a mis Notificaciones
            </button>
          </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto">
            {/* Header Greeting */}
             <div className="mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">Hola,</h2>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">Bienvenido a tu espacio seguro.</p>
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-xl mb-6">
                <button
                    onClick={() => setActiveTab('CHAT')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 flex justify-center items-center gap-2 ${
                        activeTab === 'CHAT'
                        ? 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Nuevo Reporte
                </button>
                <button
                    onClick={() => setActiveTab('NOTIFICATIONS')}
                    className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-bold transition-all duration-200 flex justify-center items-center gap-2 ${
                        activeTab === 'NOTIFICATIONS'
                        ? 'bg-white dark:bg-gray-800 text-indigo-700 dark:text-indigo-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'
                    }`}
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    Notificaciones
                    {notificationCount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center">
                            {notificationCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Content Area */}
            <div className="transition-opacity duration-300">
                {activeTab === 'CHAT' && (
                    <div className="space-y-6">
                        {/* Identity Protection Banner */}
                        <div className="bg-white dark:bg-gray-800 border-l-8 border-indigo-600 shadow-md rounded-r-lg p-6 transition-colors duration-200">
                            <div className="flex items-center gap-4 mb-3">
                            <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                                <svg className="w-8 h-8 text-indigo-700 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tu Identidad está Protegida</h3>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mt-1">Sesión iniciada como: <span className="font-mono font-bold bg-gray-900 dark:bg-black text-white px-3 py-1 rounded tracking-wider">{localUser.encryptedCode}</span></p>
                            </div>
                            </div>
                            <p className="text-base text-gray-700 dark:text-gray-300 font-medium ml-14 leading-relaxed">
                            Este chat es seguro. La información personal se almacena separada de tu reporte para garantizar el anonimato durante el proceso de gestión.
                            </p>
                        </div>

                        {/* Chat Interface */}
                        <ChatInterface user={localUser} onCaseSubmitted={onCaseSubmitted} />
                    </div>
                )}

                {activeTab === 'NOTIFICATIONS' && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 min-h-[400px]">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Buzón de Mensajes</h3>
                            <button className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 uppercase">Marcar todo como leído</button>
                        </div>
                        
                        <div className="space-y-4">
                        {localUser.notifications?.length > 0 ? (
                            localUser.notifications?.map((note) => (
                                <NotificationCard 
                                    key={note.id} 
                                    note={note} 
                                    userCode={localUser.encryptedCode}
                                    onReplied={handleUserUpdate}
                                />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">Todo está tranquilo por aquí.</p>
                                <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">No tienes notificaciones pendientes.</p>
                            </div>
                        )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [selectedCase, setSelectedCase] = useState<ConflictCase | null>(null);
  const [viewState, setViewState] = useState<'HOME' | 'CHAT_SUCCESS'>('HOME');
  
  // Theme state
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Refresh mechanism for dashboard
  const [refreshTrigger, setRefreshTrigger] = useState(0); 
  const allCases = useMemo(() => getCases(), [refreshTrigger, viewState]);

  // Derived state to ensure CaseDetail gets the latest version of the object
  // when local storage is updated (triggered by onUpdate -> setRefreshTrigger)
  const activeCase = useMemo(() => {
    if (!selectedCase) return null;
    return allCases.find(c => c.id === selectedCase.id) || selectedCase;
  }, [selectedCase, allCases]);

  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedCase(null);
    setViewState('HOME');
  };

  const handleCaseSubmitted = (newCase: ConflictCase) => {
    setViewState('CHAT_SUCCESS');
  };

  if (!currentUser) {
    return (
      <Layout onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
        <div className="text-center mb-8 mt-4">
            <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
              <span className="text-indigo-800 dark:text-indigo-400">CUÉNTAME</span>
            </h1>
            <p className="text-xl font-medium text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Plataforma de Gestión Integral de Conflictos Escolares
            </p>
        </div>
        <AuthScreen onLogin={setCurrentUser} />
      </Layout>
    );
  }

  // View for Student/Parent/Teacher (Reporters)
  if (currentUser.role === UserRole.STUDENT || currentUser.role === UserRole.PARENT || currentUser.role === UserRole.TEACHER) {
    return (
      <Layout userRole={currentUser.role} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
        <UserView 
            user={currentUser} 
            viewState={viewState} 
            onCaseSubmitted={handleCaseSubmitted}
            onReset={() => setViewState('HOME')}
        />
      </Layout>
    );
  }

  // View for Admin/Staff (Dashboard)
  return (
    <Layout userRole={currentUser.role} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)}>
      {activeCase ? (
        <CaseDetail 
          caseData={activeCase} 
          onBack={() => { setSelectedCase(null); setRefreshTrigger(p => p+1); }} 
          onUpdate={() => setRefreshTrigger(p => p+1)}
        />
      ) : (
        <Dashboard cases={allCases} onSelectCase={setSelectedCase} />
      )}
    </Layout>
  );
};

export default App;
