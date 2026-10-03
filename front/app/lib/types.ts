export type UserRole = 'admin' | 'creator' | 'tester';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarBg: string;
  createdAt: string;
  status: 'active' | 'blocked';
  bio?: string;
}

export type ColorTheme = 'yellow' | 'slate' | 'lavender' | 'sage' | 'lilac' | 'pink' | 'cyan';

export type ShapeType = 'donut' | 'v-shape' | 'cloud' | 'crescent' | 'wave' | 'diamond' | 'sun';

export interface Idea {
  id: string;
  title: string;
  subtitle: string;
  authorId: string;
  authorName: string;
  authorEmail: string;
  category: string;
  summary: string;
  description: string;
  targetAudience: string;
  keyBenefits: string[];
  likes: number;
  dislikes: number;
  userVote?: 'like' | 'dislike' | null;
  testersCount: number;
  testersList: string[]; // user emails
  colorTheme: ColorTheme;
  geometricShape: ShapeType;
  visualMockupUrl?: string;
  status: 'active' | 'draft' | 'testing' | 'archived';
  createdAt: string;
  commentsCount: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  text: string;
  timestamp: string;
}

export interface ChatContact {
  id: string;
  name: string;
  role: string;
  avatarBg: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline: boolean;
}

export type ScreenId = 
  | 'auth'
  | 'discover'
  | 'propose'
  | 'browse'
  | 'chat'
  | 'admin'
  | 'dashboard'
  | 'knowledge';

export type KnowledgeType = 'challenge' | 'innovation' | 'education';

export interface KnowledgeResource {
  id: string;
  title: string;
  subtitle: string;
  type: KnowledgeType;
  categoryLabel: string;
  theme: ColorTheme;
  shape: ShapeType;
  summary: string;
  content: string;
  keyMetric?: string;
  metricLabel?: string;
  videoUrl?: string;
  videoDuration?: string;
  tags: string[];
  source: string;
  date: string;
  readTime: string;
  statusBadge?: string;
}

// Deterministic category to color theme & shape mapping
export function getCategoryThemeAndShape(category: string): {
  theme: ColorTheme;
  shape: ShapeType;
} {
  const cat = (category || '').toLowerCase();
  if (cat.includes('ogród') || cat.includes('dom')) {
    return { theme: 'sage', shape: 'v-shape' }; // Nature/garden green
  }
  if (cat.includes('zdrowie') || cat.includes('lek') || cat.includes('bezpieczeństwo')) {
    return { theme: 'lavender', shape: 'cloud' }; // Peaceful misty periwinkle
  }
  if (cat.includes('społecz') || cat.includes('rozwój') || cat.includes('mądrość')) {
    return { theme: 'yellow', shape: 'donut' }; // Warm pale sun yellow
  }
  if (cat.includes('podróż') || cat.includes('kamper')) {
    return { theme: 'cyan', shape: 'wave' }; // Sea glass cyan
  }
  if (cat.includes('rzemiosł') || cat.includes('mebl') || cat.includes('pasj')) {
    return { theme: 'lilac', shape: 'crescent' }; // Heather lilac
  }
  if (cat.includes('prac') || cat.includes('biznes') || cat.includes('finanse') || cat.includes('księg')) {
    return { theme: 'pink', shape: 'diamond' }; // Soft rose
  }
  return { theme: 'slate', shape: 'v-shape' }; // Neutral stone slate
}
