
import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db } from '../services/db';
import { AuditSession, UserRole } from '../types';
import { 
  LogOut, 
  Menu, 
  X, 
  LayoutDashboard, 
  Users, 
  Briefcase,
  GraduationCap,
  BookOpen,
  Bot,
  Calculator,
  Facebook,
  RefreshCw,
  PackageSearch
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

const CloudCheckIcon = ({ size }: { size: number }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-500">
    <path d="M17.5 19a3.5 3.5 0 0 0 0-7c-.3 0-.6 0-.8.1a5 5 0 1 0-8.9 3.2" />
    <polyline points="9 16 11 18 15 14" />
  </svg>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadAI, setUnreadAI] = useState(0);
  const location = useLocation();

  useEffect(() => {
    if (user?.role === UserRole.CLIENT && user.clientId) {
      const reports = db.getAIReports(user.clientId);
      setUnreadAI(reports.filter(r => !r.isReadByClient).length);
    }
  }, [user, location]);

  const adminLinks = [
    { to: '/admin', label: 'Tablero Central', icon: <LayoutDashboard size={20} /> },
    { to: '/admin/clients', label: 'Pacientes / Marcas', icon: <Briefcase size={20} /> },
    { to: '/admin/users', label: 'Gestión Accesos', icon: <Users size={20} /> },
    { to: '/admin/training', label: 'Academia & Tracking', icon: <GraduationCap size={20} /> },
    { to: '/admin/ai-analyst', label: 'Configuración API', icon: <Bot size={20} /> },
    { to: '/admin/sync', label: 'Caja Fuerte / Sincro', icon: <RefreshCw size={20} /> },
  ];

  const currentPath = location.pathname;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row font-['Montserrat']">
      <div className="md:hidden bg-white border-b px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex flex-col brand-logo-text leading-[0.7]">
          <span className="text-xl">La</span>
          <span className="text-2xl mt-1">Dupla</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg">
          {isSidebarOpen ? <X /> : <Menu />}
        </button>
      </div>

      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-10 flex items-center gap-3 border-b hidden md:flex bg-gray-50/20">
            <div className="flex flex-col brand-logo-text leading-[0.7]">
              <span className="text-4xl">La</span>
              <span className="text-6xl mt-2">Dupla</span>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-8 mt-6 overflow-y-auto no-scrollbar">
            {user?.role === UserRole.ADMIN ? (
              <div className="space-y-1">
                <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Mesa de Control</p>
                {adminLinks.map(link => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${
                      currentPath === link.to ? 'bg-[#b10000] text-white shadow-xl shadow-red-100' : 'text-gray-500 hover:bg-gray-50'
                    }`}
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    {link.icon}
                    <span className="font-bold text-sm">{link.label}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="space-y-8">
                <div className="space-y-1">
                  <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Tratamiento Técnico</p>
                  <Link to="/" className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentPath === '/' ? 'bg-[#b10000] text-white shadow-xl shadow-red-100' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setIsSidebarOpen(false)}>
                    <LayoutDashboard size={20} />
                    <span className="font-bold text-sm">Estado General</span>
                  </Link>
                  <Link to="/meta-insights" className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentPath === '/meta-insights' ? 'bg-[#b10000] text-white shadow-xl shadow-red-100' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setIsSidebarOpen(false)}>
                    <Facebook size={20} />
                    <span className="font-bold text-sm">Meta Insights</span>
                  </Link>
                  <Link to="/product-insights" className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentPath === '/product-insights' ? 'bg-[#b10000] text-white shadow-xl shadow-red-100' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setIsSidebarOpen(false)}>
                    <PackageSearch size={20} />
                    <span className="font-bold text-sm">Inventario IA</span>
                  </Link>
                  <Link to="/profitability" className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentPath === '/profitability' ? 'bg-[#b10000] text-white shadow-xl shadow-red-100' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setIsSidebarOpen(false)}>
                    <Calculator size={20} />
                    <span className="font-bold text-sm">Rentabilidad</span>
                  </Link>
                  <Link to="/ai-analyst" className={`relative flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentPath === '/ai-analyst' ? 'bg-[#b10000] text-white shadow-xl shadow-red-100' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setIsSidebarOpen(false)}>
                    <Bot size={20} />
                    <span className="font-bold text-sm">Informes IA</span>
                    {unreadAI > 0 && (
                      <span className="absolute right-4 w-6 h-6 bg-yellow-400 text-black text-[11px] flex items-center justify-center rounded-full font-black border-2 border-white">
                        {unreadAI}
                      </span>
                    )}
                  </Link>
                  <Link to="/training" className={`flex items-center gap-3 px-4 py-4 rounded-2xl transition-all ${currentPath.startsWith('/training') ? 'bg-[#b10000] text-white shadow-xl shadow-red-100' : 'text-gray-500 hover:bg-gray-50'}`} onClick={() => setIsSidebarOpen(false)}>
                    <BookOpen size={20} />
                    <span className="font-bold text-sm">Academia Dupla</span>
                  </Link>
                </div>
              </div>
            )}
          </nav>

          <div className="p-4 border-t space-y-4 bg-gray-50/50">
            <div className="flex items-center justify-center gap-2 mb-2">
               <CloudCheckIcon size={14} />
               <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Nube Sincronizada</span>
            </div>
            <div className="bg-white rounded-3xl p-4 flex items-center gap-3 border border-gray-100 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#b10000] flex items-center justify-center text-white font-black shadow-lg">
                {user?.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-black text-gray-900 truncate leading-none mb-1">{user?.name}</p>
                <p className="text-[10px] font-bold text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
            <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-4 text-[#b10000] hover:bg-red-50 rounded-2xl transition-colors font-black text-xs uppercase tracking-widest">
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-screen overflow-y-auto md:p-10 p-4 bg-gray-50 fade-in">
        <div className="max-w-7xl mx-auto h-full">{children}</div>
      </main>
    </div>
  );
};
