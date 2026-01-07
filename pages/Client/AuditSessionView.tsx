
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { AuditSession, TaskUrgency, TaskCategory, AuditTask } from '../../types';
import { 
  Calendar, 
  PlayCircle, 
  CheckCircle2, 
  Circle, 
  ArrowLeft,
  Zap,
  Clock,
  Filter,
  Layers,
  Video,
  Search,
  StickyNote,
  ChevronRight,
  Activity,
  Stethoscope,
  AlertCircle
} from 'lucide-react';

const CATEGORY_LABELS: Record<string, string> = {
  all: 'Todas',
  tienda: 'Tienda',
  meta_ads: 'Meta Ads',
  contenido: 'Contenido',
  google_ads: 'Google Ads',
  email_marketing: 'Email Mkt',
  tiktok_ads: 'TikTok Ads',
  conversiones: 'Conversión'
};

const AuditSessionView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState<AuditSession | null>(null);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    const s = db.getSessions().find(s => s.id === id);
    if (s) setSession(s);
  }, [id]);

  if (!session) return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400">
      <p>Cargando encuentro...</p>
    </div>
  );

  const handleToggleTask = (taskId: string) => {
    db.toggleTask(session.id, taskId);
    const updatedSessions = db.getSessions().find(s => s.id === id);
    if (updatedSessions) setSession({ ...updatedSessions });
  };

  const completedCount = session.tasks.filter(t => t.isCompleted).length;
  const progress = Math.round((completedCount / session.tasks.length) * 100) || 0;

  const filteredTasks = activeFilter === 'all' 
    ? session.tasks 
    : session.tasks.filter(t => t.category === activeFilter);

  const availableCategories: string[] = ['all', ...(Array.from(new Set(session.tasks.map(t => t.category))) as string[])];

  const getUrgencyStyles = (urgency: TaskUrgency) => {
    switch(urgency) {
      case 'urgent': return { color: 'text-red-600', bg: 'bg-red-50', label: '🔴 URGENTE (24h)', border: 'border-red-100 shadow-red-50' };
      case 'attention': return { color: 'text-amber-600', bg: 'bg-amber-50', label: '🟡 ATENCIÓN (48h)', border: 'border-amber-100 shadow-amber-50' };
      case 'weekly': return { color: 'text-emerald-600', bg: 'bg-emerald-50', label: '🟢 SEMANAL', border: 'border-emerald-100 shadow-emerald-50' };
    }
  };

  const getTaskDeadlines = (task: AuditTask) => {
    const created = new Date(task.createdAt || session.date || Date.now());
    let offsetDays = 7;
    if (task.urgency === 'urgent') offsetDays = 1;
    if (task.urgency === 'attention') offsetDays = 2;

    const deadline = new Date(created.getTime() + offsetDays * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    const diffMs = today.getTime() - deadline.getTime();
    const overdueDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      created: created.toLocaleDateString(),
      deadline: deadline.toLocaleDateString(),
      overdue: overdueDays > 0 ? overdueDays : 0
    };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      {/* Header Clínico */}
      <div className="bg-white rounded-[3.5rem] p-10 md:p-14 border border-gray-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10">
        <div className="space-y-6 flex-1 max-w-4xl">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-red-600 font-black uppercase text-[10px] tracking-widest hover:translate-x-[-4px] transition-transform">
            <ArrowLeft size={16} /> Dashboard General
          </button>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg shrink-0 ${session.type === 'meet' ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-red-600 text-white shadow-red-100'}`}>
                {session.type === 'meet' ? <Video size={30} /> : <Search size={30} />}
              </div>
              <div>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${session.type === 'meet' ? 'text-indigo-600' : 'text-red-600'}`}>
                  {session.type === 'meet' ? 'Encuentro Meet' : 'Análisis Virtual Trafficker'}
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-tight break-words">{session.title}</h1>
              </div>
            </div>
            <p className="text-lg text-gray-500 font-medium whitespace-pre-wrap break-words">{session.summary}</p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 min-w-[280px]">
           <div className="text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Registro de Auditoría</p>
              <div className="flex items-center gap-3 text-gray-900 font-black text-xl italic mb-6">
                <Calendar className="text-red-600" size={24} /> {new Date(session.date).toLocaleDateString()}
              </div>
           </div>
           {session.recordingUrl && (
             <a 
              href={session.recordingUrl} 
              target="_blank" 
              rel="noreferrer"
              className="w-full bg-gray-900 text-white py-4 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-red-600 transition-all shadow-xl shadow-gray-200"
             >
                <PlayCircle size={18} /> Ver Grabación Loom
             </a>
           )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-10 border-b flex flex-col md:flex-row justify-between items-center gap-6 bg-gray-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><Layers size={24} /></div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">Roadmap Estratégico</h2>
                </div>
                <div className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100">
                  <div className="text-right">
                    <p className="text-2xl font-black text-red-600 leading-none">{progress}%</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase mt-1">Avance Clínico</p>
                  </div>
                  <div className="w-24 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 transition-all duration-1000 shadow-[0_0_10px_rgba(220,38,38,0.3)]" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
             </div>

             <div className="px-10 py-5 bg-white border-b flex items-center gap-3 overflow-x-auto no-scrollbar">
                <Filter size={16} className="text-gray-300 mr-2 shrink-0" />
                {availableCategories.map((cat: string) => (
                  <button
                    key={cat}
                    onClick={() => setActiveFilter(cat)}
                    className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${
                      activeFilter === cat 
                      ? 'bg-red-600 text-white border-red-600 shadow-xl shadow-red-100' 
                      : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {CATEGORY_LABELS[cat] || cat} 
                  </button>
                ))}
             </div>

             <div className="p-10 space-y-8">
                {filteredTasks.map((task) => {
                  const styles = getUrgencyStyles(task.urgency);
                  const { created, deadline, overdue } = getTaskDeadlines(task);
                  return (
                    <div 
                      key={task.id} 
                      className={`group relative bg-white rounded-[2.5rem] border-2 transition-all p-8 flex flex-col md:flex-row gap-8 ${
                        task.isCompleted 
                          ? 'border-green-100 bg-green-50/10 opacity-60' 
                          : `${styles.border} shadow-lg shadow-gray-100/30`
                      }`}
                    >
                      <button 
                        onClick={() => handleToggleTask(task.id)}
                        className={`shrink-0 transition-all mt-1 ${task.isCompleted ? 'text-green-500 scale-110' : 'text-gray-200 hover:text-red-500'}`}
                      >
                        {task.isCompleted ? <CheckCircle2 size={40} /> : <Circle size={40} />}
                      </button>

                      <div className="flex-1 space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                           <div className="flex gap-2">
                             <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${styles.bg} ${styles.color} ${styles.border}`}>
                               {styles.label}
                             </span>
                             <span className="px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-gray-100 text-gray-400 border border-gray-200">
                               {CATEGORY_LABELS[task.category] || task.category}
                             </span>
                           </div>
                           
                           {/* Bloque de Fechas */}
                           <div className="flex items-center gap-4 text-[9px] font-black uppercase tracking-widest">
                              <div className="text-gray-400">Asignada: {created}</div>
                              <div className={overdue > 0 && !task.isCompleted ? 'text-red-600 flex items-center gap-1' : 'text-indigo-400'}>
                                {overdue > 0 && !task.isCompleted && <AlertCircle size={10} />}
                                Vence: {deadline}
                                {overdue > 0 && !task.isCompleted && <span className="ml-1 bg-red-600 text-white px-1.5 py-0.5 rounded animate-pulse">{overdue}d Atrás</span>}
                              </div>
                           </div>
                        </div>

                        <div className="max-w-full overflow-hidden">
                           <h3 className={`text-2xl font-black tracking-tighter uppercase italic leading-tight break-words ${task.isCompleted ? 'text-green-900/40 line-through' : 'text-gray-900'}`}>
                             {task.title || 'Tarea sin título'}
                           </h3>
                           <p className={`mt-2 text-sm font-medium leading-relaxed whitespace-pre-wrap break-words ${task.isCompleted ? 'text-gray-400' : 'text-gray-500'}`}>
                             {task.description}
                           </p>
                        </div>

                        {task.importantNotes && (
                          <div className="bg-red-900 p-6 rounded-[2rem] border-2 border-red-400 shadow-xl shadow-red-100/50 flex gap-4">
                             <div className="bg-red-600 text-white p-2 rounded-xl h-fit shadow-lg shadow-red-100 shrink-0"><StickyNote size={18} /></div>
                             <div className="space-y-1 overflow-hidden">
                               <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Restricción Clínica Crítica</p>
                               <p className="text-sm font-bold text-white leading-relaxed italic whitespace-pre-wrap break-words">{task.importantNotes}</p>
                             </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredTasks.length === 0 && (
                   <div className="py-20 text-center text-gray-300 font-black uppercase italic tracking-tighter flex flex-col items-center">
                      <Zap size={48} className="opacity-10 mb-4" />
                      Sin tareas registradas en esta área
                   </div>
                )}
             </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <div className="bg-gray-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
               <div className="flex items-center gap-3">
                  <div className="p-3 bg-red-600 rounded-2xl shadow-xl shadow-red-600/20"><Activity size={24} /></div>
                  <h3 className="text-xl font-black uppercase italic tracking-tighter">Acciones de Hoy</h3>
               </div>
               <div className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 italic text-sm font-medium text-green-400 leading-relaxed whitespace-pre-wrap break-words font-mono">
                  {session.campaignActions || 'Hoy se ha realizado una auditoría estructural sin modificaciones en vivo.'}
               </div>
               <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                 Los cambios aplicados por el equipo Trafficker durante el encuentro ya están en vigor.
               </p>
            </div>
          </div>

          <div className="bg-white rounded-[3.5rem] p-10 border border-gray-100 shadow-sm space-y-8 text-center">
             <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
               <Stethoscope size={32} />
             </div>
             <div>
                <h4 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic mb-2">Ayuda Inmediata</h4>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">Si no puedes completar alguna tarea o necesitas soporte técnico inmediato, pulsa el botón de abajo.</p>
             </div>
             <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3">
                Hablar con Soporte <ChevronRight size={18} />
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditSessionView;
