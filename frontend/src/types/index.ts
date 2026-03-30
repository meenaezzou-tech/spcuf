// SPCUF Type Definitions

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface CaseParty {
  name: string;
  relationship: string;
  dob?: string;
  school?: string;
  grade?: string;
}

export interface Allegation {
  type: string;
  finding: string;
  details?: string;
}

export interface ServicePlanItem {
  id: string;
  description: string;
  deadline?: string;
  completed: boolean;
  completion_date?: string;
}

export interface PlacementHistory {
  date: string;
  placement_type: string;
  location: string;
}

export interface VisitationSchedule {
  frequency: string;
  location: string;
  supervisor_name?: string;
}

export interface CourtInfo {
  cause_number?: string;
  court_name?: string;
  judge_name?: string;
  next_hearing_date?: string;
  next_hearing_type?: string;
}

export interface Case {
  id: string;
  case_id_display: string;
  user_id: string;
  dfps_region?: string;
  dfps_unit?: string;
  investigator_name?: string;
  supervisor_name?: string;
  date_opened?: string;
  investigation_type?: string;
  current_stage: string;
  parties: CaseParty[];
  allegations: Allegation[];
  service_plan_items: ServicePlanItem[];
  placement_history: PlacementHistory[];
  visitation_schedule?: VisitationSchedule;
  court_info?: CourtInfo;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TimelineEvent {
  id: string;
  case_id: string;
  event_type: string;
  event_date: string;
  description: string;
  legal_significance?: string;
  created_at: string;
}

export interface Document {
  id: string;
  case_id: string;
  user_id: string;
  document_type: string;
  file_name: string;
  category: string;
  tags: string[];
  uploaded_at: string;
  file_size: number;
}

export interface Contact {
  id: string;
  case_id: string;
  contact_type: string;
  name: string;
  title?: string;
  phone?: string;
  email?: string;
  organization?: string;
  supervisor_name?: string;
  notes?: string;
  created_at: string;
}

export interface Deadline {
  id: string;
  case_id: string;
  deadline_type: string;
  deadline_date: string;
  description: string;
  completed: boolean;
  created_at: string;
}

export interface Resource {
  id: string;
  category: string;
  subcategory: string;
  title: string;
  description: string;
  content?: string;
  links: string[];
  phone_numbers: string[];
}

export interface LegalTopic {
  id: string;
  topic: string;
  category: string;
  title: string;
  summary: string;
  statute_citation?: string;
  policy_citation?: string;
  plain_language_explanation: string;
  what_this_means: string;
  what_if_violated: string;
  last_verified_date: string;
}

export interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface AIChatResponse {
  response: string;
  citations: string[];
  conversation_id: string;
}
