/**
 * API utility for making requests to the backend
 * Handles environment-based URL configuration
 */

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiRequestOptions extends RequestInit {
  body?: string;
}

/**
 * Makes an API request to the backend
 * @param endpoint - The API endpoint (e.g., '/api/v1/decode')
 * @param options - Fetch options (method, body, headers, etc.)
 * @returns Promise with the JSON response
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Warm up the backend by sending a health check request
 * This helps reduce latency on the first real request
 */
export async function warmupBackend(): Promise<void> {
  try {
    await fetch(`${API_URL}/health`, { 
      method: 'GET',
      cache: 'no-store' 
    });
  } catch (error) {
    console.warn('Backend warmup failed:', error);
  }
}
