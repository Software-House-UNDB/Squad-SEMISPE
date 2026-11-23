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

async function apiResponse(endpoint: string, { token, ...options }: ApiRequestOptions = {}): Promise<Response> {
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

  if (!response.ok) {
    const data = parseBody(await response.text());
    throw new ApiError(
      response.status,
      serverMessage(data) ?? `Erro na requisição ${response.status}: ${response.statusText}`,
      data
    );
  }

  return response;
}

export async function apiClient<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> {
  const response = await apiResponse(endpoint, options);
  return parseBody(await response.text()) as T;
}

/** Download restrito: o JWT vai no cabeçalho, nunca no link do arquivo. */
export async function apiDownload(endpoint: string, options: ApiRequestOptions): Promise<Blob> {
  const response = await apiResponse(endpoint, options);
  return response.blob();
}
