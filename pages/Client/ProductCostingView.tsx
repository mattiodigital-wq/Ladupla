
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { db } from '../../services/db';
import { Client, FixedCost, ProductCosting, ProductClassification } from '../../types';
import { 
  Calculator, 
  Trash2, 
  Plus, 
  DollarSign, 
  Target, 
  TrendingUp, 
  AlertCircle,
  CheckCircle2,
  Skull,
  Star,
  Meh,
  Activity,
  Truck,
  CreditCard,
  Percent,
  Info,
  ArrowRight,
  Package,
  Stethoscope
} from 'lucide-react';

const ProductCostingView: React.FC = () => {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [products, setProducts] = useState<ProductCosting[]>([]);

  useEffect(() => {
    if (user?.clientId) {
      const c = db.getClients().find(cl => cl.id === user.clientId);
      if (c) {
        setClient(c);
        setFixedCosts(c.costingData?.fixedCosts || []);
        setProducts(c.costingData?.products || []);
      }
    }
  }, [user]);

  const saveToDb = (newFixed: FixedCost[], newProds: ProductCosting[]) => {
    if (user?.clientId) {
      db.saveCostingData(user.clientId, { fixedCosts: newFixed, products: newProds });
    }
  };

  const addFixedCost = () => {
    const newFixed = [...fixedCosts, { id: Math.random().toString(36).substr(2, 9), category: '', description: '', amount: 0 }];
    setFixedCosts(newFixed);
    saveToDb(newFixed, products);
  };

  const addProduct = () => {
    const newProds = [...products, { 
      id: Math.random().toString(36).substr(2, 9), 
      code: '',
      name: '', 
      price: 0, 
      productCost: 0, 
      packaging: 0, 
      shippingAvg: 7500,
      isFreeShipping: false,
      commissionPercent: 15,
      otherVariableCosts: 0, 
      adCostPerSale: 0 // Se calculará como 20% por defecto si no se edita
    }];
    setProducts(newProds);
    saveToDb(fixedCosts, newProds);
  };

  const updateFixed = (id: string, field: keyof FixedCost, value: any) => {
    const newFixed = fixedCosts.map(f => f.id === id ? { ...f, [field]: value } : f);
    setFixedCosts(newFixed);
    saveToDb(newFixed, products);
  };

  const updateProduct = (id: string, field: keyof ProductCosting, value: any) => {
    const newProds = products.map(p => p.id === id ? { ...p, [field]: value } : p);
    setProducts(newProds);
    saveToDb(fixedCosts, newProds);
  };

  const deleteFixed = (id: string) => {
    const newFixed = fixedCosts.filter(f => f.id !== id);
    setFixedCosts(newFixed);
    saveToDb(newFixed, products);
  };

  const deleteProduct = (id: string) => {
    const newProds = products.filter(p => p.id !== id);
    setProducts(newProds);
    saveToDb(fixedCosts, newProds);
  };

  const calculateProductStats = (p: ProductCosting) => {
    const price = Number(p.price) || 0;
    const prodCost = Number(p.productCost) || 0;
    const packaging = Number(p.packaging) || 0;
    // Si ofrece envío gratis, el costo de envío es un costo variable para el vendedor
    const shipping = p.isFreeShipping ? (Number(p.shippingAvg) || 0) : 0;
    const commissionAmt = price * ((Number(p.commissionPercent) || 0) / 100);
    const otherVar = Number(p.otherVariableCosts) || 0;
    
    // Costo de publicidad: 20% del valor del producto si es 0, sino el valor manual
    const ads = p.adCostPerSale > 0 ? Number(p.adCostPerSale) : (price * 0.20);

    const totalVarCost = prodCost + packaging + shipping + commissionAmt + otherVar;
    const marginPreAd = price - totalVarCost;
    const marginPreAdPercent = price > 0 ? (marginPreAd / price) * 100 : 0;
    
    const marginPostAd = marginPreAd - ads;
    const marginPostAdPercent = price > 0 ? (marginPostAd / price) * 100 : 0;

    let classification: ProductClassification = 'MEH';
    if (marginPostAdPercent >= 45) classification = 'ESTRELLA';
    else if (marginPostAdPercent < 10) classification = 'TÓXICO';
    else if (marginPostAdPercent < 25) classification = 'ZOMBIE';

    return { totalVarCost, marginPreAd, marginPreAdPercent, marginPostAd, marginPostAdPercent, classification, ads };
  };

  const totalFixedCosts = fixedCosts.reduce((acc, f) => acc + (Number(f.amount) || 0), 0);
  
  const productStats = products.map(p => ({ ...p, stats: calculateProductStats(p) }));
  
  const avgMarginPostAd = productStats.length > 0 
    ? productStats.reduce((acc, p) => acc + p.stats.marginPostAd, 0) / productStats.length 
    : 0;
  
  const breakEvenUnits = avgMarginPostAd > 0 ? Math.ceil(totalFixedCosts / avgMarginPostAd) : 0;
  const breakEvenRevenue = productStats.length > 0 
    ? breakEvenUnits * (productStats.reduce((acc, p) => acc + Number(p.price), 0) / productStats.length)
    : 0;

  const ClassificationBadge = ({ type }: { type: ProductClassification }) => {
    const styles = {
      ESTRELLA: { bg: 'bg-green-100 text-green-700', icon: <Star size={12} />, label: 'Estrella' },
      MEH: { bg: 'bg-blue-100 text-blue-700', icon: <Meh size={12} />, label: 'Meh' },
      ZOMBIE: { bg: 'bg-amber-100 text-amber-700', icon: <Activity size={12} />, label: 'Zombie' },
      TÓXICO: { bg: 'bg-red-100 text-red-700', icon: <Skull size={12} />, label: 'Tóxico' }
    };
    const s = styles[type];
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-tighter ${s.bg}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* HEADER CLINICO */}
      <div className="bg-red-600 rounded-[3rem] p-10 md:p-14 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl">
              <Calculator size={24} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-[10px] opacity-70">Auditoría Financiera de Catálogo</span>
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">Laboratorio de Costos</h1>
          <p className="text-xl text-red-100 font-medium leading-relaxed">
            Diagnostica la rentabilidad real de cada producto. Consideramos comisiones, packaging, envío gratis y una inversión estimada en Ads del 20%.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 flex items-center justify-center pointer-events-none">
          <DollarSign size={450} />
        </div>
      </div>

      {/* DASHBOARD DE PUNTO DE EQUILIBRIO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm border-gray-100 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-4">
               <DollarSign size={24} />
            </div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Costos Fijos Mensuales</p>
            <h3 className="text-3xl font-black text-gray-900">{totalFixedCosts.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</h3>
         </div>
         <div className="bg-indigo-600 p-8 rounded-[2.5rem] border shadow-sm border-indigo-700 text-white flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-white/10 text-white rounded-2xl flex items-center justify-center mb-4">
               <Target size={24} />
            </div>
            <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-1">Ventas para Equilibrio</p>
            <h3 className="text-3xl font-black">{breakEvenUnits} vtas</h3>
            <p className="text-[10px] mt-2 opacity-60">Margen neto promedio: {avgMarginPostAd.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</p>
         </div>
         <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm border-green-100 bg-green-50/20 flex flex-col items-center text-center">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-2xl flex items-center justify-center mb-4">
               <TrendingUp size={24} />
            </div>
            <p className="text-[10px] font-black text-green-400 uppercase tracking-widest mb-1">Facturación Necesaria</p>
            <h3 className="text-3xl font-black text-green-600">{breakEvenRevenue.toLocaleString('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })}</h3>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* TABLA DE COSTOS FIJOS (1/3) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h3 className="font-black uppercase text-xs tracking-widest text-gray-500">Gastos Fijos Mensuales</h3>
              <button onClick={addFixedCost} className="text-red-600 hover:scale-110 transition-transform"><Plus size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              {fixedCosts.map((f) => (
                <div key={f.id} className="flex gap-2 group">
                  <input 
                    className="flex-1 bg-gray-50 border-none rounded-xl p-3 text-xs font-bold" 
                    placeholder="Ej: Alquiler, Sueldos..." 
                    value={f.category}
                    onChange={(e) => updateFixed(f.id, 'category', e.target.value)}
                  />
                  <input 
                    type="number" 
                    className="w-24 bg-gray-50 border-none rounded-xl p-3 text-xs font-black text-right" 
                    placeholder="$0" 
                    value={f.amount}
                    onChange={(e) => updateFixed(f.id, 'amount', e.target.value)}
                  />
                  <button onClick={() => deleteFixed(f.id)} className="text-gray-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-2">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {fixedCosts.length === 0 && <p className="text-center py-10 text-xs text-gray-300 italic">No hay gastos cargados</p>}
              <div className="pt-4 border-t flex justify-between px-2">
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Gastos</span>
                 <span className="text-sm font-black text-gray-900">${totalFixedCosts.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="bg-gray-900 rounded-[2.5rem] p-8 text-white space-y-4 shadow-xl">
             <div className="flex items-center gap-2 mb-2">
                <AlertCircle size={18} className="text-amber-400" />
                <h4 className="font-black text-xs uppercase tracking-widest">Guía de Comisiones MP</h4>
             </div>
             <div className="space-y-2 text-[10px] font-medium text-gray-400">
               <div className="flex justify-between border-b border-white/10 pb-1"><span>Acreditación en el momento:</span> <span className="text-white">~15.00%</span></div>
               <div className="flex justify-between border-b border-white/10 pb-1"><span>Acreditación 14 días:</span> <span className="text-white">~10.00%</span></div>
               <div className="flex justify-between border-b border-white/10 pb-1"><span>Acreditación 30 días:</span> <span className="text-white">~8.50%</span></div>
               <p className="mt-2 text-[9px] italic">* Los valores pueden variar según impuestos y promociones de cuotas sin interés.</p>
             </div>
          </div>
        </div>

        {/* ESCANDALLO DE PRODUCTOS (2/3) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
             <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
                <h3 className="font-black uppercase text-xs tracking-widest text-gray-500">Escandallo de Productos</h3>
                <button onClick={addProduct} className="bg-red-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-100 transition-all hover:scale-105 active:scale-95">
                   <Plus size={14} /> Añadir Producto
                </button>
             </div>
             
             <div className="overflow-x-auto no-scrollbar">
                <table className="w-full text-left min-w-[1100px]">
                   <thead className="bg-gray-50/80 border-b">
                      <tr className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                         <th className="px-6 py-4">Código / Nombre</th>
                         <th className="px-4 py-4 text-center">Venta / Costo Prod</th>
                         <th className="px-4 py-4 text-center">Pkg / Envío</th>
                         <th className="px-4 py-4 text-center">Pasarela / Otros</th>
                         <th className="px-4 py-4 text-center">Ads (Est. 20%)</th>
                         <th className="px-4 py-4 text-center">Margen Neto</th>
                         <th className="px-4 py-4 text-center">Status</th>
                         <th className="px-4 py-4"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                      {productStats.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/30 group">
                           <td className="px-6 py-6 max-w-[200px]">
                              <div className="flex flex-col gap-1">
                                 <input 
                                    className="bg-transparent border-none font-black text-gray-400 p-0 text-[10px] focus:ring-0 uppercase tracking-widest" 
                                    value={p.code} 
                                    onChange={(e) => updateProduct(p.id, 'code', e.target.value)}
                                    placeholder="SKU-XXXX"
                                 />
                                 <input 
                                    className="bg-transparent border-none font-black text-gray-900 p-0 text-sm focus:ring-0 w-full" 
                                    value={p.name} 
                                    onChange={(e) => updateProduct(p.id, 'name', e.target.value)}
                                    placeholder="Nombre Producto"
                                 />
                              </div>
                           </td>
                           <td className="px-4 py-6 text-center">
                              <div className="flex flex-col items-center gap-2">
                                 <div className="flex items-center bg-gray-100 rounded-lg px-2" title="Precio de Venta">
                                    <span className="text-gray-400 text-[10px] mr-1">$</span>
                                    <input type="number" className="bg-transparent border-none font-black text-gray-900 p-1 text-xs focus:ring-0 w-16 text-center" value={p.price} onChange={(e) => updateProduct(p.id, 'price', e.target.value)} />
                                 </div>
                                 <div className="flex items-center bg-red-50 rounded-lg px-2 border border-red-100" title="Costo del Producto">
                                    <span className="text-red-400 text-[10px] mr-1">$</span>
                                    <input type="number" className="bg-transparent border-none font-black text-red-600 p-1 text-[10px] focus:ring-0 w-16 text-center" value={p.productCost} onChange={(e) => updateProduct(p.id, 'productCost', e.target.value)} />
                                 </div>
                              </div>
                           </td>
                           <td className="px-4 py-6 text-center">
                              <div className="flex flex-col items-center gap-2">
                                 <div className="flex items-center bg-gray-50 rounded-lg px-2 border border-gray-200" title="Costo de Packaging">
                                    <Package size={10} className="text-gray-400 mr-1" />
                                    <input type="number" className="bg-transparent border-none font-black text-gray-600 p-1 text-[10px] focus:ring-0 w-12 text-center" value={p.packaging} onChange={(e) => updateProduct(p.id, 'packaging', e.target.value)} />
                                 </div>
                                 <div className="flex flex-col items-center gap-1">
                                    <button 
                                      onClick={() => updateProduct(p.id, 'isFreeShipping', !p.isFreeShipping)}
                                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase transition-all ${p.isFreeShipping ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                                    >
                                      <Truck size={10} /> {p.isFreeShipping ? 'Envío Gratis' : 'Paga Cliente'}
                                    </button>
                                    {p.isFreeShipping && (
                                       <div className="flex items-center bg-amber-50 rounded-lg px-2 border border-amber-100" title="Costo Envío para Vendedor">
                                          <span className="text-amber-400 text-[10px] mr-1">$</span>
                                          <input type="number" className="bg-transparent border-none font-black text-amber-600 p-1 text-[10px] focus:ring-0 w-12 text-center" value={p.shippingAvg} onChange={(e) => updateProduct(p.id, 'shippingAvg', e.target.value)} />
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </td>
                           <td className="px-4 py-6 text-center">
                              <div className="flex flex-col items-center gap-2">
                                 <div className="flex items-center bg-indigo-50 rounded-lg px-2 border border-indigo-100" title="Tasa Pasarela %">
                                    <CreditCard size={10} className="text-indigo-400 mr-1" />
                                    <input type="number" className="bg-transparent border-none font-black text-indigo-600 p-1 text-[10px] focus:ring-0 w-10 text-center" value={p.commissionPercent} onChange={(e) => updateProduct(p.id, 'commissionPercent', e.target.value)} />
                                    <span className="text-[10px] text-indigo-400">%</span>
                                 </div>
                                 <div className="flex items-center bg-gray-100 rounded-lg px-2 border border-gray-200" title="Otros Costos Variables">
                                    <Plus size={10} className="text-gray-400 mr-1" />
                                    <input type="number" className="bg-transparent border-none font-black text-gray-600 p-1 text-[10px] focus:ring-0 w-12 text-center" value={p.otherVariableCosts} onChange={(e) => updateProduct(p.id, 'otherVariableCosts', e.target.value)} />
                                 </div>
                              </div>
                           </td>
                           <td className="px-4 py-6 text-center">
                              <div className="flex items-center justify-center bg-indigo-50 border border-indigo-100 rounded-lg px-2" title="Costo Ads por Venta">
                                 <Target size={10} className="text-indigo-400 mr-1" />
                                 <input 
                                  type="number" 
                                  className="bg-transparent border-none font-black text-indigo-600 p-1 text-xs focus:ring-0 w-16 text-center" 
                                  value={p.adCostPerSale === 0 ? '' : p.adCostPerSale} 
                                  onChange={(e) => updateProduct(p.id, 'adCostPerSale', e.target.value)}
                                  placeholder={`${(p.price * 0.2).toFixed(0)}`}
                                 />
                              </div>
                              <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">Estimado IA: ${(p.price * 0.2).toFixed(0)}</p>
                           </td>
                           <td className="px-4 py-6 text-center">
                              <div className="flex flex-col items-center">
                                 <span className={`text-sm font-black ${p.stats.marginPostAd > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    ${p.stats.marginPostAd.toFixed(0)}
                                 </span>
                                 <span className={`text-[10px] font-bold ${p.stats.marginPostAdPercent > 20 ? 'text-green-500' : 'text-gray-400'}`}>
                                    {p.stats.marginPostAdPercent.toFixed(1)}%
                                 </span>
                              </div>
                           </td>
                           <td className="px-4 py-6 text-center">
                              <ClassificationBadge type={p.stats.classification} />
                           </td>
                           <td className="px-4 py-6 text-right">
                              <button onClick={() => deleteProduct(p.id)} className="text-gray-200 hover:text-red-500 transition-colors">
                                 <Trash2 size={16} />
                              </button>
                           </td>
                        </tr>
                      ))}
                      {products.length === 0 && (
                        <tr>
                          <td colSpan={8} className="py-20 text-center text-gray-300 italic text-xs font-medium">Empieza a escandallar tus productos para ver tu salud financiera</td>
                        </tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>

          {/* GUIA CLINICA */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 p-10 flex flex-col md:flex-row gap-10 shadow-sm">
             <div className="flex-1 space-y-4">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                      <Stethoscope size={20} />
                   </div>
                   <h4 className="font-black text-lg text-gray-900 uppercase tracking-tighter">Leyenda de Diagnóstico</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                      <p className="text-[10px] font-black text-green-700 uppercase mb-1">Estrella (+45%)</p>
                      <p className="text-[10px] text-green-600 leading-tight">Producto altamente rentable. Escala Ads sin miedo.</p>
                   </div>
                   <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-black text-blue-700 uppercase mb-1">Meh (25-45%)</p>
                      <p className="text-[10px] text-blue-600 leading-tight">Saludable pero requiere optimización de costos operativos.</p>
                   </div>
                   <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <p className="text-[10px] font-black text-amber-700 uppercase mb-1">Zombie (10-25%)</p>
                      <p className="text-[10px] text-amber-600 leading-tight">Mucha venta, poca ganancia. Revisa el envío o packaging.</p>
                   </div>
                   <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                      <p className="text-[10px] font-black text-red-700 uppercase mb-1">Tóxico (-10%)</p>
                      <p className="text-[10px] text-red-600 leading-tight">Estás perdiendo dinero. Aumenta precio o deja de venderlo.</p>
                   </div>
                </div>
             </div>
             <div className="md:w-64 bg-gray-50 rounded-3xl p-8 flex flex-col justify-center items-center text-center">
                <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 mb-4">
                   <Percent size={28} />
                </div>
                <h5 className="font-black text-gray-900 mb-2 uppercase text-xs">Punto de Equilibrio</h5>
                <p className="text-[10px] text-gray-400 font-bold leading-relaxed">Consideramos el margen neto final (post-ads) para calcular cuántas unidades necesitas vender para pagar tus costos fijos.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCostingView;
