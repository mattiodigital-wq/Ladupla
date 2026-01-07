
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../App';
import { db } from '../../services/db';
import { Client, ReportSection } from '../../types';
import { SECTIONS } from '../../constants';
import { AlertTriangle, ExternalLink } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [client, setClient] = useState<Client | null>(null);
  const [activeSection, setActiveSection] = useState<ReportSection>('ventas');

  useEffect(() => {
    if (user?.clientId) {
      const c = db.getClients().find(cl => cl.id === user.clientId);
      if (c) setClient(c);
    }
  }, [user]);

  if (!client) return <div className="p-8 text-center text-gray-500">Cargando información del cliente...</div>;

  const currentUrl = client.reportUrls[activeSection];
  const availableSections = SECTIONS.filter(s => !!client.reportUrls[s.id]);

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Dashboard de Marketing</span>
          <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
        </div>
        <div className="flex bg-gray-100 p-1 rounded-xl overflow-x-auto no-scrollbar">
          {availableSections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all whitespace-nowrap
                  ${activeSection === section.id 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'}
                `}
              >
                <Icon size={16} />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 min-h-[700px] bg-white rounded-3xl border shadow-sm overflow-hidden relative group">
        {currentUrl ? (
          <>
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <a 
                href={currentUrl} 
                target="_blank" 
                rel="noreferrer"
                className="bg-white/80 backdrop-blur border px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-2 shadow-sm hover:bg-white"
              >
                Abrir en nueva pestaña <ExternalLink size={14} />
              </a>
            </div>
            <iframe
              src={currentUrl}
              className="w-full h-full border-none"
              allowFullScreen
              title={`Reporte de ${activeSection}`}
            />
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Reporte no configurado</h3>
            <p className="text-gray-500 max-w-md">
              Aún no se ha cargado una URL para la sección <span className="font-bold text-indigo-600">{activeSection}</span>. 
              Por favor, contacta con tu administrador.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
