
import { Client, User, UserRole, AuditSession, AuditTask, Module, Lesson, UserProgress, AIReport, CostingData } from '../types';

const STORAGE_KEYS = {
  USERS: 'mp_users_v2',
  CLIENTS: 'mp_clients_v2',
  SESSIONS: 'mp_sessions_v2',
  MODULES: 'mp_modules_v2',
  LESSONS: 'mp_lessons_v2',
  PROGRESS: 'mp_progress_v2',
  AI_REPORTS: 'mp_ai_reports_v2'
};

export const db = {
  init: () => {
    // Inicialización de Usuarios
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([
        { id: 'u1', email: 'admin@laclinicadelecommerce.com', password: 'admin', name: 'Admin Clínica', role: UserRole.ADMIN, createdAt: new Date().toISOString() },
        { id: 'u2', email: 'cliente@demo.com', password: 'demo', name: 'Cliente Ejemplo', role: UserRole.CLIENT, clientId: 'c1', createdAt: new Date().toISOString() }
      ]));
    }

    // Inicialización de Cliente por Defecto (CRÍTICO: Evita el bloqueo en "Cargando historial")
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS) || JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]').length === 0) {
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify([
        {
          id: 'c1',
          name: 'Marca Demo 1',
          reportUrls: {
            ventas: 'https://lookerstudio.google.com/embed/reporting/316f7347-1941-4c12-9c31-97b53941451a/page/LpD',
            meta_ads: '',
            tiktok_ads: '',
            google_ads: '',
            google_analytics: '',
            contenido: '',
            comunidad: '',
            crce: '',
            segmentaciones: '',
            creativos: ''
          },
          createdAt: new Date().toISOString()
        }
      ]));
    }
    
    const keys = [
      STORAGE_KEYS.SESSIONS, 
      STORAGE_KEYS.MODULES, 
      STORAGE_KEYS.LESSONS, 
      STORAGE_KEYS.PROGRESS, 
      STORAGE_KEYS.AI_REPORTS
    ];
    
    keys.forEach(key => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
  },

  exportAllData: () => {
    const data: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([key, value]) => {
      data[key] = JSON.parse(localStorage.getItem(value) || '[]');
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_clinica_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  },

  importAllData: (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([key, value]) => {
        const storageKey = (STORAGE_KEYS as any)[key];
        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify(value));
        }
      });
      window.location.reload();
    } catch (e) {
      alert("Error al importar el archivo de backup.");
    }
  },

  getUsers: (): User[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]'),
  getClients: (): Client[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.CLIENTS) || '[]'),
  getSessions: (clientId?: string): AuditSession[] => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    return clientId ? all.filter((s: AuditSession) => s.clientId === clientId) : all;
  },
  getModules: (): Module[] => JSON.parse(localStorage.getItem(STORAGE_KEYS.MODULES) || '[]').sort((a: any, b: any) => a.order - b.order),
  getLessons: (moduleId?: string): Lesson[] => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.LESSONS) || '[]');
    return moduleId ? all.filter((l: Lesson) => l.moduleId === moduleId) : all;
  },
  getProgress: (userId?: string): UserProgress[] => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.PROGRESS) || '[]');
    return userId ? all.filter((p: UserProgress) => p.userId === userId) : all;
  },
  getAIReports: (clientId: string): AIReport[] => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_REPORTS) || '[]');
    return all.filter((r: AIReport) => r.clientId === clientId).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  saveAIReport: (report: AIReport) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_REPORTS) || '[]');
    all.push(report);
    localStorage.setItem(STORAGE_KEYS.AI_REPORTS, JSON.stringify(all));
  },

  markReportsAsRead: (clientId: string) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_REPORTS) || '[]');
    const updated = all.map((r: AIReport) => r.clientId === clientId ? { ...r, isReadByClient: true } : r);
    localStorage.setItem(STORAGE_KEYS.AI_REPORTS, JSON.stringify(updated));
  },

  saveClient: (client: Client) => {
    const items = db.getClients();
    const idx = items.findIndex(c => c.id === client.id);
    if (idx > -1) items[idx] = client; else items.push(client);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(items));
  },

  saveCostingData: (clientId: string, data: CostingData) => {
    const clients = db.getClients();
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx > -1) {
      clients[idx].costingData = data;
      localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(clients));
    }
  },

  saveUser: (user: User) => {
    const items = db.getUsers();
    const idx = items.findIndex(u => u.id === user.id);
    if (idx > -1) items[idx] = user; else items.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(items));
  },

  saveModule: (module: Module) => {
    const items = db.getModules();
    const idx = items.findIndex(m => m.id === module.id);
    if (idx > -1) items[idx] = module; else items.push(module);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(items));
  },

  saveLesson: (lesson: Lesson) => {
    const items = db.getLessons();
    const idx = items.findIndex(l => l.id === lesson.id);
    if (idx > -1) items[idx] = lesson; else items.push(lesson);
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(items));
  },

  saveSession: (session: AuditSession) => {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const idx = items.findIndex((s: any) => s.id === session.id);
    if (idx > -1) items[idx] = session; else items.push(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(items));
  },

  updateProgress: (progress: UserProgress) => {
    const items = db.getProgress();
    const idx = items.findIndex(p => p.userId === progress.userId && p.lessonId === progress.lessonId);
    if (idx > -1) items[idx] = progress; else items.push(progress);
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(items));
  },

  toggleTask: (sessionId: string, taskId: string) => {
    const sessions = db.getSessions();
    const sIdx = sessions.findIndex(s => s.id === sessionId);
    if (sIdx > -1) {
      const tIdx = sessions[sIdx].tasks.findIndex(t => t.id === taskId);
      if (tIdx > -1) {
        sessions[sIdx].tasks[tIdx].isCompleted = !sessions[sIdx].tasks[tIdx].isCompleted;
        localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
      }
    }
  },

  deleteUser: (id: string) => {
    const items = db.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(items));
  },
  deleteClient: (id: string) => {
    const items = db.getClients().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(items));
  },
  deleteSession: (id: string) => {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const filtered = items.filter((s: any) => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(filtered));
  }
};
