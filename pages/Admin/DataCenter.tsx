
import React, { useState, useEffect } from 'react';
import { db, CloudConfig } from '../../services/db';
import { Download, Upload, ShieldCheck, AlertTriangle, RefreshCw, Smartphone, Laptop, Cloud, CloudOff, Globe, Link, Database } from 'lucide-react';

const DataCenter: React.FC = () => {
  const [status, setStatus] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [cloudConfig, setCloudConfig] = useState<CloudConfig>(db.getCloudConfig());
  const [activeTab, setActiveTab] = useState<'manual' | 'cloud'>('cloud');

  const handleExport = () => {
    const data = db.exportFullBackup();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dupla_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    setStatus({type: 'success', text: 'Respaldo generado con éxito.'});
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (db.importFullBackup(content)) {
        setStatus({type: 'success', text: '¡Sincronización exitosa! Reiniciando...'});
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setStatus({type: 'error', text: 'Archivo inválido.'});
      }
    };
    reader.readAsText(file);
  };

  const handleSaveCloud = () => {
    if (!cloudConfig.url || !cloudConfig.key) {
      setStatus({type: 'error', text: 'Debes completar la URL y la Key de Supabase.'});
      return;
    }
    const newConfig = { ...cloudConfig, isEnabled: true };
    db.saveCloudConfig(newConfig);
    setCloudConfig(newConfig);
    setStatus({type: 'success', text: '¡Conexión a la Nube activada! Los cambios se sincronizarán.'});
  };

  const handleDisableCloud = () => {
    const newConfig = { ...cloudConfig, isEnabled: false };
    db.saveCloudConfig(newConfig);
    setCloudConfig(newConfig);
    setStatus({type: 'success', text: 'Modo Local activado. Los datos no se enviarán a la nube.'});
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20 max-w-5xl mx-auto">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Centro de Datos</h1>
        <div className="flex justify-center mt-6">
           <div className="bg-white p-1 rounded-2xl border shadow-sm flex">
              <button onClick={() => setActiveTab('cloud')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'cloud' ? 'bg-indigo-600 text-white' : 'text-gray-400'}`}>
                <Cloud size={14} /> Conexión Nube (Recomendado)
              </button>
              <button onClick={() => setActiveTab('manual')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-all ${activeTab === 'manual' ? 'bg-gray-900 text-white' : 'text-gray-400'}`}>
                <RefreshCw size={14} /> Sincro Manual
              </button>
           </div>
        </div>
      </div>

      {status && (
        <div className={`p-6 rounded-[2.5rem] flex items-center justify-between gap-4 border-2 ${status.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          <div className="flex items-center gap-4">
            {status.type === 'success' ? <ShieldCheck size={24} /> : <AlertTriangle size={24} />}
            <span className="font-black uppercase tracking-widest text-xs">{status.text}</span>
          </div>
          <button onClick={() => setStatus(null)} className="opacity-40 hover:opacity-100"><RefreshCw size={16} /></button>
        </div>
      )}

      {activeTab === 'cloud' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           <div className="lg:col-span-7 bg-white p-10 md:p-14 rounded-[4rem] border border-gray-100 shadow-sm space-y-10">
              <div className="flex items-center gap-4">
                 <div className={`p-4 rounded-2xl ${cloudConfig.isEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                   {cloudConfig.isEnabled ? <Globe size={32} /> : <CloudOff size={32} />}
                 </div>
                 <div>
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Configuración Supabase</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Sincronización multi-dispositivo en tiempo real.</p>
                 </div>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                      <Link size={12} /> Project URL
                    </label>
                    <input 
                      type="text" 
                      className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-mono focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-inner" 
                      placeholder="https://xxxxxx.supabase.co"
                      value={cloudConfig.url}
                      onChange={e => setCloudConfig({...cloudConfig, url: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                      <Database size={12} /> API Key (Anon Public)
                    </label>
                    <input 
                      type="password" 
                      className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-mono focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-inner" 
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5..."
                      value={cloudConfig.key}
                      onChange={e => setCloudConfig({...cloudConfig, key: e.target.value})}
                    />
                 </div>

                 <div className="flex gap-4 pt-4">
                    <button onClick={handleSaveCloud} className="flex-1 bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3">
                      <ShieldCheck size={20} /> Activar Sincro Nube
                    </button>
                    {cloudConfig.isEnabled && (
                      <button onClick={handleDisableCloud} className="bg-red-50 text-red-600 px-8 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:bg-red-100 transition-all">
                        Desactivar
                      </button>
                    )}
                 </div>
              </div>
           </div>

           <div className="lg:col-span-5 space-y-6">
              <div className="bg-gray-900 rounded-[3.5rem] p-10 text-white shadow-2xl space-y-6 relative overflow-hidden h-full flex flex-col justify-center">
                 <h4 className="text-2xl font-black uppercase italic tracking-tighter text-indigo-400">¿Cómo funciona?</h4>
                 <div className="space-y-4 text-sm font-medium text-gray-400 leading-relaxed">
                    <p>1. Creas un proyecto gratis en <b>Supabase.com</b>.</p>
                    <p>2. Copias la URL y la Key y las pegas aquí.</p>
                    <p>3. ¡Listo! Ahora todos los cambios que hagas en tu PC se verán en tu iPhone y en el panel de tus clientes al instante.</p>
                 </div>
                 <div className="pt-6">
                    <a href="https://supabase.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-indigo-400 font-black uppercase text-[10px] tracking-widest hover:underline">
                      Ir a Supabase <RefreshCw size={12} />
                    </a>
                 </div>
              </div>
           </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm border-gray-100 space-y-6 text-center">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner mb-4">
              <Laptop size={40} />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Paso 1: Exportar</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Descarga tus datos actuales para moverlos de PC a Móvil manualmente.
            </p>
            <button onClick={handleExport} className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all">
              <Download size={20} /> Generar Archivo .JSON
            </button>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border shadow-sm border-gray-100 space-y-6 text-center">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto shadow-inner mb-4">
              <Smartphone size={40} />
            </div>
            <h3 className="text-2xl font-black uppercase italic tracking-tighter">Paso 2: Importar</h3>
            <p className="text-xs text-gray-500 font-medium leading-relaxed">
              Sube el archivo en tu nuevo dispositivo para replicar toda la información.
            </p>
            <label className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl shadow-red-100 flex items-center justify-center gap-3 hover:bg-red-700 transition-all cursor-pointer">
              <Upload size={20} /> Subir y Reemplazar
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
          </div>
        </div>
      )}

      <div className="bg-amber-50 rounded-[3rem] p-10 border border-amber-100 flex items-start gap-6">
         <div className="bg-amber-100 text-amber-600 p-4 rounded-2xl shrink-0"><AlertTriangle size={32} /></div>
         <div>
            <h4 className="text-xl font-black uppercase italic tracking-tighter text-amber-900 leading-none mb-2">Advertencia sobre Caché</h4>
            <p className="text-xs font-medium text-amber-700 leading-relaxed">
              Borrar la caché del navegador <b>ELIMINA</b> todos tus datos locales si no tienes activada la Conexión Nube. Recomendamos siempre usar Supabase para garantizar que tu trabajo sea eterno y accesible desde cualquier lugar.
            </p>
         </div>
      </div>
    </div>
  );
};

export default DataCenter;
