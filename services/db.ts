
import { Client, User, UserRole, AuditSession, AuditTask, Module, Lesson, UserProgress, AIReport, CostingData } from '../types';

const SUPABASE_URL = 'https://iuuqsuvlhgcnnuosxcal.supabase.co';
const SUPABASE_KEY = 'sb_secret_Jp-zO7TVbCGYLts9Y2SjYw_ly6vjq9D';

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
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': method === 'POST' ? 'return=representation,resolution=merge-duplicates' : 'return=representation'
  };

  try {
    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}${query}`, options);
    if (!response.ok) {
      console.warn(`⚠️ Error en tabla ${table}:`, await response.text());
      return null;
    }
    return await response.json();
  } catch (e) {
    console.error(`❌ Error de conexión Cloud [${table}]:`, e);
    return null;
  }
};

export const db = {
  init: async () => {
    // Sincronización mandatoria al iniciar
    console.log("🔄 Iniciando Sincronización Maestra...");
    return await db.syncFromCloud();
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
      const results = await Promise.all(tableMapping.map(async (item) => {
        const data = await cloudFetch(item.cloud, 'GET');
        if (data) {
          localStorage.setItem(item.local, JSON.stringify(data));
          return true;
        }
        return false;
      }));

      // Inyectar admin por defecto si la tabla de usuarios está vacía
      const users = db.getUsers();
      if (users.length === 0) {
        const defaultAdmin = { id: 'u1', email: 'admin@laclinicadelecommerce.com', password: 'admin', name: 'Admin Clínica', role: UserRole.ADMIN, createdAt: new Date().toISOString() };
        await db.saveUser(defaultAdmin);
      }

      console.log("✅ Sincronización completada.");
      return results.every(r => r);
    } catch (e) {
      console.error("❌ Fallo crítico en sincronización:", e);
      return false;
    }
  },

  // GETTERS (Lectura de Caché Local Rápida)
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

  // SETTERS (Escritura Espejo: Local + Cloud)
  saveClient: async (client: Client) => {
    const items = db.getClients();
    const idx = items.findIndex(c => c.id === client.id);
    if (idx > -1) items[idx] = client; else items.push(client);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(items));
    await cloudFetch('clients', 'POST', client); 
  },

  saveUser: async (user: User) => {
    const items = db.getUsers();
    const idx = items.findIndex(u => u.id === user.id);
    if (idx > -1) items[idx] = user; else items.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(items));
    await cloudFetch('users', 'POST', user);
  },

  saveSession: async (session: AuditSession) => {
    const items = db.getSessions();
    const idx = items.findIndex(s => s.id === session.id);
    if (idx > -1) items[idx] = session; else items.push(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(items));
    await cloudFetch('sessions', 'POST', session);
  },

  saveAIReport: async (report: AIReport) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_REPORTS) || '[]');
    all.push(report);
    localStorage.setItem(STORAGE_KEYS.AI_REPORTS, JSON.stringify(all));
    await cloudFetch('ai_reports', 'POST', report);
  },

  updateProgress: async (progress: UserProgress) => {
    const items = db.getProgress();
    const idx = items.findIndex(p => p.userId === progress.userId && p.lessonId === progress.lessonId);
    if (idx > -1) items[idx] = progress; else items.push(progress);
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(items));
    await cloudFetch('progress', 'POST', progress);
  },

  deleteClient: async (id: string) => {
    const items = db.getClients().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(items));
    await cloudFetch('clients', 'DELETE', null, `?id=eq.${id}`);
  },

  deleteSession: async (id: string) => {
    const items = db.getSessions().filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(items));
    await cloudFetch('sessions', 'DELETE', null, `?id=eq.${id}`);
  },

  deleteUser: async (id: string) => {
    const items = db.getUsers().filter(u => u.id !== id);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(items));
    await cloudFetch('users', 'DELETE', null, `?id=eq.${id}`);
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
    await cloudFetch('modules', 'POST', module);
  },

  saveLesson: async (lesson: Lesson) => {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.LESSONS) || '[]');
    const idx = items.findIndex((l: any) => l.id === lesson.id);
    if (idx > -1) items[idx] = lesson; else items.push(lesson);
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(items));
    await cloudFetch('lessons', 'POST', lesson);
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
