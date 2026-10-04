export type UserRole = "admin" | "creator" | "tester" | "expert";

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
  testersList: string[]; // user emails
  colorTheme: ColorTheme;
  geometricShape: ShapeType;
  visualMockupUrl?: string;
  status: "active" | "draft" | "testing" | "archived" | "pending" | "rejected";
  createdAt: string;
  commentsCount: number;
  lookingForPartner?: boolean;
  partnerTypes?: string[];
  assignedExpertId?: string;
  assignedExpertName?: string;
  assignedExpertSpecialization?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type:
    | "new_idea"
    | "chat_message"
    | "grant_call"
    | "partnership"
    | "expert_assigned"
    | "idea_approved"
    | "tester_application"
    | "tester_approved"
    | "system";
  read: boolean;
  created_at: string;
  link?: string | null;
  email_sent: boolean;
  email_recipient?: string | null;
  email_subject?: string | null;
  email_preview_html?: string | null;
}

export interface SimulatedEmail {
  notification_id: string;
  sender: string;
  recipient: string;
  subject: string;
  sent_at: string;
  body_text: string;
  body_html: string;
}

export interface RopsExpert {
  id: string;
  name: string;
  title: string;
  department: string;
  specialization: string;
  avatar_bg?: string;
  available_for_mentoring?: boolean;
  email?: string;
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
  | "auth"
  | "discover"
  | "propose"
  | "chat"
  | "admin"
  | "dashboard"
  | "knowledge"
  | "matching"
  | "middleman"
  | "testing";

export type KnowledgeType = "challenge" | "innovation" | "education";

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
  const cat = (category || "").toLowerCase();
  if (cat.includes("ogród") || cat.includes("dom")) {
    return { theme: "sage", shape: "v-shape" }; // Nature/garden green
  }
  if (
    cat.includes("zdrowie") ||
    cat.includes("lek") ||
    cat.includes("bezpieczeństwo") ||
    cat.includes("szpital")
  ) {
    return { theme: "lavender", shape: "cloud" }; // Peaceful misty periwinkle
  }
  if (
    cat.includes("społecz") ||
    cat.includes("rozwój") ||
    cat.includes("mądrość") ||
    cat.includes("pomoc")
  ) {
    return { theme: "yellow", shape: "donut" }; // Warm pale sun yellow
  }
  if (
    cat.includes("podróż") ||
    cat.includes("kamper") ||
    cat.includes("demograf") ||
    cat.includes("ludność")
  ) {
    return { theme: "cyan", shape: "wave" }; // Sea glass cyan
  }
  if (
    cat.includes("rzemiosł") ||
    cat.includes("mebl") ||
    cat.includes("pasj") ||
    cat.includes("piecz") ||
    cat.includes("rodzin")
  ) {
    return { theme: "lilac", shape: "crescent" }; // Heather lilac
  }
  if (
    cat.includes("prac") ||
    cat.includes("biznes") ||
    cat.includes("finanse") ||
    cat.includes("księg") ||
    cat.includes("bezrobot")
  ) {
    return { theme: "pink", shape: "diamond" }; // Soft rose
  }
  return { theme: "slate", shape: "v-shape" }; // Neutral stone slate
}

export interface InnovationMatchItem {
  id: string;
  title: string;
  problem_statement: string;
  solution: string;
  funding_info?: string | null;
  target_group?: string | null;
  url?: string | null;
  file_source?: string | null;
  similarity: number;
  similarity_percentage: string;
  is_top_match: boolean;
  is_close_match: boolean;
}

export interface CommunityIdeaMatch {
  id: string;
  title: string;
  description: string;
  category?: string | null;
  author_name?: string | null;
  url: string;
  similarity_percentage?: string | null;
}

export interface SimilarProblemMatch {
  id: string;
  problem_text: string;
  powiat?: string | null;
  category?: string | null;
  reporter_type?: string | null;
  status: string;
  created_at?: string | null;
}

export interface MatchedExpert {
  name: string;
  title: string;
  department: string;
  specialization: string;
  chat_topic: string;
  chat_url: string;
}

export interface NextActionItem {
  action_id: string;
  title: string;
  description: string;
  button_label: string;
  url: string;
  icon_name: string;
  badge?: string | null;
}

export interface ExplainabilityInfo {
  summary: string;
  matched_aspects: string[];
  source_file: string;
  source_url?: string | null;
}

export interface TraceStep {
  step_number: number;
  name: string;
  status: string;
  duration_ms: number;
  details: Record<string, any>;
}

export interface MatchResponse {
  answer: string;
  guardrail_status: "PASSED" | "BLOCKED_NOT_FOUND" | "BLOCKED_OFF_TOPIC";
  guardrail_message?: string | null;
  top_solution?: InnovationMatchItem | null;
  close_solutions: InnovationMatchItem[];
  explainability?: ExplainabilityInfo | null;
  community_ideas?: CommunityIdeaMatch[];
  similar_problems?: SimilarProblemMatch[];
  matched_expert?: MatchedExpert | null;
  next_actions?: NextActionItem[];
  saved_problem_id?: string | null;
  trace: TraceStep[];
  total_duration_ms: number;
}

export interface BackendConversation {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string | null;
  idea_id?: string | null;
  idea_title?: string | null;
  topic: string;
  status: "open" | "in_progress" | "closed";
  assigned_admin_id?: string | null;
  assigned_admin_name?: string | null;
  unread_by_admin: number;
  unread_by_user: number;
  last_message?: string | null;
  last_message_at: string;
  created_at: string;
}

