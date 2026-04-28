export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'pending' | 'agent' | 'staff' | 'admin';
  parque: 'parque1' | 'parque3' | 'both' | null;
  department: string | null;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  type: string | null;
  category: string | null;
  parque_visibility: string[];
  status: 'vigente' | 'obsoleto' | 'borrador';
  version: string | null;
  changelog_summary: string | null;
  applicable_roles: string[] | null;
  file_url: string | null;
  file_size_kb: number | null;
  legal_excerpt: string | null;
  keywords: string[] | null;
  replaces_document_id: string | null;
  effective_date: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: 'user_signup' | 'doc_download' | 'session_start' | 'course_start' | 'course_complete';
  resource_id: string | null;
  parque: string | null;
  created_at: string;
}
