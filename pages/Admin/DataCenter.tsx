
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { 
  ShieldCheck, 
  RefreshCw, 
  Cloud, 
  Database, 
  Rocket,
  CheckCircle2,
  Zap,
  Globe,
  Loader2,
  Wifi,
  History
} from 'lucide-react';

const DataCenter: React.FC = () => {
  const [lastSync, setLastSync] = useState<string>(new Date().toLocaleTimeString());
  const [loading, setLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success'>('idle');

  const handleManualSync = async () => {
    setLoading(true);
    setSyncStatus('syncing');
    try {
      await db.syncFromCloud();
      setLastSync(new Date().toLocaleTimeString());
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
    } catch (e) {
      setSyncStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Estado de la Red</h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Monitoreo de Sincronización Automática</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mb-4">
               <Wifi size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Conexión Cloud</p>
            <h3 className="text-xl font-black text-gray-900 uppercase italic">Activa</h3>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-4">
               <History size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Último Refresco</p>
            <h3 className="text-xl font-black text-gray-900 uppercase italic">{lastSync}</h3>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mb-4">
               <Database size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Motor de Datos</p>
            <h3 className="text-xl font-black text-gray-900 uppercase italic">Supabase</h3>
         </div>
      </div>

      <div className="bg-indigo-900 rounded-[4rem] p-12 text-white shadow-2xl space-y-8 relative overflow-hidden">
         <Zap className="absolute -top-10 -right-10 text-white/5" size={250} />
         <div className="relative z-10 flex flex-col lg:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
               <div className="flex items-center gap-4">
                  <Cloud className="text-indigo-300" size={40} />
                  <h3 className="text-4xl font-black uppercase italic tracking-tighter">Sincronización Total</h3>
               </div>
               <p className="text-indigo-100 text-lg font-medium leading-relaxed">
                  Ya no necesitas subir o bajar datos manualmente. El portal guarda cada cambio que haces instantáneamente en la nube y lo descarga cada vez que abres la aplicación en cualquier dispositivo.
               </p>
               <div className="flex items-center gap-4 p-5 bg-white/10 rounded-3xl border border-white/10">
                  <ShieldCheck className="text-green-400" size={24} />
                  <p className="text-xs font-bold uppercase tracking-widest leading-tight">
                     Tus datos están protegidos y disponibles en tiempo real en iPhone, Android y PC.
                  </p>
               </div>
            </div>
            
            <div className="w-full lg:w-72">
               <button 
                onClick={handleManualSync} 
                disabled={loading}
                className={`w-full group py-8 rounded-[2.5rem] font-black uppercase text-xs tracking-widest flex flex-col items-center justify-center gap-4 transition-all shadow-2xl ${syncStatus === 'success' ? 'bg-green-500 text-white' : 'bg-white text-indigo-900 hover:bg-indigo-50'}`}
               >
                  {syncStatus === 'syncing' ? (
                    <Loader2 className="animate-spin" size={32} />
                  ) : syncStatus === 'success' ? (
                    <CheckCircle2 size={32} />
                  ) : (
                    <RefreshCw size={32} className="group-hover:rotate-180 transition-transform duration-700" />
                  )}
                  {syncStatus === 'syncing' ? 'Sincronizando...' : syncStatus === 'success' ? '¡Todo al día!' : 'Forzar Refresco'}
               </button>
            </div>
         </div>
      </div>

      <div className="bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm space-y-8">
         <div className="flex items-center gap-5">
            <div className="p-5 bg-indigo-50 text-indigo-600 rounded-[2rem] shadow-inner">
               <Globe size={40} />
            </div>
            <div>
               <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Arquitectura Invisible</h3>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Multi-device Experience</p>
            </div>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 bg-gray-50 rounded-3xl space-y-3">
               <h4 className="font-black text-indigo-900 uppercase text-xs">Modo Optimista</h4>
               <p className="text-xs text-gray-500 leading-relaxed font-medium">El portal muestra los datos locales al instante mientras la nube se actualiza en segundo plano, para que nunca sientas lentitud al operar.</p>
            </div>
            <div className="p-6 bg-gray-50 rounded-3xl space-y-3">
               <h4 className="font-black text-indigo-900 uppercase text-xs">Persistencia Total</h4>
               <p className="text-xs text-gray-500 leading-relaxed font-medium">Si borras la caché de tu navegador o cambias de teléfono, al loguearte verás exactamente lo mismo. Supabase es ahora tu cerebro central.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default DataCenter;
