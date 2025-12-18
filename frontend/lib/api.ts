/**
 * Centralized API client for backend communication
 */

// Get API URL from environment variable, fallback to localhost
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Warm up the backend by pinging the health endpoint
 * This helps reduce cold start delays on first request
 */
export async function warmupBackend(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      // Don't wait too long
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch (error) {
    console.warn('Backend warmup failed (this is okay on first load):', error);
    return false;
  }
}

/**
 * Generic API request helper
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `API request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Check if backend is healthy
 */
export async function checkBackendHealth(): Promise<{
  status: string;
  llm_provider: string;
  rag_enabled: boolean;
  active_sessions: number;
}> {
  return apiRequest('/health');
}

