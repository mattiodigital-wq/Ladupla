
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { db } from '../../services/db';
import { Client, AIConfig } from '../../types';
import { 
  Globe, 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Activity, 
  CreditCard, 
  PieChart, 
  ArrowUpDown, 
  ChevronUp, 
  ChevronDown, 
  Filter, 
  RefreshCw, 
  AlertCircle,
  Stethoscope,
  ArrowRight,
  Search,
  BarChart3,
  Lock
} from 'lucide-react';

type GSortKey = 'name' | 'revenue' | 'sales' | 'quantity';

const AnalyticsInsightsView: React.FC = () => {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [gaInsights, setGaInsights] = useState<any>(null);

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);

  // Ordenamiento
  const [sourcesSort, setSourcesSort] = useState<{ key: GSortKey, direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });
  const [productsSort, setProductsSort] = useState<{ key: GSortKey, direction: 'asc' | 'desc' }>({ key: 'revenue', direction: 'desc' });

  useEffect(() => {
    if (user?.clientId) {
      const c = db.getClients().find(cl => cl.id === user.clientId);
      if (c) {
        setClient(c);
        if (c.aiConfig?.analyticsId && c.aiConfig?.analyticsToken) {
          handleUpdate();
        }
      }
    }
  }, [user]);

  const handleUpdate = async () => {
    if (!client?.aiConfig?.analyticsId) return;
    setLoading(true);
    setError(null);
    setIsAuthError(false);
    try {
      const propertyId = client.aiConfig.analyticsId;
      const token = client.aiConfig.analyticsToken;
      const url = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const body = {
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        metrics: [
          { name: 'totalRevenue' },
          { name: 'transactions' },
          { name: 'sessionConversionRate' },
          { name: 'averagePurchaseRevenue' }
        ],
        dimensions: [
          { name: 'sessionSourceMedium' }
        ],
        limit: 20
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      if (response.status === 401) {
        setIsAuthError(true);
        throw new Error('La sesión de Google ha expirado. Es necesario re-vincular la cuenta en el panel de administrador.');
      }

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || 'Error GA4 API');
      }

      const data = await response.json();
      
      const metricValues = data.totals?.[0]?.metricValues || [];
      const stats = {
        totalRevenue: parseFloat(metricValues[0]?.value || "0"),
        transactions: parseInt(metricValues[1]?.value || "0"),
        convRate: parseFloat(metricValues[2]?.value || "0") * 100,
        aov: parseFloat(metricValues[3]?.value || "0")
      };

      const sources = (data.rows || []).map((row: any) => ({
        name: row.dimensionValues[0].value,
        revenue: parseFloat(row.metricValues[0].value),
        sales: parseInt(row.metricValues[1].value)
      }));

      // Productos
      const prodBody = {
        dateRanges: [{ startDate: startDate, endDate: endDate }],
        dimensions: [{ name: 'itemName' }],
        metrics: [{ name: 'itemRevenue' }, { name: 'itemsPurchased' }],
        limit: 20
      };
      const prodRes = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(prodBody)
      });
      const prodData = await prodRes.json();
      const products = (prodData.rows || []).map((row: any) => ({
        name: row.dimensionValues[0].value,
        revenue: parseFloat(row.metricValues[0].value),
        quantity: parseInt(row.metricValues[1].value)
      }));

      setGaInsights({ stats, sources, products });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const getSortedData = (data: any[], config: { key: GSortKey, direction: 'asc' | 'desc' }) => {
    if (!data) return [];
    return [...data].sort((a, b) => {
      let valA = a[config.key];
      let valB = b[config.key];
      if (typeof valA === 'string') { valA = valA.toLowerCase(); valB = valB.toLowerCase(); }
      if (valA < valB) return config.direction === 'asc' ? -1 : 1;
      if (valA > valB) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const SortHeader = ({ label, sortKey, config, setConfig, align = 'center' }: { label: string, sortKey: GSortKey, config: any, setConfig: any, align?: 'left' | 'center' | 'right' }) => (
    <th 
      className={`px-4 py-5 cursor-pointer hover:bg-gray-100 transition-colors group ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`} 
      onClick={() => setConfig({ key: sortKey, direction: config.key === sortKey && config.direction === 'desc' ? 'asc' : 'desc' })}
    >
      <div className={`flex items-center gap-1 ${align === 'center' ? 'justify-center' : align === 'right' ? 'justify-end' : 'justify-start'}`}>
        {label}
        {config.key === sortKey ? (
          config.direction === 'desc' ? <ChevronDown size={14} className="text-blue-600" /> : <ChevronUp size={14} className="text-blue-600" />
        ) : (
          <ArrowUpDown size={12} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
      </div>
    </th>
  );

  if (!client?.aiConfig?.analyticsId) return (
    <div className="h-full flex flex-col items-center justify-center p-20 text-center space-y-4">
      <Globe size={48} className="text-gray-300" />
      <h2 className="text-2xl font-black text-gray-900">Analytics no conectado</h2>
      <p className="text-gray-500 max-w-sm">Contacta con tu administrador para vincular la propiedad de GA4.</p>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* HEADER */}
      <div className="bg-blue-950 rounded-[4rem] p-12 md:p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-2xl shadow-lg shadow-blue-500/20"><Globe size={24} /></div>
              <span className="font-black uppercase tracking-[0.4em] text-[10px] opacity-70">Analytics Intelligence Unit</span>
            </div>
            <h1 className="text-6xl font-black leading-tight tracking-tighter italic">Radiografía Analytics 4</h1>
            <p className="text-xl text-blue-200 font-medium italic opacity-80">Auditoría de comportamiento e-commerce y atribución de fuentes.</p>
          </div>
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[3rem] text-center shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Estado del Paciente</p>
            <div className="flex items-center gap-3">
               <div className={`w-3 h-3 rounded-full ${isAuthError ? 'bg-red-500' : 'bg-blue-500 animate-pulse'} shadow-lg`}></div>
               <span className="text-lg font-black uppercase tracking-tighter">{isAuthError ? 'Desvinculado' : 'Sincronizado'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-3">
          <Filter size={20} className="text-blue-600" />
          <span className="text-xs font-black uppercase tracking-widest text-gray-400">Rango de Sincronización:</span>
        </div>
        <div className="flex items-center gap-3 flex-1 min-w-[300px]">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
          <span className="text-gray-300 font-black">→</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
        </div>
        <button onClick={handleUpdate} disabled={loading} className="bg-blue-600 text-white px-10 py-4 rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center gap-3 shadow-xl shadow-blue-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
          {loading ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
          {loading ? 'Consultando...' : 'Escanear Tráfico'}
        </button>
      </div>

      {loading && (
        <div className="py-24 flex flex-col items-center justify-center space-y-6">
          <div className="w-16 h-16 border-[6px] border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-blue-600 font-black uppercase text-xs tracking-[0.2em] animate-pulse">Analizando trazas de navegación...</p>
        </div>
      )}

      {error && (
        <div className={`p-10 rounded-[3rem] border-2 flex items-center gap-6 animate-in slide-in-from-top-4 duration-500 ${isAuthError ? 'bg-amber-50 border-amber-100 text-amber-800' : 'bg-red-50 border-red-100 text-red-700'}`}>
          <div className={`p-4 rounded-2xl ${isAuthError ? 'bg-amber-100' : 'bg-red-100'}`}>
            {isAuthError ? <Lock size={32} /> : <AlertCircle size={32} />}
          </div>
          <div>
            <p className="font-black uppercase text-xs tracking-widest mb-1">{isAuthError ? 'Credenciales Expiradas' : 'Error de Conexión'}</p>
            <p className="font-bold text-lg leading-tight">{error}</p>
            {isAuthError && (
              <p className="text-sm font-medium mt-2 opacity-80">Por favor, notifica a tu administrador para que refresque la vinculación de Google Analytics.</p>
            )}
          </div>
        </div>
      )}

      {gaInsights && !loading && (
        <>
          {/* KPI DASHBOARD */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { label: 'Facturación GA4', value: `$${gaInsights.stats.totalRevenue.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`, icon: <DollarSign />, color: 'text-blue-600' },
              { label: 'Transacciones', value: gaInsights.stats.transactions, icon: <ShoppingBag />, color: 'text-green-600' },
              { label: 'Conversion Rate', value: `${gaInsights.stats.convRate.toFixed(2)}%`, icon: <Activity />, color: 'text-amber-600' },
              { label: 'Ticket Promedio (AOV)', value: `$${gaInsights.stats.aov.toFixed(0)}`, icon: <CreditCard />, color: 'text-indigo-600' },
            ].map((kpi, i) => (
              <div key={i} className="bg-white p-10 rounded-[3.5rem] border border-gray-100 shadow-sm relative group hover:shadow-2xl transition-all border-b-8 border-b-transparent hover:border-b-blue-500">
                <div className={`w-14 h-14 rounded-2xl bg-gray-50 ${kpi.color} flex items-center justify-center mb-6 shadow-sm`}>{kpi.icon}</div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                <h3 className="text-4xl font-black text-gray-900 tracking-tighter">{kpi.value}</h3>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-10">
             {/* TOP FUENTES */}
             <div className="lg:col-span-6 bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden border-t-8 border-t-blue-600">
                <div className="p-10 border-b flex items-center gap-5 bg-blue-50/20">
                   <div className="w-14 h-14 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-blue-100"><PieChart size={28} /></div>
                   <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Fuentes de Ingresos</h3>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Atribución por Fuente / Medio</p>
                   </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                            <SortHeader label="Fuente / Medio" sortKey="name" config={sourcesSort} setConfig={setSourcesSort} align="left" />
                            <SortHeader label="Ventas" sortKey="sales" config={sourcesSort} setConfig={setSourcesSort} />
                            <SortHeader label="Facturación" sortKey="revenue" config={sourcesSort} setConfig={setSourcesSort} align="right" />
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {getSortedData(gaInsights.sources, sourcesSort).map((s: any, i: number) => (
                           <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                              <td className="px-10 py-6 font-black text-[11px] text-gray-900 uppercase">{s.name}</td>
                              <td className="px-6 py-6 text-center font-bold text-gray-600">{s.sales}</td>
                              <td className="px-10 py-6 text-right font-black text-blue-600">${s.revenue.toLocaleString()}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>

             {/* TOP PRODUCTOS */}
             <div className="lg:col-span-6 bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden border-t-8 border-t-green-600">
                <div className="p-10 border-b flex items-center gap-5 bg-green-50/20">
                   <div className="w-14 h-14 bg-green-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl shadow-green-100"><ShoppingBag size={28} /></div>
                   <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Productos Ganadores</h3>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Ranking por Facturación</p>
                   </div>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                   <table className="w-full text-left">
                      <thead className="bg-gray-50">
                         <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
                            <SortHeader label="Producto" sortKey="name" config={productsSort} setConfig={setProductsSort} align="left" />
                            <SortHeader label="Unidades" sortKey="quantity" config={productsSort} setConfig={setProductsSort} />
                            <SortHeader label="Facturación" sortKey="revenue" config={productsSort} setConfig={setProductsSort} align="right" />
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                         {getSortedData(gaInsights.products, productsSort).map((p: any, i: number) => (
                           <tr key={i} className="hover:bg-green-50/30 transition-colors">
                              <td className="px-10 py-6 font-black text-[11px] text-gray-900 truncate max-w-[200px]">{p.name}</td>
                              <td className="px-6 py-6 text-center font-bold text-gray-600">{p.quantity}</td>
                              <td className="px-10 py-6 text-right font-black text-green-600">${p.revenue.toLocaleString()}</td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
          </div>

          {/* DIAGNÓSTICO FINAL */}
          <div className="bg-gray-900 rounded-[4rem] p-16 text-white relative overflow-hidden shadow-2xl">
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 items-center gap-12">
                <div className="md:col-span-8 space-y-6">
                   <div className="flex items-center gap-4">
                      <Stethoscope className="text-blue-400" size={32} />
                      <h3 className="text-3xl font-black uppercase tracking-tighter italic">Nota del Especialista</h3>
                   </div>
                   <p className="text-blue-100 text-lg font-medium leading-loose italic max-w-2xl">
                      "La tasa de conversión del <b>{gaInsights.stats.convRate.toFixed(2)}%</b> indica {gaInsights.stats.convRate > 2 ? 'una excelente salud en el funnel de ventas' : 'oportunidades de mejora en la experiencia de usuario'}. El ticket promedio de <b>${gaInsights.stats.aov.toFixed(0)}</b> sugiere {gaInsights.stats.aov > 15000 ? 'un buen posicionamiento de marca' : 'que podrías implementar estrategias de bundle para subir el promedio'}."
                   </p>
                </div>
                <div className="md:col-span-4 bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3.5rem] text-center shadow-inner">
                   <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest mb-4">Ventas GA4</p>
                   <div className="text-6xl font-black text-blue-400 tracking-tighter">
                      {gaInsights.stats.transactions}
                   </div>
                   <p className="text-[10px] font-black text-blue-500 uppercase mt-4">Pedidos Confirmados</p>
                </div>
             </div>
             <Activity className="absolute -bottom-32 -right-32 text-white/5 rotate-12" size={500} />
          </div>
        </>
      )}
    </div>
  );
};

export default AnalyticsInsightsView;