export interface BackendMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: "user" | "admin" | "expert";
  content: string;
  created_at: string;
}

// ==========================================
// MIDDLEMAN INNOWACJI (/api/middleman)
// ==========================================
export interface InnovationRecord {
  id: string;
  title: string;
  description?: string | null;
  addressed_problems?: string | null;
  target_group?: string | null;
  beneficiaries?: string | null;
  funding_info?: string | null;
  category?: string | null;
  url?: string | null;
}

export type InstitutionType =
  | "gmina_miejska"
  | "gmina_wiejska"
  | "gmina_miejsko_wiejska"
  | "powiat"
  | "cus"
  | "ops"
  | "ngo"
  | "inna";

export type BudgetRange = "below_20k" | "20k_100k" | "100k_500k" | "above_500k";

export interface InstitutionProfile {
  institution_type: InstitutionType;
  institution_name?: string | null;
  powiat: string;
  target_group: string;
  recipients_count?: number | null;
  budget_range: BudgetRange;
  staff_resources: string;
  time_horizon_months: 3 | 6 | 12;
  local_context?: string | null;
}

export interface ServiceCard {
  service_name: string;
  summary: string;
  adaptations: { change: string; reason: string }[];
  scope: string[];
  recipients: string;
  resources: {
    staff: string[];
    premises: string[];
    equipment: string[];
    local_partners: string[];
  };
  timeline: { name: string; duration: string; activities: string[] }[];
  budget: {
    items: { name: string; amount_pln: number; note?: string | null }[];
    total_pln: number;
    disclaimer: string;
  };
  feasibility_note?: string | null;
  funding_sources: { source: string; how_to_use: string }[];
  kpis: { name: string; target: string; measurement: string }[];
  risks: { risk: string; mitigation: string }[];
  next_steps: string[];
}

export interface ServiceCardResponse {
  innovation_id: string;
  innovation_title: string;
  innovation_url?: string | null;
  card: ServiceCard;
}

// ==========================================
// TESTER INNOWACJI: Usability rating, feedback & comments
// ==========================================
export interface IdeaFeedback {
  id: string;
  idea_id: string;
  user_id?: string | null;
  author_name: string;
  author_role: string;
  overall_rating: number;
  usability_rating: number;
  accessibility_rating: number;
  impact_rating: number;
  strengths?: string | null;
  weaknesses?: string | null;
  suggested_improvements?: string | null;
  comment?: string | null;
  created_at: string;
}

export interface IdeaComment {
  id: string;
  idea_id: string;
  user_id?: string | null;
  author_name: string;
  content: string;
  created_at: string;
}

export interface TestingSummary {
  idea_id: string;
  testers_count: number;
  reviews_count: number;
  avg_overall_rating: number;
  avg_usability_rating: number;
  avg_accessibility_rating: number;
  avg_impact_rating: number;
  feedback_list: IdeaFeedback[];
  comments_list: IdeaComment[];
}

export interface FeedbackSubmitPayload {
  overall_rating: number;
  usability_rating: number;
  accessibility_rating: number;
  impact_rating: number;
  author_role?: string;
  strengths?: string;
  weaknesses?: string;
  suggested_improvements?: string;
  comment?: string;
}

export interface TesterApplication {
  id: string;
  idea_id: string;
  idea_title: string;
  user_id?: string | null;
  user_name: string;
  user_email?: string | null;
  status: "pending" | "approved" | "rejected";
  motivation?: string | null;
  created_at: string;
}

// ==========================================
// KNOWLEDGE RAG TYPES (/api/indicators/rag)
// ==========================================
export interface KnowledgeRagDetectedPowiat {
  id: string;
  name: string;
  display_name: string;
  is_city: boolean;
}

export interface KnowledgeRagMatchedReport {
  id: string;
  title: string;
  category: string;
  unit: string;
  description: string;
  latest_year: string;
  latest_value: number;
  first_value: number;
  delta: number;
  region_avg: number;
  rank: number;
  total_powiats: number;
  reason: string;
  time_series: { year: string; value: number }[];
}

export interface KnowledgeRagChartData {
  report_id: string;
  report_title: string;
  unit: string;
  latest_year: string;
  trend_series: { year: string; powiatValue: number; regionAvg: number }[];
  comparison_bars: { powiatId: string; name: string; value: number }[];
}

export interface KnowledgeRagMatchedInnovation {
  id: string;
  title: string;
  description: string;
  addressed_problems?: string;
  funding_info?: string;
  url?: string | null;
  score: number;
}

export interface KnowledgeRagResponse {
  success: boolean;
  guardrail_status?: "PASSED" | "BLOCKED_OFF_TOPIC" | "BLOCKED_GIBBERISH";
  guardrail_message?: string | null;
  suggested_queries?: string[];
  query: string;
  detected_powiat: KnowledgeRagDetectedPowiat;
  detected_topics: string[];
  ai_synthesis: string;
  primary_report: KnowledgeRagMatchedReport | null;
  matched_reports: KnowledgeRagMatchedReport[];
  chart_data: KnowledgeRagChartData;
  matched_innovations: KnowledgeRagMatchedInnovation[];
  matched_expert?: MatchedExpert | null;
}

