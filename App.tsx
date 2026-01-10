
import React, { useState, useEffect, createContext, useContext } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User, UserRole, AuthState, Client } from './types';
import { db } from './services/db';
import LoginPage from './pages/LoginPage';
import { Overview } from './pages/Admin/AdminDashboard';
import ClientManagement from './pages/Admin/ClientManagement';
import UserManagement from './pages/Admin/UserManagement';
import ClientHealthView from './pages/Admin/ClientHealthView';
import ClientDashboard from './pages/Client/ClientDashboard';
import AuditSessionView from './pages/Client/AuditSessionView';
import TrainingPortal from './pages/Client/TrainingPortal';
import LessonDetail from './pages/Client/LessonDetail';
import TrainingManagement from './pages/Admin/TrainingManagement';
import AIAnalyst from './pages/Admin/AIAnalyst';
import DataCenter from './pages/Admin/DataCenter';
import AIAnalystView from './pages/Client/AIAnalystView';
import ProductCostingView from './pages/Client/ProductCostingView';
import MetaInsightsView from './pages/Client/MetaInsightsView';
import { Layout } from './components/Layout';
import { Lock, RefreshCw, Sparkles } from 'lucide-react';

interface AuthContextType extends AuthState {
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isSyncing: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      // Sincronizar con la nube antes de cualquier cosa
      await db.init();
      setIsSyncing(false);

      const savedUserStr = localStorage.getItem('mp_session');
      if (savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          const users = db.getUsers();
          const freshUser = users.find(u => u.id === savedUser.id);
          if (freshUser) {
            setState({ user: freshUser, isAuthenticated: true, isLoading: false });
          } else {
            localStorage.removeItem('mp_session');
            setState({ user: null, isAuthenticated: false, isLoading: false });
          }
        } catch (e) {
          localStorage.removeItem('mp_session');
          setState({ user: null, isAuthenticated: false, isLoading: false });
        }
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    initApp();
  }, []);

  const login = async (email: string, pass: string) => {
    setIsSyncing(true);
    try {
      await db.syncFromCloud(); // Asegurar que tenemos los últimos usuarios
      const users = db.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === pass);
      if (user) {
        localStorage.setItem('mp_session', JSON.stringify(user));
        setState({ user, isAuthenticated: true, isLoading: false });
      } else {
        throw new Error("Credenciales inválidas");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('mp_session');
    setState({ user: null, isAuthenticated: false, isLoading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isSyncing }}>
      {children}
    </AuthContext.Provider>
  );
};

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: UserRole[] }> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading, isSyncing } = useAuth();
  
  if (isLoading || isSyncing) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#b10000] space-y-8 p-10 text-white">
        <div className="flex flex-col items-center leading-[0.7] mb-4 animate-pulse">
          <span className="text-5xl font-black italic tracking-tighter">La</span>
          <span className="text-7xl font-black italic tracking-tighter mt-2">Dupla</span>
        </div>
        <div className="flex flex-col items-center gap-4">
           <div className="relative">
              <RefreshCw size={48} className="animate-spin opacity-30" />
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={20} />
           </div>
           <div className="text-center space-y-1">
              <p className="font-black uppercase tracking-[0.3em] text-[10px]">Conectando con la Nube</p>
              <p className="text-white/60 text-xs font-medium italic">Sincronizando expedientes técnicos...</p>
           </div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;

  if (user?.role === UserRole.CLIENT && user.clientId) {
    const client = db.getClients().find(c => c.id === user.clientId);
    if (client && client.isActive === false) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-50 p-6 font-['Montserrat']">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-red-100 max-w-lg text-center space-y-8 animate-in zoom-in duration-300">
            <div className="w-24 h-24 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-xl">
              <Lock size={48} />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-gray-900 leading-none">Acceso Suspendido</h2>
              <p className="text-gray-500 font-medium text-lg leading-relaxed">
                Tu acceso al portal de <b>La Dupla</b> ha sido restringido por motivos administrativos.
              </p>
            </div>
          </div>
        </div>
      );
    }
  }
  
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><Overview /></ProtectedRoute>} />
      <Route path="/admin/clients" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><ClientManagement /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><UserManagement /></ProtectedRoute>} />
      <Route path="/admin/training" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><TrainingManagement /></ProtectedRoute>} />
      <Route path="/admin/ai-analyst" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><AIAnalyst /></ProtectedRoute>} />
      <Route path="/admin/sync" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><DataCenter /></ProtectedRoute>} />
      <Route path="/admin/health/:id" element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]}><ClientHealthView /></ProtectedRoute>} />
      <Route path="/" element={<ProtectedRoute>{user?.role === UserRole.ADMIN ? <Navigate to="/admin" replace /> : <ClientDashboard />}</ProtectedRoute>} />
      <Route path="/session/:id" element={<ProtectedRoute allowedRoles={[UserRole.CLIENT]}><AuditSessionView /></ProtectedRoute>} />
      <Route path="/ai-analyst" element={<ProtectedRoute allowedRoles={[UserRole.CLIENT]}><AIAnalystView /></ProtectedRoute>} />
      <Route path="/meta-insights" element={<ProtectedRoute allowedRoles={[UserRole.CLIENT]}><MetaInsightsView /></ProtectedRoute>} />
      <Route path="/profitability" element={<ProtectedRoute allowedRoles={[UserRole.CLIENT]}><ProductCostingView /></ProtectedRoute>} />
      <Route path="/training" element={<ProtectedRoute><TrainingPortal /></ProtectedRoute>} />
      <Route path="/training/lesson/:id" element={<ProtectedRoute><LessonDetail /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App = () => (
  <HashRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </HashRouter>
);

export default App;
