
import { 
  TrendingUp, 
  Facebook, 
  Video, 
  Search, 
  PieChart, 
  Target, 
  Palette,
  Share2,
  Users,
  LucideIcon
} from 'lucide-react';
import { ReportSection } from './types';

export interface SectionDefinition {
  id: ReportSection;
  label: string;
  icon: LucideIcon;
}

export const SECTIONS: SectionDefinition[] = [
  { id: 'ventas', label: 'Ventas', icon: TrendingUp },
  { id: 'meta_ads', label: 'Meta Ads', icon: Facebook },
  { id: 'tiktok_ads', label: 'TikTok Ads', icon: Video },
  { id: 'google_ads', label: 'Google Ads', icon: Search },
  { id: 'contenido', label: 'Contenido', icon: Share2 },
  { id: 'comunidad', label: 'Comunidad', icon: Users },
  { id: 'crce', label: 'CRCE', icon: PieChart },
  { id: 'segmentaciones', label: 'Segmentaciones', icon: Target },
  { id: 'creativos', label: 'Creativos', icon: Palette },
];

export const MOCK_REPORT_URL = "https://lookerstudio.google.com/embed/reporting/316f7347-1941-4c12-9c31-97b53941451a/page/LpD";
