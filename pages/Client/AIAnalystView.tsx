
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../App';
import { AIReport } from '../../types';
import { 
  Bot, 
  Clock, 
  Sparkles, 
  AlertTriangle,
  ChevronDown,
  MessageCircle,
  Stethoscope
} from 'lucide-react';

const AIAnalystView: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AIReport[]>([]);

  useEffect(() => {
    if (user?.clientId) {
      setReports(db.getAIReports(user.clientId));
      db.markReportsAsRead(user.clientId);
    }
  }, [user]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-5xl mx-auto pb-20">
      <div className="bg-indigo-900 text-white rounded-[3rem] p-10 md:p-16 relative overflow-hidden shadow-2xl">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <Bot size={28} />
            </div>
            <span className="font-black uppercase tracking-[0.3em] text-xs opacity-70">Asistente Inteligente</span>
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight">Diagnóstico AI Weekly</h1>
          <p className="text-xl text-indigo-100 font-medium max-w-2xl leading-relaxed">
            Tu bot médico ha auditado tus cuentas de marketing. Aquí tienes el reporte estratégico y la receta médica para tu ecommerce.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 flex items-center justify-center">
          <Stethoscope size={400} />
        </div>
      </div>

      <div className="space-y-10">
        {reports.length > 0 ? (
          reports.map((report, idx) => (
            <div key={report.id} className={`bg-white rounded-[3rem] border-2 p-8 md:p-12 shadow-sm transition-all ${idx === 0 ? 'border-indigo-500 shadow-indigo-100 shadow-2xl' : 'border-gray-100 opacity-60'}`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 border-b pb-8">
                 <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${idx === 0 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-400'}`}>
                       <Sparkles size={28} />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black text-gray-900">Informe de Salud #{reports.length - idx}</h3>
                       <p className="text-indigo-600 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                          <Clock size={14} /> Emitido el {new Date(report.createdAt).toLocaleString()}
                       </p>
                    </div>
                 </div>
                 {idx === 0 && (
                   <div className="bg-indigo-50 text-indigo-700 px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest animate-pulse border border-indigo-100">
                     Nuevo Diagnóstico
                   </div>
                 )}
              </div>
              
              <div className="prose prose-indigo max-w-none whitespace-pre-wrap text-gray-700 font-medium leading-loose text-lg">
                 {report.content}
              </div>

              <div className="mt-12 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-3 text-gray-400 font-bold text-sm">
                    <MessageCircle size={20} />
                    ¿Dudas con este reporte? Contacta a tu equipo médico.
                 </div>
                 <button className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition-all flex items-center gap-2">
                    Descargar en PDF <ChevronDown size={16} />
                 </button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-[3rem] border border-dashed p-32 text-center space-y-6">
             <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-amber-50">
                <AlertTriangle size={40} />
             </div>
             <h3 className="text-3xl font-black text-gray-900">Diagnóstico en Proceso</h3>
             <p className="text-gray-500 text-lg max-w-sm mx-auto font-medium">
               Tu asistente AI está analizando los datos. El primer reporte médico estará disponible en breve.
             </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAnalystView;
