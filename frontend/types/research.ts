export interface ResearchStatus {
  node: string;
  message: string;
}

export interface ResearchComplete {
  report: string;
  score?: number;
  duration_seconds?: number;
}

export interface ResearchError {
  message: string;
}

export interface ResearchToken {
  text: string;
}

export interface ResearchPlan {
  plan: string;
}

export interface ResearchSources {
  webCount: number;
  ragCount: number;
  plan: string;
}

export interface ResearchEvent {
  type: 'status' | 'complete' | 'error' | 'connected' | 'token' | 'report' | 'plan' | 'sources';
  data: ResearchStatus | ResearchComplete | ResearchError | ResearchToken | ResearchPlan | ResearchSources | string | { sessionId: string; timestamp: string };
}

export interface Document {
  document_id: string; // Corrected field name
  user_id: string;
  filename: string;
  mimetype: string;
  chunk_count: number;
  qdrant_collection_name: string;
  uploaded_at: string; // Corrected field name
}

export interface ResearchHistoryItem {
  session_id: string;
  query: string;
  created_at: string;
  quality_score: number | null;
}
