
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../App';
import { db } from '../../services/db';
import { Client, AIConfig } from '../../types';
import { 
  Facebook, 
  Target, 
  RefreshCw, 
  DollarSign, 
  ChevronUp, 
  ChevronDown, 
  Zap, 
  UserPlus,
  CreditCard,
  ArrowUpDown,
  Loader2,
  TrendingUp,
  Layers,
  AlertCircle
} from 'lucide-react';

type SortKey = 'sales' | 'spend' | 'roas' | 'name' | 'revenue' | 'ctr' | 'cpm' | 'visits';
type ViewLevel = 'campaigns' | 'adsets' | 'ads';

interface MetaData {
  name: string;
  campaignName?: string;
  adsetName?: string;
  spend: number;
  sales: number;
  revenue: number;
  visits: number;
  ctr: number;
  cpm: number;
  roas: number;
}

// Subcomponentes movidos fuera para estabilidad en mobile
const LevelSelector = ({ stage, currentLevel, onLevelChange }: { stage: string, currentLevel: ViewLevel, onLevelChange: (lvl: ViewLevel) => void }) => (
  <div className="flex bg-white/50 p-1 rounded-xl border border-gray-100 w-full md:w-auto overflow-x-auto no-scrollbar">
    {(['campaigns', 'adsets', 'ads'] as ViewLevel[]).map((lvl) => (
      <button
        key={lvl}
        onClick={() => onLevelChange(lvl)}
        className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
          currentLevel === lvl ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'
        }`}
      >
        {lvl === 'campaigns' ? 'Campañas' : lvl === 'adsets' ? 'Conjuntos' : 'Anuncios'}
      </button>
    ))}
  </div>
);

const MetaInsightsView: React.FC = () => {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [insights, setInsights] = useState<{
    stats: any;
    campaigns: MetaData[];
    adsets: MetaData[];
    ads: MetaData[];
  } | null>(null);
  
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  const [levels, setLevels] = useState<Record<string, ViewLevel>>({
    presentacion: 'campaigns',
    evaluacion: 'campaigns',
    conversion: 'campaigns'
  });

  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' }>({ 
    key: 'spend', 
    direction: 'desc' 
  });

  const fetchMetaInsights = async (config: AIConfig, start: string, end: string) => {
    const rawAccountId = config.metaAccountId || '';
    const cleanId = rawAccountId.trim();
    const accountId = cleanId.startsWith('act_') ? cleanId : `act_${cleanId}`;
    const token = config.metaToken;
    const timeRange = encodeURIComponent(JSON.stringify({ since: start, until: end }));
    const fields = 'spend,clicks,impressions,actions,action_values,inline_link_click_ctr,cpm';

    const urls = {
      campaign: `https://graph.facebook.com/v19.0/${accountId}/insights?level=campaign&fields=campaign_name,${fields}&time_range=${timeRange}&limit=100&access_token=${token}`,
      adset: `https://graph.facebook.com/v19.0/${accountId}/insights?level=adset&fields=campaign_name,adset_name,${fields}&time_range=${timeRange}&limit=150&access_token=${token}`,
      ad: `https://graph.facebook.com/v19.0/${accountId}/insights?level=ad&fields=campaign_name,adset_name,ad_name,${fields}&time_range=${timeRange}&limit=200&access_token=${token}`,
    };

    const fetchWithErr = async (url: string) => {
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      return data;
    };

    const [cData, aData, adData] = await Promise.all([
      fetchWithErr(urls.campaign),
      fetchWithErr(urls.adset),
      fetchWithErr(urls.ad)
    ]);

    return processMetaResponse(cData.data || [], aData.data || [], adData.data || []);
  };

  const processMetaResponse = (campaigns: any[], adsets: any[], ads: any[]) => {
    const getActionValue = (actions: any[], type: string) => 
      parseInt(actions?.find((a: any) => a.action_type === type)?.value || "0");

    const getRevenueValue = (values: any[], type: string) => 
      parseFloat(values?.find((v: any) => v.action_type === type)?.value || "0");

    const mapItem = (item: any, nameKey: string): MetaData => {
      const spend = parseFloat(item.spend || "0");
      const sales = getActionValue(item.actions, 'purchase');
      const revenue = getRevenueValue(item.action_values, 'purchase');
      const visits = getActionValue(item.actions, 'link_click') || getActionValue(item.actions, 'landing_page_view');
      const ctr = parseFloat(item.inline_link_click_ctr || "0");
      const cpm = parseFloat(item.cpm || "0");
      return {
        name: item[nameKey],
        campaignName: item.campaign_name,
        adsetName: item.adset_name,
        spend,
        sales,
        revenue,
        visits,
        ctr,
        cpm,
        roas: spend > 0 ? (revenue / spend) : 0
      };
    };

    const formattedCampaigns = campaigns.map(c => mapItem(c, 'campaign_name'));
    const formattedAdsets = adsets.map(a => mapItem(a, 'adset_name'));
    const formattedAds = ads.map(ad => mapItem(ad, 'ad_name'));
    
    return {
      stats: {
        totalSpend: formattedCampaigns.reduce((acc, c) => acc + c.spend, 0),
        totalSales: formattedCampaigns.reduce((acc, c) => acc + c.sales, 0),
        totalRevenue: formattedCampaigns.reduce((acc, c) => acc + c.revenue, 0),
        avgROAS: formattedCampaigns.reduce((acc, c) => acc + c.spend, 0) > 0 
          ? formattedCampaigns.reduce((acc, c) => acc + c.revenue, 0) / formattedCampaigns.reduce((acc, c) => acc + c.spend, 0)
          : 0
      },
      campaigns: formattedCampaigns,
      adsets: formattedAdsets,
      ads: formattedAds
    };
  };

  const handleUpdate = useCallback(async () => {
    const freshClient = db.getClients().find(cl => cl.id === user?.clientId);
    if (!freshClient?.aiConfig?.metaToken || !freshClient?.aiConfig?.metaAccountId) {
      setError("Falta configuración de Meta API.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchMetaInsights(freshClient.aiConfig, startDate, endDate);
      setInsights(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user, startDate, endDate]);

  useEffect(() => {
    if (user?.clientId) {
      const c = db.getClients().find(cl => cl.id === user.clientId);
      if (c) {
        setClient(c);
        handleUpdate();
      }
    }
  }, [user, handleUpdate]);

  const filterByStageAndLevel = (stage: string, level: ViewLevel) => {
    if (!insights) return [];
    const data = insights[level];
    return data.filter(item => {
      const searchStr = `${(item.name || "").toLowerCase()} ${(item.campaignName || "").toLowerCase()} ${(item.adsetName || "").toLowerCase()}`;
      return searchStr.includes(stage.toLowerCase());
    });
  };

  const getSortedData = (data: MetaData[]) => {
    return [...data].sort((a, b) => {
      let valA = a[sortConfig.key] as any;
      let valB = b[sortConfig.key] as any;
      if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const toggleSort = (key: SortKey) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc' }));
  };

  const SortHeader = ({ label, sortKey, align = 'center', hideOnMobile = false }: { label: string, sortKey: SortKey, align?: 'left' | 'center' | 'right', hideOnMobile?: boolean }) => (
    <th className={`px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors group ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'} ${hideOnMobile ? 'hidden sm:table-cell' : ''}`} onClick={() => toggleSort(sortKey)}>
      <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
        <span className="whitespace-nowrap">{label}</span>
        {sortConfig.key === sortKey ? (
          sortConfig.direction === 'desc' ? <ChevronDown size={14} className="text-indigo-600" /> : <ChevronUp size={14} className="text-indigo-600" />
        ) : (
          <ArrowUpDown size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </th>
  );

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Responsivo */}
      <div className="bg-indigo-950 rounded-[2.5rem] md:rounded-[4rem] p-8 md:p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 space-y-4 md:space-y-6">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-2xl shadow-lg shadow-indigo-500/20"><Facebook size={24} /></div>
            <span className="font-black uppercase tracking-[0.3em] md:tracking-[0.4em] text-[9px] md:text-[10px] opacity-70">Data Science Unit</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black leading-tight tracking-tighter italic">Meta Insights</h1>
          <p className="text-base md:text-xl text-indigo-100 font-medium italic opacity-80 leading-relaxed max-w-2xl">
            Análisis profundo de pauta publicitaria. Desglose jerárquico por funnel de conversión.
          </p>
        </div>
      </div>

      {/* Filtros y Acción */}
      <div className="bg-white p-6 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 w-full md:flex-1">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
          <span className="text-gray-300 font-black">→</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 bg-gray-50 border-none rounded-xl md:rounded-2xl px-4 py-3 text-sm font-bold outline-none" />
        </div>
        <button onClick={handleUpdate} disabled={loading} className="w-full md:w-auto bg-indigo-600 text-white px-10 py-4 rounded-[1.5rem] md:rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
          {loading ? <Loader2 className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          Sincronizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-center gap-4 text-red-700 mx-2 md:mx-0 shadow-sm">
           <AlertCircle size={24} className="shrink-0" />
           <div>
             <p className="text-xs font-black uppercase tracking-widest mb-1">Error de API</p>
             <p className="text-sm font-bold">{error}</p>
           </div>
        </div>
      )}

      {insights && !loading && (
        <div className="space-y-8 md:space-y-16 px-2 md:px-0">
          {/* KPI Dashboard - Mobile Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: 'Facturación Meta', value: `$${insights.stats.totalRevenue.toLocaleString()}`, icon: <DollarSign />, color: 'text-green-600' },
              { label: 'ROAS Global', value: `${insights.stats.avgROAS.toFixed(2)}x`, icon: <Target />, color: 'text-indigo-600' },
              { label: 'Ventas Totales', value: insights.stats.totalSales, icon: <TrendingUp />, color: 'text-red-600' },
              { label: 'Inversión', value: `$${insights.stats.totalSpend.toLocaleString()}`, icon: <CreditCard />, color: 'text-gray-900' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm flex flex-col justify-between">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gray-50 ${kpi.color} flex items-center justify-center mb-4 md:mb-6 shadow-sm`}>{kpi.icon}</div>
                <div>
                  <p className="text-[9px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tighter">{kpi.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-10 md:space-y-12">
             {/* ETAPA: PRESENTACION */}
             <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden border-t-8 border-t-indigo-600">
                <div className="p-6 md:p-10 border-b flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 bg-indigo-50/20">
                   <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-indigo-600 text-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-lg shrink-0"><UserPlus size={24} /></div>
                      <h3 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Presentación</h3>
                   </div>
                   <LevelSelector stage="presentacion" currentLevel={levels.presentacion} onLevelChange={(lvl) => setLevels(prev => ({...prev, presentacion: lvl}))} />
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left min-w-[700px] md:min-w-full">
                      <thead className="bg-gray-50">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                            <SortHeader label="Elemento" sortKey="name" align="left" />
                            <SortHeader label="Visitas" sortKey="visits" />
                            <SortHeader label="CTR %" sortKey="ctr" />
                            <SortHeader label="CPM" sortKey="cpm" hideOnMobile />
                            <SortHeader label="Inversión" sortKey="spend" align="right" />
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {getSortedData(filterByStageAndLevel('presentacion', levels.presentacion)).map((c, i) => (
                           <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                              <td className="px-6 md:px-10 py-5 md:py-7">
                                 <p className="font-black text-[11px] text-gray-900 uppercase italic truncate max-w-[200px] md:max-w-[300px] leading-none mb-1">{c.name}</p>
                                 {levels.presentacion !== 'campaigns' && <p className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[200px]">{c.campaignName}</p>}
                              </td>
                              <td className="px-4 py-5 md:py-7 text-center font-black text-indigo-600">{c.visits.toLocaleString()}</td>
                              <td className="px-4 py-5 md:py-7 text-center font-black text-gray-900">{c.ctr.toFixed(2)}%</td>
                              <td className="px-4 py-5 md:py-7 text-center font-bold text-gray-400 hidden sm:table-cell">${c.cpm.toFixed(0)}</td>
                              <td className="px-6 md:px-10 py-5 md:py-7 text-right font-black text-gray-900">${c.spend.toLocaleString()}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* ETAPA: EVALUACION */}
             <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden border-t-8 border-t-amber-500">
                <div className="p-6 md:p-10 border-b flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 bg-amber-50/20">
                   <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-amber-500 text-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-lg shrink-0"><Layers size={24} /></div>
                      <h3 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Evaluación</h3>
                   </div>
                   <LevelSelector stage="evaluacion" currentLevel={levels.evaluacion} onLevelChange={(lvl) => setLevels(prev => ({...prev, evaluacion: lvl}))} />
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left min-w-[700px] md:min-w-full">
                      <thead className="bg-gray-50">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                            <SortHeader label="Elemento" sortKey="name" align="left" />
                            <SortHeader label="ROAS" sortKey="roas" />
                            <SortHeader label="Ventas" sortKey="sales" />
                            <SortHeader label="Ingresos" sortKey="revenue" hideOnMobile />
                            <SortHeader label="Inversión" sortKey="spend" align="right" />
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {getSortedData(filterByStageAndLevel('evaluacion', levels.evaluacion)).map((c, i) => (
                           <tr key={i} className="hover:bg-amber-50/30 transition-colors">
                              <td className="px-6 md:px-10 py-5 md:py-7">
                                 <p className="font-black text-[11px] text-gray-900 uppercase italic truncate max-w-[200px] md:max-w-[300px] leading-none mb-1">{c.name}</p>
                                 {levels.evaluacion !== 'campaigns' && <p className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[200px]">{c.campaignName}</p>}
                              </td>
                              <td className="px-4 py-5 md:py-7 text-center font-black text-amber-600">{c.roas.toFixed(2)}x</td>
                              <td className="px-4 py-5 md:py-7 text-center font-black text-gray-900">{c.sales}</td>
                              <td className="px-4 py-5 md:py-7 text-center font-black text-gray-900 hidden sm:table-cell">${c.revenue.toLocaleString()}</td>
                              <td className="px-6 md:px-10 py-5 md:py-7 text-right font-black text-gray-900">${c.spend.toLocaleString()}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* ETAPA: CONVERSION */}
             <div className="bg-white rounded-[2rem] md:rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden border-t-8 border-t-green-600">
                <div className="p-6 md:p-10 border-b flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 bg-green-50/20">
                   <div className="flex items-center gap-4 md:gap-5 w-full md:w-auto">
                      <div className="w-12 h-12 md:w-14 md:h-14 bg-green-600 text-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shadow-lg shrink-0"><Zap size={24} /></div>
                      <h3 className="text-xl md:text-3xl font-black text-gray-900 tracking-tighter uppercase leading-none italic">Conversión</h3>
                   </div>
                   <LevelSelector stage="conversion" currentLevel={levels.conversion} onLevelChange={(lvl) => setLevels(prev => ({...prev, conversion: lvl}))} />
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left min-w-[700px] md:min-w-full">
                      <thead className="bg-gray-50">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                            <SortHeader label="Elemento" sortKey="name" align="left" />
                            <SortHeader label="Ventas" sortKey="sales" />
                            <SortHeader label="Facturación" sortKey="revenue" />
                            <SortHeader label="ROAS" sortKey="roas" />
                            <SortHeader label="Inversión" sortKey="spend" align="right" hideOnMobile />
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {getSortedData(filterByStageAndLevel('conversion', levels.conversion)).map((c, i) => (
                           <tr key={i} className="hover:bg-green-50/30 transition-colors">
                              <td className="px-6 md:px-10 py-5 md:py-7">
                                 <p className="font-black text-[11px] text-gray-900 uppercase italic truncate max-w-[200px] md:max-w-[300px] leading-none mb-1">{c.name}</p>
                                 {levels.conversion !== 'campaigns' && <p className="text-[9px] font-bold text-gray-400 uppercase truncate max-w-[200px]">{c.campaignName}</p>}
                              </td>
                              <td className="px-4 py-5 md:py-7 text-center font-black text-gray-900">{c.sales}</td>
                              <td className="px-4 py-5 md:py-7 text-center font-black text-gray-900">${c.revenue.toLocaleString()}</td>
                              <td className="px-4 py-5 md:py-7 text-center font-black text-green-600">{c.roas.toFixed(2)}x</td>
                              <td className="px-6 md:px-10 py-5 md:py-7 text-right font-black text-gray-900 hidden sm:table-cell">${c.spend.toLocaleString()}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MetaInsightsView;
