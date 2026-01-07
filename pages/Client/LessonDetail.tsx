
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../services/db';
import { useAuth } from '../../App';
import { Lesson, UserProgress } from '../../types';
import { 
  ArrowLeft, 
  PlayCircle, 
  FileText, 
  Download, 
  CheckCircle2,
  Circle,
  Clock,
  ChevronRight
} from 'lucide-react';

const LessonDetail: React.FC = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    const l = db.getLessons().find(l => l.id === id);
    if (l) {
      setLesson(l);
      const p = db.getProgress(user?.id).find(p => p.lessonId === l.id);
      if (p) {
        setProgress(p);
      } else {
        const newP = { userId: user!.id, lessonId: l.id, isCompleted: true, taskCompleted: false, completedAt: new Date().toISOString() };
        db.updateProgress(newP);
        setProgress(newP);
      }
    }
  }, [id, user]);

  if (!lesson) return null;

  const handleToggleTask = () => {
    const newProgress = { ...progress!, taskCompleted: !progress?.taskCompleted };
    db.updateProgress(newProgress);
    setProgress(newProgress);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-500">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/training')} className="flex items-center gap-2 text-indigo-600 font-bold hover:-translate-x-1 transition-transform">
          <ArrowLeft size={18} /> Volver al Portal
        </button>
        <span className="bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2">
          <Clock size={14} /> Marcado como visto hace 2 min
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contenido Principal */}
        <div className="lg:col-span-2 space-y-6">
          {lesson.videoUrl && (
            <div className="aspect-video bg-black rounded-[2.5rem] overflow-hidden shadow-2xl ring-4 ring-white border border-gray-100">
              <iframe 
                src={lesson.videoUrl} 
                className="w-full h-full" 
                title={lesson.title} 
                allowFullScreen
              />
            </div>
          )}

          <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 shadow-sm space-y-6">
            <h1 className="text-4xl font-black text-gray-900">{lesson.title}</h1>
            <div className="prose prose-indigo max-w-none text-gray-600 font-medium leading-relaxed">
              {lesson.content}
            </div>
          </div>
        </div>

        {/* Sidebar de Acciones */}
        <div className="space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center gap-3">
              <div className="bg-orange-50 text-orange-600 p-2 rounded-xl">
                <FileText size={20} />
              </div>
              <h3 className="font-bold text-gray-900">Tarea del módulo</h3>
            </div>
            
            <p className="text-sm text-gray-500 leading-relaxed font-medium">
              {lesson.taskDescription || "No se requiere tarea obligatoria para esta lección."}
            </p>

            <button 
              onClick={handleToggleTask}
              className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold transition-all ${
                progress?.taskCompleted 
                  ? 'bg-green-500 text-white shadow-lg shadow-green-100' 
                  : 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
              }`}
            >
              {progress?.taskCompleted ? <CheckCircle2 size={20} /> : <Circle size={20} />}
              {progress?.taskCompleted ? '¡Tarea Enviada!' : 'Marcar Tarea como Lista'}
            </button>
          </div>

          {lesson.templateUrl && (
            <div className="bg-indigo-900 text-white rounded-[2.5rem] p-8 shadow-xl">
              <h3 className="font-bold mb-4 flex items-center gap-2 uppercase tracking-widest text-xs opacity-70">Recursos</h3>
              <a 
                href={lesson.templateUrl} 
                className="group flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-all"
              >
                <div className="flex items-center gap-3">
                  <Download size={20} className="text-indigo-300" />
                  <span className="font-bold text-sm">Plantilla_Estrategica.pdf</span>
                </div>
                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;
