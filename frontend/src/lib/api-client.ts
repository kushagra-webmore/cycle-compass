import { apiFetch, API_URL } from './api';

/**
 * API client with axios-like interface for easier migration
 */
export const apiClient = {
  get: async <T>(url: string, config?: { skipAuth?: boolean }) => {
    return {
      data: await apiFetch<T>(url, { method: 'GET', auth: !config?.skipAuth }),
    };
  },
  
  post: async <T>(url: string, data?: any) => {
    return {
      data: await apiFetch<T>(url, {
        method: 'POST',
        auth: true,
        body: data ? JSON.stringify(data) : undefined,
      }),
    };
  },
  
  put: async <T>(url: string, data?: any) => {
    return {
      data: await apiFetch<T>(url, {
        method: 'PUT',
        auth: true,
        body: data ? JSON.stringify(data) : undefined,
      }),
    };
  },
  
  delete: async <T>(url: string) => {
    return {
      data: await apiFetch<T>(url, { method: 'DELETE', auth: true }),
    };
  },
};

export { API_URL };
