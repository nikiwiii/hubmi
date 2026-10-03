export type UserRole = "admin" | "creator" | "tester";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarBg: string;
  createdAt: string;
  status: "active" | "blocked";
  bio?: string;
}

export type ColorTheme =
  | "yellow"
  | "slate"
  | "lavender"
  | "sage"
  | "lilac"
  | "pink"
  | "cyan";

export type ShapeType =
  | "donut"
  | "v-shape"
  | "cloud"
  | "crescent"
  | "wave"
  | "diamond"
  | "sun";

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
  userVote?: "like" | "dislike" | null;
  testersCount: number;
  testersList: string[];
  colorTheme: ColorTheme;
  geometricShape: ShapeType;
  status: "active" | "draft" | "testing" | "archived";
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
}

// Mock data removed — data is loaded from the backend API
export const CURRENT_USER: User | null = null;

export const INITIAL_IDEAS: Idea[] = [];

export const INITIAL_CONTACTS: ChatContact[] = [];

export const CATEGORIES = [
  "Wszystkie",
  "Dom i Ogród",
  "Społeczność",
  "Zdrowie",
  "Podróże",
  "Rzemiosło",
  "Praca",
];
