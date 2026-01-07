
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Client, ReportSection, AuditSession, AuditTask, TaskUrgency, TaskCategory, BillingData, Installment } from '../../types';
import { SECTIONS } from '../../constants';
import { 
  Plus, Edit2, Trash2, X, ArrowLeft, Zap, 
  Video, Search, StickyNote, Layout,
  DollarSign, Lock, Unlock, CreditCard, ShieldCheck, Link as LinkIcon
} from 'lucide-react';

const CATEGORIES: {id: TaskCategory, label: string}[] = [
  {id: 'tienda', label: 'Tienda Online'},
  {id: 'meta_ads', label: 'Meta Ads'},
  {id: 'google_ads', label: 'Google Ads'},
  {id: 'tiktok_ads', label: 'TikTok Ads'},
  {id: 'contenido', label: 'Contenido / Orgánico'},
  {id: 'email_marketing', label: 'Email Marketing'},
  {id: 'conversiones', label: 'Optimización de Conv.'}
];

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>(db.getClients());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<'info' | 'billing'>('info');
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [managingSessionsFor, setManagingSessionsFor] = useState<Client | null>(null);

  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<AuditSession | null>(null);
  
  const [sessionForm, setSessionForm] = useState<Partial<AuditSession>>({
    title: '', type: 'meet', summary: '', campaignActions: '', recordingUrl: '', tasks: []
  });

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '',
    isActive: true,
    reportUrls: Object.fromEntries(SECTIONS.map(s => [s.id, ''])) as any,
    billing: { totalMentorshipValue: 0, installments: [] }
  });

  useEffect(() => {
    if (managingSessionsFor) setSessions(db.getSessions(managingSessionsFor.id));
  }, [managingSessionsFor]);

  const handleOpenModal = (client?: Client) => {
    setModalTab('info');
    if (client) { 
        setEditingClient(client); 
        setFormData({ ...client }); 
    } else { 
        setEditingClient(null); 
        setFormData({ 
          name: '', 
          isActive: true,
          reportUrls: Object.fromEntries(SECTIONS.map(s => [s.id, ''])) as any,
          billing: { totalMentorshipValue: 0, installments: [] }
        }); 
    }
    setIsModalOpen(true);
  };

  const generateInstallments = (total: number, count: number) => {
    const installments: Installment[] = [];
    const amt = Math.floor(total / count);
    for (let i = 1; i <= count; i++) {
      installments.push({
        id: Math.random().toString(36).substr(2, 5),
        number: i,
        amount: amt,
        isPaid: false
      });
    }
    setFormData({
      ...formData,
      billing: {
        totalMentorshipValue: total,
        installments
      }
    });
  };

  const handleSave = () => {
    if (!formData.name) return;
    
    // ATÓMICO: Obtener la versión más reciente del cliente de la DB antes de guardar
    const allClients = db.getClients();
    const latestClient = allClients.find(c => c.id === editingClient?.id);

    const clientToSave: Client = {
      ...latestClient, // Preservamos aiConfig, costingData, etc.
      ...formData,      // Aplicamos cambios del formulario
      id: editingClient?.id || Math.random().toString(36).substr(2, 9),
      name: formData.name!,
      // Aseguramos que reportUrls se mezcle correctamente si hubo cambios parciales
      reportUrls: {
        ...(latestClient?.reportUrls || {}),
        ...(formData.reportUrls || {})
      },
      isActive: formData.isActive ?? true,
      createdAt: latestClient?.createdAt || new Date().toISOString()
    } as Client;

    db.saveClient(clientToSave);
    setClients(db.getClients());
    setIsModalOpen(false);
  };

  const handleSaveSession = () => {
    if (!managingSessionsFor || !sessionForm.title) return;
    const sessionToSave: AuditSession = {
      id: editingSession?.id || Math.random().toString(36).substr(2, 9),
      clientId: managingSessionsFor.id,
      title: sessionForm.title || '',
      type: sessionForm.type || 'meet',
      date: editingSession?.date || new Date().toISOString(),
      summary: sessionForm.summary || '',
      tasks: (sessionForm.tasks || []) as AuditTask[],
      campaignActions: sessionForm.campaignActions || '',
      recordingUrl: sessionForm.recordingUrl || '',
      createdAt: editingSession?.createdAt || new Date().toISOString()
    };
    db.saveSession(sessionToSave);
    setSessions(db.getSessions(managingSessionsFor.id));
    setIsSessionModalOpen(false);
  };

  const addTask = () => {
    const newTask: AuditTask = {
      id: Math.random().toString(36).substr(2, 5),
      title: '',
      description: '',
      urgency: 'weekly',
      category: 'meta_ads',
      isCompleted: false,
      createdAt: new Date().toISOString()
    };
    setSessionForm({ ...sessionForm, tasks: [newTask, ...(sessionForm.tasks || [])] });
  };

  return (
    <div className="space-y-6">
      {!managingSessionsFor ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Expedientes</h2>
              <p className="text-gray-500 font-medium">Asigna links y audita el progreso de tus marcas.</p>
            </div>
            <button onClick={() => handleOpenModal()} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 hover:bg-red-700 shadow-xl shadow-red-100">
              <Plus size={20} /> Nuevo Paciente
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clients.map(client => (
              <div key={client.id} className={`bg-white rounded-[2.5rem] border ${client.isActive ? 'border-gray-100' : 'border-red-500 opacity-80'} p-8 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all group relative`}>
                {!client.isActive && (
                   <div className="absolute top-4 right-10 bg-red-600 text-white p-1.5 rounded-lg shadow-lg rotate-12 z-20">
                      <Lock size={16} />
                   </div>
                )}
                <div>
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 ${client.isActive ? 'bg-red-50 text-red-600' : 'bg-red-600 text-white'} rounded-2xl flex items-center justify-center font-black text-xl shadow-inner`}>
                      {client.name.charAt(0)}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleOpenModal(client)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16} /></button>
                      <button onClick={() => { if(window.confirm('¿Borrar?')) { db.deleteClient(client.id); setClients(db.getClients()); } }} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic mb-2">{client.name}</h3>
                </div>
                <button onClick={() => setManagingSessionsFor(client)} className="w-full bg-gray-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 transition-all">
                  <Zap size={16} /> Plan de Acción
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-right-4">
          <div className="flex items-center justify-between border-b pb-6">
            <button onClick={() => setManagingSessionsFor(null)} className="flex items-center gap-2 text-red-600 font-black uppercase text-xs tracking-widest hover:translate-x-[-4px] transition-transform">
              <ArrowLeft size={20} /> Pacientes
            </button>
            <div className="text-center">
              <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">{managingSessionsFor.name}</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">Historial de Auditorías y Acciones</p>
            </div>
            <button onClick={() => { setEditingSession(null); setSessionForm({ title: '', type: 'meet', summary: '', campaignActions: '', recordingUrl: '', tasks: [] }); setIsSessionModalOpen(true); }} className="bg-red-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center gap-2 shadow-xl shadow-red-100">
              <Plus size={20} /> Nuevo Plan
            </button>
          </div>

          <div className="grid gap-6">
            {sessions.map(s => (
              <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-gray-100 flex flex-col md:flex-row items-center justify-between hover:shadow-2xl transition-all group">
                <div className="flex items-center gap-6">
                  <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center shadow-lg ${s.type === 'meet' ? 'bg-indigo-600 text-white' : 'bg-red-600 text-white'}`}>
                    {s.type === 'meet' ? <Video size={32} /> : <Search size={32} />}
                  </div>
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black uppercase text-gray-400 tracking-widest">{new Date(s.date).toLocaleDateString()}</span>
                    </div>
                    <h4 className="font-black text-2xl text-gray-900 tracking-tighter uppercase italic break-words">{s.title}</h4>
                    <p className="text-xs text-gray-500 font-medium truncate">{s.summary}</p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6 md:mt-0">
                  <button onClick={() => { setEditingSession(s); setSessionForm({ ...s }); setIsSessionModalOpen(true); }} className="px-6 py-3 bg-gray-50 text-gray-900 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-gray-100">Editar</button>
                  <button onClick={() => { if(window.confirm('¿Eliminar?')) { db.deleteSession(s.id); setSessions(db.getSessions(managingSessionsFor.id)); } }} className="p-3 text-red-300 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={20} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-[3.5rem] w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-10 border-b flex justify-between items-center bg-gray-50 rounded-t-[3.5rem]">
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">Ficha de Paciente</h3>
                <div className="flex mt-4 bg-white p-1 rounded-xl border border-gray-200">
                   <button onClick={() => setModalTab('info')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${modalTab === 'info' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>General & Reportes</button>
                   <button onClick={() => setModalTab('billing')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${modalTab === 'billing' ? 'bg-red-600 text-white' : 'text-gray-400'}`}>Finanzas & Acceso</button>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-red-50 text-red-600 rounded-full transition-colors"><X /></button>
            </div>

            <div className="p-10 overflow-y-auto space-y-8 no-scrollbar">
              {modalTab === 'info' ? (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Nombre de la Marca</label>
                    <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black uppercase tracking-tighter text-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ej: Nike Argentina" />
                  </div>
                  <div className="space-y-4">
                    <p className="text-xs font-black text-red-600 uppercase tracking-widest border-b pb-2">Radiografías (Looker Studio)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {SECTIONS.map(s => (
                          <div key={s.id} className="space-y-1">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{s.label}</span>
                            <input 
                              type="url" 
                              className="w-full bg-gray-50 border-none rounded-xl p-3 text-[11px] font-medium" 
                              value={formData.reportUrls?.[s.id] || ''} 
                              onChange={e => setFormData({...formData, reportUrls: {...(formData.reportUrls as any), [s.id]: e.target.value}})} 
                              placeholder="URL del reporte..." 
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
                  <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl ${formData.isActive ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                           {formData.isActive ? <Unlock size={24} /> : <Lock size={24} />}
                        </div>
                        <div>
                           <h4 className="font-black uppercase italic tracking-tighter text-xl">Estado de Paciente</h4>
                        </div>
                     </div>
                     <button 
                       onClick={() => setFormData({...formData, isActive: !formData.isActive})}
                       className={`px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${formData.isActive ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}
                     >
                       {formData.isActive ? 'Suspender Acceso' : 'Activar Acceso'}
                     </button>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                       <CreditCard size={20} className="text-red-600" />
                       <h4 className="font-black uppercase italic tracking-tighter text-xl">Plan de Pago de Mentoría</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Inversión Total</label>
                          <input 
                            type="number" 
                            className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black text-lg" 
                            value={formData.billing?.totalMentorshipValue || ''}
                            onChange={(e) => setFormData({
                               ...formData, 
                               billing: { 
                                 totalMentorshipValue: Number(e.target.value), 
                                 installments: formData.billing?.installments || [] 
                               }
                            })}
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Generar Cuotas</label>
                          <div className="flex gap-2">
                             {[1, 3, 6, 12].map(num => (
                               <button 
                                 key={num}
                                 onClick={() => generateInstallments(formData.billing?.totalMentorshipValue || 0, num)}
                                 className="flex-1 bg-white border border-gray-200 py-3 rounded-xl font-black text-[10px] hover:bg-red-600 hover:text-white transition-all"
                               >
                                 {num}
                               </button>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="bg-gray-50 rounded-[2.5rem] p-6 space-y-3 max-h-[300px] overflow-y-auto no-scrollbar border border-gray-100">
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Estado de Cuotas</p>
                       {formData.billing?.installments?.map((ins, i) => (
                         <div key={ins.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100">
                            <div className="flex items-center gap-4">
                               <span className="font-black text-gray-300">#{ins.number}</span>
                               <span className="font-black text-gray-900">${ins.amount.toLocaleString()}</span>
                            </div>
                            <button 
                              onClick={() => {
                                const newIns = [...(formData.billing?.installments || [])];
                                newIns[i].isPaid = !newIns[i].isPaid;
                                newIns[i].paidAt = newIns[i].isPaid ? new Date().toISOString() : undefined;
                                setFormData({...formData, billing: { ...formData.billing!, installments: newIns }});
                              }}
                              className={`px-6 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${ins.isPaid ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-600'}`}
                            >
                               {ins.isPaid ? 'Pagada' : 'Pendiente'}
                            </button>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-10 border-t bg-gray-50 flex justify-end rounded-b-[3.5rem]">
               <button onClick={handleSave} className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl flex items-center gap-2">
                 <ShieldCheck size={20} /> Guardar Cambios
               </button>
            </div>
          </div>
        </div>
      )}

      {isSessionModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
           <div className="bg-white rounded-[4rem] w-full max-w-7xl shadow-2xl flex flex-col h-[95vh]">
                <div className="p-10 border-b flex justify-between items-center bg-gray-900 text-white rounded-t-[4rem]">
                   <div>
                     <h3 className="text-3xl font-black uppercase italic tracking-tighter">Plan de Acción</h3>
                   </div>
                   <button onClick={() => setIsSessionModalOpen(false)} className="p-3 bg-white/10 hover:bg-red-600 rounded-2xl transition-all"><X /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto no-scrollbar bg-white">
                   <div className="p-10 space-y-12">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Título</label>
                                <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black" value={sessionForm.title} onChange={e => setSessionForm({...sessionForm, title: e.target.value})} />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Modalidad</label>
                                <div className="flex bg-gray-50 p-1.5 rounded-2xl">
                                   <button onClick={() => setSessionForm({...sessionForm, type: 'meet'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${sessionForm.type === 'meet' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400'}`}>Meet</button>
                                   <button onClick={() => setSessionForm({...sessionForm, type: 'virtual'})} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest ${sessionForm.type === 'virtual' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400'}`}>Virtual</button>
                                </div>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Link Grabación</label>
                              <input type="url" className="w-full bg-gray-50 border-none rounded-2xl p-4" value={sessionForm.recordingUrl} onChange={e => setSessionForm({...sessionForm, recordingUrl: e.target.value})} />
                           </div>
                        </div>
                        <div className="space-y-6">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resumen Ejecutivo</label>
                              <textarea className="w-full bg-gray-50 border-none rounded-2xl p-4 min-h-[145px] resize-none" value={sessionForm.summary} onChange={e => setSessionForm({...sessionForm, summary: e.target.value})} />
                           </div>
                        </div>
                      </div>

                      <div className="space-y-8 pt-8 border-t">
                         <div className="flex items-center justify-between">
                            <h4 className="text-2xl font-black uppercase italic tracking-tighter">Recetario de Tareas</h4>
                            <button onClick={addTask} className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl">
                               <Plus size={18} /> Agregar Tarea
                            </button>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {sessionForm.tasks?.map((task, idx) => (
                              <div key={idx} className="bg-white p-8 rounded-[3rem] border-2 border-gray-100 space-y-6 shadow-sm relative group">
                                 <button 
                                   onClick={() => {
                                     const nt = [...(sessionForm.tasks || [])];
                                     nt.splice(idx, 1);
                                     setSessionForm({...sessionForm, tasks: nt});
                                   }}
                                   className="absolute top-6 right-6 text-red-600 hover:scale-110"
                                 >
                                   <Trash2 size={18} />
                                 </button>
                                 <div className="space-y-6">
                                    <input type="text" className="w-full bg-gray-50 border-none rounded-2xl p-4 font-black" value={task.title} onChange={e => { const nt = [...(sessionForm.tasks || [])]; (nt[idx] as any).title = e.target.value; setSessionForm({...sessionForm, tasks: nt}); }} placeholder="Título de la tarea" />
                                    <div className="grid grid-cols-2 gap-4">
                                       <select className="w-full bg-gray-50 rounded-xl p-3 text-[10px] font-black" value={task.urgency} onChange={e => { const nt = [...(sessionForm.tasks || [])]; (nt[idx] as any).urgency = e.target.value as TaskUrgency; setSessionForm({...sessionForm, tasks: nt}); }}>
                                          <option value="urgent">🔴 URGENTE</option>
                                          <option value="attention">🟡 ATENCIÓN</option>
                                          <option value="weekly">🟢 SEMANAL</option>
                                       </select>
                                       <select className="w-full bg-gray-50 rounded-xl p-3 text-[10px] font-black" value={task.category} onChange={e => { const nt = [...(sessionForm.tasks || [])]; (nt[idx] as any).category = e.target.value as TaskCategory; setSessionForm({...sessionForm, tasks: nt}); }}>
                                          {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                       </select>
                                    </div>
                                    <textarea className="w-full bg-gray-50 border-none rounded-2xl p-4 min-h-[100px] resize-none" value={task.description} onChange={e => { const nt = [...(sessionForm.tasks || [])]; (nt[idx] as any).description = e.target.value; setSessionForm({...sessionForm, tasks: nt}); }} placeholder="Descripción" />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>

                <div className="p-10 border-t bg-gray-50 flex justify-end rounded-b-[4rem]">
                   <button onClick={handleSaveSession} className="bg-red-600 text-white px-16 py-5 rounded-[2rem] font-black uppercase text-sm shadow-2xl">Firmar Plan</button>
                </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClientManagement;
