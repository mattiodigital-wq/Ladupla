
import { Client, User, UserRole, AuditSession, AuditTask, Module, Lesson, UserProgress, AIReport, CostingData } from '../types';

const SUPABASE_URL = 'https://iuuqsuvlhgcnnuosxcal.supabase.co';
// Clave ANON proporcionada por el usuario para uso seguro en el cliente (browser)
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1dXFzdXZsaGdjbm51b3N4Y2FsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgwODIzMjYsImV4cCI6MjA4MzY1ODMyNn0.vMT5J6AS6RkeSrhxMj88KMflKWcg6xDZIz26uKOFrOM'; 

const STORAGE_KEYS = {
  USERS: 'mp_users_v2',
  CLIENTS: 'mp_clients_v2',
  SESSIONS: 'mp_sessions_v2',
  MODULES: 'mp_modules_v2',
  LESSONS: 'mp_lessons_v2',
  PROGRESS: 'mp_progress_v2',
  AI_REPORTS: 'mp_ai_reports_v2',
};

const cloudFetch = async (table: string, method: string = 'GET', body?: any, query: string = '') => {
  const headers: Record<string, string> = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
  };

  // Configuración de UPSERT para que Supabase actualice si el ID ya existe
  if (method === 'POST') {
    headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
  }

  try {
    const options: RequestInit = { method, headers };
    
    if (body) {
      const payload = Array.isArray(body) ? body : [body];
      options.body = JSON.stringify(payload);
    }
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Error Supabase [${table}]:`, errorText);
      return null;
    }
    
    if (method === 'DELETE') return { success: true };

    const data = await response.json();
    console.log(`☁️ Cloud Sync [${table}]: Éxito`);
    return data;
  } catch (e) {
    console.error(`❌ Error de Red [${table}]:`, e);
    return null;
  }
};

export const db = {
  init: async () => {
    console.log("🚀 Iniciando Motor de Datos...");
    // Sincronización inicial para bajar datos de la nube al dispositivo
    const success = await db.syncFromCloud();
    
    // Crear admin por defecto si la base de datos está vacía
    const users = db.getUsers();
    if (users.length === 0) {
      const admin = { 
        id: 'u1', 
        email: 'admin@laclinicadelecommerce.com', 
        password: 'admin', 
        name: 'Admin Clínica', 
        role: UserRole.ADMIN, 
        createdAt: new Date().toISOString() 
      };
      await db.saveUser(admin);
    }
    return success;
  },

  syncFromCloud: async () => {
    const tableMapping = [
      { cloud: 'users', local: STORAGE_KEYS.USERS },
      { cloud: 'clients', local: STORAGE_KEYS.CLIENTS },
      { cloud: 'sessions', local: STORAGE_KEYS.SESSIONS },
      { cloud: 'modules', local: STORAGE_KEYS.MODULES },
      { cloud: 'lessons', local: STORAGE_KEYS.LESSONS },
      { cloud: 'progress', local: STORAGE_KEYS.PROGRESS },
      { cloud: 'ai_reports', local: STORAGE_KEYS.AI_REPORTS }
    ];

    try {
      await Promise.all(tableMapping.map(async (item) => {
        const data = await cloudFetch(item.cloud, 'GET');
        if (data) localStorage.setItem(item.local, JSON.stringify(data));
      }));
      return true;
    } catch (e) {
      console.error("❌ Falló la sincronización inicial con la nube.");
      return false;
    }
  },

  // GETTERS (Lectura rápida desde LocalStorage)
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

  // SETTERS (Guardado dual: Local para velocidad + Cloud para persistencia)
  saveClient: async (client: Client) => {
    const items = db.getClients();
    const idx = items.findIndex(c => c.id === client.id);
    if (idx > -1) items[idx] = client; else items.push(client);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(items));
    return await cloudFetch('clients', 'POST', client); 
  },

  saveUser: async (user: User) => {
    const items = db.getUsers();
    const idx = items.findIndex(u => u.id === user.id);
    if (idx > -1) items[idx] = user; else items.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(items));
    return await cloudFetch('users', 'POST', user);
  },

  saveSession: async (session: AuditSession) => {
    const items = db.getSessions();
    const idx = items.findIndex(s => s.id === session.id);
    if (idx > -1) items[idx] = session; else items.push(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(items));
    return await cloudFetch('sessions', 'POST', session);
  },

  saveAIReport: async (report: AIReport) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_REPORTS) || '[]');
    all.push(report);
    localStorage.setItem(STORAGE_KEYS.AI_REPORTS, JSON.stringify(all));
    return await cloudFetch('ai_reports', 'POST', report);
  },

  updateProgress: async (progress: UserProgress) => {
    const items = db.getProgress();
    const idx = items.findIndex(p => p.userId === progress.userId && p.lessonId === progress.lessonId);
    if (idx > -1) items[idx] = progress; else items.push(progress);
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(items));
    return await cloudFetch('progress', 'POST', progress);
  },

  deleteClient: async (id: string) => {
    const items = db.getClients().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(items));
    return await cloudFetch('clients', 'DELETE', null, `?id=eq.${id}`);
  },

  deleteSession: async (id: string) => {
    const items = db.getSessions().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(items));
    return await cloudFetch('sessions', 'DELETE', null, `?id=eq.${id}`);
  },

  deleteUser: async (id: string) => {
    const items = db.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(items));
    return await cloudFetch('users', 'DELETE', null, `?id=eq.${id}`);
  },

  toggleTask: async (sessionId: string, taskId: string) => {
    const items = db.getSessions();
    const session = items.find(s => s.id === sessionId);
    if (session) {
      const task = session.tasks.find(t => t.id === taskId);
      if (task) {
        task.isCompleted = !task.isCompleted;
        await db.saveSession(session);
      }
    }
  },

  saveModule: async (module: Module) => {
    const items = db.getModules();
    const idx = items.findIndex(m => m.id === module.id);
    if (idx > -1) items[idx] = module; else items.push(module);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(items));
    return await cloudFetch('modules', 'POST', module);
  },

  saveLesson: async (lesson: Lesson) => {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.LESSONS) || '[]');
    const idx = items.findIndex((l: any) => l.id === lesson.id);
    if (idx > -1) items[idx] = lesson; else items.push(lesson);
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(items));
    return await cloudFetch('lessons', 'POST', lesson);
  },

  markReportsAsRead: async (clientId: string) => {
    const all = db.getAIReports(clientId);
    const unread = all.filter(r => !r.isReadByClient);
    if (unread.length > 0) {
      const updated = unread.map(r => ({ ...r, isReadByClient: true }));
      await cloudFetch('ai_reports', 'POST', updated);
      await db.syncFromCloud();
    }
  },

  saveCostingData: async (clientId: string, data: CostingData) => {
    const clients = db.getClients();
    const client = clients.find(c => c.id === clientId);
    if (client) {
      client.costingData = data;
      await db.saveClient(client);
    }
  }
};
