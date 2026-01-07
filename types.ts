
export enum UserRole {
  ADMIN = 'ADMIN',
  CLIENT = 'CLIENT'
}

export type ReportSection = 
  | 'ventas' 
  | 'meta_ads' 
  | 'tiktok_ads' 
  | 'google_ads' 
  | 'contenido'
  | 'comunidad'
  | 'crce' 
  | 'segmentaciones' 
  | 'creativos';

export type TaskCategory = 'tienda' | 'meta_ads' | 'contenido' | 'google_ads' | 'email_marketing' | 'tiktok_ads' | 'conversiones';

// Added missing types for inventory analytics
export interface ProductMetric {
  name: string;
  value: number;
}

export interface LastMetrics {
  topSold: ProductMetric[];
  topVisited: ProductMetric[];
  topAdded: ProductMetric[];
}

export interface AIConfig {
  prompt: string;
  metaToken?: string;
  metaAccountId?: string;
  // Added missing properties for tracking and analytics
  lastMetrics?: LastMetrics;
  analyticsId?: string;
  analyticsToken?: string;
}

export interface AIReport {
  id: string;
  clientId: string;
  content: string;
  isReadByClient: boolean;
  createdAt: string;
}

export interface Installment {
  id: string;
  number: number;
  amount: number;
  isPaid: boolean;
  paidAt?: string;
}

export interface BillingData {
  totalMentorshipValue: number;
  installments: Installment[];
}

export interface FixedCost {
  id: string;
  category: string;
  description: string;
  amount: number;
}

export interface ProductCosting {
  id: string;
  code: string;
  name: string;
  price: number;
  productCost: number;
  packaging: number;
  shippingAvg: number;
  isFreeShipping: boolean;
  commissionPercent: number;
  otherVariableCosts: number;
  adCostPerSale: number;
}

// Added missing ProductClassification type
export type ProductClassification = 'ESTRELLA' | 'MEH' | 'ZOMBIE' | 'TÓXICO';

export interface CostingData {
  fixedCosts: FixedCost[];
  products: ProductCosting[];
}

export interface Client {
  id: string;
  name: string;
  logo?: string;
  reportUrls: Record<ReportSection, string>;
  aiConfig?: AIConfig;
  billing?: BillingData;
  costingData?: CostingData;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  clientId?: string; 
  createdAt: string;
}

export type TaskUrgency = 'urgent' | 'attention' | 'weekly';

export interface AuditTask {
  id: string;
  title: string;
  description: string;
  importantNotes?: string;
  urgency: TaskUrgency;
  category: TaskCategory;
  isCompleted: boolean;
  createdAt: string;
}

export interface AuditSession {
  id: string;
  clientId: string;
  title: string;
  type: 'meet' | 'virtual';
  date: string;
  summary: string;
  tasks: AuditTask[];
  campaignActions: string;
  recordingUrl?: string;
  createdAt: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  content: string;
  videoUrl: string;
  taskDescription: string;
  templateUrl?: string;
}

// Added missing UserProgress interface
export interface UserProgress {
  userId: string;
  lessonId: string;
  isCompleted: boolean;
  taskCompleted: boolean;
  completedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
