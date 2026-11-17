import {
  type LoginRequest,
  type LoginResponse,
  type RegisterRequest,
  type UserAccount,
  type UserRole,
} from '../models/auth.model';
import { apiClient } from './api';
import type { UpdateProfileRequest } from '../models/profile.model';

/** Conta como o backend devolve (com createdAt, updatedAt…); só o que o front usa vira UserAccount */
interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  institution?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  role: UserRole;
}

const toUserAccount = (user: UserResponse): UserAccount => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone ?? null,
  institution: user.institution ?? null,
  cpf: user.cpf ?? null,
  cnpj: user.cnpj ?? null,
  role: user.role,
});

export function login(request: LoginRequest): Promise<LoginResponse> {
  return apiClient<LoginResponse>('auth/login', { method: 'POST', body: JSON.stringify(request) });
}

/** Cria a conta. Não faz login: o token vem de `login` */
export async function register(request: RegisterRequest): Promise<UserAccount> {
  return toUserAccount(await apiClient<UserResponse>('users', { method: 'POST', body: JSON.stringify(request) }));
}

/**
 * Dados completos da conta. O login devolve só nome, e-mail e papel; CPF, CNPJ,
 * instituição e telefone vêm daqui (o backend só deixa ler a própria conta).
 */
export async function fetchAccount(userId: number, token: string): Promise<UserAccount> {
  return toUserAccount(await apiClient<UserResponse>(`users/${userId}`, { token }));
}

export async function fetchMyProfile(token: string, signal?: AbortSignal): Promise<UserAccount> {
  return toUserAccount(await apiClient<UserResponse>('users/me', { token, signal, cache: 'no-store' }));
}

export async function updateMyProfile(request: UpdateProfileRequest, token: string): Promise<UserAccount> {
  return toUserAccount(await apiClient<UserResponse>('users/me', { method: 'PATCH', token, body: JSON.stringify(request) }));
}

/**
 * Sessão guardada no navegador entre as visitas: só o token e o id da conta. Os
 * dados pessoais (CPF, telefone…) não ficam salvos; são lidos da API a cada visita.
 */
export interface StoredSession {
  accessToken: string;
  userId: number;
}

const SESSION_KEY = 'semispe:sessao';

export function loadSession(): StoredSession | null {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null');
    if (
      parsed &&
      typeof parsed === 'object' &&
      'accessToken' in parsed &&
      'userId' in parsed &&
      typeof parsed.accessToken === 'string' &&
      Number.isSafeInteger(parsed.userId)
    ) {
      return { accessToken: parsed.accessToken, userId: parsed.userId as number };
    }
  } catch {
    // Armazenamento bloqueado ou conteúdo corrompido: segue sem sessão
  }
  return null;
}

export function saveSession(session: StoredSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Sem armazenamento (aba anônima restrita), a sessão vale só até recarregar a página
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    // Nada a limpar
  }
}
