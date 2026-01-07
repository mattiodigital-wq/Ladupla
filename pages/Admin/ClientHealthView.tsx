
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { Client, AuditSession, AuditTask, UserProgress, Lesson } from '../../types';
import { 
  ArrowLeft, 
  Activity, 
  TrendingUp, 
  DollarSign, 
  Target, 
  Zap, 
  CheckCircle2, 
  Circle, 
  Clock, 
  BookOpen, 
  Stethoscope, 
  AlertCircle,
  RefreshCw,
  Loader2,
  ListTodo
} from 'lucide-react';

const ClientHealthView: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [courseProgress, setCourseProgress] = useState<UserProgress[]>([]);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  
  const [metaMetrics, setMetaMetrics] = useState<{ roas: number, revenue: number, spend: number } | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const fetchMetaMetrics = useCallback(async (clientData: Client) => {
    if (!clientData.aiConfig?.metaToken || !clientData.aiConfig?.metaAccountId) return;
    setLoadingMeta(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const accountId = clientData.aiConfig.metaAccountId.startsWith('act_') ? clientData.aiConfig.metaAccountId : `act_${clientData.aiConfig.metaAccountId}`;
      const url = `https://graph.facebook.com/v19.0/${accountId}/insights?level=account&fields=spend,action_values&time_range=${encodeURIComponent(JSON.stringify({ since: sevenDaysAgo, until: today }))}&access_token=${clientData.aiConfig.metaToken}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.data?.[0]) {
        const stats = data.data[0];
        const spend = parseFloat(stats.spend || "0");
        const revenue = parseFloat(stats.action_values?.find((v: any) => v.action_type === 'purchase')?.value || "0");
        setMetaMetrics({ roas: spend > 0 ? revenue / spend : 0, revenue, spend });
      }
    } catch (e) { console.error(e); } finally { setLoadingMeta(false); }
  }, []);

  useEffect(() => {
    const c = db.getClients().find(cl => cl.id === id);
    if (c) {
      setClient(c);
      setSessions(db.getSessions(c.id));
      setAllLessons(db.getLessons());
      const user = db.getUsers().find(u => u.clientId === c.id);
      if (user) setCourseProgress(db.getProgress(user.id));
      fetchMetaMetrics(c);
    }
  }, [id, fetchMetaMetrics]);

  if (!client) return <div className="p-20 text-center font-black uppercase text-gray-400">Paciente no encontrado</div>;

  const allTasks = sessions.flatMap(s => s.tasks);
  const pendingTasks = allTasks.filter(t => !t.isCompleted);
  const taskPercent = allTasks.length > 0 ? Math.round(( (allTasks.length - pendingTasks.length) / allTasks.length) * 100) : 0;
  
  const coursePercent = allLessons.length > 0 ? Math.round((courseProgress.filter(p => p.isCompleted).length / allLessons.length) * 100) : 0;

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <button onClick={() => navigate('/admin')} className="flex items-center gap-2 text-red-600 font-black uppercase text-[10px] tracking-widest hover:translate-x-[-4px] transition-all">
          <ArrowLeft size={16} /> Volver al Central
        </button>
        <div className="text-right">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Expediente Clínico de:</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">{client.name}</h1>
        </div>
      </div>

      {/* DASHBOARD DE SALUD (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center"><DollarSign size={28} /></div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Facturación (7d)</p>
               <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic">${metaMetrics?.revenue.toLocaleString() || '---'}</h3>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center"><Target size={28} /></div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">ROAS Actual</p>
               <h3 className="text-3xl font-black text-indigo-600 tracking-tighter italic">{metaMetrics?.roas.toFixed(2) || '---'}x</h3>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center"><ListTodo size={28} /></div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Progreso Tareas</p>
               <h3 className="text-3xl font-black text-red-600 tracking-tighter italic">{taskPercent}%</h3>
            </div>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm flex items-center gap-6">
            <div className="w-14 h-14 bg-indigo-900 text-white rounded-2xl flex items-center justify-center"><BookOpen size={28} /></div>
            <div>
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Progreso Academia</p>
               <h3 className="text-3xl font-black text-indigo-900 tracking-tighter italic">{coursePercent}%</h3>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* PANEL DE TAREAS PENDIENTES */}
        <div className="lg:col-span-7 space-y-6">
           <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-10 border-b flex items-center gap-4 bg-gray-50/50">
                 <div className="p-3 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100"><Activity size={24} /></div>
                 <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Tratamiento Pendiente</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acciones que el paciente aún no ha ejecutado</p>
                 </div>
              </div>
              <div className="p-10 space-y-4">
                 {pendingTasks.map(task => (
                   <div key={task.id} className="p-6 bg-gray-50 rounded-[2rem] border border-gray-100 flex items-start gap-5">
                      <div className="mt-1"><Circle size={20} className="text-gray-300" /></div>
                      <div className="flex-1">
                         <div className="flex justify-between items-start mb-1">
                           <h4 className="font-black text-gray-900 uppercase italic tracking-tighter text-lg leading-none">{task.title}</h4>
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${task.urgency === 'urgent' ? 'bg-red-600 text-white' : 'bg-amber-100 text-amber-700'}`}>
                             {task.urgency}
                           </span>
                         </div>
                         <p className="text-xs text-gray-500 font-medium line-clamp-2">{task.description}</p>
                      </div>
                   </div>
                 ))}
                 {pendingTasks.length === 0 && (
                   <div className="py-20 text-center text-gray-300 font-black uppercase italic tracking-tighter flex flex-col items-center">
                      <CheckCircle2 size={48} className="text-green-500 mb-4" />
                      El paciente está al día con el tratamiento
                   </div>
                 )}
              </div>
           </div>
        </div>

        {/* PANEL DE ACADEMIA (CHECKLIST) */}
        <div className="lg:col-span-5 space-y-6">
           <div className="bg-indigo-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden h-full">
              <div className="relative z-10 flex flex-col h-full">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 bg-white/10 rounded-2xl"><BookOpen size={24} /></div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">Seguimiento de Academia</h3>
                 </div>
                 
                 <div className="flex-1 space-y-4 overflow-y-auto max-h-[500px] no-scrollbar pr-2">
                    {allLessons.map(lesson => {
                      const isCompleted = courseProgress.some(p => p.lessonId === lesson.id && p.isCompleted);
                      return (
                        <div key={lesson.id} className={`p-5 rounded-2xl border flex items-center justify-between transition-all ${isCompleted ? 'bg-white/10 border-white/20' : 'bg-black/20 border-white/5 opacity-50'}`}>
                           <div className="flex items-center gap-3">
                              {isCompleted ? <CheckCircle2 size={18} className="text-green-400" /> : <Clock size={18} className="text-gray-500" />}
                              <span className="text-sm font-bold truncate max-w-[200px]">{lesson.title}</span>
                           </div>
                           <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${isCompleted ? 'bg-green-400 text-green-900' : 'bg-gray-700 text-gray-400'}`}>
                              {isCompleted ? 'Visto' : 'Pendiente'}
                           </span>
                        </div>
                      );
                    })}
                 </div>

                 <div className="mt-8 pt-8 border-t border-white/10 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Nivel de compromiso educativo</p>
                    <div className="text-5xl font-black">{coursePercent}%</div>
                 </div>
              </div>
              <Stethoscope className="absolute -bottom-20 -right-20 text-white/5" size={300} />
           </div>
        </div>
      </div>
    </div>
  );
};

export default ClientHealthView;
