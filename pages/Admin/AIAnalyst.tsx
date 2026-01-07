
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Client, AIConfig, AIReport } from '../../types';
import { 
  Facebook, 
  Key, 
  Target, 
  Save, 
  CheckCircle, 
  AlertCircle,
  Database,
  Send,
  FileText,
  Bot,
  Sparkles
} from 'lucide-react';

const AIAnalyst: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(db.getClients());
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [reportContent, setReportContent] = useState('');

  const [aiConfig, setAIConfig] = useState<AIConfig>({
    prompt: '',
    metaToken: '',
    metaAccountId: ''
  });

  useEffect(() => {
    if (selectedClient) {
      setAIConfig(selectedClient.aiConfig || {
        prompt: '',
        metaToken: '',
        metaAccountId: ''
      });
    }
  }, [selectedClient]);

  const handleSaveConfig = () => {
    if (selectedClient) {
      const updatedClient = { ...selectedClient, aiConfig };
      db.saveClient(updatedClient);
      
      // Actualizamos los estados locales para que no haya desincronización
      setSelectedClient(updatedClient);
      setClients(db.getClients());
      
      setStatusMessage({ type: 'success', text: 'Conexión con Meta API actualizada.' });
      setTimeout(() => setStatusMessage(null), 3000);
    }
  };

  const handleSendManualReport = () => {
    if (!selectedClient || !reportContent.trim()) {
      setStatusMessage({ type: 'error', text: 'Debes seleccionar un cliente y pegar un contenido.' });
      return;
    }

    const newReport: AIReport = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: selectedClient.id,
      content: reportContent,
      isReadByClient: false,
      createdAt: new Date().toISOString()
    };

    db.saveAIReport(newReport);
    setReportContent('');
    setStatusMessage({ type: 'success', text: 'Diagnóstico IA enviado al portal del cliente con éxito.' });
    setTimeout(() => setStatusMessage(null), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">Centro de Inteligencia</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Gestión de APIs e Informes IA Manuales.</p>
        </div>
        <select 
          className="bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 font-black text-gray-700 shadow-sm outline-none focus:border-red-500 transition-all cursor-pointer uppercase italic tracking-tighter"
          onChange={(e) => setSelectedClient(clients.find(c => c.id === e.target.value) || null)}
          value={selectedClient?.id || ''}
        >
          <option value="">Seleccionar Marca...</option>
          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {statusMessage && (
        <div className={`p-6 rounded-[2rem] flex items-center gap-4 border-2 animate-in slide-in-from-top-4 ${statusMessage.type === 'success' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          {statusMessage.type === 'success' ? <CheckCircle size={24} /> : <AlertCircle size={24} />}
          <span className="font-black uppercase tracking-widest text-xs">{statusMessage.text}</span>
        </div>
      )}

      {selectedClient ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* COLUMNA IZQUIERDA: CONFIGURACION API */}
          <div className="space-y-8">
            <div className="bg-white rounded-[3.5rem] border shadow-sm p-10 space-y-8 border-t-8 border-t-indigo-600">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-inner">
                  <Facebook size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Meta Ads Graph</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Credenciales de Acceso</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                    <Key size={14}/> System Access Token
                  </label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-3xl p-6 text-xs font-mono focus:ring-4 focus:ring-indigo-100 outline-none min-h-[120px] resize-none transition-all shadow-inner" 
                    value={aiConfig.metaToken || ''}
                    onChange={(e) => setAIConfig({...aiConfig, metaToken: e.target.value})}
                    placeholder="EAAB..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                    <Target size={14}/> Facebook Business Account ID
                  </label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border-none rounded-2xl p-6 text-sm font-mono focus:ring-4 focus:ring-indigo-100 outline-none transition-all shadow-inner" 
                    value={aiConfig.metaAccountId || ''}
                    onChange={(e) => setAIConfig({...aiConfig, metaAccountId: e.target.value})}
                    placeholder="act_123456789"
                  />
                </div>
                <button 
                  onClick={handleSaveConfig}
                  className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all"
                >
                  <Save size={18} /> Actualizar Conexión
                </button>
              </div>
            </div>
          </div>

          {/* COLUMNA DERECHA: ENVIO MANUAL DE INFORMES */}
          <div className="space-y-8">
            <div className="bg-white rounded-[3.5rem] border shadow-sm p-10 space-y-8 border-t-8 border-t-red-600 h-full">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 bg-red-50 text-red-600 rounded-[2rem] flex items-center justify-center shadow-inner">
                  <Bot size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Despacho de Informe IA</h3>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Publicar Diagnóstico Externo</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-2">
                    <FileText size={14}/> Contenido del Informe (Paste AI text)
                  </label>
                  <textarea 
                    className="w-full bg-gray-50 border-none rounded-3xl p-6 text-sm font-medium focus:ring-4 focus:ring-red-100 outline-none min-h-[300px] resize-none transition-all shadow-inner leading-relaxed" 
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder="Pega aquí el análisis generado por ChatGPT, Gemini o tu herramienta externa..."
                  />
                </div>

                <div className="bg-red-50 p-6 rounded-3xl border border-red-100 space-y-2">
                  <div className="flex items-center gap-2 text-red-600 font-black uppercase text-[9px] tracking-widest">
                    <Sparkles size={14} /> Nota Estratégica
                  </div>
                  <p className="text-[10px] text-red-800 font-medium leading-tight">
                    Al enviar este informe, el cliente recibirá una notificación en su panel y podrá leer el diagnóstico completo desde su sección de <b>Informes IA</b>.
                  </p>
                </div>

                <button 
                  onClick={handleSendManualReport}
                  disabled={!reportContent.trim()}
                  className="w-full bg-red-600 text-white py-5 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl shadow-red-200 flex items-center justify-center gap-3 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
                >
                  <Send size={20} /> Publicar Diagnóstico
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[4rem] border-4 border-dashed border-gray-100 p-40 text-center text-gray-200">
          <Database size={80} className="mx-auto mb-6 opacity-20" />
          <p className="text-2xl font-black uppercase tracking-tighter italic">Selecciona un paciente para operar</p>
        </div>
      )}
    </div>
  );
};

export default AIAnalyst;
