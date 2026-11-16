const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  readonly status: number;
  readonly data?: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export interface ApiRequestOptions extends RequestInit {
  /** Token do login, enviado como `Authorization: Bearer` */
  token?: string;
}

/** Corpo da resposta: JSON quando der, senão o texto; vazio vira undefined */
function parseBody(body: string): unknown {
  if (!body) return undefined;
  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}

/** Mensagem de erro do NestJS (`{ message }`, texto ou lista), quando houver */
function serverMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object' || !('message' in data)) return null;
  const { message } = data;
  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.filter((item) => typeof item === 'string').join(' ') || null;
  return null;
}

export async function apiClient<T>(endpoint: string, { token, ...options }: ApiRequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // O corpo só pode ser lido uma vez: lê como texto e tenta o JSON depois
  const data = parseBody(await response.text());

  if (!response.ok) {
    throw new ApiError(
      response.status,
      serverMessage(data) ?? `Erro na requisição ${response.status}: ${response.statusText}`,
      data
    );
  }

  return data as T;
}
