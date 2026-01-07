
import { Client, User, UserRole, AuditSession, AuditTask, Module, Lesson, UserProgress, AIReport, CostingData } from '../types';

const STORAGE_KEYS = {
  USERS: 'mp_users_v2',
  CLIENTS: 'mp_clients_v2',
  SESSIONS: 'mp_sessions_v2',
  MODULES: 'mp_modules_v2',
  LESSONS: 'mp_lessons_v2',
  PROGRESS: 'mp_progress_v2',
  AI_REPORTS: 'mp_ai_reports_v2',
  CLOUD_CONFIG: 'mp_cloud_config_v2'
};

export interface CloudConfig {
  url: string;
  key: string;
  isEnabled: boolean;
}

// Helper para llamadas a Supabase (REST API)
const cloudFetch = async (table: string, method: string = 'GET', body?: any) => {
  const config = db.getCloudConfig();
  if (!config.isEnabled) return null;

  const headers = {
    'apikey': config.key,
    'Authorization': `Bearer ${config.key}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  const url = `${config.url}/rest/v1/${table}`;
  
  try {
    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);
    
    // Si es GET y hay body, Supabase lo trata como filtros (aquí simplificado)
    const response = await fetch(url + (method === 'GET' ? '?select=*' : ''), options);
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
  } catch (e) {
    console.error(`Cloud Error (${table}):`, e);
    return null;
  }
};

export const db = {
  init: () => {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify([
        { id: 'u1', email: 'admin@laclinicadelecommerce.com', password: 'admin', name: 'Admin Clínica', role: UserRole.ADMIN, createdAt: new Date().toISOString() },
        { id: 'u2', email: 'cliente@demo.com', password: 'demo', name: 'Cliente Ejemplo', role: UserRole.CLIENT, clientId: 'c1', createdAt: new Date().toISOString() }
      ]));
    }
    Object.values(STORAGE_KEYS).forEach(key => {
      if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify([]));
    });
  },

  // Gestión de Configuración de Nube
  getCloudConfig: (): CloudConfig => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLOUD_CONFIG);
    return saved ? JSON.parse(saved) : { url: '', key: '', isEnabled: false };
  },

  saveCloudConfig: (config: CloudConfig) => {
    localStorage.setItem(STORAGE_KEYS.CLOUD_CONFIG, JSON.stringify(config));
  },

  // Sincronización Masiva
  exportFullBackup: () => {
    const backup: Record<string, any> = {};
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      backup[key] = JSON.parse(localStorage.getItem(key) || '[]');
    });
    return JSON.stringify(backup);
  },

  importFullBackup: (jsonString: string) => {
    try {
      const backup = JSON.parse(jsonString);
      Object.entries(backup).forEach(([key, data]) => {
        localStorage.setItem(key, JSON.stringify(data));
      });
      return true;
    } catch (e) {
      return false;
    }
  },

  // Lectura (Prioriza Local por velocidad, pero el Admin debería poder "Refrescar")
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

  // Escritura Híbrida
  saveClient: async (client: Client) => {
    const items = db.getClients();
    const idx = items.findIndex(c => c.id === client.id);
    if (idx > -1) items[idx] = client; else items.push(client);
    localStorage.setItem(STORAGE_KEYS.CLIENTS, JSON.stringify(items));
    
    // Cloud Sync
    const config = db.getCloudConfig();
    if (config.isEnabled) {
      // Intenta un UPSERT en Supabase (requiere tabla 'clients' configurada)
      await cloudFetch('clients', 'POST', client); 
    }
  },

  saveUser: async (user: User) => {
    const items = db.getUsers();
    const idx = items.findIndex(u => u.id === user.id);
    if (idx > -1) items[idx] = user; else items.push(user);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(items));
    
    const config = db.getCloudConfig();
    if (config.isEnabled) await cloudFetch('users', 'POST', user);
  },

  saveSession: async (session: AuditSession) => {
    const items = JSON.parse(localStorage.getItem(STORAGE_KEYS.SESSIONS) || '[]');
    const idx = items.findIndex((s: any) => s.id === session.id);
    if (idx > -1) items[idx] = session; else items.push(session);
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(items));
    
    const config = db.getCloudConfig();
    if (config.isEnabled) await cloudFetch('sessions', 'POST', session);
  },

  saveModule: async (module: Module) => {
    const items = db.getModules();
    const idx = items.findIndex(m => m.id === module.id);
    if (idx > -1) items[idx] = module; else items.push(module);
    localStorage.setItem(STORAGE_KEYS.MODULES, JSON.stringify(items));
  },

  saveLesson: async (lesson: Lesson) => {
    const items = db.getLessons();
    const idx = items.findIndex(l => l.id === lesson.id);
    if (idx > -1) items[idx] = lesson; else items.push(lesson);
    localStorage.setItem(STORAGE_KEYS.LESSONS, JSON.stringify(items));
  },

  saveAIReport: async (report: AIReport) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_REPORTS) || '[]');
    all.push(report);
    localStorage.setItem(STORAGE_KEYS.AI_REPORTS, JSON.stringify(all));
  },

  // Fix: Added markReportsAsRead to update reports read status for a client
  markReportsAsRead: (clientId: string) => {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_REPORTS) || '[]');
    const updated = all.map((r: AIReport) => 
      r.clientId === clientId ? { ...r, isReadByClient: true } : r
    );
    localStorage.setItem(STORAGE_KEYS.AI_REPORTS, JSON.stringify(updated));
  },

  // Fix: Added saveCostingData to persist product costing data for a client
  saveCostingData: async (clientId: string, costingData: CostingData) => {
    const clients = db.getClients();
    const idx = clients.findIndex(c => c.id === clientId);
    if (idx > -1) {
      clients[idx].costingData = costingData;
      await db.saveClient(clients[idx]);
    }
  },

  updateProgress: async (progress: UserProgress) => {
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
