export interface ResearchStatus {
  node: string;
  message: string;
}

export interface ResearchComplete {
  report: string;
  score?: number;
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

export interface ResearchEvent {
  type: 'status' | 'complete' | 'error' | 'connected' | 'token' | 'plan';
  data: ResearchStatus | ResearchComplete | ResearchError | ResearchToken | ResearchPlan | { sessionId: string; timestamp: string };
}

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  mimetype: string;
  chunk_count: number;
  qdrant_collection_name: string;
  created_at: string;
}

export interface ResearchHistoryItem {
  session_id: string;
  query: string;
  created_at: string;
  quality_score: number | null;
}
