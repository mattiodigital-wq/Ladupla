
import React, { useState, useEffect } from 'react';
import { db } from '../../services/db';
import { useAuth } from '../../App';
import { Module, Lesson, UserProgress } from '../../types';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle, ChevronRight, PlayCircle, Clock } from 'lucide-react';

const TrainingPortal: React.FC = () => {
  const { user } = useAuth();
  const [modules, setModules] = useState<Module[]>(db.getModules());
  const [progress, setProgress] = useState<UserProgress[]>(db.getProgress(user?.id));

  useEffect(() => {
    setModules(db.getModules());
    setProgress(db.getProgress(user?.id));
  }, [user]);

  const getModuleStats = (moduleId: string) => {
    const lessons = db.getLessons(moduleId);
    const completedInModule = progress.filter(p => lessons.some(l => l.id === p.lessonId) && p.isCompleted).length;
    const total = lessons.length;
    return { completedInModule, total, percent: Math.round((completedInModule / total) * 100) || 0 };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-gradient-to-r from-red-900 to-red-700 rounded-[2.5rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 max-w-2xl">
          <span className="bg-white/20 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full backdrop-blur-md mb-6 inline-block">
            Academia de Éxito
          </span>
          <h1 className="text-5xl font-black mb-6 leading-tight">Mejora tus Conocimientos</h1>
          <p className="text-xl text-red-100 font-medium leading-relaxed">
            Bienvenido a tu portal de capacitación estratégica de La Clínica. Aprende a dominar tu negocio con data real.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 flex items-center justify-center">
          <BookOpen size={400} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {modules.map((mod) => {
          const { percent, completedInModule, total } = getModuleStats(mod.id);
          const lessons = db.getLessons(mod.id);

          return (
            <div key={mod.id} className="bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold text-gray-900 group-hover:text-red-600 transition-colors">{mod.title}</h3>
                  <p className="text-gray-500 font-medium">{mod.description}</p>
                </div>
                <div className="bg-red-50 text-red-600 w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl">
                  {percent}%
                </div>
              </div>

              <div className="space-y-3 mb-8">
                {lessons.map((lesson) => {
                  const isDone = progress.some(p => p.lessonId === lesson.id && p.isCompleted);
                  return (
                    <Link
                      key={lesson.id}
                      to={`/training/lesson/${lesson.id}`}
                      className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-red-100 hover:bg-red-50/30 transition-all"
                    >
                      <div className={isDone ? 'text-green-500' : 'text-gray-300'}>
                        {isDone ? <CheckCircle size={20} /> : <PlayCircle size={20} />}
                      </div>
                      <span className={`font-bold text-sm flex-1 ${isDone ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                        {lesson.title}
                      </span>
                      <ChevronRight size={16} className="text-gray-400" />
                    </Link>
                  );
                })}
              </div>

              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-600 transition-all duration-1000" style={{ width: `${percent}%` }}></div>
              </div>
              <p className="mt-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                {completedInModule} de {total} clases completadas
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TrainingPortal;
