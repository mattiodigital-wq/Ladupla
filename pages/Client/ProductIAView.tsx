
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../App';
import { Client, LastMetrics, ProductMetric } from '../../types';
import { 
  PackageSearch, 
  TrendingUp, 
  Eye, 
  ShoppingCart, 
  Sparkles, 
  AlertCircle, 
  Stethoscope,
  BarChart3,
  Bot,
  ArrowRight
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ProductIAView: React.FC = () => {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [metrics, setMetrics] = useState<LastMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [quickInsight, setQuickInsight] = useState<string | null>(null);

  useEffect(() => {
    if (user?.clientId) {
      const c = db.getClients().find(cl => cl.id === user.clientId);
      if (c) {
        setClient(c);
        setMetrics(c.aiConfig?.lastMetrics || null);
      }
    }
  }, [user]);

  const generateQuickInsight = async () => {
    if (!metrics) return;
    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Analiza estos datos de productos y dime en 2 frases cuál es el problema de conversión más grande:
      TOP VENTAS: ${metrics.topSold?.map(p => p.name).join(', ')}
      TOP VISITAS: ${metrics.topVisited?.map(p => p.name).join(', ')}
      TOP CARRITO: ${metrics.topAdded?.map(p => p.name).join(', ')}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { systemInstruction: "Eres un analista de inventario experto. Tu tono es directo, profesional y enfocado en accionables." }
      });
      setQuickInsight(response.text || "No se pudo generar el insight.");
    } catch (e) {
      setQuickInsight("Error al conectar con el servidor de diagnóstico.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!client) return null;

  const RankingSection = ({ title, icon, data, color, unit }: { title: string, icon: React.ReactNode, data?: ProductMetric[], color: string, unit: string }) => (
    <div className="bg-white rounded-[2.5rem] border border-gray-100 p-8 shadow-sm flex flex-col h-full">
      <div className="flex items-center gap-3 mb-8">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 ${color.replace('bg-', 'text-')}`}>
          {icon}
        </div>
        <h3 className="text-xl font-black text-gray-900 tracking-tighter uppercase">{title}</h3>
      </div>
      <div className="space-y-4 flex-1">
        {data && data.length > 0 ? (
          data.map((item, idx) => (
            <div key={idx} className="group flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-gray-100">
               <div className="flex items-center gap-4 flex-1 overflow-hidden">
                  <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-[10px] ${idx < 3 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {idx + 1}
                  </span>
                  <p className="font-bold text-sm text-gray-800 truncate">{item.name}</p>
               </div>
               <div className="text-right ml-4">
                  <span className={`font-black text-sm ${color.replace('bg-', 'text-')}`}>{item.value.toLocaleString()}</span>
                  <span className="text-[9px] font-black text-gray-400 uppercase ml-1">{unit}</span>
               </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-300">
             <PackageSearch size={48} className="opacity-20 mb-2" />
             <p className="text-xs font-bold uppercase tracking-widest">Esperando Datos...</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-[3.5rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
              <PackageSearch size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-[10px] opacity-70">Inventory Intelligence Unit</span>
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">Auditoría de Productos</h1>
          <p className="text-xl text-indigo-100 font-medium leading-relaxed">
            Descubre qué productos están moviendo la aguja de tu negocio y cuáles necesitan una intervención estratégica en su embudo de ventas.
          </p>
          
          <div className="mt-10 flex flex-wrap gap-4">
            <button 
              onClick={generateQuickInsight}
              disabled={isAnalyzing || !metrics}
              className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-50 transition-all flex items-center gap-3 shadow-xl active:scale-95 disabled:opacity-50"
            >
              {isAnalyzing ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
              Diagnóstico de Inventario IA
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 flex items-center justify-center pointer-events-none">
          <BarChart3 size={450} />
        </div>
      </div>

      {quickInsight && (
        <div className="bg-indigo-50 border-2 border-indigo-100 p-8 rounded-[2.5rem] flex items-start gap-6 animate-in slide-in-from-top-4 duration-500">
          <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-100 shrink-0">
            <Bot size={32} />
          </div>
          <div>
            <h3 className="font-black text-indigo-900 uppercase tracking-tighter mb-2">Insight Clínico del Dr. AI</h3>
            <p className="text-indigo-800 text-lg font-medium italic leading-relaxed">"{quickInsight}"</p>
          </div>
          <button onClick={() => setQuickInsight(null)} className="text-indigo-300 hover:text-indigo-600 ml-auto">
            <X size={24} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <RankingSection 
          title="Top 10 Ventas" 
          icon={<TrendingUp size={24} />} 
          data={metrics?.topSold} 
          color="bg-emerald-600" 
          unit="uds"
        />
        <RankingSection 
          title="Top 10 Visitas" 
          icon={<Eye size={24} />} 
          data={metrics?.topVisited} 
          color="bg-indigo-600" 
          unit="vistas"
        />
        <RankingSection 
          title="Top 10 Carrito" 
          icon={<ShoppingCart size={24} />} 
          data={metrics?.topAdded} 
          color="bg-amber-600" 
          unit="adds"
        />
      </div>

      <div className="bg-white rounded-[3.5rem] p-12 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="flex-1 space-y-4">
           <div className="flex items-center gap-3">
              <Stethoscope size={32} className="text-red-600" />
              <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">¿Notas discrepancias?</h2>
           </div>
           <p className="text-gray-500 text-lg font-medium leading-relaxed">
             Si un producto tiene muchas visitas pero pocos agregados al carrito, podría ser un problema de precio o confianza en la ficha. Si tiene muchos carritos pero pocas ventas, el problema es el checkout.
           </p>
        </div>
        <button className="bg-red-600 text-white px-10 py-5 rounded-[2rem] font-black uppercase text-sm tracking-widest hover:bg-red-700 transition-all shadow-2xl shadow-red-100 flex items-center gap-3 whitespace-nowrap">
           Solicitar Auditoría de Ficha <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
};

const RefreshCw = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

const X = ({ size, className }: { size?: number, className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size || 24} 
    height={size || 24} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default ProductIAView;
