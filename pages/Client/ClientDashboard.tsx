
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../App';
import { db } from '../../services/db';
import { Client, ReportSection, AuditTask } from '../../types';
import { SECTIONS } from '../../constants';
import { 
  AlertTriangle, 
  AlertCircle,
  Loader2, 
  Circle,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  RefreshCw,
  ArrowRight,
  Activity,
  HeartPulse,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';

const MetricCard = ({ label, value, prevValue, icon, color }: { label: string, value: number, prevValue: number, icon: any, color: string }) => {
  const getDiff = (curr: number, prev: number) => {
    if (prev === 0) return 0;
    return ((curr - prev) / prev) * 100;
  };

  const diff = getDiff(value, prevValue);
  const isRevenue = label.toLowerCase().includes('ventas');
  const isRoas = label.toLowerCase().includes('roas');
  
  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between h-full">
      <div className="flex justify-between items-start">
         <div className={`p-3 md:p-4 ${color} bg-opacity-10 rounded-2xl`}>{icon}</div>
         <div className={`flex items-center text-[10px] font-black ${diff >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(diff).toFixed(1)}%
         </div>
      </div>
      <div className="mt-4 md:mt-6">
         <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{label}</p>
         <h3 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter italic">
           {isRoas ? `${value.toFixed(2)}x` : isRevenue ? `$${value.toLocaleString()}` : value}
         </h3>
      </div>
    </div>
  );
};

const ClientDashboard: React.FC = () => {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [activeSection, setActiveSection] = useState<ReportSection>('ventas');
  const [pendingTasks, setPendingTasks] = useState<{task: AuditTask, sessionId: string}[]>([]);
  const [iframeLoading, setIframeLoading] = useState(true);
  
  const [metrics, setMetrics] = useState<{ 
    current: { roas: number, revenue: number, sales: number }, 
    prev: { roas: number, revenue: number, sales: number },
    sales24h: number
  } | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const formatLookerUrl = (url: string) => {
    if (!url) return '';
    let formatted = url.trim();
    if (formatted.indexOf('/reporting/') !== -1 && formatted.indexOf('/embed/reporting/') === -1) {
      formatted = formatted.replace('/reporting/', '/embed/reporting/');
    }
    if (formatted.indexOf('/edit') !== -1) {
      formatted = formatted.split('/edit')[0];
    }
    return formatted;
  };

  const fetchMetrics = useCallback(async (clientId: string) => {
    const freshClient = db.getClients().find(cl => cl.id === clientId);
    if (!freshClient?.aiConfig?.metaToken || !freshClient?.aiConfig?.metaAccountId) return;

    setLoadingMeta(true);
    setApiError(null);
    try {
      const token = freshClient.aiConfig.metaToken;
      const accountId = freshClient.aiConfig.metaAccountId.trim().replace('act_', '');
      const fullAccountId = `act_${accountId}`;
      
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const s7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const s14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      const [res24, resC, resP] = await Promise.all([
        fetch(`https://graph.facebook.com/v19.0/${fullAccountId}/insights?level=account&fields=actions&time_range=${encodeURIComponent(JSON.stringify({ since: formatDate(yesterday), until: formatDate(today) }))}&access_token=${token}`).then(r => r.json()),
        fetch(`https://graph.facebook.com/v19.0/${fullAccountId}/insights?level=account&fields=spend,actions,action_values&time_range=${encodeURIComponent(JSON.stringify({ since: formatDate(s7), until: formatDate(today) }))}&access_token=${token}`).then(r => r.json()),
        fetch(`https://graph.facebook.com/v19.0/${fullAccountId}/insights?level=account&fields=spend,actions,action_values&time_range=${encodeURIComponent(JSON.stringify({ since: formatDate(s14), until: formatDate(s7) }))}&access_token=${token}`).then(r => r.json())
      ]);

      if (resC.error) throw new Error(resC.error.message);

      const processStats = (data: any) => {
        const d = data.data?.[0] || {};
        const spend = parseFloat(d.spend || "0");
        const actions = d.actions || [];
        const actionValues = d.action_values || [];
        const rev = parseFloat(actionValues.find((v: any) => v.action_type === 'purchase')?.value || "0");
        const vtas = parseInt(actions.find((a: any) => a.action_type === 'purchase')?.value || "0");
        return { roas: spend > 0 ? rev / spend : 0, revenue: rev, sales: vtas };
      };

      const s24 = parseInt(res24.data?.[0]?.actions?.find((a: any) => a.action_type === 'purchase')?.value || "0");

      setMetrics({
        current: processStats(resC),
        prev: processStats(resP),
        sales24h: s24
      });
    } catch (e: any) { 
      console.error(e);
      setApiError(e.message);
    } finally { setLoadingMeta(false); }
  }, []);

  useEffect(() => {
    if (user?.clientId) {
      const c = db.getClients().find(cl => cl.id === user.clientId);
      if (c) {
        setClient(c);
        fetchMetrics(user.clientId);
        const sessions = db.getSessions(user.clientId);
        const tasks: {task: AuditTask, sessionId: string}[] = [];
        sessions.forEach(s => s.tasks.filter(t => !t.isCompleted).forEach(t => tasks.push({ task: t, sessionId: s.id })));
        setPendingTasks(tasks);
      }
    }
  }, [user, fetchMetrics]);

  if (!client) return <div className="p-20 text-center animate-pulse font-black uppercase text-gray-400">Invocando Historial...</div>;

  const health = (() => {
    if (!metrics) return { label: 'Analizando...', color: 'text-gray-400', bg: 'bg-gray-50', icon: <Activity className="opacity-20" /> };
    const roas = metrics.current.roas;
    if (roas < 6) return { label: 'CRÍTICO', color: 'text-red-600', bg: 'bg-red-50', icon: <Activity className="animate-pulse" /> };
    if (roas < 10) return { label: 'ESTABLE', color: 'text-amber-600', bg: 'bg-amber-50', icon: <HeartPulse /> };
    return { label: 'EXCELENTE', color: 'text-green-600', bg: 'bg-green-50', icon: <TrendingUp /> };
  })();

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 pb-20 px-2 md:px-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard label="Ventas Meta (7d)" value={metrics?.current.revenue || 0} prevValue={metrics?.prev.revenue || 0} icon={<DollarSign className="text-green-600" />} color="bg-green-600" />
        <MetricCard label="ROAS Meta (7d)" value={metrics?.current.roas || 0} prevValue={metrics?.prev.roas || 0} icon={<Zap className="text-indigo-600" />} color="bg-indigo-600" />
        
        <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between h-full">
           <div className="flex justify-between items-start">
              <div className="p-3 md:p-4 bg-red-50 text-red-600 rounded-2xl shadow-sm"><Activity size={24} /></div>
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] md:text-[9px] font-black uppercase ${metrics?.sales24h ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                 <div className={`w-1.5 h-1.5 rounded-full ${metrics?.sales24h ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                 {metrics?.sales24h ? 'OK' : 'OFF'}
              </div>
           </div>
           <div className="mt-4 md:mt-6">
              <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pulso 24h</p>
              <h3 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter italic">{metrics?.sales24h || 0} vtas</h3>
           </div>
        </div>

        <div className={`p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border shadow-sm flex flex-col justify-between h-full transition-all ${health.bg} ${health.color.replace('text-', 'border-')}`}>
           <div className="flex justify-between items-start">
              <div className="p-3 md:p-4 rounded-2xl bg-white shadow-sm">{health.icon}</div>
              <button onClick={() => fetchMetrics(client.id)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                {loadingMeta ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
              </button>
           </div>
           <div className="mt-4 md:mt-6">
              <p className="text-[9px] md:text-[10px] font-black opacity-60 uppercase tracking-widest mb-1">Diagnóstico</p>
              <h3 className={`text-xl md:text-3xl font-black uppercase italic tracking-tighter ${health.color}`}>{health.label}</h3>
           </div>
        </div>
      </div>

      {apiError && (
        <div className="bg-red-50 border border-red-100 p-4 rounded-2xl flex items-center gap-3 text-red-600 text-[10px] md:text-xs font-bold shadow-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>Error Meta API: {apiError}. (En iPhone desactiva 'Bloquear cookies' en Ajustes &gt; Safari)</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between lg:items-end gap-6 border-t pt-8 md:pt-10">
        <div>
          <span className="text-red-600 font-black uppercase text-[9px] md:text-[10px] tracking-widest flex items-center gap-2">
            <Stethoscope size={14} /> Auditoría Estratégica
          </span>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tighter uppercase italic leading-none">{client.name}</h1>
        </div>
        
        <div className="flex bg-white p-1 rounded-[1.5rem] md:rounded-[2rem] border border-gray-100 shadow-sm overflow-x-auto no-scrollbar snap-x">
          {SECTIONS.filter(s => !!client.reportUrls[s.id]).map((section) => (
            <button
              key={section.id}
              onClick={() => { setActiveSection(section.id); setIframeLoading(true); }}
              className={`flex items-center gap-2 px-5 md:px-6 py-3 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase transition-all whitespace-nowrap snap-center ${activeSection === section.id ? 'bg-red-600 text-white shadow-xl shadow-red-100' : 'text-gray-400 hover:text-gray-700'}`}
            >
              <section.icon size={14} /> {section.label}
            </button>
          ))}
        </div>
      </div>

      <div className="relative">
        <div className="h-[600px] md:h-[850px] bg-white rounded-[2rem] md:rounded-[4rem] border-4 border-gray-50 shadow-2xl overflow-hidden relative">
          {client.reportUrls[activeSection] ? (
            <iframe
              src={formatLookerUrl(client.reportUrls[activeSection])}
              onLoad={() => setIframeLoading(false)}
              className="w-full h-full border-none"
              style={{ width: '100%', height: '100%', border: 'none', position: 'absolute' }}
              allowFullScreen
              loading="lazy"
              sandbox="allow-storage-access-by-user-activation allow-scripts allow-same-origin allow-popups allow-forms"
              allow="attribution-reporting; run-ad-auction; join-ad-interest-group; browsing-topics"
            />
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-10 text-center opacity-30">
              <AlertTriangle size={64} className="mb-4" />
              <p className="font-black uppercase tracking-widest">Reporte no configurado</p>
            </div>
          )}
          
          {iframeLoading && client.reportUrls[activeSection] && (
            <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center space-y-4 z-20">
               <Loader2 className="animate-spin text-red-600" size={48} />
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Invocando a Looker Studio...</p>
            </div>
          )}
        </div>
        
        {client.reportUrls[activeSection] && (
          <div className="flex md:hidden justify-center mt-4">
            <a href={formatLookerUrl(client.reportUrls[activeSection])} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">
              <ExternalLink size={14} /> Abrir Reporte Completo
            </a>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4 md:gap-6 mb-8 md:mb-12">
          <div className="w-12 h-12 md:w-16 md:h-16 bg-red-600 text-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-xl shadow-red-100 shrink-0"><Activity size={32} /></div>
          <h2 className="text-2xl md:text-4xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Roadmap Estratégico</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
           {pendingTasks.slice(0, 6).map(({ task, sessionId }) => (
             <div key={task.id} className="p-6 md:p-8 bg-gray-50 rounded-[2rem] md:rounded-[3rem] border border-transparent hover:border-red-100 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-start gap-3 md:gap-4 mb-4">
                    <Circle size={20} className="text-gray-300 shrink-0 mt-1" />
                    <div>
                        <h4 className="font-black text-gray-900 uppercase italic tracking-tighter leading-tight mb-2 text-base md:text-lg">{task.title}</h4>
                        <p className="text-xs text-gray-500 font-medium line-clamp-3">{task.description}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                   <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded ${task.urgency === 'urgent' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>{task.urgency}</span>
                   <Link to={`/session/${sessionId}`} className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1">Protocolo <ArrowRight size={12} /></Link>
                </div>
             </div>
           ))}
           {pendingTasks.length === 0 && (
             <div className="col-span-1 md:col-span-3 py-16 md:py-20 text-center opacity-30">
                <CheckCircle2 size={48} className="mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest">Salud 100%</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
