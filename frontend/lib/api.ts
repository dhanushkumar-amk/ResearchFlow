import { ResearchEvent, Document, ResearchHistoryItem } from '../types/research';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Initiates a new research task
 */
export async function startResearch(query: string, sessionId: string) {
  const response = await fetch(`${API_URL}/api/research/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, sessionId }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to start research');
  }

  return response.json();
}

/**
 * Establishes an SSE connection to stream research updates
 */
export function getResearchStream(sessionId: string, onEvent: (event: ResearchEvent) => void) {
  const eventSource = new EventSource(`${API_URL}/api/research/${sessionId}/stream`);

  eventSource.onmessage = (event: MessageEvent) => {
    try {
      const data = JSON.parse(event.data);
      onEvent({ type: (event.type as ResearchEvent['type']) || 'message', data });
    } catch (err) {
      console.error('Failed to parse SSE message', err);
    }
  };

  // EventSource doesn't support custom event names natively in onmessage, 
  // but the backend sends 'event: ...' lines.
  // Standard EventSource uses addEventListener for named events.
  
  const eventTypes: ResearchEvent['type'][] = ['status', 'complete', 'error', 'connected', 'token', 'plan'];
  
  eventTypes.forEach(type => {
    eventSource.addEventListener(type as string, (e: Event) => {
      const messageEvent = e as MessageEvent;
      try {
        const data = JSON.parse(messageEvent.data);
        onEvent({ type, data });
      } catch (err) {
        console.error(`Failed to parse ${type} event`, err);
      }
    });
  });

  return eventSource;
}

/**
 * Uploads a document for RAG ingestion
 */
export async function uploadDocument(file: File, sessionId: string): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sessionId', sessionId);

  const response = await fetch(`${API_URL}/api/documents/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  const result = await response.json();
  return result.document;
}

/**
 * Retrieves history of uploaded documents (or research sessions)
 */
export async function getHistory(sessionId: string): Promise<Document[]> {
  const response = await fetch(`${API_URL}/api/documents?sessionId=${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch history');
  }

  return response.json();
}

/**
 * Retrieves history of research sessions
 */
export async function getResearchHistory(sessionId: string): Promise<ResearchHistoryItem[]> {
  const response = await fetch(`${API_URL}/api/research/history?sessionId=${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch research history');
  }

  return response.json();
}

/**
 * Retrieves all research history for a user
 */
export async function getAllResearchHistory(sessionId: string): Promise<ResearchHistoryItem[]> {
  const response = await fetch(`${API_URL}/api/research/history?sessionId=${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch all research history');
  }

  return response.json();
}

/**
 * Deletes an uploaded document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete document');
  }
}

/**
 * Retrieves the saved report for a specific session
 */
export async function getSessionDetails(sessionId: string) {
  const response = await fetch(`${API_URL}/api/research/${sessionId}`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch session details');
  }

  return response.json();
}

/**
 * Deletes a research session
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/research/${sessionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete session');
  }
}
