
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../../services/db';
import { Client } from '../../types';
import { 
  RefreshCw, 
  DollarSign, 
  PieChart, 
  Stethoscope, 
  TrendingUp, 
  TrendingDown,
  Activity
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ClientMetrics {
  revenue?: number;
  roas?: number;
  sales?: number;
  salesLast24h?: number;
  revenueDiff?: number;
  roasDiff?: number;
  loading?: boolean;
}

export const Overview = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [metricsMap, setMetricsMap] = useState<Record<string, ClientMetrics>>({});

  const fetchClientHealth = useCallback(async (client: Client) => {
    if (!client.aiConfig?.metaToken || !client.aiConfig?.metaAccountId) return;
    try {
      const token = client.aiConfig.metaToken;
      const accountId = client.aiConfig.metaAccountId.startsWith('act_') ? client.aiConfig.metaAccountId : `act_${client.aiConfig.metaAccountId}`;
      
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

      const formatDate = (d: Date) => d.toISOString().split('T')[0];

      const r24h = encodeURIComponent(JSON.stringify({ since: formatDate(yesterday), until: formatDate(today) }));
      const rCurrent = encodeURIComponent(JSON.stringify({ since: formatDate(sevenDaysAgo), until: formatDate(today) }));
      const rPrev = encodeURIComponent(JSON.stringify({ since: formatDate(fourteenDaysAgo), until: formatDate(sevenDaysAgo) }));

      const fields = 'spend,action_values,actions';
      const [res24, resC, resP] = await Promise.all([
        fetch(`https://graph.facebook.com/v19.0/${accountId}/insights?level=account&fields=${fields}&time_range=${r24h}&access_token=${token}`).then(r => r.json()),
        fetch(`https://graph.facebook.com/v19.0/${accountId}/insights?level=account&fields=${fields}&time_range=${rCurrent}&access_token=${token}`).then(r => r.json()),
        fetch(`https://graph.facebook.com/v19.0/${accountId}/insights?level=account&fields=${fields}&time_range=${rPrev}&access_token=${token}`).then(r => r.json())
      ]);

      const getStats = (res: any) => {
        const d = res?.data?.[0] || {};
        return {
          spend: parseFloat(d.spend || "0"),
          rev: parseFloat(d.action_values?.find((v: any) => v.action_type === 'purchase')?.value || "0"),
          sales: parseInt(d.actions?.find((a: any) => a.action_type === 'purchase')?.value || "0")
        };
      };

      const s24 = getStats(res24);
      const sc = getStats(resC);
      const sp = getStats(resP);

      const roasC = sc.spend > 0 ? sc.rev / sc.spend : 0;
      const roasP = sp.spend > 0 ? sp.rev / sp.spend : 0;

      setMetricsMap(prev => ({
        ...prev,
        [client.id]: {
          revenue: sc.rev,
          roas: roasC,
          sales: sc.sales,
          salesLast24h: s24.sales,
          revenueDiff: sp.rev > 0 ? ((sc.rev - sp.rev) / sp.rev) * 100 : 0,
          roasDiff: roasP > 0 ? ((roasC - roasP) / roasP) * 100 : 0,
          loading: false
        }
      }));
    } catch (e) { 
      console.error(`Err: ${client.name}`, e);
      setMetricsMap(prev => ({ ...prev, [client.id]: { loading: false } }));
    }
  }, []);

  const loadData = useCallback(() => {
    const fetchedClients = db.getClients();
    setClients(fetchedClients);
    
    fetchedClients.forEach(client => {
      if (client.aiConfig?.metaToken) {
        setMetricsMap(prev => ({ 
          ...prev, 
          [client.id]: { ...prev[client.id], loading: true } 
        }));
        fetchClientHealth(client);
      }
    });
  }, [fetchClientHealth]);

  useEffect(() => { loadData(); }, [loadData]);

  const calculateAccounting = () => {
    let pending = 0, collected = 0, thisMonth = 0, newRev = 0;
    const now = new Date();
    clients.forEach(c => {
      const installments = c.billing?.installments || [];
      installments.forEach(ins => {
        if (ins.isPaid) {
          collected += ins.amount;
          const paidDate = ins.paidAt ? new Date(ins.paidAt) : null;
          if (paidDate && paidDate.getMonth() === now.getMonth()) {
            thisMonth += ins.amount;
          }
        } else {
          pending += ins.amount;
        }
      });
      const createdDate = new Date(c.createdAt);
      if (createdDate.getMonth() === now.getMonth()) {
        newRev += (c.billing?.totalMentorshipValue || 0);
      }
    });
    return { pending, collected, thisMonth, newRev };
  };

  const acc = calculateAccounting();

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-5xl font-black text-gray-900 uppercase italic tracking-tighter leading-none">Mesa de Control</h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Gestión de Marcas y Rendimiento Financiero.</p>
        </div>
        <button onClick={loadData} className="p-4 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-[#b10000] transition-all shadow-sm">
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="bg-gray-900 rounded-[3.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
         <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
               <p className="text-[10px] font-black text-red-500 uppercase mb-2">Por Cobrar</p>
               <h4 className="text-3xl font-black italic tracking-tighter">${acc.pending.toLocaleString()}</h4>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
               <p className="text-[10px] font-black text-green-500 uppercase mb-2">Ingreso Mes</p>
               <h4 className="text-3xl font-black italic tracking-tighter">${acc.thisMonth.toLocaleString()}</h4>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10">
               <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Ventas Mes</p>
               <h4 className="text-3xl font-black italic tracking-tighter">${acc.newRev.toLocaleString()}</h4>
            </div>
            <div className="bg-white/5 p-6 rounded-[2rem] border border-white/10 text-center">
               <PieChart size={32} className="mx-auto text-red-600 mb-2" />
               <p className="text-[9px] font-black uppercase text-gray-500">Salud Financiera</p>
            </div>
         </div>
         <DollarSign className="absolute -bottom-10 -right-10 text-white/5" size={200} />
      </div>

      <div className="bg-white rounded-[3.5rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-10 border-b bg-gray-50/50">
           <h2 className="text-2xl font-black uppercase italic tracking-tighter text-gray-900">Signos Vitales de Marcas</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-10 py-6">Paciente / Marca</th>
                <th className="px-6 py-6">Facturación (7d)</th>
                <th className="px-6 py-6">ROAS</th>
                <th className="px-6 py-6 text-center">Ventas 24h</th>
                <th className="px-10 py-6 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {clients.map(client => {
                const metrics = metricsMap[client.id] || { loading: false };
                const salesLast24h = metrics.salesLast24h || 0;
                const hasRecentSales = salesLast24h !== 0;
                const revenueText = metrics.revenue !== undefined ? `$${metrics.revenue.toLocaleString()}` : '---';
                const roasText = metrics.roas !== undefined ? `${metrics.roas.toFixed(2)}x` : '---';

                return (
                  <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group font-['Montserrat']">
                    <td className="px-10 py-8">
                       <p className="font-black text-gray-900 uppercase italic tracking-tighter text-lg leading-none">{client.name}</p>
                       <span className={`text-[8px] font-black px-2 py-0.5 rounded ${client.isActive ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                         {client.isActive ? 'ACTIVO' : 'SUSPENDIDO'}
                       </span>
                    </td>
                    <td className="px-6 py-8">
                       {metrics.loading ? <div className="w-20 h-4 bg-gray-100 animate-pulse rounded"></div> : (
                         <span className="font-black text-gray-900 text-lg">{revenueText}</span>
                       )}
                    </td>
                    <td className="px-6 py-8">
                       {metrics.loading ? <div className="w-10 h-4 bg-gray-100 animate-pulse rounded"></div> : (
                         <span className="font-black text-indigo-600 text-lg">{roasText}</span>
                       )}
                    </td>
                    <td className="px-6 py-8 text-center">
                       {metrics.loading ? <div className="w-6 h-6 bg-gray-100 animate-pulse rounded-full mx-auto"></div> : (
                         <div className="flex flex-col items-center">
                            <div className={`w-3 h-3 rounded-full ${hasRecentSales ? 'bg-green-500 animate-pulse shadow-lg shadow-green-200' : 'bg-gray-200'}`}></div>
                            <span className="text-[10px] font-black mt-1">{salesLast24h} vtas</span>
                         </div>
                       )}
                    </td>
                    <td className="px-10 py-8 text-right flex items-center justify-end gap-3">
                      <Link to={`/admin/health/${client.id}`} className="p-3 bg-gray-50 text-gray-400 hover:bg-[#b10000] hover:text-white rounded-2xl shadow-sm transition-all"><Stethoscope size={18} /></Link>
                      <Link to="/admin/clients" className="bg-[#b10000] text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-red-100">Ficha</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
