import { ResearchEvent, Document, ResearchHistoryItem } from '../types/research';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Common headers with Auth support
 */
function getHeaders(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Initiates a new research task
 */
export async function startResearch(query: string, sessionId: string, token: string) {
  const response = await fetch(`${API_URL}/api/research`, {
    method: 'POST',
    headers: getHeaders(token),
    body: JSON.stringify({ query, sessionId }),
  });

  if (!response.ok) {
    const text = await response.text();
    let errorMessage = 'Failed to start research';
    try {
      const error = JSON.parse(text);
      errorMessage = error.error || errorMessage;
    } catch {
      errorMessage = `Server Error (${response.status}): ${text.substring(0, 100)}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Establishes an SSE connection to stream research updates
 * NOTE: EventSource doesn't support custom headers natively in the browser.
 * We pass the token as a query parameter.
 */
export function getResearchStream(sessionId: string, token: string, onEvent: (event: ResearchEvent) => void) {
  const eventSource = new EventSource(`${API_URL}/api/research/${sessionId}/stream?token=${token}`);

  const eventTypes: (ResearchEvent['type'] | 'connected' | 'report')[] = ['status', 'complete', 'error', 'connected', 'token', 'plan', 'sources', 'report'];
  
  eventTypes.forEach(type => {
    eventSource.addEventListener(type as string, (e: Event) => {
      const messageEvent = e as MessageEvent;
      try {
        if (type === 'report' || type === 'token') {
          try {
            const data = JSON.parse(messageEvent.data);
            onEvent({ type: (type as ResearchEvent['type']), data });
          } catch {
            onEvent({ type: (type as ResearchEvent['type']), data: messageEvent.data });
          }
        } else {
          if (!messageEvent.data || messageEvent.data === 'undefined') {
             onEvent({ type: (type as ResearchEvent['type']), data: null });
             return;
          }
          const data = JSON.parse(messageEvent.data);
          onEvent({ type: (type as ResearchEvent['type']), data });
        }
      } catch (err) {
        onEvent({ type: (type as ResearchEvent['type']), data: messageEvent.data });
        console.warn(`Failed to parse ${type} event as JSON, using raw data`, err);
      }
    });

    eventSource.onmessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        onEvent({ type: (event.type as ResearchEvent['type']) || 'message', data });
      } catch (err) {
        console.error('Failed to parse SSE message', err);
      }
    };
  });

  return eventSource;
}

/**
 * Uploads a document for RAG ingestion
 */
export async function uploadDocument(file: File, sessionId: string, token: string): Promise<Document> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('sessionId', sessionId); // used for collection prefix

  const response = await fetch(`${API_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
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
 * Retrieves history of uploaded documents
 */
export async function getHistory(token: string): Promise<Document[]> {
  const response = await fetch(`${API_URL}/api/documents`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch history (${response.status})`);
  }

  return response.json();
}

/**
 * Retrieves all research history for a user
 */
export async function getAllResearchHistory(token: string): Promise<ResearchHistoryItem[]> {
  const response = await fetch(`${API_URL}/api/research/history`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch research history');
  }

  return response.json();
}

/**
 * Deletes an uploaded document
 */
export async function deleteDocument(documentId: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete document');
  }
}

/**
 * Retrieves the saved report for a specific session
 */
export async function getSessionDetails(sessionId: string, token: string) {
  const response = await fetch(`${API_URL}/api/research/${sessionId}`, {
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch session details');
  }

  return response.json();
}

/**
 * Deletes a research session
 */
export async function deleteSession(sessionId: string, token: string): Promise<void> {
  const response = await fetch(`${API_URL}/api/research/${sessionId}`, {
    method: 'DELETE',
    headers: getHeaders(token),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete session');
  }
}
