
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { Module, Lesson, User, UserProgress, UserRole, Client } from '../../types';
// Added missing GraduationCap import
import { Plus, Edit2, BookOpen, User as UserIcon, CheckCircle, Clock, Trash2, X, ListTodo, Zap, GraduationCap } from 'lucide-react';

const TrainingManagement: React.FC = () => {
  const [modules, setModules] = useState<Module[]>(db.getModules());
  const [users, setUsers] = useState<User[]>(db.getUsers().filter(u => u.role === UserRole.CLIENT));
  const [clients, setClients] = useState<Client[]>(db.getClients());
  const [activeTab, setActiveTab] = useState<'content' | 'tracking' | 'tasks'>('content');
  
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const [moduleForm, setModuleForm] = useState<Partial<Module>>({ title: '', description: '', order: 1 });
  const [lessonForm, setLessonForm] = useState<Partial<Lesson>>({ title: '', moduleId: '', content: '', videoUrl: '', taskDescription: '' });

  const getProgressForUser = (userId: string) => {
    const progress = db.getProgress(userId);
    const totalLessons = db.getLessons().length;
    const completed = progress.filter(p => p.isCompleted).length;
    const tasks = progress.filter(p => p.taskCompleted).length;
    return { completed, tasks, total: totalLessons, percent: Math.round((completed / totalLessons) * 100) || 0 };
  };

  const getTaskStatsForClient = (clientId: string) => {
    const sessions = db.getSessions(clientId);
    const allTasks = sessions.flatMap(s => s.tasks);
    const completed = allTasks.filter(t => t.isCompleted).length;
    const total = allTasks.length;
    return { completed, total, percent: Math.round((completed / total) * 100) || 0 };
  };

  const handleSaveModule = () => {
    if (!moduleForm.title) return;
    const toSave: Module = {
      id: editingModule?.id || Math.random().toString(36).substr(2, 9),
      title: moduleForm.title!,
      description: moduleForm.description || '',
      order: Number(moduleForm.order) || 1
    };
    db.saveModule(toSave);
    setModules(db.getModules());
    setIsModuleModalOpen(false);
  };

  const handleSaveLesson = () => {
    if (!lessonForm.title || !lessonForm.moduleId) return;
    const toSave: Lesson = {
      id: editingLesson?.id || Math.random().toString(36).substr(2, 9),
      title: lessonForm.title!,
      moduleId: lessonForm.moduleId!,
      content: lessonForm.content || '',
      videoUrl: lessonForm.videoUrl || '',
      taskDescription: lessonForm.taskDescription || ''
    };
    db.saveLesson(toSave);
    setIsLessonModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Seguimiento y Cursos</h1>
          <p className="text-gray-500 font-medium">Gestiona contenido y vigila el progreso de tus clientes.</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl shadow-sm border">
          <button 
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'content' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <BookOpen size={16} /> Contenido
          </button>
          <button 
            onClick={() => setActiveTab('tracking')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'tracking' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <GraduationCap size={16} /> Progreso Cursos
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'tasks' ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'text-gray-500 hover:text-gray-900'}`}
          >
            <ListTodo size={16} /> Progreso Tareas
          </button>
        </div>
      </div>

      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
             <h2 className="text-xl font-bold">Módulos Existentes</h2>
             <button onClick={() => { setEditingModule(null); setModuleForm({title: '', description: '', order: modules.length + 1}); setIsModuleModalOpen(true); }} className="bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-red-100">
               <Plus size={18} /> Nuevo Módulo
             </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map(mod => (
              <div key={mod.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                   <div className="bg-red-50 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Módulo {mod.order}</div>
                   <button onClick={() => { setEditingModule(mod); setModuleForm(mod); setIsModuleModalOpen(true); }} className="text-gray-400 hover:text-red-600"><Edit2 size={16} /></button>
                </div>
                <h4 className="font-bold text-lg">{mod.title}</h4>
                <div className="space-y-2">
                  {db.getLessons(mod.id).map(l => (
                    <div key={l.id} className="flex items-center justify-between text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                       <span className="truncate">{l.title}</span>
                       <button onClick={() => { setEditingLesson(l); setLessonForm(l); setIsLessonModalOpen(true); }} className="text-red-400 hover:text-red-600"><Edit2 size={12} /></button>
                    </div>
                  ))}
                  <button onClick={() => { setEditingLesson(null); setLessonForm({title: '', moduleId: mod.id, content: ''}); setIsLessonModalOpen(true); }} className="w-full py-2 border border-dashed rounded-lg text-xs font-bold text-red-400 hover:bg-red-50 transition-colors flex items-center justify-center gap-1">
                    <Plus size={14} /> Nueva Lección
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tracking' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-b">
               <tr>
                 <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estudiante</th>
                 <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Progreso Clases</th>
                 <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tareas Hechas</th>
                 <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Estatus</th>
               </tr>
             </thead>
             <tbody className="divide-y">
               {users.map(u => {
                 const stats = getProgressForUser(u.id);
                 return (
                   <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-red-50 text-red-600 flex items-center justify-center font-bold">{u.name.charAt(0)}</div>
                           <div>
                             <p className="font-bold text-gray-900">{u.name}</p>
                             <p className="text-xs text-gray-500">{u.email}</p>
                           </div>
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${stats.percent}%` }}></div>
                           </div>
                           <span className="font-black text-red-600 text-sm">{stats.percent}%</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{stats.completed} de {stats.total} clases</p>
                     </td>
                     <td className="px-8 py-6 text-center">
                        <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold">
                           <CheckCircle size={14} /> {stats.tasks} Hechas
                        </div>
                     </td>
                     <td className="px-8 py-6">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${stats.percent === 100 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                           {stats.percent === 100 ? 'Completado' : 'En Curso'}
                        </span>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
          </table>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
             <thead className="bg-gray-50 border-b">
               <tr>
                 <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Marca / Cliente</th>
                 <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Progreso de Auditorías</th>
                 <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Tareas Pendientes</th>
                 <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Acción</th>
               </tr>
             </thead>
             <tbody className="divide-y">
               {clients.map(client => {
                 const stats = getTaskStatsForClient(client.id);
                 return (
                   <tr key={client.id} className="hover:bg-gray-50/50 transition-colors">
                     <td className="px-8 py-6 font-bold text-gray-900">{client.name}</td>
                     <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${stats.percent}%` }}></div>
                           </div>
                           <span className="font-black text-red-600 text-sm">{stats.percent}%</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">{stats.completed} de {stats.total} tareas de auditoría</p>
                     </td>
                     <td className="px-8 py-6 text-center">
                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${stats.total - stats.completed > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'}`}>
                           {stats.total - stats.completed} Pendientes
                        </span>
                     </td>
                     <td className="px-8 py-6">
                        <button className="text-red-600 font-bold text-xs hover:underline flex items-center gap-1">
                          Ver Detalles <Zap size={12} />
                        </button>
                     </td>
                   </tr>
                 );
               })}
             </tbody>
          </table>
        </div>
      )}

      {/* Modals para editar contenido */}
      {isModuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-8 space-y-6">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold">Configurar Módulo</h3>
                 <button onClick={() => setIsModuleModalOpen(false)}><X /></button>
              </div>
              <input type="text" className="w-full border rounded-xl p-3" value={moduleForm.title} onChange={e => setModuleForm({...moduleForm, title: e.target.value})} placeholder="Título del Módulo" />
              <textarea className="w-full border rounded-xl p-3" value={moduleForm.description} onChange={e => setModuleForm({...moduleForm, description: e.target.value})} placeholder="Descripción Corta" />
              <input type="number" className="w-full border rounded-xl p-3" value={moduleForm.order} onChange={e => setModuleForm({...moduleForm, order: Number(e.target.value)})} placeholder="Orden" />
              <button onClick={handleSaveModule} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-100 transition-all active:scale-95">Guardar Módulo</button>
           </div>
        </div>
      )}

      {isLessonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
           <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center">
                 <h3 className="text-xl font-bold">Configurar Lección</h3>
                 <button onClick={() => setIsLessonModalOpen(false)}><X /></button>
              </div>
              <input type="text" className="w-full border rounded-xl p-3" value={lessonForm.title} onChange={e => setLessonForm({...lessonForm, title: e.target.value})} placeholder="Título de la Lección" />
              <input type="url" className="w-full border rounded-xl p-3" value={lessonForm.videoUrl} onChange={e => setLessonForm({...lessonForm, videoUrl: e.target.value})} placeholder="YouTube Embed URL" />
              <textarea className="w-full border rounded-xl p-3 min-h-[120px]" value={lessonForm.content} onChange={e => setLessonForm({...lessonForm, content: e.target.value})} placeholder="Contenido de la clase (texto)" />
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-400 uppercase">Instrucción de la Tarea</label>
                <textarea className="w-full border rounded-xl p-3" value={lessonForm.taskDescription} onChange={e => setLessonForm({...lessonForm, taskDescription: e.target.value})} placeholder="¿Qué debe hacer el cliente?" />
              </div>
              <button onClick={handleSaveLesson} className="w-full bg-red-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-red-100 transition-all">Guardar Lección</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default TrainingManagement;
